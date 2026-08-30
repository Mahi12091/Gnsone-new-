-- Keep the ingestion-only stock snapshot RPC server-side so service_role can read
-- the analytics-backed score join without exposing analytics to public clients.
create or replace function public.gns_get_stock_snapshots(p_limit integer default 50)
returns table(
  instrument_id uuid,
  company_id uuid,
  name text,
  nse_symbol text,
  bse_code text,
  nse_listing_id uuid,
  latest_price numeric,
  price_date date,
  score numeric
)
language sql
security definer
set search_path = ''
as $$
  with stock_base as (
    select i.instrument_id, i.company_id, i.name,
      n.listing_id as nse_listing_id, n.symbol as nse_symbol,
      b.exchange_security_code as bse_code
    from market.instruments i
    left join market.listings n on n.instrument_id = i.instrument_id
      and n.exchange_id = (select e.exchange_id from reference.exchanges e where e.code = 'NSE' limit 1)
      and coalesce(n.is_primary, true)
    left join market.listings b on b.instrument_id = i.instrument_id
      and b.exchange_id = (select e.exchange_id from reference.exchanges e where e.code = 'BSE' limit 1)
      and coalesce(b.is_primary, true)
    where upper(coalesce(i.status, 'ACTIVE')) = 'ACTIVE'
    order by i.name
    limit greatest(1, least(coalesce(p_limit, 50), 5000))
  ),
  latest_prices as (
    select distinct on (hp.listing_id) hp.listing_id, hp.close as latest_price, hp.price_date
    from market.historical_prices hp join stock_base sb on sb.nse_listing_id = hp.listing_id
    order by hp.listing_id, hp.price_date desc, hp.price_id desc
  ),
  latest_scores as (
    select distinct on (ssv.instrument_id) ssv.instrument_id, ssv.overall_score as score
    from analytics.stock_score_values ssv join stock_base sb on sb.instrument_id = ssv.instrument_id
    order by ssv.instrument_id, ssv.as_of_date desc, ssv.updated_at desc
  )
  select sb.instrument_id, sb.company_id, sb.name, sb.nse_symbol, sb.bse_code, sb.nse_listing_id,
    lp.latest_price, lp.price_date, ls.score
  from stock_base sb
  left join latest_prices lp on lp.listing_id = sb.nse_listing_id
  left join latest_scores ls on ls.instrument_id = sb.instrument_id
  order by sb.name;
$$;

revoke all on function public.gns_get_stock_snapshots(integer) from public, anon, authenticated;
grant execute on function public.gns_get_stock_snapshots(integer) to service_role;
