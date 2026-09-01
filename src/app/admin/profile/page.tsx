import Link from "next/link";
import { BadgeCheck, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { adminAccessLevel } from "@/lib/auth";
import { adminAccessLabels } from "@/lib/admin-users";
import { createClient, getCurrentUser, getProfile } from "@/lib/supabase/server";
import styles from "../admin-account.module.css";

export default async function AdminProfilePage() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  const email = user?.email ?? "Administrator";
  const profile = user ? await getProfile(supabase, user.id) : null;
  const name = profile?.display_name || email.split("@")[0];
  const accessLevel = profile ? adminAccessLevel(profile) : "administrator";

  return (
    <section
      className={styles.accountPage}
      data-design-contract="THESIS: admin account work is an authority ledger, not a generic settings card. OWN-WORLD: manuscript ivory, white, deep teal, warm ink, rare gold, fine rules, sans type. STORY: confirm identity and security, understand authority, then leave the console safely. FIRST VIEWPORT: compact heading and a single identity record. FORM: authority ledger; grounded candidate 3; seed 7c68cc7b. FINISH: no gradients, no excessive pills, no rounded text containers, no excessive cards, no huge text, no stacked titles, no decorative copy, no fake charts, no excessive hero treatment."
    >
      <header className={styles.pageHead}>
        <div className={styles.pageHeadCopy}>
          <h1>Profile</h1>
          <p>Your verified identity and authority inside the administrator console.</p>
        </div>
        <div className={styles.headMeta}><ShieldCheck aria-hidden="true" /> MFA-secured session</div>
      </header>

      <div className={styles.profileShell}>
        <div className={styles.profileIdentity}>
          <div>
            <span className={styles.avatar} aria-hidden="true">{name.charAt(0)}</span>
            <h2>{name}</h2>
            <p>{email}</p>
          </div>
          <div className={styles.verified}><BadgeCheck aria-hidden="true" /> Identity verified for this session</div>
        </div>

        <div className={styles.profileRecord}>
          <div className={styles.profileRecordHead}>
            <h2>Administrator record</h2>
            <UserRound aria-hidden="true" />
          </div>
          <dl className={styles.profileFacts}>
            <div><dt>Name</dt><dd>{name}</dd></div>
            <div><dt>Email address</dt><dd>{email}</dd></div>
            <div><dt>Authority</dt><dd>{adminAccessLabels[accessLevel]}</dd></div>
            <div><dt>Console security</dt><dd>Multi-factor authentication verified</dd></div>
          </dl>
          <div className={styles.profileActions}>
            {accessLevel !== "operations" ? <Link className={styles.settingsLink} href="/admin/settings">Manage team and system settings</Link> : <span />}
            <form action={logout}>
              <button type="submit" className="btn btn-secondary btn-small"><LogOut size={15} aria-hidden="true" /> Log out</button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
