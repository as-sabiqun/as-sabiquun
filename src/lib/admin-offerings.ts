export type OfferingPricing = "korban" | "wakaf";

export function sgdCents(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? "").trim();
  if (!/^\d{1,7}(?:\.\d{1,2})?$/.test(raw)) return null;
  const [dollars, cents = ""] = raw.split(".");
  const amount = Number(dollars) * 100 + Number(cents.padEnd(2, "0"));
  return amount > 0 && amount <= 100_000_000 ? amount : null;
}

export function offeringFields(formData: FormData, pricing: OfferingPricing) {
  const title = String(formData.get("title") ?? "").trim();
  const detail = String(formData.get("detail") ?? "").trim();
  const amount = sgdCents(formData.get("price"));
  const active = formData.get("active") === "on";

  if (title.length < 2 || title.length > 100) return { ok: false, error: "Use a title between 2 and 100 characters." } as const;
  if (detail.length < 10 || detail.length > 500) return { ok: false, error: "Use a description between 10 and 500 characters." } as const;
  if (!amount) return { ok: false, error: "Enter a valid SGD amount above S$0." } as const;

  return {
    ok: true,
    values: {
      title,
      detail,
      unit_amount: pricing === "korban" ? amount : null,
      min_amount: pricing === "wakaf" ? amount : null,
      active,
    },
  } as const;
}

export function korbanOfferingSlug(title: string) {
  const name = title.replace(/^korban\s*[—–-]?\s*/i, "").toLowerCase()
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  return name ? `korban-${name}` : null;
}
