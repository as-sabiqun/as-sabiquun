import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { completeDemoPayment } from "@/app/actions";
import { money } from "@/lib/domain";
import { createServiceSupabase, isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Review demo order",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export const dynamic = "force-dynamic";

export default async function DemoCheckoutPage({ params, searchParams }: PageProps<"/checkout/demo/[token]">) {
  const { token } = await params;
  const query = await searchParams;
  if (!isSupabaseConfigured) return <Checkout preview />;

  const { data: order } = await createServiceSupabase()
    .from("orders")
    .select("reference, service_type, quantity, total_amount, payment_status, offerings(title, detail, location)")
    .eq("checkout_token", token)
    .eq("payment_provider", "demo")
    .in("payment_status", ["pending", "paid"])
    .single();

  if (!order) notFound();
  const offering = Array.isArray(order.offerings) ? order.offerings[0] : order.offerings;

  return (
    <Checkout
      error={query.error === "payment"}
      order={{
        reference: order.reference,
        serviceType: order.service_type,
        title: offering?.title ?? "Islamic service",
        detail: offering?.detail ?? "Service coordinated by the As-Sabiqun team.",
        location: offering?.location,
        quantity: order.quantity,
        total: order.total_amount,
        paid: order.payment_status === "paid",
      }}
      token={token}
    />
  );
}

type CheckoutProps = {
  error?: boolean;
  preview?: boolean;
  token?: string;
  order?: {
    reference: string;
    serviceType: "korban" | "wakaf";
    title: string;
    detail: string;
    location: string | null;
    quantity: number;
    total: number;
    paid: boolean;
  };
};

function Checkout({
  error = false,
  preview = false,
  token,
  order = {
    reference: "ASQ-PREVIEW",
    serviceType: "korban",
    title: "Korban Overseas Package",
    detail: "One cow share coordinated with a fulfilment partner.",
    location: "Indonesia",
    quantity: 1,
    total: 28000,
    paid: false,
  },
}: CheckoutProps) {
  const complete = token ? completeDemoPayment.bind(null, token) : undefined;

  return (
    <section className="checkout-shell section">
      <div className="container">
        <nav className="checkout-progress" aria-label="Checkout progress">
          <ol>
            <li className="is-complete"><span aria-hidden="true">1</span><strong>Details</strong></li>
            <li className="is-complete"><span aria-hidden="true">2</span><strong>Review</strong></li>
            <li className="is-current" aria-current="step"><span>3</span><strong>Payment</strong></li>
          </ol>
        </nav>

        <div className="checkout-grid">
          <article className="checkout-task">
            <p className="checkout-kicker">Amanah Record - Demo checkout</p>
            <h1 className="display">Review the entrusted details.</h1>
            <p className="lead">Confirm the service and amount before recording a demonstration payment.</p>

            {preview && (
              <div className="checkout-notice" role="status" id="checkout-preview-notice">
                <strong>Sample preview only</strong>
                <p>The backend is not connected, so this example cannot create or update an order.</p>
              </div>
            )}
            {error && (
              <div className="checkout-notice is-error" role="alert">
                <strong>The demo payment was not recorded.</strong>
                <p>Please check the order and try the demonstration again.</p>
              </div>
            )}

            <section className="checkout-record" aria-labelledby="amanah-record-heading">
              <div>
                <p className="eyebrow">Service scope</p>
                <h2 id="amanah-record-heading">{order.title}</h2>
                <p>{order.detail}</p>
              </div>
              <dl>
                <div><dt>Location</dt><dd>{order.location || "Project dependent"}</dd></div>
                <div><dt>Quantity</dt><dd>{order.quantity}</dd></div>
              </dl>
            </section>

            <section className="checkout-record" aria-labelledby="amanah-trail-heading">
              <p className="eyebrow">Amanah Record</p>
              <h2 id="amanah-trail-heading">What follows this step</h2>
              <ol className="checkout-record-list">
                <li className="is-complete"><span aria-hidden="true">1</span><div><strong>Intention recorded</strong><small>Your submitted service details stay with this order.</small></div></li>
                <li className="is-current"><span>2</span><div><strong>Team review</strong><small>The service scope is checked before fulfilment.</small></div></li>
                <li><span>3</span><div><strong>Partner fulfilment</strong><small>An approved partner carries out the assigned work.</small></div></li>
                <li><span>4</span><div><strong>Reviewed proof</strong><small>Available evidence returns with the completion record.</small></div></li>
              </ol>
            </section>
          </article>

          <aside className="checkout-summary" aria-labelledby="order-summary-heading">
            <p className="eyebrow">Order summary</p>
            <h2 id="order-summary-heading">{order.title}</h2>
            <dl>
              <div className="checkout-summary-row"><dt>Reference</dt><dd>{order.reference}</dd></div>
              <div className="checkout-summary-row"><dt>Quantity</dt><dd>{order.quantity}</dd></div>
              <div className="checkout-summary-row"><dt>Demo fees</dt><dd>{money(0)}</dd></div>
              <div className="checkout-total"><dt>Entrusted total</dt><dd>{money(order.total)}</dd></div>
            </dl>

            <p className="checkout-summary-note">No bank, card, PayNow account, or payment provider will be contacted.</p>
            {preview ? (
              <button className="btn checkout-primary" type="button" disabled aria-describedby="checkout-preview-notice">Payment unavailable in preview</button>
            ) : order.paid ? (
              <a className="btn checkout-primary" href={`/order/success/${encodeURIComponent(order.reference)}?token=${encodeURIComponent(token ?? "")}`}>View confirmation <span aria-hidden="true">-&gt;</span></a>
            ) : (
              <form action={complete}>
                <button className="btn checkout-primary" type="submit">Record demo payment <span aria-hidden="true">-&gt;</span></button>
              </form>
            )}
            <a className="checkout-back" href={`/${order.serviceType}`}>&lt;- Check service details</a>
          </aside>
        </div>
      </div>
    </section>
  );
}
