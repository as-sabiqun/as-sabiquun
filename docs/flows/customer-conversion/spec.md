# Flow Spec: Customer conversion and demo checkout

## Goal

Help a Muslim customer understand the service model, choose an Islamic service, review one order, and reach an honest demonstration confirmation without changing visual language between marketing and checkout.

## Reference

- One external reference: Wise web app (`3a78dda0-ed37-451e-87e3-09fb0ec9b3fd`).
- Saved screens: Wise transfer progress (`a7785026-6517-4d1d-befa-2719ebe38adf`) and Wise dashboard hierarchy (`5f4d82d0-665b-41b4-9e2a-a7525cd52fc1`).
- Visual board: `docs/flows/customer-conversion/wise-reference-board.png`.
- Why Wise: clear task state, restrained typography, flat bordered surfaces, nearby amount summary, and one primary action.

## Flow

1. Landing: understand the promise and choose a service.
2. Service page: submit service details through the existing form.
3. Checkout: review service scope, quantity, fee, total, and next steps.
4. Demo payment: record only a demo payment state.
5. Confirmation: show the paid demo reference and production next-step copy.

## Decisions

| Decision | Wise lesson | As-Sabiqun implementation |
|---|---|---|
| Keep | One task, one primary action | Checkout task column plus sticky summary |
| Keep | Visible progress | Details, Review, Payment progress |
| Drop | Finance navigation and balances | Islamic service routes only |
| Adapt | Transfer review panel | Service scope, quantity, zero demo fees, entrusted total |
| Add | Service accountability | Amanah Record and proof/review next steps |
| Add | Honest preview boundary | Disabled local preview when backend is absent |

## Visual Rules

- Colors: Paper `#F7F7F3`, White `#FFFFFF`, Ink `#31231B`, Teal `#1D737F`, Mist `#DDE6E3`, Gold `#A27C47`.
- Layout: 1180px grid, 1px borders, 10-14px radii, almost no shadows.
- Avoid: gradients, dots, arches, decorative statistics, and mixed reference apps.
- Signature: the Amanah Record as an operational service trail.

## Acceptance Criteria

- [x] The homepage uses Wise as its only external visual/flow reference.
- [x] The first viewport explains the product and exposes a service decision.
- [x] Every service row reaches the correct existing route.
- [x] Checkout shows progress, service facts, amount, and one honest primary action.
- [x] Demo checkout can never update a non-demo provider order.
- [x] Only paid demo-provider orders with the private checkout token render the confirmation page.
- [x] Missing backend state remains inspectable but cannot simulate payment.
- [x] Landing and checkout use responsive CSS without horizontal layout assumptions.
- [x] Labels, focusable controls, and reduced-motion handling remain intact.
