import { formatCents } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";

function Health({ label, configured, help }: { label: string; configured: boolean; help: string }) {
  return (
    <div className="vendor-report-item">
      <div className="vendor-report-item-head"><strong>{label}</strong><span className={`vendor-status ${configured ? "vendor-status-accepted" : "vendor-status-rejected"}`}>{configured ? "Ready" : "Setup needed"}</span></div>
      <p>{help}</p>
    </div>
  );
}

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const [{ data: offerings, error: offeringsError }, { data: settings, error: settingsError }, { data: deliveryFailures, error: deliveryError }, { data: paymentFailures, error: paymentError }, { count: overdueQueue, error: queueError }, { data: integrationFailures, error: integrationError }, { data: cronHealth, error: cronError }] = await Promise.all([
    supabase.from("offerings").select("id, title, slug, category_slug, unit_amount, min_amount, active, sort_order").order("sort_order"),
    supabase.from("platform_settings").select("commission_rate, default_claim_window_hours, updated_at").eq("id", true).maybeSingle(),
    supabase.from("notification_deliveries").select("id, channel, status, error_code, error_message, updated_at, orders(reference)").in("status", ["deferred", "bounced", "blocked", "failed"]).order("updated_at", { ascending: false }).limit(10),
    supabase.from("payment_transactions").select("id, transaction_type, status, updated_at, orders(reference)").in("status", ["failed", "expired", "cancelled"]).order("updated_at", { ascending: false }).limit(10),
    supabase.from("notification_deliveries").select("id", { count: "exact", head: true }).eq("status", "queued").lt("next_retry_at", new Date().toISOString()),
    supabase.from("integration_failures").select("id, provider, failure_kind, detail, created_at").order("created_at", { ascending: false }).limit(12),
    supabase.rpc("production_cron_health"),
  ]);
  const cron = (cronHealth ?? {}) as { configured?: boolean; active?: boolean; recent_failures?: number; last_run_at?: string | null };

  const providers = [
    { label: "Supabase", configured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)), help: "Authentication, database, private storage, and server operations." },
    { label: "HitPay", configured: Boolean(process.env.HITPAY_API_KEY && process.env.HITPAY_WEBHOOK_SALT && process.env.HITPAY_ENV), help: "Hosted checkout and signed payment/refund webhooks." },
    { label: "Brevo", configured: Boolean(process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL && process.env.BREVO_SENDER_NAME && process.env.BREVO_WEBHOOK_SECRET), help: "Transactional completion email and delivery confirmation." },
    { label: "Telegram", configured: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_USERNAME && process.env.TELEGRAM_WEBHOOK_SECRET), help: "Customer account linking and report document delivery." },
    { label: "Notification processor", configured: Boolean(process.env.INTERNAL_CRON_SECRET && cron.configured && cron.active), help: `${overdueQueue ?? 0} queued attempt${overdueQueue === 1 ? "" : "s"} overdue · ${cron.recent_failures ?? 0} cron failure${cron.recent_failures === 1 ? "" : "s"} in 24 hours${cron.last_run_at ? ` · last run ${new Date(cron.last_run_at).toLocaleString()}` : ""}.` },
  ];

  const failures = [
    ...(deliveryFailures ?? []).map((failure) => ({
      id: `delivery-${failure.id}`,
      source: failure.channel === "email" ? "Brevo" : "Telegram",
      reference: (failure.orders as unknown as { reference?: string } | null)?.reference ?? "Unknown job",
      status: failure.status,
      detail: failure.error_message || failure.error_code || "Provider reported a delivery failure.",
      at: failure.updated_at,
    })),
    ...(paymentFailures ?? []).map((failure) => ({
      id: `payment-${failure.id}`,
      source: "HitPay",
      reference: (failure.orders as unknown as { reference?: string } | null)?.reference ?? "Unknown job",
      status: failure.status,
      detail: `${failure.transaction_type} transaction`,
      at: failure.updated_at,
    })),
    ...(integrationFailures ?? []).map((failure) => ({
      id: `integration-${failure.id}`,
      source: failure.provider,
      reference: "Webhook / worker",
      status: failure.failure_kind,
      detail: failure.detail,
      at: failure.created_at,
    })),
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12);

  return (
    <>
      <div className="vendor-page-head"><div><p className="vendor-eyebrow">System</p><h1 className="display vendor-page-title">Settings and system status</h1><p className="vendor-page-lead">Check connected services, business settings, and anything that needs fixing.</p></div></div>
      {(offeringsError || settingsError || deliveryError || paymentError || queueError || integrationError || cronError) && <p className="auth-error">Some health data could not be loaded. {(offeringsError || settingsError || deliveryError || paymentError || queueError || integrationError || cronError)?.message}</p>}

      <div className="vendor-split">
        <section className="card vendor-panel">
          <div className="vendor-panel-head"><h2 className="display text-lg">Connected services</h2></div>
          <div className="vendor-report-list">{providers.map((provider) => <Health key={provider.label} {...provider} />)}</div>
        </section>
        <section className="card vendor-panel">
          <div className="vendor-panel-head"><h2 className="display text-lg">Business settings</h2></div>
          <dl className="admin-contact-facts">
            <div><dt>Commission rate</dt><dd>{settings ? `${Number(settings.commission_rate) * 100}%` : "Not available"}</dd></div>
            <div><dt>Default offer window</dt><dd>{settings ? `${settings.default_claim_window_hours} hours` : "Not available"}</dd></div>
            <div><dt>Currency</dt><dd>SGD</dd></div>
            <div><dt>Last settings update</dt><dd>{settings?.updated_at ? new Date(settings.updated_at).toLocaleString() : "Not recorded"}</dd></div>
          </dl>
          <p className="admin-record-help">Changes remain database-controlled; this page intentionally does not expose raw state editors.</p>
        </section>
      </div>

      <section className="card vendor-panel">
        <div className="vendor-panel-head"><div><p className="vendor-eyebrow">Services</p><h2 className="display text-lg mt-1">Services and prices</h2></div></div>
        <div className="admin-payment-list">
          {(offerings ?? []).map((offering) => <div key={offering.id}><strong>{offering.title}</strong><span>{offering.category_slug} · {offering.slug}</span><small>{offering.unit_amount ? formatCents(offering.unit_amount) : offering.min_amount ? `From ${formatCents(offering.min_amount)}` : "Price missing"} · {offering.active ? "Active" : "Inactive"}</small></div>)}
        </div>
      </section>

      <section className="card vendor-panel">
        <div className="vendor-panel-head"><div><p className="vendor-eyebrow">Recent problems</p><h2 className="display text-lg mt-1">Service errors</h2></div></div>
        {failures.length === 0 ? <p className="vendor-empty">No recent service errors.</p> : <div className="vendor-report-list">{failures.map((failure) => <div key={failure.id} className="vendor-report-item"><div className="vendor-report-item-head"><strong>{failure.source} · {failure.reference}</strong><span className="vendor-status vendor-status-rejected">{failure.status}</span></div><p>{failure.detail}</p><small>{new Date(failure.at).toLocaleString()}</small></div>)}</div>}
      </section>
    </>
  );
}
