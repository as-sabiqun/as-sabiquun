import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient, getProfile } from "@/lib/supabase/server";
import { currentStepIndex, formatCents, orderStatusCopy, orderSteps, orderTitle, type OrderRow } from "@/lib/orders";

export default async function OrderDetailPage({ params }: PageProps<"/dashboard/orders/[reference]">) {
  const { reference } = await params;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect(`/login?next=/dashboard/orders/${reference}`);

  const profile = await getProfile(supabase, userData.user.id);
  if (profile?.role !== "customer" || profile.status !== "active") {
    redirect(profile?.status === "suspended" ? "/login?error=This account is suspended." : "/");
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, reference, service_type, category_slug, quantity, participant_names, dedication, customer_name, total_amount, status, created_at, offerings(title)")
    .eq("customer_id", userData.user.id)
    .eq("reference", reference)
    .maybeSingle();

  if (!order) notFound();
  const row = order as unknown as OrderRow & { customer_name: string };
  const stepIndex = currentStepIndex(row.status);
  const isStalled = row.status === "expired_unclaimed" || row.status === "cancelled";

  return (
    <section className="py-6 lg:py-8">
      <nav className="breadcrumb">
        <Link href="/dashboard">Dashboard</Link>
        <span aria-hidden="true">/</span>
        <span>{row.reference}</span>
      </nav>

      <div className="vendor-detail-layout mt-6">
        <div className="card vendor-panel">
          <div className="vendor-detail-head">
            <div>
              <span className="vendor-job-table-category">{row.service_type}</span>
              <h1 className="display vendor-page-title mt-2">{orderTitle(row)}</h1>
              <p className="vendor-page-lead">{row.reference} · Placed {new Date(row.created_at).toLocaleDateString("en-SG")}</p>
            </div>
          </div>

          {isStalled ? (
            <div className="auth-error mt-6">
              {row.status === "cancelled" ? "This order was cancelled." : "We are still finding a fulfilment partner for this order. Thanks for your patience."}
            </div>
          ) : (
            <div className="order-tracker mt-8">
              {orderSteps.map((step, index) => (
                <div key={step.key} className={`order-tracker-step ${index <= stepIndex ? "is-done" : ""} ${index === stepIndex ? "is-current" : ""}`}>
                  <span className="order-tracker-dot" />
                  <span className="order-tracker-label">{step.label}</span>
                </div>
              ))}
            </div>
          )}

          {row.participant_names?.length > 0 && (
            <div className="mt-8">
              <span className="label mb-2 block">Participant{row.participant_names.length > 1 ? "s" : ""}</span>
              <p className="text-sm text-[var(--muted)]">{row.participant_names.join(", ")}</p>
            </div>
          )}
          {row.dedication && (
            <div className="mt-6">
              <span className="label mb-2 block">Dedication</span>
              <p className="text-sm text-[var(--muted)]">{row.dedication}</p>
            </div>
          )}
        </div>

        <aside className="card vendor-panel vendor-buy-box">
          <span className="vendor-eyebrow">Current status</span>
          <strong className="display text-lg mt-2 block">{orderStatusCopy[row.status]}</strong>
          <dl className="admin-contact-facts mt-6">
            <div><dt>Service value</dt><dd>{formatCents(row.total_amount)}</dd></div>
            <div><dt>Placed by</dt><dd>{row.customer_name}</dd></div>
          </dl>
          <Link href="/dashboard/report" className="vendor-report-link">Something wrong? Report a concern</Link>
          <Link href="/dashboard" className="vendor-job-table-view mt-4 inline-block">Back to dashboard <span aria-hidden="true">→</span></Link>
        </aside>
      </div>
    </section>
  );
}
