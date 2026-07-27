import { createClient, getCurrentUser, getProfile } from "@/lib/supabase/server";
import { logout } from "@/app/actions/auth";

export default async function VendorProfilePage() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  const email = user?.email ?? "Vendor";
  const profile = user ? await getProfile(supabase, user.id) : null;
  const name = profile?.display_name || email.split("@")[0];
  const phone = profile?.phone ?? "";
  const vendorType = profile?.vendor_type ?? "";
  const services = profile?.services ?? [];
  const contactPerson = profile?.contact_person ?? "";
  const whatsapp = profile?.whatsapp ?? "";
  const country = profile?.country ?? "";
  const address = profile?.city_address ?? "";
  const bankName = profile?.bank_name ?? "";
  const bankAccountName = profile?.bank_account_name ?? "";
  const bankAccountNumber = profile?.bank_account_number ?? "";
  const swiftCode = profile?.swift_code ?? "";
  const onboarding = profile?.vendor_onboarding_status ?? "not_applicable";

  return (
    <>
      <div className="vendor-page-head">
        <div>
          <p className="vendor-eyebrow">Account</p>
          <h1 className="display vendor-page-title">Profile</h1>
          <p className="vendor-page-lead">Your organisation, capabilities, contacts, and payout details.</p>
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
          <div><dt>Role</dt><dd>{vendorType || "Service vendor"}</dd></div>
          <div><dt>Onboarding</dt><dd className="capitalize">{onboarding.replaceAll("_", " ")}</dd></div>
          {contactPerson && <div><dt>Contact person</dt><dd>{contactPerson}</dd></div>}
          {phone && <div><dt>Phone</dt><dd>{phone}</dd></div>}
          {whatsapp && <div><dt>WhatsApp</dt><dd>{whatsapp}</dd></div>}
          {country && <div><dt>Country</dt><dd>{country}</dd></div>}
          {address && <div><dt>Address</dt><dd>{address}</dd></div>}
          {services.length > 0 && <div><dt>Services</dt><dd>{services.join(", ")}</dd></div>}
          {bankName && <div><dt>Bank</dt><dd>{bankName}</dd></div>}
          {bankAccountName && <div><dt>Account name</dt><dd>{bankAccountName}</dd></div>}
          {bankAccountNumber && <div><dt>Account number</dt><dd>{bankAccountNumber}</dd></div>}
          {swiftCode && <div><dt>SWIFT code</dt><dd>{swiftCode}</dd></div>}
          <div><dt>Portal access</dt><dd>Signed in</dd></div>
        </dl>

        <form action={logout}>
          <button type="submit" className="btn-secondary btn">Log out</button>
        </form>
      </div>
    </>
  );
}
