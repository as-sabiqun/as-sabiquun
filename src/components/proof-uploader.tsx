"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveProof } from "@/app/actions";
import { createBrowserSupabase } from "@/lib/supabase/client";

export function ProofUploader({ orderId, userId }: { orderId: string; userId: string }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function upload(formData: FormData) {
    setPending(true); setMessage("");
    try {
      const file = formData.get("file") as File;
      if (!file?.size) throw new Error("Choose a file first.");
      if (file.size > 20 * 1024 * 1024) throw new Error("Proof files must be 20 MB or smaller.");
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${userId}/${orderId}/${crypto.randomUUID()}-${safeName}`;
      const { error } = await createBrowserSupabase().storage.from("proofs").upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      await saveProof(orderId, path, file.type, String(formData.get("caption") || ""));
      setMessage("Proof uploaded for admin review.");
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Upload failed."); }
    finally { setPending(false); }
  }

  return <form action={upload} className="mt-5 grid gap-3 rounded-xl border border-dashed border-[var(--teal)] bg-[var(--teal-soft)] p-4"><label className="label">Photo or short video<input className="input bg-white" type="file" name="file" accept="image/jpeg,image/png,image/webp,video/mp4" required /></label><label className="label">Caption <span className="font-normal">Optional</span><input className="input bg-white" name="caption" /></label><button className="btn btn-small" disabled={pending}>{pending ? "Uploading…" : "Upload proof"}</button>{message && <p role="status" className="text-sm text-[var(--teal-dark)]">{message}</p>}<p className="text-xs text-[var(--muted)]">JPEG, PNG, WebP, or MP4 · Maximum 20 MB</p></form>;
}
