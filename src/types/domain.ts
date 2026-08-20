export type AssetType =
  | "EQUITY"
  | "ETF"
  | "MUTUAL_FUND"
  | "BOND"
  | "COMMODITY"
  | "INDEX";

export type Exchange = "NSE" | "BSE" | "OTHER";

export interface InstrumentIdentity {
  id: string;
  name: string;
  isin: string | null;
  nseSymbol: string | null;
  bseCode: string | null;
  exchange: Exchange | null;
  assetType: AssetType;
}
