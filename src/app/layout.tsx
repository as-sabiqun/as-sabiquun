import type { Metadata } from "next";
import { Schibsted_Grotesk } from "next/font/google";
import "./globals.css";

const grotesk = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
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
    <html lang="en" className={grotesk.variable} data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
