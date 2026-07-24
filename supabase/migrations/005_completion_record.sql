-- Implements Irfan's completion-record spec: categorized evidence (9 photos
-- + 4 videos: before/during/after + dua), vendor-captured project location
-- (GPS + address), beneficiary/dedication detail, an admin approve/reject
-- review step (revision_required loops back to the vendor instead of a
-- one-click complete), and placeholders for notification delivery tracking
-- (actual sending comes later — email/Telegram — but the columns exist now
-- so the completion record has somewhere to show status once wired).

alter table public.proofs
  add column if not exists category text check (category in (
    'before_photo','during_photo','after_photo','before_video','during_video','after_video','dua_video'
  ));

alter table public.orders
  add column if not exists beneficiary_country text,
  add column if not exists beneficiary_state text,
  add column if not exists beneficiary_village text,
  add column if not exists partner_organisation text,
  add column if not exists beneficiary_names text[] not null default '{}',

  add column if not exists dedication_arabic text,
  add column if not exists dedication_remarks text,

  add column if not exists project_country text,
  add column if not exists project_state text,
  add column if not exists project_village text,
  add column if not exists project_address text,
  add column if not exists project_lat numeric(10,6),
  add column if not exists project_lng numeric(10,6),
  add column if not exists project_maps_link text,

  add column if not exists vendor_remarks text,

  add column if not exists accepted_at timestamptz,
  add column if not exists proof_submitted_at timestamptz,
  add column if not exists completed_at timestamptz,

  add column if not exists admin_verified_by uuid references public.profiles(id),
  add column if not exists admin_verified_at timestamptz,
  add column if not exists admin_verification_notes text,
  add column if not exists admin_verification_status text check (admin_verification_status in ('approved','rejected')),

  add column if not exists email_sent_at timestamptz,
  add column if not exists email_status text,
  add column if not exists telegram_sent_at timestamptz,
  add column if not exists telegram_status text;

-- Loops back to the vendor instead of a silent one-click complete.
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check check (status in (
  'submitted', 'broadcasting', 'assigned', 'in_progress',
  'proof_submitted', 'revision_required', 'completed', 'expired_unclaimed', 'cancelled'
));

-- claim_job now stamps accepted_at (redefined from 001 — auth.uid()-scoped
-- atomic claim logic unchanged, just adds the timestamp on success).
create or replace function public.claim_job(p_order_id uuid)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_claimed boolean := false;
begin
  if not exists (
    select 1 from public.job_offers
    where order_id = p_order_id and vendor_id = auth.uid()
      and status = 'offered' and expires_at > now()
  ) then
    return false;
  end if;

  update public.orders
  set status = 'assigned', assigned_vendor_id = auth.uid(), accepted_at = now()
  where id = p_order_id and status = 'broadcasting' and assigned_vendor_id is null;

  if found then
    v_claimed := true;
    update public.job_offers set status = 'claimed'
      where order_id = p_order_id and vendor_id = auth.uid();
    update public.job_offers set status = 'expired'
      where order_id = p_order_id and vendor_id <> auth.uid() and status = 'offered';
  end if;

  return v_claimed;
end;
$$;

-- Replaces the flat-array submit_proof from 002: now takes categorized
-- items (jsonb array of {path, category}) plus vendor-captured location and
-- remarks, validates every required category/count is present, and moves
-- the order to proof_submitted (or clears a prior revision_required back
-- into the same review queue) rather than allowing a vendor to jump
-- straight to a status only admin should set.
create or replace function public.submit_proof(
  p_order_id uuid,
  p_items jsonb,
  p_notes text default null,
  p_project_country text default null,
  p_project_state text default null,
  p_project_village text default null,
  p_project_address text default null,
  p_project_lat numeric default null,
  p_project_lng numeric default null,
  p_project_maps_link text default null
)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_item jsonb;
  v_counts jsonb;
begin
  if not exists (
    select 1 from public.orders
    where id = p_order_id and assigned_vendor_id = auth.uid()
      and status in ('in_progress', 'revision_required')
  ) then
    return false;
  end if;

  select jsonb_object_agg(category, cnt) into v_counts
  from (
    select (item->>'category') as category, count(*) as cnt
    from jsonb_array_elements(p_items) as item
    group by (item->>'category')
  ) t;

  if coalesce((v_counts->>'before_photo')::int, 0) < 3
    or coalesce((v_counts->>'during_photo')::int, 0) < 3
    or coalesce((v_counts->>'after_photo')::int, 0) < 3
    or coalesce((v_counts->>'before_video')::int, 0) < 1
    or coalesce((v_counts->>'during_video')::int, 0) < 1
    or coalesce((v_counts->>'after_video')::int, 0) < 1
    or coalesce((v_counts->>'dua_video')::int, 0) < 1
  then
    raise exception 'Missing required completion evidence';
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    insert into public.proofs (order_id, uploaded_by, storage_path, media_type, category)
    values (
      p_order_id, auth.uid(), v_item->>'path',
      case when (v_item->>'category') like '%video%' then 'video' else 'photo' end,
      v_item->>'category'
    )
    on conflict (storage_path) do nothing;
  end loop;

  update public.orders
  set status = 'proof_submitted',
      proof_submitted_at = now(),
      vendor_remarks = coalesce(p_notes, vendor_remarks),
      project_country = coalesce(p_project_country, project_country),
      project_state = coalesce(p_project_state, project_state),
      project_village = coalesce(p_project_village, project_village),
      project_address = coalesce(p_project_address, project_address),
      project_lat = coalesce(p_project_lat, project_lat),
      project_lng = coalesce(p_project_lng, project_lng),
      project_maps_link = coalesce(p_project_maps_link, project_maps_link),
      admin_verification_status = null,
      admin_verification_notes = null
  where id = p_order_id;

  return true;
end;
$$;

-- Admin approve/reject. Approve stamps completed_at and moves to completed
-- (notification-gated "fully closed" concept comes with tasks 6/7 — for now
-- completed = admin-verified). Reject moves to revision_required so the
-- vendor's job detail page shows a "resubmit" state instead of silently
-- reopening with no explanation.
create or replace function public.review_proof(p_order_id uuid, p_approved boolean, p_notes text default null)
returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Only admin can review submitted proof';
  end if;

  update public.orders
  set status = case when p_approved then 'completed' else 'revision_required' end,
      completed_at = case when p_approved then now() else null end,
      admin_verified_by = auth.uid(),
      admin_verified_at = now(),
      admin_verification_notes = p_notes,
      admin_verification_status = case when p_approved then 'approved' else 'rejected' end
  where id = p_order_id and status = 'proof_submitted';

  return found;
end;
$$;

-- complete_order (from 002) is superseded by review_proof but left in place
-- for now rather than dropped, in case anything still references it; it
-- only works on proof_submitted rows same as before, so it can't conflict.
