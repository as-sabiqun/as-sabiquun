begin;

-- Temporary password-only admin access requested for 26 July 2026.
-- The AAL2 requirement automatically resumes at 02:00 Singapore time.
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
        or now() < timestamptz '2026-07-26 18:00:00+00'
      )
  );
$$;

comment on function public.is_admin() is
  'Active password-authenticated admin; AAL2 bypass expires 2026-07-26 18:00 UTC.';

commit;
