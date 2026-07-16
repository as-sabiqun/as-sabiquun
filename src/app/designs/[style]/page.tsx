import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandMark } from "@/components/brand";

const styles = ["heritage", "modern", "editorial", "community"] as const;
type Style = (typeof styles)[number];

const names: Record<Style, string> = {
  heritage: "A · Emerald Sanctuary",
  modern: "B · Noor Digital",
  editorial: "C · Modern Manuscript",
  community: "D · Amanah Community",
};

const stages = ["Intention received", "Team review", "Vendor fulfilment", "Proof delivered"];

export function generateStaticParams() {
  return styles.map((style) => ({ style }));
}

export async function generateMetadata({ params }: PageProps<"/designs/[style]">): Promise<Metadata> {
  const { style } = await params;
  return { title: style in names ? names[style as Style] : "Design direction" };
}

function DirectionBar({ current }: { current: Style }) {
  return (
    <div className="sticky top-0 z-50 border-b border-black/10 bg-white/95 text-[#14221f] backdrop-blur">
      <div className="mx-auto flex min-h-16 w-[min(1280px,calc(100%-24px))] items-center gap-3 overflow-x-auto py-2">
        <Link href="/designs" className="mr-auto shrink-0 text-sm font-black">← All directions</Link>
        {styles.map((style) => (
          <Link key={style} href={`/designs/${style}`} className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold ${current === style ? "bg-[#123f38] text-white" : "border border-black/10 hover:bg-black/5"}`}>
            {names[style]}
          </Link>
        ))}
      </div>
    </div>
  );
}

function BrandLockup({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-[#f8f3e8]"><BrandMark className="h-9 w-9" /></span>
      <span><strong className={`display block text-[1.35rem] leading-none ${inverse ? "text-white" : "text-[#103f36]"}`}>As-Sābiqūn</strong><small className={`mt-1 block text-[.52rem] font-bold uppercase tracking-[.19em] ${inverse ? "text-[#c8a968]" : "text-[#9a7334]"}`}>Association Consultancy</small></span>
    </div>
  );
}

function EightPoint({ className = "h-20 w-20" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <path d="M50 4 61 31 88 20 69 43 96 50 69 57 88 80 61 69 50 96 39 69 12 80 31 57 4 50 31 43 12 20 39 31Z" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="50" cy="50" r="17" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="50" cy="50" r="4" fill="currentColor" />
    </svg>
  );
}

function Arch({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-t-[999px] border ${className}`}>{children}</div>;
}

function ProcessPanel({ dark = false }: { dark?: boolean }) {
  return (
    <div className={`rounded-3xl border p-6 md:p-7 ${dark ? "border-white/15 bg-white/[.06]" : "border-black/10 bg-white"}`}>
      <div className={`flex items-center justify-between border-b pb-5 ${dark ? "border-white/15" : "border-black/10"}`}><div><p className={`text-[.68rem] font-black uppercase tracking-[.16em] ${dark ? "text-[#b8d8ca]" : "text-[#60766e]"}`}>Fulfilment record</p><h3 className="mt-1 text-xl font-black">Korban · Demo 0017</h3></div><span className={`rounded-full px-3 py-2 text-[.65rem] font-black ${dark ? "bg-[#c8a968] text-[#112d27]" : "bg-[#dff4e8] text-[#164c3e]"}`}>IN REVIEW</span></div>
      <div className="mt-5 space-y-1">
        {stages.map((stage, index) => (
          <div key={stage} className={`grid grid-cols-[34px_1fr_auto] items-center gap-3 rounded-xl px-3 py-3 ${index === 1 ? dark ? "bg-white/10" : "bg-[#f1f7f3]" : ""}`}>
            <span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-black ${index === 0 ? "bg-[#1d5c4c] text-white" : index === 1 ? "border border-[#c8a968] text-[#c8a968]" : dark ? "border border-white/20 text-white/50" : "border border-black/10 text-black/40"}`}>{index + 1}</span>
            <strong className="text-sm">{stage}</strong>
            <span className={`text-[.68rem] font-bold ${dark ? "text-white/50" : "text-[#72827d]"}`}>{index === 0 ? "Done" : index === 1 ? "Current" : "Next"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Palette({ colors, labels, dark = false }: { colors: string[]; labels: string[]; dark?: boolean }) {
  return (
    <div className={`grid gap-6 border-t pt-9 md:grid-cols-[1fr_1.4fr] ${dark ? "border-white/15" : "border-black/10"}`}>
      <div><p className="text-[.68rem] font-black uppercase tracking-[.17em] opacity-55">Design foundation</p><h2 className="mt-2 text-2xl font-black">Palette & interface tone</h2></div>
      <div className="flex flex-wrap gap-4">{colors.map((color, index) => <div key={color} className="grid gap-2 text-xs font-bold"><span className={`h-11 w-20 rounded-full border ${dark ? "border-white/15" : "border-black/10"}`} style={{ backgroundColor: color }} /><span>{labels[index]}</span></div>)}</div>
    </div>
  );
}

function Heritage() {
  return (
    <div className="min-h-screen bg-[#f4efe3] text-[#173a33]">
      <header className="border-b border-[#173a33]/15 bg-[#f4efe3]/95">
        <div className="mx-auto flex h-24 w-[min(1200px,calc(100%-32px))] items-center justify-between"><BrandLockup /><nav className="hidden gap-8 text-sm font-bold lg:flex"><span>Our purpose</span><span>Islamic services</span><span>How it works</span><span>Contact</span></nav><Link href="/korban" className="rounded-full bg-[#174d40] px-5 py-3 text-sm font-black text-white">Arrange a service</Link></div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-[#173a33]/15 py-20 md:py-28">
          <EightPoint className="absolute -right-20 -top-28 h-[440px] w-[440px] text-[#b08a45]/15" />
          <div className="relative mx-auto grid w-[min(1200px,calc(100%-32px))] items-center gap-14 lg:grid-cols-[1.05fr_.95fr]">
            <div><p className="arabic text-2xl text-[#a5772e]" lang="ar" dir="rtl">الأمانة • الإحسان • الوضوح</p><h1 className="display mt-5 max-w-3xl text-[clamp(3.8rem,7vw,6.6rem)] font-semibold leading-[.86] tracking-[-.05em]">Faithful service.<br /><em className="text-[#1d5c4c]">Clearly delivered.</em></h1><p className="mt-8 max-w-xl text-lg leading-8 text-[#60716b]">A modern home for Korban and Wakaf—coordinated with care, transparent at every handoff, and completed with documented proof.</p><div className="mt-9 flex flex-wrap gap-3"><Link href="/korban" className="rounded-full bg-[#174d40] px-6 py-4 font-black text-white">Explore Korban <span aria-hidden>→</span></Link><Link href="/wakaf" className="rounded-full border border-[#174d40] px-6 py-4 font-black">View Wakaf</Link></div><div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-xs font-bold uppercase tracking-[.11em] text-[#60716b]"><span>Transparent scope</span><span>Human coordination</span><span>Recorded proof</span></div></div>
            <Arch className="relative min-h-[560px] overflow-hidden border-[#9f7a39]/35 bg-[#123f36] p-5 text-white shadow-[0_30px_80px_rgba(23,58,51,.2)]"><div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(45deg,#fff 1px,transparent 1px),linear-gradient(-45deg,#fff 1px,transparent 1px)", backgroundSize: "42px 42px" }} /><div className="relative flex h-full min-h-[520px] flex-col rounded-t-[999px] border border-white/15 p-7 pt-20"><p className="text-center text-[.68rem] font-black uppercase tracking-[.2em] text-[#d6bb83]">Begin with intention</p><EightPoint className="mx-auto mt-7 h-28 w-28 text-[#d6bb83]" /><h2 className="display mt-8 text-center text-4xl font-semibold">Two services.<br />One standard of care.</h2><div className="mt-auto grid grid-cols-2 gap-3"><Link href="/korban" className="rounded-2xl bg-[#f4efe3] p-4 text-[#173a33]"><span className="arabic text-2xl text-[#a5772e]">قربان</span><strong className="mt-4 block">Korban</strong><small className="mt-1 block text-[#64746e]">S$280 · cow share</small></Link><Link href="/wakaf" className="rounded-2xl border border-white/25 p-4"><span className="arabic text-2xl text-[#d6bb83]">وقف</span><strong className="mt-4 block">Wakaf</strong><small className="mt-1 block text-white/60">From S$10</small></Link></div></div></Arch>
          </div>
        </section>

        <section className="mx-auto grid w-[min(1200px,calc(100%-32px))] gap-12 py-24 lg:grid-cols-[.85fr_1.15fr] lg:items-center"><div><p className="text-xs font-black uppercase tracking-[.17em] text-[#a5772e]">Amanah in practice</p><h2 className="display mt-4 text-5xl font-semibold leading-[.95]">You should always know what happens next.</h2><p className="mt-6 max-w-lg leading-8 text-[#60716b]">The service record follows your intention from submission through team review, vendor fulfilment, and completion evidence.</p></div><ProcessPanel /></section>
        <section className="bg-[#123f36] py-16 text-white"><div className="mx-auto w-[min(1200px,calc(100%-32px))]"><Palette colors={["#123f36","#1d5c4c","#b08a45","#f4efe3"]} labels={["Sanctuary","Service","Antique gold","Warm ivory"]} dark /></div></section>
      </main>
    </div>
  );
}

function Modern() {
  return (
    <div className="min-h-screen bg-[#071d19] font-sans text-white">
      <header className="border-b border-white/10"><div className="mx-auto flex h-20 w-[min(1240px,calc(100%-32px))] items-center justify-between"><BrandLockup inverse /><nav className="hidden gap-8 text-sm font-bold text-white/70 lg:flex"><span>Services</span><span>Process</span><span>Accountability</span></nav><Link href="/korban" className="rounded-xl bg-[#8be1bd] px-5 py-3 text-sm font-black text-[#09251f]">Begin Korban</Link></div></header>
      <main>
        <section className="relative overflow-hidden py-20 md:py-28"><div className="absolute inset-0 opacity-[.08]" style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "60px 60px" }} /><EightPoint className="absolute -bottom-52 -left-40 h-[620px] w-[620px] text-[#8be1bd]/10" /><div className="relative mx-auto grid w-[min(1240px,calc(100%-32px))] items-center gap-14 lg:grid-cols-[1.05fr_.95fr]"><div><span className="inline-flex items-center gap-2 rounded-full border border-[#8be1bd]/25 bg-[#8be1bd]/10 px-4 py-2 text-xs font-black uppercase tracking-[.13em] text-[#a8eccf]"><span className="h-2 w-2 rounded-full bg-[#8be1bd]" /> Islamic services · Demo live</span><p className="arabic mt-9 text-2xl text-[#c9ab70]" lang="ar">بِوُضُوحٍ وَأَمَانَةٍ</p><h1 className="mt-3 max-w-3xl text-[clamp(3.8rem,7vw,6.5rem)] font-black leading-[.86] tracking-[-.065em]">Islamic services,<br /><span className="text-[#8be1bd]">built for clarity.</span></h1><p className="mt-8 max-w-xl text-lg leading-8 text-[#b4cbc3]">Choose the service. See the exact scope. Follow each handoff. Receive the completion record.</p><div className="mt-9 flex flex-wrap gap-3"><Link href="/korban" className="rounded-xl bg-[#8be1bd] px-6 py-4 font-black text-[#09251f]">Arrange Korban →</Link><Link href="/wakaf" className="rounded-xl border border-white/20 px-6 py-4 font-black text-white">Explore Wakaf</Link></div></div><ProcessPanel dark /></div></section>

        <section className="bg-[#f7faf8] py-24 text-[#102e27]"><div className="mx-auto w-[min(1240px,calc(100%-32px))]"><div className="grid gap-8 lg:grid-cols-[.7fr_1.3fr]"><div><p className="text-xs font-black uppercase tracking-[.17em] text-[#487366]">Available now</p><h2 className="mt-4 text-4xl font-black tracking-[-.045em]">Choose a clear path.</h2></div><div className="grid gap-4 md:grid-cols-2">{[["ق","Korban","Overseas cow share","S$280","/korban"],["و","Wakaf","Quran, water, education","From S$10","/wakaf"]].map(([ar,title,detail,price,href]) => <Link key={title} href={href} className="group rounded-3xl border border-black/10 bg-white p-6 shadow-[0_12px_35px_rgba(16,46,39,.06)] transition hover:-translate-y-0.5 hover:border-[#1d5c4c]"><div className="flex items-start justify-between"><span className="arabic grid h-12 w-12 place-items-center rounded-2xl bg-[#e3f2ea] text-2xl text-[#1d5c4c]">{ar}</span><span className="text-xl transition group-hover:translate-x-1">↗</span></div><h3 className="mt-12 text-2xl font-black">{title}</h3><p className="mt-2 text-sm text-[#61746e]">{detail}</p><p className="mt-6 border-t border-black/10 pt-4 text-sm font-black">{price}</p></Link>)}</div></div><div className="mt-20"><Palette colors={["#071d19","#164c3e","#8be1bd","#f7faf8"]} labels={["Night","Emerald","Noor","Interface white"]} /></div></div></section>
      </main>
    </div>
  );
}

function Editorial() {
  return (
    <div className="min-h-screen bg-[#eee7d8] text-[#172d28]">
      <header className="border-b border-[#172d28]/20"><div className="mx-auto grid min-h-24 w-[min(1200px,calc(100%-32px))] grid-cols-[1fr_auto] items-center gap-6 md:grid-cols-[1fr_auto_1fr]"><BrandLockup /><p className="hidden text-center text-[.65rem] font-black uppercase tracking-[.22em] md:block">Islamic service · Singapore</p><Link href="/korban" className="justify-self-end border-b border-[#172d28] pb-1 text-sm font-black">Begin a service ↗</Link></div></header>
      <main>
        <section className="mx-auto w-[min(1200px,calc(100%-32px))] py-16 md:py-24"><div className="grid gap-10 lg:grid-cols-[1.3fr_.7fr]"><div><p className="flex items-center gap-4 text-[.68rem] font-black uppercase tracking-[.18em] text-[#8d672f]"><span className="h-px w-12 bg-[#8d672f]" /> An enduring act, carefully handled</p><h1 className="display mt-7 max-w-4xl text-[clamp(4rem,8vw,7rem)] font-semibold leading-[.78] tracking-[-.06em]">A modern house<br />for <em className="text-[#1d5c4c]">enduring acts.</em></h1><div className="mt-12 grid gap-6 border-y border-[#172d28]/20 py-7 md:grid-cols-[.7fr_1.3fr]"><p className="text-xs font-black uppercase tracking-[.16em]">Our premise</p><p className="display text-2xl leading-snug">Faith-led services should be as clear in their handling as they are sincere in their intention.</p></div></div><Arch className="relative min-h-[500px] overflow-hidden border-[#8d672f]/35 bg-[#173f36] p-8 text-[#eee7d8]"><EightPoint className="mx-auto mt-16 h-32 w-32 text-[#c2a165]" /><p className="arabic mt-9 text-center text-4xl text-[#c2a165]" lang="ar">السَّابِقُونَ</p><p className="display mt-4 text-center text-3xl">Service with<br />amanah and ihsan.</p></Arch></div></section>

        <section className="border-y border-[#172d28]/20"><div className="mx-auto w-[min(1200px,calc(100%-32px))]">{[["01","Korban","Overseas cow share","S$280","/korban"],["02","Wakaf Quran","Distribution project","From S$10","/wakaf"],["03","Water Wakaf","Community water project","From S$25","/wakaf"]].map(([n,title,detail,price,href]) => <Link key={n} href={href} className="group grid items-center gap-4 border-b border-[#172d28]/20 py-6 last:border-0 md:grid-cols-[60px_1fr_1fr_auto_40px]"><span className="text-xs font-black text-[#9a7134]">{n}</span><strong className="display text-3xl">{title}</strong><span className="text-sm text-[#62716d]">{detail}</span><span className="text-sm font-black">{price}</span><span className="text-xl transition group-hover:translate-x-1">→</span></Link>)}</div></section>

        <section className="mx-auto grid w-[min(1200px,calc(100%-32px))] gap-12 py-24 lg:grid-cols-[.8fr_1.2fr]"><div><p className="text-xs font-black uppercase tracking-[.17em] text-[#8d672f]">From intention to evidence</p><blockquote className="display mt-5 text-4xl font-semibold leading-tight">“Trust is the structure beneath every handoff.”</blockquote></div><ProcessPanel /></section>
        <section className="bg-[#172d28] py-16 text-[#eee7d8]"><div className="mx-auto w-[min(1200px,calc(100%-32px))]"><Palette colors={["#172d28","#1d5c4c","#9a7134","#eee7d8"]} labels={["Manuscript ink","Service green","Illuminated gold","Washi ivory"]} dark /></div></section>
      </main>
    </div>
  );
}

function Community() {
  return (
    <div className="min-h-screen bg-[#faf8f2] font-sans text-[#153e35]">
      <header className="border-b border-[#153e35]/15"><div className="mx-auto flex h-24 w-[min(1200px,calc(100%-32px))] items-center justify-between"><BrandLockup /><nav className="hidden gap-8 text-sm font-bold lg:flex"><span>Who we serve</span><span>Our services</span><span>Accountability</span></nav><Link href="/korban" className="rounded-full bg-[#164c3e] px-5 py-3 text-sm font-black text-white">Explore services</Link></div></header>
      <main>
        <section className="relative overflow-hidden py-20 md:py-28"><div className="absolute right-0 top-0 h-full w-1/3 bg-[#efe6d3]" /><div className="relative mx-auto grid w-[min(1200px,calc(100%-32px))] items-center gap-14 lg:grid-cols-[1.05fr_.95fr]"><div><p className="arabic text-2xl text-[#a17033]" lang="ar">خِدْمَةٌ لِلْأُمَّةِ</p><h1 className="mt-5 max-w-3xl text-[clamp(3.8rem,7vw,6.4rem)] font-black leading-[.86] tracking-[-.06em]">Serving the ummah,<br /><span className="text-[#a17033]">one clear step</span> at a time.</h1><p className="mt-8 max-w-xl text-lg leading-8 text-[#60736c]">For individuals and organisations who want Islamic services handled by real people, with visible scope and documented outcomes.</p><div className="mt-9 flex flex-wrap gap-3"><Link href="/korban" className="rounded-full bg-[#164c3e] px-6 py-4 font-black text-white">Arrange Korban →</Link><Link href="/contact" className="rounded-full border border-[#164c3e] px-6 py-4 font-black">Speak to the team</Link></div></div><div className="relative mx-auto w-full max-w-[500px]"><Arch className="relative min-h-[560px] overflow-hidden border-[#a17033]/30 bg-[#efe6d3] p-8"><div className="absolute inset-0 opacity-[.14]" style={{ backgroundImage: "radial-gradient(circle at center,#164c3e 1px,transparent 1.5px)", backgroundSize: "24px 24px" }} /><div className="relative grid min-h-[496px] place-items-center rounded-t-[999px] border border-[#164c3e]/20 bg-[#faf8f2]/80"><div className="text-center"><EightPoint className="mx-auto h-28 w-28 text-[#a17033]" /><p className="arabic mt-7 text-4xl text-[#164c3e]" lang="ar">أمانة</p><p className="mt-3 text-sm font-black uppercase tracking-[.16em] text-[#60736c]">A process you can see</p></div></div></Arch><div className="absolute -bottom-5 left-1/2 grid w-[86%] -translate-x-1/2 grid-cols-3 rounded-2xl border border-black/10 bg-white p-5 text-center shadow-xl"><div><strong className="block text-lg">Clear</strong><small>scope</small></div><div className="border-x border-black/10"><strong className="block text-lg">Human</strong><small>review</small></div><div><strong className="block text-lg">Recorded</strong><small>proof</small></div></div></div></div></section>

        <section className="mx-auto w-[min(1200px,calc(100%-32px))] py-24"><div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr]"><div><p className="text-xs font-black uppercase tracking-[.17em] text-[#a17033]">Begin with what you need</p><h2 className="mt-4 text-4xl font-black tracking-[-.045em]">Services designed around trust.</h2></div><div className="grid gap-4 md:grid-cols-2">{[["قربان","Korban","Cow share · S$280","/korban"],["وقف","Wakaf","Projects from S$10","/wakaf"]].map(([ar,title,detail,href]) => <Link href={href} key={title} className="group rounded-[28px] border border-[#153e35]/15 bg-white p-7 transition hover:-translate-y-0.5 hover:border-[#164c3e]"><div className="flex items-start justify-between"><span className="arabic text-3xl text-[#a17033]">{ar}</span><span className="grid h-10 w-10 place-items-center rounded-full border border-[#153e35]/15 transition group-hover:bg-[#164c3e] group-hover:text-white">↗</span></div><h3 className="mt-16 text-3xl font-black">{title}</h3><p className="mt-2 text-sm text-[#60736c]">{detail}</p></Link>)}</div></div><div className="mt-20 grid gap-5 md:grid-cols-3">{[["For individuals","A guided form and clear service record."],["For organisations","A practical partner for community programmes."],["For fulfilment partners","Focused assignments and structured proof."]].map(([title,text]) => <article key={title} className="border-t-2 border-[#a17033] pt-5"><h3 className="font-black">{title}</h3><p className="mt-2 text-sm leading-7 text-[#60736c]">{text}</p></article>)}</div><div className="mt-20"><Palette colors={["#153e35","#164c3e","#a17033","#faf8f2"]} labels={["Ummah ink","Amanah green","Warm brass","Community white"]} /></div></section>
      </main>
    </div>
  );
}

export default async function DesignDirection({ params }: PageProps<"/designs/[style]">) {
  const { style } = await params;
  if (!styles.includes(style as Style)) notFound();
  const current = style as Style;
  return <><DirectionBar current={current} />{{ heritage: <Heritage />, modern: <Modern />, editorial: <Editorial />, community: <Community /> }[current]}</>;
}
