export type VendorDirectoryState = "operational" | "pending" | "invited" | "paused";

export function vendorDirectoryState(vendor: {
  status: "active" | "suspended";
  vendor_onboarding_status?: "not_applicable" | "invited" | "pending" | "approved" | "rejected";
}): VendorDirectoryState {
  if (vendor.status === "suspended" || vendor.vendor_onboarding_status === "rejected") return "paused";
  if (vendor.vendor_onboarding_status === "pending") return "pending";
  if (vendor.vendor_onboarding_status === "invited") return "invited";
  return "operational";
}
