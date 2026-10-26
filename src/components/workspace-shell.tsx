"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Activity, Bell, BriefcaseBusiness, ChartNoAxesCombined, ChevronDown, ChevronLeft,
  FileText, Gauge, Menu, Newspaper, Search, Settings2, SlidersHorizontal, Eye,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navigationGroups = [
  { label: "Workspace", items: [{ label: "Dashboard", href: "/dashboard", icon: Gauge }, { label: "Portfolio", href: "/portfolio", icon: BriefcaseBusiness }, { label: "Watchlists", href: "/watchlists", icon: Eye }] },
  { label: "Research", items: [{ label: "Fundamentals", href: "/analysis/MSFT", icon: ChartNoAxesCombined }, { label: "Valuation lab", href: "/valuation", icon: Activity }, { label: "News intelligence", href: "/news", icon: Newspaper }, { label: "Thesis tracker", href: "/thesis", icon: FileText }] },
  { label: "Monitor", items: [{ label: "Alerts", href: "/alerts", icon: Bell, count: "2" }, { label: "Opportunity screener", href: "/screener", icon: SlidersHorizontal }] },
];

function isCurrent(pathname: string, href: string) {
  if (href === "/analysis/MSFT") return pathname.startsWith("/analysis");
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
}

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");

  return (
    <div className="app-shell">
      <aside className={`sidebar${collapsed ? " collapsed" : ""}${mobileOpen ? " mobile-open" : ""}`}>
        <Link className="brand" href="/dashboard" aria-label="Edium Insight dashboard">
          <span className="brand-mark"><span>EI</span></span>
          <span className="brand-copy"><span className="brand-name">EDIUM INSIGHT</span><span className="brand-tag">INVESTMENT RESEARCH</span></span>
        </Link>
        <nav className="nav-list" aria-label="Hoofdnavigatie">
          {navigationGroups.map((group) => (
            <details className="nav-group" key={group.label} open>
              <summary className="nav-group-title"><span>{group.label}</span><ChevronDown size={13} /></summary>
              <div className="nav-group-items">{group.items.map(({ label, href, icon: Icon, count }) => (
                <Link key={href} className={`nav-link${isCurrent(pathname, href) ? " active" : ""}`} href={href} onClick={() => setMobileOpen(false)} title={collapsed ? label : undefined}>
                  <Icon size={15} strokeWidth={1.7} /><span>{label}</span>{count && <span className="nav-count">{count}</span>}
                </Link>
              ))}</div>
            </details>
          ))}
        </nav>
        <div className="nav-section">PREFERENCES</div>
        <nav className="nav-list">
          <Link className={`nav-link${pathname === "/settings" ? " active" : ""}`} href="/settings" title={collapsed ? "Settings" : undefined}>
            <Settings2 size={16} strokeWidth={1.7} /><span>Settings</span>
          </Link>
        </nav>
        <details className="profile-menu">
          <summary className="sidebar-foot"><span className="avatar">JD</span><span className="sidebar-foot-copy"><span className="profile-name">Jordan Davis</span><span className="profile-plan">Individual investor</span></span><ChevronDown className="profile-chevron" size={14} /></summary>
          <div className="profile-popover"><div className="profile-popover-head"><strong>Jordan Davis</strong><span>jordan@example.com</span></div><Link href="/settings"><Settings2 size={14} />Profile &amp; preferences</Link><div className="profile-environment"><span className="status-dot demo-dot" />Demo workspace</div></div>
        </details>
      </aside>
      <div className={`main-column${collapsed ? " collapsed" : ""}`}>
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu" aria-label="Open navigatie" onClick={() => setMobileOpen(!mobileOpen)}><Menu size={17} /></button>
            <button className="icon-button desktop-collapse" aria-label={collapsed ? "Zijbalk uitklappen" : "Zijbalk inklappen"} onClick={() => setCollapsed(!collapsed)}><ChevronLeft size={16} style={{ transform: collapsed ? "rotate(180deg)" : undefined }} /></button>
            <label className="search-box"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ticker, company, or metric..." aria-label="Zoek bedrijven en tickers" /><kbd style={{ color: "#718096", font: "9px var(--font-mono)" }}>⌘ K</kbd></label>
          </div>
          <div className="topbar-actions"><details className="data-menu"><summary className="market-status"><span className="status-dot demo-dot" />DEMO DATA<ChevronDown size={12} /></summary><div className="dropdown-menu"><span className="dropdown-kicker">DATA CONNECTION</span><strong>Illustrative sample data</strong><p>Market prices and fundamentals are not live.</p><Link href="/settings">Configure providers <span>→</span></Link></div></details><Link className="icon-button notification-button" href="/alerts" aria-label="Open meldingen"><Bell size={16} /><span className="notification-dot" /></Link></div>
        </header>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={pathname} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: .18 }}>
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}