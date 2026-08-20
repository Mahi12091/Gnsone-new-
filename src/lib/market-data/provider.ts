import { z } from "zod";

export const quoteSchema = z.object({
  instrumentId: z.string().uuid(),
  listingId: z.string().uuid(),
  asOf: z.string().datetime(),
  price: z.number().finite().nonnegative().nullable(),
  open: z.number().finite().nonnegative().nullable(),
  high: z.number().finite().nonnegative().nullable(),
  low: z.number().finite().nonnegative().nullable(),
  previousClose: z.number().finite().nonnegative().nullable(),
  volume: z.number().finite().nonnegative().nullable(),
  sourceCode: z.string().min(1),
});

export type Quote = z.infer<typeof quoteSchema>;
export type HistoricalPrice = Quote & { priceDate: string; adjustedClose: number | null };

export interface MarketDataProvider {
  readonly code: string;
  getQuote(input: {
    instrumentId: string;
    listingId: string;
    symbol: string;
    exchange: "NSE" | "BSE";
  }): Promise<Quote | null>;
  getHistoricalPrices(input: {
    instrumentId: string;
    listingId: string;
    symbol: string;
    exchange: "NSE" | "BSE";
    from: string;
    to: string;
  }): Promise<HistoricalPrice[]>;
}

export function validateQuote(value: unknown): Quote {
  return quoteSchema.parse(value);
}
