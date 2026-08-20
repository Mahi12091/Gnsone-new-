import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GNSOne — Investor Research & Market Intelligence",
  description:
    "Research stocks, financials, valuation, market data and investment intelligence with GNSOne.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
