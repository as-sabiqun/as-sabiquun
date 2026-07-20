export type AdminDemoStatus = "unassigned" | "assigned" | "in_progress" | "proof_submitted" | "completed";
export type AdminDemoAction = "assign" | "reassign" | "approve_proof" | "request_changes";

export function transitionDemoAdminOrder(status: AdminDemoStatus, action: AdminDemoAction): AdminDemoStatus {
  if (status === "unassigned" && action === "assign") return "assigned";
  if ((status === "assigned" || status === "in_progress") && action === "reassign") return "assigned";
  if (status === "proof_submitted" && action === "approve_proof") return "completed";
  if (status === "proof_submitted" && action === "request_changes") return "in_progress";
  throw new Error(`Invalid admin order transition: ${status} → ${action}`);
}
