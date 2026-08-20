# Supabase

Supabase migrations for GNSOne live under `supabase/migrations`.

## Rules

1. Apply migrations in timestamp order.
2. Do not edit an already-applied migration; create a new migration for changes.
3. Never commit real Supabase credentials.
4. Keep provider-specific ingestion logic out of database migrations.
5. Keep raw provider data separate from derived analytics tables.

The initial migration creates the canonical instrument/classification layer. Later phases will add market data, fundamentals, financial statements, shareholding, news, analytics and user-owned tables.