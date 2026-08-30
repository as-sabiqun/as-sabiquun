import { LandingNav } from "@/app/landing/landing-nav";
import { SimpleFooter } from "@/app/landing/simple-footer";
import "@/app/landing/landing.css";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="asb-landing asb-marketing-shell">
      <a className="asb-skip-link" href="#marketing-main">
        Skip to main content
      </a>
      <LandingNav />
      <main id="marketing-main" tabIndex={-1}>{children}</main>
      <SimpleFooter />
    </div>
  );
}
