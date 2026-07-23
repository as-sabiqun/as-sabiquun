"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Menu, Moon, Sun, X } from "lucide-react";

type Theme = "light" | "dark";

const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({ theme: "light", toggle: () => {} });

export const useLandingTheme = () => useContext(ThemeCtx);

const STORAGE_KEY = "lp-theme";

export function LandingThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") setTheme(stored);
  }, []);

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next = current === "light" ? "dark" : "light";
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return (
    <ThemeCtx.Provider value={{ theme, toggle }}>
      <div className="lp-root relative" data-lp-theme={theme}>
        {children}
      </div>
    </ThemeCtx.Provider>
  );
}

export function ThemeToggle() {
  const { theme, toggle } = useLandingTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full transition-transform hover:scale-110 active:scale-95"
      style={{ color: "var(--lp-gold)" }}
    >
      {isDark ? <Sun size={16} strokeWidth={2.2} /> : <Moon size={16} strokeWidth={2.2} />}
    </button>
  );
}

export function LandingMobileMenu({ links }: { links: { label: string; href: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full transition-transform hover:scale-110 active:scale-95 md:hidden"
        style={{ color: "var(--lp-text)" }}
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>
      {open && (
        <div
          className="lp-nav absolute inset-x-0 top-[calc(100%+8px)] z-50 flex flex-col gap-1 rounded-[20px] p-2 md:hidden"
          style={{
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            border: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "0 8px 28px -16px rgba(var(--lp-gold-rgb),0.3), inset 0 4px 4px 0 rgba(var(--lp-cream-rgb),0.3)",
          }}
        >
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-black/5"
              style={{ color: "var(--lp-text)" }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-black/5 sm:hidden"
            style={{ color: "var(--lp-emerald)" }}
          >
            Log in
          </Link>
        </div>
      )}
    </>
  );
}
