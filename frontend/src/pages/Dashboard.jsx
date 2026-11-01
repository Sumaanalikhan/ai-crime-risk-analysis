import { useState } from "react";
import { MapContainer, TileLayer } from 'react-leaflet';
import { Filter, Activity } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import Navbar from '../components/Navbar';

const C = {
  bg: "#0F172A",
  card: "#1E293B",
  cardDeep: "#162032",
  border: "rgba(255,255,255,0.08)",
  text: "#F1F5F9",
  muted: "#94A3B8",
  dim: "#64748B",
  orange: "#F97316",
  red: "#EF4444",
  amber: "#F59E0B",
  amberBg: "rgba(245,158,11,0.10)",
  amberBorder: "rgba(245,158,11,0.25)",
  green: "#22C55E",
  sea: "#0A1628",
};

export default function Dashboard() {
  const [timeFilter, setTimeFilter] = useState("Evening");

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", background: C.bg, color: C.text }}>
      <Navbar />
      
      {/* Filter bar */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "10px 28px", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
        <Filter size={14} color={C.dim} />
        <span style={{ color: C.muted, fontSize: 12, fontWeight: 700, letterSpacing: "0.06em" }}>FILTERS</span>
        <div style={{ width: 1, height: 18, background: C.border }} />
        <select value={timeFilter} onChange={e => setTimeFilter(e.target.value)} style={{ background: C.cardDeep, border: `1px solid ${C.border}`, color: C.text, borderRadius: 7, padding: "6px 12px", fontSize: 13, cursor: "pointer", outline: "none" }}>
          {["Morning", "Afternoon", "Evening", "Night"].map(o => <option key={o}>{o}</option>)}
        </select>
      </div>

      {/* Main 3-col grid */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "255px 1fr 275px", overflow: "hidden" }}>
        
        {/* Left Sidebar */}
        <aside style={{ background: C.card, borderRight: `1px solid ${C.border}`, padding: 18, overflowY: "auto" }}>
          <div style={{ background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 10, padding: "18px 16px", marginBottom: 20, textAlign: "center" }}>
            <div style={{ color: C.dim, fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", marginBottom: 10 }}>CURRENT CITY RISK</div>
            <div style={{ color: C.amber, fontSize: 30, fontWeight: 900, marginBottom: 4 }}>MEDIUM</div>
          </div>
        </aside>

        {/* Center: Live Interactive Map */}
        <div style={{ background: C.sea, position: "relative", overflow: "hidden" }}>
          <MapContainer center={[24.8607, 67.0011]} zoom={12} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 1 }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
          </MapContainer>

          {/* Time Badge Overlay */}
          <div style={{ position: "absolute", bottom: 16, left: 16, zIndex: 1000, background: "rgba(10,22,40,0.88)", border: `1px solid ${C.border}`, borderRadius: 7, padding: "7px 13px", display: "flex", alignItems: "center", gap: 7 }}>
            <Activity size={13} color={C.orange} />
            <span style={{ color: C.muted, fontSize: 12 }}>Showing: <span style={{ color: C.text, fontWeight: 600 }}>{timeFilter}</span></span>
          </div>
        </div>

        {/* Right Sidebar */}
        <aside style={{ background: C.card, borderLeft: `1px solid ${C.border}`, padding: 18, overflowY: "auto" }}>
          <div style={{ color: C.dim, fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", marginBottom: 16 }}>RISK SUMMARY</div>
          {[
            { area: "Lyari", score: 88, risk: "high" },
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
                  <div style={{ width: `${a.score}%`, height: "100%", background: col, borderRadius: 4 }} />
                </div>
              </div>
            );
          })}
        </aside>
      </div>
    </div>
  );
}