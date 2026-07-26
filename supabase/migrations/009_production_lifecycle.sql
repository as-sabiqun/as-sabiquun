-- Production lifecycle hardening.
--
-- The legacy orders.status column remains as a read-compatible projection for
-- the current application during rollout. The four independent status axes
-- below are the source of truth and may only be advanced through controlled
-- functions. This migration never deletes existing data.

begin;

-- --------------------------------------------------------------------------
-- Authorization helpers and profile state
-- --------------------------------------------------------------------------

alter table public.profiles
  add column if not exists vendor_onboarding_status text not null default 'not_applicable',
  add column if not exists telegram_chat_id bigint,
  add column if not exists telegram_user_id bigint,
  add column if not exists telegram_username text,
  add column if not exists telegram_linked_at timestamptz;

alter table public.profiles drop constraint if exists profiles_vendor_onboarding_status_check;
alter table public.profiles add constraint profiles_vendor_onboarding_status_check check (
  vendor_onboarding_status in ('not_applicable','invited','pending','approved','rejected')
);

update public.profiles
set vendor_onboarding_status = 'approved'
where role = 'vendor' and vendor_onboarding_status = 'not_applicable';

create unique index if not exists profiles_telegram_chat_id_uidx
  on public.profiles(telegram_chat_id) where telegram_chat_id is not null;
create unique index if not exists profiles_telegram_user_id_uidx
  on public.profiles(telegram_user_id) where telegram_user_id is not null;

-- Auth metadata describes linked identities; AMR describes how this JWT was
-- authenticated. Supabase JWTs may encode AMR entries as strings or objects.
create or replace function public.session_uses_auth_method(p_method text)
returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from jsonb_array_elements(
      case
        when jsonb_typeof(auth.jwt()->'amr') = 'array' then auth.jwt()->'amr'
        else '[]'::jsonb
      end
    ) as item(value)
    where lower(btrim(
      case
        when jsonb_typeof(value) = 'string' then value #>> '{}'
        when jsonb_typeof(value) = 'object' then value->>'method'
        else null
      end
    )) = lower(btrim(coalesce(p_method, '')))
  );
$$;

create or replace function public.is_service_role() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(auth.role(), '') = 'service_role';
$$;

-- Own-profile reads remain available at AAL1 so an admin can be routed to MFA
-- enrollment/challenge. All access *as an admin* requires an AAL2 JWT.
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

create or replace function public.is_vendor() returns boolean
language sql stable security definer set search_path = '' as $$
  select public.session_uses_auth_method('password') and exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'vendor'
      and status = 'active'
      and vendor_onboarding_status = 'approved'
  );
$$;

create or replace function public.is_customer() returns boolean
language sql stable security definer set search_path = '' as $$
  select public.session_uses_auth_method('oauth') and exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'customer' and status = 'active'
  );
$$;

-- --------------------------------------------------------------------------
-- Independent lifecycle axes and immutable commercial identity
-- --------------------------------------------------------------------------

alter table public.orders
  add column if not exists client_request_id uuid not null default gen_random_uuid(),
  add column if not exists customer_email text,
  add column if not exists currency text not null default 'SGD',
  add column if not exists payment_confirmed_at timestamptz,
  add column if not exists fulfilment_status text,
  add column if not exists delivery_status text,
  add column if not exists settlement_status text;

update public.orders o
set customer_email = u.email
from auth.users u
where u.id = o.customer_id and o.customer_email is null;

update public.orders
set payment_confirmed_at = coalesce(payment_confirmed_at, updated_at, created_at)
where payment_status in ('paid','partially_refunded','refunded') and payment_confirmed_at is null;

update public.orders o
set fulfilment_status = case o.status
      when 'broadcasting' then 'broadcasting'
      when 'assigned' then 'assigned'
      when 'in_progress' then 'in_progress'
      when 'proof_submitted' then 'proof_submitted'
      when 'revision_required' then 'revision_required'
      when 'verified' then 'verified'
      when 'completed' then 'verified'
      when 'closed' then 'verified'
      when 'cancelled' then 'cancelled'
      when 'expired_unclaimed' then 'ready'
      else case when o.payment_status = 'paid' then 'ready' else 'not_ready' end
    end,
    delivery_status = case
      when o.email_status = 'delivered' and o.telegram_status in ('sent','delivered') then 'delivered'
      when o.email_status = 'delivered' or o.telegram_status in ('sent','delivered') then 'partial'
      when o.email_status in ('failed','bounced','blocked') or o.telegram_status in ('failed','blocked') then 'failed'
      when o.status in ('verified','completed','closed') then 'queued'
      else 'not_ready'
    end,
    settlement_status = case
      when coalesce((select sum(vp.amount) from public.vendor_payments vp where vp.order_id = o.id), 0) <= 0 then 'unpaid'
      when coalesce((select sum(vp.amount) from public.vendor_payments vp where vp.order_id = o.id), 0) >= o.vendor_payout_amount then 'paid'
      else 'partially_paid'
    end
where o.fulfilment_status is null or o.delivery_status is null or o.settlement_status is null;

alter table public.orders alter column fulfilment_status set default 'not_ready';
alter table public.orders alter column fulfilment_status set not null;
alter table public.orders alter column delivery_status set default 'not_ready';
alter table public.orders alter column delivery_status set not null;
alter table public.orders alter column settlement_status set default 'unpaid';
alter table public.orders alter column settlement_status set not null;
alter table public.orders alter column payment_provider set default 'hitpay';

alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders add constraint orders_payment_status_check check (
  payment_status in ('pending','paid','partially_refunded','refunded','failed','expired','cancelled')
);
alter table public.orders drop constraint if exists orders_fulfilment_status_check;
alter table public.orders add constraint orders_fulfilment_status_check check (
  fulfilment_status in ('not_ready','ready','broadcasting','assigned','in_progress','proof_submitted','revision_required','verified','cancelled')
);
alter table public.orders drop constraint if exists orders_delivery_status_check;
alter table public.orders add constraint orders_delivery_status_check check (
  delivery_status in ('not_ready','queued','partial','delivered','failed')
);
alter table public.orders drop constraint if exists orders_settlement_status_check;
alter table public.orders add constraint orders_settlement_status_check check (
  settlement_status in ('unpaid','partially_paid','paid')
);
alter table public.orders drop constraint if exists orders_currency_check;
alter table public.orders add constraint orders_currency_check check (currency = 'SGD');
alter table public.orders drop constraint if exists orders_project_maps_link_check;
alter table public.orders add constraint orders_project_maps_link_check
  check (project_maps_link is null or project_maps_link ~* '^https://[^[:space:]]+$') not valid;
alter table public.orders drop constraint if exists orders_customer_email_required_check;
alter table public.orders add constraint orders_customer_email_required_check
  check (customer_email is not null and btrim(customer_email) <> '') not valid;
alter table public.orders drop constraint if exists orders_axes_consistent_check;
alter table public.orders add constraint orders_axes_consistent_check check (
  (payment_status not in ('pending','failed','expired','cancelled') or fulfilment_status in ('not_ready','cancelled'))
  and (delivery_status = 'not_ready' or fulfilment_status = 'verified')
  and (settlement_status = 'unpaid' or fulfilment_status = 'verified')
  and (fulfilment_status not in ('assigned','in_progress','proof_submitted','revision_required','verified') or assigned_vendor_id is not null)
) not valid;

create unique index if not exists orders_customer_request_uidx
  on public.orders(customer_id, client_request_id);
create index if not exists orders_payment_status_idx on public.orders(payment_status);
create index if not exists orders_fulfilment_status_idx on public.orders(fulfilment_status);
create index if not exists orders_delivery_status_idx on public.orders(delivery_status);
create index if not exists orders_settlement_status_idx on public.orders(settlement_status);

create or replace function public.set_payment_confirmed_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and old.payment_confirmed_at is not null
    and new.payment_confirmed_at is distinct from old.payment_confirmed_at then
    raise exception 'Payment confirmation time is immutable';
  end if;
  if new.payment_status in ('paid','partially_refunded','refunded') and new.payment_confirmed_at is null then
    new.payment_confirmed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists orders_payment_confirmed_at on public.orders;
create trigger orders_payment_confirmed_at
  before insert or update of payment_status, payment_confirmed_at on public.orders
  for each row execute function public.set_payment_confirmed_at();

-- --------------------------------------------------------------------------
-- Provider, submission, report, notification, and audit history
-- --------------------------------------------------------------------------

create table public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null default 'hitpay' check (provider = 'hitpay'),
  transaction_type text not null check (transaction_type in ('payment','refund')),
  provider_request_id text not null,
  provider_payment_id text,
  amount integer not null check (amount > 0),
  currency text not null default 'SGD' check (currency = 'SGD'),
  status text not null check (status in ('pending','succeeded','failed','expired','cancelled')),
  checkout_url text,
  expires_at timestamptz,
  payload_hash text,
  provider_event_at timestamptz,
  reason text,
  requested_by uuid references public.profiles(id),
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, transaction_type, provider_request_id)
);

create unique index payment_transactions_provider_payment_uidx
  on public.payment_transactions(provider, transaction_type, provider_payment_id)
  where provider_payment_id is not null;
create unique index payment_transactions_payload_uidx
  on public.payment_transactions(provider, payload_hash)
  where payload_hash is not null;
create index payment_transactions_order_idx on public.payment_transactions(order_id, created_at desc);
create unique index payment_transactions_one_pending_refund_uidx
  on public.payment_transactions(order_id)
  where transaction_type = 'refund' and status = 'pending';

create table public.completion_submissions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  vendor_id uuid not null references public.profiles(id),
  version integer not null check (version > 0),
  status text not null default 'submitted' check (status in ('submitted','approved','revision_required')),
  project_country text not null check (btrim(project_country) <> ''),
  project_state text not null check (btrim(project_state) <> ''),
  project_village text not null check (btrim(project_village) <> ''),
  project_address text not null check (btrim(project_address) <> ''),
  project_lat numeric(10,6) not null check (project_lat between -90 and 90),
  project_lng numeric(10,6) not null check (project_lng between -180 and 180),
  project_maps_link text,
  vendor_remarks text not null check (btrim(vendor_remarks) <> ''),
  submitted_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  review_notes text,
  review_checklist jsonb not null default '{}'::jsonb check (jsonb_typeof(review_checklist) = 'object'),
  created_at timestamptz not null default now(),
  unique (order_id, version),
  check (project_maps_link is null or project_maps_link ~* '^https://[^[:space:]]+$'),
  check (
    (status = 'submitted' and reviewed_by is null and reviewed_at is null)
    or (status = 'approved' and reviewed_by is not null and reviewed_at is not null)
    or (status = 'revision_required' and reviewed_by is not null and reviewed_at is not null and btrim(coalesce(review_notes,'')) <> '')
  )
);

create unique index completion_submissions_pending_uidx
  on public.completion_submissions(order_id) where status = 'submitted';
create index completion_submissions_vendor_idx
  on public.completion_submissions(vendor_id, submitted_at desc);

alter table public.proofs
  add column if not exists submission_id uuid references public.completion_submissions(id) on delete cascade,
  add column if not exists evidence_slot text,
  add column if not exists mime_type text,
  add column if not exists size_bytes bigint;

alter table public.proofs drop constraint if exists proofs_category_check;
alter table public.proofs add constraint proofs_category_check check (category in (
  'before_photo','during_photo','after_photo','before_video','during_video','after_video','dua_video',
  'extra_photo','extra_video'
));
alter table public.proofs drop constraint if exists proofs_media_type_check;
alter table public.proofs add constraint proofs_media_type_check
  check (media_type in ('photo','video')) not valid;
alter table public.proofs drop constraint if exists proofs_submission_metadata_check;
alter table public.proofs add constraint proofs_submission_metadata_check check (
  submission_id is null or (
    evidence_slot is not null
    and mime_type is not null
    and size_bytes is not null
    and size_bytes > 0
    and (
      (media_type = 'photo' and mime_type in ('image/jpeg','image/png','image/webp') and size_bytes <= 10485760)
      or (media_type = 'video' and mime_type in ('video/mp4','video/quicktime') and size_bytes <= 262144000)
    )
  )
) not valid;
create unique index if not exists proofs_submission_slot_uidx
  on public.proofs(submission_id, evidence_slot) where submission_id is not null;
create index if not exists proofs_submission_idx on public.proofs(submission_id);

create table public.completion_reports (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  submission_id uuid not null references public.completion_submissions(id),
  kind text not null check (kind in ('internal','customer')),
  version integer not null default 1 check (version > 0),
  storage_path text unique not null check (btrim(storage_path) <> ''),
  checksum text not null check (btrim(checksum) <> ''),
  generated_at timestamptz not null default now(),
  generated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (order_id, kind, version)
);
create index completion_reports_order_idx on public.completion_reports(order_id, generated_at desc);

create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  report_id uuid not null references public.completion_reports(id) on delete cascade,
  channel text not null check (channel in ('email','telegram')),
  recipient text not null check (btrim(recipient) <> ''),
  attempt integer not null check (attempt > 0),
  status text not null default 'queued' check (status in (
    'queued','sending','sent','delivered','deferred','bounced','blocked','failed','superseded'
  )),
  provider_message_id text,
  payload_hash text,
  provider_payload jsonb not null default '{}'::jsonb,
  error_code text,
  error_message text,
  next_retry_at timestamptz not null default now(),
  attempted_at timestamptz,
  sent_at timestamptz,
  delivered_at timestamptz,
  provider_event_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, channel, attempt)
);
create unique index notification_deliveries_provider_message_uidx
  on public.notification_deliveries(channel, provider_message_id)
  where provider_message_id is not null;
create index notification_deliveries_due_idx
  on public.notification_deliveries(next_retry_at, created_at)
  where status = 'queued';

create table public.order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  actor_role text not null check (actor_role in ('customer','vendor','admin','system')),
  event_type text not null check (btrim(event_type) <> ''),
  source text not null default 'database' check (btrim(source) <> ''),
  previous_state jsonb,
  new_state jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index order_events_order_idx on public.order_events(order_id, created_at, id);

create table public.telegram_link_tokens (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  token_hash text unique not null check (char_length(token_hash) = 64),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at > created_at)
);
create index telegram_link_tokens_live_idx
  on public.telegram_link_tokens(token_hash, expires_at) where consumed_at is null;

create table public.vendor_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null check (btrim(email) <> ''),
  invited_by uuid not null references public.profiles(id),
  auth_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'invited' check (status in ('invited','accepted','expired','revoked')),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  check ((status = 'accepted') = (accepted_at is not null))
);
create unique index vendor_invitations_live_email_uidx
  on public.vendor_invitations(lower(email)) where status = 'invited';
create index vendor_invitations_auth_user_idx on public.vendor_invitations(auth_user_id);

-- --------------------------------------------------------------------------
-- Vendor settlement and support audit fields
-- --------------------------------------------------------------------------

alter table public.vendor_payments
  add column if not exists currency text not null default 'SGD',
  add column if not exists entry_type text not null default 'payment',
  add column if not exists reverses_payment_id uuid references public.vendor_payments(id);

alter table public.vendor_payments drop constraint if exists vendor_payments_amount_check;
alter table public.vendor_payments drop constraint if exists vendor_payments_currency_check;
alter table public.vendor_payments add constraint vendor_payments_currency_check check (currency = 'SGD');
alter table public.vendor_payments drop constraint if exists vendor_payments_entry_check;
alter table public.vendor_payments add constraint vendor_payments_entry_check check (
  (entry_type = 'payment' and amount > 0 and reverses_payment_id is null)
  or (entry_type = 'reversal' and amount < 0 and reverses_payment_id is not null)
  or (entry_type = 'adjustment' and amount <> 0 and reverses_payment_id is null)
);
create unique index vendor_payments_reversal_uidx
  on public.vendor_payments(reverses_payment_id) where reverses_payment_id is not null;
create index if not exists vendor_payments_reference_idx
  on public.vendor_payments(lower(reference)) where reference is not null;

alter table public.vendor_reports
  add column if not exists resolution_notes text,
  add column if not exists resolved_by uuid references public.profiles(id);
alter table public.customer_reports
  add column if not exists resolution_notes text,
  add column if not exists resolved_by uuid references public.profiles(id);

alter table public.vendor_reports drop constraint if exists vendor_reports_resolution_check;
alter table public.vendor_reports add constraint vendor_reports_resolution_check check (
  status = 'open' or (
    resolved_at is not null and resolved_by is not null and btrim(coalesce(resolution_notes,'')) <> ''
  )
) not valid;
alter table public.customer_reports drop constraint if exists customer_reports_resolution_check;
alter table public.customer_reports add constraint customer_reports_resolution_check check (
  status = 'open' or (
    resolved_at is not null and resolved_by is not null and btrim(coalesce(resolution_notes,'')) <> ''
  )
) not valid;

-- --------------------------------------------------------------------------
-- Storage limits and private report bucket
-- --------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'proofs', 'proofs', false, 262144000,
  array['image/jpeg','image/png','image/webp','video/mp4','video/quicktime']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('completion-reports', 'completion-reports', false, 20971520, array['application/pdf'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- --------------------------------------------------------------------------
-- Derived compatibility state, milestones, and append-only audit
-- --------------------------------------------------------------------------

create or replace function public.derive_legacy_order_state() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.customer_email is null then
    select u.email into new.customer_email from auth.users u where u.id = new.customer_id;
  end if;

  if new.currency <> 'SGD' then
    raise exception 'Orders must be denominated in SGD';
  end if;

  new.status := case
    when new.payment_status = 'cancelled' or new.fulfilment_status = 'cancelled' then 'cancelled'
    when new.fulfilment_status = 'verified' and new.delivery_status = 'delivered' and new.settlement_status = 'paid' then 'closed'
    when new.fulfilment_status = 'verified' and new.delivery_status = 'delivered' then 'completed'
    when new.fulfilment_status = 'verified' then 'verified'
    when new.fulfilment_status = 'revision_required' then 'revision_required'
    when new.fulfilment_status = 'proof_submitted' then 'proof_submitted'
    when new.fulfilment_status = 'in_progress' then 'in_progress'
    when new.fulfilment_status = 'assigned' then 'assigned'
    when new.fulfilment_status = 'broadcasting' then 'broadcasting'
    when new.fulfilment_status = 'ready'
      and new.assigned_vendor_id is null
      and new.broadcast_started_at is not null
      and new.broadcast_expires_at <= now() then 'expired_unclaimed'
    else 'submitted'
  end;

  return new;
end;
$$;

drop trigger if exists orders_derive_legacy_state on public.orders;
create trigger orders_derive_legacy_state
  before insert or update on public.orders
  for each row execute function public.derive_legacy_order_state();

create or replace function public.append_order_event(
  p_order_id uuid,
  p_event_type text,
  p_source text default 'database',
  p_previous_state jsonb default null,
  p_new_state jsonb default null,
  p_metadata jsonb default '{}'::jsonb
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid();
  v_role text;
begin
  if v_actor is not null then
    select role into v_role from public.profiles where id = v_actor;
  end if;
  if v_role is null or v_role not in ('customer','vendor','admin') then
    v_actor := null;
    v_role := 'system';
  end if;

  insert into public.order_events (
    order_id, actor_id, actor_role, event_type, source,
    previous_state, new_state, metadata
  ) values (
    p_order_id, v_actor, v_role, p_event_type, coalesce(nullif(btrim(p_source),''), 'database'),
    p_previous_state, p_new_state, coalesce(p_metadata, '{}'::jsonb)
  );
end;
$$;

create or replace function public.audit_order_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_event text;
  v_old jsonb;
  v_new jsonb;
begin
  v_new := jsonb_build_object(
    'payment_status', new.payment_status,
    'fulfilment_status', new.fulfilment_status,
    'delivery_status', new.delivery_status,
    'settlement_status', new.settlement_status,
    'assigned_vendor_id', new.assigned_vendor_id
  );

  if tg_op = 'INSERT' then
    perform public.append_order_event(new.id, 'order.created', 'orders', null, v_new);
    return new;
  end if;

  if (to_jsonb(new) - 'updated_at') is not distinct from (to_jsonb(old) - 'updated_at') then
    return new;
  end if;

  v_old := jsonb_build_object(
    'payment_status', old.payment_status,
    'fulfilment_status', old.fulfilment_status,
    'delivery_status', old.delivery_status,
    'settlement_status', old.settlement_status,
    'assigned_vendor_id', old.assigned_vendor_id
  );
  v_event := case
    when old.payment_status is distinct from new.payment_status then 'payment.' || new.payment_status
    when old.assigned_vendor_id is distinct from new.assigned_vendor_id and new.fulfilment_status = 'assigned' then 'vendor.accepted'
    when old.fulfilment_status is distinct from new.fulfilment_status then 'fulfilment.' || new.fulfilment_status
    when old.delivery_status is distinct from new.delivery_status then 'delivery.' || new.delivery_status
    when old.settlement_status is distinct from new.settlement_status then 'settlement.' || new.settlement_status
    else 'order.updated'
  end;
  perform public.append_order_event(new.id, v_event, 'orders', v_old, v_new);
  return new;
end;
$$;

drop trigger if exists orders_audit_change on public.orders;
create trigger orders_audit_change
  after insert or update on public.orders
  for each row execute function public.audit_order_change();

insert into public.order_events (
  order_id, actor_role, event_type, source, new_state, metadata, created_at
)
select
  o.id,
  'system',
  'migration.snapshot',
  'migration-009',
  jsonb_build_object(
    'payment_status', o.payment_status,
    'fulfilment_status', o.fulfilment_status,
    'delivery_status', o.delivery_status,
    'settlement_status', o.settlement_status,
    'assigned_vendor_id', o.assigned_vendor_id
  ),
  jsonb_build_object('legacy_status', o.status),
  now()
from public.orders o
where not exists (
  select 1 from public.order_events e
  where e.order_id = o.id and e.event_type = 'migration.snapshot'
);

create or replace function public.sync_order_milestones(p_order_id uuid)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_order public.orders%rowtype;
  v_email_ok boolean;
  v_telegram_ok boolean;
  v_has_delivery boolean;
  v_has_pending boolean;
  v_delivery text;
  v_settlement text;
  v_paid bigint;
  v_email_status text;
  v_telegram_status text;
  v_email_sent_at timestamptz;
  v_telegram_sent_at timestamptz;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then return false; end if;

  select
    exists (
      select 1 from public.notification_deliveries
      where order_id = p_order_id and channel = 'email' and status = 'delivered'
    ),
    exists (
      select 1 from public.notification_deliveries
      where order_id = p_order_id and channel = 'telegram' and status in ('sent','delivered')
    ),
    exists (select 1 from public.notification_deliveries where order_id = p_order_id),
    exists (
      select 1 from public.notification_deliveries
      where order_id = p_order_id and status in ('queued','sending')
    )
  into v_email_ok, v_telegram_ok, v_has_delivery, v_has_pending;

  select status, coalesce(delivered_at, sent_at)
  into v_email_status, v_email_sent_at
  from public.notification_deliveries
  where order_id = p_order_id and channel = 'email'
  order by attempt desc, updated_at desc
  limit 1;

  select status, coalesce(sent_at, delivered_at)
  into v_telegram_status, v_telegram_sent_at
  from public.notification_deliveries
  where order_id = p_order_id and channel = 'telegram'
  order by attempt desc, updated_at desc
  limit 1;

  v_delivery := case
    when v_order.fulfilment_status <> 'verified' then 'not_ready'
    when v_email_ok and v_telegram_ok then 'delivered'
    when v_email_ok or v_telegram_ok then 'partial'
    when v_has_delivery and not v_has_pending then 'failed'
    when v_has_delivery then 'queued'
    else 'not_ready'
  end;

  select coalesce(sum(amount), 0) into v_paid
  from public.vendor_payments where order_id = p_order_id;
  v_settlement := case
    when v_order.fulfilment_status <> 'verified' then 'unpaid'
    when v_order.vendor_payout_amount = 0 or v_paid >= v_order.vendor_payout_amount then 'paid'
    when v_paid > 0 then 'partially_paid'
    else 'unpaid'
  end;

  update public.orders
  set delivery_status = v_delivery,
      settlement_status = v_settlement,
      email_status = v_email_status,
      email_sent_at = v_email_sent_at,
      telegram_status = v_telegram_status,
      telegram_sent_at = v_telegram_sent_at,
      completed_at = case
        when fulfilment_status = 'verified' and v_delivery = 'delivered' then coalesce(completed_at, now())
        else null
      end,
      closed_at = case
        when fulfilment_status = 'verified' and v_delivery = 'delivered' and v_settlement = 'paid' then coalesce(closed_at, now())
        else null
      end
  where id = p_order_id;

  return true;
end;
$$;

create or replace function public.block_immutable_history_change() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' and current_setting('app.demo_reset', true) = 'on' then
    return old;
  end if;
  raise exception '% is append-only', tg_table_name;
end;
$$;

drop trigger if exists order_events_immutable on public.order_events;
create trigger order_events_immutable
  before update or delete on public.order_events
  for each row execute function public.block_immutable_history_change();

create or replace function public.guard_completion_submission() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    if current_setting('app.demo_reset', true) = 'on' then return old; end if;
    raise exception 'Completion submissions are immutable';
  end if;

  if old.status <> 'submitted' or new.status not in ('approved','revision_required') then
    raise exception 'A submission may only be reviewed once';
  end if;
  if (new.order_id, new.vendor_id, new.version, new.project_country, new.project_state,
      new.project_village, new.project_address, new.project_lat, new.project_lng,
      new.project_maps_link, new.vendor_remarks, new.submitted_at, new.created_at)
     is distinct from
     (old.order_id, old.vendor_id, old.version, old.project_country, old.project_state,
      old.project_village, old.project_address, old.project_lat, old.project_lng,
      old.project_maps_link, old.vendor_remarks, old.submitted_at, old.created_at) then
    raise exception 'Submitted evidence and location cannot be edited';
  end if;
  return new;
end;
$$;

drop trigger if exists completion_submissions_immutable on public.completion_submissions;
create trigger completion_submissions_immutable
  before update or delete on public.completion_submissions
  for each row execute function public.guard_completion_submission();

drop trigger if exists completion_reports_immutable on public.completion_reports;
create trigger completion_reports_immutable
  before update or delete on public.completion_reports
  for each row execute function public.block_immutable_history_change();

create or replace function public.validate_completion_report() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not (public.is_admin() or public.is_service_role()) then
    raise exception 'Only an AAL2 admin or system worker can register completion reports';
  end if;
  if not exists (
    select 1 from public.completion_submissions s
    join public.orders o on o.id = s.order_id
    where s.id = new.submission_id
      and s.order_id = new.order_id
      and s.status = 'approved'
      and o.payment_status in ('paid','partially_refunded')
  ) then
    raise exception 'Reports require a paid order and its approved submission';
  end if;
  if new.storage_path not like new.order_id::text || '/%' then
    raise exception 'Report storage path must begin with the order ID';
  end if;
  perform public.append_order_event(
    new.order_id, 'report.generated', 'completion_reports', null, null,
    jsonb_build_object('report_id',new.id,'kind',new.kind,'version',new.version)
  );
  return new;
end;
$$;

drop trigger if exists completion_reports_validate on public.completion_reports;
create trigger completion_reports_validate
  before insert on public.completion_reports
  for each row execute function public.validate_completion_report();

create or replace function public.validate_vendor_payment() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_order public.orders%rowtype;
  v_existing bigint;
  v_original public.vendor_payments%rowtype;
begin
  if not (public.is_admin() or public.is_service_role()) then
    raise exception 'Only an AAL2 admin can record vendor settlement';
  end if;
  if tg_op <> 'INSERT' then
    raise exception 'Vendor payments are append-only; record a reversal or adjustment';
  end if;
  if new.order_id is null then
    raise exception 'Vendor payments must be allocated to an order';
  end if;
  if new.currency <> 'SGD' then
    raise exception 'Vendor payments must be denominated in SGD';
  end if;
  if new.reference is null or btrim(new.reference) = '' then
    raise exception 'A payment reference is required';
  end if;
  if exists (
    select 1 from public.vendor_payments
    where lower(reference) = lower(new.reference)
  ) then
    raise exception 'Payment reference already exists';
  end if;

  select * into v_order from public.orders where id = new.order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.assigned_vendor_id is null or v_order.assigned_vendor_id <> new.vendor_id then
    raise exception 'Payment vendor must match the assigned vendor';
  end if;
  if v_order.fulfilment_status <> 'verified' then
    raise exception 'Vendor settlement starts only after verification';
  end if;

  if new.entry_type = 'reversal' then
    select * into v_original
    from public.vendor_payments where id = new.reverses_payment_id for update;
    if not found
      or v_original.order_id <> new.order_id
      or v_original.vendor_id <> new.vendor_id
      or v_original.amount <= 0
      or new.amount <> -v_original.amount then
      raise exception 'A reversal must exactly negate a positive payment on the same order';
    end if;
  end if;

  select coalesce(sum(amount), 0) into v_existing
  from public.vendor_payments where order_id = new.order_id;
  if v_existing + new.amount < 0 or v_existing + new.amount > v_order.vendor_payout_amount then
    raise exception 'Payment would make the settlement balance invalid';
  end if;

  if public.is_admin() then new.recorded_by := auth.uid(); end if;
  return new;
end;
$$;

create or replace function public.after_vendor_payment() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.append_order_event(
    new.order_id,
    'vendor_payment.' || new.entry_type,
    'vendor_payments',
    null,
    jsonb_build_object('payment_id', new.id, 'amount', new.amount, 'currency', new.currency)
  );
  perform public.sync_order_milestones(new.order_id);
  return new;
end;
$$;

drop trigger if exists vendor_payments_validate on public.vendor_payments;
create trigger vendor_payments_validate
  before insert or update or delete on public.vendor_payments
  for each row execute function public.validate_vendor_payment();
drop trigger if exists vendor_payments_sync on public.vendor_payments;
create trigger vendor_payments_sync
  after insert on public.vendor_payments
  for each row execute function public.after_vendor_payment();

drop trigger if exists payment_transactions_updated_at on public.payment_transactions;
create trigger payment_transactions_updated_at
  before update on public.payment_transactions
  for each row execute function public.touch_updated_at();
drop trigger if exists notification_deliveries_updated_at on public.notification_deliveries;
create trigger notification_deliveries_updated_at
  before update on public.notification_deliveries
  for each row execute function public.touch_updated_at();

-- --------------------------------------------------------------------------
-- Controlled fulfilment, review, settlement, invitation, and support RPCs
-- --------------------------------------------------------------------------

create or replace function public.update_order_record_details(
  p_order_id uuid,
  p_beneficiary_country text default null,
  p_beneficiary_state text default null,
  p_beneficiary_village text default null,
  p_partner_organisation text default null,
  p_beneficiary_names text[] default '{}',
  p_dedication_arabic text default null,
  p_dedication_remarks text default null
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_order public.orders%rowtype;
  v_names text[] := coalesce(p_beneficiary_names, '{}');
  v_previous jsonb;
  v_next jsonb;
begin
  if not public.is_admin() then raise exception 'AAL2 admin access is required'; end if;
  if char_length(btrim(coalesce(p_beneficiary_country,''))) > 100
    or char_length(btrim(coalesce(p_beneficiary_state,''))) > 120
    or char_length(btrim(coalesce(p_beneficiary_village,''))) > 160
    or char_length(btrim(coalesce(p_partner_organisation,''))) > 200
    or char_length(btrim(coalesce(p_dedication_arabic,''))) > 500
    or char_length(btrim(coalesce(p_dedication_remarks,''))) > 2000 then
    raise exception 'One or more record fields exceed the allowed length';
  end if;
  if cardinality(v_names) > 50 or exists (
    select 1 from unnest(v_names) as beneficiary_name
    where beneficiary_name is null
      or btrim(beneficiary_name) = ''
      or char_length(btrim(beneficiary_name)) > 200
  ) then raise exception 'Beneficiary names are invalid'; end if;

  select coalesce(array_agg(btrim(beneficiary_name) order by position), '{}')
  into v_names
  from unnest(v_names) with ordinality as names(beneficiary_name, position);

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if exists (select 1 from public.completion_reports where order_id = p_order_id) then
    raise exception 'Record details are locked after report generation';
  end if;

  v_previous := jsonb_build_object(
    'beneficiary_country', v_order.beneficiary_country,
    'beneficiary_state', v_order.beneficiary_state,
    'beneficiary_village', v_order.beneficiary_village,
    'partner_organisation', v_order.partner_organisation,
    'beneficiary_names', v_order.beneficiary_names,
    'dedication_arabic', v_order.dedication_arabic,
    'dedication_remarks', v_order.dedication_remarks
  );
  v_next := jsonb_build_object(
    'beneficiary_country', nullif(btrim(coalesce(p_beneficiary_country,'')),''),
    'beneficiary_state', nullif(btrim(coalesce(p_beneficiary_state,'')),''),
    'beneficiary_village', nullif(btrim(coalesce(p_beneficiary_village,'')),''),
    'partner_organisation', nullif(btrim(coalesce(p_partner_organisation,'')),''),
    'beneficiary_names', v_names,
    'dedication_arabic', nullif(btrim(coalesce(p_dedication_arabic,'')),''),
    'dedication_remarks', nullif(btrim(coalesce(p_dedication_remarks,'')),'')
  );
  if v_previous = v_next then return true; end if;

  update public.orders
  set beneficiary_country = v_next->>'beneficiary_country',
      beneficiary_state = v_next->>'beneficiary_state',
      beneficiary_village = v_next->>'beneficiary_village',
      partner_organisation = v_next->>'partner_organisation',
      beneficiary_names = v_names,
      dedication_arabic = v_next->>'dedication_arabic',
      dedication_remarks = v_next->>'dedication_remarks'
  where id = p_order_id;
  perform public.append_order_event(
    p_order_id, 'order.record_details_updated', 'orders.record_details',
    v_previous, v_next, '{}'::jsonb
  );
  return true;
end;
$$;

drop function if exists public.broadcast_order(uuid, integer);
create or replace function public.broadcast_order(
  p_order_id uuid,
  p_hours integer default null,
  p_deadline timestamptz default null
) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_order public.orders%rowtype;
  v_hours integer;
  v_expires timestamptz;
  v_count integer;
begin
  if not public.is_admin() then
    raise exception 'AAL2 admin access is required';
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.payment_status not in ('paid','partially_refunded') then
    raise exception 'Only a paid order can be broadcast';
  end if;
  if v_order.fulfilment_status <> 'ready' then
    raise exception 'Order is not ready for broadcast';
  end if;

  select coalesce(p_hours, default_claim_window_hours)
  into v_hours from public.platform_settings where id = true;
  if v_hours is null or v_hours <= 0 then raise exception 'Claim window must be positive'; end if;
  if p_deadline is not null and p_deadline <= now() then
    raise exception 'Completion deadline must be in the future';
  end if;
  v_expires := now() + make_interval(hours => v_hours);

  update public.orders
  set fulfilment_status = 'broadcasting',
      assigned_vendor_id = null,
      accepted_at = null,
      broadcast_started_at = now(),
      broadcast_expires_at = v_expires,
      completion_deadline = coalesce(p_deadline, completion_deadline)
  where id = p_order_id;

  insert into public.job_offers(order_id, vendor_id, expires_at)
  select p_order_id, p.id, v_expires
  from public.profiles p
  where p.role = 'vendor'
    and p.status = 'active'
    and p.vendor_onboarding_status = 'approved'
    and p.services && array[v_order.category_slug]
  on conflict (order_id, vendor_id) do update
    set status = 'offered', offered_at = now(), expires_at = excluded.expires_at
    where public.job_offers.status <> 'claimed';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.claim_job(p_order_id uuid)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_order public.orders%rowtype;
begin
  if not public.is_vendor() then return false; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found
    or v_order.payment_status not in ('paid','partially_refunded')
    or v_order.fulfilment_status <> 'broadcasting'
    or v_order.assigned_vendor_id is not null then
    return false;
  end if;
  if not exists (
    select 1 from public.job_offers
    where order_id = p_order_id
      and vendor_id = auth.uid()
      and status = 'offered'
      and expires_at > now()
  ) then return false; end if;

  update public.orders
  set fulfilment_status = 'assigned', assigned_vendor_id = auth.uid(), accepted_at = now()
  where id = p_order_id;
  update public.job_offers
  set status = case when vendor_id = auth.uid() then 'claimed' else 'expired' end
  where order_id = p_order_id and status = 'offered';
  return true;
end;
$$;

create or replace function public.decline_job(p_order_id uuid)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_vendor() then raise exception 'Active approved vendor access is required'; end if;
  update public.job_offers
  set status = 'declined'
  where order_id = p_order_id
    and vendor_id = auth.uid()
    and status = 'offered'
    and expires_at > now();
  if found then
    perform public.append_order_event(
      p_order_id, 'offer.declined', 'job_offers', null, null,
      jsonb_build_object('vendor_id', auth.uid())
    );
  end if;
end;
$$;

create or replace function public.expire_stale_broadcasts()
returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_count integer;
begin
  if not (public.is_admin() or public.is_service_role()) then
    raise exception 'AAL2 admin or service role access is required';
  end if;
  update public.orders
  set fulfilment_status = 'ready'
  where fulfilment_status = 'broadcasting'
    and assigned_vendor_id is null
    and broadcast_expires_at < now();
  get diagnostics v_count = row_count;
  update public.job_offers set status = 'expired'
  where status = 'offered' and expires_at < now();
  return v_count;
end;
$$;

create or replace function public.mark_in_progress(p_order_id uuid)
returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_vendor() then return false; end if;
  update public.orders
  set fulfilment_status = 'in_progress'
  where id = p_order_id
    and assigned_vendor_id = auth.uid()
    and payment_status in ('paid','partially_refunded')
    and fulfilment_status = 'assigned';
  return found;
end;
$$;

drop function if exists public.submit_proof(uuid, text[], text);
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
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_order public.orders%rowtype;
  v_submission_id uuid;
  v_version integer;
  v_counts jsonb;
  v_seen jsonb := '{}'::jsonb;
  v_item jsonb;
  v_path text;
  v_category text;
  v_mime text;
  v_size bigint;
  v_index integer;
  v_slot text;
  v_media_type text;
begin
  if not public.is_vendor() then return false; end if;
  if jsonb_typeof(p_items) <> 'array' then raise exception 'Evidence must be a JSON array'; end if;
  if btrim(coalesce(p_project_country,'')) = ''
    or btrim(coalesce(p_project_state,'')) = ''
    or btrim(coalesce(p_project_village,'')) = ''
    or btrim(coalesce(p_project_address,'')) = ''
    or p_project_lat is null or p_project_lat not between -90 and 90
    or p_project_lng is null or p_project_lng not between -180 and 180 then
    raise exception 'Exact project location and valid GPS coordinates are required';
  end if;
  if btrim(coalesce(p_notes,'')) = '' then
    raise exception 'A vendor completion summary is required';
  end if;
  if btrim(coalesce(p_project_maps_link,'')) <> ''
    and btrim(p_project_maps_link) !~* '^https://[^[:space:]]+$' then
    raise exception 'Google Maps link must be a valid HTTPS URL';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_items) item
    where jsonb_typeof(item) <> 'object'
      or btrim(coalesce(item->>'path','')) = ''
      or coalesce(item->>'category','') not in (
        'before_photo','during_photo','after_photo','before_video','during_video','after_video','dua_video',
        'extra_photo','extra_video'
      )
  ) then raise exception 'Every evidence item requires a valid path and category'; end if;
  if (select count(*) from jsonb_array_elements(p_items))
     <> (select count(distinct item->>'path') from jsonb_array_elements(p_items) item) then
    raise exception 'Evidence paths must be unique';
  end if;

  select jsonb_object_agg(category, item_count) into v_counts
  from (
    select item->>'category' category, count(*) item_count
    from jsonb_array_elements(p_items) item
    group by item->>'category'
  ) counted;
  if coalesce((v_counts->>'before_photo')::integer,0) <> 3
    or coalesce((v_counts->>'during_photo')::integer,0) <> 3
    or coalesce((v_counts->>'after_photo')::integer,0) <> 3
    or coalesce((v_counts->>'before_video')::integer,0) <> 1
    or coalesce((v_counts->>'during_video')::integer,0) <> 1
    or coalesce((v_counts->>'after_video')::integer,0) <> 1
    or coalesce((v_counts->>'dua_video')::integer,0) <> 1 then
    raise exception 'Exactly 9 required photos and 4 required videos must be submitted; use extra categories for additional evidence';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found
    or v_order.assigned_vendor_id <> auth.uid()
    or v_order.payment_status not in ('paid','partially_refunded')
    or v_order.fulfilment_status not in ('in_progress','revision_required') then
    return false;
  end if;
  select coalesce(max(version),0) + 1 into v_version
  from public.completion_submissions where order_id = p_order_id;

  insert into public.completion_submissions (
    order_id, vendor_id, version, project_country, project_state, project_village,
    project_address, project_lat, project_lng, project_maps_link, vendor_remarks
  ) values (
    p_order_id, auth.uid(), v_version, btrim(p_project_country), btrim(p_project_state),
    btrim(p_project_village), btrim(p_project_address), p_project_lat, p_project_lng,
    nullif(btrim(coalesce(p_project_maps_link,'')),''), btrim(p_notes)
  ) returning id into v_submission_id;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_path := v_item->>'path';
    v_category := v_item->>'category';
    if v_path not like auth.uid()::text || '/' || p_order_id::text || '/%' then
      raise exception 'Evidence path does not belong to this vendor and order';
    end if;

    select lower(coalesce(o.metadata->>'mimetype','')),
           coalesce((o.metadata->>'size')::bigint,0)
    into v_mime, v_size
    from storage.objects o
    where o.bucket_id = 'proofs' and o.name = v_path;
    if not found then raise exception 'Uploaded evidence object not found: %', v_path; end if;

    v_media_type := case when v_category like '%photo' then 'photo' else 'video' end;
    if v_media_type = 'photo' and (v_mime not in ('image/jpeg','image/png','image/webp') or v_size <= 0 or v_size > 10485760) then
      raise exception 'Photo evidence must be JPEG, PNG, or WebP and no larger than 10 MB';
    end if;
    if v_media_type = 'video' and (v_mime not in ('video/mp4','video/quicktime') or v_size <= 0 or v_size > 262144000) then
      raise exception 'Video evidence must be MP4 or MOV and no larger than 250 MB';
    end if;

    v_index := coalesce((v_seen->>v_category)::integer,0) + 1;
    v_seen := jsonb_set(v_seen, array[v_category], to_jsonb(v_index), true);
    v_slot := case
      when v_category in ('before_video','during_video','after_video','dua_video') then v_category
      else v_category || '_' || v_index::text
    end;
    insert into public.proofs (
      order_id, uploaded_by, storage_path, media_type, category,
      submission_id, evidence_slot, mime_type, size_bytes
    ) values (
      p_order_id, auth.uid(), v_path, v_media_type, v_category,
      v_submission_id, v_slot, v_mime, v_size
    );
  end loop;

  update public.orders
  set fulfilment_status = 'proof_submitted',
      delivery_status = 'not_ready',
      proof_submitted_at = now(),
      vendor_remarks = btrim(p_notes),
      project_country = btrim(p_project_country),
      project_state = btrim(p_project_state),
      project_village = btrim(p_project_village),
      project_address = btrim(p_project_address),
      project_lat = p_project_lat,
      project_lng = p_project_lng,
      project_maps_link = nullif(btrim(coalesce(p_project_maps_link,'')),''),
      admin_verification_status = null,
      admin_verification_notes = null,
      admin_verified_by = null,
      admin_verified_at = null
  where id = p_order_id;
  perform public.append_order_event(
    p_order_id, 'evidence.submitted', 'completion_submissions', null, null,
    jsonb_build_object('submission_id',v_submission_id,'version',v_version)
  );
  return true;
end;
$$;

-- Remove the legacy three-argument overload: leaving it executable would let
-- callers approve a submission without the mandatory review checklist.
drop function if exists public.review_proof(uuid,boolean,text);

create or replace function public.review_proof(
  p_order_id uuid,
  p_approved boolean,
  p_notes text default null,
  p_checklist jsonb default '{}'::jsonb
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_submission public.completion_submissions%rowtype;
begin
  if not public.is_admin() then raise exception 'AAL2 admin access is required'; end if;
  if not p_approved and btrim(coalesce(p_notes,'')) = '' then
    raise exception 'A revision reason is required';
  end if;
  if p_approved and not coalesce(p_checklist @> '{"location":true,"before_media":true,"during_media":true,"after_media":true,"dua_video":true,"nameplate_execution":true}'::jsonb,false) then
    raise exception 'Complete the mandatory verification checklist before approval';
  end if;
  perform 1 from public.orders
  where id = p_order_id
    and payment_status in ('paid','partially_refunded')
    and fulfilment_status = 'proof_submitted'
  for update;
  if not found then return false; end if;

  select * into v_submission
  from public.completion_submissions
  where order_id = p_order_id and status = 'submitted'
  order by version desc
  limit 1 for update;
  if not found then raise exception 'No current submission exists'; end if;

  update public.completion_submissions
  set status = case when p_approved then 'approved' else 'revision_required' end,
      reviewed_by = auth.uid(), reviewed_at = now(), review_notes = nullif(btrim(coalesce(p_notes,'')),''),
      review_checklist = coalesce(p_checklist,'{}'::jsonb)
  where id = v_submission.id;

  update public.orders
  set fulfilment_status = case when p_approved then 'verified' else 'revision_required' end,
      delivery_status = 'not_ready',
      settlement_status = 'unpaid',
      completed_at = null,
      closed_at = null,
      admin_verified_by = auth.uid(),
      admin_verified_at = now(),
      admin_verification_notes = nullif(btrim(coalesce(p_notes,'')),''),
      admin_verification_status = case when p_approved then 'approved' else 'rejected' end
  where id = p_order_id;
  perform public.append_order_event(
    p_order_id,
    case when p_approved then 'evidence.approved' else 'evidence.revision_required' end,
    'completion_submissions', null, null,
    jsonb_build_object('submission_id',v_submission.id,'version',v_submission.version,'checklist',coalesce(p_checklist,'{}'::jsonb))
  );
  if p_approved then perform public.sync_order_milestones(p_order_id); end if;
  return true;
end;
$$;

-- These legacy shortcuts bypass provider truth and are deliberately unusable.
create or replace function public.complete_order(p_order_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  raise exception 'complete_order is retired; use review and provider delivery workflows';
end;
$$;
create or replace function public.record_customer_delivery(
  p_order_id uuid, p_channel text, p_delivered boolean
) returns boolean language plpgsql security definer set search_path = '' as $$
begin
  raise exception 'Manual delivery recording is disabled; provider results are authoritative';
end;
$$;

create or replace function public.sync_order_closure(p_order_id uuid)
returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'AAL2 admin access is required'; end if;
  return public.sync_order_milestones(p_order_id);
end;
$$;

create or replace function public.record_vendor_payment(
  p_vendor_id uuid,
  p_order_id uuid,
  p_amount integer,
  p_payment_date date,
  p_method text,
  p_reference text,
  p_notes text default null,
  p_entry_type text default 'payment',
  p_reverses_payment_id uuid default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not public.is_admin() then raise exception 'AAL2 admin access is required'; end if;
  insert into public.vendor_payments (
    vendor_id, order_id, amount, currency, payment_date, method, reference,
    notes, recorded_by, entry_type, reverses_payment_id
  ) values (
    p_vendor_id, p_order_id, p_amount, 'SGD', coalesce(p_payment_date,current_date),
    nullif(btrim(coalesce(p_method,'')),''), btrim(p_reference),
    nullif(btrim(coalesce(p_notes,'')),''), auth.uid(), p_entry_type, p_reverses_payment_id
  ) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.resolve_support_report(
  p_report_id uuid,
  p_source text,
  p_notes text
) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'AAL2 admin access is required'; end if;
  if btrim(coalesce(p_notes,'')) = '' then raise exception 'Resolution notes are required'; end if;
  if p_source = 'vendor' then
    update public.vendor_reports
    set status = 'resolved', resolved_at = now(), resolved_by = auth.uid(), resolution_notes = btrim(p_notes)
    where id = p_report_id and status = 'open';
  elsif p_source = 'customer' then
    update public.customer_reports
    set status = 'resolved', resolved_at = now(), resolved_by = auth.uid(), resolution_notes = btrim(p_notes)
    where id = p_report_id and status = 'open';
  else
    raise exception 'Unsupported report source';
  end if;
  return found;
end;
$$;

create or replace function public.complete_vendor_onboarding(
  p_organisation_name text,
  p_contact_person text,
  p_phone text,
  p_whatsapp text,
  p_country text,
  p_city_address text,
  p_vendor_type text,
  p_services text[],
  p_bank_name text,
  p_bank_account_name text,
  p_bank_account_number text,
  p_swift_code text default null
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_invitation_id uuid;
  v_services text[];
begin
  if public.session_uses_auth_method('oauth') then return false; end if;

  select id into v_invitation_id
  from public.vendor_invitations
  where auth_user_id = auth.uid()
    and status = 'invited'
    and expires_at > now()
  order by created_at desc
  limit 1 for update;
  if not found then return false; end if;

  if not exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'vendor'
      and status = 'active'
      and vendor_onboarding_status = 'invited'
  ) then return false; end if;

  if btrim(coalesce(p_organisation_name,'')) = ''
    or btrim(coalesce(p_contact_person,'')) = ''
    or btrim(coalesce(p_phone,'')) = ''
    or btrim(coalesce(p_country,'')) = ''
    or btrim(coalesce(p_city_address,'')) = ''
    or btrim(coalesce(p_vendor_type,'')) = ''
    or btrim(coalesce(p_bank_name,'')) = ''
    or btrim(coalesce(p_bank_account_name,'')) = ''
    or btrim(coalesce(p_bank_account_number,'')) = '' then
    raise exception 'Organisation, contact, capability, location, and bank details are required';
  end if;
  if greatest(
    length(btrim(p_organisation_name)), length(btrim(p_contact_person)), length(btrim(p_phone)),
    length(btrim(coalesce(p_whatsapp,''))), length(btrim(p_country)), length(btrim(p_city_address)),
    length(btrim(p_vendor_type)), length(btrim(p_bank_name)), length(btrim(p_bank_account_name)),
    length(btrim(p_bank_account_number)), length(btrim(coalesce(p_swift_code,'')))
  ) > 200 then
    raise exception 'Vendor onboarding fields must not exceed 200 characters';
  end if;
  if btrim(p_vendor_type) not in (
    'Korban fulfilment partner',
    'Wakaf water & infrastructure',
    'Wakaf distribution (Quran / food)',
    'General / multi-service vendor'
  ) then
    raise exception 'Unsupported vendor type';
  end if;
  if coalesce(cardinality(p_services),0) = 0 or exists (
    select 1
    from unnest(coalesce(p_services,'{}'::text[])) as requested(service)
    where service is null or btrim(service) not in (
      'korban','water','quran','orphans','tahfiz','aqiqah','digital_products','marketing','logistics'
    )
  ) then
    raise exception 'Choose at least one valid vendor service';
  end if;
  select array_agg(distinct btrim(service) order by btrim(service)) into v_services
  from unnest(p_services) as requested(service);

  update public.profiles
  set display_name = btrim(p_organisation_name),
      contact_person = btrim(p_contact_person),
      phone = btrim(p_phone),
      whatsapp = nullif(btrim(coalesce(p_whatsapp,'')),''),
      country = btrim(p_country),
      city_address = btrim(p_city_address),
      vendor_type = btrim(p_vendor_type),
      services = v_services,
      currency = 'SGD',
      bank_name = btrim(p_bank_name),
      bank_account_name = btrim(p_bank_account_name),
      bank_account_number = btrim(p_bank_account_number),
      swift_code = nullif(btrim(coalesce(p_swift_code,'')),''),
      vendor_onboarding_status = 'pending'
  where id = auth.uid()
    and role = 'vendor'
    and status = 'active'
    and vendor_onboarding_status = 'invited';
  if not found then return false; end if;

  update public.vendor_invitations
  set status = 'accepted', accepted_at = now()
  where id = v_invitation_id and status = 'invited';
  if not found then raise exception 'Vendor invitation is no longer available'; end if;
  return true;
end;
$$;

-- Rollout compatibility for invitations whose complete vendor details were
-- already captured by the admin. Incomplete profiles cannot skip onboarding.
create or replace function public.accept_vendor_invitation()
returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_invitation_id uuid;
begin
  select id into v_invitation_id
  from public.vendor_invitations
  where auth_user_id = auth.uid()
    and status = 'invited'
    and expires_at > now()
  order by created_at desc
  limit 1 for update;
  if not found then return false; end if;
  if not exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'vendor'
      and status = 'active'
      and vendor_onboarding_status = 'invited'
      and btrim(display_name) <> ''
      and btrim(coalesce(contact_person,'')) <> ''
      and btrim(coalesce(phone,'')) <> ''
      and btrim(coalesce(country,'')) <> ''
      and btrim(coalesce(city_address,'')) <> ''
      and vendor_type in (
        'Korban fulfilment partner',
        'Wakaf water & infrastructure',
        'Wakaf distribution (Quran / food)',
        'General / multi-service vendor'
      )
      and cardinality(services) > 0
      and not exists (
        select 1 from unnest(services) as selected(service)
        where service is null or btrim(service) not in (
          'korban','water','quran','orphans','tahfiz','aqiqah','digital_products','marketing','logistics'
        )
      )
      and btrim(coalesce(bank_name,'')) <> ''
      and btrim(coalesce(bank_account_name,'')) <> ''
      and btrim(coalesce(bank_account_number,'')) <> ''
  ) then return false; end if;

  update public.vendor_invitations
  set status = 'accepted', accepted_at = now()
  where id = v_invitation_id;
  update public.profiles set vendor_onboarding_status = 'pending' where id = auth.uid();
  return true;
end;
$$;

-- --------------------------------------------------------------------------
-- HitPay, Telegram, Brevo, and notification queue contracts
-- --------------------------------------------------------------------------

alter table public.payment_transactions
  add column if not exists provider_event_type text;

create or replace function public.prepare_hitpay_payment(p_order_id uuid)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_order public.orders%rowtype;
  v_profile public.profiles%rowtype;
  v_email text;
  v_transaction public.payment_transactions%rowtype;
  v_reservation text;
begin
  if not public.is_customer() then raise exception 'Active customer access is required'; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.customer_id <> auth.uid() then raise exception 'Order not found'; end if;
  select * into v_profile from public.profiles where id = auth.uid();
  select email into v_email
  from auth.users where id = auth.uid() and email_confirmed_at is not null;
  if v_email is null then raise exception 'A verified email is required before payment'; end if;
  if v_profile.telegram_chat_id is null or v_profile.telegram_linked_at is null then
    raise exception 'Link Telegram before payment';
  end if;
  if v_order.payment_status in ('paid','partially_refunded','refunded') then
    raise exception 'Order is not payable';
  end if;
  if v_order.fulfilment_status <> 'not_ready' then raise exception 'Order fulfilment has already started'; end if;

  update public.orders
  set customer_email = v_email, payment_provider = 'hitpay', payment_status = 'pending'
  where id = p_order_id;

  update public.payment_transactions
  set status = 'expired'
  where order_id = p_order_id
    and transaction_type = 'payment'
    and status = 'pending'
    and expires_at is not null
    and expires_at <= now();

  select * into v_transaction
  from public.payment_transactions
  where order_id = p_order_id
    and transaction_type = 'payment'
    and status = 'pending'
    and checkout_url is not null
    and expires_at > now()
  order by created_at desc
  limit 1;
  if found then
    return jsonb_build_object(
      'order_id', v_order.id, 'reference', v_order.reference, 'amount', v_order.total_amount,
      'currency', v_order.currency, 'customer_name', v_order.customer_name,
      'customer_email', v_email, 'customer_phone', v_order.customer_phone,
      'should_create', false, 'creating', false,
      'checkout_url', v_transaction.checkout_url, 'expires_at', v_transaction.expires_at
    );
  end if;

  select * into v_transaction
  from public.payment_transactions
  where order_id = p_order_id
    and transaction_type = 'payment'
    and status = 'pending'
    and checkout_url is null
    and provider_request_id like 'reservation:%'
    and expires_at > now()
  order by created_at desc
  limit 1;
  if found then
    return jsonb_build_object(
      'order_id', v_order.id, 'reference', v_order.reference, 'amount', v_order.total_amount,
      'currency', v_order.currency, 'customer_name', v_order.customer_name,
      'customer_email', v_email, 'customer_phone', v_order.customer_phone,
      'should_create', false, 'creating', true,
      'checkout_url', null, 'expires_at', v_transaction.expires_at
    );
  end if;

  v_reservation := 'reservation:' || gen_random_uuid()::text;
  insert into public.payment_transactions (
    order_id, transaction_type, provider_request_id, amount, currency, status, expires_at
  ) values (
    p_order_id, 'payment', v_reservation, v_order.total_amount, 'SGD', 'pending', now() + interval '2 minutes'
  );

  return jsonb_build_object(
    'order_id', v_order.id, 'reference', v_order.reference, 'amount', v_order.total_amount,
    'currency', v_order.currency, 'customer_name', v_order.customer_name,
    'customer_email', v_email, 'customer_phone', v_order.customer_phone,
    'should_create', true, 'creating', false,
    'checkout_url', null, 'expires_at', null
  );
end;
$$;

create or replace function public.record_hitpay_payment_request(
  p_order_id uuid,
  p_provider_request_id text,
  p_checkout_url text,
  p_expires_at timestamptz
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
  v_order public.orders%rowtype;
begin
  if not public.is_service_role() then raise exception 'Service role access is required'; end if;
  if btrim(coalesce(p_provider_request_id,'')) = ''
    or btrim(coalesce(p_checkout_url,'')) = ''
    or p_expires_at is null or p_expires_at <= now() then
    raise exception 'A valid HitPay request, URL, and future expiry are required';
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.payment_status <> 'pending' or v_order.fulfilment_status <> 'not_ready' then
    raise exception 'Order is not awaiting payment';
  end if;

  select id into v_id from public.payment_transactions
  where provider = 'hitpay'
    and transaction_type = 'payment'
    and provider_request_id = p_provider_request_id
    and order_id = p_order_id;
  if found then return v_id; end if;

  select id into v_id
  from public.payment_transactions
  where order_id = p_order_id
    and transaction_type = 'payment'
    and status = 'pending'
    and checkout_url is null
    and provider_request_id like 'reservation:%'
  order by created_at desc
  limit 1 for update;
  if found then
    update public.payment_transactions
    set provider_request_id = p_provider_request_id,
        checkout_url = p_checkout_url,
        expires_at = p_expires_at,
        updated_at = now()
    where id = v_id;
  else
    insert into public.payment_transactions (
      order_id, transaction_type, provider_request_id, amount, currency, status, checkout_url, expires_at
    ) values (
      p_order_id, 'payment', p_provider_request_id, v_order.total_amount, 'SGD', 'pending', p_checkout_url, p_expires_at
    ) returning id into v_id;
  end if;
  perform public.append_order_event(
    p_order_id, 'payment.requested', 'payment_transactions', null, null,
    jsonb_build_object('transaction_id',v_id,'provider_request_id',p_provider_request_id)
  );
  return v_id;
end;
$$;

create or replace function public.prepare_hitpay_refund(
  p_order_id uuid,
  p_amount integer,
  p_reason text,
  p_confirm_fulfilment_started boolean default false
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_order public.orders%rowtype;
  v_payment_id text;
  v_payment_request_id text;
  v_refunded bigint;
  v_refundable integer;
  v_fulfilment_started boolean;
  v_transaction_id uuid;
begin
  if not public.is_admin() then raise exception 'AAL2 admin access is required'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Refund amount must be positive'; end if;
  if btrim(coalesce(p_reason,'')) = '' then raise exception 'A refund reason is required'; end if;
  if length(btrim(p_reason)) > 1000 then raise exception 'Refund reason must not exceed 1000 characters'; end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.payment_provider <> 'hitpay'
    or v_order.payment_status not in ('paid','partially_refunded') then
    raise exception 'Only a captured HitPay payment can be refunded';
  end if;

  update public.payment_transactions
  set status = 'expired', provider_event_type = 'refund.reservation_expired', provider_event_at = now()
  where order_id = p_order_id
    and transaction_type = 'refund'
    and status = 'pending'
    and provider_payment_id is null
    and expires_at is not null
    and expires_at <= now();
  if exists (
    select 1 from public.payment_transactions
    where order_id = p_order_id and transaction_type = 'refund' and status = 'pending'
  ) then
    raise exception 'Another refund is already pending for this order';
  end if;

  select provider_payment_id, provider_request_id
  into v_payment_id, v_payment_request_id
  from public.payment_transactions
  where order_id = p_order_id
    and transaction_type = 'payment'
    and status = 'succeeded'
    and provider_payment_id is not null
  order by provider_event_at desc nulls last, created_at desc
  limit 1;
  if not found then raise exception 'The captured HitPay payment ID is unavailable'; end if;

  select coalesce(sum(amount),0) into v_refunded
  from public.payment_transactions
  where order_id = p_order_id and transaction_type = 'refund' and status = 'succeeded';
  v_refundable := v_order.total_amount - v_refunded;
  if p_amount > v_refundable then raise exception 'Refund exceeds the outstanding refundable amount'; end if;

  v_fulfilment_started := v_order.fulfilment_status not in ('not_ready','ready','cancelled');
  if v_fulfilment_started and not coalesce(p_confirm_fulfilment_started,false) then
    raise exception 'Fulfilment has started; explicit refund confirmation is required';
  end if;

  insert into public.payment_transactions (
    order_id, transaction_type, provider_request_id, amount, currency, status,
    expires_at, reason, requested_by, raw_payload
  ) values (
    p_order_id, 'refund', 'refund-reservation:' || gen_random_uuid()::text,
    p_amount, 'SGD', 'pending', now() + interval '15 minutes', btrim(p_reason), auth.uid(),
    jsonb_build_object('fulfilment_started_confirmed',v_fulfilment_started and p_confirm_fulfilment_started)
  ) returning id into v_transaction_id;

  perform public.append_order_event(
    p_order_id, 'refund.requested', 'payment_transactions', null, null,
    jsonb_build_object(
      'transaction_id',v_transaction_id,'amount',p_amount,'currency','SGD',
      'reason',btrim(p_reason),'fulfilment_started',v_fulfilment_started
    )
  );
  return jsonb_build_object(
    'transaction_id',v_transaction_id,
    'order_id',v_order.id,
    'reference',v_order.reference,
    'payment_id',v_payment_id,
    'payment_request_id',v_payment_request_id,
    'amount',p_amount,
    'currency','SGD',
    'reason',btrim(p_reason),
    'refundable_amount',v_refundable,
    'fulfilment_started',v_fulfilment_started
  );
end;
$$;

create or replace function public.record_hitpay_refund_result(
  p_transaction_id uuid,
  p_provider_refund_id text,
  p_accepted boolean,
  p_error_message text default null,
  p_payload jsonb default '{}'::jsonb
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_refund public.payment_transactions%rowtype;
begin
  if not public.is_service_role() then raise exception 'Service role access is required'; end if;
  select * into v_refund
  from public.payment_transactions
  where id = p_transaction_id and transaction_type = 'refund'
  for update;
  if not found then return false; end if;

  if coalesce(p_accepted,false) then
    if btrim(coalesce(p_provider_refund_id,'')) = '' then
      raise exception 'HitPay refund ID is required for an accepted refund';
    end if;
    if v_refund.status = 'failed' or v_refund.status in ('expired','cancelled') then
      raise exception 'This refund reservation is no longer active';
    end if;
    if v_refund.provider_payment_id is not null
      and v_refund.provider_payment_id <> btrim(p_provider_refund_id) then
      raise exception 'HitPay refund ID does not match the recorded result';
    end if;
    update public.payment_transactions
    set provider_payment_id = btrim(p_provider_refund_id),
        expires_at = null,
        provider_event_type = case when status = 'succeeded' then provider_event_type else 'refund.api_accepted' end,
        provider_event_at = coalesce(provider_event_at,now()),
        raw_payload = raw_payload || jsonb_build_object('api_response',coalesce(p_payload,'{}'::jsonb))
    where id = p_transaction_id;
  else
    if v_refund.status = 'succeeded' then return true; end if;
    if btrim(coalesce(p_error_message,'')) = '' then
      raise exception 'Provider failure details are required';
    end if;
    update public.payment_transactions
    set status = 'failed',
        provider_payment_id = coalesce(nullif(btrim(coalesce(p_provider_refund_id,'')),''),provider_payment_id),
        expires_at = null,
        provider_event_type = 'refund.api_failed',
        provider_event_at = now(),
        raw_payload = raw_payload || jsonb_build_object(
          'api_error',left(btrim(p_error_message),1000),
          'api_response',coalesce(p_payload,'{}'::jsonb)
        )
    where id = p_transaction_id;
  end if;
  perform public.append_order_event(
    v_refund.order_id,
    case when p_accepted then 'refund.provider_accepted' else 'refund.provider_failed' end,
    'payment_transactions', null, null,
    jsonb_build_object(
      'transaction_id',p_transaction_id,
      'provider_refund_id',nullif(btrim(coalesce(p_provider_refund_id,'')),''),
      'error',case when p_accepted then null else left(btrim(p_error_message),1000) end
    )
  );
  return true;
end;
$$;

create or replace function public.process_hitpay_webhook(
  p_payload_hash text,
  p_event_type text,
  p_event_object text,
  p_provider_request_id text,
  p_reference text,
  p_status text,
  p_amount integer,
  p_currency text,
  p_payload jsonb
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
  v_order_id uuid;
  v_reference_order_id uuid;
  v_order public.orders%rowtype;
  v_type text;
  v_existing public.payment_transactions%rowtype;
  v_refunded bigint;
  v_refund_delta integer;
  v_payment_id text;
begin
  if not public.is_service_role() then raise exception 'Service role access is required'; end if;
  if btrim(coalesce(p_payload_hash,'')) = ''
    or btrim(coalesce(p_provider_request_id,'')) = ''
    or p_status not in ('succeeded','failed','expired','cancelled')
    or p_amount is null or p_amount <= 0
    or p_currency <> 'SGD' then
    raise exception 'Invalid normalized HitPay event';
  end if;

  select id into v_id from public.payment_transactions
  where provider = 'hitpay' and payload_hash = p_payload_hash;
  if found then return v_id; end if;

  select order_id into v_order_id
  from public.payment_transactions
  where provider = 'hitpay' and provider_request_id = p_provider_request_id
  order by case when transaction_type = 'payment' then 0 else 1 end, created_at desc
  limit 1;
  if btrim(coalesce(p_reference,'')) <> '' then
    select id into v_reference_order_id from public.orders where reference = p_reference;
    if v_order_id is not null and v_reference_order_id is distinct from v_order_id then
      raise exception 'HitPay reference does not match its payment request';
    end if;
    v_order_id := coalesce(v_order_id, v_reference_order_id);
  end if;
  if v_order_id is null then raise exception 'HitPay order could not be resolved'; end if;

  select * into v_order from public.orders where id = v_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  v_type := case when lower(coalesce(p_event_type,'')) like '%refund%' then 'refund' else 'payment' end;

  if v_type = 'payment' then
    v_payment_id := nullif(coalesce(
      p_payload->>'payment_id',
      p_payload#>>'{payments,0,id}',
      p_payload#>>'{charges,0,id}',
      p_payload->>'id',
      ''
    ),'');
    select * into v_existing
    from public.payment_transactions
    where provider = 'hitpay'
      and transaction_type = 'payment'
      and provider_request_id = p_provider_request_id
    for update;
    if p_amount <> v_order.total_amount then raise exception 'HitPay payment amount does not match the order'; end if;
    if found then
      if v_existing.status = 'succeeded' and p_status <> 'succeeded' then return v_existing.id; end if;
      update public.payment_transactions
      set provider_payment_id = coalesce(v_payment_id, provider_payment_id),
          amount = p_amount, status = p_status, payload_hash = p_payload_hash,
          provider_event_type = p_event_type, provider_event_at = now(),
          raw_payload = coalesce(p_payload,'{}'::jsonb), updated_at = now()
      where id = v_existing.id returning id into v_id;
    else
      insert into public.payment_transactions (
        order_id, transaction_type, provider_request_id, provider_payment_id,
        amount, currency, status, payload_hash, provider_event_type, provider_event_at, raw_payload
      ) values (
        v_order_id, 'payment', p_provider_request_id, v_payment_id,
        p_amount, 'SGD', p_status, p_payload_hash, p_event_type, now(), coalesce(p_payload,'{}'::jsonb)
      ) returning id into v_id;
    end if;

    if p_status = 'succeeded' then
      update public.orders
      set payment_provider = 'hitpay', payment_status = 'paid',
          payment_confirmed_at = coalesce(payment_confirmed_at,now()),
          payment_reference = p_provider_request_id,
          fulfilment_status = case when fulfilment_status = 'not_ready' then 'ready' else fulfilment_status end
      where id = v_order_id;
    elsif v_order.payment_status in ('pending','failed','expired') and not exists (
      select 1 from public.payment_transactions
      where order_id = v_order_id and transaction_type = 'payment' and status = 'succeeded'
    ) then
      update public.orders set payment_status = p_status where id = v_order_id;
    end if;
  else
    if v_order.payment_status not in ('paid','partially_refunded','refunded') then
      raise exception 'Only a captured payment can be refunded';
    end if;
    if p_status <> 'succeeded' then
      raise exception 'Charge refund webhooks must represent confirmed provider state';
    end if;
    if p_amount > v_order.total_amount then raise exception 'Refund exceeds the captured amount'; end if;

    select coalesce(sum(amount),0) into v_refunded
    from public.payment_transactions
    where order_id = v_order_id and transaction_type = 'refund' and status = 'succeeded';
    if p_amount <= v_refunded then
      select id into v_id
      from public.payment_transactions
      where order_id = v_order_id and transaction_type = 'refund' and status = 'succeeded'
      order by provider_event_at desc nulls last, created_at desc
      limit 1;
      return v_id;
    end if;
    v_refund_delta := p_amount - v_refunded;

    select * into v_existing
    from public.payment_transactions
    where order_id = v_order_id
      and transaction_type = 'refund'
      and status = 'pending'
    for update;
    if found then
      if v_existing.amount <> v_refund_delta then
        raise exception 'HitPay cumulative refund does not match the pending refund request';
      end if;
      update public.payment_transactions
      set status = 'succeeded',
          expires_at = null,
          payload_hash = p_payload_hash,
          provider_event_type = p_event_type,
          provider_event_at = now(),
          raw_payload = raw_payload || jsonb_build_object('webhook',coalesce(p_payload,'{}'::jsonb))
      where id = v_existing.id
      returning id into v_id;
    else
      insert into public.payment_transactions (
        order_id, transaction_type, provider_request_id, amount, currency, status,
        payload_hash, provider_event_type, provider_event_at, reason, raw_payload
      ) values (
        v_order_id, 'refund', 'webhook:' || p_payload_hash,
        v_refund_delta, 'SGD', 'succeeded', p_payload_hash, p_event_type, now(),
        'External HitPay refund', jsonb_build_object('webhook',coalesce(p_payload,'{}'::jsonb))
      ) returning id into v_id;
    end if;

    v_refunded := v_refunded + v_refund_delta;
    if v_refunded > v_order.total_amount then raise exception 'Recorded refunds exceed the captured amount'; end if;
    if v_refunded = v_order.total_amount
      and v_order.assigned_vendor_id is null
      and v_order.fulfilment_status in ('not_ready','ready','broadcasting') then
      update public.orders
      set payment_status = 'refunded',
          fulfilment_status = 'cancelled',
          delivery_status = 'not_ready',
          settlement_status = 'unpaid'
      where id = v_order_id;
      update public.job_offers
      set status = 'expired'
      where order_id = v_order_id and status = 'offered';
    else
      update public.orders
      set payment_status = case when v_refunded = total_amount then 'refunded' else 'partially_refunded' end
      where id = v_order_id;
    end if;
  end if;
  perform public.append_order_event(
    v_order_id, 'payment.provider_event', 'payment_transactions', null, null,
    jsonb_build_object(
      'transaction_id',v_id,'transaction_type',v_type,'status',p_status,
      'amount',case when v_type = 'refund' then v_refund_delta else p_amount end,
      'cumulative_refunded_amount',case when v_type = 'refund' then p_amount else null end,
      'currency',p_currency,'event_type',p_event_type
    )
  );
  return v_id;
end;
$$;

create or replace function public.create_telegram_link_token()
returns table(token text, expires_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare
  v_token text;
  v_hash text;
  v_crypto_schema text;
  v_expires timestamptz := now() + interval '15 minutes';
begin
  if not public.is_customer() then raise exception 'Active customer access is required'; end if;
  update public.telegram_link_tokens
  set consumed_at = now()
  where profile_id = auth.uid() and consumed_at is null;
  v_token := replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');
  select n.nspname into v_crypto_schema
  from pg_catalog.pg_proc p
  join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  where p.proname = 'digest'
    and p.pronargs = 2
    and p.proargtypes[0] = 'text'::regtype
    and p.proargtypes[1] = 'text'::regtype
  order by (n.nspname = 'extensions') desc, (n.nspname = 'public') desc
  limit 1;
  if v_crypto_schema is null then raise exception 'pgcrypto digest function is unavailable'; end if;
  execute format('select encode(%I.digest($1,''sha256''),''hex'')',v_crypto_schema)
  into v_hash using v_token;
  insert into public.telegram_link_tokens(profile_id, token_hash, expires_at)
  values (auth.uid(), v_hash, v_expires);
  return query select v_token, v_expires;
end;
$$;

create or replace function public.consume_telegram_link_token(
  p_token_hash text,
  p_chat_id bigint,
  p_telegram_user_id bigint,
  p_username text default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_token public.telegram_link_tokens%rowtype;
begin
  if not public.is_service_role() then raise exception 'Service role access is required'; end if;
  if p_token_hash is null or char_length(p_token_hash) <> 64 or p_chat_id is null or p_telegram_user_id is null then
    raise exception 'Invalid Telegram link payload';
  end if;
  select * into v_token from public.telegram_link_tokens
  where token_hash = lower(p_token_hash) and consumed_at is null and expires_at > now()
  for update;
  if not found then raise exception 'Telegram link is invalid or expired'; end if;
  update public.profiles
  set telegram_chat_id = p_chat_id,
      telegram_user_id = p_telegram_user_id,
      telegram_username = nullif(btrim(coalesce(p_username,'')),''),
      telegram_linked_at = now()
  where id = v_token.profile_id and role = 'customer' and status = 'active';
  if not found then raise exception 'Customer profile is not active'; end if;
  update public.telegram_link_tokens set consumed_at = now() where id = v_token.id;
  return v_token.profile_id;
end;
$$;

create or replace function public.queue_order_notifications(p_order_id uuid, p_report_id uuid)
returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_order public.orders%rowtype;
  v_chat_id bigint;
  v_count integer;
begin
  if not (public.is_admin() or public.is_service_role()) then
    raise exception 'AAL2 admin or service role access is required';
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found
    or v_order.payment_status not in ('paid','partially_refunded')
    or v_order.fulfilment_status <> 'verified' then
    raise exception 'Only a paid, verified order can be queued for delivery';
  end if;
  if not exists (
    select 1 from public.completion_reports r
    join public.completion_submissions s on s.id = r.submission_id
    where r.id = p_report_id and r.order_id = p_order_id and r.kind = 'customer' and s.status = 'approved'
  ) then raise exception 'A customer report for the approved submission is required'; end if;
  select telegram_chat_id into v_chat_id from public.profiles where id = v_order.customer_id;
  if btrim(coalesce(v_order.customer_email,'')) = '' or v_chat_id is null then
    raise exception 'Verified email and linked Telegram are both required';
  end if;

  insert into public.notification_deliveries(order_id, report_id, channel, recipient, attempt)
  values
    (p_order_id, p_report_id, 'email', v_order.customer_email, 1),
    (p_order_id, p_report_id, 'telegram', v_chat_id::text, 1)
  on conflict (order_id, channel, attempt) do nothing;
  get diagnostics v_count = row_count;
  if v_count > 0 then
    perform public.append_order_event(
      p_order_id, 'delivery.queued', 'notification_deliveries', null, null,
      jsonb_build_object('report_id',p_report_id,'channels',jsonb_build_array('email','telegram'))
    );
  end if;
  perform public.sync_order_milestones(p_order_id);
  return v_count;
end;
$$;

create or replace function public.claim_due_notification_deliveries(p_limit integer default 10)
returns setof public.notification_deliveries
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_service_role() then raise exception 'Service role access is required'; end if;
  return query
  with claimable as (
    select d.id
    from public.notification_deliveries d
    join public.orders o on o.id = d.order_id
    where d.status = 'queued'
      and d.next_retry_at <= now()
      and o.payment_status in ('paid','partially_refunded')
      and not exists (
        select 1 from public.notification_deliveries succeeded
        where succeeded.order_id = d.order_id
          and succeeded.channel = d.channel
          and (
            succeeded.status = 'delivered'
            or (succeeded.channel = 'telegram' and succeeded.status = 'sent')
          )
      )
    order by d.next_retry_at, d.created_at
    limit least(greatest(coalesce(p_limit,10),1),50)
    for update skip locked
  )
  update public.notification_deliveries d
  set status = 'sending', attempted_at = now(), updated_at = now()
  from claimable c
  where d.id = c.id
  returning d.*;
end;
$$;

create or replace function public.record_notification_attempt(
  p_delivery_id uuid,
  p_status text,
  p_provider_message_id text default null,
  p_error_code text default null,
  p_error_message text default null,
  p_provider_event_at timestamptz default now()
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_delivery public.notification_deliveries%rowtype;
  v_delay interval;
begin
  if not public.is_service_role() then raise exception 'Service role access is required'; end if;
  if p_status not in ('sent','delivered','deferred','bounced','blocked','failed') then
    raise exception 'Unsupported notification status';
  end if;
  select * into v_delivery from public.notification_deliveries where id = p_delivery_id for update;
  if not found then return false; end if;
  if p_status = 'delivered' or (v_delivery.channel = 'telegram' and p_status = 'sent') then
    update public.notification_deliveries
    set status = 'superseded',
        error_code = 'delivery_already_succeeded',
        error_message = 'A previous attempt for this channel succeeded.',
        updated_at = now()
    where order_id = v_delivery.order_id
      and channel = v_delivery.channel
      and id <> v_delivery.id
      and status in ('queued','sending');
  end if;
  if v_delivery.status = 'delivered' then return true; end if;
  if v_delivery.channel = 'telegram' and v_delivery.status = 'sent' and p_status <> 'delivered' then return true; end if;

  update public.notification_deliveries
  set status = p_status,
      provider_message_id = coalesce(nullif(btrim(coalesce(p_provider_message_id,'')),''), provider_message_id),
      error_code = nullif(btrim(coalesce(p_error_code,'')),''),
      error_message = left(nullif(btrim(coalesce(p_error_message,'')),''),1000),
      sent_at = case when p_status in ('sent','delivered') then coalesce(sent_at,now()) else sent_at end,
      delivered_at = case when p_status = 'delivered' then coalesce(delivered_at,now()) else delivered_at end,
      provider_event_at = coalesce(p_provider_event_at,now()),
      updated_at = now()
  where id = p_delivery_id;

  if p_status = 'deferred' and v_delivery.attempt < 3 then
    v_delay := case when v_delivery.attempt = 1 then interval '15 minutes' else interval '2 hours' end;
    insert into public.notification_deliveries (
      order_id, report_id, channel, recipient, attempt, status, next_retry_at
    ) values (
      v_delivery.order_id, v_delivery.report_id, v_delivery.channel, v_delivery.recipient,
      v_delivery.attempt + 1, 'queued', now() + v_delay
    ) on conflict (order_id, channel, attempt) do nothing;
  end if;
  perform public.append_order_event(
    v_delivery.order_id,
    'notification.' || v_delivery.channel || '.' || p_status,
    'notification_deliveries', null, null,
    jsonb_build_object('delivery_id',v_delivery.id,'attempt',v_delivery.attempt)
  );
  perform public.sync_order_milestones(v_delivery.order_id);
  return true;
end;
$$;

create or replace function public.retry_notification_delivery(p_delivery_id uuid)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_delivery public.notification_deliveries%rowtype;
  v_retry_id uuid;
  v_attempt integer;
begin
  if not public.is_admin() then
    raise exception 'AAL2 admin access is required';
  end if;

  select * into v_delivery
  from public.notification_deliveries
  where id = p_delivery_id
  for update;
  if not found then raise exception 'Notification delivery was not found'; end if;
  if v_delivery.status not in ('deferred','bounced','blocked','failed') then
    raise exception 'Only a failed delivery can be retried';
  end if;
  if exists (
    select 1 from public.notification_deliveries d
    where d.order_id = v_delivery.order_id
      and d.channel = v_delivery.channel
      and (
        d.attempt > v_delivery.attempt
        or d.status = 'delivered'
        or (d.channel = 'telegram' and d.status = 'sent')
      )
  ) then raise exception 'This delivery is no longer the active failed attempt'; end if;
  if not exists (
    select 1 from public.orders o
    where o.id = v_delivery.order_id
      and o.payment_status in ('paid','partially_refunded')
      and o.fulfilment_status = 'verified'
  ) then raise exception 'Only a paid, verified order can be retried'; end if;

  select coalesce(max(attempt), 0) + 1 into v_attempt
  from public.notification_deliveries
  where order_id = v_delivery.order_id and channel = v_delivery.channel;

  insert into public.notification_deliveries (
    order_id, report_id, channel, recipient, attempt, status, next_retry_at
  ) values (
    v_delivery.order_id, v_delivery.report_id, v_delivery.channel,
    v_delivery.recipient, v_attempt, 'queued', now()
  ) returning id into v_retry_id;

  perform public.append_order_event(
    v_delivery.order_id,
    'notification.' || v_delivery.channel || '.manual_retry_queued',
    'notification_deliveries', null, null,
    jsonb_build_object(
      'failed_delivery_id', v_delivery.id,
      'retry_delivery_id', v_retry_id,
      'previous_status', v_delivery.status,
      'previous_attempt', v_delivery.attempt,
      'retry_attempt', v_attempt,
      'error_code', v_delivery.error_code
    )
  );
  perform public.sync_order_milestones(v_delivery.order_id);
  return v_retry_id;
end;
$$;

create or replace function public.process_brevo_webhook(
  p_provider_message_id text,
  p_status text,
  p_payload_hash text,
  p_provider_event_at timestamptz default now(),
  p_payload jsonb default '{}'::jsonb
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_delivery public.notification_deliveries%rowtype;
begin
  if not public.is_service_role() then raise exception 'Service role access is required'; end if;
  if btrim(coalesce(p_provider_message_id,'')) = ''
    or btrim(coalesce(p_payload_hash,'')) = ''
    or p_status not in ('delivered','deferred','bounced','blocked','failed') then
    raise exception 'Invalid normalized Brevo event';
  end if;
  if exists (
    select 1 from public.notification_deliveries
    where channel = 'email' and payload_hash = p_payload_hash
  ) then return true; end if;
  select * into v_delivery
  from public.notification_deliveries
  where channel = 'email' and provider_message_id = p_provider_message_id
  for update;
  if not found then return false; end if;
  perform public.record_notification_attempt(
    v_delivery.id, p_status, p_provider_message_id, null, null, p_provider_event_at
  );
  update public.notification_deliveries
  set payload_hash = p_payload_hash,
      provider_payload = coalesce(p_payload,'{}'::jsonb),
      provider_event_at = coalesce(p_provider_event_at,now()),
      updated_at = now()
  where id = v_delivery.id;
  return true;
end;
$$;

-- --------------------------------------------------------------------------
-- RLS and private Storage access
-- --------------------------------------------------------------------------

alter table public.payment_transactions enable row level security;
alter table public.completion_submissions enable row level security;
alter table public.completion_reports enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.order_events enable row level security;
alter table public.telegram_link_tokens enable row level security;
alter table public.vendor_invitations enable row level security;

drop policy if exists "orders own or admin or assigned vendor read" on public.orders;
drop policy if exists "orders read via active offer" on public.orders;
drop policy if exists "orders customer insert own" on public.orders;
drop policy if exists "orders admin update" on public.orders;
create policy "orders scoped read" on public.orders
  for select to authenticated using (
    customer_id = auth.uid()
    or (assigned_vendor_id = auth.uid() and public.is_vendor())
    or public.is_admin()
  );
create policy "orders active offer read" on public.orders
  for select to authenticated using (
    public.is_vendor() and exists (
      select 1 from public.job_offers jo
      where jo.order_id = orders.id
        and jo.vendor_id = auth.uid()
        and jo.status = 'offered'
        and jo.expires_at > now()
    )
  );

drop policy if exists "job offers vendor or admin read" on public.job_offers;
drop policy if exists "job offers admin write" on public.job_offers;
create policy "job offers scoped read" on public.job_offers
  for select to authenticated using (
    (vendor_id = auth.uid() and public.is_vendor()) or public.is_admin()
  );

drop policy if exists "proofs admin or assigned vendor read" on public.proofs;
drop policy if exists "proofs assigned vendor insert" on public.proofs;
create policy "proofs scoped read" on public.proofs
  for select to authenticated using (
    public.is_admin()
    or (uploaded_by = auth.uid() and public.is_vendor())
  );

drop policy if exists "vendor payments admin manage" on public.vendor_payments;
drop policy if exists "vendor payments own read" on public.vendor_payments;
create policy "vendor payments scoped read" on public.vendor_payments
  for select to authenticated using (
    public.is_admin() or (vendor_id = auth.uid() and public.is_vendor())
  );
create policy "vendor payments AAL2 admin insert" on public.vendor_payments
  for insert to authenticated with check (public.is_admin());

drop policy if exists "vendor reports own or admin read" on public.vendor_reports;
drop policy if exists "vendor reports own insert" on public.vendor_reports;
drop policy if exists "vendor reports admin update" on public.vendor_reports;
create policy "vendor reports scoped read" on public.vendor_reports
  for select to authenticated using (
    public.is_admin() or (vendor_id = auth.uid() and public.is_vendor())
  );
create policy "active vendors submit reports" on public.vendor_reports
  for insert to authenticated with check (
    vendor_id = auth.uid() and public.is_vendor()
    and (
      order_id is null or exists (
        select 1 from public.orders o
        where o.id = vendor_reports.order_id and o.assigned_vendor_id = auth.uid()
      )
    )
  );

drop policy if exists "customer reports own or admin read" on public.customer_reports;
drop policy if exists "active customers submit own reports" on public.customer_reports;
drop policy if exists "customer reports admin update" on public.customer_reports;
create policy "customer reports scoped read" on public.customer_reports
  for select to authenticated using (customer_id = auth.uid() or public.is_admin());
create policy "active customers submit reports" on public.customer_reports
  for insert to authenticated with check (
    customer_id = auth.uid() and public.is_customer()
    and (
      order_id is null or exists (
        select 1 from public.orders o
        where o.id = customer_reports.order_id and o.customer_id = auth.uid()
      )
    )
  );

create policy "payment transactions admin read" on public.payment_transactions
  for select to authenticated using (public.is_admin());
create policy "completion submissions scoped read" on public.completion_submissions
  for select to authenticated using (
    public.is_admin()
    or (vendor_id = auth.uid() and public.is_vendor())
  );
create policy "completion reports scoped read" on public.completion_reports
  for select to authenticated using (
    public.is_admin()
    or (kind = 'customer' and exists (
      select 1 from public.orders o
      where o.id = completion_reports.order_id and o.customer_id = auth.uid()
    ))
  );
create policy "completion reports AAL2 admin insert" on public.completion_reports
  for insert to authenticated with check (public.is_admin());
create policy "notification deliveries scoped read" on public.notification_deliveries
  for select to authenticated using (
    public.is_admin() or exists (
      select 1 from public.orders o
      where o.id = notification_deliveries.order_id and o.customer_id = auth.uid()
    )
  );
create policy "order events scoped read" on public.order_events
  for select to authenticated using (
    public.is_admin() or exists (
      select 1 from public.orders o
      where o.id = order_events.order_id
        and o.assigned_vendor_id = auth.uid()
        and public.is_vendor()
    )
  );
create policy "vendor invitations AAL2 admin read" on public.vendor_invitations
  for select to authenticated using (public.is_admin());
create policy "vendor invitations AAL2 admin insert" on public.vendor_invitations
  for insert to authenticated with check (public.is_admin());
create policy "vendor invitations AAL2 admin update" on public.vendor_invitations
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "assigned vendor uploads proof" on storage.objects;
drop policy if exists "proof objects admin or owner read" on storage.objects;
drop policy if exists "active vendor uploads proof" on storage.objects;
drop policy if exists "proof objects scoped read" on storage.objects;
drop policy if exists "vendor deletes draft proof" on storage.objects;
drop policy if exists "completion reports scoped read" on storage.objects;

create or replace function public.customer_can_read_proof(p_storage_path text)
returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.proofs p
    join public.completion_submissions s on s.id = p.submission_id
    join public.orders o on o.id = p.order_id
    where p.storage_path = p_storage_path
      and s.status = 'approved'
      and o.customer_id = auth.uid()
  );
$$;

create policy "active vendor uploads proof" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'proofs'
    and public.is_vendor()
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.orders o
      where o.id::text = (storage.foldername(name))[2]
        and o.assigned_vendor_id = auth.uid()
        and o.payment_status in ('paid','partially_refunded')
        and o.fulfilment_status in ('in_progress','revision_required')
    )
  );
create policy "proof objects scoped read" on storage.objects
  for select to authenticated using (
    bucket_id = 'proofs' and (
      public.is_admin()
      or (public.is_vendor() and (storage.foldername(name))[1] = auth.uid()::text)
      or public.customer_can_read_proof(name)
    )
  );
create policy "vendor deletes draft proof" on storage.objects
  for delete to authenticated using (
    bucket_id = 'proofs'
    and public.is_vendor()
    and (storage.foldername(name))[1] = auth.uid()::text
    and not exists (select 1 from public.proofs p where p.storage_path = name)
    and exists (
      select 1 from public.orders o
      where o.id::text = (storage.foldername(name))[2]
        and o.assigned_vendor_id = auth.uid()
        and o.fulfilment_status in ('in_progress','revision_required')
    )
  );
create policy "completion reports scoped read" on storage.objects
  for select to authenticated using (
    bucket_id = 'completion-reports' and exists (
      select 1
      from public.completion_reports r
      join public.orders o on o.id = r.order_id
      where r.storage_path = name
        and (public.is_admin() or (r.kind = 'customer' and o.customer_id = auth.uid()))
    )
  );

-- --------------------------------------------------------------------------
-- Derived milestone view and consistency/reset utilities
-- --------------------------------------------------------------------------

create or replace view public.order_milestones
with (security_invoker = true) as
select
  o.id as order_id,
  o.reference,
  o.customer_id,
  o.assigned_vendor_id,
  o.payment_status,
  o.fulfilment_status,
  o.delivery_status,
  o.settlement_status,
  case
    when o.payment_status = 'refunded' then 'refunded'
    when o.fulfilment_status = 'cancelled' then 'cancelled'
    when o.payment_status in ('failed','expired','cancelled') then 'payment_issue'
    when o.payment_status = 'pending' then 'awaiting_payment'
    when o.fulfilment_status = 'verified' and o.delivery_status = 'delivered' and o.settlement_status = 'paid' then 'closed'
    when o.fulfilment_status = 'verified' and o.delivery_status = 'delivered' then 'completed'
    when o.fulfilment_status = 'verified' and o.delivery_status = 'failed' then 'delivery_failed'
    when o.fulfilment_status = 'verified' then 'verified'
    when o.fulfilment_status = 'revision_required' then 'revision_required'
    when o.fulfilment_status = 'proof_submitted' then 'under_review'
    when o.fulfilment_status = 'in_progress' then 'in_progress'
    when o.fulfilment_status = 'assigned' then 'assigned'
    when o.fulfilment_status = 'broadcasting' then 'broadcasting'
    else 'ready'
  end as milestone,
  coalesce(vp.paid_amount,0)::bigint as vendor_paid_amount,
  greatest(o.vendor_payout_amount - coalesce(vp.paid_amount,0),0)::bigint as vendor_outstanding_amount,
  (o.fulfilment_status = 'verified') as is_verified,
  (o.fulfilment_status = 'verified' and o.delivery_status = 'delivered') as is_completed,
  (o.fulfilment_status = 'verified' and o.delivery_status = 'delivered' and o.settlement_status = 'paid') as is_closed
from public.orders o
left join lateral (
  select sum(amount)::bigint paid_amount
  from public.vendor_payments where order_id = o.id
) vp on true;

-- These views are deliberately security-definer views with explicit auth.uid()
-- scoping. Customers have no policy on the base audit/submission/proof tables,
-- so internal metadata cannot be requested by changing a REST select list.
create or replace view public.customer_order_events
with (security_barrier = true) as
select e.order_id, e.event_type, e.created_at
from public.order_events e
join public.orders o on o.id = e.order_id
where o.customer_id = auth.uid()
  and e.event_type in (
    'order.created',
    'payment.paid','payment.partially_refunded','payment.refunded','payment.failed','payment.expired','payment.cancelled',
    'fulfilment.ready','fulfilment.broadcasting','fulfilment.assigned','vendor.accepted',
    'fulfilment.in_progress','fulfilment.proof_submitted','fulfilment.revision_required','fulfilment.verified','fulfilment.cancelled',
    'delivery.queued','delivery.partial','delivery.delivered','delivery.failed',
    'report.generated','notification.email.delivered','notification.telegram.sent'
  );

create or replace view public.customer_completion_records
with (security_barrier = true) as
select
  s.id as submission_id,
  s.order_id,
  s.version,
  s.project_country,
  s.project_state,
  s.project_village,
  s.project_address,
  s.project_lat,
  s.project_lng,
  s.project_maps_link,
  s.vendor_remarks,
  s.submitted_at,
  s.reviewed_at
from public.completion_submissions s
join public.orders o on o.id = s.order_id
where o.customer_id = auth.uid() and s.status = 'approved';

create or replace view public.customer_completion_evidence
with (security_barrier = true) as
select
  p.id as proof_id,
  p.order_id,
  p.submission_id,
  p.category,
  p.evidence_slot,
  p.media_type,
  p.mime_type,
  p.size_bytes,
  p.created_at
from public.proofs p
join public.completion_submissions s on s.id = p.submission_id
join public.orders o on o.id = p.order_id
where o.customer_id = auth.uid() and s.status = 'approved';

create or replace function public.lifecycle_consistency_issues()
returns table(order_id uuid, reference text, issue text)
language plpgsql security definer set search_path = '' as $$
begin
  if not (public.is_admin() or public.is_service_role()) then
    raise exception 'AAL2 admin or service role access is required';
  end if;
  return query
  select o.id, o.reference, 'unpaid order has progressed fulfilment'
  from public.orders o
  where o.payment_status in ('pending','failed','expired','cancelled')
    and o.fulfilment_status not in ('not_ready','cancelled')
  union all
  select o.id, o.reference, 'fully refunded order requires admin fulfilment resolution'
  from public.orders o
  where o.payment_status = 'refunded'
    and o.fulfilment_status not in ('not_ready','cancelled')
  union all
  select o.id, o.reference, 'delivery state exists before verification'
  from public.orders o
  where o.delivery_status <> 'not_ready' and o.fulfilment_status <> 'verified'
  union all
  select o.id, o.reference, 'verified order has no approved submission'
  from public.orders o
  where o.fulfilment_status = 'verified' and not exists (
    select 1 from public.completion_submissions s where s.order_id = o.id and s.status = 'approved'
  )
  union all
  select o.id, o.reference, 'delivered order lacks successful email or Telegram evidence'
  from public.orders o
  where o.delivery_status = 'delivered' and (
    not exists (
      select 1 from public.notification_deliveries n
      where n.order_id = o.id and n.channel = 'email' and n.status = 'delivered'
    ) or not exists (
      select 1 from public.notification_deliveries n
      where n.order_id = o.id and n.channel = 'telegram' and n.status in ('sent','delivered')
    )
  )
  union all
  select o.id, o.reference, 'settlement axis does not match the vendor ledger'
  from public.orders o
  left join lateral (
    select coalesce(sum(v.amount),0)::bigint paid from public.vendor_payments v where v.order_id = o.id
  ) ledger on true
  where o.settlement_status is distinct from case
    when o.fulfilment_status <> 'verified' then 'unpaid'
    when o.vendor_payout_amount = 0 or ledger.paid >= o.vendor_payout_amount then 'paid'
    when ledger.paid > 0 then 'partially_paid'
    else 'unpaid'
  end
  union all
  select o.id, o.reference, 'customer email snapshot is missing'
  from public.orders o where btrim(coalesce(o.customer_email,'')) = '';
end;
$$;

create or replace function public.preview_demo_order_reset()
returns table(order_id uuid, reference text, payment_status text, fulfilment_status text, blocked_reason text)
language plpgsql security definer set search_path = '' as $$
begin
  if not (public.is_admin() or public.is_service_role()) then
    raise exception 'AAL2 admin or service role access is required';
  end if;
  return query
  select
    o.id,
    o.reference,
    o.payment_status,
    o.fulfilment_status,
    nullif(concat_ws('; ',
      case when o.payment_status in ('paid','partially_refunded','refunded') then 'paid/refunded payment history' end,
      case when exists (select 1 from public.payment_transactions t where t.order_id = o.id and t.status = 'succeeded') then 'successful provider transaction' end,
      case when exists (select 1 from public.vendor_payments v where v.order_id = o.id) then 'vendor settlement exists' end,
      case when exists (select 1 from public.proofs p where p.order_id = o.id) then 'proof files require Storage cleanup first' end,
      case when exists (select 1 from public.completion_reports r where r.order_id = o.id) then 'completion reports require Storage cleanup first' end,
      case when exists (select 1 from public.customer_reports c where c.order_id = o.id) then 'customer support history exists' end,
      case when exists (select 1 from public.vendor_reports v where v.order_id = o.id) then 'vendor support history exists' end
    ),'')
  from public.orders o
  where o.payment_provider = 'demo'
  order by o.created_at;
end;
$$;

create or replace function public.reset_demo_orders(p_order_ids uuid[], p_confirmation text)
returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_requested integer;
  v_found integer;
  v_deleted integer;
begin
  if not (public.is_admin() or public.is_service_role()) then
    raise exception 'AAL2 admin or service role access is required';
  end if;
  if p_confirmation <> 'DELETE UNPAID DEMO ORDERS' then raise exception 'Confirmation phrase does not match'; end if;
  v_requested := coalesce(cardinality(p_order_ids),0);
  if v_requested = 0 then raise exception 'Explicit order IDs are required'; end if;
  select count(*) into v_found from public.orders where id = any(p_order_ids);
  if v_found <> (select count(distinct value) from unnest(p_order_ids) value) then
    raise exception 'One or more requested orders do not exist';
  end if;
  if exists (
    select 1 from public.orders o
    where o.id = any(p_order_ids) and (
      o.payment_provider <> 'demo'
      or o.payment_status in ('paid','partially_refunded','refunded')
      or exists (select 1 from public.payment_transactions t where t.order_id = o.id and t.status = 'succeeded')
      or exists (select 1 from public.vendor_payments v where v.order_id = o.id)
      or exists (select 1 from public.proofs p where p.order_id = o.id)
      or exists (select 1 from public.completion_reports r where r.order_id = o.id)
      or exists (select 1 from public.customer_reports c where c.order_id = o.id)
      or exists (select 1 from public.vendor_reports v where v.order_id = o.id)
    )
  ) then
    raise exception 'Reset blocked: review preview_demo_order_reset and clear protected history/files first';
  end if;

  perform set_config('app.demo_reset','on',true);
  delete from public.orders where id = any(p_order_ids);
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

-- --------------------------------------------------------------------------
-- Execute privileges: least privilege at the RPC boundary
-- --------------------------------------------------------------------------

revoke all on function public.derive_legacy_order_state() from public, anon, authenticated;
revoke all on function public.append_order_event(uuid,text,text,jsonb,jsonb,jsonb) from public, anon, authenticated;
revoke all on function public.audit_order_change() from public, anon, authenticated;
revoke all on function public.sync_order_milestones(uuid) from public, anon, authenticated;
revoke all on function public.block_immutable_history_change() from public, anon, authenticated;
revoke all on function public.guard_completion_submission() from public, anon, authenticated;
revoke all on function public.validate_completion_report() from public, anon, authenticated;
revoke all on function public.validate_vendor_payment() from public, anon, authenticated;
revoke all on function public.after_vendor_payment() from public, anon, authenticated;
revoke all on function public.set_payment_confirmed_at() from public, anon, authenticated;
revoke all on function public.customer_can_read_proof(text) from public, anon;
grant execute on function public.customer_can_read_proof(text) to authenticated;
revoke all on function public.session_uses_auth_method(text) from public, anon, authenticated, service_role;

revoke all on function public.complete_order(uuid) from public, anon, authenticated, service_role;
revoke all on function public.record_customer_delivery(uuid,text,boolean) from public, anon, authenticated, service_role;

revoke all on function public.broadcast_order(uuid,integer,timestamptz) from public, anon;
revoke all on function public.claim_job(uuid) from public, anon;
revoke all on function public.decline_job(uuid) from public, anon;
revoke all on function public.expire_stale_broadcasts() from public, anon;
revoke all on function public.mark_in_progress(uuid) from public, anon;
revoke all on function public.submit_proof(uuid,jsonb,text,text,text,text,text,numeric,numeric,text) from public, anon;
revoke all on function public.review_proof(uuid,boolean,text,jsonb) from public, anon;
revoke all on function public.sync_order_closure(uuid) from public, anon;
revoke all on function public.record_vendor_payment(uuid,uuid,integer,date,text,text,text,text,uuid) from public, anon;
revoke all on function public.resolve_support_report(uuid,text,text) from public, anon;
revoke all on function public.accept_vendor_invitation() from public, anon;
revoke all on function public.complete_vendor_onboarding(text,text,text,text,text,text,text,text[],text,text,text,text) from public, anon;
revoke all on function public.update_order_record_details(uuid,text,text,text,text,text[],text,text) from public, anon;
grant execute on function public.broadcast_order(uuid,integer,timestamptz) to authenticated;
grant execute on function public.claim_job(uuid) to authenticated;
grant execute on function public.decline_job(uuid) to authenticated;
grant execute on function public.expire_stale_broadcasts() to authenticated, service_role;
grant execute on function public.mark_in_progress(uuid) to authenticated;
grant execute on function public.submit_proof(uuid,jsonb,text,text,text,text,text,numeric,numeric,text) to authenticated;
grant execute on function public.review_proof(uuid,boolean,text,jsonb) to authenticated;
grant execute on function public.sync_order_closure(uuid) to authenticated;
grant execute on function public.record_vendor_payment(uuid,uuid,integer,date,text,text,text,text,uuid) to authenticated;
grant execute on function public.resolve_support_report(uuid,text,text) to authenticated;
grant execute on function public.accept_vendor_invitation() to authenticated;
grant execute on function public.complete_vendor_onboarding(text,text,text,text,text,text,text,text[],text,text,text,text) to authenticated;
grant execute on function public.update_order_record_details(uuid,text,text,text,text,text[],text,text) to authenticated;

revoke all on function public.prepare_hitpay_payment(uuid) from public, anon;
revoke all on function public.prepare_hitpay_refund(uuid,integer,text,boolean) from public, anon;
revoke all on function public.create_telegram_link_token() from public, anon;
grant execute on function public.prepare_hitpay_payment(uuid) to authenticated;
grant execute on function public.prepare_hitpay_refund(uuid,integer,text,boolean) to authenticated;
grant execute on function public.create_telegram_link_token() to authenticated;

revoke all on function public.record_hitpay_payment_request(uuid,text,text,timestamptz) from public, anon, authenticated;
revoke all on function public.record_hitpay_refund_result(uuid,text,boolean,text,jsonb) from public, anon, authenticated;
revoke all on function public.process_hitpay_webhook(text,text,text,text,text,text,integer,text,jsonb) from public, anon, authenticated;
revoke all on function public.consume_telegram_link_token(text,bigint,bigint,text) from public, anon, authenticated;
revoke all on function public.claim_due_notification_deliveries(integer) from public, anon, authenticated;
revoke all on function public.record_notification_attempt(uuid,text,text,text,text,timestamptz) from public, anon, authenticated;
revoke all on function public.process_brevo_webhook(text,text,text,timestamptz,jsonb) from public, anon, authenticated;
revoke all on function public.retry_notification_delivery(uuid) from public, anon;
grant execute on function public.record_hitpay_payment_request(uuid,text,text,timestamptz) to service_role;
grant execute on function public.record_hitpay_refund_result(uuid,text,boolean,text,jsonb) to service_role;
grant execute on function public.process_hitpay_webhook(text,text,text,text,text,text,integer,text,jsonb) to service_role;
grant execute on function public.consume_telegram_link_token(text,bigint,bigint,text) to service_role;
grant execute on function public.claim_due_notification_deliveries(integer) to service_role;
grant execute on function public.record_notification_attempt(uuid,text,text,text,text,timestamptz) to service_role;
grant execute on function public.process_brevo_webhook(text,text,text,timestamptz,jsonb) to service_role;
grant execute on function public.retry_notification_delivery(uuid) to authenticated;

revoke all on function public.queue_order_notifications(uuid,uuid) from public, anon;
grant execute on function public.queue_order_notifications(uuid,uuid) to authenticated, service_role;
revoke all on function public.lifecycle_consistency_issues() from public, anon;
revoke all on function public.preview_demo_order_reset() from public, anon;
revoke all on function public.reset_demo_orders(uuid[],text) from public, anon;
grant execute on function public.lifecycle_consistency_issues() to authenticated, service_role;
grant execute on function public.preview_demo_order_reset() to authenticated, service_role;
grant execute on function public.reset_demo_orders(uuid[],text) to authenticated, service_role;

grant execute on function public.is_admin() to anon, authenticated, service_role;
grant execute on function public.is_vendor() to authenticated, service_role;
grant execute on function public.is_customer() to authenticated, service_role;
grant execute on function public.is_service_role() to authenticated, service_role;
grant select on public.order_milestones to authenticated;
revoke all on public.customer_order_events from public, anon;
revoke all on public.customer_completion_records from public, anon;
revoke all on public.customer_completion_evidence from public, anon;
grant select on public.customer_order_events to authenticated;
grant select on public.customer_completion_records to authenticated;
grant select on public.customer_completion_evidence to authenticated;

commit;
