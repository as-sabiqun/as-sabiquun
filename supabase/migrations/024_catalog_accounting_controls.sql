begin;

-- Pricing is integer SGD cents. Keep the same S$1,000,000 ceiling enforced by
-- the admin form at the database boundary too.
alter table public.offerings
  drop constraint if exists offerings_unit_amount_check,
  drop constraint if exists offerings_min_amount_check;
alter table public.offerings
  add constraint offerings_unit_amount_check check (
    unit_amount is null or unit_amount between 1 and 100000000
  ),
  add constraint offerings_min_amount_check check (
    min_amount is null or min_amount between 1 and 100000000
  );

alter table public.offerings
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists offerings_touch_updated_at on public.offerings;
create trigger offerings_touch_updated_at
  before update on public.offerings
  for each row execute function public.touch_updated_at();

create table if not exists public.offering_catalog_events (
  id uuid primary key default gen_random_uuid(),
  offering_id uuid not null references public.offerings(id),
  event_type text not null check (event_type in ('offering.created', 'offering.updated')),
  actor_id uuid references public.profiles(id),
  actor_access_level text check (actor_access_level is null or actor_access_level in ('owner', 'administrator', 'operations')),
  previous_state jsonb,
  new_state jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists offering_catalog_events_offering_created_idx
  on public.offering_catalog_events(offering_id, created_at desc);

create or replace function public.record_offering_catalog_event() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_old jsonb;
  v_new jsonb;
begin
  if tg_op = 'UPDATE' and row(
    new.slug, new.service_type, new.category_slug, new.title, new.detail,
    new.unit_amount, new.min_amount, new.active, new.sort_order
  ) is not distinct from row(
    old.slug, old.service_type, old.category_slug, old.title, old.detail,
    old.unit_amount, old.min_amount, old.active, old.sort_order
  ) then return new; end if;

  if tg_op = 'UPDATE' then
    v_old := jsonb_build_object(
      'slug', old.slug, 'service_type', old.service_type, 'category_slug', old.category_slug,
      'title', old.title, 'detail', old.detail, 'unit_amount', old.unit_amount,
      'min_amount', old.min_amount, 'active', old.active, 'sort_order', old.sort_order
    );
  end if;
  v_new := jsonb_build_object(
    'slug', new.slug, 'service_type', new.service_type, 'category_slug', new.category_slug,
    'title', new.title, 'detail', new.detail, 'unit_amount', new.unit_amount,
    'min_amount', new.min_amount, 'active', new.active, 'sort_order', new.sort_order
  );

  insert into public.offering_catalog_events (
    offering_id, event_type, actor_id, actor_access_level, previous_state, new_state
  ) values (
    new.id,
    case when tg_op = 'INSERT' then 'offering.created' else 'offering.updated' end,
    auth.uid(), public.current_admin_access_level(), v_old, v_new
  );
  return new;
end;
$$;

drop trigger if exists offerings_catalog_audit on public.offerings;
create trigger offerings_catalog_audit
  after insert or update on public.offerings
  for each row execute function public.record_offering_catalog_event();

drop trigger if exists offering_catalog_events_immutable on public.offering_catalog_events;
create trigger offering_catalog_events_immutable
  before update or delete on public.offering_catalog_events
  for each row execute function public.block_immutable_history_change();

alter table public.offering_catalog_events enable row level security;
drop policy if exists "offering catalog history administrator read" on public.offering_catalog_events;
create policy "offering catalog history administrator read" on public.offering_catalog_events
  for select to authenticated
  using (public.admin_access_at_least('administrator'));

revoke insert, update, delete on public.offering_catalog_events from authenticated;
grant select on public.offering_catalog_events to authenticated, service_role;

-- Catalog rows are archived with active=false. Authenticated administrators may
-- read, create, and update them, but never delete them.
drop policy if exists "offerings administrator write" on public.offerings;
drop policy if exists "offerings administrator read" on public.offerings;
drop policy if exists "offerings administrator insert" on public.offerings;
drop policy if exists "offerings administrator update" on public.offerings;
create policy "offerings administrator read" on public.offerings
  for select to authenticated
  using (public.admin_access_at_least('administrator'));
create policy "offerings administrator insert" on public.offerings
  for insert to authenticated
  with check (public.admin_access_at_least('administrator'));
create policy "offerings administrator update" on public.offerings
  for update to authenticated
  using (public.admin_access_at_least('administrator'))
  with check (public.admin_access_at_least('administrator'));

-- End the temporary password-only window now. Every database policy and RPC
-- using is_admin() once again requires an AAL2 password session.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select public.session_uses_auth_method('password') and exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'active'
      and coalesce(auth.jwt()->>'aal', 'aal1') = 'aal2'
  );
$$;

comment on function public.is_admin() is
  'Active password-authenticated administrator with an AAL2 session.';
comment on table public.offering_catalog_events is
  'Append-only before/after audit history for service catalog changes.';

revoke all on function public.record_offering_catalog_event() from public, anon, authenticated, service_role;

commit;
