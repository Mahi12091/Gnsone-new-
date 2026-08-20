import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell, PageTitle, Card } from "@/components/site-shell";
import { getStockBySymbol, getStockResearchDetail } from "@/lib/data/stock-repository";

const missing = "Not available";

function money(value: unknown) {
  if (value == null || !Number.isFinite(Number(value)) || Number(value) <= 0) return missing;
  return `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function number(value: unknown, digits = 2) {
  if (value == null || !Number.isFinite(Number(value))) return missing;
  return Number(value).toLocaleString("en-IN", { maximumFractionDigits: digits });
}

function pct(value: unknown) {
  if (value == null || !Number.isFinite(Number(value))) return missing;
  return `${Number(value).toFixed(2)}%`;
}

function dateLabel(value: unknown) {
  if (!value) return missing;
  return new Date(String(value)).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return <div className="rounded-xl border border-white/[.07] bg-white/[.025] p-4"><p className="text-[11px] uppercase tracking-[.14em] text-slate-500">{label}</p><p className="mt-2 text-lg font-semibold text-slate-100">{value}</p>{hint && <p className="mt-1 text-[11px] text-slate-600">{hint}</p>}</div>;
}

function EmptyState({ text = "This dataset is not available in the current canonical feed." }: { text?: string }) {
  return <div className="rounded-xl border border-dashed border-white/10 bg-white/[.015] p-6 text-sm leading-6 text-slate-500">{text}</div>;
}

function PriceChart({ history }: { history: Array<{ date: string; close: number | null }> }) {
  const points = history.filter((x) => x.close != null).slice(-90);
  if (points.length < 2) return <EmptyState text="Historical price data will appear here as the canonical price history is populated." />;
  const values = points.map((x) => Number(x.close));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const coords = points.map((point, index) => {
    const x = (index / (points.length - 1)) * 100;
    const y = 94 - ((Number(point.close) - min) / range) * 84;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
  return <div className="overflow-hidden rounded-xl border border-white/[.07] bg-white/[.02] p-3"><svg viewBox="0 0 100 100" className="h-56 w-full" preserveAspectRatio="none" aria-label="Historical stock price chart"><defs><linearGradient id="gns-stock-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity=".22"/><stop offset="100%" stopColor="#10b981" stopOpacity="0"/></linearGradient></defs><polyline points={`${coords} 100,100 0,100`} fill="url(#gns-stock-fill)" stroke="none"/><polyline points={coords} fill="none" stroke="#10b981" strokeWidth="1.4" vectorEffect="non-scaling-stroke"/></svg><div className="flex justify-between px-1 text-[10px] text-slate-600"><span>{dateLabel(points[0].date)}</span><span>{dateLabel(points[points.length - 1].date)}</span></div></div>;
}

export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }): Promise<Metadata> {
  const { symbol } = await params;
  const stock = await getStockBySymbol(symbol);
  if (!stock) return { title: `${symbol.toUpperCase()} Stock Research | GNSOne`, description: `Stock research page for ${symbol.toUpperCase()} on GNSOne.` };
  const exchange = stock.nse_symbol ? `NSE: ${stock.nse_symbol}` : `BSE: ${stock.bse_code ?? symbol.toUpperCase()}`;
  return {
    title: `${stock.name} Share Price, Stock Research & GNS Score | GNSOne`,
    description: `${stock.name} (${exchange}) — research price data, GNS Score, market information, identifiers and investment research on GNSOne.`,
    keywords: [stock.name, stock.nse_symbol ?? symbol.toUpperCase(), "share price", "stock research", "GNS Score", "Indian stock market"],
    alternates: { canonical: `/stocks/${encodeURIComponent(stock.nse_symbol ?? symbol.toUpperCase())}` },
    openGraph: { title: `${stock.name} Stock Research | GNSOne`, description: `Research ${stock.name}, price data and GNS Score on GNSOne.`, type: "website" },
  };
}

export default async function StockPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const [stock, detail] = await Promise.all([getStockBySymbol(symbol), getStockResearchDetail(symbol)]);

  if (!stock || !detail) return <SiteShell><PageTitle eyebrow="Stock research" title="Stock not found" description={`No canonical instrument was found for ${symbol.toUpperCase()}.`} /><Link href="/stocks" className="text-sm font-semibold text-emerald-400">← Browse stocks</Link></SiteShell>;

  const price = detail.price;
  const previousClose = price?.previous_close == null ? null : Number(price.previous_close);
  const close = price?.close == null ? stock.latest_price : Number(price.close);
  const change = close != null && previousClose != null && close > 0 && previousClose > 0 ? close - previousClose : null;
  const changePct = change != null && previousClose ? (change / previousClose) * 100 : null;
  const score = detail.score?.overall == null ? stock.score : Number(detail.score.overall);
  const scoreParts = [
    ["Quality", detail.score?.quality], ["Valuation", detail.score?.valuation], ["Growth", detail.score?.growth], ["Momentum", detail.score?.momentum], ["Risk", detail.score?.risk],
  ] as const;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${stock.name} Stock Research`,
    description: `Research page for ${stock.name} on GNSOne.`,
    about: { "@type": "Corporation", name: stock.name, tickerSymbol: stock.nse_symbol ? `NSE:${stock.nse_symbol}` : undefined },
    isPartOf: { "@type": "WebSite", name: "GNSOne", url: "https://gnsone.com" },
  };

  const moduleLinks = [
    ["Overview", "#overview"], ["Price", "#price"], ["GNS Score", "#gns-score"], ["Fundamentals", "#fundamentals"], ["Valuation", "#valuation"], ["Growth", "#growth"], ["Shareholding", "#shareholding"], ["Technicals", "#technicals"], ["Dividends", "#dividends"], ["Corporate Actions", "#corporate-actions"],
  ] as const;

  return <SiteShell>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

    <section id="overview" className="mb-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <PageTitle eyebrow="Stock research" title={stock.name} description={`${detail.instrument.nse_symbol ? `NSE: ${detail.instrument.nse_symbol}` : `BSE: ${detail.instrument.bse_code ?? "—"}`} · Canonical GNSOne research record with market, score and instrument data.`} />
          <div className="flex flex-wrap gap-2 text-xs text-slate-500"><span className="rounded-full border border-white/[.07] px-3 py-1.5">{detail.instrument.instrument_type ?? "Equity"}</span>{detail.instrument.sector && <span className="rounded-full border border-white/[.07] px-3 py-1.5">{detail.instrument.sector}</span>}{detail.instrument.industry && <span className="rounded-full border border-white/[.07] px-3 py-1.5">{detail.instrument.industry}</span>}<span className="rounded-full border border-white/[.07] px-3 py-1.5">{detail.instrument.currency ?? "INR"}</span></div>
        </div>
        <Link href="/stocks" className="shrink-0 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5">← All stocks</Link>
      </div>
    </section>

    <nav aria-label="Stock research sections" className="mb-6 overflow-x-auto rounded-xl border border-white/[.07] bg-[#0b1727] p-2"><div className="flex min-w-max gap-1">{moduleLinks.map(([label, href]) => <a key={href} href={href} className="rounded-lg px-3 py-2 text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-white">{label}</a>)}</div></nav>

    <div className="grid gap-5 lg:grid-cols-[1.7fr_.8fr]">
      <Card id="price" className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[.16em] text-slate-500">{detail.instrument.nse_symbol ? `NSE · ${detail.instrument.nse_symbol}` : `BSE · ${detail.instrument.bse_code ?? "—"}`}</p><p className="mt-3 text-4xl font-semibold tracking-tight text-slate-100 sm:text-5xl">{money(close)}</p>{change != null ? <p className={`mt-2 text-sm font-semibold ${change >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{change >= 0 ? "+" : ""}{money(change)} ({changePct?.toFixed(2)}%) vs previous close</p> : <p className="mt-2 text-sm text-slate-500">Price change unavailable</p>}</div><div className="text-right text-xs text-slate-500">As of<br /><span className="text-slate-300">{dateLabel(price?.date ?? stock.price_date)}</span></div></div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4"><Stat label="Open" value={money(price?.open)} /><Stat label="High" value={money(price?.high)} /><Stat label="Low" value={money(price?.low)} /><Stat label="Previous close" value={money(price?.previous_close)} /></div>
        <div className="mt-4"><PriceChart history={detail.price_history} /></div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"><Stat label="52W high" value={money(detail.range_52w?.high)} /><Stat label="52W low" value={money(detail.range_52w?.low)} /><Stat label="Volume" value={number(price?.volume, 0)} /><Stat label="Turnover" value={money(price?.turnover)} /></div>
      </Card>

      <Card id="gns-score" className="p-6"><p className="text-xs uppercase tracking-[.16em] text-slate-500">GNS Score</p><p className="mt-3 text-6xl font-bold tracking-tight text-emerald-300">{score == null ? "—" : Math.round(score)}</p><p className="mt-2 text-sm text-slate-500">Latest calculated research score</p><p className="mt-2 text-xs text-slate-600">As of {dateLabel(detail.score?.as_of_date)}</p><div className="mt-7 space-y-3">{scoreParts.map(([label, value]) => <div key={label}><div className="mb-1 flex justify-between text-xs"><span className="text-slate-500">{label}</span><span className="font-semibold text-slate-300">{value == null ? "—" : Math.round(Number(value))}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/[.06]"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.max(0, Math.min(100, Number(value ?? 0)))}%` }} /></div></div>)}</div></Card>
    </div>

    <section className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="p-5"><p className="text-xs text-slate-500">Market identity</p><p className="mt-2 font-semibold">{detail.instrument.nse_symbol ?? detail.instrument.bse_code ?? "—"}</p><p className="mt-1 text-xs text-slate-600">{detail.instrument.company_display_name ?? stock.name}</p></Card>
      <Card className="p-5"><p className="text-xs text-slate-500">Sector</p><p className="mt-2 font-semibold">{detail.instrument.sector ?? missing}</p><p className="mt-1 text-xs text-slate-600">{detail.instrument.industry ?? "Industry not mapped"}</p></Card>
      <Card className="p-5"><p className="text-xs text-slate-500">Shares outstanding</p><p className="mt-2 font-semibold">{number(detail.equity_profile?.shares_outstanding, 0)}</p><p className="mt-1 text-xs text-slate-600">Canonical equity profile</p></Card>
      <Card className="p-5"><p className="text-xs text-slate-500">Face value</p><p className="mt-2 font-semibold">{money(detail.equity_profile?.face_value ?? detail.instrument.face_value)}</p><p className="mt-1 text-xs text-slate-600">Per share</p></Card>
    </section>

    <section id="fundamentals" className="mt-8 scroll-mt-24"><PageTitle eyebrow="Fundamentals" title="Business & financial fundamentals" description="A structured fundamentals area is reserved for the canonical financial statement feed."/><Card className="p-5"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Stat label="Revenue" value={missing} /><Stat label="EBITDA" value={missing} /><Stat label="Net profit" value={missing} /><Stat label="EPS" value={missing} /><Stat label="Operating cash flow" value={missing} /><Stat label="Free cash flow" value={missing} /><Stat label="Total assets" value={missing} /><Stat label="Total debt" value={missing} /></div><p className="mt-5 text-xs leading-5 text-slate-600">These fields are intentionally not fabricated. They will populate when the canonical financial-statement feed is connected to this page.</p></Card></section>

    <section id="valuation" className="mt-8 scroll-mt-24"><PageTitle eyebrow="Valuation" title="Valuation metrics" description="The valuation layer is designed for market-cap, enterprise-value and relative valuation research."/><Card className="p-5"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Stat label="Market cap" value={missing} /><Stat label="Enterprise value" value={missing} /><Stat label="P/E ratio" value={missing} /><Stat label="P/B ratio" value={missing} /><Stat label="P/S ratio" value={missing} /><Stat label="PEG ratio" value={missing} /><Stat label="EV / EBITDA" value={missing} /><Stat label="Dividend yield" value={missing} /></div></Card></section>

    <section id="growth" className="mt-8 scroll-mt-24"><PageTitle eyebrow="Growth" title="Growth & profitability" description="Growth metrics are grouped by revenue, profit and EPS so the page can scale into historical and CAGR analysis."/><Card className="p-5"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><Stat label="Revenue 1Y" value={missing} /><Stat label="Revenue CAGR 3Y" value={missing} /><Stat label="Revenue CAGR 5Y" value={missing} /><Stat label="Profit 1Y" value={missing} /><Stat label="Profit CAGR 3Y" value={missing} /><Stat label="EPS 1Y" value={missing} /><Stat label="EPS CAGR 3Y" value={missing} /><Stat label="ROE" value={missing} /><Stat label="ROCE" value={missing} /><Stat label="Net margin" value={missing} /></div></Card></section>

    <section id="shareholding" className="mt-8 scroll-mt-24"><PageTitle eyebrow="Ownership" title="Shareholding pattern" description="Latest available ownership data is grouped by reporting period and holder category."/><Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-white/[.025] text-xs uppercase tracking-wider text-slate-600"><tr><th className="px-5 py-4">Category</th><th>Holding</th><th>Shares</th><th>Period</th></tr></thead><tbody>{detail.shareholding.length ? detail.shareholding.map((row, index) => <tr key={`${row.category}-${index}`} className="border-t border-white/[.05]"><td className="px-5 py-4 font-medium text-slate-300">{row.category_name ?? row.category}</td><td className="text-slate-400">{pct(row.percentage_held)}</td><td className="text-slate-500">{number(row.shares_held, 0)}</td><td className="text-slate-500">{dateLabel(row.period_end_date)}</td></tr>) : <tr><td colSpan={4} className="px-5 py-8"><EmptyState text="Shareholding data is not available for the latest canonical reporting period." /></td></tr>}</tbody></table></div></Card></section>

    <section id="technicals" className="mt-8 scroll-mt-24"><PageTitle eyebrow="Technicals" title="Technical indicators" description="Latest technical indicators connected to the canonical listing are displayed without inventing values."/><Card className="p-5">{detail.technicals.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{detail.technicals.map((item, index) => <Stat key={`${item.code}-${index}`} label={item.name ?? item.code} value={number(item.value)} hint={dateLabel(item.price_date)} />)}</div> : <EmptyState />}</Card></section>

    <section id="dividends" className="mt-8 scroll-mt-24"><PageTitle eyebrow="Income" title="Dividend history" description="Recent dividend events, ex-dates and per-share amounts when available."/><Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-white/[.025] text-xs uppercase tracking-wider text-slate-600"><tr><th className="px-5 py-4">Type</th><th>Amount / share</th><th>Ex-date</th><th>Payment date</th></tr></thead><tbody>{detail.dividends.length ? detail.dividends.map((row, index) => <tr key={index} className="border-t border-white/[.05]"><td className="px-5 py-4 text-slate-300">{String(row.type ?? "Dividend")}</td><td className="text-slate-400">{money(row.amount_per_share)}</td><td className="text-slate-500">{dateLabel(row.ex_date)}</td><td className="text-slate-500">{dateLabel(row.payment_date)}</td></tr>) : <tr><td colSpan={4} className="px-5 py-8"><EmptyState text="No dividend events are available in the canonical feed." /></td></tr>}</tbody></table></div></Card></section>

    <section id="corporate-actions" className="mt-8 scroll-mt-24"><PageTitle eyebrow="Corporate actions" title="Corporate action history" description="Track splits, bonuses, buybacks, dividends and other issuer events."/><Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-white/[.025] text-xs uppercase tracking-wider text-slate-600"><tr><th className="px-5 py-4">Action</th><th>Announcement</th><th>Effective</th><th>Ratio / cash</th><th>Description</th></tr></thead><tbody>{detail.corporate_actions.length ? detail.corporate_actions.map((row, index) => <tr key={index} className="border-t border-white/[.05]"><td className="px-5 py-4 text-slate-300">{String(row.type ?? "Corporate action")}</td><td className="text-slate-500">{dateLabel(row.announcement_date)}</td><td className="text-slate-500">{dateLabel(row.effective_date ?? row.ex_date)}</td><td className="text-slate-500">{row.ratio_numerator != null ? `${number(row.ratio_numerator)}:${number(row.ratio_denominator)}` : row.cash_amount != null ? money(row.cash_amount) : "—"}</td><td className="max-w-xs text-slate-500">{String(row.description ?? "—")}</td></tr>) : <tr><td colSpan={5} className="px-5 py-8"><EmptyState text="No corporate actions are available in the canonical feed." /></td></tr>}</tbody></table></div></Card></section>

    <section className="mt-8"><PageTitle eyebrow="Instrument data" title="Identifiers & listing details" description="Canonical identifiers and exchange listing attributes used to identify this instrument."/><div className="grid gap-5 lg:grid-cols-2"><Card className="p-5"><h2 className="font-semibold">Identifiers</h2><div className="mt-4 space-y-2">{detail.identifiers.length ? detail.identifiers.map((item, index) => <div key={index} className="flex items-center justify-between gap-4 rounded-lg border border-white/[.06] px-3 py-3 text-sm"><span className="text-slate-500">{item.type}</span><span className="font-medium text-slate-300">{item.value}</span></div>) : <EmptyState text="No additional current identifiers are available." />}</div></Card><Card className="p-5"><h2 className="font-semibold">Listing details</h2><div className="mt-4 grid grid-cols-2 gap-3"><Stat label="Exchange" value={detail.instrument.nse_symbol ? "NSE" : "BSE"} /><Stat label="Series" value={detail.instrument.series ?? missing} /><Stat label="Listing date" value={dateLabel(detail.instrument.listing_date)} /><Stat label="Lot size" value={number(detail.instrument.lot_size, 0)} /><Stat label="Tick size" value={number(detail.instrument.tick_size)} /><Stat label="Currency" value={detail.instrument.currency ?? missing} /></div></Card></div></section>

    <Card className="mt-8 p-5 sm:p-6"><h2 className="font-semibold">Data provenance & research disclaimer</h2><p className="mt-3 max-w-4xl text-sm leading-6 text-slate-400">This page reads the canonical GNSOne instrument record and connected market analytics. Missing values are shown explicitly rather than fabricated. Market data may be delayed. GNSOne provides research and informational content and does not provide personalized investment advice.</p><p className="mt-3 text-xs text-slate-600">Latest price source update: {dateLabel(price?.source_updated_at)} · Score date: {dateLabel(detail.score?.as_of_date)}</p></Card>
  </SiteShell>;
}
