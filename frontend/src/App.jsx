import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

import {
  Shield, Map, Bell, BarChart2, AlertTriangle, CheckCircle,
  Search, TrendingUp, Users, Activity, MapPin, ArrowRight,
  Eye, EyeOff, Lock, Mail, Info, Cpu, Database,
  Layers, Target, ChevronRight, Filter, Navigation, Clock, Route,
} from "lucide-react";

// ─── Color tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#0F172A",
  card: "#1E293B",
  cardDeep: "#162032",
  border: "rgba(255,255,255,0.08)",
  borderMid: "rgba(255,255,255,0.13)",
  text: "#F1F5F9",
  muted: "#94A3B8",
  dim: "#64748B",
  orange: "#F97316",
  orangeBg: "rgba(249,115,22,0.10)",
  orangeBorder: "rgba(249,115,22,0.25)",
  red: "#EF4444",
  redBg: "rgba(239,68,68,0.10)",
  redBorder: "rgba(239,68,68,0.25)",
  amber: "#F59E0B",
  amberBg: "rgba(245,158,11,0.10)",
  amberBorder: "rgba(245,158,11,0.25)",
  green: "#22C55E",
  greenBg: "rgba(34,197,94,0.10)",
  greenBorder: "rgba(34,197,94,0.25)",
  sea: "#0A1628",
};

const PAGES = [
  { id: "design", label: "Design System" },
  { id: "welcome", label: "Welcome" },
  { id: "login", label: "Login" },
  { id: "landing", label: "Home" },
  { id: "dashboard", label: "Dashboard" },
  { id: "predict", label: "Risk Predictor" },
  { id: "routes", label: "Safe Routes" },
  { id: "heatmap", label: "Heatmap" },
  { id: "about", label: "About" },
];

// ─── Shared atoms ─────────────────────────────────────────────────────────────

function Logo({ size = "md" }) {
  const cfg = {
    sm: { pad: 5, icon: 16, text: "15px" },
    md: { pad: 7, icon: 20, text: "18px" },
    lg: { pad: 10, icon: 28, text: "26px" },
  }[size];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <div style={{ background: C.orange, borderRadius: 8, padding: cfg.pad, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Shield size={cfg.icon} color="#fff" strokeWidth={2.5} />
      </div>
      <span style={{ color: C.text, fontSize: cfg.text, fontWeight: 800, letterSpacing: "-0.02em" }}>
        Crime<span style={{ color: C.orange }}>Guard</span>
      </span>
    </div>
  );
}

function RiskBadge({ level }) {
  const map = {
    low: { color: C.green, bg: C.greenBg, border: C.greenBorder, label: "Low Risk" },
    medium: { color: C.amber, bg: C.amberBg, border: C.amberBorder, label: "Medium Risk" },
    high: { color: C.red, bg: C.redBg, border: C.redBorder, label: "High Risk" },
  };
  const m = map[level];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: m.bg, color: m.color, border: `1px solid ${m.border}`, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: m.color, display: "inline-block" }} />
      {m.label}
    </span>
  );
}

function Pill({ label, color = C.orange }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${color}18`, border: `1px solid ${color}30`, borderRadius: 20, padding: "4px 13px", color, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em" }}>
      {label}
    </span>
  );
}

function Navbar({ onNav, active }) {
  const links = [
    { id: "landing", label: "Home" },
    { id: "dashboard", label: "Dashboard" },
    { id: "predict", label: "Predict Risk" },
    { id: "routes", label: "Safe Routes" },
    { id: "heatmap", label: "Heatmap" },
    { id: "about", label: "About" },
  ];
  return (
    <nav style={{ background: C.card, borderBottom: `1px solid ${C.border}`, height: 62, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 36px", flexShrink: 0 }}>
      <button onClick={() => onNav("landing")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
        <Logo size="sm" />
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        {links.map(l => (
          <button
            key={l.id}
            onClick={() => onNav(l.id)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: active === l.id ? C.orange : C.muted,
              fontSize: 14, fontWeight: active === l.id ? 600 : 400,
              padding: "4px 0",
              borderBottom: active === l.id ? `2px solid ${C.orange}` : "2px solid transparent",
              transition: "color 0.15s, border-color 0.15s",
            }}
          >
            {l.label}
          </button>
        ))}
      </div>
      <button onClick={() => onNav("login")} style={{ background: C.orange, color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
        Login
      </button>
    </nav>
  );
}

// ─── Landing / Home ─────────────────────────────────────────────────

function LandingPage({ onNav }) {
  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar onNav={onNav} active="landing" />
      <section style={{ maxWidth: 1260, margin: "0 auto", padding: "72px 56px 56px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
        <div>
          <Pill label="LIVE CRIME RISK DATA · KARACHI" />
          <h1 style={{ color: C.text, fontSize: 54, fontWeight: 900, lineHeight: 1.1, margin: "22px 0 18px", letterSpacing: "-0.03em" }}>
            Stay Safe<br />in <span style={{ color: C.orange }}>Karachi</span>
          </h1>
          <p style={{ color: C.muted, fontSize: 17, lineHeight: 1.65, marginBottom: 36, maxWidth: 460 }}>
            Real-time crime risk awareness and intelligent safe navigation powered by AI. Know before you go — check any area in seconds.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => onNav("predict")} style={{ background: C.orange, color: "#fff", border: "none", borderRadius: 9, padding: "13px 28px", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
              Try Risk Predictor →
            </button>
            <button onClick={() => onNav("heatmap")} style={{ background: "transparent", color: C.text, border: `1.5px solid ${C.borderMid}`, borderRadius: 9, padding: "13px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
              Explore Heatmap
            </button>
          </div>
        </div>

        {/* Replaced static image with Live MapContainer */}
        <div style={{ background: C.sea, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", height: 360, position: "relative" }}>
          <MapContainer center={[24.8607, 67.0011]} zoom={11} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 1 }} zoomControl={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          </MapContainer>
          
          <div style={{ position: "absolute", top: 12, left: 12, zIndex: 1000, background: "rgba(10,22,40,0.88)", border: `1px solid ${C.border}`, borderRadius: 7, padding: "6px 13px", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.green }} />
            <span style={{ color: C.text, fontSize: 12, fontWeight: 600 }}>Karachi Crime Heatmap</span>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Dashboard ──────────────────────────────────────────────────────

function DashboardPage({ onNav }) {
  const [timeFilter, setTimeFilter] = useState("Evening");
  const [dateFilter, setDateFilter] = useState("Today");

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Navbar onNav={onNav} active="dashboard" />

      {/* Filter bar */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "10px 28px", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
        <Filter size={14} color={C.dim} />
        <span style={{ color: C.muted, fontSize: 12, fontWeight: 700, letterSpacing: "0.06em" }}>FILTERS</span>
        <div style={{ width: 1, height: 18, background: C.border }} />
        {[
          { val: timeFilter, setter: setTimeFilter, opts: ["Morning", "Afternoon", "Evening", "Night"] },
          { val: dateFilter, setter: setDateFilter, opts: ["Today", "Last 7 Days", "Last 30 Days"] },
        ].map((f, i) => (
          <select key={i} value={f.val} onChange={e => f.setter(e.target.value)} style={{ background: C.cardDeep, border: `1px solid ${C.border}`, color: C.text, borderRadius: 7, padding: "6px 12px", fontSize: 13, cursor: "pointer", outline: "none" }}>
            {f.opts.map(o => <option key={o}>{o}</option>)}
          </select>
        ))}
      </div>

      {/* Main 3-col grid */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "255px 1fr 275px", overflow: "hidden" }}>
        
        <aside style={{ background: C.card, borderRight: `1px solid ${C.border}`, padding: 18, overflowY: "auto" }}>
          <div style={{ background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 10, padding: "18px 16px", marginBottom: 20, textAlign: "center" }}>
            <div style={{ color: C.dim, fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", marginBottom: 10 }}>CURRENT CITY RISK</div>
            <div style={{ color: C.amber, fontSize: 30, fontWeight: 900, marginBottom: 4, letterSpacing: "-0.02em" }}>MEDIUM</div>
          </div>
        </aside>

        {/* Live Interactive Map Center */}
        <div style={{ background: C.sea, position: "relative", overflow: "hidden" }}>
          <MapContainer center={[24.8607, 67.0011]} zoom={12} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 1 }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
          </MapContainer>

          {/* Legend overlay - Set to zIndex 1000 to float over map */}
          <div style={{ position: "absolute", top: 16, left: 16, zIndex: 1000, background: "rgba(10,22,40,0.92)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ color: C.text, fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Map Legend</div>
            {[["High Risk", C.red], ["Medium Risk", C.amber], ["Low Risk", C.green]].map(([l, col]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: col }} />
                <span style={{ color: C.muted, fontSize: 12 }}>{l}</span>
              </div>
            ))}
          </div>

          <div style={{ position: "absolute", bottom: 16, left: 16, zIndex: 1000, background: "rgba(10,22,40,0.88)", border: `1px solid ${C.border}`, borderRadius: 7, padding: "7px 13px", display: "flex", alignItems: "center", gap: 7 }}>
            <Activity size={13} color={C.orange} />
            <span style={{ color: C.muted, fontSize: 12 }}>Showing: <span style={{ color: C.text, fontWeight: 600 }}>{timeFilter}</span></span>
          </div>
        </div>

        <aside style={{ background: C.card, borderLeft: `1px solid ${C.border}`, padding: 18, overflowY: "auto" }}>
          <div style={{ color: C.dim, fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", marginBottom: 16 }}>RISK SUMMARY</div>
          {[
            { area: "Lyari", score: 88, risk: "high" },
            { area: "Orangi Town", score: 82, risk: "high" },
            { area: "Nazimabad", score: 58, risk: "medium" },
            { area: "DHA/Clifton", score: 18, risk: "low" },
          ].map(a => {
            const col = a.risk === "high" ? C.red : a.risk === "medium" ? C.amber : C.green;
            return (
              <div key={a.area} style={{ marginBottom: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ color: C.text, fontSize: 13, fontWeight: 500 }}>{a.area}</span>
                  <span style={{ color: col, fontSize: 12, fontWeight: 800 }}>{a.score}%</span>
                </div>
                <div style={{ background: C.cardDeep, borderRadius: 4, height: 5 }}>
                  <div style={{ width: `${a.score}%`, height: "100%", background: col, borderRadius: 4, transition: "width 0.6s ease" }} />
                </div>
              </div>
            );
          })}
        </aside>
      </div>
    </div>
  );
}

// ─── Safe Routes ─────────────────────────────────────────────────────

function SafeRoutesPage({ onNav }) {
  const [from, setFrom] = useState("Gulshan-e-Iqbal");
  const [to, setTo] = useState("DHA Phase 1");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(true);

  // Mock coordinates for the Leaflet Polyline routing
  const routePath = [
    [24.9180, 67.0971], // Gulshan
    [24.8607, 67.0011], // M.A. Jinnah Rd
    [24.8138, 67.0322]  // DHA Phase 1
  ];

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar onNav={onNav} active="routes" />

      <div style={{ maxWidth: 1260, margin: "0 auto", padding: "52px 52px 64px" }}>
        <div style={{ marginBottom: 40 }}>
          <Pill label="SAFE ROUTE NAVIGATOR" />
          <h1 style={{ color: C.text, fontSize: 36, fontWeight: 900, margin: "16px 0 10px", letterSpacing: "-0.025em" }}>
            Find Safe Routes
          </h1>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: results ? "420px 1fr" : "1fr", gap: 24, alignItems: "start" }}>
          
          {/* Left Menu */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "28px" }}>
              <button style={{ width: "100%", background: C.orange, color: "#fff", border: "none", borderRadius: 10, padding: "14px", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
                Find Safe Routes →
              </button>
            </div>
            
            <div style={{ background: C.card, border: `1px solid ${C.green}55`, borderLeft: `3px solid ${C.green}`, borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>Shahrah-e-Faisal Corridor</div>
              <div style={{ color: C.dim, fontSize: 12 }}>Via Shahrah-e-Faisal → Karsaz → Defence</div>
              <RiskBadge level="low" />
            </div>
          </div>

          {/* Right Live Map with Polyline */}
          <div style={{ position: "sticky", top: 60 }}>
            <div style={{ background: C.sea, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", height: 620, position: "relative" }}>
              
              <MapContainer center={[24.8607, 67.0011]} zoom={12} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 1 }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Polyline positions={routePath} color={C.green} weight={5} dashArray="10, 10" />
                <Marker position={routePath[0]}><Popup>Start: {from}</Popup></Marker>
                <Marker position={routePath[2]}><Popup>End: {to}</Popup></Marker>
              </MapContainer>

              <div style={{ position: "absolute", top: 14, left: 14, zIndex: 1000, background: "rgba(10,22,40,0.92)", border: `1px solid ${C.border}`, borderRadius: 9, padding: "10px 14px" }}>
                <div style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>Shahrah-e-Faisal Corridor</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── App Wrapper ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState("dashboard");
  const nav = (p) => setPage(p);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: C.bg, minHeight: "100vh", color: C.text }}>
      
      {/* Top Navbar for development testing */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999, background: "#060D1A", height: 38, display: "flex", alignItems: "center", padding: "0 14px", gap: 5 }}>
        <span style={{ color: C.dim, fontSize: 10, fontWeight: 700 }}>FRAME SWITCHER: </span>
        {PAGES.map(p => (
          <button key={p.id} onClick={() => setPage(p.id)} style={{ background: page === p.id ? C.orange : "transparent", color: page === p.id ? "#fff" : C.dim, border: `1px solid ${page === p.id ? C.orange : C.border}`, borderRadius: 5, padding: "3px 10px", fontSize: 11, cursor: "pointer" }}>
            {p.label}
          </button>
        ))}
      </div>

      <div style={{ paddingTop: 38 }}>
        {page === "landing"   && <LandingPage onNav={nav} />}
        {page === "dashboard" && <DashboardPage onNav={nav} />}
        {page === "routes"    && <SafeRoutesPage onNav={nav} />}
        {/* Temporarily fallback to dashboard for static pages to save file size */}
        {page !== "landing" && page !== "dashboard" && page !== "routes" && <DashboardPage onNav={nav} />}
      </div>
    </div>
  );
}