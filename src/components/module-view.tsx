import { Plus } from "lucide-react";

type ModuleKey = "watchlists" | "news" | "thesis" | "alerts" | "settings";

const modules: Record<ModuleKey, {
  eyebrow: string; title: string; subtitle: string; action?: string;
  stats: { label: string; value: string; note: string }[];
  columns: string[]; rows: string[][];
}> = {
  watchlists: {
    eyebrow: "RESEARCH / TRACKED COMPANIES", title: "Watchlists", subtitle: "Follow companies, valuation signals, and catalysts across your research universe.", action: "New watchlist",
    stats: [{ label: "Tracked companies", value: "32", note: "Across 4 watchlists" }, { label: "Below fair value", value: "11", note: "Average margin of safety 18%" }, { label: "Positive sentiment", value: "68%", note: "+6% over 7 days" }, { label: "Upcoming catalysts", value: "7", note: "Next 30 days" }],
    columns: ["Company", "Price", "Target price", "Intrinsic value", "Margin of safety", "P/E", "FCF yield", "Sentiment"],
    rows: [["MSFT · Microsoft", "$428.76", "$485.00", "$462.00", "+7.8%", "35.2x", "2.5%", "Bullish"], ["ASML · ASML Holding", "$742.60", "$890.00", "$854.00", "+13.0%", "28.4x", "2.1%", "Bullish"], ["GOOGL · Alphabet", "$191.42", "$225.00", "$238.00", "+19.6%", "21.8x", "4.1%", "Neutral"], ["ADBE · Adobe", "$438.22", "$560.00", "$592.00", "+26.0%", "22.7x", "5.6%", "Neutral"], ["UNH · UnitedHealth", "$512.80", "$630.00", "$655.00", "+27.7%", "18.9x", "4.0%", "Bearish"]],
  },
  news: {
    eyebrow: "RESEARCH / NEWS INTELLIGENCE", title: "News intelligence", subtitle: "Company filings and market coverage, prioritized by portfolio relevance.",
    stats: [{ label: "Stories today", value: "146", note: "Across 18 holdings" }, { label: "Bullish signals", value: "62%", note: "+4% vs. 7-day average" }, { label: "Filings detected", value: "12", note: "2 require review" }, { label: "High impact", value: "8", note: "Across 5 companies" }],
    columns: ["Company / source", "Headline", "Impact", "Sentiment", "Published"],
    rows: [["MSFT · Reuters", "Microsoft expands AI infrastructure capacity in new data-center investment", "High", "Bullish", "18 min ago"], ["NVDA · SEC filing", "Form 8-K: NVIDIA announces quarterly results and outlook", "High", "Neutral", "42 min ago"], ["LLY · Company IR", "Eli Lilly outlines expanded manufacturing investment for 2026", "Medium", "Bullish", "1 hr ago"], ["AMZN · Financial Times", "Amazon cloud unit growth accelerates as enterprise spending returns", "Medium", "Bullish", "2 hr ago"], ["V · MarketWatch", "Visa increases quarterly dividend by 14 percent", "Low", "Bullish", "3 hr ago"]],
  },
  thesis: {
    eyebrow: "RESEARCH / INVESTMENT PROCESS", title: "Thesis tracker", subtitle: "Keep the original reasoning visible and test it against new evidence.", action: "New thesis",
    stats: [{ label: "Active theses", value: "12", note: "Across 9 companies" }, { label: "Alive", value: "8", note: "67% of active theses" }, { label: "At risk", value: "3", note: "Review recommended" }, { label: "Last updated", value: "Today", note: "2 thesis events" }],
    columns: ["Company", "Investment thesis", "Probability", "Status", "Next catalyst", "Updated"],
    rows: [["MSFT", "Cloud and AI monetization extend durable growth runway", "78%", "Alive", "FY25 Q3 earnings", "Today"], ["GOOGL", "Search distribution plus cloud provide undervalued optionality", "66%", "At risk", "Antitrust ruling", "Yesterday"], ["V", "Global digital payments compounding with structural cash conversion", "82%", "Alive", "Q2 results", "Feb 12"], ["LLY", "Obesity portfolio can sustain category leadership and pricing power", "71%", "At risk", "Pipeline readout", "Feb 10"], ["COST", "Membership economics support resilient long-term unit growth", "85%", "Alive", "Membership renewal", "Feb 08"]],
  },
  alerts: {
    eyebrow: "RESEARCH / MONITORING", title: "Alerts", subtitle: "Signals are evaluated against your holdings, watchlists, and thesis conditions.", action: "Create alert",
    stats: [{ label: "Active alerts", value: "14", note: "Across 4 alert types" }, { label: "Triggered this week", value: "3", note: "2 price · 1 news" }, { label: "Thesis risks", value: "2", note: "Review required" }, { label: "Delivery", value: "Email + in-app", note: "Preferences in settings" }],
    columns: ["Alert", "Company", "Condition", "Type", "Last triggered", "Status"],
    rows: [["Price below target", "MSFT", "Price < $400.00", "Price", "Feb 14, 2025", "Active"], ["Revenue growth slowdown", "NVDA", "YoY growth < 20%", "Fundamental", "Never", "Active"], ["CEO departure", "Portfolio", "Executive change detected", "News", "Never", "Active"], ["Thesis invalidation", "GOOGL", "Search share < 85%", "Thesis", "Feb 13, 2025", "Active"], ["Drawdown threshold", "LLY", "Drawdown > 20%", "Price", "Never", "Paused"]],
  },
  settings: {
    eyebrow: "WORKSPACE / PREFERENCES", title: "Settings", subtitle: "Manage your profile, display preferences, and connected data providers.",
    stats: [{ label: "Account", value: "Individual", note: "Research workspace" }, { label: "Base currency", value: "USD", note: "Portfolio reporting" }, { label: "Data region", value: "United States", note: "Market session" }, { label: "Last sync", value: "2 min ago", note: "Portfolio data" }],
    columns: ["Provider", "Connection", "Coverage", "Last sync", "Action"],
    rows: [["Supabase", "Not configured", "Database and authentication", "—", "Configure"], ["Market data", "Demo mode", "Prices and fundamentals", "Sample data", "Configure"], ["News provider", "Demo mode", "Headlines and filings", "Sample data", "Configure"], ["AI assistant", "Not configured", "Research summaries", "—", "Configure"]],
  },
};

function cellStyle(value: string) {
  if (["Bullish", "Alive", "Active", "High", "78%", "82%", "85%", "+7.8%", "+13.0%", "+19.6%", "+26.0%", "+27.7%"].includes(value)) return "positive";
  if (["At risk", "Bearish", "Paused"].includes(value)) return "negative";
  if (["Medium", "Neutral"].includes(value)) return "muted";
  return "";
}

export function ModuleView({ module }: { module: ModuleKey }) {
  const config = modules[module];
  return <main className="page-content">
    <div className="page-heading"><div><p className="eyebrow">{config.eyebrow}</p><h1 className="page-title">{config.title}</h1><p className="page-subtitle">{config.subtitle}</p></div>{config.action && <button className="button button-primary"><Plus />{config.action}</button>}</div>
    <section className="module-grid">{config.stats.map((stat) => <article className="module-stat" key={stat.label}><div className="module-stat-label">{stat.label}</div><div className="module-stat-value">{stat.value}</div><div className="module-stat-note">{stat.note}</div></article>)}</section>
    <section className="panel"><div className="panel-heading"><div><h2 className="panel-title">{config.title === "Thesis tracker" ? "Active investment theses" : config.title === "News intelligence" ? "Portfolio and watchlist coverage" : config.title === "Alerts" ? "Alert rules" : config.title === "Settings" ? "Connected services" : "All tracked companies"}</h2><span className="panel-meta">SAMPLE DATA · FEB 17, 2025</span></div></div><div className="toolbar-row"><input className="text-control" placeholder="Search..." aria-label="Zoek in resultaten" /><select className="select-control" aria-label="Filter op watchlist"><option>All watchlists</option><option>AI &amp; Semiconductors</option><option>Quality compounders</option></select><select className="select-control" aria-label="Filter op status"><option>All statuses</option><option>Alive / Bullish</option><option>At risk / Neutral</option></select></div><div className="table-scroll"><table className="data-table"><thead><tr>{config.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{config.rows.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={`${index}-${cell}`} className={cellStyle(cell)}>{index === 0 ? <span className="ticker-name">{cell}</span> : cell}</td>)}</tr>)}</tbody></table></div></section>
    {module === "thesis" && <section className="panel section-gap"><div className="panel-heading"><h2 className="panel-title">Thesis journal · MSFT</h2><span className="panel-meta">3 RECENT EVENTS</span></div><div className="feed-list"><div className="feed-item"><div className="feed-title">Thesis probability updated from 72% to 78%</div><span className="feed-meta">Jordan Davis · Today, 09:14</span><div className="feed-meta">Azure growth and AI attach rate remain ahead of original assumptions.</div></div><div className="feed-item"><div className="feed-title">Catalyst added: FY25 Q3 earnings</div><span className="feed-meta">Jordan Davis · Feb 12, 2025</span><div className="feed-meta">Watch commercial bookings and Copilot paid-seat conversion.</div></div></div></section>}
    {module === "settings" && <section className="panel section-gap"><div className="panel-heading"><h2 className="panel-title">Profile preferences</h2></div><div className="panel-body"><div className="form-grid"><label className="field-label">Display name<input defaultValue="Jordan Davis" /></label><label className="field-label">Email<input defaultValue="jordan@example.com" /></label><label className="field-label">Base currency<select defaultValue="USD"><option>USD</option><option>EUR</option><option>GBP</option></select></label><label className="field-label">Timezone<select defaultValue="America/New_York"><option>America/New_York</option><option>Europe/Amsterdam</option><option>UTC</option></select></label></div><div style={{ marginTop: 16 }}><button className="button button-primary">Save preferences</button></div></div></section>}
  </main>;
}