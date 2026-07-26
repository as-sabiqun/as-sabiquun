import assert from "node:assert/strict";
import test from "node:test";
import { projectCustomerReport, safeReportLink, type CompletionReportSource } from "./model.ts";
import { getCompletionReportAction, prepareCompletionReportsBeforeDelivery } from "./workflow.ts";

test("customer report projection excludes operational and financial-only fields", () => {
  const source = {
    submissionId: "submission-secret-id",
    generatedAt: "2026-07-26T10:00:00.000Z",
    projectPortalUrl: "https://www.as-sabiqun.com/dashboard/orders/AS-1",
    receiptUrl: "https://www.as-sabiqun.com/receipts/AS-1",
    job: {
      id: "order-secret-id",
      reference: "AS-1",
      serviceType: "Wakaf",
      packagePurchased: "Water pump",
      createdAt: "2026-07-20T10:00:00.000Z",
      assignedAt: "2026-07-21T10:00:00.000Z",
      completedAt: null,
      totalProcessingTime: "6 days",
      packagePrice: 50000,
      vendorCost: 23000,
      currency: "SGD",
    },
    customer: { name: "Aminah", phone: "+65 8000 0000", email: "aminah@example.com", invoiceNumber: "AS-1" },
    beneficiary: { country: "Indonesia", state: "Aceh", village: "Village", partnerOrganisation: "Partner", names: [] },
    dedication: { names: ["Family"], arabicSpelling: null, remarks: null },
    vendor: {
      name: "Trusted Partner",
      id: "vendor-secret-id",
      acceptedAt: "2026-07-21T10:00:00.000Z",
      submittedBy: "Trusted Partner",
      bankDetails: { bankName: "Secret Bank", accountName: "Partner", accountNumber: "123456", swiftCode: "SECRET" },
    },
    location: { country: "Indonesia", state: "Aceh", village: "Village", address: "Site", latitude: 1, longitude: 2, mapsLink: null },
    evidence: [{
      id: "proof-1",
      category: "before_photo",
      mediaType: "photo",
      mimeType: "image/jpeg",
      sizeBytes: 1000,
      storagePath: "vendor/order/private.jpg",
      createdAt: "2026-07-25T10:00:00.000Z",
      portalUrl: "https://www.as-sabiqun.com/dashboard/orders/AS-1#evidence",
    }],
    vendorRemarks: "Internal vendor note",
    verification: {
      verifiedBy: "Admin",
      verifiedAt: "2026-07-26T10:00:00.000Z",
      notes: "Internal admin note",
      status: "approved" as const,
      submissionVersion: 1,
    },
    notifications: [],
    payments: [{ amount: 23000, date: "2026-07-26", method: "bank", reference: "SECRET-PAYMENT" }],
    audit: [
      { eventType: "order.created", actorRole: "customer", createdAt: "2026-07-20T10:00:00.000Z" },
      { eventType: "admin.internal_note", actorRole: "admin", createdAt: "2026-07-26T10:00:00.000Z" },
    ],
  } satisfies CompletionReportSource;

  const serialized = JSON.stringify(projectCustomerReport(source));
  for (const secret of ["submission-secret-id", "order-secret-id", "23000", "vendor-secret-id", "Secret Bank", "123456", "SECRET", "private.jpg", "Internal vendor note", "Internal admin note", "SECRET-PAYMENT", "admin.internal_note"]) {
    assert.equal(serialized.includes(secret), false, `leaked ${secret}`);
  }
  assert.match(serialized, /Order received/);
  assert.match(serialized, /proof-1/);
  assert.match(serialized, /receipts/);
  assert.equal(safeReportLink("javascript:alert(1)"), null);
  assert.equal(safeReportLink("https://maps.google.com/?q=1,2"), "https://maps.google.com/?q=1,2");
});

test("both report records are prepared before customer delivery is queued", async () => {
  const calls: string[] = [];
  const result = await prepareCompletionReportsBeforeDelivery({
    prepareCustomer: async () => { calls.push("customer"); return { id: "customer-report" }; },
    prepareInternal: async () => { calls.push("internal"); return { id: "internal-report" }; },
    queueDelivery: async (customer) => { calls.push(`queue:${customer.id}`); },
  });

  assert.deepEqual(calls, ["customer", "internal", "queue:customer-report"]);
  assert.deepEqual(result, {
    customer: { id: "customer-report" },
    internal: { id: "internal-report" },
  });
});

test("an internal report failure never queues customer delivery", async () => {
  let queued = false;
  await assert.rejects(prepareCompletionReportsBeforeDelivery({
    prepareCustomer: async () => ({ id: "customer-report" }),
    prepareInternal: async () => { throw new Error("internal storage failed"); },
    queueDelivery: async () => { queued = true; },
  }), /internal storage failed/);
  assert.equal(queued, false);
});

test("admin recovery remains available when notifications exist but the internal report is missing", () => {
  assert.equal(getCompletionReportAction({
    verified: true,
    deliveryComplete: false,
    notificationCount: 2,
    hasCustomerReport: true,
    hasInternalReport: false,
  }), "recover_internal");
  assert.equal(getCompletionReportAction({
    verified: true,
    deliveryComplete: true,
    notificationCount: 2,
    hasCustomerReport: true,
    hasInternalReport: false,
  }), "recover_internal");
});
