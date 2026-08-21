-- Production security hardening
-- Keep public read RPCs callable for the public research UI, but never expose
-- ingestion/admin-style SECURITY DEFINER functions through the API roles.
revoke execute on function public.gns_ingest_yahoo_company(jsonb) from anon, authenticated;
revoke execute on function public.rls_auto_enable() from anon, authenticated;

-- Prevent search_path manipulation for the shared timestamp trigger function.
alter function public.set_updated_at() set search_path = public;
