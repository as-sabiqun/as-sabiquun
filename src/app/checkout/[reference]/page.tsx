import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Check, ChevronLeft, CircleCheck, FileCheck2, LockKeyhole, ScanSearch } from "lucide-react";
import { Brand } from "@/components/brand";
import { isCustomerAccount } from "@/lib/auth";
import { formatCents } from "@/lib/orders";
import { createClient, getCurrentUser, getProfile } from "@/lib/supabase/server";
import { CheckoutButton } from "./checkout-button";
import styles from "./checkout.module.css";

interface CheckoutOrder {
  id: string;
  reference: string;
  service_type: string;
  quantity: number;
  participant_names: string[];
  dedication: string | null;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  currency: string;
  payment_status: string;
  payment_provider: string;
  offering_title: string;
  offering_detail: string;
}

export default async function CheckoutPage({ params }: PageProps<"/checkout/[reference]">) {
  const { reference } = await params;
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) redirect(`/login?next=/checkout/${encodeURIComponent(reference)}`);
  const profile = await getProfile(supabase, user.id);
  if (!await isCustomerAccount(supabase, user, profile)) redirect("/");

  const { data, error } = await supabase
    .from("customer_orders")
    .select("id, reference, service_type, quantity, participant_names, dedication, customer_name, customer_phone, total_amount, currency, payment_status, payment_provider, offering_title, offering_detail")
    .eq("reference", reference)
    .maybeSingle();
  if (error) throw new Error("Checkout could not be loaded.");
  if (!data) notFound();
  const order = data as unknown as CheckoutOrder;
  const provider = order.payment_provider === "airwallex" ? "airwallex" : "hitpay";
  const paid = ["paid", "partially_refunded"].includes(order.payment_status);
  const refunded = order.payment_status === "refunded";
  const providerName = provider === "airwallex" ? "Airwallex" : "HitPay";

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Brand />
        <div className={styles.headerMeta}>
          <LockKeyhole aria-hidden="true" />
          <span>Secure checkout</span>
          <small>{order.reference}</small>
        </div>
      </header>

      <div className={styles.frame}>
        <Link href={`/dashboard/orders/${order.reference}`} className={styles.back}><ChevronLeft aria-hidden="true" /> Back to project</Link>

        <section className={styles.introduction}>
          <h1>Review the service.<br />Then hand it over securely.</h1>
          <p>Everything stays attached to order <strong>{order.reference}</strong>, from payment through to the reviewed completion record.</p>
        </section>

        <ol className={styles.handoff} aria-label="Checkout progress">
          <li className={styles.complete}><span><Check aria-hidden="true" /></span><div><strong>Service chosen</strong><small>Your request is recorded</small></div></li>
          <li className={styles.current} aria-current="step"><span>2</span><div><strong>Secure payment</strong><small>Review and continue</small></div></li>
          <li><span>3</span><div><strong>Track completion</strong><small>Follow every update</small></div></li>
        </ol>

        <div className={styles.checkoutGrid}>
          <section className={styles.record} aria-labelledby="order-review-heading">
            <header className={styles.recordHeader}>
              <div>
                <span className={styles.serviceType}>{order.service_type}</span>
                <h2 id="order-review-heading">{order.offering_title || "Islamic service"}</h2>
              </div>
              <div className={styles.recordAmount}><span>Order total</span><strong>{formatCents(order.total_amount)}</strong><small>{order.currency || "SGD"}</small></div>
            </header>

            <p className={styles.serviceDescription}>{order.offering_detail}</p>

            <dl className={styles.details}>
              <div><dt>Quantity</dt><dd>{order.quantity}</dd></div>
              {order.participant_names.length > 0 && <div className={styles.wideFact}><dt>Participant names</dt><dd>{order.participant_names.join(", ")}</dd></div>}
              {order.dedication && <div className={styles.wideFact}><dt>Dedication</dt><dd>{order.dedication}</dd></div>}
              <div><dt>Customer</dt><dd>{order.customer_name}</dd></div>
              <div><dt>Email</dt><dd>{user.email}</dd></div>
              <div><dt>Phone</dt><dd>{order.customer_phone}</dd></div>
            </dl>

            <footer className={styles.recordFooter}>
              <FileCheck2 aria-hidden="true" />
              <p><strong>Your details stay with this project.</strong><span>You’ll see this same record in your customer portal after payment.</span></p>
            </footer>
          </section>

          <aside className={styles.paymentPanel} aria-labelledby="payment-heading">
            <div className={styles.panelTopline}>
              <p className={styles.arabic} lang="ar" dir="rtl">بِسْمِ اللهِ</p>
              <span><LockKeyhole aria-hidden="true" /> Payment handled by {providerName}</span>
            </div>
            <div className={styles.amountDue}>
              <span id="payment-heading">Amount due</span>
              <strong>{formatCents(order.total_amount)}</strong>
              <small>{order.currency || "SGD"}</small>
            </div>

            <div className={styles.readiness}>
              <CircleCheck aria-hidden="true" />
              <span><strong>Signed in as {order.customer_name}</strong><small>{user.email}</small></span>
            </div>

            {paid ? (
              <div className={styles.paidState}><Check aria-hidden="true" /><div><strong>Payment confirmed</strong><p>Your project is ready for our team.</p><Link href={`/dashboard/orders/${order.reference}`}>View project</Link></div></div>
            ) : refunded ? (
              <div className={styles.terminalState}><div><strong>Payment refunded</strong><p>This order remains in your project history.</p><Link href="/services">Browse services</Link></div></div>
            ) : <CheckoutButton orderId={order.id} provider={provider} />}
          </aside>
        </div>

        <section className={styles.afterPayment} aria-labelledby="after-payment-heading">
          <div>
            <ScanSearch aria-hidden="true" />
            <h2 id="after-payment-heading">Payment is the handoff—not the end.</h2>
          </div>
          <ol>
            <li><span>1</span><p><strong>Return here automatically.</strong> Your payment status updates against this order.</p></li>
            <li><span>2</span><p><strong>Track the work.</strong> Follow the project from your customer portal.</p></li>
            <li><span>3</span><p><strong>Keep the reviewed record.</strong> Receive the completion report after verification.</p></li>
          </ol>
        </section>
      </div>
    </main>
  );
}
