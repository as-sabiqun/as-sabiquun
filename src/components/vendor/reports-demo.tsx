"use client";

import { useState, type FormEvent } from "react";
import { useVendorData } from "@/components/vendor/vendor-data-context";

export function ReportsDemo() {
  const { reports, addReport, jobs } = useVendorData();
  const [jobReference, setJobReference] = useState(jobs[0]?.reference ?? "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addReport({ jobReference, subject, message });
    setSubject("");
    setMessage("");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  }

  return (
    <>
      <div className="vendor-page-head">
        <div>
          <p className="vendor-eyebrow">Support</p>
          <h1 className="display vendor-page-title">Reports</h1>
          <p className="vendor-page-lead">Can't do something on the dashboard, or hit a blocker on a job? Flag it here for the operations team.</p>
        </div>
      </div>

      <div className="vendor-split">
        <div className="card vendor-panel">
          <div className="vendor-panel-head">
            <h2 className="display text-lg">New report</h2>
          </div>
          <form className="grid gap-5" onSubmit={submit}>
            {submitted && <p className="auth-message">Report submitted. Operations will follow up by email.</p>}

            <label className="label">Related job
              <select className="input" value={jobReference} onChange={(event) => setJobReference(event.target.value)}>
                {jobs.map((job) => <option key={job.id} value={job.reference}>{job.reference} — {job.title}</option>)}
                <option value="">Not job-specific</option>
              </select>
            </label>
            <label className="label">Subject
              <input className="input" required placeholder="What's the issue?" value={subject} onChange={(event) => setSubject(event.target.value)} />
            </label>
            <label className="label">Details
              <textarea className="input vendor-textarea" required rows={5} placeholder="Describe what's blocking you, and what you've already tried." value={message} onChange={(event) => setMessage(event.target.value)} />
            </label>
            <button type="submit" className="btn">Submit report <span aria-hidden="true">→</span></button>
          </form>
        </div>

        <div className="card vendor-panel">
          <div className="vendor-panel-head">
            <h2 className="display text-lg">Your reports</h2>
          </div>
          {reports.length === 0 ? (
            <p className="vendor-empty">No reports filed yet.</p>
          ) : (
            <div className="vendor-report-list">
              {reports.map((report) => (
                <div key={report.id} className="vendor-report-item">
                  <div className="vendor-report-item-head">
                    <strong>{report.subject}</strong>
                    <span className={`vendor-status vendor-status-${report.status === "open" ? "pending" : "completed"}`}>
                      {report.status === "open" ? "Open" : "Resolved"}
                    </span>
                  </div>
                  <small>{report.jobReference || "Not job-specific"} · {new Date(report.submittedAt).toLocaleDateString()}</small>
                  <p>{report.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
