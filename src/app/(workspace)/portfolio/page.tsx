"use client";

import Link from "next/link";
import { AlertCircle, BriefcaseBusiness } from "lucide-react";
import { useResource } from "@/hooks/use-resource";
import { useMarketQuotes } from "@/hooks/use-market-data";

type Portfolio = { id: string; name: string; base_currency: string };
type Holding = { id: string; portfolio_id: string; company_id: string; shares: number; average_cost: number };
type Company = { id: string; ticker: string; name: string; sector: string | null };
type Transaction = { id: string; type: string; amount: number; shares: number | null; price: number | null; transacted_at: string; company_id: string | null };

function dollars(value: number | null, currency = "USD") {
  return value === null || !Number.isFinite(value) ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(value);
}

export default function PortfolioPage() {
  const portfolioQuery = useResource<Portfolio>("portfolio");
  const holdingsQuery = useResource<Holding>("holdings");
  const companiesQuery = useResource<Company>("screener");
  const transactionsQuery = useResource<Transaction>("transactions");
  const portfolios = portfolioQuery.data?.data ?? [];
  const holdings = holdingsQuery.data?.data ?? [];
  const companies = companiesQuery.data?.data ?? [];
  const transactions = transactionsQuery.data?.data ?? [];
  const tickerByCompanyId = new Map(companies.map((company) => [company.id, company]));
  const tickers = [...new Set(holdings.map((holding) => tickerByCompanyId.get(holding.company_id)?.ticker).filter((ticker): ticker is string => Boolean(ticker)))];
  const quoteQuery = useMarketQuotes(tickers);
  const quoteByTicker = new Map((quoteQuery.data?.data ?? []).map((quote) => [quote.ticker, quote]));
  const valuedHoldings = holdings.map((holding) => {
    const company = tickerByCompanyId.get(holding.company_id);
    const quote = company ? quoteByTicker.get(company.ticker) : undefined;
    const marketValue = quote?.price === null || quote?.price === undefined ? null : quote.price * holding.shares;
    const costBasis = holding.average_cost * holding.shares;
    return { ...holding, company, quote, marketValue, costBasis, unrealized: marketValue === null ? null : marketValue - costBasis };
  });
  const totalMarketValue = valuedHoldings.reduce((total, holding) => total + (holding.marketValue ?? 0), 0);
  const totalCost = valuedHoldings.reduce((total, holding) => total + holding.costBasis, 0);
  const pricedCount = valuedHoldings.filter((holding) => holding.marketValue !== null).length;
  const hasDataError = [portfolioQuery.error, holdingsQuery.error, companiesQuery.error].find(Boolean);
  const accountCurrency = portfolios[0]?.base_currency ?? "USD";

  return <main className="page-content"><div className="page-heading"><div><p className="eyebrow">PRIVATE ACCOUNT DATA · SUPABASE / PUBLIC PRICES · NASDAQ</p><h1 className="page-title">Portfolio</h1><p className="page-subtitle">Personal positions come from your account; prices are fetched separately from Nasdaq.</p></div><Link className="button" href="/settings">Connection settings</Link></div>
    {portfolioQuery.isLoading && <div className="panel empty-note">Loading your portfolio records…</div>}
    {hasDataError && <div className="panel connection-state"><AlertCircle size={18} /><div><strong>Portfolio records are unavailable</strong><p>{hasDataError.message.includes("Supabase is not configured") ? "Configure Supabase URL and publishable key, then sign in. Personal holdings are never filled with public or demo positions." : hasDataError.message}</p><Link className="button button-primary" href="/settings">Check data connection</Link></div></div>}
    {!portfolioQuery.isLoading && !hasDataError && portfolios.length === 0 && <div className="panel connection-state"><div className="portfolio-empty-mark"><BriefcaseBusiness size={17} /></div><div><strong>No portfolio is linked to this account</strong><p>Personal holdings and transactions are private account data. Connect your Supabase account and record positions before market value or return calculations can be shown.</p><Link className="button button-primary" href="/settings">Configure Supabase</Link></div></div>}
    {portfolios.length > 0 && !hasDataError && <>
      <section className="module-grid">{[
        { label: "Market value · priced positions", value: dollars(totalMarketValue, accountCurrency), note: `${pricedCount} of ${holdings.length} holdings have a current quote` },
        { label: "Cost basis · recorded holdings", value: dollars(totalCost, accountCurrency), note: "Calculated from your average cost and shares" },
        { label: "Unrealized P/L", value: pricedCount === holdings.length ? dollars(totalMarketValue - totalCost, accountCurrency) : "Incomplete", note: "Requires a current quote for every holding" },
        { label: "Cash / total return", value: "Not calculated", note: "Requires complete transaction history and contributions" },
      ].map((item) => <article className="module-stat" key={item.label}><div className="module-stat-label">{item.label}</div><div className="module-stat-value">{item.value}</div><div className="module-stat-note">{item.note}</div></article>)}</section>
      <section className="panel"><div className="panel-heading"><div><h2 className="panel-title">Holdings</h2><span className="panel-meta">{holdings.length} ACCOUNT RECORDS · LIVE PRICE SOURCE: NASDAQ</span></div></div>{holdingsQuery.isLoading && <div className="empty-note">Loading your holdings…</div>}{holdings.length === 0 && <div className="empty-note">This portfolio has no holdings recorded.</div>}{holdings.length > 0 && <div className="table-scroll"><table className="data-table"><thead><tr>{["Company", "Shares", "Average cost", "Current price", "Market value", "Unrealized P/L", "Weight"].map((heading) => <th key={heading}>{heading}</th>)}</tr></thead><tbody>{valuedHoldings.map((holding) => { const weight = holding.marketValue !== null && totalMarketValue ? holding.marketValue / totalMarketValue * 100 : null; return <tr key={holding.id}><td>{holding.company ? <Link href={`/portfolio/${holding.company.ticker}`}><span className="ticker-name">{holding.company.ticker}</span><span className="company-name" style={{ display: "block" }}>{holding.company.name}</span></Link> : <span className="feed-meta">Company metadata unavailable</span>}</td><td className="mono">{holding.shares}</td><td className="mono">{dollars(holding.average_cost, accountCurrency)}</td><td className="mono">{dollars(holding.quote?.price ?? null)}</td><td className="mono">{dollars(holding.marketValue, accountCurrency)}</td><td className={`mono ${holding.unrealized === null ? "muted" : holding.unrealized >= 0 ? "positive" : "negative"}`}>{dollars(holding.unrealized, accountCurrency)}</td><td className="mono">{weight === null ? "—" : `${weight.toFixed(1)}%`}</td></tr>; })}</tbody></table></div>}<div className="source-note">Quotes are provided by Nasdaq; price time and real-time status are available per security. Cash and returns are withheld when the transaction history cannot substantiate them.</div></section>
      <section className="panel section-gap"><div className="panel-heading"><div><h2 className="panel-title">Recent transactions</h2><span className="panel-meta">PRIVATE ACCOUNT RECORDS</span></div></div>{transactionsQuery.isLoading && <div className="empty-note">Loading transactions…</div>}{transactions.length === 0 && !transactionsQuery.isLoading && <div className="empty-note">No transactions have been recorded for this account.</div>}{transactions.length > 0 && <div className="table-scroll"><table className="data-table"><thead><tr>{["Date", "Type", "Ticker", "Shares", "Price", "Amount"].map((heading) => <th key={heading}>{heading}</th>)}</tr></thead><tbody>{transactions.slice().sort((a, b) => b.transacted_at.localeCompare(a.transacted_at)).map((transaction) => { const company = transaction.company_id ? tickerByCompanyId.get(transaction.company_id) : null; return <tr key={transaction.id}><td>{new Date(transaction.transacted_at).toLocaleDateString()}</td><td><span className="badge">{transaction.type}</span></td><td>{company?.ticker ?? "—"}</td><td className="mono">{transaction.shares ?? "—"}</td><td className="mono">{dollars(transaction.price)}</td><td className="mono">{dollars(transaction.amount, accountCurrency)}</td></tr>; })}</tbody></table></div>}</section>
    </>}
  </main>;
}