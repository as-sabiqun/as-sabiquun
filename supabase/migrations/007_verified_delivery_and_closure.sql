-- Keeps operational delivery separate from vendor settlement:
-- verified = admin approved, completed = customer report delivered on both
-- channels, closed = completed and the vendor has been paid in full.

alter table public.orders
  add column if not exists closed_at timestamptz;

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check check (status in (
  'submitted', 'broadcasting', 'assigned', 'in_progress', 'proof_submitted',
  'revision_required', 'verified', 'completed', 'closed',
  'expired_unclaimed', 'cancelled'
));

create or replace function public.review_proof(p_order_id uuid, p_approved boolean, p_notes text default null)
returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Only admin can review submitted proof';
  end if;

  update public.orders
  set status = case when p_approved then 'verified' else 'revision_required' end,
      completed_at = null,
      closed_at = null,
      admin_verified_by = auth.uid(),
      admin_verified_at = now(),
      admin_verification_notes = p_notes,
      admin_verification_status = case when p_approved then 'approved' else 'rejected' end
  where id = p_order_id and status = 'proof_submitted';

  return found;
end;
$$;

create or replace function public.record_customer_delivery(
  p_order_id uuid,
  p_channel text,
  p_delivered boolean
)
returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Only admin can record customer delivery';
  end if;
  if p_channel not in ('email', 'telegram') then
    raise exception 'Unsupported delivery channel';
  end if;

  update public.orders
  set email_status = case when p_channel = 'email' then case when p_delivered then 'delivered' else 'failed' end else email_status end,
      email_sent_at = case when p_channel = 'email' and p_delivered then now() when p_channel = 'email' then null else email_sent_at end,
      telegram_status = case when p_channel = 'telegram' then case when p_delivered then 'delivered' else 'failed' end else telegram_status end,
      telegram_sent_at = case when p_channel = 'telegram' and p_delivered then now() when p_channel = 'telegram' then null else telegram_sent_at end
  where id = p_order_id and status in ('verified', 'completed', 'closed');

  if not found then return false; end if;

  update public.orders
  set status = 'completed', completed_at = coalesce(completed_at, now())
  where id = p_order_id
    and status = 'verified'
    and email_status = 'delivered'
    and telegram_status = 'delivered';

  update public.orders o
  set status = 'closed', closed_at = coalesce(closed_at, now())
  where o.id = p_order_id
    and o.status = 'completed'
    and (select coalesce(sum(vp.amount), 0) from public.vendor_payments vp where vp.order_id = o.id) >= o.vendor_payout_amount;

  return true;
end;
$$;

create or replace function public.sync_order_closure(p_order_id uuid)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_paid integer;
begin
  if not public.is_admin() then
    raise exception 'Only admin can update job closure';
  end if;

  select coalesce(sum(amount), 0) into v_paid
  from public.vendor_payments where order_id = p_order_id;

  update public.orders
  set status = case
        when status = 'completed' and v_paid >= vendor_payout_amount then 'closed'
        when status = 'closed' and v_paid < vendor_payout_amount then 'completed'
        else status
      end,
      closed_at = case
        when status = 'completed' and v_paid >= vendor_payout_amount then coalesce(closed_at, now())
        when status = 'closed' and v_paid < vendor_payout_amount then null
        else closed_at
      end
  where id = p_order_id and status in ('completed', 'closed');

  return found;
end;
$$;
