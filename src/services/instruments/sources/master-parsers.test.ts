import { describe, expect, it } from "vitest";

import { parseBseEquityCsv } from "./bse-equity";
import { parseNseEquityCsv } from "./nse-equity";

describe("exchange master parsers", () => {
  it("parses NSE equity rows", () => {
    const csv = [
      "SYMBOL,NAME OF COMPANY,SERIES,ISIN NUMBER",
      "RELIANCE,Reliance Industries Limited,EQ,INE002A01018",
    ].join("\n");

    expect(parseNseEquityCsv(csv)).toEqual([
      expect.objectContaining({ source: "NSE", symbol: "RELIANCE", isin: "INE002A01018", name: "Reliance Industries Limited" }),
    ]);
  });

  it("parses BSE master rows", () => {
    const csv = [
      "Scrip Code,Instrument Code,Scrip Name,ISIN CODE,Security Type Flag",
      "500325,RELIANCE,Reliance Industries Limited,INE002A01018,EQ",
    ].join("\n");

    expect(parseBseEquityCsv(csv)).toEqual([
      expect.objectContaining({ source: "BSE", scripCode: "500325", symbol: "RELIANCE", isin: "INE002A01018" }),
    ]);
  });
});
