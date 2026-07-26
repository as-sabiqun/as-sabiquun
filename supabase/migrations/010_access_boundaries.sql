-- Least-privilege read boundaries for customer and vendor portals.
--
-- Portal roles read purpose-built views only. The underlying operational,
-- report, delivery, offer, and audit records remain available to AAL2 admins
-- (and the bypass-RLS service role) so a changed PostgREST select list cannot
-- reveal internal or third-party data.

begin;

-- Admin access requires both a password-authenticated session and a verified
-- second factor. A linked OAuth identity must not satisfy this boundary.
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

-- Vendors use the invitation-only password flow. Checking the session AMR
-- prevents a linked OAuth identity from entering the operational portal.
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

-- A customer session is valid only when the auth identity is a confirmed
-- Google account. raw_app_meta_data is controlled by Supabase Auth, unlike
-- user-editable raw_user_meta_data.
create or replace function public.is_customer() returns boolean
language sql stable security definer set search_path = '' as $$
  select public.session_uses_auth_method('oauth') and exists (
    select 1
    from public.profiles p
    join auth.users u on u.id = p.id
    where p.id = auth.uid()
      and p.role = 'customer'
      and p.status = 'active'
      and u.email is not null
      and u.email_confirmed_at is not null
      and (
        u.raw_app_meta_data->>'provider' = 'google'
        or coalesce(u.raw_app_meta_data->'providers', '[]'::jsonb) ? 'google'
      )
  );
$$;

-- These predicates let RLS and Storage policies validate ownership without
-- granting the caller SELECT access to the full orders row.
create or replace function public.customer_owns_order(p_order_id uuid)
returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_customer() and exists (
    select 1
    from public.orders o
    where o.id = p_order_id and o.customer_id = auth.uid()
  );
$$;

create or replace function public.vendor_is_assigned_to_order(p_order_id uuid)
returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_vendor() and exists (
    select 1
    from public.orders o
    where o.id = p_order_id and o.assigned_vendor_id = auth.uid()
  );
$$;

-- Customer commercial and lifecycle snapshot. Deliberately excluded:
-- vendor identity/cost, commission, payment-provider internals, checkout
-- tokens, internal review notes, and operational assignment fields.
create or replace view public.customer_orders
with (security_barrier = true) as
select
  o.id,
  o.reference,
  o.service_type,
  o.category_slug,
  o.quantity,
  o.participant_names,
  o.dedication,
  o.customer_name,
  o.customer_phone,
  o.customer_email,
  o.total_amount,
  o.currency,
  o.payment_status,
  o.fulfilment_status,
  o.delivery_status,
  o.settlement_status,
  o.status,
  o.accepted_at,
  o.proof_submitted_at,
  o.completed_at,
  o.admin_verified_at,
  o.project_country,
  o.project_state,
  o.project_village,
  o.created_at,
  f.title as offering_title,
  f.detail as offering_detail,
  o.payment_confirmed_at
from public.orders o
join public.offerings f on f.id = o.offering_id
where public.is_customer() and o.customer_id = auth.uid();

-- Customers need a report identifier for the authenticated download route,
-- not the private Storage path/checksum or internal-report metadata.
create or replace view public.customer_completion_report_metadata
with (security_barrier = true) as
select r.id, r.order_id, r.version, r.generated_at
from public.completion_reports r
join public.orders o on o.id = r.order_id
where public.is_customer()
  and o.customer_id = auth.uid()
  and r.kind = 'customer';

-- Customers see channel outcomes only. Recipient addresses, provider IDs,
-- payloads, retry errors, and scheduling internals remain private.
create or replace view public.customer_notification_deliveries
with (security_barrier = true) as
select
  d.order_id,
  d.channel,
  d.attempt,
  d.status,
  d.attempted_at,
  d.sent_at,
  d.delivered_at
from public.notification_deliveries d
join public.orders o on o.id = d.order_id
where public.is_customer() and o.customer_id = auth.uid();

-- An unaccepted offer exposes only the brief needed to decide whether to
-- claim it. Customer identity, dedication, participant names, and the
-- customer price are intentionally absent.
create or replace view public.vendor_job_offers
with (security_barrier = true) as
select
  jo.id as offer_id,
  jo.order_id,
  jo.status as offer_status,
  jo.offered_at,
  jo.expires_at,
  o.reference,
  o.service_type,
  o.category_slug,
  o.quantity,
  o.vendor_payout_amount,
  o.payment_status,
  o.fulfilment_status,
  o.delivery_status,
  o.settlement_status,
  o.status,
  o.completion_deadline,
  o.created_at,
  f.title as offering_title,
  f.detail as offering_detail
from public.job_offers jo
join public.orders o on o.id = jo.order_id
join public.offerings f on f.id = o.offering_id
where public.is_vendor() and jo.vendor_id = auth.uid();

-- Once assigned, the vendor receives the fulfilment brief and contact fields
-- required to execute the work. Customer email, customer price, commission,
-- provider data, and admin-only financial/audit fields remain excluded.
create or replace view public.vendor_assigned_orders
with (security_barrier = true) as
select
  o.id,
  o.reference,
  o.service_type,
  o.category_slug,
  o.quantity,
  o.participant_names,
  o.dedication,
  o.customer_name,
  o.customer_phone,
  o.vendor_payout_amount,
  o.payment_status,
  o.fulfilment_status,
  o.delivery_status,
  o.settlement_status,
  o.status,
  o.accepted_at,
  o.proof_submitted_at,
  o.completed_at,
  o.completion_deadline,
  o.admin_verification_notes,
  o.beneficiary_country,
  o.beneficiary_state,
  o.beneficiary_village,
  o.partner_organisation,
  o.beneficiary_names,
  o.dedication_arabic,
  o.dedication_remarks,
  o.created_at,
  f.title as offering_title,
  f.detail as offering_detail
from public.orders o
join public.offerings f on f.id = o.offering_id
where public.is_vendor() and o.assigned_vendor_id = auth.uid();

-- Existing customer-safe views also honour account state and Google identity.
create or replace view public.customer_order_events
with (security_barrier = true) as
select e.order_id, e.event_type, e.created_at
from public.order_events e
join public.orders o on o.id = e.order_id
where public.is_customer()
  and o.customer_id = auth.uid()
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
where public.is_customer()
  and o.customer_id = auth.uid()
  and s.status = 'approved';

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
where public.is_customer()
  and o.customer_id = auth.uid()
  and s.status = 'approved';

create or replace function public.customer_can_read_proof(p_storage_path text)
returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_customer() and exists (
    select 1
    from public.proofs p
    join public.completion_submissions s on s.id = p.submission_id
    join public.orders o on o.id = p.order_id
    where p.storage_path = p_storage_path
      and s.status = 'approved'
      and o.customer_id = auth.uid()
  );
$$;

-- Full base rows are operational records: only an AAL2 admin (or the
-- service role, which bypasses RLS) may read them directly.
drop policy if exists "orders scoped read" on public.orders;
drop policy if exists "orders active offer read" on public.orders;
drop policy if exists "orders own or admin or assigned vendor read" on public.orders;
drop policy if exists "orders read via active offer" on public.orders;
drop policy if exists "orders AAL2 admin read" on public.orders;
create policy "orders AAL2 admin read" on public.orders
  for select to authenticated using (public.is_admin());

drop policy if exists "job offers scoped read" on public.job_offers;
drop policy if exists "job offers vendor or admin read" on public.job_offers;
drop policy if exists "job offers AAL2 admin read" on public.job_offers;
create policy "job offers AAL2 admin read" on public.job_offers
  for select to authenticated using (public.is_admin());

drop policy if exists "completion reports scoped read" on public.completion_reports;
drop policy if exists "completion reports AAL2 admin read" on public.completion_reports;
create policy "completion reports AAL2 admin read" on public.completion_reports
  for select to authenticated using (public.is_admin());

drop policy if exists "notification deliveries scoped read" on public.notification_deliveries;
drop policy if exists "notification deliveries AAL2 admin read" on public.notification_deliveries;
create policy "notification deliveries AAL2 admin read" on public.notification_deliveries
  for select to authenticated using (public.is_admin());

drop policy if exists "order events scoped read" on public.order_events;
drop policy if exists "order events AAL2 admin read" on public.order_events;
create policy "order events AAL2 admin read" on public.order_events
  for select to authenticated using (public.is_admin());

-- Keep support and Storage ownership checks functional without restoring
-- caller access to the base orders table.
drop policy if exists "active customers submit reports" on public.customer_reports;
create policy "active customers submit reports" on public.customer_reports
  for insert to authenticated with check (
    customer_id = auth.uid()
    and public.is_customer()
    and (order_id is null or public.customer_owns_order(order_id))
  );

drop policy if exists "customer reports scoped read" on public.customer_reports;
create policy "customer reports scoped read" on public.customer_reports
  for select to authenticated using (
    public.is_admin()
    or (customer_id = auth.uid() and public.is_customer())
  );

drop policy if exists "active vendors submit reports" on public.vendor_reports;
create policy "active vendors submit reports" on public.vendor_reports
  for insert to authenticated with check (
    vendor_id = auth.uid()
    and public.is_vendor()
    and (order_id is null or public.vendor_is_assigned_to_order(order_id))
  );

drop policy if exists "active vendor uploads proof" on storage.objects;
create policy "active vendor uploads proof" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'proofs'
    and public.is_vendor()
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.vendor_is_assigned_to_order(((storage.foldername(name))[2])::uuid)
    and exists (
      select 1
      from public.vendor_assigned_orders o
      where o.id::text = (storage.foldername(name))[2]
        and o.payment_status in ('paid','partially_refunded')
        and o.fulfilment_status in ('in_progress','revision_required')
    )
  );

drop policy if exists "vendor deletes draft proof" on storage.objects;
create policy "vendor deletes draft proof" on storage.objects
  for delete to authenticated using (
    bucket_id = 'proofs'
    and public.is_vendor()
    and (storage.foldername(name))[1] = auth.uid()::text
    and not exists (select 1 from public.proofs p where p.storage_path = name)
    and public.vendor_is_assigned_to_order(((storage.foldername(name))[2])::uuid)
    and exists (
      select 1
      from public.vendor_assigned_orders o
      where o.id::text = (storage.foldername(name))[2]
        and o.fulfilment_status in ('in_progress','revision_required')
    )
  );

revoke all on function public.customer_owns_order(uuid) from public, anon;
revoke all on function public.vendor_is_assigned_to_order(uuid) from public, anon;
grant execute on function public.customer_owns_order(uuid) to authenticated, service_role;
grant execute on function public.vendor_is_assigned_to_order(uuid) to authenticated, service_role;

revoke all on public.customer_orders from public, anon;
revoke all on public.customer_completion_report_metadata from public, anon;
revoke all on public.customer_notification_deliveries from public, anon;
revoke all on public.vendor_job_offers from public, anon;
revoke all on public.vendor_assigned_orders from public, anon;
grant select on public.customer_orders to authenticated;
grant select on public.customer_completion_report_metadata to authenticated;
grant select on public.customer_notification_deliveries to authenticated;
grant select on public.vendor_job_offers to authenticated;
grant select on public.vendor_assigned_orders to authenticated;

commit;
