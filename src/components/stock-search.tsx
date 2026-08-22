"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Stock = {
  instrument_id: string;
  name: string;
  nse_symbol: string | null;
  bse_code: string | null;
};

export function StockSearch({ stocks }: { stocks: Stock[] }) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stocks;
    return stocks.filter((stock) =>
      [stock.name, stock.nse_symbol, stock.bse_code]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    );
  }, [query, stocks]);

  return (
    <div>
      <div className="border-b border-slate-200 p-4">
        <label htmlFor="stock-search" className="sr-only">Search stocks</label>
        <div className="relative">
          <input
            id="stock-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 pr-24 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50"
            placeholder="Search company, NSE symbol or BSE code"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              Clear
            </button>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <span>{query ? `${results.length} result${results.length === 1 ? "" : "s"} found` : `${stocks.length} stocks available`}</span>
          {query && results.length === 0 && <span>No matching stock found</span>}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-4">Company</th>
              <th>NSE</th>
              <th className="px-5">BSE</th>
            </tr>
          </thead>
          <tbody>
            {results.map((stock) => (
              <tr key={stock.instrument_id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-5 py-4">
                  <Link
                    href={`/stocks/${stock.nse_symbol ?? stock.bse_code ?? stock.instrument_id}`}
                    className="font-medium text-slate-900 hover:text-emerald-600"
                  >
                    {stock.name}
                  </Link>
                </td>
                <td className="text-slate-500">{stock.nse_symbol ?? "—"}</td>
                <td className="px-5 text-slate-500">{stock.bse_code ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!results.length && (
          <div className="p-10 text-center">
            <p className="font-medium text-slate-700">No stocks found</p>
            <p className="mt-1 text-sm text-slate-500">Try the company name, NSE symbol or BSE code.</p>
          </div>
        )}
      </div>
    </div>
  );
}
