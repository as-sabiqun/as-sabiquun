"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function Modal({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") router.back();
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [router]);

  return (
    <div className="modal-overlay" onClick={() => router.back()}>
      <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close" onClick={() => router.back()} aria-label="Close">
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
