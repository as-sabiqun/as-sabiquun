-- Durable provider-call uncertainty. HitPay does not currently expose an
-- idempotency key for payment-request or refund creation, so an indeterminate
-- outbound call must block a second call until the provider is reconciled.

begin;

alter table public.payment_transactions
  drop constraint if exists payment_transactions_status_check;
alter table public.payment_transactions
  add constraint payment_transactions_status_check
  check (status in ('pending','reconciliation_required','succeeded','failed','expired','cancelled'));

drop index if exists public.payment_transactions_one_pending_refund_uidx;
create unique index if not exists payment_transactions_one_open_refund_uidx
  on public.payment_transactions(order_id)
  where transaction_type = 'refund' and status in ('pending','reconciliation_required');
create unique index if not exists payment_transactions_one_open_payment_uidx
  on public.payment_transactions(order_id)
  where transaction_type = 'payment' and status in ('pending','reconciliation_required');
create unique index if not exists payment_transactions_payment_request_uidx
  on public.payment_transactions(provider, provider_request_id)
  where transaction_type = 'payment' and provider_request_id not like 'reservation:%';

create or replace function public.prepare_hitpay_payment(p_order_id uuid)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_order public.orders%rowtype;
  v_profile public.profiles%rowtype;
  v_email text;
  v_transaction public.payment_transactions%rowtype;
  v_reservation text;
begin
  if not public.is_customer() then raise exception 'Active customer access is required'; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.customer_id <> auth.uid() then raise exception 'Order not found'; end if;
  select * into v_profile from public.profiles where id = auth.uid();
  select email into v_email from auth.users where id = auth.uid() and email_confirmed_at is not null;
  if v_email is null then raise exception 'A verified email is required before payment'; end if;
  if v_profile.telegram_chat_id is null or v_profile.telegram_linked_at is null then
    raise exception 'Link Telegram before payment';
  end if;
  if v_order.payment_status in ('paid','partially_refunded','refunded') then raise exception 'Order is not payable'; end if;
  if v_order.fulfilment_status <> 'not_ready' then raise exception 'Order fulfilment has already started'; end if;

  update public.orders
  set customer_email = v_email, payment_provider = 'hitpay', payment_status = 'pending'
  where id = p_order_id;

  -- A known HitPay checkout may expire normally. A create-call reservation may
  -- not: once the outbound result is unknown, only reconciliation may release it.
  update public.payment_transactions
  set status = 'expired', provider_event_type = 'payment.request_expired', provider_event_at = now()
  where order_id = p_order_id and transaction_type = 'payment' and status = 'pending'
    and checkout_url is not null and expires_at is not null and expires_at <= now();

  update public.payment_transactions
  set status = 'reconciliation_required', expires_at = null,
      provider_event_type = 'payment.creation_stale', provider_event_at = now(),
      raw_payload = raw_payload || jsonb_build_object('reconciliation_reason','Creation reservation expired without a recorded provider response')
  where order_id = p_order_id and transaction_type = 'payment' and status = 'pending'
    and checkout_url is null and provider_request_id like 'reservation:%'
    and expires_at is not null and expires_at <= now();

  select * into v_transaction
  from public.payment_transactions
  where order_id = p_order_id and transaction_type = 'payment'
    and status in ('pending','reconciliation_required')
    and checkout_url is not null
    and (expires_at is null or expires_at > now())
  order by created_at desc limit 1;
  if found then
    return jsonb_build_object(
      'transaction_id',v_transaction.id,'order_id',v_order.id,'reference',v_order.reference,
      'amount',v_order.total_amount,'currency',v_order.currency,'customer_name',v_order.customer_name,
      'customer_email',v_email,'customer_phone',v_order.customer_phone,
      'should_create',false,'creating',false,
      'reconciliation_required',v_transaction.status = 'reconciliation_required',
      'checkout_url',v_transaction.checkout_url,'expires_at',v_transaction.expires_at
    );
  end if;

  select * into v_transaction
  from public.payment_transactions
  where order_id = p_order_id and transaction_type = 'payment'
    and status in ('pending','reconciliation_required')
  order by created_at desc limit 1;
  if found then
    return jsonb_build_object(
      'transaction_id',v_transaction.id,'order_id',v_order.id,'reference',v_order.reference,
      'amount',v_order.total_amount,'currency',v_order.currency,'customer_name',v_order.customer_name,
      'customer_email',v_email,'customer_phone',v_order.customer_phone,
      'should_create',false,'creating',v_transaction.status = 'pending',
      'reconciliation_required',v_transaction.status = 'reconciliation_required',
      'checkout_url',null,'expires_at',v_transaction.expires_at
    );
  end if;

  v_reservation := 'reservation:' || gen_random_uuid()::text;
  insert into public.payment_transactions(
    order_id,transaction_type,provider_request_id,amount,currency,status,expires_at
  ) values (
    p_order_id,'payment',v_reservation,v_order.total_amount,'SGD','pending',now()+interval '2 minutes'
  ) returning * into v_transaction;

  return jsonb_build_object(
    'transaction_id',v_transaction.id,'order_id',v_order.id,'reference',v_order.reference,
    'amount',v_order.total_amount,'currency',v_order.currency,'customer_name',v_order.customer_name,
    'customer_email',v_email,'customer_phone',v_order.customer_phone,
    'should_create',true,'creating',false,'reconciliation_required',false,
    'checkout_url',null,'expires_at',v_transaction.expires_at
  );
end;
$$;

create or replace function public.record_hitpay_payment_request_result(
  p_transaction_id uuid,
  p_provider_request_id text,
  p_checkout_url text,
  p_expires_at timestamptz
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_transaction public.payment_transactions%rowtype;
  v_order public.orders%rowtype;
  v_existing uuid;
begin
  if not public.is_service_role() then raise exception 'Service role access is required'; end if;
  if btrim(coalesce(p_provider_request_id,'')) = '' or p_provider_request_id like 'reservation:%'
    or btrim(coalesce(p_checkout_url,'')) = '' or p_expires_at is null or p_expires_at <= now() then
    raise exception 'A valid HitPay request, URL, and future expiry are required';
  end if;

  select id into v_existing from public.payment_transactions
  where provider = 'hitpay' and transaction_type = 'payment'
    and provider_request_id = btrim(p_provider_request_id);
  if found then
    update public.payment_transactions
    set status = 'cancelled',expires_at = null,provider_event_type = 'payment.creation_superseded',provider_event_at = now()
    where id = p_transaction_id and id <> v_existing and status in ('pending','reconciliation_required');
    return v_existing;
  end if;

  select * into v_transaction from public.payment_transactions
  where id = p_transaction_id and transaction_type = 'payment' for update;
  if not found or v_transaction.status not in ('pending','reconciliation_required') then
    raise exception 'Payment creation reservation is not active';
  end if;
  select * into v_order from public.orders where id = v_transaction.order_id for update;
  if not found or v_order.payment_status <> 'pending' or v_order.fulfilment_status <> 'not_ready' then
    raise exception 'Order is not awaiting payment';
  end if;
  if v_transaction.amount <> v_order.total_amount or v_transaction.currency <> 'SGD' then
    raise exception 'Payment reservation no longer matches the order';
  end if;

  update public.payment_transactions
  set provider_request_id = btrim(p_provider_request_id),checkout_url = btrim(p_checkout_url),
      expires_at = p_expires_at,status = 'pending',provider_event_type = 'payment.request_created',
      provider_event_at = now(),updated_at = now()
  where id = p_transaction_id;
  perform public.append_order_event(
    v_order.id,'payment.requested','payment_transactions',null,null,
    jsonb_build_object('transaction_id',p_transaction_id,'provider_request_id',btrim(p_provider_request_id))
  );
  return p_transaction_id;
end;
$$;

create or replace function public.mark_hitpay_payment_reconciliation_required(
  p_transaction_id uuid,
  p_provider_request_id text default null,
  p_checkout_url text default null,
  p_expires_at timestamptz default null,
  p_error_message text default null,
  p_payload jsonb default '{}'::jsonb
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_transaction public.payment_transactions%rowtype;
begin
  if not public.is_service_role() then raise exception 'Service role access is required'; end if;
  select * into v_transaction from public.payment_transactions
  where id = p_transaction_id and transaction_type = 'payment' for update;
  if not found then return false; end if;
  if v_transaction.status = 'succeeded' then return true; end if;
  if v_transaction.status not in ('pending','reconciliation_required') then
    raise exception 'Payment creation reservation is not active';
  end if;
  if nullif(btrim(coalesce(p_provider_request_id,'')),'') is not null
    and (nullif(btrim(coalesce(p_checkout_url,'')),'') is null or p_expires_at is null) then
    raise exception 'Known HitPay request details are incomplete';
  end if;

  update public.payment_transactions
  set status = 'reconciliation_required',
      provider_request_id = coalesce(nullif(btrim(coalesce(p_provider_request_id,'')),''),provider_request_id),
      checkout_url = coalesce(nullif(btrim(coalesce(p_checkout_url,'')),''),checkout_url),
      expires_at = coalesce(p_expires_at,expires_at),
      provider_event_type = 'payment.creation_uncertain',provider_event_at = now(),
      raw_payload = raw_payload || jsonb_build_object(
        'reconciliation_error',left(coalesce(nullif(btrim(coalesce(p_error_message,'')),''),'Unknown provider outcome'),1000),
        'creation_response',coalesce(p_payload,'{}'::jsonb)
      )
  where id = p_transaction_id;
  perform public.append_order_event(
    v_transaction.order_id,'payment.reconciliation_required','payment_transactions',null,null,
    jsonb_build_object('transaction_id',p_transaction_id,'provider_request_id',nullif(btrim(coalesce(p_provider_request_id,'')),''))
  );
  return true;
end;
$$;

create or replace function public.fail_hitpay_payment_creation(
  p_transaction_id uuid,p_error_message text
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_transaction public.payment_transactions%rowtype;
begin
  if not public.is_service_role() then raise exception 'Service role access is required'; end if;
  if btrim(coalesce(p_error_message,'')) = '' then raise exception 'Provider failure details are required'; end if;
  select * into v_transaction from public.payment_transactions
  where id = p_transaction_id and transaction_type = 'payment' for update;
  if not found then return false; end if;
  if v_transaction.status = 'succeeded' then return true; end if;
  if v_transaction.status not in ('pending','reconciliation_required') then return false; end if;
  update public.payment_transactions
  set status = 'failed',expires_at = null,provider_event_type = 'payment.creation_failed',provider_event_at = now(),
      raw_payload = raw_payload || jsonb_build_object('creation_error',left(btrim(p_error_message),1000))
  where id = p_transaction_id;
  perform public.append_order_event(
    v_transaction.order_id,'payment.creation_failed','payment_transactions',null,null,
    jsonb_build_object('transaction_id',p_transaction_id,'error',left(btrim(p_error_message),1000))
  );
  return true;
end;
$$;

create or replace function public.release_hitpay_payment_reconciliation(
  p_transaction_id uuid,p_reason text
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_transaction public.payment_transactions%rowtype;
begin
  if not public.is_admin() then raise exception 'AAL2 admin access is required'; end if;
  if btrim(coalesce(p_reason,'')) = '' then raise exception 'A reconciliation reason is required'; end if;
  select * into v_transaction from public.payment_transactions
  where id = p_transaction_id and transaction_type = 'payment' for update;
  if not found or v_transaction.status not in ('pending','reconciliation_required') then
    raise exception 'Payment request is not awaiting reconciliation';
  end if;
  if v_transaction.provider_request_id not like 'reservation:%' then
    raise exception 'A known HitPay request must be reconciled, not released';
  end if;
  if v_transaction.created_at > now()-interval '2 minutes' then
    raise exception 'Wait before releasing an in-flight payment request';
  end if;
  update public.payment_transactions
  set status = 'cancelled',expires_at = null,provider_event_type = 'payment.reconciled_missing',provider_event_at = now(),
      raw_payload = raw_payload || jsonb_build_object('reconciliation_resolution',left(btrim(p_reason),1000),'resolved_by',auth.uid())
  where id = p_transaction_id;
  perform public.append_order_event(
    v_transaction.order_id,'payment.reconciliation_released','payment_transactions',null,null,
    jsonb_build_object('transaction_id',p_transaction_id,'reason',left(btrim(p_reason),1000))
  );
  return true;
end;
$$;

create or replace function public.prepare_hitpay_refund(
  p_order_id uuid,
  p_amount integer,
  p_reason text,
  p_confirm_fulfilment_started boolean default false
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_order public.orders%rowtype;
  v_payment_id text;
  v_payment_request_id text;
  v_refunded bigint;
  v_refundable integer;
  v_fulfilment_started boolean;
  v_transaction_id uuid;
begin
  if not public.is_admin() then raise exception 'AAL2 admin access is required'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Refund amount must be positive'; end if;
  if btrim(coalesce(p_reason,'')) = '' then raise exception 'A refund reason is required'; end if;
  if length(btrim(p_reason)) > 1000 then raise exception 'Refund reason must not exceed 1000 characters'; end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.payment_provider <> 'hitpay' or v_order.payment_status not in ('paid','partially_refunded') then
    raise exception 'Only a captured HitPay payment can be refunded';
  end if;
  if exists (
    select 1 from public.payment_transactions
    where order_id = p_order_id and transaction_type = 'refund'
      and status in ('pending','reconciliation_required')
  ) then raise exception 'Another refund is pending or requires reconciliation for this order'; end if;

  select provider_payment_id,provider_request_id into v_payment_id,v_payment_request_id
  from public.payment_transactions
  where order_id = p_order_id and transaction_type = 'payment' and status = 'succeeded'
    and provider_payment_id is not null
  order by provider_event_at desc nulls last,created_at desc limit 1;
  if not found then raise exception 'The captured HitPay payment ID is unavailable'; end if;

  select coalesce(sum(amount),0) into v_refunded
  from public.payment_transactions
  where order_id = p_order_id and transaction_type = 'refund' and status = 'succeeded';
  v_refundable := v_order.total_amount-v_refunded;
  if p_amount > v_refundable then raise exception 'Refund exceeds the outstanding refundable amount'; end if;

  v_fulfilment_started := v_order.fulfilment_status not in ('not_ready','ready','cancelled');
  if v_fulfilment_started and not coalesce(p_confirm_fulfilment_started,false) then
    raise exception 'Fulfilment has started; explicit refund confirmation is required';
  end if;

  insert into public.payment_transactions(
    order_id,transaction_type,provider_request_id,amount,currency,status,
    expires_at,reason,requested_by,raw_payload
  ) values (
    p_order_id,'refund','refund-reservation:'||gen_random_uuid()::text,p_amount,'SGD','pending',
    null,btrim(p_reason),auth.uid(),
    jsonb_build_object('fulfilment_started_confirmed',v_fulfilment_started and p_confirm_fulfilment_started)
  ) returning id into v_transaction_id;

  perform public.append_order_event(
    p_order_id,'refund.requested','payment_transactions',null,null,
    jsonb_build_object('transaction_id',v_transaction_id,'amount',p_amount,'currency','SGD','reason',btrim(p_reason),'fulfilment_started',v_fulfilment_started)
  );
  return jsonb_build_object(
    'transaction_id',v_transaction_id,'order_id',v_order.id,'reference',v_order.reference,
    'payment_id',v_payment_id,'payment_request_id',v_payment_request_id,
    'amount',p_amount,'currency','SGD','reason',btrim(p_reason),
    'refundable_amount',v_refundable,'fulfilment_started',v_fulfilment_started
  );
end;
$$;

create or replace function public.mark_hitpay_refund_reconciliation_required(
  p_transaction_id uuid,
  p_provider_refund_id text default null,
  p_error_message text default null,
  p_payload jsonb default '{}'::jsonb
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_refund public.payment_transactions%rowtype;
begin
  if not public.is_service_role() then raise exception 'Service role access is required'; end if;
  select * into v_refund from public.payment_transactions
  where id = p_transaction_id and transaction_type = 'refund' for update;
  if not found then return false; end if;
  if v_refund.status = 'succeeded' then return true; end if;
  if v_refund.status not in ('pending','reconciliation_required') then
    raise exception 'Refund reservation is not active';
  end if;
  if v_refund.provider_payment_id is not null
    and nullif(btrim(coalesce(p_provider_refund_id,'')),'') is not null
    and v_refund.provider_payment_id <> btrim(p_provider_refund_id) then
    raise exception 'HitPay refund ID does not match the recorded result';
  end if;
  update public.payment_transactions
  set status = 'reconciliation_required',
      provider_payment_id = coalesce(nullif(btrim(coalesce(p_provider_refund_id,'')),''),provider_payment_id),
      expires_at = null,provider_event_type = 'refund.reconciliation_required',provider_event_at = now(),
      raw_payload = raw_payload || jsonb_build_object(
        'reconciliation_error',left(coalesce(nullif(btrim(coalesce(p_error_message,'')),''),'Unknown provider outcome'),1000),
        'api_response',coalesce(p_payload,'{}'::jsonb)
      )
  where id = p_transaction_id;
  perform public.append_order_event(
    v_refund.order_id,'refund.reconciliation_required','payment_transactions',null,null,
    jsonb_build_object('transaction_id',p_transaction_id,'provider_refund_id',nullif(btrim(coalesce(p_provider_refund_id,'')),''))
  );
  return true;
end;
$$;

create or replace function public.record_hitpay_refund_result(
  p_transaction_id uuid,
  p_provider_refund_id text,
  p_accepted boolean,
  p_error_message text default null,
  p_payload jsonb default '{}'::jsonb
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_refund public.payment_transactions%rowtype;
begin
  if not public.is_service_role() then raise exception 'Service role access is required'; end if;
  select * into v_refund from public.payment_transactions
  where id = p_transaction_id and transaction_type = 'refund' for update;
  if not found then return false; end if;

  if coalesce(p_accepted,false) then
    if btrim(coalesce(p_provider_refund_id,'')) = '' then raise exception 'HitPay refund ID is required for an accepted refund'; end if;
    if v_refund.status in ('failed','expired','cancelled') then raise exception 'This refund reservation is no longer active'; end if;
    if v_refund.provider_payment_id is not null and v_refund.provider_payment_id <> btrim(p_provider_refund_id) then
      raise exception 'HitPay refund ID does not match the recorded result';
    end if;
    update public.payment_transactions
    set provider_payment_id = btrim(p_provider_refund_id),expires_at = null,
        provider_event_type = case when status = 'succeeded' then provider_event_type else 'refund.api_accepted' end,
        provider_event_at = coalesce(provider_event_at,now()),
        raw_payload = raw_payload || jsonb_build_object('api_response',coalesce(p_payload,'{}'::jsonb))
    where id = p_transaction_id;
  else
    if v_refund.status = 'succeeded' then return true; end if;
    if btrim(coalesce(p_error_message,'')) = '' then raise exception 'Provider failure details are required'; end if;
    update public.payment_transactions
    set status = 'failed',provider_payment_id = coalesce(nullif(btrim(coalesce(p_provider_refund_id,'')),''),provider_payment_id),
        expires_at = null,provider_event_type = 'refund.api_failed',provider_event_at = now(),
        raw_payload = raw_payload || jsonb_build_object('api_error',left(btrim(p_error_message),1000),'api_response',coalesce(p_payload,'{}'::jsonb))
    where id = p_transaction_id;
  end if;
  perform public.append_order_event(
    v_refund.order_id,case when p_accepted then 'refund.provider_accepted' else 'refund.provider_failed' end,
    'payment_transactions',null,null,
    jsonb_build_object('transaction_id',p_transaction_id,'provider_refund_id',nullif(btrim(coalesce(p_provider_refund_id,'')),''),'accepted',coalesce(p_accepted,false))
  );
  return true;
end;
$$;

create or replace function public.release_hitpay_refund_reconciliation(
  p_transaction_id uuid,
  p_confirmed_refunded_amount integer,
  p_reason text
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_refund public.payment_transactions%rowtype;
  v_recorded bigint;
begin
  if not public.is_admin() then raise exception 'AAL2 admin access is required'; end if;
  if p_confirmed_refunded_amount is null or p_confirmed_refunded_amount < 0 then raise exception 'Confirmed refund total is invalid'; end if;
  if btrim(coalesce(p_reason,'')) = '' then raise exception 'A reconciliation reason is required'; end if;
  select * into v_refund from public.payment_transactions
  where id = p_transaction_id and transaction_type = 'refund' for update;
  if not found or v_refund.status not in ('pending','reconciliation_required') then
    raise exception 'Refund is not awaiting reconciliation';
  end if;
  if v_refund.created_at > now()-interval '2 minutes' then raise exception 'Wait before releasing an in-flight refund'; end if;
  select coalesce(sum(amount),0) into v_recorded from public.payment_transactions
  where order_id = v_refund.order_id and transaction_type = 'refund' and status = 'succeeded';
  if p_confirmed_refunded_amount <> v_recorded then
    raise exception 'Provider refund total does not match the recorded ledger';
  end if;

  update public.payment_transactions
  set status = 'cancelled',expires_at = null,provider_event_type = 'refund.reconciled_no_change',provider_event_at = now(),
      raw_payload = raw_payload || jsonb_build_object(
        'reconciliation_resolution',left(btrim(p_reason),1000),
        'confirmed_refunded_amount',p_confirmed_refunded_amount,'resolved_by',auth.uid()
      )
  where id = p_transaction_id;
  perform public.append_order_event(
    v_refund.order_id,'refund.reconciliation_released','payment_transactions',null,null,
    jsonb_build_object('transaction_id',p_transaction_id,'confirmed_refunded_amount',p_confirmed_refunded_amount,'reason',left(btrim(p_reason),1000))
  );
  return true;
end;
$$;

create or replace function public.process_hitpay_webhook(
  p_payload_hash text,
  p_event_type text,
  p_event_object text,
  p_provider_request_id text,
  p_reference text,
  p_status text,
  p_amount integer,
  p_currency text,
  p_payload jsonb
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
  v_order_id uuid;
  v_reference_order_id uuid;
  v_order public.orders%rowtype;
  v_type text;
  v_existing public.payment_transactions%rowtype;
  v_refunded bigint;
  v_refund_delta integer;
  v_payment_id text;
begin
  if not public.is_service_role() then raise exception 'Service role access is required'; end if;
  if btrim(coalesce(p_payload_hash,'')) = '' or btrim(coalesce(p_provider_request_id,'')) = ''
    or p_status not in ('succeeded','failed','expired','cancelled')
    or p_amount is null or p_amount <= 0 or p_currency <> 'SGD' then
    raise exception 'Invalid normalized HitPay event';
  end if;

  select id into v_id from public.payment_transactions
  where provider = 'hitpay' and payload_hash = p_payload_hash;
  if found then return v_id; end if;

  select order_id into v_order_id from public.payment_transactions
  where provider = 'hitpay' and provider_request_id = p_provider_request_id
  order by case when transaction_type = 'payment' then 0 else 1 end,created_at desc limit 1;
  if btrim(coalesce(p_reference,'')) <> '' then
    select id into v_reference_order_id from public.orders where reference = p_reference;
    if v_order_id is not null and v_reference_order_id is distinct from v_order_id then
      raise exception 'HitPay reference does not match its payment request';
    end if;
    v_order_id := coalesce(v_order_id,v_reference_order_id);
  end if;
  if v_order_id is null then raise exception 'HitPay order could not be resolved'; end if;

  select * into v_order from public.orders where id = v_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  v_type := case when lower(coalesce(p_event_type,'')) like '%refund%' then 'refund' else 'payment' end;

  if v_type = 'payment' then
    v_payment_id := nullif(coalesce(
      p_payload->>'payment_id',p_payload#>>'{payments,0,id}',p_payload#>>'{charges,0,id}',p_payload->>'id',''
    ),'');
    select * into v_existing from public.payment_transactions
    where provider = 'hitpay' and transaction_type = 'payment'
      and provider_request_id = p_provider_request_id for update;
    if p_amount <> v_order.total_amount then raise exception 'HitPay payment amount does not match the order'; end if;
    if found then
      if v_existing.status = 'succeeded' and p_status <> 'succeeded' then return v_existing.id; end if;
      update public.payment_transactions
      set provider_payment_id = coalesce(v_payment_id,provider_payment_id),amount = p_amount,status = p_status,
          payload_hash = p_payload_hash,provider_event_type = p_event_type,provider_event_at = now(),
          raw_payload = coalesce(p_payload,'{}'::jsonb),updated_at = now()
      where id = v_existing.id returning id into v_id;
    else
      insert into public.payment_transactions(
        order_id,transaction_type,provider_request_id,provider_payment_id,amount,currency,status,
        payload_hash,provider_event_type,provider_event_at,raw_payload
      ) values (
        v_order_id,'payment',p_provider_request_id,v_payment_id,p_amount,'SGD',p_status,
        p_payload_hash,p_event_type,now(),coalesce(p_payload,'{}'::jsonb)
      ) returning id into v_id;
    end if;

    -- A webhook can win the race before the create route stores HitPay's ID.
    -- Retire that durable reservation instead of leaving a false blocker.
    update public.payment_transactions
    set status = 'cancelled',expires_at = null,provider_event_type = 'payment.creation_superseded_by_webhook',provider_event_at = now()
    where order_id = v_order_id and transaction_type = 'payment' and id <> v_id
      and status in ('pending','reconciliation_required');

    if p_status = 'succeeded' then
      update public.orders
      set payment_provider = 'hitpay',payment_status = 'paid',payment_confirmed_at = coalesce(payment_confirmed_at,now()),
          payment_reference = p_provider_request_id,
          fulfilment_status = case when fulfilment_status = 'not_ready' then 'ready' else fulfilment_status end
      where id = v_order_id;
    elsif v_order.payment_status in ('pending','failed','expired') and not exists (
      select 1 from public.payment_transactions
      where order_id = v_order_id and transaction_type = 'payment' and status = 'succeeded'
    ) then
      update public.orders set payment_status = p_status where id = v_order_id;
    end if;
  else
    if v_order.payment_status not in ('paid','partially_refunded','refunded') then
      raise exception 'Only a captured payment can be refunded';
    end if;
    if p_status <> 'succeeded' then raise exception 'Charge refund webhooks must represent confirmed provider state'; end if;
    if p_amount > v_order.total_amount then raise exception 'Refund exceeds the captured amount'; end if;

    select coalesce(sum(amount),0) into v_refunded from public.payment_transactions
    where order_id = v_order_id and transaction_type = 'refund' and status = 'succeeded';
    if p_amount <= v_refunded then
      select id into v_id from public.payment_transactions
      where order_id = v_order_id and transaction_type = 'refund' and status = 'succeeded'
      order by provider_event_at desc nulls last,created_at desc limit 1;
      return v_id;
    end if;
    v_refund_delta := p_amount-v_refunded;

    -- A previously released uncertain call is deliberately considered before
    -- a newer reservation. Charge webhooks contain only a cumulative total and
    -- no refund ID, so assigning a late delta to the newer call is ambiguous.
    select * into v_existing from public.payment_transactions
    where order_id = v_order_id and transaction_type = 'refund' and amount = v_refund_delta
      and (
        status in ('pending','reconciliation_required')
        or (status = 'cancelled' and provider_event_type = 'refund.reconciled_no_change')
      )
    order by case when status = 'cancelled' then 0 when status = 'reconciliation_required' then 1 else 2 end,
      created_at
    limit 1 for update;
    if found then
      update public.payment_transactions
      set status = 'succeeded',expires_at = null,payload_hash = p_payload_hash,
          provider_event_type = p_event_type,provider_event_at = now(),
          raw_payload = raw_payload || jsonb_build_object('webhook',coalesce(p_payload,'{}'::jsonb))
      where id = v_existing.id returning id into v_id;
    else
      insert into public.payment_transactions(
        order_id,transaction_type,provider_request_id,amount,currency,status,
        payload_hash,provider_event_type,provider_event_at,reason,raw_payload
      ) values (
        v_order_id,'refund','webhook:'||p_payload_hash,v_refund_delta,'SGD','succeeded',
        p_payload_hash,p_event_type,now(),'External HitPay refund',jsonb_build_object('webhook',coalesce(p_payload,'{}'::jsonb))
      ) returning id into v_id;
    end if;

    v_refunded := v_refunded+v_refund_delta;
    if v_refunded > v_order.total_amount then raise exception 'Recorded refunds exceed the captured amount'; end if;
    if v_refunded = v_order.total_amount and v_order.assigned_vendor_id is null
      and v_order.fulfilment_status in ('not_ready','ready','broadcasting') then
      update public.orders
      set payment_status = 'refunded',fulfilment_status = 'cancelled',delivery_status = 'not_ready',settlement_status = 'unpaid'
      where id = v_order_id;
      update public.job_offers set status = 'expired' where order_id = v_order_id and status = 'offered';
    else
      update public.orders
      set payment_status = case when v_refunded = total_amount then 'refunded' else 'partially_refunded' end
      where id = v_order_id;
    end if;
  end if;
  perform public.append_order_event(
    v_order_id,'payment.provider_event','payment_transactions',null,null,
    jsonb_build_object(
      'transaction_id',v_id,'transaction_type',v_type,'status',p_status,
      'amount',case when v_type = 'refund' then v_refund_delta else p_amount end,
      'cumulative_refunded_amount',case when v_type = 'refund' then p_amount else null end,
      'currency',p_currency,'event_type',p_event_type
    )
  );
  return v_id;
end;
$$;

revoke all on function public.record_hitpay_payment_request_result(uuid,text,text,timestamptz) from public,anon,authenticated;
revoke all on function public.mark_hitpay_payment_reconciliation_required(uuid,text,text,timestamptz,text,jsonb) from public,anon,authenticated;
revoke all on function public.fail_hitpay_payment_creation(uuid,text) from public,anon,authenticated;
revoke all on function public.mark_hitpay_refund_reconciliation_required(uuid,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.record_hitpay_payment_request_result(uuid,text,text,timestamptz) to service_role;
grant execute on function public.mark_hitpay_payment_reconciliation_required(uuid,text,text,timestamptz,text,jsonb) to service_role;
grant execute on function public.fail_hitpay_payment_creation(uuid,text) to service_role;
grant execute on function public.mark_hitpay_refund_reconciliation_required(uuid,text,text,jsonb) to service_role;

revoke all on function public.release_hitpay_payment_reconciliation(uuid,text) from public,anon;
revoke all on function public.release_hitpay_refund_reconciliation(uuid,integer,text) from public,anon;
grant execute on function public.release_hitpay_payment_reconciliation(uuid,text) to authenticated;
grant execute on function public.release_hitpay_refund_reconciliation(uuid,integer,text) to authenticated;

commit;
