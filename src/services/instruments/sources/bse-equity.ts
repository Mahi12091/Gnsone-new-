import type { RawInstrumentRow } from "../normalizer";

export type BseMasterColumnMap = {
  scripCode: string;
  instrumentCode: string;
  scripName: string;
  isinCode: string;
  securityTypeFlag?: string;
};

function normalizeHeader(value: string): string {
  return value.replace(/^\uFEFF/, "").trim().toUpperCase().replace(/\s+/g, " ");
}

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

export function parseBseEquityCsv(csv: string): RawInstrumentRow[] {
  const lines = csv.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  const find = (names: string[]) => names.map((name) => headers.indexOf(normalizeHeader(name))).find((index) => index >= 0) ?? -1;
  const scripCodeIndex = find(["SCRIP CODE"]);
  const instrumentCodeIndex = find(["INSTRUMENT CODE"]);
  const scripNameIndex = find(["SCRIP NAME"]);
  const isinIndex = find(["ISIN CODE", "ISIN"]);
  const securityTypeIndex = find(["SECURITY TYPE FLAG"]);

  if (scripCodeIndex < 0 || scripNameIndex < 0) return [];

  return lines.slice(1).flatMap((line) => {
    const values = parseCsvLine(line);
    const name = values[scripNameIndex];
    const code = values[scripCodeIndex];
    if (!name || !code) return [];

    return [{
      source: "BSE",
      symbol: instrumentCodeIndex >= 0 ? values[instrumentCodeIndex] : null,
      scripCode: code,
      isin: isinIndex >= 0 ? values[isinIndex] : null,
      name,
      securityType: securityTypeIndex >= 0 ? values[securityTypeIndex] : null,
      exchange: "BSE",
    } satisfies RawInstrumentRow];
  });
}
