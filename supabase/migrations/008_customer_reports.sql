-- Customer support reports submitted from the authenticated customer portal.

create table public.customer_reports (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id),
  order_id uuid references public.orders(id),
  category text not null check (category in ('order','payment','evidence','account','other')),
  subject text not null check (char_length(subject) between 4 and 120),
  message text not null check (char_length(message) between 20 and 2000),
  status text not null default 'open' check (status in ('open','resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index customer_reports_customer_id_idx on public.customer_reports(customer_id);
create index customer_reports_status_idx on public.customer_reports(status);

alter table public.customer_reports enable row level security;

create policy "customer reports own or admin read" on public.customer_reports
  for select to authenticated using (customer_id = auth.uid() or public.is_admin());

create policy "active customers submit own reports" on public.customer_reports
  for insert to authenticated with check (
    customer_id = auth.uid()
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'customer' and status = 'active'
    )
    and (
      order_id is null
      or exists (
        select 1 from public.orders
        where orders.id = customer_reports.order_id and orders.customer_id = auth.uid()
      )
    )
  );

create policy "customer reports admin update" on public.customer_reports
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- A suspended administrator must not retain RLS or RPC authority.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;
