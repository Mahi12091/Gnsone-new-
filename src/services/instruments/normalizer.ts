export type InstrumentSource = "NSE" | "BSE";

export interface RawInstrumentRow {
  source: InstrumentSource;
  symbol?: string | null;
  scripCode?: string | null;
  isin?: string | null;
  name?: string | null;
  securityType?: string | null;
  exchange?: "NSE" | "BSE" | null;
}

export interface NormalizedInstrumentRow {
  source: InstrumentSource;
  name: string;
  slugBase: string;
  isin: string | null;
  nseSymbol: string | null;
  bseCode: string | null;
  exchange: "NSE" | "BSE";
  securityType: string | null;
  assetType: "EQUITY" | "ETF" | "MUTUAL_FUND" | "BOND" | "COMMODITY" | "INDEX";
}

export function normalizeText(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length ? normalized : null;
}

export function normalizeIsin(value: string | null | undefined): string | null {
  const normalized = normalizeText(value)?.toUpperCase() ?? null;
  if (!normalized) return null;
  return /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(normalized) ? normalized : null;
}

export function normalizeSymbol(value: string | null | undefined): string | null {
  const normalized = normalizeText(value)?.toUpperCase() ?? null;
  return normalized ? normalized : null;
}

export function normalizeBseCode(value: string | null | undefined): string | null {
  const normalized = normalizeText(value)?.replace(/\.0$/, "") ?? null;
  return normalized ? normalized : null;
}

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function inferAssetType(securityType: string | null): NormalizedInstrumentRow["assetType"] {
  const value = securityType?.toUpperCase() ?? "";
  if (value.includes("ETF")) return "ETF";
  if (value.includes("MF") || value.includes("MUTUAL")) return "MUTUAL_FUND";
  if (value.includes("BOND") || value.includes("DEBT")) return "BOND";
  if (value.includes("INDEX")) return "INDEX";
  return "EQUITY";
}

export function normalizeInstrumentRow(row: RawInstrumentRow): NormalizedInstrumentRow | null {
  const name = normalizeText(row.name);
  if (!name) return null;

  const isin = normalizeIsin(row.isin);
  const symbol = normalizeSymbol(row.symbol);
  const bseCode = normalizeBseCode(row.scripCode);
  const exchange = row.exchange ?? row.source;
  const securityType = normalizeText(row.securityType);

  return {
    source: row.source,
    name,
    slugBase: slugify(name),
    isin,
    nseSymbol: exchange === "NSE" ? symbol : null,
    bseCode: exchange === "BSE" ? bseCode : null,
    exchange,
    securityType,
    assetType: inferAssetType(securityType),
  };
}
