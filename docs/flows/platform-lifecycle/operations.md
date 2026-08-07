# Production operations runbook

This runbook configures the two recurring MVP operations without putting a secret in `cron.job`:

- expire stale vendor broadcasts and offers;
- process at most 10 due Email or Telegram deliveries per invocation.

Both operations run through `POST /api/internal/process-notifications`. The public endpoint does nothing until its bearer token passes a timing-safe comparison against `INTERNAL_CRON_SECRET`; it then uses the server-only Supabase secret to call the existing database RPCs.

## Prerequisites

1. Apply all committed Supabase migrations in order, from `001_platform_foundation.sql` through `014_financial_reconciliation.sql`.
2. Configure the Vercel variables listed in `.env.example`. Generate the real values outside the repository. In particular, `INTERNAL_CRON_SECRET` must be a strong, private value.
3. In Supabase Auth, keep Google sign-up enabled, disable public email and phone sign-up, disable anonymous sign-in and manual identity linking, and leave email password recovery available for invited partners. Administrators are created with passwords in Team access. Register only the production and local callback URLs used by this application.
4. Redeploy the application after changing Vercel variables.
5. In Supabase, enable the `pg_cron` and `pg_net` extensions. Vault must also be available.
6. In **Database > Vault**, create these named entries:
   - `as_sabiqun_site_url`: the deployed origin, for example `https://www.as-sabiqun.com`, with no path;
   - `as_sabiqun_internal_cron_secret`: exactly the same value as Vercel's `INTERNAL_CRON_SECRET`.

Do not paste either value into a tracked SQL file or directly into a cron command. Supabase's recommended pattern resolves Vault values only when `pg_net` builds the request.

References: [Supabase Cron](https://supabase.com/docs/guides/cron), [schedule Edge Functions with Vault and pg_net](https://supabase.com/docs/guides/functions/schedule-functions), [Vault](https://supabase.com/docs/guides/database/vault), and [pg_net](https://supabase.com/docs/guides/database/extensions/pg_net).

## Install or update the job

Open the Supabase SQL editor and run `supabase/operations/schedule-production-jobs.sql`. It fails closed when either extension or either named Vault value is missing. Re-running it updates the named job rather than creating a second schedule.

The job runs once per minute. Each invocation:

1. releases every unclaimed broadcast whose deadline has passed and expires its outstanding offers;
2. recovers up to 50 notification attempts left in `sending` for at least 15 minutes and records them as deferred worker timeouts;
3. atomically claims up to 10 due notification attempts;
4. sends each report through Brevo or Telegram and records the provider result;
5. lets the existing database rules schedule the immediate, 15-minute, and 2-hour bounded attempt sequence.

The route returns only counts. It never returns or logs the bearer secret.

## Verify the installation

Run `supabase/operations/check-production-health.sql` in the SQL editor.

- `lifecycle_consistency_issues()` should return zero rows. Any row is a real order requiring investigation; the script never repairs or deletes data.
- `cron.job` should contain one active `as-sabiqun-production-operations` row.
- Recent `cron.job_run_details` rows should be successful.
- Recent `net._http_response` rows should have a `2xx` status and no timeout or error.
- `overdue_notifications`, `stuck_notifications`, and `stale_broadcasts` should normally be zero after a healthy run.

The health query flags `sending` attempts after 10 minutes as an early warning; automatic recovery starts at 15 minutes.

The consistency function remains restricted to an AAL2 admin or service role. The check script sets a transaction-local service-role claim only inside the trusted SQL-editor transaction, then rolls it back.

## Failure handling

- HTTP `401`: the two `INTERNAL_CRON_SECRET` values differ. Rotate and align Vercel and Vault; do not weaken the route check.
- HTTP `503`: the Vercel variable is missing from the deployed environment.
- HTTP `500`: inspect the Vercel function log, provider configuration, and the latest database/HTTP rows from the check script.
- A notification left in `sending` for at least 15 minutes is recovered automatically on the next worker run. Investigate only if it remains stuck after a healthy run; do not edit its state blindly.
- A lifecycle consistency row must be resolved through a named application/database transition. Never patch workflow-axis columns directly.

To stop the worker intentionally, run:

```sql
select cron.unschedule('as-sabiqun-production-operations');
```

During secret rotation, update the Vercel variable and the matching Vault entry as one controlled change, redeploy, then rerun the health check.
