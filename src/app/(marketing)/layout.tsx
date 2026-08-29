import { LandingNav } from "@/app/landing/landing-nav";
import { SimpleFooter } from "@/app/landing/simple-footer";
import "@/app/landing/landing.css";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="asb-landing asb-marketing-shell">
      <LandingNav />
      <main>{children}</main>
      <SimpleFooter />
    </div>
  );
}
