import { NextResponse } from "next/server";
import { getAal2Admin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, { params }: { params: Promise<{ proofId: string }> }) {
  const { proofId } = await params;
  if (!UUID.test(proofId)) return NextResponse.json({ error: "Evidence not found." }, { status: 404 });

  const session = await createClient();
  const { data: authData } = await session.auth.getUser();
  if (!authData.user) return NextResponse.json({ error: "Sign in to view this evidence." }, { status: 401 });

  const admin = await getAal2Admin(session);
  if (!admin) {
    const { data: visible } = await session
      .from("customer_completion_evidence")
      .select("proof_id")
      .eq("proof_id", proofId)
      .maybeSingle();
    if (!visible) return NextResponse.json({ error: "Evidence not found." }, { status: 404 });
  }

  const service = createAdminClient();
  const { data: proof } = await service.from("proofs").select("storage_path").eq("id", proofId).maybeSingle();
  if (!proof) return NextResponse.json({ error: "Evidence not found." }, { status: 404 });
  const { data: signed } = await service.storage.from("proofs").createSignedUrl(proof.storage_path, 5 * 60);
  if (!signed?.signedUrl) return NextResponse.json({ error: "Evidence is temporarily unavailable." }, { status: 503 });

  return NextResponse.redirect(signed.signedUrl, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
}
