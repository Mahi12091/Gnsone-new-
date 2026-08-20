# GNSOne Database Foundation

## Phase 1 scope

Phase 1 establishes the canonical identity and classification layer only:

- `sectors`
- `industries`
- `sub_industries`
- `instruments`
- `instrument_identifiers`
- `financial_periods`

Market prices, financial statements, fundamentals, shareholding, news and derived analytics are intentionally deferred to later migrations.

## Identity model

`instruments.id` is the internal canonical `instrument_id` UUID.

External identifiers are stored in `instrument_identifiers`:

- ISIN
- NSE symbol
- BSE code

PAN is not part of the V1 identity strategy.

Historical identifiers are represented with `valid_from`, `valid_to` and `is_current`; existing history must not be overwritten when a symbol changes.

## Data ownership

The public application may read research/reference data through Supabase RLS. Writes are intended to happen through trusted server-side ingestion services in later phases.

## Migration rule

Every schema change must be committed as a new timestamped SQL migration. Existing migrations must not be rewritten after they have been applied to a shared database.
