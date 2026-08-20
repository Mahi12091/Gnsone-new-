import { describe, expect, it } from "vitest";
import { validateInstrumentRows } from "./data-quality";

describe("validateInstrumentRows", () => {
  const nse = { source: "NSE" as const };

  it("rejects missing identity fields", () => {
    const report = validateInstrumentRows([
      { ...nse, isin: "", name: "", nseSymbol: "", bseCode: "" },
    ]);
    expect(report.invalidRows).toBe(1);
    expect(report.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["MISSING_ISIN", "MISSING_NAME", "MISSING_EXCHANGE_ID"]),
    );
  });

  it("detects duplicate exchange identities", () => {
    const rows = [
      { ...nse, isin: "INE123456789", name: "Alpha", nseSymbol: "ALPHA", bseCode: "100001" },
      { ...nse, isin: "INE123456789", name: "Alpha Ltd", nseSymbol: "ALPHA", bseCode: "100001" },
    ];
    const report = validateInstrumentRows(rows);
    expect(report.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["DUPLICATE_ISIN", "DUPLICATE_NSE_SYMBOL", "DUPLICATE_BSE_CODE"]),
    );
  });

  it("accepts a valid unique row", () => {
    const report = validateInstrumentRows([
      { ...nse, isin: "INE123456789", name: "Alpha", nseSymbol: "ALPHA", bseCode: "100001" },
    ]);
    expect(report).toMatchObject({ totalRows: 1, validRows: 1, invalidRows: 0 });
  });
});
