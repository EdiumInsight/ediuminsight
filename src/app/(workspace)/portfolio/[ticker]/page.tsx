import Link from "next/link";
import { getNasdaqQuote } from "@/lib/market/nasdaq";
import { getSecCompany } from "@/lib/market/sec";

export default async function CompanyPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const symbol = ticker.toUpperCase();
  const [quote, secCompany] = await Promise.all([
    getNasdaqQuote(symbol),
    getSecCompany(symbol).catch(() => null),
  ]);
  const companyName = secCompany?.name ?? quote.companyName ?? symbol;
  const details = [
    ["Exchange", quote.exchange],
    ["Sector", quote.sector],
    ["Industry", quote.industry],
    ["Country", null],
    ["CEO", null],
    ["Employees", null],
    ["Market cap", quote.marketCap === null ? null : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(quote.marketCap)],
    ["52-week range", quote.fiftyTwoWeekRange],
    ["1-year target", quote.oneYearTarget === null ? null : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(quote.oneYearTarget)],
    ["Dividend yield", quote.dividendYield === null ? null : `${quote.dividendYield}%`],
  ];
  const currentPrice = quote.price === null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: quote.currency, minimumFractionDigits: 2 }).format(quote.price);

  return <main className="page-content"><div className="page-heading"><div><p className="eyebrow">NASDAQ QUOTE · SEC ISSUER DIRECTORY · {symbol}</p><h1 className="page-title">{symbol} <span className="company-heading-name">· {companyName}</span></h1><p className="page-subtitle">Public company data from exchange and regulatory sources; unavailable fields are left blank.</p></div><div className="company-price-block"><strong className="mono">{currentPrice}</strong><span className={`mono ${(quote.changePercent ?? 0) >= 0 ? "positive" : "negative"}`}>{quote.changePercent === null ? "—" : `${quote.changePercent > 0 ? "+" : ""}${quote.changePercent.toFixed(2)}%`}</span></div></div>
    <section className="panel"><nav className="research-tabs">{[["Overview", `/portfolio/${symbol}`], ["Financials", `/analysis/${symbol}`], ["Valuation", `/valuation?ticker=${symbol}`], ["News", "/news"], ["Thesis", "/thesis"], ["Competitors", "/screener"]].map(([label, href]) => <Link className={label === "Overview" ? "active" : ""} href={href} key={label}>{label}</Link>)}</nav><div className="company-overview">{details.map(([label, value]) => <div className="overview-item" key={label}><span>{label}</span><strong>{value ?? "Not provided by selected public sources"}</strong></div>)}</div></section>
    <section className="dashboard-grid"><article className="panel"><div className="panel-heading"><div><h2 className="panel-title">Market data</h2><span className="panel-meta">NASDAQ QUOTE SUMMARY</span></div></div><div className="panel-body"><div className="source-note">{quote.observedAt ? `Last trade: ${new Date(quote.observedAt).toLocaleString()}${quote.isRealtime === false ? " · delayed or official close" : ""}.` : "Quote timestamp unavailable."} Market status: {quote.marketStatus ?? "not supplied"}. <a href={quote.source.url} target="_blank" rel="noreferrer">View Nasdaq source ↗</a></div>{quote.error && <div className="empty-note data-error">{quote.error}</div>}</div></article><article className="panel"><div className="panel-heading"><div><h2 className="panel-title">Research shortcuts</h2><span className="panel-meta">PUBLIC DATA</span></div></div><div className="feed-list"><Link className="feed-item" href={`/analysis/${symbol}`}><span className="feed-title">SEC-filed financial statements</span><span className="positive">→</span></Link><Link className="feed-item" href={`/valuation?ticker=${symbol}`}><span className="feed-title">Valuation model</span><span className="positive">→</span></Link><Link className="feed-item" href="/news"><span className="feed-title">Linked headlines and filings</span><span className="positive">→</span></Link></div></article></section>
    <div className="source-note">Issuer directory: {secCompany ? <a href={`https://www.sec.gov/edgar/browse/?CIK=${secCompany.cik}&owner=exclude`} target="_blank" rel="noreferrer">SEC EDGAR ↗</a> : "not found in SEC ticker directory"}. Quote and market statistics: <a href={quote.source.url} target="_blank" rel="noreferrer">Nasdaq ↗</a>. CEO, employees, and country are not provided because the selected free endpoints do not expose verified fields for this profile.</div>
  </main>;
}