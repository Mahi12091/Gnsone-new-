const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('Supabase credentials are required');
const SB_HEADERS = { apikey:SERVICE_KEY, Authorization:`Bearer ${SERVICE_KEY}`, 'Content-Type':'application/json', Prefer:'return=minimal' };
const YAHOO_SOURCE='26796bee-44b1-491e-a6b0-7a527b3a67da'; const NSE_SOURCE='af52df14-53d8-4f77-adf7-2b9b28cce084'; const INR='44e5f887-39f2-4369-9b00-6ac0050311e6';
async function sb(path,options={}){const m=path.match(/^(market|reference|ingestion)\.(.*)$/);const schema=m?.[1],resource=m?.[2]||path;const headers={...SB_HEADERS,...(options.headers||{})};if(schema){headers['Content-Profile']=schema;headers['Accept-Profile']=schema;}const r=await fetch(`${SUPABASE_URL}/rest/v1/${resource}`,{...options,headers});if(!r.ok)throw new Error(`Supabase ${r.status}: ${await r.text()}`);if(r.status===204)return null;const text=await r.text();if(!text.trim())return null;try{return JSON.parse(text)}catch{throw new Error(`Invalid JSON from Supabase ${schema||'public'}.${resource}: ${text.slice(0,300)}`)}}
let NSE_COOKIE='';
function cookieHeader(setCookie){return (setCookie||[]).map(v=>String(v).split(';',1)[0]).filter(Boolean).join('; ')}
async function nse(path){
  const baseHeaders={accept:'application/json, text/plain, */*','accept-language':'en-US,en;q=0.9','cache-control':'no-cache','pragma':'no-cache','user-agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131 Safari/537.36','referer':'https://www.nseindia.com/'};
  if(!NSE_COOKIE){
    for(const primeUrl of ['https://www.nseindia.com/','https://www.nseindia.com/companies-listing/corporate-filings-shareholding-pattern']){
      const home=await fetch(primeUrl,{headers:{...baseHeaders,accept:'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'}});
      const cookies=home.headers.getSetCookie?.()||[];
      NSE_COOKIE=cookieHeader(cookies);
      if(!NSE_COOKIE){const raw=home.headers.get('set-cookie');if(raw)NSE_COOKIE=String(raw).split(',').map(v=>v.trim().split(';',1)[0]).filter(Boolean).join('; ')}
      if(NSE_COOKIE)break;
    }
  }
  const r=await fetch(`https://www.nseindia.com${path}`,{headers:{...baseHeaders,...(NSE_COOKIE?{'cookie':NSE_COOKIE}:{})}});
  if(!r.ok)throw new Error(`NSE ${r.status}`);
  const text=await r.text();
  if(!text.trim())return null;
  try{return JSON.parse(text)}catch{throw new Error(`NSE invalid JSON: ${text.slice(0,160)}`)}
}
async function yahoo(symbol){const r=await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${Math.floor(Date.now()/1000)-157680000}&period2=${Math.floor(Date.now()/1000)}&interval=1d&events=div%2Csplits`,{headers:{'user-agent':'GNSOne/1.0 research-ingestion'}});if(!r.ok)throw new Error(`Yahoo ${r.status}`);const text=await r.text();if(!text.trim())return null;try{return JSON.parse(text)}catch{return null}}
const date=v=>{if(v==null||v==='')return null;const s=String(v).trim();const m=s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/);const d=m?new Date(Date.UTC(Number(m[3]),Number(m[2])-1,Number(m[1]))):new Date(typeof v==='number'?(v<1e12?v*1000:v):v);return Number.isNaN(d.getTime())?null:d.toISOString().slice(0,10)};
const number=v=>{const n=Number(String(v??'').replace(/,/g,''));return Number.isFinite(n)?n:null}; const norm=v=>String(v??'').trim().toUpperCase().replace(/[^A-Z0-9]+/g,'_').replace(/^_|_$/g,'');
async function ingestYahooActions(stock){const chart=await yahoo(`${stock.nse_symbol}.NS`);const events=chart?.chart?.result?.[0]?.events||{};for(const [ts,item] of Object.entries(events.dividends||{})){const ex=date(Number(ts)),amount=number(item?.amount);if(!ex||amount==null)continue;await sb('market.dividends?on_conflict=instrument_id,ex_date,amount_per_share,dividend_type',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({instrument_id:stock.instrument_id,ex_date:ex,amount_per_share:amount,dividend_type:'CASH',currency_id:INR,source_id:YAHOO_SOURCE})})}const splitRows=await sb('reference.corporate_action_types?code=eq.SPLIT&select=corporate_action_type_id');const splitType=splitRows?.[0]?.corporate_action_type_id;if(splitType)for(const [ts,item] of Object.entries(events.splits||{})){const ex=date(Number(ts)),n=number(item?.numerator),d=number(item?.denominator);if(!ex||n==null||d==null||d===0)continue;await sb('market.corporate_actions?on_conflict=instrument_id,corporate_action_type_id,ex_date,ratio_numerator,ratio_denominator',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({instrument_id:stock.instrument_id,corporate_action_type_id:splitType,ex_date:ex,effective_date:ex,ratio_numerator:n,ratio_denominator:d,description:`Yahoo Finance split ${n}:${d}`,source_id:YAHOO_SOURCE,currency_id:INR})})}}
async function ingestNseShareholding(stock,categories){
  const payload=await nse(`/api/corporate-share-holdings-master?index=equities&symbol=${encodeURIComponent(stock.nse_symbol)}`);
  const rows=Array.isArray(payload)?payload:(payload?.data||payload?.shareholding||payload?.result||payload?.records||[]);
  if(!rows.length)return false;
  const aliases={PROMOTER:'PROMOTER',PROMOTER_GROUP:'PROMOTER',FII:'FII',FOREIGN:'FII',FOREIGN_PORTFOLIO_INVESTORS:'FII',FPI:'FII',DII:'DII',DOMESTIC:'DII',DOMESTIC_INSTITUTION:'DII',MUTUAL_FUND:'DII',BANKS:'DII',PUBLIC:'PUBLIC',RETAIL:'RETAIL',GOVERNMENT:'GOVERNMENT'};
  let periods=0,values=0;
  for(const row of rows){
    const periodEnd=date(row?.date??row?.periodEndDate??row?.period_end_date??row?.quarterEndDate??row?.asOnDate??row?.asOn??row?.as_on_date);
    if(!periodEnd)continue;
    let periodId;
    const existing=await sb(`market.shareholding_periods?company_id=eq.${stock.company_id}&period_end_date=eq.${periodEnd}&period_type=eq.QUARTERLY&source_id=eq.${NSE_SOURCE}&select=shareholding_period_id`);
    periodId=existing?.[0]?.shareholding_period_id;
    if(!periodId){const inserted=await sb('market.shareholding_periods',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({company_id:stock.company_id,period_end_date:periodEnd,period_type:'QUARTERLY',filing_date:date(row?.filingDate??row?.submissionDate??row?.submission_date),source_id:NSE_SOURCE})});periodId=inserted?.[0]?.shareholding_period_id}
    if(!periodId)continue;
    periods++;
    const entries=[];
    const raw=norm(row?.category??row?.categoryName??row?.shareholderCategory??row?.type??row?.shareholdingCategory);
    const match=Object.keys(aliases).find(k=>raw===k||raw.includes(k));
    if(match)entries.push([aliases[match],row?.percentage??row?.percentageHolding??row?.percentShareholding??row?.shareholdingPercentage??row?.percentageOfTotalShares,row?.shares??row?.sharesHeld??row?.noOfShares??row?.numberOfShares]);
    const direct=[['PROMOTER',row?.promoterPercentage??row?.promoterShareholding??row?.promoterAndPromoterGroupPercentage,row?.promoterShares??row?.promoterShareholdingShares],['PUBLIC',row?.publicPercentage??row?.publicShareholding??row?.publicHoldingPercentage,row?.publicShares??row?.publicShareholdingShares],['GOVERNMENT',row?.governmentPercentage,row?.governmentShares]];
    for(const item of direct)if(item[1]!=null||item[2]!=null)entries.push(item);
    for(const [code,pctValue,sharesValue] of entries){const categoryId=categories[norm(code)],pct=number(pctValue),shares=number(sharesValue);if(!categoryId||(pct==null&&shares==null))continue;await sb('market.shareholding_values',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({shareholding_period_id:periodId,shareholding_category_id:categoryId,shares_held:shares,percentage_held:pct,source_id:NSE_SOURCE})});values++}
  }
  return periods>0&&values>0;
}
async function ingestPeers(stocks){const companies=await sb('market.companies?select=company_id,industry_id,sector_id'),meta=new Map((companies||[]).map(c=>[c.company_id,c])),groups=new Map();for(const s of stocks){const c=meta.get(s.company_id),key=c?.industry_id||c?.sector_id;if(!key)continue;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(s)}for(const members of groups.values())for(const company of members)for(const peer of members){if(company.company_id===peer.company_id)continue;await sb('market.company_peers',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify({company_id:company.company_id,peer_company_id:peer.company_id,relationship_type:'INDUSTRY_PEER',source_id:YAHOO_SOURCE})})}}
async function main(){const stocks=await sb('rpc/gns_get_stock_snapshots',{method:'POST',body:JSON.stringify({p_limit:5000})});const categoryRows=await sb('market.shareholding_categories?select=shareholding_category_id,code');const categories=Object.fromEntries((categoryRows||[]).map(x=>[norm(x.code),x.shareholding_category_id]));let actionSymbols=0,holdingSymbols=0;for(const stock of stocks||[]){try{await ingestYahooActions(stock);actionSymbols++}catch(e){console.error(`actions ${stock.nse_symbol}: ${e.message}`)}try{if(await ingestNseShareholding(stock,categories))holdingSymbols++}catch(e){console.error(`holdings ${stock.nse_symbol}: ${e.message}`)}}try{await ingestPeers(stocks||[])}catch(e){console.error(`peers: ${e.message}`)}const result={instruments:(stocks||[]).length,action_symbols:actionSymbols,shareholding_symbols:holdingSymbols,peer_mode:'industry-derived',shareholding_source:'NSE_PUBLIC'};console.log(JSON.stringify(result));if((stocks||[]).length>0&&holdingSymbols===0)throw new Error('NSE shareholding ingestion produced zero populated symbols; refusing to mark market structure complete')}main().catch(e=>{console.error(e);process.exit(1)});
