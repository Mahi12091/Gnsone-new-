import { normalizeExchangeRow, type ExchangeMasterRow } from "./exchange-master";

export type DataQualityIssue = {
  rowIndex: number;
  code:
    | "MISSING_NAME"
    | "MISSING_IDENTIFIER"
    | "INVALID_ISIN"
    | "DUPLICATE_ISIN"
    | "DUPLICATE_NSE_SYMBOL"
    | "DUPLICATE_BSE_CODE";
  message: string;
};

export type ExchangeRowQualityResult = {
  issues: DataQualityIssue[];
  invalidRowIndexes: Set<number>;
};

export function validateExchangeRows(rows: ExchangeMasterRow[]): ExchangeRowQualityResult {
  const issues: DataQualityIssue[] = [];
  const invalidRowIndexes = new Set<number>();
  const seenIsin = new Map<string, number>();
  const seenNse = new Map<string, number>();
  const seenBse = new Map<string, number>();

  rows.forEach((input, rowIndex) => {
    const row = normalizeExchangeRow(input);
    const hasIdentifier = Boolean(row.isin || row.nseSymbol || row.bseCode);

    if (!row.name.trim()) {
      issues.push({ rowIndex, code: "MISSING_NAME", message: "Instrument/company name is required." });
      invalidRowIndexes.add(rowIndex);
    }

    if (!hasIdentifier) {
      issues.push({
        rowIndex,
        code: "MISSING_IDENTIFIER",
        message: "At least one canonical exchange identifier is required.",
      });
      invalidRowIndexes.add(rowIndex);
    }

    if (input.isin && !row.isin) {
      issues.push({ rowIndex, code: "INVALID_ISIN", message: "ISIN format is invalid." });
      invalidRowIndexes.add(rowIndex);
    }

    const duplicate = (
      value: string | null | undefined,
      seen: Map<string, number>,
      code: DataQualityIssue["code"],
      label: string,
    ) => {
      if (!value) return;
      const previous = seen.get(value);
      if (previous !== undefined) {
        issues.push({
          rowIndex,
          code,
          message: `${label} duplicates row ${previous + 1}.`,
        });
        invalidRowIndexes.add(rowIndex);
        invalidRowIndexes.add(previous);
      } else {
        seen.set(value, rowIndex);
      }
    };

    duplicate(row.isin, seenIsin, "DUPLICATE_ISIN", "ISIN");
    duplicate(row.nseSymbol, seenNse, "DUPLICATE_NSE_SYMBOL", "NSE symbol");
    duplicate(row.bseCode, seenBse, "DUPLICATE_BSE_CODE", "BSE code");
  });

  return { issues, invalidRowIndexes };
}
