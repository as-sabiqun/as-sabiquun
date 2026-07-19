import Image from "next/image";
import Link from "next/link";

export function Brand({ compact = false, inverse = false }: { compact?: boolean; inverse?: boolean }) {
  return (
    <Link href="/" className="brand-lockup" aria-label="As-Sābiqūn home">
      <BrandMark className={compact ? "h-10 w-10" : "h-12 w-12"} />
      <span className="leading-none">
        <strong className={`display block text-[1.24rem] tracking-tight ${inverse ? "text-white" : "text-[var(--ink)]"}`}>
          As-Sābiqūn
        </strong>
        {!compact && (
          <span className={`mt-1.5 block text-[.53rem] font-bold uppercase tracking-[.17em] ${inverse ? "text-white/60" : "text-[var(--muted)]"}`}>
            Association Consultancy
          </span>
        )}
      </span>
    </Link>
  );
}

export function BrandMark({ className = "h-12 w-12", priority = false }: { className?: string; priority?: boolean }) {
  return (
    <span className={`brand-seal ${className}`}>
      <Image
        className="brand-seal-image"
        src="/brand/as-sabiquun-seal.png"
        width={2000}
        height={2000}
        alt=""
        priority={priority}
        sizes="(max-width: 768px) 192px, 360px"
      />
    </span>
  );
}
