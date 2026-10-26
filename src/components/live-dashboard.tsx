"use client";

import Link from "next/link";
import { AlertCircle, Clock3, ExternalLink, Plus } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useMarketNews, useMarketQuotes } from "@/hooks/use-market-data";

const trackedTickers = ["MSFT", "NVDA", "BRK.B", "V", "COST", "AMZN", "GOOGL", "LLY"];

function price(value: number | null, currency: string) {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function QuoteStatus({ loading, error }: { loading: boolean; error?: string }) {
  if (loading) return <div className="empty-note" aria-live="polite">Loading public market quotes…</div>;
  if (error) return <div className="empty-note data-error"><AlertCircle size={15} />{error}</div>;
  return null;
}

export function LiveDashboard() {
  const quotesQuery = useMarketQuotes(trackedTickers);
  const newsQuery = useMarketNews(trackedTickers.slice(0, 4));
  const quotes = quotesQuery.data?.data ?? [];
  const available = quotes.filter((quote) => quote.price !== null);
  const advancers = available.filter((quote) => (quote.change ?? 0) > 0).length;
  const decliners = available.filter((quote) => (quote.change ?? 0) < 0).length;
  const biggestMove = available.reduce<(typeof available)[number] | null>((best, quote) => !best || Math.abs(quote.changePercent ?? 0) > Math.abs(best.changePercent ?? 0) ? quote : best, null);
  const chartData = available.map((quote) => ({ ticker: quote.ticker, change: quote.changePercent ?? 0 }));
  const news = newsQuery.data?.data ?? [];

  return <main className="page-content">
    <div className="page-heading"><div><p className="eyebrow">PUBLIC MARKET DATA · NASDAQ / SEC EDGAR / GOOGLE NEWS</p><h1 className="page-title">Market intelligence</h1><p className="page-subtitle">Public quotes and reported company information. Your personal portfolio is not connected.</p></div><div className="heading-actions"><Link className="button" href="/news">Open news feed <ExternalLink size={13} /></Link><Link className="button button-primary" href="/settings"><Plus />Connect workspace</Link></div></div>

    <section className="metric-grid" aria-label="Market summary">
      {[
        { label: "Quotes available", value: `${available.length} / ${trackedTickers.length}`, note: "Nasdaq quote endpoint", tone: "teal" },
        { label: "Advancers", value: String(advancers), note: "Tracked symbols", tone: "green" },
        { label: "Decliners", value: String(decliners), note: "Tracked symbols", tone: "coral" },
        { label: "Largest move", value: biggestMove ? `${biggestMove.changePercent! > 0 ? "+" : ""}${biggestMove.changePercent?.toFixed(2)}%` : "—", note: biggestMove?.ticker ?? "Awaiting quote data", tone: "violet" },
        { label: "Portfolio value", value: "Not connected", note: "Connect Supabase to load holdings", tone: "amber" },
      ].map((metric) => <article className={`metric-card metric-${metric.tone}`} key={metric.label}><div className="metric-label">{metric.label}<Clock3 size={13} /></div><div className="metric-value metric-compact-value">{metric.value}</div><div className="metric-change muted">{metric.note}</div></article>)}
    </section>

    <section className="dashboard-grid">
      <article className="panel"><div className="panel-heading"><div><h2 className="panel-title">Daily price change</h2><span className="panel-meta">SOURCE: NASDAQ · LAST TRADE</span></div><span className="badge">{quotesQuery.data?.fetchedAt ? `UPDATED ${new Date(quotesQuery.data.fetchedAt).toLocaleTimeString()}` : "LIVE SOURCE"}</span></div><QuoteStatus loading={quotesQuery.isLoading} error={quotesQuery.error?.message} />{chartData.length > 0 && <div className="panel-body"><div className="analysis-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 8, right: 6, bottom: 0, left: -18 }}><CartesianGrid stroke="#2b3b3d" strokeDasharray="3 5" vertical={false} /><XAxis dataKey="ticker" tick={{ fill: "#a0b0aa", fontSize: 9 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "#a0b0aa", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(value: number) => `${value}%`} /><Tooltip contentStyle={{ background: "#172126", border: "1px solid #3a4b4c", fontSize: 10 }} formatter={(value) => [`${Number(value).toFixed(2)}%`, "Day change"]} /><Bar dataKey="change" radius={[2, 2, 0, 0]}>{chartData.map((item) => <Cell key={item.ticker} fill={item.change >= 0 ? "#77cf9b" : "#ed897b"} />)}</Bar></BarChart></ResponsiveContainer></div></div>}</article>
      <article className="panel"><div className="panel-heading"><div><h2 className="panel-title">Personal portfolio</h2><span className="panel-meta">USER DATA</span></div><span className="badge warning">NOT CONNECTED</span></div><div className="panel-body portfolio-empty"><div className="portfolio-empty-mark"><Plus size={18} /></div><strong>No portfolio data available</strong><p>Holdings, cash and performance belong to your account. Connect Supabase and add your transactions to calculate them accurately.</p><Link className="button button-primary" href="/settings">Configure data connection</Link></div></article>
    </section>

    <section className="two-column">
      <article className="panel"><div className="panel-heading"><div><h2 className="panel-title">Tracked securities</h2><span className="panel-meta">PUBLIC QUOTES · ATTRIBUTED TO NASDAQ</span></div><Link className="panel-meta" href="/watchlists">Watchlist settings →</Link></div><QuoteStatus loading={quotesQuery.isLoading} error={quotesQuery.error?.message} />{available.length > 0 && <div className="table-scroll"><table className="data-table"><thead><tr><th>Company</th><th>Last price</th><th>Day change</th><th>Quote time</th></tr></thead><tbody>{available.map((quote) => <tr key={quote.ticker}><td><span className="ticker-name">{quote.ticker}</span><span className="company-name" style={{ display: "block" }}>{quote.companyName ?? "Company name unavailable"}</span></td><td className="mono">{price(quote.price, quote.currency)}</td><td className={`mono ${(quote.changePercent ?? 0) >= 0 ? "positive" : "negative"}`}>{quote.changePercent === null ? "—" : `${quote.changePercent > 0 ? "+" : ""}${quote.changePercent.toFixed(2)}%`}</td><td className="feed-meta">{quote.observedAt ? new Date(quote.observedAt).toLocaleString() : "Time unavailable"}{quote.isRealtime === false ? " · delayed/close" : ""}</td></tr>)}</tbody></table></div>}<div className="source-note">Quotes: <a href="https://www.nasdaq.com/market-activity/stocks" target="_blank" rel="noreferrer">Nasdaq market data ↗</a>. Timestamp and real-time status are returned by the source.</div></article>
      <article className="panel"><div className="panel-heading"><div><h2 className="panel-title">Latest headlines</h2><span className="panel-meta">GOOGLE NEWS RSS · SEC FILINGS</span></div><Link className="panel-meta" href="/news">Full feed →</Link></div>{newsQuery.isLoading && <div className="empty-note">Loading linked headlines…</div>}{newsQuery.error && <div className="empty-note data-error">{newsQuery.error.message}</div>}{news.length === 0 && !newsQuery.isLoading && !newsQuery.error && <div className="empty-note">No headlines were returned for these symbols.</div>}<div className="feed-list">{news.slice(0, 5).map((item) => <a className="feed-item feed-link" href={item.url} key={item.url} target="_blank" rel="noreferrer"><span className="feed-title"><span className="mono ticker-inline">{item.ticker}</span>{item.headline}</span><span className="badge">{item.category}</span><span className="feed-meta">{item.source} · {item.publishedAt ? new Date(item.publishedAt).toLocaleString() : "Date unavailable"}</span></a>)}</div><div className="source-note">Sentiment is not inferred. Headlines open at their attributed publisher.</div></article>
    </section>
  </main>;
}