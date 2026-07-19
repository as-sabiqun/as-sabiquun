# Task Plan: Vendor dashboard demo

> Source spec: `docs/flows/vendor-dashboard/spec.md`

## Tasks

1. **Route and shell** — add `/vendor-dashboard` with the existing brand, palette, and responsive vendor navigation. Done when the route loads without authentication.
2. **Job queue and record** — add filters, selectable demo jobs, grouped facts, decision card, and Amanah progress rail. Done when every job and status can be inspected.
3. **Demo actions** — wire local accept, decline, proof-file, and submit interactions. Done when the happy path reaches awaiting review without a backend.
4. **Reports and empty states** — add job-linked report creation, confirmation, and filter-empty recovery. Done when every specified branch is reachable.
5. **Entry point** — add a vendor-demo choice to `/login` while retaining the admin demo. Done when both workspaces are one click away.
6. **QA and release** — verify keyboard/mobile/browser behaviour, lint, tests, build, commit, push, and confirm Vercel. Done when all acceptance criteria pass live.

## Checkpoint

The user explicitly requested the next roadmap phase. That instruction is treated as sign-off for this scoped vendor-dashboard demo; authentication and persistent backend changes remain separate later phases.
