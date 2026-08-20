import type { RawInstrumentRow } from "../normalizer";

export const NSE_EQUITY_MASTER_URL = "https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv";

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        value += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      values.push(value.trim());
      value = "";
    } else {
      value += char;
    }
  }
  values.push(value.trim());
  return values;
}

export function parseNseEquityCsv(csv: string): RawInstrumentRow[] {
  const lines = csv.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((header) => header.toUpperCase().trim());
  const index = (names: string[]) => names.map((name) => headers.indexOf(name)).find((position) => position >= 0) ?? -1;
  const symbolIndex = index(["SYMBOL"]);
  const nameIndex = index(["NAME OF COMPANY", "COMPANY NAME"]);
  const isinIndex = index(["ISIN NUMBER", "ISIN"]);
  const seriesIndex = index(["SERIES"]);

  return lines.slice(1).flatMap((line) => {
    const values = parseCsvLine(line);
    const name = nameIndex >= 0 ? values[nameIndex] : undefined;
    const symbol = symbolIndex >= 0 ? values[symbolIndex] : undefined;
    if (!name || !symbol) return [];

    return [{
      source: "NSE",
      symbol,
      isin: isinIndex >= 0 ? values[isinIndex] : null,
      name,
      securityType: seriesIndex >= 0 ? values[seriesIndex] : null,
      exchange: "NSE",
    } satisfies RawInstrumentRow];
  });
}
