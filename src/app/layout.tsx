import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Edium Insight | Fundamental Investing Intelligence",
  description: "Institutional-grade fundamental research for your portfolio.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}