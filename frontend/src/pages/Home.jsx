import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import { ArrowRight, Cpu, Map as MapIcon, Bell, Users, Activity, MapPin, Shield, Navigation } from 'lucide-react';
import Navbar from '../components/Navbar';
import 'leaflet/dist/leaflet.css';

export default function Home() {
  const navigate = useNavigate();

  const handleHeroZoneClick = (name, lat, lng) => {
    sessionStorage.setItem(
      'cg_pending_heatmap',
      JSON.stringify({ name, lat, lng })
    );
    navigate('/heatmap');
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F1F5F9] flex flex-col overflow-x-hidden">
      <Navbar />

      {/* 1. HERO SECTION */}
      <section className="max-w-7xl mx-auto px-6 w-full py-16 md:py-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Column: Hero Content */}
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <span className="border border-[#F97316]/30 bg-[#F97316]/10 text-[#F97316] px-4 py-1.5 rounded-full tracking-wider text-xs font-semibold mb-4 block w-fit">
            LIVE CRIME RISK DATA • KARACHI
          </span>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight text-white">
            Stay Safe <br className="hidden lg:block" /> in <span className="text-[#F97316]">Karachi</span>
          </h1>

          <p className="text-gray-300 md:text-lg mb-8 max-w-xl">
            Real-time crime risk awareness and intelligent safe navigation powered by AI. Know before you go — check any area in seconds.
          </p>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
            <button
              onClick={() => navigate('/routes')}
              className="px-6 py-3 bg-[#3b82f6] hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md transition-all duration-200 ease-in-out transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              <Navigation size={18} /> Plan Safe Route
            </button>
            <button
              onClick={() => navigate('/predict')}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-md transition-all duration-200 ease-in-out transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              Try Risk Predictor <ArrowRight size={18} />
            </button>
            <button
              onClick={() => navigate('/heatmap')}
              className="px-6 py-3 border-2 border-gray-500 hover:border-white text-gray-300 hover:text-white font-medium rounded-lg bg-transparent transition-all duration-200 ease-in-out"
            >
              Explore Heatmap
            </button>
          </div>
        </div>

        {/* Right Column: Interactive Map Component */}
        <div className="w-full h-[400px] lg:h-[550px] relative bg-[#0A1628] rounded-xl border border-gray-800 shadow-2xl overflow-hidden">
          <div className="absolute top-4 left-4 z-[1000] bg-[#162032] border border-white/10 rounded-lg px-3 py-2 flex items-center gap-2 shadow-lg">
            <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E] animate-pulse" />
            <span className="text-sm font-bold text-white">Karachi Crime Heatmap</span>
          </div>

          <div className="absolute top-4 right-4 z-[1000] flex gap-2">
            {['High', 'Med', 'Low'].map((level) => (
              <div
                key={level}
                className={`bg-[#162032] border border-white/10 rounded-md px-3 py-1.5 text-xs font-bold shadow-lg ${
                  level === 'High' ? 'text-[#EF4444]' : level === 'Med' ? 'text-[#F59E0B]' : 'text-[#22C55E]'
                }`}
              >
                {level}
              </div>
            ))}
          </div>

          <MapContainer center={[24.9, 67.05]} zoom={11} zoomControl={false} className="w-full h-full z-[1]">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <CircleMarker
              center={[24.8607, 67.0011]}
              radius={25}
              pathOptions={{ color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.25 }}
              eventHandlers={{ click: () => handleHeroZoneClick('Saddar Phase 1', 24.8607, 67.0011) }}
            >
              <Tooltip>Saddar / Lyari — Click to open Heatmap</Tooltip>
            </CircleMarker>
            <CircleMarker
              center={[24.918, 67.0971]}
              radius={20}
              pathOptions={{ color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.25 }}
              eventHandlers={{ click: () => handleHeroZoneClick('Gulshan-e-Iqbal Block A', 24.918, 67.0971) }}
            >
              <Tooltip>Gulshan-e-Iqbal — Click to open Heatmap</Tooltip>
            </CircleMarker>
            <CircleMarker
              center={[24.795, 67.0322]}
              radius={15}
              pathOptions={{ color: '#22C55E', fillColor: '#22C55E', fillOpacity: 0.25 }}
              eventHandlers={{ click: () => handleHeroZoneClick('DHA Phase 6', 24.795, 67.0322) }}
            >
              <Tooltip>DHA — Click to open Heatmap</Tooltip>
            </CircleMarker>
          </MapContainer>
        </div>
      </section>

      {/* 2. PLATFORM METRICS SECTION */}
      <section className="bg-[#1E293B] border-y border-white/10 py-14 mt-8">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-10 text-center">
          <div>
            <div className="flex justify-center mb-3"><MapPin className="text-[#F97316]" size={28} /></div>
            <div className="text-4xl font-black text-white">210+</div>
            <div className="text-[#64748B] text-sm font-bold tracking-wide mt-2 uppercase">Subdivisions Monitored</div>
          </div>
          <div>
            <div className="flex justify-center mb-3"><Activity className="text-[#22C55E]" size={28} /></div>
            <div className="text-4xl font-black text-white">60K+</div>
            <div className="text-[#64748B] text-sm font-bold tracking-wide mt-2 uppercase">Crime Records Analyzed</div>
          </div>
          <div>
            <div className="flex justify-center mb-3"><Users className="text-[#F59E0B]" size={28} /></div>
            <div className="text-4xl font-black text-white">3-Path</div>
            <div className="text-[#64748B] text-sm font-bold tracking-wide mt-2 uppercase">Dijkstra Safe Routing</div>
          </div>
        </div>
      </section>

      {/* 3. CORE FEATURES SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-20 w-full">
        <h2 className="text-3xl font-black text-center mb-14 tracking-tight">Core Platform Capabilities</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            onClick={() => navigate('/predict')}
            className="cursor-pointer bg-[#1E293B] border border-white/10 rounded-2xl p-8 hover:border-[#F97316]/60 transition-all group"
          >
            <div className="bg-[#162032] w-14 h-14 rounded-xl flex items-center justify-center mb-6">
              <Cpu className="text-[#F97316]" size={28} />
            </div>
            <h3 className="text-xl font-bold mb-4 group-hover:text-[#F97316] transition-colors">
              AI Risk Prediction →
            </h3>
            <p className="text-[#94A3B8] leading-relaxed">
              Predict neighborhood safety scores dynamically based on historical crime patterns and time of day.
            </p>
          </div>

          <div
            onClick={() => navigate('/routes')}
            className="cursor-pointer bg-[#1E293B] border border-white/10 rounded-2xl p-8 hover:border-[#22C55E]/60 transition-all group"
          >
            <div className="bg-[#162032] w-14 h-14 rounded-xl flex items-center justify-center mb-6">
              <MapIcon className="text-[#22C55E]" size={28} />
            </div>
            <h3 className="text-xl font-bold mb-4 group-hover:text-[#22C55E] transition-colors">
              Safe Route Calculation →
            </h3>
            <p className="text-[#94A3B8] leading-relaxed">
              Find travel routes that actively steer clear of high-incident areas across Karachi to ensure safe transit.
            </p>
          </div>

          <div
            onClick={() => navigate('/heatmap')}
            className="cursor-pointer bg-[#1E293B] border border-white/10 rounded-2xl p-8 hover:border-[#F59E0B]/60 transition-all group"
          >
            <div className="bg-[#162032] w-14 h-14 rounded-xl flex items-center justify-center mb-6">
              <Bell className="text-[#F59E0B]" size={28} />
            </div>
            <h3 className="text-xl font-bold mb-4 group-hover:text-[#F59E0B] transition-colors">
              Live Heatmap Visualizer →
            </h3>
            <p className="text-[#94A3B8] leading-relaxed">
              Explore district-level crime densities using interactive spatial map tiles that update in real-time.
            </p>
          </div>
        </div>
      </section>

      {/* 4. CALL TO ACTION */}
      <section className="max-w-5xl mx-auto px-6 w-full mb-20">
        <div className="bg-gradient-to-r from-[#1C1714] to-[#1E1917] border border-[#F97316]/20 rounded-3xl p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-orange-900/10">
          <div className="text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">
              Ready to navigate Karachi safely?
            </h2>
            <p className="text-[#94A3B8] text-lg">
              Make smarter, safer travel decisions across Karachi with real-time spatial telemetry.
            </p>
          </div>
          <button
            onClick={() => navigate('/routes')}
            className="whitespace-nowrap bg-[#F97316] hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-xl transition-colors shadow-lg shadow-orange-500/20 text-lg"
          >
            Start for Free →
          </button>
        </div>
      </section>

      {/* 5. FULL FOOTER */}
      <footer className="border-t border-white/10 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-[#F97316] rounded-lg p-1.5 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <span className="text-[#F1F5F9] text-lg font-extrabold tracking-tight">
              Crime<span className="text-[#F97316]">Guard</span>
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-sm font-medium text-[#64748B]">
            <button onClick={() => navigate('/heatmap')} className="hover:text-white transition-colors">Heatmap</button>
            <button onClick={() => navigate('/predict')} className="hover:text-white transition-colors">AI Predictor</button>
            <button onClick={() => navigate('/routes')} className="hover:text-white transition-colors">Safe Routes</button>
            <button onClick={() => navigate('/login')} className="hover:text-white transition-colors">Account</button>
          </div>

          <div className="text-sm font-medium text-[#64748B]">
            © 2026 CrimeGuard. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}