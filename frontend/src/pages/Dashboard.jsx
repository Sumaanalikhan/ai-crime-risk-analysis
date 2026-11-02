import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import { Filter, Activity } from 'lucide-react';
import Navbar from '../components/Navbar';
import 'leaflet/dist/leaflet.css';

export default function Dashboard() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0F172A] text-[#F1F5F9]">
      <Navbar />

      {/* Main App Layout */}
      <div className="flex-1 flex flex-col lg:flex-row lg:h-[calc(100vh-64px)] overflow-y-auto lg:overflow-hidden">

        {/* LEFT SIDEBAR (Filters & General Risk) */}
        <aside className="w-full lg:w-[280px] bg-[#1E293B] border-b lg:border-r border-white/10 p-5 flex flex-col gap-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Filter className="text-[#94A3B8]" size={18} />
            <span className="text-sm font-bold text-[#94A3B8] tracking-widest">FILTERS</span>
            <select className="ml-auto bg-[#162032] border border-white/10 text-white rounded-md px-2 py-1 text-sm outline-none focus:border-[#F97316]">
              <option>Evening</option>
              <option>Night</option>
              <option>Morning</option>
            </select>
          </div>

          <div className="bg-[#162032] border border-[#F59E0B]/30 rounded-xl p-5 text-center shadow-lg shadow-orange-900/10">
            <div className="text-[#64748B] text-xs font-bold tracking-widest mb-3 uppercase">Current City Risk</div>
            <div className="text-3xl font-black text-[#F59E0B] tracking-tight">MEDIUM</div>
          </div>
        </aside>

        {/* CENTER: The Interactive Map */}
        <main className="flex-1 relative h-[50vh] lg:h-auto min-h-[400px] z-[1]">
          <MapContainer center={[24.8607, 67.0011]} zoom={12} zoomControl={false} className="absolute inset-0 w-full h-full">
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            <CircleMarker center={[24.8607, 67.0011]} radius={35} pathOptions={{ color: "#EF4444", fillColor: "#EF4444", fillOpacity: 0.2 }}><Tooltip>Lyari - High Risk</Tooltip></CircleMarker>
            <CircleMarker center={[24.9180, 67.0971]} radius={25} pathOptions={{ color: "#F59E0B", fillColor: "#F59E0B", fillOpacity: 0.2 }}><Tooltip>Gulshan - Med Risk</Tooltip></CircleMarker>
            <CircleMarker center={[24.795, 67.0322]} radius={20} pathOptions={{ color: "#22C55E", fillColor: "#22C55E", fillOpacity: 0.2 }}><Tooltip>DHA - Low Risk</Tooltip></CircleMarker>
          </MapContainer>
          
          {/* Floating Live Data Badge */}
          <div className="absolute bottom-4 left-4 z-[1000] bg-[#162032]/90 backdrop-blur border border-white/10 rounded-lg px-3 py-2 flex items-center gap-2">
            <Activity size={16} className="text-[#F97316]" />
            <span className="text-xs font-bold text-white">Live Data Feed</span>
          </div>
        </main>

        {/* RIGHT SIDEBAR (District Breakdown) */}
        <aside className="w-full lg:w-[320px] bg-[#1E293B] border-t lg:border-l border-white/10 p-5 flex-shrink-0 overflow-y-auto">
          <div className="text-[#64748B] text-xs font-bold tracking-widest mb-6 uppercase">Risk Summary</div>
          
          <div className="flex flex-col gap-6">
            {/* Lyari */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-white">Lyari</span>
                <span className="font-bold text-[#EF4444]">88%</span>
              </div>
              <div className="w-full bg-[#0F172A] rounded-full h-1.5">
                <div className="bg-[#EF4444] h-1.5 rounded-full" style={{ width: '88%' }}></div>
              </div>
            </div>

            {/* Nazimabad */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-white">Nazimabad</span>
                <span className="font-bold text-[#F59E0B]">58%</span>
              </div>
              <div className="w-full bg-[#0F172A] rounded-full h-1.5">
                <div className="bg-[#F59E0B] h-1.5 rounded-full" style={{ width: '58%' }}></div>
              </div>
            </div>

            {/* DHA/Clifton */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-white">DHA/Clifton</span>
                <span className="font-bold text-[#22C55E]">18%</span>
              </div>
              <div className="w-full bg-[#0F172A] rounded-full h-1.5">
                <div className="bg-[#22C55E] h-1.5 rounded-full" style={{ width: '18%' }}></div>
              </div>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}