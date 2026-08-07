import { createClient, getCurrentUser, getProfile } from "@/lib/supabase/server";
import { logout } from "@/app/actions/auth";

export default async function AdminProfilePage() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  const email = user?.email ?? "Administrator";
  const profile = user ? await getProfile(supabase, user.id) : null;
  const name = profile?.display_name || email.split("@")[0];

  return (
    <>
      <div className="vendor-page-head">
        <div>
          <p className="vendor-eyebrow">Account</p>
          <h1 className="display vendor-page-title">Profile</h1>
          <p className="vendor-page-lead">Your admin identity for this console.</p>
        </div>
      </div>

      <div className="card vendor-panel vendor-profile-card">
        <div className="vendor-profile-head">
          <span className="vendor-sidebar-avatar vendor-profile-avatar">{name.charAt(0)}</span>
          <div>
            <strong className="display text-lg">{name}</strong>
            <p className="text-sm text-[var(--muted)]">{email}</p>
          </div>
        </div>

        <dl className="vendor-profile-facts">
          <div><dt>Role</dt><dd>Administrator</dd></div>
          <div><dt>Console access</dt><dd>Signed in with MFA</dd></div>
        </dl>

        <form action={logout}>
          <button type="submit" className="btn-secondary btn">Log out</button>
        </form>
      </div>
    </>
  );
}
