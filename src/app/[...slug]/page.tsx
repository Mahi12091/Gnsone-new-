import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell, PageTitle, Card } from "@/components/site-shell";

type ModuleConfig = {
  eyebrow: string;
  title: string;
  description: string;
  keywords: string[];
  items: string[];
  dataPoints: string[];
};

const config: Record<string, ModuleConfig> = {
  sectors: { eyebrow: "Market intelligence", title: "Sectors", description: "Compare Indian market sectors through performance, valuation, business quality and research signals.", keywords: ["Indian sectors", "sector performance", "sector research"], items: ["Financials", "Information Technology", "Energy", "Industrials", "Consumer", "Healthcare"], dataPoints: ["Sector performance", "Sector constituents", "Valuation metrics", "GNS leaders"] },
  indices: { eyebrow: "Market intelligence", title: "Indices", description: "Explore major Indian equity indices, market breadth and their underlying constituents.", keywords: ["NIFTY 50", "SENSEX", "Indian stock indices", "index research"], items: ["NIFTY 50", "SENSEX", "BANK NIFTY", "NIFTY IT", "NIFTY MIDCAP 100", "NIFTY SMALLCAP 100"], dataPoints: ["Index level", "Daily change", "Constituents", "Market breadth"] },
  watchlist: { eyebrow: "Personal workspace", title: "Watchlist", description: "Keep selected investment ideas together and return to the latest available research data quickly.", keywords: ["stock watchlist", "investment watchlist", "market tracking"], items: ["Stocks", "Price alerts", "GNS Score", "Research updates"], dataPoints: ["Saved instruments", "Latest price", "GNS Score", "Research status"] },
  portfolio: { eyebrow: "Personal workspace", title: "Portfolio", description: "Track holdings, allocation, performance and risk in a structured investment research workspace.", keywords: ["portfolio tracker", "investment portfolio", "portfolio research"], items: ["Holdings", "Allocation", "Performance", "Risk"], dataPoints: ["Holdings", "Weight", "Performance", "Risk exposure"] },
  alerts: { eyebrow: "Personal workspace", title: "Alerts", description: "Monitor prices, valuation signals, GNS Score changes and other research events.", keywords: ["stock alerts", "price alerts", "investment alerts"], items: ["Price alerts", "GNS Score alerts", "Valuation alerts", "Earnings alerts"], dataPoints: ["Trigger", "Threshold", "Status", "Last event"] },
  research: { eyebrow: "Research", title: "Research", description: "Structured market intelligence built around fundamentals, valuation, growth, ownership, technicals and risk.", keywords: ["investment research", "stock research", "market intelligence"], items: ["Quality leaders", "Growth opportunities", "Value opportunities", "GNS leaders"], dataPoints: ["Fundamentals", "Valuation", "Growth", "Risk"] },
  news: { eyebrow: "Market intelligence", title: "News", description: "Company and market developments organized around an investment research workflow.", keywords: ["stock market news", "company news", "Indian market news"], items: ["Market news", "Company news", "Earnings", "Corporate updates"], dataPoints: ["Headline", "Company", "Published date", "Source"] },
  dividends: { eyebrow: "Income investing", title: "Dividends", description: "Discover dividend history, payout events, ex-dates and income research across Indian equities.", keywords: ["dividend stocks", "dividend history", "Indian dividend stocks"], items: ["Dividend leaders", "Yield watch", "Payout history", "Dividend calendar"], dataPoints: ["Dividend per share", "Ex-date", "Payment date", "Yield"] },
  "corporate-actions": { eyebrow: "Corporate actions", title: "Corporate Actions", description: "Track dividends, splits, bonuses, buybacks and other company events in one research view.", keywords: ["corporate actions", "stock split", "bonus shares", "buyback"], items: ["Dividends", "Splits", "Bonus issues", "Buybacks"], dataPoints: ["Action type", "Announcement date", "Effective date", "Terms"] },
  account: { eyebrow: "Account", title: "Account", description: "Manage your GNSOne profile, research preferences and saved investment workspace.", keywords: ["GNSOne account", "investment research account"], items: ["Profile", "Preferences", "Saved screens", "Notifications"], dataPoints: ["Profile", "Preferences", "Saved work", "Notifications"] },
  login: { eyebrow: "GNSOne", title: "Welcome back", description: "Sign in to sync watchlists, screens, portfolios and research alerts across your GNSOne workspace.", keywords: ["GNSOne login", "investment research login"], items: ["Email address", "Password", "Continue"], dataPoints: ["Secure sign in", "Saved research", "Watchlists", "Alerts"] },
};

function titleFor(key: string, fallback: string) {
  return fallback || key.replaceAll("-", " ").replace(/\b\w/g, (x) => x.toUpperCase());
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params;
  const key = slug.join("/");
  const c = config[key] ?? { eyebrow: "GNSOne", title: titleFor(key, key), description: "A structured research workspace on GNSOne.", keywords: [key, "GNSOne", "investment research"], items: [], dataPoints: [] };
  return {
    title: `${c.title} | GNSOne Investment Research`,
    description: c.description,
    keywords: c.keywords,
    alternates: { canonical: `/${slug.map(encodeURIComponent).join("/")}` },
    openGraph: { title: `${c.title} | GNSOne`, description: c.description, type: "website" },
  };
}

export default async function CatchAll({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const key = slug.join("/");
  const c = config[key] ?? { eyebrow: "GNSOne", title: titleFor(key, key), description: "This workspace is part of the GNSOne investment research platform.", keywords: [key, "GNSOne", "investment research"], items: ["Overview", "Data", "Analytics", "Research"], dataPoints: ["Overview", "Latest data", "Analytics", "Research"] };
  const jsonLd = { "@context": "https://schema.org", "@type": "CollectionPage", name: `${c.title} | GNSOne`, description: c.description, isPartOf: { "@type": "WebSite", name: "GNSOne", url: "https://gnsone.com" } };

  return <SiteShell>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <PageTitle eyebrow={c.eyebrow} title={c.title} description={c.description} />

    <div className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
      <Card className="p-5 sm:p-6"><div className="flex items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-[.16em] text-slate-500">Research workspace</p><h2 className="mt-2 text-xl font-semibold">{c.title} overview</h2></div><span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">GNSOne</span></div><div className="mt-6 grid gap-3 sm:grid-cols-2">{c.items.map((item, index) => <div key={item} className="rounded-xl border border-white/[.07] bg-white/[.02] p-4"><div className="flex items-center justify-between"><span className="text-xs font-bold text-emerald-400">{String(index + 1).padStart(2, "0")}</span><span className="text-slate-600">→</span></div><h3 className="mt-5 font-semibold text-slate-200">{item}</h3><p className="mt-2 text-xs leading-5 text-slate-500">Structured research data and filters for this module.</p></div>)}</div></Card>
      <Card className="p-5 sm:p-6"><p className="text-xs uppercase tracking-[.16em] text-slate-500">Data structure</p><h2 className="mt-2 text-xl font-semibold">What this page covers</h2><div className="mt-5 space-y-2">{c.dataPoints.map((item) => <div key={item} className="flex items-center gap-3 rounded-lg border border-white/[.06] px-3 py-3 text-sm text-slate-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{item}</div>)}</div></Card>
    </div>

    <section className="mt-8"><PageTitle eyebrow="Research workflow" title={`Use ${c.title.toLowerCase()} with context`} description="GNSOne is designed to present structured market information instead of isolated numbers."/><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["Discover", "Find the relevant investment or market dataset."], ["Filter", "Narrow the view using meaningful research criteria."], ["Understand", "Read the available metrics with context and dates."], ["Compare", "Use the information alongside other research signals."]].map(([title, text]) => <Card key={title} className="p-5"><p className="text-xs font-bold text-emerald-400">{title}</p><p className="mt-3 text-sm leading-6 text-slate-500">{text}</p></Card>)}</div></section>

    <Card className="mt-8 p-5 sm:p-6"><h2 className="font-semibold">Data availability</h2><p className="mt-3 max-w-4xl text-sm leading-6 text-slate-400">The interface is connected to the canonical GNSOne data architecture. When a dataset is not yet populated, the UI keeps the field explicit rather than inventing values.</p><div className="mt-5 flex flex-wrap gap-2"><Link href="/stocks" className="rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-bold text-[#06101d]">Explore Stocks</Link><Link href="/markets" className="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5">Explore Markets</Link></div></Card>
  </SiteShell>;
}
