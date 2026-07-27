export function adminInviteFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (name.length < 2 || name.length > 100) return { ok: false, error: "Enter the administrator’s name." } as const;
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Enter a valid administrator email." } as const;
  return { ok: true, name, email } as const;
}
