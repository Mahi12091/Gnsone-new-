-- Register Financial Modeling Prep as a secondary/validation provider.
insert into ingestion.data_sources
  (code, name, source_type, website_url, license_notes, priority, is_active)
values
  (
    'FMP',
    'Financial Modeling Prep',
    'API',
    'https://site.financialmodelingprep.com/developer/docs',
    'Commercial API. Availability, redistribution and production use are subject to the active FMP plan and license.',
    20,
    true
  )
on conflict (code) do update
set name = excluded.name,
    website_url = excluded.website_url,
    license_notes = excluded.license_notes,
    priority = excluded.priority,
    is_active = true;
