import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Check, ChevronLeft, CircleCheck, MessageCircle } from "lucide-react";
import { Brand } from "@/components/brand";
import { isCustomerAccount } from "@/lib/auth";
import { formatCents } from "@/lib/orders";
import { createClient, getCurrentUser, getProfile, type Profile } from "@/lib/supabase/server";
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
  offering_title: string;
  offering_detail: string;
}

export default async function CheckoutPage({ params }: PageProps<"/checkout/[reference]">) {
  const { reference } = await params;
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) redirect(`/login?next=/checkout/${encodeURIComponent(reference)}`);
  const profile = await getProfile(supabase, user.id) as (Profile & { telegram_linked_at?: string | null }) | null;
  if (!await isCustomerAccount(supabase, user, profile)) redirect("/");

  const { data, error } = await supabase
    .from("customer_orders")
    .select("id, reference, service_type, quantity, participant_names, dedication, customer_name, customer_phone, total_amount, currency, payment_status, offering_title, offering_detail")
    .eq("reference", reference)
    .maybeSingle();
  if (error) throw new Error("Checkout could not be loaded.");
  if (!data) notFound();
  const order = data as unknown as CheckoutOrder;
  const paid = ["paid", "partially_refunded"].includes(order.payment_status);
  const refunded = order.payment_status === "refunded";
  const telegramLinked = Boolean(profile?.telegram_linked_at);

  return (
    <main className={styles.page}>
      <header className={styles.header}><Brand /><span>Secure checkout</span></header>
      <div className={styles.shell}>
        <section className={styles.summary}>
          <Link href={`/dashboard/orders/${order.reference}`} className={styles.back}><ChevronLeft aria-hidden="true" /> Back to project</Link>
          <p className={styles.eyebrow}>Order {order.reference}</p>
          <h1>Review your service.</h1>
          <p className={styles.lead}>Your commercial details are fixed before you leave for secure payment.</p>

          <div className={styles.serviceBlock}>
            <div><span>{order.service_type}</span><h2>{order.offering_title || "Islamic service"}</h2><p>{order.offering_detail}</p></div>
            <strong>{formatCents(order.total_amount)}</strong>
          </div>

          <dl className={styles.details}>
            <div><dt>Quantity</dt><dd>{order.quantity}</dd></div>
            {order.participant_names.length > 0 && <div><dt>Participant names</dt><dd>{order.participant_names.join(", ")}</dd></div>}
            {order.dedication && <div><dt>Dedication</dt><dd>{order.dedication}</dd></div>}
            <div><dt>Customer</dt><dd>{order.customer_name}</dd></div>
            <div><dt>Email</dt><dd>{user.email}</dd></div>
            <div><dt>Phone</dt><dd>{order.customer_phone}</dd></div>
          </dl>
        </section>

        <aside className={styles.paymentPanel}>
          <p className={styles.arabic} lang="ar" dir="rtl">بِسْمِ اللهِ</p>
          <span className={styles.panelLabel}>Amount due</span>
          <strong className={styles.total}>{formatCents(order.total_amount)}</strong>
          <small>{order.currency || "SGD"}</small>

          <div className={styles.readiness}>
            <div><CircleCheck aria-hidden="true" /><span><strong>Customer account verified</strong><small>{user.email}</small></span></div>
            <div className={telegramLinked ? "" : styles.missing}><MessageCircle aria-hidden="true" /><span><strong>Telegram {telegramLinked ? "connected" : "required"}</strong><small>{telegramLinked ? "Ready for report delivery" : "Connect before payment"}</small></span></div>
          </div>

          {paid ? (
            <div className={styles.paidState}><Check aria-hidden="true" /><div><strong>Payment confirmed</strong><p>Your project is ready for our team.</p><Link href={`/dashboard/orders/${order.reference}`}>View project</Link></div></div>
          ) : refunded ? (
            <div className={styles.terminalState}><div><strong>Payment refunded</strong><p>This order is retained in your project history. Start a new service if you would like to proceed again.</p><Link href="/services">Browse services</Link></div></div>
          ) : telegramLinked ? (
            <CheckoutButton orderId={order.id} />
          ) : (
            <Link href={`/dashboard/account?next=${encodeURIComponent(`/checkout/${order.reference}`)}`} className={styles.connectButton}>Connect Telegram to continue</Link>
          )}

          <ol className={styles.nextSteps}>
            <li><span>1</span><p><strong>Pay securely</strong> on HitPay’s hosted checkout.</p></li>
            <li><span>2</span><p><strong>Track the work</strong> from your customer portal.</p></li>
            <li><span>3</span><p><strong>Receive your report</strong> by email and Telegram after verification.</p></li>
          </ol>
        </aside>
      </div>
    </main>
  );
}
