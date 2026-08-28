# As-Sabiquun landing — design-loop execution plan

## Benchmark and boundary

- **Gold standard:** the rendered August Health homepage at `https://www.augusthealth.com/`.
- **Target:** reproduce its visual rhythm, composition, section sequencing, interaction grammar, and responsive confidence on `/landing`.
- **Originality boundary:** As-Sabiquun uses its own copy, palette, generated photography, service information, seal, and fictional concept marks. No August Health assets, copy, customer logos, or brand identifiers are carried over.

## Acceptance bar

The seven checkable mechanisms in [`bar.md`](../bar.md) are the acceptance criteria. The landing only exits the loop when each piece receives a simultaneous `PASS` from the brief, system, and blind craft critics.

## Page map

1. **Hero + trust rail** — fixed capsule nav, circular-media hero, short proof/mark rail.
2. **Service platform** — `Get to know us`-style editorial lead-in and six-card 2×3 service grid.
3. **Values well** — circular-entry dark band, centered values message, stacked statements, flattening scroll geometry.
4. **Stories + close** — 16:9 placeholder, clipped three-card story rail, dot/arrow controls, dark closing transition, and split footer.

## Build order

### 1. Hero + trust rail

- Keep the hero’s central type block clear at desktop and narrow mobile.
- Use the three original Higgsfield images only as cropped editorial fragments around the edge, alongside original abstract UI fragments.
- Retain the 66px floating nav; validate every CTA and trust mark clears it at all breakpoints.
- Keep six marks original and label the concept status without turning the rail into an endorsement claim.

**Exit proof:** desktop + mobile renders; brief critic verifies As-Sabiquun’s giving entry point, system critic verifies tokens/geometry, and blind craft critic chooses our render over the reference on the explicit bar.

### 2. Service platform

- Introduce an understated eyebrow and oversized serif introduction.
- Build exactly six service cards: Korban, Wakaf Water, Wakaf Quran, Food for Orphans, Giving Updates, and Project Support.
- Give each a distinct tinted surface and original graphic/media composition; avoid duplicated card layouts.
- Implement the card lift and arrow translation as a single 260ms interaction, with reduced-motion fallback.

**Exit proof:** no more/fewer than six cards; desktop 2×3 grid, mobile single column; arrows and hover behavior visibly work.

### 3. Values well

- Transition from paper into a dark deep-teal/ink elliptical well, then flatten it through the section.
- Build three large, readable value statements with one thin connecting line and intentional staggered color.
- Ensure the shape is static and legible under reduced motion and does not create horizontal scroll on mobile.

**Exit proof:** transition is legible in a full-page render; all values pass contrast and mobile remains stable.

### 4. Stories + close

- Use the generated water-point image in a clear 16:9 placeholder with an explicit `concept placeholder` treatment.
- Build an oversized, horizontally clipped three-story rail with partial neighboring cards, hover lift/arrow movement, and compact dot/arrow controls.
- Flow into the dark closing statement with outline circles, then the two-panel footer; keep the original nav as the only header.

**Exit proof:** rail clips intentionally at desktop, degrades to swipe/stack layout on mobile, and footer closes the page without introducing a second header.

## Review cadence

For each piece: builder → local render (desktop + 390px mobile) → fresh brief critic + fresh system critic + fresh blind craft critic → record every result and failure in `design-loop/progress.html` → revise until the same rendered round earns three passes. No next piece begins until the current piece passes.

## Final verification

1. Capture the complete local `/landing` page at desktop and 390px wide.
2. Re-run all four page pieces through the council in context to catch section-to-section regressions.
3. Run TypeScript, lint, build, and `git diff --check`.
4. Provide the user the final local screenshots and a concise list of original generated assets.
