-- Production security hardening for exposed legacy read tables.
-- The ingestion/private schemas remain unexposed and intentionally have no client policies.

create policy "Public can read financial ratios"
on public.financial_ratios
for select
to anon, authenticated
using (true);

create policy "Public can read financial statements"
on public.financial_statements
for select
to anon, authenticated
using (true);

create policy "Public can read price snapshots"
on public.price_snapshots
for select
to anon, authenticated
using (true);

create policy "Public can read shareholding snapshots"
on public.shareholding_snapshots
for select
to anon, authenticated
using (true);

create policy "Public can read valuation snapshots"
on public.valuation_snapshots
for select
to anon, authenticated
using (true);

-- Keep pg_trgm out of the exposed public schema while preserving existing indexes.
create schema if not exists extensions;
alter extension pg_trgm set schema extensions;
