const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TARGET_NEW = Number(process.env.NSE_SEED_COUNT || 500);
if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('Supabase credentials are required');

const H = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const uuid = () => crypto.randomUUID();

async function sb(path, options = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...options, headers: { ...H, ...(options.headers || {}) } });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
  const text = await r.text();
  return text.trim() ? JSON.parse(text) : null;
}

function csvRows(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (ch === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some(x => String(x).trim() !== '')) rows.push(row);
      row = [];
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); if (row.some(x => String(x).trim() !== '')) rows.push(row); }
  const headers = rows.shift().map(x => x.trim().toUpperCase());
  return rows.map(r => Object.fromEntries(headers.map((h, i) => [h, String(r[i] ?? '').trim()])));
}

async function nseCsv() {
  const base = 'https://www.nseindia.com/';
  const archive = 'https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv';
  const common = { 'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131 Safari/537.36', accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', referer: base };
  const home = await fetch(base, { headers: common });
  const cookies = home.headers.getSetCookie?.() || [];
  const cookie = cookies.map(x => String(x).split(';', 1)[0]).join('; ');
  const r = await fetch(archive, { headers: { ...common, accept: 'text/csv,text/plain,*/*', ...(cookie ? { cookie } : {}) } });
  if (!r.ok) throw new Error(`NSE security master ${r.status}`);
  return csvRows(await r.text());
}

function cleanRow(row) {
  const out = { ...row };
  for (const key of Object.keys(out)) if (key === 'ID' || key.endsWith('_ID') || key === 'CREATED_AT' || key === 'UPDATED_AT') delete out[key];
  return out;
}

function setIf(obj, keys, value) { for (const key of keys) if (Object.prototype.hasOwnProperty.call(obj, key)) { obj[key] = value; return true; } return false; }
function copyForInsert(sample) { return cleanRow(sample || {}); }

async function sample(table) {
  const rows = await sb(`${table}?limit=1`);
  if (!Array.isArray(rows) || !rows[0]) throw new Error(`No sample row available from ${table}`);
  return rows[0];
}

async function insert(table, row) {
  return sb(table, { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(row) });
}

async function main() {
  const stocks = await sb('rpc/gns_get_stock_snapshots', { method: 'POST', body: JSON.stringify({ p_limit: 5000 }) });
  const existing = new Set((stocks || []).map(x => String(x.nse_symbol || '').toUpperCase()).filter(Boolean));
  const universe = await nseCsv();
  const candidates = universe.filter(r => r.SYMBOL && r.ISIN && (!r.SERIES || r.SERIES === 'EQ') && !existing.has(r.SYMBOL.toUpperCase()));
  const selected = candidates.slice(0, TARGET_NEW);
  if (!selected.length) throw new Error('No new NSE equities selected');

  const companySample = await sample('market.companies');
  const instrumentSample = await sample('market.instruments');
  const listingSample = await sample('market.listings');
  let equitySample = null;
  try { equitySample = await sample('market.equity_profiles'); } catch { /* optional */ }
  let publicSample = null;
  try { publicSample = await sample('instruments'); } catch { /* optional */ }

  let created = 0, failed = 0;
  for (const r of selected) {
    const symbol = r.SYMBOL.toUpperCase();
    const name = r.NAME_OF_COMPANY || r.COMPANY_NAME || symbol;
    const instrumentId = uuid();
    const companyId = uuid();
    const listingId = uuid();
    try {
      const company = copyForInsert(companySample);
      setIf(company, ['company_id','id'], companyId);
      setIf(company, ['name','company_name','legal_name','display_name'], name);
      setIf(company, ['isin'], r.ISIN || null);
      await insert('market.companies', company);

      const instrument = copyForInsert(instrumentSample);
      setIf(instrument, ['instrument_id','id'], instrumentId);
      setIf(instrument, ['company_id'], companyId);
      setIf(instrument, ['name','instrument_name','display_name'], name);
      setIf(instrument, ['nse_symbol','symbol','trading_symbol'], symbol);
      setIf(instrument, ['isin'], r.ISIN || null);
      setIf(instrument, ['asset_type','instrument_type','security_type'], 'EQUITY');
      setIf(instrument, ['status'], 'ACTIVE');
      await insert('market.instruments', instrument);

      const listing = copyForInsert(listingSample);
      setIf(listing, ['nse_listing_id','listing_id','id'], listingId);
      setIf(listing, ['instrument_id'], instrumentId);
      setIf(listing, ['company_id'], companyId);
      setIf(listing, ['exchange','exchange_code'], 'NSE');
      setIf(listing, ['symbol','nse_symbol','trading_symbol'], symbol);
      setIf(listing, ['series'], r.SERIES || 'EQ');
      setIf(listing, ['isin'], r.ISIN || null);
      setIf(listing, ['is_active','active'], true);
      await insert('market.listings', listing);

      if (equitySample) {
        const profile = copyForInsert(equitySample);
        setIf(profile, ['instrument_id'], instrumentId);
        setIf(profile, ['company_id'], companyId);
        setIf(profile, ['shares_outstanding','free_float_shares'], null);
        await insert('market.equity_profiles', profile);
      }

      if (publicSample) {
        const mirror = copyForInsert(publicSample);
        setIf(mirror, ['id'], instrumentId);
        setIf(mirror, ['name','short_name'], name);
        setIf(mirror, ['nse_symbol'], symbol);
        setIf(mirror, ['isin'], r.ISIN || null);
        setIf(mirror, ['bse_code'], null);
        setIf(mirror, ['asset_type'], 'EQUITY');
        setIf(mirror, ['security_type'], 'EQUITY');
        setIf(mirror, ['exchange'], 'NSE');
        setIf(mirror, ['currency'], 'INR');
        setIf(mirror, ['status'], 'ACTIVE');
        setIf(mirror, ['slug'], `${symbol.toLowerCase()}-${instrumentId.slice(0, 8)}`);
        await insert('instruments', mirror);
        if (r.ISIN) await sb('instrument_identifiers', { method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' }, body: JSON.stringify({ instrument_id: instrumentId, identifier_type: 'ISIN', identifier_value: r.ISIN, is_current: true, source: 'NSE_PUBLIC' }) });
        await sb('instrument_identifiers', { method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' }, body: JSON.stringify({ instrument_id: instrumentId, identifier_type: 'NSE_SYMBOL', identifier_value: symbol, is_current: true, source: 'NSE_PUBLIC' }) });
      }
      created++;
      if (created % 25 === 0) console.log(`seeded ${created}/${selected.length}`);
    } catch (error) {
      failed++;
      console.error(`✗ ${symbol}: ${error.message}`);
    }
    await sleep(80);
  }
  console.log(JSON.stringify({ existing: existing.size, selected: selected.length, created, failed, target_new: TARGET_NEW }));
  if (created === 0) process.exit(1);
}
main().catch(error => { console.error(error); process.exit(1); });
