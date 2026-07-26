-- Run after migrations with a privileged local test connection, for example:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/009_production_lifecycle_test.sql
-- Every fixture is rolled back.

begin;

do $$
declare
  v_customer constant uuid := '10000000-0000-4000-8000-000000000001';
  v_vendor constant uuid := '10000000-0000-4000-8000-000000000002';
  v_admin constant uuid := '10000000-0000-4000-8000-000000000003';
  v_onboarding_vendor constant uuid := '10000000-0000-4000-8000-000000000004';
  v_order uuid;
  v_refund_order uuid;
  v_refund_transaction uuid;
  v_offering uuid;
  v_report uuid;
  v_email_delivery uuid;
  v_email_retry uuid;
  v_telegram_delivery uuid;
  v_link_token text;
  v_link_hash text;
  v_prepared jsonb;
  v_refund_prepared jsonb;
  v_items jsonb;
  v_rejected boolean;
  v_version integer;
  v_prefix text;
begin
  insert into auth.users(id,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data)
  values
    (v_customer,'lifecycle-customer@example.test',now(),'{"provider":"google","providers":["google"]}','{"full_name":"Lifecycle Customer"}'),
    (v_vendor,'lifecycle-vendor@example.test',now(),'{"provider":"email","providers":["email"]}','{"full_name":"Lifecycle Vendor"}'),
    (v_admin,'lifecycle-admin@example.test',now(),'{"provider":"email","providers":["email"]}','{"full_name":"Lifecycle Admin"}'),
    (v_onboarding_vendor,'onboarding-vendor@example.test',now(),'{"provider":"email","providers":["email"]}','{"full_name":"Invited Vendor"}');

  perform set_config('request.jwt.claim.sub','',true);
  perform set_config('request.jwt.claim.role','service_role',true);
  perform set_config('request.jwt.claims','{"role":"service_role","aal":"aal2"}',true);
  update public.profiles
  set role = 'vendor', status = 'active', vendor_onboarding_status = 'approved', services = array['korban'], country = 'Indonesia'
  where id = v_vendor;
  update public.profiles set role = 'admin', status = 'active' where id = v_admin;
  update public.profiles
  set role = 'vendor', status = 'active', vendor_onboarding_status = 'invited'
  where id = v_onboarding_vendor;
  insert into public.vendor_invitations(email,invited_by,auth_user_id)
  values ('onboarding-vendor@example.test',v_admin,v_onboarding_vendor);

  -- An invited vendor cannot become pending without a complete, validated setup.
  perform set_config('request.jwt.claim.sub',v_onboarding_vendor::text,true);
  perform set_config('request.jwt.claim.role','authenticated',true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_onboarding_vendor,'role','authenticated','aal','aal1','amr',jsonb_build_array(jsonb_build_object('method','oauth')))::text,true);
  if public.complete_vendor_onboarding(
    'Lifecycle Partner','Vendor Contact','+62123456789',null,'Indonesia','Aceh',
    'General / multi-service vendor',array['korban','water'],'Lifecycle Bank',
    'Lifecycle Partner','123456789','LIFECYCLE-SWIFT'
  ) then raise exception 'OAuth session consumed a vendor invitation'; end if;
  if not exists (
    select 1 from public.vendor_invitations
    where auth_user_id = v_onboarding_vendor and status = 'invited' and accepted_at is null
  ) then raise exception 'Rejected OAuth onboarding changed the invitation'; end if;

  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_onboarding_vendor,'role','authenticated','aal','aal1','amr',jsonb_build_array('password'))::text,true);
  if public.accept_vendor_invitation() then
    raise exception 'Compatibility invitation RPC bypassed required onboarding details';
  end if;
  v_rejected := false;
  begin
    perform public.complete_vendor_onboarding(
      'Lifecycle Partner','Vendor Contact','+62123456789',null,'Indonesia','Aceh',
      'General / multi-service vendor',array['korban','water'],'Lifecycle Bank',
      'Lifecycle Partner','',null
    );
  exception when others then
    v_rejected := true;
  end;
  if not v_rejected then raise exception 'Incomplete vendor bank details were accepted'; end if;
  if not public.complete_vendor_onboarding(
    'Lifecycle Partner','Vendor Contact','+62123456789',null,'Indonesia','Aceh',
    'General / multi-service vendor',array['water','korban','water'],'Lifecycle Bank',
    'Lifecycle Partner','123456789','LIFECYCLE-SWIFT'
  ) then raise exception 'Complete vendor onboarding was rejected'; end if;
  if not exists (
    select 1 from public.profiles
    where id = v_onboarding_vendor
      and vendor_onboarding_status = 'pending'
      and display_name = 'Lifecycle Partner'
      and services = array['korban','water']
      and currency = 'SGD'
      and bank_account_number = '123456789'
  ) or not exists (
    select 1 from public.vendor_invitations
    where auth_user_id = v_onboarding_vendor and status = 'accepted' and accepted_at is not null
  ) then raise exception 'Vendor onboarding did not atomically persist profile and invitation state'; end if;

  select id into v_offering from public.offerings where slug = 'korban-share';
  insert into public.orders (
    reference, customer_id, offering_id, service_type, category_slug,
    customer_name, customer_phone, unit_amount, total_amount,
    commission_rate_snapshot, commission_amount, vendor_payout_amount
  ) values (
    'ASQ-LIFECYCLE-TEST', v_customer, v_offering, 'korban', 'korban',
    'Lifecycle Customer', '+6500000000', 1000, 1000, 0.100, 100, 900
  ) returning id into v_order;

  perform set_config('request.jwt.claim.sub',v_admin::text,true);
  perform set_config('request.jwt.claim.role','authenticated',true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_admin,'role','authenticated','aal','aal1','amr',jsonb_build_array('password'))::text,true);
  if public.is_admin() then raise exception 'AAL1 admin unexpectedly has admin authority'; end if;
  v_rejected := false;
  begin
    perform public.broadcast_order(v_order);
  exception when others then
    v_rejected := true;
  end;
  if not v_rejected then raise exception 'Unpaid order was broadcast'; end if;
  v_rejected := false;
  begin
    perform public.update_order_record_details(
      v_order,'Indonesia','Aceh','Lifecycle Village','Lifecycle Partner',
      array['Beneficiary One'],'Arabic dedication','Lifecycle dedication'
    );
  exception when others then
    v_rejected := true;
  end;
  if not v_rejected then raise exception 'AAL1 admin updated operational record details'; end if;

  -- Telegram issuer stores only the SHA-256 digest; the service webhook consumes it.
  perform set_config('request.jwt.claim.sub',v_customer::text,true);
  perform set_config('request.jwt.claim.role','authenticated',true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_customer,'role','authenticated','aal','aal1','amr',jsonb_build_array(jsonb_build_object('method','oauth')))::text,true);
  select token into v_link_token from public.create_telegram_link_token();
  select token_hash into v_link_hash
  from public.telegram_link_tokens where profile_id = v_customer and consumed_at is null;
  if exists (select 1 from public.telegram_link_tokens where token_hash = v_link_token) then
    raise exception 'Telegram plaintext token was stored';
  end if;

  perform set_config('request.jwt.claim.sub','',true);
  perform set_config('request.jwt.claim.role','service_role',true);
  perform set_config('request.jwt.claims','{"role":"service_role","aal":"aal2"}',true);
  if public.consume_telegram_link_token(v_link_hash,6500000000,6500000000,'lifecycle_test') <> v_customer then
    raise exception 'Telegram token did not link the expected customer';
  end if;

  update public.orders set payment_status = 'cancelled' where id = v_order;

  -- Cancelled provider attempts are retryable. The first checkout caller owns a
  -- two-minute reservation; the next caller waits.
  perform set_config('request.jwt.claim.sub',v_customer::text,true);
  perform set_config('request.jwt.claim.role','authenticated',true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_customer,'role','authenticated','aal','aal1','amr',jsonb_build_array(jsonb_build_object('method','oauth')))::text,true);
  v_prepared := public.prepare_hitpay_payment(v_order);
  if (v_prepared->>'should_create')::boolean is not true then raise exception 'First payment call did not reserve creation'; end if;
  if (select payment_status from public.orders where id = v_order) <> 'pending' then
    raise exception 'Cancelled payment was not reopened for checkout';
  end if;
  v_prepared := public.prepare_hitpay_payment(v_order);
  if (v_prepared->>'creating')::boolean is not true then raise exception 'Concurrent payment call did not observe reservation'; end if;

  perform set_config('request.jwt.claim.sub','',true);
  perform set_config('request.jwt.claim.role','service_role',true);
  perform set_config('request.jwt.claims','{"role":"service_role","aal":"aal2"}',true);
  perform public.record_hitpay_payment_request(
    v_order, 'hitpay-request-lifecycle-test', 'https://secure.test/checkout', now() + interval '30 minutes'
  );
  perform public.process_hitpay_webhook(
    repeat('a',64), 'payment_request.completed', 'payment_request',
    'hitpay-request-lifecycle-test', 'ASQ-LIFECYCLE-TEST', 'succeeded', 1000, 'SGD',
    '{"id":"hitpay-payment-lifecycle-test"}'::jsonb
  );
  if not exists (
    select 1 from public.orders where id = v_order and payment_status = 'paid' and fulfilment_status = 'ready'
  ) then raise exception 'Successful payment did not make order ready'; end if;

  -- Refunds reserve one exact ledger row, require started-work confirmation,
  -- and become financial truth only after the cumulative charge webhook.
  insert into public.orders (
    reference, customer_id, offering_id, service_type, category_slug,
    customer_name, customer_phone, customer_email, unit_amount, total_amount,
    commission_rate_snapshot, commission_amount, vendor_payout_amount,
    payment_provider, payment_status, fulfilment_status, beneficiary_country
  ) values (
    'ASQ-REFUND-TEST', v_customer, v_offering, 'korban', 'korban',
    'Lifecycle Customer', '+6500000000', 'lifecycle-customer@example.test', 1000, 1000,
    0.100, 100, 900, 'hitpay', 'paid', 'ready', 'Indonesia'
  ) returning id into v_refund_order;
  insert into public.payment_transactions (
    order_id,transaction_type,provider_request_id,provider_payment_id,
    amount,currency,status,payload_hash,provider_event_type,provider_event_at
  ) values (
    v_refund_order,'payment','hitpay-request-refund-test','hitpay-charge-refund-test',
    1000,'SGD','succeeded',repeat('d',64),'payment_request.completed',now()
  );

  perform set_config('request.jwt.claim.sub',v_admin::text,true);
  perform set_config('request.jwt.claim.role','authenticated',true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_admin,'role','authenticated','aal','aal2','amr',jsonb_build_array(jsonb_build_object('method','password'),jsonb_build_object('method','totp')))::text,true);
  v_refund_prepared := public.prepare_hitpay_refund(v_refund_order,200,'Customer requested a partial refund.',false);
  v_refund_transaction := (v_refund_prepared->>'transaction_id')::uuid;
  if v_refund_prepared->>'payment_id' <> 'hitpay-charge-refund-test'
    or (v_refund_prepared->>'refundable_amount')::integer <> 1000 then
    raise exception 'Refund reservation did not return the captured payment snapshot';
  end if;
  v_rejected := false;
  begin
    perform public.prepare_hitpay_refund(v_refund_order,100,'Concurrent refund must fail.',false);
  exception when others then v_rejected := true;
  end;
  if not v_rejected then raise exception 'A concurrent pending refund was accepted'; end if;

  perform set_config('request.jwt.claim.sub','',true);
  perform set_config('request.jwt.claim.role','service_role',true);
  perform set_config('request.jwt.claims','{"role":"service_role","aal":"aal2"}',true);
  if not public.record_hitpay_refund_result(
    v_refund_transaction,'hitpay-refund-partial',true,null,
    '{"id":"hitpay-refund-partial","status":"succeeded"}'::jsonb
  ) then raise exception 'Accepted refund response was not recorded'; end if;
  perform public.process_hitpay_webhook(
    repeat('e',64),'refund.updated','charge','hitpay-request-refund-test','ASQ-REFUND-TEST',
    'succeeded',200,'SGD','{"id":"hitpay-charge-refund-test","status":"partially_refunded","refunded_amount":2}'::jsonb
  );
  if (select payment_status from public.orders where id = v_refund_order) <> 'partially_refunded' then
    raise exception 'Partial refund webhook did not set partially_refunded';
  end if;

  perform set_config('request.jwt.claim.sub',v_admin::text,true);
  perform set_config('request.jwt.claim.role','authenticated',true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_admin,'role','authenticated','aal','aal2','amr',jsonb_build_array(jsonb_build_object('method','password'),jsonb_build_object('method','totp')))::text,true);
  v_rejected := false;
  begin
    perform public.prepare_hitpay_refund(v_refund_order,801,'Over-refund must fail.',false);
  exception when others then v_rejected := true;
  end;
  if not v_rejected then raise exception 'Refund above the outstanding amount was accepted'; end if;
  if public.broadcast_order(v_refund_order,6,now()+interval '7 days') <> 1 then
    raise exception 'Partially refunded order could not enter fulfilment';
  end if;
  perform set_config('request.jwt.claim.sub',v_vendor::text,true);
  perform set_config('request.jwt.claim.role','authenticated',true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_vendor,'role','authenticated','aal','aal1','amr',jsonb_build_array('password'))::text,true);
  if not public.claim_job(v_refund_order) or not public.mark_in_progress(v_refund_order) then
    raise exception 'Refund test order could not start fulfilment';
  end if;

  perform set_config('request.jwt.claim.sub',v_admin::text,true);
  perform set_config('request.jwt.claim.role','authenticated',true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_admin,'role','authenticated','aal','aal2','amr',jsonb_build_array(jsonb_build_object('method','password'),jsonb_build_object('method','totp')))::text,true);
  v_rejected := false;
  begin
    perform public.prepare_hitpay_refund(v_refund_order,800,'Started-work refund needs confirmation.',false);
  exception when others then v_rejected := true;
  end;
  if not v_rejected then raise exception 'Started fulfilment refund did not require confirmation'; end if;
  v_refund_prepared := public.prepare_hitpay_refund(v_refund_order,800,'Confirmed started-work refund.',true);
  v_refund_transaction := (v_refund_prepared->>'transaction_id')::uuid;

  perform set_config('request.jwt.claim.sub','',true);
  perform set_config('request.jwt.claim.role','service_role',true);
  perform set_config('request.jwt.claims','{"role":"service_role","aal":"aal2"}',true);
  if not public.record_hitpay_refund_result(
    v_refund_transaction,null,false,'Insufficient HitPay balance.','{"status":"failed"}'::jsonb
  ) then raise exception 'Refund provider failure was not recorded'; end if;

  perform set_config('request.jwt.claim.sub',v_admin::text,true);
  perform set_config('request.jwt.claim.role','authenticated',true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_admin,'role','authenticated','aal','aal2','amr',jsonb_build_array(jsonb_build_object('method','password'),jsonb_build_object('method','totp')))::text,true);
  v_refund_prepared := public.prepare_hitpay_refund(v_refund_order,800,'Retry confirmed refund.',true);
  v_refund_transaction := (v_refund_prepared->>'transaction_id')::uuid;
  perform set_config('request.jwt.claim.sub','',true);
  perform set_config('request.jwt.claim.role','service_role',true);
  perform set_config('request.jwt.claims','{"role":"service_role","aal":"aal2"}',true);
  perform public.record_hitpay_refund_result(
    v_refund_transaction,'hitpay-refund-final',true,null,
    '{"id":"hitpay-refund-final","status":"succeeded"}'::jsonb
  );
  perform public.process_hitpay_webhook(
    repeat('f',64),'refund.updated','charge','hitpay-request-refund-test','ASQ-REFUND-TEST',
    'succeeded',1000,'SGD','{"id":"hitpay-charge-refund-test","status":"refunded","refunded_amount":10}'::jsonb
  );
  if not exists (
    select 1 from public.orders
    where id = v_refund_order and payment_status = 'refunded' and fulfilment_status = 'in_progress'
  ) then raise exception 'Full refund did not preserve already-started fulfilment history'; end if;
  if (select count(*) from public.payment_transactions
      where order_id = v_refund_order and transaction_type = 'refund' and status = 'succeeded') <> 2
    or (select coalesce(sum(amount),0) from public.payment_transactions
        where order_id = v_refund_order and transaction_type = 'refund' and status = 'succeeded') <> 1000
    or (select count(*) from public.payment_transactions
        where order_id = v_refund_order and transaction_type = 'refund' and status = 'failed') <> 1 then
    raise exception 'Refund request history was overwritten or reconciled incorrectly';
  end if;

  -- Admin mutations require AAL2.
  perform set_config('request.jwt.claim.sub',v_admin::text,true);
  perform set_config('request.jwt.claim.role','authenticated',true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_admin,'role','authenticated','aal','aal2','amr',jsonb_build_array(jsonb_build_object('method','password'),jsonb_build_object('method','totp')))::text,true);
  if not public.is_admin() then raise exception 'AAL2 admin was not recognized'; end if;
  v_rejected := false;
  begin
    perform public.update_order_record_details(
      v_order,'Indonesia','Aceh','Lifecycle Village',repeat('x',201),
      array['Beneficiary One'],'Arabic dedication','Lifecycle dedication'
    );
  exception when others then v_rejected := true;
  end;
  if not v_rejected then raise exception 'Overlong operational record field was accepted'; end if;
  v_rejected := false;
  begin
    perform public.update_order_record_details(
      v_order,'Indonesia','Aceh','Lifecycle Village','Lifecycle Partner',
      array['Beneficiary One',''],'Arabic dedication','Lifecycle dedication'
    );
  exception when others then v_rejected := true;
  end;
  if not v_rejected then raise exception 'Invalid beneficiary array was accepted'; end if;
  if not public.update_order_record_details(
    v_order,' Indonesia ',' Aceh ',' Lifecycle Village ',' Lifecycle Partner ',
    array[' Beneficiary One ','Beneficiary Two'],' Arabic dedication ',' Lifecycle dedication '
  ) then raise exception 'Valid operational record details were rejected'; end if;
  if not exists (
    select 1 from public.orders
    where id = v_order
      and beneficiary_country = 'Indonesia'
      and partner_organisation = 'Lifecycle Partner'
      and beneficiary_names = array['Beneficiary One','Beneficiary Two']
      and dedication_remarks = 'Lifecycle dedication'
  ) or not exists (
    select 1 from public.order_events
    where order_id = v_order and event_type = 'order.record_details_updated'
      and previous_state->'beneficiary_names' = '[]'::jsonb
      and new_state->>'partner_organisation' = 'Lifecycle Partner'
  ) then raise exception 'Operational record details or immutable audit event were not saved'; end if;
  if public.broadcast_order(v_order,6,now()+interval '7 days') <> 1 then
    raise exception 'Expected one eligible vendor offer';
  end if;

  perform set_config('request.jwt.claim.sub',v_vendor::text,true);
  perform set_config('request.jwt.claim.role','authenticated',true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_vendor,'role','authenticated','aal','aal1','amr',jsonb_build_array('password'))::text,true);
  if not public.claim_job(v_order) then raise exception 'Eligible vendor could not claim'; end if;
  if not public.mark_in_progress(v_order) then raise exception 'Assigned vendor could not start work'; end if;

  -- Submit, revise, and resubmit immutable evidence versions.
  for v_version in 1..2 loop
    v_prefix := v_vendor::text || '/' || v_order::text || '/drafts/v' || v_version::text || '/';
    select jsonb_agg(jsonb_build_object('path',v_prefix || category || '-' || item_no || extension,'category',category))
    into v_items
    from (
      values
        ('before_photo',1,'.jpg'),('before_photo',2,'.jpg'),('before_photo',3,'.jpg'),
        ('during_photo',1,'.jpg'),('during_photo',2,'.jpg'),('during_photo',3,'.jpg'),
        ('after_photo',1,'.jpg'),('after_photo',2,'.jpg'),('after_photo',3,'.jpg'),
        ('before_video',1,'.mp4'),('during_video',1,'.mp4'),('after_video',1,'.mp4'),('dua_video',1,'.mp4')
    ) evidence(category,item_no,extension);

    insert into storage.objects(bucket_id,name,metadata)
    select
      'proofs', item->>'path',
      jsonb_build_object(
        'mimetype',case when item->>'category' like '%photo' then 'image/jpeg' else 'video/mp4' end,
        'size',case when item->>'category' like '%photo' then 1024 else 2048 end
      )
    from jsonb_array_elements(v_items) item;

    if v_version = 1 then
      v_rejected := false;
      begin
        perform public.submit_proof(
          v_order, v_items, 'Completed safely in clear weather.',
          'Indonesia', 'Aceh', 'Lifecycle Village', 'Community centre plot',
          5.550000, 95.320000, 'javascript:alert(1)'
        );
      exception when others then
        v_rejected := true;
      end;
      if not v_rejected then raise exception 'Unsafe project maps link was accepted'; end if;
    end if;

    if not public.submit_proof(
      v_order, v_items, 'Completed safely in clear weather.',
      'Indonesia', 'Aceh', 'Lifecycle Village', 'Community centre plot',
      5.550000, 95.320000, 'https://maps.example.test/lifecycle'
    ) then raise exception 'Evidence submission failed'; end if;

    perform set_config('request.jwt.claim.sub',v_admin::text,true);
    perform set_config('request.jwt.claim.role','authenticated',true);
    perform set_config('request.jwt.claims',jsonb_build_object('sub',v_admin,'role','authenticated','aal','aal2','amr',jsonb_build_array(jsonb_build_object('method','password'),jsonb_build_object('method','totp')))::text,true);
    if v_version = 1 then
      if not public.review_proof(v_order,false,'Replace the final photo.') then raise exception 'Revision review failed'; end if;
      perform set_config('request.jwt.claim.sub',v_vendor::text,true);
      perform set_config('request.jwt.claim.role','authenticated',true);
      perform set_config('request.jwt.claims',jsonb_build_object('sub',v_vendor,'role','authenticated','aal','aal1','amr',jsonb_build_array('password'))::text,true);
    else
      v_rejected := false;
      begin
        perform public.review_proof(v_order,true,'Unchecked approval must fail.');
      exception when others then v_rejected := true;
      end;
      if not v_rejected then raise exception 'Evidence was approved without the review checklist'; end if;
      if not public.review_proof(v_order,true,'All mandatory evidence verified.','{"location":true,"before_media":true,"during_media":true,"after_media":true,"dua_video":true,"nameplate_execution":true}'::jsonb) then raise exception 'Approval failed'; end if;
    end if;
  end loop;

  if (select count(*) from public.completion_submissions where order_id = v_order) <> 2 then
    raise exception 'Submission version history was not preserved';
  end if;
  if (select count(*) from public.proofs where order_id = v_order) <> 26 then
    raise exception 'Expected two complete 13-object evidence sets';
  end if;

  -- Generate/queue as the trusted worker, then require both provider results.
  perform set_config('request.jwt.claim.sub','',true);
  perform set_config('request.jwt.claim.role','service_role',true);
  perform set_config('request.jwt.claims','{"role":"service_role","aal":"aal2"}',true);
  insert into public.completion_reports(order_id,submission_id,kind,version,storage_path,checksum)
  select v_order,id,'customer',1,v_order::text || '/customer-v1.pdf',repeat('b',64)
  from public.completion_submissions where order_id = v_order and status = 'approved'
  returning id into v_report;
  perform set_config('request.jwt.claim.sub',v_admin::text,true);
  perform set_config('request.jwt.claim.role','authenticated',true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_admin,'role','authenticated','aal','aal2','amr',jsonb_build_array(jsonb_build_object('method','password'),jsonb_build_object('method','totp')))::text,true);
  v_rejected := false;
  begin
    perform public.update_order_record_details(
      v_order,'Indonesia','Aceh','Another Village','Lifecycle Partner',
      array['Beneficiary One'],'Arabic dedication','Late correction'
    );
  exception when others then v_rejected := true;
  end;
  if not v_rejected then raise exception 'Report-backed operational record details were changed'; end if;
  perform set_config('request.jwt.claim.sub','',true);
  perform set_config('request.jwt.claim.role','service_role',true);
  perform set_config('request.jwt.claims','{"role":"service_role","aal":"aal2"}',true);
  if public.queue_order_notifications(v_order,v_report) <> 2 then raise exception 'Both delivery channels were not queued'; end if;
  perform * from public.claim_due_notification_deliveries(10);
  select id into v_email_delivery from public.notification_deliveries
  where order_id = v_order and channel = 'email' and attempt = 1;
  select id into v_telegram_delivery from public.notification_deliveries
  where order_id = v_order and channel = 'telegram' and attempt = 1;
  perform public.record_notification_attempt(v_email_delivery,'failed',null,'provider_error','Lifecycle test failure');
  perform public.record_notification_attempt(v_telegram_delivery,'sent','telegram-lifecycle-test');

  perform set_config('request.jwt.claim.sub',v_admin::text,true);
  perform set_config('request.jwt.claim.role','authenticated',true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_admin,'role','authenticated','aal','aal1','amr',jsonb_build_array('password'))::text,true);
  v_rejected := false;
  begin
    perform public.retry_notification_delivery(v_email_delivery);
  exception when others then
    v_rejected := true;
  end;
  if not v_rejected then raise exception 'AAL1 admin retried a failed notification'; end if;

  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_admin,'role','authenticated','aal','aal2','amr',jsonb_build_array(jsonb_build_object('method','password'),jsonb_build_object('method','totp')))::text,true);
  v_email_retry := public.retry_notification_delivery(v_email_delivery);
  if not exists (
    select 1 from public.notification_deliveries
    where id = v_email_delivery and status = 'failed' and attempt = 1
  ) or not exists (
    select 1 from public.notification_deliveries
    where id = v_email_retry and status = 'queued' and attempt = 2
  ) then raise exception 'Manual retry did not preserve the failed attempt and queue a new one'; end if;
  if not exists (
    select 1 from public.order_events
    where order_id = v_order and event_type = 'notification.email.manual_retry_queued'
      and metadata->>'failed_delivery_id' = v_email_delivery::text
      and metadata->>'retry_delivery_id' = v_email_retry::text
  ) then raise exception 'Manual notification retry audit event is missing'; end if;

  perform set_config('request.jwt.claim.sub','',true);
  perform set_config('request.jwt.claim.role','service_role',true);
  perform set_config('request.jwt.claims','{"role":"service_role","aal":"aal2"}',true);
  perform * from public.claim_due_notification_deliveries(10);
  perform public.record_notification_attempt(v_email_retry,'sent','brevo-lifecycle-retry-test');
  if (select delivery_status from public.orders where id = v_order) <> 'partial' then
    raise exception 'Telegram sent should be partial until Brevo confirms delivery';
  end if;
  perform public.process_brevo_webhook(
    'brevo-lifecycle-retry-test','delivered',repeat('c',64),now(),'{"event":"delivered"}'::jsonb
  );
  if not exists (
    select 1 from public.orders where id = v_order and delivery_status = 'delivered' and status = 'completed'
  ) then raise exception 'Dual-channel success did not complete the customer workflow'; end if;
  insert into public.notification_deliveries(order_id,report_id,channel,recipient,attempt,status,next_retry_at)
  values (v_order,v_report,'email','lifecycle-customer@example.test',3,'queued',now());
  perform public.record_notification_attempt(v_email_retry,'delivered','brevo-lifecycle-retry-test');
  if not exists (
    select 1 from public.notification_deliveries
    where order_id = v_order and channel = 'email' and attempt = 3 and status = 'superseded'
  ) then raise exception 'A queued retry survived a successful delivery'; end if;
  if exists (
    select 1 from public.claim_due_notification_deliveries(10)
    where order_id = v_order and channel = 'email'
  ) then raise exception 'A successful channel was claimed for duplicate delivery'; end if;

  -- Vendor settlement is independent and is the final closure gate.
  perform set_config('request.jwt.claim.sub',v_admin::text,true);
  perform set_config('request.jwt.claim.role','authenticated',true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_admin,'role','authenticated','aal','aal2','amr',jsonb_build_array(jsonb_build_object('method','password'),jsonb_build_object('method','totp')))::text,true);
  v_rejected := false;
  begin
    perform public.retry_notification_delivery(v_email_retry);
  exception when others then
    v_rejected := true;
  end;
  if not v_rejected or (select status from public.notification_deliveries where id = v_email_retry) <> 'delivered' then
    raise exception 'A delivered notification was changed or retried';
  end if;
  perform public.record_vendor_payment(
    v_vendor,v_order,900,current_date,'bank_transfer','LIFECYCLE-PAYOUT-1','Test settlement'
  );
  if not exists (
    select 1 from public.orders
    where id = v_order and settlement_status = 'paid' and status = 'closed' and closed_at is not null
  ) then raise exception 'Full vendor settlement did not close the order'; end if;

  v_rejected := false;
  begin
    perform public.record_vendor_payment(
      v_vendor,v_order,1,current_date,'bank_transfer','LIFECYCLE-OVERPAY','Must fail'
    );
  exception when others then
    v_rejected := true;
  end;
  if not v_rejected then raise exception 'Vendor overpayment was accepted'; end if;

  if exists (select 1 from public.lifecycle_consistency_issues() where order_id = v_order) then
    raise exception 'Completed lifecycle has a consistency issue';
  end if;
  if not exists (
    select 1 from public.order_events where order_id = v_order and event_type = 'vendor.accepted'
  ) then raise exception 'Lifecycle audit event is missing'; end if;

  perform set_config('request.jwt.claim.sub',v_customer::text,true);
  perform set_config('request.jwt.claim.role','authenticated',true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_customer,'role','authenticated','aal','aal1','amr',jsonb_build_array(jsonb_build_object('method','oauth')))::text,true);
  if not exists (
    select 1 from public.customer_order_events where order_id = v_order and event_type = 'vendor.accepted'
  ) then raise exception 'Customer-safe timeline did not expose the accepted milestone'; end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'customer_order_events'
      and column_name in ('metadata','previous_state','new_state','actor_id')
  ) then raise exception 'Customer timeline exposes internal audit fields'; end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'customer_completion_evidence'
      and column_name in ('storage_path','uploaded_by','caption')
  ) then raise exception 'Customer evidence view exposes internal Storage/vendor fields'; end if;

  if has_function_privilege('authenticated','public.complete_order(uuid)','execute') then
    raise exception 'Legacy complete_order remains executable by authenticated users';
  end if;
  if has_function_privilege('authenticated','public.record_customer_delivery(uuid,text,boolean)','execute') then
    raise exception 'Manual delivery RPC remains executable by authenticated users';
  end if;
end;
$$;

rollback;
