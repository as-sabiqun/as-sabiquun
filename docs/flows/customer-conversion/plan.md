# Task Plan: Customer conversion and demo checkout

Source spec: `docs/flows/customer-conversion/spec.md`

1. Reference checkpoint - selected Wise and generated a Wise-only board.
2. Landing hierarchy - replaced the decorative homepage with the promise, Amanah Record, flat service rows, one process block, and a concise final action.
3. Checkout review - restyled the existing token route into a progress/task/summary layout with a disabled no-backend preview.
4. Payment boundary - scoped demo completion to `payment_provider=demo` and made repeat completion idempotent.
5. Confirmation - required a paid demo record plus the private checkout token before rendering the receipt.
6. QA - run unit tests, lint, TypeScript, production build, and route checks before handoff.
