import { describe, expect, it } from "vitest";

import {
  normalizeInstrumentRow,
  normalizeIsin,
  normalizeSymbol,
  slugify,
} from "./normalizer";

import { resolveInstrumentIdentity } from "./identity-resolver";

describe("instrument normalization", () => {
  it("normalizes an NSE equity row", () => {
    const result = normalizeInstrumentRow({
      source: "NSE",
      symbol: " reliance ",
      isin: "ine002a01018",
      name: " Reliance   Industries Ltd ",
      exchange: "NSE",
      securityType: "EQ",
    });

    expect(result).toMatchObject({
      name: "Reliance Industries Ltd",
      isin: "INE002A01018",
      nseSymbol: "RELIANCE",
      bseCode: null,
      exchange: "NSE",
      assetType: "EQUITY",
    });
  });

  it("rejects malformed ISIN values", () => {
    expect(normalizeIsin("not-an-isin")).toBeNull();
  });

  it("creates stable slugs", () => {
    expect(slugify("Tata Motors & Finance Ltd.")).toBe("tata-motors-and-finance-ltd");
  });

  it("normalizes symbols", () => {
    expect(normalizeSymbol("  tcs ")).toBe("TCS");
  });
});

describe("instrument identity resolution", () => {
  const existing = [
    {
      id: "instrument-1",
      name: "Reliance Industries Ltd",
      isin: "INE002A01018",
      nseSymbol: "RELIANCE",
      bseCode: "500325",
    },
  ];

  it("matches by ISIN first", () => {
    const row = normalizeInstrumentRow({
      source: "NSE",
      name: "Reliance Industries Limited",
      isin: "INE002A01018",
      symbol: "RELIANCE",
      exchange: "NSE",
    });

    expect(row).not.toBeNull();
    expect(resolveInstrumentIdentity(row!, existing)).toEqual({
      action: "MATCH",
      instrumentId: "instrument-1",
      reason: "ISIN",
    });
  });

  it("creates a new identity when no stable match exists", () => {
    const row = normalizeInstrumentRow({
      source: "NSE",
      name: "New Example Ltd",
      symbol: "NEWEX",
      exchange: "NSE",
    });

    expect(row).not.toBeNull();
    expect(resolveInstrumentIdentity(row!, existing)).toEqual({
      action: "CREATE",
      instrumentId: null,
      reason: "NO_MATCH",
    });
  });
});
