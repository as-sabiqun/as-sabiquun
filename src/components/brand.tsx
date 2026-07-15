import Link from "next/link";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="As-Sābiqūn home">
      <BrandMark className={compact ? "h-10 w-10" : "h-12 w-12"} />
      <span className="leading-none">
        <strong className="display block text-[1.45rem] tracking-tight text-[var(--teal-dark)]">As-Sābiqūn</strong>
        {!compact && <span className="mt-1 block text-[.57rem] font-bold uppercase tracking-[.18em] text-[var(--gold)]">Association Consultancy</span>}
      </span>
    </Link>
  );
}

export function BrandMark({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="As-Sābiqūn crescent and open hands mark">
      <circle cx="32" cy="32" r="29" fill="none" stroke="#075b65" strokeWidth="2" />
      <path d="M19 38c2 8 7 13 13 16-1-9-4-16-9-21-3-3-6-1-4 5Zm26 0c-2 8-7 13-13 16 1-9 4-16 9-21 3-3 6-1 4 5Z" fill="#075b65" />
      <path d="M22 27c2 9 9 15 18 14-5 5-14 6-20 1-5-5-6-12-3-18 1-2 3-1 5 3Z" fill="#075b65" />
      <path d="m32 17 1.8 4.4 4.7.4-3.6 3.1 1.1 4.6-4-2.4-4 2.4 1.1-4.6-3.6-3.1 4.7-.4Z" fill="#b17a27" />
    </svg>
  );
}
