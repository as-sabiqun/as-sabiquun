"use client";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="container grid min-h-[65vh] place-items-center py-20 text-center">
      <div className="max-w-xl">
        <p className="eyebrow-label">Something needs attention</p>
        <h1 className="display mt-4 text-4xl">This page could not load.</h1>
        <p className="mt-4 leading-7 text-[var(--muted)]">Your data has not been changed. Try the request again, or contact support if it keeps happening.</p>
        {error.digest && <p className="mt-2 text-xs text-[var(--muted)]">Reference: {error.digest}</p>}
        <button type="button" className="btn mt-7" onClick={reset}>Try again</button>
      </div>
    </main>
  );
}
