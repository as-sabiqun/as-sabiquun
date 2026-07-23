import { statusLabels, type JobStatus } from "@/lib/vendor-demo";

export function StatusPill({ status }: { status: JobStatus }) {
  return <span className={`vendor-status vendor-status-${status}`}>{statusLabels[status]}</span>;
}
