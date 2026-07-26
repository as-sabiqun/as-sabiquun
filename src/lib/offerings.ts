import "server-only";

import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export interface PublicOffering {
  id: string;
  slug: string;
  service_type: "korban" | "wakaf";
  category_slug: "korban" | "water" | "quran" | "orphans";
  title: string;
  detail: string;
  unit_amount: number | null;
  min_amount: number | null;
  sort_order: number;
}

const loadActiveOfferings = unstable_cache(async (): Promise<PublicOffering[]> => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data } = await supabase
    .from("offerings")
    .select("id, slug, service_type, category_slug, title, detail, unit_amount, min_amount, sort_order")
    .eq("active", true)
    .order("sort_order");
  return (data ?? []) as PublicOffering[];
}, ["active-offerings"], { revalidate: 60, tags: ["offerings"] });

export async function getActiveOfferings(): Promise<PublicOffering[]> {
  return isSupabaseConfigured ? loadActiveOfferings() : [];
}
