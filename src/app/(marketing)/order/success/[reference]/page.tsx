import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceSupabase, isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Order confirmed" };
export const dynamic = "force-dynamic";

export default async function SuccessPage({ params }: PageProps<"/order/success/[reference]">) {
  const { reference } = await params;
  if (!isSupabaseConfigured) notFound();
  const { data: order } = await createServiceSupabase().from("orders").select("reference, service_type, payment_status").eq("reference", reference).single();
  if (!order) notFound();
  return <section className="section pattern"><div className="container max-w-2xl text-center"><div className="card p-8 md:p-12"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--teal)] text-2xl text-white">✓</div><p className="eyebrow mt-7">Demo payment recorded</p><h1 className="display mt-3 text-6xl font-semibold text-[var(--teal-dark)]">Order confirmed.</h1><p className="lead mt-5">The order is now visible to the admin and can be assigned to a vendor.</p><div className="mx-auto my-8 max-w-sm rounded-2xl bg-[var(--teal-soft)] p-5"><span className="text-xs font-bold uppercase tracking-[.12em] text-[var(--muted)]">Reference</span><strong className="mt-2 block text-2xl text-[var(--teal-dark)]">{order.reference}</strong></div><Link href="/" className="btn btn-secondary">Return home</Link></div></div></section>;
}
