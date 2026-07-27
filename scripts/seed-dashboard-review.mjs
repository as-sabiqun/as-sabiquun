import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Supabase service credentials are missing.");

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const fail = (label, error) => { if (error) throw new Error(`${label}: ${error.message}`); };
const month = (offset, day = 10) => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, day, 8)).toISOString();
};

const { count, error: existingError } = await supabase
  .from("orders")
  .select("id", { count: "exact", head: true })
  .like("reference", "DASH-REVIEW-%");
fail("Check existing review data", existingError);
if (count) {
  console.log(`Dashboard review data already exists (${count} orders).`);
  process.exit(0);
}

const [{ data: customers, error: customerError }, { data: vendors, error: vendorError }, { data: offerings, error: offeringError }, { data: authPage, error: authError }] = await Promise.all([
  supabase.from("profiles").select("id, display_name, phone, created_at").eq("role", "customer").eq("status", "active").order("created_at"),
  supabase.from("profiles").select("id, display_name").eq("role", "vendor").eq("status", "active").eq("vendor_onboarding_status", "approved").order("created_at"),
  supabase.from("offerings").select("id, service_type, category_slug, unit_amount, min_amount").eq("active", true).order("sort_order"),
  supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
]);
fail("Load customers", customerError);
fail("Load vendors", vendorError);
fail("Load offerings", offeringError);
fail("Load auth users", authError);

const users = authPage.users;
const preferredUser = users.find((user) => user.email?.toLowerCase() === "syakirbusiness.syukur@gmail.com");
const customer = customers.find((profile) => profile.id === preferredUser?.id) ?? customers.find((profile) => users.some((user) => user.id === profile.id));
const vendor = vendors[0];
const customerUser = users.find((user) => user.id === customer?.id);
if (!customer || !customerUser?.email) throw new Error("No active customer with an email was found.");
if (!vendor) throw new Error("No approved active vendor was found.");

const byCategory = new Map();
for (const offering of offerings) if (!byCategory.has(offering.category_slug)) byCategory.set(offering.category_slug, offering);
for (const category of ["korban", "water", "quran", "orphans"]) {
  if (!byCategory.has(category)) throw new Error(`No active ${category} offering was found.`);
}

const definitions = [
  ["01", "korban", -5, "failed", "not_ready", null],
  ["02", "water", -5, "paid", "ready", null],
  ["03", "quran", -4, "paid", "broadcasting", null],
  ["04", "orphans", -4, "paid", "ready", null],
  ["05", "korban", -3, "paid", "assigned", vendor.id],
  ["06", "water", -3, "paid", "in_progress", vendor.id],
  ["07", "quran", -2, "paid", "proof_submitted", vendor.id],
  ["08", "orphans", -2, "paid", "revision_required", vendor.id],
  ["09", "korban", -1, "paid", "verified", vendor.id],
  ["10", "water", -1, "paid", "verified", vendor.id],
  ["11", "quran", 0, "paid", "in_progress", vendor.id],
  ["12", "orphans", 0, "partially_refunded", "verified", vendor.id],
];

const orderRows = definitions.map(([suffix, category, offset, paymentStatus, fulfilmentStatus, vendorId], index) => {
  const offering = byCategory.get(category);
  const total = offering.unit_amount ?? Math.max(offering.min_amount ?? 5000, 5000);
  const createdAt = month(offset, 7 + (index % 3));
  const assigned = vendorId !== null;
  const verified = fulfilmentStatus === "verified";
  return {
    id: `d4500000-0000-4000-8000-0000000000${suffix}`,
    reference: `DASH-REVIEW-${suffix}`,
    customer_id: customer.id,
    customer_name: customer.display_name,
    customer_email: customerUser.email,
    customer_phone: customer.phone || "+65 8000 0000",
    offering_id: offering.id,
    service_type: offering.service_type,
    category_slug: category,
    quantity: 1,
    participant_names: [`Dashboard Review ${suffix}`],
    dedication: "Temporary dashboard review record",
    notes: "Temporary visual-review data. Safe to remove with the paired cleanup SQL.",
    unit_amount: total,
    total_amount: total,
    commission_rate_snapshot: 0.1,
    commission_amount: Math.round(total * 0.1),
    vendor_payout_amount: Math.round(total * 0.9),
    payment_provider: "hitpay",
    payment_status: paymentStatus,
    payment_reference: paymentStatus === "failed" ? null : `DASH-REVIEW-PAY-${suffix}`,
    payment_confirmed_at: paymentStatus === "failed" ? null : createdAt,
    fulfilment_status: fulfilmentStatus,
    delivery_status: "not_ready",
    settlement_status: "unpaid",
    assigned_vendor_id: vendorId,
    broadcast_started_at: ["broadcasting", "ready"].includes(fulfilmentStatus) ? createdAt : null,
    broadcast_expires_at: fulfilmentStatus === "broadcasting" ? month(0, 28) : fulfilmentStatus === "ready" && suffix === "04" ? month(offset, 12) : null,
    accepted_at: assigned ? createdAt : null,
    proof_submitted_at: ["proof_submitted", "revision_required", "verified"].includes(fulfilmentStatus) ? createdAt : null,
    admin_verified_at: verified ? createdAt : null,
    admin_verification_status: verified ? "approved" : null,
    admin_verification_notes: verified ? "Temporary dashboard review approval" : null,
    beneficiary_country: "Indonesia",
    beneficiary_state: "West Java",
    beneficiary_village: "Review Village",
    partner_organisation: "Dashboard Review Partner",
    created_at: createdAt,
    updated_at: createdAt,
  };
});

const { data: insertedOrders, error: orderError } = await supabase.from("orders").insert(orderRows).select("id, reference, payment_status, total_amount, vendor_payout_amount, created_at");
fail("Insert review orders", orderError);

const transactionRows = insertedOrders.flatMap((order) => {
  const payment = {
    order_id: order.id,
    transaction_type: "payment",
    provider_request_id: `dash-review-request-${order.reference}`,
    provider_payment_id: order.payment_status === "failed" ? null : `dash-review-payment-${order.reference}`,
    amount: order.total_amount,
    currency: "SGD",
    status: order.payment_status === "failed" ? "failed" : "succeeded",
    provider_event_at: order.created_at,
    raw_payload: { dashboard_review: true },
    created_at: order.created_at,
    updated_at: order.created_at,
  };
  if (order.payment_status !== "partially_refunded") return [payment];
  return [payment, {
    ...payment,
    transaction_type: "refund",
    provider_request_id: `dash-review-refund-${order.reference}`,
    provider_payment_id: `dash-review-refund-payment-${order.reference}`,
    amount: Math.min(1000, order.total_amount - 1),
    reason: "Temporary dashboard review refund",
  }];
});
const { error: transactionError } = await supabase.from("payment_transactions").insert(transactionRows);
fail("Insert review transactions", transactionError);

const offerOrders = insertedOrders.filter((order) => ["DASH-REVIEW-03", "DASH-REVIEW-04"].includes(order.reference));
const { error: offerError } = await supabase.from("job_offers").insert(offerOrders.map((order) => ({
  order_id: order.id,
  vendor_id: vendor.id,
  offered_at: order.created_at,
  expires_at: order.reference.endsWith("03") ? month(0, 28) : month(-4, 12),
  status: order.reference.endsWith("03") ? "offered" : "expired",
})));
fail("Insert review offers", offerError);

const payableOrders = insertedOrders.filter((order) => ["DASH-REVIEW-09", "DASH-REVIEW-10", "DASH-REVIEW-12"].includes(order.reference));
const vendorPaymentRows = payableOrders.map((order, index) => ({
  vendor_id: vendor.id,
  order_id: order.id,
  amount: index === 1 ? order.vendor_payout_amount : Math.round(order.vendor_payout_amount / 2),
  currency: "SGD",
  payment_date: order.created_at.slice(0, 10),
  method: "Dashboard review only",
  reference: `DASH-REVIEW-VENDOR-${index + 1}`,
  notes: "Temporary dashboard review ledger entry; no external transfer was made.",
  entry_type: "payment",
  created_at: order.created_at,
}));
const { error: vendorPaymentError } = await supabase.from("vendor_payments").insert(vendorPaymentRows);
fail("Insert review vendor ledger", vendorPaymentError);

console.log(`Inserted ${insertedOrders.length} review orders for ${customer.display_name} and ${vendor.display_name}.`);
