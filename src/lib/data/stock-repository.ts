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

type ResearchRow = Record<string, unknown>;

export type StockResearchDetail = {
  instrument: ResearchRow;
  price: ResearchRow | null;
  range_52w: { high: number | null; low: number | null } | null;
  score: ResearchRow | null;
  identifiers: Array<{ type: string; value: string; current: boolean }>;
  equity_profile: ResearchRow | null;
  financials: ResearchRow | null;
  financial_history: ResearchRow[];
  ratios: ResearchRow | null;
  ratio_history: ResearchRow[];
  valuation: ResearchRow | null;
  valuation_history: ResearchRow[];
  shareholding: ResearchRow[];
  dividends: ResearchRow[];
  corporate_actions: ResearchRow[];
  technicals: ResearchRow[];
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

function normalizeObject(value: ResearchRow | null | undefined, dateKeys: string[] = []): ResearchRow | null {
  if (!value) return null;
  return Object.fromEntries(Object.entries(value).map(([key, raw]) => [key, dateKeys.includes(key) ? raw : num(raw)]));
}

function rows(value: unknown): ResearchRow[] {
  if (!Array.isArray(value)) return [];
  return value.filter((row): row is ResearchRow => typeof row === "object" && row !== null && !Array.isArray(row));
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

  const raw = data as ResearchRow;
  return {
    ...raw,
    price: normalizeObject(raw.price as ResearchRow | null | undefined, ["source_updated_at", "date"]),
    range_52w: raw.range_52w && typeof raw.range_52w === "object" && !Array.isArray(raw.range_52w)
      ? { high: num((raw.range_52w as ResearchRow).high), low: num((raw.range_52w as ResearchRow).low) }
      : null,
    score: normalizeObject(raw.score as ResearchRow | null | undefined, ["as_of_date"]),
    equity_profile: normalizeObject(raw.equity_profile as ResearchRow | null | undefined, ["security_type"]),
    financials: normalizeObject(raw.financials as ResearchRow | null | undefined, []),
    financial_history: rows(raw.financial_history).map((row) => normalizeObject(row, ["period_start", "period_end", "filing_date", "period_type"]) ?? {}),
    ratios: normalizeObject(raw.ratios as ResearchRow | null | undefined, ["as_of_date"]),
    ratio_history: rows(raw.ratio_history).map((row) => normalizeObject(row, ["as_of_date"]) ?? {}),
    valuation: normalizeObject(raw.valuation as ResearchRow | null | undefined, ["as_of_date"]),
    valuation_history: rows(raw.valuation_history).map((row) => normalizeObject(row, ["as_of_date"]) ?? {}),
    shareholding: rows(raw.shareholding),
    dividends: rows(raw.dividends),
    corporate_actions: rows(raw.corporate_actions),
    technicals: rows(raw.technicals).map((item) => ({ ...item, value: num(item.value) })),
    price_history: rows(raw.price_history).flatMap((item) => {
      if (typeof item.date !== "string") return [];
      return [{ date: item.date, close: num(item.close) }];
    }),
    identifiers: Array.isArray(raw.identifiers)
      ? raw.identifiers.filter((item): item is { type: string; value: string; current: boolean } => {
          if (typeof item !== "object" || item === null || Array.isArray(item)) return false;
          const row = item as ResearchRow;
          return typeof row.type === "string" && typeof row.value === "string" && typeof row.current === "boolean";
        })
      : [],
  };
}
