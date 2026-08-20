import type { ExchangeMasterRow } from "./exchange-master";
import { normalizeCompanyName, normalizeExchangeRow } from "./exchange-master";

export type InstrumentMatch = {
  strategy: "ISIN" | "NSE_SYMBOL" | "BSE_CODE" | "NAME" | "NEW";
  confidence: "HIGH" | "MEDIUM" | "LOW";
};

export type IdentityCandidate = {
  instrumentId: string;
  name: string;
  isin: string | null;
  nseSymbol: string | null;
  bseCode: string | null;
};

export function resolveIdentity(
  row: ExchangeMasterRow,
  candidates: IdentityCandidate[],
): InstrumentMatch {
  const normalized = normalizeExchangeRow(row);

  if (normalized.isin) {
    const match = candidates.find((candidate) => candidate.isin === normalized.isin);
    if (match) return { strategy: "ISIN", confidence: "HIGH" };
  }

  if (normalized.nseSymbol) {
    const match = candidates.find(
      (candidate) => candidate.nseSymbol === normalized.nseSymbol,
    );
    if (match) return { strategy: "NSE_SYMBOL", confidence: "HIGH" };
  }

  if (normalized.bseCode) {
    const match = candidates.find(
      (candidate) => candidate.bseCode === normalized.bseCode,
    );
    if (match) return { strategy: "BSE_CODE", confidence: "HIGH" };
  }

  const normalizedName = normalizeCompanyName(normalized.name);
  if (normalizedName) {
    const match = candidates.find(
      (candidate) => normalizeCompanyName(candidate.name) === normalizedName,
    );
    if (match) return { strategy: "NAME", confidence: "LOW" };
  }

  return { strategy: "NEW", confidence: "HIGH" };
}
