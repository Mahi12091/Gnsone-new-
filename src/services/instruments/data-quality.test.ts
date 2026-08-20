import { describe, expect, it } from "vitest";
import { validateInstrumentRows } from "./data-quality";

describe("validateInstrumentRows", () => {
  it("rejects missing identity fields", () => {
    const report = validateInstrumentRows([
      { isin: "", name: "", nseSymbol: "", bseCode: "" },
    ]);
    expect(report.invalidRows).toBe(1);
    expect(report.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["MISSING_ISIN", "MISSING_NAME", "MISSING_EXCHANGE_ID"]),
    );
  });

  it("detects duplicate exchange identities", () => {
    const rows = [
      { isin: "INE123456789", name: "Alpha", nseSymbol: "ALPHA", bseCode: "100001" },
      { isin: "INE123456789", name: "Alpha Ltd", nseSymbol: "ALPHA", bseCode: "100001" },
    ];
    const report = validateInstrumentRows(rows);
    expect(report.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["DUPLICATE_ISIN", "DUPLICATE_NSE_SYMBOL", "DUPLICATE_BSE_CODE"]),
    );
  });

  it("accepts a valid unique row", () => {
    const report = validateInstrumentRows([
      { isin: "INE123456789", name: "Alpha", nseSymbol: "ALPHA", bseCode: "100001" },
    ]);
    expect(report).toMatchObject({ totalRows: 1, validRows: 1, invalidRows: 0 });
  });
});
