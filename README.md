# As-Sābiqūn Association Consultancy

Connected boss-facing demonstration of public Korban/Wakaf journeys and an admin/vendor fulfilment workflow.

## Setup

1. Copy `.env.example` to `.env.local` and add Supabase project credentials.
2. Apply `supabase/migrations/20260715000000_initial_demo.sql`.
3. Create two Supabase Auth users and matching `profiles` rows with `admin` and `vendor` roles.
4. Run `npm run dev` or deploy to Vercel.

No real payment provider is connected. All offerings, prices, orders, and payment states are demonstration data.
