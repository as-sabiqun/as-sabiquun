# As-Sābiqūn Association Consultancy

Production MVP for coordinated Korban and Wakaf services, with customer, fulfilment-partner, and MFA-protected admin portals.

## Product routes

- Public: `/`, `/about`, `/services`, `/korban`, `/wakaf`, `/contact`
- Customer: Google-only `/login`, `/checkout/[reference]`, `/dashboard`, projects, support, receipts, and completion reports
- Vendor: invited email/password `/partner-login`, onboarding, jobs, evidence, earnings, reports, and profile
- Admin: unlinked `/admin/sign-in`, mandatory TOTP MFA, operations, jobs, vendors, customers, finance, support, and settings

Portal routes fail closed when Supabase is not configured. There is no production demo-data fallback.

## Local setup

1. Copy `.env.example` to `.env.local` and supply the required development/provider values.
2. Apply `supabase/migrations/001_platform_foundation.sql` through `014_financial_reconciliation.sql` in order.
3. Configure Google OAuth, HitPay, Brevo, Telegram, private Supabase Storage, and invited admin/vendor accounts.
4. Run `npm install` and `npm run dev`.

The scheduler, Vault entries, health checks, deployment order, and recovery steps are documented in [`docs/flows/platform-lifecycle/operations.md`](docs/flows/platform-lifecycle/operations.md).

## Checks

```bash
npm run lint
npx tsc --noEmit
npm run check:auth
npm run check:dashboard
npm run check:lifecycle
npm run check:evidence
npm run check:checkout
npm run check:providers
npm run check:admin
npm run check:access
npm run check:reports
npm run build
```

Run `supabase/tests/009_production_lifecycle_test.sql` through `014_financial_reconciliation_test.sql` in order against a disposable database after all migrations.
