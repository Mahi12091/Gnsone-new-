import { decideInstrumentUpsert, type InstrumentUpsertResult } from "./instrument-upsert";
import type { ExchangeInstrumentRow } from "../normalizer";
import type { ExistingInstrument } from "../resolver";

export type InstrumentImportSummary = {
  total: number;
  inserted: number;
  updated: number;
  conflicts: number;
  skipped: number;
  results: InstrumentUpsertResult[];
};

/**
 * Batch decision service. It intentionally has no Supabase dependency so it
 * can be tested deterministically and later wired to a repository adapter.
 */
export function planInstrumentImport(
  rows: ExchangeInstrumentRow[],
  existing: ExistingInstrument[],
): InstrumentImportSummary {
  const results = rows.map((row) => decideInstrumentUpsert(row, existing));

  return {
    total: results.length,
    inserted: results.filter((result) => result.action === "INSERT").length,
    updated: results.filter((result) => result.action === "UPDATE").length,
    conflicts: results.filter((result) => result.action === "CONFLICT").length,
    skipped: results.filter((result) => result.action === "SKIP").length,
    results,
  };
}
