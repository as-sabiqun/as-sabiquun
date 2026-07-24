"use client";

import { useAdminData } from "@/components/admin/admin-data-context";

export function ReportsDemo() {
  const { reports, resolveReport } = useAdminData();
  const open = reports.filter((r) => r.status === "open");
  const resolved = reports.filter((r) => r.status === "resolved");

  return (
    <>
      <div className="vendor-page-head">
        <div>
          <p className="vendor-eyebrow">Support</p>
          <h1 className="display vendor-page-title">Reports</h1>
          <p className="vendor-page-lead">Issues vendors have flagged from their dashboard.</p>
        </div>
      </div>

      <div className="card vendor-panel">
        <div className="vendor-panel-head">
          <h2 className="display text-lg">Open ({open.length})</h2>
        </div>
        {open.length === 0 ? (
          <p className="vendor-empty">Nothing open right now.</p>
        ) : (
          <div className="vendor-report-list">
            {open.map((report) => (
              <div key={report.id} className="vendor-report-item">
                <div className="vendor-report-item-head">
                  <strong>{report.subject}</strong>
                  <button type="button" className="btn-secondary btn btn-small" onClick={() => resolveReport(report.id)}>Mark resolved</button>
                </div>
                <small>{report.jobReference || "Not job-specific"} · {new Date(report.submittedAt).toLocaleDateString()}</small>
                <p>{report.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card vendor-panel">
        <div className="vendor-panel-head">
          <h2 className="display text-lg">Resolved ({resolved.length})</h2>
        </div>
        {resolved.length === 0 ? (
          <p className="vendor-empty">No resolved reports yet.</p>
        ) : (
          <div className="vendor-report-list">
            {resolved.map((report) => (
              <div key={report.id} className="vendor-report-item">
                <div className="vendor-report-item-head">
                  <strong>{report.subject}</strong>
                  <span className="vendor-status vendor-status-completed">Resolved</span>
                </div>
                <small>{report.jobReference || "Not job-specific"} · {new Date(report.submittedAt).toLocaleDateString()}</small>
                <p>{report.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
