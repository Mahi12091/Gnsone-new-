import { decideInstrumentUpsert, type InstrumentUpsertResult, type ExistingInstrument } from "./instrument-upsert";
import type { ExchangeMasterRow } from "../exchange-master";

export type InstrumentImportSummary = {
  total: number;
  inserted: number;
  updated: number;
  conflicts: number;
  skipped: number;
  results: InstrumentUpsertResult[];
};

export function planInstrumentImport(
  rows: ExchangeMasterRow[],
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
