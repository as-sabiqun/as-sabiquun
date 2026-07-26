# Task Plan: Production platform lifecycle

> Source spec: `docs/flows/platform-lifecycle/spec.md`

The application and migration now implement the core lifecycle below. Unchecked items remain release validation or explicit follow-up work; deployment-owned steps are in the [production operations runbook](./operations.md).

No dates are assigned. Complete the phases in order because later screens depend on earlier data guarantees.

## Phase 1: Lock the lifecycle and clean current data

- [x] Write migrations that establish the separate payment, fulfilment, delivery, and settlement axes.
- [x] Restrict every transition RPC to valid source states.
- [x] Require active-vendor status inside vendor RPCs and Storage policies.
- [x] Remove or revoke the legacy `complete_order` bypass.
- [x] Make closure derived from verification, both deliveries, and full settlement.
- [x] Add `order_events` and write an event from every controlled transition.
- [ ] **Production data task:** classify existing production orders as genuine or test records; repair, cancel, or remove audited test history before it affects customer impact.
- [x] Add a one-shot consistency query that reports impossible states.

**Acceptance check:** deliberately attempted invalid transitions all fail in the database, while one valid seeded order can traverse the intended state machine.

## Phase 2: Build real HitPay checkout

- [x] Add a server-side endpoint/action that creates a HitPay payment request from the database offering and order snapshot.
- [x] Redirect the customer to HitPay's hosted checkout.
- [x] Add a raw-body webhook Route Handler.
- [x] Validate `Hitpay-Signature` with HMAC-SHA256 before trusting the payload.
- [x] Store provider request/event IDs and process each event idempotently.
- [x] Mark the order paid only from a validated provider-completion webhook.
- [x] Handle failed, expired, cancelled, and refunded events.
- [x] Add checkout return pages that show “processing” until the webhook confirms the result.
- [x] Generate a customer receipt from the confirmed payment record.

**Acceptance check:** a sandbox payment creates exactly one paid transaction despite duplicate webhook delivery; a forged or mismatched webhook changes nothing.

## Phase 3: Make vendor fulfilment auditable

- [x] Replace admin-generated plaintext passwords with Supabase email invitations.
- [x] Add vendor pending/approved onboarding state and required profile completion.
- [x] Gate matching by active status, service capability, and supported country/region.
- [x] Implement stale-offer expiry and surface zero-eligible-vendor alerts to admins.
- [x] Create `completion_submissions` and attach proofs to a submission version.
- [x] Validate real Storage objects, ownership path, MIME type, size, required category counts, and mandatory location/GPS on final submission.
- [x] Preserve unique upload drafts and permit vendors to delete their own drafts.
- [ ] **Follow-up:** schedule safe cleanup of abandoned draft objects after a retention period.
- [x] Show vendor payout rather than customer total on job detail.
- [x] Add a Payments/Earnings page with committed, pending, payable, paid, and outstanding totals.
- [x] Harden vendor reports with server validation and order-ownership checks.

**Acceptance check:** a suspended vendor, fabricated proof path, incomplete bundle, wrong MIME type, or missing GPS cannot enter admin review.

## Phase 4: Finish admin operations

- [x] Replace the raw-status default with “Needs payment review / Needs broadcast / Unclaimed / In fulfilment / Needs evidence review / Delivery failed / Settlement outstanding”.
- [x] Show payment, fulfilment, delivery, and settlement state independently on every job.
- [x] Add an evidence checklist tied to the latest submission version.
- [x] Require a reason for revision and preserve the old review/submission.
- [x] Add beneficiary, partner-organisation, dedication Arabic, and nameplate editing with an explicit save action.
- [x] Validate vendor payment against assigned vendor, currency, outstanding amount, and unique reference.
- [x] Add payment adjustments/reversals instead of deleting ledger rows.
- [x] Replace decorative global search inputs with working search or remove them until implemented.
- [x] Add required resolution notes and resolver metadata to reports.

**Acceptance check:** an admin can process a paid order from broadcast through review without editing raw database columns, and every action appears in the immutable audit timeline.

## Phase 5: Complete the customer record

- [x] Filter impact analytics to paid orders and verified/completed events only.
- [x] Keep failed/cancelled/test orders out of impact totals.
- [x] Upgrade order detail into the customer-safe completion record.
- [x] Show receipt, payment status, fulfilment timeline, approved location, local partner, approved media, and completion report.
- [x] Generate a downloadable completion report and service-specific certificate/nameplate where appropriate.
- [x] Use short-lived signed media links or report-safe derivatives rather than granting broad proof-bucket access.
- [x] Attach a customer support report directly to the current order from its detail page.

**Acceptance check:** a customer can independently verify what was paid, what happened, where it happened, what evidence was approved, and whether the final report was delivered.

## Phase 6: Automate completion delivery

- [x] Generate the completion-report artifact only after admin verification.
- [x] Send Email through Brevo with the report link/attachment.
- [x] Send Telegram through the bot integration using a verified customer chat binding.
- [x] Store one `notification_deliveries` row per attempt.
- [x] Retry transient failures with a bounded policy, recover stale worker claims, and expose permanent failures to admins.
- [x] Move to Completed only after both required channels report success.
- [ ] **Follow-up:** define and implement a provider-supported reversal/correction path for a previously successful delivery.

**Acceptance check:** one verified job reaches Completed automatically after both channels succeed, while a single-channel failure remains visible and retryable.

## Phase 7: Secure authentication and sensitive operations

- [x] Require admin TOTP MFA and AAL2.
- [x] Add restrictive AAL2 RLS policies for customer data, evidence, bank details, payments, and admin RPCs.
- [x] Add vendor invite acceptance, password setup, reset, and expired-invite recovery.
- [x] Verify account suspension blocks layouts, RLS, RPCs, Storage, and existing sessions.
- [x] Add server-only fixed-window rate limiting to public auth, checkout, and support submissions; persist only hashed identifiers.
- [x] Review service-role usage and keep it only in trusted server code.
- [x] Add security headers and `noindex` for private workspaces.

**Acceptance check:** role and MFA test accounts cannot cross portal boundaries through URLs, Server Actions, RPC calls, REST calls, or Storage calls.

## Phase 8: Quality, operations, and release readiness

Production scheduler setup, Vault names, health queries, and failure handling are documented in [the production operations runbook](./operations.md).

- [x] Add database integration tests for lifecycle functions, invariants, and access boundaries.
- [x] Add HitPay webhook fixture tests, including duplicate and forged events.
- [x] Add notification retry tests and vendor-payment invariant tests.
- [x] Fix the recorded ESLint errors and accessibility warnings.
- [x] Add real loading, empty, and query-error states instead of silently rendering empty dashboards.
- [ ] **Release task:** connect structured production alerting for payment, notification, upload, and closure failures.
- [ ] **Release task:** install the supplied production schedule, then monitor consistency issues and stale broadcasts.
- [x] Update README and mark older prototype specs as historical so they no longer describe the current runtime.
- [x] Run the full lint, local tests, TypeScript, dependency audit, production build, and responsive public/role-boundary browser QA.
- [ ] **Release task:** run the sandbox end-to-end lifecycle against configured Google, HitPay, Brevo, and Telegram providers.

**Acceptance check:** one sandbox customer, vendor, and admin complete the entire flow without manual database edits, and every external side effect is traceable by provider ID and order event.

## Implemented baseline

The repository now contains the lifecycle-invariant migration, controlled role transitions, RLS and Storage policies, lifecycle tests, signed HitPay webhooks and refunds, paid-only customer impact, immutable evidence versions, report generation, Brevo/Telegram delivery, manual recovery, vendor settlement, admin MFA, and the three production portals. The remaining work before opening access is the external configuration and sandbox/production verification described in the runbook.

## Deliberately deferred

- Automatic vendor payouts: keep a validated manual ledger until transaction volume justifies payout automation.
- Threaded support chat: recorded resolution notes cover MVP support.
- Advanced vendor bidding: first eligible claim remains sufficient until vendor volume requires ranking or quotes.
- Multi-currency conversion: keep one order settlement currency until a real second-currency vendor is onboarded; never relabel SGD cents as another currency.
