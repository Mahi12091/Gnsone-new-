-- Pin SECURITY DEFINER research RPC search paths to prevent mutable search_path resolution.
-- All referenced application objects are schema-qualified in these functions.
ALTER FUNCTION public.gns_get_stock_by_symbol(text) SET search_path = '';
ALTER FUNCTION public.gns_get_stock_research_detail(text) SET search_path = '';
ALTER FUNCTION public.gns_get_stock_snapshots(integer) SET search_path = '';
