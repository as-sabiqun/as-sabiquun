# Task Plan: Customer account handoff

> Source spec: `docs/flows/customer-account-handoff/spec.md`

1. **Account gate** — add one reusable accessible modal for the two service forms. Done when a valid unauthenticated submission explains the handoff without navigating.
2. **Draft resume** — store an explicit resume intent with the existing service draft and send Google auth back to the originating service route. Done when draft values return intact after sign-in.
3. **Checkout continuation** — submit the restored valid form once after authentication, relying on the existing idempotent request ID and Server Action redirect. Done when it reaches exactly one checkout order.
4. **Copy and states** — remove the misleading account error path and provide clear loading/recovery language. Done when modal close, OAuth return, and failed order creation remain understandable.
5. **QA** — run lint, TypeScript, production build, and a focused regression check for draft serialization. Done when all checks pass.
