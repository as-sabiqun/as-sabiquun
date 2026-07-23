import Link from "next/link";
import { KorbanContent } from "@/components/korban-content";

export default function KorbanPage() {
  return (
    <section className="py-10 lg:py-14">
      <div className="container">
        <nav className="breadcrumb">
          <Link href="/services">Services</Link>
          <span aria-hidden="true">/</span>
          <span>Korban</span>
        </nav>

        <div className="mt-6">
          <KorbanContent />
        </div>
      </div>
    </section>
  );
}
