import type { ExchangeMasterRow } from "../exchange-master";

export type ExchangeSource = "NSE" | "BSE";

export type ExchangeSourceAdapter = {
  source: ExchangeSource;
  parse: (payload: string) => ExchangeMasterRow[];
};

function parseCsv(payload: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < payload.length; i += 1) {
    const char = payload[i];
    const next = payload[i + 1];
    if (char === '"') {
      if (quoted && next === '"') {
        cell += '"';
        i += 1;
      } else quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      cell = "";
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
    } else cell += char;
  }
  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

function indexHeaders(headers: string[]): Map<string, number> {
  return new Map(headers.map((header, index) => [header.trim().toUpperCase().replace(/[^A-Z0-9]/g, ""), index]));
}

function value(row: string[], headers: Map<string, number>, ...names: string[]): string | undefined {
  for (const name of names) {
    const index = headers.get(name);
    if (index !== undefined) return row[index]?.trim() || undefined;
  }
  return undefined;
}

function parseMaster(payload: string, source: ExchangeSource): ExchangeMasterRow[] {
  const records = parseCsv(payload);
  if (records.length < 2) return [];
  const headers = indexHeaders(records[0]);

  return records.slice(1).map((row) => ({
    source,
    name: value(row, headers, "NAME", "SCRIPNAME", "SECURITYNAME") ?? "",
    isin: value(row, headers, "ISIN", "ISINNUMBER"),
    nseSymbol: source === "NSE" ? value(row, headers, "SYMBOL", "NSESYMBOL") : undefined,
    bseCode: source === "BSE" ? value(row, headers, "SCRIPCODE", "SCRIPCODE" ) : undefined,
    series: value(row, headers, "SERIES"),
    securityType: value(row, headers, "SECURITYTYPE", "INSTRUMENTTYPE"),
  }));
}

export const nseMasterAdapter: ExchangeSourceAdapter = {
  source: "NSE",
  parse: (payload) => parseMaster(payload, "NSE"),
};

export const bseMasterAdapter: ExchangeSourceAdapter = {
  source: "BSE",
  parse: (payload) => parseMaster(payload, "BSE"),
};

export function getExchangeSourceAdapter(source: ExchangeSource): ExchangeSourceAdapter {
  return source === "NSE" ? nseMasterAdapter : bseMasterAdapter;
}
