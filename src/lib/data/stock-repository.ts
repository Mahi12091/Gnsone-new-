import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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

type Listing = {
  listing_id: string;
  exchange_id: string;
  symbol: string | null;
  exchange_security_code: string | null;
  is_primary: boolean;
};

export async function getStocks(limit = 50): Promise<StockListItem[]> {
  const supabase = createSupabaseAdminClient();
  const [{ data: exchanges, error: exchangeError }, { data, error }] = await Promise.all([
    supabase.schema("reference").from("exchanges").select("exchange_id, code"),
    supabase
      .schema("market")
      .from("instruments")
      .select(
        "instrument_id, company_id, name, listings(listing_id, exchange_id, symbol, exchange_security_code, is_primary)",
      )
      .order("name")
      .limit(limit),
  ]);

  if (exchangeError) throw new Error(`Unable to load exchanges: ${exchangeError.message}`);
  if (error) throw new Error(`Unable to load stocks: ${error.message}`);

  const exchangeCode = new Map((exchanges ?? []).map((e) => [e.exchange_id, e.code]));
  return (data ?? []).map((row: any) => {
    const listings = (row.listings ?? []) as Listing[];
    const nse = listings.find((l) => exchangeCode.get(l.exchange_id) === "NSE") ?? null;
    const bse = listings.find((l) => exchangeCode.get(l.exchange_id) === "BSE") ?? null;
    return {
      instrument_id: row.instrument_id,
      company_id: row.company_id,
      name: row.name,
      nse_symbol: nse?.symbol ?? null,
      bse_code: bse?.exchange_security_code ?? null,
      nse_listing_id: nse?.listing_id ?? null,
    };
  });
}

export async function getStockSnapshots(limit = 6): Promise<StockDetail[]> {
  const stocks = await getStocks(limit);
  if (!stocks.length) return [];

  const supabase = createSupabaseAdminClient();
  const listingIds = stocks.flatMap((s) => (s.nse_listing_id ? [s.nse_listing_id] : []));
  const instrumentIds = stocks.map((s) => s.instrument_id);

  const [{ data: prices, error: priceError }, { data: scores, error: scoreError }] =
    await Promise.all([
      listingIds.length
        ? supabase
            .schema("market")
            .from("historical_prices")
            .select("listing_id, close, price_date")
            .in("listing_id", listingIds)
            .order("price_date", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      supabase
        .schema("analytics")
        .from("stock_score_values")
        .select("instrument_id, overall_score, as_of_date")
        .in("instrument_id", instrumentIds)
        .order("as_of_date", { ascending: false }),
    ]);

  if (priceError) throw new Error(`Unable to load prices: ${priceError.message}`);
  if (scoreError) throw new Error(`Unable to load scores: ${scoreError.message}`);

  const latestPrice = new Map<string, { close: number; price_date: string }>();
  for (const row of prices ?? []) {
    if (!latestPrice.has(row.listing_id)) {
      latestPrice.set(row.listing_id, {
        close: Number(row.close),
        price_date: row.price_date,
      });
    }
  }

  const latestScore = new Map<string, number>();
  for (const row of scores ?? []) {
    if (!latestScore.has(row.instrument_id)) {
      latestScore.set(row.instrument_id, Number(row.overall_score));
    }
  }

  return stocks.map((stock) => ({
    ...stock,
    latest_price: stock.nse_listing_id
      ? latestPrice.get(stock.nse_listing_id)?.close ?? null
      : null,
    price_date: stock.nse_listing_id
      ? latestPrice.get(stock.nse_listing_id)?.price_date ?? null
      : null,
    score: latestScore.get(stock.instrument_id) ?? null,
  }));
}

export async function getStockBySymbol(symbol: string): Promise<StockDetail | null> {
  const stocks = await getStocks(5000);
  const normalized = symbol.trim().toUpperCase();
  const stock = stocks.find(
    (s) => s.nse_symbol?.toUpperCase() === normalized || s.bse_code === symbol.trim(),
  );
  if (!stock) return null;

  const supabase = createSupabaseAdminClient();
  const [{ data: prices, error: priceError }, { data: scores, error: scoreError }] =
    await Promise.all([
      stock.nse_listing_id
        ? supabase
            .schema("market")
            .from("historical_prices")
            .select("close, price_date")
            .eq("listing_id", stock.nse_listing_id)
            .order("price_date", { ascending: false })
            .limit(1)
        : Promise.resolve({ data: [], error: null }),
      supabase
        .schema("analytics")
        .from("stock_score_values")
        .select("overall_score")
        .eq("instrument_id", stock.instrument_id)
        .order("as_of_date", { ascending: false })
        .limit(1),
    ]);

  if (priceError) throw new Error(`Unable to load price: ${priceError.message}`);
  if (scoreError) throw new Error(`Unable to load score: ${scoreError.message}`);

  return {
    ...stock,
    latest_price: prices?.[0]?.close == null ? null : Number(prices[0].close),
    price_date: prices?.[0]?.price_date ?? null,
    score: scores?.[0]?.overall_score == null ? null : Number(scores[0].overall_score),
  };
}
