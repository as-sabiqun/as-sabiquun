# Flow Spec: Islamic service order

## Goal
Let a visitor understand Korban or Wakaf, submit the minimum required details, simulate payment, and let admin and vendor roles carry the order through documented fulfilment.

## Reference and adaptation
- Visual system: Arabify-style editorial hierarchy, Arabic micro-headings, whitespace, and embedded product UI, recolored to the As-Sābiqūn seal.
- Flow structure: concise donation selection followed by a separate summary/confirmation state.
- Keep: progressive disclosure, visible summary, clear success state, one primary action.
- Drop: fundraising goals, social sharing, carts, customer accounts, and live payments.
- Add: vendor assignment, private proof upload, admin review, and permanent demo notice.

## States
1. Service education and offering selection.
2. Customer details and service-specific inputs.
3. Demo checkout summary.
4. Confirmation with order reference.
5. Admin assignment.
6. Vendor progress and proof upload.
7. Admin completion.

## Branches
- Invalid form: stay on the form and show a field-level or summary error.
- Missing backend configuration: explain that the connected demo is unavailable without losing entered data.
- Unauthorized dashboard: redirect to login.
- Vendor without assignments: show an empty state.
- Failed proof upload: preserve the order state and show a retry message.

## Acceptance
- No real payment can occur.
- Every mutation validates authorization server-side.
- Vendor access is limited to assigned orders and private proof.
- The full flow works at mobile and desktop widths.
