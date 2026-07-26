import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Clock3, Plus, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { buildJourneySeries, boardKeyForStatus, customerBoardColumns, type CustomerBoardKey } from "@/lib/customer-dashboard";
import { currentStepIndex, formatCents, orderStatusCopy, orderTitle, type OrderRow } from "@/lib/orders";
import { createClient, getProfile } from "@/lib/supabase/server";
import { ImpactChart } from "./impact-chart";
import styles from "./dashboard.module.css";

interface CustomerOrderRow extends OrderRow {
  payment_status: "pending" | "paid" | "failed";
  admin_verified_at: string | null;
  completed_at: string | null;
  project_country: string | null;
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
      .from("orders")
      .select("id, reference, service_type, category_slug, quantity, participant_names, dedication, total_amount, payment_status, status, created_at, admin_verified_at, completed_at, project_country, offerings(title)")
      .eq("customer_id", userData.user.id)
      .order("created_at", { ascending: false }),
  ]);

  const rows = (orderResult.data ?? []) as unknown as CustomerOrderRow[];
  const visibleRows = rows.filter((order) => order.status !== "cancelled");
  const board: Record<CustomerBoardKey, CustomerOrderRow[]> = { waiting: [], active: [], review: [], completed: [] };
  visibleRows.forEach((order) => {
    const key = boardKeyForStatus(order.status);
    if (key) board[key].push(order);
  });

  const verifiedCount = visibleRows.filter((order) => ["verified", "completed", "closed"].includes(order.status)).length;
  const completedCount = visibleRows.filter((order) => ["completed", "closed"].includes(order.status)).length;
  const inMotionCount = board.active.length + board.review.length;
  const countries = new Set(visibleRows.map((order) => order.project_country).filter(Boolean));
  const committedValue = visibleRows.reduce((sum, order) => sum + order.total_amount, 0);
  const completionPercent = visibleRows.length === 0 ? 0 : Math.round((completedCount / visibleRows.length) * 100);
  const completionDegrees = Math.max(10, Math.round((completionPercent / 100) * 360));
  const firstName = (profile?.display_name || userData.user.email?.split("@")[0] || "there").split(" ")[0];
  const journey = buildJourneySeries(rows, new Date(), 8);
  const categoryCounts = Object.entries(categoryLabels)
    .map(([key, label]) => ({ key, label, count: visibleRows.filter((order) => order.category_slug === key).length }))
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
            <div><span>Services supported</span><strong>{visibleRows.length}</strong></div>
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
          <div className={styles.completionRing} style={{ "--completion": `${completionDegrees}deg` } as CSSProperties}>
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
                      <div className={styles.orderStatus}>{orderStatusCopy[order.status]}</div>
                      <div className={styles.orderCardFooter}>
                        <div className={styles.miniProgress} aria-label={`Step ${currentStepIndex(order.status) + 1} of 4`}>
                          {[0, 1, 2, 3].map((step) => <i key={step} className={step <= currentStepIndex(order.status) ? styles.progressDone : ""} />)}
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
          <p className={styles.archiveNote}>{rows.length - visibleRows.length} cancelled order{rows.length - visibleRows.length === 1 ? " is" : "s are"} kept in your account history.</p>
        )}
      </section>
    </div>
  );
}
