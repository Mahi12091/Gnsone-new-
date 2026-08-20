import { z } from "zod";

export const exchangeMasterRowSchema = z.object({
  source: z.enum(["NSE", "BSE"]),
  name: z.string().min(1),
  isin: z.string().optional().nullable(),
  nseSymbol: z.string().optional().nullable(),
  bseCode: z.string().optional().nullable(),
  series: z.string().optional().nullable(),
  securityType: z.string().optional().nullable(),
});

export type ExchangeMasterRow = z.infer<typeof exchangeMasterRowSchema>;

export function normalizeIsin(value: string | null | undefined): string | null {
  const normalized = value?.trim().toUpperCase() ?? "";
  return /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(normalized) ? normalized : null;
}

export function normalizeSymbol(value: string | null | undefined): string | null {
  const normalized = value?.trim().toUpperCase() ?? "";
  return normalized.length > 0 ? normalized : null;
}

export function normalizeBseCode(value: string | number | null | undefined): string | null {
  const normalized = value === null || value === undefined ? "" : String(value).trim();
  return /^\d+$/.test(normalized) ? normalized : null;
}

export function normalizeCompanyName(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/&/g, " AND ")
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .replace(/\b(LIMITED|LTD|LIMITED\.)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

export function normalizeExchangeRow(row: ExchangeMasterRow): ExchangeMasterRow {
  return {
    ...row,
    name: row.name.trim(),
    isin: normalizeIsin(row.isin),
    nseSymbol: normalizeSymbol(row.nseSymbol),
    bseCode: normalizeBseCode(row.bseCode),
    series: normalizeSymbol(row.series),
    securityType: normalizeSymbol(row.securityType),
  };
}
