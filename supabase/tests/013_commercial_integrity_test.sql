begin;

do $$
declare
  v_customer constant uuid := '13000000-0000-4000-8000-000000000001';
  v_vendor constant uuid := '13000000-0000-4000-8000-000000000002';
  v_admin constant uuid := '13000000-0000-4000-8000-000000000003';
  v_offering uuid;
  v_order uuid;
  v_verified_order uuid;
  v_rejected boolean;
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'customer_orders' and column_name = 'is_test'
  ) then raise exception 'Customer order view is missing the safe test marker'; end if;
  insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data,raw_app_meta_data)
  values
    (v_customer,'commercial-customer@example.test',now(),'{}','{"provider":"google","providers":["google"]}'),
    (v_vendor,'commercial-vendor@example.test',now(),'{}','{"provider":"email","providers":["email"]}'),
    (v_admin,'commercial-admin@example.test',now(),'{}','{"provider":"email","providers":["email"]}');

  perform set_config('request.jwt.claim.sub','',true);
  perform set_config('request.jwt.claim.role','service_role',true);
  perform set_config('request.jwt.claims','{"role":"service_role","aal":"aal2"}',true);
  update public.profiles set role = 'admin', status = 'active' where id = v_admin;
  update public.profiles
  set role = 'vendor', status = 'active', vendor_onboarding_status = 'approved',
      services = array['korban'], country = 'Malaysia'
  where id = v_vendor;
  select id into v_offering from public.offerings where slug = 'korban-share';

  insert into public.orders(
    reference, customer_id, offering_id, service_type, category_slug,
    customer_name, customer_phone, customer_email, unit_amount, total_amount,
    commission_rate_snapshot, commission_amount, vendor_payout_amount,
    payment_status, fulfilment_status, completion_deadline
  ) values (
    'ASQ-COMMERCIAL-1',v_customer,v_offering,'korban','korban',
    'Commercial Customer','+6500000000','commercial-customer@example.test',28000,28000,
    0.1,2800,25200,'paid','ready',now()+interval '7 days'
  ) returning id into v_order;

  if not exists (
    select 1 from public.orders o join public.offerings f on f.id = o.offering_id
    where o.id = v_order and o.offering_title = f.title and o.offering_detail = f.detail
  ) then raise exception 'Order did not capture its offering snapshot'; end if;

  v_rejected := false;
  begin
    update public.orders set offering_title = 'Changed later' where id = v_order;
  exception when others then v_rejected := true;
  end;
  if not v_rejected then raise exception 'Commercial snapshot was editable'; end if;

  perform set_config('request.jwt.claim.sub',v_admin::text,true);
  perform set_config('request.jwt.claim.role','authenticated',true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_admin,'role','authenticated','aal','aal2','amr',jsonb_build_array(jsonb_build_object('method','password'),jsonb_build_object('method','totp')))::text,true);
  v_rejected := false;
  begin
    perform public.broadcast_order(v_order);
  exception when others then v_rejected := position('beneficiary country' in lower(sqlerrm)) > 0;
  end;
  if not v_rejected then raise exception 'Dispatch without a beneficiary country was accepted'; end if;

  perform set_config('request.jwt.claim.sub','',true);
  perform set_config('request.jwt.claim.role','service_role',true);
  perform set_config('request.jwt.claims','{"role":"service_role","aal":"aal2"}',true);
  update public.orders set beneficiary_country = 'Indonesia' where id = v_order;
  perform set_config('request.jwt.claim.sub',v_admin::text,true);
  perform set_config('request.jwt.claim.role','authenticated',true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_admin,'role','authenticated','aal','aal2','amr',jsonb_build_array(jsonb_build_object('method','password'),jsonb_build_object('method','totp')))::text,true);
  if public.broadcast_order(v_order) <> 0 then raise exception 'Regional dispatch offered the job to the wrong country'; end if;
  if not exists (select 1 from public.orders where id = v_order and fulfilment_status = 'ready' and broadcast_started_at is not null) then
    raise exception 'Zero-recipient dispatch did not remain safely unclaimed';
  end if;

  perform set_config('request.jwt.claim.sub','',true);
  perform set_config('request.jwt.claim.role','service_role',true);
  perform set_config('request.jwt.claims','{"role":"service_role","aal":"aal2"}',true);
  update public.profiles set country = 'Indonesia' where id = v_vendor;
  perform set_config('request.jwt.claim.sub',v_admin::text,true);
  perform set_config('request.jwt.claim.role','authenticated',true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_admin,'role','authenticated','aal','aal2','amr',jsonb_build_array(jsonb_build_object('method','password'),jsonb_build_object('method','totp')))::text,true);
  if public.broadcast_order(v_order) <> 1 then raise exception 'Matching regional vendor did not receive the offer'; end if;

  perform set_config('request.jwt.claim.sub','',true);
  perform set_config('request.jwt.claim.role','service_role',true);
  perform set_config('request.jwt.claims','{"role":"service_role","aal":"aal2"}',true);
  update public.orders set fulfilment_status = 'in_progress', assigned_vendor_id = v_vendor where id = v_order;
  insert into storage.objects(bucket_id,name,metadata) values
    ('proofs',v_vendor::text || '/' || v_order::text || '/drafts/before_photo/draft.jpg','{"mimetype":"image/jpeg","size":"100"}'),
    ('proofs',v_vendor::text || '/' || v_order::text || '/drafts/before_photo/submitted.jpg','{"mimetype":"image/jpeg","size":"100"}');
  insert into public.proofs(order_id,uploaded_by,storage_path,media_type,category)
  values (v_order,v_vendor,v_vendor::text || '/' || v_order::text || '/drafts/before_photo/submitted.jpg','photo','before_photo');

  perform set_config('request.jwt.claim.sub',v_vendor::text,true);
  perform set_config('request.jwt.claim.role','authenticated',true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_vendor,'role','authenticated','aal','aal1','amr',jsonb_build_array('password'))::text,true);
  if (select count(*) from public.list_vendor_proof_drafts(v_order)) <> 1 then
    raise exception 'Vendor draft listing did not exclude submitted evidence';
  end if;

  perform set_config('request.jwt.claim.sub',v_customer::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_customer,'role','authenticated','aal','aal1','amr',jsonb_build_array(jsonb_build_object('method','oauth')))::text,true);
  if exists (select 1 from public.list_vendor_proof_drafts(v_order)) then
    raise exception 'Customer read vendor proof drafts';
  end if;

  perform set_config('request.jwt.claim.sub','',true);
  perform set_config('request.jwt.claim.role','service_role',true);
  perform set_config('request.jwt.claims','{"role":"service_role","aal":"aal2"}',true);
  update public.orders set payment_status = 'refunded' where id = v_order;
  perform set_config('request.jwt.claim.sub',v_admin::text,true);
  perform set_config('request.jwt.claim.role','authenticated',true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_admin,'role','authenticated','aal','aal2','amr',jsonb_build_array(jsonb_build_object('method','password'),jsonb_build_object('method','totp')))::text,true);
  if public.resolve_refunded_fulfilment(v_order,'Customer refund confirmed; stop remaining work.') <> 'cancelled_work' then
    raise exception 'Active refunded work was not cancelled explicitly';
  end if;
  if exists (select 1 from public.lifecycle_consistency_issues() where order_id = v_order and issue like 'fully refunded%') then
    raise exception 'Resolved refund remained a consistency issue';
  end if;

  perform set_config('request.jwt.claim.sub','',true);
  perform set_config('request.jwt.claim.role','service_role',true);
  perform set_config('request.jwt.claims','{"role":"service_role","aal":"aal2"}',true);
  insert into public.orders(
    reference, customer_id, offering_id, service_type, category_slug,
    customer_name, customer_phone, customer_email, unit_amount, total_amount,
    commission_rate_snapshot, commission_amount, vendor_payout_amount,
    payment_status, fulfilment_status, assigned_vendor_id
  ) values (
    'ASQ-COMMERCIAL-2',v_customer,v_offering,'korban','korban',
    'Commercial Customer','+6500000000','commercial-customer@example.test',1000,1000,
    0.1,100,900,'paid','verified',v_vendor
  ) returning id into v_verified_order;
  perform set_config('request.jwt.claim.sub',v_admin::text,true);
  perform set_config('request.jwt.claim.role','authenticated',true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_admin,'role','authenticated','aal','aal2','amr',jsonb_build_array(jsonb_build_object('method','password'),jsonb_build_object('method','totp')))::text,true);
  perform public.record_vendor_payment(v_vendor,v_verified_order,100,current_date,'bank','Case-Safe-Reference','first');
  v_rejected := false;
  begin
    perform public.record_vendor_payment(v_vendor,v_verified_order,100,current_date,'bank',' case-safe-reference ','duplicate');
  exception when unique_violation then v_rejected := true;
    when others then v_rejected := position('reference' in lower(sqlerrm)) > 0;
  end;
  if not v_rejected then raise exception 'Case-insensitive duplicate vendor payment reference was accepted'; end if;

  perform set_config('request.jwt.claim.sub','',true);
  perform set_config('request.jwt.claim.role','service_role',true);
  perform set_config('request.jwt.claims','{"role":"service_role","aal":"aal2"}',true);
  if not public.consume_rate_limit('checkout',repeat('a',64),1,60) then
    raise exception 'First rate-limited request was rejected';
  end if;
  if public.consume_rate_limit('checkout',repeat('a',64),1,60) then
    raise exception 'Rate limit did not reject the excess request';
  end if;
  perform public.record_integration_failure('hitpay','invalid_signature','Test signature rejection.',repeat('c',64));
  if not exists (select 1 from public.integration_failures where provider = 'hitpay' and failure_kind = 'invalid_signature') then
    raise exception 'Integration failure was not recorded';
  end if;

  perform set_config('request.jwt.claim.sub',v_admin::text,true);
  perform set_config('request.jwt.claim.role','authenticated',true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_admin,'role','authenticated','aal','aal2','amr',jsonb_build_array(jsonb_build_object('method','password'),jsonb_build_object('method','totp')))::text,true);
  v_rejected := false;
  begin
    perform public.consume_rate_limit('checkout',repeat('b',64),1,60);
  exception when others then v_rejected := true;
  end;
  if not v_rejected then raise exception 'Authenticated caller accessed the server-only rate limiter'; end if;
  v_rejected := false;
  begin
    perform public.record_integration_failure('hitpay','invalid_signature','Must fail.',null);
  exception when others then v_rejected := true;
  end;
  if not v_rejected then raise exception 'Authenticated caller recorded an integration failure'; end if;
  if public.production_cron_health() is null then raise exception 'Cron health did not return a status object'; end if;
end;
$$;

rollback;
