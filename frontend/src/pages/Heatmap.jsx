import { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import { Filter, ShieldAlert, Layers, Info } from 'lucide-react';
import Navbar from '../components/Navbar';
import 'leaflet/dist/leaflet.css';

// Karachi Crime Dataset (Mock spatial data for FYP visualization)
const crimeZones = [
  { id: 1, name: 'Saddar / Empress Market', lat: 24.8607, lng: 67.0011, risk: 'High', type: 'Mobile Snatching', incidents: 142, radius: 30 },
  { id: 2, name: 'Lyari / Lea Market', lat: 24.8683, lng: 66.9964, risk: 'High', type: 'Armed Robbery', incidents: 118, radius: 28 },
  { id: 3, name: 'Korangi Industrial Area', lat: 24.8239, lng: 67.1182, risk: 'High', type: 'Vehicle Theft', incidents: 95, radius: 25 },
  { id: 4, name: 'Gulshan-e-Iqbal (Block 13)', lat: 24.9180, lng: 67.0971, risk: 'Moderate', type: 'Mobile Snatching', incidents: 64, radius: 20 },
  { id: 5, name: 'North Nazimabad', lat: 24.9402, lng: 67.0382, risk: 'Moderate', type: 'Vehicle Theft', incidents: 52, radius: 18 },
  { id: 6, name: 'Tariq Road Commercial', lat: 24.8716, lng: 67.0599, risk: 'Moderate', type: 'Pickpocketing', incidents: 48, radius: 16 },
  { id: 7, name: 'DHA Phase 5 & 6', lat: 24.7950, lng: 67.0322, risk: 'Low', type: 'Minor Theft', incidents: 15, radius: 12 },
  { id: 8, name: 'Clifton Block 2', lat: 24.8138, lng: 67.0299, risk: 'Low', type: 'Minor Theft', incidents: 12, radius: 10 },
  { id: 9, name: 'Malir Cantt', lat: 24.9167, lng: 67.1833, risk: 'Low', type: 'None Reported', incidents: 3, radius: 8 }
];

export default function Heatmap() {
  const [selectedRisk, setSelectedRisk] = useState('All');
  const [selectedType, setSelectedType] = useState('All');

  // Filter crime zones based on active control pills
  const filteredZones = crimeZones.filter((zone) => {
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
              Interactive crime density visualizer for metropolitan Karachi districts.
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
              <ShieldAlert size={14} /> Filter by Category
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#F97316]"
            >
              <option value="All">All Categories</option>
              <option value="Mobile Snatching">Mobile Snatching</option>
              <option value="Armed Robbery">Armed Robbery</option>
              <option value="Vehicle Theft">Vehicle Theft</option>
              <option value="Minor Theft">Minor Theft</option>
            </select>
          </div>

          {/* District Summary Stats */}
          <div className="bg-[#0F172A] border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider flex items-center gap-2">
              <Info size={14} /> Active Zone Summary
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-[#1E293B] p-3 rounded-xl border border-white/5">
                <div className="text-2xl font-black text-white">{filteredZones.length}</div>
                <div className="text-[10px] text-[#64748B] uppercase font-bold">Zones Shown</div>
              </div>
              <div className="bg-[#1E293B] p-3 rounded-xl border border-white/5">
                <div className="text-2xl font-black text-red-500">
                  {filteredZones.reduce((sum, z) => sum + z.incidents, 0)}
                </div>
                <div className="text-[10px] text-[#64748B] uppercase font-bold">Total Incidents</div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-auto border-t border-white/10 pt-4 space-y-2">
            <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Severity Legend</div>
            <div className="flex items-center gap-3 text-xs font-semibold text-white">
              <span className="w-3 h-3 rounded-full bg-red-500" /> High Incident Zone (75-100 Score)
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold text-white">
              <span className="w-3 h-3 rounded-full bg-yellow-500" /> Moderate Warning Zone (45-74 Score)
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold text-white">
              <span className="w-3 h-3 rounded-full bg-green-500" /> Low Incident / Secure Zone (&lt;45 Score)
            </div>
          </div>

        </div>

        {/* Right Map Canvas */}
        <div className="flex-1 h-[500px] lg:h-auto min-h-[500px] relative">
          <MapContainer center={[24.87, 67.05]} zoom={12} zoomControl={true} className="w-full h-full z-[1]">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
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
                    <div className="text-xs text-slate-600">Primary Risk: <b>{zone.type}</b></div>
                    <div className="text-xs text-slate-600">Monthly Incidents: <b>{zone.incidents}</b></div>
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