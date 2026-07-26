import "./landing.css";
import { Footer, Header } from "@/components/site-shell";
import {
  Accountability,
  AmanahShowcase,
  FAQ,
  FinalCTA,
  Hero,
  ServicesOutline,
} from "@/components/landing-sections";

export default function LandingPage() {
  return (
    <>
      <Header />
      <main className="lp-page">
        <Hero />
        <ServicesOutline />
        <AmanahShowcase />
        <Accountability />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
