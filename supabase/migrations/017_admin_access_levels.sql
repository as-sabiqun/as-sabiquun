begin;

alter table public.profiles
  add column if not exists admin_access_level text;

select set_config('request.jwt.claims', '{"role":"service_role"}', true);

update public.profiles
set admin_access_level = case
  when role <> 'admin' then null
  when admin_owner then 'owner'
  else 'administrator'
end;

select set_config('request.jwt.claims', '{}', true);

create or replace function public.sync_admin_access_fields()
returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.role = 'admin' then
    new.admin_access_level := coalesce(
      new.admin_access_level,
      case when new.admin_owner then 'owner' else 'administrator' end
    );
    new.admin_owner := new.admin_access_level = 'owner';
  else
    new.admin_access_level := null;
    new.admin_owner := false;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_sync_admin_access_fields on public.profiles;
create trigger profiles_sync_admin_access_fields
  before insert or update on public.profiles
  for each row execute function public.sync_admin_access_fields();

create or replace function public.guard_final_active_owner()
returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_removes_owner boolean := false;
begin
  if old.role = 'admin'
    and old.admin_access_level = 'owner'
    and old.status = 'active' then
    if tg_op = 'DELETE' then
      v_removes_owner := true;
    else
      v_removes_owner := new.role <> 'admin'
        or new.admin_access_level <> 'owner'
        or new.status <> 'active';
    end if;
    if v_removes_owner then
      perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('as-sabiqun-active-owner'));
      if not exists (
        select 1 from public.profiles
        where id <> old.id
          and role = 'admin'
          and admin_access_level = 'owner'
          and status = 'active'
      ) then
        raise exception 'The final active owner cannot be removed, suspended, or demoted'
          using errcode = '23514';
      end if;
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_final_active_owner on public.profiles;
create trigger profiles_guard_final_active_owner
  before update or delete on public.profiles
  for each row execute function public.guard_final_active_owner();

alter table public.profiles
  drop constraint if exists profiles_admin_access_level_check;
alter table public.profiles
  add constraint profiles_admin_access_level_check
  check (
    (role = 'admin' and admin_access_level in ('owner', 'administrator', 'operations'))
    or (role <> 'admin' and admin_access_level is null)
  );

alter table public.profiles
  drop constraint if exists profiles_admin_owner_role_check;
alter table public.profiles
  add constraint profiles_admin_owner_role_check
  check (admin_owner = (role = 'admin' and admin_access_level = 'owner'));

create or replace function public.current_admin_access_level()
returns text
language sql stable security definer set search_path = '' as $$
  select p.admin_access_level
  from public.profiles p
  where p.id = auth.uid()
    and public.is_admin()
  limit 1;
$$;

create or replace function public.admin_access_at_least(p_required text)
returns boolean
language sql stable security definer set search_path = '' as $$
  select case public.current_admin_access_level()
    when 'owner' then 3
    when 'administrator' then 2
    when 'operations' then 1
    else 0
  end >= case p_required
    when 'owner' then 3
    when 'administrator' then 2
    when 'operations' then 1
    else 99
  end;
$$;

create or replace function public.guard_financial_admin_write()
returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_transaction_type text;
begin
  if public.is_service_role() then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if tg_table_name = 'payment_transactions' then
    v_transaction_type := case when tg_op = 'DELETE' then old.transaction_type else new.transaction_type end;
    if v_transaction_type <> 'refund' then
      if tg_op = 'DELETE' then return old; end if;
      return new;
    end if;
  end if;

  if not public.admin_access_at_least('administrator') then
    raise exception 'Administrator or owner finance access is required'
      using errcode = '42501';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists vendor_payments_finance_access on public.vendor_payments;
create trigger vendor_payments_finance_access
  before insert or update or delete on public.vendor_payments
  for each row execute function public.guard_financial_admin_write();

drop trigger if exists payment_transactions_refund_access on public.payment_transactions;
create trigger payment_transactions_refund_access
  before insert or update or delete on public.payment_transactions
  for each row execute function public.guard_financial_admin_write();

revoke all on function public.sync_admin_access_fields() from public, anon, authenticated, service_role;
revoke all on function public.guard_final_active_owner() from public, anon, authenticated, service_role;
revoke all on function public.guard_financial_admin_write() from public, anon, authenticated, service_role;
revoke all on function public.current_admin_access_level() from public, anon;
revoke all on function public.admin_access_at_least(text) from public, anon;
grant execute on function public.current_admin_access_level() to authenticated, service_role;
grant execute on function public.admin_access_at_least(text) to authenticated, service_role;

commit;
