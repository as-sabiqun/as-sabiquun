"use client";

import { createContext, useContext, useMemo, useState } from "react";
import {
  initialAdminCustomers,
  initialAdminJobs,
  initialAdminVendors,
  type AdminCustomer,
  type AdminJob,
  type AdminJobStatus,
  type AdminVendor,
} from "@/lib/admin-demo";
import { initialVendorReports, type VendorReport } from "@/lib/vendor-demo";

interface AdminDataValue {
  jobs: AdminJob[];
  assignJob: (jobId: string, vendorId: string) => void;
  vendors: AdminVendor[];
  addVendor: (vendor: Omit<AdminVendor, "id" | "joinedAt" | "jobsCompleted" | "jobsActive" | "rating" | "status">) => void;
  customers: AdminCustomer[];
  reports: VendorReport[];
  resolveReport: (id: string) => void;
}

const AdminDataContext = createContext<AdminDataValue | null>(null);

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<AdminJob[]>(initialAdminJobs);
  const [vendors, setVendors] = useState<AdminVendor[]>(initialAdminVendors);
  const [customers] = useState<AdminCustomer[]>(initialAdminCustomers);
  const [reports, setReports] = useState<VendorReport[]>(initialVendorReports);

  const value = useMemo<AdminDataValue>(
    () => ({
      jobs,
      assignJob: (jobId, vendorId) =>
        setJobs((current) =>
          current.map((job) =>
            job.id === jobId ? { ...job, status: "assigned" as AdminJobStatus, assignedVendorId: vendorId } : job
          )
        ),
      vendors,
      addVendor: (vendor) =>
        setVendors((current) => [
          { ...vendor, id: `ven-${Math.floor(Math.random() * 900 + 100)}`, joinedAt: new Date().toISOString(), jobsCompleted: 0, jobsActive: 0, rating: 0, status: "active" },
          ...current,
        ]),
      customers,
      reports,
      resolveReport: (id) => setReports((current) => current.map((r) => (r.id === id ? { ...r, status: "resolved" } : r))),
    }),
    [jobs, vendors, customers, reports]
  );

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}

export function useAdminData() {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error("useAdminData must be used within AdminDataProvider");
  return ctx;
}
