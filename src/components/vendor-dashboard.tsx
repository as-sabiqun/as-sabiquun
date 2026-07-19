"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Brand } from "@/components/brand";
import { transitionDemoVendorJob, type VendorDemoAction, type VendorDemoStatus } from "@/lib/domain";

type VendorJob = {
  id: string;
  reference: string;
  service: string;
  summary: string;
  location: string;
  scheduled: string;
  payout: string;
  quantity: string;
  customer: string;
  phone: string;
  participant: string;
  notes: string;
  respondBy?: string;
  status: VendorDemoStatus;
  proofGuide: string[];
};

type VendorReport = { id: string; job: string; type: string; message: string; status: "Open" | "Resolved" };
type JobFilter = "all" | "pending" | "active" | "proof_submitted" | "completed";

const initialJobs: VendorJob[] = [
  {
    id: "job-korban",
    reference: "ASB-260722-014",
    service: "Korban",
    summary: "Overseas cow share",
    location: "Bandung, Indonesia",
    scheduled: "22 July 2026",
    payout: "S$210",
    quantity: "1 share",
    customer: "Yusuf Rahman",
    phone: "+65 8123 4567",
    participant: "Ahmad bin Yusuf",
    notes: "Nameplate requested. Keep the participant name visible in the completion media.",
    respondBy: "Today, 6:00 PM · 3h 42m left",
    status: "pending",
    proofGuide: ["Nameplate before fulfilment", "One clear completion photo", "One short landscape video"],
  },
  {
    id: "job-water",
    reference: "ASB-260728-006",
    service: "Wakaf Water Pump",
    summary: "Community hand-pump installation",
    location: "Kampong Cham, Cambodia",
    scheduled: "28 July 2026",
    payout: "S$480",
    quantity: "1 installation",
    customer: "Nur Aisyah",
    phone: "+65 8777 2361",
    participant: "Family of Haji Musa",
    notes: "Use the supplied English nameplate and include a wide photo of the completed site.",
    status: "active",
    proofGuide: ["Installed pump with nameplate", "Water-flow test photo", "15–30 second working video"],
  },
  {
    id: "job-quran",
    reference: "ASB-260719-021",
    service: "Wakaf Quran",
    summary: "Quran distribution",
    location: "Lombok, Indonesia",
    scheduled: "19 July 2026",
    payout: "S$160",
    quantity: "40 Qurans",
    customer: "Muhammad Firdaus",
    phone: "+65 9012 1184",
    participant: "In memory of Fatimah Rahimah",
    notes: "Proof was submitted and is waiting for the As-Sābiqūn team to review.",
    status: "proof_submitted",
    proofGuide: ["Books with dedication card", "Distribution group photo", "Recipient-safe short video"],
  },
  {
    id: "job-orphans",
    reference: "ASB-260715-009",
    service: "Food for Orphans",
    summary: "Community meal programme",
    location: "Batam, Indonesia",
    scheduled: "15 July 2026",
    payout: "S$320",
    quantity: "80 meal packs",
    customer: "Siti Mariam",
    phone: "+65 8334 9021",
    participant: "General contribution",
    notes: "Completed and verified by the admin team.",
    status: "completed",
    proofGuide: ["Prepared meal packs", "Delivery handoff", "Privacy-safe programme photo"],
  },
];

const statusLabels: Record<VendorDemoStatus, string> = {
  pending: "Pending response",
  active: "In progress",
  proof_submitted: "Awaiting review",
  completed: "Completed",
  declined: "Declined",
};

const filters: { value: JobFilter; label: string }[] = [
  { value: "all", label: "All jobs" },
  { value: "pending", label: "Pending" },
  { value: "active", label: "In progress" },
  { value: "proof_submitted", label: "Review" },
  { value: "completed", label: "Completed" },
];

function StatusBadge({ status }: { status: VendorDemoStatus }) {
  return <span className={`vendor-status vendor-status-${status}`}>{statusLabels[status]}</span>;
}

function AmanahRail({ status }: { status: VendorDemoStatus }) {
  const stages = ["Accepted", "Work in progress", "Proof submitted", "Admin verified"];
  const current = status === "pending" || status === "declined" ? -1 : status === "active" ? 1 : status === "proof_submitted" ? 2 : 3;

  return (
    <div className="mt-6 grid">
      {stages.map((stage, index) => {
        const complete = current > index || status === "completed";
        const active = current === index;
        return (
          <div className="grid grid-cols-[28px_1fr] gap-3" key={stage}>
            <div className="flex flex-col items-center">
              <span className={`grid h-7 w-7 place-items-center rounded-full border text-[.65rem] font-black ${complete ? "border-[var(--teal)] bg-[var(--teal)] text-white" : active ? "border-[var(--gold)] bg-[var(--cream)] text-[var(--ink)]" : "border-[var(--line)] bg-white text-[var(--muted)]"}`}>{complete ? "✓" : index + 1}</span>
              {index < stages.length - 1 && <span className={`h-9 w-px ${complete ? "bg-[var(--teal)]" : "bg-[var(--line)]"}`} />}
            </div>
            <div className="pt-1"><strong className={`block text-sm ${active ? "text-[var(--ink)]" : "text-[var(--muted)]"}`}>{stage}</strong>{active && <small className="mt-1 block text-[.68rem] text-[var(--teal)]">Current stage</small>}</div>
          </div>
        );
      })}
    </div>
  );
}

export function VendorDashboard() {
  const [jobs, setJobs] = useState(initialJobs);
  const [selectedId, setSelectedId] = useState(initialJobs[0].id);
  const [filter, setFilter] = useState<JobFilter>("all");
  const [section, setSection] = useState<"jobs" | "reports">("jobs");
  const [proofFile, setProofFile] = useState("");
  const [notice, setNotice] = useState("");
  const [reportCreated, setReportCreated] = useState(false);
  const [reports, setReports] = useState<VendorReport[]>([
    { id: "report-1", job: "ASB-260728-006", type: "Schedule", message: "Installation moved by one day due to site access.", status: "Resolved" },
  ]);

  const visibleJobs = filter === "all" ? jobs : jobs.filter((job) => job.status === filter);
  const selectedJob = jobs.find((job) => job.id === selectedId) || jobs[0];
  const count = (status: VendorDemoStatus) => jobs.filter((job) => job.status === status).length;

  function updateJob(action: VendorDemoAction) {
    const nextStatus = transitionDemoVendorJob(selectedJob.status, action);
    setJobs((current) => current.map((job) => job.id === selectedJob.id ? { ...job, status: nextStatus } : job));
    setFilter("all");
    setProofFile("");
    setNotice(action === "accept" ? "Job accepted and moved to in progress." : action === "decline" ? "Job declined. The admin can reassign it." : "Proof prepared for admin review.");
  }

  function createReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setReports((current) => [{
      id: String(Date.now()),
      job: String(data.get("job")),
      type: String(data.get("type")),
      message: String(data.get("message")),
      status: "Open",
    }, ...current]);
    form.reset();
    setReportCreated(true);
  }

  function openJob(id: string) {
    setSelectedId(id);
    setProofFile("");
    setNotice("");
  }

  function changeFilter(nextFilter: JobFilter) {
    const nextJobs = nextFilter === "all" ? jobs : jobs.filter((job) => job.status === nextFilter);
    setFilter(nextFilter);
    if (nextJobs.length && !nextJobs.some((job) => job.id === selectedId)) openJob(nextJobs[0].id);
  }

  return (
    <main className="min-h-screen bg-[var(--cream)] lg:grid lg:grid-cols-[252px_minmax(0,1fr)]">
      <aside className="hidden h-screen flex-col bg-[var(--ink)] p-6 text-white lg:sticky lg:top-0 lg:flex">
        <Brand inverse />
        <div className="mt-10 rounded-2xl border border-white/10 bg-white/[.05] p-4">
          <span className="text-[.58rem] font-black uppercase tracking-[.14em] text-white/60">Vendor preview</span>
          <p className="mt-2 text-xs leading-5 text-white/75">Actions reset when this page refreshes.</p>
        </div>
        <nav className="mt-9 grid gap-2" aria-label="Vendor workspace">
          <button aria-pressed={section === "jobs"} className={`vendor-nav-button ${section === "jobs" ? "is-active" : ""}`} onClick={() => setSection("jobs")}><span>Job queue</span><small>{jobs.length}</small></button>
          <button aria-pressed={section === "reports"} className={`vendor-nav-button ${section === "reports" ? "is-active" : ""}`} onClick={() => setSection("reports")}><span>Reports</span><small>{reports.filter((report) => report.status === "Open").length}</small></button>
        </nav>
        <div className="mt-auto border-t border-white/10 pt-5">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--teal)] text-xs font-black">RS</span><span><strong className="block text-sm">Rahmah Services</strong><small className="text-[.65rem] text-white/55">Demo vendor</small></span></div>
          <div className="mt-5 flex gap-4 text-xs font-bold text-white/65"><Link href="/">Public site</Link><Link href="/login">Log out</Link></div>
        </div>
      </aside>

      <section className="min-w-0">
        <header className="sticky top-0 z-30 flex min-h-[70px] items-center justify-between border-b border-[var(--line)] bg-[rgba(247,247,243,.94)] px-4 backdrop-blur-md lg:hidden">
          <Brand compact />
          <nav className="flex gap-1" aria-label="Vendor workspace">
            <button aria-pressed={section === "jobs"} className={`rounded-full px-3 py-2 text-xs font-bold ${section === "jobs" ? "bg-[var(--teal)] text-white" : "text-[var(--muted)]"}`} onClick={() => setSection("jobs")}>Jobs</button>
            <button aria-pressed={section === "reports"} className={`rounded-full px-3 py-2 text-xs font-bold ${section === "reports" ? "bg-[var(--teal)] text-white" : "text-[var(--muted)]"}`} onClick={() => setSection("reports")}>Reports</button>
          </nav>
        </header>

        <div className="border-b border-[var(--line)] bg-white px-5 py-4 md:px-8">
          <div className="mx-auto flex max-w-[1450px] flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-bold text-[var(--muted)]"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[var(--gold)]"></span>No-auth demo workspace</p>
            <div className="flex items-center gap-3 text-xs text-[var(--muted)]"><span>Sunday, 19 July 2026</span><Link className="font-bold text-[var(--teal)]" href="/login">Switch workspace</Link></div>
          </div>
        </div>

        <div className="mx-auto max-w-[1450px] p-5 md:p-8 lg:p-10">
          {section === "jobs" ? (
            <>
              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
                <div><p className="eyebrow">Vendor workspace</p><h1 className="display mt-3 text-[clamp(2.6rem,5vw,4.6rem)] leading-[.94]">Your work,<br /><span className="text-[var(--teal)]">clearly queued.</span></h1></div>
                <p className="max-w-sm text-sm leading-7 text-[var(--muted)]">Review the next handoff, keep each service on track, and return clear proof to the team.</p>
              </div>

              <div className="my-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[["Pending response", count("pending")], ["In progress", count("active")], ["Awaiting review", count("proof_submitted")], ["Completed", count("completed")]].map(([label, value]) => (
                  <article className="card p-5" key={label}><span className="text-[.63rem] font-black uppercase tracking-[.12em] text-[var(--muted)]">{label}</span><strong className="display mt-3 block text-4xl text-[var(--teal)]">{value}</strong></article>
                ))}
              </div>

              <div className="grid items-start gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
                <section className={`card overflow-hidden ${visibleJobs.length ? "" : "xl:col-span-2"}`}>
                  <div className="border-b border-[var(--line)] p-5">
                    <div className="flex items-center justify-between"><h2 className="display text-2xl">Job queue</h2><span className="text-xs text-[var(--muted)]">{visibleJobs.length} shown</span></div>
                    <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                      {filters.map((item) => <button aria-pressed={filter === item.value} className={`shrink-0 rounded-full border px-3 py-2 text-[.68rem] font-bold ${filter === item.value ? "border-[var(--teal)] bg-[var(--teal)] text-white" : "border-[var(--line)] text-[var(--muted)]"}`} key={item.value} onClick={() => changeFilter(item.value)}>{item.label}</button>)}
                    </div>
                  </div>
                  <div className="grid max-h-[760px] overflow-y-auto">
                    {visibleJobs.length ? visibleJobs.map((job) => (
                      <button aria-current={selectedId === job.id ? "true" : undefined} className={`vendor-job-row ${selectedId === job.id ? "is-selected" : ""}`} key={job.id} onClick={() => openJob(job.id)}>
                        <div className="flex items-center justify-between gap-3"><StatusBadge status={job.status} /><span className="text-xs font-black text-[var(--ink)]">{job.payout}</span></div>
                        <strong className="display mt-4 block text-left text-xl">{job.service}</strong>
                        <span className="mt-1 block text-left text-xs leading-5 text-[var(--muted)]">{job.summary} · {job.location}</span>
                        <span className="mt-4 flex items-center justify-between text-[.65rem] font-bold text-[var(--muted)]"><span>{job.reference}</span><span aria-hidden="true">→</span></span>
                      </button>
                    )) : (
                      <div className="p-8 text-center"><strong className="display block text-2xl">No jobs in this view.</strong><p className="mt-2 text-xs leading-5 text-[var(--muted)]">Choose another status or return to all jobs.</p><button className="btn btn-secondary btn-small mt-5" onClick={() => changeFilter("all")}>View all jobs</button></div>
                    )}
                  </div>
                </section>

                {visibleJobs.length > 0 && <section className="grid gap-5">
                  <article className="card overflow-hidden">
                    <div className="border-b border-[var(--line)] bg-[var(--teal-soft)] p-6 md:p-8">
                      <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><StatusBadge status={selectedJob.status} /><span className="text-xs font-bold text-[var(--muted)]">{selectedJob.reference}</span></div><strong className="display text-3xl text-[var(--teal)]">{selectedJob.payout}</strong></div>
                      <h2 className="display mt-7 text-[clamp(2.1rem,4vw,3.7rem)] leading-[.96]">{selectedJob.service}</h2>
                      <p className="mt-3 text-sm text-[var(--muted)]">{selectedJob.summary}</p>
                    </div>

                    <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-[1fr_290px]">
                      <div>
                        {selectedJob.status === "pending" && (
                          <div className="mb-8 rounded-2xl border border-[var(--gold)]/35 bg-[#f0eadf] p-5">
                            <span className="text-[.63rem] font-black uppercase tracking-[.12em] text-[var(--muted)]">Response required</span>
                            <strong className="mt-2 block text-sm">{selectedJob.respondBy}</strong>
                            <p className="mt-3 text-xs leading-6 text-[var(--muted)]">Accept only if your team can complete the service and evidence checklist.</p>
                            <div className="mt-5 flex flex-wrap gap-2"><button className="btn btn-small" onClick={() => updateJob("accept")}>Accept job</button><button className="btn btn-secondary btn-small" onClick={() => updateJob("decline")}>Decline</button></div>
                          </div>
                        )}
                        {selectedJob.status === "declined" && <div className="mb-8 rounded-2xl border border-[var(--line)] bg-[var(--cream)] p-5"><strong className="text-sm">Job declined</strong><p className="mt-2 text-xs leading-5 text-[var(--muted)]">The admin can now allocate this work to another vendor.</p></div>}
                        {notice && <p role="status" className="mb-7 rounded-xl bg-[var(--teal-soft)] p-4 text-sm font-bold text-[var(--teal)]">{notice}</p>}

                        <p className="text-[.63rem] font-black uppercase tracking-[.13em] text-[var(--muted)]">Fulfilment details</p>
                        <dl className="mt-4 grid gap-px overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2">
                          {[["Location", selectedJob.location], ["Scheduled", selectedJob.scheduled], ["Quantity", selectedJob.quantity], ["Vendor payout", selectedJob.payout]].map(([term, detail]) => <div className="bg-white p-4" key={term}><dt className="text-[.6rem] font-black uppercase tracking-[.1em] text-[var(--muted)]">{term}</dt><dd className="mt-2 text-sm font-bold">{detail}</dd></div>)}
                        </dl>

                        <div className="mt-8 grid gap-5 md:grid-cols-2">
                          <section className="rounded-2xl border border-[var(--line)] p-5"><span className="text-[.62rem] font-black uppercase tracking-[.11em] text-[var(--muted)]">Customer contact</span><strong className="mt-3 block text-sm">{selectedJob.customer}</strong><a className="mt-2 inline-block text-sm font-bold text-[var(--teal)]" href={`tel:${selectedJob.phone.replaceAll(" ", "")}`}>{selectedJob.phone}</a></section>
                          <section className="rounded-2xl border border-[var(--line)] p-5"><span className="text-[.62rem] font-black uppercase tracking-[.11em] text-[var(--muted)]">Participant / dedication</span><strong className="mt-3 block text-sm leading-6">{selectedJob.participant}</strong></section>
                        </div>
                        <section className="mt-5 rounded-2xl border border-[var(--line)] p-5"><span className="text-[.62rem] font-black uppercase tracking-[.11em] text-[var(--muted)]">Service notes</span><p className="mt-3 text-sm leading-7 text-[var(--muted)]">{selectedJob.notes}</p></section>

                        {(selectedJob.status === "active" || selectedJob.status === "proof_submitted" || selectedJob.status === "completed") && (
                          <section className="mt-8 rounded-2xl border border-dashed border-[var(--teal)] bg-[var(--teal-soft)] p-5 md:p-6">
                            <div className="flex flex-wrap items-start justify-between gap-3"><div><span className="text-[.62rem] font-black uppercase tracking-[.12em] text-[var(--teal)]">Completion proof</span><h3 className="display mt-2 text-2xl">Prepare the evidence bundle.</h3></div>{selectedJob.status !== "active" && <StatusBadge status={selectedJob.status} />}</div>
                            <ul className="mt-5 grid gap-2 text-xs leading-5 text-[var(--muted)]">{selectedJob.proofGuide.map((item) => <li className="flex gap-2" key={item}><span className="text-[var(--teal)]">✓</span>{item}</li>)}</ul>
                            {selectedJob.status === "active" ? <form className="mt-6 grid gap-3" onSubmit={(event) => { event.preventDefault(); updateJob("submit_proof"); }}><label className="label">Photo or short video<input className="input bg-white" type="file" accept="image/jpeg,image/png,image/webp,video/mp4" required onChange={(event) => setProofFile(event.target.files?.[0]?.name || "")} /></label>{proofFile && <p className="text-xs font-bold text-[var(--teal)]">Ready: {proofFile}</p>}<button className="btn btn-small justify-self-start" disabled={!proofFile}>Submit proof for review</button><p className="text-[.65rem] leading-5 text-[var(--muted)]">Demo only: the file stays on this device and is not uploaded.</p></form> : <p className="mt-5 text-xs leading-6 text-[var(--muted)]">{selectedJob.status === "proof_submitted" ? "The As-Sābiqūn admin will verify the evidence before closing this job." : "The evidence has been verified and the job is closed."}</p>}
                          </section>
                        )}
                      </div>

                      <aside>
                        <div className="rounded-2xl border border-[var(--line)] bg-[var(--cream)] p-5"><span className="text-[.62rem] font-black uppercase tracking-[.12em] text-[var(--muted)]">Amanah trail</span><AmanahRail status={selectedJob.status} /></div>
                        <button className="mt-4 w-full rounded-2xl border border-[var(--line)] bg-white p-4 text-left text-sm font-bold transition hover:border-[var(--gold)]" onClick={() => { setSection("reports"); setReportCreated(false); }}>Report a problem <span className="float-right" aria-hidden="true">→</span></button>
                      </aside>
                    </div>
                  </article>
                </section>}
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="eyebrow">Vendor support</p><h1 className="display mt-3 text-[clamp(2.6rem,5vw,4.6rem)] leading-[.94]">Reports and<br /><span className="text-[var(--teal)]">operational issues.</span></h1></div><p className="max-w-sm text-sm leading-7 text-[var(--muted)]">Tie every issue to its job so the admin can respond with the right context.</p></div>
              <div className="mt-9 grid items-start gap-6 lg:grid-cols-[.85fr_1.15fr]">
                <form className="card grid gap-5 p-6 md:p-8" onSubmit={createReport}>
                  <div><span className="status">Demo report</span><h2 className="display mt-3 text-3xl">Report a problem</h2></div>
                  <label className="label">Related job<select className="input" name="job" defaultValue={selectedJob.reference}>{jobs.map((job) => <option key={job.id} value={job.reference}>{job.reference} · {job.service}</option>)}</select></label>
                  <label className="label">Issue type<select className="input" name="type"><option>Schedule</option><option>Customer details</option><option>Location or access</option><option>Proof upload</option><option>Other</option></select></label>
                  <label className="label">What happened?<textarea className="input min-h-36 resize-y" name="message" minLength={10} required placeholder="Explain the issue and what help you need." /></label>
                  <button className="btn">Create report</button>
                  {reportCreated && <p role="status" className="rounded-xl bg-[var(--teal-soft)] p-4 text-sm font-bold text-[var(--teal)]">Report created for the admin team.</p>}
                </form>
                <section className="card overflow-hidden"><div className="border-b border-[var(--line)] p-6"><div className="flex items-center justify-between"><h2 className="display text-2xl">Your reports</h2><span className="text-xs text-[var(--muted)]">{reports.length} total</span></div></div><div className="grid">{reports.map((report) => <article className="border-b border-[var(--line)] p-6 last:border-0" key={report.id}><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="status">{report.status}</span><strong className="text-xs">{report.job}</strong></div><span className="text-xs font-bold text-[var(--muted)]">{report.type}</span></div><p className="mt-4 text-sm leading-7 text-[var(--muted)]">{report.message}</p></article>)}</div></section>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
