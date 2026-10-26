"use client";

import { useEffect, useMemo, useState } from "react";

function estimateValue(growth: number, margin: number, tax: number, discount: number, terminal: number) {
  const revenue = 245.1;
  const shares = 7.43;
  const cashNetDebt = 51.4;
  let presentValue = 0;
  for (let year = 1; year <= 5; year += 1) {
    const freeCashFlow = revenue * (1 + growth / 100) ** year * (margin / 100) * (1 - tax / 100);
    presentValue += freeCashFlow / (1 + discount / 100) ** year;
  }
  const yearFiveFcf = revenue * (1 + growth / 100) ** 5 * (margin / 100) * (1 - tax / 100);
  const terminalValue = yearFiveFcf * (1 + terminal / 100) / ((discount - terminal) / 100);
  return (presentValue + terminalValue / (1 + discount / 100) ** 5 + cashNetDebt) / shares;
}

export default function ValuationPage() {
  const [ticker, setTicker] = useState("MSFT");
  const [growth, setGrowth] = useState(12);
  const [margin, setMargin] = useState(31);
  const [tax, setTax] = useState(16);
  const [discount, setDiscount] = useState(9);
  const [terminal, setTerminal] = useState(3);
  useEffect(() => {
    setTicker(new URLSearchParams(window.location.search).get("ticker") || "MSFT");
  }, []);
  const currentPrice = 428.76;
  const fairValue = useMemo(() => estimateValue(growth, margin, tax, discount, terminal), [growth, margin, tax, discount, terminal]);
  const marginOfSafety = (fairValue / currentPrice - 1) * 100;
  const scenarios = [
    { name: "Bear case", value: estimateValue(Math.max(2, growth - 5), margin - 4, tax + 2, discount + 1.5, Math.max(1, terminal - 1)) },
    { name: "Base case", value: fairValue },
    { name: "Bull case", value: estimateValue(growth + 4, margin + 2, Math.max(10, tax - 1), discount - 1, terminal + 0.5) },
  ];
  let low = 0; let high = 50;
  for (let iteration = 0; iteration < 35; iteration += 1) {
    const mid = (low + high) / 2;
    if (estimateValue(mid, margin, tax, discount, terminal) < currentPrice) low = mid;
    else high = mid;
  }
  const sliders = [
    { label: "Revenue growth", value: growth, set: setGrowth, min: 0, max: 30, suffix: "%" },
    { label: "FCF margin", value: margin, set: setMargin, min: 5, max: 45, suffix: "%" },
    { label: "Tax rate", value: tax, set: setTax, min: 0, max: 35, suffix: "%" },
    { label: "Discount rate", value: discount, set: setDiscount, min: 5, max: 18, suffix: "%" },
    { label: "Terminal growth", value: terminal, set: setTerminal, min: 0, max: 5, suffix: "%" },
  ];
  return <main className="page-content"><div className="page-heading"><div><p className="eyebrow">RESEARCH / VALUATION LAB / {ticker}</p><h1 className="page-title">Valuation workspace</h1><p className="page-subtitle">Explore intrinsic value across discounted cash flow and market multiple methods.</p></div><span className="badge warning">ILLUSTRATIVE MODEL</span></div>
    <div className="research-tabs"><a className="active" href="#dcf">DCF model</a><a href="#multiples">Trading multiples</a><a href="#reverse-dcf">Reverse DCF</a></div>
    <section className="valuation-layout section-gap" id="dcf"><article className="panel"><div className="panel-heading"><div><h2 className="panel-title">Discounted cash flow</h2><span className="panel-meta">5-YEAR EXPLICIT PERIOD · USD</span></div><span className="badge">{ticker} · $428.76</span></div><div className="panel-body"><div className="valuation-inputs">{sliders.map((item) => <label className="field-label" key={item.label}>{item.label}<span className="range-control"><input type="range" min={item.min} max={item.max} value={item.value} onChange={(event) => item.set(Number(event.target.value))} /><span className="range-value">{item.value}{item.suffix}</span></span></label>)}</div><div style={{ display: "flex", gap: 8, marginTop: 18 }}><button className="button button-primary">Save assumptions</button><button className="button" onClick={() => { setGrowth(12); setMargin(31); setTax(16); setDiscount(9); setTerminal(3); }}>Reset</button></div></div></article>
      <article className="panel"><div className="panel-heading"><div><h2 className="panel-title">Intrinsic value estimate</h2><span className="panel-meta">PER SHARE · BASE CASE</span></div></div><div className="panel-body"><div className="metric-value" style={{ marginTop: 0, fontSize: 32 }}>${fairValue.toFixed(2)}</div><div className={`metric-change ${marginOfSafety >= 0 ? "positive" : "negative"}`}>{marginOfSafety >= 0 ? "Undervalued" : "Above fair value"}<span className="muted">· {marginOfSafety.toFixed(1)}% vs. market price</span></div><div className="progress-line" style={{ margin: "20px 0 15px" }}><span style={{ width: `${Math.min(100, Math.max(5, (fairValue / (currentPrice * 1.5)) * 100))}%` }} /></div><div className="scenario-grid">{scenarios.map((scenario) => <div className="scenario" key={scenario.name}><span>{scenario.name}</span><strong>${scenario.value.toFixed(0)}</strong></div>)}</div><p className="panel-meta" style={{ lineHeight: 1.6, marginTop: 16 }}>Based on unverified illustrative assumptions. Not investment advice or a price target.</p></div></article></section>
    <section className="dashboard-grid section-gap" id="multiples"><article className="panel"><div className="panel-heading"><div><h2 className="panel-title">Trading multiples</h2><span className="panel-meta">CURRENT · FORWARD · PEER MEDIAN</span></div></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Multiple</th><th>Current</th><th>Forward</th><th>Peer median</th><th>Assessment</th></tr></thead><tbody>{[["P/E", "36.3x", "32.1x", "29.4x", "Premium"], ["EV / EBITDA", "24.8x", "21.7x", "20.2x", "Premium"], ["Price / Sales", "13.0x", "11.8x", "10.4x", "Premium"], ["Price / FCF", "43.1x", "37.9x", "35.2x", "Premium"], ["PEG", "2.1x", "1.9x", "2.3x", "In range"]].map((row) => <tr key={row[0]}>{row.map((cell, index) => <td className={index === 4 ? (cell === "In range" ? "positive" : "muted") : index > 0 ? "mono" : "ticker-name"} key={index}>{cell}</td>)}</tr>)}</tbody></table></div></article><article className="panel" id="reverse-dcf"><div className="panel-heading"><div><h2 className="panel-title">Reverse DCF</h2><span className="panel-meta">GROWTH IMPLIED BY CURRENT PRICE</span></div></div><div className="panel-body"><div className="metric-value" style={{ marginTop: 0, fontSize: 30 }}>{high.toFixed(1)}%</div><p className="page-subtitle" style={{ lineHeight: 1.7 }}>The current price of <span className="mono" style={{ color: "var(--text)" }}>$428.76</span> implies approximately <span className="mono" style={{ color: "var(--text)" }}>{high.toFixed(1)}%</span> annual revenue growth over five years, using your current margin, tax, discount, and terminal assumptions.</p><div className="metric-pills" style={{ marginTop: 15 }}><span className="metric-pill">5-YEAR HORIZON</span><span className="metric-pill">FCF CONVERSION 31%</span></div></div></article></section>
  </main>;
}