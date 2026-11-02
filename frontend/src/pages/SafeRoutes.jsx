import { useState } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip } from "react-leaflet";
import { MapPin, Navigation, Clock, ShieldCheck, AlertTriangle, ArrowRight, Search } from "lucide-react";
import Navbar from "../components/Navbar";
import "leaflet/dist/leaflet.css";

export default function SafeRoutes() {
  const [origin, setOrigin] = useState("Iqra University, Defence View");
  const [destination, setDestination] = useState("Gulshan-e-Iqbal");
  const [isCalculating, setIsCalculating] = useState(false);
  const [showRoutes, setShowRoutes] = useState(false);

  const handleCalculate = () => {
    setIsCalculating(true);
    setShowRoutes(false);
    // Simulate API calculation delay
    setTimeout(() => {
      setIsCalculating(false);
      setShowRoutes(true);
    }, 1200);
  };

  // Mock coordinates for the map path
  const routePath = [
    [24.8270, 67.0823], // Iqra Uni
    [24.8450, 67.0700],
    [24.8700, 67.0850],
    [24.9180, 67.0971]  // Gulshan
  ];

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F1F5F9] flex flex-col h-screen overflow-hidden">
      <Navbar />

      <div className="flex-1 flex flex-col lg:flex-row w-full h-[calc(100vh-64px)]">
        
        {/* LEFT SIDEBAR: Navigation Controls */}
        <div className="w-full lg:w-[420px] bg-[#1E293B] border-r border-white/10 flex flex-col shadow-2xl z-[10] overflow-y-auto">
          <div className="p-6">
            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Safe Navigation</h2>
            <p className="text-[#94A3B8] text-sm mb-8">Enter your destination to find the most secure route based on real-time crime data.</p>

            {/* Input Form */}
            <div className="relative mb-6">
              {/* Vertical connector line */}
              <div className="absolute left-6 top-10 bottom-10 w-0.5 bg-white/10 border-l border-dashed border-[#64748B]"></div>
              
              <div className="relative bg-[#162032] border border-white/10 rounded-xl px-4 py-3 flex items-center gap-4 mb-4 focus-within:border-[#F97316] transition-colors">
                <div className="bg-blue-500/20 p-1.5 rounded-full">
                  <Navigation size={16} className="text-blue-500" />
                </div>
                <input 
                  type="text" 
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-sm font-medium text-white placeholder-[#64748B]"
                  placeholder="Starting point"
                />
              </div>

              <div className="relative bg-[#162032] border border-white/10 rounded-xl px-4 py-3 flex items-center gap-4 focus-within:border-[#F97316] transition-colors">
                <div className="bg-[#F97316]/20 p-1.5 rounded-full">
                  <MapPin size={16} className="text-[#F97316]" />
                </div>
                <input 
                  type="text" 
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-sm font-medium text-white placeholder-[#64748B]"
                  placeholder="Destination"
                />
              </div>
            </div>

            <button 
              onClick={handleCalculate}
              disabled={isCalculating}
              className="w-full bg-[#F97316] hover:bg-orange-600 disabled:bg-orange-600/50 text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg shadow-orange-500/20 flex justify-center items-center gap-2 mb-8"
            >
              {isCalculating ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Calculate Route <ArrowRight size={18} /></>
              )}
            </button>

            {/* Route Results (Visible after calculation) */}
            {showRoutes && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-4">Recommended Routes</h3>
                
                {/* Route Option 1 (Optimal) */}
                <div className="bg-gradient-to-br from-[#22C55E]/10 to-transparent border border-[#22C55E]/30 rounded-xl p-4 mb-4 cursor-pointer hover:bg-[#22C55E]/10 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck size={16} className="text-[#22C55E]" />
                        <span className="text-[#22C55E] font-bold text-sm">Safest Route</span>
                      </div>
                      <h4 className="text-white font-semibold">Via Shahrah-e-Faisal</h4>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-white">28 min</div>
                      <div className="text-xs text-[#94A3B8]">14.2 km</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium text-[#94A3B8]">
                    <span className="flex items-center gap-1"><AlertTriangle size={12} /> Low Risk</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> Optimal Traffic</span>
                  </div>
                </div>

                {/* Route Option 2 (Alternative) */}
                <div className="bg-[#162032] border border-white/5 rounded-xl p-4 cursor-pointer hover:border-white/20 transition-colors opacity-80">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Navigation size={16} className="text-[#F59E0B]" />
                        <span className="text-[#F59E0B] font-bold text-sm">Fastest Route</span>
                      </div>
                      <h4 className="text-white font-semibold">Via University Road</h4>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-white">22 min</div>
                      <div className="text-xs text-[#94A3B8]">12.8 km</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium text-[#94A3B8]">
                    <span className="flex items-center gap-1"><AlertTriangle size={12} /> Moderate Risk</span>
                    <span className="flex items-center gap-1"><Search size={12} /> Recent Incidents</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT AREA: Interactive Map */}
        <div className="flex-1 relative h-[50vh] lg:h-auto bg-[#0A1628]">
          {/* Map Overlay Controls */}
          <div className="absolute top-6 left-6 z-[1000] flex gap-2">
            <div className="bg-[#162032] border border-white/10 rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg">
              <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
              <span className="text-xs font-bold text-white">Live Navigation Mode</span>
            </div>
          </div>

          <MapContainer center={[24.87, 67.09]} zoom={12} zoomControl={false} className="w-full h-full z-[1]">
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            
            {showRoutes && (
              <>
                <Polyline positions={routePath} color="#22C55E" weight={6} opacity={0.8} dashArray="10, 10" />
                
                {/* Origin Marker */}
                <CircleMarker center={routePath[0]} radius={8} pathOptions={{ color: "#3B82F6", fillColor: "#3B82F6", fillOpacity: 1 }}>
                  <Tooltip permanent direction="right" offset={[10, 0]} className="bg-transparent border-none text-white font-bold shadow-none">Origin</Tooltip>
                </CircleMarker>

                {/* Destination Marker */}
                <CircleMarker center={routePath[routePath.length - 1]} radius={8} pathOptions={{ color: "#F97316", fillColor: "#F97316", fillOpacity: 1 }}>
                  <Tooltip permanent direction="right" offset={[10, 0]} className="bg-transparent border-none text-white font-bold shadow-none">Destination</Tooltip>
                </CircleMarker>
              </>
            )}
          </MapContainer>
        </div>

      </div>
    </div>
  );
}