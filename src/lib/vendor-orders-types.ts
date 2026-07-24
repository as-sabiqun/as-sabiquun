import type { OrderStatus } from "@/lib/orders";

export interface VendorJobRow {
  order_id: string;
  offer_id?: string;
  isOffer: boolean;
  reference: string;
  title: string;
  service_type: string;
  category_slug: string;
  quantity: number;
  participant_names: string[];
  dedication: string | null;
  vendor_payout_amount: number;
  status: OrderStatus;
  expires_at?: string;
  created_at: string;
  customer_name?: string;
  customer_phone?: string;
}
