"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useFinancials, useMarketQuotes } from "@/hooks/use-market-data";

function billions(value: number | null) {
  return value === null ? "—" : `$${(value / 1e9).toFixed(1)}B`;
}

function percentage(value: number | null) {
  return value === null || !Number.isFinite(value) ? "—" : `${(value * 100).toFixed(1)}%`;
}

export default function AnalysisPage() {
  const { ticker } = useParams<{ ticker: string }>();
  const symbol = ticker.toUpperCase();
  const query = useFinancials(symbol);
  const quoteQuery = useMarketQuotes([symbol]);
  const financials = query.data?.financials ?? [];
  const latest = financials.at(-1);
  const firstRevenue = financials.find((row) => row.revenue !== null)?.revenue ?? null;
  const latestRevenue = latest?.revenue ?? null;
  const revenueCagr = firstRevenue && latestRevenue && financials.length > 1 ? (latestRevenue / firstRevenue) ** (1 / (financials.length - 1)) - 1 : null;
  const operatingMargin = latestRevenue && latest?.operatingIncome !== null && latest?.operatingIncome !== undefined ? latest.operatingIncome / latestRevenue : null;
  const fcfMargin = latestRevenue && latest?.freeCashFlow !== null && latest?.freeCashFlow !== undefined ? latest.freeCashFlow / latestRevenue : null;
  const chartData = financials.map((row) => ({ year: row.fiscalYear, revenue: row.revenue === null ? null : row.revenue / 1e9, freeCashFlow: row.freeCashFlow === null ? null : row.freeCashFlow / 1e9 }));
  const growthData = financials.slice(1).map((row, index) => {
    const previousRevenue = financials[index].revenue;
    return { year: row.fiscalYear, growth: row.revenue !== null && previousRevenue ? ((row.revenue / previousRevenue) - 1) * 100 : null };
  });
  const quote = quoteQuery.data?.data[0];

  return <main className="page-content"><div className="page-heading"><div><p className="eyebrow">SEC EDGAR · {symbol} · {financials.length || "—"} ANNUAL REPORTS</p><h1 className="page-title">Fundamental analysis</h1><p className="page-subtitle">Filed financial statements, with reported fiscal years and source links.</p></div><div className="heading-actions"><span className="badge">{quote?.price === null || quote?.price === undefined ? "QUOTE UNAVAILABLE" : `NASDAQ ${new Intl.NumberFormat("en-US", { style: "currency", currency: quote.currency }).format(quote.price)}`}</span><Link className="button button-primary" href={`/valuation?ticker=${symbol}`}>Open valuation →</Link></div></div>
    {query.isLoading && <div className="panel empty-note" aria-live="polite">Loading filed financials from SEC EDGAR…</div>}
    {query.error && <div className="panel empty-note data-error"><AlertCircle size={16} /><span>{query.error.message}</span><a href="https://www.sec.gov/edgar/search/" target="_blank" rel="noreferrer">Search SEC filings</a></div>}
    {latest && query.data && <>
      <section className="module-grid">{[
        { label: `Revenue · FY${latest.fiscalYear}`, value: billions(latest.revenue), note: "SEC reported" },
        { label: "Revenue CAGR · period", value: percentage(revenueCagr), note: `${financials.length} annual reports available` },
        { label: "Operating margin", value: percentage(operatingMargin), note: billions(latest.operatingIncome) },
        { label: "Free cash flow margin", value: percentage(fcfMargin), note: billions(latest.freeCashFlow) },
      ].map((item) => <article className="module-stat" key={item.label}><div className="module-stat-label">{item.label}</div><div className="module-stat-value">{item.value}</div><div className="module-stat-note">{item.note}</div></article>)}</section>
      <section className="dashboard-grid"><article className="panel"><div className="panel-heading"><div><h2 className="panel-title">Revenue and free cash flow</h2><span className="panel-meta">USD BILLIONS · FILED FISCAL YEARS</span></div></div><div className="panel-body"><div className="analysis-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData}><CartesianGrid stroke="#2b3b3d" strokeDasharray="3 5" vertical={false} /><XAxis dataKey="year" tick={{ fill: "#a0b0aa", fontSize: 9 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "#a0b0aa", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(value: number) => `$${value}`} width={38} /><Tooltip contentStyle={{ background: "#172126", border: "1px solid #3a4b4c", fontSize: 10 }} formatter={(value) => [value === null ? "Not reported" : `$${Number(value).toFixed(1)}B`, ""]} /><Line connectNulls type="monotone" dataKey="revenue" name="Revenue" stroke="#59d3bd" strokeWidth={2} dot={false} /><Line connectNulls type="monotone" dataKey="freeCashFlow" name="Free cash flow" stroke="#b6a4e8" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div></div></article>
        <article className="panel"><div className="panel-heading"><div><h2 className="panel-title">Moat assessment</h2><span className="panel-meta">NO PUBLIC STANDARDIZED SCORE</span></div></div><div className="panel-body data-unavailable"><AlertCircle size={17} /><strong>Not assessed</strong><p>SEC financial statements do not score brand, patents, switching costs or network effects. No analyst rating source is configured.</p></div></article></section>
      <section className="dashboard-grid"><article className="panel"><div className="panel-heading"><div><h2 className="panel-title">Annual financials</h2><span className="panel-meta">REPORTED USD · SOURCE: SEC EDGAR XBRL</span></div></div><div className="table-scroll"><table className="data-table"><thead><tr>{["Fiscal year", "Revenue", "Gross profit", "Operating income", "Net income", "Operating cash flow", "Capex", "Free cash flow", "Diluted EPS"].map((heading) => <th key={heading}>{heading}</th>)}</tr></thead><tbody>{financials.slice().reverse().map((row) => <tr key={row.fiscalYear}><td>{row.fiscalYear}</td><td className="mono">{billions(row.revenue)}</td><td className="mono">{billions(row.grossProfit)}</td><td className="mono">{billions(row.operatingIncome)}</td><td className="mono">{billions(row.netIncome)}</td><td className="mono">{billions(row.operatingCashFlow)}</td><td className="mono">{billions(row.capitalExpenditures)}</td><td className="mono">{billions(row.freeCashFlow)}</td><td className="mono">{row.dilutedEps === null ? "—" : `$${row.dilutedEps.toFixed(2)}`}</td></tr>)}</tbody></table></div></article>
        <article className="panel"><div className="panel-heading"><div><h2 className="panel-title">Growth profile</h2><span className="panel-meta">REVENUE GROWTH · YEAR OVER YEAR</span></div></div><div className="panel-body"><div className="analysis-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={growthData}><CartesianGrid stroke="#2b3b3d" strokeDasharray="3 5" vertical={false} /><XAxis dataKey="year" tick={{ fill: "#a0b0aa", fontSize: 9 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "#a0b0aa", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(value: number) => `${value}%`} width={38} /><Tooltip contentStyle={{ background: "#172126", border: "1px solid #3a4b4c", fontSize: 10 }} formatter={(value) => [value === null ? "Not reported" : `${Number(value).toFixed(1)}%`, "Revenue growth"]} /><Bar dataKey="growth" radius={[2, 2, 0, 0]}>{growthData.map((row) => <Cell key={row.year} fill={(row.growth ?? 0) >= 0 ? "#77cf9b" : "#ed897b"} />)}</Bar></BarChart></ResponsiveContainer></div></div></article></section>
      <div className="source-note">Source: <a href={query.data.source.url} target="_blank" rel="noreferrer">SEC EDGAR companyfacts ↗</a>. Values are reported GAAP facts in USD; free cash flow is calculated as operating cash flow less reported property/equipment purchases. Always verify in the original filing.</div>
    </>}
  </main>;
}