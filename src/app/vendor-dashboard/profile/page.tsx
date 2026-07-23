import { createClient, getProfile, isSupabaseConfigured } from "@/lib/supabase/server";
import { logout } from "@/app/actions/auth";

export default async function VendorProfilePage() {
  let email = "vendor@preview.local";
  let name = "Demo Vendor";
  let phone = "";
  let vendorType = "";
  let services: string[] = [];
  let signedIn = false;

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      signedIn = true;
      email = data.user.email ?? email;
      const profile = await getProfile(supabase, data.user.id);
      name = profile?.display_name || email.split("@")[0];
      phone = profile?.phone ?? "";
      vendorType = profile?.vendor_type ?? "";
      services = profile?.services ?? [];
    }
  }

  return (
    <>
      <div className="vendor-page-head">
        <div>
          <p className="vendor-eyebrow">Account</p>
          <h1 className="display vendor-page-title">Profile</h1>
          <p className="vendor-page-lead">Your vendor identity for this portal.</p>
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
          <div><dt>Role</dt><dd>{vendorType || "Fulfilment vendor"}</dd></div>
          {phone && <div><dt>Phone</dt><dd>{phone}</dd></div>}
          {services.length > 0 && <div><dt>Services</dt><dd>{services.join(", ")}</dd></div>}
          <div><dt>Portal access</dt><dd>{signedIn ? "Signed in" : "Preview mode"}</dd></div>
        </dl>

        {signedIn ? (
          <form action={logout}>
            <button type="submit" className="btn-secondary btn">Log out</button>
          </form>
        ) : (
          <p className="vendor-empty">Connect Supabase credentials to enable real vendor sign-in and log out here.</p>
        )}
      </div>
    </>
  );
}
