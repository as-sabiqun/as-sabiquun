-- Run after all migrations with a privileged local test connection.
-- Every fixture is rolled back.

begin;

insert into auth.users(id,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data)
values
  ('20000000-0000-4000-8000-000000000001','boundary-customer@example.test',now(),'{"provider":"google","providers":["google"]}','{"full_name":"Boundary Customer"}'),
  ('20000000-0000-4000-8000-000000000002','boundary-other@example.test',now(),'{"provider":"google","providers":["google"]}','{"full_name":"Other Customer"}'),
  ('20000000-0000-4000-8000-000000000003','boundary-password@example.test',now(),'{"provider":"email","providers":["email"]}','{"full_name":"Password Customer"}'),
  ('20000000-0000-4000-8000-000000000004','boundary-unverified@example.test',null,'{"provider":"google","providers":["google"]}','{"full_name":"Unverified Customer"}'),
  ('20000000-0000-4000-8000-000000000005','boundary-vendor@example.test',now(),'{"provider":"email","providers":["email"]}','{"full_name":"Boundary Vendor"}'),
  ('20000000-0000-4000-8000-000000000006','boundary-admin@example.test',now(),'{"provider":"email","providers":["email"]}','{"full_name":"Boundary Admin"}');

select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claim.role','service_role',true);
select set_config('request.jwt.claims','{"role":"service_role","aal":"aal2"}',true);
update public.profiles
set role = 'vendor', status = 'active', vendor_onboarding_status = 'approved', services = array['korban']
where id = '20000000-0000-4000-8000-000000000005';
update public.profiles
set role = 'admin', status = 'active'
where id = '20000000-0000-4000-8000-000000000006';

insert into public.orders (
  id, reference, customer_id, offering_id, service_type, category_slug,
  customer_name, customer_phone, customer_email,
  unit_amount, total_amount, commission_rate_snapshot, commission_amount, vendor_payout_amount,
  payment_provider, payment_status, fulfilment_status, delivery_status, settlement_status,
  status, assigned_vendor_id, accepted_at
)
select
  '21000000-0000-4000-8000-000000000001', 'ASQ-BOUNDARY-ASSIGNED',
  '20000000-0000-4000-8000-000000000001', f.id, f.service_type, f.category_slug,
  'Boundary Customer', '+6500000001', 'boundary-customer@example.test',
  28000, 28000, 0.100, 2800, 25200,
  'hitpay', 'paid', 'verified', 'queued', 'unpaid',
  'verified', '20000000-0000-4000-8000-000000000005', now()
from public.offerings f where f.slug = 'korban-share';

insert into public.orders (
  id, reference, customer_id, offering_id, service_type, category_slug,
  customer_name, customer_phone, customer_email,
  unit_amount, total_amount, commission_rate_snapshot, commission_amount, vendor_payout_amount,
  payment_provider, payment_status, fulfilment_status, delivery_status, settlement_status,
  status, broadcast_started_at, broadcast_expires_at
)
select
  '21000000-0000-4000-8000-000000000002', 'ASQ-BOUNDARY-OFFER',
  '20000000-0000-4000-8000-000000000001', f.id, f.service_type, f.category_slug,
  'Boundary Customer', '+6500000001', 'boundary-customer@example.test',
  28000, 28000, 0.100, 2800, 25200,
  'hitpay', 'paid', 'broadcasting', 'not_ready', 'unpaid',
  'broadcasting', now(), now() + interval '24 hours'
from public.offerings f where f.slug = 'korban-share';

insert into public.orders (
  id, reference, customer_id, offering_id, service_type, category_slug,
  customer_name, customer_phone, customer_email,
  unit_amount, total_amount, commission_rate_snapshot, commission_amount, vendor_payout_amount,
  payment_provider, payment_status, fulfilment_status, delivery_status, settlement_status, status
)
select
  '21000000-0000-4000-8000-000000000003', 'ASQ-BOUNDARY-OTHER',
  '20000000-0000-4000-8000-000000000002', f.id, f.service_type, f.category_slug,
  'Other Customer', '+6500000002', 'boundary-other@example.test',
  28000, 28000, 0.100, 2800, 25200,
  'hitpay', 'paid', 'ready', 'not_ready', 'unpaid', 'submitted'
from public.offerings f where f.slug = 'korban-share';

insert into public.job_offers(id,order_id,vendor_id,expires_at)
values (
  '22000000-0000-4000-8000-000000000001',
  '21000000-0000-4000-8000-000000000002',
  '20000000-0000-4000-8000-000000000005',
  now() + interval '24 hours'
);

insert into public.completion_submissions (
  id, order_id, vendor_id, version, status,
  project_country, project_state, project_village, project_address,
  project_lat, project_lng, vendor_remarks, reviewed_by, reviewed_at
) values (
  '23000000-0000-4000-8000-000000000001',
  '21000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000005', 1, 'approved',
  'Indonesia', 'Aceh', 'Boundary Village', 'Boundary project address',
  5.550000, 95.320000, 'Completed for the boundary test.',
  '20000000-0000-4000-8000-000000000006', now()
);

insert into public.completion_reports (
  id, order_id, submission_id, kind, version, storage_path, checksum, generated_by
) values (
  '24000000-0000-4000-8000-000000000001',
  '21000000-0000-4000-8000-000000000001',
  '23000000-0000-4000-8000-000000000001',
  'customer', 1, '21000000-0000-4000-8000-000000000001/customer-report.pdf', repeat('a',64),
  '20000000-0000-4000-8000-000000000006'
);

insert into public.notification_deliveries (
  id, order_id, report_id, channel, recipient, attempt, status, sent_at, delivered_at
) values (
  '25000000-0000-4000-8000-000000000001',
  '21000000-0000-4000-8000-000000000001',
  '24000000-0000-4000-8000-000000000001',
  'email', 'boundary-customer@example.test', 1, 'delivered', now(), now()
);

-- The public portal contracts themselves must not contain sensitive columns.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'customer_orders'
      and column_name in ('customer_id','assigned_vendor_id','vendor_payout_amount','commission_amount','payment_reference','checkout_token','admin_verification_notes')
  ) then raise exception 'customer_orders exposes an internal column'; end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'customer_completion_report_metadata'
      and column_name in ('storage_path','checksum','submission_id','generated_by','kind')
  ) then raise exception 'customer report metadata exposes a private column'; end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'customer_notification_deliveries'
      and column_name in ('recipient','provider_message_id','provider_payload','payload_hash','error_code','error_message','next_retry_at')
  ) then raise exception 'customer notification metadata exposes provider internals'; end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'vendor_job_offers'
      and column_name in ('customer_name','customer_phone','customer_email','participant_names','dedication','total_amount','commission_amount')
  ) then raise exception 'vendor offer view exposes customer or commercial data'; end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'vendor_assigned_orders'
      and column_name in ('customer_email','total_amount','commission_amount','payment_reference','checkout_token')
  ) then raise exception 'vendor assigned-order view exposes unnecessary commercial data'; end if;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1","amr":["password"]}',true);
do $$
begin
  if public.is_customer() then raise exception 'Google-linked customer used a password session'; end if;
end;
$$;
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1","amr":[{"method":"oauth","timestamp":1720000000}]}',true);
do $$
begin
  if not public.is_customer() then raise exception 'confirmed Google customer was rejected'; end if;
  if (select count(*) from public.orders) <> 0 then raise exception 'customer read base orders'; end if;
  if (select count(*) from public.completion_reports) <> 0 then raise exception 'customer read base completion reports'; end if;
  if (select count(*) from public.notification_deliveries) <> 0 then raise exception 'customer read base notification deliveries'; end if;
  if (select count(*) from public.customer_orders) <> 2 then raise exception 'customer order view did not scope ownership'; end if;
  if (select count(*) from public.customer_completion_report_metadata) <> 1 then raise exception 'customer report metadata view failed'; end if;
  if (select count(*) from public.customer_notification_deliveries) <> 1 then raise exception 'customer notification view failed'; end if;
end;
$$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal1","amr":[{"method":"oauth"}]}',true);
do $$
begin
  if (select count(*) from public.customer_orders) <> 1 then raise exception 'customer order view crossed account boundaries'; end if;
  if exists (select 1 from public.customer_completion_report_metadata) then raise exception 'customer read another account report'; end if;
  if exists (select 1 from public.customer_notification_deliveries) then raise exception 'customer read another account notification'; end if;
end;
$$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000003',true);
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000003","role":"authenticated","aal":"aal1","amr":["password"]}',true);
do $$
begin
  if public.is_customer() then raise exception 'password customer passed Google-only authorization'; end if;
  if exists (select 1 from public.customer_orders) then raise exception 'password customer read customer_orders'; end if;
end;
$$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000004',true);
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000004","role":"authenticated","aal":"aal1","amr":[{"method":"oauth"}]}',true);
do $$
begin
  if public.is_customer() then raise exception 'unverified Google customer passed authorization'; end if;
  if exists (select 1 from public.customer_orders) then raise exception 'unverified customer read customer_orders'; end if;
end;
$$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000005',true);
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000005","role":"authenticated","aal":"aal1","amr":[{"method":"oauth"}]}',true);
do $$
begin
  if public.is_vendor() then raise exception 'vendor used an OAuth session'; end if;
end;
$$;
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000005","role":"authenticated","aal":"aal1","amr":["password"]}',true);
do $$
begin
  if not public.is_vendor() then raise exception 'password vendor was rejected'; end if;
  if (select count(*) from public.orders) <> 0 then raise exception 'vendor read base orders'; end if;
  if (select count(*) from public.job_offers) <> 0 then raise exception 'vendor read base job offers'; end if;
  if (select count(*) from public.vendor_assigned_orders) <> 1 then raise exception 'vendor assigned-order view failed'; end if;
  if (select count(*) from public.vendor_job_offers) <> 1 then raise exception 'vendor offer view failed'; end if;
end;
$$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000006',true);
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000006","role":"authenticated","aal":"aal1","amr":["password"]}',true);
do $$
begin
  if public.is_admin() then raise exception 'AAL1 admin unexpectedly authorized'; end if;
  if exists (select 1 from public.orders) then raise exception 'AAL1 admin read base orders'; end if;
end;
$$;

select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000006","role":"authenticated","aal":"aal2","amr":[{"method":"oauth"},{"method":"totp"}]}',true);
do $$
begin
  if public.is_admin() then raise exception 'AAL2 admin used OAuth plus TOTP without password'; end if;
end;
$$;
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000006","role":"authenticated","aal":"aal2","amr":[{"method":"password"},{"method":"totp"}]}',true);
do $$
begin
  if not public.is_admin() then raise exception 'AAL2 admin was rejected'; end if;
  if (select count(*) from public.orders) <> 3 then raise exception 'AAL2 admin could not read orders'; end if;
  if (select count(*) from public.completion_reports) <> 1 then raise exception 'AAL2 admin could not read completion reports'; end if;
  if (select count(*) from public.notification_deliveries) <> 1 then raise exception 'AAL2 admin could not read notification deliveries'; end if;
end;
$$;
reset role;

set local role service_role;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claim.role','service_role',true);
select set_config('request.jwt.claims','{"role":"service_role","aal":"aal2"}',true);
do $$
begin
  if (select count(*) from public.orders) <> 3 then raise exception 'service role could not read orders'; end if;
  if (select count(*) from public.completion_reports) <> 1 then raise exception 'service role could not read completion reports'; end if;
end;
$$;
reset role;

rollback;
