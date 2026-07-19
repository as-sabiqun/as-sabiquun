# Flow Spec: Public site v1

## Goal

Give a Muslim visitor a clear, trustworthy path from understanding As-Sābiqūn to choosing one of four Islamic services. The public site must feel established and accountable before the operational backend is connected.

## Reference and rationale

- TravelConnect.sg, web — captured reference `b601c7f5-e2b0-4866-bf5a-b76d82397ffb`
- Global Ehsan Relief, web — captured reference `9501de66-351a-44d8-8124-5b21bc359c67`
- TravelConnect contributes the calm trust hierarchy: utility bar, focused hero, three-step process, clear offerings, final CTA, substantial footer.
- Global Ehsan contributes the conversion structure: prominent service choices, outcome-led cards, accountability content, and proof-oriented service details.
- We will not copy either organisation's logo, photographs, claims, testimonials, statistics, prices, copy, exact components, or trade dress.

## Flow model

**Visitor goal:** understand the organisation, identify the right service, and confidently begin or contact the team.

**Beats:** establish trust → explain the offer → reduce uncertainty → show accountability → invite action.

| # | Screen/state | Visitor's job | Entry | Exit/next | Project route/component |
|---|---|---|---|---|---|
| 1 | Global shell | Recognise the organisation and available paths | Any public route | Navigate or call | `site-shell.tsx`, `brand.tsx` |
| 2 | Homepage hero | Understand what As-Sābiqūn does | `/` | Explore services or learn the process | Marketing homepage |
| 3 | Service selection | Compare the four initial services | Homepage or `/services` | Open Korban or Wakaf | New `/services`; homepage cards |
| 4 | How it works | Understand the fulfilment journey | Homepage/services | Continue with confidence | Shared three-step section |
| 5 | Accountability | Understand what will be recorded and delivered | Homepage/service page | Begin a service | Proof/timeline section |
| 6 | Organisation story | Understand purpose, mission, vision and team focus | `/about` | Explore services/contact | About page |
| 7 | Service detail | Understand scope and begin the existing demo form | `/korban` or `/wakaf` | Submit the demo form | Existing service pages/forms |
| 8 | Contact | Reach the team through the form or phone | `/contact` | Submit/contact | Contact page |
| 9 | Closing navigation | Find services, contact, socials and team login | Footer | Navigate | Shared footer |

## Transitions and branches

- Happy path: shell → homepage → services → service detail → existing demo form.
- Secondary path: shell → about/how it works → services.
- Contact path: any page → Contact or telephone link.
- Mobile: compact header → native menu → same routes; cards and CTAs stack.
- Placeholder content: social labels are visibly marked “Coming soon” and do not pretend to be live links.
- No genuine field media: use brand-led editorial panels, never fake documentary proof or invented testimonials.
- `/designs` remains available by direct URL but is excluded from public navigation.

## Keep, drop, adapt, add

| Decision | Pattern | As-Sābiqūn implementation |
|---|---|---|
| Keep | Strong hero and one primary action | Clear Islamic-services promise and `Explore services` CTA |
| Keep | Three-step explanation | Choose service → team coordinates → receive verified proof |
| Keep | Image-led offering hierarchy | Four branded visual service cards without copied photography |
| Drop | Hero carousels | One focused hero |
| Drop | Currency, cart, recent donors, mega-menu | Four-service navigation only |
| Drop | Invented impact counters/testimonials | Process promises and evidence preview |
| Adapt | Travel packages/appeals | Korban, Wakaf Water Pump, Wakaf Quran, Food for Orphans |
| Adapt | Donation language | Service-appropriate `Explore`, `Begin`, and `Contact` language |
| Adapt | Deep charity footer | Organisation summary, services, contact, placeholder socials, team login |
| Add | What customers receive | Receipt, nameplate/certificate, and verified media preview |
| Add | Brand seal | Supplied As-Sābiqūn seal with a compact digital lockup |

## Design system

### Colour

- Azure/primary: `#1D737F`
- Light turquoise/section surface: `#DDE6E3`
- Light yellow/page surface: `#F7F7F3`
- Dark grey-brown/text: `#31231B`
- Gray orange/decorative accent: `#A27C47`
- The written palette values are authoritative; the screenshot and logo pixels vary slightly.
- Gray orange is decorative only because it does not provide reliable normal-text contrast.

### Type

- Bricolage Grotesque: restrained display headings.
- Inter: body, navigation and controls.
- Noto Naskh Arabic: Arabic phrases.
- Retain the installed font stack; add no dependency.

### Layout and signature

- Spacious editorial sections, restrained rounded corners, direct typography, and full-width teal accountability bands.
- Signature element: an **Amanah trail** that visually connects the three fulfilment steps and culminates in a proof/document bundle.
- The seal is used as an official trust mark, not repeated as decoration.

## UI mapping

| Reference pattern | Project implementation |
|---|---|
| Utility contact bar | `DemoBar` upgraded with phone and service message |
| Two-tier navigation | Existing `Header` + native `details` menus for desktop/mobile |
| Image-led hero | Split hero with official seal and brand-led editorial panel |
| Package/appeal cards | Four service cards on `/` and `/services` |
| Process section | Existing `steps` content restyled as the Amanah trail |
| Impact/proof block | Honest “What you receive” preview with no fabricated numbers |
| Deep footer | Existing `Footer` expanded with services, phone and placeholder socials |

## Interaction and motion

- Use CSS transitions only for navigation, card hover and CTA feedback.
- Respect `prefers-reduced-motion` through the existing global rule.
- Use native `details/summary` for menus; no new JavaScript menu dependency.
- Maintain visible keyboard focus for all interactive elements.

## Instrumentation

No analytics dependency is added in Part 1. Route and CTA event tracking belongs to the later backend/analytics part.

## Acceptance criteria

- [x] The official written palette drives every public page.
- [x] The supplied seal replaces the temporary geometric mark in public branding.
- [x] Home, Services, About, Korban, Wakaf and Contact share one coherent design system.
- [x] The four confirmed services are clearly represented.
- [x] The homepage follows trust → services → process → accountability → CTA.
- [x] Phone `+65 8993 3786` and professional social placeholders appear in the footer.
- [x] Desktop and mobile navigation reach every public page.
- [x] `/designs` still works but is not publicly linked.
- [x] No copied reference media, fake testimonials, fake statistics or live-service claims appear.
- [x] Mobile layouts have no horizontal overflow and primary actions remain visible.
- [x] Lint, tests and production build pass.
