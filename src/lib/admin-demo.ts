export type AdminJobStatus = "pending" | "assigned" | "completed";

export interface AdminJob {
  id: string;
  title: string;
  category: "Korban" | "Wakaf";
  reference: string;
  price: number;
  submittedAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  brief: string;
  requirements: string[];
  status: AdminJobStatus;
  assignedVendorId?: string;
}

export const vendorTypes = [
  "Korban fulfilment partner",
  "Wakaf water & infrastructure",
  "Wakaf distribution (Quran / food)",
  "General / multi-service vendor",
] as const;

export type VendorType = (typeof vendorTypes)[number];

export const vendorServiceOptions = [
  { slug: "korban", title: "Korban" },
  { slug: "water", title: "Wakaf Water Pump" },
  { slug: "quran", title: "Wakaf Quran" },
  { slug: "orphans", title: "Food for Orphans" },
] as const;

export type VendorServiceSlug = (typeof vendorServiceOptions)[number]["slug"];

export function serviceSlugsForCategory(category: AdminJob["category"]): VendorServiceSlug[] {
  return category === "Korban" ? ["korban"] : ["water", "quran", "orphans"];
}

export interface AdminVendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: VendorType;
  services: VendorServiceSlug[];
  status: "active" | "suspended";
  joinedAt: string;
  jobsCompleted: number;
  jobsActive: number;
  rating: number;
}

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  state: "verified" | "pending" | "suspended";
  joinedAt: string;
  ordersCount: number;
  lifetimeSpend: number;
}

const now = Date.now();
const daysAgo = (n: number) => new Date(now - n * 24 * 60 * 60 * 1000).toISOString();
const hoursAgo = (n: number) => new Date(now - n * 60 * 60 * 1000).toISOString();

export const initialAdminJobs: AdminJob[] = [
  {
    id: "req-3301",
    title: "Korban fulfilment — 3 shares",
    category: "Korban",
    reference: "Order #KB-2211",
    price: 840,
    submittedAt: hoursAgo(3),
    customerName: "Nur Aisyah",
    customerEmail: "n.aisyah@example.com",
    customerPhone: "+65 8123 4567",
    brief: "3 cow shares for one household, requested for the coming fulfilment window. No dietary or regional preference specified.",
    requirements: ["Confirm fulfilment partner has capacity", "Match to a vendor in an active region", "Response window: 6 hours once assigned"],
    status: "pending",
  },
  {
    id: "req-3298",
    title: "Wakaf Quran distribution — 25 sets",
    category: "Wakaf",
    reference: "Order #WK-2214",
    price: 100,
    submittedAt: hoursAgo(7),
    customerName: "Muhammad Hafiz",
    customerEmail: "hafiz.m@example.com",
    customerPhone: "+65 9234 1187",
    brief: "Dedication contribution for a learning circle distribution run. Customer requested proof photos be shared once complete.",
    requirements: ["Assign to a Wakaf-approved vendor", "Confirm distribution site is active"],
    status: "pending",
  },
  {
    id: "req-3290",
    title: "Wakaf Water Pump installation",
    category: "Wakaf",
    reference: "Order #WK-2198",
    price: 650,
    submittedAt: daysAgo(1),
    customerName: "Siti Rahman",
    customerEmail: "siti.rahman@example.com",
    customerPhone: "+65 8877 2201",
    brief: "Full hand-pump installation. Site survey already completed by the local coordinator.",
    requirements: ["Verify parts availability with vendor", "Confirm install crew and access date"],
    status: "assigned",
    assignedVendorId: "ven-01",
  },
  {
    id: "req-3281",
    title: "Korban fulfilment — full cow",
    category: "Korban",
    reference: "Order #KB-2165",
    price: 1960,
    submittedAt: daysAgo(6),
    customerName: "Abdullah Yusof",
    customerEmail: "a.yusof@example.com",
    customerPhone: "+65 9011 4432",
    brief: "Full cow, 7 shares, single household order.",
    requirements: ["Fulfilment complete", "Evidence reviewed"],
    status: "completed",
    assignedVendorId: "ven-02",
  },
];

export const initialAdminVendors: AdminVendor[] = [
  {
    id: "ven-01",
    name: "Amanah Fulfilment Partners",
    email: "ops@amanahpartners.example",
    phone: "+65 6221 0043",
    type: "Korban fulfilment partner",
    services: ["korban"],
    status: "active",
    joinedAt: daysAgo(120),
    jobsCompleted: 34,
    jobsActive: 2,
    rating: 4.8,
  },
  {
    id: "ven-02",
    name: "Barakah Regional Services",
    email: "team@barakahservices.example",
    phone: "+65 6778 9012",
    type: "General / multi-service vendor",
    services: ["korban", "water", "quran", "orphans"],
    status: "active",
    joinedAt: daysAgo(200),
    jobsCompleted: 61,
    jobsActive: 1,
    rating: 4.9,
  },
  {
    id: "ven-03",
    name: "Nur Community Logistics",
    email: "hello@nurlogistics.example",
    phone: "+65 6543 8890",
    type: "Wakaf distribution (Quran / food)",
    services: ["quran", "orphans"],
    status: "suspended",
    joinedAt: daysAgo(340),
    jobsCompleted: 12,
    jobsActive: 0,
    rating: 3.9,
  },
];

export const initialAdminCustomers: AdminCustomer[] = [
  {
    id: "cus-501",
    name: "Nur Aisyah",
    email: "n.aisyah@example.com",
    phone: "+65 8123 4567",
    state: "verified",
    joinedAt: daysAgo(40),
    ordersCount: 2,
    lifetimeSpend: 920,
  },
  {
    id: "cus-498",
    name: "Muhammad Hafiz",
    email: "hafiz.m@example.com",
    phone: "+65 9234 1187",
    state: "verified",
    joinedAt: daysAgo(95),
    ordersCount: 4,
    lifetimeSpend: 610,
  },
  {
    id: "cus-512",
    name: "Siti Rahman",
    email: "siti.rahman@example.com",
    phone: "+65 8877 2201",
    state: "pending",
    joinedAt: daysAgo(2),
    ordersCount: 1,
    lifetimeSpend: 650,
  },
  {
    id: "cus-470",
    name: "Abdullah Yusof",
    email: "a.yusof@example.com",
    phone: "+65 9011 4432",
    state: "suspended",
    joinedAt: daysAgo(210),
    ordersCount: 6,
    lifetimeSpend: 3420,
  },
];

export const customerStateLabels: Record<AdminCustomer["state"], string> = {
  verified: "Verified",
  pending: "Pending confirmation",
  suspended: "Suspended",
};

export const adminJobStatusLabels: Record<AdminJobStatus, string> = {
  pending: "Needs assignment",
  assigned: "Assigned to vendor",
  completed: "Completed",
};

const PASSWORD_WORDS = [
  "amber", "coral", "river", "cloud", "maple", "ocean", "sunny", "olive",
  "tiger", "eagle", "coco", "hazel", "lotus", "pearl", "ruby", "jasmine",
  "cedar", "willow", "meadow", "harbor",
];

// Easy to read aloud and re-type by hand: two short words plus a two-digit number, no symbols or mixed case.
export function generatePassword(): string {
  const first = PASSWORD_WORDS[Math.floor(Math.random() * PASSWORD_WORDS.length)];
  let second = PASSWORD_WORDS[Math.floor(Math.random() * PASSWORD_WORDS.length)];
  while (second === first) second = PASSWORD_WORDS[Math.floor(Math.random() * PASSWORD_WORDS.length)];
  const digits = Math.floor(Math.random() * 90 + 10);
  return `${first}${second}${digits}`;
}
