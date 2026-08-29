# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People choosing and funding Islamic services for themselves, their families, or a dedication, and clients evaluating As-Sabiquun as the organiser of that work.

## Product Purpose

As-Sabiquun lets people choose an Islamic service, complete the relevant request or contribution flow, and receive a clear reviewed record after fulfilment. Success means a visitor can understand the available service, act with confidence, and follow what happens after payment.

## Positioning

The product joins a simple service-selection experience with operational follow-through: local fulfilment partners carry out the work, evidence is reviewed, and the customer receives a completion record rather than an unsupported promise.

## Operating Context

The current public journey starts on the marketing site, moves into one of four service flows, then continues through account, payment, project tracking, and reporting. Administrators manage offerings and evidence; approved partners fulfil assigned work.

## Capabilities and Constraints

- Four live services: Korban, Wakaf Water Pump, Wakaf Quran, and Food for Orphans.
- Active package names and prices are loaded from the offerings data source; public pages must not invent availability or fixed pricing.
- Islamic Business Consultancy and AI Automation are announced as coming soon and are not actionable services yet.
- Service detail routes and their existing fulfilment flows must remain intact.
- The public site is a responsive Next.js web application.

## Brand Commitments

- Product name: As-Sabiquun.
- Use the detailed As-Sabiquun seal at `public/brand/as-sabiquun-seal.svg` wherever the mark appears.
- Voice is warm, direct, careful, and transparent; avoid exaggerated charitable claims.
- The August Health site is the binding reference for the public marketing composition and interaction grammar, adapted to As-Sabiquun's own content, identity, and palette.

## Evidence on Hand

- Live offering data and pricing in `src/lib/offerings.ts`.
- Confirmed service definitions in `src/components/service-card.tsx` and `src/lib/wakaf-projects.tsx`.
- Existing customer, admin, partner, evidence-review, and reporting flows in `src/app`.
- No verified testimonials, customer logos, outcome statistics, or public case-study evidence should be fabricated.

## Product Principles

- Make the next action unmistakable.
- Show what happens after a contribution, not just how to begin one.
- Keep operational claims tied to real product behavior.
- Treat religious intent with clarity and restraint.
- Preserve continuity between marketing, service selection, payment, and reporting.
