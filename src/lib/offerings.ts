import "server-only";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

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

export async function getActiveOfferings(): Promise<PublicOffering[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("offerings")
    .select("id, slug, service_type, category_slug, title, detail, unit_amount, min_amount, sort_order")
    .eq("active", true)
    .order("sort_order");
  return (data ?? []) as PublicOffering[];
}

