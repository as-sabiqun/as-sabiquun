import Link from "next/link";
import { ArrowUpRight, Check, Clock3, Plus, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { buildJourneySeries, boardKeyForFulfilment, customerBoardColumns, customerStepIndex, isImpactOrder, type CustomerBoardKey } from "@/lib/customer-dashboard";
import { type DeliveryStatus, type FulfilmentStatus, type PaymentStatus, type SettlementStatus } from "@/lib/order-lifecycle";
import { customerOrderStatus, formatCents, orderTitle, type OrderRow } from "@/lib/orders";
import { createClient, getProfile } from "@/lib/supabase/server";
import { ImpactChart } from "./impact-chart";
import styles from "./dashboard.module.css";

interface CustomerOrderRow extends OrderRow {
  payment_status: PaymentStatus;
  fulfilment_status: FulfilmentStatus;
  delivery_status: DeliveryStatus;
  settlement_status: SettlementStatus;
  admin_verified_at: string | null;
  completed_at: string | null;
  project_country: string | null;
  payment_confirmed_at: string | null;
  is_test: boolean;
}

const categoryLabels: Record<string, string> = {
  korban: "Korban",
  water: "Clean water",
  quran: "Quran",
  orphans: "Orphan care",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login?next=/dashboard");

  const [profile, orderResult] = await Promise.all([
    getProfile(supabase, userData.user.id),
    supabase
      .from("customer_orders")
      .select("id, reference, service_type, category_slug, quantity, participant_names, dedication, total_amount, payment_status, fulfilment_status, delivery_status, settlement_status, status, created_at, admin_verified_at, completed_at, project_country, offering_title, payment_confirmed_at, is_test")
      .order("created_at", { ascending: false }),
  ]);
  if (orderResult.error) throw new Error("Customer projects could not be loaded.");

  const rows = (orderResult.data ?? []) as unknown as CustomerOrderRow[];
  const visibleRows = rows.filter((order) => ["pending", "paid", "partially_refunded"].includes(order.payment_status) && order.fulfilment_status !== "cancelled");
  const impactRows = rows.filter(isImpactOrder);
  const board: Record<CustomerBoardKey, CustomerOrderRow[]> = { waiting: [], active: [], review: [], completed: [] };
  visibleRows.forEach((order) => {
    const key = order.delivery_status === "delivered" ? "completed" : boardKeyForFulfilment(order.fulfilment_status);
    if (key) board[key].push(order);
  });

  const verifiedCount = impactRows.filter((order) => order.fulfilment_status === "verified").length;
  const completedCount = impactRows.filter((order) => order.delivery_status === "delivered").length;
  const inMotionCount = board.active.length + board.review.length;
  const countries = new Set(impactRows.map((order) => order.project_country).filter(Boolean));
  const committedValue = impactRows.reduce((sum, order) => sum + order.total_amount, 0);
  const completionPercent = impactRows.length === 0 ? 0 : Math.round((completedCount / impactRows.length) * 100);
  const firstName = (profile?.display_name || userData.user.email?.split("@")[0] || "there").split(" ")[0];
  const journey = buildJourneySeries(impactRows, new Date(), 8);
  const categoryCounts = Object.entries(categoryLabels)
    .map(([key, label]) => ({ key, label, count: impactRows.filter((order) => order.category_slug === key).length }))
    .filter((item) => item.count > 0);

  return (
    <div className={styles.dashboardPage}>
      <header className={styles.pageIntro}>
        <div>
          <p className={styles.salam}>Assalamu alaikum, {firstName}</p>
          <h1>Every contribution, one clear journey.</h1>
          <p>See what you have supported, where each service is now, and when its fulfilment has been verified.</p>
        </div>
        <Link href="/services" className={styles.primaryAction}>
          <Plus aria-hidden="true" /> Support another service
        </Link>
      </header>

      <section id="journey" className={styles.impactGrid} aria-labelledby="journey-heading">
        <article className={styles.journeyCard}>
          <header className={styles.journeyHeader}>
            <div>
              <p className={styles.arabicEyebrow} lang="ar" dir="rtl">رِحْلَةُ الْعَطَاءِ</p>
              <h2 id="journey-heading">Your giving journey</h2>
              <p>Services supported and fulfilments verified through As-Sābiqūn.</p>
            </div>
            <div className={styles.chartLegend} aria-label="Chart legend">
              <span><i className={styles.legendStarted} /> Services started</span>
              <span><i className={styles.legendVerified} /> Verified</span>
            </div>
          </header>

          <ImpactChart points={journey} />

          <div className={styles.journeyLedger}>
            <div><span>Services supported</span><strong>{impactRows.length}</strong></div>
            <div><span>Verified fulfilments</span><strong>{verifiedCount}</strong></div>
            <div><span>Currently in motion</span><strong>{inMotionCount}</strong></div>
            <div><span>Service value coordinated</span><strong>{formatCents(committedValue)}</strong></div>
          </div>
        </article>

        <aside className={styles.impactLedger} aria-label="Impact summary">
          <div className={styles.ledgerHeading}>
            <span><Sparkles aria-hidden="true" /> Impact ledger</span>
            <small>Updated live</small>
          </div>
          <div className={styles.completionRing}>
            <div>
              <strong>{completionPercent}%</strong>
              <span>fulfilled</span>
            </div>
          </div>
          <p className={styles.ledgerNote}>This reflects services coordinated through As-Sābiqūn. The true reward of every sincere deed is known by Allah.</p>
          <dl className={styles.ledgerFacts}>
            <div><dt><Check aria-hidden="true" /> Completed</dt><dd>{completedCount}</dd></div>
            <div><dt><Clock3 aria-hidden="true" /> In progress</dt><dd>{inMotionCount}</dd></div>
            <div><dt>Countries reached</dt><dd>{countries.size}</dd></div>
          </dl>
          <div className={styles.categoryList}>
            {categoryCounts.length === 0 ? (
              <p>Your supported causes will collect here.</p>
            ) : categoryCounts.map((category) => (
              <div key={category.key}><span>{category.label}</span><strong>{category.count}</strong></div>
            ))}
          </div>
        </aside>
      </section>

      <section id="orders" className={styles.ordersSection} aria-labelledby="orders-heading">
        <div className={styles.sectionHeading}>
          <div>
            <p>Fulfilment board</p>
            <h2 id="orders-heading">Your services, from request to completion</h2>
          </div>
          <span className={styles.automaticLabel}><i /> Updates automatically</span>
        </div>

        {visibleRows.length === 0 ? (
          <div className={styles.emptyBoard}>
            <span className={styles.emptyMotif} aria-hidden="true">✦</span>
            <h3>Your first service will appear here.</h3>
            <p>Choose a Korban or Wakaf service and follow every step from this board.</p>
            <Link href="/services" className={styles.secondaryAction}>Browse services <ArrowUpRight aria-hidden="true" /></Link>
          </div>
        ) : (
          <div className={styles.board}>
            {customerBoardColumns.map((column) => (
              <div key={column.key} className={styles.boardColumn}>
                <header>
                  <div><span className={`${styles.columnDot} ${styles[`columnDot${column.key}`]}`} /><strong>{column.label}</strong></div>
                  <span className={styles.columnCount}>{board[column.key].length}</span>
                  <p>{column.description}</p>
                </header>
                <div className={styles.boardCards}>
                  {board[column.key].length === 0 ? (
                    <p className={styles.emptyColumn}>Nothing here right now</p>
                  ) : board[column.key].map((order) => (
                    <Link key={order.id} href={`/dashboard/orders/${order.reference}`} className={styles.orderCard}>
                      <div className={styles.orderCardTop}>
                        <span>{order.service_type}</span>
                        <ArrowUpRight aria-hidden="true" />
                      </div>
                      <strong>{orderTitle(order)}</strong>
                      <small>{order.reference} · {new Date(order.created_at).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}</small>
                      <div className={styles.orderStatus}>{customerOrderStatus(order)}</div>
                      <div className={styles.orderCardFooter}>
                        <div className={styles.miniProgress} aria-label={`Step ${customerStepIndex(order.fulfilment_status, order.delivery_status) + 1} of 4`}>
                          {[0, 1, 2, 3].map((step) => <i key={step} className={step <= customerStepIndex(order.fulfilment_status, order.delivery_status) ? styles.progressDone : ""} />)}
                        </div>
                        <span>{formatCents(order.total_amount)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {rows.length > visibleRows.length && (
          <p className={styles.archiveNote}>{rows.length - visibleRows.length} historical order{rows.length - visibleRows.length === 1 ? " is" : "s are"} kept in Projects.</p>
        )}
      </section>
    </div>
  );
}
