import { redirect } from "next/navigation";
import { getAal2AdminAtLeast } from "@/lib/auth";
import { formatCents } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";
import { addKorbanOfferingAction, updateOfferingAction } from "./actions";

type Offering = {
  id: string;
  service_type: "korban" | "wakaf";
  category_slug: "korban" | "water" | "quran" | "orphans";
  title: string;
  detail: string;
  unit_amount: number | null;
  min_amount: number | null;
  active: boolean;
};

const categoryLabels: Record<Offering["category_slug"], string> = {
  korban: "Korban packages",
  water: "Wakaf Water Pump",
  quran: "Wakaf Quran",
  orphans: "Food for Orphans",
};

export default async function AdminServicesPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  if (!await getAal2AdminAtLeast(supabase, "administrator")) redirect("/admin");
  const { data, error } = await supabase.from("offerings")
    .select("id, service_type, category_slug, title, detail, unit_amount, min_amount, active")
    .order("sort_order");
  const offerings = (data ?? []) as Offering[];
  const activeCount = offerings.filter((offering) => offering.active).length;

  return (
    <>
      <div className="vendor-page-head">
        <div>
          <h1 className="display vendor-page-title">Services &amp; pricing</h1>
          <p className="vendor-page-lead">Control what customers can choose and what new orders cost.</p>
        </div>
        <div className="admin-service-count"><strong>{activeCount}</strong><span>live</span><small>{offerings.length - activeCount} hidden</small></div>
      </div>

      <p className="admin-catalog-note">Changes apply to new orders only. Existing orders keep the title and price saved when they were created.</p>
      {params.message && <p className="auth-message" role="status">{params.message}</p>}
      {params.error && <p className="auth-error" role="alert">{params.error}</p>}
      {error && <p className="auth-error" role="alert">Services could not be loaded. {error.message}</p>}

      <section className="card admin-service-catalog">
        <header className="admin-service-catalog-head">
          <div><h2 className="display text-lg">Public catalog</h2><p>Edit a row to change its public name, description, price, or availability.</p></div>
          <details className="admin-service-add">
            <summary className="btn btn-small">Add Korban package</summary>
            <form action={addKorbanOfferingAction} className="admin-service-editor">
              <div className="admin-form-grid">
                <label className="label">Package name<input className="input" name="title" required minLength={2} maxLength={100} placeholder="Korban — Camel share" /></label>
                <label className="label">Price (SGD)<input className="input" name="price" type="number" required min="0.01" max="1000000" step="0.01" placeholder="450.00" /></label>
              </div>
              <label className="label">Customer description<textarea className="input admin-service-description" name="detail" required minLength={10} maxLength={500} placeholder="Explain exactly what this package includes." /></label>
              <label className="admin-service-visibility"><input type="checkbox" name="active" defaultChecked /> Show this package on the public site</label>
              <button className="btn btn-small" type="submit">Add package</button>
            </form>
          </details>
        </header>

        <div className="admin-service-table-head"><span>Service</span><span>Price</span><span>Visibility</span><span /></div>
        {offerings.map((offering) => {
          const amount = offering.service_type === "korban" ? offering.unit_amount : offering.min_amount;
          return (
            <details className="admin-service-row" key={offering.id} data-service={offering.category_slug}>
              <summary>
                <div className="admin-service-identity"><span /><div><strong>{offering.title}</strong><small>{categoryLabels[offering.category_slug]}</small></div></div>
                <div className="admin-service-price"><strong>{amount ? formatCents(amount) : "Missing"}</strong><small>{offering.service_type === "korban" ? "fixed price" : "minimum"}</small></div>
                <span className={`vendor-status ${offering.active ? "vendor-status-accepted" : "vendor-status-rejected"}`}>{offering.active ? "Live" : "Hidden"}</span>
                <span className="admin-service-edit">Edit</span>
              </summary>
              <form action={updateOfferingAction} className="admin-service-editor">
                <input type="hidden" name="id" value={offering.id} />
                <div className="admin-form-grid">
                  <label className="label">Public name<input className="input" name="title" required minLength={2} maxLength={100} defaultValue={offering.title} /></label>
                  <label className="label">{offering.service_type === "korban" ? "Price" : "Minimum contribution"} (SGD)<input className="input" name="price" type="number" required min="0.01" max="1000000" step="0.01" defaultValue={amount ? (amount / 100).toFixed(2) : ""} /></label>
                </div>
                <label className="label">Customer description<textarea className="input admin-service-description" name="detail" required minLength={10} maxLength={500} defaultValue={offering.detail} /></label>
                <div className="admin-service-editor-actions">
                  <label className="admin-service-visibility"><input type="checkbox" name="active" defaultChecked={offering.active} /> Show on the public site</label>
                  <button className="btn btn-small" type="submit">Save changes</button>
                </div>
              </form>
            </details>
          );
        })}
      </section>

      <p className="admin-record-help">Wakaf projects accept any amount above their minimum, so they do not need extra packages. A new service category needs its own customer page before it can be added here.</p>
    </>
  );
}
