import { useState } from 'react';
import axios from 'axios';
import { MapPin, Clock, ShieldAlert, Activity, AlertTriangle, CheckCircle, Search } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function PredictRisk() {
  const [location, setLocation] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handlePredict = async (e) => {
    e.preventDefault();
    if (!location || !time) {
      setError('Please provide both location and time.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Connects to the Express backend route we just created
      const res = await axios.post('http://localhost:5000/api/predict', { location, time });
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Server error. Ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to dynamically color the UI based on risk score
  const getRiskColors = (score) => {
    if (score >= 75) return 'text-red-500 bg-red-500/10 border-red-500/50';
    if (score >= 45) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/50';
    return 'text-green-500 bg-green-500/10 border-green-500/50';
  };

  const getRiskIcon = (score) => {
    if (score >= 75) return <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />;
    if (score >= 45) return <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />;
    return <CheckCircle className="w-12 h-12 text-green-500 mb-4" />;
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F1F5F9] flex flex-col font-sans">
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 py-12 lg:py-20 w-full flex-1">
        
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1E293B] border border-white/10 text-[#F97316] text-xs font-bold tracking-widest uppercase mb-4 shadow-lg">
            <Activity size={14} />
            Real-Time Analysis
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
            AI Risk Predictor
          </h1>
          <p className="text-[#94A3B8] text-lg">
            Enter any Karachi neighborhood and time of day to instantly evaluate safety conditions before you travel.
          </p>
        </div>

        {/* Prediction Form */}
        <div className="bg-[#1E293B] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
          <form onSubmit={handlePredict} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Location Input */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#94A3B8] uppercase tracking-wider">Neighborhood / Area</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]" size={20} />
                  <input 
                    type="text" 
                    placeholder="e.g. Lyari, DHA, Gulshan..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-[#0F172A] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] transition-all"
                  />
                </div>
              </div>

              {/* Time Input */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#94A3B8] uppercase tracking-wider">Time of Travel</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]" size={20} />
                  <input 
                    type="time" 
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-[#0F172A] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] transition-all [color-scheme:dark]"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                <AlertTriangle size={16} /> {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#F97316] hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Search size={20} /> Calculate Risk Score
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Container */}
        {result && (
          <div className="mt-8 bg-[#1E293B] border border-white/10 rounded-3xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row items-center gap-8">
              
              {/* Score Circle */}
              <div className={`shrink-0 w-40 h-40 rounded-full border-[6px] flex flex-col items-center justify-center ${getRiskColors(result.riskScore)} shadow-xl`}>
                <span className="text-5xl font-black">{result.riskScore}</span>
                <span className="text-sm font-bold uppercase tracking-wide opacity-80">/ 100</span>
              </div>

              {/* Data & Advice */}
              <div className="flex-1 text-center md:text-left">
                {getRiskIcon(result.riskScore)}
                <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
                  {result.status}
                </h2>
                <div className="text-sm font-bold text-[#64748B] uppercase tracking-wider mb-4 border-b border-white/10 pb-4">
                  {result.location} • {result.time}
                </div>
                <p className="text-lg text-[#94A3B8] leading-relaxed">
                  {result.advice}
                </p>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}