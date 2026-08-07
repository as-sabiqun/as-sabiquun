import Link from "next/link";
import { redirect } from "next/navigation";
import { OfferingEditorForm, OfferingSubmitButton } from "@/components/admin/offering-editor-form";
import { offeringCategoryConfig } from "@/lib/admin-offerings";
import { getAal2AdminAtLeast } from "@/lib/auth";
import { formatCents } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";
import { addOfferingAction, updateOfferingAction } from "./actions";

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

type CatalogEvent = {
  id: string;
  event_type: "offering.created" | "offering.updated";
  actor_access_level: string | null;
  previous_state: Record<string, unknown> | null;
  new_state: Record<string, unknown>;
  created_at: string;
};

const serviceGroups: Record<Offering["category_slug"], { label: string; help: string; href: string }> = {
  korban: { label: "Korban", help: "Fixed-price animal packages", href: "/korban" },
  water: { label: "Wakaf Water Pump", help: "Water pump contribution options", href: "/wakaf/water-pump" },
  quran: { label: "Wakaf Quran", help: "Quran contribution options", href: "/wakaf/quran" },
  orphans: { label: "Food for Orphans", help: "Food contribution options", href: "/wakaf/food-for-orphans" },
};

const serviceOrder = Object.keys(serviceGroups) as Offering["category_slug"][];

function stateAmount(state: Record<string, unknown> | null) {
  return Number(state?.unit_amount ?? state?.min_amount ?? 0);
}

function changeSummary(event: CatalogEvent) {
  if (!event.previous_state) return "Package created";
  const changes: string[] = [];
  const before = stateAmount(event.previous_state);
  const after = stateAmount(event.new_state);
  if (before !== after) changes.push(`Price ${formatCents(before)} to ${formatCents(after)}`);
  if (event.previous_state.title !== event.new_state.title) changes.push("Name changed");
  if (event.previous_state.detail !== event.new_state.detail) changes.push("Description changed");
  if (event.previous_state.active !== event.new_state.active) changes.push(event.new_state.active ? "Shown on website" : "Hidden from website");
  return changes.join(" · ") || "Package updated";
}

export default async function AdminServicesPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  if (!await getAal2AdminAtLeast(supabase, "administrator")) redirect("/admin");
  const [{ data, error }, { data: historyData, error: historyError }] = await Promise.all([
    supabase.from("offerings")
      .select("id, service_type, category_slug, title, detail, unit_amount, min_amount, active")
      .order("sort_order"),
    supabase.from("offering_catalog_events")
      .select("id, event_type, actor_access_level, previous_state, new_state, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  const offerings = (data ?? []) as Offering[];
  const history = (historyData ?? []) as CatalogEvent[];
  const activeCount = offerings.filter((offering) => offering.active).length;

  return (
    <>
      <div className="vendor-page-head">
        <div>
          <h1 className="display vendor-page-title">Services and prices</h1>
          <p className="vendor-page-lead">Change the packages customers see and the prices used for new orders.</p>
        </div>
      </div>

      <div className="admin-catalog-impact" role="note">
        <div><strong>Updates across the app</strong><span>The website, checkout, and manual job form use the new details.</span></div>
        <div><strong>Old orders stay correct</strong><span>Orders already created keep their original package and price for accounting.</span></div>
      </div>
      {params.message && <p className="auth-message" role="status">{params.message}</p>}
      {params.error && <p className="auth-error" role="alert">{params.error}</p>}
      {error && <p className="auth-error" role="alert">Services could not be loaded. {error.message}</p>}

      <section className="card admin-service-catalog">
        <header className="admin-service-catalog-head">
          <div><h2 className="display text-lg">Customer service menu</h2><p>{activeCount} shown on the website · {offerings.length - activeCount} hidden</p></div>
          <details className="admin-service-add">
            <summary className="btn btn-small">Add a package</summary>
            <OfferingEditorForm action={addOfferingAction}>
              <div className="admin-service-form-intro"><strong>Create a package</strong><span>Add another choice under one of the four current services.</span></div>
              <label className="label">Service<select className="input" name="category" defaultValue="korban">
                {Object.entries(offeringCategoryConfig).map(([value, config]) => <option key={value} value={value}>{config.label}</option>)}
              </select></label>
              <div className="admin-form-grid">
                <label className="label">Name customers will see<input className="input" name="title" required minLength={2} maxLength={100} placeholder="Village water pump" /></label>
                <label className="label">Price in SGD<input className="input" name="price" type="number" required min="0.01" max="1000000" step="0.01" inputMode="decimal" placeholder="450.00" /></label>
              </div>
              <label className="label">Description customers will see<textarea className="input admin-service-description" name="detail" required minLength={10} maxLength={500} placeholder="Explain exactly what this package includes." /></label>
              <div className="admin-service-editor-actions">
                <label className="admin-service-visibility"><input type="checkbox" name="active" defaultChecked /><span><strong>Show on the website</strong><small>Customers can choose this package immediately.</small></span></label>
                <OfferingSubmitButton>Create package</OfferingSubmitButton>
              </div>
            </OfferingEditorForm>
          </details>
        </header>

        <div className="admin-service-groups">
          {serviceOrder.map((category) => {
            const group = serviceGroups[category];
            const packages = offerings.filter((offering) => offering.category_slug === category);
            return <section className="admin-service-group" key={category} data-service={category}>
              <header>
                <div><h3>{group.label}</h3><p>{group.help} · {packages.length} package{packages.length === 1 ? "" : "s"}</p></div>
                <Link href={group.href}>View customer page</Link>
              </header>
              {packages.map((offering) => {
                const amount = offering.service_type === "korban" ? offering.unit_amount : offering.min_amount;
                return <details className="admin-service-row" key={offering.id}>
                  <summary>
                    <div className="admin-service-identity"><span /><div><strong>{offering.title}</strong><small>{offering.detail}</small></div></div>
                    <div className="admin-service-price"><small>{offering.service_type === "korban" ? "Price" : "Minimum"}</small><strong>{amount ? formatCents(amount) : "Missing"}</strong></div>
                    <span className={`vendor-status ${offering.active ? "vendor-status-accepted" : "vendor-status-rejected"}`}>{offering.active ? "Shown on website" : "Hidden from website"}</span>
                    <span className="admin-service-edit">Edit package</span>
                  </summary>
                  <OfferingEditorForm action={updateOfferingAction} initialActive={offering.active}>
                    <input type="hidden" name="id" value={offering.id} />
                    <div className="admin-service-form-intro"><strong>Edit what customers see</strong><span>Saving updates the website, checkout, and new manual jobs.</span></div>
                    <div className="admin-form-grid">
                      <label className="label">Name customers will see<input className="input" name="title" required minLength={2} maxLength={100} defaultValue={offering.title} /></label>
                      <label className="label">{offering.service_type === "korban" ? "Price" : "Minimum contribution"} in SGD<input className="input" name="price" type="number" required min="0.01" max="1000000" step="0.01" inputMode="decimal" defaultValue={amount ? (amount / 100).toFixed(2) : ""} /></label>
                    </div>
                    <label className="label">Description customers will see<textarea className="input admin-service-description" name="detail" required minLength={10} maxLength={500} defaultValue={offering.detail} /></label>
                    <div className="admin-service-editor-actions">
                      <label className="admin-service-visibility"><input type="checkbox" name="active" defaultChecked={offering.active} /><span><strong>Show on the website</strong><small>Turn this off to stop customers choosing it.</small></span></label>
                      <OfferingSubmitButton>Save package changes</OfferingSubmitButton>
                    </div>
                  </OfferingEditorForm>
                </details>;
              })}
            </section>;
          })}
        </div>
      </section>

      {historyError && <p className="auth-error" role="alert">Catalog history could not be loaded.</p>}
      <details className="card admin-service-history">
        <summary>Recent catalogue changes <span>{history.length}</span></summary>
        {history.length ? <ol>
          {history.map((event) => {
            const amount = stateAmount(event.new_state);
            return <li key={event.id}>
              <div><strong>{String(event.new_state.title ?? "Service")}</strong><small>{changeSummary(event)}</small></div>
              <div><strong>{amount ? formatCents(amount) : "No price"}</strong><small>{event.actor_access_level ?? "system"} · {new Intl.DateTimeFormat("en-SG", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Singapore" }).format(new Date(event.created_at))}</small></div>
            </li>;
          })}
        </ol> : <p>No catalogue changes have been recorded yet.</p>}
      </details>

      <p className="admin-record-help">You can add packages to the four services above. A completely new service needs its own customer form and fulfilment workflow first.</p>
    </>
  );
}
