begin;

-- Roles are authorization data. Authenticated sessions, including AAL2 admins,
-- may manage non-admin profile fields but may never promote/demote an account
-- or edit an admin profile. Trusted owner provisioning continues through the
-- service-role client used by the server-only admin invitation flow.
create or replace function public.guard_profile_authorization_fields()
returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if public.is_service_role() then
    return new;
  end if;

  if old.role = 'admin' then
    raise exception 'Admin profiles can only be changed by trusted owner provisioning'
      using errcode = '42501';
  end if;

  if new.role is distinct from old.role then
    raise exception 'Profile roles can only be changed by trusted owner provisioning'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_authorization_fields on public.profiles;
create trigger profiles_guard_authorization_fields
  before update on public.profiles
  for each row execute function public.guard_profile_authorization_fields();

revoke all on function public.guard_profile_authorization_fields() from public, anon, authenticated, service_role;

drop policy if exists "profiles admin write" on public.profiles;
drop policy if exists "profiles AAL2 admin update non-admin" on public.profiles;
create policy "profiles AAL2 admin update non-admin" on public.profiles
  for update to authenticated
  using (public.is_admin() and role <> 'admin')
  with check (public.is_admin() and role <> 'admin');

commit;
