import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://gnsone.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "GNSOne — Investment Research Platform", template: "%s | GNSOne" },
  description: "GNSOne is a multi-asset investment research platform to explore Stocks, IPOs, Mutual Funds, ETFs and Bonds, compare investments, screen opportunities and understand market intelligence.",
  keywords: ["investment research platform", "stock research", "IPO research", "mutual fund research", "ETF research", "bond research", "stock screener", "investment comparison", "Indian stock market", "market intelligence"],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  openGraph: {
    title: "GNSOne — One Platform for Every Investment",
    description: "Research Stocks, IPOs, Mutual Funds, ETFs and Bonds in one place. Discover, screen, compare and understand investments with GNSOne.",
    type: "website",
    url: siteUrl,
    siteName: "GNSOne",
  },
  twitter: { card: "summary_large_image", title: "GNSOne — Investment Research Platform", description: "Research Stocks, IPOs, Mutual Funds, ETFs and Bonds with GNSOne." },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
