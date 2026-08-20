import { normalizeExchangeRow, type ExchangeInstrumentRow } from "../normalizer";
import { resolveInstrumentIdentity, type ExistingInstrument } from "../resolver";

export type InstrumentUpsertAction = "INSERT" | "UPDATE" | "SKIP" | "CONFLICT";

export type InstrumentUpsertResult = {
  action: InstrumentUpsertAction;
  reason: string;
  normalized: ReturnType<typeof normalizeExchangeRow>;
  matchedInstrumentId?: string;
};

/**
 * Pure decision layer for the instrument importer.
 * Database writes belong to the repository/service layer; this function only
 * decides what should happen to an incoming exchange row.
 */
export function decideInstrumentUpsert(
  row: ExchangeInstrumentRow,
  existing: ExistingInstrument[],
): InstrumentUpsertResult {
  const normalized = normalizeExchangeRow(row);
  const resolution = resolveInstrumentIdentity(normalized, existing);

  if (resolution.kind === "conflict") {
    return {
      action: "CONFLICT",
      reason: resolution.reason,
      normalized,
    };
  }

  if (resolution.kind === "match") {
    return {
      action: "UPDATE",
      reason: resolution.reason,
      normalized,
      matchedInstrumentId: resolution.instrumentId,
    };
  }

  return {
    action: "INSERT",
    reason: "No existing canonical identity matched the normalized exchange row.",
    normalized,
  };
}
