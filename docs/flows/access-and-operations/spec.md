# Access and operations flow spec

## Objective

Create one coherent service-fulfilment system across the public access gateway, vendor workspace, and private admin workspace. The prototype must make each actor's next action obvious while keeping production authorization decisions on the server.

## Reference direction

- Attio login: one calm, focused form with clear continuation states and very little competing chrome.
- Shopify onboarding: progressive disclosure, one decision per step, visible progress, and a final hand-off into the product.
- Shopify order operations: compact queue-and-detail information architecture for reviewing one record without losing the wider queue.
- Linear issue operations: dense but readable status filters, strong current selection, and contextual actions.
- As-Sabiquun design system: teal, warm cream, dark brown, restrained gold, Bricolage display type, Inter UI type, and the Amanah trail as the signature trust device.

See `reference-board.png` for the captured access and onboarding flow.

## Route and access model

| Route | Purpose | Status / production access |
| --- | --- | --- |
| `/login` | Public Vendor/Customer access chooser feeding one form | Prototype built; signed-out users |
| `/vendor-dashboard` | Assigned work, proof, and reports | Prototype built; active approved vendors |
| `/dashboard` | Customer orders and proof history | Prototype built; active customers after the customer migration |
| `/admin` | Orders, vendors, reports | Prototype built; active admins; AAL2 enforcement still planned |
| `/admin/sign-in` | Unlinked staff entrance | Prototype built; invited admins only |
| `/onboarding` | Role-aware setup and pending states | UI prototype built; persistence still planned |
| `/auth/callback` | OAuth PKCE callback | Planned production route |
| `/auth/confirm` | Email OTP/invitation confirmation | Planned production route |
| `/auth/mfa` | Admin TOTP enrollment/challenge | Planned production route |

The role selected on `/login` is presentation context only. It never assigns or changes a role. After authentication, trusted server data chooses the destination.

## Login and onboarding flow

### Customer

1. Select Customer on `/login`.
2. Continue with Google or receive a six-digit email code.
3. Complete the minimum profile details.
4. Enter the customer dashboard.

### Vendor

1. Select Vendor on `/login`.
2. Enter the invited business email and receive a six-digit code.
3. Complete organisation, contact, country, and fulfilment details.
4. See a pending-review state until approved.
5. Enter the vendor dashboard after approval.

### Admin

1. Visit the unlinked `/admin` route.
2. If signed out, continue to the unlinked `/admin/sign-in` route.
3. Sign in with an invited staff account and complete TOTP MFA.
4. Enter the admin workspace.

The prototype can demonstrate role selection and screen states. Production OAuth, OTP, invitations, profile persistence, and MFA remain disabled until Supabase provider credentials, SMTP, migrations, and RLS are configured. Portal demos require the explicit `ENABLE_PORTAL_DEMOS=true` flag outside local development, so an incomplete production deployment fails closed.

## Vendor workspace

Primary navigation stays intentionally small:

- Jobs: assignment queue, status filters, deadline, location, reference, and payout.
- Reports: create a report tied to a job and review its resolution state.

Job detail must contain:

- accept or decline for pending work;
- an Amanah trail covering acceptance, fulfilment, proof, and admin review;
- fulfilment date, location, quantity, payout, participant/dedication, and the minimum customer contact needed to deliver the service;
- proof requirements, upload preparation, submission, and waiting-for-review states;
- privacy guidance for dignified, consent-aware media;
- a clear report-a-problem route.

## Admin workspace

Primary navigation:

- Orders
- Vendors
- Reports

### Orders

The default screen is a queue and record detail split. Summary filters are Needs assignment, In fulfilment, Proof review, and Completed.

The selected order shows payment, service, participant/dedication, customer, fulfilment location/date, vendor assignment, evidence, and an Amanah trail:

`Paid -> Vendor assigned -> Fulfilment -> Proof review -> Complete`

Contextual actions:

- Unassigned: assign an approved vendor.
- Assigned/in fulfilment: view or reassign the vendor.
- Proof submitted: approve proof or request changes with a required note.
- Completed: read-only record.

### Vendors

Show an operational list of approved vendors with assigned jobs, active jobs, proof awaiting review, and open reports. Full vendor CRUD, payouts, and ratings are outside this prototype.

### Reports

Show a report queue and detail. Admin can resolve an open report. Chat and threaded support are outside this prototype.

## Production data and security closure

Use the existing Supabase Auth stack and extend `profiles` with `customer | vendor | admin`, `account_status`, organisation/profile fields, and onboarding completion. Add customer ownership to orders and explicit proof review state.

Production enforcement must include:

- session-cookie refresh and claim verification in Next.js Proxy; coarse optimistic redirects can be added once the final role routes exist;
- a server-only data access layer with active-role guards;
- independent authorization in pages, Server Actions, and Route Handlers;
- RLS for customer-owned orders, vendor-assigned orders, and admin access at MFA assurance level 2;
- trusted invitations for vendor/admin promotion;
- no authorization from the login selector or editable user metadata;
- no public admin navigation and `noindex` on admin sign-in pages.

## Acceptance criteria

- Admin can filter orders, select a record, assign/reassign a vendor, approve proof, request changes with a note, and resolve a report in the demo.
- Vendor can accept/decline a pending job, inspect all fulfilment facts, prepare proof, submit it, and report a problem in the demo.
- Login presents Vendor first and Customer second through one form, with no Admin option or admin link.
- Admin lives at `/admin` and is absent from public navigation.
- Desktop and mobile layouts remain usable and preserve queue/detail hierarchy.
- Invalid demo workflow transitions throw and have a runnable test.
- Lint, tests, and production build pass.
