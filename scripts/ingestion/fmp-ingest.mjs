const URL = 'https://financialmodelingprep.com/stable';
const API_KEY = process.env.FMP_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!API_KEY) throw new Error('FMP_API_KEY is required');
if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Supabase credentials are required');

const H = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

async function fmp(path, params = {}) {
  const q = new URLSearchParams({ ...params });
  const r = await fetch(`${URL}/${path}?${q.toString()}`, { headers: { apikey: API_KEY } });
  const text = await r.text();
  if (!r.ok) throw new Error(`FMP ${r.status} ${path}: ${text.slice(0, 500)}`);
  if (!text.trim()) return null;
  let data;
  try { data = JSON.parse(text); } catch { throw new Error(`FMP invalid JSON ${path}: ${text.slice(0, 300)}`); }
  if (data?.Error || data?.error) throw new Error(`FMP ${path}: ${JSON.stringify(data).slice(0, 500)}`);
  return data;
}

async function sb(path, options = {}, schema = 'ingestion') {
  const headers = { ...H, ...(options.headers || {}), 'Content-Profile': schema, 'Accept-Profile': schema };
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...options, headers });
  const text = await r.text();
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${text.slice(0, 700)}`);
  if (!text.trim()) return null;
  return JSON.parse(text);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const sources = await sb('data_sources?code=eq.FMP&select=data_source_id', {}, 'ingestion');
  const sourceId = sources?.[0]?.data_source_id;
  if (!sourceId) throw new Error('FMP data source is not registered; run the migration first');

  const listings = await sb(
    'listings?select=listing_id,instrument_id,symbol,exchange_id&limit=5000',
    {},
    'market',
  );

  const exchanges = await sb('exchanges?select=exchange_id,code&limit=100', {}, 'reference');
  const exchangeMap = new Map((exchanges ?? []).map((x) => [x.exchange_id, x.code]));
  const stocks = (listings ?? []).filter((x) => exchangeMap.get(x.exchange_id) === 'NSE' && x.symbol);

  const job = await sb('ingestion_jobs', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      data_source_id: sourceId,
      job_type: 'FMP_ENRICHMENT',
      status: 'RUNNING',
      started_at: new Date().toISOString(),
      watermark_started_at: new Date().toISOString(),
      records_read: stocks.length,
      records_inserted: 0,
      records_updated: 0,
      records_failed: 0,
      metadata: { provider: 'FMP', mode: 'secondary_raw_cache' },
    }),
  }, 'ingestion');
  const jobId = job?.[0]?.ingestion_job_id;

  let read = 0, inserted = 0, failed = 0;

  for (const listing of stocks) {
    const symbol = listing.symbol;
    const requests = [
      ['profile', { symbol }, 'COMPANY_PROFILE'],
      ['quote', { symbol }, 'QUOTE'],
      ['key-metrics', { symbol, limit: '40' }, 'KEY_METRICS'],
      ['ratios', { symbol, limit: '40' }, 'RATIOS'],
      ['shares-float', { symbol }, 'SHARES_FLOAT'],
      ['income-statement', { symbol, period: 'annual', limit: '10' }, 'INCOME_STATEMENT'],
      ['balance-sheet-statement', { symbol, period: 'annual', limit: '10' }, 'BALANCE_SHEET'],
      ['cash-flow-statement', { symbol, period: 'annual', limit: '10' }, 'CASH_FLOW'],
      ['stock-peers', { symbol }, 'PEERS'],
      ['dividends', { symbol }, 'DIVIDENDS'],
      ['splits', { symbol }, 'SPLITS'],
    ];

    try {
      for (const [endpoint, params, entityType] of requests) {
        const payload = await fmp(endpoint, params);
        if (payload == null) continue;
        await sb('raw_payloads', {
          method: 'POST',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({
            ingestion_job_id: jobId,
            data_source_id: sourceId,
            entity_type: entityType,
            external_id: symbol,
            payload,
            observed_at: new Date().toISOString(),
          }),
        }, 'ingestion');
        inserted += 1;
        await sleep(75);
      }
      read += 1;
      console.log(`✓ ${symbol}`);
    } catch (error) {
      failed += 1;
      console.error(`✗ ${symbol}: ${error.message}`);
    }
  }

  await sb(`ingestion_jobs?ingestion_job_id=eq.${jobId}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      status: failed ? 'PARTIAL' : 'SUCCEEDED',
      completed_at: new Date().toISOString(),
      watermark_completed_at: new Date().toISOString(),
      records_read: read,
      records_inserted: inserted,
      records_failed: failed,
      metadata: { provider: 'FMP', mode: 'secondary_raw_cache', symbols: stocks.map((x) => x.symbol) },
    }),
  }, 'ingestion');

  console.log(JSON.stringify({ ok: failed === 0, symbols: stocks.length, succeeded: read, raw_payloads: inserted, failed }));
  if (failed) process.exitCode = 1;
}

main().catch((error) => { console.error(error); process.exit(1); });
