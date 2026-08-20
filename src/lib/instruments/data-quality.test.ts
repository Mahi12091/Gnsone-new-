import { describe, expect, it } from "vitest";

import { validateExchangeRows } from "./data-quality";

describe("validateExchangeRows", () => {
  it("rejects rows without a canonical identifier", () => {
    const result = validateExchangeRows([
      { source: "NSE", name: "Example Ltd", isin: null, nseSymbol: null, bseCode: null },
    ]);

    expect(result.invalidRowIndexes.has(0)).toBe(true);
    expect(result.issues.some((issue) => issue.code === "MISSING_IDENTIFIER")).toBe(true);
  });

  it("detects duplicate exchange identifiers", () => {
    const rows = [
      { source: "NSE" as const, name: "Alpha Ltd", isin: "INE000A01010", nseSymbol: "ALPHA", bseCode: null },
      { source: "NSE" as const, name: "Beta Ltd", isin: "INE000A01010", nseSymbol: "BETA", bseCode: null },
    ];

    const result = validateExchangeRows(rows);

    expect(result.invalidRowIndexes.has(0)).toBe(true);
    expect(result.invalidRowIndexes.has(1)).toBe(true);
    expect(result.issues.some((issue) => issue.code === "DUPLICATE_ISIN")).toBe(true);
  });

  it("accepts a valid row", () => {
    const result = validateExchangeRows([
      { source: "NSE", name: "Alpha Ltd", isin: "INE000A01010", nseSymbol: "ALPHA", bseCode: null },
    ]);

    expect(result.invalidRowIndexes.size).toBe(0);
    expect(result.issues).toHaveLength(0);
  });
});
