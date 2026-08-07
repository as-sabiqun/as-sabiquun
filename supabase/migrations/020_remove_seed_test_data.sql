-- One-time production cleanup for the exact dashboard, smoke, and E2E records
-- created during development. It intentionally cannot match future orders.

begin;

do $$
declare
  v_order_ids constant uuid[] := array[
    'd4500000-0000-4000-8000-000000000001'::uuid,
    'd4500000-0000-4000-8000-000000000002'::uuid,
    'd4500000-0000-4000-8000-000000000003'::uuid,
    'd4500000-0000-4000-8000-000000000004'::uuid,
    'd4500000-0000-4000-8000-000000000005'::uuid,
    'd4500000-0000-4000-8000-000000000006'::uuid,
    'd4500000-0000-4000-8000-000000000007'::uuid,
    'd4500000-0000-4000-8000-000000000008'::uuid,
    'd4500000-0000-4000-8000-000000000009'::uuid,
    'd4500000-0000-4000-8000-000000000010'::uuid,
    'd4500000-0000-4000-8000-000000000011'::uuid,
    'd4500000-0000-4000-8000-000000000012'::uuid,
    '611d4d1b-3256-4a53-a4ba-5f9242f1a0b0'::uuid,
    '079afe4d-8631-4d83-8861-0287877c9e7d'::uuid,
    'bd03d41f-3e64-4923-858f-6ba10b9f08e0'::uuid,
    '7fd3afbb-97cb-45ed-95ea-4d904a022cfb'::uuid,
    '09c839bf-3c65-4bb6-bd9e-e543151f759a'::uuid
  ];
begin
  if exists (
    select 1 from public.orders o
    where o.id = any(v_order_ids)
      and not (
        o.reference like 'DASH-REVIEW-%'
        or o.payment_provider = 'demo'
        or (
          o.id in (
            '7fd3afbb-97cb-45ed-95ea-4d904a022cfb'::uuid,
            '09c839bf-3c65-4bb6-bd9e-e543151f759a'::uuid
          )
          and o.customer_email = 'muhammad.syakir.mzack@gmail.com'
          and o.payment_status = 'pending'
        )
      )
  ) then raise exception 'Test cleanup stopped: an order no longer matches the audited test identity'; end if;

  if exists (
    select 1 from public.payment_transactions t
    where t.order_id = any(v_order_ids)
      and t.status = 'succeeded'
      and coalesce(t.provider_payment_id, '') not like 'dash-review-%'
  ) then raise exception 'Test cleanup stopped: a real successful payment is attached'; end if;

  if exists (
    select 1 from public.vendor_payments p
    where p.order_id = any(v_order_ids)
      and coalesce(p.reference, '') not like 'DASH-REVIEW-%'
  ) then raise exception 'Test cleanup stopped: a non-seed vendor payment is attached'; end if;

  if exists (select 1 from public.proofs where order_id = any(v_order_ids))
    or exists (select 1 from public.completion_submissions where order_id = any(v_order_ids))
    or exists (select 1 from public.completion_reports where order_id = any(v_order_ids))
    or exists (select 1 from public.notification_deliveries where order_id = any(v_order_ids))
    or exists (select 1 from public.customer_reports where order_id = any(v_order_ids))
    or exists (select 1 from public.vendor_reports where order_id = any(v_order_ids)) then
    raise exception 'Test cleanup stopped: protected evidence, delivery, or support history remains';
  end if;

  if exists (
    select 1
    from auth.users u
    join (values
      ('9b675455-1d0b-4af9-bcd7-4cb068357e3b'::uuid, 'smoke-customer-1784818337656@mailinator.com'),
      ('c1a17101-169d-445c-8a5b-97054a4bfe3e'::uuid, 'e2e-customer-1784863597709@mailinator.com'),
      ('f55f844c-84e6-4416-9450-9264bcd0aede'::uuid, 'e2e-vendor-1784863597709@mailinator.com'),
      ('cfe6b135-c8fa-4d80-ad50-def48c9084e4'::uuid, 'md.syakir.email@gmail.com'),
      ('74301b05-5fd9-48b3-8c72-90b1e0ed5056'::uuid, 'applylah@gmail.com'),
      ('b1e16040-021e-4fc7-a78b-d074297067b7'::uuid, 'syakirplspls@gmail.com')
    ) expected(id, email) on expected.id = u.id
    where lower(u.email) <> expected.email
  ) then raise exception 'Test cleanup stopped: an account email no longer matches'; end if;
end;
$$;

select set_config('app.demo_reset', 'on', true);

alter table public.vendor_payments disable trigger vendor_payments_validate;
alter table public.payment_transactions disable trigger payment_transactions_refund_access;

delete from public.vendor_payments where order_id in (
  'd4500000-0000-4000-8000-000000000009'::uuid,
  'd4500000-0000-4000-8000-000000000010'::uuid,
  'd4500000-0000-4000-8000-000000000012'::uuid
);
delete from public.payment_transactions where order_id in (
  'd4500000-0000-4000-8000-000000000001'::uuid,
  'd4500000-0000-4000-8000-000000000002'::uuid,
  'd4500000-0000-4000-8000-000000000003'::uuid,
  'd4500000-0000-4000-8000-000000000004'::uuid,
  'd4500000-0000-4000-8000-000000000005'::uuid,
  'd4500000-0000-4000-8000-000000000006'::uuid,
  'd4500000-0000-4000-8000-000000000007'::uuid,
  'd4500000-0000-4000-8000-000000000008'::uuid,
  'd4500000-0000-4000-8000-000000000009'::uuid,
  'd4500000-0000-4000-8000-000000000010'::uuid,
  'd4500000-0000-4000-8000-000000000011'::uuid,
  'd4500000-0000-4000-8000-000000000012'::uuid
);

alter table public.vendor_payments enable trigger vendor_payments_validate;
alter table public.payment_transactions enable trigger payment_transactions_refund_access;

delete from public.orders where id in (
  'd4500000-0000-4000-8000-000000000001'::uuid,
  'd4500000-0000-4000-8000-000000000002'::uuid,
  'd4500000-0000-4000-8000-000000000003'::uuid,
  'd4500000-0000-4000-8000-000000000004'::uuid,
  'd4500000-0000-4000-8000-000000000005'::uuid,
  'd4500000-0000-4000-8000-000000000006'::uuid,
  'd4500000-0000-4000-8000-000000000007'::uuid,
  'd4500000-0000-4000-8000-000000000008'::uuid,
  'd4500000-0000-4000-8000-000000000009'::uuid,
  'd4500000-0000-4000-8000-000000000010'::uuid,
  'd4500000-0000-4000-8000-000000000011'::uuid,
  'd4500000-0000-4000-8000-000000000012'::uuid,
  '611d4d1b-3256-4a53-a4ba-5f9242f1a0b0'::uuid,
  '079afe4d-8631-4d83-8861-0287877c9e7d'::uuid,
  'bd03d41f-3e64-4923-858f-6ba10b9f08e0'::uuid,
  '7fd3afbb-97cb-45ed-95ea-4d904a022cfb'::uuid,
  '09c839bf-3c65-4bb6-bd9e-e543151f759a'::uuid
);

delete from public.vendor_invitations where lower(email) in (
  'e2e-vendor-1784863597709@mailinator.com',
  'md.syakir.email@gmail.com'
);

delete from auth.users where id in (
  '9b675455-1d0b-4af9-bcd7-4cb068357e3b'::uuid,
  'c1a17101-169d-445c-8a5b-97054a4bfe3e'::uuid,
  'f55f844c-84e6-4416-9450-9264bcd0aede'::uuid,
  'cfe6b135-c8fa-4d80-ad50-def48c9084e4'::uuid,
  '74301b05-5fd9-48b3-8c72-90b1e0ed5056'::uuid,
  'b1e16040-021e-4fc7-a78b-d074297067b7'::uuid
);

commit;
