export type ServiceType = "korban" | "wakaf";
export type UserRole = "admin" | "vendor";
export type PaymentStatus = "pending" | "paid" | "failed";
export type FulfilmentStatus = "unassigned" | "assigned" | "in_progress" | "proof_submitted" | "completed";

export const demoOfferings = [
  { id: "00000000-0000-0000-0000-000000000001", slug: "korban-overseas", service_type: "korban" as const, title: "Korban Overseas Package", location: "Indonesia", detail: "One cow share", unit_amount: 28000, min_amount: null },
  { id: "00000000-0000-0000-0000-000000000002", slug: "wakaf-quran", service_type: "wakaf" as const, title: "Wakaf Quran Distribution", location: null, detail: "Support Quran distribution through a fulfilment partner.", unit_amount: null, min_amount: 1000 },
  { id: "00000000-0000-0000-0000-000000000003", slug: "wakaf-water", service_type: "wakaf" as const, title: "Wakaf Clean Water Initiative", location: null, detail: "Contribute toward a clean-water demonstration project.", unit_amount: null, min_amount: 2500 },
  { id: "00000000-0000-0000-0000-000000000004", slug: "food-for-orphans", service_type: "wakaf" as const, title: "Food for Orphans", location: null, detail: "Support a coordinated community food programme.", unit_amount: null, min_amount: 5000 },
];

export function money(cents: number | null | undefined) {
  return cents == null ? "—" : new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD", maximumFractionDigits: 0 }).format(cents / 100);
}

export function parseOrder(formData: FormData, offering: (typeof demoOfferings)[number]) {
  const fullName = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const phone = String(formData.get("phone") || "").trim();
  if (fullName.length < 2) throw new Error("Please enter your full name.");
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Please enter a valid email address.");
  if (phone.replace(/\D/g, "").length < 8) throw new Error("Please enter a valid phone number.");

  if (offering.service_type === "korban") {
    const quantity = Number(formData.get("quantity"));
    const participantNames = formData.getAll("participant_names").map(String).map((name) => name.trim()).filter(Boolean);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 7) throw new Error("Korban quantity must be between 1 and 7 shares.");
    if (participantNames.length !== quantity) throw new Error(`Please enter ${quantity} participant name${quantity === 1 ? "" : "s"}.`);
    return { fullName, email, phone, quantity, participantNames, dedication: null, amount: (offering.unit_amount || 0) * quantity };
  }

  const amount = Math.round(Number(formData.get("amount")) * 100);
  if (!Number.isFinite(amount) || amount < (offering.min_amount || 0)) throw new Error(`The minimum contribution is ${money(offering.min_amount)}.`);
  return { fullName, email, phone, quantity: 1, participantNames: [], dedication: String(formData.get("dedication") || "").trim() || null, amount };
}
