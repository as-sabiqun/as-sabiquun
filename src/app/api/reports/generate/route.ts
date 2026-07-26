import { generateCompletionReportsForAdmin, ReportGenerationError } from "@/lib/reports/service";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { orderId?: unknown; regenerateInternal?: unknown } | null;
  if (!body || typeof body.orderId !== "string" || !uuid.test(body.orderId) || (body.regenerateInternal !== undefined && typeof body.regenerateInternal !== "boolean")) {
    return Response.json({ error: "A valid order ID is required." }, { status: 400 });
  }

  try {
    const reports = await generateCompletionReportsForAdmin(await createClient(), body.orderId, body.regenerateInternal === true);
    return Response.json({ reports });
  } catch (error) {
    if (error instanceof ReportGenerationError) {
      const status = error.code === "forbidden" ? 403 : error.code === "not_found" ? 404 : error.code === "invalid_state" ? 409 : 500;
      return Response.json({ error: error.message }, { status });
    }
    console.error("Completion report generation failed", error);
    return Response.json({ error: "Completion report generation failed." }, { status: 500 });
  }
}
