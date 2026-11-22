// frontend/src/pages/PredictRisk.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  MapContainer,
  TileLayer,
  Circle,
  CircleMarker,
  Tooltip,
  useMap,
} from 'react-leaflet';
import {
  MapPin,
  Clock,
  ShieldAlert,
  Activity,
  AlertTriangle,
  CheckCircle,
  Search,
  Navigation,
  Layers,
  TrendingUp,
  Sun,
  Moon,
  Compass,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import 'leaflet/dist/leaflet.css';
import * as turf from '@turf/turf';

const API_HEATMAP = 'http://localhost:5000/api/heatmap';
const API_PREDICT = 'http://localhost:5000/api/predict';
const KARACHI_CENTER = [24.89, 67.07];

// Smoothly flies the tactical map to the selected or predicted neighborhood
function FlyToZone({ coords, zoom = 14 }) {
  const map = useMap();
  useEffect(() => {
    if (coords && Number.isFinite(coords[0]) && Number.isFinite(coords[1])) {
      map.flyTo(coords, zoom, { duration: 1.1 });
    }
  }, [coords, zoom, map]);
  return null;
}

// Temporal multiplier curve reflecting Karachi street-crime diurnal patterns
function hourlyMultiplier(hour) {
  if (hour >= 0 && hour <= 4) return 1.24; // Late night / isolated roads
  if (hour >= 5 && hour <= 8) return 0.76; // Early morning low activity
  if (hour >= 9 && hour <= 13) return 0.88; // Midday commercial hours
  if (hour >= 14 && hour <= 17) return 0.96; // Afternoon commute
  if (hour >= 18 && hour <= 21) return 1.18; // Evening rush / peak snatching window
  return 1.22; // 22:00 - 23:59
}

function clampScore(val) {
  return Math.max(5, Math.min(99, Math.round(val)));
}

function riskMeta(score) {
  if (score >= 75) {
    return {
      label: 'CRITICAL RISK',
      color: '#ef4444',
      badge: 'text-red-400 bg-red-500/15 border-red-500/40',
      ring: 'text-red-500 bg-red-500/10 border-red-500/50',
      Icon: ShieldAlert,
    };
  }
  if (score >= 45) {
    return {
      label: 'MODERATE RISK',
      color: '#f59e0b',
      badge: 'text-amber-400 bg-amber-500/15 border-amber-500/40',
      ring: 'text-amber-400 bg-amber-500/10 border-amber-500/50',
      Icon: AlertTriangle,
    };
  }
  return {
    label: 'LOW RISK',
    color: '#22c55e',
    badge: 'text-green-400 bg-green-500/15 border-green-500/40',
    ring: 'text-green-500 bg-green-500/10 border-green-500/50',
    Icon: CheckCircle,
  };
}

// ==========================================
// 24-HOUR TEMPORAL RISK CURVE (SVG CHART)
// ==========================================
function HourlyRiskChart({ baseScore, selectedHour, onSelectHour }) {
  const hours = useMemo(() => {
    return Array.from({ length: 24 }, (_, h) => {
      const score = clampScore(baseScore * hourlyMultiplier(h));
      return { hour: h, score };
    });
  }, [baseScore]);

  const safest = useMemo(
    () => hours.reduce((best, cur) => (cur.score < best.score ? cur : best), hours[0]),
    [hours]
  );
  const peak = useMemo(
    () => hours.reduce((worst, cur) => (cur.score > worst.score ? cur : worst), hours[0]),
    [hours]
  );

  const W = 520;
  const H = 120;
  const padX = 14;
  const padY = 16;

  const points = hours.map((item, idx) => {
    const x = padX + (idx / 23) * (W - padX * 2);
    const y = H - padY - (item.score / 100) * (H - padY * 2);
    return { ...item, x, y };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPoints = `${points[0].x},${H - padY} ${polylinePoints} ${points[points.length - 1].x},${H - padY}`;
  const activePt = points[selectedHour] || points[0];

  return (
    <div className="bg-[#0F172A] border border-white/10 rounded-2xl p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider flex items-center gap-2">
          <TrendingUp size={14} className="text-[#F97316]" /> 24-Hour Temporal Risk Forecast
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-green-400 font-bold">
            Safest: {String(safest.hour).padStart(2, '0')}:00 ({safest.score})
          </span>
          <span className="text-red-400 font-bold">
            Peak: {String(peak.hour).padStart(2, '0')}:00 ({peak.score})
          </span>
        </div>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-32 overflow-visible">
          <defs>
            <linearGradient id="cgRiskFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F97316" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#F97316" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Threshold reference lines */}
          <line
            x1={padX}
            x2={W - padX}
            y1={H - padY - 0.75 * (H - padY * 2)}
            y2={H - padY - 0.75 * (H - padY * 2)}
            stroke="rgba(239,68,68,0.25)"
            strokeDasharray="4 4"
          />
          <line
            x1={padX}
            x2={W - padX}
            y1={H - padY - 0.45 * (H - padY * 2)}
            y2={H - padY - 0.45 * (H - padY * 2)}
            stroke="rgba(245,158,11,0.2)"
            strokeDasharray="4 4"
          />

          <polygon points={areaPoints} fill="url(#cgRiskFill)" />
          <polyline
            fill="none"
            stroke="#F97316"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
          />

          {/* Interactive hour nodes */}
          {points.map((pt) => {
            const isSel = pt.hour === selectedHour;
            return (
              <g
                key={pt.hour}
                className="cursor-pointer"
                onClick={() => onSelectHour(pt.hour)}
              >
                <circle cx={pt.x} cy={pt.y} r={10} fill="transparent" />
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSel ? 5.5 : 2.5}
                  fill={isSel ? '#ffffff' : riskMeta(pt.score).color}
                  stroke={isSel ? '#F97316' : 'none'}
                  strokeWidth={isSel ? 2.5 : 0}
                />
              </g>
            );
          })}

          {/* Active vertical indicator */}
          <line
            x1={activePt.x}
            x2={activePt.x}
            y1={padY}
            y2={H - padY}
            stroke="rgba(255,255,255,0.35)"
            strokeDasharray="2 2"
          />
        </svg>

        <div className="flex justify-between text-[10px] font-bold text-slate-500 px-2">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>  
          <span>18:00</span>
          <span>23:00</span>
        </div>
      </div>

      <p className="text-[11px] text-slate-400">
        Click any hour node on the curve to simulate how risk shifts across the day.
      </p>
    </div>
  );
}

// ==========================================
// MAIN PAGE
// ==========================================
export default function PredictRisk() {
  const navigate = useNavigate();
  const [zones, setZones] = useState([]);
  const [location, setLocation] = useState('');
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [mapTheme, setMapTheme] = useState('dark');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [matchedZone, setMatchedZone] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchZones = async () => {
      try {
        const res = await fetch(API_HEATMAP);
        const data = await res.json();
        if (data.success && Array.isArray(data.zones)) {
          setZones(data.zones);
        }
      } catch (err) {
        console.error('Could not load neighborhood list:', err);
      }
    };
    fetchZones();
  }, []);

  const areaSuggestions = useMemo(() => {
    return zones
      .map((z) => ({
        label: `${z.name} (${z.town})`,
        name: z.name,
        town: z.town,
        zone: z,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [zones]);

  const selectedHour = useMemo(() => {
    const h = parseInt((time || '12:00').split(':')[0], 10);
    return Number.isFinite(h) ? Math.max(0, Math.min(23, h)) : 12;
  }, [time]);

  // Live preview match while typing or clicking map pins
  const previewZone = useMemo(() => {
    const clean = location.trim().toLowerCase();
    if (!clean) return matchedZone;
    return (
      zones.find((z) => `${z.name} (${z.town})`.toLowerCase() === clean) ||
      zones.find((z) => z.name.toLowerCase() === clean) ||
      zones.find((z) => z.name.toLowerCase().includes(clean)) ||
      matchedZone
    );
  }, [location, zones, matchedZone]);

  // Nearby subdivisions within 3.5km using Turf.js
  const nearbyZones = useMemo(() => {
    const target = matchedZone || previewZone;
    if (!target || zones.length === 0) return [];
    const origin = turf.point([parseFloat(target.lng), parseFloat(target.lat)]);

    return zones
      .filter((z) => z.name !== target.name)
      .map((z) => {
        const dKm = turf.distance(origin, turf.point([parseFloat(z.lng), parseFloat(z.lat)]), {
          units: 'kilometers',
        });
        return { ...z, distKm: dKm };
      })
      .filter((z) => z.distKm <= 3.5)
      .sort((a, b) => a.distKm - b.distKm)
      .slice(0, 4);
  }, [matchedZone, previewZone, zones]);

  const runPrediction = async (targetLocation, targetTime) => {
    if (!targetLocation.trim() || !targetTime) {
      setError('Please provide both a Karachi neighborhood and travel time.');
      return;
    }

    setLoading(true);
    setError(null);

    const clean = targetLocation.trim().toLowerCase();
    const found =
      zones.find((z) => `${z.name} (${z.town})`.toLowerCase() === clean) ||
      zones.find((z) => z.name.toLowerCase() === clean) ||
      zones.find((z) => z.name.toLowerCase().includes(clean) || z.town.toLowerCase().includes(clean)) ||
      null;
    setMatchedZone(found);

    const queryName = found ? found.name : targetLocation.trim();
    const hr = parseInt(targetTime.split(':')[0], 10) || 12;

    try {
      const res = await axios.post(API_PREDICT, {
        location: queryName,
        time: targetTime,
      });
      setResult({
        ...res.data,
        source: 'ml',
      });
    } catch (err) {
      // Resilient fallback using local 60k-record subdivision telemetry if backend is unreachable
      if (found) {
        const calibrated = clampScore(parseFloat(found.avgScore) * hourlyMultiplier(hr));
        const meta = riskMeta(calibrated);
        setResult({
          riskScore: calibrated,
          status: `${meta.label} — ${found.type} Alert`,
          location: found.name,
          time: targetTime,
          advice:
            calibrated >= 75
              ? `High incidence of ${found.type.toLowerCase()} recorded around ${found.name} (${found.town}) during this window. Avoid isolated side streets, keep valuables concealed, and prefer main arterial roads.`
              : calibrated >= 45
              ? `Moderate street-crime exposure in ${found.name}. Stay on well-lit primary roads and remain alert at signals and commercial intersections.`
              : `Relatively low incident density in ${found.name} at ${targetTime}. Standard urban awareness is recommended.`,
          source: 'spatial-fallback',
        });
      } else {
        setError(err.response?.data?.message || 'Unable to reach prediction service. Pick an area from the dropdown.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = (e) => {
    e.preventDefault();
    runPrediction(location, time);
  };

  const handleSelectHourFromChart = (hour) => {
    const nextTime = `${String(hour).padStart(2, '0')}:00`;
    setTime(nextTime);
    if (location.trim()) {
      runPrediction(location, nextTime);
    }
  };

  const handlePinSelect = (zone) => {
    const label = `${zone.name} (${zone.town})`;
    setLocation(label);
    setMatchedZone(zone);
    runPrediction(label, time);
  };

  const activeMeta = result ? riskMeta(result.riskScore) : null;
  const ActiveIcon = activeMeta?.Icon || Activity;
  const baseScoreForChart = matchedZone
    ? parseFloat(matchedZone.avgScore)
    : result
    ? Math.round(result.riskScore / hourlyMultiplier(selectedHour))
    : 55;

  const mapCoords = previewZone
    ? [parseFloat(previewZone.lat), parseFloat(previewZone.lng)]
    : KARACHI_CENTER;

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F1F5F9] flex flex-col font-sans">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 lg:py-10 w-full flex-1 flex flex-col gap-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1E293B] border border-white/10 text-[#F97316] text-xs font-bold tracking-widest uppercase mb-3">
              <Radio size={14} /> Spatial-Temporal ML Inference
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              AI Risk Predictor
            </h1>
            <p className="text-[#94A3B8] text-sm md:text-base mt-1">
              Evaluate neighborhood-level crime risk across 210 Karachi subdivisions or click any block pin on the map.
            </p>
          </div>

          {/* Map Theme Switcher */}
          <div className="self-start md:self-auto flex bg-[#1E293B] border border-white/10 rounded-full p-1">
            <button
              type="button"
              onClick={() => setMapTheme('dark')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                mapTheme === 'dark' ? 'bg-[#3b82f6] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Moon size={13} /> Dark Map
            </button>
            <button
              type="button"
              onClick={() => setMapTheme('light')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                mapTheme === 'light' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sun size={13} /> Light Map
            </button>
          </div>
        </div>

        {/* Main 2-Column Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Input Form + Tactical Map */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#1E293B] border border-white/10 rounded-3xl p-6 shadow-2xl">
              <form onSubmit={handlePredict} className="space-y-5">
                <datalist id="karachi-predict-areas">
                  {areaSuggestions.map((item) => (
                    <option key={item.label} value={item.label} />
                  ))}
                </datalist>

                {/* Neighborhood Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider flex items-center justify-between">
                    <span>Karachi Subdivision / Block</span>
                    <span className="text-[10px] text-slate-400">{zones.length} Zones Ready</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#F97316]" size={18} />
                    <input
                      type="text"
                      list="karachi-predict-areas"
                      placeholder="Type e.g. Gulshan-e-Iqbal, Lyari, Saddar..."
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-[#0F172A] border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#F97316] transition-all"
                    />
                  </div>
                </div>

                {/* Time Input + Quick Presets */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider flex items-center justify-between">
                    <span>Travel Time</span>
                    <div className="flex gap-1">
                      {[
                        { label: 'Now', val: 'now' },
                        { label: '09:00', val: '09:00' },
                        { label: '19:00', val: '19:00' },
                        { label: '01:00', val: '01:00' },
                      ].map((p) => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => {
                            if (p.val === 'now') {
                              const now = new Date();
                              setTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
                            } else {
                              setTime(p.val);
                            }
                          }}
                          className="px-2 py-0.5 rounded bg-[#0F172A] hover:bg-slate-800 text-[10px] font-bold text-slate-300 border border-white/10"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#3b82f6]" size={18} />
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full bg-[#0F172A] border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-[#F97316] transition-all [color-scheme:dark]"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/40 text-red-400 px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2">
                    <AlertTriangle size={15} className="shrink-0" /> {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#F97316] hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Search size={18} /> Analyze Neighborhood Risk
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Interactive Zone Selector Map */}
            <div className="bg-[#1E293B] border border-white/10 rounded-3xl p-4 shadow-2xl space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider flex items-center gap-1.5">
                  <Compass size={14} className="text-[#3b82f6]" /> Click Any Pin to Inspect
                </span>
                {previewZone && (
                  <span className="text-[11px] font-bold text-white truncate max-w-[180px]">
                    {previewZone.name}
                  </span>
                )}
              </div>

              <div className="h-72 w-full rounded-2xl overflow-hidden border border-white/10 relative z-[1]">
                <MapContainer
                  center={KARACHI_CENTER}
                  zoom={11}
                  zoomControl={true}
                  className="w-full h-full"
                >
                  {mapTheme === 'dark' ? (
                    <TileLayer
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                      attribution="&copy; Esri"
                    />
                  ) : (
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution="&copy; OpenStreetMap"
                    />
                  )}

                  {/* Render all 210 subdivision dots so user can click any block directly */}
                  {zones.map((z, idx) => {
                    const isSelected = previewZone?.name === z.name;
                    const score = parseFloat(z.avgScore);
                    const dotColor = isSelected
                      ? '#3b82f6'
                      : score >= 75
                      ? '#ef4444'
                      : score >= 45
                      ? '#f59e0b'
                      : '#22c55e';

                    return (
                      <CircleMarker
                        key={z.id ?? idx}
                        center={[parseFloat(z.lat), parseFloat(z.lng)]}
                        radius={isSelected ? 8 : 4}
                        pathOptions={{
                          color: isSelected ? '#ffffff' : '#0f172a',
                          weight: isSelected ? 2.5 : 1,
                          fillColor: dotColor,
                          fillOpacity: isSelected ? 1 : 0.85,
                        }}
                        eventHandlers={{
                          click: () => handlePinSelect(z),
                        }}
                      >
                        <Tooltip direction="top" offset={[0, -5]}>
                          <div className="text-xs font-sans">
                            <b>{z.name}</b> ({z.town}) — Score: {z.avgScore}
                          </div>
                        </Tooltip>
                      </CircleMarker>
                    );
                  })}

                  {/* Highlight influence buffer around active zone */}
                  {previewZone && (
                    <Circle
                      center={[parseFloat(previewZone.lat), parseFloat(previewZone.lng)]}
                      radius={1000}
                      pathOptions={{
                        color: result ? activeMeta.color : '#3b82f6',
                        fillColor: result ? activeMeta.color : '#3b82f6',
                        fillOpacity: 0.18,
                        weight: 1.5,
                      }}
                    />
                  )}

                  <FlyToZone coords={previewZone ? mapCoords : null} zoom={previewZone ? 13 : 11} />
                </MapContainer>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Intelligence Output, 24h Forecast & Nearby Radar */}
          <div className="lg:col-span-7 space-y-6">
            {!result ? (
              <div className="bg-[#1E293B] border border-white/10 rounded-3xl p-10 text-center flex flex-col items-center justify-center min-h-[420px] shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-[#0F172A] border border-white/10 flex items-center justify-center text-[#F97316] mb-4">
                  <ShieldCheck size={32} />
                </div>
                <h2 className="text-2xl font-black text-white mb-2">Ready for Spatial Risk Analysis</h2>
                <p className="text-sm text-[#94A3B8] max-w-md mb-6">
                  Pick a Karachi subdivision from the search box or click any colored block dot on the map to generate a risk score, 24-hour forecast, and nearby hotspot scan.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {['Gulshan-e-Iqbal Block A', 'Saddar Phase 1', 'DHA Phase 6', 'Landhi Block A'].map((sample) => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => {
                        setLocation(sample);
                        runPrediction(sample, time);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 border border-white/10 text-xs font-bold text-slate-300 transition-all"
                    >
                      Try: {sample}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-[#1E293B] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
                {/* Score & Primary Verdict */}
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div
                    className={`shrink-0 w-36 h-36 rounded-full border-[6px] flex flex-col items-center justify-center ${activeMeta.ring} shadow-xl`}
                  >
                    <span className="text-5xl font-black">{result.riskScore}</span>
                    <span className="text-[11px] font-bold uppercase tracking-widest opacity-80 mt-1">
                      / 100 Index
                    </span>
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-2">
                      <ActiveIcon className="w-7 h-7" style={{ color: activeMeta.color }} />
                      <span className={`px-2.5 py-1 rounded-full border text-[10px] font-black tracking-wider uppercase ${activeMeta.badge}`}>
                        {activeMeta.label}
                      </span>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                      {result.status}
                    </h2>
                    <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mt-1 mb-3">
                      {result.location} {matchedZone ? `• ${matchedZone.town}` : ''} • {result.time}
                    </div>
                    <p className="text-sm md:text-base text-slate-300 leading-relaxed">
                      {result.advice}
                    </p>
                  </div>
                </div>

                {/* Historical Telemetry Strip */}
                {matchedZone && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-[#0F172A] border border-white/10 rounded-2xl p-3.5">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Dominant Crime</div>
                      <div className="text-sm md:text-base font-black text-white mt-0.5 truncate">
                        {matchedZone.type}
                      </div>
                    </div>
                    <div className="bg-[#0F172A] border border-white/10 rounded-2xl p-3.5">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Recorded Cases</div>
                      <div className="text-sm md:text-base font-black text-[#F97316] mt-0.5">
                        {(matchedZone.incidents || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-[#0F172A] border border-white/10 rounded-2xl p-3.5">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Zone Baseline</div>
                      <div className="text-sm md:text-base font-black text-white mt-0.5">
                        {matchedZone.avgScore} / 100
                      </div>
                    </div>
                  </div>
                )}

                {/* 24-Hour Temporal Risk Curve */}
                <HourlyRiskChart
                  baseScore={baseScoreForChart}
                  selectedHour={selectedHour}
                  onSelectHour={handleSelectHourFromChart}
                />

                {/* Nearby Neighborhood Risk Radar */}
                {nearbyZones.length > 0 && (
                  <div className="bg-[#0F172A] border border-white/10 rounded-2xl p-4 space-y-3">
                    <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">
                      Adjacent Subdivisions Within 3.5 km
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {nearbyZones.map((nz, i) => {
                        const nzScore = Math.round(parseFloat(nz.avgScore));
                        const nzMeta = riskMeta(nzScore);
                        return (
                          <button
                            key={nz.id ?? i}
                            type="button"
                            onClick={() => handlePinSelect(nz)}
                            className="flex items-center justify-between p-3 rounded-xl bg-[#1E293B] hover:bg-slate-800 border border-white/5 text-left transition-all"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="text-xs font-bold text-white truncate">{nz.name}</div>
                              <div className="text-[10px] text-slate-400">
                                {nz.distKm.toFixed(1)} km away • {nz.type}
                              </div>
                            </div>
                            <span
                              className={`shrink-0 px-2 py-0.5 rounded-full border text-[11px] font-black ${nzMeta.badge}`}
                            >
                              {nzScore}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Cross-Navigation Actions */}
                <div className="flex flex-wrap gap-3 pt-2 border-t border-white/10 justify-end">
                  <button
                    type="button"
                    onClick={() => navigate('/heatmap')}
                    className="px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 border border-white/10 text-xs font-bold text-slate-200 flex items-center gap-2 transition-all"
                  >
                    <Layers size={14} /> Open Thermal Heatmap
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const targetZone = matchedZone || previewZone;
                      const isNightHour = selectedHour >= 18 || selectedHour <= 5;
                      navigate('/safe-routes', {
                        state: targetZone
                          ? {
                              destination: {
                                lat: parseFloat(targetZone.lat),
                                lng: parseFloat(targetZone.lng),
                                label: `${targetZone.name} (${targetZone.town})`,
                              },
                              timeOfDay: isNightHour ? 'Night' : 'Day',
                            }
                          : undefined,
                      });
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[#3b82f6] hover:bg-blue-600 text-xs font-bold text-white flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                  >
                    <Navigation size={14} /> Plan Safe Route Here
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}