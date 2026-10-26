"use client";

import { useMemo, useState } from "react";

const universe = [
  { ticker: "GOOGL", company: "Alphabet Inc.", price: 191.42, roic: 28, growth: 13, fcf: 24, drawdown: -8, netCash: 72, debt: .08, pe: 21.8, ev: 17.4, cap: 2310 },
  { ticker: "ADBE", company: "Adobe Inc.", price: 438.22, roic: 31, growth: 11, fcf: 36, drawdown: -24, netCash: 6, debt: .42, pe: 22.7, ev: 18.3, cap: 190 },
  { ticker: "ASML", company: "ASML Holding", price: 742.60, roic: 35, growth: 18, fcf: 27, drawdown: -16, netCash: 4, debt: .18, pe: 28.4, ev: 25.1, cap: 292 },
  { ticker: "V", company: "Visa Inc.", price: 352.08, roic: 41, growth: 10, fcf: 51, drawdown: -7, netCash: -18, debt: .64, pe: 33.2, ev: 26.4, cap: 684 },
  { ticker: "AMZN", company: "Amazon.com Inc.", price: 228.93, roic: 18, growth: 12, fcf: 12, drawdown: -11, netCash: 42, debt: .29, pe: 34.8, ev: 19.3, cap: 2410 },
  { ticker: "META", company: "Meta Platforms", price: 719.80, roic: 38, growth: 21, fcf: 34, drawdown: -5, netCash: 53, debt: .12, pe: 27.1, ev: 19.0, cap: 1820 },
  { ticker: "NVO", company: "Novo Nordisk", price: 82.48, roic: 52, growth: 14, fcf: 30, drawdown: -38, netCash: 8, debt: .11, pe: 24.1, ev: 19.8, cap: 369 },
  { ticker: "TXN", company: "Texas Instruments", price: 184.62, roic: 27, growth: 5, fcf: 20, drawdown: -14, netCash: 4, debt: .52, pe: 34.2, ev: 22.1, cap: 168 },
];

export default function ScreenerPage() {
  const [minRoic, setMinRoic] = useState(10);
  const [minGrowth, setMinGrowth] = useState(5);
  const [minFcf, setMinFcf] = useState(10);
  const [maxPe, setMaxPe] = useState(40);
  const [maxDrawdown, setMaxDrawdown] = useState(50);
  const [netCash, setNetCash] = useState(false);
  const [query, setQuery] = useState("");
  const results = useMemo(() => universe.filter((item) => item.roic >= minRoic && item.growth >= minGrowth && item.fcf >= minFcf && item.pe <= maxPe && Math.abs(item.drawdown) <= maxDrawdown && (!netCash || item.netCash > 0) && `${item.ticker} ${item.company}`.toLowerCase().includes(query.toLowerCase())), [minRoic, minGrowth, minFcf, maxPe, maxDrawdown, netCash, query]);
  const filters = [{ label: "Minimum ROIC", value: minRoic, set: setMinRoic, min: 0, max: 60, suffix: "%" }, { label: "Revenue growth", value: minGrowth, set: setMinGrowth, min: 0, max: 40, suffix: "%" }, { label: "FCF margin", value: minFcf, set: setMinFcf, min: 0, max: 60, suffix: "%" }, { label: "Maximum P/E", value: maxPe, set: setMaxPe, min: 10, max: 60, suffix: "x" }, { label: "Maximum drawdown", value: maxDrawdown, set: setMaxDrawdown, min: 5, max: 60, suffix: "%" }];
  return <main className="page-content"><div className="page-heading"><div><p className="eyebrow">RESEARCH / IDEA GENERATION</p><h1 className="page-title">Opportunity screener</h1><p className="page-subtitle">Find quality businesses using the financial characteristics that matter to you.</p></div><span className="badge">SAMPLE UNIVERSE · 8 COMPANIES</span></div>
    <section className="screener-layout"><aside className="panel"><div className="panel-heading"><h2 className="panel-title">Fundamental filters</h2><button className="panel-meta" onClick={() => { setMinRoic(10); setMinGrowth(5); setMinFcf(10); setMaxPe(40); setMaxDrawdown(50); setNetCash(false); }}>RESET</button></div><div className="filter-stack">{filters.map((filter) => <label className="filter-item" key={filter.label}><span className="filter-head">{filter.label}<strong>{filter.value}{filter.suffix}</strong></span><input type="range" min={filter.min} max={filter.max} value={filter.value} onChange={(event) => filter.set(Number(event.target.value))} /></label>)}<label className="filter-head" style={{ alignItems: "center" }}>Net cash only <input type="checkbox" checked={netCash} onChange={(event) => setNetCash(event.target.checked)} /></label><label className="field-label">Market cap<select defaultValue="any"><option value="any">Any market cap</option><option>Above $10B</option><option>Above $100B</option></select></label></div></aside>
    <section className="panel"><div className="panel-heading"><div><h2 className="panel-title">Screen results</h2><span className="panel-meta">{results.length} COMPANIES MATCH YOUR FILTERS</span></div><button className="button">Save screen</button></div><div className="toolbar-row"><input className="text-control" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ticker or company" /><span className="panel-meta">SORTED BY ROIC</span></div><div className="table-scroll"><table className="data-table"><thead><tr>{["Company", "Price", "ROIC", "Revenue growth", "FCF margin", "Drawdown", "Net cash", "P/E", "EV / EBITDA"].map((heading) => <th key={heading}>{heading}</th>)}</tr></thead><tbody>{results.map((item) => <tr key={item.ticker}><td><span className="ticker-name">{item.ticker}</span><span className="company-name" style={{ display: "block" }}>{item.company}</span></td><td className="mono">${item.price.toFixed(2)}</td><td className="mono positive">{item.roic}%</td><td className="mono">{item.growth}%</td><td className="mono">{item.fcf}%</td><td className="mono negative">{item.drawdown}%</td><td className="mono">${item.netCash}B</td><td className="mono">{item.pe}x</td><td className="mono">{item.ev}x</td></tr>)}</tbody></table>{results.length === 0 && <div className="empty-note">No companies match all selected filters. Adjust the ranges to broaden your screen.</div>}</div><div className="panel-body"><p className="panel-meta" style={{ lineHeight: 1.6 }}>Screen results are illustrative and based on sample data. Connect a financial data provider to screen a live investment universe.</p></div></section></section>
  </main>;
}