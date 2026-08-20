import { createSupabaseServerClient } from "@/lib/supabase/server";

export type StockListItem = {
  instrument_id: string;
  company_id: string;
  name: string;
  nse_symbol: string | null;
  bse_code: string | null;
};

export async function getStocks(limit = 50): Promise<StockListItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("market")
    .from("instruments")
    .select("id, company_id, name, instrument_identifiers(identifier_type, identifier_value)")
    .order("name")
    .limit(limit);

  if (error) throw new Error(`Unable to load stocks: ${error.message}`);

  return (data ?? []).map((row) => {
    const identifiers = (row.instrument_identifiers ?? []) as Array<{ identifier_type: string; identifier_value: string }>;
    return {
      instrument_id: row.id,
      company_id: row.company_id,
      name: row.name,
      nse_symbol: identifiers.find((i) => i.identifier_type === "NSE_SYMBOL")?.identifier_value ?? null,
      bse_code: identifiers.find((i) => i.identifier_type === "BSE_CODE")?.identifier_value ?? null,
    };
  });
}

export async function getStockBySymbol(symbol: string) {
  const stocks = await getStocks(5000);
  const normalized = symbol.toUpperCase();
  return stocks.find((stock) => stock.nse_symbol?.toUpperCase() === normalized || stock.bse_code === symbol) ?? null;
}
