const markets = [
  { name: "NIFTY 50", value: "25,114.70", change: "+0.42%", up: true },
  { name: "SENSEX", value: "82,676.47", change: "+0.31%", up: true },
  { name: "BANK NIFTY", value: "56,982.20", change: "−0.18%", up: false },
  { name: "NIFTY IT", value: "39,482.10", change: "+0.76%", up: true },
];

const stocks = [
  ["Reliance Industries", "₹1,418.20", "+1.84%", "82"],
  ["HDFC Bank", "₹1,985.40", "+1.26%", "86"],
  ["TCS", "₹3,186.70", "+0.94%", "89"],
  ["ICICI Bank", "₹1,432.15", "+0.81%", "91"],
  ["Infosys", "₹1,612.35", "−0.42%", "84"],
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#06101d] text-slate-100">
      <nav className="sticky top-0 z-20 border-b border-white/[0.07] bg-[#06101d]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-5 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-400 font-black text-[#06101d]">G</div>
            <span className="text-lg font-bold tracking-tight">GNSOne</span>
          </div>
          <div className="hidden items-center gap-7 text-sm text-slate-400 md:flex">
            <a className="text-white" href="#markets">Markets</a><a href="#stocks">Stocks</a><a href="#screener">Screener</a><a href="#research">Research</a>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden h-9 w-64 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-3 text-sm text-slate-500 sm:flex">⌕ <span>Search stocks, ETFs, indices...</span></div>
            <button className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium hover:bg-white/5">Sign in</button>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_35%,rgba(34,197,94,.13),transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
          <div className="max-w-4xl">
            <div className="mb-5 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Indian markets · Research intelligence</div>
            <h1 className="text-5xl font-semibold leading-[1.02] tracking-[-0.04em] md:text-7xl">Research the market.<br /><span className="text-slate-400">Invest with clarity.</span></h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">One intelligent workspace for stocks, fundamentals, valuation, market data and the GNS Score.</p>
            <div className="mt-9 flex max-w-2xl items-center gap-3 rounded-xl border border-white/10 bg-white/[0.045] p-2 shadow-2xl shadow-black/20">
              <span className="px-3 text-xl text-slate-500">⌕</span><span className="flex-1 text-sm text-slate-500">Search a company, NSE symbol or ISIN</span><button className="rounded-lg bg-emerald-400 px-5 py-2.5 text-sm font-bold text-[#06101d]">Explore</button>
            </div>
          </div>
        </div>
      </section>

      <section id="markets" className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <div className="mb-4 flex items-end justify-between"><div><p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Market overview</p><h2 className="mt-1 text-xl font-semibold">Indian markets</h2></div><span className="text-xs text-slate-500">Live data integration ready</span></div>
        <div className="grid gap-px overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.07] sm:grid-cols-2 lg:grid-cols-4">
          {markets.map((m) => <div key={m.name} className="bg-[#0b1727] p-5"><p className="text-xs font-medium text-slate-500">{m.name}</p><div className="mt-2 flex items-baseline justify-between"><span className="text-xl font-semibold tracking-tight">{m.value}</span><span className={`text-sm font-semibold ${m.up ? "text-emerald-400" : "text-rose-400"}`}>{m.change}</span></div></div>)}
        </div>
      </section>

      <section id="stocks" className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[1.5fr_1fr] lg:px-8">
        <div className="rounded-xl border border-white/[0.07] bg-[#0b1727]">
          <div className="flex items-center justify-between border-b border-white/[0.07] p-5"><div><p className="text-xs uppercase tracking-widest text-slate-500">Market pulse</p><h2 className="mt-1 font-semibold">Stocks investors are watching</h2></div><button className="text-xs font-semibold text-emerald-400">View all →</button></div>
          <div>{stocks.map(([name,price,change,score]) => <div key={name} className="flex items-center gap-4 border-b border-white/[0.05] px-5 py-4 last:border-0"><div className="grid h-9 w-9 place-items-center rounded-lg bg-white/[0.06] text-xs font-bold text-slate-300">{name.slice(0,2).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{name}</p><p className="mt-0.5 text-xs text-slate-500">NSE</p></div><div className="text-right"><p className="text-sm font-medium">{price}</p><p className={`mt-0.5 text-xs ${change.startsWith("+") ? "text-emerald-400" : "text-rose-400"}`}>{change}</p></div><div className="hidden w-16 text-right sm:block"><p className="text-[10px] uppercase text-slate-600">GNS</p><p className="font-semibold text-emerald-300">{score}</p></div></div>)}</div>
        </div>
        <div id="research" className="rounded-xl border border-white/[0.07] bg-[#0b1727] p-6"><p className="text-xs uppercase tracking-widest text-slate-500">GNS Intelligence</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">A clearer way to read a stock.</h2><p className="mt-3 text-sm leading-6 text-slate-400">Combine quality, growth, valuation, momentum and risk into one explainable research framework.</p><div className="mt-7 grid grid-cols-2 gap-2">{[["Quality","91"],["Growth","84"],["Value","78"],["Momentum","86"]].map(([a,b]) => <div key={a} className="rounded-lg border border-white/[0.06] bg-white/[0.025] p-4"><p className="text-xs text-slate-500">{a}</p><p className="mt-1 text-2xl font-semibold">{b}</p></div>)}</div><button className="mt-5 w-full rounded-lg border border-white/10 py-2.5 text-sm font-semibold hover:bg-white/5">Explore GNS Score</button></div>
      </section>

      <section id="screener" className="mx-auto max-w-7xl px-5 py-16 lg:px-8"><div className="rounded-2xl border border-white/[0.07] bg-gradient-to-br from-[#0c1a2b] to-[#091522] p-8 md:p-12"><p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Built for serious research</p><h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">From a stock idea to a complete investment thesis.</h2><p className="mt-4 max-w-2xl text-slate-400">Screen companies, compare fundamentals and understand what is driving the numbers — without the noise.</p><div className="mt-8 flex flex-wrap gap-3"><button className="rounded-lg bg-emerald-400 px-5 py-3 text-sm font-bold text-[#06101d]">Open Screener</button><button className="rounded-lg border border-white/10 px-5 py-3 text-sm font-semibold">Browse stocks</button></div></div></section>

      <footer className="border-t border-white/[0.07] py-8"><div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between lg:px-8"><span>© 2026 GNSOne</span><span>Market data • Research • Intelligence</span></div></footer>
    </main>
  );
}
