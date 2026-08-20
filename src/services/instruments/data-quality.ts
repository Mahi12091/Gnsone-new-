import type { ExchangeMasterRow } from "../../lib/instruments/exchange-master";

export type DataQualityIssueCode =
  | "MISSING_ISIN"
  | "MISSING_NAME"
  | "MISSING_EXCHANGE_ID"
  | "INVALID_ISIN"
  | "DUPLICATE_ISIN"
  | "DUPLICATE_NSE_SYMBOL"
  | "DUPLICATE_BSE_CODE";

export type DataQualityIssue = {
  rowIndex: number;
  code: DataQualityIssueCode;
  message: string;
};

export type DataQualityReport = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  issues: DataQualityIssue[];
};

const ISIN_PATTERN = /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/;

export function validateInstrumentRows(rows: ExchangeMasterRow[]): DataQualityReport {
  const issues: DataQualityIssue[] = [];
  const isins = new Map<string, number>();
  const nseSymbols = new Map<string, number>();
  const bseCodes = new Map<string, number>();

  rows.forEach((row, rowIndex) => {
    const isin = row.isin?.trim().toUpperCase();
    const name = row.name?.trim();
    const nseSymbol = row.nseSymbol?.trim().toUpperCase();
    const bseCode = row.bseCode?.trim();

    if (!isin) issues.push({ rowIndex, code: "MISSING_ISIN", message: "ISIN is required." });
    else if (!ISIN_PATTERN.test(isin)) issues.push({ rowIndex, code: "INVALID_ISIN", message: `Invalid ISIN: ${isin}` });

    if (!name) issues.push({ rowIndex, code: "MISSING_NAME", message: "Instrument name is required." });
    if (!nseSymbol && !bseCode) issues.push({ rowIndex, code: "MISSING_EXCHANGE_ID", message: "At least one exchange identifier is required." });

    if (isin) {
      const previous = isins.get(isin);
      if (previous !== undefined) issues.push({ rowIndex, code: "DUPLICATE_ISIN", message: `ISIN duplicates row ${previous}.` });
      else isins.set(isin, rowIndex);
    }

    if (nseSymbol) {
      const previous = nseSymbols.get(nseSymbol);
      if (previous !== undefined) issues.push({ rowIndex, code: "DUPLICATE_NSE_SYMBOL", message: `NSE symbol duplicates row ${previous}.` });
      else nseSymbols.set(nseSymbol, rowIndex);
    }

    if (bseCode) {
      const previous = bseCodes.get(bseCode);
      if (previous !== undefined) issues.push({ rowIndex, code: "DUPLICATE_BSE_CODE", message: `BSE code duplicates row ${previous}.` });
      else bseCodes.set(bseCode, rowIndex);
    }
  });

  const invalidRows = new Set(issues.map((issue) => issue.rowIndex)).size;

  return {
    totalRows: rows.length,
    validRows: rows.length - invalidRows,
    invalidRows,
    issues,
  };
}
