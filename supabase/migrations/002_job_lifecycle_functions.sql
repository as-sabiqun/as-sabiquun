-- Completes the order lifecycle started in 001: vendor-side progression
-- (start work, submit completion proof) and admin-side proof review, all as
-- SECURITY DEFINER functions rather than raw client UPDATEs — orders has no
-- vendor UPDATE policy at all (see 001's comment on "orders admin update"),
-- so these are the only way a vendor can move a job forward.

-- Fixes broadcast_order from 001: ON CONFLICT DO NOTHING meant re-broadcasting
-- an expired_unclaimed order would silently skip every vendor who already had
-- an (expired) offer row, so a re-broadcast could offer to nobody. Resetting
-- non-claimed rows back to 'offered' with a fresh expiry fixes that, while a
-- 'claimed' row (shouldn't coexist with status='broadcasting' anyway) is left
-- untouched as a safety guard.
create or replace function public.broadcast_order(p_order_id uuid, p_hours integer default null)
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
      broadcast_expires_at = now() + (v_hours || ' hours')::interval
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

create or replace function public.mark_in_progress(p_order_id uuid)
returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  update public.orders
  set status = 'in_progress'
  where id = p_order_id and assigned_vendor_id = auth.uid() and status = 'assigned';
  return found;
end;
$$;

-- Records proof rows (storage paths already uploaded by the caller under
-- {vendor_id}/{order_id}/... per the storage.objects policy in 001) and
-- moves the order to proof_submitted — completion is an admin action
-- (complete_order), not automatic, so evidence actually gets reviewed
-- before it's "done" from the customer's point of view.
create or replace function public.submit_proof(p_order_id uuid, p_paths text[], p_notes text default null)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_path text;
begin
  if not exists (
    select 1 from public.orders
    where id = p_order_id and assigned_vendor_id = auth.uid() and status = 'in_progress'
  ) then
    return false;
  end if;

  foreach v_path in array p_paths loop
    insert into public.proofs (order_id, uploaded_by, storage_path, media_type, caption)
    values (p_order_id, auth.uid(), v_path,
      case when v_path ~* '\.(mp4|mov|webm)$' then 'video' else 'photo' end,
      p_notes)
    on conflict (storage_path) do nothing;
  end loop;

  update public.orders set status = 'proof_submitted' where id = p_order_id;
  return true;
end;
$$;

create or replace function public.complete_order(p_order_id uuid)
returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Only admin can mark an order completed';
  end if;

  update public.orders
  set status = 'completed'
  where id = p_order_id and status = 'proof_submitted';
  return found;
end;
$$;
