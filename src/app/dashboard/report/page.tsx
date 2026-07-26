import Link from "next/link";
import { ArrowLeft, MessageSquareWarning, Phone } from "lucide-react";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { orderTitle, type OrderRow } from "@/lib/orders";
import { ReportForm, type ReportOrderOption } from "./report-form";
import styles from "../dashboard.module.css";

interface CustomerReportRow {
  id: string;
  subject: string;
  status: "open" | "resolved";
  created_at: string;
  resolved_at: string | null;
  resolution_notes: string | null;
}

export default async function CustomerReportPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order: requestedOrderId } = await searchParams;
  const supabase = await createClient();
  const userId = (await getCurrentUser(supabase))?.id ?? "";
  const [{ data: orders, error: ordersError }, { data: reports, error: reportsError }] = await Promise.all([
    supabase
      .from("customer_orders")
      .select("id, reference, service_type, category_slug, quantity, participant_names, dedication, total_amount, status, created_at, offering_title")
      .order("created_at", { ascending: false }),
    supabase
      .from("customer_reports")
      .select("id, subject, status, created_at, resolved_at, resolution_notes")
      .eq("customer_id", userId)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);
  if (ordersError || reportsError) throw new Error("Support history could not be loaded.");

  const orderOptions: ReportOrderOption[] = ((orders ?? []) as unknown as OrderRow[]).map((order) => ({
    id: order.id,
    reference: order.reference,
    title: orderTitle(order),
  }));
  const reportRows = (reports ?? []) as CustomerReportRow[];

  return (
    <div className={styles.reportPage}>
      <Link href="/dashboard" className={styles.backLink}><ArrowLeft aria-hidden="true" /> Back to dashboard</Link>
      <header className={styles.reportHero}>
        <div>
          <span className={styles.reportIcon}><MessageSquareWarning aria-hidden="true" /></span>
          <p>Customer support</p>
          <h1>Tell us what needs attention.</h1>
          <p>Reports reach the As-Sābiqūn admin team with your account and selected order attached.</p>
        </div>
        <a href="tel:+6589933786" className={styles.supportPhone}><Phone aria-hidden="true" /><span><small>Need urgent help?</small>+65 8993 3786</span></a>
      </header>

      <div className={styles.reportLayout}>
        <section className={styles.reportPanel} aria-labelledby="new-report-heading">
          <div className={styles.reportPanelHeading}>
            <p>New report</p>
            <h2 id="new-report-heading">What can we help with?</h2>
          </div>
          <ReportForm orders={orderOptions} selectedOrderId={orderOptions.some((order) => order.id === requestedOrderId) ? requestedOrderId : undefined} />
        </section>

        <aside className={styles.reportHistory}>
          <div className={styles.reportPanelHeading}>
            <p>Your reports</p>
            <h2>Recent support activity</h2>
          </div>
          {reportRows.length === 0 ? (
            <div className={styles.reportHistoryEmpty}>You have no previous reports.</div>
          ) : (
            <div className={styles.reportHistoryList}>
              {reportRows.map((report) => (
                <div key={report.id}>
                  <span className={report.status === "resolved" ? styles.reportResolved : styles.reportOpen}>{report.status}</span>
                  <strong>{report.subject}</strong>
                  <small>{new Date(report.created_at).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}</small>
                  {report.resolution_notes && (
                    <p className={styles.reportResolution}>
                      <strong>Resolution</strong>
                      {report.resolution_notes}
                      {report.resolved_at && <small>Resolved {new Date(report.resolved_at).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}</small>}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
