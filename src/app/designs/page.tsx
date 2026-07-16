import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/brand";

export const metadata: Metadata = { title: "Design directions" };

const concepts = [
  {
    slug: "heritage",
    letter: "A",
    title: "Sacred Heritage",
    description: "Ceremonial, trusted, and unmistakably Islamic.",
    reference: "Current direction · refined",
    colors: ["#063f46", "#b17a27", "#fbf6ec"],
    preview: "bg-[#fbf6ec] text-[#063f46] font-serif",
  },
  {
    slug: "modern",
    letter: "B",
    title: "Modern Trust",
    description: "Clear, fast, and operational—like a modern financial product.",
    reference: "Ramp × Linear",
    colors: ["#063d2e", "#39e68a", "#f5fff8"],
    preview: "bg-[#063d2e] text-white font-sans",
  },
  {
    slug: "editorial",
    letter: "C",
    title: "Quiet Editorial",
    description: "Thoughtful, premium, and built around conviction.",
    reference: "Notion × Mercury",
    colors: ["#171713", "#b6492e", "#eee9df"],
    preview: "bg-[#eee9df] text-[#171713] font-serif",
  },
  {
    slug: "community",
    letter: "D",
    title: "Warm Community",
    description: "Human, welcoming, and easy for every generation.",
    reference: "Headspace × Airbnb",
    colors: ["#214e3b", "#f5a780", "#fff7e9"],
    preview: "bg-[#fff7e9] text-[#214e3b] font-sans",
  },
];

export default function DesignsPage() {
  return (
    <main className="min-h-screen bg-[#f3efe7] text-[#1c2926]">
      <header className="border-b border-black/10 bg-[#f3efe7]/90 backdrop-blur">
        <div className="mx-auto flex h-20 w-[min(1240px,calc(100%-32px))] items-center justify-between">
          <Brand />
          <Link href="/" className="rounded-full border border-black/15 px-4 py-2 text-sm font-semibold hover:bg-white">
            Return to live site
          </Link>
        </div>
      </header>

      <section className="mx-auto w-[min(1240px,calc(100%-32px))] py-16 md:py-24">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-[#8c5f20]">Design exploration · 04 directions</p>
        <div className="mt-5 grid gap-7 lg:grid-cols-[1.25fr_.75fr] lg:items-end">
          <h1 className="display text-[clamp(3.5rem,8vw,7rem)] font-semibold leading-[.82] tracking-[-.05em]">
            Choose how<br />trust should feel.
          </h1>
          <p className="max-w-lg text-base leading-8 text-[#64716e]">
            Each route is a complete landing-page system with its own type, palette, spacing, buttons, cards, and tone. The current homepage stays unchanged until a direction is chosen.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {concepts.map((concept) => (
            <Link
              key={concept.slug}
              href={`/designs/${concept.slug}`}
              className="group overflow-hidden rounded-[28px] border border-black/10 bg-white p-3 shadow-[0_18px_50px_rgba(29,48,42,.06)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(29,48,42,.12)]"
            >
              <div className={`${concept.preview} relative flex min-h-64 flex-col justify-between overflow-hidden rounded-[20px] p-7`}>
                <span className="text-xs font-bold uppercase tracking-[.18em] opacity-65">Direction {concept.letter}</span>
                <div>
                  <p className="max-w-sm text-[clamp(2.2rem,5vw,4.3rem)] font-semibold leading-[.88] tracking-[-.045em]">{concept.title}</p>
                  <div className="mt-6 flex gap-2">
                    {concept.colors.map((color) => <span key={color} className="h-7 w-7 rounded-full border border-black/10" style={{ background: color }} />)}
                  </div>
                </div>
                <span className="absolute -bottom-16 -right-12 h-48 w-48 rounded-full border-[28px] border-current opacity-10 transition group-hover:scale-110" />
              </div>
              <div className="flex items-end justify-between gap-5 px-3 pb-3 pt-5">
                <div><p className="font-bold">{concept.description}</p><p className="mt-1 text-sm text-[#73807c]">Reference: {concept.reference}</p></div>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-black/15 text-xl transition group-hover:bg-[#063f46] group-hover:text-white">↗</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
