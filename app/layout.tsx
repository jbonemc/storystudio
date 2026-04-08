import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
