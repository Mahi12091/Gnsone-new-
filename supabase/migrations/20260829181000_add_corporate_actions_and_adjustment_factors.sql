-- GNSOne Phase 3: corporate-action lineage and price-adjustment factors.
-- This migration creates auditable structures for source-backed corporate actions
-- and derived adjustment factors. It intentionally does not insert synthetic data.

create type public.corporate_action_type as enum (
  'DIVIDEND',
  'SPLIT',
  'BONUS',
  'RIGHTS',
  'MERGER',
  'DEMERGER',
  'OTHER'
);

create table public.corporate_actions (
  id uuid primary key default gen_random_uuid(),
  instrument_id uuid not null references public.instruments(id) on delete cascade,
  action_type public.corporate_action_type not null,
  announcement_date date,
  ex_date date,
  record_date date,
  effective_date date,
  ratio_numerator numeric,
  ratio_denominator numeric,
  cash_amount numeric,
  currency text,
  description text,
  source text not null,
  source_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint corporate_actions_ratio_check check (
    ratio_numerator is null or ratio_denominator is null or ratio_denominator > 0
  ),
  constraint corporate_actions_amount_check check (
    cash_amount is null or cash_amount >= 0
  )
);

create unique index corporate_actions_dedup_idx
  on public.corporate_actions (
    instrument_id,
    action_type,
    coalesce(ex_date, effective_date),
    coalesce(ratio_numerator, 0),
    coalesce(ratio_denominator, 0),
    coalesce(cash_amount, 0)
  );

create index corporate_actions_instrument_date_idx
  on public.corporate_actions(instrument_id, coalesce(ex_date, effective_date) desc);

create table public.price_adjustment_factors (
  id uuid primary key default gen_random_uuid(),
  instrument_id uuid not null references public.instruments(id) on delete cascade,
  corporate_action_id uuid references public.corporate_actions(id) on delete set null,
  effective_date date not null,
  price_factor numeric not null,
  volume_factor numeric not null default 1,
  source text not null,
  source_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint price_adjustment_factors_price_check check (price_factor > 0),
  constraint price_adjustment_factors_volume_check check (volume_factor > 0),
  unique (instrument_id, effective_date, corporate_action_id)
);

create index price_adjustment_factors_instrument_date_idx
  on public.price_adjustment_factors(instrument_id, effective_date desc);

create trigger corporate_actions_set_updated_at
before update on public.corporate_actions
for each row execute function public.set_updated_at();

create trigger price_adjustment_factors_set_updated_at
before update on public.price_adjustment_factors
for each row execute function public.set_updated_at();

alter table public.corporate_actions enable row level security;
alter table public.price_adjustment_factors enable row level security;

create policy "public can read corporate actions"
  on public.corporate_actions for select using (true);

create policy "public can read price adjustment factors"
  on public.price_adjustment_factors for select using (true);
