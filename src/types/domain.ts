export type AssetType =
  | "EQUITY"
  | "ETF"
  | "MUTUAL_FUND"
  | "BOND"
  | "COMMODITY"
  | "INDEX";

export type Exchange = "NSE" | "BSE" | "OTHER";

export type InstrumentStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export type IdentifierType = "ISIN" | "NSE_SYMBOL" | "BSE_CODE";

export type FinancialPeriodType = "FY" | "Q1" | "Q2" | "Q3" | "Q4" | "TTM";

export interface InstrumentIdentity {
  id: string;
  name: string;
  shortName: string | null;
  slug: string;
  isin: string | null;
  nseSymbol: string | null;
  bseCode: string | null;
  exchange: Exchange | null;
  assetType: AssetType;
  status: InstrumentStatus;
}

export interface InstrumentIdentifier {
  id: string;
  instrumentId: string;
  identifierType: IdentifierType;
  identifierValue: string;
  validFrom: string | null;
  validTo: string | null;
  isCurrent: boolean;
}

export interface FinancialPeriod {
  id: string;
  instrumentId: string;
  periodType: FinancialPeriodType;
  fiscalYear: number;
  periodStart: string;
  periodEnd: string;
  filingDate: string | null;
}
