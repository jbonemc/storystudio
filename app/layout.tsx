import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Story Studio Content Tool",
  description: "Build your 13-item communication master plan",
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
