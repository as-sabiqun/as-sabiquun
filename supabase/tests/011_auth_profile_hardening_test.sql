-- Run after all migrations with a privileged local test connection, for example:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/011_auth_profile_hardening_test.sql
-- Every fixture is rolled back.

begin;

select set_config('request.jwt.claim.role', 'service_role', true);
select set_config('request.jwt.claims', '{"role":"service_role","aal":"aal2"}', true);

insert into auth.users(id, email, email_confirmed_at, raw_user_meta_data)
values
  ('11000000-0000-4000-8000-000000000001', 'profile-vendor@example.test', now(), '{"full_name":"Profile Vendor"}'),
  ('11000000-0000-4000-8000-000000000002', 'profile-admin@example.test', now(), '{"full_name":"Profile Admin"}');

update public.profiles
set role = 'vendor', vendor_onboarding_status = 'approved'
where id = '11000000-0000-4000-8000-000000000001';
update public.profiles
set role = 'admin'
where id = '11000000-0000-4000-8000-000000000002';

set local role authenticated;
select set_config('request.jwt.claim.sub', '11000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"11000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal2","amr":[{"method":"password"},{"method":"totp"}]}',
  true
);

do $$
declare
  v_rows integer;
  v_rejected boolean := false;
begin
  update public.profiles
  set status = 'suspended'
  where id = '11000000-0000-4000-8000-000000000001';
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then
    raise exception 'AAL2 admin could not manage a non-admin vendor profile';
  end if;

  begin
    update public.profiles
    set role = 'customer'
    where id = '11000000-0000-4000-8000-000000000001';
  exception when others then
    v_rejected := true;
  end;
  if not v_rejected then
    raise exception 'Authenticated admin changed a profile role';
  end if;
  if (select role from public.profiles where id = '11000000-0000-4000-8000-000000000001') <> 'vendor' then
    raise exception 'Rejected role change was not rolled back';
  end if;

  update public.profiles
  set display_name = 'Compromised Admin'
  where id = '11000000-0000-4000-8000-000000000002';
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    raise exception 'Authenticated admin edited an admin profile';
  end if;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'service_role', true);
select set_config('request.jwt.claims', '{"role":"service_role","aal":"aal2"}', true);

update public.profiles
set role = 'customer'
where id = '11000000-0000-4000-8000-000000000001';
update public.profiles
set display_name = 'Owner Managed Admin'
where id = '11000000-0000-4000-8000-000000000002';

do $$
begin
  if not exists (
    select 1 from public.profiles
    where id = '11000000-0000-4000-8000-000000000001' and role = 'customer'
  ) then
    raise exception 'Service-role owner provisioning could not change a role';
  end if;
  if not exists (
    select 1 from public.profiles
    where id = '11000000-0000-4000-8000-000000000002' and display_name = 'Owner Managed Admin'
  ) then
    raise exception 'Service-role owner provisioning could not manage an admin profile';
  end if;
end;
$$;

rollback;
