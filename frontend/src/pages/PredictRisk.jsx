import { useState } from "react";
import { Shield, Info, CheckCircle } from 'lucide-react';
import Navbar from '../components/Navbar';

const C = {
  bg: "#0F172A", card: "#1E293B", cardDeep: "#162032",
  border: "rgba(255,255,255,0.08)", text: "#F1F5F9",
  muted: "#94A3B8", dim: "#64748B", orange: "#F97316",
  orangeBg: "rgba(249,115,22,0.10)", orangeBorder: "rgba(249,115,22,0.25)",
  red: "#EF4444", amber: "#F59E0B", green: "#22C55E",
};

const AREAS = ["Gulshan-e-Iqbal", "Saddar", "Lyari", "Nazimabad", "DHA Phase 1"];
const TIMES = ["Morning (6am–12pm)", "Afternoon (12pm–5pm)", "Evening (5pm–9pm)", "Night (9pm–6am)"];

export default function PredictRisk() {
  const [area, setArea] = useState("Gulshan-e-Iqbal");
  const [time, setTime] = useState("Evening (5pm–9pm)");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(false);

  const analyze = () => {
    setLoading(true);
    setResult(false);
    // Simulating an API call to your backend
    setTimeout(() => { setLoading(false); setResult(true); }, 1000);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text }}>
      <Navbar />

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "56px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <span style={{ display: "inline-block", background: `${C.orange}18`, border: `1px solid ${C.orange}30`, borderRadius: 20, padding: "4px 13px", color: C.orange, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 16 }}>
            AI RISK PREDICTOR
          </span>
          <h1 style={{ fontSize: 36, fontWeight: 900, margin: "0 0 12px", letterSpacing: "-0.025em" }}>
            Check Crime Risk in Your Area
          </h1>
          <p style={{ color: C.muted, fontSize: 15 }}>
            Enter details below to receive an AI-powered risk assessment for any location in Karachi.
          </p>
        </div>

        {/* Input Card */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "36px", marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
            <div>
              <label style={{ color: C.muted, fontSize: 12, fontWeight: 600, display: "block", marginBottom: 7 }}>Area / Neighbourhood</label>
              <select value={area} onChange={e => { setArea(e.target.value); setResult(false); }} style={{ width: "100%", background: C.cardDeep, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, padding: "11px 14px", fontSize: 14, outline: "none" }}>
                {AREAS.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: C.muted, fontSize: 12, fontWeight: 600, display: "block", marginBottom: 7 }}>Time of Day</label>
              <select value={time} onChange={e => { setTime(e.target.value); setResult(false); }} style={{ width: "100%", background: C.cardDeep, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, padding: "11px 14px", fontSize: 14, outline: "none" }}>
                {TIMES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          
          <button onClick={analyze} disabled={loading} style={{ width: "100%", background: loading ? C.orangeBg : C.orange, color: loading ? C.orange : "#fff", border: loading ? `1px solid ${C.orangeBorder}` : "none", borderRadius: 10, padding: "14px", fontSize: 16, fontWeight: 800, cursor: loading ? "default" : "pointer" }}>
            {loading ? "Analyzing with AI..." : "Analyze Risk →"}
          </button>
        </div>

        {/* Results Card */}
        {result && (
          <div style={{ background: C.card, border: `1px solid ${C.amber}`, borderRadius: 16, padding: "32px", animation: "fadeIn 0.3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
              <div>
                <div style={{ color: C.dim, fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", marginBottom: 8 }}>RISK ASSESSMENT RESULT</div>
                <h2 style={{ fontSize: 22, fontWeight: 800 }}>{area}</h2>
                <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>{time}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: C.amber, fontSize: 56, fontWeight: 900, lineHeight: 1 }}>58</div>
                <div style={{ color: C.dim, fontSize: 11, fontWeight: 600 }}>RISK SCORE</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}