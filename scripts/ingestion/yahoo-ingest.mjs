const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const HISTORY_DAYS = Number(process.env.INGEST_HISTORY_DAYS || 1825);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');

const headers = { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' };
const yahoo = async (url) => { const response = await fetch(url, { headers: { 'User-Agent': 'GNSOne/1.0 research-ingestion' } }); if (!response.ok) throw new Error(`Yahoo ${response.status}: ${url}`); return response.json(); };
const supabaseRpc = async (fn, body) => { const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, { method: 'POST', headers, body: JSON.stringify(body) }); if (!response.ok) throw new Error(`Supabase RPC ${response.status}: ${await response.text()}`); return response.json(); };
const num = (value) => Number.isFinite(Number(value)) ? Number(value) : null;
const clamp = (v, min = 0, max = 100) => Math.max(min, Math.min(max, Number.isFinite(v) ? v : 0));
const avg = (xs) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
const sma = (xs, n) => xs.length >= n ? avg(xs.slice(-n)) : null;
const ema = (xs, n) => { if (xs.length < n) return null; const k = 2 / (n + 1); let e = avg(xs.slice(0, n)); for (const x of xs.slice(n)) e = x * k + e * (1 - k); return e; };
const rsi = (xs, n = 14) => { if (xs.length <= n) return null; let gains = 0, losses = 0; for (let i = xs.length - n; i < xs.length; i++) { const d = xs[i] - xs[i - 1]; if (d > 0) gains += d; else losses -= d; } if (losses === 0) return 100; const rs = (gains / n) / (losses / n); return 100 - 100 / (1 + rs); };
const stddev = (xs) => { if (!xs.length) return null; const m = avg(xs); return Math.sqrt(avg(xs.map(x => (x - m) ** 2))); };
const growth = (current, previous) => current != null && previous != null && previous !== 0 ? ((current / previous) - 1) * 100 : null;
const scorePositive = (v, low, high) => v == null ? null : clamp(((v - low) / (high - low)) * 100);
const scoreInverse = (v, good, bad) => v == null ? null : clamp(((bad - v) / (bad - good)) * 100);

// Yahoo's fundamentals-timeseries endpoint has returned both Unix seconds and ISO date strings
// over time. Never feed an invalid Date into toISOString(); one malformed filing must not abort
// the complete 50-company ingestion run.
function safeDate(value) {
  if (value == null) return null;
  let date;
  if (typeof value === 'number' || /^\d+(\.\d+)?$/.test(String(value))) {
    const n = Number(value);
    date = new Date(n < 100000000000 ? n * 1000 : n);
  } else {
    date = new Date(String(value));
  }
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function extractTimeseries(json) {
  const result = json?.timeseries?.result || [];
  const map = {};
  for (const series of result) {
    const key = Object.keys(series).find(k => k.startsWith('annual') || k.startsWith('quarterly'));
    if (!key) continue;
    map[series.meta?.type?.[0] || series.type?.[0] || key] = series[key];
    map[key] = series[key];
  }
  return map;
}

function valuesByType(map, type) {
  const rows = map[type] || map[`annual${type}`] || [];
  return rows.map(x => ({
    date: safeDate(x.asOfDate ?? x.periodEndDate ?? x.endDate),
    value: num(x.reportedValue?.raw ?? x.reportedValue)
  })).filter(x => x.date && x.value != null).sort((a, b) => a.date.localeCompare(b.date));
}

async function ingestStock(stock) {
  const symbol = stock.nse_symbol;
  if (!symbol || !stock.nse_listing_id) return { skipped: true, reason: 'no NSE listing' };
  const yahooSymbol = `${symbol}.NS`;
  const now = Math.floor(Date.now() / 1000);
  const start = now - HISTORY_DAYS * 86400;
  const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?period1=${start}&period2=${now}&interval=1d&events=div%2Csplits&includeAdjustedClose=true`;
  const fundamentalsUrl = `https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/${encodeURIComponent(yahooSymbol)}?type=annualTotalRevenue,annualOperatingIncome,annualNetIncome,annualEBITDA,annualTotalAssets,annualTotalLiabilitiesNetMinorityInterest,annualStockholdersEquity,annualTotalDebt,annualCashCashEquivalentsAndShortTermInvestments,annualFreeCashFlow,annualOperatingCashFlow,annualCapitalExpenditure,annualDilutedEPS,annualDilutedAverageShares&period1=${start}&period2=${now}`;

  const [chart, fundamentalsJson] = await Promise.all([yahoo(chartUrl), yahoo(fundamentalsUrl)]);
  const meta = chart?.chart?.result?.[0]?.meta || {};
  const timestamps = chart?.chart?.result?.[0]?.timestamp || [];
  const q = chart?.chart?.result?.[0]?.indicators?.quote?.[0] || {};
  const adj = chart?.chart?.result?.[0]?.indicators?.adjclose?.[0]?.adjclose || [];
  const prices = timestamps.map((ts, i) => ({ date: safeDate(ts), open: num(q.open?.[i]), high: num(q.high?.[i]), low: num(q.low?.[i]), close: num(q.close?.[i]), adj_close: num(adj[i] ?? q.close?.[i]), volume: num(q.volume?.[i]) })).filter(x => x.date && x.close != null);
  if (!prices.length) throw new Error(`No price history returned for ${yahooSymbol}`);
  const closes = prices.map(x => x.close);
  const latest = closes.at(-1);
  const asOf = prices.at(-1).date;

  const ts = extractTimeseries(fundamentalsJson);
  const series = {
    revenue: valuesByType(ts, 'annualTotalRevenue'), operatingIncome: valuesByType(ts, 'annualOperatingIncome'), netIncome: valuesByType(ts, 'annualNetIncome'), ebitda: valuesByType(ts, 'annualEBITDA'), assets: valuesByType(ts, 'annualTotalAssets'), liabilities: valuesByType(ts, 'annualTotalLiabilitiesNetMinorityInterest'), equity: valuesByType(ts, 'annualStockholdersEquity'), debt: valuesByType(ts, 'annualTotalDebt'), cash: valuesByType(ts, 'annualCashCashEquivalentsAndShortTermInvestments'), fcf: valuesByType(ts, 'annualFreeCashFlow'), cfo: valuesByType(ts, 'annualOperatingCashFlow'), capex: valuesByType(ts, 'annualCapitalExpenditure'), eps: valuesByType(ts, 'annualDilutedEPS'), shares: valuesByType(ts, 'annualDilutedAverageShares')
  };
  const latestOf = (arr) => arr.at(-1)?.value ?? null;
  const prevOf = (arr) => arr.at(-2)?.value ?? null;
  const latestRevenue = latestOf(series.revenue), latestProfit = latestOf(series.netIncome), latestEquity = latestOf(series.equity), latestAssets = latestOf(series.assets), latestDebt = latestOf(series.debt), latestCash = latestOf(series.cash), latestEbitda = latestOf(series.ebitda), latestEps = latestOf(series.eps), shares = latestOf(series.shares);
  const pe = latestEps && latestEps > 0 ? latest / latestEps : null;
  const marketCap = shares ? latest * shares : null;
  const pb = marketCap && latestEquity ? marketCap / latestEquity : null;
  const ps = marketCap && latestRevenue ? marketCap / latestRevenue : null;
  const ev = marketCap != null ? marketCap + (latestDebt || 0) - (latestCash || 0) : null;
  const evEbitda = ev != null && latestEbitda > 0 ? ev / latestEbitda : null;
  const roe = latestProfit != null && latestEquity ? latestProfit / latestEquity * 100 : null;
  const roa = latestProfit != null && latestAssets ? latestProfit / latestAssets * 100 : null;
  const debtEquity = latestDebt != null && latestEquity ? latestDebt / latestEquity : null;
  const netMargin = latestProfit != null && latestRevenue ? latestProfit / latestRevenue * 100 : null;
  const ebitdaMargin = latestEbitda != null && latestRevenue ? latestEbitda / latestRevenue * 100 : null;
  const revenueGrowth = growth(latestRevenue, prevOf(series.revenue));
  const profitGrowth = growth(latestProfit, prevOf(series.netIncome));
  const epsGrowth = growth(latestEps, prevOf(series.eps));
  const returns = closes.slice(-252).map((x, i, a) => i ? x / a[i - 1] - 1 : 0).slice(1);
  const volatility = stddev(returns) != null ? stddev(returns) * Math.sqrt(252) * 100 : null;
  const oneYearReturn = closes.length > 252 ? growth(latest, closes.at(-253)) : null;
  const sma20 = sma(closes, 20), sma50 = sma(closes, 50), sma200 = sma(closes, 200), ema20 = ema(closes, 20), rsi14 = rsi(closes, 14), macd = ema(closes, 12) != null && ema(closes, 26) != null ? ema(closes, 12) - ema(closes, 26) : null;

  const quality = avg([scorePositive(roe, 5, 25), scorePositive(roa, 2, 12), scoreInverse(debtEquity, 0.2, 2), scorePositive(netMargin, 5, 25)].filter(x => x != null));
  const growthScore = avg([scorePositive(revenueGrowth, 0, 25), scorePositive(profitGrowth, 0, 30), scorePositive(epsGrowth, 0, 30)].filter(x => x != null));
  const valuation = avg([scoreInverse(pe, 10, 50), scoreInverse(pb, 1, 8), scoreInverse(evEbitda, 8, 35)].filter(x => x != null));
  const momentum = avg([scorePositive(oneYearReturn, -20, 40), latest > (sma200 || latest) ? 70 : 30, rsi14 == null ? null : scorePositive(rsi14, 30, 70)].filter(x => x != null));
  const risk = avg([scoreInverse(volatility, 15, 60), scoreInverse(debtEquity, 0.2, 2)].filter(x => x != null));
  const overall = avg([quality, growthScore, valuation, momentum, risk].filter(x => x != null));

  const periods = [...new Set([...series.revenue, ...series.netIncome, ...series.equity, ...series.assets].map(x => x.date))].map(end_date => ({ period_type: 'ANNUAL', start_date: `${Number(end_date.slice(0, 4)) - 1}-04-01`, end_date, fiscal_year: Number(end_date.slice(0, 4)), fiscal_quarter: null }));
  const fundamentals = [];
  const addFund = (code, arr) => { for (const row of arr.slice(-5)) fundamentals.push({ code, value: row.value, period_type: 'ANNUAL', period_end: row.date }); };
  addFund('REVENUE', series.revenue); addFund('OPERATING_INCOME', series.operatingIncome); addFund('NET_INCOME', series.netIncome); addFund('EBITDA', series.ebitda); addFund('TOTAL_ASSETS', series.assets); addFund('TOTAL_LIABILITIES', series.liabilities); addFund('EQUITY', series.equity); addFund('TOTAL_DEBT', series.debt); addFund('CASH', series.cash); addFund('FREE_CASH_FLOW', series.fcf); addFund('OPERATING_CASH_FLOW', series.cfo); addFund('CAPEX', series.capex); addFund('DILUTED_EPS', series.eps); addFund('DILUTED_AVERAGE_SHARES', series.shares);
  const ratios = [['ROE', roe], ['ROA', roa], ['DEBT_TO_EQUITY', debtEquity], ['NET_MARGIN', netMargin], ['EBITDA_MARGIN', ebitdaMargin], ['REVENUE_GROWTH_1Y', revenueGrowth], ['PROFIT_GROWTH_1Y', profitGrowth], ['EPS_GROWTH_1Y', epsGrowth]].filter(([,v]) => v != null).map(([code,value]) => ({ code, value, period_type:'ANNUAL', period_end: series.revenue.at(-1)?.date || asOf }));
  const valuationRows = [['PE',pe],['PB',pb],['PS',ps],['EV',ev],['EV_EBITDA',evEbitda],['MARKET_CAP',marketCap]].filter(([,v]) => v != null).map(([code,value]) => ({code,value}));
  const technical = [['SMA20',sma20],['SMA50',sma50],['SMA200',sma200],['EMA20',ema20],['RSI14',rsi14],['MACD',macd],['BB_MID20',sma20]].filter(([,v]) => v != null).map(([code,value]) => ({code,value,metadata:{source:'Yahoo Finance',one_year_return:oneYearReturn,volatility}}));

  return supabaseRpc('gns_ingest_yahoo_company', { p_payload: { instrument_id: stock.instrument_id, company_id: stock.company_id, listing_id: stock.nse_listing_id, as_of_date: asOf, profile: { shares_outstanding: shares }, prices, fundamental_periods: periods, fundamentals, ratios, valuation: valuationRows, technical, score: { overall, quality, valuation, growth: growthScore, momentum, risk } } });
}

async function main() {
  const stocks = await supabaseRpc('gns_get_stock_snapshots', { p_limit: 5000 });
  const rows = Array.isArray(stocks) ? stocks : [];
  console.log(`GNSOne ingestion: ${rows.length} instruments`);
  let ok = 0, failed = 0;
  for (const stock of rows) {
    try { await ingestStock(stock); ok++; console.log(`✓ ${stock.nse_symbol}`); }
    catch (error) { failed++; console.error(`✗ ${stock.nse_symbol}: ${error.message}`); }
    await new Promise(r => setTimeout(r, 500));
  }
  console.log(JSON.stringify({ ok, failed, total: rows.length }));
  if (failed > 0 && ok === 0) process.exit(1);
}
main().catch(error => { console.error(error); process.exit(1); });
