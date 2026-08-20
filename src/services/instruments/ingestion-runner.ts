import { INSTRUMENT_SOURCES, type InstrumentSource } from "./sources";

export type DownloadedSource = {
  source: InstrumentSource;
  retrievedAt: string;
  content: string;
  sourceVersion?: string;
};

export type InstrumentSourceFetcher = (source: InstrumentSource) => Promise<DownloadedSource>;

/**
 * Provider-neutral ingestion coordinator. The actual HTTP/download adapter is
 * injected so exchange-specific anti-bot, headers, storage and URL discovery
 * concerns never leak into the identity pipeline.
 */
export async function fetchInstrumentSources(
  sources: InstrumentSource[],
  fetcher: InstrumentSourceFetcher,
): Promise<DownloadedSource[]> {
  const results: DownloadedSource[] = [];

  for (const source of sources) {
    const definition = INSTRUMENT_SOURCES[source];
    if (!definition) throw new Error(`Unsupported instrument source: ${source}`);
    results.push(await fetcher(source));
  }

  return results;
}
