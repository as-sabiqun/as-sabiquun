import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter, Noto_Naskh_Arabic } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
});
const arabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "As-Sabiqun Association Consultancy",
    template: "%s - As-Sabiqun",
  },
  description:
    "Islamic services coordinated with clarity, human care, and documented fulfilment.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable} ${arabic.variable}`} data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
