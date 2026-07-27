# Flow Spec: Action-first dashboards

## Goal

Make every portal answer the user's first question before showing analytics:

- Customer: what is happening with my projects?
- Vendor: what must I respond to or complete?
- Admin: what needs my action now?

Graphs remain only when they show a real trend, comparison, or part-to-whole relationship.

## References

- Wise dashboard: one clear task, restrained summaries, confident whitespace.
- Shopify order operations: work and record context before secondary analytics.
- Linear task hierarchy: compact queues with visible next actions.
- Stripe dashboard: sparse charts, flat surfaces, and disciplined emphasis.
- Saved boards:
  - `docs/flows/customer-conversion/wise-reference-board.png`
  - `docs/flows/vendor-dashboard/premium-reference-board.png`
  - `docs/flows/access-and-operations/reference-board.png`

Live Mobbin search was unavailable because the installed client returned `404` for the current Mobbin API. Saved project captures are the Mobbin source of truth for this pass.

## Experience hierarchy

| Portal | First | Second | Third |
|---|---|---|---|
| Customer | Clear overview and giving journey | Project tracker | Project detail |
| Vendor | Offers and jobs needing action | Counts and truthful status analytics | Recent activity |
| Admin | Jobs requiring admin action | Operational trend and totals | Full registers |

## Chart rules

- Line charts show change over time and use the timestamp named in the title.
- Bar charts compare separate periods or categories.
- Donuts show a small, stable part-to-whole split.
- A single number stays a number; it does not become a chart.
- Exact operational and financial records stay in tables/lists.
- Empty charts state that there is no activity; they never invent data.
- Colour never carries meaning without a text label.
- Customer charts count paid services and approved projects only. They never quantify religious reward.

## Copy rules

- Lead with a verb or plain-language outcome.
- Prefer “Send to vendors,” “Review submission,” and “Pay vendor” over internal lifecycle terms.
- Keep one short explanation under a page title.
- Buttons state the action they perform.

## Acceptance criteria

- [ ] Vendor offers appear before vendor analytics.
- [ ] Admin actions appear before admin analytics.
- [ ] The vendor assignment trend uses `accepted_at`, not order creation time.
- [ ] Customer impact excludes unpaid, refunded, cancelled, and test orders.
- [ ] Every graph has a clear title, description, legend or direct labels, and text-equivalent data.
- [ ] Public and portal copy is understandable without knowing internal workflow terminology.
- [ ] Desktop and mobile layouts retain visible focus, readable contrast, and no horizontal page overflow.

