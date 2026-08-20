import { normalizeExchangeRow, type ExchangeMasterRow } from "../exchange-master";
import { resolveIdentity, type IdentityCandidate } from "../identity-resolver";

export type InstrumentUpsertAction = "INSERT" | "UPDATE" | "SKIP" | "CONFLICT";

export type ExistingInstrument = IdentityCandidate;

export type InstrumentUpsertResult = {
  action: InstrumentUpsertAction;
  reason: string;
  normalized: ExchangeMasterRow;
  matchedInstrumentId?: string;
};

export function decideInstrumentUpsert(
  row: ExchangeMasterRow,
  existing: ExistingInstrument[],
): InstrumentUpsertResult {
  const normalized = normalizeExchangeRow(row);
  const resolution = resolveIdentity(normalized, existing);

  if (resolution.strategy === "NEW") {
    return {
      action: "INSERT",
      reason: "No existing canonical identity matched the normalized exchange row.",
      normalized,
    };
  }

  const matched = existing.find((candidate) => {
    if (resolution.strategy === "ISIN") return candidate.isin === normalized.isin;
    if (resolution.strategy === "NSE_SYMBOL") return candidate.nseSymbol === normalized.nseSymbol;
    if (resolution.strategy === "BSE_CODE") return candidate.bseCode === normalized.bseCode;
    return candidate.name === normalized.name;
  });

  return matched
    ? {
        action: "UPDATE",
        reason: `Matched existing instrument using ${resolution.strategy}.`,
        normalized,
        matchedInstrumentId: matched.instrumentId,
      }
    : {
        action: "CONFLICT",
        reason: `Identity resolver returned ${resolution.strategy}, but the candidate could not be resolved deterministically.`,
        normalized,
      };
}
