import Link from "next/link";
import { getStockSnapshots } from "@/lib/data/stock-repository";

export const dynamic = "force-dynamic";

function money(value: number | null) {
  if (value == null || value <= 0) return "—";
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

const navItems = [
  ["Markets", "/markets"],
  ["Stocks", "/stocks"],
  ["IPO", "/ipo"],
  ["Mutual Funds", "/mutual-funds"],
  ["ETFs", "/etfs"],
  ["Bonds", "/bonds"],
  ["Screener", "/screener"],
  ["Compare", "/compare"],
] as const;

const assetCards = [
  ["01", "Stocks", "Equities", "Research companies, fundamentals, valuation, performance and GNS Score.", "/stocks", "↗"],
  ["02", "IPOs", "Primary market", "Explore upcoming, open and recently listed public issues in one place.", "/ipo", "↗"],
  ["03", "Mutual Funds", "Fund research", "Compare funds, categories, returns, risk and fund characteristics.", "/mutual-funds", "↗"],
  ["04", "ETFs", "Exchange traded", "Explore equity, index, gold, debt and other exchange-traded products.", "/etfs", "↗"],
  ["05", "Bonds", "Fixed income", "Research fixed-income opportunities and compare key bond information.", "/bonds", "↗"],
  ["06", "Markets", "Market pulse", "Track indices, market movements, sectors, gainers and losers.", "/markets", "↗"],
] as const;

const workflow = [
  ["01", "Discover", "Find investments across multiple asset classes."],
  ["02", "Screen", "Filter opportunities using the metrics that matter."],
  ["03", "Research", "Understand fundamentals, performance and valuation."],
  ["04", "Compare", "Put investments side-by-side before deciding."],
  ["05", "Decide", "Build a clearer, research-backed investment view."],
] as const;

const benefits = [
  ["Multi-asset", "One research workspace across Stocks, IPOs, Mutual Funds, ETFs and Bonds."],
  ["Structured data", "Financial information organized into a cleaner research experience."],
  ["Explainable analytics", "Scores and metrics presented with context instead of a single number."],
  ["Research first", "Built to support informed decisions, not personalized investment advice."],
] as const;

const insights = [
  ["Stock Research", "Understand fundamentals, valuation, financial performance and business quality."],
  ["IPO Guides", "Learn how to evaluate new public issues, pricing and key offer details."],
  ["Fund & ETF Guides", "Understand categories, costs, risk, returns and fund characteristics."],
  ["Bond Research", "Explore fixed-income concepts, yields, maturity and issuer information."],
] as const;

export default async function HomePage() {
  const stocks = await getStockSnapshots(10);
  const scored = stocks
    .filter((stock) => stock.score != null)
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  const priceDate = stocks.find((stock) => stock.price_date)?.price_date ?? null;

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-[1440px] items-center gap-6 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="GNSOne home">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500 text-base font-black text-white shadow-sm shadow-emerald-200">G</span>
            <span className="text-lg font-bold tracking-[-.02em]">GNSOne</span>
          </Link>

          <nav className="hidden items-center gap-5 xl:flex" aria-label="Primary navigation">
            {navItems.map(([label, href]) => (
              <Link key={label} href={href} className="text-[13px] font-medium text-slate-600 transition hover:text-slate-950">
                {label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link href="/stocks" className="hidden h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-white sm:flex">
              <span className="text-base">⌕</span>
              Search
            </Link>
            <Link href="/signin" className="hidden h-10 items-center rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:flex">
              Sign in
            </Link>
            <details className="relative xl:hidden">
              <summary className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-xl border border-slate-200 text-lg text-slate-700">☰</summary>
              <div className="absolute right-0 top-12 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-200/70">
                {navItems.map(([label, href]) => (
                  <Link key={label} href={href} className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">{label}</Link>
                ))}
                <Link href="/signin" className="mt-1 block rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white">Sign in</Link>
              </div>
            </details>
          </div>
        </div>
      </header>

      <section className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,.12),_transparent_38%),linear-gradient(180deg,#fff_0%,#f8fafc_100%)]">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_.8fr] lg:px-8 lg:py-24">
          <div>
            <p className="mb-5 text-xs font-bold uppercase tracking-[.22em] text-emerald-600">Investment research platform</p>
            <h1 className="max-w-4xl text-4xl font-black tracking-[-.04em] text-slate-950 sm:text-5xl lg:text-7xl">Research smarter. Decide with more clarity.</h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">GNSOne brings structured market research, fundamentals, valuation and analytics into one clean workspace.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/stocks" className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Explore stocks</Link>
              <Link href="/markets" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300">View markets</Link>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.18em] text-slate-400">Market snapshot</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">Top researched stocks</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Live</span>
            </div>
            <div className="mt-4 space-y-2">
              {scored.slice(0, 5).map((stock) => (
                <Link key={stock.instrument_id} href={`/stocks/${stock.nse_symbol ?? stock.instrument_id}`} className="flex items-center justify-between rounded-2xl border border-slate-100 p-3 transition hover:border-slate-200 hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{stock.name}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">{stock.nse_symbol ?? stock.bse_code ?? "—"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{money(stock.latest_price)}</p>
                    <p className="mt-0.5 text-[11px] font-semibold text-emerald-600">GNS {stock.score ?? "—"}</p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-4 border-t border-slate-100 pt-4 text-[11px] text-slate-400">Latest market data: {priceDate ?? "—"}</div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assetCards.map(([number, title, kicker, description, href, arrow]) => (
            <Link key={title} href={href} className="group rounded-3xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/40">
              <div className="flex items-start justify-between">
                <span className="text-xs font-bold tracking-[.18em] text-slate-300">{number}</span>
                <span className="text-slate-300 transition group-hover:text-slate-950">{arrow}</span>
              </div>
              <p className="mt-10 text-xs font-semibold uppercase tracking-[.18em] text-emerald-600">{kicker}</p>
              <h2 className="mt-2 text-2xl font-bold tracking-[-.03em] text-slate-950">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.22em] text-emerald-400">How it works</p>
              <h2 className="mt-4 max-w-xl text-3xl font-black tracking-[-.04em] sm:text-4xl">From discovery to a research-backed view.</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {workflow.map(([number, title, description]) => (
                <div key={number} className="rounded-2xl border border-white/10 bg-white/[.04] p-4">
                  <p className="text-xs font-bold text-emerald-400">{number}</p>
                  <h3 className="mt-8 text-base font-bold">{title}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-400">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(([title, description]) => (
            <div key={title} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-lg font-bold tracking-[-.02em]">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.22em] text-emerald-600">Research library</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-.04em]">Useful context before the decision.</h2>
            </div>
            <Link href="/stocks" className="text-sm font-semibold text-slate-700 hover:text-slate-950">Browse research →</Link>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {insights.map(([title, description]) => (
              <div key={title} className="rounded-3xl border border-slate-200 bg-white p-6">
                <h3 className="text-lg font-bold tracking-[-.02em]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-8 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© 2026 GNSOne. Research and analytics platform.</p>
          <p>GNSOne provides research tools and does not provide personalized investment advice.</p>
        </div>
      </footer>
    </main>
  );
}
