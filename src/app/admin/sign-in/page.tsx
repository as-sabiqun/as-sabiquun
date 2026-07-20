import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth-form";
import { Brand } from "@/components/brand";
import { arePortalDemosEnabled, createServerSupabase, isAuthConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Staff sign in",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminSignInPage() {
  if (isAuthConfigured) {
    const { data } = await (await createServerSupabase()).auth.getClaims();
    if (data?.claims?.sub) redirect("/dashboard");
  }

  return (
    <main className="access-gateway min-h-screen bg-[var(--cream)] lg:grid lg:grid-cols-[minmax(300px,.72fr)_minmax(520px,1.28fr)]">
      <section className="access-story relative hidden min-h-screen overflow-hidden bg-[var(--ink)] p-12 text-white lg:flex lg:flex-col xl:p-16">
        <Brand inverse />
        <div className="my-auto max-w-md">
          <p className="text-[.68rem] font-extrabold uppercase tracking-[.18em] text-[var(--gold)]">Private operations</p>
          <h1 className="display mt-6 text-[clamp(3.2rem,5vw,5.4rem)] leading-[.92] text-white">Staff access only.</h1>
          <p className="mt-7 text-sm leading-7 text-white/60">Admin accounts are invited, role-checked on the server, and designed to require an authenticator second step before production access.</p>
        </div>
        <p className="text-xs leading-6 text-white/45">This route is intentionally absent from the public website. The URL itself is not the security boundary.</p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden"><Brand compact /></div>
          <p className="eyebrow">Admin workspace</p>
          <h2 className="display mt-4 text-4xl sm:text-5xl">Sign in to operations.</h2>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">Use the staff account issued by As-Sābiqūn. Vendor and customer accounts cannot enter this workspace.</p>

          <section className="mt-8 rounded-[1.4rem] border border-[var(--line)] bg-white p-5 shadow-[0_24px_70px_rgba(49,35,27,.07)] sm:p-7">
            {isAuthConfigured ? <LoginForm /> : arePortalDemosEnabled ? <div className="grid gap-4"><div className="rounded-xl bg-[var(--teal-soft)] p-4 text-xs leading-6 text-[var(--muted)]"><strong className="block text-[var(--teal)]">Prototype access</strong>Authentication is not connected in this environment. Production staff access will add mandatory TOTP after password verification.</div><Link className="btn w-full" href="/admin">Open admin workspace demo</Link></div> : <div className="rounded-xl border border-[rgba(162,124,71,.24)] bg-[#faf7f1] p-4 text-sm leading-7 text-[var(--muted)]"><strong className="block text-[var(--ink)]">Staff access is not configured.</strong>The admin workspace is closed until authentication is connected.</div>}
          </section>

          <Link href="/login" className="mt-6 block text-center text-xs font-bold text-[var(--teal)]">Return to customer and vendor access</Link>
        </div>
      </section>
    </main>
  );
}
