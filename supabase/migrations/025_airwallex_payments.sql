-- Add Airwallex without changing historical HitPay or manual transactions.
-- The PaymentIntent request UUID is durable so network retries are idempotent.

begin;

alter table public.orders drop constraint if exists orders_payment_provider_check;
alter table public.orders add constraint orders_payment_provider_check
  check (payment_provider in ('demo','hitpay','airwallex','manual'));

alter table public.payment_transactions drop constraint if exists payment_transactions_provider_check;
alter table public.payment_transactions add constraint payment_transactions_provider_check
  check (provider in ('hitpay','airwallex','manual'));

alter table public.integration_failures drop constraint if exists integration_failures_provider_check;
alter table public.integration_failures add constraint integration_failures_provider_check
  check (provider in ('hitpay','airwallex','brevo','telegram','internal'));

alter table public.payment_transactions
  add column if not exists provider_event_id text;

create unique index if not exists payment_transactions_provider_event_uidx
  on public.payment_transactions(provider,provider_event_id)
  where provider_event_id is not null;

create table if not exists public.payment_provider_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('hitpay','airwallex')),
  provider_event_id text not null,
  event_type text not null,
  provider_event_at timestamptz not null,
  payload_hash text not null check (payload_hash ~ '^[0-9a-f]{64}$'),
  raw_payload jsonb not null default '{}'::jsonb,
  transaction_id uuid references public.payment_transactions(id) on delete set null,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(provider,provider_event_id)
);
create index if not exists payment_provider_events_created_idx
  on public.payment_provider_events(created_at desc);
alter table public.payment_provider_events enable row level security;
revoke all on table public.payment_provider_events from public,anon;
grant select on table public.payment_provider_events to authenticated;
create policy "AAL2 admins read payment provider events" on public.payment_provider_events
  for select to authenticated using (public.is_admin());

create or replace function public.prepare_airwallex_payment(p_order_id uuid)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_order public.orders%rowtype;
  v_email text;
  v_transaction public.payment_transactions%rowtype;
  v_request_id uuid;
begin
  if not public.is_customer() then raise exception 'Active customer access is required'; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.customer_id <> auth.uid() then raise exception 'Order not found'; end if;
  select email into v_email from auth.users where id = auth.uid() and email_confirmed_at is not null;
  if v_email is null then raise exception 'A verified email is required before payment'; end if;
  if v_order.payment_status in ('paid','partially_refunded','refunded') then raise exception 'Order is not payable'; end if;
  if v_order.fulfilment_status <> 'not_ready' then raise exception 'Order fulfilment has already started'; end if;

  if exists (
    select 1 from public.payment_transactions
    where order_id = p_order_id and transaction_type = 'payment'
      and provider <> 'airwallex' and status in ('pending','reconciliation_required','succeeded')
  ) then raise exception 'This order already belongs to another payment provider'; end if;

  update public.orders
  set customer_email = v_email,payment_provider = 'airwallex',payment_status = 'pending'
  where id = p_order_id;

  -- Client secrets expire. Retire the local checkout session after 55 minutes;
  -- a late signed success still remains authoritative in the webhook function.
  update public.payment_transactions
  set status = 'expired',provider_event_type = 'payment.client_secret_expired',provider_event_at = now(),updated_at = now()
  where order_id = p_order_id and provider = 'airwallex' and transaction_type = 'payment'
    and status = 'pending' and expires_at is not null and expires_at <= now();

  select * into v_transaction
  from public.payment_transactions
  where order_id = p_order_id and provider = 'airwallex' and transaction_type = 'payment'
    and status = 'pending'
  order by created_at desc limit 1;

  if found then
    v_request_id := coalesce(
      nullif(v_transaction.raw_payload->>'request_id','')::uuid,
      case when v_transaction.provider_request_id like 'reservation:%'
        then replace(v_transaction.provider_request_id,'reservation:','')::uuid else null end
    );
    if v_request_id is null then raise exception 'Airwallex idempotency key is unavailable'; end if;
    return jsonb_build_object(
      'transaction_id',v_transaction.id,'order_id',v_order.id,'reference',v_order.reference,
      'request_id',v_request_id,'provider_intent_id',case when v_transaction.provider_request_id like 'int_%' then v_transaction.provider_request_id else null end,
      'amount',v_order.total_amount,'currency',v_order.currency,
      'customer_name',v_order.customer_name,'customer_email',v_email,'customer_phone',v_order.customer_phone,
      'expires_at',v_transaction.expires_at,'reused',true
    );
  end if;

  v_request_id := gen_random_uuid();
  insert into public.payment_transactions(
    order_id,provider,transaction_type,provider_request_id,amount,currency,status,expires_at,raw_payload
  ) values (
    p_order_id,'airwallex','payment','reservation:'||v_request_id::text,
    v_order.total_amount,'SGD','pending',now()+interval '55 minutes',
    jsonb_build_object('request_id',v_request_id)
  ) returning * into v_transaction;

  perform public.append_order_event(
    p_order_id,'payment.prepared','payment_transactions',null,null,
    jsonb_build_object('transaction_id',v_transaction.id,'provider','airwallex')
  );

  return jsonb_build_object(
    'transaction_id',v_transaction.id,'order_id',v_order.id,'reference',v_order.reference,
    'request_id',v_request_id,'provider_intent_id',null,
    'amount',v_order.total_amount,'currency',v_order.currency,
    'customer_name',v_order.customer_name,'customer_email',v_email,'customer_phone',v_order.customer_phone,
    'expires_at',v_transaction.expires_at,'reused',false
  );
end;
$$;

create or replace function public.record_airwallex_payment_intent(
  p_transaction_id uuid,
  p_request_id uuid,
  p_provider_intent_id text,
  p_provider_status text,
  p_expires_at timestamptz,
  p_payload jsonb default '{}'::jsonb
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_transaction public.payment_transactions%rowtype;
  v_order public.orders%rowtype;
  v_existing uuid;
begin
  if not public.is_service_role() then raise exception 'Service role access is required'; end if;
  if p_request_id is null or p_provider_intent_id !~ '^int_[A-Za-z0-9_-]{1,200}$'
    or btrim(coalesce(p_provider_status,'')) = '' or p_expires_at is null then
    raise exception 'Invalid Airwallex PaymentIntent result';
  end if;

  select id into v_existing from public.payment_transactions
  where provider = 'airwallex' and transaction_type = 'payment'
    and provider_request_id = p_provider_intent_id;
  if found then return v_existing; end if;

  select * into v_transaction from public.payment_transactions
  where id = p_transaction_id and provider = 'airwallex' and transaction_type = 'payment' for update;
  if not found or v_transaction.status <> 'pending' then raise exception 'Airwallex payment reservation is not active'; end if;
  if v_transaction.raw_payload->>'request_id' <> p_request_id::text then raise exception 'Airwallex request ID does not match its reservation'; end if;

  select * into v_order from public.orders where id = v_transaction.order_id for update;
  if not found or v_order.payment_provider <> 'airwallex' or v_order.payment_status <> 'pending'
    or v_order.fulfilment_status <> 'not_ready' then raise exception 'Order is not awaiting Airwallex payment'; end if;
  if v_transaction.amount <> v_order.total_amount or v_transaction.currency <> v_order.currency then
    raise exception 'Airwallex PaymentIntent no longer matches the order';
  end if;

  update public.payment_transactions
  set provider_request_id = p_provider_intent_id,expires_at = p_expires_at,
      provider_event_type = 'payment_intent.created',provider_event_at = now(),
      raw_payload = raw_payload || jsonb_build_object('create_response',coalesce(p_payload,'{}'::jsonb),'provider_status',p_provider_status),
      updated_at = now()
  where id = p_transaction_id;

  perform public.append_order_event(
    v_order.id,'payment.requested','payment_transactions',null,null,
    jsonb_build_object('transaction_id',p_transaction_id,'provider','airwallex','provider_intent_id',p_provider_intent_id)
  );
  return p_transaction_id;
end;
$$;

create or replace function public.fail_airwallex_payment_creation(
  p_transaction_id uuid,p_error_message text
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_transaction public.payment_transactions%rowtype;
begin
  if not public.is_service_role() then raise exception 'Service role access is required'; end if;
  if btrim(coalesce(p_error_message,'')) = '' then raise exception 'Provider failure details are required'; end if;
  select * into v_transaction from public.payment_transactions
  where id = p_transaction_id and provider = 'airwallex' and transaction_type = 'payment' for update;
  if not found then return false; end if;
  if v_transaction.status = 'succeeded' then return true; end if;
  if v_transaction.status <> 'pending' then return false; end if;
  update public.payment_transactions
  set status = 'failed',expires_at = null,provider_event_type = 'payment.creation_failed',provider_event_at = now(),
      raw_payload = raw_payload || jsonb_build_object('creation_error',left(btrim(p_error_message),1000)),updated_at = now()
  where id = p_transaction_id;
  update public.orders set payment_status = 'failed'
  where id = v_transaction.order_id and payment_status = 'pending';
  perform public.append_order_event(
    v_transaction.order_id,'payment.creation_failed','payment_transactions',null,null,
    jsonb_build_object('transaction_id',p_transaction_id,'provider','airwallex','error',left(btrim(p_error_message),1000))
  );
  return true;
end;
$$;

create or replace function public.process_airwallex_payment_event(
  p_event_id text,
  p_event_type text,
  p_provider_event_at timestamptz,
  p_provider_intent_id text,
  p_reference text,
  p_status text,
  p_provider_status text,
  p_amount integer,
  p_currency text,
  p_payload_hash text,
  p_payload jsonb
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
  v_event_record_id uuid;
  v_order_id uuid;
  v_reference_order_id uuid;
  v_order public.orders%rowtype;
  v_transaction public.payment_transactions%rowtype;
begin
  if not public.is_service_role() then raise exception 'Service role access is required'; end if;
  if btrim(coalesce(p_event_id,'')) = '' or p_event_type not like 'payment_intent.%'
    or p_provider_event_at is null or p_provider_intent_id !~ '^int_[A-Za-z0-9_-]{1,200}$'
    or p_status not in ('pending','succeeded','cancelled')
    or btrim(coalesce(p_provider_status,'')) = '' or p_amount is null or p_amount <= 0
    or p_currency <> 'SGD' or p_payload_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid normalized Airwallex event';
  end if;

  select transaction_id into v_id from public.payment_provider_events
  where provider = 'airwallex' and provider_event_id = p_event_id;
  if found and v_id is not null then return v_id; end if;

  insert into public.payment_provider_events(
    provider,provider_event_id,event_type,provider_event_at,payload_hash,raw_payload
  ) values (
    'airwallex',p_event_id,p_event_type,p_provider_event_at,p_payload_hash,coalesce(p_payload,'{}'::jsonb)
  ) on conflict (provider,provider_event_id) do update set provider_event_id = excluded.provider_event_id
  returning id,transaction_id into v_event_record_id,v_id;
  if v_id is not null then return v_id; end if;

  select order_id into v_order_id from public.payment_transactions
  where provider = 'airwallex' and transaction_type = 'payment'
    and provider_request_id = p_provider_intent_id
  order by created_at desc limit 1;
  if btrim(coalesce(p_reference,'')) <> '' then
    select id into v_reference_order_id from public.orders where reference = p_reference;
    if v_order_id is not null and v_reference_order_id is distinct from v_order_id then
      raise exception 'Airwallex merchant order ID does not match its PaymentIntent';
    end if;
    v_order_id := coalesce(v_order_id,v_reference_order_id);
  end if;
  if v_order_id is null then raise exception 'Airwallex order could not be resolved'; end if;

  select * into v_order from public.orders where id = v_order_id for update;
  if not found or v_order.payment_provider <> 'airwallex' then raise exception 'Order does not belong to Airwallex'; end if;
  if p_amount <> v_order.total_amount or p_currency <> v_order.currency then
    raise exception 'Airwallex payment amount or currency does not match the order';
  end if;

  select * into v_transaction from public.payment_transactions
  where provider = 'airwallex' and transaction_type = 'payment'
    and (provider_request_id = p_provider_intent_id or (order_id = v_order_id and status = 'pending'))
  order by case when provider_request_id = p_provider_intent_id then 0 else 1 end,created_at desc
  limit 1 for update;

  if found then
    if v_transaction.status = 'succeeded' and p_status <> 'succeeded' then
      update public.payment_provider_events set transaction_id = v_transaction.id,processed_at = now() where id = v_event_record_id;
      return v_transaction.id;
    end if;
    if v_transaction.provider_event_at is not null and v_transaction.provider_event_at > p_provider_event_at
      and p_status <> 'succeeded' then
      update public.payment_provider_events set transaction_id = v_transaction.id,processed_at = now() where id = v_event_record_id;
      return v_transaction.id;
    end if;
    update public.payment_transactions
    set provider_request_id = p_provider_intent_id,status = p_status,provider_event_id = p_event_id,
        payload_hash = p_payload_hash,provider_event_type = p_event_type,provider_event_at = p_provider_event_at,
        expires_at = case when p_status in ('succeeded','cancelled') then null else expires_at end,
        raw_payload = raw_payload || jsonb_build_object('webhook',coalesce(p_payload,'{}'::jsonb),'provider_status',p_provider_status),
        updated_at = now()
    where id = v_transaction.id returning id into v_id;
  else
    insert into public.payment_transactions(
      order_id,provider,transaction_type,provider_request_id,amount,currency,status,
      payload_hash,provider_event_id,provider_event_type,provider_event_at,raw_payload
    ) values (
      v_order_id,'airwallex','payment',p_provider_intent_id,p_amount,p_currency,p_status,
      p_payload_hash,p_event_id,p_event_type,p_provider_event_at,
      jsonb_build_object('webhook',coalesce(p_payload,'{}'::jsonb),'provider_status',p_provider_status)
    ) returning id into v_id;
  end if;

  if p_status = 'succeeded' then
    update public.payment_transactions
    set status = 'cancelled',expires_at = null,provider_event_type = 'payment.superseded_by_success',provider_event_at = p_provider_event_at
    where order_id = v_order_id and transaction_type = 'payment' and id <> v_id
      and status in ('pending','reconciliation_required');
    update public.orders
    set payment_status = 'paid',payment_confirmed_at = coalesce(payment_confirmed_at,p_provider_event_at),
        payment_reference = p_provider_intent_id,
        fulfilment_status = case when fulfilment_status = 'not_ready' then 'ready' else fulfilment_status end
    where id = v_order_id;
  elsif p_status = 'cancelled' and v_order.payment_status not in ('paid','partially_refunded','refunded')
    and not exists (
      select 1 from public.payment_transactions
      where order_id = v_order_id and transaction_type = 'payment' and id <> v_id and status = 'pending'
    ) then
    update public.orders set payment_status = 'cancelled' where id = v_order_id;
  elsif v_order.payment_status not in ('paid','partially_refunded','refunded') then
    update public.orders set payment_status = 'pending' where id = v_order_id;
  end if;

  perform public.append_order_event(
    v_order_id,'payment.provider_event','payment_transactions',null,null,
    jsonb_build_object('transaction_id',v_id,'provider','airwallex','event_id',p_event_id,
      'event_type',p_event_type,'status',p_status,'provider_status',p_provider_status,
      'amount',p_amount,'currency',p_currency)
  );
  update public.payment_provider_events
  set transaction_id = v_id,processed_at = now()
  where id = v_event_record_id;
  return v_id;
end;
$$;

create or replace function public.prepare_airwallex_refund(
  p_order_id uuid,p_amount integer,p_reason text,p_confirm_fulfilment_started boolean default false
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_order public.orders%rowtype;
  v_payment_intent_id text;
  v_refunded bigint;
  v_refundable integer;
  v_fulfilment_started boolean;
  v_transaction_id uuid;
  v_request_id uuid;
  v_open_refund public.payment_transactions%rowtype;
begin
  if not public.is_admin() then raise exception 'AAL2 admin access is required'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Refund amount must be positive'; end if;
  if btrim(coalesce(p_reason,'')) = '' or length(btrim(p_reason)) > 128 then raise exception 'A refund reason of up to 128 characters is required'; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.payment_provider <> 'airwallex' or v_order.payment_status not in ('paid','partially_refunded') then
    raise exception 'Only a captured Airwallex payment can be refunded';
  end if;
  select provider_request_id into v_payment_intent_id from public.payment_transactions
  where order_id = p_order_id and provider = 'airwallex' and transaction_type = 'payment'
    and status = 'succeeded' and provider_request_id like 'int_%'
  order by provider_event_at desc nulls last,created_at desc limit 1;
  if not found then raise exception 'The captured Airwallex PaymentIntent is unavailable'; end if;

  select * into v_open_refund from public.payment_transactions
  where order_id = p_order_id and provider = 'airwallex' and transaction_type = 'refund'
    and status in ('pending','reconciliation_required')
  order by created_at desc limit 1;
  if found then
    if v_open_refund.amount <> p_amount or v_open_refund.reason <> btrim(p_reason) then
      raise exception 'Another refund is pending for this order';
    end if;
    return jsonb_build_object(
      'transaction_id',v_open_refund.id,'order_id',v_order.id,'reference',v_order.reference,
      'request_id',v_open_refund.raw_payload->>'request_id','payment_intent_id',v_payment_intent_id,
      'amount',v_open_refund.amount,'currency',v_open_refund.currency,'reason',v_open_refund.reason,
      'refundable_amount',v_order.total_amount,'fulfilment_started',v_order.fulfilment_status not in ('not_ready','ready','cancelled')
    );
  end if;

  select coalesce(sum(amount),0) into v_refunded from public.payment_transactions
  where order_id = p_order_id and transaction_type = 'refund' and status = 'succeeded';
  v_refundable := v_order.total_amount-v_refunded;
  if p_amount > v_refundable then raise exception 'Refund exceeds the outstanding refundable amount'; end if;
  v_fulfilment_started := v_order.fulfilment_status not in ('not_ready','ready','cancelled');
  if v_fulfilment_started and not coalesce(p_confirm_fulfilment_started,false) then
    raise exception 'Fulfilment has started; explicit refund confirmation is required';
  end if;

  v_request_id := gen_random_uuid();
  insert into public.payment_transactions(
    order_id,provider,transaction_type,provider_request_id,amount,currency,status,reason,requested_by,raw_payload
  ) values (
    p_order_id,'airwallex','refund','reservation:'||v_request_id::text,p_amount,'SGD','pending',btrim(p_reason),auth.uid(),
    jsonb_build_object('request_id',v_request_id,'payment_intent_id',v_payment_intent_id,
      'fulfilment_started_confirmed',v_fulfilment_started and p_confirm_fulfilment_started)
  ) returning id into v_transaction_id;
  perform public.append_order_event(
    p_order_id,'refund.requested','payment_transactions',null,null,
    jsonb_build_object('transaction_id',v_transaction_id,'provider','airwallex','amount',p_amount,'currency','SGD','reason',btrim(p_reason))
  );
  return jsonb_build_object(
    'transaction_id',v_transaction_id,'order_id',v_order.id,'reference',v_order.reference,
    'request_id',v_request_id,'payment_intent_id',v_payment_intent_id,'amount',p_amount,'currency','SGD',
    'reason',btrim(p_reason),'refundable_amount',v_refundable,'fulfilment_started',v_fulfilment_started
  );
end;
$$;

create or replace function public.record_airwallex_refund(
  p_transaction_id uuid,p_request_id uuid,p_refund_id text,p_provider_status text,p_payload jsonb default '{}'::jsonb
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_refund public.payment_transactions%rowtype;
begin
  if not public.is_service_role() then raise exception 'Service role access is required'; end if;
  if p_request_id is null or p_refund_id !~ '^rfd_[A-Za-z0-9_-]{1,200}$' or btrim(coalesce(p_provider_status,'')) = '' then
    raise exception 'Invalid Airwallex refund result';
  end if;
  select * into v_refund from public.payment_transactions
  where id = p_transaction_id and provider = 'airwallex' and transaction_type = 'refund' for update;
  if not found then return false; end if;
  if v_refund.raw_payload->>'request_id' <> p_request_id::text then raise exception 'Airwallex refund request ID does not match'; end if;
  if v_refund.status not in ('pending','succeeded') then raise exception 'Refund reservation is not active'; end if;
  update public.payment_transactions
  set provider_request_id = p_refund_id,provider_payment_id = p_refund_id,
      provider_event_type = 'refund.api_received',provider_event_at = now(),
      raw_payload = raw_payload || jsonb_build_object('api_response',coalesce(p_payload,'{}'::jsonb),'provider_status',p_provider_status),
      updated_at = now()
  where id = p_transaction_id;
  return true;
end;
$$;

create or replace function public.process_airwallex_refund_event(
  p_event_id text,p_event_type text,p_provider_event_at timestamptz,p_refund_id text,p_request_id uuid,
  p_payment_intent_id text,p_status text,p_provider_status text,p_amount integer,p_currency text,
  p_reason text,p_payload_hash text,p_payload jsonb
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
  v_event_record_id uuid;
  v_order public.orders%rowtype;
  v_order_id uuid;
  v_refund public.payment_transactions%rowtype;
  v_refunded bigint;
begin
  if not public.is_service_role() then raise exception 'Service role access is required'; end if;
  if btrim(coalesce(p_event_id,'')) = '' or p_event_type not like 'refund.%' or p_provider_event_at is null
    or p_refund_id !~ '^rfd_[A-Za-z0-9_-]{1,200}$' or p_request_id is null
    or p_payment_intent_id !~ '^int_[A-Za-z0-9_-]{1,200}$' or p_status not in ('pending','succeeded','failed')
    or p_amount is null or p_amount <= 0 or p_currency <> 'SGD' or p_payload_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid normalized Airwallex refund event';
  end if;
  select transaction_id into v_id from public.payment_provider_events
  where provider = 'airwallex' and provider_event_id = p_event_id;
  if found and v_id is not null then return v_id; end if;
  insert into public.payment_provider_events(provider,provider_event_id,event_type,provider_event_at,payload_hash,raw_payload)
  values ('airwallex',p_event_id,p_event_type,p_provider_event_at,p_payload_hash,coalesce(p_payload,'{}'::jsonb))
  on conflict (provider,provider_event_id) do update set provider_event_id = excluded.provider_event_id
  returning id,transaction_id into v_event_record_id,v_id;
  if v_id is not null then return v_id; end if;

  select order_id into v_order_id from public.payment_transactions
  where provider = 'airwallex' and transaction_type = 'payment' and provider_request_id = p_payment_intent_id;
  if v_order_id is null then raise exception 'Airwallex refund order could not be resolved'; end if;
  select * into v_order from public.orders where id = v_order_id for update;
  if not found or v_order.payment_provider <> 'airwallex' then raise exception 'Order does not belong to Airwallex'; end if;
  if p_amount > v_order.total_amount then raise exception 'Airwallex refund exceeds the captured amount'; end if;

  select * into v_refund from public.payment_transactions
  where order_id = v_order_id and provider = 'airwallex' and transaction_type = 'refund'
    and (provider_request_id = p_refund_id or raw_payload->>'request_id' = p_request_id::text)
  order by created_at desc limit 1 for update;
  if found then
    if v_refund.status = 'succeeded' and p_status = 'pending' then
      update public.payment_provider_events set transaction_id = v_refund.id,processed_at = now() where id = v_event_record_id;
      return v_refund.id;
    end if;
    update public.payment_transactions
    set provider_request_id = p_refund_id,provider_payment_id = p_refund_id,status = p_status,
        provider_event_id = p_event_id,payload_hash = p_payload_hash,provider_event_type = p_event_type,
        provider_event_at = p_provider_event_at,
        raw_payload = raw_payload || jsonb_build_object('webhook',coalesce(p_payload,'{}'::jsonb),'provider_status',p_provider_status),
        updated_at = now()
    where id = v_refund.id returning id into v_id;
  else
    insert into public.payment_transactions(
      order_id,provider,transaction_type,provider_request_id,provider_payment_id,amount,currency,status,
      payload_hash,provider_event_id,provider_event_type,provider_event_at,reason,raw_payload
    ) values (
      v_order_id,'airwallex','refund',p_refund_id,p_refund_id,p_amount,p_currency,p_status,
      p_payload_hash,p_event_id,p_event_type,p_provider_event_at,coalesce(nullif(btrim(p_reason),''),'External Airwallex refund'),
      jsonb_build_object('request_id',p_request_id,'webhook',coalesce(p_payload,'{}'::jsonb),'provider_status',p_provider_status)
    ) returning id into v_id;
  end if;

  select coalesce(sum(amount),0) into v_refunded from public.payment_transactions
  where order_id = v_order_id and transaction_type = 'refund' and status = 'succeeded';
  if v_refunded > v_order.total_amount then raise exception 'Recorded refunds exceed the captured amount'; end if;
  if v_refunded = v_order.total_amount and v_order.assigned_vendor_id is null
    and v_order.fulfilment_status in ('not_ready','ready','broadcasting') then
    update public.orders set payment_status = 'refunded',fulfilment_status = 'cancelled',delivery_status = 'not_ready',settlement_status = 'unpaid'
    where id = v_order_id;
    update public.job_offers set status = 'expired' where order_id = v_order_id and status = 'offered';
  elsif v_refunded > 0 then
    update public.orders set payment_status = case when v_refunded = total_amount then 'refunded' else 'partially_refunded' end
    where id = v_order_id;
  end if;
  perform public.append_order_event(
    v_order_id,'payment.provider_event','payment_transactions',null,null,
    jsonb_build_object('transaction_id',v_id,'provider','airwallex','event_id',p_event_id,'event_type',p_event_type,
      'status',p_status,'provider_status',p_provider_status,'amount',p_amount,'currency',p_currency)
  );
  update public.payment_provider_events set transaction_id = v_id,processed_at = now() where id = v_event_record_id;
  return v_id;
end;
$$;

revoke all on function public.prepare_airwallex_payment(uuid) from public,anon;
grant execute on function public.prepare_airwallex_payment(uuid) to authenticated;

revoke all on function public.record_airwallex_payment_intent(uuid,uuid,text,text,timestamptz,jsonb) from public,anon,authenticated;
revoke all on function public.fail_airwallex_payment_creation(uuid,text) from public,anon,authenticated;
revoke all on function public.process_airwallex_payment_event(text,text,timestamptz,text,text,text,text,integer,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.record_airwallex_payment_intent(uuid,uuid,text,text,timestamptz,jsonb) to service_role;
grant execute on function public.fail_airwallex_payment_creation(uuid,text) to service_role;
grant execute on function public.process_airwallex_payment_event(text,text,timestamptz,text,text,text,text,integer,text,text,jsonb) to service_role;

revoke all on function public.prepare_airwallex_refund(uuid,integer,text,boolean) from public,anon;
grant execute on function public.prepare_airwallex_refund(uuid,integer,text,boolean) to authenticated;
revoke all on function public.record_airwallex_refund(uuid,uuid,text,text,jsonb) from public,anon,authenticated;
revoke all on function public.process_airwallex_refund_event(text,text,timestamptz,text,uuid,text,text,text,integer,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.record_airwallex_refund(uuid,uuid,text,text,jsonb) to service_role;
grant execute on function public.process_airwallex_refund_event(text,text,timestamptz,text,uuid,text,text,text,integer,text,text,text,jsonb) to service_role;

commit;
