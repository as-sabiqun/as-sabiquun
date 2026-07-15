import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { LoginForm } from "@/components/auth-form";
import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Team login" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (isSupabaseConfigured) {
    const { data: { user } } = await (await createServerSupabase()).auth.getUser();
    if (user) redirect("/dashboard");
  }
  return <main className="pattern grid min-h-screen place-items-center p-5"><div className="card w-full max-w-md p-7 shadow-[0_28px_80px_rgba(7,63,70,.12)] md:p-9"><Brand /><p className="eyebrow mt-10">Team access</p><h1 className="display mt-3 text-5xl font-semibold text-[var(--teal-dark)]">Welcome back.</h1><p className="mb-8 mt-4 text-sm leading-7 text-[var(--muted)]">Admin and vendor accounts use the same secure entrance.</p>{isSupabaseConfigured ? <LoginForm /> : <p className="rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">Add the Supabase environment variables to enable team login.</p>}<Link href="/" className="mt-7 block text-center text-sm font-bold text-[var(--teal)]">← Return to website</Link></div></main>;
}
