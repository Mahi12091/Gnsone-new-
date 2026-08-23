import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Missing Supabase environment variables');
const sb = createClient(url, key, { auth: { persistSession: false } });

// Only query schemas exposed through PostgREST. The analytics schema is
// intentionally unexposed; it is verified separately through direct DB checks.
const checks = [
  ['market.instruments', 'market', 'instruments'],
  ['market.listings', 'market', 'listings'],
  ['market.instrument_identifiers', 'market', 'instrument_identifiers'],
  ['market.listing_symbols_history', 'market', 'listing_symbols_history'],
  ['market.company_peers', 'market', 'company_peers'],
  ['market.shareholding_values', 'market', 'shareholding_values'],
  ['market.corporate_actions', 'market', 'corporate_actions'],
  ['market.dividends', 'market', 'dividends'],
  ['market.historical_prices', 'market', 'historical_prices'],
  ['financials.fiscal_periods', 'financials', 'fiscal_periods'],
  ['financials.financial_statements', 'financials', 'financial_statements'],
  ['financials.financial_statement_values', 'financials', 'financial_statement_values'],
];

const rows = [];
for (const [name, schema, table] of checks) {
  const { count, error } = await sb.from(`${schema}.${table}`).select('*', { count: 'exact', head: true });
  rows.push({ table: name, count: count ?? 0, error: error?.message ?? null });
}
console.table(rows);
const blocking = rows.filter(r => r.error || r.count === 0);
console.log(JSON.stringify({ ok: blocking.length === 0, blocking, analytics: 'verified separately; schema intentionally unexposed' }, null, 2));
if (blocking.length) process.exitCode = 1;
