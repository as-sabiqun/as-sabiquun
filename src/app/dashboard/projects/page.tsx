import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { customerOrderStatus, formatCents, orderTitle, type OrderRow } from "@/lib/orders";
import type { DeliveryStatus, FulfilmentStatus, PaymentStatus, SettlementStatus } from "@/lib/order-lifecycle";
import styles from "../dashboard.module.css";

interface ProjectRow extends OrderRow {
  payment_status: PaymentStatus;
  fulfilment_status: FulfilmentStatus;
  delivery_status: DeliveryStatus;
  settlement_status: SettlementStatus;
}

export default async function CustomerProjectsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_orders")
    .select("id, reference, service_type, category_slug, quantity, participant_names, dedication, total_amount, payment_status, fulfilment_status, delivery_status, settlement_status, status, created_at, offering_title")
    .order("created_at", { ascending: false });
  if (error) throw new Error("Project history could not be loaded.");
  const projects = (data ?? []) as unknown as ProjectRow[];

  return (
    <div className={styles.subpage}>
      <header className={styles.subpageHeader}>
        <div><p>Project history</p><h1>Every service you have supported.</h1></div>
        <Link href="/services" className={styles.primaryAction}>Support another service <ArrowUpRight aria-hidden="true" /></Link>
      </header>

      {projects.length === 0 ? (
        <div className={styles.emptyBoard}>
          <span className={styles.emptyMotif} aria-hidden="true">✦</span>
          <h2>No projects yet.</h2>
          <p>Your paid and pending service requests will remain available here.</p>
          <Link href="/services" className={styles.secondaryAction}>Browse services</Link>
        </div>
      ) : (
        <div className={styles.projectHistory}>
          {projects.map((project) => (
            <Link key={project.id} href={`/dashboard/orders/${project.reference}`} className={styles.projectHistoryRow}>
              <div><span>{project.service_type}</span><strong>{orderTitle(project)}</strong><small>{project.reference}</small></div>
              <div><small>Placed</small><strong>{new Date(project.created_at).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}</strong></div>
              <div><small>Payment</small><strong className={styles.capitalize}>{project.payment_status.replaceAll("_", " ")}</strong></div>
              <div><small>Current stage</small><strong>{customerOrderStatus(project)}</strong></div>
              <div className={styles.projectAmount}><strong>{formatCents(project.total_amount)}</strong><ArrowUpRight aria-hidden="true" /></div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
