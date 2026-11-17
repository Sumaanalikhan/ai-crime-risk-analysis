// src/pages/Heatmap.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Marker,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import { Filter, ShieldAlert, Layers } from 'lucide-react';
import Navbar from '../components/Navbar';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ==========================================
// THERMAL ENGINE (float density field)
// ==========================================
const GRADIENT = [
  [0.0, '#1a1aff'],
  [0.2, '#00b4ff'],
  [0.38, '#00f0d0'],
  [0.52, '#3ddc4a'],
  [0.68, '#f5f500'],
  [0.84, '#ff8c00'],
  [1.0, '#ff1a00'],
];

function buildPalette() {
  const c = document.createElement('canvas');
  c.width = 1;
  c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  GRADIENT.forEach(([s, col]) => g.addColorStop(s, col));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1, 256);
  return ctx.getImageData(0, 0, 1, 256).data;
}

const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function createHeatLayer(points, opts) {
  const palette = buildPalette();
  const canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.pointerEvents = 'none';
  let map = null;
  const SCALE = 0.5;

  function draw() {
    if (!map) return;
    try {
      const size = map.getSize();
      const W = Math.round(size.x);
      const H = Math.round(size.y);
      if (W < 2 || H < 2) return;

      const w = Math.ceil(W * SCALE);
      const h = Math.ceil(H * SCALE);

      L.DomUtil.setPosition(canvas, map.containerPointToLayerPoint([0, 0]));
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';

      const lat = map.getCenter().lat;
      const metersPerPx =
        (40075016.686 * Math.cos((lat * Math.PI) / 180)) /
        (256 * Math.pow(2, map.getZoom()));
      const r = Math.max(opts.minRadiusPx, opts.radiusMeters / metersPerPx) * SCALE;
      const r2 = r * r;

      const density = new Float32Array(w * h);

      for (let n = 0; n < points.length; n++) {
        const pt = points[n];
        const p = map.latLngToContainerPoint([pt[0], pt[1]]);
        const px = p.x * SCALE;
        const py = p.y * SCALE;
        if (px < -r || py < -r || px > w + r || py > h + r) continue;

        const val = Math.pow(Math.min(1, Math.max(0, pt[2])), opts.power);
        const x0 = Math.max(0, Math.floor(px - r));
        const x1 = Math.min(w - 1, Math.ceil(px + r));
        const y0 = Math.max(0, Math.floor(py - r));
        const y1 = Math.min(h - 1, Math.ceil(py + r));

        for (let y = y0; y <= y1; y++) {
          const dy = y - py;
          const row = y * w;
          for (let x = x0; x <= x1; x++) {
            const dx = x - px;
            const d2 = (dx * dx + dy * dy) / r2;
            if (d2 >= 1) continue;
            density[row + x] += val * Math.exp(-4.0 * d2);
          }
        }
      }

      const ctx = canvas.getContext('2d');
      const img = ctx.createImageData(w, h);
      const d = img.data;
      const sat = opts.saturation;

      for (let i = 0, j = 0; i < density.length; i++, j += 4) {
        const dens = density[i];
        if (dens <= 0.001) continue;
        const t = Math.min(1, dens / sat);
        const a = smoothstep(0.01, 0.16, t) * opts.opacity;
        if (a <= 0) continue;
        const k = Math.min(255, Math.floor(t * 255)) * 4;
        d[j] = palette[k];
        d[j + 1] = palette[k + 1];
        d[j + 2] = palette[k + 2];
        d[j + 3] = a * 255;
      }
      ctx.putImageData(img, 0, 0);
      canvas.style.visibility = 'visible';
    } catch (err) {
      console.error('[Heatmap] draw error:', err);
    }
  }

  const hide = () => {
    canvas.style.visibility = 'hidden';
  };

  return {
    addTo(m) {
      map = m;
      if (!map.getPane('heatPane')) {
        const pane = map.createPane('heatPane');
        pane.style.zIndex = 350;
        pane.style.pointerEvents = 'none';
      }
      map.getPane('heatPane').appendChild(canvas);
      map.on('zoomstart movestart', hide);
      map.on('moveend zoomend resize', draw);
      draw();
    },
    remove() {
      if (!map) return;
      map.off('zoomstart movestart', hide);
      map.off('moveend zoomend resize', draw);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      map = null;
    },
  };
}

function TrueThermalLayer({ zones }) {
  const map = useMap();

  const points = useMemo(() => {
    if (!Array.isArray(zones)) return [];
    return zones
      .map((z) => [parseFloat(z.lat), parseFloat(z.lng), parseFloat(z.avgScore) / 100])
      .filter(([la, ln, v]) => Number.isFinite(la) && Number.isFinite(ln) && Number.isFinite(v));
  }, [zones]);

  useEffect(() => {
    const el = map.getContainer();
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);
    return () => ro.disconnect();
  }, [map]);

  useEffect(() => {
    const layer = createHeatLayer(points, {
      radiusMeters: 2800,
      minRadiusPx: 30,
      power: 2.2,
      saturation: 1.5,
      opacity: 0.8,
    });
    layer.addTo(map);
    return () => layer.remove();
  }, [map, points]);

  return null;
}

// ==========================================
// SMART LABELS (collision-free)
// ==========================================
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const riskColor = (risk) =>
  risk === 'High' ? '#ef4444' : risk === 'Low' ? '#22c55e' : '#f59e0b';

const hit = (a, b, pad = 3) =>
  a[0] < b[2] + pad && a[2] + pad > b[0] && a[1] < b[3] + pad && a[3] + pad > b[1];

function LabelLayer({ zones }) {
  const map = useMap();
  const [tick, setTick] = useState(0);
  const bump = () => setTick((t) => t + 1);
  useMapEvents({ moveend: bump, zoomend: bump, resize: bump });

  const labels = useMemo(() => {
    const size = map.getSize();
    const zoom = map.getZoom();
    const cap = zoom <= 10 ? 8 : zoom === 11 ? 18 : zoom === 12 ? 36 : zoom === 13 ? 70 : 999;

    const pts = [];
    for (const z of zones) {
      const lat = parseFloat(z.lat);
      const lng = parseFloat(z.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      const p = map.latLngToContainerPoint([lat, lng]);
      if (p.x < 6 || p.y < 6 || p.x > size.x - 6 || p.y > size.y - 6) continue;
      pts.push({ z, x: p.x, y: p.y });
    }

    // Obstacles: city overview panel + every dot
    const boxes = [[0, 0, 260, 120]];
    pts.forEach((p) => boxes.push([p.x - 5, p.y - 5, p.x + 5, p.y + 5]));

    const out = [];
    for (const p of pts) {
      if (out.length >= cap) break;
      const name = p.z.name.length > 22 ? p.z.name.slice(0, 21) + '…' : p.z.name;
      const w = name.length * 6 + 40;
      const h = 20;
      const cands = [
        ['r', [p.x + 9, p.y - h / 2, p.x + 9 + w, p.y + h / 2]],
        ['l', [p.x - 9 - w, p.y - h / 2, p.x - 9, p.y + h / 2]],
        ['t', [p.x - w / 2, p.y - 8 - h, p.x + w / 2, p.y - 8]],
        ['b', [p.x - w / 2, p.y + 8, p.x + w / 2, p.y + 8 + h]],
      ];
      for (const [dir, box] of cands) {
        const inView = box[0] >= 0 && box[2] <= size.x && box[1] >= 0 && box[3] <= size.y;
        if (!inView) continue;
        if (boxes.some((b) => hit(box, b))) continue;
        boxes.push(box);
        out.push({ z: p.z, name, dir });
        break;
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zones, tick, map]);

  return (
    <>
      {labels.map(({ z, name, dir }) => (
        <Marker
          key={`lbl-${z.id ?? z.name}-${z.rank}-${dir}`}
          position={[parseFloat(z.lat), parseFloat(z.lng)]}
          interactive={false}
          keyboard={false}
          icon={L.divIcon({
            className: 'cg-lbl-wrap',
            iconSize: [0, 0],
            html: `<div class="cg-lbl cg-${dir}"><span class="cg-rank" style="background:${riskColor(
              z.risk
            )}">${z.rank}</span><span class="cg-name">${esc(name)}</span></div>`,
          })}
        />
      ))}
    </>
  );
}

// ==========================================
// PAGE
// ==========================================
export default function Heatmap() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRisk, setSelectedRisk] = useState('All');
  const [selectedType, setSelectedType] = useState('All');

  useEffect(() => {
    const fetchHeatmapData = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/heatmap');
        const data = await res.json();
        if (data.success) setZones(data.zones);
      } catch (err) {
        console.error('Error loading live heatmap:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHeatmapData();
  }, []);

  const crimeCategories = ['All', ...new Set(zones.map((z) => z.type))];

  const filteredZones = useMemo(
    () =>
      zones.filter((zone) => {
        const matchesRisk = selectedRisk === 'All' || zone.risk === selectedRisk;
        const matchesType = selectedType === 'All' || zone.type === selectedType;
        return matchesRisk && matchesType;
      }),
    [zones, selectedRisk, selectedType]
  );

  // #1 = most dangerous
  const ranked = useMemo(
    () =>
      [...filteredZones]
        .sort((a, b) => parseFloat(b.avgScore) - parseFloat(a.avgScore))
        .map((z, i) => ({ ...z, rank: i + 1 })),
    [filteredZones]
  );

  const counts = useMemo(
    () => ({
      high: zones.filter((z) => z.risk === 'High').length,
      medium: zones.filter((z) => z.risk === 'Moderate' || z.risk === 'Medium').length,
      low: zones.filter((z) => z.risk === 'Low').length,
    }),
    [zones]
  );

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#0F172A] text-[#F1F5F9] flex flex-col font-sans">
      <style>{`
        .leaflet-container { background: #1b1f27; }
        .cg-tiles { filter: invert(1) hue-rotate(180deg) brightness(.82) contrast(.92) saturate(.45); }

        .cg-lbl-wrap { background: none; border: none; }
        .cg-lbl {
          position: absolute; display: flex; align-items: center; gap: 5px;
          white-space: nowrap; pointer-events: none;
          background: rgba(15,23,42,.88); border: 1px solid rgba(255,255,255,.16);
          border-radius: 999px; padding: 2px 8px 2px 3px; height: 20px;
          box-shadow: 0 2px 6px rgba(0,0,0,.45);
          font: 600 11px/1 ui-sans-serif, system-ui, sans-serif; color: #f1f5f9;
        }
        .cg-lbl.cg-r { left: 9px; top: -10px; }
        .cg-lbl.cg-l { right: 9px; top: -10px; }
        .cg-lbl.cg-t { left: 0; top: -8px; transform: translate(-50%, -100%); }
        .cg-lbl.cg-b { left: 0; top: 8px; transform: translateX(-50%); }
        .cg-rank {
          min-width: 14px; height: 14px; padding: 0 3px; border-radius: 999px;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 9px; font-weight: 800; color: #fff;
        }

        .cg-tip.leaflet-tooltip {
          background: #0F172A; border: 1px solid rgba(255,255,255,.15);
          border-radius: 12px; padding: 10px 12px; color: #e2e8f0;
          box-shadow: 0 8px 24px rgba(0,0,0,.5);
        }
        .cg-tip.leaflet-tooltip:before { display: none; }
      `}</style>

      <Navbar />

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row relative overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-full lg:w-96 bg-[#1E293B] border-r border-white/10 p-6 flex flex-col gap-6 z-10 overflow-y-auto">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0F172A] border border-white/10 text-[#F97316] text-xs font-bold tracking-widest uppercase mb-3">
              <Layers size={14} /> Spatial Mapping
            </span>
            <h1 className="text-3xl font-black text-white tracking-tight">Live Heatmap</h1>
            <p className="text-[#94A3B8] text-sm mt-1">
              Real-time crime density visualizer aggregated from 60,000 Karachi records.
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider flex items-center gap-2">
              <Filter size={14} /> Filter by Risk Level
            </label>
            <div className="flex flex-wrap gap-2">
              {['All', 'High', 'Moderate', 'Low'].map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedRisk(level)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedRisk === level
                      ? 'bg-[#F97316] text-white shadow-lg shadow-orange-500/20'
                      : 'bg-[#0F172A] border border-white/10 text-[#94A3B8] hover:text-white'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert size={14} /> Filter by Dominant Crime
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#F97316]"
            >
              {crimeCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-[#0F172A] border border-white/10 rounded-2xl p-4 grid grid-cols-2 gap-3 text-center">
            <div className="bg-[#1E293B] p-3 rounded-xl border border-white/5">
              <div className="text-2xl font-black text-white">{loading ? '...' : filteredZones.length}</div>
              <div className="text-[10px] text-[#64748B] uppercase font-bold">Districts Shown</div>
            </div>
            <div className="bg-[#1E293B] p-3 rounded-xl border border-white/5">
              <div className="text-2xl font-black text-red-500">
                {loading
                  ? '...'
                  : filteredZones.reduce((s, z) => s + (z.incidents || 0), 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-[#64748B] uppercase font-bold">Total Records</div>
            </div>
          </div>

          <div className="p-4 bg-[#0F172A] rounded-xl border border-white/10">
            <div className="mb-2 text-xs font-bold text-[#94A3B8] uppercase tracking-wider">
              Crime Density
            </div>
            <div
              className="h-2.5 w-full rounded"
              style={{
                background:
                  'linear-gradient(to right, #1a1aff, #00b4ff, #00f0d0, #3ddc4a, #f5f500, #ff8c00, #ff1a00)',
              }}
            />
            <div className="mt-1.5 flex justify-between text-[10px] font-bold text-[#64748B] uppercase">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
            </div>
            <div className="mt-3 text-[10px] text-[#64748B] leading-relaxed">
              Numbered badges rank districts by risk (1 = highest). More labels appear as you zoom in.
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 min-h-[500px] relative">
          <div className="absolute top-4 left-4 z-[1000] rounded-2xl bg-[#0F172A]/90 border border-white/10 px-5 py-4 backdrop-blur pointer-events-none">
            <div className="text-[10px] font-bold tracking-widest text-[#94A3B8] uppercase mb-2">
              City Overview
            </div>
            <div className="flex gap-6 text-center">
              <div>
                <div className="text-2xl font-black text-red-500">{counts.high}</div>
                <div className="text-[10px] text-[#94A3B8]">High</div>
              </div>
              <div>
                <div className="text-2xl font-black text-orange-400">{counts.medium}</div>
                <div className="text-[10px] text-[#94A3B8]">Medium</div>
              </div>
              <div>
                <div className="text-2xl font-black text-green-500">{counts.low}</div>
                <div className="text-[10px] text-[#94A3B8]">Low</div>
              </div>
            </div>
          </div>

          <MapContainer center={[24.89, 67.07]} zoom={11} zoomControl={true} className="w-full h-full z-[1]">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              className="cg-tiles"
              maxZoom={19}
            />

            <TrueThermalLayer zones={filteredZones} />

            {/* Small dots with rich hover details */}
            {ranked.map((zone, i) => (
              <CircleMarker
                key={`dot-${zone.id ?? i}`}
                center={[parseFloat(zone.lat), parseFloat(zone.lng)]}
                radius={3.5}
                pathOptions={{
                  color: '#0b1220',
                  weight: 1.5,
                  fillColor: '#ffffff',
                  fillOpacity: 1,
                }}
              >
                <Tooltip direction="top" offset={[0, -6]} opacity={1} className="cg-tip">
                  <div className="font-sans min-w-[150px]">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center justify-center rounded-full text-white text-[10px] font-extrabold px-1.5 h-4"
                        style={{ background: riskColor(zone.risk) }}
                      >
                        #{zone.rank}
                      </span>
                      <span className="font-bold text-sm text-white">{zone.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                      {zone.town}
                    </div>
                    <div className="text-xs text-slate-300 mt-1.5">
                      Dominant crime: <b className="text-white">{zone.type}</b>
                    </div>
                    <div className="text-xs text-slate-300">
                      Risk index: <b className="text-white">{zone.avgScore} / 100</b>
                    </div>
                  </div>
                </Tooltip>
              </CircleMarker>
            ))}

            <LabelLayer zones={ranked} />
          </MapContainer>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] rounded-full bg-[#0F172A]/90 border border-white/10 px-5 py-2.5 text-xs text-slate-300 backdrop-blur pointer-events-none whitespace-nowrap">
            Hover any dot to view district details
          </div>
        </div>
      </div>
    </div>
  );
}