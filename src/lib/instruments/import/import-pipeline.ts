import { planInstrumentImport } from "./instrument-import-service";
import type { ExistingInstrument } from "./instrument-upsert";
import { validateExchangeRows, type DataQualityIssue } from "../data-quality";
import type { ExchangeMasterRow } from "../exchange-master";

export type ImportPipelinePlan = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  qualityIssues: DataQualityIssue[];
  insertCount: number;
  updateCount: number;
  conflictCount: number;
  skipCount: number;
};

export function buildImportPipelinePlan(
  rows: ExchangeMasterRow[],
  existing: ExistingInstrument[],
): ImportPipelinePlan {
  const quality = validateExchangeRows(rows);
  const validRows = rows.filter((_, index) => !quality.invalidRowIndexes.has(index));
  const importPlan = planInstrumentImport(validRows, existing);

  return {
    totalRows: rows.length,
    validRows: validRows.length,
    invalidRows: rows.length - validRows.length,
    qualityIssues: quality.issues,
    insertCount: importPlan.inserted,
    updateCount: importPlan.updated,
    conflictCount: importPlan.conflicts,
    skipCount: importPlan.skipped,
  };
}
