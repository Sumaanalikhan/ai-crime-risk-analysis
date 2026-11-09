import { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip } from 'react-leaflet';
import { MapPin, Navigation, ShieldAlert, Clock, AlertTriangle, Route as RouteIcon, CheckCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import 'leaflet/dist/leaflet.css';

export default function SafeRoutes() {
  const [startPoint, setStartPoint] = useState('');
  const [endPoint, setEndPoint] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [routeResult, setRouteResult] = useState(null);

  const handleCalculate = (e) => {
    e.preventDefault();
    if (!startPoint || !endPoint) return;

    setIsCalculating(true);
    setRouteResult(null);

    // Simulate AI route calculation delay
    setTimeout(() => {
      setRouteResult({
        status: 'Safe Route Found',
        time: '32 mins',
        distance: '14.5 km',
        risk: 'Low Risk',
        advice: 'Bypassing Saddar high-risk zone. Proceeding via Shahrah-e-Faisal. Keep doors locked at traffic signals.'
      });
      setIsCalculating(false);
    }, 1500);
  };

  // Mock Map Data for the UI demonstration
  const dangerZones = [
    { center: [24.8607, 67.0011], radius: 30, name: "Saddar / Lyari (Avoid)" },
    { center: [24.8900, 67.0200], radius: 25, name: "Guru Mandir (Avoid)" }
  ];

  // A simulated route line from DHA to Tariq Road bypassing the red zones
  const safePathCoords = [
    [24.7950, 67.0322], // Start: DHA
    [24.8200, 67.0450],
    [24.8450, 67.0550], // Bypassing east of the danger zones
    [24.8600, 67.0700],
    [24.8716, 67.0599]  // End: Tariq Road
  ];

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F1F5F9] flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden">
        
        {/* Left Sidebar: Route Input & Results */}
        <div className="w-full lg:w-[450px] bg-[#1E293B] border-r border-white/10 p-6 md:p-8 flex flex-col z-10 overflow-y-auto shadow-2xl">
          
          <div className="mb-8">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0F172A] border border-white/10 text-[#F97316] text-xs font-bold tracking-widest uppercase mb-4">
              <Navigation size={14} /> AI Navigation
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">Safe Routes</h1>
            <p className="text-[#94A3B8] text-sm leading-relaxed">
              Calculate travel routes that actively steer clear of high-incident areas across Karachi to ensure safe transit.
            </p>
          </div>

          {/* Input Form */}
          <form onSubmit={handleCalculate} className="space-y-4 mb-8">
            <div className="relative">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white"></div>
              <input 
                type="text" 
                placeholder="Start Location (e.g., DHA Phase 6)"
                value={startPoint}
                onChange={(e) => setStartPoint(e.target.value)}
                className="w-full bg-[#0F172A] border border-white/10 rounded-xl py-4 pl-14 pr-4 text-white focus:outline-none focus:border-[#F97316] text-sm transition-colors"
                required
              />
            </div>
            
            <div className="flex justify-start pl-7 -my-2">
              <div className="w-0.5 h-6 bg-white/10"></div>
            </div>

            <div className="relative">
              <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-[#F97316]" size={18} />
              <input 
                type="text" 
                placeholder="Destination (e.g., Tariq Road)"
                value={endPoint}
                onChange={(e) => setEndPoint(e.target.value)}
                className="w-full bg-[#0F172A] border border-white/10 rounded-xl py-4 pl-14 pr-4 text-white focus:outline-none focus:border-[#F97316] text-sm transition-colors"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={isCalculating}
              className="w-full mt-4 bg-[#F97316] hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
            >
              {isCalculating ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <RouteIcon size={18} /> Calculate Safe Route
                </>
              )}
            </button>
          </form>

          {/* Results Panel */}
          {routeResult && (
            <div className="bg-[#0F172A] border border-green-500/30 rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="text-green-500" size={24} />
                <h3 className="text-xl font-black text-white tracking-tight">{routeResult.status}</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="bg-[#1E293B] border border-white/5 rounded-xl p-3 flex items-center gap-3">
                  <Clock size={18} className="text-[#94A3B8]" />
                  <div>
                    <div className="text-xs text-[#64748B] font-bold uppercase tracking-wider">Est. Time</div>
                    <div className="text-white font-bold">{routeResult.time}</div>
                  </div>
                </div>
                <div className="bg-[#1E293B] border border-white/5 rounded-xl p-3 flex items-center gap-3">
                  <RouteIcon size={18} className="text-[#94A3B8]" />
                  <div>
                    <div className="text-xs text-[#64748B] font-bold uppercase tracking-wider">Distance</div>
                    <div className="text-white font-bold">{routeResult.distance}</div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
                <ShieldAlert className="text-blue-500 shrink-0" size={20} />
                <p className="text-sm text-blue-100/80 leading-relaxed">
                  {routeResult.advice}
                </p>
              </div>

              <button className="w-full mt-4 bg-[#1E293B] hover:bg-white/5 border border-white/10 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
                <Navigation size={16} /> Start Navigation
              </button>
            </div>
          )}

        </div>

        {/* Right Map Canvas */}
        <div className="flex-1 h-[500px] lg:h-auto min-h-[500px] relative">
          <MapContainer center={[24.84, 67.04]} zoom={12} zoomControl={true} className="w-full h-full z-[1]">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            
            {/* Render Danger Zones */}
            {dangerZones.map((zone, idx) => (
              <CircleMarker
                key={idx}
                center={zone.center}
                radius={zone.radius}
                pathOptions={{ color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.25, weight: 2 }}
              >
                <Tooltip direction="top" opacity={1}>
                  <span className="font-bold text-slate-900">{zone.name}</span>
                </Tooltip>
              </CircleMarker>
            ))}

            {/* Render the Safe Path Line if a calculation has been made */}
            {routeResult && (
              <>
                <Polyline 
                  positions={safePathCoords} 
                  pathOptions={{ color: '#F97316', weight: 5, dashArray: '10, 10', opacity: 0.8 }} 
                  className="animate-pulse"
                />
                
                {/* Start & End Map Markers */}
                <CircleMarker center={safePathCoords[0]} radius={8} pathOptions={{ color: '#FFF', fillColor: '#3B82F6', fillOpacity: 1, weight: 2 }}>
                  <Tooltip permanent direction="right" className="bg-transparent border-none shadow-none text-white font-bold drop-shadow-md">Start</Tooltip>
                </CircleMarker>
                <CircleMarker center={safePathCoords[safePathCoords.length - 1]} radius={8} pathOptions={{ color: '#FFF', fillColor: '#22C55E', fillOpacity: 1, weight: 2 }}>
                  <Tooltip permanent direction="right" className="bg-transparent border-none shadow-none text-white font-bold drop-shadow-md">Destination</Tooltip>
                </CircleMarker>
              </>
            )}
          </MapContainer>
        </div>

      </div>
    </div>
  );
}