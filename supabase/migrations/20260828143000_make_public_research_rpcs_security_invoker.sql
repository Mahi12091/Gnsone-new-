-- Keep the public research RPCs safe under the caller's RLS context.
-- These functions are intentionally callable by anonymous/authenticated readers,
-- so SECURITY INVOKER is preferable to SECURITY DEFINER for the exposed read path.
ALTER FUNCTION public.gns_get_stock_by_symbol(text) SECURITY INVOKER;
ALTER FUNCTION public.gns_get_stock_research_detail(text) SECURITY INVOKER;
ALTER FUNCTION public.gns_get_stock_snapshots(integer) SECURITY INVOKER;
