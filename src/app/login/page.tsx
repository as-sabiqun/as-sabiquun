import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccessGateway } from "@/components/access-gateway";
import { arePortalDemosEnabled, createServerSupabase, isAuthConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Account access", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ portal?: string; error?: string }> }) {
  const params = await searchParams;
  if (isAuthConfigured) {
    const { data } = await (await createServerSupabase()).auth.getClaims();
    if (data?.claims?.sub) redirect("/dashboard");
  }

  return <AccessGateway configured={isAuthConfigured} demoEnabled={arePortalDemosEnabled} initialRole={params.portal === "customer" ? "customer" : "vendor"} notice={params.error === "wrong-portal" ? "That account does not have access to this workspace. Choose the account type assigned to you." : undefined} />;
}
