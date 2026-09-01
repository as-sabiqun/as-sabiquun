---
version: 1
slug: "route-admin-sign-in"
primary_target: "route:/admin/sign-in"
related_targets: ["src/app/(marketing)/admin/sign-in/page.tsx","src/app/(marketing)/admin/sign-in/form.tsx","src/app/(marketing)/admin/admin-access.module.css"]
---

# Administrator sign in

## Scope and mode

- **Route:** `/admin/sign-in` for active administrator accounts.
- **Visitor mode:** Operate.
- **Audience and job:** A staff administrator enters assigned credentials, then continues through the real MFA state before reaching the console.
- **Primary task:** Sign in without confusing this boundary with customer or partner access.

## Direction

- **Chosen direction:** Operations access ledger—a dark-teal internal access route beside one white credential sheet, using the existing admin console palette rather than the public navy/cobalt auth world.
- **Approved comp:** `.impeccable/mocks/admin-sign-in-a-ledger.png` (`approved: true` in its sidecar).
- **Concept seed:** `9c23affc`, grounded candidate 5.
- **Memorable moment:** Credentials, authenticator, and console appear as one precise access route before the operator submits anything.

## Fidelity inventory

| Ingredient | Commitment | Medium |
|---|---|---|
| Admin identity | Existing detailed seal, As-Sabiquun name, and Admin console label | Existing brand SVG + semantic HTML/CSS |
| Access ledger | Dark teal field with the real three-stage route; Credentials current | Semantic HTML/CSS + Lucide icons |
| Credential sheet | White field with title, two real inputs, recovery guidance, and error region | Semantic HTML/CSS |
| Primary action | Teal sign-in control with pending and disabled states | Semantic HTML/CSS + Lucide icon |
| Imagery | None; the operator task requires no decorative media | Accepted omission |

## Component grammar

- **Corners:** 16px outer frame, 10–12px fields and messages, pill primary action.
- **Lines:** Fine ink/teal rules separate route stages and form facts.
- **Elevation:** One soft structural frame shadow; internal regions remain flat.
- **Type:** Existing admin display/sans stack throughout; no public editorial serif.
- **Colour:** Manuscript ivory ground, white credential sheet, dark operational teal ledger, ink text, and gold only for the current access stage.
- **States:** Inputs shift from warm ivory to white with a teal border and halo on focus; the primary action darkens and lifts by 1px on hover, uses a restrained gold focus outline, and keeps an explicit wait state while pending.
- **Motion:** The complete frame may arrive once with a short upward fade; remove the animation and all control transitions when reduced motion is requested.

## Truth and responsive behavior

- Preserve safe admin `next`, rate limiting, active-admin enforcement, credential errors, MFA routing, and the team-admin password reset instruction.
- Do not claim monitoring, audit logging, certification, self-service recovery, or access rights beyond what the implementation guarantees.
- Treat the comp as visual authority, not literal copy authority: retain the implementation's conditional MFA language (“when required”) and “Admin console” stage name rather than the comp's universal-MFA claim or shortened “Console” label.
- At wide sizes, cap the split frame near 1120px and weight the credential sheet wider than the ledger. At 900px and below, stack the credential sheet first and turn the three access stages into a horizontal ledger below it.
- At 560px and below, make the composition edge-to-edge, hide the repeated admin identity, stage icons, and stage descriptions, but retain the three numbered stage names. Keep the credential task and sign-in action above the route ledger.

## Unresolved decisions

- The MFA challenge and enrollment routes will inherit this access-ledger system in their own redesign pass.
