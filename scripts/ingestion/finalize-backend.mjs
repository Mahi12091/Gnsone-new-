const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) throw new Error('Supabase credentials are required');

const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const SOURCE_NSE = 'af52df14-53d8-4f77-adf7-2b9b28cce084';
const SOURCE_BSE = '29d1ee2e-f180-47a5-b7ec-0c2317484cd7';

async function sb(path, options = {}, schema = null) {
  const headers = { ...H, ...(options.headers || {}) };
  if (schema) {
    headers['Content-Profile'] = schema;
    headers['Accept-Profile'] = schema;
  }
  const r = await fetch(`${URL}/rest/v1/${path}`, { ...options, headers });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
  const text = await r.text();
  if (!text.trim()) return null;
  return JSON.parse(text);
}

async function main() {
  // Seed the canonical external-identifier types once.
  const identifierTypes = [
    ['ISIN', 'ISIN', 'International Securities Identification Number'],
    ['NSE_SYMBOL', 'NSE Symbol', 'Current NSE trading symbol'],
    ['BSE_CODE', 'BSE Code', 'Current BSE security code'],
  ];
  for (const [code, name, description] of identifierTypes) {
    await sb(`identifier_types?on_conflict=code`, {
      method: 'POST',
      headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' },
      body: JSON.stringify({ code, name, description }),
    }, 'reference');
  }

  const types = await sb('identifier_types?select=identifier_type_id,code', {}, 'reference');
  const typeId = Object.fromEntries((types ?? []).map((x) => [x.code, x.identifier_type_id]));
  if (!typeId.NSE_SYMBOL || !typeId.BSE_CODE) throw new Error('Canonical identifier types were not created');

  const listings = await sb('listings?select=listing_id,instrument_id,exchange_id,symbol,exchange_security_code,listing_date,source_id&limit=5000', {}, 'market');
  const exchanges = await sb('exchanges?select=exchange_id,code', {}, 'reference');
  const exchangeMap = new Map((exchanges ?? []).map((x) => [x.exchange_id, x.code]));

  let identifierCount = 0;
  let historyCount = 0;
  for (const listing of listings ?? []) {
    const exchange = exchangeMap.get(listing.exchange_id);
    const symbol = exchange === 'NSE' ? listing.symbol : listing.exchange_security_code;
    const identifierCode = exchange === 'NSE' ? 'NSE_SYMBOL' : 'BSE_CODE';
    const sourceId = exchange === 'NSE' ? SOURCE_NSE : SOURCE_BSE;
    if (symbol) {
      const existing = await sb(`instrument_identifiers?instrument_id=eq.${listing.instrument_id}&identifier_type_id=eq.${typeId[identifierCode]}&identifier_value=eq.${encodeURIComponent(symbol)}&is_current=eq.true&select=instrument_identifier_id`, {}, 'market');
      if (!existing?.length) {
        await sb('instrument_identifiers', {
          method: 'POST',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({ instrument_id: listing.instrument_id, identifier_type_id: typeId[identifierCode], identifier_value: symbol, valid_from: listing.listing_date ?? new Date().toISOString().slice(0, 10), is_current: true, source_id: sourceId }),
        }, 'market');
      }
      identifierCount += 1;

      const history = await sb(`listing_symbols_history?listing_id=eq.${listing.listing_id}&symbol=eq.${encodeURIComponent(listing.symbol || symbol)}&is_current=eq.true&select=listing_symbol_history_id`, {}, 'market');
      if (!history?.length && listing.symbol) {
        await sb('listing_symbols_history', {
          method: 'POST',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({ listing_id: listing.listing_id, symbol: listing.symbol, valid_from: listing.listing_date ?? new Date().toISOString().slice(0, 10), is_current: true, reason: 'INITIAL_CANONICAL_SYMBOL', source_id: sourceId }),
        }, 'market');
      }
      historyCount += 1;
    }
  }

  // Create a canonical all-equities screener snapshot from the latest published score/price layer.
  const latestSnapshots = await sb('rpc/gns_get_stock_snapshots', {
    method: 'POST',
    body: JSON.stringify({ p_limit: 5000 }),
  });
  const asOf = (latestSnapshots ?? []).map((x) => x.price_date).filter(Boolean).sort().at(-1) ?? new Date().toISOString().slice(0, 10);
  const existingScreener = await sb('screener_snapshots?code=eq.ALL_EQUITIES&select=screener_snapshot_id', {}, 'analytics');
  let snapshotId = existingScreener?.[0]?.screener_snapshot_id;
  if (!snapshotId) {
    const created = await sb('screener_snapshots', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ code: 'ALL_EQUITIES', name: 'All Equity Research Universe', description: 'Canonical snapshot of the published equity research universe.', criteria: { universe: 'equity', score: true, latest_price: true }, as_of_date: asOf }),
    }, 'analytics');
    snapshotId = created?.[0]?.screener_snapshot_id;
  }
  if (!snapshotId) throw new Error('Unable to create canonical screener snapshot');

  for (let i = 0; i < (latestSnapshots ?? []).length; i += 1) {
    const stock = latestSnapshots[i];
    const exists = await sb(`screener_snapshot_rows?screener_snapshot_id=eq.${snapshotId}&instrument_id=eq.${stock.instrument_id}&select=screener_snapshot_row_id`, {}, 'analytics');
    if (exists?.length) continue;
    await sb('screener_snapshot_rows', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ screener_snapshot_id: snapshotId, instrument_id: stock.instrument_id, rank: i + 1, metrics: { price: stock.latest_price, price_date: stock.price_date, gns_score: stock.score, nse_symbol: stock.nse_symbol } }),
    }, 'analytics');
  }

  const counts = {
    instruments: (await sb('instruments?select=instrument_id&limit=5000', {}, 'market'))?.length ?? 0,
    listings: (await sb('listings?select=listing_id&limit=5000', {}, 'market'))?.length ?? 0,
    identifiers: (await sb('instrument_identifiers?select=instrument_identifier_id&limit=10000', {}, 'market'))?.length ?? 0,
    symbol_history: (await sb('listing_symbols_history?select=listing_symbol_history_id&limit=10000', {}, 'market'))?.length ?? 0,
    screener_rows: (await sb('screener_snapshot_rows?select=screener_snapshot_row_id&limit=10000', {}, 'analytics'))?.length ?? 0,
  };
  console.log(JSON.stringify({ ok: true, counts, identifier_writes: identifierCount, history_writes: historyCount, as_of: asOf }));
  if (counts.instruments > 0 && counts.identifiers === 0) process.exit(1);
}

main().catch((error) => { console.error(error); process.exit(1); });
