"use client";

import { useMemo, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

type ScreenCompany = {
  ticker: string;
  company: string;
  price: number | null;
  marketCap: number | null;
  revenueGrowth: number | null;
  fcfMargin: number | null;
  annualPe: number | null;
  netCash: number | null;
  returnOnInvestedCapital: number | null;
  maxDrawdown: number | null;
  reportedFiscalYear: number;
  revenueGrowthFiscalYear: number | null;
  sources: string[];
  error?: string;
};

function dollars(value: number | null, digits = 1) {
  return value === null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: digits }).format(value);
}

function billions(value: number | null) {
  return value === null ? "—" : `$${(value / 1e9).toFixed(1)}B`;
}

export default function ScreenerPage() {
  const [minimumGrowth, setMinimumGrowth] = useState(0);
  const [minimumFcfMargin, setMinimumFcfMargin] = useState(0);
  const [maximumPe, setMaximumPe] = useState(60);
  const [minimumMarketCap, setMinimumMarketCap] = useState(0);
  const [positiveNetCashOnly, setPositiveNetCashOnly] = useState(false);
  const [search, setSearch] = useState("");
  const query = useQuery<{ data: ScreenCompany[]; fetchedAt: string; limitations: string[] }>({
    queryKey: ["public-screener"],
    queryFn: async () => {
      const response = await fetch("/api/screener");
      if (!response.ok) throw new Error("SEC/Nasdaq screener data is currently unavailable.");
      return response.json();
    },
    staleTime: 3_600_000,
  });
  const companies = query.data?.data;
  const results = useMemo(() => (companies ?? []).filter((company) => {
    const textMatch = `${company.ticker} ${company.company}`.toLowerCase().includes(search.toLowerCase());
    const growthMatch = company.revenueGrowth !== null && company.revenueGrowth * 100 >= minimumGrowth;
    const fcfMatch = company.fcfMargin !== null && company.fcfMargin * 100 >= minimumFcfMargin;
    const peMatch = company.annualPe !== null && company.annualPe <= maximumPe;
    const capMatch = minimumMarketCap === 0 || (company.marketCap !== null && company.marketCap / 1e9 >= minimumMarketCap);
    const cashMatch = !positiveNetCashOnly || (company.netCash !== null && company.netCash > 0);
    return textMatch && growthMatch && fcfMatch && peMatch && capMatch && cashMatch;
  }), [companies, search, minimumGrowth, minimumFcfMargin, maximumPe, minimumMarketCap, positiveNetCashOnly]);

  return <main className="page-content"><div className="page-heading"><div><p className="eyebrow">PUBLIC DATA · SEC EDGAR / NASDAQ</p><h1 className="page-title">Opportunity screener</h1><p className="page-subtitle">Screen a focused universe using the latest filed annuals and current exchange statistics.</p></div><div className="heading-actions"><span className="badge">{query.data?.fetchedAt ? `UPDATED ${new Date(query.data.fetchedAt).toLocaleTimeString()}` : "PUBLIC SOURCES"}</span><button className="button" onClick={() => query.refetch()} disabled={query.isFetching}><RefreshCw size={13} />Refresh</button></div></div>
    <section className="screener-layout"><aside className="panel"><div className="panel-heading"><h2 className="panel-title">Combined filters</h2><button className="panel-meta" onClick={() => { setMinimumGrowth(0); setMinimumFcfMargin(0); setMaximumPe(60); setMinimumMarketCap(0); setPositiveNetCashOnly(false); setSearch(""); }}>RESET</button></div><div className="filter-stack"><label className="filter-item"><span className="filter-head">Min. revenue growth <strong>{minimumGrowth}%</strong></span><input type="range" min="0" max="60" value={minimumGrowth} onChange={(event) => setMinimumGrowth(Number(event.target.value))} /></label><label className="filter-item"><span className="filter-head">Min. FCF margin <strong>{minimumFcfMargin}%</strong></span><input type="range" min="0" max="60" value={minimumFcfMargin} onChange={(event) => setMinimumFcfMargin(Number(event.target.value))} /></label><label className="filter-item"><span className="filter-head">Max. annual P/E <strong>{maximumPe}x</strong></span><input type="range" min="5" max="60" value={maximumPe} onChange={(event) => setMaximumPe(Number(event.target.value))} /></label><label className="filter-item"><span className="filter-head">Min. market cap <strong>${minimumMarketCap}B</strong></span><input type="range" min="0" max="1000" step="25" value={minimumMarketCap} onChange={(event) => setMinimumMarketCap(Number(event.target.value))} /></label><label className="filter-head filter-checkbox">Positive net cash only<input type="checkbox" checked={positiveNetCashOnly} onChange={(event) => setPositiveNetCashOnly(event.target.checked)} /></label><div className="unavailable-metrics"><strong>Not available from selected free sources</strong><span>ROIC · historical maximum drawdown · forward P/E · EV/EBITDA</span></div></div></aside>
    <section className="panel"><div className="panel-heading"><div><h2 className="panel-title">Screen results</h2><span className="panel-meta">{results.length} / {companies?.length ?? 0} ISSUERS MATCH</span></div><span className="panel-meta">{query.data?.data.length ? `${new Set(query.data.data.flatMap((company) => company.sources)).size} SOURCES` : ""}</span></div><div className="toolbar-row"><input className="text-control" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search ticker or company" aria-label="Search ticker or company" /><span className="panel-meta">Universe: major US issuers</span></div>
      {query.isLoading && <div className="empty-note">Loading issuer facts from SEC and Nasdaq…</div>}
      {query.error && <div className="empty-note data-error"><AlertCircle size={16} />{query.error.message}</div>}
      {!query.isLoading && !query.error && <div className="table-scroll"><table className="data-table"><thead><tr>{["Issuer", "Last price", "Market cap", "Revenue growth", "FCF margin", "Annual P/E", "Net cash", "Filed FY"].map((heading) => <th key={heading}>{heading}</th>)}</tr></thead><tbody>{results.map((company) => <tr key={company.ticker}><td><span className="ticker-name">{company.ticker}</span><span className="company-name" style={{ display: "block" }}>{company.company}</span></td><td className="mono">{dollars(company.price, 2)}</td><td className="mono">{billions(company.marketCap)}</td><td className="mono">{company.revenueGrowth === null ? "—" : `${(company.revenueGrowth * 100).toFixed(1)}%`}</td><td className="mono">{company.fcfMargin === null ? "—" : `${(company.fcfMargin * 100).toFixed(1)}%`}</td><td className="mono">{company.annualPe === null ? "—" : `${company.annualPe.toFixed(1)}x`}</td><td className="mono">{billions(company.netCash)}</td><td>{company.reportedFiscalYear}</td></tr>)}</tbody></table>{results.length === 0 && <div className="empty-note">No issuers match these filters, or the public endpoints returned no usable records.</div>}</div>}
      {query.data?.limitations.map((limitation) => <div className="source-note" key={limitation}>{limitation}</div>)}
      <div className="source-note">Revenue growth and cash flow margin: latest reported SEC fiscal years. P/E: Nasdaq market cap divided by latest annual SEC net income, not forward earnings. Each displayed ratio is intentionally labeled with its underlying period.</div>
    </section></section>
  </main>;
}