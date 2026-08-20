import { z } from "zod";
import { getExchangeSourceAdapter, type ExchangeSource } from "./exchange-source-adapters";
import { exchangeMasterRowSchema, normalizeExchangeRow, type ExchangeMasterRow } from "../exchange-master";

export const importSourceSchema = z.object({
  source: z.enum(["NSE", "BSE"]),
  payload: z.string().min(1),
});

export function parseExchangeMaster(source: ExchangeSource, payload: string): ExchangeMasterRow[] {
  const input = importSourceSchema.parse({ source, payload });
  const adapter = getExchangeSourceAdapter(input.source);
  return adapter
    .parse(input.payload)
    .map(normalizeExchangeRow)
    .filter((row) => exchangeMasterRowSchema.safeParse(row).success);
}
