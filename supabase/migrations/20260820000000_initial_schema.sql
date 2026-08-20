-- GNSOne Phase 1: canonical database foundation.
-- This migration intentionally contains identity/classification tables only.
-- Market prices, fundamentals, financials and derived analytics arrive in later migrations.

create extension if not exists pgcrypto;

create type public.asset_type as enum (
  'EQUITY',
  'ETF',
  'MUTUAL_FUND',
  'BOND',
  'COMMODITY',
  'INDEX'
);

create type public.exchange_code as enum (
  'NSE',
  'BSE',
  'OTHER'
);

create type public.instrument_status as enum (
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED'
);

create type public.identifier_type as enum (
  'ISIN',
  'NSE_SYMBOL',
  'BSE_CODE'
);

create type public.period_type as enum (
  'FY',
  'Q1',
  'Q2',
  'Q3',
  'Q4',
  'TTM'
);

create table public.sectors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.industries (
  id uuid primary key default gen_random_uuid(),
  sector_id uuid not null references public.sectors(id) on delete restrict,
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sector_id, name)
);

create table public.sub_industries (
  id uuid primary key default gen_random_uuid(),
  industry_id uuid not null references public.industries(id) on delete restrict,
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (industry_id, name)
);

create table public.instruments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text,
  slug text not null unique,
  asset_type public.asset_type not null,
  security_type text,
  exchange public.exchange_code,
  sector_id uuid references public.sectors(id) on delete set null,
  industry_id uuid references public.industries(id) on delete set null,
  sub_industry_id uuid references public.sub_industries(id) on delete set null,
  currency text not null default 'INR',
  status public.instrument_status not null default 'ACTIVE',
  listing_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint instruments_name_not_blank check (length(trim(name)) > 0),
  constraint instruments_slug_not_blank check (length(trim(slug)) > 0),
  constraint instruments_currency_not_blank check (length(trim(currency)) > 0)
);

create table public.instrument_identifiers (
  id uuid primary key default gen_random_uuid(),
  instrument_id uuid not null references public.instruments(id) on delete cascade,
  identifier_type public.identifier_type not null,
  identifier_value text not null,
  valid_from date,
  valid_to date,
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  constraint instrument_identifiers_value_not_blank check (length(trim(identifier_value)) > 0),
  constraint instrument_identifiers_valid_range check (
    valid_from is null or valid_to is null or valid_to >= valid_from
  )
);

create unique index instrument_identifiers_current_unique
  on public.instrument_identifiers (identifier_type, upper(trim(identifier_value)))
  where is_current = true;

create index industries_sector_id_idx on public.industries(sector_id);
create index sub_industries_industry_id_idx on public.sub_industries(industry_id);
create index instruments_sector_id_idx on public.instruments(sector_id);
create index instruments_industry_id_idx on public.instruments(industry_id);
create index instruments_sub_industry_id_idx on public.instruments(sub_industry_id);
create index instruments_status_idx on public.instruments(status);
create index instruments_asset_type_idx on public.instruments(asset_type);
create index instrument_identifiers_instrument_id_idx on public.instrument_identifiers(instrument_id);
create index instrument_identifiers_lookup_idx
  on public.instrument_identifiers (identifier_type, upper(trim(identifier_value)));

create table public.financial_periods (
  id uuid primary key default gen_random_uuid(),
  instrument_id uuid not null references public.instruments(id) on delete cascade,
  period_type public.period_type not null,
  fiscal_year smallint not null,
  period_start date not null,
  period_end date not null,
  filing_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint financial_periods_year_check check (fiscal_year between 1900 and 2200),
  constraint financial_periods_date_check check (period_end >= period_start),
  unique (instrument_id, period_type, fiscal_year, period_end)
);

create index financial_periods_instrument_date_idx
  on public.financial_periods(instrument_id, period_end desc);

-- Updated-at helper. It is deliberately generic so later tables can reuse it.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger sectors_set_updated_at
before update on public.sectors
for each row execute function public.set_updated_at();

create trigger industries_set_updated_at
before update on public.industries
for each row execute function public.set_updated_at();

create trigger sub_industries_set_updated_at
before update on public.sub_industries
for each row execute function public.set_updated_at();

create trigger instruments_set_updated_at
before update on public.instruments
for each row execute function public.set_updated_at();

create trigger financial_periods_set_updated_at
before update on public.financial_periods
for each row execute function public.set_updated_at();

-- Public research data is readable anonymously. Writes are server-side only.
alter table public.sectors enable row level security;
alter table public.industries enable row level security;
alter table public.sub_industries enable row level security;
alter table public.instruments enable row level security;
alter table public.instrument_identifiers enable row level security;
alter table public.financial_periods enable row level security;

create policy "public can read sectors"
  on public.sectors for select using (true);

create policy "public can read industries"
  on public.industries for select using (true);

create policy "public can read sub industries"
  on public.sub_industries for select using (true);

create policy "public can read instruments"
  on public.instruments for select using (true);

create policy "public can read instrument identifiers"
  on public.instrument_identifiers for select using (true);

create policy "public can read financial periods"
  on public.financial_periods for select using (true);
