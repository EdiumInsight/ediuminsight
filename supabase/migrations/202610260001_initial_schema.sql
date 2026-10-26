create extension if not exists pgcrypto;

create type public.transaction_type as enum ('BUY', 'SELL', 'DIVIDEND', 'DEPOSIT', 'WITHDRAWAL');
create type public.thesis_status as enum ('ALIVE', 'AT_RISK', 'BROKEN');
create type public.news_sentiment as enum ('BULLISH', 'NEUTRAL', 'BEARISH');

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  ticker text not null unique check (ticker = upper(ticker)),
  name text not null,
  exchange text,
  sector text,
  industry text,
  country text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  base_currency char(3) not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.holdings (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete restrict,
  shares numeric(24, 8) not null check (shares >= 0),
  average_cost numeric(20, 6) not null check (average_cost >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (portfolio_id, company_id)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios (id) on delete cascade,
  company_id uuid references public.companies (id) on delete restrict,
  type public.transaction_type not null,
  shares numeric(24, 8) check (shares is null or shares >= 0),
  price numeric(20, 6) check (price is null or price >= 0),
  amount numeric(20, 2) not null check (amount > 0),
  transacted_at timestamptz not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.watchlist_items (
  id uuid primary key default gen_random_uuid(),
  watchlist_id uuid not null references public.watchlists (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  target_price numeric(20, 6) check (target_price is null or target_price >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (watchlist_id, company_id)
);

create table public.financials (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  fiscal_year smallint not null check (fiscal_year between 1900 and 2200),
  period text not null default 'FY' check (period in ('FY', 'Q1', 'Q2', 'Q3', 'Q4', 'TTM')),
  revenue numeric(24, 4),
  gross_profit numeric(24, 4),
  operating_income numeric(24, 4),
  net_income numeric(24, 4),
  free_cash_flow numeric(24, 4),
  eps numeric(20, 6),
  book_value numeric(24, 4),
  cash numeric(24, 4),
  debt numeric(24, 4),
  capex numeric(24, 4),
  currency char(3) not null default 'USD',
  data_source text,
  reported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, fiscal_year, period)
);

create table public.news (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies (id) on delete set null,
  headline text not null,
  source text not null,
  url text unique,
  summary text,
  impact_analysis text,
  sentiment public.news_sentiment not null default 'NEUTRAL',
  published_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.valuations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  method text not null check (method in ('DCF', 'MULTIPLE', 'REVERSE_DCF')),
  assumptions jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.theses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  investment_thesis text not null,
  catalysts jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  invalidation_points jsonb not null default '[]'::jsonb,
  probability numeric(5, 2) not null default 50 check (probability between 0 and 100),
  status public.thesis_status not null default 'ALIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.thesis_events (
  id uuid primary key default gen_random_uuid(),
  thesis_id uuid not null references public.theses (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  event_type text not null,
  content text not null,
  previous_value jsonb,
  next_value jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  company_id uuid references public.companies (id) on delete cascade,
  type text not null check (type in ('PRICE', 'NEWS', 'FUNDAMENTAL', 'THESIS')),
  name text not null check (char_length(name) between 1 and 120),
  condition jsonb not null,
  enabled boolean not null default true,
  last_triggered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.settings (
  user_id uuid primary key references public.users (id) on delete cascade,
  base_currency char(3) not null default 'USD',
  timezone text not null default 'UTC',
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index portfolios_user_id_idx on public.portfolios (user_id);
create index holdings_portfolio_id_idx on public.holdings (portfolio_id);
create index holdings_company_id_idx on public.holdings (company_id);
create index transactions_portfolio_date_idx on public.transactions (portfolio_id, transacted_at desc);
create index watchlists_user_id_idx on public.watchlists (user_id);
create index watchlist_items_company_id_idx on public.watchlist_items (company_id);
create index financials_company_year_idx on public.financials (company_id, fiscal_year desc);
create index news_published_at_idx on public.news (published_at desc);
create index news_company_published_idx on public.news (company_id, published_at desc);
create index valuations_user_company_idx on public.valuations (user_id, company_id, created_at desc);
create index theses_user_status_idx on public.theses (user_id, status);
create index thesis_events_thesis_date_idx on public.thesis_events (thesis_id, created_at desc);
create index alerts_user_enabled_idx on public.alerts (user_id, enabled);

create function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare table_name text;
begin
  foreach table_name in array array['users', 'portfolios', 'holdings', 'transactions', 'watchlists', 'watchlist_items', 'companies', 'financials', 'news', 'valuations', 'theses', 'thesis_events', 'alerts', 'settings'] loop
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name);
  end loop;
end;
$$;

create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  insert into public.settings (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.users enable row level security;
alter table public.companies enable row level security;
alter table public.portfolios enable row level security;
alter table public.holdings enable row level security;
alter table public.transactions enable row level security;
alter table public.watchlists enable row level security;
alter table public.watchlist_items enable row level security;
alter table public.financials enable row level security;
alter table public.news enable row level security;
alter table public.valuations enable row level security;
alter table public.theses enable row level security;
alter table public.thesis_events enable row level security;
alter table public.alerts enable row level security;
alter table public.settings enable row level security;

create policy "Users can read own profile" on public.users for select to authenticated using ((select auth.uid()) = id);
create policy "Users can update own profile" on public.users for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "Authenticated users can read companies" on public.companies for select to authenticated using (true);
create policy "Authenticated users can read financials" on public.financials for select to authenticated using (true);
create policy "Authenticated users can read news" on public.news for select to authenticated using (true);

create policy "Users manage own portfolios" on public.portfolios for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage holdings in own portfolios" on public.holdings for all to authenticated using (exists (select 1 from public.portfolios p where p.id = portfolio_id and p.user_id = (select auth.uid()))) with check (exists (select 1 from public.portfolios p where p.id = portfolio_id and p.user_id = (select auth.uid())));
create policy "Users manage transactions in own portfolios" on public.transactions for all to authenticated using (exists (select 1 from public.portfolios p where p.id = portfolio_id and p.user_id = (select auth.uid()))) with check (exists (select 1 from public.portfolios p where p.id = portfolio_id and p.user_id = (select auth.uid())));
create policy "Users manage own watchlists" on public.watchlists for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage items in own watchlists" on public.watchlist_items for all to authenticated using (exists (select 1 from public.watchlists w where w.id = watchlist_id and w.user_id = (select auth.uid()))) with check (exists (select 1 from public.watchlists w where w.id = watchlist_id and w.user_id = (select auth.uid())));
create policy "Users manage own valuations" on public.valuations for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage own theses" on public.theses for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage own thesis events" on public.thesis_events for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage own alerts" on public.alerts for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage own settings" on public.settings for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

insert into public.companies (ticker, name, exchange, sector, country) values
  ('MSFT', 'Microsoft Corporation', 'NASDAQ', 'Technology', 'United States'),
  ('NVDA', 'NVIDIA Corporation', 'NASDAQ', 'Semiconductors', 'United States'),
  ('BRK.B', 'Berkshire Hathaway Inc.', 'NYSE', 'Financials', 'United States'),
  ('V', 'Visa Inc.', 'NYSE', 'Financials', 'United States'),
  ('COST', 'Costco Wholesale Corporation', 'NASDAQ', 'Consumer Staples', 'United States'),
  ('AMZN', 'Amazon.com, Inc.', 'NASDAQ', 'Consumer Discretionary', 'United States'),
  ('GOOGL', 'Alphabet Inc.', 'NASDAQ', 'Communication Services', 'United States'),
  ('LLY', 'Eli Lilly and Company', 'NYSE', 'Healthcare', 'United States'),
  ('ASML', 'ASML Holding N.V.', 'NASDAQ', 'Semiconductors', 'Netherlands'),
  ('ADBE', 'Adobe Inc.', 'NASDAQ', 'Technology', 'United States')
on conflict (ticker) do nothing;