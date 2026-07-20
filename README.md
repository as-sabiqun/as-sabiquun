# As-Sābiqūn Association Consultancy

Connected demonstration of public Korban/Wakaf journeys, role-aware account access, and customer/vendor/admin fulfilment workspaces.

## Product routes

- `/login` — public Vendor/Customer access gateway; it never assigns a role.
- `/onboarding` — progressive Customer/Vendor setup preview.
- `/dashboard` — customer order and proof preview.
- `/vendor-dashboard` — vendor assignments, evidence bundles, and reports.
- `/admin` — unlinked admin operations workspace.
- `/admin/sign-in` — unlinked staff entrance.

When public Supabase credentials are absent, local development uses demonstration data and resets on refresh. A deployed preview must explicitly set `ENABLE_PORTAL_DEMOS=true`; otherwise portal routes fail closed. When authentication is configured, dashboard routes verify the signed-in account and its trusted database role before routing it.

## Setup

1. Copy `.env.example` to `.env.local` and add Supabase project credentials.
2. Apply `supabase/migrations/20260715000000_initial_demo.sql`.
3. Create invited Supabase Auth users and matching `profiles` rows with `admin` and `vendor` roles for the current migration.
4. Run `npm run dev` or deploy to Vercel.

The current migration does not yet include customer ownership, account approval states, OAuth/OTP callbacks, custom SMTP, or admin TOTP enforcement. The production closure and route model are documented in `docs/flows/access-and-operations/spec.md`.

No real payment provider is connected. All offerings, prices, orders, and payment states are demonstration data.

## Checks

```bash
npm test
npm run lint
npm run build
```
