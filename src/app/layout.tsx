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
    default: "As-Sābiqūn Association Consultancy",
    template: "%s · As-Sābiqūn",
  },
  description:
    "A modern platform for Islamic services, AI consultancy, and business guidance.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable} ${arabic.variable}`}>
      <body>{children}</body>
    </html>
  );
}
