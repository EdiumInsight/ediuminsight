"use client";

import Link from "next/link";
import { AlertCircle, Check, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

type Status = { supabase: boolean; publicSources: { name: string; purpose: string; route: string }[]; aiProvider: boolean; checkedAt: string };

export function SettingsOverview() {
  const query = useQuery<Status>({ queryKey: ["connection-status"], queryFn: async () => { const response = await fetch("/api/status"); if (!response.ok) throw new Error("Unable to load source status"); return response.json(); }, staleTime: 60_000 });
  const status = query.data;
  return <main className="page-content"><div className="page-heading"><div><p className="eyebrow">WORKSPACE / SOURCES</p><h1 className="page-title">Data connections</h1><p className="page-subtitle">Public sources are called server-side; account storage and AI require your own configuration.</p></div><span className="badge">{status?.checkedAt ? `CHECKED ${new Date(status.checkedAt).toLocaleTimeString()}` : "STATUS"}</span></div>
    {query.isLoading && <div className="panel empty-note">Checking configured integrations…</div>}
    {query.error && <div className="panel empty-note data-error"><AlertCircle size={16} />{query.error.message}</div>}
    {status && <div className="settings-sections">
      <section className="panel"><div className="panel-heading"><div><h2 className="panel-title">Personal account storage</h2><span className="panel-meta">SUPABASE</span></div><span className={`connection-pill ${status.supabase ? "connected" : "disconnected"}`}><i />{status.supabase ? "Configured" : "Not configured"}</span></div><div className="panel-body"><p className="settings-description">Portfolio holdings, watchlists, theses, alerts, and account settings are private data. They are never populated from public sources.</p>{!status.supabase && <div className="source-note">Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in your deployment environment, then apply the Supabase migration.</div>}</div></section>
      <section className="panel"><div className="panel-heading"><div><h2 className="panel-title">Public data sources</h2><span className="panel-meta">NO API KEYS REQUIRED FOR THE CURRENT ADAPTERS</span></div></div><div className="connection-list">{status.publicSources.map((source) => <div className="connection-row" key={source.name}><span className="connection-icon"><Check size={14} /></span><div className="connection-copy"><strong>{source.name}</strong><span>{source.purpose}</span></div><a href={source.route} target="_blank" rel="noreferrer" aria-label={`Test ${source.name} endpoint`}><ExternalLink size={14} /></a></div>)}</div><div className="source-note">Nasdaq&apos;s public endpoint is an exchange API, not a contractual commercial feed; review its terms and use limits before production. SEC access requires an identifying User-Agent. Publisher links are provided via Google News RSS.</div></section>
      <section className="panel"><div className="panel-heading"><div><h2 className="panel-title">AI investment assistant</h2><span className="panel-meta">PROVIDER ADAPTER</span></div><span className="connection-pill disconnected"><i />Not configured</span></div><div className="panel-body"><p className="settings-description">The API boundary is present but no model provider is called. Generated analysis is disabled until you configure a provider and privacy/rate-limit controls.</p></div></section>
      <div className="heading-actions"><Link className="button" href="/dashboard">Return to market dashboard</Link><Link className="button" href="https://github.com/EdiumInsight/ediuminsight" target="_blank">Source repository</Link></div>
    </div>}
  </main>;
}