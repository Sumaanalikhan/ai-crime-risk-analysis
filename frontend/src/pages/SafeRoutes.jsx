import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Polyline, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import { Navigation, ShieldAlert, CheckCircle, Info, Map as MapIcon, Clock, Moon, Sun, Search, RotateCcw } from 'lucide-react';
import Navbar from '../components/Navbar';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import * as turf from '@turf/turf';

const startIcon = L.divIcon({
  className: 'custom-icon',
  html: `<div style="background-color: #22c55e; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 12px #22c55e;"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const endIcon = L.divIcon({
  className: 'custom-icon',
  html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 12px #3b82f6;"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

// ==========================================
// HEADLESS OSRM ENGINE (Fetches Raw Routes)
// ==========================================
function RoutingEngine({ start, end, viaWaypoint, onRoutesFound }) {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    const control = L.Routing.control({
      waypoints: [],
      routeWhileDragging: false,
      showAlternatives: true,
      fitSelectedRoutes: false,
      show: false,
      createMarker: () => null,
      lineOptions: { styles: [{ opacity: 0, weight: 0 }] }, // We render custom interactive Polylines
      altLineOptions: { styles: [{ opacity: 0, weight: 0 }] }
    }).addTo(map);

    control.on('routesfound', (e) => {
      onRoutesFound(e.routes, Boolean(viaWaypoint));
      if (e.routes[0]?.coordinates?.length) {
        const bounds = L.latLngBounds(e.routes[0].coordinates);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    });

    routingControlRef.current = control;
    return () => map.removeControl(control);
  }, [map, onRoutesFound, viaWaypoint]);

  useEffect(() => {
    if (!routingControlRef.current) return;
    if (start && end) {
      const pts = viaWaypoint
        ? [L.latLng(start.lat, start.lng), L.latLng(viaWaypoint.lat, viaWaypoint.lng), L.latLng(end.lat, end.lng)]
        : [L.latLng(start.lat, start.lng), L.latLng(end.lat, end.lng)];
      routingControlRef.current.setWaypoints(pts);
    } else {
      routingControlRef.current.setWaypoints([]);
    }
  }, [start, end, viaWaypoint]);

  return null;
}

// ==========================================
// MAP CLICK LISTENER
// ==========================================
function MapPinDropper({ start, end, setStart, setEnd, setStartText, setEndText, resetRoute }) {
  useMapEvents({
    click(e) {
      if (!start) {
        setStart(e.latlng);
        setStartText(`${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`);
      } else if (!end) {
        setEnd(e.latlng);
        setEndText(`${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`);
      } else {
        resetRoute();
        setStart(e.latlng);
        setStartText(`${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`);
      }
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
  const [startText, setStartText] = useState('');
  const [endText, setEndText] = useState('');
  const [searching, setSearching] = useState(false);

  // Map theme toggle (Default: Light)
  const [mapTheme, setMapTheme] = useState('light');
  const [timeOfDay, setTimeOfDay] = useState('Day');
  const [riskTolerance, setRiskTolerance] = useState('Medium'); // Low (Strict), Medium (Balanced), High (Relaxed)

  const [baseRoutes, setBaseRoutes] = useState([]);
  const [detourRoutes, setDetourRoutes] = useState([]);
  const [viaWaypoint, setViaWaypoint] = useState(null);
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

  // Build misspell-proof dropdown options from your 210 Karachi zones
  const locationOptions = useMemo(() => {
    return zones
      .map((z) => ({
        label: `${z.name} (${z.town})`,
        name: z.name,
        lat: parseFloat(z.lat),
        lng: parseFloat(z.lng),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [zones]);

  // Resolve input text either from the 210-area dataset or Nominatim fallback
  const resolveLocation = async (query) => {
    const clean = query.trim().toLowerCase();
    const exactMatch = locationOptions.find(
      (opt) => opt.label.toLowerCase() === clean || opt.name.toLowerCase() === clean
    );
    if (exactMatch) {
      return { lat: exactMatch.lat, lng: exactMatch.lng };
    }

    const partialMatch = locationOptions.find((opt) => opt.label.toLowerCase().includes(clean));
    if (partialMatch && clean.length >= 4) {
      return { lat: partialMatch.lat, lng: partialMatch.lng };
    }

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Karachi')}&limit=1`
    );
    const data = await res.json();
    if (data[0]) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    return null;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!startText.trim() || !endText.trim()) return;
    setSearching(true);
    setViaWaypoint(null);
    setDetourRoutes([]);
    try {
      const [locA, locB] = await Promise.all([resolveLocation(startText), resolveLocation(endText)]);
      if (locA && locB) {
        setStart(locA);
        setEnd(locB);
        setActiveRouteIndex(0);
      } else {
        alert('Location not found. Select an area from the dropdown suggestions.');
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    } finally {
      setSearching(false);
    }
  };

  const resetRoute = () => {
    setStart(null);
    setEnd(null);
    setStartText('');
    setEndText('');
    setBaseRoutes([]);
    setDetourRoutes([]);
    setViaWaypoint(null);
    setActiveRouteIndex(0);
  };

  // Risk threshold based on sensitivity
  const dangerThreshold = riskTolerance === 'Low' ? 60 : riskTolerance === 'Medium' ? 70 : 80;
  const dangerZones = useMemo(
    () => zones.filter((z) => parseFloat(z.avgScore) >= dangerThreshold),
    [zones, dangerThreshold]
  );

  // Store OSRM responses
  const handleRoutesFound = useCallback((routes, isDetour) => {
    if (isDetour) {
      setDetourRoutes(routes);
    } else {
      setBaseRoutes(routes);
    }
  }, []);

  // Automatically calculate a physical detour waypoint when Strict mode detects an intersection
  useEffect(() => {
    if (baseRoutes.length === 0 || !start || !end) return;

    if (riskTolerance !== 'Low') {
      setViaWaypoint(null);
      setDetourRoutes([]);
      return;
    }

    const primary = baseRoutes[0];
    const line = turf.lineString(primary.coordinates.map((c) => [c.lng, c.lat]));
    const radiusKm = timeOfDay === 'Night' ? 1.8 : 1.1;

    const hitZone = dangerZones.find((z) => {
      const circle = turf.circle([parseFloat(z.lng), parseFloat(z.lat)], radiusKm, { units: 'kilometers' });
      return turf.booleanIntersects(line, circle);
    });

    if (hitZone) {
      // Push a detour waypoint 2.5km perpendicular to the start->end bearing to route around the hotspot
      const bearing = turf.bearing(turf.point([start.lng, start.lat]), turf.point([end.lng, end.lat]));
      const detourPoint = turf.destination(
        turf.point([parseFloat(hitZone.lng), parseFloat(hitZone.lat)]),
        2.5,
        bearing + 90,
        { units: 'kilometers' }
      );
      const [dLng, dLat] = detourPoint.geometry.coordinates;
      setViaWaypoint({ lat: dLat, lng: dLng });
    }
  }, [baseRoutes, riskTolerance, dangerZones, timeOfDay, start, end]);

  // Combine direct OSRM routes + any generated safe detour route
  const allRawRoutes = useMemo(() => {
    const combined = [...baseRoutes];
    if (detourRoutes.length > 0) {
      combined.push({ ...detourRoutes[0], isDetour: true });
    }
    return combined;
  }, [baseRoutes, detourRoutes]);

  // Evaluate every route with Turf.js
  const evaluatedRoutes = useMemo(() => {
    if (allRawRoutes.length === 0) return [];
    const riskRadiusKm = timeOfDay === 'Night' ? 1.8 : 1.0;

    const scored = allRawRoutes.map((route, index) => {
      const coords = route.coordinates.map((c) => [c.lat, c.lng]);
      const routeLine = turf.lineString(route.coordinates.map((c) => [c.lng, c.lat]));
      const warnings = [];
      let totalRiskPenalty = 0;

      dangerZones.forEach((zone) => {
        const center = [parseFloat(zone.lng), parseFloat(zone.lat)];
        const zoneCircle = turf.circle(center, riskRadiusKm, { units: 'kilometers' });
        if (turf.booleanIntersects(routeLine, zoneCircle)) {
          warnings.push(zone);
          totalRiskPenalty += parseFloat(zone.avgScore);
        }
      });

      let label = index === 0 ? 'Direct / Fastest Path' : `Alternative Path ${index}`;
      if (route.isDetour) label = 'Safe Detour (Avoids Hotspots)';

      return {
        id: index,
        label,
        coords,
        distance: (route.summary.totalDistance / 1000).toFixed(1),
        time: Math.round(route.summary.totalTime / 60),
        warnings,
        riskScore: totalRiskPenalty,
        isSafest: false,
      };
    });

    const minRisk = Math.min(...scored.map((r) => r.riskScore));
    scored.forEach((r) => {
      if (r.riskScore === minRisk) r.isSafest = true;
    });

    return scored;
  }, [allRawRoutes, dangerZones, timeOfDay]);

  // Auto-select the safest route when Strict mode is active
  useEffect(() => {
    if (evaluatedRoutes.length === 0) return;
    if (riskTolerance === 'Low') {
      const safestIdx = evaluatedRoutes.findIndex((r) => r.isSafest);
      if (safestIdx !== -1) setActiveRouteIndex(safestIdx);
    } else if (riskTolerance === 'High') {
      setActiveRouteIndex(0); // Fastest route
    }
  }, [riskTolerance, evaluatedRoutes]);

  const activeRoute = evaluatedRoutes[activeRouteIndex] || evaluatedRoutes[0];

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#0F172A] text-[#F1F5F9] flex flex-col font-sans">
      <style>{`
        .leaflet-routing-container { display: none !important; }
      `}</style>

      <Navbar />

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row relative overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-full lg:w-[440px] bg-[#1E293B] border-r border-white/10 p-6 flex flex-col gap-5 z-10 overflow-y-auto">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0F172A] border border-white/10 text-[#3b82f6] text-xs font-bold tracking-widest uppercase mb-3">
              <Navigation size={14} /> Tactical Pathfinding
            </span>
            <h1 className="text-3xl font-black text-white tracking-tight">Safe Routes</h1>
            <p className="text-[#94A3B8] text-sm mt-1">
              Select Karachi neighborhoods from the dropdown or click the map to compare paths.
            </p>
          </div>

          {/* Search Form with Autocomplete Datalist */}
          <form onSubmit={handleSearch} className="bg-[#0F172A] border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Select Karachi Areas</div>

            <datalist id="karachi-areas">
              {locationOptions.map((opt, idx) => (
                <option key={idx} value={opt.label} />
              ))}
            </datalist>

            <input
              type="text"
              list="karachi-areas"
              placeholder="Departure (Start typing e.g. Landhi...)"
              value={startText}
              onChange={(e) => setStartText(e.target.value)}
              className="w-full bg-[#1E293B] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-green-500"
            />
            <input
              type="text"
              list="karachi-areas"
              placeholder="Destination (Start typing e.g. DHA...)"
              value={endText}
              onChange={(e) => setEndText(e.target.value)}
              className="w-full bg-[#1E293B] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={searching}
                className="flex-1 bg-[#3b82f6] hover:bg-blue-600 text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
              >
                <Search size={14} /> {searching ? 'Calculating...' : 'Generate Routes'}
              </button>
              {(start || end) && (
                <button
                  type="button"
                  onClick={resetRoute}
                  className="px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-white/10"
                  title="Clear Route"
                >
                  <RotateCcw size={15} />
                </button>
              )}
            </div>
          </form>

          {/* Time & Risk Tolerance Controls */}
          <div className="bg-[#0F172A] border border-white/10 rounded-2xl p-4 space-y-4">
            <div>
              <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Time of Travel</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTimeOfDay('Day')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                    timeOfDay === 'Day' ? 'bg-[#3b82f6] text-white' : 'bg-[#1E293B] text-[#94A3B8] border border-white/5'
                  }`}
                >
                  <Clock size={14} /> Daytime
                </button>
                <button
                  type="button"
                  onClick={() => setTimeOfDay('Night')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                    timeOfDay === 'Night'
                      ? 'bg-[#8b5cf6] text-white shadow-lg shadow-purple-500/20'
                      : 'bg-[#1E293B] text-[#94A3B8] border border-white/5'
                  }`}
                >
                  <Moon size={14} /> Night (+80% Radius)
                </button>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Risk Tolerance Mode</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'Low', title: 'Strict (60+)', sub: 'Auto-Detour' },
                  { key: 'Medium', title: 'Balanced (70+)', sub: 'Standard' },
                  { key: 'High', title: 'Relaxed (80+)', sub: 'Fastest' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setRiskTolerance(item.key)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center ${
                      riskTolerance === item.key
                        ? 'bg-[#F97316] text-white shadow-lg shadow-orange-500/20'
                        : 'bg-[#1E293B] text-[#94A3B8] border border-white/5 hover:text-white'
                    }`}
                  >
                    <span>{item.title}</span>
                    <span className="text-[9px] opacity-80 font-normal">{item.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Alternative Routes Comparison */}
          {evaluatedRoutes.length > 0 && (
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider flex items-center gap-2">
                <MapIcon size={14} /> Click to Switch Route ({evaluatedRoutes.length})
              </div>
              {evaluatedRoutes.map((route, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveRouteIndex(idx)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    activeRouteIndex === idx
                      ? 'bg-[#0F172A] border-[#3b82f6] shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                      : 'bg-[#1E293B] border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <div className="font-bold text-sm text-white flex items-center gap-2">
                      {route.label}
                      {route.isSafest && (
                        <span className="bg-green-500/20 text-green-400 text-[9px] px-2 py-0.5 rounded-full uppercase">
                          Safest
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-black text-white">
                      {route.time} <span className="text-[10px] text-slate-500 font-normal">min</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">{route.distance} km</span>
                    <span className={route.warnings.length > 0 ? 'text-red-400 font-bold' : 'text-green-400 font-bold'}>
                      {route.warnings.length} Hotspots Crossed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Active Route Risk Breakdown */}
          {activeRoute && (
            <div className="bg-[#0F172A] border border-white/10 rounded-2xl p-4 space-y-3 mt-auto">
              <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider flex items-center gap-2">
                <Info size={14} /> Active Path Breakdown
              </div>

              {activeRoute.warnings.length > 0 ? (
                <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <div className="flex items-center gap-2 text-red-500 font-black text-sm mb-1.5">
                    <ShieldAlert size={16} /> INTERSECTS {activeRoute.warnings.length} RISK ZONES
                  </div>
                  <ul className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {activeRoute.warnings.map((r, i) => (
                      <li key={i} className="bg-red-500/20 px-3 py-1.5 rounded-lg text-xs border border-red-500/20">
                        <div className="font-bold text-red-400">{r.name}, {r.town}</div>
                        <div className="text-red-300/80 text-[11px]">Threat: {r.type} (Score: {r.avgScore})</div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="p-3.5 bg-green-500/10 border border-green-500/30 rounded-xl">
                  <div className="flex items-center gap-2 text-green-500 font-black text-sm mb-1">
                    <CheckCircle size={16} /> ROUTE CLEARED
                  </div>
                  <p className="text-xs text-green-200/80">
                    Bypasses all {dangerThreshold}+ risk zones under {timeOfDay.toLowerCase()} conditions.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Map Canvas */}
        <div className="flex-1 min-h-[500px] relative">
          {/* Floating Light / Dark Map Toggle Button */}
          <div className="absolute top-4 right-4 z-[1000] flex bg-[#0F172A]/90 backdrop-blur border border-white/15 rounded-full p-1 shadow-xl">
            <button
              type="button"
              onClick={() => setMapTheme('light')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                mapTheme === 'light' ? 'bg-white text-slate-900 shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Sun size={13} /> Light
            </button>
            <button
              type="button"
              onClick={() => setMapTheme('dark')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                mapTheme === 'dark' ? 'bg-[#3b82f6] text-white shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Moon size={13} /> Dark
            </button>
          </div>

          <MapContainer center={[24.89, 67.07]} zoom={12} zoomControl={true} className="w-full h-full z-[1]">
            {mapTheme === 'light' ? (
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
                maxZoom={19}
              />
            ) : (
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                attribution='&copy; Esri'
                maxZoom={19}
              />
            )}

            {/* Danger Zones */}
            {dangerZones.map((zone, i) => (
              <CircleMarker
                key={`danger-${i}`}
                center={[parseFloat(zone.lat), parseFloat(zone.lng)]}
                radius={timeOfDay === 'Night' ? 32 : 18}
                pathOptions={{
                  color: '#ef4444',
                  weight: 1,
                  fillColor: '#ef4444',
                  fillOpacity: timeOfDay === 'Night' ? 0.25 : 0.16,
                }}
              >
                <Tooltip direction="top">
                  {zone.name} (Risk: {zone.avgScore})
                </Tooltip>
              </CircleMarker>
            ))}

            {/* Render All Routes (Inactive in grey, Active highlighted in green/blue/red) */}
            {evaluatedRoutes.map((route, idx) => {
              const isSelected = idx === activeRouteIndex;
              if (isSelected) return null; // Render selected route on top below
              return (
                <Polyline
                  key={`alt-route-${idx}`}
                  positions={route.coords}
                  pathOptions={{ color: '#64748B', weight: 5, opacity: 0.55, dashArray: '8, 8' }}
                  eventHandlers={{ click: () => setActiveRouteIndex(idx) }}
                />
              );
            })}

            {activeRoute && (
              <Polyline
                key={`active-route-${activeRouteIndex}-${activeRoute.warnings.length}`}
                positions={activeRoute.coords}
                pathOptions={{
                  color: activeRoute.warnings.length > 0 ? '#ef4444' : '#22c55e',
                  weight: 7,
                  opacity: 0.95,
                }}
              />
            )}

            {start && <Marker position={start} icon={startIcon} />}
            {end && <Marker position={end} icon={endIcon} />}

            <MapPinDropper
              start={start}
              end={end}
              setStart={setStart}
              setEnd={setEnd}
              setStartText={setStartText}
              setEndText={setEndText}
              resetRoute={resetRoute}
            />
            <RoutingEngine start={start} end={end} viaWaypoint={viaWaypoint} onRoutesFound={handleRoutesFound} />
          </MapContainer>
        </div>
      </div>
    </div>
  );
}