import { createClient, getProfile, isSupabaseConfigured } from "@/lib/supabase/server";
import { logout } from "@/app/actions/auth";

export default async function AdminProfilePage() {
  let email = "admin@preview.local";
  let name = "Demo Admin";
  let signedIn = false;

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      signedIn = true;
      email = data.user.email ?? email;
      const profile = await getProfile(supabase, data.user.id);
      name = profile?.display_name || email.split("@")[0];
    }
  }

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
          <div><dt>Console access</dt><dd>{signedIn ? "Signed in" : "Preview mode"}</dd></div>
        </dl>

        {signedIn ? (
          <form action={logout}>
            <button type="submit" className="btn-secondary btn">Log out</button>
          </form>
        ) : (
          <p className="vendor-empty">Connect Supabase credentials to enable real admin sign-in and log out here.</p>
        )}
      </div>
    </>
  );
}
