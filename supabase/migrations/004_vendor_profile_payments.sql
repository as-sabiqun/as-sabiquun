-- Expands the vendor profile to match Irfan's actual onboarding needs
-- (org contact info, WhatsApp, payment/bank details, internal notes) and
-- adds a vendor payment ledger — separate from the operational job status,
-- since a job can be delivered to the customer while vendor payment is
-- still outstanding.

alter table public.profiles
  add column if not exists contact_person text,
  add column if not exists whatsapp text,
  add column if not exists country text,
  add column if not exists city_address text,
  add column if not exists currency text default 'SGD',
  add column if not exists bank_name text,
  add column if not exists bank_account_name text,
  add column if not exists bank_account_number text,
  add column if not exists swift_code text,
  add column if not exists rating numeric(3,2),
  add column if not exists notes text;

create table public.vendor_payments (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.profiles(id),
  order_id uuid references public.orders(id),
  amount integer not null check (amount > 0),
  payment_date date not null default current_date,
  method text,
  reference text,
  notes text,
  recorded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index vendor_payments_vendor_id_idx on public.vendor_payments(vendor_id);
create index vendor_payments_order_id_idx on public.vendor_payments(order_id);

alter table public.vendor_payments enable row level security;

create policy "vendor payments admin manage" on public.vendor_payments
  for all to authenticated using (public.is_admin());
create policy "vendor payments own read" on public.vendor_payments
  for select to authenticated using (vendor_id = auth.uid());
