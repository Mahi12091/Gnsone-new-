import { describe, expect, it } from "vitest";
import { validateQuote } from "./provider";

describe("market data provider contract", () => {
  it("rejects non-canonical identifiers", () => {
    expect(() =>
      validateQuote({
        instrumentId: "RELIANCE",
        listingId: "NSE",
        asOf: new Date().toISOString(),
        price: 100,
        open: 99,
        high: 101,
        low: 98,
        previousClose: 99,
        volume: 1000,
        sourceCode: "TEST",
      }),
    ).toThrow();
  });

  it("accepts a canonical quote", () => {
    const quote = validateQuote({
      instrumentId: "00000000-0000-0000-0000-000000000001",
      listingId: "00000000-0000-0000-0000-000000000002",
      asOf: new Date().toISOString(),
      price: 100,
      open: 99,
      high: 101,
      low: 98,
      previousClose: 99,
      volume: 1000,
      sourceCode: "TEST",
    });
    expect(quote.sourceCode).toBe("TEST");
  });
});
