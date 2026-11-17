// // frontend/src/pages/SafeRoutes.jsx
// import React, { useState, useEffect, useMemo, useRef } from 'react';
// import {
//   MapContainer,
//   TileLayer,
//   Circle,
//   Marker,
//   Polyline,
//   Tooltip,
//   Pane,
//   useMap,
//   useMapEvents,
// } from 'react-leaflet';
// import {
//   Navigation,
//   ShieldAlert,
//   CheckCircle,
//   Info,
//   Map as MapIcon,
//   Clock,
//   Moon,
//   Sun,
//   Search,
//   RotateCcw,
//   Zap,
//   Shield,
//   Scale,
//   ArrowUpDown,
//   Loader2,
//   AlertTriangle,
// } from 'lucide-react';
// import Navbar from '../components/Navbar';
// import L from 'leaflet';
// import 'leaflet/dist/leaflet.css';
// import * as turf from '@turf/turf';

// // ==========================================
// // CONSTANTS
// // ==========================================
// const API_URL = 'http://localhost:5000/api/heatmap';
// const KARACHI_CENTER = [24.89, 67.07];
// const DANGER_THRESHOLD = 65;
// const NIGHT_MULT = 1.5;
// const INFLUENCE_KM_DAY = 1.5; // how far a hotspot "glows" onto nearby roads
// const INFLUENCE_KM_NIGHT = INFLUENCE_KM_DAY * NIGHT_MULT;
// const WARN_KM_DAY = 0.9;
// const WARN_KM_NIGHT = WARN_KM_DAY * NIGHT_MULT;
// const MAX_SNAP_METERS = 3000;

// const OVERPASS_MIRRORS = [
//   'https://overpass-api.de/api/interpreter',
//   'https://overpass.kumi.systems/api/interpreter',
//   'https://overpass.private.coffee/api/interpreter',
// ];

// const PROFILES = [
//   {
//     key: 'safe',
//     label: 'Completely Safe',
//     title: 'Completely Safe',
//     subtitle: 'Avoids crime areas, ignores distance',
//     color: '#16a34a',
//   },
//   {
//     key: 'balanced',
//     label: 'Medium Risk',
//     title: 'Balanced Route',
//     subtitle: 'Some risky areas, some safe, medium length',
//     color: '#2563eb',
//   },
//   {
//     key: 'fast',
//     label: 'Fastest / Risky',
//     title: 'Fastest Route',
//     subtitle: 'Shortest distance, ignores crime',
//     color: '#dc2626',
//   },
// ];

// const PROFILE_ICONS = { safe: Shield, balanced: Scale, fast: Zap };
// const PROFILE_BTN = { safe: 'bg-green-600', balanced: 'bg-blue-600', fast: 'bg-red-600' };

// const SPEEDS = {
//   motorway: 70,
//   motorway_link: 45,
//   trunk: 55,
//   trunk_link: 40,
//   primary: 45,
//   primary_link: 35,
//   secondary: 38,
//   secondary_link: 30,
//   tertiary: 32,
//   tertiary_link: 28,
//   unclassified: 25,
//   residential: 20,
// };

// // ==========================================
// // ICONS + HELPERS
// // ==========================================
// const pinIcon = (color, letter) =>
//   L.divIcon({
//     className: 'cg-pin',
//     html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 12px ${color};display:flex;align-items:center;justify-content:center;color:#fff;font:800 12px/1 system-ui,sans-serif;">${letter}</div>`,
//     iconSize: [28, 28],
//     iconAnchor: [14, 14],
//   });
// const startIcon = pinIcon('#22c55e', 'A');
// const endIcon = pinIcon('#3b82f6', 'B');

// const sleep0 = () => new Promise((r) => setTimeout(r, 0));
// const abortError = () => new DOMException('Aborted', 'AbortError');
// const fmtCoord = (p) => `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`;
// const COORD_RE = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/;

// function distMeters(aLat, aLng, bLat, bLng) {
//   const dLat = (bLat - aLat) * 111320;
//   const dLng = (bLng - aLng) * 111320 * Math.cos((((aLat + bLat) / 2) * Math.PI) / 180);
//   return Math.sqrt(dLat * dLat + dLng * dLng);
// }

// async function fetchJson(url, options, timeoutMs, parentSignal) {
//   const ctrl = new AbortController();
//   const onAbort = () => ctrl.abort();
//   if (parentSignal) {
//     if (parentSignal.aborted) ctrl.abort();
//     else parentSignal.addEventListener('abort', onAbort, { once: true });
//   }
//   const timer = setTimeout(() => ctrl.abort(), timeoutMs);
//   try {
//     const res = await fetch(url, { ...options, signal: ctrl.signal });
//     if (!res.ok) throw new Error(`HTTP ${res.status}`);
//     return await res.json();
//   } finally {
//     clearTimeout(timer);
//     if (parentSignal) parentSignal.removeEventListener('abort', onAbort);
//   }
// }

// function hashNodes(nodes) {
//   let h = 2166136261;
//   for (const x of nodes) {
//     h ^= x;
//     h = Math.imul(h, 16777619);
//   }
//   return `${(h >>> 0).toString(36)}:${nodes.length}`;
// }

// // ==========================================
// // MIN-HEAP
// // ==========================================
// class MinHeap {
//   constructor() {
//     this.heap = [];
//   }
//   get size() {
//     return this.heap.length;
//   }
//   push(node) {
//     const h = this.heap;
//     h.push(node);
//     let i = h.length - 1;
//     while (i > 0) {
//       const p = (i - 1) >> 1;
//       if (h[p].cost <= node.cost) break;
//       h[i] = h[p];
//       i = p;
//     }
//     h[i] = node;
//   }
//   pop() {
//     const h = this.heap;
//     if (h.length === 0) return null;
//     const top = h[0];
//     const last = h.pop();
//     if (h.length > 0) {
//       let i = 0;
//       const n = h.length;
//       while (true) {
//         let c = 2 * i + 1;
//         if (c >= n) break;
//         if (c + 1 < n && h[c + 1].cost < h[c].cost) c++;
//         if (h[c].cost >= last.cost) break;
//         h[i] = h[c];
//         i = c;
//       }
//       h[i] = last;
//     }
//     return top;
//   }
// }

// // ==========================================
// // CRIME RISK FIELD
// // Every nearby hotspot adds risk to a road: stronger score + closer = more risk.
// // Values are later RE-SCALED relative to the area, so even when hotspots are
// // everywhere the safest roads still stand out clearly from the riskiest ones.
// // ==========================================
// const CELL = 0.03;

// function buildZoneIndex(zones) {
//   const idx = new Map();
//   for (const z of zones) {
//     const key = `${Math.floor(z.lat / CELL)}:${Math.floor(z.lng / CELL)}`;
//     if (!idx.has(key)) idx.set(key, []);
//     idx.get(key).push(z);
//   }
//   return idx;
// }

// // returns RAW [day, night] risk for a point (unnormalised)
// function pointRisks(idx, lat, lng) {
//   const cx = Math.floor(lat / CELL);
//   const cy = Math.floor(lng / CELL);
//   let day = 0;
//   let night = 0;
//   for (let dx = -1; dx <= 1; dx++) {
//     for (let dy = -1; dy <= 1; dy++) {
//       const list = idx.get(`${cx + dx}:${cy + dy}`);
//       if (!list) continue;
//       for (const z of list) {
//         const dLat = (lat - z.lat) * 111.2;
//         const dLng = (lng - z.lng) * 100.7;
//         const d = Math.sqrt(dLat * dLat + dLng * dLng);
//         if (d >= INFLUENCE_KM_NIGHT) continue;
//         const s = z.score / 100;
//         const w = s * s;
//         const fn = 1 - d / INFLUENCE_KM_NIGHT;
//         night += w * fn * fn;
//         if (d < INFLUENCE_KM_DAY) {
//           const fd = 1 - d / INFLUENCE_KM_DAY;
//           day += w * fd * fd;
//         }
//       }
//     }
//   }
//   return [day, night];
// }

// // ==========================================
// // GRAPH CONSTRUCTION
// // ==========================================
// function linkEdge(adj, adjAny, u, v, d, t, r0, r1, dir) {
//   // dir: 0 two-way, 1 one-way u->v, -1 one-way v->u
//   if (dir >= 0) {
//     const e = { to: v, d, t, r0, r1 };
//     adj[u].push(e);
//     adjAny[u].push(e);
//   } else {
//     adjAny[u].push({ to: v, d, t, r0, r1 });
//   }
//   if (dir <= 0) {
//     const e = { to: u, d, t, r0, r1 };
//     adj[v].push(e);
//     adjAny[v].push(e);
//   } else {
//     adjAny[v].push({ to: u, d, t, r0, r1 });
//   }
// }

// function finalizeGraph(lat, lng, adj, adjAny, source) {
//   const n = lat.length;

//   // --- normalise risk to 0..1 relative to this area (95th percentile = 1.0) ---
//   const sample = [];
//   for (let u = 0; u < n; u++) {
//     const list = adjAny[u];
//     for (let i = 0; i < list.length; i++) sample.push(list[i].r1);
//   }
//   let scale = 1;
//   if (sample.length) {
//     const arr = Float32Array.from(sample).sort();
//     scale = arr[Math.min(arr.length - 1, Math.floor(arr.length * 0.95))] || arr[arr.length - 1] || 1;
//   }
//   if (scale <= 1e-9) scale = 1;
//   for (let u = 0; u < n; u++) {
//     const list = adjAny[u];
//     for (let i = 0; i < list.length; i++) {
//       const e = list[i];
//       e.r0 = Math.min(1, e.r0 / scale);
//       e.r1 = Math.min(1, e.r1 / scale);
//     }
//   }

//   // --- connected components (ignoring one-way direction) ---
//   const comp = new Int32Array(n).fill(-1);
//   const sizes = [];
//   for (let s = 0; s < n; s++) {
//     if (comp[s] !== -1) continue;
//     const id = sizes.length;
//     let count = 0;
//     const stack = [s];
//     comp[s] = id;
//     while (stack.length) {
//       const u = stack.pop();
//       count++;
//       const list = adjAny[u];
//       for (let i = 0; i < list.length; i++) {
//         const v = list[i].to;
//         if (comp[v] === -1) {
//           comp[v] = id;
//           stack.push(v);
//         }
//       }
//     }
//     sizes.push(count);
//   }
//   return { n, lat, lng, adj, adjAny, comp, sizes, source };
// }

// function onewayDir(tags) {
//   const o = tags.oneway;
//   if (o === '-1' || o === 'reverse') return -1;
//   if (o === 'no' || o === 'false' || o === '0') return 0;
//   if (o === 'yes' || o === 'true' || o === '1') return 1;
//   if (tags.junction === 'roundabout' || tags.junction === 'circular') return 1;
//   if (tags.highway === 'motorway' || tags.highway === 'motorway_link') return 1;
//   return 0;
// }

// async function graphFromOverpass(elements, zoneIdx, signal) {
//   const index = new Map();
//   const lat = [];
//   const lng = [];
//   const adj = [];
//   const adjAny = [];
//   const getIdx = (osmId, la, ln) => {
//     let i = index.get(osmId);
//     if (i === undefined) {
//       i = lat.length;
//       index.set(osmId, i);
//       lat.push(la);
//       lng.push(ln);
//       adj.push([]);
//       adjAny.push([]);
//     }
//     return i;
//   };

//   let processed = 0;
//   for (const el of elements) {
//     if (el.type !== 'way' || !Array.isArray(el.nodes) || !Array.isArray(el.geometry)) continue;
//     if (el.geometry.length !== el.nodes.length) continue;
//     const tags = el.tags || {};
//     const speed = SPEEDS[tags.highway] || 25;
//     const dir = onewayDir(tags);
//     for (let i = 0; i < el.nodes.length - 1; i++) {
//       const a = el.geometry[i];
//       const b = el.geometry[i + 1];
//       if (!a || !b) continue;
//       const u = getIdx(el.nodes[i], a.lat, a.lon);
//       const v = getIdx(el.nodes[i + 1], b.lat, b.lon);
//       if (u === v) continue;
//       const d = distMeters(a.lat, a.lon, b.lat, b.lon);
//       if (d < 0.5) continue;
//       const [r0, r1] = pointRisks(zoneIdx, (a.lat + b.lat) / 2, (a.lon + b.lon) / 2);
//       linkEdge(adj, adjAny, u, v, d, d / (speed / 3.6), r0, r1, dir);
//     }
//     if (++processed % 1500 === 0) {
//       await sleep0();
//       if (signal.aborted) throw abortError();
//     }
//   }
//   return finalizeGraph(lat, lng, adj, adjAny, 'overpass');
// }

// // Fallback lattice (used only if Overpass is unreachable)
// function buildGridGraph(b, zoneIdx) {
//   const latKm = (b.north - b.south) * 111.2;
//   const lngKm = (b.east - b.west) * 100.7;
//   const step = Math.max(0.12, Math.sqrt((latKm * lngKm) / 6000));
//   const rows = Math.max(2, Math.ceil(latKm / step) + 1);
//   const cols = Math.max(2, Math.ceil(lngKm / step) + 1);
//   const dLat = (b.north - b.south) / (rows - 1);
//   const dLng = (b.east - b.west) / (cols - 1);
//   const lat = [];
//   const lng = [];
//   const adj = [];
//   const adjAny = [];
//   for (let r = 0; r < rows; r++) {
//     for (let c = 0; c < cols; c++) {
//       lat.push(b.south + r * dLat);
//       lng.push(b.west + c * dLng);
//       adj.push([]);
//       adjAny.push([]);
//     }
//   }
//   const speed = 30 / 3.6;
//   const dirs = [
//     [0, 1],
//     [1, 0],
//     [1, 1],
//     [1, -1],
//   ];
//   for (let r = 0; r < rows; r++) {
//     for (let c = 0; c < cols; c++) {
//       for (const [dr, dc] of dirs) {
//         const r2 = r + dr;
//         const c2 = c + dc;
//         if (r2 >= rows || c2 < 0 || c2 >= cols) continue;
//         const u = r * cols + c;
//         const v = r2 * cols + c2;
//         const d = distMeters(lat[u], lng[u], lat[v], lng[v]);
//         const [r0, r1] = pointRisks(zoneIdx, (lat[u] + lat[v]) / 2, (lng[u] + lng[v]) / 2);
//         linkEdge(adj, adjAny, u, v, d, d / speed, r0, r1, 0);
//       }
//     }
//   }
//   return finalizeGraph(lat, lng, adj, adjAny, 'grid');
// }

// // ==========================================
// // OVERPASS FETCH
// // ==========================================
// function computeBBox(start, end) {
//   const spanLat = Math.abs(start.lat - end.lat);
//   const spanLng = Math.abs(start.lng - end.lng);
//   // generous padding so the safest route has room to detour around hotspots
//   const pad = Math.min(0.08, Math.max(0.03, 0.4 * Math.max(spanLat, spanLng)));
//   const r = (v, fn) => fn(v / 0.01) * 0.01;
//   const south = r(Math.min(start.lat, end.lat) - pad, Math.floor);
//   const north = r(Math.max(start.lat, end.lat) + pad, Math.ceil);
//   const west = r(Math.min(start.lng, end.lng) - pad, Math.floor);
//   const east = r(Math.max(start.lng, end.lng) + pad, Math.ceil);
//   const diagKm = distMeters(south, west, north, east) / 1000;
//   return { south, north, west, east, major: diagKm > 16 };
// }

// function buildOverpassQuery(b) {
//   const major =
//     'motorway|motorway_link|trunk|trunk_link|primary|primary_link|secondary|secondary_link|tertiary|tertiary_link';
//   const classes = b.major ? major : `${major}|unclassified|residential`;
//   const f = (n) => n.toFixed(4);
//     return `[out:json][timeout:25];way["highway"~"^(${classes})$"]["access"!~"^(private|no)$"]["area"!="yes"](${f(
//     b.south
//   )},${f(b.west)},${f(b.north)},${f(b.east)});out geom qt;`;
// }

// async function getOverpassGraph(b, zoneIdx, zonesLen, signal, setStatus, cache) {
//   const key = `${b.south.toFixed(2)},${b.west.toFixed(2)},${b.north.toFixed(2)},${b.east.toFixed(2)},${b.major},${zonesLen},v4`;
//   if (cache.has(key)) return cache.get(key);

//   const body = 'data=' + encodeURIComponent(buildOverpassQuery(b));
//   let lastErr = null;
//   for (let i = 0; i < OVERPASS_MIRRORS.length; i++) {
//     if (signal.aborted) throw abortError();
//     setStatus(`Downloading road network… (server ${i + 1}/${OVERPASS_MIRRORS.length})`);
//     try {
//       const data = await fetchJson(
//         OVERPASS_MIRRORS[i],
//         { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body },
//         20000,
//         signal
//       );
//       if (!data || !Array.isArray(data.elements) || data.elements.length < 10) {
//         throw new Error('Empty Overpass response');
//       }
//       if (data.remark && /runtime error|timed out/i.test(data.remark)) throw new Error('Overpass runtime error');
//       setStatus('Scoring roads against crime hotspots…');
//       const g = await graphFromOverpass(data.elements, zoneIdx, signal);
//       if (g.n < 2) throw new Error('Road graph too small');
//       cache.set(key, g);
//       if (cache.size > 4) cache.delete(cache.keys().next().value);
//       return g;
//     } catch (err) {
//       if (signal.aborted) throw abortError();
//       lastErr = err;
//     }
//   }
//   throw lastErr || new Error('Overpass unavailable');
// }

// // ==========================================
// // SNAPPING (same connected component for A and B)
// // ==========================================
// function snapEndpoints(g, start, end) {
//   let largest = 0;
//   for (const s of g.sizes) if (s > largest) largest = s;
//   const minSize = Math.max(10, largest * 0.02);

//   const nComp = g.sizes.length;
//   const sBest = new Float64Array(nComp).fill(Infinity);
//   const eBest = new Float64Array(nComp).fill(Infinity);
//   const sId = new Int32Array(nComp).fill(-1);
//   const eId = new Int32Array(nComp).fill(-1);
//   const kxS = 111320 * Math.cos((start.lat * Math.PI) / 180);
//   const kxE = 111320 * Math.cos((end.lat * Math.PI) / 180);

//   for (let i = 0; i < g.n; i++) {
//     const c = g.comp[i];
//     if (g.sizes[c] < minSize) continue;
//     const dsy = (g.lat[i] - start.lat) * 111320;
//     const dsx = (g.lng[i] - start.lng) * kxS;
//     const ds = dsx * dsx + dsy * dsy;
//     if (ds < sBest[c]) {
//       sBest[c] = ds;
//       sId[c] = i;
//     }
//     const dey = (g.lat[i] - end.lat) * 111320;
//     const dex = (g.lng[i] - end.lng) * kxE;
//     const de = dex * dex + dey * dey;
//     if (de < eBest[c]) {
//       eBest[c] = de;
//       eId[c] = i;
//     }
//   }

//   let bestC = -1;
//   let bestSum = Infinity;
//   for (let c = 0; c < nComp; c++) {
//     if (sId[c] === -1 || eId[c] === -1) continue;
//     const sum = Math.sqrt(sBest[c]) + Math.sqrt(eBest[c]);
//     if (sum < bestSum) {
//       bestSum = sum;
//       bestC = c;
//     }
//   }
//   if (bestC === -1) return null;
//   const sMeters = Math.sqrt(sBest[bestC]);
//   const eMeters = Math.sqrt(eBest[bestC]);
//   if (sMeters > MAX_SNAP_METERS || eMeters > MAX_SNAP_METERS) return null;
//   return { s: sId[bestC], e: eId[bestC], sMeters, eMeters };
// }

// // ==========================================
// // WEIGHTED DIJKSTRA
// //   edge cost = distance * (1 + alpha * mult * risk^2)      risk is 0..1
// //   alpha = 0      -> pure shortest distance (FASTEST)
// //   alpha = huge   -> least-risk path regardless of length (SAFEST)
// //   alpha = middle -> trade-off (BALANCED)
// // ==========================================
// function dijkstra(g, list, s, t, alpha, ti, mult) {
//   const dist = new Float64Array(g.n).fill(Infinity);
//   const prev = new Int32Array(g.n).fill(-1);
//   const prevE = new Array(g.n);
//   const pq = new MinHeap();
//   dist[s] = 0;
//   pq.push({ id: s, cost: 0 });
//   const a = alpha * mult;

//   while (pq.size > 0) {
//     const { id: u, cost } = pq.pop();
//     if (cost > dist[u]) continue;
//     if (u === t) break;
//     const edges = list[u];
//     for (let i = 0; i < edges.length; i++) {
//       const e = edges[i];
//       const r = ti ? e.r1 : e.r0;
//       const alt = cost + e.d * (1 + a * r * r);
//       if (alt < dist[e.to]) {
//         dist[e.to] = alt;
//         prev[e.to] = u;
//         prevE[e.to] = e;
//         pq.push({ id: e.to, cost: alt });
//       }
//     }
//   }
//   if (dist[t] === Infinity) return null;

//   const nodes = [];
//   const edges = [];
//   let cur = t;
//   while (cur !== -1) {
//     nodes.push(cur);
//     if (prevE[cur] && cur !== s) edges.push(prevE[cur]);
//     cur = prev[cur];
//   }
//   nodes.reverse();
//   edges.reverse();
//   return { nodes, edges };
// }

// // ==========================================
// // ROUTE POST-PROCESSING
// // ==========================================
// function findWarnings(coords, dangerZones, warnKm) {
//   if (coords.length < 2) return [];
//   let minLat = Infinity;
//   let maxLat = -Infinity;
//   let minLng = Infinity;
//   let maxLng = -Infinity;
//   for (const [la, ln] of coords) {
//     if (la < minLat) minLat = la;
//     if (la > maxLat) maxLat = la;
//     if (ln < minLng) minLng = ln;
//     if (ln > maxLng) maxLng = ln;
//   }
//   const margin = warnKm / 90 + 0.001;
//   const line = turf.lineString(coords.map(([la, ln]) => [ln, la]));
//   const out = [];
//   for (const z of dangerZones) {
//     if (z.lat < minLat - margin || z.lat > maxLat + margin) continue;
//     if (z.lng < minLng - margin || z.lng > maxLng + margin) continue;
//     const dkm = turf.pointToLineDistance(turf.point([z.lng, z.lat]), line, { units: 'kilometers' });
//     if (dkm <= warnKm) out.push({ ...z, distKm: dkm });
//   }
//   out.sort((a, b) => b.score - a.score);
//   return out;
// }

// function pathStats(path, ti) {
//   let riskSum = 0;
//   let meters = 0;
//   let secs = 0;
//   let maxRisk = 0;
//   for (const e of path.edges) {
//     const r = ti ? e.r1 : e.r0;
//     riskSum += r * e.d;
//     meters += e.d;
//     secs += e.t;
//     if (r > maxRisk) maxRisk = r;
//   }
//   return { exp: meters ? riskSum / meters : 0, dist: meters, secs, maxRisk };
// }

// function buildRoute(g, prof, cand, snap, start, end, dangerZones, warnKm) {
//   const coords = cand.path.nodes.map((i) => [g.lat[i], g.lng[i]]);
//   if (snap.sMeters > 25) coords.unshift([start.lat, start.lng]);
//   if (snap.eMeters > 25) coords.push([end.lat, end.lng]);
//   const totalMeters = cand.dist + snap.sMeters + snap.eMeters;
//   return {
//     key: prof.key,
//     label: prof.label,
//     title: prof.title,
//     subtitle: prof.subtitle,
//     color: prof.color,
//     coords,
//     distance: (totalMeters / 1000).toFixed(1),
//     distNum: totalMeters,
//     time: Math.max(1, Math.round((cand.secs * 1.2) / 60)),
//     exposure: Math.round(cand.exp * 100),
//     maxRisk: Math.round(cand.maxRisk * 100),
//     warnings: findWarnings(coords, dangerZones, warnKm),
//     sig: cand.sig,
//   };
// }

// // ==========================================
// // SOLVER: computes ALL THREE routes at once, so switching preference is instant
// // ==========================================
// async function solveOn(g, ctx) {
//   const { start, end, night, signal, dangerZones } = ctx;
//   const snap = snapEndpoints(g, start, end);
//   if (!snap) return null;

//   const ti = night ? 1 : 0;
//   const mult = night ? NIGHT_MULT : 1;
//   const warnKm = night ? WARN_KM_NIGHT : WARN_KM_DAY;
//   let relaxedOneway = false;

//   const run = async (alpha) => {
//     await sleep0();
//     if (signal.aborted) throw abortError();
//     let path = dijkstra(g, g.adj, snap.s, snap.e, alpha, ti, mult);
//     if (!path) {
//       path = dijkstra(g, g.adjAny, snap.s, snap.e, alpha, ti, mult);
//       if (path) relaxedOneway = true;
//     }
//     if (!path) return null;
//     return { path, alpha, sig: hashNodes(path.nodes), ...pathStats(path, ti) };
//   };

//   // FASTEST: alpha = 0 => pure shortest distance, crime ignored
//   const fast = await run(0);
//   if (!fast) return null;

//   // Sweep many penalty weights (low -> extreme) and keep every distinct path
//   const alphas = [0.5, 1, 2, 4, 8, 16, 32, 64, 128, 300, 800, 2000, 6000, 20000, 80000];
//   const pool = new Map([[fast.sig, fast]]);
//   for (const a of alphas) {
//     const c = await run(a);
//     if (c && !pool.has(c.sig)) pool.set(c.sig, c);
//   }
//   const all = [...pool.values()];

//   // SAFEST: lowest crime exposure of everything found (shorter wins ties)
//   let safe = all[0];
//   for (const c of all) {
//     if (c.exp < safe.exp - 1e-6 || (Math.abs(c.exp - safe.exp) <= 1e-6 && c.dist < safe.dist)) safe = c;
//   }

//   // BALANCED: the path sitting closest to the middle of fast <-> safe,
//   // measured in BOTH distance and risk, and different from both when possible
//   const expSpan = fast.exp - safe.exp;
//   const distSpan = safe.dist - fast.dist;
//   let balanced = null;
//   let best = Infinity;
//   for (const c of all) {
//     let score;
//     if (expSpan > 1e-4 && distSpan > 1) {
//       const pe = (fast.exp - c.exp) / expSpan;
//       const pd = (c.dist - fast.dist) / distSpan;
//       score = Math.abs(pe - 0.5) + Math.abs(pd - 0.5);
//     } else {
//       score = 5;
//     }
//     if (c.sig === fast.sig || c.sig === safe.sig) score += 10;
//     if (score < best) {
//       best = score;
//       balanced = c;
//     }
//   }
//   if (!balanced) balanced = fast;

//   const byKey = { safe, balanced, fast };
//   const routes = PROFILES.map((p) => buildRoute(g, p, byKey[p.key], snap, start, end, dangerZones, warnKm));

//   const fastest = routes.find((r) => r.key === 'fast');
//   routes.forEach((r, i) => {
//     const twin = routes.slice(0, i).find((o) => o.sig === r.sig);
//     r.sameAs = twin ? twin.label : null;
//     r.extraMin = r.time - fastest.time;
//   });

//   const distinct = new Set(routes.map((r) => r.sig)).size;
//   return { routes, snap, relaxedOneway, distinct };
// }

// // Backup: real road geometry from OSRM, scored against crime hotspots
// async function osrmPlan(ctx) {
//   const { start, end, night, zoneIdx, dangerZones, signal } = ctx;
//   const ti = night ? 1 : 0;
//   const warnKm = night ? WARN_KM_NIGHT : WARN_KM_DAY;

//   const osrm = async (pts, alternatives) => {
//     const path = pts.map((p) => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`).join(';');
//     const url = `https://router.project-osrm.org/route/v1/driving/${path}?overview=full&geometries=geojson&alternatives=${alternatives}`;
//     const data = await fetchJson(url, {}, 12000, signal);
//     return data.code === 'Ok' && Array.isArray(data.routes) ? data.routes : [];
//   };

//   // Direct route + alternatives, plus detours steered through side waypoints
//   const dx = (end.lng - start.lng) * 100.7;
//   const dy = (end.lat - start.lat) * 111.2;
//   const len = Math.hypot(dx, dy) || 1;
//   const midLat = (start.lat + end.lat) / 2;
//   const midLng = (start.lng + end.lng) / 2;
//   const jobs = [osrm([start, end], true)];
//   for (const f of [-0.5, -0.25, 0.25, 0.5]) {
//     const off = Math.min(6, len * f);
//     const via = {
//       lat: midLat + ((dx / len) * off) / 111.2,
//       lng: midLng + ((-dy / len) * off) / 100.7,
//     };
//     jobs.push(osrm([start, via, end], false));
//   }
//   const settled = await Promise.allSettled(jobs);
//   if (signal.aborted) throw abortError();

//   const raw = [];
//   const seen = new Set();
//   for (const s of settled) {
//     if (s.status !== 'fulfilled') continue;
//     for (const r of s.value) {
//       const coords = r.geometry.coordinates.map(([ln, la]) => [la, ln]);
//       const sig = `${Math.round(r.distance / 20)}:${coords.length}`;
//       if (seen.has(sig)) continue;
//       seen.add(sig);
//       raw.push({ coords, dist: r.distance, secs: r.duration, sig });
//     }
//   }
//   if (!raw.length) throw new Error('OSRM returned no routes');

//   // risk along each route
//   const allSeg = [];
//   for (const c of raw) {
//     let sum = 0;
//     c.segs = [];
//     for (let i = 0; i < c.coords.length - 1; i++) {
//       const a = c.coords[i];
//       const b = c.coords[i + 1];
//       const d = distMeters(a[0], a[1], b[0], b[1]);
//       if (d < 1) continue;
//       const r = pointRisks(zoneIdx, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2)[ti];
//       c.segs.push([r, d]);
//       sum += r * d;
//       allSeg.push(r);
//     }
//     c.rawExp = c.dist ? sum / c.dist : 0;
//   }
//   allSeg.sort((x, y) => x - y);
//   let scale = allSeg[Math.floor(allSeg.length * 0.95)] || allSeg[allSeg.length - 1] || 1;
//   if (scale <= 1e-9) scale = 1;
//   for (const c of raw) {
//     c.exp = Math.min(1, c.rawExp / scale);
//     c.maxRisk = Math.min(1, Math.max(0, ...c.segs.map((s) => s[0])) / scale);
//   }

//   const fast = raw.reduce((a, b) => (b.dist < a.dist ? b : a));
//   const safe = raw.reduce((a, b) =>
//     b.exp < a.exp - 1e-6 || (Math.abs(b.exp - a.exp) <= 1e-6 && b.dist < a.dist) ? b : a
//   );
//   const expSpan = fast.exp - safe.exp;
//   const distSpan = safe.dist - fast.dist;
//   let balanced = fast;
//   let best = Infinity;
//   for (const c of raw) {
//     let score = 5;
//     if (expSpan > 1e-4 && distSpan > 1) {
//       score = Math.abs((fast.exp - c.exp) / expSpan - 0.5) + Math.abs((c.dist - fast.dist) / distSpan - 0.5);
//     }
//     if (c.sig === fast.sig || c.sig === safe.sig) score += 10;
//     if (score < best) {
//       best = score;
//       balanced = c;
//     }
//   }

//   const byKey = { safe, balanced, fast };
//   const routes = PROFILES.map((p) => {
//     const c = byKey[p.key];
//     return {
//       key: p.key,
//       label: p.label,
//       title: p.title,
//       subtitle: p.subtitle,
//       color: p.color,
//       coords: c.coords,
//       distance: (c.dist / 1000).toFixed(1),
//       distNum: c.dist,
//       time: Math.max(1, Math.round((c.secs * 1.15) / 60)),
//       exposure: Math.round(c.exp * 100),
//       maxRisk: Math.round(c.maxRisk * 100),
//       warnings: findWarnings(c.coords, dangerZones, warnKm),
//       sig: c.sig,
//     };
//   });
//   const fastest = routes.find((r) => r.key === 'fast');
//   routes.forEach((r, i) => {
//     const twin = routes.slice(0, i).find((o) => o.sig === r.sig);
//     r.sameAs = twin ? twin.label : null;
//     r.extraMin = r.time - fastest.time;
//   });

//   return {
//     routes,
//     snap: { sMeters: 0, eMeters: 0 },
//     relaxedOneway: false,
//     distinct: new Set(routes.map((r) => r.sig)).size,
//   };
// }

// async function planRoutes(ctx) {
//   const { start, end, zonesLen, zoneIdx, signal, setStatus, cache } = ctx;
//   const bbox = computeBBox(start, end);
//   const notes = [];
//   let result = null;
//   let source = 'overpass';

//   try {
//     const graph = await getOverpassGraph(bbox, zoneIdx, zonesLen, signal, setStatus, cache);
//     setStatus('Running weighted Dijkstra for all 3 profiles…');
//     result = await solveOn(graph, ctx);
//   } catch (err) {
//     if (signal.aborted) throw abortError();
//   }

//   if (!result) {
//     setStatus('Finding real road routes (backup router)…');
//     try {
//       result = await osrmPlan(ctx);
//       source = 'osrm';
//       notes.push('The OpenStreetMap road download was unavailable, so real-road routes from a backup router were scored against crime data.');
//     } catch (err) {
//       if (signal.aborted) throw abortError();
//       throw new Error('Could not download real road data. Check your internet connection and try again.');
//     }
//   }

//   if (result.relaxedOneway) notes.push('Some one-way restrictions were relaxed to connect your points.');
//   if (result.distinct === 1) notes.push('No alternative road exists here, so all three routes follow the same path.');
//   else if (result.distinct === 2) notes.push('Only two distinct paths exist between these points, so two profiles share a route.');
//   const worstSnap = Math.max(result.snap.sMeters, result.snap.eMeters);
//   if (worstSnap > 800) notes.push(`A pin is ${(worstSnap / 1000).toFixed(1)} km from the nearest mapped road.`);

//   return { routes: result.routes, notice: notes.join(' '), source };
// }

// // ==========================================
// // MAP HELPERS
// // ==========================================
// function FitRouteBounds({ routes, sig }) {
//   const map = useMap();
//   const last = useRef(null);
//   useEffect(() => {
//     if (!sig) {
//       last.current = null;
//       return;
//     }
//     if (!routes.length || last.current === sig) return;
//     last.current = sig;
//     const pts = [];
//     routes.forEach((r) => r.coords.forEach((c) => pts.push(c)));
//     if (pts.length) map.fitBounds(L.latLngBounds(pts), { padding: [60, 60], maxZoom: 15 });
//   }, [routes, sig, map]);
//   return null;
// }

// function MapResizer() {
//   const map = useMap();
//   useEffect(() => {
//     const ro = new ResizeObserver(() => map.invalidateSize());
//     ro.observe(map.getContainer());
//     return () => ro.disconnect();
//   }, [map]);
//   return null;
// }

// function MapPinDropper({ start, end, setStart, setEnd, setStartText, setEndText, resetRoute }) {
//   useMapEvents({
//     click(e) {
//       const p = { lat: e.latlng.lat, lng: e.latlng.lng };
//       if (!start) {
//         setStart(p);
//         setStartText(fmtCoord(p));
//       } else if (!end) {
//         setEnd(p);
//         setEndText(fmtCoord(p));
//       } else {
//         resetRoute();
//         setStart(p);
//         setStartText(fmtCoord(p));
//       }
//     },
//   });
//   return null;
// }

// // One solid, coloured route with a casing so it stays readable on any basemap.
// function RouteLine({ route, active, dark, onSelect }) {
//   const casingRef = useRef(null);
//   const lineRef = useRef(null);
//   useEffect(() => {
//     if (!active) return;
//     casingRef.current?.bringToFront?.();
//     lineRef.current?.bringToFront?.();
//   }, [active, route]);

//   return (
//     <>
//       <Polyline
//         ref={casingRef}
//         positions={route.coords}
//         pathOptions={{
//           color: dark ? '#0b1220' : '#ffffff',
//           weight: active ? 14 : 9,
//           opacity: active ? 0.95 : 0.8,
//           lineCap: 'round',
//           lineJoin: 'round',
//           interactive: false,
//         }}
//       />
//       <Polyline
//         ref={lineRef}
//         positions={route.coords}
//         pathOptions={{
//           color: route.color,
//           weight: active ? 8 : 5,
//           opacity: active ? 1 : 0.9,
//           lineCap: 'round',
//           lineJoin: 'round',
//           bubblingMouseEvents: false,
//         }}
//         eventHandlers={{ click: onSelect }}
//       >
//         <Tooltip sticky>
//           {route.label} • {route.distance} km • {route.time} min
//           {active ? '' : ' (click to select)'}
//         </Tooltip>
//       </Polyline>
//     </>
//   );
// }

// // ==========================================
// // MAIN PAGE
// // ==========================================
// export default function SafeRoutes() {
//   const [zones, setZones] = useState([]);
//   const [zonesStatus, setZonesStatus] = useState('loading');
//   const [start, setStart] = useState(null);
//   const [end, setEnd] = useState(null);
//   const [startText, setStartText] = useState('');
//   const [endText, setEndText] = useState('');
//   const [computing, setComputing] = useState(false);
//   const [resolving, setResolving] = useState(false);
//   const [status, setStatus] = useState('');
//   const [error, setError] = useState('');
//   const [notice, setNotice] = useState('');
//   const [source, setSource] = useState('');

//   const [mapTheme, setMapTheme] = useState('light');
//   const [timeOfDay, setTimeOfDay] = useState('Day');
//   const [selectedProfile, setSelectedProfile] = useState('safe');
//   const [computedRoutes, setComputedRoutes] = useState([]);

//   const graphCache = useRef(new Map());
//   const night = timeOfDay === 'Night';
//   const dark = mapTheme === 'dark';

//   // ---- Load crime zones ----
//   useEffect(() => {
//     const ctrl = new AbortController();
//     (async () => {
//       try {
//         const data = await fetchJson(API_URL, {}, 15000, ctrl.signal);
//         if (data.success && Array.isArray(data.zones)) {
//           setZones(data.zones);
//           setZonesStatus('ready');
//         } else throw new Error('Bad payload');
//       } catch (err) {
//         if (ctrl.signal.aborted) return;
//         console.error('Error loading zones:', err);
//         setZonesStatus('error');
//       }
//     })();
//     return () => ctrl.abort();
//   }, []);

//   const zonesNorm = useMemo(
//     () =>
//       zones
//         .map((z) => ({ ...z, lat: parseFloat(z.lat), lng: parseFloat(z.lng), score: parseFloat(z.avgScore) }))
//         .filter((z) => Number.isFinite(z.lat) && Number.isFinite(z.lng) && Number.isFinite(z.score)),
//     [zones]
//   );
//   const zoneIdx = useMemo(() => buildZoneIndex(zonesNorm), [zonesNorm]);
//   const dangerZones = useMemo(() => zonesNorm.filter((z) => z.score >= DANGER_THRESHOLD), [zonesNorm]);

//   const locationOptions = useMemo(() => {
//     const seen = new Map();
//     for (const z of zonesNorm) {
//       const label = `${z.name} (${z.town})`;
//       if (!seen.has(label)) seen.set(label, { label, name: z.name, lat: z.lat, lng: z.lng });
//     }
//     return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label));
//   }, [zonesNorm]);

//   // ---- Text -> coordinates ----
//   const resolveLocation = async (query, fieldName) => {
//     const raw = query.trim();
//     const m = raw.match(COORD_RE);
//     if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };

//     const clean = raw.toLowerCase();
//     const exactLabel = locationOptions.find((o) => o.label.toLowerCase() === clean);
//     if (exactLabel) return { lat: exactLabel.lat, lng: exactLabel.lng };

//     const exactName = locationOptions.filter((o) => o.name.toLowerCase() === clean);
//     if (exactName.length === 1) return { lat: exactName[0].lat, lng: exactName[0].lng };
//     if (exactName.length > 1) {
//       throw new Error(`"${raw}" exists in several towns. Pick the ${fieldName} from the dropdown list.`);
//     }
//     if (clean.length >= 3) {
//       const partial = locationOptions.filter((o) => o.label.toLowerCase().includes(clean));
//       if (partial.length === 1) return { lat: partial[0].lat, lng: partial[0].lng };
//       if (partial.length > 1) {
//         throw new Error(`Several areas match "${raw}". Pick the ${fieldName} from the dropdown list.`);
//       }
//     }
//     try {
//       const data = await fetchJson(
//         `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=pk&viewbox=66.6,25.5,67.6,24.6&bounded=1&q=${encodeURIComponent(
//           raw + ', Karachi'
//         )}`,
//         {},
//         8000
//       );
//       if (data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
//     } catch (err) {
//       console.error('Nominatim error:', err);
//     }
//     throw new Error(`Could not find the ${fieldName} "${raw}". Pick an area from the dropdown or click the map.`);
//   };

//   // ---- Compute all 3 routes when A, B or Day/Night changes.
//   //      Changing the preference does NOT recompute: it just swaps the active route. ----
//   useEffect(() => {
//     if (!start || !end || zonesStatus === 'loading') return;
//     if (distMeters(start.lat, start.lng, end.lat, end.lng) < 100) {
//       setComputedRoutes([]);
//       setError('Start and destination are too close together to plan a route.');
//       return;
//     }
//     const ctrl = new AbortController();
//     setComputing(true);
//     setError('');
//     setStatus('Preparing…');

//     (async () => {
//       try {
//         const out = await planRoutes({
//           start,
//           end,
//           night,
//           zoneIdx,
//           zonesLen: zonesNorm.length,
//           dangerZones,
//           signal: ctrl.signal,
//           setStatus: (s) => !ctrl.signal.aborted && setStatus(s),
//           cache: graphCache.current,
//         });
//         if (ctrl.signal.aborted) return;
//         setComputedRoutes(out.routes);
//         setNotice(out.notice);
//         setSource(out.source);
//       } catch (err) {
//         if (ctrl.signal.aborted) return;
//         console.error('Routing error:', err);
//         setComputedRoutes([]);
//         setError(err.message || 'Routing failed. Please try again.');
//       } finally {
//         if (!ctrl.signal.aborted) setComputing(false);
//       }
//     })();
//     return () => ctrl.abort();
//   }, [start, end, night, zonesStatus, zoneIdx, zonesNorm.length, dangerZones]);

//   const handleSearch = async (e) => {
//     e.preventDefault();
//     setError('');
//     if (!startText.trim() || !endText.trim()) {
//       setError('Enter both a departure and a destination.');
//       return;
//     }
//     setResolving(true);
//     try {
//       const a = await resolveLocation(startText, 'departure');
//       const b = await resolveLocation(endText, 'destination');
//       setStart(a);
//       setEnd(b);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setResolving(false);
//     }
//   };

//   const resetRoute = () => {
//     setStart(null);
//     setEnd(null);
//     setStartText('');
//     setEndText('');
//     setComputedRoutes([]);
//     setError('');
//     setNotice('');
//     setComputing(false);
//   };

//   const swapEnds = () => {
//     setStart(end);
//     setEnd(start);
//     setStartText(endText);
//     setEndText(startText);
//   };

//   const busy = computing || resolving;
//   const activeRoute = computedRoutes.find((r) => r.key === selectedProfile) || computedRoutes[0];
//   const routesSig = computedRoutes.length ? computedRoutes.map((r) => r.sig).join('|') : null;
//   const dangerRadiusM = (night ? WARN_KM_NIGHT : WARN_KM_DAY) * 1000;

//   const exposureLabel = (v) =>
//     v < 25
//       ? { t: 'Low', c: 'text-green-400' }
//       : v < 50
//       ? { t: 'Moderate', c: 'text-amber-400' }
//       : { t: 'High', c: 'text-red-400' };

//   // draw order: unselected first, selected last (always on top)
//   const drawOrder = [...computedRoutes].sort((a, b) => (a.key === activeRoute?.key ? 1 : b.key === activeRoute?.key ? -1 : 0));

//   return (
//     <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#0F172A] text-[#F1F5F9] flex flex-col font-sans">
//       <style>{`.cg-pin { background: none; border: none; }`}</style>
//       <Navbar />

//       <div className="flex-1 min-h-0 flex flex-col lg:flex-row relative overflow-hidden">
//         {/* ============ Sidebar ============ */}
//         <div className="w-full lg:w-[450px] bg-[#1E293B] border-r border-white/10 p-5 sm:p-6 flex flex-col gap-5 z-10 overflow-y-auto">
//           <div>
//             <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0F172A] border border-white/10 text-[#3b82f6] text-xs font-bold tracking-widest uppercase mb-3">
//               <Navigation size={14} /> Weighted Dijkstra Engine
//             </span>
//             <h1 className="text-3xl font-black text-white tracking-tight">Safe Routes</h1>
//             <p className="text-[#94A3B8] text-sm mt-1">
//               Three crime-aware paths for Karachi. Choose how much risk you accept.
//             </p>
//           </div>

//           <form onSubmit={handleSearch} className="bg-[#0F172A] border border-white/10 rounded-2xl p-4 space-y-3">
//             <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Select Karachi Areas</div>
//             <datalist id="karachi-areas">
//               {locationOptions.map((opt) => (
//                 <option key={opt.label} value={opt.label} />
//               ))}
//             </datalist>

//             <div className="flex items-stretch gap-2">
//               <div className="flex-1 space-y-2">
//                 <div className="relative">
//                   <span className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-green-500 text-white text-[10px] font-black flex items-center justify-center">
//                     A
//                   </span>
//                   <input
//                     type="text"
//                     list="karachi-areas"
//                     placeholder="Departure (e.g. Landhi...)"
//                     value={startText}
//                     onChange={(e) => setStartText(e.target.value)}
//                     className="w-full bg-[#1E293B] border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-green-500"
//                   />
//                 </div>
//                 <div className="relative">
//                   <span className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-black flex items-center justify-center">
//                     B
//                   </span>
//                   <input
//                     type="text"
//                     list="karachi-areas"
//                     placeholder="Destination (e.g. DHA...)"
//                     value={endText}
//                     onChange={(e) => setEndText(e.target.value)}
//                     className="w-full bg-[#1E293B] border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
//                   />
//                 </div>
//               </div>
//               <button
//                 type="button"
//                 onClick={swapEnds}
//                 disabled={!startText && !endText}
//                 title="Swap start and destination"
//                 className="px-2.5 bg-[#1E293B] hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-xl border border-white/10"
//               >
//                 <ArrowUpDown size={16} />
//               </button>
//             </div>

//             <div className="flex gap-2 pt-1">
//               <button
//                 type="submit"
//                 disabled={busy}
//                 className="flex-1 bg-[#3b82f6] hover:bg-blue-600 disabled:opacity-60 text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
//               >
//                 {busy ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
//                 {busy ? 'Working...' : 'Calculate 3 Routes'}
//               </button>
//               {(start || end || startText || endText) && (
//                 <button
//                   type="button"
//                   onClick={resetRoute}
//                   className="px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-white/10"
//                   title="Clear Route"
//                 >
//                   <RotateCcw size={15} />
//                 </button>
//               )}
//             </div>
//             <p className="text-[11px] text-slate-500">
//               Tip: click the map to drop pin A, then pin B. Drag a pin to adjust it.
//             </p>
//           </form>

//           {zonesStatus === 'error' && (
//             <div className="flex gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
//               <AlertTriangle size={15} className="shrink-0 mt-0.5" />
//               <span>Could not load crime zones from the server. Routes will ignore crime data and autocomplete is unavailable.</span>
//             </div>
//           )}
//           {error && (
//             <div className="flex gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
//               <AlertTriangle size={15} className="shrink-0 mt-0.5" />
//               <span>{error}</span>
//             </div>
//           )}
//           {computing && (
//             <div className="flex gap-2 items-center p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-200 text-xs">
//               <Loader2 size={15} className="animate-spin shrink-0" />
//               <span>{status}</span>
//             </div>
//           )}
//           {!computing && notice && computedRoutes.length > 0 && (
//             <div className="flex gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
//               <Info size={15} className="shrink-0 mt-0.5" />
//               <span>{notice}</span>
//             </div>
//           )}

//           {/* Time + preference */}
//           <div className="bg-[#0F172A] border border-white/10 rounded-2xl p-4 space-y-4">
//             <div>
//               <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Travel Time Context</div>
//               <div className="flex gap-2">
//                 <button
//                   type="button"
//                   onClick={() => setTimeOfDay('Day')}
//                   className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
//                     timeOfDay === 'Day' ? 'bg-[#3b82f6] text-white' : 'bg-[#1E293B] text-[#94A3B8] border border-white/5'
//                   }`}
//                 >
//                   <Clock size={14} /> Daytime
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => setTimeOfDay('Night')}
//                   className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
//                     timeOfDay === 'Night'
//                       ? 'bg-[#8b5cf6] text-white shadow-lg shadow-purple-500/20'
//                       : 'bg-[#1E293B] text-[#94A3B8] border border-white/5'
//                   }`}
//                 >
//                   <Moon size={14} /> Night (1.5x Risk)
//                 </button>
//               </div>
//             </div>

//             <div>
//               <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Your Risk Preference</div>
//               <div className="grid grid-cols-3 gap-2">
//                 {PROFILES.map((p) => {
//                   const Icon = PROFILE_ICONS[p.key];
//                   const active = selectedProfile === p.key;
//                   return (
//                     <button
//                       key={p.key}
//                       type="button"
//                       onClick={() => setSelectedProfile(p.key)}
//                       className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
//                         active
//                           ? `${PROFILE_BTN[p.key]} text-white shadow-lg`
//                           : 'bg-[#1E293B] text-[#94A3B8] border border-white/5 hover:text-white'
//                       }`}
//                     >
//                       <Icon size={14} />
//                       <span className="text-[11px] leading-tight text-center">{p.label}</span>
//                     </button>
//                   );
//                 })}
//               </div>
//             </div>
//           </div>

//           {/* Route cards */}
//           {computedRoutes.length > 0 && (
//             <div className="space-y-2.5">
//               <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider flex items-center gap-2">
//                 <MapIcon size={14} /> All Calculated Paths (Click to Select)
//               </div>
//               {computedRoutes.map((route) => {
//                 const isSelected = route.key === activeRoute?.key;
//                 const ex = exposureLabel(route.exposure);
//                 return (
//                   <div
//                     key={route.key}
//                     onClick={() => setSelectedProfile(route.key)}
//                     style={{ borderColor: isSelected ? route.color : 'rgba(255,255,255,0.06)' }}
//                     className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
//                       isSelected ? 'bg-[#0F172A] shadow-lg' : 'bg-[#1E293B]/70 hover:bg-[#1E293B]'
//                     }`}
//                   >
//                     <div className="flex justify-between items-start gap-3 mb-1">
//                       <div className="font-bold text-sm text-white flex items-center gap-2">
//                         <span className="w-3 h-3 rounded-full inline-block shrink-0" style={{ backgroundColor: route.color }} />
//                         {route.title}
//                       </div>
//                       <div className="text-sm font-black text-white whitespace-nowrap">
//                         {route.time} <span className="text-[10px] text-slate-400 font-normal">min</span>
//                       </div>
//                     </div>
//                     <div className="flex justify-between items-center text-xs pl-5 gap-3">
//                       <span className="text-slate-400">
//                         {route.distance} km • {route.sameAs ? `Same path as ${route.sameAs}` : route.subtitle}
//                       </span>
//                       <span className={`whitespace-nowrap font-bold ${ex.c}`}>{ex.t} risk</span>
//                     </div>
//                     <div className="pl-5 mt-1 flex justify-between text-[11px]">
//                       <span className="text-slate-500">{route.warnings.length} hotspot(s) nearby</span>
//                       {route.extraMin > 0 && <span className="text-amber-300/90">+{route.extraMin} min vs fastest</span>}
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           )}

//           {/* Selected route analysis */}
//           {activeRoute && (
//             <div className="bg-[#0F172A] border border-white/10 rounded-2xl p-4 space-y-3 mt-auto">
//               <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider flex items-center gap-2">
//                 <Info size={14} /> Selected: {activeRoute.title}
//               </div>

//               <div className="grid grid-cols-3 gap-2 text-center">
//                 <div className="bg-[#1E293B] rounded-xl py-2 border border-white/5">
//                   <div className="text-lg font-black text-white">{activeRoute.distance}</div>
//                   <div className="text-[10px] text-slate-400 uppercase font-bold">km</div>
//                 </div>
//                 <div className="bg-[#1E293B] rounded-xl py-2 border border-white/5">
//                   <div className="text-lg font-black text-white">{activeRoute.time}</div>
//                   <div className="text-[10px] text-slate-400 uppercase font-bold">min</div>
//                 </div>
//                 <div className="bg-[#1E293B] rounded-xl py-2 border border-white/5">
//                   <div className={`text-lg font-black ${exposureLabel(activeRoute.exposure).c}`}>{activeRoute.exposure}</div>
//                   <div className="text-[10px] text-slate-400 uppercase font-bold">risk index</div>
//                 </div>
//               </div>

//               {activeRoute.warnings.length > 0 ? (
//                 <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl">
//                   <div className="flex items-center gap-2 text-red-500 font-black text-sm mb-1.5">
//                     <ShieldAlert size={16} /> PASSES NEAR {activeRoute.warnings.length} HIGH-RISK ZONE
//                     {activeRoute.warnings.length > 1 ? 'S' : ''}
//                   </div>
//                   <ul className="space-y-1.5 max-h-[130px] overflow-y-auto pr-1">
//                     {activeRoute.warnings.map((r, i) => (
//                       <li key={`${r.id ?? r.name}-${i}`} className="bg-red-500/20 px-3 py-1.5 rounded-lg text-xs border border-red-500/20">
//                         <div className="font-bold text-red-400">
//                           {r.name}, {r.town}
//                         </div>
//                         <div className="text-red-300/80 text-[11px]">
//                           Primary Threat: {r.type} (Score: {r.avgScore}) • {r.distKm.toFixed(1)} km from route
//                         </div>
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               ) : (
//                 <div className="p-3.5 bg-green-500/10 border border-green-500/30 rounded-xl">
//                   <div className="flex items-center gap-2 text-green-500 font-black text-sm mb-1">
//                     <CheckCircle size={16} /> HOTSPOT-FREE CORRIDOR
//                   </div>
//                   <p className="text-xs text-green-200/80">
//                     This path stays clear of all high-risk zones for {timeOfDay.toLowerCase()} travel.
//                   </p>
//                 </div>
//               )}

//               <div className="text-[10px] text-slate-500">
//                 Road data: {source === 'grid' ? 'approximate grid (fallback)' : '© OpenStreetMap contributors'} • risk index is
//                 relative to this area (0 = safest roads, 100 = most dangerous) • times include a 20% junction allowance.
//               </div>
//             </div>
//           )}
//         </div>

//         {/* ============ Map ============ */}
//         <div
//           className="flex-1 h-[65vh] lg:h-auto min-h-[460px] relative"
//           style={{ background: dark ? '#1b1f27' : '#e5e7eb' }}
//         >
//           <div className="absolute top-4 right-4 z-[1000] flex bg-[#0F172A]/90 backdrop-blur border border-white/15 rounded-full p-1 shadow-xl">
//             <button
//               type="button"
//               onClick={() => setMapTheme('light')}
//               className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
//                 mapTheme === 'light' ? 'bg-white text-slate-900 shadow' : 'text-slate-300 hover:text-white'
//               }`}
//             >
//               <Sun size={13} /> Light
//             </button>
//             <button
//               type="button"
//               onClick={() => setMapTheme('dark')}
//               className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
//                 mapTheme === 'dark' ? 'bg-[#3b82f6] text-white shadow' : 'text-slate-300 hover:text-white'
//               }`}
//             >
//               <Moon size={13} /> Dark
//             </button>
//           </div>

//           {/* Legend */}
//           {computedRoutes.length > 0 && (
//             <div className="absolute bottom-6 left-4 z-[1000] rounded-xl bg-[#0F172A]/90 backdrop-blur border border-white/15 px-3.5 py-2.5 shadow-xl">
//               {PROFILES.map((p) => (
//                 <button
//                   key={p.key}
//                   type="button"
//                   onClick={() => setSelectedProfile(p.key)}
//                   className={`flex items-center gap-2 text-[11px] font-bold py-0.5 ${
//                     activeRoute?.key === p.key ? 'text-white' : 'text-slate-400 hover:text-white'
//                   }`}
//                 >
//                   <span className="inline-block w-6 h-1.5 rounded" style={{ background: p.color }} />
//                   {p.label}
//                 </button>
//               ))}
//             </div>
//           )}

//           {computing && (
//             <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 rounded-full bg-[#0F172A]/90 border border-white/15 px-4 py-2 text-xs text-slate-200 shadow-xl pointer-events-none">
//               <Loader2 size={14} className="animate-spin" /> {status}
//             </div>
//           )}
//           {!start && !computing && (
//             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] rounded-full bg-[#0F172A]/90 border border-white/15 px-4 py-2 text-xs text-slate-200 shadow-xl pointer-events-none whitespace-nowrap">
//               Click the map to drop pin A, or pick areas on the left
//             </div>
//           )}
//           {start && !end && !computing && (
//             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] rounded-full bg-[#0F172A]/90 border border-white/15 px-4 py-2 text-xs text-slate-200 shadow-xl pointer-events-none whitespace-nowrap">
//               Now click the map to drop destination pin B
//             </div>
//           )}

//           <MapContainer center={KARACHI_CENTER} zoom={12} zoomControl={true} className="w-full h-full z-[1]">
//             {dark ? (
//               <>
//                 <TileLayer
//                   key="dark-base"
//                   url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
//                   attribution="&copy; Esri"
//                   maxNativeZoom={16}
//                   maxZoom={19}
//                 />
//                 <TileLayer
//                   key="dark-labels"
//                   url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
//                   maxNativeZoom={16}
//                   maxZoom={19}
//                 />
//               </>
//             ) : (
//               <TileLayer
//                 key="light"
//                 url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//                 attribution="&copy; OpenStreetMap contributors"
//                 maxZoom={19}
//               />
//             )}

//             <Pane name="danger-pane" style={{ zIndex: 390 }}>
//               {dangerZones.map((zone, i) => (
//                 <Circle
//                   key={`danger-${zone.id ?? i}`}
//                   center={[zone.lat, zone.lng]}
//                   radius={dangerRadiusM}
//                   pathOptions={{
//                     color: '#ef4444',
//                     weight: 1,
//                     fillColor: '#ef4444',
//                     fillOpacity: night ? 0.22 : 0.13,
//                     interactive: false,
//                   }}
//                 />
//               ))}
//             </Pane>

//             <Pane name="route-pane" style={{ zIndex: 410 }}>
//               {drawOrder.map((route) => (
//                 <RouteLine
//                   key={`${route.key}-${route.sig}-${mapTheme}-${route.key === activeRoute?.key ? 'a' : 'i'}`}
//                   route={route}
//                   active={route.key === activeRoute?.key}
//                   dark={dark}
//                   onSelect={() => setSelectedProfile(route.key)}
//                 />
//               ))}
//             </Pane>

//             {start && (
//               <Marker
//                 position={[start.lat, start.lng]}
//                 icon={startIcon}
//                 draggable
//                 zIndexOffset={1000}
//                 eventHandlers={{
//                   dragend: (e) => {
//                     const p = e.target.getLatLng();
//                     const next = { lat: p.lat, lng: p.lng };
//                     setStart(next);
//                     setStartText(fmtCoord(next));
//                   },
//                 }}
//               />
//             )}
//             {end && (
//               <Marker
//                 position={[end.lat, end.lng]}
//                 icon={endIcon}
//                 draggable
//                 zIndexOffset={1000}
//                 eventHandlers={{
//                   dragend: (e) => {
//                     const p = e.target.getLatLng();
//                     const next = { lat: p.lat, lng: p.lng };
//                     setEnd(next);
//                     setEndText(fmtCoord(next));
//                   },
//                 }}
//               />
//             )}

//             <MapPinDropper
//               start={start}
//               end={end}
//               setStart={setStart}
//               setEnd={setEnd}
//               setStartText={setStartText}
//               setEndText={setEndText}
//               resetRoute={resetRoute}
//             />
//             <FitRouteBounds routes={computedRoutes} sig={routesSig} />
//             <MapResizer />
//           </MapContainer>
//         </div>
//       </div>
//     </div>
//   );
// }


// frontend/src/pages/SafeRoutes.jsx
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
// Fetches real street geometry from OSRM in <1s, merges corridors into a
// topological road graph, and runs weighted Dijkstra for Safe / Balanced / Fast.
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
  // Build unified road graph by merging shared street intersections across corridors
  const nodeMap = new Map();
  const nodes = [];
  const adj = [];

  const getNodeId = (lat, lng) => {
    // Snap coordinates within ~15m to merge shared road junctions
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

  // Generate 7 real street corridors (direct + alternatives + perpendicular detours around hotspots)
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

  // Normalize risk scores relative to the local corridor (95th percentile = 1.0)
  allSegRisks.sort((a, b) => a - b);
  const scale = allSegRisks[Math.floor(allSegRisks.length * 0.95)] || allSegRisks[allSegRisks.length - 1] || 1;
  const normFactor = scale > 1e-9 ? scale : 1;

  for (const c of corridors) {
    c.segRisks = c.rawRisks.map((v) => Math.min(1, v / normFactor));
  }

  // Run Weighted Dijkstra across the real-street graph for all 3 user profiles
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

          {!computing && notice && computedRoutes.length > 0 && (
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