import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { money } from "@/lib/domain";
import { createServiceSupabase, isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Demo order recorded",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export const dynamic = "force-dynamic";

export default async function SuccessPage({ params, searchParams }: PageProps<"/order/success/[reference]">) {
  const { reference } = await params;
  const token = (await searchParams).token;
  if (typeof token !== "string") notFound();
  if (!isSupabaseConfigured) notFound();

  const { data: order } = await createServiceSupabase()
    .from("orders")
    .select("reference, total_amount, offerings(title)")
    .eq("reference", reference)
    .eq("checkout_token", token)
    .eq("payment_provider", "demo")
    .eq("payment_status", "paid")
    .single();

  if (!order) notFound();
  const offering = Array.isArray(order.offerings) ? order.offerings[0] : order.offerings;

  return (
    <section className="checkout-shell checkout-success section">
      <div className="container">
        <nav className="checkout-progress" aria-label="Checkout progress">
          <ol>
            <li className="is-complete"><span aria-hidden="true">1</span><strong>Details</strong></li>
            <li className="is-complete"><span aria-hidden="true">2</span><strong>Review</strong></li>
            <li className="is-complete"><span aria-hidden="true">3</span><strong>Payment</strong></li>
          </ol>
        </nav>

        <div className="checkout-success-card">
          <div className="checkout-success-mark" aria-hidden="true">OK</div>
          <p className="checkout-kicker">Demo recorded</p>
          <h1 className="display">Your demonstration order is confirmed.</h1>
          <p className="lead">This records a demo payment state only. No bank, card, PayNow account, or payment provider was contacted.</p>

          <section className="checkout-reference" aria-labelledby="receipt-heading">
            <div>
              <p className="eyebrow">Keep this reference</p>
              <h2 id="receipt-heading">{order.reference}</h2>
            </div>
            <dl>
              <div><dt>Service</dt><dd>{offering?.title ?? "Islamic service"}</dd></div>
              <div><dt>Status</dt><dd>Paid - demo</dd></div>
              <div><dt>Recorded total</dt><dd>{money(order.total_amount)}</dd></div>
            </dl>
          </section>

          <div className="checkout-success-next">
            <p className="eyebrow">In the production workflow</p>
            <h2>The team reviews the service details, coordinates fulfilment, and returns available proof with the completed record.</h2>
          </div>

          <div className="checkout-success-actions">
            <Link href="/" className="btn">Return home</Link>
            <Link href="/services" className="btn btn-secondary">Explore services</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
