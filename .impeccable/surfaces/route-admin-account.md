---
version: 1
slug: "route-admin-account"
primary_target: "route:/admin/settings"
related_targets: ["route:/admin/profile","src/app/admin/settings/page.tsx","src/app/admin/profile/page.tsx","src/app/admin/admin-account.module.css","src/app/globals.css"]
---

# Administrator account and settings

## Scope and mode

- **Routes:** `/admin/settings` and `/admin/profile` inside the authenticated administrator console.
- **Visitor mode:** Operate.
- **Audience and job:** An authenticated administrator verifies their own identity/security state, audits system readiness, and—when authorized—manages team access.
- **Primary task:** Make authority and operational risk clear before exposing account-changing controls.

## Direction

- **Chosen direction:** Authority ledger. Profile is the administrator's identity and security record; settings is the operational registry for team authority, provider readiness, business facts, and recent failures.
- **Approved comp:** `.impeccable/mocks/admin-account-a-authority-ledger.png` (`approved: true` in its sidecar).
- **Concept seed:** `7c68cc7b`, grounded candidate 3.
- **Memorable moment:** One full-width team ledger shows identity, authority, account state, MFA readiness, and inline management without a modal.
- **Delivery state:** Shipped. The finish reviewer and UX council both returned **SHIP** after the truth-state fixes and final recapture.

## Fidelity inventory

| Ingredient | Commitment | Medium |
|---|---|---|
| Console shell | Existing deep-teal sidebar and white search topbar remain authoritative | Existing semantic components/CSS |
| Readiness ledger | Connected services, business rules, and recent failures summarized only from loaded truth | Semantic HTML/CSS + Lucide icons |
| Team authority registry | Dominant ruled list with real people, roles, account/MFA state, and inline create/manage controls | Semantic HTML/details/forms/CSS |
| Provider and failure registers | Dense rows with status, explanatory copy, and timestamps; no invented details | Semantic HTML/CSS |
| Profile identity record | Real name, email, access level, MFA status, and sign-out action | Semantic HTML/CSS + Lucide icons |
| Imagery | No new imagery; the operational content and existing brand seal are sufficient | Accepted omission |

## Component grammar

- Use the existing console palette: manuscript ivory (`--cream`), white paper (`--white`), deep operational teal (`--teal-dark`), warm ink (`--ink`), and gold (`--gold`) only for authority, focus, and small current-state details.
- Use fixed sans type sizes, 14–18px structural corners, fine ruled separators, and flat internal regions. One soft outer shadow is enough.
- Reserve filled teal controls for primary actions. Secondary and destructive actions remain clearly differentiated and keyboard-focusable.
- Prefer inline expansion with `<details>` for add/manage work; never hide authority-changing controls in an invented modal.

## Shipped behavior

- **Settings sequence:** A compact page heading establishes the signed-in administrator's access, then the surface reads in operational order: three-part readiness summary, team authority registry, connected-service and recent-failure registers, and read-only business rules.
- **Readiness summary:** Connected-service setup, database-controlled commission/offer-window facts, and recent failure state are derived from live environment and database checks. The summary distinguishes configured, setup-needed, unknown, unavailable, empty, and populated states.
- **Team authority:** The ruled registry shows real administrator identity, authority, sign-in/account state, and MFA readiness. Add-member and per-member management work expand in place with semantic `<details>` disclosures.
- **Account operations:** Authorized administrators can create accounts, set another member's password, suspend or restore access, and—where allowed—change authority or remove an account. Suspension and permanent removal require an explicit confirmation step.
- **Provider and failure registers:** Six named operational connections report configured, setup-needed, or unavailable truth. Delivery, payment, integration, webhook, and worker failures are normalized, sorted newest first, and limited to the newest 12 records.
- **Business rules:** Commission, default offer window, currency, and last-update time are inspectable but not editable. Raw state editing remains intentionally absent.
- **Profile record:** The authenticated profile presents name, email, authority, verified MFA security, a role-appropriate link to settings, and a direct log-out action. The admin layout verifies an active administrator and completed MFA before either route renders.

## Permission and action safety

- `/admin/settings` requires an AAL2 session with at least Administrator authority; the shared admin shell rejects inactive, unauthenticated, unenrolled, or unverified sessions before rendering either route.
- Owners can assign and manage every administrator level. Administrators can create or manage Operations Staff only. Operations Staff do not receive the settings-management link from Profile.
- A signed-in administrator cannot change their own password, authority, suspension state, or membership from this surface. Rows outside the actor's authority show `You` or `Protected` instead of a management control.
- The final active Owner cannot be demoted, suspended, or removed. Only an Owner can change authority levels or permanently remove another administrator.
- Names, emails, roles, and passwords are validated server-side; passwords must be 12–72 characters and match confirmation. UI availability never substitutes for the server authorization check.
- Account creation is transactional at the application boundary: a profile failure deletes the new auth user, and a failed login email attempts the same cleanup. If cleanup itself fails, the error explicitly tells the administrator to remove the incomplete account before retrying.
- Destructive controls use distinct danger styling and plain-language consequences. Removal failure caused by operational history directs the administrator to suspend the account so the audit trail is preserved.

## Truth and error states

- Never replace a failed query with a healthy-looking zero. Aggregate load problems surface in a page-level `role="alert"`; team data becomes `Unavailable`; service-health checks can become `unknown`; and recent failures become `Unavailable` when any contributing source cannot be read.
- A genuinely empty failure result says `None recorded` / `No recent service errors`; a read failure says `Unavailable`. These states must remain semantically and visually distinct.
- Provider readiness comes from required deployment configuration. The notification processor additionally depends on readable queue/cron health, the internal cron secret, and configured active cron state.
- Team mutation results return to Settings as `role="status"` success messages or `role="alert"` error messages. Validation, permission, provider-email, cleanup, and persistence failures keep their specific shipped copy.
- Missing auth emails display `Email unavailable`; missing order references display `Unknown job`; absent business settings display `Not available` / `Not recorded`. Do not infer or fabricate replacements.

## Truth and responsive behavior

- Preserve all existing authorization checks, role assignment rules, final-owner protections, account creation/email behavior, password validation, suspension/restoration, removal behavior, and database-controlled business settings.
- Never copy the comp's invented people, providers, dates, reset-link behavior, navigation labels, metrics, or readiness claims.
- **Desktop:** The readiness ledger is a three-column strip; the team registry remains the dominant full-width record; provider and failure registers share the lower row; business facts follow. Profile is a two-column identity/security record rather than a generic card.
- **Tablet (`<=1080px`):** Provider and failure registers stack. Team columns tighten without dropping identity, authority, account, or action information.
- **Compact (`<=780px`):** The readiness ledger becomes a vertical ruled stack, desktop team headers disappear in favor of visible per-row labels, management panels become one column, and Profile stacks identity above the factual record.
- **Mobile (`<=560px`):** Forms and password fields become one column, primary submissions span the available width, authority controls stack, destructive actions separate into full-width rows, confirmation panels return to normal flow, provider details preserve their labels, business facts become one column, and Profile actions stack.
- **Admin navigation (`<=860px`):** The console sidebar becomes a horizontally scrollable top rail, hides the visual scrollbar, and orders the active destination first so Settings/Profile context stays reachable without widening the page.

## Motion and accessibility

- Inline create/manage panels reveal over 200ms with a small fade and 6px vertical settle; the management chevron rotates over 180ms to reflect disclosure state.
- `prefers-reduced-motion: reduce` removes the account-panel reveal, while the global reduced-motion rule removes all transitions and animations and disables smooth scrolling.
- Global keyboard focus remains a visible 3px gold outline with 3px offset. Disclosures use native `<details>/<summary>`, status and error feedback use live semantic roles, decorative icons are hidden from assistive technology, and the readiness strip has an explicit accessible label.
- Mobile team rows replace the hidden visual header with visible `Authority` and `Account` labels; responsive restructuring must not remove field meaning or action reachability.

## QA evidence

- **Approved direction:** `.impeccable/mocks/admin-account-a-authority-ledger.png`, seed `7c68cc7b`; its sidecar approves hierarchy and density only and forbids copying invented operational content.
- **Settings desktop:** `.impeccable/review/admin-settings-desktop-final.png` verifies the sidebar shell, compact heading, three-part readiness strip, and dominant ruled team registry.
- **Settings mobile:** `.impeccable/review/admin-settings-mobile-final.png` verifies active-first horizontal admin navigation, stacked readiness facts, preserved authority metadata, and reachable team actions.
- **Profile desktop:** `.impeccable/review/admin-profile-desktop.png` verifies the deep-teal identity panel paired with a white factual/security record.
- **Profile mobile:** `.impeccable/review/admin-profile-mobile.png` verifies the single-column identity-to-record sequence, readable account facts, and retained session-security context.
- **Review status:** Finish reviewer disposition **SHIP**. UX council final disposition **SHIP** after confirming truthful unavailable states and current-build desktop/mobile evidence.

## Unresolved decisions

- None for this pass; raw business-setting editing remains intentionally unavailable.
