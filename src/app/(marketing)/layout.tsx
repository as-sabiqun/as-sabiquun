import { DemoBar, Footer, Header } from "@/components/site-shell";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <><DemoBar /><Header /><main>{children}</main><Footer /></>;
}
