-- Removes only the temporary records created by scripts/seed-dashboard-review.mjs.
-- Run this in the Supabase SQL editor after the visual review is complete.
begin;

lock table public.orders, public.vendor_payments, public.order_events in access exclusive mode;

do $$
begin
  if exists (
    select 1
    from public.vendor_payments vp
    join public.orders o on o.id = vp.order_id
    where o.reference like 'DASH-REVIEW-%'
      and coalesce(vp.reference, '') not like 'DASH-REVIEW-VENDOR-%'
  ) then
    raise exception 'Cleanup blocked: a non-review vendor payment is attached to review data';
  end if;
end;
$$;

select set_config('app.demo_reset', 'on', true);
alter table public.vendor_payments disable trigger vendor_payments_validate;

delete from public.vendor_payments
where order_id in (select id from public.orders where reference like 'DASH-REVIEW-%');

delete from public.orders where reference like 'DASH-REVIEW-%';

alter table public.vendor_payments enable trigger vendor_payments_validate;
commit;

select count(*) as remaining_dashboard_review_orders
from public.orders
where reference like 'DASH-REVIEW-%';
