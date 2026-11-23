import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Circle,
  Marker,
  Polyline,
  Tooltip,
  Pane,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import {
  Navigation,
  ShieldAlert,
  CheckCircle,
  Info,
  Map as MapIcon,
  Clock,
  Moon,
  Sun,
  Search,
  RotateCcw,
  Zap,
  Shield,
  Scale,
  ArrowUpDown,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as turf from '@turf/turf';

const API_URL = 'http://localhost:5000/api/heatmap';
const KARACHI_CENTER = [24.89, 67.07];
const DANGER_THRESHOLD = 65;
const NIGHT_MULT = 1.5;
const INFLUENCE_KM_DAY = 1.5;
const INFLUENCE_KM_NIGHT = INFLUENCE_KM_DAY * NIGHT_MULT;
const WARN_KM_DAY = 0.9;
const WARN_KM_NIGHT = WARN_KM_DAY * NIGHT_MULT;

const PROFILES = [
  {
    key: 'safe',
    label: 'Completely Safe',
    title: 'Completely Safe',
    subtitle: 'Avoids crime areas, ignores distance',
    color: '#16a34a',
    alpha: 25.0,
  },
  {
    key: 'balanced',
    label: 'Medium Risk',
    title: 'Balanced Route',
    subtitle: 'Some risky areas, some safe, medium length',
    color: '#2563eb',
    alpha: 4.0,
  },
  {
    key: 'fast',
    label: 'Fastest / Risky',
    title: 'Fastest Route',
    subtitle: 'Shortest distance, ignores crime',
    color: '#dc2626',
    alpha: 0.0,
  },
];

const PROFILE_ICONS = { safe: Shield, balanced: Scale, fast: Zap };
const PROFILE_BTN = { safe: 'bg-green-600', balanced: 'bg-blue-600', fast: 'bg-red-600' };

const pinIcon = (color, letter) =>
  L.divIcon({
    className: 'cg-pin',
    html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 12px ${color};display:flex;align-items:center;justify-content:center;color:#fff;font:800 12px/1 system-ui,sans-serif;">${letter}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
const startIcon = pinIcon('#22c55e', 'A');
const endIcon = pinIcon('#3b82f6', 'B');

const fmtCoord = (p) => `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`;
const COORD_RE = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/;

function distMeters(aLat, aLng, bLat, bLng) {
  const dLat = (bLat - aLat) * 111320;
  const dLng = (bLng - aLng) * 111320 * Math.cos((((aLat + bLat) / 2) * Math.PI) / 180);
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

// ==========================================
// SPATIAL CRIME FIELD
// ==========================================
const CELL = 0.03;

function buildZoneIndex(zones) {
  const idx = new Map();
  for (const z of zones) {
    const key = `${Math.floor(z.lat / CELL)}:${Math.floor(z.lng / CELL)}`;
    if (!idx.has(key)) idx.set(key, []);
    idx.get(key).push(z);
  }
  return idx;
}

function pointRisks(idx, lat, lng) {
  const cx = Math.floor(lat / CELL);
  const cy = Math.floor(lng / CELL);
  let day = 0;
  let night = 0;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const list = idx.get(`${cx + dx}:${cy + dy}`);
      if (!list) continue;
      for (const z of list) {
        const dLat = (lat - z.lat) * 111.2;
        const dLng = (lng - z.lng) * 100.7;
        const d = Math.sqrt(dLat * dLat + dLng * dLng);
        if (d >= INFLUENCE_KM_NIGHT) continue;
        const s = z.score / 100;
        const w = s * s;
        const fn = 1 - d / INFLUENCE_KM_NIGHT;
        night += w * fn * fn;
        if (d < INFLUENCE_KM_DAY) {
          const fd = 1 - d / INFLUENCE_KM_DAY;
          day += w * fd * fd;
        }
      }
    }
  }
  return [day, night];
}

// ==========================================
// DIJKSTRA OVER MULTI-CORRIDOR REAL ROAD GRAPH
// ==========================================
class MinHeap {
  constructor() {
    this.heap = [];
  }
  get size() {
    return this.heap.length;
  }
  push(node) {
    const h = this.heap;
    h.push(node);
    let i = h.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (h[p].cost <= node.cost) break;
      h[i] = h[p];
      i = p;
    }
    h[i] = node;
  }
  pop() {
    const h = this.heap;
    if (!h.length) return null;
    const top = h[0];
    const last = h.pop();
    if (h.length) {
      let i = 0;
      while (true) {
        let c = 2 * i + 1;
        if (c >= h.length) break;
        if (c + 1 < h.length && h[c + 1].cost < h[c].cost) c++;
        if (h[c].cost >= last.cost) break;
        h[i] = h[c];
        i = c;
      }
      h[i] = last;
    }
    return top;
  }
}

function runDijkstraOnCorridors(corridors, alpha, mult) {
  const nodeMap = new Map();
  const nodes = [];
  const adj = [];

  const getNodeId = (lat, lng) => {
    const key = `${Math.round(lat * 7000)}:${Math.round(lng * 7000)}`;
    let id = nodeMap.get(key);
    if (id === undefined) {
      id = nodes.length;
      nodeMap.set(key, id);
      nodes.push([lat, lng]);
      adj.push([]);
    }
    return id;
  };

  let startId = null;
  let endId = null;

  for (const c of corridors) {
    if (c.coords.length < 2) continue;
    const s = getNodeId(c.coords[0][0], c.coords[0][1]);
    const e = getNodeId(c.coords[c.coords.length - 1][0], c.coords[c.coords.length - 1][1]);
    if (startId === null) startId = s;
    if (endId === null) endId = e;

    for (let i = 0; i < c.coords.length - 1; i++) {
      const [lat1, lng1] = c.coords[i];
      const [lat2, lng2] = c.coords[i + 1];
      const u = getNodeId(lat1, lng1);
      const v = getNodeId(lat2, lng2);
      if (u === v) continue;
      const d = distMeters(lat1, lng1, lat2, lng2);
      const r = c.segRisks[i] || 0;
      const secs = d / (35 / 3.6);
      adj[u].push({ to: v, d, r, secs });
      adj[v].push({ to: u, d, r, secs });
    }
  }

  const dist = new Float64Array(nodes.length).fill(Infinity);
  const prev = new Int32Array(nodes.length).fill(-1);
  const prevEdge = new Array(nodes.length);
  const pq = new MinHeap();

  dist[startId] = 0;
  pq.push({ id: startId, cost: 0 });
  const weightFactor = alpha * mult;

  while (pq.size > 0) {
    const { id: u, cost } = pq.pop();
    if (cost > dist[u]) continue;
    if (u === endId) break;
    for (const edge of adj[u]) {
      const alt = cost + edge.d * (1 + weightFactor * edge.r * edge.r);
      if (alt < dist[edge.to]) {
        dist[edge.to] = alt;
        prev[edge.to] = u;
        prevEdge[edge.to] = edge;
        pq.push({ id: edge.to, cost: alt });
      }
    }
  }

  if (dist[endId] === Infinity) return null;

  const coords = [];
  let totalDist = 0;
  let totalSecs = 0;
  let riskSum = 0;
  let cur = endId;

  while (cur !== -1) {
    coords.push(nodes[cur]);
    const e = prevEdge[cur];
    if (e && cur !== startId) {
      totalDist += e.d;
      totalSecs += e.secs;
      riskSum += e.r * e.d;
    }
    cur = prev[cur];
  }
  coords.reverse();

  return {
    coords,
    dist: totalDist,
    secs: totalSecs,
    exp: totalDist ? riskSum / totalDist : 0,
    sig: `${Math.round(totalDist / 25)}:${coords.length}`,
  };
}

function findWarnings(coords, dangerZones, warnKm) {
  if (coords.length < 2) return [];
  const line = turf.lineString(coords.map(([la, ln]) => [ln, la]));
  const out = [];
  for (const z of dangerZones) {
    const dkm = turf.pointToLineDistance(turf.point([z.lng, z.lat]), line, { units: 'kilometers' });
    if (dkm <= warnKm) out.push({ ...z, distKm: dkm });
  }
  out.sort((a, b) => b.score - a.score);
  return out;
}

async function computeFastStreetRoutes({ start, end, night, zoneIdx, dangerZones, signal }) {
  const ti = night ? 1 : 0;
  const mult = night ? NIGHT_MULT : 1;
  const warnKm = night ? WARN_KM_NIGHT : WARN_KM_DAY;

  const fetchOsrm = async (pts, alternatives) => {
    const path = pts.map((p) => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${path}?overview=full&geometries=geojson&alternatives=${alternatives}`;
    const res = await fetch(url, { signal });
    if (!res.ok) return [];
    const data = await res.json();
    return data.code === 'Ok' && Array.isArray(data.routes) ? data.routes : [];
  };

  const dx = (end.lng - start.lng) * 100.7;
  const dy = (end.lat - start.lat) * 111.2;
  const len = Math.hypot(dx, dy) || 1;
  const midLat = (start.lat + end.lat) / 2;
  const midLng = (start.lng + end.lng) / 2;

  const requests = [fetchOsrm([start, end], true)];
  for (const offsetRatio of [-0.45, -0.25, -0.12, 0.12, 0.25, 0.45]) {
    const offsetKm = Math.min(5.5, len * offsetRatio);
    const via = {
      lat: midLat + ((dx / len) * offsetKm) / 111.2,
      lng: midLng + ((-dy / len) * offsetKm) / 100.7,
    };
    requests.push(fetchOsrm([start, via, end], false));
  }

  const settled = await Promise.allSettled(requests);
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

  const corridors = [];
  const allSegRisks = [];

  for (const item of settled) {
    if (item.status !== 'fulfilled') continue;
    for (const r of item.value) {
      const coords = r.geometry.coordinates.map(([ln, la]) => [la, ln]);
      const rawRisks = [];
      for (let i = 0; i < coords.length - 1; i++) {
        const riskVal = pointRisks(
          zoneIdx,
          (coords[i][0] + coords[i + 1][0]) / 2,
          (coords[i][1] + coords[i + 1][1]) / 2
        )[ti];
        rawRisks.push(riskVal);
        allSegRisks.push(riskVal);
      }
      corridors.push({ coords, rawRisks });
    }
  }

  if (!corridors.length) {
    throw new Error('Could not fetch real road geometry. Please check your internet connection.');
  }

  allSegRisks.sort((a, b) => a - b);
  const scale = allSegRisks[Math.floor(allSegRisks.length * 0.95)] || allSegRisks[allSegRisks.length - 1] || 1;
  const normFactor = scale > 1e-9 ? scale : 1;

  for (const c of corridors) {
    c.segRisks = c.rawRisks.map((v) => Math.min(1, v / normFactor));
  }

  const routes = PROFILES.map((prof) => {
    const res = runDijkstraOnCorridors(corridors, prof.alpha, mult);
    return {
      ...prof,
      coords: res.coords,
      distance: (res.dist / 1000).toFixed(1),
      time: Math.max(2, Math.round((res.secs * 1.15) / 60)),
      exposure: Math.round(res.exp * 100),
      warnings: findWarnings(res.coords, dangerZones, warnKm),
      sig: res.sig,
    };
  });

  const fastest = routes.find((r) => r.key === 'fast');
  routes.forEach((r, i) => {
    const twin = routes.slice(0, i).find((o) => o.sig === r.sig);
    r.sameAs = twin ? twin.label : null;
    r.extraMin = r.time - fastest.time;
  });

  const distinct = new Set(routes.map((r) => r.sig)).size;
  const notice =
    distinct < 3
      ? `Found ${distinct} distinct real-road corridor${distinct > 1 ? 's' : ''} between these points.`
      : '';

  return { routes, notice };
}

// ==========================================
// MAP HELPERS
// ==========================================
function FitRouteBounds({ routes, sig }) {
  const map = useMap();
  const last = useRef(null);
  useEffect(() => {
    if (!sig || !routes.length || last.current === sig) return;
    last.current = sig;
    const pts = routes.flatMap((r) => r.coords);
    if (pts.length) map.fitBounds(L.latLngBounds(pts), { padding: [60, 60], maxZoom: 15 });
  }, [routes, sig, map]);
  return null;
}

function MapPinDropper({ start, end, setStart, setEnd, setStartText, setEndText, resetRoute }) {
  useMapEvents({
    click(e) {
      const p = { lat: e.latlng.lat, lng: e.latlng.lng };
      if (!start) {
        setStart(p);
        setStartText(fmtCoord(p));
      } else if (!end) {
        setEnd(p);
        setEndText(fmtCoord(p));
      } else {
        resetRoute();
        setStart(p);
        setStartText(fmtCoord(p));
      }
    },
  });
  return null;
}

function RouteLine({ route, active, dark, onSelect }) {
  const casingRef = useRef(null);
  const lineRef = useRef(null);
  useEffect(() => {
    if (!active) return;
    casingRef.current?.bringToFront?.();
    lineRef.current?.bringToFront?.();
  }, [active, route]);

  return (
    <>
      <Polyline
        ref={casingRef}
        positions={route.coords}
        pathOptions={{
          color: dark ? '#0b1220' : '#ffffff',
          weight: active ? 13 : 8,
          opacity: active ? 0.95 : 0.75,
          lineCap: 'round',
          lineJoin: 'round',
          interactive: false,
        }}
      />
      <Polyline
        ref={lineRef}
        positions={route.coords}
        pathOptions={{
          color: route.color,
          weight: active ? 7 : 4.5,
          opacity: active ? 1 : 0.85,
          lineCap: 'round',
          lineJoin: 'round',
        }}
        eventHandlers={{ click: onSelect }}
      >
        <Tooltip sticky>
          {route.label} • {route.distance} km • {route.time} min
        </Tooltip>
      </Polyline>
    </>
  );
}

// ==========================================
// MAIN PAGE
// ==========================================
export default function SafeRoutes() {
  const [zones, setZones] = useState([]);
  const [zonesStatus, setZonesStatus] = useState('loading');
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [startText, setStartText] = useState('');
  const [endText, setEndText] = useState('');
  const [computing, setComputing] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [mapTheme, setMapTheme] = useState('light');
  const [timeOfDay, setTimeOfDay] = useState('Day');
  const [selectedProfile, setSelectedProfile] = useState('safe');
  const [computedRoutes, setComputedRoutes] = useState([]);

  const night = timeOfDay === 'Night';
  const dark = mapTheme === 'dark';

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(API_URL, { signal: ctrl.signal });
        const data = await res.json();
        if (data.success && Array.isArray(data.zones)) {
          setZones(data.zones);
          setZonesStatus('ready');
        }
      } catch (err) {
        if (!ctrl.signal.aborted) setZonesStatus('error');
      }
    })();
    return () => ctrl.abort();
  }, []);

  const appliedStorageRef = useRef(false);

  useEffect(() => {
    if (appliedStorageRef.current) return;
    const raw = sessionStorage.getItem('cg_pending_route');
    if (!raw) return;

    appliedStorageRef.current = true;
    sessionStorage.removeItem('cg_pending_route');
    try {
      const incoming = JSON.parse(raw);
      if (Number.isFinite(incoming.lat) && Number.isFinite(incoming.lng)) {
        setEnd({ lat: incoming.lat, lng: incoming.lng });
        setEndText(incoming.label || fmtCoord({ lat: incoming.lat, lng: incoming.lng }));
        if (incoming.timeOfDay === 'Night' || incoming.timeOfDay === 'Day') {
          setTimeOfDay(incoming.timeOfDay);
        }
        setNotice(`Destination pre-filled: ${incoming.label}. Select or click departure point A.`);
      }
    } catch (err) {
      console.error('Failed to parse pending route:', err);
    }
  }, []);

  const zonesNorm = useMemo(
    () =>
      zones
        .map((z) => ({ ...z, lat: parseFloat(z.lat), lng: parseFloat(z.lng), score: parseFloat(z.avgScore) }))
        .filter((z) => Number.isFinite(z.lat) && Number.isFinite(z.lng) && Number.isFinite(z.score)),
    [zones]
  );
  const zoneIdx = useMemo(() => buildZoneIndex(zonesNorm), [zonesNorm]);
  const dangerZones = useMemo(() => zonesNorm.filter((z) => z.score >= DANGER_THRESHOLD), [zonesNorm]);

  const locationOptions = useMemo(() => {
    const seen = new Map();
    for (const z of zonesNorm) {
      const label = `${z.name} (${z.town})`;
      if (!seen.has(label)) seen.set(label, { label, name: z.name, lat: z.lat, lng: z.lng });
    }
    return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [zonesNorm]);

  const resolveLocation = async (query, fieldName) => {
    const raw = query.trim();
    const m = raw.match(COORD_RE);
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };

    const clean = raw.toLowerCase();
    const exactLabel = locationOptions.find((o) => o.label.toLowerCase() === clean);
    if (exactLabel) return { lat: exactLabel.lat, lng: exactLabel.lng };

    const partial = locationOptions.filter((o) => o.label.toLowerCase().includes(clean));
    if (partial.length >= 1) return { lat: partial[0].lat, lng: partial[0].lng };

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=pk&q=${encodeURIComponent(
        raw + ', Karachi'
      )}`
    );
    const data = await res.json();
    if (data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    throw new Error(`Could not find ${fieldName} "${raw}". Pick an area from the dropdown.`);
  };

  useEffect(() => {
    if (!start || !end || zonesStatus === 'loading') return;
    if (distMeters(start.lat, start.lng, end.lat, end.lng) < 100) {
      setComputedRoutes([]);
      setError('Start and destination are too close together.');
      return;
    }

    const ctrl = new AbortController();
    setComputing(true);
    setError('');

    (async () => {
      try {
        const out = await computeFastStreetRoutes({
          start,
          end,
          night,
          zoneIdx,
          dangerZones,
          signal: ctrl.signal,
        });
        if (ctrl.signal.aborted) return;
        setComputedRoutes(out.routes);
        setNotice(out.notice);
      } catch (err) {
        if (ctrl.signal.aborted) return;
        setComputedRoutes([]);
        setError(err.message || 'Routing failed.');
      } finally {
        if (!ctrl.signal.aborted) setComputing(false);
      }
    })();

    return () => ctrl.abort();
  }, [start, end, night, zonesStatus, zoneIdx, dangerZones]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    if (!startText.trim() || !endText.trim()) {
      setError('Enter both a departure and a destination.');
      return;
    }
    setResolving(true);
    try {
      const a = await resolveLocation(startText, 'departure');
      const b = await resolveLocation(endText, 'destination');
      setStart(a);
      setEnd(b);
    } catch (err) {
      setError(err.message);
    } finally {
      setResolving(false);
    }
  };

  const resetRoute = () => {
    setStart(null);
    setEnd(null);
    setStartText('');
    setEndText('');
    setComputedRoutes([]);
    setError('');
    setNotice('');
  };

  const swapEnds = () => {
    setStart(end);
    setEnd(start);
    setStartText(endText);
    setEndText(startText);
  };

  const busy = computing || resolving;
  const activeRoute = computedRoutes.find((r) => r.key === selectedProfile) || computedRoutes[0];
  const routesSig = computedRoutes.length ? computedRoutes.map((r) => r.sig).join('|') : null;
  const dangerRadiusM = (night ? WARN_KM_NIGHT : WARN_KM_DAY) * 1000;

  const exposureLabel = (v) =>
    v < 25 ? { t: 'Low', c: 'text-green-400' } : v < 50 ? { t: 'Moderate', c: 'text-amber-400' } : { t: 'High', c: 'text-red-400' };

  const drawOrder = [...computedRoutes].sort((a, b) =>
    a.key === activeRoute?.key ? 1 : b.key === activeRoute?.key ? -1 : 0
  );

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#0F172A] text-[#F1F5F9] flex flex-col font-sans">
      <style>{`.cg-pin { background: none; border: none; }`}</style>
      <Navbar />

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row relative overflow-hidden">
        {/* Sidebar */}
        <div className="w-full lg:w-[450px] bg-[#1E293B] border-r border-white/10 p-5 sm:p-6 flex flex-col gap-5 z-10 overflow-y-auto">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0F172A] border border-white/10 text-[#3b82f6] text-xs font-bold tracking-widest uppercase mb-3">
              <Navigation size={14} /> Weighted Dijkstra Engine
            </span>
            <h1 className="text-3xl font-black text-white tracking-tight">Safe Routes</h1>
            <p className="text-[#94A3B8] text-sm mt-1">
              Three real-street crime-aware paths for Karachi. Pick your risk tolerance.
            </p>
          </div>

          <form onSubmit={handleSearch} className="bg-[#0F172A] border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Select Karachi Areas</div>
            <datalist id="karachi-areas">
              {locationOptions.map((opt) => (
                <option key={opt.label} value={opt.label} />
              ))}
            </datalist>

            <div className="flex items-stretch gap-2">
              <div className="flex-1 space-y-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-green-500 text-white text-[10px] font-black flex items-center justify-center">
                    A
                  </span>
                  <input
                    type="text"
                    list="karachi-areas"
                    placeholder="Departure (e.g. Landhi...)"
                    value={startText}
                    onChange={(e) => setStartText(e.target.value)}
                    className="w-full bg-[#1E293B] border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-green-500"
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-black flex items-center justify-center">
                    B
                  </span>
                  <input
                    type="text"
                    list="karachi-areas"
                    placeholder="Destination (e.g. DHA...)"
                    value={endText}
                    onChange={(e) => setEndText(e.target.value)}
                    className="w-full bg-[#1E293B] border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={swapEnds}
                disabled={!startText && !endText}
                title="Swap start and destination"
                className="px-2.5 bg-[#1E293B] hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-xl border border-white/10"
              >
                <ArrowUpDown size={16} />
              </button>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={busy}
                className="flex-1 bg-[#3b82f6] hover:bg-blue-600 disabled:opacity-60 text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                {busy ? 'Calculating...' : 'Calculate 3 Routes'}
              </button>
              {(start || end || startText || endText) && (
                <button
                  type="button"
                  onClick={resetRoute}
                  className="px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-white/10"
                  title="Clear Route"
                >
                  <RotateCcw size={15} />
                </button>
              )}
            </div>
          </form>

          {error && (
            <div className="flex gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!computing && notice && (
            <div className="flex gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-200 text-xs">
              <Info size={15} className="shrink-0 mt-0.5" />
              <span>{notice}</span>
            </div>
          )}

          {/* Time + Preference */}
          <div className="bg-[#0F172A] border border-white/10 rounded-2xl p-4 space-y-4">
            <div>
              <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Travel Time Context</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTimeOfDay('Day')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                    timeOfDay === 'Day' ? 'bg-[#3b82f6] text-white' : 'bg-[#1E293B] text-[#94A3B8] border border-white/5'
                  }`}
                >
                  <Clock size={14} /> Daytime
                </button>
                <button
                  type="button"
                  onClick={() => setTimeOfDay('Night')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                    timeOfDay === 'Night'
                      ? 'bg-[#8b5cf6] text-white shadow-lg shadow-purple-500/20'
                      : 'bg-[#1E293B] text-[#94A3B8] border border-white/5'
                  }`}
                >
                  <Moon size={14} /> Night (1.5x Risk)
                </button>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Your Risk Preference</div>
              <div className="grid grid-cols-3 gap-2">
                {PROFILES.map((p) => {
                  const Icon = PROFILE_ICONS[p.key];
                  const active = selectedProfile === p.key;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setSelectedProfile(p.key)}
                      className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                        active
                          ? `${PROFILE_BTN[p.key]} text-white shadow-lg`
                          : 'bg-[#1E293B] text-[#94A3B8] border border-white/5 hover:text-white'
                      }`}
                    >
                      <Icon size={14} />
                      <span className="text-[11px] leading-tight text-center">{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Route Cards */}
          {computedRoutes.length > 0 && (
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider flex items-center gap-2">
                <MapIcon size={14} /> Calculated Street Paths
              </div>
              {computedRoutes.map((route) => {
                const isSelected = route.key === activeRoute?.key;
                const ex = exposureLabel(route.exposure);
                return (
                  <div
                    key={route.key}
                    onClick={() => setSelectedProfile(route.key)}
                    style={{ borderColor: isSelected ? route.color : 'rgba(255,255,255,0.06)' }}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected ? 'bg-[#0F172A] shadow-lg' : 'bg-[#1E293B]/70 hover:bg-[#1E293B]'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3 mb-1">
                      <div className="font-bold text-sm text-white flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full inline-block shrink-0" style={{ backgroundColor: route.color }} />
                        {route.title}
                      </div>
                      <div className="text-sm font-black text-white whitespace-nowrap">
                        {route.time} <span className="text-[10px] text-slate-400 font-normal">min</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs pl-5 gap-3">
                      <span className="text-slate-400">
                        {route.distance} km • {route.sameAs ? `Same path as ${route.sameAs}` : route.subtitle}
                      </span>
                      <span className={`whitespace-nowrap font-bold ${ex.c}`}>{ex.t} risk</span>
                    </div>
                    <div className="pl-5 mt-1 flex justify-between text-[11px]">
                      <span className="text-slate-500">{route.warnings.length} hotspot(s) nearby</span>
                      {route.extraMin > 0 && <span className="text-amber-300/90">+{route.extraMin} min vs fastest</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Selected Route Analysis */}
          {activeRoute && (
            <div className="bg-[#0F172A] border border-white/10 rounded-2xl p-4 space-y-3 mt-auto">
              <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider flex items-center gap-2">
                <Info size={14} /> Selected: {activeRoute.title}
              </div>

              {activeRoute.warnings.length > 0 ? (
                <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <div className="flex items-center gap-2 text-red-500 font-black text-sm mb-1.5">
                    <ShieldAlert size={16} /> PASSES NEAR {activeRoute.warnings.length} HIGH-RISK ZONE
                    {activeRoute.warnings.length > 1 ? 'S' : ''}
                  </div>
                  <ul className="space-y-1.5 max-h-[130px] overflow-y-auto pr-1">
                    {activeRoute.warnings.map((r, i) => (
                      <li key={`${r.id ?? r.name}-${i}`} className="bg-red-500/20 px-3 py-1.5 rounded-lg text-xs border border-red-500/20">
                        <div className="font-bold text-red-400">
                          {r.name}, {r.town}
                        </div>
                        <div className="text-red-300/80 text-[11px]">
                          Primary Threat: {r.type} (Score: {r.avgScore}) • {r.distKm.toFixed(1)} km from route
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="p-3.5 bg-green-500/10 border border-green-500/30 rounded-xl">
                  <div className="flex items-center gap-2 text-green-500 font-black text-sm mb-1">
                    <CheckCircle size={16} /> HOTSPOT-FREE CORRIDOR
                  </div>
                  <p className="text-xs text-green-200/80">
                    This path stays clear of all high-risk zones for {timeOfDay.toLowerCase()} travel.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Map */}
        <div
          className="flex-1 h-[65vh] lg:h-auto min-h-[460px] relative"
          style={{ background: dark ? '#1b1f27' : '#e5e7eb' }}
        >
          <div className="absolute top-4 right-4 z-[1000] flex bg-[#0F172A]/90 backdrop-blur border border-white/15 rounded-full p-1 shadow-xl">
            <button
              type="button"
              onClick={() => setMapTheme('light')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                mapTheme === 'light' ? 'bg-white text-slate-900 shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Sun size={13} /> Light
            </button>
            <button
              type="button"
              onClick={() => setMapTheme('dark')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                mapTheme === 'dark' ? 'bg-[#3b82f6] text-white shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Moon size={13} /> Dark
            </button>
          </div>

          {computing && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 rounded-full bg-[#0F172A]/90 border border-white/15 px-4 py-2 text-xs text-slate-200 shadow-xl pointer-events-none">
              <Loader2 size={14} className="animate-spin" /> Calculating real street corridors…
            </div>
          )}

          <MapContainer center={KARACHI_CENTER} zoom={12} zoomControl={true} className="w-full h-full z-[1]">
            {dark ? (
              <>
                <TileLayer
                  key="dark-base"
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                  attribution="&copy; Esri"
                  maxNativeZoom={16}
                  maxZoom={19}
                />
                <TileLayer
                  key="dark-labels"
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
                  maxNativeZoom={16}
                  maxZoom={19}
                />
              </>
            ) : (
              <TileLayer
                key="light"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
                maxZoom={19}
              />
            )}

            <Pane name="danger-pane" style={{ zIndex: 390 }}>
              {dangerZones.map((zone, i) => (
                <Circle
                  key={`danger-${zone.id ?? i}`}
                  center={[zone.lat, zone.lng]}
                  radius={dangerRadiusM}
                  pathOptions={{
                    color: '#ef4444',
                    weight: 1,
                    fillColor: '#ef4444',
                    fillOpacity: night ? 0.22 : 0.13,
                    interactive: false,
                  }}
                />
              ))}
            </Pane>

            <Pane name="route-pane" style={{ zIndex: 410 }}>
              {drawOrder.map((route) => (
                <RouteLine
                  key={`${route.key}-${route.sig}-${mapTheme}-${route.key === activeRoute?.key ? 'a' : 'i'}`}
                  route={route}
                  active={route.key === activeRoute?.key}
                  dark={dark}
                  onSelect={() => setSelectedProfile(route.key)}
                />
              ))}
            </Pane>

            {start && (
              <Marker
                position={[start.lat, start.lng]}
                icon={startIcon}
                draggable
                zIndexOffset={1000}
                eventHandlers={{
                  dragend: (e) => {
                    const p = e.target.getLatLng();
                    const next = { lat: p.lat, lng: p.lng };
                    setStart(next);
                    setStartText(fmtCoord(next));
                  },
                }}
              />
            )}
            {end && (
              <Marker
                position={[end.lat, end.lng]}
                icon={endIcon}
                draggable
                zIndexOffset={1000}
                eventHandlers={{
                  dragend: (e) => {
                    const p = e.target.getLatLng();
                    const next = { lat: p.lat, lng: p.lng };
                    setEnd(next);
                    setEndText(fmtCoord(next));
                  },
                }}
              />
            )}

            <MapPinDropper
              start={start}
              end={end}
              setStart={setStart}
              setEnd={setEnd}
              setStartText={setStartText}
              setEndText={setEndText}
              resetRoute={resetRoute}
            />
            <FitRouteBounds routes={computedRoutes} sig={routesSig} />
          </MapContainer>
        </div>
      </div>
    </div>
  );
}