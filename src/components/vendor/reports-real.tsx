"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { fileReportAction } from "@/app/vendor-dashboard/actions";

export interface VendorReportRow {
  id: string;
  subject: string;
  message: string;
  status: "open" | "resolved";
  created_at: string;
  resolved_at: string | null;
  resolution_notes: string | null;
  order_reference: string | null;
}

export function ReportsReal({
  vendorId,
  reports,
  jobOptions,
}: {
  vendorId: string;
  reports: VendorReportRow[];
  jobOptions: { orderId: string; reference: string; title: string }[];
}) {
  const router = useRouter();
  const [orderId, setOrderId] = useState(jobOptions[0]?.orderId ?? "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState<{ error?: string; message?: string }>({});
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await fileReportAction(vendorId, orderId || null, subject, message);
      if (!result.ok) {
        setFeedback({ error: result.error ?? "The report could not be submitted." });
        return;
      }
      setSubject("");
      setMessage("");
      setFeedback({ message: "Report submitted. The operations team’s resolution will appear here." });
      router.refresh();
    });
  }

  return (
    <>
      <div className="vendor-page-head">
        <div>
          <p className="vendor-eyebrow">Support</p>
          <h1 className="display vendor-page-title">Reports</h1>
          <p className="vendor-page-lead">Can’t do something on the dashboard, or hit a blocker on a job? Flag it here for the operations team.</p>
        </div>
      </div>

      <div className="vendor-split">
        <div className="card vendor-panel">
          <div className="vendor-panel-head">
            <h2 className="display text-lg">New report</h2>
          </div>
          <form className="grid gap-5" onSubmit={submit}>
            {feedback.message && <p className="auth-message" role="status">{feedback.message}</p>}
            {feedback.error && <p className="auth-error" role="alert">{feedback.error}</p>}

            <label className="label">Related job
              <select className="input" value={orderId} onChange={(event) => setOrderId(event.target.value)}>
                {jobOptions.map((job) => <option key={job.orderId} value={job.orderId}>{job.reference} — {job.title}</option>)}
                <option value="">Not job-specific</option>
              </select>
            </label>
            <label className="label">Subject
              <input className="input" required minLength={4} maxLength={120} placeholder="What’s the issue?" value={subject} onChange={(event) => setSubject(event.target.value)} />
            </label>
            <label className="label">Details
              <textarea className="input vendor-textarea" required minLength={20} maxLength={2000} rows={5} placeholder="Describe what’s blocking you, and what you’ve already tried." value={message} onChange={(event) => setMessage(event.target.value)} />
            </label>
            <button type="submit" className="btn" disabled={pending}>{pending ? "Submitting…" : "Submit report"} <span aria-hidden="true">→</span></button>
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
                  <small>{report.order_reference || "Not job-specific"} · {new Date(report.created_at).toLocaleDateString()}</small>
                  <p>{report.message}</p>
                  {report.resolution_notes && (
                    <p className="vendor-report-resolution">
                      <strong>Resolution</strong>
                      {report.resolution_notes}
                      {report.resolved_at && <small>Resolved {new Date(report.resolved_at).toLocaleDateString()}</small>}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
