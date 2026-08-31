begin;

alter table public.profiles
  add column if not exists admin_owner boolean not null default false;

select set_config('request.jwt.claims', '{"role":"service_role"}', true);

-- Bootstrap the existing trusted administrator(s). New admin invitations keep
-- the default false value and therefore cannot create or manage other admins.
update public.profiles
set admin_owner = true
where role = 'admin';

select set_config('request.jwt.claims', '{}', true);

alter table public.profiles
  drop constraint if exists profiles_admin_owner_role_check;
alter table public.profiles
  add constraint profiles_admin_owner_role_check
  check (not admin_owner or role = 'admin');

commit;
