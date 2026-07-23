"use client";

import { createContext, useContext, useMemo, useState } from "react";
import {
  initialVendorJobs,
  initialVendorReports,
  type JobStatus,
  type VendorJob,
  type VendorReport,
} from "@/lib/vendor-demo";

interface VendorDataValue {
  jobs: VendorJob[];
  setJobStatus: (id: string, status: JobStatus) => void;
  reports: VendorReport[];
  addReport: (report: Omit<VendorReport, "id" | "submittedAt" | "status">) => void;
}

const VendorDataContext = createContext<VendorDataValue | null>(null);

export function VendorDataProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<VendorJob[]>(initialVendorJobs);
  const [reports, setReports] = useState<VendorReport[]>(initialVendorReports);

  const value = useMemo<VendorDataValue>(
    () => ({
      jobs,
      setJobStatus: (id, status) => setJobs((current) => current.map((job) => (job.id === id ? { ...job, status } : job))),
      reports,
      addReport: (report) =>
        setReports((current) => [
          { ...report, id: `rep-${Math.floor(Math.random() * 900 + 100)}`, submittedAt: new Date().toISOString(), status: "open" },
          ...current,
        ]),
    }),
    [jobs, reports]
  );

  return <VendorDataContext.Provider value={value}>{children}</VendorDataContext.Provider>;
}

export function useVendorData() {
  const ctx = useContext(VendorDataContext);
  if (!ctx) throw new Error("useVendorData must be used within VendorDataProvider");
  return ctx;
}
