"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useFinancials, useMarketQuotes } from "@/hooks/use-market-data";

type DcfInputs = { revenueGrowth: number; operatingMargin: number; taxRate: number; discountRate: number; terminalGrowth: number };

function estimateValue(revenue: number, shares: number, netCash: number, fcfConversion: number, inputs: DcfInputs) {
  if (inputs.discountRate <= inputs.terminalGrowth) return null;
  let presentValue = 0;
  for (let year = 1; year <= 5; year += 1) {
    const projectedRevenue = revenue * (1 + inputs.revenueGrowth / 100) ** year;
    const freeCashFlow = projectedRevenue * (inputs.operatingMargin / 100) * (1 - inputs.taxRate / 100) * fcfConversion;
    presentValue += freeCashFlow / (1 + inputs.discountRate / 100) ** year;
  }
  const yearFiveRevenue = revenue * (1 + inputs.revenueGrowth / 100) ** 5;
  const terminalFcf = yearFiveRevenue * (inputs.operatingMargin / 100) * (1 - inputs.taxRate / 100) * fcfConversion;
  const terminalValue = terminalFcf * (1 + inputs.terminalGrowth / 100) / ((inputs.discountRate - inputs.terminalGrowth) / 100);
  return (presentValue + terminalValue / (1 + inputs.discountRate / 100) ** 5 + netCash) / shares;
}

function money(value: number | null, digits = 2) {
  return value === null || !Number.isFinite(value) ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
}

export default function ValuationPage() {
  const [ticker, setTicker] = useState("MSFT");
  const [initializedTicker, setInitializedTicker] = useState("");
  const [inputs, setInputs] = useState<DcfInputs>({ revenueGrowth: 10, operatingMargin: 20, taxRate: 21, discountRate: 9, terminalGrowth: 3 });
  useEffect(() => { setTicker(new URLSearchParams(window.location.search).get("ticker")?.toUpperCase() || "MSFT"); }, []);
  const financialQuery = useFinancials(ticker);
  const quoteQuery = useMarketQuotes([ticker]);
  const financials = financialQuery.data?.financials ?? [];
  const latest = financials.at(-1);
  const previous = financials.at(-2);
  const revenueBillions = latest?.revenue === null || latest?.revenue === undefined ? null : latest.revenue / 1e9;
  const operatingMargin = latest?.revenue && latest.operatingIncome !== null ? latest.operatingIncome / latest.revenue : null;
  const reportedTax = latest?.incomeBeforeTax && latest.incomeTaxExpense !== null ? Math.min(45, Math.max(0, latest.incomeTaxExpense / latest.incomeBeforeTax * 100)) : null;
  const latestNopat = latest?.operatingIncome !== null && latest?.operatingIncome !== undefined ? latest.operatingIncome * (1 - (reportedTax ?? 21) / 100) : null;
  const fcfConversion = latestNopat && latest?.freeCashFlow !== null && latest?.freeCashFlow !== undefined ? latest.freeCashFlow / latestNopat : null;
  const quote = quoteQuery.data?.data[0];
  const price = quote?.price ?? null;
  const sharesBillions = latest?.sharesOutstanding ? latest.sharesOutstanding / 1e9 : quote?.marketCap && price ? quote.marketCap / price / 1e9 : null;
  const netCashBillions = latest?.cash !== null && latest?.cash !== undefined && latest.debt !== null ? (latest.cash - latest.debt) / 1e9 : null;
  const revenueGrowth = latest?.revenue && previous?.revenue ? (latest.revenue / previous.revenue - 1) * 100 : null;

  useEffect(() => {
    if (!latest || initializedTicker === ticker) return;
    setInputs((current) => ({
      ...current,
      revenueGrowth: revenueGrowth === null ? current.revenueGrowth : Math.min(30, Math.max(0, revenueGrowth)),
      operatingMargin: operatingMargin === null ? current.operatingMargin : Math.min(60, Math.max(0, operatingMargin * 100)),
      taxRate: reportedTax ?? current.taxRate,
    }));
    setInitializedTicker(ticker);
  }, [latest, ticker, initializedTicker, revenueGrowth, operatingMargin, reportedTax]);

  const modelAvailable = revenueBillions !== null && sharesBillions !== null && netCashBillions !== null && fcfConversion !== null && fcfConversion > 0;
  const fairValue = useMemo(() => modelAvailable ? estimateValue(revenueBillions, sharesBillions, netCashBillions, fcfConversion, inputs) : null, [modelAvailable, revenueBillions, sharesBillions, netCashBillions, fcfConversion, inputs]);
  const marginOfSafety = fairValue !== null && price ? (fairValue / price - 1) * 100 : null;
  const scenarios = modelAvailable ? [
    { name: "Bear", value: estimateValue(revenueBillions, sharesBillions, netCashBillions, fcfConversion, { ...inputs, revenueGrowth: Math.max(0, inputs.revenueGrowth - 5), operatingMargin: Math.max(0, inputs.operatingMargin - 3), discountRate: inputs.discountRate + 1, terminalGrowth: Math.max(0, inputs.terminalGrowth - 1) }) },
    { name: "Base", value: fairValue },
    { name: "Bull", value: estimateValue(revenueBillions, sharesBillions, netCashBillions, fcfConversion, { ...inputs, revenueGrowth: inputs.revenueGrowth + 4, operatingMargin: inputs.operatingMargin + 2, discountRate: Math.max(inputs.terminalGrowth + 1, inputs.discountRate - 1), terminalGrowth: inputs.terminalGrowth + 0.5 }) },
  ] : [];

  let impliedGrowth: number | null = null;
  if (modelAvailable && price) {
    let low = 0; let high = 50;
    for (let iteration = 0; iteration < 35; iteration += 1) {
      const mid = (low + high) / 2;
      const value = estimateValue(revenueBillions, sharesBillions, netCashBillions, fcfConversion, { ...inputs, revenueGrowth: mid });
      if (value !== null && value < price) low = mid;
      else high = mid;
    }
    impliedGrowth = high;
  }

  const marketCap = quote?.marketCap ?? null;
  const pe = marketCap !== null && latest?.netIncome ? marketCap / latest.netIncome : null;
  const priceSales = marketCap !== null && latest?.revenue ? marketCap / latest.revenue : null;
  const priceFcf = marketCap !== null && latest?.freeCashFlow ? marketCap / latest.freeCashFlow : null;
  const controls: { key: keyof DcfInputs; label: string; min: number; max: number; step?: number; note: string }[] = [
    { key: "revenueGrowth", label: "Revenue growth", min: 0, max: 30, note: "Your assumption · recent reported growth: " + (revenueGrowth === null ? "—" : `${revenueGrowth.toFixed(1)}%`) },
    { key: "operatingMargin", label: "Operating margin", min: 0, max: 60, note: "Your assumption · latest SEC reported margin" },
    { key: "taxRate", label: "Tax rate", min: 0, max: 45, note: "Your assumption · latest SEC effective rate: " + (reportedTax === null ? "not reported" : `${reportedTax.toFixed(1)}%`) },
    { key: "discountRate", label: "Discount rate", min: 5, max: 18, note: "Your discount-rate assumption" },
    { key: "terminalGrowth", label: "Terminal growth", min: 0, max: 5, step: 0.5, note: "Your perpetual-growth assumption" },
  ];

  return <main className="page-content"><div className="page-heading"><div><p className="eyebrow">PUBLIC DATA · SEC EDGAR / NASDAQ · {ticker}</p><h1 className="page-title">Valuation workspace</h1><p className="page-subtitle">Company filings establish the base year; all forecast assumptions remain editable.</p></div><div className="heading-actions"><span className="badge">{price === null ? "QUOTE UNAVAILABLE" : `NASDAQ ${money(price)}`}</span><Link className="button" href={`/analysis/${ticker}`}>SEC financials →</Link></div></div>
    {(financialQuery.isLoading || quoteQuery.isLoading) && <div className="panel empty-note">Loading latest SEC filings and Nasdaq quote…</div>}
    {(financialQuery.error || quoteQuery.error) && <div className="panel empty-note data-error">{financialQuery.error?.message ?? quoteQuery.error?.message}</div>}
    {latest && financialQuery.data && <>
      <div className="source-note">Base financial year: FY{latest.fiscalYear}. Quote time: {quote?.observedAt ? new Date(quote.observedAt).toLocaleString() : "unavailable"}. Shares outstanding: {sharesBillions === null ? "not reported" : `${sharesBillions.toFixed(3)}B${latest.sharesOutstanding ? " · SEC reported" : " · implied from Nasdaq market cap / quote"}`}.</div>
      <section className="valuation-layout section-gap" id="dcf"><article className="panel"><div className="panel-heading"><div><h2 className="panel-title">Simplified FCFF discounted cash flow</h2><span className="panel-meta">5-YEAR FORECAST · BASED ON FY{latest.fiscalYear}</span></div><span className="badge">SOURCE-DRIVEN BASE YEAR</span></div><div className="panel-body"><div className="valuation-inputs">{controls.map((control) => <label className="field-label" key={control.key}>{control.label}<span className="range-control"><input type="range" min={control.min} max={control.max} step={control.step ?? 1} value={inputs[control.key]} onChange={(event) => setInputs((current) => ({ ...current, [control.key]: Number(event.target.value) }))} /><span className="range-value">{inputs[control.key].toFixed(control.step ? 1 : 0)}%</span></span><span className="panel-meta">{control.note}</span></label>)}</div><div style={{ display: "flex", gap: 8, marginTop: 16 }}><button className="button" onClick={() => { if (!latest) return; setInputs((current) => ({ ...current, revenueGrowth: revenueGrowth ?? current.revenueGrowth, operatingMargin: operatingMargin === null ? current.operatingMargin : operatingMargin * 100, taxRate: reportedTax ?? current.taxRate })); }}>Use latest filed assumptions</button></div></div></article>
        <article className="panel"><div className="panel-heading"><div><h2 className="panel-title">Intrinsic value estimate</h2><span className="panel-meta">PER SHARE · ASSUMPTION-DEPENDENT</span></div></div><div className="panel-body">{!modelAvailable && <div className="data-unavailable"><strong>Insufficient reported inputs</strong><p>A DCF needs filed revenue, operating income, free cash flow, net cash, and shares outstanding (or a current market cap/quote).</p></div>}{fairValue !== null && <><div className="metric-value" style={{ marginTop: 0, fontSize: 30 }}>{money(fairValue)}</div><div className={`metric-change ${marginOfSafety !== null && marginOfSafety >= 0 ? "positive" : "negative"}`}>{marginOfSafety === null ? "Market comparison unavailable" : `${marginOfSafety >= 0 ? "Above" : "Below"} market price by ${Math.abs(marginOfSafety).toFixed(1)}%`}<span className="muted"> · Market {money(price)}</span></div><div className="scenario-grid" style={{ marginTop: 16 }}>{scenarios.map((scenario) => <div className="scenario" key={scenario.name}><span>{scenario.name} case</span><strong>{money(scenario.value)}</strong></div>)}</div><p className="panel-meta" style={{ lineHeight: 1.6, marginTop: 14 }}>Cash flow conversion is derived from reported latest-year free cash flow / after-tax operating income. DCF is a simplified estimate, not investment advice.</p></>}</div></article></section>
      <section className="dashboard-grid section-gap" id="multiples"><article className="panel"><div className="panel-heading"><div><h2 className="panel-title">Reported-year trading multiples</h2><span className="panel-meta">CURRENT NASDAQ MARKET CAP ÷ LATEST SEC ANNUAL FACTS</span></div></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Multiple</th><th>Value</th><th>Denominator basis</th></tr></thead><tbody><tr><td className="ticker-name">P/E</td><td className="mono">{pe === null || !Number.isFinite(pe) ? "—" : `${pe.toFixed(1)}x`}</td><td>Latest SEC annual net income · FY{latest.fiscalYear}</td></tr><tr><td className="ticker-name">P/S</td><td className="mono">{priceSales === null || !Number.isFinite(priceSales) ? "—" : `${priceSales.toFixed(1)}x`}</td><td>Latest SEC annual revenue · FY{latest.fiscalYear}</td></tr><tr><td className="ticker-name">P/FCF</td><td className="mono">{priceFcf === null || !Number.isFinite(priceFcf) ? "—" : `${priceFcf.toFixed(1)}x`}</td><td>Latest SEC annual free cash flow · FY{latest.fiscalYear}</td></tr><tr><td className="ticker-name">Forward P/E</td><td>Not available</td><td>No free consensus estimate source configured</td></tr><tr><td className="ticker-name">EV / EBITDA · PEG</td><td>Not calculated</td><td>Comparable live inputs are unavailable in selected sources</td></tr></tbody></table></div></article>
        <article className="panel" id="reverse-dcf"><div className="panel-heading"><div><h2 className="panel-title">Reverse DCF</h2><span className="panel-meta">REVENUE GROWTH IMPLIED BY CURRENT PRICE</span></div></div><div className="panel-body"><div className="metric-value" style={{ marginTop: 0, fontSize: 28 }}>{impliedGrowth === null ? "—" : `${impliedGrowth.toFixed(1)}%`}</div><p className="page-subtitle" style={{ lineHeight: 1.7 }}>Growth that makes this simplified model equal the current Nasdaq quote, holding your other inputs constant.</p><div className="metric-pills" style={{ marginTop: 15 }}><span className="metric-pill">5-YEAR HORIZON</span><span className="metric-pill">FY{latest.fiscalYear} SEC BASE</span></div></div></article></section>
      <div className="source-note">Sources: <a href={financialQuery.data.source.url} target="_blank" rel="noreferrer">SEC EDGAR XBRL ↗</a> and <a href={quote?.source.url ?? "https://www.nasdaq.com/market-activity/stocks"} target="_blank" rel="noreferrer">Nasdaq ↗</a>. Historical denominators may differ from trailing-twelve-month provider estimates.</div>
    </>}
  </main>;
}