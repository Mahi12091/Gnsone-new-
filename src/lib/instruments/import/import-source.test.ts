import { describe, expect, it } from "vitest";
import { parseExchangeMaster } from "./import-source";

describe("parseExchangeMaster", () => {
  it("parses and normalizes NSE master rows", () => {
    const rows = parseExchangeMaster("NSE", "SYMBOL,NAME OF COMPANY,ISIN\nRELIANCE,Reliance Industries Limited,INE002A01018\n");
    expect(rows).toEqual([
      {
        source: "NSE",
        name: "Reliance Industries Limited",
        isin: "INE002A01018",
        nseSymbol: "RELIANCE",
        bseCode: null,
        series: null,
        securityType: null,
      },
    ]);
  });

  it("parses BSE scrip codes", () => {
    const rows = parseExchangeMaster("BSE", "SCRIP CODE,SCRIP NAME,ISIN\n500325,RELIANCE INDUSTRIES LTD.,INE002A01018\n");
    expect(rows[0]?.bseCode).toBe("500325");
  });
});
