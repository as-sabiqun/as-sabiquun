import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function requestAddress() {
  const incoming = await headers();
  return incoming.get("x-real-ip") ?? incoming.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function consumeRateLimit(scope: string, identity: string, limit: number, windowSeconds: number) {
  const keyHash = createHash("sha256").update(`${scope}:${identity}`).digest("hex");
  const { data, error } = await createAdminClient().rpc("consume_rate_limit", {
    p_scope: scope,
    p_key_hash: keyHash,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) throw new Error("Rate limit check failed.");
  return data === true;
}
