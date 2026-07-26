import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ORDER_REFERENCE = /^[A-Za-z0-9-]{4,100}$/;
const styles = StyleSheet.create({
  page: { backgroundColor: "#F7F7F3", color: "#31231B", fontFamily: "Helvetica", padding: 46, fontSize: 10 },
  brand: { color: "#1D737F", fontFamily: "Helvetica-Bold", fontSize: 12, letterSpacing: 1.2 },
  eyebrow: { color: "#A27C47", fontFamily: "Helvetica-Bold", fontSize: 8, letterSpacing: 1.4, marginTop: 52 },
  title: { fontFamily: "Helvetica-Bold", fontSize: 30, marginTop: 8 },
  reference: { color: "#665D58", marginTop: 8 },
  total: { borderBottom: "1 solid #D7D0C8", borderTop: "1 solid #D7D0C8", marginVertical: 30, paddingVertical: 22 },
  totalLabel: { color: "#665D58", fontSize: 8, letterSpacing: 1 },
  totalValue: { color: "#1D737F", fontFamily: "Helvetica-Bold", fontSize: 27, marginTop: 6 },
  facts: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -7 },
  fact: { marginBottom: 18, paddingHorizontal: 7, width: "50%" },
  label: { color: "#665D58", fontSize: 7, letterSpacing: .7, marginBottom: 4 },
  value: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  note: { backgroundColor: "#DDE6E3", lineHeight: 1.5, marginTop: 18, padding: 14 },
  footer: { bottom: 30, color: "#665D58", fontSize: 7, left: 46, position: "absolute", right: 46 },
});

function money(cents: number) {
  return `S$${(cents / 100).toFixed(2)}`;
}

function date(value: string) {
  return new Date(value).toLocaleString("en-SG", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Singapore" });
}

export async function GET(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId: reference } = await params;
  if (!ORDER_REFERENCE.test(reference)) return Response.json({ error: "Receipt not found." }, { status: 404 });

  const session = await createClient();
  const { data: authData } = await session.auth.getUser();
  if (!authData.user) return Response.json({ error: "Sign in to access this receipt." }, { status: 401 });

  const { data: order } = await session
    .from("customer_orders")
    .select("id, reference, customer_name, customer_email, total_amount, currency, payment_status, offering_title")
    .eq("reference", reference)
    .maybeSingle();
  if (!order || !["paid", "partially_refunded", "refunded"].includes(order.payment_status)) {
    return Response.json({ error: "A confirmed payment is required for this receipt." }, { status: 404 });
  }

  const { data: transactions, error } = await createAdminClient()
    .from("payment_transactions")
    .select("transaction_type, amount, provider_payment_id, provider_request_id, provider_event_at, created_at")
    .eq("order_id", order.id)
    .eq("status", "succeeded")
    .order("created_at", { ascending: true });
  if (error) return Response.json({ error: "The receipt is temporarily unavailable." }, { status: 503 });
  const payment = transactions?.find((transaction) => transaction.transaction_type === "payment");
  if (!payment) return Response.json({ error: "The confirmed payment record was not found." }, { status: 404 });
  const refunded = (transactions ?? []).filter((transaction) => transaction.transaction_type === "refund").reduce((sum, transaction) => sum + transaction.amount, 0);
  const title = order.offering_title ?? "Islamic service";
  const paidAt = payment.provider_event_at ?? payment.created_at;

  const pdf = await renderToBuffer(
    <Document title={`${order.reference} payment receipt`} author="As-Sabiquun Association Consultancy">
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>AS-SABIQUUN ASSOCIATION CONSULTANCY</Text>
        <Text style={styles.eyebrow}>PAYMENT RECEIPT</Text>
        <Text style={styles.title}>Payment confirmed.</Text>
        <Text style={styles.reference}>Order {order.reference}</Text>
        <View style={styles.total}>
          <Text style={styles.totalLabel}>AMOUNT PAID</Text>
          <Text style={styles.totalValue}>{money(payment.amount)} {order.currency}</Text>
        </View>
        <View style={styles.facts}>
          <View style={styles.fact}><Text style={styles.label}>SERVICE</Text><Text style={styles.value}>{title}</Text></View>
          <View style={styles.fact}><Text style={styles.label}>CUSTOMER</Text><Text style={styles.value}>{order.customer_name}</Text></View>
          <View style={styles.fact}><Text style={styles.label}>PAYMENT DATE</Text><Text style={styles.value}>{date(paidAt)}</Text></View>
          <View style={styles.fact}><Text style={styles.label}>PAYMENT REFERENCE</Text><Text style={styles.value}>{payment.provider_payment_id ?? payment.provider_request_id}</Text></View>
          <View style={styles.fact}><Text style={styles.label}>CURRENT PAYMENT STATUS</Text><Text style={styles.value}>{order.payment_status.replaceAll("_", " ").toUpperCase()}</Text></View>
          <View style={styles.fact}><Text style={styles.label}>REFUNDED TO DATE</Text><Text style={styles.value}>{money(refunded)}</Text></View>
        </View>
        <Text style={styles.note}>This receipt is generated from the provider-confirmed payment ledger. Refunds remain visible and never overwrite the original payment record.</Text>
        <Text style={styles.footer}>Generated securely from www.as-sabiqun.com · Keep this receipt with your order reference.</Text>
      </Page>
    </Document>,
  );
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `attachment; filename="${order.reference}-receipt.pdf"`,
      "Content-Type": "application/pdf",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
