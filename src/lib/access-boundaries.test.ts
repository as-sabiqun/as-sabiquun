import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const customerReadFiles = [
  "src/app/dashboard/page.tsx",
  "src/app/dashboard/projects/page.tsx",
  "src/app/dashboard/report/page.tsx",
  "src/app/dashboard/report/actions.ts",
  "src/app/dashboard/orders/[reference]/page.tsx",
  "src/app/checkout/[reference]/page.tsx",
  "src/app/receipts/[orderId]/route.tsx",
];

const vendorReadFiles = [
  "src/lib/vendor-orders-fetch.ts",
  "src/app/vendor-dashboard/jobs/[id]/page.tsx",
  "src/app/vendor-dashboard/earnings/page.tsx",
  "src/app/vendor-dashboard/reports/page.tsx",
];

async function sources(paths: string[]) {
  return Promise.all(paths.map(async (path) => ({
    path,
    source: await readFile(resolve(process.cwd(), path), "utf8"),
  })));
}

test("customer portal reads scoped contracts instead of operational base tables", async () => {
  const files = await sources(customerReadFiles);
  for (const file of files) {
    assert.doesNotMatch(file.source, /\.from\(["'](?:orders|completion_reports|notification_deliveries)["']\)/, file.path);
  }

  const combined = files.map((file) => file.source).join("\n");
  assert.match(combined, /\.from\(["']customer_orders["']\)/);
  assert.match(combined, /\.from\(["']customer_completion_report_metadata["']\)/);
  assert.match(combined, /\.from\(["']customer_notification_deliveries["']\)/);
});

test("vendor portal separates redacted offers from assigned job records", async () => {
  const files = await sources(vendorReadFiles);
  for (const file of files) {
    assert.doesNotMatch(file.source, /\.from\(["'](?:orders|job_offers)["']\)/, file.path);
  }

  const combined = files.map((file) => file.source).join("\n");
  assert.match(combined, /\.from\(["']vendor_job_offers["']\)/);
  assert.match(combined, /\.from\(["']vendor_assigned_orders["']\)/);
});

test("vendor revisions show only the latest submission and cancelled work is not payable", async () => {
  const [detail, earnings] = await sources([
    "src/app/vendor-dashboard/jobs/[id]/page.tsx",
    "src/app/vendor-dashboard/earnings/page.tsx",
  ]);

  assert.match(detail.source, /\.from\(["']completion_submissions["']\)/);
  assert.match(detail.source, /\.eq\(["']submission_id["'], submission\.id\)/);
  assert.match(earnings.source, /fulfilment_status !== ["']cancelled["']/);
});
