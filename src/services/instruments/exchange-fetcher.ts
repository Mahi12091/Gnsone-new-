import { getExchangeSource, type ExchangeMasterSource } from "./exchange-sources";

export type ExchangeDownload = {
  source: ExchangeMasterSource;
  url: string;
  content: string;
  retrievedAt: string;
};

export async function fetchExchangeMaster(
  source: ExchangeMasterSource,
  fetchImpl: typeof fetch = fetch,
): Promise<ExchangeDownload> {
  const config = getExchangeSource(source);
  const response = await fetchImpl(config.url, {
    headers: {
      Accept: "text/csv,text/plain,application/json;q=0.9,*/*;q=0.8",
      "User-Agent": "GNSOne/1.0 (+market-data-ingestion)",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Exchange master download failed (${source}): HTTP ${response.status}`);
  }

  const content = await response.text();
  if (!content.trim()) {
    throw new Error(`Exchange master download returned empty content (${source})`);
  }

  return {
    source,
    url: config.url,
    content,
    retrievedAt: new Date().toISOString(),
  };
}
