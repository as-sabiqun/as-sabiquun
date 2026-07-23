"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { logout } from "@/app/actions";
import { Brand } from "@/components/brand";
import { transitionDemoAdminOrder, type AdminDemoStatus } from "@/lib/admin-demo";

type Section = "overview" | "orders" | "vendors" | "reports";
type OrderFilter = "all" | "needs_assignment" | "in_fulfilment" | "proof_review" | "completed";

type AdminVendor = {
  id: string;
  name: string;
  initials: string;
  country: string;
  coverage: string;
  contact: string;
};

type AdminOrder = {
  id: string;
  reference: string;
  service: string;
  summary: string;
  amount: string;
  payment: "Paid";
  status: AdminDemoStatus;
  scheduled: string;
  location: string;
  quantity: string;
  participant: string;
  customer: string;
  email: string;
  phone: string;
  vendorId: string | null;
  notes: string;
  evidence: { type: string; filename: string; detail: string }[];
  reviewNote?: string;
};

type AdminReport = {
  id: string;
  orderId: string;
  vendorId: string;
  type: string;
  message: string;
  created: string;
  status: "Open" | "Resolved";
};

const vendors: AdminVendor[] = [
  { id: "rahmah", name: "Rahmah Services", initials: "RS", country: "Indonesia", coverage: "Korban, Quran, food aid", contact: "Afiq Rahman" },
  { id: "amanah-water", name: "Amanah Water Works", initials: "AW", country: "Cambodia", coverage: "Water projects", contact: "Sok Dara" },
  { id: "nur-foundation", name: "Nur Community Foundation", initials: "NF", country: "Malaysia", coverage: "Food aid, Quran", contact: "Farah Ismail" },
];

const initialOrders: AdminOrder[] = [
  {
    id: "order-korban",
    reference: "ASB-260722-014",
    service: "Korban",
    summary: "Overseas cow share",
    amount: "S$280",
    payment: "Paid",
    status: "assigned",
    scheduled: "22 July 2026",
    location: "Bandung, Indonesia",
    quantity: "1 share",
    participant: "Ahmad bin Yusuf",
    customer: "Yusuf Rahman",
    email: "yusuf@example.com",
    phone: "+65 8123 4567",
    vendorId: "rahmah",
    notes: "Nameplate requested. Keep the participant name visible in the completion media.",
    evidence: [],
  },
  {
    id: "order-water",
    reference: "ASB-260728-006",
    service: "Wakaf Water Pump",
    summary: "Community hand-pump installation",
    amount: "S$650",
    payment: "Paid",
    status: "in_progress",
    scheduled: "28 July 2026",
    location: "Kampong Cham, Cambodia",
    quantity: "1 installation",
    participant: "Family of Haji Musa",
    customer: "Nur Aisyah",
    email: "aisyah@example.com",
    phone: "+65 8777 2361",
    vendorId: "rahmah",
    notes: "Use the supplied English nameplate and include a wide photo of the completed site.",
    evidence: [],
  },
  {
    id: "order-quran",
    reference: "ASB-260719-021",
    service: "Wakaf Quran",
    summary: "Quran distribution",
    amount: "S$240",
    payment: "Paid",
    status: "proof_submitted",
    scheduled: "19 July 2026",
    location: "Lombok, Indonesia",
    quantity: "40 Qurans",
    participant: "In memory of Fatimah Rahimah",
    customer: "Muhammad Firdaus",
    email: "firdaus@example.com",
    phone: "+65 9012 1184",
    vendorId: "rahmah",
    notes: "Confirm the dedication card is readable without exposing recipient details.",
    evidence: [
      { type: "Photo", filename: "quran-dedication.jpg", detail: "Dedication card and prepared books" },
      { type: "Photo", filename: "distribution-group.jpg", detail: "Privacy-safe distribution handoff" },
      { type: "Video", filename: "completion.mp4", detail: "18-second landscape completion clip" },
    ],
  },
  {
    id: "order-orphans",
    reference: "ASB-260715-009",
    service: "Food for Orphans",
    summary: "Community meal programme",
    amount: "S$500",
    payment: "Paid",
    status: "completed",
    scheduled: "15 July 2026",
    location: "Batam, Indonesia",
    quantity: "80 meal packs",
    participant: "General contribution",
    customer: "Siti Mariam",
    email: "mariam@example.com",
    phone: "+65 8334 9021",
    vendorId: "rahmah",
    notes: "Completion proof was approved on 16 July 2026.",
    evidence: [
      { type: "Photo", filename: "meal-packs.jpg", detail: "Prepared meal packs" },
      { type: "Photo", filename: "handoff.jpg", detail: "Privacy-safe programme handoff" },
    ],
  },
  {
    id: "order-food",
    reference: "ASB-260730-003",
    service: "Food Aid",
    summary: "Family grocery packs",
    amount: "S$360",
    payment: "Paid",
    status: "unassigned",
    scheduled: "30 July 2026",
    location: "Johor, Malaysia",
    quantity: "24 packs",
    participant: "General contribution",
    customer: "Hafiz Osman",
    email: "hafiz@example.com",
    phone: "+65 8890 2144",
    vendorId: null,
    notes: "Awaiting an approved fulfilment partner. Avoid identifiable recipient media unless consent is recorded.",
    evidence: [],
  },
];

const initialReports: AdminReport[] = [
  { id: "report-access", orderId: "order-water", vendorId: "rahmah", type: "Location or access", message: "The site contact moved installation access to the following morning. Please confirm the revised handover time with the customer.", created: "20 July, 09:42", status: "Open" },
  { id: "report-nameplate", orderId: "order-quran", vendorId: "rahmah", type: "Customer details", message: "The dedication spelling was confirmed with the customer before printing.", created: "18 July, 16:10", status: "Resolved" },
];

const statusLabels: Record<AdminDemoStatus, string> = {
  unassigned: "Needs assignment",
  assigned: "Vendor assigned",
  in_progress: "In fulfilment",
  proof_submitted: "Proof review",
  completed: "Completed",
};

const summaryFilters: { value: Exclude<OrderFilter, "all">; label: string }[] = [
  { value: "needs_assignment", label: "Needs assignment" },
  { value: "in_fulfilment", label: "In fulfilment" },
  { value: "proof_review", label: "Proof review" },
  { value: "completed", label: "Completed" },
];

const adminSectionCopy: Record<Section, { title: string; summary: string; detail: string }> = {
  overview: { title: "Overview", summary: "See what needs action across the whole operation.", detail: "Paid orders, vendor capacity, proof review and reports in one place." },
  orders: { title: "Orders", summary: "Keep paid services moving from assignment to verified proof.", detail: "Assign vendors, review evidence and complete each Amanah record." },
  vendors: { title: "Vendors", summary: "Monitor approved fulfilment partners and their workload.", detail: "See active assignments and operational risk without leaving the workspace." },
  reports: { title: "Reports", summary: "Resolve fulfilment blockers against the correct order.", detail: "Every report stays connected to its vendor and service record." },
};

function matchesFilter(order: AdminOrder, filter: OrderFilter) {
  if (filter === "all") return true;
  if (filter === "needs_assignment") return order.status === "unassigned";
  if (filter === "in_fulfilment") return order.status === "assigned" || order.status === "in_progress";
  if (filter === "proof_review") return order.status === "proof_submitted";
  return order.status === "completed";
}

function StatusBadge({ status }: { status: AdminDemoStatus }) {
  return <span className={`vendor-status admin-status admin-status-${status}`}>{statusLabels[status]}</span>;
}

function AmanahTrail({ status }: { status: AdminDemoStatus }) {
  const stages = ["Paid", "Vendor assigned", "Fulfilment", "Proof review", "Complete"];
  const current = status === "unassigned" || status === "assigned" ? 1 : status === "in_progress" ? 2 : status === "proof_submitted" ? 3 : -1;
  const completedThrough = status === "unassigned" || status === "assigned" ? 0 : status === "in_progress" ? 1 : status === "proof_submitted" ? 2 : 4;

  return (
    <ol className="vendor-amanah admin-amanah" aria-label="Amanah order progress">
      {stages.map((stage, index) => {
        const complete = index <= completedThrough;
        const active = index === current;
        return (
          <li className={`${complete ? "is-complete" : ""} ${active ? "is-current" : ""}`} aria-current={active ? "step" : undefined} key={stage}>
            <span className="vendor-amanah-marker">{complete ? "✓" : index + 1}</span>
            <span><strong>{stage}</strong><small>{active ? "Current stage" : complete ? "Complete" : "Upcoming"}</small></span>
          </li>
        );
      })}
    </ol>
  );
}

export function AdminDashboard() {
  const [section, setSection] = useState<Section>("overview");
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState<OrderFilter>("all");
  const [selectedOrderId, setSelectedOrderId] = useState(initialOrders[0].id);
  const [reports, setReports] = useState(initialReports);
  const [selectedReportId, setSelectedReportId] = useState(initialReports[0].id);
  const [detailOpen, setDetailOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [requestingChanges, setRequestingChanges] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewError, setReviewError] = useState("");

  const visibleOrders = orders.filter((order) => matchesFilter(order, filter));
  const selectedOrder = orders.find((order) => order.id === selectedOrderId) || orders[0];
  const selectedVendor = vendors.find((vendor) => vendor.id === selectedOrder.vendorId);
  const selectedReport = reports.find((report) => report.id === selectedReportId) || reports[0];
  const selectedOrderReport = reports.find((report) => report.orderId === selectedOrder.id);
  const openReports = reports.filter((report) => report.status === "Open").length;
  const count = (nextFilter: OrderFilter) => orders.filter((order) => matchesFilter(order, nextFilter)).length;
  const priorityOrders = orders.filter((order) => order.status === "unassigned" || order.status === "proof_submitted");
  const pipeline = [
    ["Paid", orders.length],
    ["Vendor assigned", orders.filter((order) => order.status !== "unassigned").length],
    ["In fulfilment", orders.filter((order) => ["in_progress", "proof_submitted", "completed"].includes(order.status)).length],
    ["Proof received", orders.filter((order) => ["proof_submitted", "completed"].includes(order.status)).length],
    ["Complete", orders.filter((order) => order.status === "completed").length],
  ] as const;

  function showSection(nextSection: Section) {
    setSection(nextSection);
    setDetailOpen(false);
    setNotice("");
  }

  function openOrder(id: string) {
    setSelectedOrderId(id);
    setDetailOpen(true);
    setNotice("");
    setRequestingChanges(false);
    setReviewNote("");
    setReviewError("");
  }

  function openOverviewOrder(id: string) {
    setSection("orders");
    setFilter("all");
    openOrder(id);
  }

  function changeFilter(nextFilter: OrderFilter) {
    const nextOrders = orders.filter((order) => matchesFilter(order, nextFilter));
    setFilter(nextFilter);
    setDetailOpen(false);
    setNotice("");
    if (nextOrders.length && !nextOrders.some((order) => order.id === selectedOrderId)) setSelectedOrderId(nextOrders[0].id);
  }

  function assignVendor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const vendorId = String(new FormData(event.currentTarget).get("vendor"));
    const action = selectedOrder.status === "unassigned" ? "assign" : "reassign";
    const nextStatus = transitionDemoAdminOrder(selectedOrder.status, action);
    const vendor = vendors.find((item) => item.id === vendorId);
    setOrders((current) => current.map((order) => order.id === selectedOrder.id ? { ...order, status: nextStatus, vendorId } : order));
    setFilter("all");
    setNotice(`${vendor?.name || "Vendor"} ${action === "assign" ? "assigned" : "reassigned"}. The job is waiting for their response.`);
  }

  function approveProof() {
    const nextStatus = transitionDemoAdminOrder(selectedOrder.status, "approve_proof");
    setOrders((current) => current.map((order) => order.id === selectedOrder.id ? { ...order, status: nextStatus, reviewNote: undefined } : order));
    setFilter("all");
    setRequestingChanges(false);
    setNotice("Proof approved. The order is complete and ready for customer notification.");
  }

  function requestChanges(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const note = reviewNote.trim();
    if (note.length < 5) {
      setReviewError("Add a clear note for the vendor.");
      return;
    }
    const nextStatus = transitionDemoAdminOrder(selectedOrder.status, "request_changes");
    setOrders((current) => current.map((order) => order.id === selectedOrder.id ? { ...order, status: nextStatus, reviewNote: note } : order));
    setFilter("all");
    setRequestingChanges(false);
    setReviewError("");
    setNotice("Changes requested. The order is back with the vendor for an updated proof bundle.");
  }

  function resolveReport() {
    setReports((current) => current.map((report) => report.id === selectedReport.id ? { ...report, status: "Resolved" } : report));
  }

  function openRelatedReport(reportId: string) {
    setSelectedReportId(reportId);
    setSection("reports");
    setDetailOpen(true);
    setNotice("");
  }

  return (
    <main className="vendor-workspace admin-workspace min-h-screen lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
      <aside className="vendor-sidebar admin-sidebar hidden h-screen flex-col p-5 text-white lg:sticky lg:top-0 lg:flex">
        <Brand inverse />
        <div className="mt-11">
          <span className="vendor-sidebar-label">Operations</span>
          <nav className="mt-3 grid gap-1" aria-label="Admin workspace">
            <button type="button" aria-pressed={section === "overview"} className={`vendor-nav-button ${section === "overview" ? "is-active" : ""}`} onClick={() => showSection("overview")}><span>Overview</span></button>
            <button type="button" aria-pressed={section === "orders"} className={`vendor-nav-button ${section === "orders" ? "is-active" : ""}`} onClick={() => showSection("orders")}><span>Orders</span><small>{orders.length}</small></button>
            <button type="button" aria-pressed={section === "vendors"} className={`vendor-nav-button ${section === "vendors" ? "is-active" : ""}`} onClick={() => showSection("vendors")}><span>Vendors</span><small>{vendors.length}</small></button>
            <button type="button" aria-pressed={section === "reports"} className={`vendor-nav-button ${section === "reports" ? "is-active" : ""}`} onClick={() => showSection("reports")}><span>Reports</span><small>{openReports}</small></button>
          </nav>
        </div>
        <div className="mt-auto border-t border-white/10 pt-5">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--teal)] text-[.68rem] font-black">AS</span>
            <span><strong className="block text-sm">Admin team</strong><small className="text-[.68rem] text-white/60">Private workspace</small></span>
          </div>
          <p className="mt-4 text-[.68rem] leading-5 text-white/55"><span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />Demo mode · Changes reset on refresh</p>
          <div className="mt-4 flex items-center gap-4 text-[.72rem] font-bold text-white/65"><Link href="/">Public site</Link><form action={logout}><button className="cursor-pointer border-0 bg-transparent p-0 text-inherit" type="submit">Log out</button></form></div>
        </div>
      </aside>

      <section className="min-w-0 pb-24 lg:pb-0">
        <header className="admin-mobile-header sticky top-0 z-30 flex min-h-[66px] items-center justify-between border-b border-[var(--line)] bg-[var(--cream)] px-4 lg:hidden">
          <Brand compact />
          <span className="text-xs font-bold text-[var(--muted)]">{adminSectionCopy[section].title}</span>
        </header>

        <div className="mx-auto max-w-[1500px] px-4 py-6 md:px-7 lg:px-8 lg:py-7">
          <header className="vendor-page-header admin-page-header">
            <div>
              <p className="vendor-kicker">Admin operations</p>
              <h1 className="display mt-1 text-[clamp(2.1rem,4vw,3.25rem)] leading-none">{adminSectionCopy[section].title}</h1>
            </div>
            <div className="max-w-md lg:text-right">
              <p className="text-sm font-semibold text-[var(--ink)]">{adminSectionCopy[section].summary}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{adminSectionCopy[section].detail}</p>
              <span className="vendor-demo-badge mt-3 lg:hidden">Demo mode · resets on refresh</span>
            </div>
          </header>

          {section === "overview" && (
            <>
              <p className="vendor-kicker mt-5">Action required</p>
              <section className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Operational summary">
                {[
                  ["Needs assignment", count("needs_assignment"), "paid order"],
                  ["Proof review", count("proof_review"), "bundle waiting"],
                  ["Open reports", openReports, "blocker to resolve"],
                  ["Active vendors", vendors.length, "approved partners"],
                ].map(([label, value, detail]) => (
                  <article className="vendor-panel p-4" key={label}>
                    <span className="vendor-field-label">{label}</span>
                    <strong className="display mt-2 block text-[1.9rem] leading-none tabular-nums">{value}</strong>
                    <small className="mt-2 block text-[.68rem] text-[var(--muted)]">{detail}</small>
                  </article>
                ))}
              </section>

              <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_370px]">
                <section className="vendor-panel p-5 md:p-6" aria-labelledby="pipeline-title">
                  <div className="flex items-start justify-between gap-4"><div><p className="vendor-kicker">Amanah pipeline</p><h2 id="pipeline-title" className="mt-1 text-lg font-semibold">Paid services by stage</h2></div><button type="button" className="text-xs font-bold text-[var(--teal)]" onClick={() => showSection("orders")}>Open orders →</button></div>
                  <div className="mt-6 grid gap-4">
                    {pipeline.map(([label, value]) => (
                      <div key={label}>
                        <div className="flex items-baseline justify-between gap-3 text-sm"><span>{label}</span><strong>{value}</strong></div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--teal-soft)]"><span className="block h-full rounded-full bg-[var(--teal)]" style={{ width: `${(value / Math.max(1, orders.length)) * 100}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="vendor-panel overflow-hidden" aria-labelledby="priority-title">
                  <div className="border-b border-[var(--line)] p-4"><div className="flex items-center justify-between gap-3"><h2 id="priority-title" className="text-sm font-semibold">Priority queue</h2><span className="vendor-status vendor-status-pending">{priorityOrders.length} due</span></div><p className="mt-1 text-xs text-[var(--muted)]">Assignment and proof decisions</p></div>
                  <div className="divide-y divide-[var(--line)]">
                    {priorityOrders.map((order) => (
                      <button type="button" className="block w-full p-4 text-left transition hover:bg-[var(--cream)]" key={order.id} onClick={() => openOverviewOrder(order.id)}>
                        <span className="flex items-center justify-between gap-3"><StatusBadge status={order.status} /><strong className="text-sm">{order.amount}</strong></span>
                        <strong className="mt-3 block text-sm">{order.service}</strong>
                        <small className="mt-1 block text-[var(--muted)]">{order.reference} · {order.location}</small>
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <section className="vendor-panel p-5 md:p-6">
                  <p className="vendor-kicker">Service mix</p><h2 className="mt-1 text-lg font-semibold">Orders across programmes</h2>
                  <div className="mt-5 grid gap-3">{Array.from(new Set(orders.map((order) => order.service))).map((service) => { const total = orders.filter((order) => order.service === service).length; return <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-3 text-sm last:border-0 last:pb-0" key={service}><span>{service}</span><strong>{total}</strong></div>; })}</div>
                </section>
                <section className="vendor-panel p-5 md:p-6">
                  <p className="vendor-kicker">Vendor capacity</p><h2 className="mt-1 text-lg font-semibold">Approved partner workload</h2>
                  <div className="mt-5 grid gap-4">{vendors.map((vendor) => { const assigned = orders.filter((order) => order.vendorId === vendor.id && order.status !== "completed").length; return <div key={vendor.id}><div className="flex items-baseline justify-between gap-3 text-sm"><span><strong>{vendor.name}</strong><small className="ml-2 text-[var(--muted)]">{vendor.country}</small></span><strong>{assigned}</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--teal-soft)]"><span className="block h-full rounded-full bg-[var(--gold)]" style={{ width: `${(assigned / Math.max(1, orders.length)) * 100}%` }} /></div></div>; })}</div>
                </section>
              </div>
            </>
          )}

          {section === "orders" && (
            <>
              <section className="vendor-summary admin-summary mt-5" aria-label="Order status summary">
                {summaryFilters.map((item) => <button type="button" aria-pressed={filter === item.value} data-status={item.value} key={item.value} onClick={() => changeFilter(item.value)}><span>{item.label}</span><strong>{count(item.value)}</strong></button>)}
              </section>

              <div className="mt-4 grid items-start gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
                <section className={`vendor-panel vendor-queue admin-order-queue flex-col ${detailOpen ? "hidden xl:flex" : "flex"} ${visibleOrders.length ? "" : "xl:col-span-2"}`} aria-labelledby="admin-order-queue-title">
                  <div className="border-b border-[var(--line)] p-4">
                    <div className="flex items-center justify-between gap-4"><h2 id="admin-order-queue-title" className="text-base font-semibold">Order queue</h2><span className="text-xs text-[var(--muted)]">{visibleOrders.length} shown</span></div>
                    <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Filter orders">
                      <button type="button" aria-pressed={filter === "all"} className="vendor-filter" onClick={() => changeFilter("all")}>All</button>
                      {summaryFilters.map((item) => <button type="button" aria-pressed={filter === item.value} className="vendor-filter" key={item.value} onClick={() => changeFilter(item.value)}>{item.label}</button>)}
                    </div>
                  </div>
                  <div className="grid xl:max-h-[calc(100vh-250px)] xl:overflow-y-auto">
                    {visibleOrders.length ? visibleOrders.map((order) => (
                      <button type="button" aria-current={selectedOrderId === order.id ? "true" : undefined} className={`vendor-job-row admin-order-row ${selectedOrderId === order.id ? "is-selected" : ""}`} key={order.id} onClick={() => openOrder(order.id)}>
                        <span className="flex items-center justify-between gap-3"><StatusBadge status={order.status} /><strong className="vendor-money">{order.amount}</strong></span>
                        <strong className="mt-3 block text-left text-[.95rem] font-semibold">{order.service}</strong>
                        <span className="mt-1 block text-left text-xs leading-5 text-[var(--muted)]">Scheduled {order.scheduled}</span>
                        <span className="mt-3 flex items-center justify-between gap-3 text-[.7rem] text-[var(--muted)]"><span className="truncate">{order.location}</span><span className="font-semibold tabular-nums">{order.reference}</span></span>
                      </button>
                    )) : (
                      <div className="p-9 text-center"><strong className="display block text-2xl">Queue clear.</strong><p className="mt-2 text-xs leading-5 text-[var(--muted)]">There are no orders in this status.</p><button type="button" className="btn btn-secondary btn-small mt-5" onClick={() => changeFilter("all")}>View all orders</button></div>
                    )}
                  </div>
                </section>

                {visibleOrders.length > 0 && (
                  <section className={`${detailOpen ? "block" : "hidden"} xl:block`} aria-label={`Order ${selectedOrder.reference}`}>
                    <article className="vendor-record admin-order-record">
                      <div className="vendor-record-header">
                        <button type="button" className="vendor-back mb-5 xl:hidden" onClick={() => setDetailOpen(false)}>← Back to orders</button>
                        <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><StatusBadge status={selectedOrder.status} /><span className="text-xs font-semibold text-[var(--muted)] tabular-nums">{selectedOrder.reference}</span></div><strong className="vendor-record-payout">{selectedOrder.amount}</strong></div>
                        <div className="mt-5 flex flex-col justify-between gap-5 md:flex-row md:items-end">
                          <div><h2 className="display text-[clamp(2rem,4vw,3.4rem)] leading-none">{selectedOrder.service}</h2><p className="mt-2 text-sm text-[var(--muted)]">{selectedOrder.summary} · {selectedOrder.location}</p></div>
                          <span className="admin-payment-badge">✓ Payment received</span>
                        </div>
                      </div>

                      <div className="border-y border-[var(--line)] px-5 py-5 md:px-6"><span className="vendor-kicker">Amanah trail</span><AmanahTrail status={selectedOrder.status} /></div>
                      {notice && <p role="status" className="vendor-notice">{notice}</p>}
                      {selectedOrder.reviewNote && <p className="admin-review-note"><strong>Vendor action required</strong><span>{selectedOrder.reviewNote}</span></p>}

                      <div className="grid 2xl:grid-cols-[minmax(0,1fr)_310px]">
                        <div>
                          <section className="vendor-record-section">
                            <div className="flex items-end justify-between gap-4"><div><p className="vendor-kicker">Order</p><h3 className="mt-1 text-lg font-semibold">Fulfilment brief</h3></div><span className="text-xs text-[var(--muted)]">Scheduled {selectedOrder.scheduled}</span></div>
                            <dl className="vendor-facts mt-5">
                              {[["Payment", selectedOrder.payment], ["Location", selectedOrder.location], ["Quantity", selectedOrder.quantity], ["Fulfilment date", selectedOrder.scheduled]].map(([term, detail]) => <div key={term}><dt>{term}</dt><dd>{detail}</dd></div>)}
                            </dl>
                          </section>
                          <section className="vendor-record-section">
                            <p className="vendor-kicker">People</p>
                            <div className="mt-4 grid gap-px overflow-hidden border border-[var(--line)] bg-[var(--line)] md:grid-cols-2">
                              <div className="bg-white p-4"><span className="vendor-field-label">Customer</span><strong className="mt-2 block text-sm">{selectedOrder.customer}</strong><a className="mt-1 block text-sm font-semibold text-[var(--teal)]" href={`mailto:${selectedOrder.email}`}>{selectedOrder.email}</a><a className="mt-1 block text-sm font-semibold text-[var(--teal)]" href={`tel:${selectedOrder.phone.replaceAll(" ", "")}`}>{selectedOrder.phone}</a></div>
                              <div className="bg-white p-4"><span className="vendor-field-label">Participant / dedication</span><strong className="mt-2 block text-sm leading-6">{selectedOrder.participant}</strong><span className="vendor-field-label mt-5 block">Service note</span><p className="mt-2 text-xs leading-5 text-[var(--muted)]">{selectedOrder.notes}</p></div>
                            </div>
                          </section>

                          {(selectedOrder.status === "proof_submitted" || selectedOrder.status === "completed") && (
                            <section className="vendor-proof admin-proof-review">
                              <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="vendor-kicker text-[var(--teal)]">Completion proof</p><h3 className="mt-1 text-lg font-semibold">Evidence bundle</h3></div><span className="text-xs font-semibold text-[var(--muted)]">{selectedOrder.evidence.length} files</span></div>
                              <div className="admin-evidence-grid mt-5">
                                {selectedOrder.evidence.map((item, index) => <article className="admin-evidence-card" key={item.filename}><div className="admin-evidence-preview" aria-hidden="true"><span>{item.type === "Video" ? "▶" : "◇"}</span><small>{String(index + 1).padStart(2, "0")}</small></div><div><span className="vendor-field-label">{item.type}</span><strong>{item.filename}</strong><p>{item.detail}</p></div></article>)}
                              </div>

                              {selectedOrder.status === "proof_submitted" && (
                                <div className="admin-review-actions mt-5">
                                  <div className="flex flex-wrap gap-2"><button type="button" className="btn btn-small" onClick={approveProof}>Approve proof</button><button type="button" className="btn btn-secondary btn-small" aria-expanded={requestingChanges} onClick={() => { setRequestingChanges((current) => !current); setReviewError(""); }}>Request changes</button></div>
                                  {requestingChanges && <form className="admin-request-form mt-4" onSubmit={requestChanges}><label className="label" htmlFor="admin-review-note">Note for the vendor<textarea id="admin-review-note" className="input min-h-28 resize-y bg-white" value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} minLength={5} required placeholder="Explain exactly which evidence needs to be replaced or added." /></label>{reviewError && <p className="text-xs font-semibold text-[#7b2f26]" role="alert">{reviewError}</p>}<div className="flex flex-wrap gap-2"><button className="btn btn-small">Send request</button><button type="button" className="btn btn-secondary btn-small" onClick={() => setRequestingChanges(false)}>Cancel</button></div></form>}
                                </div>
                              )}
                              {selectedOrder.status === "completed" && <p className="mt-5 text-xs leading-6 text-[var(--muted)]">Proof approved. This record is read-only and ready for the customer receipt and completion update.</p>}
                            </section>
                          )}
                        </div>

                        <aside className="vendor-record-aside admin-assignment-panel">
                          <p className="vendor-kicker">Vendor assignment</p>
                          {selectedVendor ? <div className="admin-assigned-vendor mt-4"><span>{selectedVendor.initials}</span><div><strong>{selectedVendor.name}</strong><small>{selectedVendor.country} · {selectedVendor.contact}</small></div></div> : <div className="admin-unassigned mt-4"><span>!</span><div><strong>No vendor assigned</strong><small>Choose an approved partner before fulfilment can begin.</small></div></div>}

                          {(selectedOrder.status === "unassigned" || selectedOrder.status === "assigned" || selectedOrder.status === "in_progress") && (
                            <form className="mt-5 grid gap-3" key={`${selectedOrder.id}-${selectedOrder.vendorId || "none"}`} onSubmit={assignVendor}>
                              <label className="label">Approved vendor<select className="input bg-white" name="vendor" defaultValue={selectedOrder.vendorId || vendors[0].id}>{vendors.map((vendor) => <option value={vendor.id} key={vendor.id}>{vendor.name} · {vendor.country}</option>)}</select></label>
                              <button className="btn btn-small">{selectedOrder.status === "unassigned" ? "Assign vendor" : "Reassign vendor"}</button>
                              {selectedOrder.status !== "unassigned" && <p className="text-[.7rem] leading-5 text-[var(--muted)]">Reassignment returns the job to awaiting vendor response.</p>}
                            </form>
                          )}

                          {(selectedOrder.status === "proof_submitted" || selectedOrder.status === "completed") && <p className="mt-5 text-[.7rem] leading-5 text-[var(--muted)]">Assignment is locked during proof review and after completion.</p>}
                          {selectedOrderReport ? (
                            <button type="button" className="vendor-report-link" onClick={() => openRelatedReport(selectedOrderReport.id)}>View related report <span aria-hidden="true">→</span></button>
                          ) : (
                            <p className="mt-5 border-t border-[var(--line)] pt-4 text-[.7rem] leading-5 text-[var(--muted)]">No reports recorded for this order.</p>
                          )}
                        </aside>
                      </div>
                    </article>
                  </section>
                )}
              </div>
            </>
          )}

          {section === "vendors" && (
            <section className="vendor-panel admin-vendor-list mt-5 overflow-hidden" aria-labelledby="approved-vendors-title">
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--line)] p-5 md:p-7"><div><p className="vendor-kicker">Partner network</p><h2 id="approved-vendors-title" className="mt-1 text-xl font-semibold">Approved vendors</h2></div><p className="max-w-sm text-xs leading-5 text-[var(--muted)]">Operational workload only. Vendor setup and account changes stay outside this prototype.</p></div>
              <div className="divide-y divide-[var(--line)]">
                {vendors.map((vendor) => {
                  const assigned = orders.filter((order) => order.vendorId === vendor.id && order.status !== "completed").length;
                  const active = orders.filter((order) => order.vendorId === vendor.id && order.status === "in_progress").length;
                  const review = orders.filter((order) => order.vendorId === vendor.id && order.status === "proof_submitted").length;
                  const vendorReports = reports.filter((report) => report.vendorId === vendor.id && report.status === "Open").length;
                  return <article className="admin-vendor-row" key={vendor.id}><div className="admin-vendor-identity"><span>{vendor.initials}</span><div><div className="flex flex-wrap items-center gap-2"><h3>{vendor.name}</h3><span className="admin-approved-badge">Approved</span></div><p>{vendor.country} · {vendor.coverage}</p><small>Primary contact · {vendor.contact}</small></div></div><dl className="admin-vendor-metrics"><div><dt>Assigned</dt><dd>{assigned}</dd></div><div><dt>Active</dt><dd>{active}</dd></div><div><dt>Proof review</dt><dd>{review}</dd></div><div><dt>Open reports</dt><dd>{vendorReports}</dd></div></dl></article>;
                })}
              </div>
            </section>
          )}

          {section === "reports" && (
            <div className="mt-5 grid items-start gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
              <section className={`vendor-panel admin-report-queue flex-col ${detailOpen ? "hidden xl:flex" : "flex"}`} aria-labelledby="report-queue-title">
                <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] p-4"><h2 id="report-queue-title" className="text-base font-semibold">Report queue</h2><span className="text-xs text-[var(--muted)]">{openReports} open</span></div>
                <div className="grid">
                  {reports.map((report) => {
                    const order = orders.find((item) => item.id === report.orderId);
                    return <button type="button" aria-current={selectedReport.id === report.id ? "true" : undefined} className={`vendor-job-row admin-report-row ${selectedReport.id === report.id ? "is-selected" : ""}`} key={report.id} onClick={() => { setSelectedReportId(report.id); setDetailOpen(true); }}><span className="flex items-center justify-between gap-3"><span className={`vendor-report-status ${report.status === "Open" ? "is-open" : ""}`}>{report.status}</span><span className="text-[.7rem] font-semibold text-[var(--muted)]">{report.created}</span></span><strong className="mt-3 block text-left text-sm">{report.type}</strong><span className="mt-1 block text-left text-xs text-[var(--muted)]">{order?.reference} · {order?.service}</span></button>;
                  })}
                </div>
              </section>

              <section className={`${detailOpen ? "block" : "hidden"} xl:block`} aria-label="Selected report">
                <article className="vendor-record admin-report-record">
                  <div className="vendor-record-header">
                    <button type="button" className="vendor-back mb-5 xl:hidden" onClick={() => setDetailOpen(false)}>← Back to reports</button>
                    <div className="flex flex-wrap items-center justify-between gap-3"><span className={`vendor-report-status ${selectedReport.status === "Open" ? "is-open" : ""}`}>{selectedReport.status}</span><span className="text-xs font-semibold text-[var(--muted)]">{selectedReport.created}</span></div>
                    <h2 className="display mt-5 text-[clamp(2rem,4vw,3.1rem)] leading-none">{selectedReport.type}</h2>
                    <p className="mt-2 text-sm text-[var(--muted)]">{orders.find((order) => order.id === selectedReport.orderId)?.reference} · {vendors.find((vendor) => vendor.id === selectedReport.vendorId)?.name}</p>
                  </div>
                  <section className="vendor-record-section"><p className="vendor-kicker">Vendor report</p><p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted)]">{selectedReport.message}</p></section>
                  <section className="vendor-record-section admin-report-context"><p className="vendor-kicker">Related order</p>{(() => { const order = orders.find((item) => item.id === selectedReport.orderId); return order ? <div className="mt-4 flex flex-wrap items-center justify-between gap-4"><div><strong className="block text-sm">{order.service}</strong><span className="mt-1 block text-xs text-[var(--muted)]">{order.location} · {order.scheduled}</span></div><button type="button" className="btn btn-secondary btn-small" onClick={() => { setSelectedOrderId(order.id); setFilter("all"); showSection("orders"); setDetailOpen(true); }}>Open order</button></div> : null; })()}</section>
                  <footer className="admin-report-footer"><div><strong>{selectedReport.status === "Open" ? "Confirm the issue is handled" : "Report resolved"}</strong><p>{selectedReport.status === "Open" ? "Resolution closes the operational alert; it does not change the order status." : "No further admin action is needed."}</p></div>{selectedReport.status === "Open" && <button type="button" className="btn btn-small" onClick={resolveReport}>Mark resolved</button>}</footer>
                </article>
              </section>
            </div>
          )}
        </div>
      </section>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-[var(--line)] bg-white/95 lg:hidden" aria-label="Admin workspace">
        {(["overview", "orders", "vendors", "reports"] as Section[]).map((item) => <button type="button" aria-pressed={section === item} className={`flex min-h-16 flex-1 flex-col items-center justify-center gap-1 px-1 text-[.65rem] font-bold ${section === item ? "text-[var(--teal)]" : "text-[var(--muted)]"}`} key={item} onClick={() => showSection(item)}><span className={`h-1.5 w-1.5 rounded-full ${section === item ? "bg-[var(--teal)]" : "bg-[var(--line)]"}`} />{item === "overview" ? "Home" : item[0].toUpperCase() + item.slice(1)}</button>)}
      </nav>
    </main>
  );
}
