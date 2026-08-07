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
import { catalogServicesFrom } from "@/components/service-card";
import { getActiveOfferings } from "@/lib/offerings";

export default async function LandingPage() {
  const services = catalogServicesFrom(await getActiveOfferings());
  return (
    <>
      <Header />
      <main className="lp-page">
        <Hero services={services} />
        <ServicesOutline services={services} />
        <AmanahShowcase />
        <Accountability />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
