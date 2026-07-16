import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandMark } from "@/components/brand";

const styles = ["heritage", "modern", "editorial", "community"] as const;
type Style = (typeof styles)[number];

const names: Record<Style, string> = {
  heritage: "A · Sacred Heritage",
  modern: "B · Modern Trust",
  editorial: "C · Quiet Editorial",
  community: "D · Warm Community",
};

export function generateStaticParams() {
  return styles.map((style) => ({ style }));
}

export async function generateMetadata({ params }: PageProps<"/designs/[style]">): Promise<Metadata> {
  const { style } = await params;
  return { title: style in names ? names[style as Style] : "Design direction" };
}

function DirectionBar({ current }: { current: Style }) {
  return (
    <div className="sticky top-0 z-50 border-b border-black/10 bg-white/95 text-[#17211f] backdrop-blur">
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

function Palette({ colors, labels, dark = false }: { colors: string[]; labels: string[]; dark?: boolean }) {
  return (
    <div className={`grid gap-5 border-t pt-10 md:grid-cols-[1fr_1.4fr] ${dark ? "border-white/20" : "border-black/15"}`}>
      <div><p className="text-xs font-bold uppercase tracking-[.18em] opacity-60">System sample</p><h2 className="mt-3 text-3xl font-semibold">Core palette & controls</h2></div>
      <div className="flex flex-wrap items-center gap-3">
        {colors.map((color, index) => <div key={color} className="grid gap-2 text-xs font-semibold"><span className={`h-12 w-20 rounded-full border ${dark ? "border-white/20" : "border-black/10"}`} style={{ background: color }} /><span>{labels[index]}</span></div>)}
      </div>
    </div>
  );
}

function Heritage() {
  return (
    <div className="bg-[#fbf6ec] text-[#073f46]">
      <header className="border-b border-[#d8cfbf]">
        <div className="mx-auto flex h-24 w-[min(1180px,calc(100%-32px))] items-center justify-between">
          <div className="flex items-center gap-3"><BrandMark className="h-12 w-12" /><div><strong className="display block text-2xl leading-none">As-Sābiqūn</strong><span className="text-[.55rem] font-bold uppercase tracking-[.2em] text-[#a66f22]">Association Consultancy</span></div></div>
          <nav className="hidden gap-8 text-sm font-semibold md:flex"><span>Purpose</span><span>Korban</span><span>Wakaf</span></nav>
          <Link href="/korban" className="rounded-full bg-[#075b65] px-5 py-3 text-sm font-bold text-white">Begin a service</Link>
        </div>
      </header>

      <main>
        <section className="pattern overflow-hidden border-b border-[#d8cfbf] py-20 md:py-28">
          <div className="mx-auto grid w-[min(1180px,calc(100%-32px))] gap-14 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
            <div><p className="arabic text-3xl text-[#b17a27]" lang="ar" dir="rtl">السَّابِقُونَ</p><h1 className="display mt-4 text-[clamp(4rem,8vw,7.5rem)] font-semibold leading-[.8] tracking-[-.055em]">Serve with<br /><em className="text-[#075b65]">ihsan.</em></h1><p className="mt-8 max-w-xl text-lg leading-8 text-[#6e6a61]">A trusted passage from sincere intention to documented action—beginning with Korban and Wakaf.</p><div className="mt-9 flex flex-wrap gap-3"><Link href="/korban" className="rounded-full bg-[#075b65] px-6 py-4 font-bold text-white">Explore services →</Link><Link href="/about" className="rounded-full border border-[#075b65] px-6 py-4 font-bold">Our amanah</Link></div></div>
            <div className="relative rounded-[40px] border border-[#d8cfbf] bg-[#fffdf8]/80 p-8 shadow-[0_30px_80px_rgba(7,63,70,.12)]">
              <div className="mx-auto grid aspect-square max-w-[360px] place-items-center rounded-full border border-[#b17a27]/40"><div className="grid h-[78%] w-[78%] place-items-center rounded-full border border-[#075b65]/25"><BrandMark className="h-40 w-40" /></div></div>
              <p className="arabic mt-8 text-center text-3xl text-[#b17a27]" lang="ar">الأمانة</p><p className="display mt-2 text-center text-3xl font-semibold">Trust, made visible.</p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-[min(1180px,calc(100%-32px))] py-24">
          <div className="grid gap-5 md:grid-cols-3">{[["٠١","Korban","One clear overseas cow-share journey."],["٠٢","Wakaf","Purposeful giving with recorded outcomes."],["٠٣","Consultancy","Guidance for responsible modern work."]].map(([n,t,d]) => <article key={t} className="rounded-3xl border border-[#d8cfbf] bg-[#fffdf8] p-7"><span className="arabic text-3xl text-[#b17a27]">{n}</span><h2 className="display mt-16 text-4xl font-semibold">{t}</h2><p className="mt-3 leading-7 text-[#6e6a61]">{d}</p></article>)}</div>
          <div className="mt-20"><Palette colors={["#073f46","#075b65","#b17a27","#fbf6ec"]} labels={["Deep teal","Service teal","Gold","Cream"]} /></div>
        </section>
      </main>
    </div>
  );
}

function Modern() {
  return (
    <div className="bg-[#f5fff8] font-sans text-[#082b21]">
      <header className="border-b border-[#082b21]/15 bg-[#f5fff8]">
        <div className="mx-auto flex h-20 w-[min(1240px,calc(100%-32px))] items-center justify-between">
          <div className="flex items-center gap-3 font-black tracking-[-.03em]"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#0b513d] text-white">AS</span>AS-SĀBIQŪN</div>
          <nav className="hidden items-center gap-8 text-sm font-bold md:flex"><span>Services</span><span>How it works</span><span>Trust centre</span></nav>
          <Link href="/korban" className="rounded-lg bg-[#0b513d] px-5 py-3 text-sm font-bold text-white">Start now ↗</Link>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-[#063d2e] py-20 text-white md:py-28">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(#91ffbd33 1px,transparent 1px),linear-gradient(90deg,#91ffbd33 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
          <div className="relative mx-auto grid w-[min(1240px,calc(100%-32px))] gap-14 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
            <div><span className="rounded-full border border-[#67f1a1]/50 bg-[#39e68a]/10 px-3 py-2 text-xs font-bold uppercase tracking-[.12em] text-[#8affb7]">Islamic services · Singapore</span><h1 className="mt-7 text-[clamp(4rem,8vw,7.2rem)] font-black leading-[.84] tracking-[-.065em]">Good deeds.<br /><span className="text-[#57ed95]">Clear delivery.</span></h1><p className="mt-8 max-w-xl text-lg leading-8 text-[#c6e6d7]">Book a service, follow its progress, and receive documented proof—without chasing updates.</p><div className="mt-9 flex gap-3"><Link href="/korban" className="rounded-xl bg-[#57ed95] px-6 py-4 font-black text-[#063d2e]">Arrange Korban</Link><Link href="/wakaf" className="rounded-xl border border-white/30 px-6 py-4 font-bold">View Wakaf</Link></div></div>
            <div className="rounded-3xl border border-white/20 bg-white p-5 text-[#082b21] shadow-2xl">
              <div className="flex items-center justify-between border-b border-black/10 pb-5"><div><p className="text-xs font-bold uppercase tracking-[.12em] text-[#577269]">Order overview</p><p className="mt-1 text-2xl font-black">Korban 1448H</p></div><span className="rounded-full bg-[#caffdc] px-3 py-2 text-xs font-black text-[#0b513d]">OPEN</span></div>
              <div className="grid grid-cols-3 gap-2 py-5">{[["S$280","per share"],["4 steps","end to end"],["100%","documented"]].map(([v,l]) => <div key={l} className="rounded-xl bg-[#eff8f2] p-4"><strong className="block text-xl">{v}</strong><span className="mt-1 block text-xs text-[#60756d]">{l}</span></div>)}</div>
              <div className="space-y-3">{[["1","Details received","Done"],["2","Payment confirmed","Done"],["3","Vendor assigned","Current"],["4","Proof delivered","Next"]].map(([n,t,s]) => <div key={n} className="flex items-center gap-3 rounded-xl border border-black/10 p-4"><span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-black ${s === "Done" ? "bg-[#0b513d] text-white" : "bg-[#dff4e7]"}`}>{n}</span><strong className="mr-auto text-sm">{t}</strong><span className="text-xs font-bold text-[#6e817a]">{s}</span></div>)}</div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-[min(1240px,calc(100%-32px))] py-24"><div className="grid gap-6 md:grid-cols-3">{[["01","Choose with confidence","Scope and price are visible before you begin."],["02","Track every handoff","Know when the team and vendor take action."],["03","Keep the evidence","Completion photos and videos stay with the record."]].map(([n,t,d]) => <article key={n} className="border-t-4 border-[#0b513d] bg-white p-6 shadow-[0_12px_30px_rgba(8,43,33,.06)]"><span className="font-black text-[#0b513d]">{n}</span><h2 className="mt-12 text-2xl font-black tracking-[-.03em]">{t}</h2><p className="mt-3 leading-7 text-[#61756e]">{d}</p></article>)}</div><div className="mt-20"><Palette colors={["#063d2e","#0b513d","#57ed95","#f5fff8"]} labels={["Foundation","Action","Signal","Canvas"]} /></div></section>
      </main>
    </div>
  );
}

function Editorial() {
  return (
    <div className="bg-[#eee9df] text-[#171713]">
      <header className="border-b border-black/20">
        <div className="mx-auto flex h-20 w-[min(1200px,calc(100%-32px))] items-center justify-between"><p className="display text-3xl font-bold italic">As-Sābiqūn</p><p className="hidden text-xs font-bold uppercase tracking-[.18em] md:block">Service · Stewardship · Society</p><Link href="/korban" className="border-b-2 border-[#171713] pb-1 text-sm font-bold">Begin here ↗</Link></div>
      </header>

      <main>
        <section className="mx-auto w-[min(1200px,calc(100%-32px))] py-14 md:py-20">
          <div className="flex items-center justify-between border-b border-black/20 pb-4 text-xs font-bold uppercase tracking-[.14em]"><span>Issue № 01 · Islamic services</span><span>Singapore · 2026</span></div>
          <h1 className="display mt-8 max-w-6xl text-[clamp(4.5rem,11vw,10rem)] font-semibold leading-[.74] tracking-[-.065em]">A sincere act<br /><em className="text-[#b6492e]">deserves care.</em></h1>
          <div className="mt-12 grid gap-8 border-y border-black/20 py-8 md:grid-cols-[.8fr_1.4fr_.8fr]">
            <p className="text-xs font-bold uppercase tracking-[.14em]">Our premise</p><p className="display text-3xl leading-tight">Faith-led services should feel considered, legible, and accountable from first intention to final proof.</p><p className="text-sm leading-7 text-[#5f5b53]">As-Sābiqūn coordinates the practical details while preserving the meaning behind the service.</p>
          </div>
        </section>

        <section className="bg-[#171713] py-20 text-[#eee9df]">
          <div className="mx-auto grid w-[min(1200px,calc(100%-32px))] gap-10 md:grid-cols-[1.15fr_.85fr]">
            <div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#e6785b]">The first collection</p><h2 className="display mt-5 text-6xl font-semibold leading-[.9]">Korban<br />& Wakaf</h2><p className="mt-8 max-w-lg leading-8 text-[#bab5aa]">Two enduring acts, presented through a quiet digital experience with clear scope, human coordination, and recorded fulfilment.</p></div>
            <div className="grid gap-3">{[["01","Korban","S$280 · Cow share"],["02","Wakaf Quran","From S$10"],["03","Water project","From S$25"]].map(([n,t,p]) => <Link href={n === "01" ? "/korban" : "/wakaf"} key={n} className="group flex items-center gap-5 border-t border-white/25 py-5"><span className="text-xs text-[#e6785b]">{n}</span><strong className="display mr-auto text-3xl">{t}</strong><span className="text-sm text-[#bab5aa]">{p}</span><span className="text-2xl group-hover:text-[#e6785b]">↗</span></Link>)}</div>
          </div>
        </section>

        <section className="mx-auto w-[min(1200px,calc(100%-32px))] py-20"><blockquote className="display max-w-5xl text-[clamp(3rem,6vw,6rem)] font-semibold leading-[.92] tracking-[-.04em]">“Trust is not decoration. It is the structure beneath every handoff.”</blockquote><div className="mt-20"><Palette colors={["#171713","#b6492e","#d3c8b6","#eee9df"]} labels={["Ink","Ember","Stone","Paper"]} /></div></section>
      </main>
    </div>
  );
}

function Community() {
  return (
    <div className="overflow-hidden bg-[#fff7e9] font-sans text-[#214e3b]">
      <header className="relative z-10">
        <div className="mx-auto flex h-24 w-[min(1180px,calc(100%-32px))] items-center justify-between"><div className="flex items-center gap-3 text-xl font-black"><span className="grid h-11 w-11 place-items-center rounded-full bg-[#214e3b] text-sm text-white">AS</span>As-Sābiqūn</div><nav className="hidden gap-7 text-sm font-bold md:flex"><span>What we do</span><span>Our community</span><span>Questions</span></nav><Link href="/korban" className="rounded-full bg-[#214e3b] px-5 py-3 text-sm font-black text-white">Let’s begin</Link></div>
      </header>

      <main>
        <section className="relative pb-24 pt-12 md:pb-32 md:pt-20">
          <span className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-[#ffd9a3]" /><span className="absolute -right-24 bottom-4 h-80 w-80 rounded-full bg-[#b9dcc9]" />
          <div className="relative mx-auto grid w-[min(1180px,calc(100%-32px))] gap-12 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
            <div><p className="inline-flex -rotate-2 rounded-full bg-[#f5a780] px-4 py-2 text-xs font-black uppercase tracking-[.12em] text-[#572c1f]">Faith in action ♡</p><h1 className="mt-7 text-[clamp(4.2rem,9vw,8rem)] font-black leading-[.8] tracking-[-.07em]">Good made<br /><span className="text-[#d26343]">easier,</span> together.</h1><p className="mt-8 max-w-xl text-lg leading-8 text-[#567162]">Simple Islamic services, handled by real people and explained in plain language.</p><div className="mt-9 flex flex-wrap gap-3"><Link href="/korban" className="rounded-full bg-[#214e3b] px-7 py-4 font-black text-white">Arrange Korban →</Link><Link href="/wakaf" className="rounded-full border-2 border-[#214e3b] px-7 py-4 font-black">Explore Wakaf</Link></div></div>
            <div className="relative mx-auto aspect-square w-full max-w-[480px]"><div className="absolute inset-10 rotate-6 rounded-[42%_58%_48%_52%] bg-[#f5a780]" /><div className="absolute inset-20 -rotate-6 rounded-[55%_45%_60%_40%] bg-[#fff0cc]" /><div className="absolute inset-0 grid place-items-center"><BrandMark className="h-48 w-48" /></div><span className="absolute left-1 top-1 grid h-24 w-24 -rotate-6 place-items-center rounded-3xl bg-white text-center text-sm font-black shadow-xl">Clear<br />steps</span><span className="absolute bottom-3 right-0 grid h-28 w-28 rotate-6 place-items-center rounded-full bg-[#214e3b] text-center text-sm font-black text-white shadow-xl">Proof<br />included ✓</span></div>
          </div>
        </section>

        <section className="rounded-t-[56px] bg-[#214e3b] py-20 text-[#fff7e9]">
          <div className="mx-auto w-[min(1180px,calc(100%-32px))]"><div className="text-center"><p className="text-sm font-black uppercase tracking-[.15em] text-[#f5a780]">Start where you are</p><h2 className="mt-4 text-5xl font-black tracking-[-.05em] md:text-7xl">Two ways to do good.</h2></div><div className="mt-12 grid gap-5 md:grid-cols-2">{[["🐄","Korban","Arrange a cow share through one friendly, guided form.","/korban"],["💧","Wakaf","Choose a project and contribute the amount that feels right.","/wakaf"]].map(([icon,t,d,href]) => <Link key={t} href={href} className="group rounded-[36px] bg-[#fff7e9] p-8 text-[#214e3b]"><span className="text-5xl">{icon}</span><h3 className="mt-12 text-4xl font-black tracking-[-.04em]">{t}</h3><p className="mt-3 max-w-md leading-7 text-[#5b7569]">{d}</p><span className="mt-8 inline-grid h-12 w-12 place-items-center rounded-full bg-[#f5a780] text-xl transition group-hover:translate-x-1">→</span></Link>)}</div><div className="mt-20"><Palette colors={["#214e3b","#f5a780","#ffd9a3","#fff7e9"]} labels={["Evergreen","Coral","Sun","Warm white"]} dark /></div></div>
        </section>
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
