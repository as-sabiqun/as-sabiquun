import { redirect } from "next/navigation";
import { formatCents } from "@/lib/orders";
import { adminAccessLevel, getAal2AdminAtLeast } from "@/lib/auth";
import { adminAccessLabels, canManageAdminAccess } from "@/lib/admin-users";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, type AdminAccessLevel } from "@/lib/supabase/server";
import { inviteAdminAction, resendAdminInvitationAction, setAdminAccessLevelAction, setAdminStatusAction } from "./actions";

function Health({ label, configured, help }: { label: string; configured: boolean; help: string }) {
  return (
    <div className="vendor-report-item">
      <div className="vendor-report-item-head"><strong>{label}</strong><span className={`vendor-status ${configured ? "vendor-status-accepted" : "vendor-status-rejected"}`}>{configured ? "Ready" : "Setup needed"}</span></div>
      <p>{help}</p>
    </div>
  );
}

export default async function AdminSettingsPage({ searchParams }: { searchParams: Promise<{ admin_message?: string; admin_error?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const currentAdmin = await getAal2AdminAtLeast(supabase, "administrator");
  if (!currentAdmin) redirect("/admin");
  const currentLevel = adminAccessLevel(currentAdmin.profile);
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

  let administrators: {
    id: string;
    name: string;
    email: string;
    accessLevel: AdminAccessLevel;
    status: string;
    invited: boolean;
    mfa: boolean;
  }[] = [];

  const service = createAdminClient();
  const [{ data: adminProfiles }, { data: authUsers }] = await Promise.all([
    service.from("profiles").select("id, display_name, status, admin_owner, admin_access_level").eq("role", "admin").order("created_at"),
    service.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);
  const usersById = new Map((authUsers.users ?? []).map((user) => [user.id, user]));
  administrators = await Promise.all((adminProfiles ?? []).map(async (profile) => {
    const user = usersById.get(profile.id);
    const { data: factors } = await service.auth.admin.mfa.listFactors({ userId: profile.id });
    return {
      id: profile.id,
      name: profile.display_name,
      email: user?.email ?? "Email unavailable",
      accessLevel: (profile.admin_access_level ?? (profile.admin_owner ? "owner" : "administrator")) as AdminAccessLevel,
      status: profile.status,
      invited: !user?.last_sign_in_at,
      mfa: Boolean(factors?.factors.some((factor) => factor.status === "verified")),
    };
  }));

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

      <section className="card vendor-panel admin-users-panel">
          <div className="vendor-panel-head">
            <div><p className="vendor-eyebrow">Authority</p><h2 className="display text-lg mt-1">Team access</h2></div>
            <span className="vendor-status vendor-status-accepted">{administrators.length} team member{administrators.length === 1 ? "" : "s"}</span>
          </div>
          <p className="admin-record-help">Owners control the platform, administrators manage staff and operations, and operations staff handle daily work. Every invited member chooses a password and enrols MFA.</p>
          {params.admin_message && <p className="auth-message mt-4" role="status">{params.admin_message}</p>}
          {params.admin_error && <p className="auth-error mt-4" role="alert">{params.admin_error}</p>}

          <form action={inviteAdminAction} className="admin-form-grid mt-5">
            <label className="label">Full name
              <input className="input" name="name" required minLength={2} maxLength={100} autoComplete="name" />
            </label>
            <label className="label">Email
              <input className="input" name="email" type="email" required maxLength={254} autoComplete="email" />
            </label>
            <label className="label">Access level
              <select className="input" name="accessLevel" required defaultValue={currentLevel === "owner" ? "administrator" : "operations"}>
                {currentLevel === "owner" && <option value="owner">Owner</option>}
                {currentLevel === "owner" && <option value="administrator">Administrator</option>}
                <option value="operations">Operations Staff</option>
              </select>
            </label>
            <button className="btn admin-users-invite" type="submit">Send secure invitation</button>
          </form>

          <div className="admin-users-list mt-6">
            {administrators.map((administrator) => (
              <div className="admin-user-row" key={administrator.id}>
                <span className="vendor-sidebar-avatar" aria-hidden="true">{administrator.name.charAt(0)}</span>
                <div className="admin-user-identity"><strong>{administrator.name}</strong><small>{administrator.email}</small></div>
                <div className="admin-user-states">
                  <span className="vendor-status vendor-status-pending">{adminAccessLabels[administrator.accessLevel]}</span>
                  <span className={`vendor-status ${administrator.status === "active" ? "vendor-status-accepted" : "vendor-status-rejected"}`}>
                    {administrator.status === "active" ? administrator.invited ? "Invited" : "Active" : "Suspended"}
                  </span>
                  <span className={`vendor-status ${administrator.mfa ? "vendor-status-accepted" : "vendor-status-pending"}`}>{administrator.mfa ? "MFA ready" : "MFA pending"}</span>
                </div>
                {administrator.id !== currentAdmin.user.id && canManageAdminAccess(currentLevel, administrator.accessLevel) && (
                  <div className="admin-user-actions">
                    {administrator.invited && administrator.status === "active" && (
                      <form action={resendAdminInvitationAction}>
                        <input type="hidden" name="adminId" value={administrator.id} />
                        <button className="btn btn-secondary btn-small" type="submit">Resend setup</button>
                      </form>
                    )}
                    <form action={setAdminStatusAction}>
                      <input type="hidden" name="adminId" value={administrator.id} />
                      <input type="hidden" name="status" value={administrator.status === "active" ? "suspended" : "active"} />
                      <button className="btn btn-secondary btn-small" type="submit">{administrator.status === "active" ? "Suspend" : "Restore"}</button>
                    </form>
                    {currentLevel === "owner" && (
                      <form action={setAdminAccessLevelAction} className="admin-user-authority">
                        <input type="hidden" name="adminId" value={administrator.id} />
                        <select className="input" name="accessLevel" defaultValue={administrator.accessLevel} aria-label={`Authority for ${administrator.name}`}>
                          <option value="owner">Owner</option>
                          <option value="administrator">Administrator</option>
                          <option value="operations">Operations Staff</option>
                        </select>
                        <button className="btn btn-secondary btn-small" type="submit">Update role</button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
      </section>

      <section className="card vendor-panel">
        <div className="vendor-panel-head"><div><p className="vendor-eyebrow">Recent problems</p><h2 className="display text-lg mt-1">Service errors</h2></div></div>
        {failures.length === 0 ? <p className="vendor-empty">No recent service errors.</p> : <div className="vendor-report-list">{failures.map((failure) => <div key={failure.id} className="vendor-report-item"><div className="vendor-report-item-head"><strong>{failure.source} · {failure.reference}</strong><span className="vendor-status vendor-status-rejected">{failure.status}</span></div><p>{failure.detail}</p><small>{new Date(failure.at).toLocaleString()}</small></div>)}</div>}
      </section>
    </>
  );
}
