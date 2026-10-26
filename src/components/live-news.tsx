"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { useMarketNews } from "@/hooks/use-market-data";

const symbols = ["MSFT", "NVDA", "GOOGL", "AMZN", "BRK.B", "V", "COST", "LLY"];

export function LiveNews() {
  const [ticker, setTicker] = useState("ALL");
  const query = useMarketNews(ticker === "ALL" ? symbols : [ticker]);
  const data = query.data?.data ?? [];
  const filtered = ticker === "ALL" ? data : data.filter((item) => item.ticker === ticker);

  return <main className="page-content"><div className="page-heading"><div><p className="eyebrow">PUBLIC SOURCES · GOOGLE NEWS RSS / SEC EDGAR</p><h1 className="page-title">News intelligence</h1><p className="page-subtitle">Linked headlines and company filings. No generated summaries or unverified sentiment labels.</p></div><span className="badge">{query.data?.fetchedAt ? `FETCHED ${new Date(query.data.fetchedAt).toLocaleTimeString()}` : "SOURCE FEED"}</span></div>
    <section className="panel"><div className="panel-heading"><div><h2 className="panel-title">Company coverage</h2><span className="panel-meta">HEADLINE TEXT AND PUBLISHER LINKS FROM ORIGINAL SOURCES</span></div><label className="compact-select-label">Ticker<select className="select-control" value={ticker} onChange={(event) => setTicker(event.target.value)}><option value="ALL">All tracked</option>{symbols.map((symbol) => <option key={symbol}>{symbol}</option>)}</select></label></div>
      {query.isLoading && <div className="empty-note">Loading public RSS and filing feeds…</div>}{query.error && <div className="empty-note data-error">{query.error.message}</div>}{!query.isLoading && !query.error && filtered.length === 0 && <div className="empty-note">No recent public headlines or filings found.</div>}
      <div className="live-news-list">{filtered.map((item) => <article className="live-news-item" key={item.url}><div className={`news-type ${item.category === "SEC FILING" ? "filing" : "headline"}`}>{item.category === "SEC FILING" ? "FILING" : item.ticker}</div><div className="live-news-content"><a className="live-news-title" href={item.url} target="_blank" rel="noreferrer">{item.headline}<ExternalLink size={12} /></a>{item.summary && <p>{item.summary}</p>}<div className="live-news-meta"><span>{item.source}</span><span>{item.publishedAt ? new Date(item.publishedAt).toLocaleString() : "Date unavailable"}</span><span className="badge">{item.category}</span></div></div></article>)}</div>
      <div className="source-note">News headlines are retrieved from Google News RSS; filings are direct SEC EDGAR documents. Summaries and bullish/bearish sentiment are intentionally omitted because these sources do not provide verified analysis.</div>
    </section>
  </main>;
}