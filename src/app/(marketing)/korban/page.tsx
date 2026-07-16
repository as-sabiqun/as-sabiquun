import type { Metadata } from "next";
import { KorbanForm } from "@/components/forms";

export const metadata: Metadata = { title: "Korban" };

export default function KorbanPage() {
  return <><section className="border-b border-[var(--line)] py-20"><div className="container grid items-end gap-10 lg:grid-cols-[1.15fr_.85fr]"><div><p className="eyebrow">Korban · الأُضْحِيَّة</p><h1 className="display mt-5 text-[clamp(3rem,7vw,5.6rem)] leading-[.94]">Korban,<br />coordinated.</h1></div><p className="lead">See the package, provide participant details, and walk through how an order would be assigned and documented.</p></div></section><section className="section"><div className="container grid items-start gap-14 lg:grid-cols-[.72fr_1.28fr]"><div className="prose lg:sticky lg:top-24"><p className="eyebrow">The demonstration</p><h2>One package. Clear steps.</h2><p>This prototype uses a single overseas cow-share package so the team can review the complete customer-to-vendor journey without managing a full catalogue.</p><h2>What happens next?</h2><p>After the simulated payment, the order appears in the admin dashboard. An admin assigns a vendor, who records progress and uploads completion evidence.</p><div className="rounded-[10px] border border-[var(--line)] bg-[var(--cream-dark)] p-5 text-sm leading-7 text-[var(--muted)]"><strong className="text-[var(--ink)]">Important</strong><br />Package, price, location, and religious copy are demonstration content and require operational and religious review before launch.</div></div><KorbanForm /></div></section></>;
}
