import Link from "next/link";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="As-Sābiqūn home">
      <BrandMark className={compact ? "h-9 w-9" : "h-10 w-10"} />
      <span className="leading-none">
        <strong className="display block text-[1.2rem] tracking-tight text-[var(--ink)]">As-Sābiqūn</strong>
        {!compact && <span className="mt-1 block text-[.56rem] font-bold uppercase tracking-[.18em] text-[var(--muted)]">Association Consultancy</span>}
      </span>
    </Link>
  );
}

export function BrandMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} role="img" aria-label="As-Sābiqūn mark">
      <rect x="1" y="1" width="38" height="38" rx="8" style={{ fill: "var(--ink)" }} />
      <path d="M20 8 22.2 16.4 30.5 14.2 24.6 20.4 30.5 26.6 22.2 24.4 20 32.8 17.8 24.4 9.5 26.6 15.4 20.4 9.5 14.2 17.8 16.4Z" style={{ fill: "var(--cream)" }} />
      <circle cx="20" cy="20" r="3.2" style={{ fill: "var(--teal)" }} />
    </svg>
  );
}
