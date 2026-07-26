import { downloadCompletionReportForViewer, ReportGenerationError } from "@/lib/reports/service";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, { params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  if (!uuid.test(reportId)) return Response.json({ error: "Report not found." }, { status: 404 });

  try {
    const report = await downloadCompletionReportForViewer(await createClient(), reportId);
    return new Response(new Uint8Array(report.bytes), {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Disposition": `attachment; filename="${report.filename}"`,
        "Content-Type": "application/pdf",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof ReportGenerationError) {
      const status = error.code === "forbidden" ? 403 : error.code === "not_found" ? 404 : 503;
      return Response.json({ error: error.message }, { status });
    }
    console.error("Completion report download failed", error);
    return Response.json({ error: "The report could not be downloaded." }, { status: 500 });
  }
}
