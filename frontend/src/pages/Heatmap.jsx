import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import { Filter, ShieldAlert, Layers, Info } from 'lucide-react';
import Navbar from '../components/Navbar';
import 'leaflet/dist/leaflet.css';

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
        if (data.success) {
          setZones(data.zones);
        }
      } catch (err) {
        console.error('Error loading live heatmap:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHeatmapData();
  }, []);

  const crimeCategories = ['All', ...new Set(zones.map((z) => z.type))];

  const filteredZones = zones.filter((zone) => {
    const matchesRisk = selectedRisk === 'All' || zone.risk === selectedRisk;
    const matchesType = selectedType === 'All' || zone.type === selectedType;
    return matchesRisk && matchesType;
  });

  const getMarkerColor = (risk) => {
    if (risk === 'High') return '#EF4444';
    if (risk === 'Moderate') return '#F59E0B';
    return '#22C55E';
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F1F5F9] flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden">
        {/* Left Sidebar: Controls & Legend */}
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

          {/* Filter by Risk Level */}
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

          {/* Filter by Crime Type */}
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

          {/* District Summary Stats */}
          <div className="bg-[#0F172A] border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider flex items-center gap-2">
              <Info size={14} /> Active Zone Summary
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-[#1E293B] p-3 rounded-xl border border-white/5">
                <div className="text-2xl font-black text-white">
                  {loading ? '...' : filteredZones.length}
                </div>
                <div className="text-[10px] text-[#64748B] uppercase font-bold">Districts Shown</div>
              </div>
              <div className="bg-[#1E293B] p-3 rounded-xl border border-white/5">
                <div className="text-2xl font-black text-red-500">
                  {loading ? '...' : filteredZones.reduce((sum, z) => sum + z.incidents, 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-[#64748B] uppercase font-bold">Total Records</div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-auto border-t border-white/10 pt-4 space-y-2">
            <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Severity Legend</div>
            <div className="flex items-center gap-3 text-xs font-semibold text-white">
              <span className="w-3 h-3 rounded-full bg-red-500" /> High Incident District (70+ Score)
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold text-white">
              <span className="w-3 h-3 rounded-full bg-yellow-500" /> Moderate Warning District (50-69 Score)
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold text-white">
              <span className="w-3 h-3 rounded-full bg-green-500" /> Low Incident District (&lt;50 Score)
            </div>
          </div>
        </div>

        {/* Right Map Canvas */}
        <div className="flex-1 h-[500px] lg:h-auto min-h-[500px] relative">
          <MapContainer center={[24.89, 67.07]} zoom={11} zoomControl={true} className="w-full h-full z-[1]">
           <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
            />

            {filteredZones.map((zone) => (
              <CircleMarker
                key={zone.id}
                center={[zone.lat, zone.lng]}
                radius={zone.radius}
                pathOptions={{
                  color: getMarkerColor(zone.risk),
                  fillColor: getMarkerColor(zone.risk),
                  fillOpacity: 0.35,
                  weight: 2
                }}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                  <div className="p-1 text-slate-900 font-sans">
                    <div className="font-bold text-sm">{zone.name}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">{zone.town}</div>
                    <div className="text-xs text-slate-600">Dominant Crime: <b>{zone.type}</b></div>
                    <div className="text-xs text-slate-600">Risk Index: <b>{zone.avgScore} / 100</b></div>
                    <div className="text-xs text-slate-600">Historical Incidents: <b>{zone.incidents.toLocaleString()}</b></div>
                  </div>
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}