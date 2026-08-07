"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

export function OfferingSubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return <button className="btn btn-small" type="submit" disabled={pending}>{pending ? "Saving…" : children}</button>;
}

export function OfferingEditorForm({
  action,
  initialActive = false,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  initialActive?: boolean;
  children: React.ReactNode;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const submittingRef = useRef(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!dirty) return;
    const warning = "You have unsaved service changes.";
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!submittingRef.current) event.preventDefault();
    };
    const followLink = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target || link.download || new URL(link.href, location.href).origin !== location.origin) return;
      if (!window.confirm(`${warning} Leave without saving?`)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", followLink, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", followLink, true);
    };
  }, [dirty]);

  return (
    <form
      ref={formRef}
      action={action}
      className="admin-service-editor"
      onChange={() => setDirty(true)}
      onSubmit={(event) => {
        const nextActive = new FormData(event.currentTarget).get("active") === "on";
        if (initialActive && !nextActive && !window.confirm("Hide this service from customers? Existing orders will not change.")) {
          event.preventDefault();
          return;
        }
        submittingRef.current = true;
        setDirty(false);
      }}
    >
      {children}
    </form>
  );
}
