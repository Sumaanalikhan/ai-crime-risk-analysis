import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Shield, MapPin, Clock, Route as RouteIcon, Info } from 'lucide-react';
import Navbar from '../components/Navbar';

// Color tokens
const C = {
  bg: "#0F172A", card: "#1E293B", cardDeep: "#162032",
  border: "rgba(255,255,255,0.08)", text: "#F1F5F9",
  muted: "#94A3B8", dim: "#64748B", orange: "#F97316",
  orangeBg: "rgba(249,115,22,0.10)", orangeBorder: "rgba(249,115,22,0.25)",
  red: "#EF4444", amber: "#F59E0B", amberBg: "rgba(245,158,11,0.10)",
  green: "#22C55E", greenBg: "rgba(34,197,94,0.10)", sea: "#0A1628",
};

const KARACHI_AREAS = [
  "Gulshan-e-Iqbal", "Saddar", "Lyari", "Nazimabad", "DHA Phase 1",
  "Korangi", "Orangi Town", "SITE", "Malir", "Landhi"
];

// Mock Data (To be replaced by your Python ML backend later)
const ROUTE_RESULTS = [
  {
    id: 1, name: "Shahrah-e-Faisal Corridor", risk: "low",
    time: "22 min", distance: "8.4 km", safety: 94,
    via: "Via Shahrah-e-Faisal → Karsaz → Defence", incidents: 1,
  }
];

export default function SafeRoutes() {
  const [from, setFrom] = useState("Gulshan-e-Iqbal");
  const [to, setTo] = useState("DHA Phase 1");

  // Mock coordinates for Leaflet Polyline
  const routePath = [
    [24.9180, 67.0971], // Gulshan
    [24.8607, 67.0011], // M.A. Jinnah Rd
    [24.8138, 67.0322]  // DHA Phase 1
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text }}>
      <Navbar />

      <div style={{ maxWidth: 1260, margin: "0 auto", padding: "52px 52px 64px" }}>
        <div style={{ marginBottom: 40 }}>
          <span style={{ display: "inline-block", background: `${C.orange}18`, border: `1px solid ${C.orange}30`, borderRadius: 20, padding: "4px 13px", color: C.orange, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 16 }}>
            SAFE ROUTE NAVIGATOR
          </span>
          <h1 style={{ fontSize: 36, fontWeight: 900, margin: "0 0 10px", letterSpacing: "-0.025em" }}>
            Find Safe Routes
          </h1>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 24, alignItems: "start" }}>
          
          {/* Left Menu */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "28px" }}>
              <button style={{ width: "100%", background: C.orange, color: "#fff", border: "none", borderRadius: 10, padding: "14px", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
                Calculate Safe Route →
              </button>
            </div>
            
            <div style={{ background: C.card, border: `1px solid ${C.green}55`, borderLeft: `3px solid ${C.green}`, borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>Shahrah-e-Faisal Corridor</div>
              <div style={{ color: C.dim, fontSize: 12 }}>Via Shahrah-e-Faisal → Karsaz → Defence</div>
              <div style={{ color: C.green, fontSize: 11, fontWeight: 700, marginTop: 8 }}>Low Risk (94% Safety Score)</div>
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

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}