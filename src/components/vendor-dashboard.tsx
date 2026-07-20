"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { logout } from "@/app/actions";
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
  minimumPhotos: number;
  videoRequired: boolean;
};

type VendorReport = { id: string; job: string; type: string; message: string; status: "Open" | "Resolved" };
type JobFilter = "all" | VendorDemoStatus;

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
    respondBy: "Respond by 20 July, 18:00 SGT",
    status: "pending",
    proofGuide: ["Nameplate before fulfilment", "One clear completion photo", "One short landscape video"],
    minimumPhotos: 2,
    videoRequired: true,
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
    minimumPhotos: 2,
    videoRequired: true,
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
    minimumPhotos: 2,
    videoRequired: false,
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
    minimumPhotos: 2,
    videoRequired: false,
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
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "active", label: "In progress" },
  { value: "proof_submitted", label: "Awaiting review" },
  { value: "completed", label: "Completed" },
  { value: "declined", label: "Declined" },
];

const summaryStatuses = [
  ["pending", "Response due"],
  ["active", "In progress"],
  ["proof_submitted", "Awaiting review"],
  ["completed", "Completed"],
] as const;

function StatusBadge({ status }: { status: VendorDemoStatus }) {
  return <span className={`vendor-status vendor-status-${status}`}>{statusLabels[status]}</span>;
}

function AmanahRail({ status }: { status: VendorDemoStatus }) {
  const stages = ["Accept assignment", "Fulfil service", "Submit proof", status === "completed" ? "Admin verified" : "Admin review"];
  const current = status === "pending" ? 0 : status === "active" ? 1 : status === "proof_submitted" ? 3 : -1;

  return (
    <ol className="vendor-amanah" aria-label="Amanah fulfilment progress">
      {stages.map((stage, index) => {
        const complete = index < current || status === "completed";
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

export function VendorDashboard() {
  const [jobs, setJobs] = useState(initialJobs);
  const [selectedId, setSelectedId] = useState(initialJobs[0].id);
  const [filter, setFilter] = useState<JobFilter>("all");
  const [section, setSection] = useState<"jobs" | "reports">("jobs");
  const [detailOpen, setDetailOpen] = useState(false);
  const [proofFiles, setProofFiles] = useState<{ photos: string[]; video: string }>({ photos: [], video: "" });
  const [notice, setNotice] = useState("");
  const [reportCreated, setReportCreated] = useState(false);
  const [reports, setReports] = useState<VendorReport[]>([
    { id: "report-1", job: "ASB-260728-006", type: "Location or access", message: "The site contact moved installation access to the following morning. Please confirm the revised handover time with the customer.", status: "Open" },
  ]);

  const visibleJobs = filter === "all" ? jobs : jobs.filter((job) => job.status === filter);
  const selectedJob = jobs.find((job) => job.id === selectedId) || jobs[0];
  const count = (status: VendorDemoStatus) => jobs.filter((job) => job.status === status).length;
  const openReports = reports.filter((report) => report.status === "Open").length;
  const proofReady = proofFiles.photos.length >= selectedJob.minimumPhotos && (!selectedJob.videoRequired || Boolean(proofFiles.video));

  function updateJob(action: VendorDemoAction) {
    const nextStatus = transitionDemoVendorJob(selectedJob.status, action);
    setJobs((current) => current.map((job) => job.id === selectedJob.id ? { ...job, status: nextStatus } : job));
    setFilter("all");
    setProofFiles({ photos: [], video: "" });
    setNotice(action === "accept" ? "Job accepted and moved to fulfilment." : action === "decline" ? "Job declined. The admin can reassign it." : "Evidence bundle submitted. Waiting for admin review.");
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
    setDetailOpen(true);
    setProofFiles({ photos: [], video: "" });
    setNotice("");
  }

  function changeFilter(nextFilter: JobFilter) {
    const nextJobs = nextFilter === "all" ? jobs : jobs.filter((job) => job.status === nextFilter);
    setFilter(nextFilter);
    setDetailOpen(false);
    setProofFiles({ photos: [], video: "" });
    setNotice("");
    if (nextJobs.length && !nextJobs.some((job) => job.id === selectedId)) setSelectedId(nextJobs[0].id);
  }

  function showJobs() {
    setSection("jobs");
    setDetailOpen(false);
  }

  function showReports() {
    setSection("reports");
    setReportCreated(false);
  }

  return (
    <main className="vendor-workspace min-h-screen lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
      <aside className="vendor-sidebar hidden h-screen flex-col p-5 text-white lg:sticky lg:top-0 lg:flex">
        <Brand inverse />
        <div className="mt-11">
          <span className="vendor-sidebar-label">Workspace</span>
          <nav className="mt-3 grid gap-1" aria-label="Vendor workspace">
            <button aria-pressed={section === "jobs"} className={`vendor-nav-button ${section === "jobs" ? "is-active" : ""}`} onClick={showJobs}><span>Jobs</span><small>{jobs.length}</small></button>
            <button aria-pressed={section === "reports"} className={`vendor-nav-button ${section === "reports" ? "is-active" : ""}`} onClick={showReports}><span>Reports</span><small>{openReports}</small></button>
          </nav>
        </div>
        <div className="mt-auto border-t border-white/10 pt-5">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--teal)] text-[.68rem] font-black">RS</span>
            <span><strong className="block text-sm">Rahmah Services</strong><small className="text-[.68rem] text-white/60">Vendor account</small></span>
          </div>
          <p className="mt-4 text-[.68rem] leading-5 text-white/55"><span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />Demo mode · Changes reset on refresh</p>
          <div className="mt-4 flex items-center gap-4 text-[.72rem] font-bold text-white/65"><Link href="/">Public site</Link><form action={logout}><button className="cursor-pointer border-0 bg-transparent p-0 text-inherit" type="submit">Log out</button></form></div>
        </div>
      </aside>

      <section className="min-w-0">
        <header className="sticky top-0 z-30 flex min-h-[66px] items-center justify-between border-b border-[var(--line)] bg-[rgba(247,247,243,.95)] px-4 backdrop-blur-md lg:hidden">
          <Brand compact />
          <nav className="flex gap-1" aria-label="Vendor workspace">
            <button aria-pressed={section === "jobs"} className={`vendor-mobile-nav ${section === "jobs" ? "is-active" : ""}`} onClick={showJobs}>Jobs</button>
            <button aria-pressed={section === "reports"} className={`vendor-mobile-nav ${section === "reports" ? "is-active" : ""}`} onClick={showReports}>Reports</button>
          </nav>
        </header>

        <div className="mx-auto max-w-[1500px] px-4 py-6 md:px-7 lg:px-8 lg:py-7">
          <header className="vendor-page-header">
            <div>
              <p className="vendor-kicker">{section === "jobs" ? "Vendor workspace" : "Vendor support"}</p>
              <h1 className="display mt-1 text-[clamp(2.1rem,4vw,3.25rem)] leading-none">{section === "jobs" ? "Jobs" : "Reports"}</h1>
            </div>
            <div className="max-w-md lg:text-right">
              <p className="text-sm font-semibold text-[var(--ink)]">{section === "jobs" ? `${count("pending")} response due` : `${openReports} open report${openReports === 1 ? "" : "s"}`}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{section === "jobs" ? "Review assignments, fulfil services, and return clear proof." : "Record issues against the right assignment for a faster response."}</p>
              <span className="vendor-demo-badge mt-3 lg:hidden">Demo mode · resets on refresh</span>
            </div>
          </header>

          {section === "jobs" ? (
            <>
              <section className="vendor-summary mt-5" aria-label="Job status summary">
                {summaryStatuses.map(([status, label]) => (
                  <button aria-pressed={filter === status} data-status={status} key={status} onClick={() => changeFilter(status)}>
                    <span>{label}</span><strong>{count(status)}</strong>
                  </button>
                ))}
              </section>

              <div className="mt-4 grid items-start gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
                <section className={`vendor-panel vendor-queue flex-col ${detailOpen ? "hidden xl:flex" : "flex"} ${visibleJobs.length ? "" : "xl:col-span-2"}`}>
                  <div className="border-b border-[var(--line)] p-4">
                    <div className="flex items-center justify-between gap-4"><h2 className="text-base font-semibold">Job queue</h2><span className="text-xs text-[var(--muted)]">{visibleJobs.length} shown</span></div>
                    <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Filter jobs">
                      {filters.map((item) => <button aria-pressed={filter === item.value} className="vendor-filter" key={item.value} onClick={() => changeFilter(item.value)}>{item.label}</button>)}
                    </div>
                  </div>
                  <div className="grid xl:max-h-[calc(100vh-250px)] xl:overflow-y-auto">
                    {visibleJobs.length ? visibleJobs.map((job) => (
                      <button aria-current={selectedId === job.id ? "true" : undefined} className={`vendor-job-row ${selectedId === job.id ? "is-selected" : ""}`} key={job.id} onClick={() => openJob(job.id)}>
                        <span className="flex items-center justify-between gap-3"><StatusBadge status={job.status} /><strong className="vendor-money">{job.payout}</strong></span>
                        <strong className="mt-3 block text-left text-[.95rem] font-semibold">{job.service}</strong>
                        <span className="mt-1 block text-left text-xs leading-5 text-[var(--muted)]">{job.status === "pending" && job.respondBy ? job.respondBy : `Scheduled ${job.scheduled}`}</span>
                        <span className="mt-3 flex items-center justify-between gap-3 text-[.7rem] text-[var(--muted)]"><span className="truncate">{job.location}</span><span className="font-semibold tabular-nums">{job.reference}</span></span>
                      </button>
                    )) : (
                      <div className="p-9 text-center"><strong className="display block text-2xl">No jobs in this view.</strong><p className="mt-2 text-xs leading-5 text-[var(--muted)]">Choose another status to continue.</p><button className="btn btn-secondary btn-small mt-5" onClick={() => changeFilter("all")}>View all jobs</button></div>
                    )}
                  </div>
                </section>

                {visibleJobs.length > 0 && (
                  <section className={`${detailOpen ? "block" : "hidden"} xl:block`}>
                    <article className="vendor-record">
                      <div className="vendor-record-header">
                        <button className="vendor-back mb-5 xl:hidden" onClick={() => setDetailOpen(false)}>← Back to jobs</button>
                        <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><StatusBadge status={selectedJob.status} /><span className="text-xs font-semibold text-[var(--muted)] tabular-nums">{selectedJob.reference}</span></div><strong className="vendor-record-payout">{selectedJob.payout}</strong></div>
                        <div className="mt-5 flex flex-col justify-between gap-5 md:flex-row md:items-end">
                          <div><h2 className="display text-[clamp(2rem,4vw,3.4rem)] leading-none">{selectedJob.service}</h2><p className="mt-2 text-sm text-[var(--muted)]">{selectedJob.summary} · {selectedJob.location}</p>{selectedJob.status === "pending" && <p className="mt-3 text-xs font-semibold text-[#66481f]">{selectedJob.respondBy}</p>}</div>
                          {selectedJob.status === "pending" && <div className="flex shrink-0 flex-wrap gap-2"><button className="btn btn-small" onClick={() => updateJob("accept")}>Accept job</button><button className="btn btn-secondary btn-small" onClick={() => updateJob("decline")}>Decline</button></div>}
                        </div>
                      </div>

                      {selectedJob.status === "declined" ? (
                        <div className="vendor-declined"><strong>Assignment declined</strong><span>The admin team can now allocate it to another vendor.</span></div>
                      ) : (
                        <div className="border-y border-[var(--line)] px-5 py-5 md:px-6"><span className="vendor-kicker">Amanah trail</span><AmanahRail status={selectedJob.status} /></div>
                      )}
                      {notice && <p role="status" className="vendor-notice">{notice}</p>}

                      <section className="vendor-record-section">
                        <div className="flex items-end justify-between gap-4"><div><p className="vendor-kicker">Assignment</p><h3 className="mt-1 text-lg font-semibold">Fulfilment brief</h3></div><span className="text-xs text-[var(--muted)]">Scheduled {selectedJob.scheduled}</span></div>
                        <dl className="vendor-facts mt-5">
                          {[["Location", selectedJob.location], ["Scheduled", selectedJob.scheduled], ["Quantity", selectedJob.quantity], ["Vendor payout", selectedJob.payout]].map(([term, detail]) => <div key={term}><dt>{term}</dt><dd>{detail}</dd></div>)}
                        </dl>
                      </section>

                      <div className="grid 2xl:grid-cols-[minmax(0,1fr)_290px]">
                        <div>
                          <section className="vendor-record-section">
                            <p className="vendor-kicker">People</p>
                            <div className="mt-4 grid gap-px overflow-hidden border border-[var(--line)] bg-[var(--line)] md:grid-cols-2">
                              <div className="bg-white p-4">
                                <span className="vendor-field-label">Delivery contact · minimum necessary</span>
                                {selectedJob.status === "active" ? (
                                  <><strong className="mt-2 block text-sm">{selectedJob.customer}</strong><a className="mt-1 inline-block text-sm font-semibold text-[var(--teal)]" href={`tel:${selectedJob.phone.replaceAll(" ", "")}`}>{selectedJob.phone}</a><p className="mt-3 text-[.68rem] leading-5 text-[var(--muted)]">Use only to coordinate this assignment. Do not copy, share, or retain these details.</p></>
                                ) : (
                                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{selectedJob.status === "pending" ? "Available after you accept this job." : "Hidden outside active fulfilment. Create a report if support is needed."}</p>
                                )}
                              </div>
                              <div className="bg-white p-4"><span className="vendor-field-label">Participant / dedication</span><strong className="mt-2 block text-sm leading-6">{selectedJob.participant}</strong></div>
                            </div>
                          </section>
                          <section className="vendor-record-section"><p className="vendor-kicker">Service notes</p><p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">{selectedJob.notes}</p></section>

                          {(selectedJob.status === "active" || selectedJob.status === "proof_submitted" || selectedJob.status === "completed") && (
                            <section className="vendor-proof">
                              <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="vendor-kicker text-[var(--teal)]">Completion proof</p><h3 className="mt-1 text-lg font-semibold">{selectedJob.status === "active" ? "Prepare the evidence bundle" : selectedJob.status === "proof_submitted" ? "Evidence waiting for review" : "Evidence approved"}</h3></div>{selectedJob.status !== "active" && <StatusBadge status={selectedJob.status} />}</div>
                              {selectedJob.status === "active" ? (
                                <form className="mt-5 grid gap-4" key={selectedJob.id} onSubmit={(event) => { event.preventDefault(); if (proofReady) updateJob("submit_proof"); }}>
                                  <label className="label" htmlFor="evidence-photos">Completion photos <span className="font-normal text-[var(--muted)]">({selectedJob.minimumPhotos} required)</span><input aria-describedby="evidence-progress" className="input bg-white" id="evidence-photos" type="file" accept="image/jpeg,image/png,image/webp" multiple required onChange={(event) => setProofFiles((current) => ({ ...current, photos: Array.from(event.target.files || [], (file) => file.name) }))} /></label>
                                  <label className="label" htmlFor="evidence-video">Short landscape video <span className="font-normal text-[var(--muted)]">({selectedJob.videoRequired ? "required" : "optional"})</span><input aria-describedby="evidence-progress" className="input bg-white" id="evidence-video" type="file" accept="video/mp4,video/quicktime" required={selectedJob.videoRequired} onChange={(event) => setProofFiles((current) => ({ ...current, video: event.target.files?.[0]?.name || "" }))} /></label>
                                  <p aria-live="polite" className="text-xs font-semibold text-[var(--teal)]" id="evidence-progress">{proofFiles.photos.length}/{selectedJob.minimumPhotos} photos prepared · {proofFiles.video ? "Video prepared" : selectedJob.videoRequired ? "Video still required" : "Video optional"}</p>
                                  <button className="btn btn-small justify-self-start" disabled={!proofReady}>Submit evidence bundle</button>
                                  <p className="text-[.7rem] leading-5 text-[var(--muted)]">One submission sends the full bundle for admin review. In this demo, files stay on your device and are not uploaded.</p>
                                </form>
                              ) : (
                                <p className="mt-4 text-xs leading-6 text-[var(--muted)]">{selectedJob.status === "proof_submitted" ? "The full bundle was submitted. The admin team will approve it or request changes before closing this job." : "The admin team verified the evidence bundle. This job is complete."}</p>
                              )}
                            </section>
                          )}
                        </div>

                        <aside className="vendor-record-aside">
                          <p className="vendor-kicker">Evidence required</p>
                          <p className="mt-2 text-[.7rem] font-semibold text-[var(--ink)]">{selectedJob.minimumPhotos} photos · Video {selectedJob.videoRequired ? "required" : "optional"}</p>
                          <ol className="mt-4 grid gap-3 text-xs leading-5 text-[var(--muted)]">{selectedJob.proofGuide.map((item, index) => <li className="flex gap-2" key={item}><span className="font-bold text-[var(--teal)]">{index + 1}.</span>{item}</li>)}</ol>
                          <div className="mt-5 border-l-2 border-[var(--gold)] bg-[rgba(162,124,71,.08)] p-3"><strong className="block text-xs text-[var(--ink)]">Protect dignity and consent</strong><p className="mt-1 text-[.7rem] leading-5 text-[var(--muted)]">Focus on the service, nameplate, and result. Do not show identifiable people without permission, and never include children, IDs, or private documents.</p></div>
                          <button className="vendor-report-link" onClick={showReports}>Report a problem <span aria-hidden="true">→</span></button>
                        </aside>
                      </div>
                    </article>
                  </section>
                )}
              </div>
            </>
          ) : (
            <section className="vendor-panel mt-5 overflow-hidden lg:grid lg:grid-cols-[.8fr_1.2fr]">
              <form className="grid gap-5 p-5 md:p-7" onSubmit={createReport}>
                <div><p className="vendor-kicker">New report</p><h2 className="mt-1 text-xl font-semibold">Report a problem</h2></div>
                <label className="label">Related job<select className="input" name="job" defaultValue={selectedJob.reference}>{jobs.map((job) => <option key={job.id} value={job.reference}>{job.reference} · {job.service}</option>)}</select></label>
                <label className="label">Issue type<select className="input" name="type"><option>Schedule</option><option>Customer details</option><option>Location or access</option><option>Proof upload</option><option>Other</option></select></label>
                <label className="label">What happened?<textarea className="input min-h-36 resize-y" name="message" minLength={10} required placeholder="Explain the issue and what help you need." /></label>
                <button className="btn">Create report</button>
                {reportCreated && <p role="status" className="vendor-notice m-0">Report created for the admin team.</p>}
              </form>
              <div className="border-t border-[var(--line)] lg:border-l lg:border-t-0">
                <div className="flex items-center justify-between border-b border-[var(--line)] p-5 md:p-7"><h2 className="text-xl font-semibold">Your reports</h2><span className="text-xs text-[var(--muted)]">{reports.length} total</span></div>
                <div>{reports.map((report) => <article className="border-b border-[var(--line)] p-5 last:border-0 md:p-7" key={report.id}><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><span className={`vendor-report-status ${report.status === "Open" ? "is-open" : ""}`}>{report.status}</span><strong className="text-xs tabular-nums">{report.job}</strong></div><span className="text-xs font-semibold text-[var(--muted)]">{report.type}</span></div><p className="mt-4 text-sm leading-7 text-[var(--muted)]">{report.message}</p></article>)}</div>
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
