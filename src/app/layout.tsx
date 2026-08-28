import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Serif, Inter, Noto_Kufi_Arabic } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
});

const editorial = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-editorial",
  weight: "400",
});

const kufi = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
});

export const metadata: Metadata = {
  title: {
    default: "As-Sabiqun Association Consultancy",
    template: "%s - As-Sabiqun",
  },
  description:
    "A modern platform for Islamic services, AI consultancy, and business guidance.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${bricolage.variable} ${editorial.variable} ${kufi.variable}`} data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
