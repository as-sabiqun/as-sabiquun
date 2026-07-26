-- Run after migrations. Fixtures and recovered attempts are rolled back.

begin;

do $$
declare
  v_customer constant uuid := '12000000-0000-4000-8000-000000000001';
  v_vendor constant uuid := '12000000-0000-4000-8000-000000000002';
  v_admin constant uuid := '12000000-0000-4000-8000-000000000003';
  v_offering uuid;
  v_order uuid;
  v_submission uuid;
  v_report uuid;
  v_stale uuid;
  v_fresh uuid;
  v_rejected boolean := false;
begin
  insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data,raw_app_meta_data)
  values
    (v_customer,'recovery-customer@example.test',now(),'{}','{"provider":"google","providers":["google"]}'),
    (v_vendor,'recovery-vendor@example.test',now(),'{}','{"provider":"email","providers":["email"]}'),
    (v_admin,'recovery-admin@example.test',now(),'{}','{"provider":"email","providers":["email"]}');
  perform set_config('request.jwt.claim.sub','',true);
  perform set_config('request.jwt.claim.role','service_role',true);
  perform set_config('request.jwt.claims','{"role":"service_role","aal":"aal2"}',true);
  update public.profiles set role = 'vendor', vendor_onboarding_status = 'approved' where id = v_vendor;
  update public.profiles set role = 'admin' where id = v_admin;
  select id into v_offering from public.offerings where slug = 'korban-share';

  insert into public.orders (
    reference, customer_id, offering_id, service_type, category_slug,
    customer_name, customer_phone, customer_email, unit_amount, total_amount,
    commission_rate_snapshot, commission_amount, vendor_payout_amount,
    payment_status, fulfilment_status, assigned_vendor_id
  ) values (
    'ASQ-NOTIFICATION-RECOVERY',v_customer,v_offering,'korban','korban',
    'Recovery Customer','+6500000012','recovery-customer@example.test',1000,1000,
    0.100,100,900,'paid','verified',v_vendor
  ) returning id into v_order;

  insert into public.completion_submissions (
    order_id,vendor_id,version,status,project_country,project_state,project_village,
    project_address,project_lat,project_lng,vendor_remarks,reviewed_by,reviewed_at
  ) values (
    v_order,v_vendor,1,'approved','Indonesia','Aceh','Recovery Village',
    'Recovery site',5.5,95.3,'Completed',v_admin,now()
  ) returning id into v_submission;

  perform set_config('request.jwt.claim.sub','',true);
  perform set_config('request.jwt.claim.role','service_role',true);
  perform set_config('request.jwt.claims','{"role":"service_role","aal":"aal2"}',true);
  insert into public.completion_reports(order_id,submission_id,kind,version,storage_path,checksum)
  values (v_order,v_submission,'customer',1,v_order::text || '/recovery.pdf',repeat('a',64))
  returning id into v_report;
  insert into public.notification_deliveries(
    order_id,report_id,channel,recipient,attempt,status,attempted_at
  ) values (v_order,v_report,'email','recovery-customer@example.test',1,'sending',now()-interval '16 minutes')
  returning id into v_stale;
  insert into public.notification_deliveries(
    order_id,report_id,channel,recipient,attempt,status,attempted_at
  ) values (v_order,v_report,'telegram','6500000012',1,'sending',now()-interval '14 minutes')
  returning id into v_fresh;

  perform set_config('request.jwt.claim.sub',v_admin::text,true);
  perform set_config('request.jwt.claim.role','authenticated',true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_admin,'role','authenticated','aal','aal2','amr',jsonb_build_array(jsonb_build_object('method','password'),jsonb_build_object('method','totp')))::text,true);
  begin
    perform public.recover_stale_notification_deliveries(10);
  exception when others then v_rejected := true;
  end;
  if not v_rejected then raise exception 'Admin session recovered service-owned notification attempts'; end if;

  perform set_config('request.jwt.claim.sub','',true);
  perform set_config('request.jwt.claim.role','service_role',true);
  perform set_config('request.jwt.claims','{"role":"service_role","aal":"aal2"}',true);
  if public.recover_stale_notification_deliveries(10) <> 1 then
    raise exception 'Expected exactly one stale attempt to be recovered';
  end if;
  if not exists (
    select 1 from public.notification_deliveries
    where id = v_stale and status = 'deferred' and error_code = 'worker_timeout'
  ) or not exists (
    select 1 from public.notification_deliveries
    where order_id = v_order and channel = 'email' and attempt = 2 and status = 'queued'
      and next_retry_at > now()
  ) or not exists (
    select 1 from public.notification_deliveries where id = v_fresh and status = 'sending'
  ) or not exists (
    select 1 from public.order_events
    where order_id = v_order and event_type = 'notification.email.deferred'
      and metadata->>'delivery_id' = v_stale::text
  ) then raise exception 'Stale recovery did not preserve retry, threshold, or audit semantics'; end if;
end;
$$;

rollback;
