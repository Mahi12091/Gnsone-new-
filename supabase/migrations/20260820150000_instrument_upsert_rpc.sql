create or replace function public.resolve_and_upsert_instrument(
  p_batch_id uuid,
  p_row_id uuid,
  p_normalized jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_instrument_id uuid;
  v_existing_id uuid;
  v_name text := nullif(trim(p_normalized->>'name'), '');
  v_isin text := nullif(upper(trim(p_normalized->>'isin')), '');
  v_nse_symbol text := nullif(upper(trim(p_normalized->>'nseSymbol')), '');
  v_bse_code text := nullif(trim(p_normalized->>'bseCode'), '');
  v_exchange exchange := nullif(p_normalized->>'exchange', '')::exchange;
  v_asset_type asset_type := coalesce(nullif(p_normalized->>'assetType', '')::asset_type, 'EQUITY');
  v_security_type text := nullif(trim(p_normalized->>'securityType'), '');
  v_slug text := nullif(trim(p_normalized->>'slugBase'), '');
  v_match_count integer;
  v_action text;
begin
  if v_name is null then
    update public.instrument_import_rows
       set status = 'INVALID', error_message = 'Normalized instrument name is required', updated_at = now()
     where id = p_row_id and batch_id = p_batch_id;
    return null;
  end if;

  if v_slug is null then
    v_slug := regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g');
    v_slug := trim(both '-' from v_slug);
  end if;

  if v_isin is not null then
    select count(*), min(id) into v_match_count, v_existing_id from public.instruments where isin = v_isin;
    if v_match_count > 1 then raise exception 'INSTRUMENT_IDENTITY_CONFLICT: multiple instruments share ISIN %', v_isin; end if;
    if v_match_count = 1 then v_instrument_id := v_existing_id; end if;
  end if;

  if v_instrument_id is null and v_nse_symbol is not null then
    select count(*), min(id) into v_match_count, v_existing_id from public.instruments where nse_symbol = v_nse_symbol;
    if v_match_count > 1 then raise exception 'INSTRUMENT_IDENTITY_CONFLICT: multiple instruments share NSE symbol %', v_nse_symbol; end if;
    if v_match_count = 1 then v_instrument_id := v_existing_id; end if;
  end if;

  if v_instrument_id is null and v_bse_code is not null then
    select count(*), min(id) into v_match_count, v_existing_id from public.instruments where bse_code = v_bse_code;
    if v_match_count > 1 then raise exception 'INSTRUMENT_IDENTITY_CONFLICT: multiple instruments share BSE code %', v_bse_code; end if;
    if v_match_count = 1 then v_instrument_id := v_existing_id; end if;
  end if;

  if v_instrument_id is null then
    select count(*), min(id) into v_match_count, v_existing_id from public.instruments where lower(trim(name)) = lower(v_name);
    if v_match_count > 1 then raise exception 'INSTRUMENT_IDENTITY_CONFLICT: multiple instruments share name %', v_name; end if;
    if v_match_count = 1 then v_instrument_id := v_existing_id; end if;
  end if;

  if v_isin is not null then
    select id into v_existing_id from public.instruments where isin = v_isin limit 1;
    if v_existing_id is not null and v_instrument_id is not null and v_existing_id <> v_instrument_id then raise exception 'INSTRUMENT_IDENTITY_CONFLICT: ISIN belongs to another instrument'; end if;
  end if;
  if v_nse_symbol is not null then
    select id into v_existing_id from public.instruments where nse_symbol = v_nse_symbol limit 1;
    if v_existing_id is not null and v_instrument_id is not null and v_existing_id <> v_instrument_id then raise exception 'INSTRUMENT_IDENTITY_CONFLICT: NSE symbol belongs to another instrument'; end if;
  end if;
  if v_bse_code is not null then
    select id into v_existing_id from public.instruments where bse_code = v_bse_code limit 1;
    if v_existing_id is not null and v_instrument_id is not null and v_existing_id <> v_instrument_id then raise exception 'INSTRUMENT_IDENTITY_CONFLICT: BSE code belongs to another instrument'; end if;
  end if;

  if v_instrument_id is null then
    if exists (select 1 from public.instruments where slug = v_slug) then
      v_slug := left(v_slug, 210) || '-' || substr(md5(coalesce(v_isin, v_bse_code, v_nse_symbol, v_name)), 1, 8);
    end if;
    insert into public.instruments (name, isin, nse_symbol, bse_code, exchange, asset_type, security_type, slug, status, currency)
    values (v_name, v_isin, v_nse_symbol, v_bse_code, v_exchange, v_asset_type, v_security_type, v_slug, 'ACTIVE', 'INR')
    returning id into v_instrument_id;
    v_action := 'INSERTED';
  else
    update public.instruments
       set name = v_name,
           isin = coalesce(v_isin, isin),
           nse_symbol = coalesce(v_nse_symbol, nse_symbol),
           bse_code = coalesce(v_bse_code, bse_code),
           exchange = coalesce(v_exchange, exchange),
           asset_type = v_asset_type,
           security_type = coalesce(v_security_type, security_type),
           updated_at = now()
     where id = v_instrument_id;
    v_action := 'UPDATED';
  end if;

  if v_isin is not null then
    insert into public.instrument_identifiers (instrument_id, identifier_type, identifier_value, is_current, source)
    values (v_instrument_id, 'ISIN', v_isin, true, p_normalized->>'source')
    on conflict (identifier_type, identifier_value) where is_current do update
      set instrument_id = excluded.instrument_id, source = excluded.source, updated_at = now();
  end if;
  if v_nse_symbol is not null then
    insert into public.instrument_identifiers (instrument_id, identifier_type, identifier_value, is_current, source)
    values (v_instrument_id, 'NSE_SYMBOL', v_nse_symbol, true, p_normalized->>'source')
    on conflict (identifier_type, identifier_value) where is_current do update
      set instrument_id = excluded.instrument_id, source = excluded.source, updated_at = now();
  end if;
  if v_bse_code is not null then
    insert into public.instrument_identifiers (instrument_id, identifier_type, identifier_value, is_current, source)
    values (v_instrument_id, 'BSE_CODE', v_bse_code, true, p_normalized->>'source')
    on conflict (identifier_type, identifier_value) where is_current do update
      set instrument_id = excluded.instrument_id, source = excluded.source, updated_at = now();
  end if;

  update public.instrument_import_rows
     set status = case when v_action = 'INSERTED' then 'INSERTED' else 'UPDATED' end,
         instrument_id = v_instrument_id,
         normalized_payload = p_normalized,
         error_message = null,
         updated_at = now()
   where id = p_row_id and batch_id = p_batch_id;

  return v_instrument_id;
exception when others then
  update public.instrument_import_rows
     set status = 'FAILED', normalized_payload = p_normalized, error_message = sqlerrm, updated_at = now()
   where id = p_row_id and batch_id = p_batch_id;
  return null;
end;
$$;

revoke all on function public.resolve_and_upsert_instrument(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.resolve_and_upsert_instrument(uuid, uuid, jsonb) to service_role;
