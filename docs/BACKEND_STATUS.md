# GNSOne Backend Status

## Production backend contract

- Canonical identity: `market.instruments.instrument_id`.
- Exchange identifiers are identifiers/listings; PAN is not a V1 identity key.
- Normalized schemas: `market`, `financials`, `analytics`, `ingestion`, `reference`.
- Browser roles are read-only on normalized product data through RLS.
- Ingestion internals are backend-owned; browser roles have no policies on `ingestion` tables.
- Service-role/server-side jobs bypass RLS for ingestion and maintenance.

## Database layers

- `market`: companies, instruments, listings, identifiers, price history, corporate actions, dividends, shareholding.
- `financials`: filings, fiscal periods, statements, statement values, fundamentals, ratios, valuation snapshots.
- `analytics`: technical indicators, GNS score models/values, screener snapshots.
- `ingestion`: sources, jobs, raw payloads, lineage, quality, freshness.
- `reference`: exchanges, identifiers, sectors/industries, accounting and financial metadata.

## Remaining data work

Schema and security are not the same as populated production data. The remaining backend work is provider ingestion and derived-data computation: complete NSE/BSE universe population, market history, fundamentals, financial statements, shareholding, corporate actions, valuation metrics, technical indicators, GNS scores, screener snapshots, freshness checks, and scheduled jobs.
