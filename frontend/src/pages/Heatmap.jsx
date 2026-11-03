import { useState } from "react";
import { MapContainer, TileLayer } from 'react-leaflet';
import { Layers } from 'lucide-react';
import Navbar from '../components/Navbar';
import 'leaflet/dist/leaflet.css';

export default function Heatmap() {
  const [selected, setSelected] = useState("Lyari");

  return (
    <div className="flex flex-col h-screen bg-[#0F172A] text-[#F1F5F9] overflow-hidden">
      <Navbar />

      {/* Controls Bar */}
      <div className="bg-[#1E293B] border-b border-white/10 px-6 py-3 flex items-center gap-4 flex-shrink-0 flex-wrap">
        <span className="text-sm font-bold tracking-wide">Heatmap Explorer</span>
        <div className="w-px h-5 bg-white/10 hidden sm:block" />
        <select className="bg-[#162032] border border-white/10 text-white rounded-md px-3 py-1.5 text-sm outline-none focus:border-[#F97316]">
          {["All Crimes", "Street Crime", "Vehicle Theft"].map(o => <option key={o}>{o}</option>)}
        </select>
        
        <div className="ml-auto flex items-center gap-4">
          <button className="flex items-center gap-2 bg-[#F97316]/10 border border-[#F97316]/40 text-[#F97316] rounded-md px-4 py-1.5 text-sm font-bold hover:bg-[#F97316]/20 transition-colors">
            <Layers size={16} /> Layers
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Map Area */}
        <div className="flex-1 relative bg-[#0A1628] z-[1]">
          <MapContainer center={[24.8607, 67.0011]} zoom={12} zoomControl={false} className="absolute inset-0 w-full h-full">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          </MapContainer>
        </div>

        {/* Sidebar */}
        <aside className="w-full lg:w-[320px] bg-[#1E293B] border-t lg:border-t-0 lg:border-l border-white/10 p-6 flex flex-col flex-shrink-0 z-[10] overflow-y-auto">
          <div className="text-[#64748B] text-xs font-bold tracking-widest mb-1 uppercase">Selected Area</div>
          <h3 className="text-2xl font-black text-white mb-6 tracking-tight">{selected}</h3>
          
          <div className="bg-[#162032] border border-[#EF4444]/30 rounded-2xl p-6 text-center shadow-lg shadow-red-900/10 mb-8">
            <div className="text-[#EF4444] text-6xl font-black leading-none mb-2">88</div>
            <div className="text-[#64748B] text-xs font-bold tracking-widest uppercase">Risk Score / 100</div>
          </div>

          <div className="mt-auto pt-6 border-t border-white/10">
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Heatmap data is aggregated from historical records and predictive modeling. High density zones are marked in red.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}