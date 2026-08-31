begin;

-- The customer payment-status watcher needs to know which provider owns its
-- order. Expose only that non-sensitive discriminator through the existing
-- customer-scoped contract instead of reading the operational base table with
-- service-role privileges.
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
  o.dedication_arabic, (o.payment_provider = 'demo') as is_test,
  o.payment_provider
from public.orders o
where public.is_customer() and o.customer_id = auth.uid();

commit;
