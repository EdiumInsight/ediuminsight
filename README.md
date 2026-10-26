# Edium Insight

**Fundamental Investing Intelligence Platform**

Edium Insight is a responsive investment research workspace built with Next.js 15, TypeScript, Tailwind CSS, Supabase, TanStack Query, Zod, React Hook Form, Recharts, Framer Motion, and Lucide React.

> Public market quotes, SEC facts/filings, and RSS headlines are fetched from the sources described below. Personal portfolio data is not available until a Supabase project is configured. Data freshness and provider terms vary. This application is not investment advice.

## Features

- Public quote dashboard with source timestamp, market moves, publisher-linked news, and personal-account connection state.
- Holdings and transaction calculations from Supabase records combined with separate Nasdaq quotes.
- SEC-filed annual financial history, reported growth/cash-flow charts, and directly linked filings.
- Interactive DCF, bear/base/bull scenarios, trailing annual multiples, and reverse DCF using fetched base-year facts.
- Account-only watchlists, theses, alerts, and a filterable public-data screener.
- Supabase email/password authentication, registration, password recovery, profile preferences, and RLS migration.
- Typed resource API routes, Zod validation, React Query hooks, and an AI assistant provider boundary.
- Responsive desktop/tablet/mobile workspace shell with accessible labels and loading-friendly component boundaries.

## Requirements

- Node.js 20.9 or newer.
- npm 10 or newer.
- A Supabase project for persistence and authentication; public quote/news/fundamentals routes work without Supabase credentials.

## Installation

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Public-source routes work without Supabase. Personal workspace APIs return an explicit configuration/authentication error until Supabase is configured.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | For persistence/auth | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | For persistence/auth | Supabase publishable/anon key; RLS remains mandatory |
| `SEC_USER_AGENT` | Recommended | Identifying organisation and monitored contact email for SEC EDGAR requests |
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

The migration creates profiles, portfolios, holdings, transactions, watchlists/items, companies, financials, news, valuations, theses/events, alerts, settings, indexes, update triggers, and owner-scoped RLS policies. Provider-fed public data APIs are separate from account-owned records. The `users` profile row is provisioned by an Auth trigger.

## Application structure

```text
src/
	app/
		(workspace)/                 Research workspace routes
		api/[resource]/              Typed resource GET/POST API
		api/market/                  Nasdaq quote and company statistics
		api/analysis/[ticker]/       SEC companyfacts XBRL financial history
		api/news/                    Google News RSS and SEC filing feed
		api/screener/                SEC/Nasdaq fundamental calculations
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
| `/dashboard` | Public quotes/news plus private portfolio connection state |
| `/portfolio` | Account-owned holdings/transactions priced with Nasdaq quotes |
| `/portfolio/[ticker]` | Nasdaq quote summary and SEC issuer directory profile |
| `/watchlists` | Account-owned watchlists; empty until configured |
| `/analysis/[ticker]` | SEC XBRL annual financials and reported growth |
| `/valuation?ticker=MSFT` | Editable DCF, reported-year multiples, reverse DCF |
| `/news` | Google News publisher-linked headlines and SEC filings |
| `/thesis` | Account-owned investment theses and history |
| `/alerts` | Account-owned price, news, fundamentals, and thesis rules |
| `/screener` | Interactive SEC/Nasdaq quality and valuation filters |
| `/settings` | Actual Supabase/public-source configuration status |
| `/login`, `/register` | Email authentication |
| `/forgot-password`, `/reset-password` | Password recovery |

## API

`GET /api/market?tickers=MSFT,NVDA` returns Nasdaq quote/summary data, timestamp, and source link. `GET /api/analysis/MSFT` resolves a CIK and returns up to ten SEC XBRL annual periods. `GET /api/news?tickers=MSFT` merges Google News RSS headlines and SEC filings with publisher, date, and URL. `GET /api/screener` derives trailing ratios from SEC filings and Nasdaq market cap; metrics without a consistent public source are omitted. `GET /api/status` reports configured source availability without exposing environment values.

Personal resource endpoints (`/api/portfolio`, `/api/holdings`, `/api/transactions`, `/api/valuation`, `/api/watchlists`, `/api/thesis`, and `/api/alerts`) require Supabase authentication and rely on RLS for ownership. Validated `POST` creation is implemented for portfolios, holdings, transactions, watchlists, theses, alerts, and valuations. The initial account API intentionally limits results to 200 rows.

Authentication actions are `POST /api/auth/login`, `/register`, `/forgot-password`, `/update-password`, and `/logout`. Investment assistant requests use `POST /api/assistant` with a typed task and bounded context; the route returns `AI_PROVIDER_UNAVAILABLE` until a provider adapter is implemented.

## Development and deployment

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm start
```

For Vercel, import the repository, set `SEC_USER_AGENT` to an identifying organisation/contact, add Supabase environment variables if private data is needed, configure auth redirect URLs, deploy, and verify RLS with a non-admin account. Public-source API routes are server-rendered with cache windows appropriate to each source; interactive charts and filters load on the client. TanStack Query uses 60-second quote freshness and longer SEC/RSS stale windows.

## Data and model boundaries

Public market quotes and exchange statistics use Nasdaq's unauthenticated quote/summary endpoints. Annual financial facts, issuer CIK resolution, and recent filings use the SEC EDGAR company ticker directory, companyfacts XBRL API, and submissions API. Fiscal years are derived from SEC period-end dates; amendments are selected by latest filing date. Headlines are retrieved from Google News RSS with publisher and story-link attribution. Routes expose source timestamps, cache public responses, and show unavailable data rather than substitute sample values. SEC endpoints require an identifying User-Agent; set `SEC_USER_AGENT` to your organisation and monitored contact email. Public endpoint access and rate limits may change, and Nasdaq's public endpoint is not a contractual commercial data feed.

Public sources do not provide personal holdings, cost basis, thesis history, alert rules, all profile fields, verified moat/management ratings, or all forward estimates. These remain unpopulated until the user's Supabase account or a licensed data provider supplies them. The screener uses latest annual filing ratios, not forward consensus. The DCF is a simplified five-year FCFF estimate using reported base-year facts; it is not investment advice and should be reviewed for accounting, share-count, debt, tax, and terminal-value assumptions. The AI endpoint deliberately does not fabricate analysis when no provider is configured.

Before production, add external provider monitoring and retry/observability, authorization tests, transaction-to-holdings reconciliation, alert scheduling/delivery, durable thesis-event writes, AI privacy/rate limits, and end-to-end tests with a real Supabase project. The included public-source adapters and account-data boundaries are a production-oriented foundation, not a substitute for provider service-level guarantees.
