import type { Metadata } from "next";
import { ContactForm } from "@/components/forms";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return <section className="section"><div className="container grid gap-14 lg:grid-cols-[.75fr_1.25fr]"><div><p className="eyebrow">Contact · تَوَاصَلْ مَعَنَا</p><h1 className="section-title mt-4">Let's talk about what you need.</h1><p className="lead mt-7">Send a demonstration enquiry about Islamic services, consultancy, partnerships, or the platform itself.</p><div className="mt-10 border-t border-[var(--line)] pt-6 text-sm leading-7 text-[var(--muted)]"><strong className="text-[var(--ink)]">Demo note</strong><br />Submissions appear in the admin dashboard. No email is sent.</div></div><ContactForm /></div></section>;
}
