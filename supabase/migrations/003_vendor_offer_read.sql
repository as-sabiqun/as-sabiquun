-- 001's orders SELECT policy only allows a vendor to read a row once they're
-- assigned_vendor_id. But a vendor needs to see the order (title, category,
-- price) for jobs they've merely been *offered*, before they've claimed
-- anything — otherwise the vendor jobs list can't show pending offers at
-- all. Add read access via the job_offers link.
create policy "orders read via active offer" on public.orders
  for select to authenticated using (
    exists (
      select 1 from public.job_offers
      where job_offers.order_id = orders.id
        and job_offers.vendor_id = auth.uid()
        and job_offers.status = 'offered'
    )
  );
