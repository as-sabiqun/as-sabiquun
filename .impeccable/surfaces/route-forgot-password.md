---
version: 1
slug: "route-forgot-password"
primary_target: "route:/forgot-password"
related_targets: ["route:/update-password","src/app/(marketing)/forgot-password/page.tsx","src/app/(marketing)/forgot-password/form.tsx","src/app/(marketing)/update-password/page.tsx","src/app/(marketing)/update-password/form.tsx","src/app/(marketing)/recovery-ledger.tsx","src/app/(marketing)/recovery.module.css"]
---

# Password recovery

## Scope and mode

- **Routes:** `/forgot-password` and `/update-password` for partner account recovery.
- **Visitor mode:** Operate.
- **Audience and job:** A partner who cannot sign in requests a private reset link, follows the email, and chooses a new password without losing confidence in where the link leads.
- **Primary task:** Complete the sequence request → email → password; after a successful request, make the email step visibly current.

## Direction

- **Chosen direction:** Secure correspondence route—a paper dispatch sheet beside a ruled navy recovery ledger, with cobalt reserved for action and green for completed stages. This is an ordinary extension of the established public design system, not a separate visual world.
- **Approved comp:** `.impeccable/mocks/password-recovery-a-ledger.png` (`approved: true` in its sidecar).
- **Form:** Grounded structure 4, seed `c7113759`.
- **Memorable moment:** The persistent three-stage ledger turns a sensitive auth task into a short, legible route back to the account.

## Truth and states

- Recovery is partner-only; preserve safe `next` handling and existing customer/admin redirects.
- State only what the implementation guarantees: links are private and time-limited, the email must belong to the account, and the new password requires at least eight characters. Do not claim that an address exists, that delivery is immediate, or that recovery succeeded before the action returns success.
- The expired or unavailable-link state remains on `/update-password`: explain that the link is no longer active, return the ledger to step 1, and provide a clear action to request another recovery link plus a path back to partner sign-in.

## Responsive composition

- Desktop is split: dispatch/form sheet on the left, ruled navy ledger on the right, with the primary action above the fold.
- Mobile stacks into one reading order: dispatch/form first, ledger second; retain step state, task context, and reachable actions without horizontal overflow.

## Unresolved decisions

- None for the approved recovery scope.
