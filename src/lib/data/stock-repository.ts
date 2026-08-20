import { createSupabaseServerClient } from "@/lib/supabase/server";

export type StockListItem = { instrument_id: string; company_id: string; name: string; nse_symbol: string | null; bse_code: string | null };
export type StockDetail = StockListItem & { latest_price: number | null; price_date: string | null; score: number | null };

function identifiersOf(row: any) { return (row.instrument_identifiers ?? []) as Array<{ identifier_type: string; identifier_value: string }>; }

export async function getStocks(limit = 50): Promise<StockListItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.schema("market").from("instruments").select("id, company_id, name, instrument_identifiers(identifier_type, identifier_value)").order("name").limit(limit);
  if (error) throw new Error(`Unable to load stocks: ${error.message}`);
  return (data ?? []).map((row: any) => { const ids = identifiersOf(row); return { instrument_id: row.id, company_id: row.company_id, name: row.name, nse_symbol: ids.find(i => i.identifier_type === "NSE_SYMBOL")?.identifier_value ?? null, bse_code: ids.find(i => i.identifier_type === "BSE_CODE")?.identifier_value ?? null }; });
}

export async function getStockBySymbol(symbol: string): Promise<StockDetail | null> {
  const stocks = await getStocks(5000); const normalized = symbol.toUpperCase();
  const stock = stocks.find(s => s.nse_symbol?.toUpperCase() === normalized || s.bse_code === symbol);
  if (!stock) return null;
  const supabase = await createSupabaseServerClient();
  const [{ data: prices }, { data: scores }] = await Promise.all([
    supabase.schema("market").from("historical_prices").select("close, price_date").eq("instrument_id", stock.instrument_id).order("price_date", { ascending: false }).limit(1),
    supabase.schema("analytics").from("stock_score_values").select("overall_score").eq("instrument_id", stock.instrument_id).order("as_of_date", { ascending: false }).limit(1),
  ]);
  return { ...stock, latest_price: prices?.[0]?.close ?? null, price_date: prices?.[0]?.price_date ?? null, score: scores?.[0]?.overall_score ?? null };
}
