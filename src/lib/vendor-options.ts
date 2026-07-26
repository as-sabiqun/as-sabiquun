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
  { slug: "tahfiz", title: "Tahfiz Sponsorship" },
  { slug: "aqiqah", title: "Aqiqah" },
  { slug: "digital_products", title: "Digital Products" },
  { slug: "marketing", title: "Marketing" },
  { slug: "logistics", title: "Logistics" },
] as const;

export type VendorServiceSlug = (typeof vendorServiceOptions)[number]["slug"];
