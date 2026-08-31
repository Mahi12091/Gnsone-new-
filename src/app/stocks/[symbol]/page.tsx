import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell, PageTitle, Card } from "@/components/site-shell";
import { getStockBySymbol, getStockResearchDetail } from "@/lib/data/stock-repository";

const missing = "Not available";

type AnyRow = Record<string, unknown>;

function n(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatValue(key: string, value: unknown): string {
  if (value == null || value === "") return missing;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (key.includes("date") || key.endsWith("_at")) return new Date(String(value)).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const number = n(value);
  if (number == null) return String(value);
  if (key.includes("percentage") || key.includes("margin") || key.includes("yield") || key === "roe" || key === "roa" || key === "roce") return `${number.toFixed(2)}%`;
  if (key.includes("ratio") || key.includes("multiple") || key === "pe_ratio" || key === "pb_ratio" || key === "ps_ratio" || key === "peg_ratio" || key.includes("ev_")) return `${number.toFixed(2)}x`;
  return number.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function label(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function money(value: unknown): string {
  const number = n(value);
  if (number == null) return missing;
  return `₹${number.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function crore(value: unknown): string {
  const number = n(value);
  if (number == null) return missing;
  return `₹${(number / 1e7).toLocaleString("en-IN", { maximumFractionDigits: 2 })} Cr`;
}

function Stat({ label: title, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[.07] bg-white/[.025] p-4">
      <p className="text-[11px] uppercase tracking-[.14em] text-slate-500">{title}</p>
      <p className="mt-2 break-words text-lg font-semibold text-slate-100">{value}</p>
    </div>
  );
}

function ObjectGrid({ data, financial = false }: { data: AnyRow | null; financial?: boolean }) {
  if (!data || Object.keys(data).length === 0) return <p className="text-sm text-slate-500">{missing}</p>;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Object.entries(data).map(([key, value]) => (
        <Stat key={key} label={label(key)} value={financial && ["revenue", "gross_profit", "operating_profit", "ebit", "ebitda", "profit_before_tax", "tax_expense", "net_income", "operating_cash_flow", "investing_cash_flow", "financing_cash_flow", "capital_expenditure", "free_cash_flow", "total_assets", "current_assets", "cash_and_equivalents", "total_liabilities", "current_liabilities", "total_debt", "net_debt", "shareholders_equity"].includes(key) ? crore(value) : formatValue(key, value)} />
      ))}
    </div>
  );
}

function DataTable({ rows, title }: { rows: AnyRow[]; title: string }) {
  if (!rows.length) return <p className="text-sm text-slate-500">{missing}</p>;
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="bg-white/[.025] text-xs uppercase tracking-wider text-slate-600">
          <tr>
            {columns.map((column) => <th key={column} className="px-4 py-3">{label(column)}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-white/[.05]">
              {columns.map((column) => <td key={column} className="whitespace-nowrap px-4 py-3 text-slate-400">{formatValue(column, row[column])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Empty({ text = "No data available in the current canonical feed." }: { text?: string }) {
  return <div className="rounded-xl border border-dashed border-white/10 bg-white/[.015] p-6 text-sm text-slate-500">{text}</div>;
}

function PriceChart({ history }: { history: Array<{ date: string; close: number | null }> }) {
  const points = history.filter((point) => point.close != null).slice(-120);
  if (points.length < 2) return <Empty text="Historical price data is not available yet." />;
  const values = points.map((point) => Number(point.close));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const coordinates = points.map((point, index) => {
    const x = (index / (points.length - 1)) * 100;
    const y = 94 - ((Number(point.close) - min) / range) * 84;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
  return (
    <div className="overflow-hidden rounded-xl border border-white/[.07] bg-white/[.02] p-3">
      <svg viewBox="0 0 100 100" className="h-64 w-full" preserveAspectRatio="none" aria-label="Historical stock price chart">
        <polyline points={coordinates} fill="none" stroke="#10b981" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="flex justify-between text-[10px] text-slate-600"><span>{points[0].date}</span><span>{points[points.length - 1].date}</span></div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }): Promise<Metadata> {
  const { symbol } = await params;
  const stock = await getStockBySymbol(symbol);
  return {
    title: stock ? `${stock.name} Share Price & Stock Research | GNSOne` : `${symbol.toUpperCase()} Stock Research | GNSOne`,
    description: stock ? `Complete stock research for ${stock.name} including price, fundamentals, valuation, ratios, ownership and technical data.` : `Stock research page for ${symbol.toUpperCase()} on GNSOne.`,
  };
}

export default async function StockPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const [stock, detail] = await Promise.all([getStockBySymbol(symbol), getStockResearchDetail(symbol)]);

  if (!stock || !detail) {
    return <SiteShell><PageTitle eyebrow="Stock research" title="Stock not found" description={`No canonical instrument was found for ${symbol.toUpperCase()}.`} /><Link href="/stocks" className="text-sm font-semibold text-emerald-400">← Browse stocks</Link></SiteShell>;
  }

  const price = detail.price;
  const close = n(price?.close) ?? stock.latest_price;
  const previousClose = n(price?.previous_close);
  const change = close != null && previousClose != null ? close - previousClose : null;
  const changePct = change != null && previousClose ? (change / previousClose) * 100 : null;
  const score = n(detail.score?.overall) ?? stock.score;
  const financials = detail.financials;
  const valuation = detail.valuation;

  const sections = [
    ["Overview", "#overview"], ["Price", "#price"], ["GNS Score", "#gns-score"], ["Fundamentals", "#fundamentals"], ["Financial History", "#financial-history"], ["Valuation", "#valuation"], ["Growth & Ratios", "#growth"], ["Shareholding", "#shareholding"], ["Technicals", "#technicals"], ["Dividends", "#dividends"], ["Corporate Actions", "#corporate-actions"], ["Instrument", "#instrument"]
  ] as const;

  const technicalGrid = detail.technicals.reduce((acc: AnyRow, item: AnyRow) => {
    const key = typeof item.code === "string" ? item.code : typeof item.name === "string" ? item.name : "indicator";
    acc[key] = item.value;
    return acc;
  }, {});

  return (
    <SiteShell>
      <section id="overview" className="mb-6 scroll-mt-24">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <PageTitle eyebrow="Complete stock research" title={stock.name} description={`${detail.instrument.nse_symbol ? `NSE: ${detail.instrument.nse_symbol}` : `BSE: ${detail.instrument.bse_code ?? "—"}`} · Complete market, financial, valuation, growth and ownership research.`} />
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="rounded-full border border-white/[.07] px-3 py-1.5">{detail.instrument.instrument_type ?? "Equity"}</span>
              {detail.instrument.sector && <span className="rounded-full border border-white/[.07] px-3 py-1.5">{detail.instrument.sector}</span>}
              {detail.instrument.industry && <span className="rounded-full border border-white/[.07] px-3 py-1.5">{detail.instrument.industry}</span>}
              <span className="rounded-full border border-white/[.07] px-3 py-1.5">{detail.instrument.currency ?? "INR"}</span>
            </div>
          </div>
          <Link href="/stocks" className="shrink-0 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5">← All stocks</Link>
        </div>
      </section>

      <nav aria-label="Stock research sections" className="sticky top-2 z-20 mb-6 overflow-x-auto rounded-xl border border-white/[.07] bg-[#0b1727]/95 p-2 shadow-xl backdrop-blur">
        <div className="flex min-w-max gap-1">{sections.map(([name, href]) => <a key={href} href={href} className="rounded-lg px-3 py-2 text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-white">{name}</a>)}</div>
      </nav>

      <div className="grid gap-5 lg:grid-cols-[1.7fr_.8fr]">
        <Card id="price" className="p-5 sm:p-6">
          <p className="text-xs uppercase tracking-[.16em] text-slate-500">{detail.instrument.nse_symbol ? `NSE · ${detail.instrument.nse_symbol}` : `BSE · ${detail.instrument.bse_code ?? "—"}`}</p>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-100 sm:text-5xl">{money(close)}</p>
          {change != null ? <p className={`mt-2 text-sm font-semibold ${change >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{change >= 0 ? "+" : ""}{money(change)} ({changePct?.toFixed(2)}%) vs previous close</p> : <p className="mt-2 text-sm text-slate-500">Price change unavailable</p>}
          <p className="mt-2 text-xs text-slate-600">As of {price?.date ?? stock.price_date ?? missing}</p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4"><Stat label="Open" value={money(price?.open)} /><Stat label="High" value={money(price?.high)} /><Stat label="Low" value={money(price?.low)} /><Stat label="Previous Close" value={money(price?.previous_close)} /></div>
          <div className="mt-4"><PriceChart history={detail.price_history} /></div>
          <div className="mt-4"><ObjectGrid data={price} /></div>
        </Card>

        <Card id="gns-score" className="p-6">
          <p className="text-xs uppercase tracking-[.16em] text-slate-500">GNS Score</p>
          <p className="mt-3 text-6xl font-bold tracking-tight text-emerald-300">{score == null ? "—" : Math.round(score)}</p>
          <p className="mt-2 text-sm text-slate-500">Latest calculated research score</p>
          <p className="mt-2 text-xs text-slate-600">As of {detail.score?.as_of_date ?? missing}</p>
          <div className="mt-7"><ObjectGrid data={detail.score} /></div>
        </Card>
      </div>

      <section className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5"><Stat label="Market Identity" value={detail.instrument.nse_symbol ?? detail.instrument.bse_code ?? missing} /></Card>
        <Card className="p-5"><Stat label="Market Cap" value={crore(valuation?.market_cap)} /></Card>
        <Card className="p-5"><Stat label="Shares Outstanding" value={formatValue("shares_outstanding", detail.equity_profile?.shares_outstanding)} /></Card>
        <Card className="p-5"><Stat label="Enterprise Value" value={crore(valuation?.enterprise_value)} /></Card>
      </section>

      <section id="fundamentals" className="mt-10 scroll-mt-24">
        <PageTitle eyebrow="Fundamentals" title="Business & financial fundamentals" description="Every field currently returned by the financial dataset is displayed." />
        <Card className="p-5"><ObjectGrid data={financials} financial /></Card>
      </section>

      <section id="financial-history" className="mt-10 scroll-mt-24">
        <PageTitle eyebrow="History" title="Financial statement history" description={`${detail.financial_history.length} financial period${detail.financial_history.length === 1 ? "" : "s"} available.`} />
        <Card className="overflow-hidden"><DataTable rows={detail.financial_history} title="Financial history" /></Card>
      </section>

      <section id="valuation" className="mt-10 scroll-mt-24">
        <PageTitle eyebrow="Valuation" title="Valuation metrics" description="Latest valuation plus every available historical valuation snapshot." />
        <Card className="p-5"><ObjectGrid data={valuation} /></Card>
        <Card className="mt-4 overflow-hidden"><DataTable rows={detail.valuation_history} title="Valuation history" /></Card>
      </section>

      <section id="growth" className="mt-10 scroll-mt-24">
        <PageTitle eyebrow="Growth & profitability" title="Ratios, margins, growth and financial health" description="All currently available ratio fields and historical ratio snapshots." />
        <Card className="p-5"><ObjectGrid data={detail.ratios} /></Card>
        <Card className="mt-4 overflow-hidden"><DataTable rows={detail.ratio_history} title="Ratio history" /></Card>
      </section>

      <section id="shareholding" className="mt-10 scroll-mt-24">
        <PageTitle eyebrow="Ownership" title="Shareholding pattern" description="Latest available ownership records." />
        <Card className="overflow-hidden"><DataTable rows={detail.shareholding} title="Shareholding" /></Card>
      </section>

      <section id="technicals" className="mt-10 scroll-mt-24">
        <PageTitle eyebrow="Technicals" title="Technical indicators" description="Latest technical indicators connected to the canonical listing." />
        <Card className="p-5"><ObjectGrid data={technicalGrid} /></Card>
      </section>

      <section id="dividends" className="mt-10 scroll-mt-24">
        <PageTitle eyebrow="Income" title="Dividend history" description="Cash distribution history currently available in the canonical feed." />
        <Card className="overflow-hidden"><DataTable rows={detail.dividends} title="Dividends" /></Card>
      </section>

      <section id="corporate-actions" className="mt-10 scroll-mt-24">
        <PageTitle eyebrow="Events" title="Corporate actions" description="Splits, bonuses and other corporate actions in the canonical market feed." />
        <Card className="overflow-hidden"><DataTable rows={detail.corporate_actions} title="Corporate actions" /></Card>
      </section>

      <section id="instrument" className="mt-10 scroll-mt-24">
        <PageTitle eyebrow="Instrument" title="Instrument metadata" description="Canonical identifiers and listing metadata for this security." />
        <Card className="p-5"><ObjectGrid data={detail.instrument} /></Card>
        <Card className="mt-4 overflow-hidden"><DataTable rows={detail.identifiers} title="Identifiers" /></Card>
        <Card className="mt-4 p-5"><ObjectGrid data={detail.equity_profile} /></Card>
      </section>
    </SiteShell>
  );
}
