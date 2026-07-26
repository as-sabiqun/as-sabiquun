import { randomUUID } from "node:crypto";
import Link from "next/link";
import { Modal } from "@/components/modal";
import { KorbanContent, type KorbanPackage } from "@/components/korban-content";
import { getActiveOfferings } from "@/lib/offerings";

const packageIds = { "korban-share": "share", "korban-goat": "goat", "korban-cow": "cow" } as const;

export default async function KorbanModal() {
  const offerings = await getActiveOfferings();
  const packages = offerings.flatMap((offering) => {
    const id = packageIds[offering.slug as keyof typeof packageIds];
    return id && offering.unit_amount ? [{ id, label: offering.title.replace(/^Korban\s*—\s*/i, ""), priceCents: offering.unit_amount } satisfies KorbanPackage] : [];
  });
  return (
    <Modal>
      {packages.length ? (
        <KorbanContent initialRequestId={randomUUID()} packages={packages} />
      ) : (
        <div className="panel p-8 text-center">
          <h1 className="display text-2xl">Korban bookings are temporarily unavailable</h1>
          <p className="mt-3 text-sm text-[var(--muted)]">Please check again shortly or contact us.</p>
          <Link className="btn mt-6" href="/contact">Contact us</Link>
        </div>
      )}
    </Modal>
  );
}
