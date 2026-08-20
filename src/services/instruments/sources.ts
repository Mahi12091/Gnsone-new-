export type InstrumentSource = "NSE" | "BSE";

export type SourceDefinition = {
  source: InstrumentSource;
  landingPage: string;
  description: string;
};

/** Official source pages are intentionally kept as configuration rather than
 * hard-coded download endpoints because exchange download URLs can change. */
export const INSTRUMENT_SOURCES: Record<InstrumentSource, SourceDefinition> = {
  NSE: {
    source: "NSE",
    landingPage: "https://www.nseindia.com/static/market-data/securities-available-for-trading",
    description: "NSE securities available for trading; includes equity, SME, ETF and change files.",
  },
  BSE: {
    source: "BSE",
    landingPage: "https://www.bseindia.com/",
    description: "BSE official market data and standardized security-master sources.",
  },
};

export function sourceDefinition(source: InstrumentSource): SourceDefinition {
  return INSTRUMENT_SOURCES[source];
}
