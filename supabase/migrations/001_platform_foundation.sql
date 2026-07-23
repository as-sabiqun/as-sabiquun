-- Platform foundation: roles backed by a real table (not client-editable
-- user_metadata), customer accounts, broadcast/claim job distribution,
-- commission split, vendor capability matching, and vendor-filed reports.
--
-- This migration is self-contained. It does not assume the older
-- 20260715000000_initial_demo.sql / 20260719000000_food_for_orphans.sql
-- files were ever applied to this project.

create extension if not exists pgcrypto;

-- ============================================================
-- PROFILES — one row per auth.users row. role is the single
-- source of truth for authorization (never user_metadata, which
-- an authenticated user can edit themselves via the client SDK).
-- ============================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null default 'customer' check (role in ('customer','vendor','admin')),
  phone text,
  vendor_type text,
  services text[] not null default '{}',
  status text not null default 'active' check (status in ('active','suspended')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_vendor() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'vendor' and status = 'active');
$$;

-- Every new auth.users row (self-service signup OR admin.createUser) gets a
-- 'customer' profile by default. Vendor/admin creation always happens as a
-- second, explicit, service-role step — never trusted from signup metadata,
-- since the anon key is public and a self-service signup call could be made
-- directly against Supabase's API with arbitrary metadata.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'Customer'), 'customer');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- PLATFORM SETTINGS — single row, adjustable without a redeploy.
-- ============================================================

create table public.platform_settings (
  id boolean primary key default true check (id),
  commission_rate numeric(4,3) not null default 0.10 check (commission_rate >= 0 and commission_rate < 1),
  default_claim_window_hours integer not null default 6 check (default_claim_window_hours > 0),
  updated_at timestamptz not null default now()
);
insert into public.platform_settings (id) values (true);

-- ============================================================
-- OFFERINGS — canonical service/package catalog. The public site's
-- React components still hardcode this today; this table exists so
-- orders reference something real and the catalog can be unified
-- with the frontend in a later pass without a schema change.
-- ============================================================

-- category_slug is the granular capability key ('korban' | 'water' | 'quran' |
-- 'orphans') that matches profiles.services exactly — service_type ('korban'
-- | 'wakaf') is only the broad grouping used for display/pricing rules.
create table public.offerings (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  service_type text not null check (service_type in ('korban','wakaf')),
  category_slug text not null check (category_slug in ('korban','water','quran','orphans')),
  title text not null,
  detail text not null,
  unit_amount integer check (unit_amount is null or unit_amount > 0),
  min_amount integer check (min_amount is null or min_amount > 0),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.offerings (slug, service_type, category_slug, title, detail, unit_amount, sort_order) values
  ('korban-share', 'korban', 'korban', 'Korban — 1 cow share', 'One cow share, coordinated overseas with an approved fulfilment partner.', 28000, 1),
  ('korban-goat', 'korban', 'korban', 'Korban — 1 goat/sheep', 'One goat or sheep share, coordinated overseas with an approved fulfilment partner.', 32000, 2),
  ('korban-cow', 'korban', 'korban', 'Korban — full cow (7 shares)', 'A full cow, 7 shares, for one household order.', 196000, 3);

insert into public.offerings (slug, service_type, category_slug, title, detail, min_amount, sort_order) values
  ('wakaf-water-pump', 'wakaf', 'water', 'Wakaf Water Pump', 'Contribute towards a clean-water project and follow its journey from order to evidence.', 2500, 4),
  ('wakaf-quran', 'wakaf', 'quran', 'Wakaf Quran', 'Support Quran distribution with clear project information and a completion record.', 1000, 5),
  ('wakaf-food-for-orphans', 'wakaf', 'orphans', 'Food for Orphans', 'Support a coordinated food programme with responsible handling and proof after delivery.', 5000, 6);

-- ============================================================
-- ORDERS — one row per customer submission. Money is stored in
-- cents. commission_rate_snapshot/commission_amount/vendor_payout_amount
-- are resolved at order-creation time so later rate changes never
-- retroactively alter historical orders.
-- ============================================================

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  customer_id uuid not null references auth.users(id),
  offering_id uuid not null references public.offerings(id),
  service_type text not null check (service_type in ('korban','wakaf')),
  category_slug text not null check (category_slug in ('korban','water','quran','orphans')),

  quantity integer not null default 1 check (quantity between 1 and 7),
  participant_names text[] not null default '{}',
  dedication text,
  notes text,

  customer_name text not null,
  customer_phone text not null,

  unit_amount integer not null check (unit_amount > 0),
  total_amount integer not null check (total_amount > 0),
  commission_rate_snapshot numeric(4,3) not null,
  commission_amount integer not null check (commission_amount >= 0),
  vendor_payout_amount integer not null check (vendor_payout_amount >= 0),

  payment_provider text not null default 'demo' check (payment_provider in ('demo','hitpay')),
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed')),
  payment_reference text,

  status text not null default 'submitted' check (status in (
    'submitted', 'broadcasting', 'assigned', 'in_progress',
    'proof_submitted', 'completed', 'expired_unclaimed', 'cancelled'
  )),
  assigned_vendor_id uuid references public.profiles(id),
  broadcast_started_at timestamptz,
  broadcast_expires_at timestamptz,

  checkout_token uuid unique not null default gen_random_uuid(),
  review_note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_customer_id_idx on public.orders(customer_id);
create index orders_assigned_vendor_id_idx on public.orders(assigned_vendor_id);
create index orders_status_idx on public.orders(status);

create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.touch_updated_at();

-- ============================================================
-- JOB OFFERS — broadcast/claim junction. A submitted order gets
-- offered to every eligible active vendor at once; first to claim
-- wins; the rest fall away once claimed or once their own row expires.
-- ============================================================

create table public.job_offers (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  vendor_id uuid not null references public.profiles(id),
  offered_at timestamptz not null default now(),
  expires_at timestamptz not null,
  status text not null default 'offered' check (status in ('offered','claimed','expired','declined')),
  unique (order_id, vendor_id)
);

create index job_offers_vendor_id_idx on public.job_offers(vendor_id);
create index job_offers_order_id_idx on public.job_offers(order_id);

-- Admin (or a future automated matcher) broadcasts a submitted order to
-- every active vendor whose services overlap the offering's service_type.
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
  on conflict (order_id, vendor_id) do nothing;

  get diagnostics v_offered_count = row_count;
  return v_offered_count;
end;
$$;

-- Atomic claim: only one concurrent caller can win, thanks to the
-- WHERE ... assigned_vendor_id is null guard evaluated under the row lock.
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
  set status = 'assigned', assigned_vendor_id = auth.uid()
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

create or replace function public.decline_job(p_order_id uuid)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.job_offers set status = 'declined'
    where order_id = p_order_id and vendor_id = auth.uid() and status = 'offered';
end;
$$;

-- Sweeps orders whose claim window has passed with nobody claiming.
-- Not yet wired to a schedule (pg_cron) — callable manually or from the
-- app on read until a real cron/notification pass is built.
create or replace function public.expire_stale_broadcasts()
returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_count integer;
begin
  update public.orders
  set status = 'expired_unclaimed'
  where status = 'broadcasting' and broadcast_expires_at < now();
  get diagnostics v_count = row_count;

  update public.job_offers
  set status = 'expired'
  where status = 'offered' and expires_at < now();

  return v_count;
end;
$$;

-- ============================================================
-- PROOFS — completion evidence, one row per uploaded file.
-- ============================================================

create table public.proofs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id),
  storage_path text unique not null,
  media_type text not null,
  caption text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- VENDOR REPORTS — issues vendors flag from their dashboard.
-- ============================================================

create table public.vendor_reports (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.profiles(id),
  order_id uuid references public.orders(id),
  subject text not null,
  message text not null,
  status text not null default 'open' check (status in ('open','resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- ============================================================
-- ENQUIRIES — kept for the future Contact page.
-- ============================================================

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  topic text not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.platform_settings enable row level security;
alter table public.offerings enable row level security;
alter table public.orders enable row level security;
alter table public.job_offers enable row level security;
alter table public.proofs enable row level security;
alter table public.vendor_reports enable row level security;
alter table public.enquiries enable row level security;

create policy "profiles own or admin read" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "profiles admin write" on public.profiles
  for update to authenticated using (public.is_admin());

create policy "settings admin only" on public.platform_settings
  for select to authenticated using (public.is_admin());
create policy "settings admin write" on public.platform_settings
  for update to authenticated using (public.is_admin());

create policy "active offerings public read" on public.offerings
  for select using (active or public.is_admin());
create policy "offerings admin write" on public.offerings
  for all to authenticated using (public.is_admin());

create policy "orders own or admin or assigned vendor read" on public.orders
  for select to authenticated using (
    customer_id = auth.uid() or assigned_vendor_id = auth.uid() or public.is_admin()
  );
create policy "orders customer insert own" on public.orders
  for insert to authenticated with check (customer_id = auth.uid());
-- Deliberately admin-only: RLS 'using' only gates row visibility, not which
-- columns get touched, so a raw UPDATE policy for the assigned vendor would
-- let them PATCH total_amount/payment_status/assigned_vendor_id directly.
-- Vendor-side status progression (in_progress, proof submission, etc.) goes
-- through SECURITY DEFINER functions instead — added alongside the app code
-- that calls them in the next pass, same pattern as claim_job/decline_job.
create policy "orders admin update" on public.orders
  for update to authenticated using (public.is_admin());

create policy "job offers vendor or admin read" on public.job_offers
  for select to authenticated using (vendor_id = auth.uid() or public.is_admin());
create policy "job offers admin write" on public.job_offers
  for all to authenticated using (public.is_admin());

create policy "proofs admin or assigned vendor read" on public.proofs
  for select to authenticated using (
    public.is_admin() or exists (
      select 1 from public.orders where orders.id = proofs.order_id and orders.assigned_vendor_id = auth.uid()
    )
  );
create policy "proofs assigned vendor insert" on public.proofs
  for insert to authenticated with check (
    uploaded_by = auth.uid() and exists (
      select 1 from public.orders where orders.id = order_id and orders.assigned_vendor_id = auth.uid()
    )
  );

create policy "vendor reports own or admin read" on public.vendor_reports
  for select to authenticated using (vendor_id = auth.uid() or public.is_admin());
create policy "vendor reports own insert" on public.vendor_reports
  for insert to authenticated with check (vendor_id = auth.uid());
create policy "vendor reports admin update" on public.vendor_reports
  for update to authenticated using (public.is_admin());

create policy "enquiries admin read" on public.enquiries
  for select to authenticated using (public.is_admin());

-- ============================================================
-- STORAGE — proof photos/video, private bucket, path convention
-- {vendor_id}/{order_id}/{filename}.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('proofs', 'proofs', false, 20971520, array['image/jpeg','image/png','image/webp','video/mp4'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "assigned vendor uploads proof" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.orders
      where id = ((storage.foldername(name))[2])::uuid and assigned_vendor_id = auth.uid()
    )
  );
create policy "proof objects admin or owner read" on storage.objects
  for select to authenticated using (
    bucket_id = 'proofs' and (public.is_admin() or (storage.foldername(name))[1] = auth.uid()::text)
  );
