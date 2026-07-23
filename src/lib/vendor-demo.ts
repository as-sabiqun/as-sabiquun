export type JobStatus = "pending" | "accepted" | "rejected" | "expired" | "in_progress" | "completed";

export interface VendorProof {
  photoCount: number;
  videoName: string;
  notes: string;
  submittedAt: string;
}

export interface VendorJob {
  id: string;
  title: string;
  category: "Korban" | "Wakaf";
  reference: string;
  location: string;
  price: number;
  postedAt: string;
  respondBy: string;
  completeBy: string;
  status: JobStatus;
  brief: string;
  checklist: string[];
  proof?: VendorProof;
}

const now = Date.now();
const hours = (n: number) => new Date(now + n * 60 * 60 * 1000).toISOString();
const days = (n: number) => new Date(now + n * 24 * 60 * 60 * 1000).toISOString();
const daysAgo = (n: number) => new Date(now - n * 24 * 60 * 60 * 1000).toISOString();

export const initialVendorJobs: VendorJob[] = [
  {
    id: "job-2201",
    title: "Korban fulfilment — 6 shares",
    category: "Korban",
    reference: "Order #KB-2201",
    location: "Overseas partner site — Region B",
    price: 1680,
    postedAt: daysAgo(0),
    respondBy: hours(5),
    completeBy: days(3),
    status: "pending",
    brief: "6 cow shares booked by one household. Names and instructions are attached once accepted. Completion evidence due within 48 hours of fulfilment.",
    checklist: ["Confirm livestock availability", "Schedule fulfilment window", "Assign a documentation team"],
  },
  {
    id: "job-2198",
    title: "Wakaf Water Pump installation",
    category: "Wakaf",
    reference: "Order #WK-2198",
    location: "Community site — Region C",
    price: 650,
    postedAt: daysAgo(0),
    respondBy: hours(2),
    completeBy: days(5),
    status: "pending",
    brief: "Full hand-pump installation for a community wakaf contribution. Site survey already completed by the local coordinator.",
    checklist: ["Verify parts on hand", "Confirm installation crew", "Book site access with coordinator"],
  },
  {
    id: "job-2190",
    title: "Korban fulfilment — 1 goat",
    category: "Korban",
    reference: "Order #KB-2190",
    location: "Overseas partner site — Region A",
    price: 320,
    postedAt: daysAgo(1),
    respondBy: hours(-3),
    completeBy: days(2),
    status: "expired",
    brief: "Single goat share. Missed the response window — reassigned to another partner.",
    checklist: [],
  },
  {
    id: "job-2183",
    title: "Wakaf Quran distribution — 60 sets",
    category: "Wakaf",
    reference: "Order #WK-2183",
    location: "Learning circle — Region A",
    price: 240,
    postedAt: daysAgo(2),
    respondBy: hours(-40),
    completeBy: days(1),
    status: "accepted",
    brief: "Distribution run of 60 Quran sets across a learning circle network. Delivery split across three sub-sites.",
    checklist: ["Pack distribution sets", "Confirm delivery route", "Collect signed receipts"],
  },
  {
    id: "job-2176",
    title: "Food for Orphans — weekly packs",
    category: "Wakaf",
    reference: "Order #WK-2176",
    location: "Community kitchen — Region B",
    price: 500,
    postedAt: daysAgo(3),
    respondBy: hours(-60),
    completeBy: hours(18),
    status: "in_progress",
    brief: "Full community meal programme, four-week run. Currently on week 2 of 4.",
    checklist: ["Week 2 pack assembly", "Confirm week 3 supplier order", "Upload week 1 proof photos"],
  },
  {
    id: "job-2165",
    title: "Korban fulfilment — full cow",
    category: "Korban",
    reference: "Order #KB-2165",
    location: "Overseas partner site — Region B",
    price: 1960,
    postedAt: daysAgo(6),
    respondBy: hours(-140),
    completeBy: daysAgo(2),
    status: "completed",
    brief: "Full cow, 7 shares, single household order. Completed and evidence already reviewed.",
    checklist: ["Fulfilment complete", "Evidence uploaded", "Reviewed by operations"],
    proof: { photoCount: 5, videoName: "kb-2165-completion.mp4", notes: "All shares fulfilled and documented on site.", submittedAt: daysAgo(3) },
  },
  {
    id: "job-2159",
    title: "Wakaf Water Pump maintenance",
    category: "Wakaf",
    reference: "Order #WK-2159",
    location: "Community site — Region A",
    price: 150,
    postedAt: daysAgo(4),
    respondBy: hours(-90),
    completeBy: daysAgo(1),
    status: "rejected",
    brief: "Routine maintenance visit — declined due to crew availability that week.",
    checklist: [],
  },
];

export const statusLabels: Record<JobStatus, string> = {
  pending: "Awaiting response",
  accepted: "Accepted",
  rejected: "Rejected",
  expired: "Expired",
  in_progress: "In progress",
  completed: "Completed",
};

export function formatCountdown(respondBy: string): { label: string; urgent: boolean; expired: boolean } {
  const diffMs = new Date(respondBy).getTime() - Date.now();
  if (diffMs <= 0) return { label: "Response window closed", urgent: false, expired: true };
  const hrs = Math.floor(diffMs / (60 * 60 * 1000));
  const mins = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
  const label = hrs > 0 ? `${hrs}h ${mins}m left to respond` : `${mins}m left to respond`;
  return { label, urgent: diffMs < 60 * 60 * 1000, expired: false };
}

export function formatDueDate(completeBy: string): { label: string; overdue: boolean } {
  const diffMs = new Date(completeBy).getTime() - Date.now();
  const formatted = new Date(completeBy).toLocaleDateString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  if (diffMs <= 0) return { label: `Was due ${formatted}`, overdue: true };
  return { label: `Due by ${formatted}`, overdue: false };
}

export const kanbanStatuses: { status: JobStatus; label: string }[] = [
  { status: "pending", label: "Awaiting response" },
  { status: "accepted", label: "Accepted" },
  { status: "in_progress", label: "In progress" },
  { status: "completed", label: "Completed" },
];

export interface VendorReport {
  id: string;
  jobReference: string;
  subject: string;
  message: string;
  submittedAt: string;
  status: "open" | "resolved";
}

export const initialVendorReports: VendorReport[] = [
  {
    id: "rep-104",
    jobReference: "Order #WK-2176",
    subject: "Delivery route blocked",
    message: "The usual delivery route to the community kitchen is closed for roadworks this week. Requesting an alternate site contact.",
    submittedAt: daysAgo(1),
    status: "open",
  },
  {
    id: "rep-097",
    jobReference: "Order #KB-2165",
    subject: "Evidence upload limit",
    message: "Could not upload all completion photos — file size limit too small for the batch. Sent the rest by email instead.",
    submittedAt: daysAgo(5),
    status: "resolved",
  },
];
