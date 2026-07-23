import "./landing.css";
import { Footer, Header } from "@/components/site-shell";
import {
  AmanahShowcase,
  FAQ,
  FinalCTA,
  Hero,
  HowItWorks,
  ServicesOutline,
  StatsBar,
  WhyDifferent,
  WhoItsFor,
} from "@/components/landing-sections";

export default function LandingPage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <AmanahShowcase />
        <StatsBar />
        <WhyDifferent />
        <HowItWorks />
        <WhoItsFor />
        <ServicesOutline />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
