# Flow Spec: Premium vendor workspace

## Goal

Give a fulfilment vendor a calm, high-trust workspace where the next required action is visible immediately. The functional demo remains in-memory and no-auth; this pass upgrades hierarchy, density, responsive behaviour, and visual consistency.

## Reference & rationale

- Shopify Order detail flow, web — Mobbin artifact `28dca90f-49eb-4b14-b0ae-1ff784035a64`: record workflow, action placement, facts, and history.
- Linear task hierarchy, web — Mobbin artifact `cda5f0aa-85ac-4ffc-b14f-bb7837a1bb46`: compact queue, quiet navigation, and scan-friendly metadata.
- Stripe dashboard restraint, web — Mobbin artifact `48f7345e-6616-4f10-97fb-3115b9d0e2f6`: premium density, flat surfaces, and disciplined emphasis.
- Wise dashboard hierarchy, web — Mobbin artifact `5f4d82d0-665b-41b4-9e2a-a7525cd52fc1`: confident whitespace and high-signal summaries.
- Visual board: `docs/flows/vendor-dashboard/premium-reference-board.png`.

Transferable lessons: put work above the fold, keep one persistent record context, use flat sections and dividers, show due information in the queue, and reserve emphasis for the next action.

Deliberately not copied: reference colours, financial charts, merchant terminology, dense global navigation, product-specific controls, or branding.

## Flow model

**Goal:** identify the next assignment and move it safely to its next state.

**Beats:** orient → scan → inspect → act → document → hand off.

| # | State | Vendor's job | Input | Output | Project component |
|---|---|---|---|---|---|
| 1 | Workspace overview | See urgent and active work immediately | Current jobs | Status summary | `VendorDashboard` header and summary strip |
| 2 | Job queue | Compare jobs by state, date, and location | Filter | Selected job | Queue panel |
| 3 | Job record | Understand scope, payout, contact, and evidence | Selected job | Clear next action | Record panel |
| 4 | Decision | Accept or decline pending work | Vendor choice | Active or declined | Record action bar |
| 5 | Fulfilment | Follow evidence requirements | Active job | Selected proof | Proof section |
| 6 | Review handoff | Submit proof for review | Proof file | Awaiting review | Amanah trail |
| 7 | Support | Report an operational issue | Job and message | Open report | Reports workspace |

## Transitions & branches

- Happy path: overview → queue → record → accept → proof selection → submit → awaiting review.
- Decline: pending → declined; the record remains filterable and the fulfilment trail is replaced with a reassignment message.
- Empty filter: show a single recovery action back to all jobs; do not show a mismatched detail record.
- Mobile/tablet: queue and record are separate views; selecting a row opens the record and “Back to jobs” returns to the queue.
- Proof error: native required-file validation; the file stays on the device.
- Report success: prepend the report, reset the form, and announce success.
- Returning visitor: demo state resets on refresh; one quiet Demo mode label explains this.
- Authentication, server loading, and persistent failure states remain out of scope until the backend phase.

## Gap & mapping

| Decision | Reference lesson | As-Sābiqūn implementation |
|---|---|---|
| Keep | Shopify list beside selected record | Queue and persistent record at desktop widths |
| Keep | Linear status/date scanning | Compact rows with status, due date, reference, and location |
| Keep | Stripe flat operational surfaces | One bordered summary strip and one record surface |
| Keep | Wise confident whitespace | Breathing room inside the record, not before the work |
| Drop | Charts and financial overview modules | Counts only; no decorative analytics |
| Drop | Marketing-scale dashboard hero | Compact Jobs title and response-due line |
| Adapt | Timeline/history | Horizontal branded Amanah trail below the record header |
| Adapt | Sidebar navigation | Existing seal and dark-brown rail with quieter controls |
| Add | Evidence checklist | Service-specific proof guidance and native file input |
| Add | Mobile list/detail mode | One focused state at a time below desktop |

## Design direction

**Palette:** Azure `#1D737F`, light turquoise `#DDE6E3`, warm white `#F7F7F3`, ink brown `#31231B`, amanah gold `#A27C47`, and white `#FFFFFF`.

**Type:** Bricolage Grotesque only for the workspace and service titles; Inter for navigation, data, labels, actions, and tabular numerals; Noto Naskh Arabic remains available for Arabic content.

**Layout:** a compact operational ledger rather than a card dashboard.

```text
┌──────── rail ────────┬─ Jobs / response due ─────────────────────┐
│ Brand                │ status summary strip                       │
│ Jobs                 ├──────── queue ───────┬──── job record ─────┤
│ Reports              │ status · due · place │ title · action       │
│                      │ status · date · place│ Amanah trail         │
│ Vendor / Demo mode   │ ...                  │ facts · proof · notes│
└──────────────────────┴──────────────────────┴─────────────────────┘
```

**Signature:** the Amanah trail becomes a slim gold-and-teal lifecycle line directly under every active record header. It is the single expressive element; the surrounding interface stays quiet.

**Self-critique:** the palette is already distinctive and trusted, so changing it would be cosmetic. The revised direction removes generic oversized cards, pills, shadows, and tiny uppercase labels instead. Global marketing primitives remain unchanged; refinements are scoped to `.vendor-workspace`.

## UI mapping

| Reference pattern | Project implementation |
|---|---|
| Quiet side navigation | `.vendor-sidebar` using existing `Brand` and palette tokens |
| Summary dashboard | `.vendor-summary` with divided status buttons |
| Compact work table | `.vendor-job-row` with due/scheduled metadata |
| Selected record | `.vendor-record` with flat, divided sections |
| Timeline/history | horizontal `AmanahRail` under the record header |
| Primary/secondary actions | existing `.btn` variants, operationally scoped |
| Responsive master/detail | `detailOpen` state plus CSS display at the `xl` breakpoint |

## Interaction & motion

- Filters and job selection update immediately.
- Below `xl`, selecting a job opens its record; the back control restores the queue.
- Hover and active states use colour/border changes only; no decorative card lifting.
- Existing `prefers-reduced-motion` handling remains authoritative.
- Keyboard focus remains visible and controls retain at least a 44px target.

## Instrumentation

No analytics dependency in this phase. Future events: `vendor_job_viewed`, `vendor_job_accepted`, `vendor_job_declined`, `vendor_proof_submitted`, and `vendor_report_created`.

## Acceptance criteria

- [x] Work queue or selected record is visible above the fold at common laptop sizes.
- [x] Dashboard uses the official palette and scoped operational styling.
- [x] Summary counts work as useful filters rather than decorative cards.
- [x] Queue rows expose status, date/deadline, location, reference, and payout.
- [x] Amanah trail is visible directly beneath the record header and hidden for declined work.
- [x] Pending actions, proof selection, reports, and empty states still work.
- [x] Mobile/tablet list-detail navigation is direct and has no nested 760px queue scroller.
- [x] Declined work is consistently filterable.
- [x] Demo messaging appears once, and hard-coded “today” wording is removed.
- [x] Public pages, login, and admin demo retain their current design.
- [ ] Lint, tests, production build, responsive browser QA, and live Vercel checks pass.
