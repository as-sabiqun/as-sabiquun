---
version: 2
slug: "route-admin-sign-in"
primary_target: "route:/admin/sign-in"
related_targets: ["route:/admin/mfa/challenge","route:/admin/mfa/enroll","src/app/(marketing)/admin/admin-access-ledger.tsx","src/app/(marketing)/admin/admin-access.module.css","src/app/(marketing)/admin/sign-in/page.tsx","src/app/(marketing)/admin/sign-in/form.tsx","src/app/(marketing)/admin/mfa/challenge/page.tsx","src/app/(marketing)/admin/mfa/enroll/page.tsx","src/app/(marketing)/admin/mfa/forms.tsx","src/app/(marketing)/admin/mfa/actions.ts","src/app/admin/layout.tsx","src/lib/supabase/proxy.ts"]
---

# Administrator access route

## Scope and mode

- **Routes:** `/admin/sign-in`, `/admin/mfa/challenge`, and `/admin/mfa/enroll` for active administrator accounts.
- **Visitor mode:** Operate.
- **Audience and job:** A staff administrator confirms assigned credentials, satisfies the account's current authenticator state, and continues to the originally requested admin page.
- **Primary task:** Complete the next required access checkpoint without confusing this internal boundary with customer or partner access.
- **Delivery state:** Shipped. The final review council disposition is unanimous **SHIP**.

## Direction

- **Chosen direction:** Operations access ledger—a dark-teal internal access route beside one white credential sheet, using the existing admin console palette rather than the public navy/cobalt auth world.
- **Approved comp:** `.impeccable/mocks/admin-sign-in-a-ledger.png` (`approved: true` in its sidecar).
- **Concept seed:** `9c23affc`, grounded candidate 5.
- **Memorable moment:** Credentials, authenticator, and Admin console remain visible as one precise route while the ledger advances from completed credentials to the current authenticator checkpoint and a future console destination.

## Fidelity inventory

| Ingredient | Commitment | Medium |
|---|---|---|
| Admin identity | Existing detailed seal, As-Sabiquun name, and Admin console label | Existing brand SVG + semantic HTML/CSS |
| Access ledger | Dark teal field with the real three-stage route; earlier stages complete, one stage current, later stages future | Shared semantic component + CSS + Lucide icons |
| Credential task | White field with assigned-email and password inputs, team-admin recovery guidance, error region, and conditional-MFA note | Semantic HTML/CSS |
| Authenticator challenge | Current six-digit code task with refresh guidance and a direct verify-and-continue action | Semantic HTML/CSS + server action |
| Authenticator enrollment | Setup launch, generated QR code, selectable manual key with handling warning, then six-digit verification | Semantic HTML/CSS + generated Supabase TOTP material |
| Account escape | No-authenticator guidance and “Use another administrator,” which signs out before returning to sign-in | Semantic HTML/CSS + server action |
| Primary actions | Teal sign-in, setup, enable, and verification controls with explicit pending and disabled states | Semantic HTML/CSS + Lucide icons |
| Imagery | No decorative imagery; the generated QR code is functional setup material | Accepted omission + generated QR image |

## Route and state model

- **Credentials checkpoint:** Credentials are current on sign-in. Successful credentials route to enrollment, challenge, or the safe requested admin destination according to the real MFA state.
- **Authenticator challenge:** Credentials render as complete, Authenticator is current, and Admin console remains future. The operator enters the current six-digit TOTP code; a missing factor moves safely to enrollment.
- **Authenticator enrollment:** Credentials render as complete, Authenticator is current, and Admin console remains future. The first state explains that setup material will be generated and exposes “Create setup code.” The generated state shows a 220px QR code, a selectable manual setup key, a security warning, and the verification field.
- **Console completion:** Console is reached only after the session is MFA verified. The protected admin layout reinforces the result with an “MFA secured” status.
- **Recovery and escape:** Password recovery remains an instruction to ask a team administrator to set a new password; no self-service recovery is promised. Challenge and enrollment provide contact guidance plus a switch-account action that signs out the current session and preserves the safe destination.
- **Destination continuity:** The originally requested pathname, query, and hash are carried through credentials, challenge, enrollment, missing-factor fallback, and account switching. Only local `/admin` destinations are accepted; sign-in and MFA routes themselves fall back to `/admin` to prevent loops.

## Component grammar

- **Corners:** 16px outer frame, 10–12px fields and messages, pill primary action.
- **Lines:** Fine ink/teal rules separate route stages and form facts.
- **Elevation:** One soft structural frame shadow; internal regions remain flat.
- **Type:** Existing admin display/sans stack throughout; no public editorial serif.
- **Colour:** Manuscript ivory ground, white credential sheet, dark operational teal ledger, ink text, and gold only for the current access stage.
- **States:** Inputs shift from warm ivory to white with a teal border and halo on focus. Primary actions darken and lift by 1px on hover, use a restrained gold focus outline, and replace their labels with task-specific pending copy while their fieldsets are disabled. Secondary escape actions keep an underlined treatment and receive the same visible gold focus language.
- **Errors and announcements:** Credential, setup, and verification errors use the warm-red error surface and `role="alert"`. Authenticator fields connect errors and instructions with `aria-describedby` and expose `aria-invalid`; pending setup and verification messages are announced through polite live regions.
- **Focus and contrast:** Generated enrollment content moves programmatic focus to the scan heading. White-on-dark-teal ledger text, warm-ink text on white/ivory, explicit teal field focus, gold action focus, and the warm-red error treatment preserve readable state contrast without relying on colour alone; current steps use `aria-current`, completed steps use checks, and pending controls change copy and interaction state.
- **Motion:** The complete frame may arrive once with a short upward fade; remove the animation and all control transitions when reduced motion is requested.

## Truth and responsive behavior

- Preserve safe admin `next`, rate limiting, active-admin enforcement, credential and authenticator errors, real MFA routing, the team-admin password reset instruction, and switch-account sign-out behavior.
- Do not claim monitoring, audit logging, certification, self-service recovery, or access rights beyond what the implementation guarantees.
- Treat the comp as visual authority, not literal copy authority: retain the implementation's conditional MFA language (“when required”) and “Admin console” stage name rather than the comp's universal-MFA claim or shortened “Console” label.
- Keep the task first in DOM order on every route. At wide sizes, CSS places the ledger visually left and the task sheet right, caps the split frame at 1120px, and weights the task sheet wider than the ledger.
- At 1050px and below, stack the task sheet first and convert the three access stages into a horizontal ledger below it. This mobile task-first order is the unmodified DOM order, not a visual-only reorder.
- At 720px and below, collapse generated enrollment from a two-column QR/manual-key arrangement to one column, moving the divider below the QR panel.
- At 560px and below, make the composition edge-to-edge, hide the repeated admin identity, stage icons, and stage descriptions, but retain the three numbered stage names. Keep the credential task and sign-in action above the route ledger.
