begin;

-- Owner-approved temporary password-only admin access. MFA resumes at midnight SGT on 22 August 2026.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select public.session_uses_auth_method('password') and exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'active'
      and (
        coalesce(auth.jwt()->>'aal', 'aal1') = 'aal2'
        or now() < timestamptz '2026-08-21 16:00:00+00'
      )
  );
$$;

comment on function public.is_admin() is
  'Active password-authenticated admin; temporary MFA bypass expires 2026-08-21 16:00 UTC.';

commit;
