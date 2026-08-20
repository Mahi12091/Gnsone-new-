# GNSOne

GNSOne is an investor research and market intelligence platform for Indian financial markets.

## Phase 0 — Foundation

This repository is being built incrementally with a clean, modular architecture.

### Principles

- TypeScript-first
- Next.js App Router
- Supabase/PostgreSQL as the initial data platform
- Provider-agnostic market data integrations
- Strict separation between raw data, derived analytics, services, repositories, and UI
- No PAN-based identity strategy in V1
- `instrument_id` is the internal canonical identity
- ISIN, NSE symbol, and BSE code are external identifiers
- Secrets are server-side only
- Database changes are migration-driven
- Every phase must pass lint, type-check, tests, and production build before the next phase

## Planned modules

- Stocks
- Market data
- Fundamentals and financial statements
- Valuation and ratios
- Technical analytics
- GNS Score
- Screener
- Compare
- Watchlist
- Portfolio
- Alerts
- News and corporate actions
- Target-price models
- AI research assistant
- Admin and data-quality monitoring

## Development phases

0. Foundation
1. Database foundation
2. Instrument master
3. Market data engine
4. Fundamentals and financials
5. Derived analytics
6. GNS Score
7. Stock research UI
8. Screener
9. User features
10. News and corporate actions
11. Target-price engine
12. AI research
13. Admin and monitoring
14. SEO and performance
15. Security and testing
16. Production deployment
