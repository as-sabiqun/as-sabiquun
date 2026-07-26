-- Commercial snapshots, race-safe settlement references, regional dispatch,
-- and an explicit resolution for full refunds after work has started.

begin;

alter table public.orders
  add column if not exists offering_title text,
  add column if not exists offering_detail text,
  add column if not exists refund_fulfilment_resolution text,
  add column if not exists refund_resolution_reason text,
  add column if not exists refund_resolved_by uuid references public.profiles(id),
  add column if not exists refund_resolved_at timestamptz;

-- Migration 009 deliberately installed the cross-axis constraint as NOT VALID
-- so legacy rows could be audited first. Cancel only impossible unpaid demo/E2E
-- rows before this migration touches their commercial snapshot. Genuine
-- provider orders still fail closed and require an explicit data audit.
update public.orders
set status = 'cancelled',
    fulfilment_status = 'cancelled',
    delivery_status = 'not_ready',
    settlement_status = 'unpaid',
    completed_at = null,
    closed_at = null
where payment_provider = 'demo'
  and payment_status in ('pending','failed','expired','cancelled')
  and (
    fulfilment_status not in ('not_ready','cancelled')
    or delivery_status <> 'not_ready'
    or settlement_status <> 'unpaid'
  );

update public.orders o
set offering_title = f.title,
    offering_detail = f.detail
from public.offerings f
where f.id = o.offering_id
  and (o.offering_title is null or o.offering_detail is null);

create or replace function public.snapshot_order_offering() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if new.offering_id is distinct from old.offering_id
      or new.offering_title is distinct from old.offering_title
      or new.offering_detail is distinct from old.offering_detail then
      raise exception 'Order offering snapshots are immutable';
    end if;
    return new;
  end if;
  select f.title, f.detail into new.offering_title, new.offering_detail
  from public.offerings f where f.id = new.offering_id and f.active;
  if not found then raise exception 'An active offering is required'; end if;
  return new;
end;
$$;

drop trigger if exists orders_commercial_snapshot on public.orders;
create trigger orders_commercial_snapshot
  before insert or update of offering_id, offering_title, offering_detail on public.orders
  for each row execute function public.snapshot_order_offering();

alter table public.orders alter column offering_title set not null;
alter table public.orders alter column offering_detail set not null;
alter table public.orders drop constraint if exists orders_refund_fulfilment_resolution_check;
alter table public.orders add constraint orders_refund_fulfilment_resolution_check check (
  (refund_fulfilment_resolution is null and refund_resolution_reason is null and refund_resolved_by is null and refund_resolved_at is null)
  or (
    refund_fulfilment_resolution in ('cancelled_work','retained_verified')
    and btrim(coalesce(refund_resolution_reason,'')) <> ''
    and refund_resolved_by is not null
    and refund_resolved_at is not null
  )
);

-- Keep the least-privilege portal views on the immutable order snapshot rather
-- than today's mutable catalog copy.
create or replace view public.customer_orders
with (security_barrier = true) as
select
  o.id, o.reference, o.service_type, o.category_slug, o.quantity,
  o.participant_names, o.dedication, o.customer_name, o.customer_phone,
  o.customer_email, o.total_amount, o.currency, o.payment_status,
  o.fulfilment_status, o.delivery_status, o.settlement_status, o.status,
  o.accepted_at, o.proof_submitted_at, o.completed_at, o.admin_verified_at,
  o.project_country, o.project_state, o.project_village, o.created_at,
  o.offering_title, o.offering_detail, o.payment_confirmed_at,
  o.dedication_arabic, (o.payment_provider = 'demo') as is_test
from public.orders o
where public.is_customer() and o.customer_id = auth.uid();

create or replace view public.vendor_job_offers
with (security_barrier = true) as
select
  jo.id as offer_id, jo.order_id, jo.status as offer_status, jo.offered_at,
  jo.expires_at, o.reference, o.service_type, o.category_slug, o.quantity,
  o.vendor_payout_amount, o.payment_status, o.fulfilment_status,
  o.delivery_status, o.settlement_status, o.status, o.completion_deadline,
  o.created_at, o.offering_title, o.offering_detail,
  o.beneficiary_country, o.beneficiary_state, o.beneficiary_village,
  o.partner_organisation
from public.job_offers jo
join public.orders o on o.id = jo.order_id
where public.is_vendor() and jo.vendor_id = auth.uid();

create or replace view public.vendor_assigned_orders
with (security_barrier = true) as
select
  o.id, o.reference, o.service_type, o.category_slug, o.quantity,
  o.participant_names, o.dedication, o.customer_name, o.customer_phone,
  o.vendor_payout_amount, o.payment_status, o.fulfilment_status,
  o.delivery_status, o.settlement_status, o.status, o.accepted_at,
  o.proof_submitted_at, o.completed_at, o.completion_deadline,
  o.admin_verification_notes, o.beneficiary_country, o.beneficiary_state,
  o.beneficiary_village, o.partner_organisation, o.beneficiary_names,
  o.dedication_arabic, o.dedication_remarks, o.created_at,
  o.offering_title, o.offering_detail
from public.orders o
where public.is_vendor() and o.assigned_vendor_id = auth.uid();

drop policy if exists "completion reports scoped read" on storage.objects;
create policy "completion reports scoped read" on storage.objects
  for select to authenticated using (
    bucket_id = 'completion-reports' and exists (
      select 1
      from public.completion_reports r
      join public.orders o on o.id = r.order_id
      where r.storage_path = name
        and (
          public.is_admin()
          or (public.is_customer() and r.kind = 'customer' and o.customer_id = auth.uid())
        )
    )
  );

drop index if exists public.vendor_payments_reference_idx;
create unique index if not exists vendor_payments_reference_uidx
  on public.vendor_payments(lower(btrim(reference)))
  where reference is not null and btrim(reference) <> '';

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
  v_deadline timestamptz;
  v_count integer;
begin
  if not public.is_admin() then raise exception 'AAL2 admin access is required'; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.payment_status not in ('paid','partially_refunded') then
    raise exception 'Only a paid order can be broadcast';
  end if;
  if v_order.fulfilment_status <> 'ready' then raise exception 'Order is not ready for broadcast'; end if;
  if btrim(coalesce(v_order.beneficiary_country,'')) = '' then
    raise exception 'Set the beneficiary country before broadcasting';
  end if;

  select coalesce(p_hours, default_claim_window_hours)
  into v_hours from public.platform_settings where id = true;
  if v_hours is null or v_hours <= 0 then raise exception 'Claim window must be positive'; end if;
  v_deadline := coalesce(p_deadline,v_order.completion_deadline);
  if v_deadline is null or v_deadline <= now() then raise exception 'A future completion deadline is required'; end if;
  v_expires := now() + make_interval(hours => v_hours);

  update public.job_offers set status = 'expired'
  where order_id = p_order_id and status = 'offered';

  insert into public.job_offers(order_id, vendor_id, expires_at)
  select p_order_id, p.id, v_expires
  from public.profiles p
  where p.role = 'vendor'
    and p.status = 'active'
    and p.vendor_onboarding_status = 'approved'
    and p.services && array[v_order.category_slug]
    and lower(btrim(p.country)) = lower(btrim(v_order.beneficiary_country))
  on conflict (order_id, vendor_id) do update
    set status = 'offered', offered_at = now(), expires_at = excluded.expires_at
    where public.job_offers.status <> 'claimed';
  get diagnostics v_count = row_count;

  update public.orders
  set fulfilment_status = case when v_count > 0 then 'broadcasting' else 'ready' end,
      assigned_vendor_id = null,
      accepted_at = null,
      broadcast_started_at = now(),
      broadcast_expires_at = v_expires,
      completion_deadline = v_deadline
  where id = p_order_id;

  perform public.append_order_event(
    p_order_id,
    case when v_count > 0 then 'offer.broadcast' else 'offer.unclaimed' end,
    'job_offers', null, null,
    jsonb_build_object('offered_count',v_count,'country',v_order.beneficiary_country,'expires_at',v_expires)
  );
  return v_count;
end;
$$;

create or replace function public.resolve_refunded_fulfilment(
  p_order_id uuid,
  p_reason text
) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_order public.orders%rowtype;
  v_resolution text;
begin
  if not public.is_admin() then raise exception 'AAL2 admin access is required'; end if;
  if btrim(coalesce(p_reason,'')) = '' then raise exception 'A resolution reason is required'; end if;
  if char_length(btrim(p_reason)) > 1000 then raise exception 'Resolution reason must not exceed 1000 characters'; end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.payment_status <> 'refunded' then raise exception 'Only a fully refunded order can be resolved'; end if;
  if v_order.refund_fulfilment_resolution is not null then return v_order.refund_fulfilment_resolution; end if;
  if v_order.fulfilment_status in ('not_ready','cancelled') then raise exception 'This order has no active fulfilment to resolve'; end if;

  v_resolution := case when v_order.fulfilment_status = 'verified' then 'retained_verified' else 'cancelled_work' end;
  update public.orders
  set refund_fulfilment_resolution = v_resolution,
      refund_resolution_reason = btrim(p_reason),
      refund_resolved_by = auth.uid(),
      refund_resolved_at = now(),
      fulfilment_status = case when v_resolution = 'cancelled_work' then 'cancelled' else fulfilment_status end,
      delivery_status = case when v_resolution = 'cancelled_work' then 'not_ready' else delivery_status end
  where id = p_order_id;

  if v_resolution = 'cancelled_work' then
    update public.job_offers set status = 'expired'
    where order_id = p_order_id and status = 'offered';
  end if;
  perform public.append_order_event(
    p_order_id, 'refund.fulfilment_resolved', 'orders.refund_resolution', null, null,
    jsonb_build_object('resolution',v_resolution,'reason',btrim(p_reason))
  );
  return v_resolution;
end;
$$;

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
    and o.refund_fulfilment_resolution is null
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
  from public.orders o where btrim(coalesce(o.customer_email,'')) = ''
  union all
  select o.id, o.reference, 'commercial offering snapshot is missing'
  from public.orders o
  where btrim(coalesce(o.offering_title,'')) = '' or btrim(coalesce(o.offering_detail,'')) = ''
  union all
  select o.id, o.reference, 'confirmed payment timestamp is missing'
  from public.orders o
  where o.payment_status in ('paid','partially_refunded','refunded') and o.payment_confirmed_at is null;
end;
$$;

create table if not exists public.rate_limit_windows (
  scope text not null check (scope ~ '^[a-z0-9._-]{1,64}$'),
  key_hash text not null check (key_hash ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz not null,
  attempts integer not null check (attempts > 0),
  primary key (scope, key_hash, window_started_at)
);

create table if not exists public.integration_failures (
  id bigint generated always as identity primary key,
  provider text not null check (provider in ('hitpay','brevo','telegram','internal')),
  failure_kind text not null check (failure_kind ~ '^[a-z0-9._-]{1,80}$'),
  detail text not null check (btrim(detail) <> '' and char_length(detail) <= 500),
  payload_hash text check (payload_hash is null or payload_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now()
);
create index if not exists integration_failures_created_idx on public.integration_failures(created_at desc);

alter table public.rate_limit_windows enable row level security;
alter table public.integration_failures enable row level security;
revoke all on table public.rate_limit_windows from public, anon, authenticated;
revoke all on table public.integration_failures from public, anon;
grant select on table public.integration_failures to authenticated;
create policy "AAL2 admins read integration failures" on public.integration_failures
  for select to authenticated using (public.is_admin());

create or replace function public.consume_rate_limit(
  p_scope text,
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_window_started_at timestamptz;
  v_attempts integer;
begin
  if not public.is_service_role() then raise exception 'Service role access is required'; end if;
  if p_scope !~ '^[a-z0-9._-]{1,64}$'
    or p_key_hash !~ '^[0-9a-f]{64}$'
    or p_limit not between 1 and 1000
    or p_window_seconds not between 1 and 86400 then
    raise exception 'Invalid rate limit configuration';
  end if;

  v_window_started_at := to_timestamp(
    floor(extract(epoch from clock_timestamp()) / p_window_seconds) * p_window_seconds
  );

  insert into public.rate_limit_windows(scope,key_hash,window_started_at,attempts)
  values (p_scope,p_key_hash,v_window_started_at,1)
  on conflict (scope,key_hash,window_started_at) do update
    set attempts = public.rate_limit_windows.attempts + 1
  returning attempts into v_attempts;

  delete from public.rate_limit_windows
  where window_started_at < now() - interval '2 days';
  return v_attempts <= p_limit;
end;
$$;

create or replace function public.record_integration_failure(
  p_provider text,
  p_failure_kind text,
  p_detail text,
  p_payload_hash text default null
) returns bigint
language plpgsql security definer set search_path = '' as $$
declare v_id bigint;
begin
  if not public.is_service_role() then raise exception 'Service role access is required'; end if;
  insert into public.integration_failures(provider,failure_kind,detail,payload_hash)
  values (p_provider,p_failure_kind,left(btrim(p_detail),500),p_payload_hash)
  returning id into v_id;
  delete from public.integration_failures where created_at < now() - interval '30 days';
  delete from public.integration_failures
  where id in (select id from public.integration_failures order by created_at desc, id desc offset 1000);
  return v_id;
end;
$$;

create or replace function public.production_cron_health()
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_result jsonb;
begin
  if not (public.is_admin() or public.is_service_role()) then raise exception 'AAL2 admin or service role access is required'; end if;
  if to_regclass('cron.job') is null or to_regclass('cron.job_run_details') is null then
    return jsonb_build_object('configured',false,'active',false,'recent_failures',0,'last_run_at',null);
  end if;
  execute $query$
    select jsonb_build_object(
      'configured',exists(select 1 from cron.job where jobname = 'as-sabiqun-production-operations'),
      'active',coalesce((select active from cron.job where jobname = 'as-sabiqun-production-operations' limit 1),false),
      'recent_failures',coalesce((select count(*) from cron.job_run_details r where r.jobid in (select jobid from cron.job where jobname = 'as-sabiqun-production-operations') and r.status <> 'succeeded' and r.start_time > now() - interval '24 hours'),0),
      'last_run_at',(select max(start_time) from cron.job_run_details r where r.jobid in (select jobid from cron.job where jobname = 'as-sabiqun-production-operations'))
    )
  $query$ into v_result;
  return v_result;
end;
$$;

-- Draft uploads live in private Storage before a completion submission exists.
-- Expose only unreferenced objects for the caller's current assigned job so a
-- refreshed vendor form cannot accidentally reuse evidence from an old version.
create or replace function public.list_vendor_proof_drafts(p_order_id uuid)
returns table(storage_path text, mime_type text, size_bytes bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_vendor() or not exists (
    select 1 from public.orders o
    where o.id = p_order_id
      and o.assigned_vendor_id = auth.uid()
      and o.payment_status in ('paid','partially_refunded')
      and o.fulfilment_status in ('in_progress','revision_required')
  ) then
    return;
  end if;

  return query
  select
    o.name,
    lower(coalesce(o.metadata->>'mimetype','')),
    case when coalesce(o.metadata->>'size','') ~ '^[0-9]+$'
      then (o.metadata->>'size')::bigint else 0 end
  from storage.objects o
  where o.bucket_id = 'proofs'
    and o.name like auth.uid()::text || '/' || p_order_id::text || '/drafts/%'
    and not exists (select 1 from public.proofs p where p.storage_path = o.name)
  order by o.created_at, o.name;
end;
$$;

revoke all on function public.resolve_refunded_fulfilment(uuid,text) from public, anon;
grant execute on function public.resolve_refunded_fulfilment(uuid,text) to authenticated;
revoke all on function public.consume_rate_limit(text,text,integer,integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text,text,integer,integer) to service_role;
revoke all on function public.record_integration_failure(text,text,text,text) from public, anon, authenticated;
grant execute on function public.record_integration_failure(text,text,text,text) to service_role;
revoke all on function public.production_cron_health() from public, anon;
grant execute on function public.production_cron_health() to authenticated, service_role;
revoke all on function public.list_vendor_proof_drafts(uuid) from public, anon;
grant execute on function public.list_vendor_proof_drafts(uuid) to authenticated, service_role;

comment on column public.orders.offering_title is 'Immutable offering title captured when the order is created.';
comment on column public.orders.offering_detail is 'Immutable offering detail captured when the order is created.';
comment on table public.rate_limit_windows is 'Server-only fixed-window abuse protection; identifiers are stored only as SHA-256 digests.';
comment on function public.list_vendor_proof_drafts(uuid) is 'Returns only unsubmitted private proof objects for the active assigned vendor and job.';

commit;
