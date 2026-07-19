import type { Metadata } from "next";
import { VendorDashboard } from "@/components/vendor-dashboard";

export const metadata: Metadata = { title: "Vendor Dashboard Demo" };

export default function VendorDashboardPage() {
  return <VendorDashboard />;
}
