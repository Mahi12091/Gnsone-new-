const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TARGET_NEW = Number(process.env.MVP_NEW_STOCKS || 500);
const NSE_URL = 'https://archives.nseindia.com/content/equities/EQUITY_L.csv';
if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' };
async function rpc(fn, body) { const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, { method:'POST', headers, body:JSON.stringify(body) }); if (!r.ok) throw new Error(`RPC ${fn} ${r.status}: ${await r.text()}`); return r.json(); }
function csv(text) { const lines=text.trim().split(/\r?\n/); const out=[]; for(const line of lines.slice(1)){ const a=line.split(',').map(x=>x.replace(/^"|"$/g,'')); if(a.length>=2) out.push(a); } return out; }
async function main(){
 const current=await rpc('gns_get_stock_snapshots',{p_limit:10000});
 const existing=new Set((Array.isArray(current)?current:[]).map(x=>String(x.nse_symbol||'').toUpperCase()).filter(Boolean));
 const response=await fetch(NSE_URL,{headers:{'User-Agent':'Mozilla/5.0 GNSOne research universe'}}); if(!response.ok) throw new Error(`NSE master ${response.status}`);
 const rows=csv(await response.text()).filter(r=>r[0] && /^[A-Z0-9&.-]+$/.test(r[0]) && !existing.has(r[0].toUpperCase()));
 const selected=rows.slice(0,TARGET_NEW);
 console.log(`Existing NSE symbols: ${existing.size}; candidates: ${rows.length}; adding: ${selected.length}`);
 let ok=0,failed=0;
 for(const r of selected){ const symbol=r[0].trim().toUpperCase(); const name=(r[1]||symbol).trim(); const isin=(r[6]||'').trim().toUpperCase()||null; const normalized={name,isin,nseSymbol:symbol,exchange:'NSE',assetType:'EQUITY',securityType:'EQUITY',slugBase:name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''),source:'NSE_EQUITY_L'}; try { await rpc('gns_import_instrument_batch',{p_rows:[normalized]}); ok++; console.log(`✓ ${symbol}`); } catch(e){ failed++; console.error(`✗ ${symbol}: ${e.message}`); } }
 console.log(JSON.stringify({target:TARGET_NEW,added:ok,failed,total_candidates:rows.length}));
 if(failed && !ok) process.exit(1);
}
main().catch(e=>{console.error(e);process.exit(1)});
