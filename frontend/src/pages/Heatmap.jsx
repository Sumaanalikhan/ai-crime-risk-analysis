import { useState } from "react";
import { MapContainer, TileLayer } from 'react-leaflet';
import { Layers } from 'lucide-react';
import Navbar from '../components/Navbar';
import 'leaflet/dist/leaflet.css';

const C = {
  bg: "#0F172A", card: "#1E293B", cardDeep: "#162032",
  border: "rgba(255,255,255,0.08)", text: "#F1F5F9",
  muted: "#94A3B8", dim: "#64748B", orange: "#F97316",
  red: "#EF4444", amber: "#F59E0B", green: "#22C55E", sea: "#0A1628",
};

export default function Heatmap() {
  const [selected, setSelected] = useState("Lyari");

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", background: C.bg, color: C.text }}>
      <Navbar />

      {/* Controls */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "10px 24px", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>Heatmap Explorer</span>
        <div style={{ width: 1, height: 18, background: C.border }} />
        <select style={{ background: C.cardDeep, border: `1px solid ${C.border}`, color: C.text, borderRadius: 7, padding: "6px 12px", fontSize: 13, outline: "none" }}>
          {["All Crimes", "Street Crime", "Vehicle Theft"].map(o => <option key={o}>{o}</option>)}
        </select>
        
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 20 }}>
          <button style={{ display: "flex", alignItems: "center", gap: 6, background: `${C.orange}15`, border: `1px solid ${C.orange}40`, color: C.orange, borderRadius: 7, padding: "6px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            <Layers size={14} /> Layers
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 295px", overflow: "hidden" }}>
        {/* Map */}
        <div style={{ background: C.sea, position: "relative" }}>
          <MapContainer center={[24.8607, 67.0011]} zoom={12} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 1 }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          </MapContainer>
        </div>

        {/* Sidebar */}
        <aside style={{ background: C.card, borderLeft: `1px solid ${C.border}`, padding: 18, overflowY: "auto" }}>
          <div style={{ color: C.dim, fontSize: 10, fontWeight: 700, letterSpacing: "0.07em" }}>SELECTED AREA</div>
          <h3 style={{ fontSize: 19, fontWeight: 800, marginTop: 5, marginBottom: 16 }}>{selected}</h3>
          
          <div style={{ background: C.cardDeep, borderRadius: 10, padding: "16px", marginBottom: 20, textAlign: "center" }}>
            <div style={{ color: C.red, fontSize: 50, fontWeight: 900, lineHeight: 1 }}>88</div>
            <div style={{ color: C.dim, fontSize: 12, marginTop: 4, fontWeight: 600 }}>RISK SCORE / 100</div>
          </div>
        </aside>
      </div>
    </div>
  );
}