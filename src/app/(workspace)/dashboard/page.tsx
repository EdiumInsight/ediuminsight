"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, CalendarDays, Download, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { allocation, formatCurrency, holdings, newsItems, portfolioHistory, watchlistMovers } from "@/lib/data";

const metrics = [
  { label: "Portfolio value", value: "$96,384", delta: "+$1,284.62", percent: "+1.35%", positive: true },
  { label: "Today's gain / loss", value: "+$1,284", delta: "vs. prior close", percent: "+1.35%", positive: true },
  { label: "Total return", value: "+$18,240", delta: "Since inception", percent: "+23.4%", positive: true },
  { label: "Cash position", value: "$8,420", delta: "8.7% allocation", percent: "USD", positive: null },
  { label: "Dividend income", value: "$1,864", delta: "Trailing 12 months", percent: "+8.2% YoY", positive: true },
];

export default function DashboardPage() {
  const [period, setPeriod] = useState("3M");

  return (
    <main className="page-content">
      <div className="page-heading">
        <div><p className="eyebrow">SAMPLE SNAPSHOT · FEB 17, 2025 <span style={{ margin: "0 7px", color: "#465467" }}>/</span> MARKET OVERVIEW</p><h1 className="page-title">Good morning, Jordan</h1><p className="page-subtitle">Illustrative portfolio performance, outperformance versus the S&amp;P 500: 4.8% this quarter.</p></div>
        <div className="heading-actions"><button className="button"><CalendarDays /> Today</button><button className="button"><Download /> Export</button><button className="button button-primary"><Plus /> Add transaction</button></div>
      </div>

      <section className="metric-grid" aria-label="Portfolio summary">
        {metrics.map((metric) => <article className="metric-card" key={metric.label}><div className="metric-label">{metric.label}<span className="muted"><Sparkles size={13} /></span></div><div className="metric-value">{metric.value}</div><div className={`metric-change ${metric.positive === null ? "muted" : metric.positive ? "positive" : "negative"}`}>{metric.positive !== null && (metric.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />)}{metric.delta}<span className="muted">· {metric.percent}</span></div></article>)}
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel-heading"><div><h2 className="panel-title">Portfolio performance</h2><span className="panel-meta">VALUE · USD</span></div><div className="period-tabs">{["1M", "3M", "6M", "1Y", "ALL"].map((item) => <button key={item} onClick={() => setPeriod(item)} className={`period-tab${period === item ? " selected" : ""}`}>{item}</button>)}</div></div>
          <div className="panel-body"><div className="chart-legend"><span><i className="legend-mark" /> Portfolio</span><span><i className="legend-mark benchmark" /> S&amp;P 500</span><span className="mono" style={{ marginLeft: "auto", color: "var(--text)" }}>$96,384.20</span></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={portfolioHistory} margin={{ top: 12, right: 5, bottom: 0, left: 0 }}><defs><linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#75a9f9" stopOpacity={0.22} /><stop offset="100%" stopColor="#75a9f9" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#263344" strokeDasharray="3 5" vertical={false} /><XAxis dataKey="date" tick={{ fill: "#8390a0", fontSize: 9 }} axisLine={false} tickLine={false} interval={2} /><YAxis tick={{ fill: "#8390a0", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(value: number) => `$${value}k`} width={42} /><Tooltip contentStyle={{ background: "#111827", border: "1px solid #293544", borderRadius: 4, fontSize: 11 }} labelStyle={{ color: "#9ca3af" }} formatter={(value) => [`$${Number(value).toFixed(1)}k`, ""]} /><Area type="monotone" dataKey="benchmark" stroke="#9b8fd0" strokeWidth={1.5} fill="transparent" /><Area type="monotone" dataKey="portfolio" stroke="#75a9f9" strokeWidth={2} fill="url(#portfolioGradient)" /></AreaChart></ResponsiveContainer></div></div>
        </article>
        <article className="panel"><div className="panel-heading"><h2 className="panel-title">Portfolio allocation</h2><span className="panel-meta">BY SECTOR</span></div><div className="panel-body" style={{ paddingTop: 5 }}>{allocation.map((item) => <div className="allocation-row" key={item.name}><span>{item.name}</span><div className="allocation-track"><div className="allocation-fill" style={{ width: `${item.value}%`, "--allocation-color": item.color } as React.CSSProperties} /></div><span className="allocation-value">{item.value}%</span></div>)}<div style={{ borderTop: "1px solid var(--border)", marginTop: 20, paddingTop: 15, display: "flex", justifyContent: "space-between", color: "var(--muted)", fontSize: 10 }}><span>Largest position</span><span className="mono" style={{ color: "var(--text)" }}>MSFT · 18.7%</span></div></div></article>
      </section>

      <section className="two-column">
        <article className="panel"><div className="panel-heading"><div><h2 className="panel-title">Top holdings</h2><span className="panel-meta">8 POSITIONS · $87,258 TOTAL</span></div><Link className="panel-meta" href="/portfolio">View portfolio →</Link></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Company</th><th>Price</th><th>Day change</th><th>Market value</th><th>Weight</th></tr></thead><tbody>{holdings.slice(0, 5).map((holding) => <tr key={holding.ticker}><td><div className="ticker-name">{holding.ticker}</div><div className="company-name">{holding.company}</div></td><td className="mono">{formatCurrency(holding.price, 2)}</td><td className={`mono ${holding.change >= 0 ? "positive" : "negative"}`}>{holding.change >= 0 ? "+" : ""}{holding.change.toFixed(2)}%</td><td className="mono">{formatCurrency(holding.value)}</td><td className="mono">{holding.weight.toFixed(1)}%</td></tr>)}</tbody></table></div></article>
        <article className="panel"><div className="panel-heading"><h2 className="panel-title">Latest intelligence</h2><a className="panel-meta" href="/news">All news →</a></div><div className="feed-list">{newsItems.map((item) => <div className="feed-item" key={item.ticker}><div className="feed-title"><span className="mono" style={{ color: "var(--primary)", marginRight: 7 }}>{item.ticker}</span>{item.title}</div><span className={`sentiment${item.sentiment === "Neutral" ? " neutral" : ""}`}>{item.sentiment.toUpperCase()}</span><div className="feed-meta">{item.source} · {item.time}</div></div>)}</div></article>
      </section>

      <section className="two-column">
        <article className="panel"><div className="panel-heading"><h2 className="panel-title">Watchlist movers</h2><Link className="panel-meta" href="/watchlists">Open watchlists →</Link></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Company</th><th>Price</th><th>Today&apos;s move</th></tr></thead><tbody>{watchlistMovers.map((item) => <tr key={item.ticker}><td><span className="ticker-name">{item.ticker}</span><span className="company-name" style={{ display: "inline", marginLeft: 8 }}>{item.company}</span></td><td className="mono">{item.price}</td><td className={`mono ${item.change.startsWith("+") ? "positive" : "negative"}`}>{item.change}</td></tr>)}</tbody></table></div></article>
        <article className="panel"><div className="panel-heading"><h2 className="panel-title">Upcoming earnings</h2><span className="panel-meta">NEXT 7 DAYS</span></div><div className="feed-list"><div className="feed-item"><div className="feed-title"><span className="mono" style={{ color: "var(--text)", marginRight: 8 }}>NVDA</span>NVIDIA Corporation</div><span className="panel-meta">FEB 26</span><div className="feed-meta">After market close · Est. EPS $0.84</div></div><div className="feed-item"><div className="feed-title"><span className="mono" style={{ color: "var(--text)", marginRight: 8 }}>CRM</span>Salesforce, Inc.</div><span className="panel-meta">FEB 27</span><div className="feed-meta">After market close · Est. EPS $2.61</div></div></div></article>
      </section>
    </main>
  );
}