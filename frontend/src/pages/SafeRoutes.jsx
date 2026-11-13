import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import { Navigation, MapPin, ShieldAlert, CheckCircle, Info, Layers } from 'lucide-react';
import Navbar from '../components/Navbar';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import * as turf from '@turf/turf';

// Custom icons for Start and End points
const startIcon = L.divIcon({
  className: 'custom-icon',
  html: `<div style="background-color: #22c55e; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const endIcon = L.divIcon({
  className: 'custom-icon',
  html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

// Routing & Spatial Intersection Component
function RoutingEngine({ start, end, zones, onRouteCalculated }) {
  const map = useMap();

  useEffect(() => {
    if (!start || !end) return;

    // 1. Initialize OSRM Street Routing
    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(start.lat, start.lng),
        L.latLng(end.lat, end.lng)
      ],
      routeWhileDragging: false,
      show: false, // Hides the default OSRM turn-by-turn text box
      addWaypoints: false,
      lineOptions: {
        styles: [{ color: '#3b82f6', opacity: 0.8, weight: 6 }] // Blue safe route
      }
    }).addTo(map);

    // 2. Intercept the route once calculated to check for risk
    routingControl.on('routesfound', function (e) {
      const route = e.routes[0];
      const routeCoords = route.coordinates.map(c => [c.lng, c.lat]);
      
      // Convert OSRM route into a Turf.js LineString
      const routeLine = turf.lineString(routeCoords);
      const warnings = [];

      // Mathematically check intersection against High-Risk zones (Score 65+)
      zones.forEach(zone => {
        if (parseFloat(zone.avgScore) >= 65) {
          const center = [parseFloat(zone.lng), parseFloat(zone.lat)];
          // Assuming a 1.5km radius for the high-risk block's influence
          const zoneCircle = turf.circle(center, 1.5, { units: 'kilometers' });
          
          if (turf.booleanIntersects(routeLine, zoneCircle)) {
            warnings.push(zone);
          }
        }
      });

      // Update UI with distance, time, and risks
      onRouteCalculated({
        distance: (route.summary.totalDistance / 1000).toFixed(1), // km
        time: Math.round(route.summary.totalTime / 60), // minutes
        risks: warnings
      });

      // Turn route line red if dangerous
      if (warnings.length > 0) {
        routingControl.getRouter().options.lineOptions = {
          styles: [{ color: '#ef4444', opacity: 0.9, weight: 6 }]
        };
      }
    });

    return () => map.removeControl(routingControl);
  }, [start, end, map, zones, onRouteCalculated]);

  return null;
}

// Click handler to drop A and B pins
function MapPinDropper({ start, end, setStart, setEnd, resetRoute }) {
  useMapEvents({
    click(e) {
      if (!start) {
        setStart(e.latlng);
      } else if (!end) {
        setEnd(e.latlng);
      } else {
        // Reset if both pins are already placed
        resetRoute();
        setStart(e.latlng);
      }
    }
  });
  return null;
}

export default function SafeRoutes() {
  const [zones, setZones] = useState([]);
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);

  useEffect(() => {
    // Fetch AI zones for intersection checking
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

  const resetRoute = () => {
    setStart(null);
    setEnd(null);
    setRouteInfo(null);
  };

  // Filter only high-risk zones to display as obstacles on the map
  const dangerZones = zones.filter(z => parseFloat(z.avgScore) >= 65);

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#0F172A] text-[#F1F5F9] flex flex-col font-sans">
      <style>{`
        .leaflet-container { background: #1b1f27; }
        .cg-tiles { filter: invert(1) hue-rotate(180deg) brightness(.82) contrast(.92) saturate(.45); }
        .leaflet-routing-container { display: none !important; } 
      `}</style>

      <Navbar />

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row relative overflow-hidden">
        
        {/* Left Sidebar */}
        <div className="w-full lg:w-96 bg-[#1E293B] border-r border-white/10 p-6 flex flex-col gap-6 z-10 overflow-y-auto">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0F172A] border border-white/10 text-[#3b82f6] text-xs font-bold tracking-widest uppercase mb-3">
              <Navigation size={14} /> Tactical Pathfinding
            </span>
            <h1 className="text-3xl font-black text-white tracking-tight">Safe Routes</h1>
            <p className="text-[#94A3B8] text-sm mt-1">
              Real-time route intersection checking against high-risk crime districts.
            </p>
          </div>

          <div className="bg-[#0F172A] border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">
              Route Coordinates
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/50 text-green-500">
                <MapPin size={16} />
              </div>
              <div className="flex-1">
                <div className="text-xs text-slate-500 font-bold uppercase">Departure (Point A)</div>
                <div className="text-sm font-semibold text-white">
                  {start ? `${start.lat.toFixed(4)}, ${start.lng.toFixed(4)}` : 'Click map to set start'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/50 text-blue-500">
                <MapPin size={16} />
              </div>
              <div className="flex-1">
                <div className="text-xs text-slate-500 font-bold uppercase">Destination (Point B)</div>
                <div className="text-sm font-semibold text-white">
                  {end ? `${end.lat.toFixed(4)}, ${end.lng.toFixed(4)}` : 'Click map to set destination'}
                </div>
              </div>
            </div>

            {start && end && (
              <button 
                onClick={resetRoute}
                className="w-full mt-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border border-white/5"
              >
                Clear Route
              </button>
            )}
          </div>

          {/* Route Analysis Results */}
          {routeInfo && (
            <div className="bg-[#0F172A] border border-white/10 rounded-2xl p-5 space-y-4 fade-in">
              <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider flex items-center gap-2">
                <Info size={14} /> AI Trip Analysis
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#1E293B] p-3 rounded-xl border border-white/5 text-center">
                  <div className="text-xl font-black text-white">{routeInfo.time} <span className="text-sm text-slate-500">min</span></div>
                  <div className="text-[10px] text-[#64748B] uppercase font-bold">Est. Travel Time</div>
                </div>
                <div className="bg-[#1E293B] p-3 rounded-xl border border-white/5 text-center">
                  <div className="text-xl font-black text-white">{routeInfo.distance} <span className="text-sm text-slate-500">km</span></div>
                  <div className="text-[10px] text-[#64748B] uppercase font-bold">Total Distance</div>
                </div>
              </div>

              {routeInfo.risks.length > 0 ? (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <div className="flex items-center gap-2 text-red-500 font-black mb-2">
                    <ShieldAlert size={18} /> SEVERE RISK WARNING
                  </div>
                  <p className="text-xs text-red-200/80 font-medium mb-3">
                    This route physically intersects with {routeInfo.risks.length} known high-incident crime zones.
                  </p>
                  <ul className="space-y-2">
                    {routeInfo.risks.map((r, i) => (
                      <li key={i} className="bg-red-500/20 px-3 py-2 rounded-lg text-xs border border-red-500/20">
                        <div className="font-bold text-red-400">{r.name}, {r.town}</div>
                        <div className="text-red-300/80">Primary Threat: {r.type}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                  <div className="flex items-center gap-2 text-green-500 font-black mb-2">
                    <CheckCircle size={18} /> ROUTE CLEARED
                  </div>
                  <p className="text-xs text-green-200/80 font-medium">
                    This path does not intersect with any current high-risk AI warning zones. Exercise standard caution.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Map Canvas */}
        <div className="flex-1 min-h-[500px] relative">
          <MapContainer center={[24.89, 67.07]} zoom={12} zoomControl={true} className="w-full h-full z-[1]">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap'
              className="cg-tiles"
              maxZoom={19}
            />

            {/* Render Danger Zones as visual obstacles */}
            {dangerZones.map((zone, i) => (
              <CircleMarker
                key={`danger-${i}`}
                center={[parseFloat(zone.lat), parseFloat(zone.lng)]}
                radius={25}
                pathOptions={{ color: 'transparent', fillColor: '#ef4444', fillOpacity: 0.15 }}
              >
                <Tooltip direction="top">High Risk Zone: {zone.name}</Tooltip>
              </CircleMarker>
            ))}

            {/* Start and End Markers */}
            {start && <Marker position={start} icon={startIcon} />}
            {end && <Marker position={end} icon={endIcon} />}

            {/* The Engine */}
            <MapPinDropper start={start} end={end} setStart={setStart} setEnd={setEnd} resetRoute={resetRoute} />
            <RoutingEngine start={start} end={end} zones={zones} onRouteCalculated={setRouteInfo} />
            
          </MapContainer>

          {!start && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] rounded-full bg-[#0F172A]/90 border border-green-500/50 px-6 py-3 text-sm font-bold text-green-400 backdrop-blur pointer-events-none shadow-[0_0_15px_rgba(34,197,94,0.3)] animate-pulse">
              1. Click anywhere to set Departure Point
            </div>
          )}
          {start && !end && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] rounded-full bg-[#0F172A]/90 border border-blue-500/50 px-6 py-3 text-sm font-bold text-blue-400 backdrop-blur pointer-events-none shadow-[0_0_15px_rgba(59,130,246,0.3)] animate-pulse">
              2. Click anywhere to set Destination
            </div>
          )}
        </div>
      </div>
    </div>
  );
}