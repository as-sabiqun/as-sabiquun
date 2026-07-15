import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { completeDemoPayment } from "@/app/actions";
import { money } from "@/lib/domain";
import { createServiceSupabase, isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Demo checkout" };
export const dynamic = "force-dynamic";

export default async function DemoCheckoutPage({ params, searchParams }: PageProps<"/checkout/demo/[token]">) {
  const { token } = await params;
  const query = await searchParams;
  if (!isSupabaseConfigured) return <BackendNotice />;
  const { data: order } = await createServiceSupabase().from("orders").select("reference, quantity, total_amount, payment_status, offerings(title, detail, location)").eq("checkout_token", token).single();
  if (!order) notFound();
  const offering = Array.isArray(order.offerings) ? order.offerings[0] : order.offerings;
  const action = completeDemoPayment.bind(null, token);
  return <section className="section pattern"><div className="container max-w-2xl"><div className="card p-7 md:p-10"><span className="status">Simulated checkout</span><h1 className="display mt-4 text-5xl font-semibold text-[var(--teal-dark)]">Review your demo order.</h1><p className="lead mt-4">No bank, card, PayNow, or payment provider will be contacted.</p>{query.error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-800">The simulated payment could not be completed.</p>}<dl className="my-8 grid gap-4 border-y border-[var(--line)] py-6 text-sm"><div className="flex justify-between gap-4"><dt>Reference</dt><dd className="font-bold">{order.reference}</dd></div><div className="flex justify-between gap-4"><dt>Service</dt><dd className="text-right font-bold">{offering?.title}</dd></div><div className="flex justify-between gap-4"><dt>Quantity</dt><dd className="font-bold">{order.quantity}</dd></div><div className="flex justify-between gap-4 text-lg"><dt>Demo total</dt><dd className="font-bold text-[var(--teal)]">{money(order.total_amount)}</dd></div></dl>{order.payment_status === "paid" ? <p className="rounded-xl bg-emerald-50 p-4 text-emerald-800">This demonstration order is already marked paid.</p> : <form action={action}><button className="btn w-full">Simulate successful payment <span>→</span></button></form>}</div></div></section>;
}

function BackendNotice() { return <section className="section"><div className="container max-w-xl card p-8"><span className="status">Setup required</span><h1 className="display mt-4 text-4xl font-semibold">The connected demo is not configured yet.</h1><p className="lead mt-4">Add the Supabase environment variables to create and review demonstration orders.</p></div></section>; }
