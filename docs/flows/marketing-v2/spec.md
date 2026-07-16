# Flow Spec: Modern Islamic marketing to service

## Goal
Help a Muslim visitor recognise the organisation as credible and faith-led, understand the available services, see how fulfilment is handled, and confidently begin Korban or Wakaf.

## Reference & rationale
- Wise dashboard (`5f4d82d0-665b-41b4-9e2a-a7525cd52fc1`) — restrained navigation, strong overview hierarchy, generous whitespace.
- Wise transfer progress (`a7785026-6517-4d1d-befa-2719ebe38adf`) — transparent steps, fee/status clarity, reassuring completion language.
- Revolut option selection (`58973a7c-b4e6-4492-acff-80f969fbf60f`) — decisive tiles and low cognitive load.
- Revolut feature explanation (`f6fb87ad-e786-419a-8209-3623f6bff6ac`) — focused feature storytelling and clean supporting detail.
- Coinbase home navigation (`9a77e1fd-8059-47cf-bb18-6d1ad313c83b`) — credible information architecture and visible primary actions.
- Visual board: [`mobbin-reference.png`](./mobbin-reference.png)

We are adopting the references' hierarchy, clarity, task focus, and progress/status patterns. We are deliberately not copying finance terminology, dense sidebars, charts, crypto content, or brand colours.

## Flow model

**Beats:** Islamic recognition → service clarity → operational reassurance → confident action

| # | State | Visitor's job | Input | Output | Key pattern |
|---|---|---|---|---|---|
| 1 | Brand promise | Decide whether this feels credible and relevant | Landing page | Clear faith-led value proposition | Restrained hero + one primary CTA |
| 2 | Service choice | Compare Korban and Wakaf | Service cards | Chosen service | Focused selection tiles |
| 3 | Trust explanation | Understand handoffs and proof | Process preview | Reduced uncertainty | Visible progress/status model |
| 4 | Action | Begin the relevant service | CTA | Korban or Wakaf route | Single decisive next action |

### Transitions and branches
- Landing → Korban or Wakaf from the hero and service tiles.
- Landing → process preview for visitors who need reassurance before acting.
- Coming-soon consultancy offerings remain visible but cannot be mistaken for active services.
- Demo state is always explicit; no payment or real order is implied.

## Gap & mapping

| Decision | Reference lesson | As-Sābiqūn implementation |
|---|---|---|
| Keep | Clear global navigation and one dominant action | Existing routes plus a compact service CTA |
| Keep | Visible progress and status | A four-stage fulfilment card: intention, review, vendor, proof |
| Drop | Dense finance dashboards and analytics | No charts, sidebars, balances, or speculative metrics |
| Drop | Playful emoji and decorative novelty | Replace with restrained SVG arches, geometry, and line icons |
| Adapt | Selection tiles | Korban and Wakaf cards with price/scope/status visible upfront |
| Adapt | Neutral finance palette | Emerald, ivory, ink, and restrained gold tokens |
| Adapt | Product feature copy | Amanah, ihsan, niyyah, and documented fulfilment in plain English |
| Add | Islamic identity | Arabic microcopy, mihrab arches, eight-point geometry, crescent/star mark |
| Add | Service accountability | Vendor handoff and completion-proof explanation near the CTA |

## UI mapping

| Reference pattern | Project implementation |
|---|---|
| Restrained product shell | Shared `DirectionBar`, compact brand navigation, 1180–1240px content grid |
| Overview dashboard | Service overview panel showing active offerings and clear scope |
| Progress indicator | Four-stage fulfilment timeline with current/completed states |
| Selection tiles | High-contrast Korban/Wakaf cards linking to existing routes |
| Focused feature explanation | Amanah section with one statement, three operational assurances |
| Supporting illustration | Code-native arch, rosette, and geometric line motifs using project colours |

## Visual system
- Foundation: deep emerald, warm ivory, near-black ink, restrained antique gold.
- Typography: modern sans for navigation and product UI; display serif and Noto Naskh Arabic for faith-led moments.
- Shape: architectural arches and precise 8-point geometry; no generic blobs or emoji.
- Layout: strong grid, smaller type than the first concepts, disciplined spacing, bordered panels, visible status.
- Direction variants: four professional expressions of the same system—sanctuary, digital, manuscript, and community.

## Interaction & motion
- Hover lift is limited to 2px with colour/border change.
- Direction switcher remains horizontally scrollable on mobile.
- Reduced-motion preferences disable transitions through the existing global rule.

## Acceptance criteria
- [ ] All four concepts feel recognisably Islamic without relying on mosque photography.
- [ ] Each concept has a professional hero, service selection, trust/process module, and CTA.
- [ ] Korban and Wakaf remain one click away.
- [ ] Prices, demo status, and proof process are unambiguous.
- [ ] No mobile horizontal overflow at 390px.
- [ ] Existing marketing and service routes remain functional.
- [ ] Visuals use As-Sābiqūn tokens rather than reference brand values.

