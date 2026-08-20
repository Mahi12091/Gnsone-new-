import { validateQuote, type HistoricalPrice, type MarketDataProvider, type Quote } from "./provider";

const NSE_QUOTE_URL = "https://www.nseindia.com/api/quote-equity?symbol=";

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(number) ? number : null;
}

async function nseFetch(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: {
      accept: "application/json,text/plain,*/*",
      "user-agent": "Mozilla/5.0 GNSOne/1.0",
      referer: "https://www.nseindia.com/",
    },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`NSE request failed: ${response.status}`);
  return response.json();
}

export const nsePublicProvider: MarketDataProvider = {
  code: "NSE_PUBLIC",

  async getQuote({ instrumentId, listingId, symbol }): Promise<Quote | null> {
    const payload = (await nseFetch(`${NSE_QUOTE_URL}${encodeURIComponent(symbol)}`)) as Record<string, any>;
    const priceInfo = payload.priceInfo ?? {};
    return validateQuote({
      instrumentId,
      listingId,
      asOf: new Date().toISOString(),
      price: parseNumber(priceInfo.lastPrice),
      open: parseNumber(priceInfo.open),
      high: parseNumber(priceInfo.intraDayHighLow?.max),
      low: parseNumber(priceInfo.intraDayHighLow?.min),
      previousClose: parseNumber(priceInfo.previousClose),
      volume: parseNumber(payload.preOpenMarket?.totalTradedVolume ?? payload.securityWiseDP?.tradedVolume),
      sourceCode: "NSE_PUBLIC",
    });
  },

  async getHistoricalPrices(): Promise<HistoricalPrice[]> {
    throw new Error("NSE historical endpoint is intentionally not guessed; use an approved historical provider adapter.");
  },
};
