import type { NormalizedInstrumentRow } from "./normalizer";

export interface ExistingInstrument {
  id: string;
  name: string;
  isin: string | null;
  nseSymbol: string | null;
  bseCode: string | null;
}

export interface IdentityResolution {
  action: "MATCH" | "CREATE" | "CONFLICT";
  instrumentId: string | null;
  reason: "ISIN" | "NSE_SYMBOL" | "BSE_CODE" | "NAME" | "NO_MATCH" | "MULTIPLE_MATCHES";
}

/**
 * Resolve a normalized exchange row against the canonical instrument master.
 * Matching precedence intentionally favors stable identifiers over names.
 */
export function resolveInstrumentIdentity(
  row: NormalizedInstrumentRow,
  existing: ExistingInstrument[],
): IdentityResolution {
  const isinMatches = row.isin
    ? existing.filter((item) => item.isin === row.isin)
    : [];
  if (isinMatches.length === 1) {
    return { action: "MATCH", instrumentId: isinMatches[0].id, reason: "ISIN" };
  }
  if (isinMatches.length > 1) {
    return { action: "CONFLICT", instrumentId: null, reason: "MULTIPLE_MATCHES" };
  }

  const symbolMatches = row.nseSymbol
    ? existing.filter((item) => item.nseSymbol === row.nseSymbol)
    : [];
  if (symbolMatches.length === 1) {
    return { action: "MATCH", instrumentId: symbolMatches[0].id, reason: "NSE_SYMBOL" };
  }
  if (symbolMatches.length > 1) {
    return { action: "CONFLICT", instrumentId: null, reason: "MULTIPLE_MATCHES" };
  }

  const bseMatches = row.bseCode
    ? existing.filter((item) => item.bseCode === row.bseCode)
    : [];
  if (bseMatches.length === 1) {
    return { action: "MATCH", instrumentId: bseMatches[0].id, reason: "BSE_CODE" };
  }
  if (bseMatches.length > 1) {
    return { action: "CONFLICT", instrumentId: null, reason: "MULTIPLE_MATCHES" };
  }

  const normalizedName = row.name.toLowerCase();
  const nameMatches = existing.filter(
    (item) => item.name.trim().toLowerCase() === normalizedName,
  );
  if (nameMatches.length === 1) {
    return { action: "MATCH", instrumentId: nameMatches[0].id, reason: "NAME" };
  }
  if (nameMatches.length > 1) {
    return { action: "CONFLICT", instrumentId: null, reason: "MULTIPLE_MATCHES" };
  }

  return { action: "CREATE", instrumentId: null, reason: "NO_MATCH" };
}
