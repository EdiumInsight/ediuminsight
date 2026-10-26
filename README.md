# Edium Insight

**Fundamental Investing Intelligence Platform**

Edium Insight is a responsive investment research workspace built with Next.js 15, TypeScript, Tailwind CSS, Supabase, TanStack Query, Zod, React Hook Form, Recharts, Framer Motion, and Lucide React.

> The checked-in experience uses clearly labelled illustrative sample data. It is not connected to a live market/news provider and is not investment advice. Configure data providers and review calculations before using this application for investment decisions.

## Features

- Portfolio dashboard with performance, sector allocation, holdings, news, watchlist movers, and earnings.
- Holdings and transaction views with average cost, market value, unrealized return, and dividend income examples.
- Company profiles, ten-year financial history, growth charts, moat radar, and management scoring.
- Interactive DCF assumptions, bear/base/bull scenarios, market multiples, and reverse DCF.
- Watchlists, news intelligence, thesis history, alert overview, and a filterable quality/value screener.
- Supabase email/password authentication, registration, password recovery, profile preferences, and RLS migration.
- Typed resource API routes, Zod validation, React Query hooks, and an AI assistant provider boundary.
- Responsive desktop/tablet/mobile workspace shell with accessible labels and loading-friendly component boundaries.

## Requirements

- Node.js 20.9 or newer.
- npm 10 or newer.
- A Supabase project for persistence and authentication. The UI can run without credentials in demo mode.

## Installation

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without Supabase environment variables, routes use sample UI data and APIs return a clear configuration response. With Supabase configured, workspace routes require a signed-in user.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | For persistence/auth | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | For persistence/auth | Supabase publishable/anon key; RLS remains mandatory |
| `MARKET_DATA_API_KEY` | Optional | Server-only market-data provider credential |
| `NEWS_API_KEY` | Optional | Server-only news provider credential |
| `OPENAI_API_KEY` | Optional | Server-only AI provider credential |
| `OPENAI_MODEL` | Optional | Model identifier for a future provider adapter |

Never put service-role, market-data, news, or AI secrets in `NEXT_PUBLIC_*` variables. This repository does not call paid data or AI vendors yet.

## Supabase setup

1. Create a Supabase project and copy its project URL and anon/publishable key into `.env.local`.
2. In Supabase Authentication, configure email confirmations and add the local and production redirect URLs. Allow `/auth/confirm` as the password recovery redirect.
3. Apply `supabase/migrations/202610260001_initial_schema.sql` using the Supabase SQL editor or Supabase CLI.
4. Optionally run `supabase/seed.sql` to add the illustrative Microsoft annual financial history.
5. Verify RLS policies with at least two test users before deploying.

The migration creates profiles, portfolios, holdings, transactions, watchlists/items, companies, financials, news, valuations, theses/events, alerts, settings, indexes, update triggers, and owner-scoped RLS policies. Public financial/company/news data is readable only by authenticated users. The `users` profile row is provisioned by an Auth trigger.

## Application structure

```text
src/
	app/
		(workspace)/                 Research workspace routes
		api/[resource]/              Typed resource GET/POST API
		api/auth/[action]/           Supabase Auth actions
		api/assistant/               AI provider boundary
	components/                    Workspace, auth, and query-provider UI
	hooks/                         TanStack Query resource hooks
	lib/api/                       Zod schemas and resource services
	lib/supabase/                  Supabase server client
	types/                         Database contracts
	middleware.ts                  Supabase session refresh and route protection
supabase/
	migrations/                    PostgreSQL schema and RLS policies
	seed.sql                       Illustrative fundamentals seed
```

## Routes

| Route | Purpose |
| --- | --- |
| `/dashboard` | Portfolio overview and market workspace |
| `/portfolio` | Holdings and recent transactions |
| `/portfolio/[ticker]` | Company overview and research links |
| `/watchlists` | Tracked companies and valuation signals |
| `/analysis/[ticker]` | Financial history, moat, management, growth |
| `/valuation?ticker=MSFT` | DCF, multiples, reverse DCF |
| `/news` | Portfolio and watchlist intelligence |
| `/thesis` | Investment theses and event history |
| `/alerts` | Price, news, fundamental, and thesis alerts |
| `/screener` | Interactive fundamental opportunity filters |
| `/settings` | Profile and provider connection status |
| `/login`, `/register` | Email authentication |
| `/forgot-password`, `/reset-password` | Password recovery |

## API

All resource routes validate authentication and rely on Supabase RLS for row-level ownership. `GET` is available for `/api/portfolio`, `/api/holdings`, `/api/transactions`, `/api/analysis`, `/api/valuation`, `/api/news`, `/api/watchlists`, `/api/thesis`, `/api/alerts`, and `/api/screener`. Validated `POST` creation is implemented for portfolios, holdings, transactions, watchlists, theses, alerts, and valuations; analysis, news, and screener are read-only. The initial API intentionally limits results to 200 rows.

Authentication actions are `POST /api/auth/login`, `/register`, `/forgot-password`, `/update-password`, and `/logout`. Investment assistant requests use `POST /api/assistant` with a typed task and bounded context; the route returns `AI_PROVIDER_UNAVAILABLE` until a provider adapter is implemented.

## Development and deployment

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm start
```

For Vercel, import the repository, set the environment variables in project settings, configure the production Supabase auth redirect URLs, deploy, and verify protected routes and RLS with a non-admin account. Next.js App Router prerenders public shell pages; analysis uses server rendering and ticker profile pages are statically generated for seed tickers. Recharts is loaded only in the relevant client routes. TanStack Query uses a 60-second stale window; resource hooks invalidate after successful creation.

## Data and model boundaries

Prices, financials, news, moat scores, competitor metrics, screen results, and alert examples in the UI are illustrative samples. No Reuters, Yahoo Finance, SEC, MarketWatch, Financial Times, or company IR ingestion is implemented. Add licensed provider adapters behind server-only services, normalize timestamps/currencies, record source attribution, and respect each provider's usage terms. The DCF illustrates a five-year FCFF model and reverse-growth solve; validate accounting assumptions, dilution, debt, terminal value, and units before production use. The AI endpoint deliberately does not fabricate analysis when no provider is configured.

Before production, complete provider ingestion and retry/observability, authorization tests, transaction-to-holdings reconciliation, alert scheduling/delivery, durable thesis-event writes, AI privacy/rate limits, and end-to-end tests with a real Supabase project. The included UI, schema, auth boundary, and resource API are a production-oriented foundation, not a claim that those external services are already operating.
