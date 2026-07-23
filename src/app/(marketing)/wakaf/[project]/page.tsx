"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { use, useState, type FormEvent } from "react";

const projects = {
  "water-pump": {
    title: "Wakaf Water Pump",
    lead: "Contribute towards a community water project and receive the available installation record after review.",
    minimum: 25,
    icon: <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 9C25 20 17 29 17 40a15 15 0 0 0 30 0C47 29 39 20 32 9Z" /><path d="M24 42c2 5 6 7 11 7" /></svg>,
    impact: [
      ["S$25", "Supports basic maintenance for an existing water point"],
      ["S$150", "Contributes toward a new community hand-pump"],
      ["S$650", "Funds a full installation with a fulfilment partner"],
    ],
  },
  quran: {
    title: "Wakaf Quran",
    lead: "Support Quran distribution and keep your dedication connected to the record from request to reviewed proof.",
    minimum: 10,
    icon: <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M9 17c9-3 17-1 23 5v31c-6-6-14-8-23-5V17Z" /><path d="M55 17c-9-3-17-1-23 5v31c6-6 14-8 23-5V17Z" /><path d="M15 26c5-1 9 0 13 3M49 26c-5-1-9 0-13 3" /></svg>,
    impact: [
      ["S$10", "Provides one Quran for distribution"],
      ["S$60", "Provides a set of six Qurans for a learning circle"],
      ["S$240", "Supports a full distribution run in one location"],
    ],
  },
  "food-for-orphans": {
    title: "Food for Orphans",
    lead: "Contribute towards a coordinated food programme and follow the record through delivery and reviewed proof.",
    minimum: 50,
    icon: <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 51S12 40 12 24c0-7 5-11 11-11 4 0 7 2 9 6 2-4 5-6 9-6 6 0 11 4 11 11 0 16-20 27-20 27Z" /><path d="M21 37c7-4 15-4 22 0" /></svg>,
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
  const [tab, setTab] = useState<"details" | "impact">("details");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <section className="py-10 lg:py-14">
      <div className="container">
        <nav className="breadcrumb">
          <Link href="/wakaf">Wakaf</Link>
          <span aria-hidden="true">/</span>
          <span>{project.title}</span>
        </nav>

        <div className="product-layout mt-6">
          <div className="product-media">
            <span className="status">Available</span>
            {project.icon}
          </div>

          <div>
            <h1 className="display product-title">{project.title}</h1>
            <div className="product-price">
              <strong>From S${project.minimum}</strong>
              <small>minimum</small>
            </div>
            <p className="product-lead">{project.lead}</p>

            {submitted ? (
              <div className="card mt-6 p-6 text-center">
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--gold)" }}>Preview submitted</p>
                <h2 className="display mt-2 text-xl">Your contribution has been recorded.</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">In production this becomes an amanah record you can follow through review, fulfilment, and proof. No live contribution was made.</p>
                <button type="button" className="btn mt-5" onClick={() => setSubmitted(false)}>Start another preview</button>
              </div>
            ) : (
              <form className="mt-6 grid gap-5" onSubmit={submit}>
                <div>
                  <span className="label mb-2 block">Contribution</span>
                  <div className="flex flex-wrap gap-2">
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

                <div className="buy-box-total">
                  <span className="text-sm font-bold">Total</span>
                  <strong className="numeral">S${amount}</strong>
                </div>

                <button type="submit" className="btn">Continue <span aria-hidden="true">→</span></button>
                <p className="text-xs leading-5 text-[var(--muted)]">Working preview - no payment is taken.</p>
              </form>
            )}

            <div className="detail-tabs">
              <button type="button" className={tab === "details" ? "is-active" : ""} onClick={() => setTab("details")}>Details</button>
              <button type="button" className={tab === "impact" ? "is-active" : ""} onClick={() => setTab("impact")}>Your impact</button>
            </div>
            <div className="pt-5">
              {tab === "details" ? (
                <p className="text-sm leading-6 text-[var(--muted)]">Project scope, minimums, and fulfilment evidence are placeholders pending confirmation with the relevant partners.</p>
              ) : (
                <div className="grid gap-3">
                  {project.impact.map(([amt, body]) => (
                    <div key={amt} className="flex items-baseline gap-3 border-b border-[var(--line)] pb-3 last:border-0">
                      <strong className="numeral shrink-0 text-sm" style={{ color: "var(--teal-dark)" }}>{amt}</strong>
                      <p className="text-xs leading-6 text-[var(--muted)]">{body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
