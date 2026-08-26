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

type JsonObject = Record<string, unknown>;

export type StockResearchDetail = {
  instrument: JsonObject;
  price: JsonObject | null;
  range_52w: { high: number | null; low: number | null } | null;
  score: JsonObject | null;
  identifiers: Array<{ type: string; value: string; current: boolean }>;
  equity_profile: JsonObject | null;
  financials: JsonObject | null;
  financial_history: JsonObject[];
  ratios: JsonObject | null;
  ratio_history: JsonObject[];
  valuation: JsonObject | null;
  valuation_history: JsonObject[];
  shareholding: JsonObject[];
  dividends: JsonObject[];
  corporate_actions: JsonObject[];
  technicals: JsonObject[];
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

function normalizeObject(value: JsonObject | null | undefined, dateKeys: string[] = []): JsonObject | null {
  if (!value) return null;
  return Object.fromEntries(Object.entries(value).map(([key, raw]) => [key, dateKeys.includes(key) ? raw : num(raw)]));
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

  const raw = data as JsonObject;
  return {
    ...raw,
    price: normalizeObject(raw.price as JsonObject | null | undefined, ["source_updated_at", "date"]),
    range_52w: raw.range_52w && typeof raw.range_52w === "object" ? { high: num((raw.range_52w as JsonObject).high), low: num((raw.range_52w as JsonObject).low) } : null,
    score: normalizeObject(raw.score as JsonObject | null | undefined, ["as_of_date"]),
    equity_profile: normalizeObject(raw.equity_profile as JsonObject | null | undefined, ["security_type"]),
    financials: normalizeObject(raw.financials as JsonObject | null | undefined, []),
    financial_history: (Array.isArray(raw.financial_history) ? raw.financial_history : []).map((row) => normalizeObject(row as JsonObject, ["period_start", "period_end", "filing_date", "period_type"]) ?? {}),
    ratios: normalizeObject(raw.ratios as JsonObject | null | undefined, ["as_of_date"]),
    ratio_history: (Array.isArray(raw.ratio_history) ? raw.ratio_history : []).map((row) => normalizeObject(row as JsonObject, ["as_of_date"]) ?? {}),
    valuation: normalizeObject(raw.valuation as JsonObject | null | undefined, ["as_of_date"]),
    valuation_history: (Array.isArray(raw.valuation_history) ? raw.valuation_history : []).map((row) => normalizeObject(row as JsonObject, ["as_of_date"]) ?? {}),
    technicals: (Array.isArray(raw.technicals) ? raw.technicals : []).map((item) => {
      const record = item as JsonObject;
      return { ...record, value: num(record.value) };
    }),
    price_history: (Array.isArray(raw.price_history) ? raw.price_history : []).map((item) => {
      const record = item as JsonObject;
      return { date: String(record.date ?? ""), close: num(record.close) };
    }),
  };
}
