"use client";

import { notFound } from "next/navigation";
import { use, useState, type FormEvent } from "react";

const projects = {
  "water-pump": {
    title: "Wakaf Water Pump",
    headline: "A source of water, built to keep serving.",
    lead: "Contribute towards a community water project and receive the available installation record after review.",
    minimum: 25,
    impact: [
      ["S$25", "Supports basic maintenance for an existing water point"],
      ["S$150", "Contributes toward a new community hand-pump"],
      ["S$650", "Funds a full installation with a fulfilment partner"],
    ],
  },
  quran: {
    title: "Wakaf Quran",
    headline: "Place Qurans where learning continues.",
    lead: "Support Quran distribution and keep your dedication connected to the record from request to reviewed proof.",
    minimum: 10,
    impact: [
      ["S$10", "Provides one Quran for distribution"],
      ["S$60", "Provides a set of six Qurans for a learning circle"],
      ["S$240", "Supports a full distribution run in one location"],
    ],
  },
  "food-for-orphans": {
    title: "Food for Orphans",
    headline: "Help place a complete meal where it is needed.",
    lead: "Contribute towards a coordinated food programme and follow the record through delivery and reviewed proof.",
    minimum: 50,
    impact: [
      ["S$50", "Provides meal packs for one family for a week"],
      ["S$180", "Supports a small group distribution"],
      ["S$500", "Funds a full community meal programme"],
    ],
  },
} as const;

type ProjectSlug = keyof typeof projects;

export default function WakafProjectPage({ params }: { params: Promise<{ project: string }> }) {
  const { project: slug } = use(params);
  const project = projects[slug as ProjectSlug];
  if (!project) notFound();

  const presets = [25, 50, 100, 250].filter((v) => v >= project.minimum);
  const [amount, setAmount] = useState(presets[0] ?? project.minimum);
  const [submitted, setSubmitted] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <>
      <section className="page-header">
        <div className="container">
          <p className="eyebrow-label">{project.title}</p>
          <h1 className="display max-w-2xl">{project.headline}</h1>
          <p className="lede">{project.lead}</p>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="container grid items-start gap-12 lg:grid-cols-[.62fr_1.38fr]">
          <div className="lg:sticky lg:top-28">
            <p className="eyebrow-label" style={{ color: "var(--gold)" }}>What your contribution does</p>
            <div className="impact-row mt-5 !grid-cols-1">
              {project.impact.map(([amt, body]) => (
                <div key={amt}>
                  <strong className="numeral text-lg" style={{ color: "var(--teal-dark)" }}>{amt}</strong>
                  <small>{body}</small>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-2xl border-l-[3px] border-[var(--gold)] bg-[color-mix(in_srgb,var(--gold)_8%,var(--cream))] p-4">
              <strong className="text-sm">Preview content</strong>
              <p className="mt-1 text-xs leading-6 text-[var(--muted)]">Amounts and impact figures are placeholders pending confirmation. This is a working preview - no payment is taken.</p>
            </div>
          </div>

          {submitted ? (
            <div className="card p-8 text-center">
              <p className="eyebrow-label" style={{ color: "var(--gold)" }}>Preview submitted</p>
              <h2 className="display mt-3 text-2xl">Your contribution has been recorded.</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">In production, this becomes an amanah record you can follow through team review, fulfilment, and completion proof. No live contribution has been made.</p>
              <button type="button" className="btn mt-6" onClick={() => setSubmitted(false)}>Start another preview</button>
            </div>
          ) : (
            <form className="card grid gap-6 p-6 md:p-8" onSubmit={submit}>
              <div>
                <p className="eyebrow-label" style={{ color: "var(--gold)" }}>01 - Contribution</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {presets.map((v) => (
                    <button type="button" key={v} className={`amount-pill ${amount === v ? "is-active" : ""}`} onClick={() => setAmount(v)}>S${v}</button>
                  ))}
                </div>
                <label className="label mt-3">Custom amount (SGD)
                  <input className="input" type="number" min={project.minimum} value={amount} onChange={(event) => setAmount(Number(event.target.value))} required />
                </label>
              </div>

              <label className="label">Dedication <span className="font-normal text-[var(--muted)]">Optional</span><input className="input" placeholder="In honour or memory of..." /></label>
              <label className="label">Your name<input className="input" required placeholder="Your full name" /></label>
              <label className="label">Email<input className="input" type="email" required placeholder="you@example.com" /></label>

              <div className="flex items-center justify-between rounded-2xl bg-[var(--teal-soft)] p-4">
                <span className="text-sm font-bold">Preview total</span>
                <strong className="numeral text-xl" style={{ color: "var(--teal-dark)" }}>S${amount}</strong>
              </div>

              <button type="submit" className="btn">Continue with this preview <span aria-hidden="true">→</span></button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
