# Flow Spec: Customer account handoff

## Goal

Let a customer understand why an account is needed before payment, keep the service form they have completed, and continue automatically into the secure checkout after Google or six-digit email code sign-in.

## Reference & rationale

- Reference: Wise — iOS. The saved Wise material in `docs/flows/customer-conversion/wise-reference-board.png` remains the visual backbone for clear task state and one dominant action.
- Live Mobbin catalogue access was verified on 2026-07-29. The detailed search endpoint returned a Mobbin-side 404, so this specification uses the project’s existing Wise capture rather than claiming a newly captured screen.
- Transferable lessons: explain the reason immediately before a required handoff; use one clear action; retain entered information; continue the original task after authentication.
- Not copied: Wise branding, financial language, colours, or screen layout.

## States

| # | Screen / state | User’s job | Entry condition | Exit / next | Project route or component |
|---|---|---|---|---|---|
| 1 | Service details | Choose service and enter order details | `/korban` or `/wakaf/[project]` | Valid Continue | `KorbanContent`, `WakafProjectContent` |
| 2 | Account explanation | Understand why an account is needed and choose a method | Valid form, no customer session | Google, email code, or close | In-place account modal |
| 3 | Customer authentication | Sign in or create an account | Customer chooses Google or email | Return to original service with resume intent | `/auth/google`, `/auth/email`, `/auth/email/verify` |
| 4 | Creating checkout | Keep the customer oriented while the saved form becomes an order | Authenticated return with saved valid draft | `/checkout/[reference]` | Existing Server Action form submit |
| 5 | Secure checkout | Pay with HitPay | Order exists | Hosted HitPay payment | `/checkout/[reference]` |

## Transitions & branches

- Happy path: valid service form → account explanation → Google or email code → auto-create order → checkout → HitPay.
- Invalid form: browser and server validation keep the customer on the service form.
- Modal closed: no navigation and no order created.
- Returning Google customer: the same Google button signs them in, restores the draft, and continues.
- OAuth failure or cancellation: return to `/login` with the existing error message; no order is created.
- Order creation failure after return: show the current form error and keep the restored data editable.

## UI mapping

| Pattern | Project implementation |
|---|---|
| Explain the gate at the moment of commitment | Compact `role="dialog"` account modal, using existing modal tokens and layout |
| One primary action | Existing Google mark and the teal `.btn` treatment |
| Reassure without long copy | Three short statements: save order, track project, receive report |
| Preserve the task | Existing per-service `sessionStorage` drafts, extended with an explicit resume flag |
| Continue rather than restart | Existing Server Action creates the idempotent order from the restored request ID |

## Interaction & motion

- The account dialog uses the existing fade/rise motion and disables page scrolling while open.
- Escape, close, and outside click close it without losing the displayed form values.
- Reduced-motion rules already disable these transitions.

## Acceptance criteria

- [ ] An unauthenticated valid submission opens an explanation modal instead of displaying an account error or silently redirecting.
- [ ] The modal explains that an account is for saving the order, tracking work, and receiving the completion report.
- [ ] New and returning customers can use Google or a six-digit email code.
- [ ] After successful authentication, the original valid draft automatically creates one order and reaches checkout.
- [ ] No order exists if the modal is dismissed or authentication is abandoned.
- [ ] Checkout shows the HitPay action immediately after customer authentication.
- [ ] Korban and all Wakaf service forms use the same behaviour and existing design tokens.
