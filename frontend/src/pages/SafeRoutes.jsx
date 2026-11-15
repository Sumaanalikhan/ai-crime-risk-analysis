import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import { Navigation, ShieldAlert, CheckCircle, Info, Layers, Map as MapIcon, Clock, Moon } from 'lucide-react';
import Navbar from '../components/Navbar';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import 'leaflet-control-geocoder';
import * as turf from '@turf/turf';

// ==========================================
// THE ROUTING ENGINE (Handles Map Search & API)
// ==========================================
function RoutingEngine({ start, end, onRoutesFound, onRouteSelected }) {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    // Initialize the OSRM Control with Geocoding Search Box
    const control = L.Routing.control({
      waypoints: [],
      routeWhileDragging: false,
      showAlternatives: true, // Asks OSRM for multiple route options
      fitSelectedRoutes: true,
      show: true, // Shows the search box panel
      geocoder: L.Control.Geocoder.nominatim(), // Adds text search
      lineOptions: {
        styles: [{ color: '#3b82f6', opacity: 0.8, weight: 6 }]
      },
      altLineOptions: {
        styles: [{ color: '#64748B', opacity: 0.6, weight: 5 }]
      }
    }).addTo(map);

    // Pass all found routes back to React for AI evaluation
    control.on('routesfound', (e) => {
      onRoutesFound(e.routes);
    });

    // Detect when the user clicks a grey alternative route on the map
    control.on('routeselected', (e) => {
      onRouteSelected(e.route);
    });

    routingControlRef.current = control;

    return () => map.removeControl(control);
  }, [map]);

  // Sync map clicks (Point A / Point B) with the Search Box
  useEffect(() => {
    if (routingControlRef.current) {
      const waypoints = [
        start ? L.latLng(start.lat, start.lng) : null,
        end ? L.latLng(end.lat, end.lng) : null
      ].filter(Boolean);
      
      if (waypoints.length > 0) {
        routingControlRef.current.setWaypoints(waypoints);
      }
    }
  }, [start, end]);

  return null;
}

// ==========================================
// MAP CLICK LISTENER
// ==========================================
function MapPinDropper({ start, end, setStart, setEnd }) {
  useMapEvents({
    click(e) {
      if (!start) setStart(e.latlng);
      else if (!end) setEnd(e.latlng);
    }
  });
  return null;
}

// ==========================================
// MAIN PAGE
// ==========================================
export default function SafeRoutes() {
  const [zones, setZones] = useState([]);
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [timeOfDay, setTimeOfDay] = useState('Day');
  
  // Raw routes from OSRM
  const [osrmRoutes, setOsrmRoutes] = useState([]);
  // Which route the user currently has selected
  const [activeRouteIndex, setActiveRouteIndex] = useState(0);

  useEffect(() => {
    const fetchHeatmapData = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/heatmap');
        const data = await res.json();
        if (data.success) setZones(data.zones);
      } catch (err) {
        console.error('Error loading AI zones:', err);
      }
    };
    fetchHeatmapData();
  }, []);

  // Filter only High Risk zones (Scores 65+)
  const dangerZones = useMemo(() => zones.filter(z => parseFloat(z.avgScore) >= 65), [zones]);

  // ==========================================
  // TURF.JS MATHEMATICAL ROUTE EVALUATION
  // ==========================================
  const evaluatedRoutes = useMemo(() => {
    if (osrmRoutes.length === 0) return [];

    // If it's night, expand the danger radius by 80% to account for less safety
    const riskRadiusKm = timeOfDay === 'Night' ? 1.8 : 1.0;

    return osrmRoutes.map((route, index) => {
      const routeLine = turf.lineString(route.coordinates.map(c => [c.lng, c.lat]));
      const warnings = [];
      let totalRiskPenalty = 0;

      dangerZones.forEach(zone => {
        const center = [parseFloat(zone.lng), parseFloat(zone.lat)];
        const zoneCircle = turf.circle(center, riskRadiusKm, { units: 'kilometers' });
        
        if (turf.booleanIntersects(routeLine, zoneCircle)) {
          warnings.push(zone);
          totalRiskPenalty += parseFloat(zone.avgScore);
        }
      });

      return {
        id: index,
        name: route.name || (index === 0 ? 'Fastest Route' : `Alternative ${index}`),
        distance: (route.summary.totalDistance / 1000).toFixed(1),
        time: Math.round(route.summary.totalTime / 60),
        warnings,
        riskScore: totalRiskPenalty,
        isSafest: false // Calculated below
      };
    });
  }, [osrmRoutes, dangerZones, timeOfDay]);

  // Determine which evaluated route is the mathematically safest
  if (evaluatedRoutes.length > 0) {
    const minRisk = Math.min(...evaluatedRoutes.map(r => r.riskScore));
    evaluatedRoutes.forEach(r => {
      if (r.riskScore === minRisk) r.isSafest = true;
    });
  }

  const activeRoute = evaluatedRoutes[activeRouteIndex];

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#0F172A] text-[#F1F5F9] flex flex-col font-sans">
      <style>{`
        /* Native Dark UI overrides for the Search Box */
        .leaflet-routing-container {
          background-color: rgba(30, 41, 59, 0.95) !important;
          color: #F1F5F9 !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          backdrop-filter: blur(10px);
          border-radius: 16px !important;
          padding: 10px !important;
        }
        .leaflet-routing-geocoders input {
          background-color: #0F172A !important;
          color: white !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 8px !important;
          padding: 8px !important;
        }
        .leaflet-routing-geocoder { border-bottom: none !important; }
        .leaflet-routing-remove-waypoint { display: none !important; }
        .leaflet-routing-alternatives-container { display: none !important; } /* We build our own UI for this */
      `}</style>

      <Navbar />

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row relative overflow-hidden">
        
        {/* Left Sidebar */}
        <div className="w-full lg:w-[450px] bg-[#1E293B] border-r border-white/10 p-6 flex flex-col gap-6 z-10 overflow-y-auto">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0F172A] border border-white/10 text-[#3b82f6] text-xs font-bold tracking-widest uppercase mb-3">
              <Navigation size={14} /> Tactical Pathfinding
            </span>
            <h1 className="text-3xl font-black text-white tracking-tight">Safe Routes</h1>
            <p className="text-[#94A3B8] text-sm mt-1">
              Search locations or click the map to generate risk-evaluated alternatives.
            </p>
          </div>

          {/* Time of Day Context */}
          <div className="bg-[#0F172A] border border-white/10 rounded-2xl p-4">
            <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-3">Context Variables</div>
            <div className="flex gap-2">
              <button 
                onClick={() => setTimeOfDay('Day')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${timeOfDay === 'Day' ? 'bg-[#3b82f6] text-white' : 'bg-[#1E293B] text-[#94A3B8] border border-white/5'}`}
              >
                <Clock size={14} /> Daytime
              </button>
              <button 
                onClick={() => setTimeOfDay('Night')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${timeOfDay === 'Night' ? 'bg-[#8b5cf6] text-white shadow-lg shadow-purple-500/20' : 'bg-[#1E293B] text-[#94A3B8] border border-white/5'}`}
              >
                <Moon size={14} /> Night Mode
              </button>
            </div>
            {timeOfDay === 'Night' && (
              <div className="mt-3 text-[10px] text-[#8b5cf6] font-bold">
                * Night Mode active: Intersection sensitivity radius increased by 80%.
              </div>
            )}
          </div>

          {/* Route Options Comparison */}
          {evaluatedRoutes.length > 0 && (
            <div className="space-y-3 fade-in">
              <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider flex items-center gap-2">
                <MapIcon size={14} /> Available Routes
              </div>
              
              <div className="flex flex-col gap-2">
                {evaluatedRoutes.map((route, idx) => (
                  <div 
                    key={idx}
                    onClick={() => setActiveRouteIndex(idx)} // In a real app, you'd trigger L.Routing to switch lines here too
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${activeRouteIndex === idx ? 'bg-[#0F172A] border-[#3b82f6] shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'bg-[#1E293B] border-white/5 hover:border-white/20'}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="font-bold text-sm text-white flex items-center gap-2">
                        {idx === 0 ? 'Fastest Route' : `Alternative ${idx}`}
                        {route.isSafest && <span className="bg-green-500/20 text-green-400 text-[9px] px-2 py-0.5 rounded-full uppercase">Safest</span>}
                      </div>
                      <div className="text-sm font-black text-white">{route.time} <span className="text-[10px] text-slate-500 font-normal">min</span></div>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">{route.distance} km</span>
                      <span className={route.warnings.length > 0 ? 'text-red-400 font-bold' : 'text-green-400 font-bold'}>
                        {route.warnings.length} Risk Zones
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Risk Breakdown for Active Route */}
          {activeRoute && (
            <div className="bg-[#0F172A] border border-white/10 rounded-2xl p-5 space-y-4 mt-auto fade-in">
              <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider flex items-center gap-2">
                <Info size={14} /> Active Route Analysis
              </div>

              {activeRoute.warnings.length > 0 ? (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <div className="flex items-center gap-2 text-red-500 font-black mb-2">
                    <ShieldAlert size={18} /> SEVERE RISK WARNING
                  </div>
                  <p className="text-xs text-red-200/80 font-medium mb-3">
                    This route intersects {activeRoute.warnings.length} high-incident zones.
                  </p>
                  <ul className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                    {activeRoute.warnings.map((r, i) => (
                      <li key={i} className="bg-red-500/20 px-3 py-2 rounded-lg text-xs border border-red-500/20">
                        <div className="font-bold text-red-400">{r.name}, {r.town}</div>
                        <div className="text-red-300/80">Primary Threat: {r.type}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                  <div className="flex items-center gap-2 text-green-500 font-black mb-2">
                    <CheckCircle size={18} /> ROUTE CLEARED
                  </div>
                  <p className="text-xs text-green-200/80 font-medium">
                    This path safely bypasses all current AI warning zones based on {timeOfDay.toLowerCase()} thresholds.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Map Canvas */}
        <div className="flex-1 min-h-[500px] relative">
          <MapContainer center={[24.89, 67.07]} zoom={12} zoomControl={true} className="w-full h-full z-[1]">
            {/* Native Dark Map - NO CSS INVERT MEANS NO LAG! */}
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; Esri'
              maxZoom={19}
            />

            {/* Dynamic Danger Radius based on Time of Day */}
            {dangerZones.map((zone, i) => (
              <CircleMarker
                key={`danger-${i}`}
                center={[parseFloat(zone.lat), parseFloat(zone.lng)]}
                radius={timeOfDay === 'Night' ? 35 : 20} 
                pathOptions={{ color: '#ef4444', weight: 1, fillColor: '#ef4444', fillOpacity: timeOfDay === 'Night' ? 0.25 : 0.15 }}
              />
            ))}

            {/* Listeners & Engines */}
            <MapPinDropper start={start} end={end} setStart={setStart} setEnd={setEnd} />
            <RoutingEngine 
              start={start} 
              end={end} 
              onRoutesFound={(routes) => setOsrmRoutes(routes)} 
              onRouteSelected={(route) => {
                const foundIndex = osrmRoutes.findIndex(r => r.name === route.name);
                if (foundIndex !== -1) setActiveRouteIndex(foundIndex);
              }} 
            />
          </MapContainer>
        </div>
      </div>
    </div>
  );
}