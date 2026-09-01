import { redirect } from "next/navigation";
import { safeVendorRedirectPath } from "@/lib/auth-redirect";
import { ForgotPasswordForm } from "./form";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ context?: string; next?: string }> }) {
  const params = await searchParams;
  if (params.context !== "partner") redirect("/login");
  return <ForgotPasswordForm next={safeVendorRedirectPath(params.next)} />;
}
