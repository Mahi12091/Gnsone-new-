import Link from "next/link";
import { SiteShell, PageTitle, Card } from "@/components/site-shell";
import { getStocks } from "@/lib/data/stock-repository";

export default async function StocksPage() {
  const stocks = await getStocks(100);

  return <SiteShell><PageTitle eyebrow="Equity research" title="Stocks" description="Explore Indian equities from the canonical GNSOne market database."/><Card><div className="border-b border-white/[.07] p-4"><input className="h-10 w-full rounded-lg border border-white/10 bg-white/[.03] px-4 text-sm outline-none placeholder:text-slate-600 focus:border-emerald-400/50" placeholder="Search company, NSE symbol or ISIN" readOnly /></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="text-xs uppercase tracking-wider text-slate-600"><tr><th className="px-5 py-4">Company</th><th>NSE</th><th className="px-5">BSE</th></tr></thead><tbody>{stocks.map((stock) => <tr key={stock.instrument_id} className="border-t border-white/[.05] hover:bg-white/[.025]"><td className="px-5 py-4"><Link href={`/stocks/${stock.nse_symbol ?? stock.bse_code ?? stock.instrument_id}`} className="font-medium hover:text-emerald-400">{stock.name}</Link></td><td className="text-slate-400">{stock.nse_symbol ?? "—"}</td><td className="px-5 text-slate-400">{stock.bse_code ?? "—"}</td></tr>)}</tbody></table>{!stocks.length && <div className="p-10 text-center text-slate-500">No instruments are available.</div>}</div></Card></SiteShell>;
}
