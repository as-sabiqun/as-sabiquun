begin;

do $$
declare
  v_admin constant uuid := '15000000-0000-4000-8000-000000000001';
  v_offering uuid;
  v_order uuid;
begin
  insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data,raw_app_meta_data)
  values (v_admin,'manual-order-admin@example.test',now(),'{}','{"provider":"email","providers":["email"]}');

  perform set_config('request.jwt.claim.sub','',true);
  perform set_config('request.jwt.claim.role','service_role',true);
  perform set_config('request.jwt.claims','{"role":"service_role","aal":"aal2"}',true);
  update public.profiles set role = 'admin', status = 'active' where id = v_admin;
  select id into v_offering from public.offerings where slug = 'korban-share';

  perform set_config('request.jwt.claim.sub',v_admin::text,true);
  perform set_config('request.jwt.claim.role','authenticated',true);
  perform set_config('request.jwt.claims',jsonb_build_object(
    'sub',v_admin,'role','authenticated','aal','aal2',
    'amr',jsonb_build_array(jsonb_build_object('method','password'),jsonb_build_object('method','totp'))
  )::text,true);

  select id into v_order from public.create_admin_manual_order(
    v_offering, 1, null, 'Walk-in Customer', '+6500000000', 'walk-in@example.test',
    array['Walk-in Customer'], null, 'MANUAL-015-RECEIPT', 'Cash', 'Created at the counter.', 'Indonesia', now() + interval '7 days'
  );

  if not exists (
    select 1 from public.orders
    where id = v_order and customer_id is null and entry_source = 'admin_manual'
      and payment_provider = 'manual' and payment_status = 'paid' and fulfilment_status = 'ready'
      and beneficiary_country = 'Indonesia'
  ) then raise exception 'Manual order did not enter the paid ready-to-dispatch state'; end if;

  if not exists (
    select 1 from public.payment_transactions
    where order_id = v_order and provider = 'manual' and transaction_type = 'payment'
      and status = 'succeeded' and provider_payment_id = 'MANUAL-015-RECEIPT'
  ) then raise exception 'Manual payment ledger entry was not recorded'; end if;

  if not exists (
    select 1 from public.order_events
    where order_id = v_order and event_type = 'order.created_manually' and actor_id = v_admin
  ) then raise exception 'Manual order audit event was not recorded'; end if;
end;
$$;

rollback;
