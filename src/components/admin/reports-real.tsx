"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { resolveReportAction } from "@/app/admin/actions";

export interface ReportRow {
  id: string;
  subject: string;
  message: string;
  status: "open" | "resolved";
  created_at: string;
  resolved_at: string | null;
  resolution_notes: string | null;
  resolver_name: string | null;
  order_reference: string | null;
  reporter_name: string;
  source: "vendor" | "customer";
  category: string | null;
}

export function ReportsReal({ reports }: { reports: ReportRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const open = reports.filter((report) => report.status === "open");
  const resolved = reports.filter((report) => report.status === "resolved");

  function resolve(event: FormEvent<HTMLFormElement>, report: ReportRow) {
    event.preventDefault();
    const note = notes[report.id]?.trim() ?? "";
    if (!note) return setError("Add a resolution note before closing a report.");
    setBusy(report.id);
    setError(null);
    startTransition(async () => {
      const result = await resolveReportAction(report.id, report.source, note);
      if (!result.ok) setError(result.error ?? "The report could not be resolved.");
      else router.refresh();
      setBusy(null);
    });
  }

  return (
    <>
      <div className="vendor-page-head">
        <div><p className="vendor-eyebrow">Support</p><h1 className="display vendor-page-title">Support inbox</h1><p className="vendor-page-lead">Customer and partner concerns, with a named resolution and an auditable closure note.</p></div>
      </div>
      {error && <p className="auth-error" role="alert">{error}</p>}

      <section className="card vendor-panel">
        <div className="vendor-panel-head"><h2 className="display text-lg">Open ({open.length})</h2></div>
        {open.length === 0 ? <p className="vendor-empty">No open support reports.</p> : (
          <div className="vendor-report-list">
            {open.map((report) => (
              <article key={report.id} className="vendor-report-item">
                <div className="vendor-report-item-head"><strong>{report.subject}</strong><span className="vendor-status vendor-status-pending">Open</span></div>
                <small>{report.source === "customer" ? "Customer" : "Vendor"} · {report.reporter_name} · {report.order_reference || "Portal-wide"} · {new Date(report.created_at).toLocaleString()}</small>
                <p>{report.message}</p>
                <form className="grid gap-3 mt-4" onSubmit={(event) => resolve(event, report)}>
                  <label className="label">Resolution note<textarea className="input vendor-textarea" rows={3} required minLength={4} maxLength={2000} value={notes[report.id] ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [report.id]: event.target.value }))} placeholder="State what was checked and how this was resolved." /></label>
                  <button type="submit" className="btn btn-small justify-self-start" disabled={pending}>{busy === report.id ? "Resolving…" : "Resolve report"}</button>
                </form>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="card vendor-panel">
        <div className="vendor-panel-head"><h2 className="display text-lg">Resolved ({resolved.length})</h2></div>
        {resolved.length === 0 ? <p className="vendor-empty">No resolved support reports.</p> : (
          <div className="vendor-report-list">
            {resolved.map((report) => (
              <article key={report.id} className="vendor-report-item">
                <div className="vendor-report-item-head"><strong>{report.subject}</strong><span className="vendor-status vendor-status-completed">Resolved</span></div>
                <small>{report.source === "customer" ? "Customer" : "Vendor"} · {report.reporter_name} · {report.order_reference || "Portal-wide"}</small>
                <p>{report.message}</p>
                <div className="admin-record-note mt-4"><strong>Resolution</strong><p>{report.resolution_notes}</p><small>{report.resolver_name || "Administrator"} · {report.resolved_at ? new Date(report.resolved_at).toLocaleString() : "Time not recorded"}</small></div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
