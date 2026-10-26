"use client";

import Link from "next/link";
import { AlertCircle, Plus } from "lucide-react";
import { useResource } from "@/hooks/use-resource";
import type { ApiResource } from "@/lib/api/resources";

type PersonalModule = "watchlists" | "thesis" | "alerts";
type PersonalRecord = { id: string; name?: string; title?: string; description?: string | null; status?: string; probability?: number; type?: string; enabled?: boolean; updated_at?: string; created_at?: string };

const config: Record<PersonalModule, { resource: ApiResource; title: string; label: string; subtitle: string; emptyTitle: string; emptyDescription: string }> = {
  watchlists: { resource: "watchlists", title: "Watchlists", label: "PERSONAL RESEARCH", subtitle: "Your saved company lists and target prices.", emptyTitle: "No watchlists yet", emptyDescription: "Create a watchlist in your authenticated workspace. No sample companies are shown as your data." },
  thesis: { resource: "thesis", title: "Thesis tracker", label: "PERSONAL RESEARCH", subtitle: "Your investment theses, probabilities, and status history.", emptyTitle: "No investment theses yet", emptyDescription: "Saved theses are private account data and cannot be fetched from public market sources." },
  alerts: { resource: "alerts", title: "Alerts", label: "PERSONAL MONITORING", subtitle: "Your configured price, news, fundamentals, and thesis conditions.", emptyTitle: "No alerts configured", emptyDescription: "Alert rules belong to your account. No example alerts are represented as active rules." },
};

export function PersonalDataModule({ module }: { module: PersonalModule }) {
  const details = config[module];
  const query = useResource<PersonalRecord>(details.resource);
  const records = query.data?.data ?? [];

  return <main className="page-content"><div className="page-heading"><div><p className="eyebrow">{details.label} · SUPABASE ACCOUNT DATA</p><h1 className="page-title">{details.title}</h1><p className="page-subtitle">{details.subtitle}</p></div><Link className="button" href="/settings">Connection settings</Link></div>
    {query.isLoading && <div className="panel empty-note">Loading your private records…</div>}
    {query.error && <div className="panel connection-state"><AlertCircle size={18} /><div><strong>Personal data is not connected</strong><p>{query.error.message.includes("Supabase is not configured") ? "Configure Supabase project URL and publishable key before using account data." : query.error.message}</p><Link className="button button-primary" href="/settings">Configure Supabase</Link></div></div>}
    {!query.isLoading && !query.error && records.length === 0 && <div className="panel connection-state"><div className="portfolio-empty-mark"><Plus size={17} /></div><div><strong>{details.emptyTitle}</strong><p>{details.emptyDescription}</p></div></div>}
    {records.length > 0 && <section className="panel"><div className="panel-heading"><div><h2 className="panel-title">Saved records</h2><span className="panel-meta">{records.length} PERSONAL RECORDS</span></div></div><div className="table-scroll"><table className="data-table"><thead><tr>{(module === "watchlists" ? ["Name", "Description", "Updated"] : module === "thesis" ? ["Company", "Thesis", "Probability", "Status", "Updated"] : ["Alert", "Type", "Enabled", "Last updated"]).map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{records.map((record) => <tr key={record.id}>{module === "watchlists" ? <><td className="ticker-name">{record.name ?? "Untitled watchlist"}</td><td>{record.description ?? "—"}</td><td>{record.updated_at ? new Date(record.updated_at).toLocaleDateString() : "—"}</td></> : module === "thesis" ? <><td>Company link unavailable</td><td className="ticker-name">{record.title ?? "Untitled thesis"}</td><td className="mono">{record.probability ?? "—"}{record.probability === undefined ? "" : "%"}</td><td>{record.status ?? "—"}</td><td>{record.updated_at ? new Date(record.updated_at).toLocaleDateString() : "—"}</td></> : <><td className="ticker-name">{record.name ?? "Unnamed alert"}</td><td>{record.type ?? "—"}</td><td>{record.enabled ? "Enabled" : "Paused"}</td><td>{record.updated_at ? new Date(record.updated_at).toLocaleDateString() : "—"}</td></>}</tr>)}</tbody></table></div></section>}
    <div className="source-note">These records come from your authenticated Supabase account. Public market feeds cannot supply personal watchlists, investment theses, or alert rules.</div>
  </main>;
}