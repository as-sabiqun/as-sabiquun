import { redirect } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  KeyRound,
  Plus,
  Settings2,
  ShieldCheck,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { adminAccessLevel, getAal2AdminAtLeast } from "@/lib/auth";
import { adminAccessLabels, canManageAdminAccess, canRemoveAdminUser } from "@/lib/admin-users";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, type AdminAccessLevel } from "@/lib/supabase/server";
import {
  createAdminAccountAction,
  removeAdminAction,
  setAdminAccessLevelAction,
  setAdminPasswordAction,
  setAdminStatusAction,
} from "./actions";
import styles from "../admin-account.module.css";

export default async function AdminSettingsPage({ searchParams }: { searchParams: Promise<{ admin_message?: string; admin_error?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const currentAdmin = await getAal2AdminAtLeast(supabase, "administrator");
  if (!currentAdmin) redirect("/admin");
  const currentLevel = adminAccessLevel(currentAdmin.profile);
  const [{ data: settings, error: settingsError }, { data: deliveryFailures, error: deliveryError }, { data: paymentFailures, error: paymentError }, { count: overdueQueue, error: queueError }, { data: integrationFailures, error: integrationError }, { data: cronHealth, error: cronError }] = await Promise.all([
    supabase.from("platform_settings").select("commission_rate, default_claim_window_hours, updated_at").eq("id", true).maybeSingle(),
    supabase.from("notification_deliveries").select("id, channel, status, error_code, error_message, updated_at, orders(reference)").in("status", ["deferred", "bounced", "blocked", "failed"]).order("updated_at", { ascending: false }).limit(10),
    supabase.from("payment_transactions").select("id, transaction_type, status, updated_at, orders(reference)").in("status", ["failed", "expired", "cancelled"]).order("updated_at", { ascending: false }).limit(10),
    supabase.from("notification_deliveries").select("id", { count: "exact", head: true }).eq("status", "queued").lt("next_retry_at", new Date().toISOString()),
    supabase.from("integration_failures").select("id, provider, failure_kind, detail, created_at").order("created_at", { ascending: false }).limit(12),
    supabase.rpc("production_cron_health"),
  ]);
  const cron = (cronHealth ?? {}) as { configured?: boolean; active?: boolean; recent_failures?: number; last_run_at?: string | null };

  const providers = [
    { label: "Supabase", available: true, configured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)), help: "Authentication, database, private storage, and server operations." },
    { label: "HitPay", available: true, configured: Boolean(process.env.HITPAY_API_KEY && process.env.HITPAY_WEBHOOK_SALT && process.env.HITPAY_ENV), help: "Hosted checkout and signed payment/refund webhooks." },
    { label: "Resend", available: true, configured: Boolean(process.env.RESEND_API_KEY), help: "Administrator account login emails." },
    { label: "Brevo", available: true, configured: Boolean(process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL && process.env.BREVO_SENDER_NAME && process.env.BREVO_WEBHOOK_SECRET), help: "Transactional completion email and delivery confirmation." },
    { label: "Telegram", available: true, configured: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_USERNAME && process.env.TELEGRAM_WEBHOOK_SECRET), help: "Customer account linking and report document delivery." },
    { label: "Notification processor", available: !queueError && !cronError, configured: Boolean(!queueError && !cronError && process.env.INTERNAL_CRON_SECRET && cron.configured && cron.active), help: queueError || cronError ? "Queue and scheduled-processor status could not be read." : `${overdueQueue ?? 0} queued attempt${overdueQueue === 1 ? "" : "s"} overdue · ${cron.recent_failures ?? 0} cron failure${cron.recent_failures === 1 ? "" : "s"} in 24 hours${cron.last_run_at ? ` · last run ${new Date(cron.last_run_at).toLocaleString()}` : ""}.` },
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
    signedIn: boolean;
    mfa: "ready" | "pending" | "unavailable";
  }[] = [];

  const service = createAdminClient();
  const [{ data: adminProfiles, error: adminProfilesError }, { data: authUsers, error: authUsersError }] = await Promise.all([
    service.from("profiles").select("id, display_name, status, admin_owner, admin_access_level").eq("role", "admin").order("created_at"),
    service.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);
  const usersById = new Map((authUsers.users ?? []).map((user) => [user.id, user]));
  administrators = await Promise.all((adminProfiles ?? []).map(async (profile) => {
    const user = usersById.get(profile.id);
    const { data: factors, error: factorsError } = await service.auth.admin.mfa.listFactors({ userId: profile.id });
    return {
      id: profile.id,
      name: profile.display_name,
      email: user?.email ?? "Email unavailable",
      accessLevel: (profile.admin_access_level ?? (profile.admin_owner ? "owner" : "administrator")) as AdminAccessLevel,
      status: profile.status,
      signedIn: Boolean(user?.last_sign_in_at),
      mfa: factorsError ? "unavailable" : factors?.factors.some((factor) => factor.status === "verified") ? "ready" : "pending",
    };
  }));

  const readyProviders = providers.filter((provider) => provider.configured).length;
  const unavailableProviders = providers.filter((provider) => !provider.available).length;
  const healthError = settingsError || deliveryError || paymentError || queueError || integrationError || cronError;
  const teamError = adminProfilesError || authUsersError;
  const failuresAvailable = !deliveryError && !paymentError && !integrationError;

  return (
    <section
      className={styles.accountPage}
      data-design-contract="THESIS: admin account work is an authority ledger, not a generic settings-card collection. OWN-WORLD: manuscript ivory, white, deep teal, warm ink, rare gold, fine rules, sans type. STORY: verify readiness, manage authority, inspect business rules and recent failures. FIRST VIEWPORT: compact heading, three-part readiness ledger, and team authority registry. FORM: authority ledger; grounded candidate 3; seed 7c68cc7b. FINISH: no gradients, no excessive pills, no rounded text containers, no excessive cards, no huge text, no stacked titles, no decorative copy, no fake charts, no excessive hero treatment."
    >
      <header className={styles.pageHead}>
        <div className={styles.pageHeadCopy}>
          <h1>Settings and access</h1>
          <p>Verify the systems behind the console, control administrator authority, and inspect recent service problems.</p>
        </div>
        <div className={styles.headMeta}><ShieldCheck aria-hidden="true" /> Your access: {adminAccessLabels[currentLevel]}</div>
      </header>

      {(healthError || teamError) && <p className={styles.notice} role="alert">Some administrator data could not be loaded. {(healthError || teamError)?.message}</p>}

      <div className={styles.ledger} aria-label="System readiness summary">
        <div className={styles.ledgerItem}>
          <span className={styles.ledgerLabel}><Activity aria-hidden="true" /> Connected services</span>
          <strong className={styles.ledgerValue}>{unavailableProviders ? `${readyProviders} configured · ${unavailableProviders} unknown` : `${readyProviders} of ${providers.length} configured`}</strong>
          <p>{unavailableProviders ? "One connection could not be checked." : providers.length - readyProviders === 0 ? "Every listed connection has the required setup." : `${providers.length - readyProviders} connection${providers.length - readyProviders === 1 ? "" : "s"} need setup.`}</p>
        </div>
        <div className={styles.ledgerItem}>
          <span className={styles.ledgerLabel}><Settings2 aria-hidden="true" /> Business rules</span>
          <strong className={styles.ledgerValue}>{settings ? "Database controlled" : "Unavailable"}</strong>
          <p>{settings ? `${Number(settings.commission_rate) * 100}% commission · ${settings.default_claim_window_hours}-hour offer window` : "The current platform settings could not be read."}</p>
        </div>
        <div className={styles.ledgerItem}>
          <span className={styles.ledgerLabel}><CircleAlert aria-hidden="true" /> Recent failures</span>
          <strong className={styles.ledgerValue}>{!failuresAvailable ? "Unavailable" : failures.length === 0 ? "None recorded" : `${failures.length} record${failures.length === 1 ? "" : "s"}`}</strong>
          <p>{!failuresAvailable ? "One or more failure sources could not be read." : failures.length === 0 ? "No recent provider or worker errors were returned." : "Review the newest provider and worker records below."}</p>
        </div>
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <h2>Team authority</h2>
            <p>Create accounts and control who can use the administrator console.</p>
          </div>
          <span className={styles.sectionCount}>{teamError ? "Unavailable" : `${administrators.length} member${administrators.length === 1 ? "" : "s"}`}</span>
        </div>

        {params.admin_message && <p className={`${styles.message} ${styles.successMessage}`} role="status">{params.admin_message}</p>}
        {params.admin_error && <p className={`${styles.message} ${styles.errorMessage}`} role="alert">{params.admin_error}</p>}

        <details className={styles.disclosure}>
          <summary className={styles.teamToolbar}>
            <span className={styles.toolbarNote}><KeyRound aria-hidden="true" /> The password you enter will be sent to the new member by email.</span>
            <span className={styles.addSummary}><Plus aria-hidden="true" /> Add team member</span>
          </summary>
          <div className={styles.createPanel}>
            <div className={styles.createPanelHead}>
              <strong>Create administrator account</strong>
              <span>Choose only the authority this person needs. Passwords must be 12–72 characters.</span>
            </div>
            <form action={createAdminAccountAction} className={styles.createForm}>
              <label className="label">Full name
                <input className="input" name="name" required minLength={2} maxLength={100} autoComplete="name" />
              </label>
              <label className="label">Email
                <input className="input" name="email" type="email" required maxLength={254} autoComplete="email" />
              </label>
              <label className={`label ${styles.fieldWide}`}>Role
                <select className="input" name="accessLevel" required defaultValue={currentLevel === "owner" ? "administrator" : "operations"}>
                  {currentLevel === "owner" && <option value="owner">Owner</option>}
                  {currentLevel === "owner" && <option value="administrator">Administrator</option>}
                  <option value="operations">Operations Staff</option>
                </select>
              </label>
              <label className="label">Password
                <input className="input" name="password" type="password" required minLength={12} maxLength={72} autoComplete="new-password" />
              </label>
              <label className="label">Confirm password
                <input className="input" name="confirmation" type="password" required minLength={12} maxLength={72} autoComplete="new-password" />
              </label>
              <div className={styles.createSubmit}>
                <small>The email contains the address and password entered here. The new member must set up MFA before entering the console.</small>
                <button className="btn btn-small" type="submit"><UserPlus size={15} aria-hidden="true" /> Create account</button>
              </div>
            </form>
          </div>
        </details>

        <div className={styles.teamHeader} aria-hidden="true"><span>Member</span><span>Authority</span><span>Account</span><span>Action</span></div>
        <div>
          {teamError && <p className={styles.empty}>Team member records are currently unavailable.</p>}
          {administrators.map((administrator) => {
            const accountState = administrator.status === "active" ? administrator.signedIn ? "Active" : "Ready to sign in" : "Suspended";
            const isSelf = administrator.id === currentAdmin.user.id;
            const canManage = !isSelf && canManageAdminAccess(currentLevel, administrator.accessLevel);
            const mfaState = administrator.mfa === "ready" ? "MFA ready" : administrator.mfa === "pending" ? "MFA pending" : "MFA unavailable";
            const row = <>
              <div className={styles.identity}>
                <span className={styles.avatar} aria-hidden="true">{administrator.name.charAt(0)}</span>
                <div className={styles.identityText}><strong>{administrator.name}</strong><small>{administrator.email}</small></div>
              </div>
              <span className={styles.roleCell}><small className={styles.mobileFieldLabel}>Authority</small><span className={styles.role}>{adminAccessLabels[administrator.accessLevel]}</span></span>
              <span className={styles.stateCell}><small className={styles.mobileFieldLabel}>Account</small><span className={styles.state}><span className={styles.stateDot} data-state={administrator.status} /><span>{accountState}<br />{mfaState}</span></span></span>
            </>;

            if (!canManage) return <div className={styles.teamRecord} key={administrator.id}><div className={styles.teamRow}>{row}<span className={styles.self}>{isSelf ? "You" : "Protected"}</span></div></div>;

            return (
              <details className={`${styles.disclosure} ${styles.teamRecord} ${styles.manage}`} key={administrator.id}>
                <summary className={styles.teamRow}>
                  {row}
                  <span className={styles.manageSummary}>Manage <ChevronDown aria-hidden="true" /></span>
                </summary>
                <div className={styles.managePanel}>
                  <div className={styles.manageGrid}>
                          <form action={setAdminPasswordAction} className={styles.manageBlock}>
                            <input type="hidden" name="adminId" value={administrator.id} />
                            <h3><KeyRound aria-hidden="true" /> Set a new password</h3>
                            <div className={styles.passwordFields}>
                              <label className="label">New password
                                <input className="input" name="password" type="password" required minLength={12} maxLength={72} autoComplete="new-password" />
                              </label>
                              <label className="label">Confirm password
                                <input className="input" name="confirmation" type="password" required minLength={12} maxLength={72} autoComplete="new-password" />
                              </label>
                              <button className="btn btn-small" type="submit">Save password</button>
                            </div>
                          </form>

                          <div className={`${styles.manageBlock} ${styles.authorityStack}`}>
                            <div>
                              <h3><UsersRound aria-hidden="true" /> Authority and account</h3>
                              {currentLevel === "owner" && (
                                <form action={setAdminAccessLevelAction} className={styles.roleForm}>
                                  <input type="hidden" name="adminId" value={administrator.id} />
                                  <label className="label">Role
                                    <select className="input" name="accessLevel" defaultValue={administrator.accessLevel}>
                                      <option value="owner">Owner</option>
                                      <option value="administrator">Administrator</option>
                                      <option value="operations">Operations Staff</option>
                                    </select>
                                  </label>
                                  <button className="btn btn-secondary btn-small" type="submit">Save role</button>
                                </form>
                              )}
                            </div>
                            <div className={styles.accountActions}>
                              {administrator.status === "active" ? (
                                <details className={`${styles.disclosure} ${styles.confirmAction}`}>
                                  <summary className="btn btn-secondary btn-small">Suspend account</summary>
                                  <div className={styles.confirmPanel}>
                                    <p>Suspend {administrator.name}? They will lose console access until restored.</p>
                                    <form action={setAdminStatusAction}>
                                      <input type="hidden" name="adminId" value={administrator.id} />
                                      <input type="hidden" name="status" value="suspended" />
                                      <button className="btn btn-secondary btn-small" type="submit">Confirm suspension</button>
                                    </form>
                                  </div>
                                </details>
                              ) : (
                                <form action={setAdminStatusAction}>
                                  <input type="hidden" name="adminId" value={administrator.id} />
                                  <input type="hidden" name="status" value="active" />
                                  <button className="btn btn-secondary btn-small" type="submit">Restore account</button>
                                </form>
                              )}
                              {canRemoveAdminUser(currentLevel, false) && (
                                <details className={`${styles.disclosure} ${styles.confirmAction} ${styles.removeAction}`}>
                                  <summary className={`btn btn-secondary btn-small ${styles.dangerButton}`}>Remove account</summary>
                                  <div className={styles.confirmPanel}>
                                    <p>Permanently remove {administrator.name}? Their administrator account cannot be restored from this console.</p>
                                    <form action={removeAdminAction}>
                                      <input type="hidden" name="adminId" value={administrator.id} />
                                      <button className={`btn btn-secondary btn-small ${styles.dangerButton}`} type="submit">Confirm removal</button>
                                    </form>
                                  </div>
                                </details>
                              )}
                            </div>
                          </div>
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      </section>

      <div className={styles.lowerGrid}>
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <div><h2>Connected services</h2><p>Configuration detected on this deployment.</p></div>
          </div>
          <div>
            {providers.map((provider) => (
              <div className={styles.registerRow} key={provider.label}>
                <strong>{provider.label}</strong>
                <p>{provider.help}</p>
                <span className={styles.statusTag} data-ready={provider.available && provider.configured}>{provider.available && provider.configured ? <CheckCircle2 aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}{!provider.available ? "Unavailable" : provider.configured ? "Configured" : "Setup needed"}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <div><h2>Recent service errors</h2><p>The newest delivery, payment, webhook, and worker records.</p></div>
            <span className={styles.sectionCount}>{failures.length}</span>
          </div>
          {!failuresAvailable ? <p className={styles.empty}>Recent service errors are currently unavailable.</p> : failures.length === 0 ? <p className={styles.empty}>No recent service errors.</p> : failures.map((failure) => (
            <div key={failure.id} className={styles.failureRow}>
              <div className={styles.failureTop}><strong>{failure.source} · {failure.reference}</strong><span className={styles.failureStatus}>{failure.status}</span></div>
              <p>{failure.detail}</p>
              <time dateTime={failure.at}>{new Date(failure.at).toLocaleString()}</time>
            </div>
          ))}
        </section>
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div><h2>Business rules</h2><p>Read-only values currently governing offers and payments.</p></div>
          <Clock3 aria-hidden="true" size={18} />
        </div>
        <dl className={styles.businessFacts}>
          <div><dt>Commission rate</dt><dd>{settings ? `${Number(settings.commission_rate) * 100}%` : "Not available"}</dd></div>
          <div><dt>Default offer window</dt><dd>{settings ? `${settings.default_claim_window_hours} hours` : "Not available"}</dd></div>
          <div><dt>Currency</dt><dd>SGD</dd></div>
          <div><dt>Last settings update</dt><dd>{settings?.updated_at ? new Date(settings.updated_at).toLocaleString() : "Not recorded"}</dd></div>
        </dl>
        <p className={styles.sectionNote}>Changes remain database-controlled; this page intentionally does not expose raw state editors.</p>
      </section>
    </section>
  );
}
