import { useState } from "react";
import { Shield, Info, CheckCircle } from 'lucide-react';
import Navbar from '../components/Navbar';

const AREAS = ["Gulshan-e-Iqbal", "Saddar", "Lyari", "Nazimabad", "DHA Phase 1"];
const TIMES = ["Morning (6am–12pm)", "Afternoon (12pm–5pm)", "Evening (5pm–9pm)", "Night (9pm–6am)"];

export default function PredictRisk() {
  const [area, setArea] = useState("Gulshan-e-Iqbal");
  const [time, setTime] = useState("Evening (5pm–9pm)");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(false);

  const analyze = () => {
    setLoading(true);
    setResult(false);
    setTimeout(() => { setLoading(false); setResult(true); }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F1F5F9] flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-12 lg:py-20">
        <div className="text-center mb-12">
          <span className="inline-block border border-[#F97316]/30 bg-[#F97316]/10 rounded-full px-4 py-1.5 text-[#F97316] text-xs font-bold tracking-widest mb-4">
            AI RISK PREDICTOR
          </span>
          <h1 className="text-4xl lg:text-5xl font-black mb-4 tracking-tight">
            Check Crime Risk in Your Area
          </h1>
          <p className="text-[#94A3B8] text-base lg:text-lg max-w-xl mx-auto">
            Enter details below to receive an AI-powered risk assessment for any location in Karachi.
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-[#1E293B] border border-white/10 rounded-2xl p-6 lg:p-10 mb-8 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-[#94A3B8] text-xs font-bold uppercase tracking-wider mb-2">Area / Neighbourhood</label>
              <select 
                value={area} 
                onChange={e => { setArea(e.target.value); setResult(false); }} 
                className="w-full bg-[#162032] border border-white/10 text-white rounded-xl px-4 py-3.5 text-sm outline-none focus:border-[#F97316] transition-colors"
              >
                {AREAS.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[#94A3B8] text-xs font-bold uppercase tracking-wider mb-2">Time of Day</label>
              <select 
                value={time} 
                onChange={e => { setTime(e.target.value); setResult(false); }} 
                className="w-full bg-[#162032] border border-white/10 text-white rounded-xl px-4 py-3.5 text-sm outline-none focus:border-[#F97316] transition-colors"
              >
                {TIMES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          
          <button 
            onClick={analyze} 
            disabled={loading} 
            className="w-full bg-[#F97316] hover:bg-orange-600 disabled:bg-[#F97316]/20 disabled:text-[#F97316] text-white font-bold py-4 rounded-xl transition-colors shadow-lg flex justify-center items-center gap-2"
          >
            {loading ? (
              <><div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> Analyzing with AI...</>
            ) : (
              "Analyze Risk →"
            )}
          </button>
        </div>

        {/* Results Card */}
        {result && (
          <div className="bg-[#1E293B] border border-[#F59E0B] rounded-2xl p-8 shadow-2xl shadow-orange-900/10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div>
                <div className="text-[#64748B] text-xs font-bold tracking-widest mb-2 uppercase">Risk Assessment Result</div>
                <h2 className="text-3xl font-black text-white">{area}</h2>
                <div className="text-[#94A3B8] text-sm mt-1">{time}</div>
              </div>
              <div className="text-center bg-[#162032] border border-white/5 rounded-xl p-5 min-w-[140px]">
                <div className="text-[#F59E0B] text-5xl font-black leading-none mb-1">58</div>
                <div className="text-[#64748B] text-xs font-bold tracking-wider">RISK SCORE</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}