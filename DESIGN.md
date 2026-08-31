---
name: As-Sabiquun Public Service Journey
description: A warm, accountable path from service choice through secure payment to reviewed completion.
colors:
  manuscript-cream: "#f8f3eb"
  paper: "#fffefa"
  midnight-ink: "#080331"
  handoff-navy: "#1b1463"
  action-cobalt: "#4865ff"
  readable-cobalt: "#3653ef"
  verified-green: "#328a3b"
  assurance-mint: "#e4efea"
  ceremonial-sun: "#f4ca61"
  white: "#ffffff"
typography:
  display:
    fontFamily: "Newsreader, Georgia, Times New Roman, serif"
    fontSize: "clamp(48px, 5vw, 68px)"
    fontWeight: 400
    lineHeight: 0.98
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Newsreader, Georgia, Times New Roman, serif"
    fontSize: "clamp(32px, 3vw, 43px)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Inter, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.62
  label:
    fontFamily: "Inter, Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 760
    lineHeight: 1.35
    letterSpacing: "0.07em"
  arabic-accent:
    fontFamily: "Noto Kufi Arabic, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.3
rounded:
  focus: "6px"
  message: "12px"
  panel: "16px"
  pill: "999px"
spacing:
  compact: "12px"
  control: "18px"
  panel: "28px"
  section: "48px"
  major: "72px"
components:
  button-payment:
    backgroundColor: "{colors.white}"
    textColor: "{colors.handoff-navy}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 18px"
    height: "56px"
  button-payment-hover:
    backgroundColor: "{colors.ceremonial-sun}"
    textColor: "{colors.midnight-ink}"
  service-chip:
    textColor: "{colors.readable-cobalt}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 12px"
    height: "28px"
  payment-panel:
    backgroundColor: "{colors.handoff-navy}"
    textColor: "{colors.white}"
    rounded: "{rounded.panel}"
    padding: "28px"
---

# Design System: As-Sabiquun Public Service Journey

## Overview

**Creative North Star: "The Reviewed Handoff"**

The public experience should feel like a careful transfer of responsibility: a person chooses a meaningful service, reviews the true record, pays through a named secure provider, and can see how the work moves toward verified completion. Warm manuscript cream and editorial type preserve humanity; precise rules, compact status language, and tabular records make the operational promise legible.

This system covers the public marketing-to-checkout journey. It does not prescribe the visual language of internal admin or partner portals. Checkout is not a generic ecommerce cart: it is the visible handoff between a reviewed request and accountable fulfilment.

**Key Characteristics:**

- Editorial serif moments set purpose and reassurance; clean sans-serif text carries facts and actions.
- Cream, paper, and fine navy rules keep records calm, open, and inspectable.
- One deep-navy payment panel concentrates security, amount, provider, identity, and the primary action.
- Cobalt marks the current action, green marks verified completion, and sun is a rare ceremonial accent.

## Colors

The palette pairs warm paper neutrals with disciplined navy structure and small, semantic bursts of cobalt, green, and sun.

### Primary

- **Action Cobalt:** Marks the current step, interactive wayfinding, icons, and large-action emphasis. Use Readable Cobalt for small text on cream where the brighter accent is not sufficiently robust.
- **Handoff Navy:** Reserved for the dominant secure-payment surface and other moments of concentrated accountability, not for a field of interchangeable dark cards.

### Secondary

- **Verified Green:** Signals completed or reviewed states and supports evidence-oriented reassurance.

### Tertiary

- **Ceremonial Sun:** Adds a restrained, warm point of emphasis inside dark surfaces, including currency and Arabic accents.
- **Assurance Mint:** Carries quiet confirmation messages attached to records.

### Neutral

- **Manuscript Cream:** The continuous public-page ground.
- **Paper:** A slightly brighter surface available where the public system needs subtle tonal separation.
- **Midnight Ink:** Primary text, rules, and structural detail on light surfaces.
- **White:** High-contrast text and controls within the payment panel.

### Named Rules

**The Semantic Accent Rule.** Cobalt means active or actionable, green means verified, and sun means ceremonial emphasis; do not swap these roles for decoration.

**The One Dark Handoff Rule.** In checkout, the payment panel is the single deep-navy focal surface so amount and action remain unmistakable.

## Typography

**Display Font:** Newsreader (with Georgia and Times New Roman fallbacks)

**Body Font:** Inter (with Arial fallback)
**Arabic Accent Font:** Noto Kufi Arabic (with sans-serif fallback)

**Character:** Newsreader brings humane editorial gravity to intent, service names, amounts, and completion language. Inter keeps provider names, identities, status, metadata, and actions compact and operational.

### Hierarchy

- **Display** (regular, fluid 48–68px, 0.98 line-height): Purpose-led public and checkout headlines; use balanced wrapping and a tight negative tracking rhythm.
- **Headline** (regular, fluid 32–43px, 1.05 line-height): Service names, record headings, and major continuation statements.
- **Body** (regular, 16px, 1.62 line-height): Supporting explanations; narrow factual copy may step down to 13–14px while retaining generous line-height and an observed maximum near 66 characters.
- **Label** (heavy, 10–12px, approximately 0.07em tracking): Provider, reference, status, chip, and currency language; uppercase only where the implementation uses a compact record label.
- **Arabic Accent** (regular, 18px, 1.3 line-height): A brief ceremonial detail, not a substitute for functional instructions.

### Named Rules

**The Purpose-and-Proof Rule.** Use editorial type for meaning and outcome; use sans-serif type for facts, controls, and proof.

## Layout

Public content sits in centered, fluid frames with 14px side gutters on compact screens, 18px at intermediate widths, and 24px on larger screens. Checkout uses an outer header frame capped at 1360px and a content frame capped at 1180px. Fine horizontal rules divide stages and record rows, allowing structure to come from alignment rather than stacks of cards.

At wide sizes, the introduction pairs the main statement with concise continuity copy, the three-stage handoff rail remains horizontal, and the order record sits beside a sticky payment panel. Below 900px, payment moves before the order record and loses sticky positioning. At 620px and below, the compact horizontal stage rail remains visible, secondary stage descriptions disappear, the record becomes single-column, and the payment action remains available within the first 390×844 viewport.

Spacing is deliberate rather than dense: 12–18px for compact facts and controls, about 28px inside primary surfaces, 38–48px between major checkout regions, and up to 72px where editorial sections need separation.

### Named Rules

**The Payment-First Mobile Rule.** Reorder the secure-payment panel before the supporting record on narrow screens without hiding the stage context or primary action.

**The Line-Led Record Rule.** Use rules and alignment for order facts; do not turn every detail into an elevated tile.

## Elevation & Depth

The public system is flat by default. Cream, paper, dark tonal contrast, and fine rules establish hierarchy. Checkout grants one soft structural shadow to the deep-navy payment panel (`0 26px 54px rgba(8, 3, 49, .16)`) so the secure handoff is dominant without making the page feel like a dashboard.

### Shadow Vocabulary

- **Handoff Lift** (`0 26px 54px rgba(8, 3, 49, .16)`): Used on the secure-payment panel only within the documented checkout surface.

### Named Rules

**The Flat Record Rule.** Order data rests directly on the page and is separated by rules; elevation belongs to the action that advances the service.

## Shapes

The form language contrasts straight, line-led records with selectively softened action surfaces. The payment panel uses a calm medium curve (16px), status and error messages use tighter curves (12–14px), and action buttons, progress markers, and service chips are fully rounded. Circles carry sequence and completion; they are functional markers rather than ornament.

## Components

### Buttons

- **Shape:** Fully rounded action control with a 56px minimum height.
- **Primary:** White on Handoff Navy, full-width inside the payment panel, with a lock, direct action label, and forward arrow.
- **Hover / Focus:** Hover shifts to Ceremonial Sun and lifts by 2px over 180ms; keyboard focus receives a visible sun outline. Reduced-motion preferences remove the transform and transition.
- **Disabled:** Keeps its place and label, changes to a wait cursor, and reduces opacity without losing readability.

### Chips

- **Style:** Service type uses a transparent pill, a fine Midnight Ink border, Readable Cobalt text, and compact uppercase label typography.
- **State:** Progress markers use outlined circles for future states, green-filled circles for completed states, and cobalt-filled circles for the current state.

### Cards / Containers

- **Order Record:** Flat on Manuscript Cream with a top rule, ruled definition-list rows, and no outer radius or shadow.
- **Payment Panel:** Handoff Navy, white text, medium curved corners, generous internal spacing, and the sole Handoff Lift shadow.
- **Assurance Message:** Assurance Mint with no decorative shadow; green iconography ties the note to reviewed completion.

### Navigation

- **Style:** The checkout header pairs the detailed As-Sabiquun seal and lockup with a compact secure-checkout label and order reference. A subdued back link sits inside the content frame; hover and keyboard focus shift it to cobalt.
- **Mobile:** Keep the brand and reference while dropping redundant secure-checkout icon and text to protect space.

### Handoff Rail

The three-stage rail is a compact horizontal record of “chosen, payment, completion.” It uses borders rather than a container card, preserves the current step on mobile, and makes future tracking visible before payment.

## Do's and Don'ts

### Do:

- **Do** present checkout as a service handoff from reviewed request to payment to tracked completion.
- **Do** keep amount, currency, provider, signed-in identity, and primary payment action together in the deep-navy panel.
- **Do** preserve the horizontal three-stage context and payment-first mobile order.
- **Do** use the detailed As-Sabiquun seal whenever the public brand mark appears.
- **Do** tie status language and visual emphasis to real order and fulfilment behavior.

### Don't:

- **Don't** restyle checkout as a generic cart, basket, or product-tile grid.
- **Don't** multiply dark or elevated panels until the payment handoff loses dominance.
- **Don't** use Cobalt, Verified Green, or Ceremonial Sun interchangeably.
- **Don't** fabricate pricing, fulfilment evidence, testimonials, or completion claims to fill a composition.
- **Don't** apply these public marketing-to-checkout rules as a visual prescription for internal admin or partner portals.
