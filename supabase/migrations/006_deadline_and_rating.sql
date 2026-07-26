-- Adds the completion deadline (set when admin broadcasts a job) needed to
-- compute vendor reliability stats — average completion time and missed
-- deadlines — surfaced on the vendor detail page. Rating itself was already
-- a plain profiles column from 004; no schema change needed there, just an
-- admin-facing edit action (RLS already allows admin to update any profile
-- row via the "profiles admin write" policy from 001).

alter table public.orders
  add column if not exists completion_deadline timestamptz;

create or replace function public.broadcast_order(p_order_id uuid, p_hours integer default null, p_deadline timestamptz default null)
returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_order public.orders%rowtype;
  v_hours integer;
  v_offered_count integer;
begin
  if not public.is_admin() then
    raise exception 'Only admin can broadcast an order';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found';
  end if;

  select coalesce(p_hours, default_claim_window_hours) into v_hours from public.platform_settings;

  update public.orders
  set status = 'broadcasting',
      broadcast_started_at = now(),
      broadcast_expires_at = now() + (v_hours || ' hours')::interval,
      completion_deadline = coalesce(p_deadline, completion_deadline)
  where id = p_order_id;

  insert into public.job_offers (order_id, vendor_id, expires_at)
  select p_order_id, p.id, now() + (v_hours || ' hours')::interval
  from public.profiles p
  where p.role = 'vendor'
    and p.status = 'active'
    and p.services && array[v_order.category_slug]
  on conflict (order_id, vendor_id) do update
    set status = 'offered', offered_at = now(), expires_at = excluded.expires_at
    where public.job_offers.status <> 'claimed';

  get diagnostics v_offered_count = row_count;
  return v_offered_count;
end;
$$;
