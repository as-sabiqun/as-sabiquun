# Flow Spec: Vendor dashboard demo

## Goal

Give a fulfilment vendor one clear workspace to review assigned jobs, accept or decline pending work, follow fulfilment details, prepare proof, and report a problem. This phase is a no-auth, in-memory demonstration; persistent actions belong to the later authentication and database phases.

## Reference & rationale

- Reference: Shopify Order detail — web — captured Mobbin artifact `28dca90f-49eb-4b14-b0ae-1ff784035a64`.
- Visual board: `docs/flows/vendor-dashboard/reference-board.png`.
- Why: Shopify keeps the order summary, status, actions, metadata, and timeline attached to one operational record.
- Transferable: scan-first queue, persistent selected-record context, grouped facts, status timeline, and actions beside the affected record.
- Not copied: Shopify navigation, merchant terminology, colours, commerce controls, customer data, or visual styling.

## Flow model

**Goal:** understand the next assigned job and move it to the correct next state.

**Beats:** scan workload → inspect one job → decide or act → record progress → close the handoff.

| # | Screen / state | Vendor's job | Entry condition | Exit / next | Project route or component |
|---|---|---|---|---|---|
| 1 | Job queue | See pending, active, review, and completed work | Open workspace | Select job or filter | `/vendor-dashboard`, `VendorDashboard` |
| 2 | Job detail | Understand scope, payout, timing, person, and location | Job selected | Accept, decline, prepare proof, or report | Selected-job panel |
| 3 | Pending decision | Decide whether to take the work | Pending job selected | Active or declined | Decision card |
| 4 | Active fulfilment | Follow the required service checklist | Accepted job selected | Choose proof file | Amanah progress rail |
| 5 | Proof prepared | Confirm the selected file and submit demo proof | Active job + file selected | Awaiting review | Native file input + action |
| 6 | Reports | Send an operational issue tied to a job | Reports tab | Report confirmation | Reports panel |

## Transitions & branches

- Happy path: queue → job detail → accept → active → choose proof → submit → awaiting review.
- Decline: pending → declined; the job remains visible so the demo action is understandable.
- Filter empty: show a direct “No jobs in this view” message and a button back to all jobs.
- Proof error: native required file validation; no file is sent anywhere in this phase.
- Report success: add the report to the local report list and clear the form.
- Returning visitor: demo data resets on refresh; this is stated in the interface.
- Authentication/loading/server errors: out of scope until the auth and data phases.

## Gap & mapping

| Decision | Reference pattern | As-Sābiqūn implementation |
|---|---|---|
| Keep | Orders list beside selected detail | Compact job queue beside job record |
| Keep | Grouped order facts | Service, location, schedule, payout, and customer sections |
| Keep | Timeline/history | Four-stage Amanah progress rail |
| Drop | Merchant analytics and product controls | Only fulfilment information the vendor needs |
| Drop | Shopify shell and visual system | Existing As-Sābiqūn palette, type, seal, and controls |
| Adapt | Fulfil/refund actions | Accept, decline, prepare proof, report problem |
| Add | Acceptance deadline | Visible response-by panel for pending jobs |
| Add | Proof checklist | Service-specific photo/video guidance before submission |
| Add | Reports | Job-linked issue form and local confirmation state |

## UI mapping

| Reference pattern | Project implementation |
|---|---|
| Left application navigation | Dark-brown vendor rail using existing `Brand` and palette tokens |
| Orders table | Responsive queue cards with service, payout, deadline, and status |
| Order-detail columns | Main job record plus quiet action/sidebar cards |
| Timeline/history | Teal vertical Amanah rail with completed/current/upcoming states |
| Action toolbar | Existing `.btn`, `.input`, `.status`, and native form controls |

## Interaction & motion

- Job selection and filters update immediately in the client demo.
- Cards and controls use the existing short CSS transitions only.
- Mobile stacks the queue and detail; navigation becomes a compact top row.
- Existing `prefers-reduced-motion` handling remains authoritative.

## Instrumentation

No analytics dependency in this phase. Events to add when analytics exists: `vendor_job_viewed`, `vendor_job_accepted`, `vendor_job_declined`, `vendor_proof_submitted`, and `vendor_report_created`.

## Acceptance criteria

- [x] `/vendor-dashboard` opens without authentication while the demo backend is unconfigured.
- [x] Vendor can filter and select all demo jobs.
- [x] Pending work can be accepted or declined in-memory.
- [x] Active work accepts a local proof file and moves to awaiting review.
- [x] Reports can be created and appear in the local report list.
- [x] Job detail includes service, payout, timing, contact, location, and evidence guidance.
- [x] Empty filter, proof guidance, and report confirmation states are handled.
- [x] Login page links to both admin and vendor demos.
- [x] Mobile and desktop have no horizontal overflow and retain keyboard focus.
- [x] Lint, tests, and production build pass.
