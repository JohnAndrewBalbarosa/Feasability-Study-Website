import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Serif } from "next/font/google";

import "./globals.css";

const headingFont = Space_Grotesk({ subsets: ["latin"], variable: "--font-heading" });
const bodyFont = IBM_Plex_Serif({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Wilson Procurement Intelligence",
  description: "Procurement-to-sales dashboard powered by Next.js + Supabase"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${headingFont.variable} ${bodyFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
