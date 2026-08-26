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

type JsonPrimitive = string | number | boolean | null;
type JsonObject = Record<string, JsonPrimitive>;
type RawObject = Record<string, unknown>;

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

function normalizeObject(value: RawObject | null | undefined, dateKeys: string[] = []): JsonObject | null {
  if (!value) return null;
  return Object.fromEntries(
    Object.entries(value).map(([key, raw]) => [key, dateKeys.includes(key) ? String(raw ?? "") : num(raw)])
  ) as JsonObject;
}

function asObject(value: unknown): RawObject {
  return value && typeof value === "object" && !Array.isArray(value) ? value as RawObject : {};
}

function asObjectArray(value: unknown): RawObject[] {
  return Array.isArray(value) ? value.map(asObject) : [];
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

  const raw = asObject(data);
  const instrument = normalizeObject(asObject(raw.instrument), ["security_type"]) ?? {};
  const identifiers = Array.isArray(raw.identifiers)
    ? raw.identifiers.map((item) => {
        const record = asObject(item);
        return {
          type: String(record.type ?? ""),
          value: String(record.value ?? ""),
          current: Boolean(record.current),
        };
      })
    : [];
  const range = asObject(raw.range_52w);

  return {
    instrument,
    price: normalizeObject(asObject(raw.price), ["source_updated_at", "date"]),
    range_52w: raw.range_52w && typeof raw.range_52w === "object" && !Array.isArray(raw.range_52w)
      ? { high: num(range.high), low: num(range.low) }
      : null,
    score: normalizeObject(asObject(raw.score), ["as_of_date"]),
    identifiers,
    equity_profile: normalizeObject(asObject(raw.equity_profile), ["security_type"]),
    financials: normalizeObject(asObject(raw.financials)),
    financial_history: asObjectArray(raw.financial_history).map((row) => normalizeObject(row, ["period_start", "period_end", "filing_date", "period_type"]) ?? {}),
    ratios: normalizeObject(asObject(raw.ratios), ["as_of_date"]),
    ratio_history: asObjectArray(raw.ratio_history).map((row) => normalizeObject(row, ["as_of_date"]) ?? {}),
    valuation: normalizeObject(asObject(raw.valuation), ["as_of_date"]),
    valuation_history: asObjectArray(raw.valuation_history).map((row) => normalizeObject(row, ["as_of_date"]) ?? {}),
    shareholding: asObjectArray(raw.shareholding).map((row) => normalizeObject(row) ?? {}),
    dividends: asObjectArray(raw.dividends).map((row) => normalizeObject(row) ?? {}),
    corporate_actions: asObjectArray(raw.corporate_actions).map((row) => normalizeObject(row) ?? {}),
    technicals: asObjectArray(raw.technicals).map((item) => ({ ...normalizeObject(item) ?? {}, value: num(item.value) })),
    price_history: asObjectArray(raw.price_history).map((item) => ({ date: String(item.date ?? ""), close: num(item.close) })),
  };
}
