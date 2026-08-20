const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('Supabase credentials are required');

const SB_HEADERS = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' };
const YAHOO_SOURCE = '26796bee-44b1-491e-a6b0-7a527b3a67da';
const NSE_SOURCE = 'af52df14-53d8-4f77-adf7-2b9b28cce084';
const INR = '44e5f887-39f2-4369-9b00-6ac0050311e6';

async function sb(path, options = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...options, headers: { ...SB_HEADERS, ...(options.headers || {}) } });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
  return r.status === 204 ? null : r.json();
}
async function nse(path) {
  const r = await fetch(`https://www.nseindia.com${path}`, { headers: { accept: 'application/json,text/plain,*/*', 'user-agent': 'Mozilla/5.0 GNSOne/1.0', referer: 'https://www.nseindia.com/' } });
  if (!r.ok) throw new Error(`NSE ${r.status}`);
  return r.json();
}
async function yahoo(symbol) {
  const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${Math.floor(Date.now()/1000)-157680000}&period2=${Math.floor(Date.now()/1000)}&interval=1d&events=div%2Csplits`, { headers: { 'user-agent': 'GNSOne/1.0 research-ingestion' } });
  if (!r.ok) throw new Error(`Yahoo ${r.status}`);
  return r.json();
}
const date = v => { if (v == null || v === '') return null; const d = new Date(typeof v === 'number' ? (v < 1e12 ? v * 1000 : v) : v); return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0,10); };
const number = v => { const n = Number(String(v ?? '').replace(/,/g,'')); return Number.isFinite(n) ? n : null; };
const norm = v => String(v ?? '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g,'');

async function ingestYahooActions(stock) {
  const chart = await yahoo(`${stock.nse_symbol}.NS`);
  const events = chart?.chart?.result?.[0]?.events || {};
  for (const [ts, item] of Object.entries(events.dividends || {})) {
    const ex = date(Number(ts)); const amount = number(item?.amount);
    if (!ex || amount == null) continue;
    await sb('market.dividends', { method:'POST', headers:{ Prefer:'resolution=ignore-duplicates,return=minimal' }, body:JSON.stringify({ instrument_id:stock.instrument_id, ex_date:ex, amount_per_share:amount, dividend_type:'CASH', currency_id:INR, source_id:YAHOO_SOURCE }) });
  }
  const splitType = (await sb('reference.corporate_action_types?code=eq.SPLIT&select=corporate_action_type_id'))[0]?.corporate_action_type_id;
  if (splitType) for (const [ts, item] of Object.entries(events.splits || {})) {
    const ex = date(Number(ts)); const split = String(item?.numerator ?? ''); const [n,d] = split.split(':').map(Number);
    if (!ex || !Number.isFinite(n) || !Number.isFinite(d)) continue;
    await sb('market.corporate_actions', { method:'POST', headers:{ Prefer:'resolution=ignore-duplicates,return=minimal' }, body:JSON.stringify({ instrument_id:stock.instrument_id, corporate_action_type_id:splitType, ex_date:ex, effective_date:ex, ratio_numerator:n, ratio_denominator:d, description:`Yahoo Finance split ${n}:${d}`, source_id:YAHOO_SOURCE, currency_id:INR }) });
  }
}

async function ingestNseShareholding(stock, categories) {
  let payload;
  try { payload = await nse(`/api/corporate-share-holdings-master?index=equities&symbol=${encodeURIComponent(stock.nse_symbol)}`); }
  catch { return false; }
  const rows = Array.isArray(payload) ? payload : (payload?.data || payload?.shareholding || payload?.result || []);
  if (!rows.length) return false;
  const latest = rows.at(-1);
  const periodEnd = date(latest?.date ?? latest?.periodEndDate ?? latest?.period_end_date ?? latest?.quarterEndDate);
  if (!periodEnd) return false;
  const existing = await sb(`market.shareholding_periods?company_id=eq.${stock.company_id}&period_end_date=eq.${periodEnd}&period_type=eq.QUARTERLY&source_id=eq.${NSE_SOURCE}&select=shareholding_period_id`);
  let periodId = existing[0]?.shareholding_period_id;
  if (!periodId) {
    const inserted = await sb('market.shareholding_periods', { method:'POST', headers:{ Prefer:'return=representation' }, body:JSON.stringify({ company_id:stock.company_id, period_end_date:periodEnd, period_type:'QUARTERLY', filing_date:date(latest?.filingDate), source_id:NSE_SOURCE }) });
    periodId = inserted[0]?.shareholding_period_id;
  }
  if (!periodId) return false;
  const aliases = { PROMOTER:'PROMOTER', FII:'FII', FOREIGN:'FII', DII:'DII', DOMESTIC_INSTITUTION:'DII', PUBLIC:'PUBLIC', RETAIL:'RETAIL', GOVERNMENT:'GOVERNMENT' };
  for (const row of rows) {
    const raw = norm(row?.category ?? row?.categoryName ?? row?.shareholderCategory ?? row?.type);
    const match = Object.keys(aliases).find(k => raw === k || raw.includes(k));
    const categoryId = match ? categories[aliases[match]] : null;
    const pct = number(row?.percentage ?? row?.percentageHolding ?? row?.percentShareholding ?? row?.shareholdingPercentage);
    const shares = number(row?.shares ?? row?.sharesHeld ?? row?.noOfShares);
    if (!categoryId || (pct == null && shares == null)) continue;
    await sb('market.shareholding_values', { method:'POST', headers:{ Prefer:'resolution=merge-duplicates,return=minimal' }, body:JSON.stringify({ shareholding_period_id:periodId, shareholding_category_id:categoryId, shares_held:shares, percentage_held:pct, source_id:NSE_SOURCE }) });
  }
  return true;
}

async function ingestPeers(stocks) {
  const companies = await sb('market.companies?select=company_id,industry_id,sector_id');
  const meta = new Map(companies.map(c => [c.company_id, c]));
  const groups = new Map();
  for (const s of stocks) {
    const c = meta.get(s.company_id); const key = c?.industry_id || c?.sector_id;
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  }
  for (const members of groups.values()) {
    for (const company of members) for (const peer of members) {
      if (company.company_id === peer.company_id) continue;
      await sb('market.company_peers', { method:'POST', headers:{ Prefer:'resolution=ignore-duplicates,return=minimal' }, body:JSON.stringify({ company_id:company.company_id, peer_company_id:peer.company_id, relationship_type:'INDUSTRY_PEER', source_id:YAHOO_SOURCE }) });
    }
  }
}

async function main() {
  const stocks = await sb('rpc/gns_get_stock_snapshots', { method:'POST', body:JSON.stringify({ p_limit:5000 }) });
  const categoryRows = await sb('market.shareholding_categories?select=shareholding_category_id,code');
  const categories = Object.fromEntries(categoryRows.map(x => [x.code, x.shareholding_category_id]));
  let actions=0, holdings=0;
  for (const stock of stocks) {
    try { await ingestYahooActions(stock); actions++; } catch (e) { console.error(`actions ${stock.nse_symbol}: ${e.message}`); }
    try { if (await ingestNseShareholding(stock, categories)) holdings++; } catch (e) { console.error(`holdings ${stock.nse_symbol}: ${e.message}`); }
  }
  await ingestPeers(stocks);
  console.log(JSON.stringify({ instruments:stocks.length, action_symbols:actions, shareholding_symbols:holdings, peer_mode:'industry-derived', shareholding_source:'NSE_PUBLIC' }));
}
main().catch(e => { console.error(e); process.exit(1); });
