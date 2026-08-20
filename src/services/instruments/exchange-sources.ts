export type ExchangeMasterSource = "NSE" | "BSE";

export type ExchangeSourceConfig = {
  source: ExchangeMasterSource;
  url: string;
  contentType: "CSV" | "TEXT";
};

/**
 * Exchange endpoints are configuration, not identity logic. Keep the parser
 * and resolver independent so URLs can be rotated without changing the data model.
 */
export const EXCHANGE_MASTER_SOURCES: Record<ExchangeMasterSource, ExchangeSourceConfig> = {
  NSE: {
    source: "NSE",
    url: "https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv",
    contentType: "CSV",
  },
  BSE: {
    source: "BSE",
    url: "https://api.bseindia.com/BseIndiaAPI/api/ListofScripData/w",
    contentType: "TEXT",
  },
};

export function getExchangeSource(source: ExchangeMasterSource): ExchangeSourceConfig {
  return EXCHANGE_MASTER_SOURCES[source];
}
