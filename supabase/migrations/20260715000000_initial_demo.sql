create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null default 'vendor' check (role in ('admin','vendor')),
  created_at timestamptz not null default now()
);

create table public.offerings (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  service_type text not null check (service_type in ('korban','wakaf')),
  title text not null,
  location text,
  detail text not null,
  unit_amount integer check (unit_amount is null or unit_amount > 0),
  min_amount integer check (min_amount is null or min_amount > 0),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  service_type text not null check (service_type in ('korban','wakaf')),
  offering_id uuid not null references public.offerings(id),
  quantity integer not null default 1 check (quantity between 1 and 7),
  participant_names text[] not null default '{}',
  dedication text,
  notes text,
  unit_amount integer not null check (unit_amount > 0),
  total_amount integer not null check (total_amount > 0),
  payment_provider text not null default 'demo' check (payment_provider in ('demo','hitpay')),
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed')),
  payment_reference text,
  fulfilment_status text not null default 'unassigned' check (fulfilment_status in ('unassigned','assigned','in_progress','proof_submitted','completed')),
  assigned_vendor_id uuid references public.profiles(id),
  checkout_token uuid unique not null default gen_random_uuid(),
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_contacts (
  order_id uuid primary key references public.orders(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text not null
);

create table public.proofs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id),
  storage_path text unique not null,
  media_type text not null,
  caption text,
  created_at timestamptz not null default now()
);

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  topic text not null,
  message text not null,
  created_at timestamptz not null default now()
);

insert into public.offerings (id,slug,service_type,title,location,detail,unit_amount,min_amount,sort_order) values
('00000000-0000-0000-0000-000000000001','korban-overseas','korban','Korban Overseas Package','Indonesia','One cow share',28000,null,1),
('00000000-0000-0000-0000-000000000002','wakaf-quran','wakaf','Wakaf Quran Distribution',null,'Support Quran distribution through a fulfilment partner.',null,1000,2),
('00000000-0000-0000-0000-000000000003','wakaf-water','wakaf','Wakaf Clean Water Initiative',null,'Contribute toward a clean-water demonstration project.',null,2500,3),
('00000000-0000-0000-0000-000000000004','wakaf-education','wakaf','Wakaf Community Education Fund',null,'Support learning resources and community education.',null,5000,4);

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at = now(); return new; end; $$;
create trigger orders_updated_at before update on public.orders for each row execute function public.touch_updated_at();

create or replace function public.create_demo_order(
  p_offering_id uuid, p_quantity integer, p_participant_names text[], p_dedication text,
  p_notes text, p_full_name text, p_email text, p_phone text, p_total_amount integer
) returns table(order_id uuid, reference text, checkout_token uuid)
language plpgsql security definer set search_path = '' as $$
declare v_offering public.offerings%rowtype; v_order public.orders%rowtype; v_reference text;
begin
  select * into v_offering from public.offerings where id = p_offering_id and active;
  if not found then raise exception 'Offering unavailable'; end if;
  if v_offering.service_type = 'korban' then
    if p_quantity not between 1 and 7 or cardinality(p_participant_names) <> p_quantity or p_total_amount <> v_offering.unit_amount * p_quantity then raise exception 'Invalid Korban order'; end if;
  elsif p_total_amount < v_offering.min_amount then raise exception 'Contribution below minimum';
  end if;
  v_reference := 'ASQ-' || to_char(now(), 'YYMM') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,4));
  insert into public.orders(reference,service_type,offering_id,quantity,participant_names,dedication,notes,unit_amount,total_amount)
  values(v_reference,v_offering.service_type,p_offering_id,p_quantity,p_participant_names,p_dedication,p_notes,coalesce(v_offering.unit_amount,p_total_amount),p_total_amount) returning * into v_order;
  insert into public.order_contacts(order_id,full_name,email,phone) values(v_order.id,p_full_name,p_email,p_phone);
  return query select v_order.id, v_order.reference, v_order.checkout_token;
end; $$;

revoke all on function public.create_demo_order(uuid,integer,text[],text,text,text,text,text,integer) from public, anon, authenticated;
grant execute on function public.create_demo_order(uuid,integer,text[],text,text,text,text,text,integer) to service_role;

alter table public.profiles enable row level security;
alter table public.offerings enable row level security;
alter table public.orders enable row level security;
alter table public.order_contacts enable row level security;
alter table public.proofs enable row level security;
alter table public.enquiries enable row level security;

create policy "profiles own or admin read" on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "active offerings public read" on public.offerings for select using (active or public.is_admin());
create policy "orders admin or assigned vendor read" on public.orders for select to authenticated using (public.is_admin() or assigned_vendor_id = auth.uid());
create policy "contacts admin read" on public.order_contacts for select to authenticated using (public.is_admin());
create policy "proofs admin or assigned vendor read" on public.proofs for select to authenticated using (public.is_admin() or exists(select 1 from public.orders where orders.id = proofs.order_id and orders.assigned_vendor_id = auth.uid()));
create policy "enquiries admin read" on public.enquiries for select to authenticated using (public.is_admin());

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types) values
('proofs','proofs',false,20971520,array['image/jpeg','image/png','image/webp','video/mp4'])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy "assigned vendor uploads proof" on storage.objects for insert to authenticated with check (
  bucket_id = 'proofs' and (storage.foldername(name))[1] = auth.uid()::text and
  exists(select 1 from public.orders where id = ((storage.foldername(name))[2])::uuid and assigned_vendor_id = auth.uid())
);
create policy "proof objects admin or owner read" on storage.objects for select to authenticated using (
  bucket_id = 'proofs' and (public.is_admin() or (storage.foldername(name))[1] = auth.uid()::text)
);
