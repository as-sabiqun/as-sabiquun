# As-Sabiquun landing design system

## Direction

An As-Sabiquun service site rendered with the approved August Health composition and motion grammar. Content, project imagery, and the brand lockup remain As-Sabiquun; the visible spatial system is judged directly against the reference screenshots.

## Palette

| Role | Value |
| --- | --- |
| White canvas | `#FFFFFF` |
| Cream case-study field | `#F8F3EB` |
| Ink | `#080331` |
| Indigo values/closing | `#1B1463` |
| Action blue | `#4865FF` |
| Footer green | `#328A3B` |
| Footer deep green | `#0D5238` |
| Coral | `#FF6B40` |
| Pink | `#F5A0EF` |
| Lavender nav state | `rgba(229,227,242,.78)` |

## Typography

- Editorial display: one high-contrast display serif throughout, selected to match Reckless Neue's visible proportions without copying a proprietary font file; desktop H1 is 64/64, section H2 is 48/52.8, trust heading is 32/35.2, and story title is 32/35.2.
- Interface/body: Inter as the Saans-like UI face at 16/25.6; hero body is 24/33.6.
- Labels: 12–13px uppercase inside 1px outlined capsules.

## Surfaces and spacing

- Desktop content width: 1160px.
- Floating nav: centered with a desktop max-width of 1180px and a 66px height; at a 1440px viewport it sits at x130/y16, translucent and blurred.
- Services menu: same centered rail as the floating nav, white 32px-radius shell, three equal columns, and two balanced rows containing only the six service categories; no filler tile or lower statement panel.
- Feature cards: two columns, three rows, 30px radius, interface art in lower half.
- Values route frame: 832×588px, 48px radius, 2px low-contrast outline; the enclosing values section remains normal-flow so all three rows can be reached.
- Case video: 960×748px with a separately rounded 538px stage and 210px white quote panel.
- Story cards: 376×450px, ~32px gap, clipped neighbors.
- Closing: a normal-flow 540px green editorial call-to-action band with one clear statement and two pill actions. Footer: a compact, normal-flow deep-green information grid with no sticky reveal or oversized decorative mark.
- `/about` exception: use a 500px cream editorial closing with one blue call-to-action, directly adjoining the deep-green footer; this overrides the landing green closing treatment.

## Motion

- Desktop hero height tracks the viewport with a 720px floor; the headline shifts down between 720px and 900px viewports while the announcement wrapper remains fixed at y≈92px.
- Hero perimeter field starts at the live reference's 0° arrangement and rotates one turn in about 300 seconds; circle contents counter-rotate at the exact inverse rate.
- The announcement pill is visible on load, fades away on downward scrolling, and reappears after a meaningful upward scroll.
- Trust marks move as a continuous slow marquee.
- Section leads and feature rows reveal only as they enter the viewport, with 500–700ms opacity/translate transitions.
- Feature cards do not lift; only their arrow moves +10px.
- Story cards lift -7px and their arrow moves +5–10px.
- Story carousel buttons lock during each smooth step, move exactly one card, and wrap continuously in both directions.
- Navigation surface changes to translucent lavender over indigo bands.
- Reduced motion resolves all components to their final visible state.

## Asset and trust policy

- Use original As-Sabiquun content and visuals; do not copy August Health’s logo, customer marks, copy, or proprietary screenshots.
- Any showcase organization marks must be original concepts or visibly disclosed as illustrative; no false partnership claim.
- Generated photography contains no text, watermark, or third-party brand marks.
