import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Circle, CircleMarker, Tooltip, useMap } from 'react-leaflet';
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
} from 'lucide-react';
import Navbar from '../components/Navbar';
import 'leaflet/dist/leaflet.css';

// Smoothly flies the mini-map to the predicted neighborhood
function FlyToZone({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.flyTo(coords, 14, { duration: 1.2 });
    }
  }, [coords, map]);
  return null;
}

export default function PredictRisk() {
  const navigate = useNavigate();
  const [zones, setZones] = useState([]);
  const [location, setLocation] = useState('');
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [matchedZone, setMatchedZone] = useState(null);
  const [error, setError] = useState(null);

  // Load 210 Karachi subdivisions for autocomplete and spatial context
  useEffect(() => {
    const fetchZones = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/heatmap');
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
    const unique = new Set(zones.map((z) => z.name));
    return [...unique].sort((a, b) => a.localeCompare(b));
  }, [zones]);

  const setPresetTime = (val) => {
    if (val === 'now') {
      const now = new Date();
      setTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    } else {
      setTime(val);
    }
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    if (!location.trim() || !time) {
      setError('Please provide both a Karachi neighborhood and travel time.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    // Find matching zone metadata (lat, lng, dominant crime, historical count)
    const clean = location.trim().toLowerCase();
    const found =
      zones.find((z) => z.name.toLowerCase() === clean) ||
      zones.find((z) => `${z.name} (${z.town})`.toLowerCase() === clean) ||
      zones.find((z) => z.name.toLowerCase().includes(clean) || z.town.toLowerCase().includes(clean)) ||
      null;
    setMatchedZone(found);

    try {
      const res = await axios.post('http://localhost:5000/api/predict', {
        location: found ? found.name : location.trim(),
        time,
      });
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Server error. Ensure the Express & FastAPI backends are running.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColors = (score) => {
    if (score >= 75) return 'text-red-500 bg-red-500/10 border-red-500/50';
    if (score >= 45) return 'text-amber-400 bg-amber-500/10 border-amber-500/50';
    return 'text-green-500 bg-green-500/10 border-green-500/50';
  };

  const getRiskHex = (score) => {
    if (score >= 75) return '#ef4444';
    if (score >= 45) return '#f59e0b';
    return '#22c55e';
  };

  const getRiskIcon = (score) => {
    if (score >= 75) return <ShieldAlert className="w-10 h-10 text-red-500 shrink-0" />;
    if (score >= 45) return <AlertTriangle className="w-10 h-10 text-amber-400 shrink-0" />;
    return <CheckCircle className="w-10 h-10 text-green-500 shrink-0" />;
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F1F5F9] flex flex-col font-sans">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-10 lg:py-14 w-full flex-1">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1E293B] border border-white/10 text-[#F97316] text-xs font-bold tracking-widest uppercase mb-4 shadow-lg">
            <Activity size={14} /> Real-Time ML Inference
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3">
            AI Risk Predictor
          </h1>
          <p className="text-[#94A3B8] text-base md:text-lg max-w-2xl mx-auto">
            Select any of Karachi’s 210 monitored neighborhoods and travel time to evaluate spatial-temporal crime risk.
          </p>
        </div>

        {/* Prediction Form */}
        <div className="bg-[#1E293B] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
          <form onSubmit={handlePredict} className="space-y-6">
            <datalist id="karachi-predict-areas">
              {areaSuggestions.map((area) => (
                <option key={area} value={area} />
              ))}
            </datalist>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Location Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider flex items-center justify-between">
                  <span>Neighborhood / Block</span>
                  <span className="text-[10px] text-slate-500">{areaSuggestions.length} Areas Indexed</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]" size={20} />
                  <input
                    type="text"
                    list="karachi-predict-areas"
                    placeholder="Start typing e.g. Gulshan-e-Iqbal, Lyari, DHA..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-[#0F172A] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] transition-all"
                  />
                </div>
              </div>

              {/* Time Input + Quick Presets */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider flex items-center justify-between">
                  <span>Time of Travel</span>
                  <div className="flex gap-1.5">
                    {[
                      { label: 'Now', val: 'now' },
                      { label: '09:00', val: '09:00' },
                      { label: '19:00', val: '19:00' },
                      { label: '01:00', val: '01:00' },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setPresetTime(preset.val)}
                        className="px-2 py-0.5 rounded bg-[#0F172A] hover:bg-slate-800 text-[10px] font-bold text-slate-300 border border-white/10"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]" size={20} />
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-[#0F172A] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] transition-all [color-scheme:dark]"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0" /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F97316] hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Search size={20} /> Calculate Risk Score
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Container */}
        {result && (
          <div className="mt-8 bg-[#1E293B] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Score Circle */}
              <div
                className={`shrink-0 w-40 h-40 rounded-full border-[6px] flex flex-col items-center justify-center ${getRiskColors(
                  result.riskScore
                )} shadow-xl`}
              >
                <span className="text-5xl font-black">{result.riskScore}</span>
                <span className="text-xs font-bold uppercase tracking-widest opacity-80 mt-1">/ 100 Risk</span>
              </div>

              {/* Status & Advice */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  {getRiskIcon(result.riskScore)}
                  <h2 className="text-3xl font-black text-white tracking-tight">{result.status}</h2>
                </div>
                <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-4 border-b border-white/10 pb-3">
                  {result.location} {matchedZone ? `• ${matchedZone.town}` : ''} • {result.time}
                </div>
                <p className="text-base text-slate-300 leading-relaxed">{result.advice}</p>

                {/* Historical Telemetry Badges (if matched to a subdivision) */}
                {matchedZone && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
                    <div className="bg-[#0F172A] border border-white/10 rounded-xl p-3">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Primary Threat</div>
                      <div className="text-sm font-black text-white mt-0.5">{matchedZone.type}</div>
                    </div>
                    <div className="bg-[#0F172A] border border-white/10 rounded-xl p-3">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Historical Cases</div>
                      <div className="text-sm font-black text-orange-400 mt-0.5">
                        {(matchedZone.incidents || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-[#0F172A] border border-white/10 rounded-xl p-3 col-span-2 sm:col-span-1">
                      <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                        <TrendingUp size={11} /> Zone Baseline
                      </div>
                      <div className="text-sm font-black text-white mt-0.5">{matchedZone.avgScore} / 100</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Spatial Preview Map + Quick Navigation Actions */}
            {matchedZone && (
              <div className="pt-4 border-t border-white/10 space-y-4">
                <div className="h-56 w-full rounded-2xl overflow-hidden border border-white/10 relative z-[1]">
                  <MapContainer
                    center={[parseFloat(matchedZone.lat), parseFloat(matchedZone.lng)]}
                    zoom={14}
                    zoomControl={false}
                    className="w-full h-full"
                  >
                    <TileLayer
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                      attribution="&copy; Esri"
                    />
                    <Circle
                      center={[parseFloat(matchedZone.lat), parseFloat(matchedZone.lng)]}
                      radius={900}
                      pathOptions={{
                        color: getRiskHex(result.riskScore),
                        fillColor: getRiskHex(result.riskScore),
                        fillOpacity: 0.22,
                        weight: 2,
                      }}
                    />
                    <CircleMarker
                      center={[parseFloat(matchedZone.lat), parseFloat(matchedZone.lng)]}
                      radius={6}
                      pathOptions={{ color: '#fff', fillColor: getRiskHex(result.riskScore), fillOpacity: 1, weight: 2 }}
                    >
                      <Tooltip permanent direction="top" offset={[0, -6]}>
                        {matchedZone.name} ({result.riskScore}/100)
                      </Tooltip>
                    </CircleMarker>
                    <FlyToZone coords={[parseFloat(matchedZone.lat), parseFloat(matchedZone.lng)]} />
                  </MapContainer>
                </div>

                <div className="flex flex-wrap gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => navigate('/heatmap')}
                    className="px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 border border-white/10 text-xs font-bold text-slate-200 flex items-center gap-2 transition-all"
                  >
                    <Layers size={14} /> View on Thermal Heatmap
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/safe-routes')}
                    className="px-4 py-2.5 rounded-xl bg-[#3b82f6] hover:bg-blue-600 text-xs font-bold text-white flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                  >
                    <Navigation size={14} /> Find Safe Route Around Zone
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}