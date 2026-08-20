import Link from "next/link";
import { getStockSnapshots } from "@/lib/data/stock-repository";

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

      <section className="relative overflow-hidden border-b border-slate-200 bg-[linear-gradient(135deg,#f8fffc_0%,#ffffff_48%,#f4f9ff_100%)]">
        <div className="pointer-events-none absolute -right-32 -top-32 h-[520px] w-[520px] rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -left-40 bottom-0 h-[360px] w-[360px] rounded-full bg-sky-100/60 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(15,23,42,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,.045)_1px,transparent_1px)] [background-size:64px_64px]" />

        <div className="relative mx-auto grid max-w-[1440px] items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.02fr_.98fr] lg:px-8 lg:py-24">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[.18em] text-emerald-700 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Investment research · Market intelligence
            </div>
            <h1 className="max-w-3xl text-[clamp(3rem,7vw,6.6rem)] font-semibold leading-[.94] tracking-[-.06em] text-slate-950">
              One platform.<br />
              <span className="text-emerald-600">Every investment.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Research Stocks, IPOs, Mutual Funds, ETFs and Bonds in one place. Discover opportunities, understand the numbers and compare investments with clarity.
            </p>

            <Link href="/stocks" className="mt-8 flex max-w-2xl items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/50 transition hover:border-emerald-300 hover:shadow-emerald-100/60">
              <span className="px-2 text-xl text-slate-400">⌕</span>
              <span className="min-w-0 flex-1 truncate text-sm text-slate-400 sm:text-base">Search stocks, IPOs, mutual funds, ETFs or bonds...</span>
              <span className="shrink-0 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200">Explore</span>
            </Link>

            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-slate-500">
              <span>✓ Multi-asset research</span>
              <span>✓ Compare investments</span>
              <span>✓ Explainable analytics</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-5 rounded-[34px] bg-emerald-100/50 blur-2xl" />
            <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-200/80 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[.16em] text-slate-400">Market overview</p>
                  <h2 className="mt-1 text-lg font-bold">Research workspace</h2>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1.5 text-[10px] font-bold text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Research</span>
              </div>
              <div className="mt-6 grid grid-cols-4 gap-2 border-b border-slate-100 pb-3 text-[10px] font-semibold text-slate-400">
                <span className="border-b-2 border-emerald-500 pb-3 text-slate-900">Markets</span><span>Stocks</span><span>Funds</span><span>Bonds</span>
              </div>
              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <div className="flex items-end justify-between gap-4">
                  <div><p className="text-xs text-slate-500">Multi-asset research</p><p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">5+ categories</p></div>
                  <span className="text-xs font-semibold text-emerald-600">One workspace</span>
                </div>
                <div className="mt-5 flex h-24 items-end gap-1.5">
                  {[26,38,34,52,47,62,55,71,66,84,76,92].map((height, index) => <span key={index} className="flex-1 rounded-t-md bg-gradient-to-t from-emerald-200 to-emerald-500/70" style={{ height: `${height}%` }} />)}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[["Stocks", "Fundamentals + valuation"], ["IPOs", "New issue research"], ["Funds & ETFs", "Returns + risk"], ["Bonds", "Yield + issuer data"]].map(([title, text]) => <div key={title} className="rounded-xl border border-slate-100 p-3"><p className="text-xs font-bold text-slate-800">{title}</p><p className="mt-1 text-[10px] leading-4 text-slate-400">{text}</p></div>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[.2em] text-emerald-600">Explore the platform</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-.03em] text-slate-950 sm:text-4xl">Everything you need to research investments</h2>
          <p className="mt-4 text-sm leading-6 text-slate-500 sm:text-base">From listed companies to new issues and fixed income, GNSOne brings major investment categories into one professional research workspace.</p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assetCards.map(([number, title, tag, description, href, arrow]) => (
            <Link key={title} href={href} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-slate-200/60">
              <div className="flex items-start justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-600">{number}</span><span className="rounded-full border border-slate-100 bg-slate-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">{tag}</span></div>
              <h3 className="mt-7 text-lg font-bold text-slate-900">{title}</h3>
              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{description}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 transition group-hover:gap-2">Explore {title} {arrow}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50/80">
        <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.2em] text-emerald-600">Why GNSOne</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-.03em] text-slate-950 sm:text-4xl">More than market data.</h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-slate-600">Investing is not only about finding a price. It is about understanding what you are looking at. GNSOne is designed around the complete research journey.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[["01", "Discover", "Find investments across multiple asset classes from one place."], ["02", "Research", "Explore fundamentals, performance, valuation and financial data."], ["03", "Compare", "Put multiple investments side-by-side before deciding."], ["04", "Understand", "Turn complex financial information into a clearer research view."]].map(([number, title, description]) => <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><span className="text-xs font-bold text-emerald-600">{number}</span><h3 className="mt-5 font-bold text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mb-9"><p className="text-[11px] font-bold uppercase tracking-[.2em] text-emerald-600">How it works</p><h2 className="mt-2 text-3xl font-semibold tracking-[-.03em] text-slate-950 sm:text-4xl">From discovery to decision.</h2></div>
        <div className="grid gap-4 md:grid-cols-5">
          {workflow.map(([number, title, description], index) => <div key={number} className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:min-h-44"><span className="text-xs font-bold text-emerald-600">{number}</span><h3 className="mt-6 font-bold text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>{index < workflow.length - 1 && <span className="absolute -right-3 top-1/2 z-10 hidden h-6 w-6 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white text-xs text-slate-300 md:grid">→</span>}</div>)}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 pb-14 sm:px-6 lg:px-8 lg:pb-20">
        <div className="grid gap-5 lg:grid-cols-[1.45fr_.85fr]">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Market workspace</p><h2 className="mt-1 text-lg font-bold text-slate-900">Stocks to research</h2></div><Link href="/stocks" className="text-xs font-bold text-emerald-600">View all →</Link></div>
            {stocks.length ? stocks.slice(0, 6).map((stock) => <Link href={`/stocks/${stock.nse_symbol ?? stock.bse_code ?? stock.instrument_id}`} key={stock.instrument_id} className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 transition hover:bg-slate-50 sm:px-6"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600">{stock.name.slice(0, 2).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-800">{stock.name}</span><span className="mt-0.5 block text-xs text-slate-400">{stock.nse_symbol ? `NSE · ${stock.nse_symbol}` : `BSE · ${stock.bse_code ?? "—"}`}</span></span><span className="hidden text-right sm:block"><span className="block text-sm font-semibold text-slate-800">{money(stock.latest_price)}</span><span className="mt-1 block text-[10px] text-slate-400">{stock.price_date ?? priceDate ?? "Research data"}</span></span>{stock.score != null && <span className="w-12 text-right"><span className="block text-[9px] font-bold uppercase text-slate-400">GNS</span><span className="font-bold text-emerald-600">{Math.round(stock.score)}</span></span>}</Link>) : <div className="p-10 text-center text-sm text-slate-500">Market research data will appear here.</div>}
          </div>

          <div className="rounded-3xl border border-emerald-200 bg-[linear-gradient(145deg,#f0fdf8,#ffffff)] p-6 shadow-sm sm:p-7">
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-emerald-600">GNS intelligence</p>
            <h2 className="mt-2 text-2xl font-bold tracking-[-.02em] text-slate-950">Understand the signal.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">GNS Score brings multiple research factors together so an investment can be viewed beyond a single metric.</p>
            {scored.length ? <div className="mt-6 space-y-2">{scored.slice(0, 4).map((stock, index) => <Link href={`/stocks/${stock.nse_symbol ?? stock.bse_code ?? stock.instrument_id}`} key={stock.instrument_id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-emerald-200"><span className="text-[10px] font-bold text-slate-400">0{index + 1}</span><span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700">{stock.name}</span><span className="font-bold text-emerald-600">{Math.round(stock.score ?? 0)}</span></Link>)}</div> : <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">GNS analytics will appear here as scores become available.</div>}
            <Link href="/gns-score" className="mt-5 block rounded-xl border border-emerald-200 bg-white py-3 text-center text-xs font-bold text-emerald-700 transition hover:bg-emerald-50">Explore GNS Score →</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 pb-14 sm:px-6 lg:px-8 lg:pb-20">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950 p-7 text-white shadow-xl sm:p-10 lg:p-14">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-emerald-400">Research tools</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.03em] sm:text-5xl">Screen. Compare. Research.</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">Build a shortlist with the Screener, compare investments side-by-side and then dive into the underlying research.</p></div>
            <div className="flex flex-wrap gap-3"><Link href="/screener" className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-950/40">Open Screener</Link><Link href="/compare" className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/5">Compare</Link><Link href="/gns-score" className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/5">GNS Score</Link></div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50/80">
        <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-3xl"><p className="text-[11px] font-bold uppercase tracking-[.2em] text-emerald-600">Investment insights</p><h2 className="mt-2 text-3xl font-semibold tracking-[-.03em] text-slate-950 sm:text-4xl">Learn what moves your investments.</h2><p className="mt-4 text-sm leading-6 text-slate-500">Research-led explainers for stock analysis, IPOs, mutual funds, ETFs, bonds and market concepts.</p></div>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{insights.map(([title, description]) => <Link key={title} href="/" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-600">↗</span><h3 className="mt-5 font-bold text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p><span className="mt-5 block text-xs font-bold text-emerald-600">Explore research →</span></Link>)}</div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{benefits.map(([title, description]) => <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><span className="h-2 w-2 rounded-full bg-emerald-500" /><h3 className="mt-5 text-sm font-bold text-slate-900">{title}</h3><p className="mt-2 text-xs leading-5 text-slate-500">{description}</p></div>)}</div>
      </section>

      <section className="border-t border-slate-200 bg-[linear-gradient(135deg,#ecfdf5,#f8fffc)]">
        <div className="mx-auto max-w-[1440px] px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-20">
          <p className="text-[11px] font-bold uppercase tracking-[.2em] text-emerald-600">Start researching</p>
          <h2 className="mx-auto mt-3 max-w-3xl text-4xl font-semibold tracking-[-.04em] text-slate-950 sm:text-5xl lg:text-6xl">Your investment research starts here.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">Explore markets, research investments and build your own investment workflow with GNSOne.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3"><Link href="/stocks" className="rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-200">Explore Investments</Link><Link href="/markets" className="rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 shadow-sm">Explore Markets</Link></div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div><Link href="/" className="flex items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500 text-sm font-black text-white">G</span><span className="font-bold text-slate-900">GNSOne</span></Link><p className="mt-4 max-w-xs text-xs leading-5 text-slate-500">Research smarter. Invest with clarity.</p><p className="mt-5 text-[10px] leading-5 text-slate-400">Market data and research are provided for informational purposes and may be delayed. GNSOne does not provide personalized investment advice.</p></div>
            <div><p className="text-xs font-bold text-slate-900">Explore</p><div className="mt-4 space-y-3 text-xs text-slate-500"><Link className="block hover:text-slate-900" href="/stocks">Stocks</Link><Link className="block hover:text-slate-900" href="/ipo">IPOs</Link><Link className="block hover:text-slate-900" href="/mutual-funds">Mutual Funds</Link><Link className="block hover:text-slate-900" href="/etfs">ETFs</Link><Link className="block hover:text-slate-900" href="/bonds">Bonds</Link><Link className="block hover:text-slate-900" href="/markets">Markets</Link></div></div>
            <div><p className="text-xs font-bold text-slate-900">Tools</p><div className="mt-4 space-y-3 text-xs text-slate-500"><Link className="block hover:text-slate-900" href="/screener">Screener</Link><Link className="block hover:text-slate-900" href="/compare">Compare</Link><Link className="block hover:text-slate-900" href="/gns-score">GNS Score</Link></div></div>
            <div><p className="text-xs font-bold text-slate-900">Company</p><div className="mt-4 space-y-3 text-xs text-slate-500"><Link className="block hover:text-slate-900" href="/about">About</Link><Link className="block hover:text-slate-900" href="/contact">Contact</Link><Link className="block hover:text-slate-900" href="/privacy">Privacy</Link><Link className="block hover:text-slate-900" href="/terms">Terms</Link><Link className="block hover:text-slate-900" href="/disclaimer">Disclaimer</Link></div></div>
          </div>
          <div className="mt-10 flex flex-col gap-3 border-t border-slate-100 pt-5 text-[10px] text-slate-400 sm:flex-row sm:items-center sm:justify-between"><span>© 2026 GNSOne. All rights reserved.</span><span>Investment research · Market intelligence</span></div>
        </div>
      </footer>
    </main>
  );
}
