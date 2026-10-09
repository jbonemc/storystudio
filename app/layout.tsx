import type { Metadata } from "next";
import { Montserrat, Inter } from "next/font/google";
import "./globals.css";

// Same pairing as storystudio.ie: Montserrat 800 for headings, Inter 400/600
// for everything else. The portal previously loaded no webfonts at all.
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-montserrat",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Story Studio Portal",
  description: "Your participant portal for Story Studio by Whipsmart Media",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IE" className={`${montserrat.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
