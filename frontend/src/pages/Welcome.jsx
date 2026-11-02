import { useNavigate } from 'react-router-dom';
import { ArrowRight, Cpu, Map, Bell, Users, Activity, MapPin } from 'lucide-react';
import Navbar from '../components/Navbar';

const C = {
  bg: "#0F172A", card: "#1E293B", cardDeep: "#162032",
  border: "rgba(255,255,255,0.08)", text: "#F1F5F9",
  muted: "#94A3B8", dim: "#64748B", orange: "#F97316",
  orangeBg: "rgba(249,115,22,0.10)", orangeBorder: "rgba(249,115,22,0.25)",
  amber: "#F59E0B", green: "#22C55E",
};

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, display: "flex", flexDirection: "column" }}>
      <Navbar />

      {/* Hero Section */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 24px 48px", textAlign: "center" }}>
        <span style={{ display: "inline-block", background: C.orangeBg, border: `1px solid ${C.orangeBorder}`, borderRadius: 20, padding: "5px 16px", color: C.orange, fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 24 }}>
          AI-POWERED URBAN SAFETY PLATFORM
        </span>

        <h1 style={{ fontSize: 50, fontWeight: 900, lineHeight: 1.15, margin: "0 0 20px", letterSpacing: "-0.03em" }}>
          Welcome to <span style={{ color: C.orange }}>CrimeGuard</span>
        </h1>

        <p style={{ color: C.muted, fontSize: 17, lineHeight: 1.65, maxWidth: 600, margin: "0 auto 36px" }}>
          Your intelligent companion for safe movement in Karachi. Real-time crime risk assessment, safe routing, and predictive insights powered by machine learning.
        </p>

        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => navigate('/predict')} style={{ background: C.orange, color: "#fff", border: "none", borderRadius: 10, padding: "14px 30px", fontSize: 15, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            Get Started <ArrowRight size={18} />
          </button>
          <button onClick={() => navigate('/')} style={{ background: C.card, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 30px", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
            Open Dashboard
          </button>
        </div>
      </section>

      {/* Key Metrics */}
      <section style={{ background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: "36px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 28, textAlign: "center" }}>
          {[
            { label: "Districts Monitored", val: "18+", icon: <MapPin color={C.orange} size={20} /> },
            { label: "Prediction Accuracy", val: "92%", icon: <Activity color={C.green} size={20} /> },
            { label: "Active Community Users", val: "12K+", icon: <Users color={C.amber} size={20} /> },
          ].map((m, i) => (
            <div key={i}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>{m.icon}</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: C.text }}>{m.val}</div>
              <div style={{ color: C.dim, fontSize: 13, marginTop: 4 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Core Features */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 24px", flex: 1 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, textAlign: "center", marginBottom: 36 }}>Core Platform Capabilities</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {[
            { title: "AI Risk Prediction", desc: "Predict neighborhood safety scores dynamically based on historical crime patterns and time of day.", icon: <Cpu color={C.orange} size={22} /> },
            { title: "Safe Route Calculation", desc: "Find travel routes that actively steer clear of high-incident areas across Karachi.", icon: <Map color={C.green} size={22} /> },
            { title: "Live Heatmap Visualizer", desc: "Explore district-level crime densities using interactive spatial map tiles.", icon: <Bell color={C.amber} size={22} /> },
          ].map((f, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "26px" }}>
              <div style={{ background: C.cardDeep, borderRadius: 10, padding: 10, width: "fit-content", marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "20px 24px", textAlign: "center", color: C.dim, fontSize: 12 }}>
        © 2026 CrimeGuard — Final Year Project (AI & Software Engineering)
      </footer>
    </div>
  );
}