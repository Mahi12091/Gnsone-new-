# GNSOne Architecture

## Architectural direction

GNSOne follows a layered architecture so provider-specific market data logic does not leak into the UI or database layer.

```text
UI
  ↓
Route/API layer
  ↓
Service layer
  ↓
Repository/data-access layer
  ↓
Supabase/PostgreSQL
```

External data follows a separate ingestion path:

```text
External provider
  ↓
Provider adapter
  ↓
Normalizer
  ↓
Validator
  ↓
Persistence
  ↓
Derived analytics
  ↓
Cache/API
```

## Canonical instrument identity

V1 does not use PAN as an instrument identifier.

The internal identity is `instrument_id` (UUID). External identifiers such as ISIN, NSE symbol, and BSE code are mapped to the canonical instrument through an identifier layer. Historical identifier changes must be preserved rather than overwritten.

## Raw vs derived data

Raw provider values and calculated metrics must remain conceptually separate. Provider data should retain provenance such as source and retrieval time. Derived ratios and scores must be reproducible from stored inputs and versioned when the calculation methodology changes.

## Provider abstraction

External market-data providers must be accessed through provider interfaces/adapters. Application services must not call provider SDKs directly.

The intended shape is:

```text
MarketDataProvider
├── getQuote()
├── getHistoricalPrices()
├── getFundamentals()
├── getFinancials()
└── getCompanyProfile()
```

Provider implementations can be replaced without rewriting the application layer.

## Phase gates

A phase is not complete until:

- implementation is complete
- migrations are included where applicable
- types and validation are present
- error handling is covered
- tests pass
- lint passes
- type-check passes
- production build passes
- documentation is updated

## Security

- Real environment secrets are never committed.
- Service-role credentials are server-only.
- User-owned tables use Supabase Row Level Security.
- Cron endpoints require authentication.
- External input is validated before persistence or use.
