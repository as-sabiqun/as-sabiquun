import "./landing.css";
import { LandingThemeProvider } from "@/components/landing-theme";
import {
  AmanahShowcase,
  FAQ,
  FinalCTA,
  Hero,
  HowItWorks,
  LandingFooter,
  ServicesOutline,
  StatsBar,
  WhyDifferent,
  WhoItsFor,
} from "@/components/landing-sections";

export default function LandingPage() {
  return (
    <LandingThemeProvider>
      <Hero />
      <AmanahShowcase />
      <StatsBar />
      <WhyDifferent />
      <HowItWorks />
      <WhoItsFor />
      <ServicesOutline />
      <FAQ />
      <FinalCTA />
      <LandingFooter />
    </LandingThemeProvider>
  );
}
