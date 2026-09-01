---
version: 1
slug: "route-partner-onboarding"
primary_target: "route:/partner-onboarding"
related_targets: ["src/app/(marketing)/partner-onboarding/page.tsx","src/app/(marketing)/partner-onboarding/form.tsx","src/app/(marketing)/partner-onboarding/partner-onboarding.module.css"]
---

# Partner onboarding

## Scope and mode

- **Route:** `/partner-onboarding` for invited partners completing their operating profile.
- **Visitor mode:** Operate.
- **Audience and job:** An authenticated invited partner supplies the organisation, service capability, and settlement records required to activate their partner account.
- **Primary task:** Complete and submit all three sections without losing context about why each record is required or what happens next.

## Direction

- **Chosen direction:** Operating profile register—a continuous cream-and-paper record with a slim deep-navy approval-route rail. This extends the partner sign-in and recovery surfaces without becoming an internal dashboard.
- **Approved comp:** `.impeccable/mocks/partner-onboarding-a-register.png` (`approved: true` in its sidecar).
- **Concept seed:** `eebac684`, grounded candidate 3.
- **Memorable moment:** The rail turns a long form into a legible three-record approval route while the form remains the dominant working surface.

## Fidelity inventory

| Ingredient | Commitment | Medium |
|---|---|---|
| Page header | Large editorial title, concise real explanation, and a verified-record note without an ornamental eyebrow | Semantic HTML/CSS |
| Main register | Continuous cream-and-paper form with three real numbered sections—Organisation and contact, Service capability, and Settlement details—fine navy rules, and pragmatic field grids | Semantic HTML/CSS |
| Approval rail | Deep navy, invitation status, three-section route, truthful post-submit note | Semantic HTML/CSS + Lucide icons |
| Service choices | Selectable rows/chips with native checkbox semantics and clear selected states | Semantic HTML/CSS |
| Primary action | Solid cobalt submit action at the end of the real form | Semantic HTML/CSS + Lucide icon |
| Imagery | None; this is an operational record and needs no decorative asset | Accepted omission |

## Component grammar

- **Corners:** Modest 10–18px radii on the outer register and controls; section structure comes from rules and spacing, not cards.
- **Lines:** 1px navy rules at low opacity; 2px cobalt focus rings; no ornamental strokes.
- **Elevation:** One restrained shadow on the outer register only; inner sections remain flat.
- **Type:** Newsreader editorial display for the page and section titles; Inter for labels, controls, notes, and actions.
- **Colour:** Cream ground and paper, deep navy ink/rail, cobalt only for focus and action, green only for invitation/verified state.

## Truth and responsive behavior

- Preserve the authenticated invitation gate, password-only session requirement, native and server validation, post-submit sign-out, and allowlisted safe `next` redirect behavior.
- Do not introduce save-draft, approval timing, dashboard navigation, extra fields, or support contact claims.
- Desktop uses a dominant form with a narrow rail. Mobile adapts to a compact route-before-form sequence: the approval route stacks first, compresses to a three-column summary, then yields to single-column form grids without horizontal overflow.

## Unresolved decisions

- None for this redesign scope.
