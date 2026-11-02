import { Link, useLocation } from 'react-router-dom';
import { Shield } from 'lucide-react';

const C = {
  card: "#1E293B",
  border: "rgba(255,255,255,0.08)",
  text: "#F1F5F9",
  muted: "#94A3B8",
  orange: "#F97316",
};

export default function Navbar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const links = [
  { path: "/welcome", label: "Welcome" },
  { path: "/", label: "Dashboard" },
  { path: "/predict", label: "Predict Risk" },
  { path: "/routes", label: "Safe Routes" },
  { path: "/heatmap", label: "Heatmap" },
];

  return (
    <nav style={{ background: C.card, borderBottom: `1px solid ${C.border}`, height: 62, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 36px", flexShrink: 0 }}>
      <Link to="/" style={{ textDecoration: 'none', display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{ background: C.orange, borderRadius: 8, padding: 5, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Shield size={16} color="#fff" strokeWidth={2.5} />
        </div>
        <span style={{ color: C.text, fontSize: "15px", fontWeight: 800, letterSpacing: "-0.02em" }}>
          Crime<span style={{ color: C.orange }}>Guard</span>
        </span>
      </Link>
      
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        {links.map(l => {
          const isActive = currentPath === l.path;
          return (
            <Link
              key={l.path}
              to={l.path}
              style={{
                textDecoration: "none",
                color: isActive ? C.orange : C.muted,
                fontSize: 14, 
                fontWeight: isActive ? 600 : 400,
                padding: "4px 0",
                borderBottom: isActive ? `2px solid ${C.orange}` : "2px solid transparent",
                transition: "color 0.15s, border-color 0.15s",
              }}
            >
              {l.label}
            </Link>
          );
        })}
      </div>
      
      <button style={{ background: C.orange, color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
        Login
      </button>
    </nav>
  );
}