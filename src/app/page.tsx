import Link from "next/link";
import { getStockSnapshots } from "@/lib/data/stock-repository";

function money(value: number | null) {
  return value == null ? "—" : `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export default async function HomePage() {
  const stocks = await getStockSnapshots(8);
  const scored = stocks.filter((s) => s.score != null).sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  const priceDate = stocks.find((s) => s.price_date)?.price_date ?? null;

  return (
    <main className="min-h-screen bg-[#06101d] text-slate-100">
      <nav className="sticky top-0 z-30 border-b border-white/[.07] bg-[#06101d]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-7 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-400 font-black text-[#06101d]">G</span><span className="text-lg font-bold tracking-tight">GNSOne</span></Link>
          <div className="hidden items-center gap-6 text-sm text-slate-400 md:flex"><Link href="/markets">Markets</Link><Link href="/stocks">Stocks</Link><Link href="/screener">Screener</Link><Link href="/compare">Compare</Link><Link href="/gns-score">GNS Score</Link></div>
          <div className="ml-auto flex items-center gap-2"><Link href="/stocks" className="hidden rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 sm:block">⌕ Search</Link><Link href="/signin" className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium hover:bg-white/5">Sign in</Link></div>
        </div>
      </nav>

      <section className="relative overflow-hidden border-b border-white/[.06]">
        <div className="absolute -right-24 top-8 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="max-w-4xl">
            <div className="mb-5 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/[.05] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[.18em] text-emerald-300">Indian markets · Research intelligence</div>
            <h1 className="text-[clamp(3rem,9vw,6.5rem)] font-semibold leading-[.94] tracking-[-.055em]">Research smarter.<br /><span className="text-slate-500">Invest with clarity.</span></h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">A focused workspace for Indian equities, market data and explainable GNS research.</p>
            <Link href="/stocks" className="mt-8 flex max-w-2xl items-center gap-3 rounded-xl border border-white/10 bg-white/[.04] p-2.5 shadow-2xl shadow-black/20 transition hover:border-emerald-400/30"><span className="px-2 text-xl text-slate-500">⌕</span><span className="flex-1 text-sm text-slate-500">Search a company, NSE symbol or ISIN</span><span className="rounded-lg bg-emerald-400 px-5 py-2.5 text-sm font-bold text-[#06101d]">Explore</span></Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-end justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-[.18em] text-slate-500">Research coverage</p><h2 className="mt-1 text-xl font-semibold">Your market workspace</h2></div><span className="text-[11px] text-slate-600">{priceDate ? `Data: ${priceDate}` : "Awaiting price data"}</span></div>
        <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-white/[.07] bg-[#0b1727] p-5"><p className="text-xs text-slate-500">Instruments</p><p className="mt-2 text-3xl font-semibold">{stocks.length}</p><p className="mt-1 text-xs text-slate-600">Loaded from canonical database</p></div><div className="rounded-xl border border-white/[.07] bg-[#0b1727] p-5"><p className="text-xs text-slate-500">Priced records</p><p className="mt-2 text-3xl font-semibold">{stocks.filter((s) => s.latest_price != null).length}</p><p className="mt-1 text-xs text-slate-600">Latest available market prices</p></div><div className="rounded-xl border border-white/[.07] bg-[#0b1727] p-5"><p className="text-xs text-slate-500">Scored records</p><p className="mt-2 text-3xl font-semibold text-emerald-300">{scored.length}</p><p className="mt-1 text-xs text-slate-600">Latest GNS analytics available</p></div></div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-4 sm:px-6 lg:grid-cols-[1.5fr_1fr] lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-white/[.07] bg-[#0b1727]">
          <div className="flex items-center justify-between border-b border-white/[.07] p-5"><div><p className="text-[11px] uppercase tracking-[.18em] text-slate-500">Live database</p><h2 className="mt-1 font-semibold">Stocks to research</h2></div><Link href="/stocks" className="text-xs font-semibold text-emerald-400">View all →</Link></div>
          {stocks.length ? stocks.slice(0, 6).map((stock) => <Link href={`/stocks/${stock.nse_symbol ?? stock.bse_code ?? stock.instrument_id}`} key={stock.instrument_id} className="flex items-center gap-3 border-b border-white/[.05] px-5 py-4 transition hover:bg-white/[.025]"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[.05] text-xs font-bold text-slate-300">{stock.name.slice(0, 2).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{stock.name}</span><span className="mt-0.5 block text-xs text-slate-500">{stock.nse_symbol ? `NSE · ${stock.nse_symbol}` : `BSE · ${stock.bse_code ?? "—"}`}</span></span><span className="text-right"><span className="block text-sm font-medium">{money(stock.latest_price)}</span><span className="mt-1 block text-[11px] text-slate-600">{stock.price_date ?? "No price"}</span></span>{stock.score != null && <span className="hidden w-12 text-right sm:block"><span className="block text-[9px] uppercase text-slate-600">GNS</span><span className="font-semibold text-emerald-300">{Math.round(stock.score)}</span></span>}</Link>) : <div className="p-10 text-center text-sm text-slate-500">No instruments available yet.</div>}
        </div>

        <div className="rounded-2xl border border-white/[.07] bg-[#0b1727] p-6"><p className="text-[11px] uppercase tracking-[.18em] text-slate-500">GNS intelligence</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">Explain the signal.</h2><p className="mt-3 text-sm leading-6 text-slate-400">GNS brings the latest calculated score into the same research workflow as the underlying company record.</p><div className="mt-6 space-y-2">{scored.slice(0, 4).map((stock, index) => <Link href={`/stocks/${stock.nse_symbol ?? stock.bse_code ?? stock.instrument_id}`} key={stock.instrument_id} className="flex items-center gap-3 rounded-xl border border-white/[.06] bg-white/[.02] p-3 hover:border-emerald-400/20"><span className="text-xs text-slate-600">0{index + 1}</span><span className="min-w-0 flex-1 truncate text-sm">{stock.name}</span><span className="font-semibold text-emerald-300">{Math.round(stock.score ?? 0)}</span></Link>)}</div><Link href="/gns-score" className="mt-5 block w-full rounded-xl border border-white/10 py-3 text-center text-sm font-semibold hover:bg-white/5">Explore GNS Score →</Link></div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><div className="rounded-2xl border border-white/[.07] bg-gradient-to-br from-[#0c1a2b] to-[#091522] p-7 sm:p-10"><p className="text-[11px] font-semibold uppercase tracking-[.18em] text-emerald-400">Research workflow</p><h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">Find an idea. Screen it. Understand it.</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">Move from discovery to company research without leaving GNSOne.</p><div className="mt-7 flex flex-wrap gap-3"><Link href="/screener" className="rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-[#06101d]">Open Screener</Link><Link href="/compare" className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold">Compare stocks</Link><Link href="/stocks" className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold">Browse universe</Link></div></div></section>

      <footer className="border-t border-white/[.07] py-8"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><span>© 2026 GNSOne</span><span>Market data · Research · Intelligence</span></div></footer>
    </main>
  );
}
