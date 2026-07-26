begin;

do $$
declare
  v_customer constant uuid := '14000000-0000-4000-8000-000000000001';
  v_admin constant uuid := '14000000-0000-4000-8000-000000000002';
  v_offering uuid;
  v_payment_order uuid;
  v_refund_order uuid;
  v_payment_tx uuid;
  v_new_payment_tx uuid;
  v_refund_tx uuid;
  v_new_refund_tx uuid;
  v_result jsonb;
  v_rejected boolean;
begin
  insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data,raw_app_meta_data)
  values
    (v_customer,'reconciliation-customer@example.test',now(),'{}','{"provider":"google","providers":["google"]}'),
    (v_admin,'reconciliation-admin@example.test',now(),'{}','{"provider":"email","providers":["email"]}');

  perform set_config('request.jwt.claim.sub','',true);
  perform set_config('request.jwt.claim.role','service_role',true);
  perform set_config('request.jwt.claims','{"role":"service_role","aal":"aal2"}',true);
  update public.profiles set role = 'admin',status = 'active' where id = v_admin;
  update public.profiles
  set telegram_chat_id = 140001,telegram_user_id = 140001,telegram_linked_at = now()
  where id = v_customer;
  select id into v_offering from public.offerings where slug = 'korban-share';

  insert into public.orders(
    reference,customer_id,offering_id,service_type,category_slug,customer_name,customer_phone,customer_email,
    unit_amount,total_amount,commission_rate_snapshot,commission_amount,vendor_payout_amount,
    payment_provider,payment_status,fulfilment_status
  ) values (
    'ASQ-RECON-PAYMENT',v_customer,v_offering,'korban','korban','Customer','+6500000000',
    'reconciliation-customer@example.test',10000,10000,0.1,1000,9000,'hitpay','pending','not_ready'
  ) returning id into v_payment_order;

  perform set_config('request.jwt.claim.sub',v_customer::text,true);
  perform set_config('request.jwt.claim.role','authenticated',true);
  perform set_config('request.jwt.claims',jsonb_build_object(
    'sub',v_customer,'role','authenticated','aal','aal1',
    'amr',jsonb_build_array(jsonb_build_object('method','oauth'))
  )::text,true);
  v_result := public.prepare_hitpay_payment(v_payment_order);
  v_payment_tx := (v_result->>'transaction_id')::uuid;
  if not (v_result->>'should_create')::boolean then raise exception 'Initial payment reservation was not created'; end if;

  perform set_config('request.jwt.claim.sub','',true);
  perform set_config('request.jwt.claim.role','service_role',true);
  perform set_config('request.jwt.claims','{"role":"service_role","aal":"aal2"}',true);
  update public.payment_transactions set expires_at = now()-interval '1 minute',created_at = now()-interval '5 minutes'
  where id = v_payment_tx;

  perform set_config('request.jwt.claim.sub',v_customer::text,true);
  perform set_config('request.jwt.claim.role','authenticated',true);
  perform set_config('request.jwt.claims',jsonb_build_object(
    'sub',v_customer,'role','authenticated','aal','aal1',
    'amr',jsonb_build_array(jsonb_build_object('method','oauth'))
  )::text,true);
  v_result := public.prepare_hitpay_payment(v_payment_order);
  if (v_result->>'transaction_id')::uuid <> v_payment_tx
    or not (v_result->>'reconciliation_required')::boolean
    or (v_result->>'should_create')::boolean then
    raise exception 'Stale creation reservation was not retained for reconciliation';
  end if;
  if (select count(*) from public.payment_transactions where order_id = v_payment_order and transaction_type = 'payment') <> 1 then
    raise exception 'A duplicate payment creation reservation was inserted';
  end if;

  perform set_config('request.jwt.claim.sub',v_admin::text,true);
  perform set_config('request.jwt.claim.role','authenticated',true);
  perform set_config('request.jwt.claims',jsonb_build_object(
    'sub',v_admin,'role','authenticated','aal','aal2',
    'amr',jsonb_build_array(jsonb_build_object('method','password'),jsonb_build_object('method','totp'))
  )::text,true);
  if not public.release_hitpay_payment_reconciliation(v_payment_tx,'Provider search confirmed no matching live request.') then
    raise exception 'Admin could not release a reconciled missing payment request';
  end if;

  perform set_config('request.jwt.claim.sub',v_customer::text,true);
  perform set_config('request.jwt.claim.role','authenticated',true);
  perform set_config('request.jwt.claims',jsonb_build_object(
    'sub',v_customer,'role','authenticated','aal','aal1',
    'amr',jsonb_build_array(jsonb_build_object('method','oauth'))
  )::text,true);
  v_result := public.prepare_hitpay_payment(v_payment_order);
  v_new_payment_tx := (v_result->>'transaction_id')::uuid;
  if v_new_payment_tx = v_payment_tx or not (v_result->>'should_create')::boolean then
    raise exception 'Reconciled payment attempt did not allow one new reservation';
  end if;

  perform set_config('request.jwt.claim.sub','',true);
  perform set_config('request.jwt.claim.role','service_role',true);
  perform set_config('request.jwt.claims','{"role":"service_role","aal":"aal2"}',true);
  insert into public.orders(
    reference,customer_id,offering_id,service_type,category_slug,customer_name,customer_phone,customer_email,
    unit_amount,total_amount,commission_rate_snapshot,commission_amount,vendor_payout_amount,
    payment_provider,payment_status,fulfilment_status
  ) values (
    'ASQ-RECON-REFUND',v_customer,v_offering,'korban','korban','Customer','+6500000000',
    'reconciliation-customer@example.test',10000,10000,0.1,1000,9000,'hitpay','paid','ready'
  ) returning id into v_refund_order;
  insert into public.payment_transactions(
    order_id,transaction_type,provider_request_id,provider_payment_id,amount,currency,status,provider_event_at
  ) values (v_refund_order,'payment','hitpay-request-refund-test','hitpay-charge-refund-test',10000,'SGD','succeeded',now());

  perform set_config('request.jwt.claim.sub',v_admin::text,true);
  perform set_config('request.jwt.claim.role','authenticated',true);
  perform set_config('request.jwt.claims',jsonb_build_object(
    'sub',v_admin,'role','authenticated','aal','aal2',
    'amr',jsonb_build_array(jsonb_build_object('method','password'),jsonb_build_object('method','totp'))
  )::text,true);
  v_result := public.prepare_hitpay_refund(v_refund_order,1000,'Customer request',false);
  v_refund_tx := (v_result->>'transaction_id')::uuid;

  perform set_config('request.jwt.claim.sub','',true);
  perform set_config('request.jwt.claim.role','service_role',true);
  perform set_config('request.jwt.claims','{"role":"service_role","aal":"aal2"}',true);
  if not public.mark_hitpay_refund_reconciliation_required(v_refund_tx,null,'Provider timeout','{}') then
    raise exception 'Uncertain refund was not marked for reconciliation';
  end if;
  update public.payment_transactions set created_at = now()-interval '5 minutes' where id = v_refund_tx;
  if not exists (
    select 1 from public.payment_transactions
    where id = v_refund_tx and status = 'reconciliation_required' and expires_at is null
  ) then raise exception 'Uncertain refund was not durable'; end if;

  perform set_config('request.jwt.claim.sub',v_admin::text,true);
  perform set_config('request.jwt.claim.role','authenticated',true);
  perform set_config('request.jwt.claims',jsonb_build_object(
    'sub',v_admin,'role','authenticated','aal','aal2',
    'amr',jsonb_build_array(jsonb_build_object('method','password'),jsonb_build_object('method','totp'))
  )::text,true);
  v_rejected := false;
  begin
    perform public.prepare_hitpay_refund(v_refund_order,1000,'Must remain blocked',false);
  exception when others then v_rejected := position('reconciliation' in lower(sqlerrm)) > 0; end;
  if not v_rejected then raise exception 'A second refund was allowed while the first required reconciliation'; end if;
  if not public.release_hitpay_refund_reconciliation(v_refund_tx,0,'Provider charge still reports zero refunded.') then
    raise exception 'No-change refund reconciliation could not be released';
  end if;
  v_result := public.prepare_hitpay_refund(v_refund_order,1000,'Replacement after explicit reconciliation',false);
  v_new_refund_tx := (v_result->>'transaction_id')::uuid;

  perform set_config('request.jwt.claim.sub','',true);
  perform set_config('request.jwt.claim.role','service_role',true);
  perform set_config('request.jwt.claims','{"role":"service_role","aal":"aal2"}',true);
  perform public.process_hitpay_webhook(
    repeat('f',64),'refund.updated','charge','hitpay-request-refund-test','ASQ-RECON-REFUND',
    'succeeded',1000,'SGD',jsonb_build_object(
      'id','hitpay-charge-refund-test','payment_request_id','hitpay-request-refund-test',
      'status','partially_refunded','amount',10000,'refunded_amount',1000,'currency','sgd'
    )
  );
  if not exists (select 1 from public.payment_transactions where id = v_refund_tx and status = 'succeeded') then
    raise exception 'Late refund webhook did not attach to the earlier reconciled attempt';
  end if;
  if not exists (select 1 from public.payment_transactions where id = v_new_refund_tx and status = 'pending') then
    raise exception 'Late refund webhook attached ambiguously to the newer reservation';
  end if;
end;
$$;

rollback;
