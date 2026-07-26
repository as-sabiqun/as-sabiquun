-- Read-only production check for the Supabase SQL editor.
-- The local claim exists only for this transaction and supplies the trusted
-- context required by lifecycle_consistency_issues(). It is not an app secret.

begin transaction read only;
select set_config('request.jwt.claim.role', 'service_role', true);
select * from public.lifecycle_consistency_issues();
rollback;

select jobid, jobname, schedule, active
from cron.job
where jobname = 'as-sabiqun-production-operations';

select jobid, status, return_message, start_time, end_time
from cron.job_run_details
where jobid in (
  select jobid from cron.job where jobname = 'as-sabiqun-production-operations'
)
order by start_time desc
limit 20;

select id, status_code, timed_out, error_msg, created
from net._http_response
order by created desc
limit 20;

select
  count(*) filter (
    where status = 'queued' and next_retry_at <= now()
  ) as overdue_notifications,
  count(*) filter (
    where status = 'sending' and attempted_at < now() - interval '10 minutes'
  ) as stuck_notifications
from public.notification_deliveries;

select count(*) as stale_broadcasts
from public.orders
where fulfilment_status = 'broadcasting'
  and assigned_vendor_id is null
  and broadcast_expires_at < now();
