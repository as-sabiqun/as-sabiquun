import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Check, CircleDollarSign, Download, ExternalLink, FileBadge2, ImageIcon, MapPin, MessageCircle, Video } from "lucide-react";
import { deriveOrderMilestone, isPaid, milestoneLabels, type DeliveryStatus, type FulfilmentStatus, type PaymentStatus, type SettlementStatus } from "@/lib/order-lifecycle";
import { formatCents, orderTitle, type OrderRow } from "@/lib/orders";
import { createClient, getCurrentUser, getProfile } from "@/lib/supabase/server";
import { isCustomerAccount } from "@/lib/auth";
import styles from "../../dashboard.module.css";

interface CustomerOrder extends OrderRow {
  customer_name: string;
  currency: string;
  payment_status: PaymentStatus;
  fulfilment_status: FulfilmentStatus;
  delivery_status: DeliveryStatus;
  settlement_status: SettlementStatus;
  accepted_at: string | null;
  proof_submitted_at: string | null;
  completed_at: string | null;
}

interface CompletionRecord {
  submission_id: string;
  version: number;
  project_country: string;
  project_state: string;
  project_village: string;
  project_address: string;
  project_lat: number;
  project_lng: number;
  project_maps_link: string | null;
  vendor_remarks: string;
  reviewed_at: string;
}

interface CustomerEvidence {
  proof_id: string;
  submission_id: string;
  category: string;
  evidence_slot: string;
  media_type: "photo" | "video";
  created_at: string;
}

const paymentLabels: Record<PaymentStatus, string> = {
  pending: "Awaiting payment",
  paid: "Paid",
  partially_refunded: "Partially refunded",
  refunded: "Refunded",
  failed: "Payment failed",
  expired: "Checkout expired",
  cancelled: "Cancelled",
};

const eventLabels: Record<string, string> = {
  "order.created": "Order received",
  "payment.paid": "Payment confirmed",
  "payment.partially_refunded": "Payment partially refunded",
  "payment.refunded": "Payment refunded",
  "payment.failed": "Payment attempt failed",
  "payment.expired": "Payment request expired",
  "payment.cancelled": "Payment cancelled",
  "fulfilment.ready": "Project received",
  "fulfilment.broadcasting": "Shared with approved vendors",
  "fulfilment.assigned": "Vendor assigned",
  "vendor.accepted": "Vendor accepted the project",
  "fulfilment.in_progress": "Project work started",
  "fulfilment.proof_submitted": "Completed work submitted",
  "fulfilment.revision_required": "Changes requested",
  "fulfilment.verified": "Project approved",
  "fulfilment.cancelled": "Project cancelled",
  "delivery.queued": "Completion report queued",
  "delivery.partial": "One report channel succeeded",
  "delivery.delivered": "Completion report delivered",
  "delivery.failed": "Report delivery needs attention",
};

function date(value: string | null | undefined, includeTime = false) {
  if (!value) return "Not yet";
  return new Date(value).toLocaleString("en-SG", includeTime
    ? { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }
    : { day: "numeric", month: "short", year: "numeric" });
}

function categoryLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function OrderDetailPage({ params, searchParams }: PageProps<"/dashboard/orders/[reference]">) {
  const { reference } = await params;
  const paymentQuery = (await searchParams).payment;
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) redirect(`/login?next=/dashboard/orders/${encodeURIComponent(reference)}`);

  const profile = await getProfile(supabase, user.id);
  if (!await isCustomerAccount(supabase, user, profile)) {
    redirect(profile?.status === "suspended" ? "/login?error=This account is suspended." : "/");
  }

  const { data: order, error: orderError } = await supabase
    .from("customer_orders")
    .select("id, reference, service_type, category_slug, quantity, participant_names, dedication, customer_name, total_amount, currency, payment_status, fulfilment_status, delivery_status, settlement_status, status, accepted_at, proof_submitted_at, completed_at, created_at, offering_title")
    .eq("reference", reference)
    .maybeSingle();
  if (orderError) throw new Error("Project details could not be loaded.");
  if (!order) notFound();
  const row = order as unknown as CustomerOrder;
  const [recordResult, reportResult, notificationResult, eventResult] = await Promise.all([
    supabase.from("customer_completion_records").select("submission_id, version, project_country, project_state, project_village, project_address, project_lat, project_lng, project_maps_link, vendor_remarks, reviewed_at").eq("order_id", row.id).order("version", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("customer_completion_report_metadata").select("id, generated_at, version").eq("order_id", row.id).order("version", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("customer_notification_deliveries").select("channel, status, sent_at, delivered_at, attempted_at").eq("order_id", row.id).order("attempt", { ascending: false }),
    supabase.from("customer_order_events").select("event_type, created_at").eq("order_id", row.id).order("created_at"),
  ]);
  if (recordResult.error || reportResult.error || notificationResult.error || eventResult.error) {
    throw new Error("The completion record could not be loaded.");
  }
  const record = recordResult.data as CompletionRecord | null;
  const { data: evidenceData, error: evidenceError } = record
    ? await supabase.from("customer_completion_evidence").select("proof_id, submission_id, category, evidence_slot, media_type, created_at").eq("submission_id", record.submission_id).order("evidence_slot")
    : { data: [], error: null };
  if (evidenceError) throw new Error("Completion evidence could not be loaded.");
  const evidence = (evidenceData ?? []) as CustomerEvidence[];
  const report = reportResult.data as { id: string; generated_at: string; version: number } | null;
  const notifications = (notificationResult.data ?? []) as Array<{ channel: "email" | "telegram"; status: string; sent_at: string | null; delivered_at: string | null; attempted_at: string | null }>;
  const events = (eventResult.data ?? []) as Array<{ event_type: string; created_at: string }>;
  const latestNotification = (channel: "email" | "telegram") => notifications.find((item) => item.channel === channel);
  const milestone = deriveOrderMilestone(row);
  const paid = isPaid(row.payment_status);
  const fulfilmentStarted = !["not_ready", "ready", "broadcasting"].includes(row.fulfilment_status);
  const verified = row.fulfilment_status === "verified";
  const delivered = row.delivery_status === "delivered";

  const journey = [
    { label: "Payment confirmed", done: paid },
    { label: "Work in progress", done: fulfilmentStarted },
    { label: "Work approved", done: verified },
    { label: "Report delivered", done: delivered },
  ];

  return (
    <div className={styles.detailPage}>
      <nav className="breadcrumb">
        <Link href="/dashboard/projects">Projects</Link><span aria-hidden="true">/</span><span>{row.reference}</span>
      </nav>

      <header className={styles.detailHero}>
        <div>
          <p>{row.service_type}</p>
          <h1>{orderTitle(row)}</h1>
          <span>{row.reference} · Ordered {date(row.created_at)}</span>
        </div>
        <strong className={styles.milestone}>{milestoneLabels[milestone]}</strong>
      </header>

      {typeof paymentQuery === "string" && paymentQuery === "processing" && !paid && (
        <p className={styles.notice} role="status">HitPay is still confirming your payment. This page will update automatically.</p>
      )}
      {["failed", "expired", "cancelled"].includes(row.payment_status) && (
        <p className={styles.alert}>Payment was not completed. Your order is safe and can be paid again.</p>
      )}

      <section className={styles.trail} aria-label="Project journey">
        {journey.map((step, index) => (
          <div key={step.label} className={step.done ? styles.trailDone : ""}>
            <span>{step.done ? <Check aria-hidden="true" /> : index + 1}</span><strong>{step.label}</strong>
          </div>
        ))}
      </section>

      <div className={styles.detailGrid}>
        <div className={styles.detailMain}>
          <section className={styles.detailPanel}>
            <header><div><p>Project record</p><h2>Order and payment</h2></div><CircleDollarSign aria-hidden="true" /></header>
            <dl className={styles.detailFacts}>
              <div><dt>Service</dt><dd>{orderTitle(row)}</dd></div>
              <div><dt>Quantity</dt><dd>{row.quantity}</dd></div>
              <div><dt>Amount</dt><dd>{formatCents(row.total_amount)} {row.currency}</dd></div>
              <div><dt>Payment</dt><dd>{paymentLabels[row.payment_status]}</dd></div>
              <div><dt>Customer</dt><dd>{row.customer_name}</dd></div>
              <div><dt>Order date</dt><dd>{date(row.created_at, true)}</dd></div>
            </dl>
            {!paid && row.payment_status !== "refunded" && <Link href={`/checkout/${row.reference}`} className={styles.primaryAction}>Continue to payment</Link>}
          </section>

          {(row.participant_names?.length > 0 || row.dedication) && (
            <section className={styles.detailPanel}>
              <header><div><p>Amanah details</p><h2>Names and dedication</h2></div><FileBadge2 aria-hidden="true" /></header>
              <dl className={styles.detailFacts}>
                {row.participant_names?.length > 0 && <div><dt>Participant names</dt><dd>{row.participant_names.join(", ")}</dd></div>}
                {row.dedication && <div><dt>Dedication</dt><dd>{row.dedication}</dd></div>}
              </dl>
            </section>
          )}

          {record && (
            <section className={styles.detailPanel}>
              <header><div><p>Approved completion</p><h2>Project location</h2></div><MapPin aria-hidden="true" /></header>
              <dl className={styles.detailFacts}>
                <div><dt>Country</dt><dd>{record.project_country}</dd></div>
                <div><dt>State / district</dt><dd>{record.project_state}</dd></div>
                <div><dt>Village / locality</dt><dd>{record.project_village}</dd></div>
                <div><dt>Exact location</dt><dd>{record.project_address}</dd></div>
                <div><dt>Coordinates</dt><dd>{record.project_lat}, {record.project_lng}</dd></div>
                <div><dt>Approved</dt><dd>{date(record.reviewed_at, true)}</dd></div>
              </dl>
              {record.project_maps_link && <a className={styles.secondaryAction} href={record.project_maps_link} target="_blank" rel="noreferrer">Open map <ExternalLink aria-hidden="true" /></a>}
            </section>
          )}

          {evidence.length > 0 && (
            <section id="evidence" className={styles.detailPanel}>
              <header><div><p>Approved evidence</p><h2>Completion media</h2></div><ImageIcon aria-hidden="true" /></header>
              <div className={styles.evidenceGrid}>
                {evidence.map((proof) => proof.media_type === "photo" ? (
                  <a key={proof.proof_id} href={`/api/proofs/${proof.proof_id}`} target="_blank" rel="noreferrer" className={styles.evidenceCard}>
                    <Image src={`/api/proofs/${proof.proof_id}`} width={360} height={240} unoptimized alt={`${categoryLabel(proof.category)} approved project evidence`} />
                    <span>{categoryLabel(proof.evidence_slot)}</span>
                  </a>
                ) : (
                  <a key={proof.proof_id} href={`/api/proofs/${proof.proof_id}`} target="_blank" rel="noreferrer" className={`${styles.evidenceCard} ${styles.videoCard}`}>
                    <Video aria-hidden="true" /><strong>{categoryLabel(proof.evidence_slot)}</strong><span>Open secure video</span>
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className={styles.detailAside}>
          <section className={styles.detailPanel}>
            <header><div><p>Documents</p><h2>Your completion record</h2></div><Download aria-hidden="true" /></header>
            {report ? (
              <div className={styles.documentList}>
                {paid && <Link href={`/receipts/${row.reference}`}><CircleDollarSign aria-hidden="true" /><span><strong>Payment receipt</strong><small>Confirmed payment · PDF</small></span><Download aria-hidden="true" /></Link>}
                <Link href={`/reports/${report.id}`}><FileBadge2 aria-hidden="true" /><span><strong>Completion report</strong><small>PDF · Version {report.version}</small></span><Download aria-hidden="true" /></Link>
                {verified && <Link href={`/nameplates/${row.id}`} target="_blank"><ImageIcon aria-hidden="true" /><span><strong>Certificate / nameplate</strong><small>Branded PNG</small></span><ExternalLink aria-hidden="true" /></Link>}
              </div>
            ) : paid ? (
              <div className={styles.documentList}><Link href={`/receipts/${row.reference}`}><CircleDollarSign aria-hidden="true" /><span><strong>Payment receipt</strong><small>Confirmed payment · PDF</small></span><Download aria-hidden="true" /></Link></div>
            ) : <p className={styles.emptyDetail}>Your report will appear after the completed work is approved.</p>}
          </section>

          <section className={styles.detailPanel}>
            <header><div><p>Delivery</p><h2>Email and Telegram</h2></div><MessageCircle aria-hidden="true" /></header>
            <dl className={styles.detailFacts}>
              {["email", "telegram"].map((channel) => {
                const item = latestNotification(channel as "email" | "telegram");
                return <div key={channel}><dt>{channel === "email" ? "Email" : "Telegram"}</dt><dd>{item ? categoryLabel(item.status) : "Not queued"}<small>{item ? date(item.delivered_at ?? item.sent_at ?? item.attempted_at, true) : ""}</small></dd></div>;
              })}
            </dl>
          </section>

          <section className={styles.detailPanel}>
            <header><div><p>Timeline</p><h2>Customer-safe updates</h2></div></header>
            <ol className={styles.eventTimeline}>
              {events.length ? events.map((event, index) => <li key={`${event.event_type}-${event.created_at}-${index}`}><i /><div><strong>{eventLabels[event.event_type] ?? "Project updated"}</strong><span>{date(event.created_at, true)}</span></div></li>) : <li><i /><div><strong>Order received</strong><span>{date(row.created_at, true)}</span></div></li>}
            </ol>
          </section>

          <Link href={`/dashboard/report?order=${encodeURIComponent(row.id)}`} className={styles.supportLink}>Report a concern about this project</Link>
        </aside>
      </div>
    </div>
  );
}
