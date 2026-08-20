import { createSupabaseServerClient } from "@/lib/supabase/server";

export type StockListItem = {
  instrument_id: string;
  company_id: string;
  name: string;
  nse_symbol: string | null;
  bse_code: string | null;
  nse_listing_id: string | null;
};

export type StockDetail = StockListItem & {
  latest_price: number | null;
  price_date: string | null;
  score: number | null;
};

export type StockResearchDetail = {
  instrument: Record<string, any>;
  price: Record<string, any> | null;
  range_52w: { high: number | null; low: number | null } | null;
  score: Record<string, any> | null;
  identifiers: Array<{ type: string; value: string; current: boolean }>;
  equity_profile: Record<string, any> | null;
  shareholding: Array<Record<string, any>>;
  dividends: Array<Record<string, any>>;
  corporate_actions: Array<Record<string, any>>;
  technicals: Array<Record<string, any>>;
  price_history: Array<{ date: string; close: number | null }>;
};

type SnapshotRow = {
  instrument_id: string;
  company_id: string;
  name: string;
  nse_symbol: string | null;
  bse_code: string | null;
  nse_listing_id: string | null;
  latest_price: number | null;
  price_date: string | null;
  score: number | null;
};

function mapSnapshot(row: SnapshotRow): StockDetail {
  return {
    instrument_id: row.instrument_id,
    company_id: row.company_id,
    name: row.name,
    nse_symbol: row.nse_symbol,
    bse_code: row.bse_code,
    nse_listing_id: row.nse_listing_id,
    latest_price: row.latest_price == null ? null : Number(row.latest_price),
    price_date: row.price_date,
    score: row.score == null ? null : Number(row.score),
  };
}

function num(value: unknown): number | null {
  return value == null ? null : Number(value);
}

export async function getStockSnapshots(limit = 6): Promise<StockDetail[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("gns_get_stock_snapshots", { p_limit: limit });
  if (error) throw new Error(`Unable to load stock snapshots: ${error.message}`);
  return ((data ?? []) as SnapshotRow[]).map(mapSnapshot);
}

export async function getStocks(limit = 50): Promise<StockListItem[]> {
  const rows = await getStockSnapshots(limit);
  return rows.map(({ latest_price: _price, price_date: _date, score: _score, ...stock }) => stock);
}

export async function getStockBySymbol(symbol: string): Promise<StockDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("gns_get_stock_by_symbol", { p_symbol: symbol.trim() });
  if (error) throw new Error(`Unable to load stock: ${error.message}`);
  const row = (data?.[0] ?? null) as SnapshotRow | null;
  return row ? mapSnapshot(row) : null;
}

export async function getStockResearchDetail(symbol: string): Promise<StockResearchDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("gns_get_stock_research_detail", { p_symbol: symbol.trim() });
  if (error) throw new Error(`Unable to load stock research detail: ${error.message}`);
  if (!data) return null;

  const raw = data as any;
  return {
    ...raw,
    price: raw.price ? Object.fromEntries(Object.entries(raw.price).map(([key, value]) => [key, key === "source_updated_at" || key === "date" ? value : num(value)])) : null,
    range_52w: raw.range_52w ? { high: num(raw.range_52w.high), low: num(raw.range_52w.low) } : null,
    score: raw.score ? Object.fromEntries(Object.entries(raw.score).map(([key, value]) => [key, key === "as_of_date" ? value : num(value)])) : null,
    equity_profile: raw.equity_profile ? Object.fromEntries(Object.entries(raw.equity_profile).map(([key, value]) => [key, key === "security_type" ? value : num(value)])) : null,
    technicals: (raw.technicals ?? []).map((item: any) => ({ ...item, value: num(item.value) })),
    price_history: (raw.price_history ?? []).map((item: any) => ({ date: item.date, close: num(item.close) })),
  } as StockResearchDetail;
}
