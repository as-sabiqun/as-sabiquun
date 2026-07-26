export interface CompletionEvidence {
  id: string;
  category: string;
  mediaType: "photo" | "video";
  mimeType: string | null;
  sizeBytes: number | null;
  storagePath: string;
  createdAt: string;
  portalUrl: string;
}

export interface CompletionReportSource {
  submissionId: string;
  generatedAt: string;
  projectPortalUrl: string;
  receiptUrl: string;
  job: {
    id: string;
    reference: string;
    serviceType: string;
    packagePurchased: string;
    createdAt: string;
    assignedAt: string | null;
    completedAt: string | null;
    totalProcessingTime: string;
    packagePrice: number;
    vendorCost: number;
    currency: "SGD";
  };
  customer: {
    name: string;
    phone: string;
    email: string;
    invoiceNumber: string;
  };
  beneficiary: {
    country: string | null;
    state: string | null;
    village: string | null;
    partnerOrganisation: string | null;
    names: string[];
  };
  dedication: {
    names: string[];
    arabicSpelling: string | null;
    remarks: string | null;
  };
  vendor: {
    name: string;
    id: string;
    acceptedAt: string | null;
    submittedBy: string;
    bankDetails: {
      bankName: string | null;
      accountName: string | null;
      accountNumber: string | null;
      swiftCode: string | null;
    };
  };
  location: {
    country: string;
    state: string;
    village: string;
    address: string;
    latitude: number;
    longitude: number;
    mapsLink: string | null;
  };
  evidence: CompletionEvidence[];
  vendorRemarks: string;
  verification: {
    verifiedBy: string;
    verifiedAt: string;
    notes: string | null;
    status: "approved";
    submissionVersion: number;
  };
  notifications: Array<{
    channel: "email" | "telegram";
    status: string;
    attemptedAt: string | null;
    sentAt: string | null;
    deliveredAt: string | null;
    error: string | null;
  }>;
  payments: Array<{
    amount: number;
    date: string;
    method: string | null;
    reference: string | null;
  }>;
  audit: Array<{
    eventType: string;
    actorRole: string;
    createdAt: string;
  }>;
}

export interface CustomerCompletionReport {
  generatedAt: string;
  projectPortalUrl: string;
  receiptUrl: string;
  job: Omit<CompletionReportSource["job"], "id" | "vendorCost">;
  customerName: string;
  beneficiary: CompletionReportSource["beneficiary"];
  dedication: CompletionReportSource["dedication"];
  location: CompletionReportSource["location"];
  evidence: Array<Omit<CompletionEvidence, "storagePath" | "mimeType" | "sizeBytes">>;
  timeline: Array<{ label: string; createdAt: string }>;
  completionStatement: string;
}

const customerTimelineLabels: Record<string, string> = {
  "order.created": "Order received",
  "payment.paid": "Payment confirmed",
  "payment.partially_refunded": "Payment updated",
  "vendor.accepted": "Fulfilment partner assigned",
  "fulfilment.in_progress": "Project work started",
  "fulfilment.proof_submitted": "Completion evidence submitted",
  "fulfilment.revision_required": "Evidence refinement in progress",
  "fulfilment.verified": "Project evidence verified",
  "delivery.delivered": "Completion report delivered",
  "settlement.paid": "Project record closed",
};

export function safeReportLink(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function projectCustomerReport(source: CompletionReportSource): CustomerCompletionReport {
  return {
    generatedAt: source.generatedAt,
    projectPortalUrl: source.projectPortalUrl,
    receiptUrl: source.receiptUrl,
    job: {
      reference: source.job.reference,
      serviceType: source.job.serviceType,
      packagePurchased: source.job.packagePurchased,
      createdAt: source.job.createdAt,
      assignedAt: source.job.assignedAt,
      completedAt: source.job.completedAt,
      totalProcessingTime: source.job.totalProcessingTime,
      packagePrice: source.job.packagePrice,
      currency: source.job.currency,
    },
    customerName: source.customer.name,
    beneficiary: source.beneficiary,
    dedication: source.dedication,
    location: source.location,
    evidence: source.evidence.map((proof) => ({
      id: proof.id,
      category: proof.category,
      mediaType: proof.mediaType,
      createdAt: proof.createdAt,
      portalUrl: proof.portalUrl,
    })),
    timeline: source.audit.flatMap((event) => {
      const label = customerTimelineLabels[event.eventType];
      return label ? [{ label, createdAt: event.createdAt }] : [];
    }),
    completionStatement: "As-Sabiquun has verified the project evidence and recorded this amanah in your secure project portal.",
  };
}
