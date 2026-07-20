"use client";

import Link from "next/link";
import { useState } from "react";
import { logout } from "@/app/actions";
import { Brand } from "@/components/brand";
import { CustomerReportForm } from "@/components/forms";

type CustomerSection = "overview" | "orders" | "documents" | "support";

type CustomerOrder = {
  id: string;
  reference: string;
  service: string;
  summary: string;
  status: string;
  statusClass: string;
  stage: number;
  scheduled: string;
  location: string;
  amount: string;
  participant: string;
  quantity: string;
  vendor: string;
  next: string;
};

const orders: CustomerOrder[] = [
  {
    id: "korban",
    reference: "ASB-260722-014",
    service: "Korban overseas",
    summary: "One cow share",
    status: "Vendor confirmation pending",
    statusClass: "vendor-status-pending",
    stage: 1,
    scheduled: "22 July 2026",
    location: "Bandung, Indonesia",
    amount: "S$280",
    participant: "Ahmad bin Yusuf",
    quantity: "1 cow share",
    vendor: "Rahmah Services",
    next: "The assigned vendor must accept the service before fulfilment begins.",
  },
  {
    id: "quran",
    reference: "ASB-260719-021",
    service: "Wakaf Quran",
    summary: "40 Qurans",
    status: "Proof under review",
    statusClass: "vendor-status-proof_submitted",
    stage: 3,
    scheduled: "19 July 2026",
    location: "Lombok, Indonesia",
    amount: "S$240",
    participant: "In memory of Fatimah Rahimah",
    quantity: "40 Qurans",
    vendor: "Rahmah Services",
    next: "The proof bundle is with our team. Approved media and documents will appear after review.",
  },
];

const nav: { section: CustomerSection; label: string; count?: string }[] = [
  { section: "overview", label: "Overview" },
  { section: "orders", label: "Orders", count: "2" },
  { section: "documents", label: "Receipts & proof", count: "3" },
  { section: "support", label: "Help & reports" },
];

const sectionCopy: Record<CustomerSection, { title: string; summary: string }> = {
  overview: { title: "Overview", summary: "One service is waiting for vendor confirmation." },
  orders: { title: "Orders", summary: "Follow every service from payment to verified proof." },
  documents: { title: "Receipts & proof", summary: "Three completion records are ready to view." },
  support: { title: "Help & reports", summary: "Keep every support request connected to its order." },
};

export function CustomerDashboard() {
  const [section, setSection] = useState<CustomerSection>("overview");
  const [selectedOrderId, setSelectedOrderId] = useState(orders[0].id);
  const selectedOrder = orders.find((order) => order.id === selectedOrderId) || orders[0];

  function openOrder(id: string) {
    setSelectedOrderId(id);
    setSection("orders");
  }

  return (
    <main className="vendor-workspace customer-workspace min-h-screen lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
      <aside className="vendor-sidebar hidden h-screen flex-col p-5 text-white lg:sticky lg:top-0 lg:flex">
        <Brand inverse />
        <div className="mt-11">
          <span className="vendor-sidebar-label">Your account</span>
          <nav className="mt-3 grid gap-1" aria-label="Customer account">
            {nav.map((item) => (
              <button type="button" aria-pressed={section === item.section} className={`vendor-nav-button ${section === item.section ? "is-active" : ""}`} key={item.section} onClick={() => setSection(item.section)}>
                <span>{item.label}</span>{item.count && <small>{item.count}</small>}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto border-t border-white/10 pt-5">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--teal)] text-[.68rem] font-black">YR</span>
            <span><strong className="block text-sm">Yusuf Rahman</strong><small className="text-[.68rem] text-white/60">Customer account</small></span>
          </div>
          <p className="mt-4 text-[.68rem] leading-5 text-white/55"><span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />Preview data only</p>
          <div className="mt-4 flex items-center gap-4 text-[.72rem] font-bold text-white/65"><Link href="/">Public site</Link><form action={logout}><button className="cursor-pointer border-0 bg-transparent p-0 text-inherit" type="submit">Log out</button></form></div>
        </div>
      </aside>

      <section className="min-w-0 pb-24 lg:pb-0">
        <header className="sticky top-0 z-30 flex min-h-[66px] items-center justify-between border-b border-[var(--line)] bg-[rgba(247,247,243,.96)] px-4 backdrop-blur-md lg:hidden">
          <Brand compact />
          <span className="text-xs font-bold text-[var(--muted)]">{sectionCopy[section].title}</span>
        </header>

        <div className="mx-auto max-w-[1220px] px-4 py-6 md:px-7 lg:px-8 lg:py-8">
          {section === "overview" && <Overview onOpenOrder={openOrder} />}
          {section === "orders" && <OrdersView selectedOrder={selectedOrder} onSelect={setSelectedOrderId} />}
          {section === "documents" && <DocumentsView />}
          {section === "support" && <SupportView />}
        </div>
      </section>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-[var(--line)] bg-white/95 lg:hidden" aria-label="Customer account">
        {nav.map((item) => (
          <button type="button" aria-pressed={section === item.section} className={`flex min-h-16 flex-1 flex-col items-center justify-center gap-1 px-1 text-[.65rem] font-bold ${section === item.section ? "text-[var(--teal)]" : "text-[var(--muted)]"}`} key={item.section} onClick={() => setSection(item.section)}>
            <span className={`h-1.5 w-1.5 rounded-full ${section === item.section ? "bg-[var(--teal)]" : "bg-[var(--line)]"}`} />
            {item.section === "documents" ? "Documents" : item.section === "support" ? "Help" : item.label}
          </button>
        ))}
      </nav>
    </main>
  );
}

function PageHeader({ eyebrow, title, summary, action }: { eyebrow: string; title: string; summary: string; action?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-start gap-4 border-b border-[var(--line)] pb-5">
      <div><p className="vendor-kicker">{eyebrow}</p><h1 className="display mt-1 text-[clamp(2.15rem,4vw,3.35rem)] leading-none">{title}</h1><p className="mt-2 text-sm text-[var(--muted)]">{summary}</p></div>
      {action && <div className="ml-auto">{action}</div>}
    </header>
  );
}

function Overview({ onOpenOrder }: { onOpenOrder: (id: string) => void }) {
  return (
    <>
      <PageHeader eyebrow="Assalamu'alaikum, Yusuf" title="Your amanah, at a glance." summary="See what needs attention and what has already been completed." action={<Link className="btn btn-small" href="/services">Choose a service <span aria-hidden="true">→</span></Link>} />

      <section className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Account summary">
        {[['Active orders', '1', 'in fulfilment'], ['Completed', '3', 'services'], ['Documents ready', '3', 'verified records'], ['Total entrusted', 'S$820', 'across services']].map(([label, value, detail]) => (
          <article className="vendor-panel p-4" key={label}><span className="vendor-field-label">{label}</span><strong className="display mt-2 block text-[1.8rem] leading-none tabular-nums">{value}</strong><small className="mt-2 block text-[.68rem] text-[var(--muted)]">{detail}</small></article>
        ))}
      </section>

      <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_310px]">
        <section className="vendor-panel overflow-hidden" aria-labelledby="recent-orders-title">
          <div className="flex items-center border-b border-[var(--line)] px-4 py-3"><h2 id="recent-orders-title" className="text-sm font-semibold">Recent orders</h2><button type="button" className="ml-auto text-xs font-bold text-[var(--teal)]" onClick={() => onOpenOrder(orders[0].id)}>View all →</button></div>
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-[var(--line)] text-[.65rem] uppercase tracking-[.12em] text-[var(--muted)]"><th className="px-4 py-2.5">Service</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5">Date</th><th className="px-4 py-2.5 text-right">Amount</th></tr></thead>
              <tbody>{orders.map((order) => <tr className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--teal-soft)]" key={order.id}><td className="px-4 py-3"><button type="button" className="text-left" onClick={() => onOpenOrder(order.id)}><strong className="block text-sm">{order.service}</strong><small className="text-[var(--muted)]">{order.reference}</small></button></td><td className="px-4 py-3"><span className={`vendor-status ${order.statusClass}`}>{order.status}</span></td><td className="px-4 py-3 text-xs text-[var(--muted)]">{order.scheduled}</td><td className="px-4 py-3 text-right font-semibold">{order.amount}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="divide-y divide-[var(--line)] sm:hidden">{orders.map((order) => <button type="button" className="flex w-full items-center gap-3 p-4 text-left" key={order.id} onClick={() => onOpenOrder(order.id)}><span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-[var(--teal-soft)] text-xs font-black text-[var(--teal)]">{order.service.slice(0, 2).toUpperCase()}</span><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{order.service}</strong><small className="block truncate text-[var(--muted)]">{order.status}</small></span><strong className="text-sm">{order.amount}</strong></button>)}</div>
        </section>

        <aside className="grid gap-4">
          <section className="vendor-panel p-5">
            <p className="vendor-kicker">Action next</p><h2 className="mt-2 text-lg font-semibold">Vendor confirmation</h2><p className="mt-2 text-xs leading-6 text-[var(--muted)]">Your Korban order is paid and assigned. We will notify you when the vendor accepts it.</p><button type="button" className="text-link mt-5" onClick={() => onOpenOrder("korban")}>Open order <span>→</span></button>
          </section>
          <section className="vendor-panel p-5">
            <p className="vendor-kicker">Latest document</p><h2 className="mt-2 text-lg font-semibold">Wakaf Quran proof</h2><p className="mt-2 text-xs leading-6 text-[var(--muted)]">The media bundle is under review before release.</p><span className="vendor-status vendor-status-proof_submitted mt-4">Under review</span>
          </section>
        </aside>
      </div>
    </>
  );
}

function OrdersView({ selectedOrder, onSelect }: { selectedOrder: CustomerOrder; onSelect: (id: string) => void }) {
  return (
    <>
      <PageHeader eyebrow="Your services" title="Orders" summary="Every payment, handoff and proof update stays connected to one record." />
      <div className="mt-5 grid items-start gap-4 xl:grid-cols-[330px_minmax(0,1fr)]">
        <section className="vendor-panel overflow-hidden">
          <div className="border-b border-[var(--line)] p-4"><h2 className="text-sm font-semibold">Order history</h2><p className="mt-1 text-xs text-[var(--muted)]">2 records</p></div>
          <div className="divide-y divide-[var(--line)]">{orders.map((order) => <button type="button" aria-current={selectedOrder.id === order.id ? "true" : undefined} className={`w-full p-4 text-left transition ${selectedOrder.id === order.id ? "bg-[var(--teal-soft)]" : "hover:bg-[var(--cream)]"}`} key={order.id} onClick={() => onSelect(order.id)}><span className="flex items-center justify-between gap-3"><span className={`vendor-status ${order.statusClass}`}>{order.status}</span><strong>{order.amount}</strong></span><strong className="mt-3 block text-sm">{order.service}</strong><small className="mt-1 block text-[var(--muted)]">{order.reference} · {order.location}</small></button>)}</div>
        </section>
        <OrderRecord order={selectedOrder} />
      </div>
    </>
  );
}

function OrderRecord({ order }: { order: CustomerOrder }) {
  const trail = ["Order confirmed", "Vendor assigned", "Service fulfilment", "Proof and receipt"];
  return (
    <article className="vendor-record">
      <div className="vendor-record-header"><div className="flex flex-wrap items-center justify-between gap-3"><span className={`vendor-status ${order.statusClass}`}>{order.status}</span><span className="text-xs font-semibold text-[var(--muted)] tabular-nums">{order.reference}</span></div><h2 className="display mt-5 text-[clamp(2rem,4vw,3.25rem)] leading-none">{order.service}</h2><p className="mt-2 text-sm text-[var(--muted)]">{order.summary} · {order.location}</p></div>
      <section className="border-y border-[var(--line)] px-5 py-5 md:px-6"><span className="vendor-kicker">Amanah trail</span><ol className="vendor-amanah" aria-label="Order progress">{trail.map((label, index) => { const complete = index < order.stage; const current = index === order.stage; return <li className={`${complete ? "is-complete" : ""} ${current ? "is-current" : ""}`} aria-current={current ? "step" : undefined} key={label}><span className="vendor-amanah-marker">{complete ? "✓" : index + 1}</span><span><strong>{label}</strong><small>{complete ? "Complete" : current ? "Current stage" : "Upcoming"}</small></span></li>; })}</ol></section>
      <section className="vendor-record-section"><div className="flex items-end justify-between gap-4"><div><p className="vendor-kicker">Order details</p><h3 className="mt-1 text-lg font-semibold">Scheduled for {order.scheduled.replace(" 2026", "")}</h3></div><strong className="text-lg text-[var(--teal)]">{order.amount}</strong></div><dl className="vendor-facts mt-5">{[['Participant', order.participant], ['Quantity', order.quantity], ['Payment', 'Paid'], ['Vendor', order.vendor]].map(([term, detail]) => <div key={term}><dt>{term}</dt><dd>{detail}</dd></div>)}</dl></section>
      <section className="vendor-proof"><p className="vendor-kicker text-[var(--teal)]">What happens next</p><h3 className="mt-1 text-lg font-semibold">Your record moves only after verification</h3><p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">{order.next}</p></section>
    </article>
  );
}

function DocumentsView() {
  const documents = [
    ["Completion receipt", "Food for Orphans", "ASB-260715-009", "Ready", "vendor-status-completed"],
    ["Payment receipt", "Korban overseas", "ASB-260722-014", "Ready", "vendor-status-completed"],
    ["Proof bundle", "Wakaf Quran", "ASB-260719-021", "Under review", "vendor-status-proof_submitted"],
  ] as const;
  return (
    <>
      <PageHeader eyebrow="Verified records" title="Receipts & proof" summary="Documents appear here only after the relevant operational review." />
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{documents.map(([type, service, reference, status, statusClass]) => <article className="vendor-panel flex min-h-64 flex-col p-5" key={`${type}-${reference}`}><div className="flex items-start justify-between gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--teal-soft)] font-black text-[var(--teal)]">AS</span><span className={`vendor-status ${statusClass}`}>{status}</span></div><p className="vendor-kicker mt-8">{type}</p><h2 className="mt-2 text-lg font-semibold">{service}</h2><p className="mt-2 text-xs text-[var(--muted)]">{reference}</p><p className="mt-auto pt-6 text-xs leading-6 text-[var(--muted)]">{status === "Ready" ? "The verified record will be downloadable when document generation is connected." : "Our team is checking the submitted photos and video."}</p></article>)}</div>
    </>
  );
}

function SupportView() {
  return (
    <>
      <PageHeader eyebrow="Customer support" title="Help & reports" summary="Choose the relevant order so the team receives the right context immediately." />
      <section className="vendor-panel mt-5 overflow-hidden" aria-labelledby="help-reports-title"><div className="grid gap-px bg-[var(--line)] lg:grid-cols-[.72fr_1.28fr]"><div className="bg-[var(--teal-soft)] p-5 md:p-7"><p className="vendor-kicker">Connected support</p><h2 id="help-reports-title" className="display mt-2 text-[clamp(2rem,4vw,3rem)] leading-none">Keep support connected to the order.</h2><p className="mt-4 max-w-md text-sm leading-7 text-[var(--muted)]">Explain what the team should check. Your order reference stays attached to the request.</p><div className="mt-7 border-t border-[rgba(29,115,127,.18)] pt-5 text-xs leading-6 text-[var(--muted)]"><strong className="block text-[var(--ink)]">For urgent coordination</strong><a className="font-bold text-[var(--teal)]" href="tel:+6589933786">+65 8993 3786</a></div></div><div className="bg-white p-5 md:p-7"><CustomerReportForm /></div></div></section>
    </>
  );
}
