import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Navigation, Trash2, Plus, ShieldCheck, LogOut, User } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function Dashboard() {
  const navigate = useNavigate();
  
  // Mock data for UI development before we connect the Express backend
  const [savedRoutes, setSavedRoutes] = useState([
    { id: 1, name: 'Morning Commute', from: 'DHA Phase 6', to: 'Iqra University Main Campus', time: '08:00 AM', risk: 'Low' },
    { id: 2, name: 'Evening Route', from: 'Iqra University Main Campus', to: 'Tariq Road', time: '06:30 PM', risk: 'Moderate' }
  ]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F1F5F9] flex flex-col font-sans">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-12 w-full flex-1">
        
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-white/10 pb-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-[#1E293B] border border-white/10 rounded-full flex items-center justify-center shadow-lg">
              <User size={32} className="text-[#94A3B8]" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
                User Dashboard
              </h1>
              <p className="text-[#94A3B8] font-medium flex items-center gap-2">
                <ShieldCheck size={18} className="text-green-500" /> Account secured and active
              </p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 px-5 py-2.5 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 w-full md:w-auto"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Saved Routes Manager */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-white">Saved Commutes</h2>
              <button className="bg-[#F97316] hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                <Plus size={16} /> Add Route
              </button>
            </div>

            {savedRoutes.length === 0 ? (
              <div className="bg-[#1E293B] border border-white/10 rounded-2xl p-10 text-center text-[#94A3B8]">
                You haven't saved any daily routes yet.
              </div>
            ) : (
              <div className="space-y-4">
                {savedRoutes.map((route) => (
                  <div key={route.id} className="bg-[#1E293B] border border-white/10 hover:border-white/20 transition-colors rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-lg">
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-white">{route.name}</h3>
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                          route.risk === 'Low' ? 'bg-green-500/10 text-green-500 border border-green-500/30' : 
                          'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30'
                        }`}>
                          {route.risk} Risk
                        </span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-[#94A3B8]">
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-[#F97316]" /> {route.from} 
                          <span className="mx-1 text-[#64748B]">→</span> 
                          {route.to}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-[#F97316]" /> {route.time}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <button className="flex-1 md:flex-none bg-[#0F172A] hover:bg-white/5 border border-white/10 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                        <Navigation size={16} /> Navigate
                      </button>
                      <button className="bg-red-500/10 hover:bg-red-500/20 text-red-500 p-2.5 rounded-xl transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Account Stats / Settings Widget */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-2">Account Status</h2>
            <div className="bg-[#1E293B] border border-white/10 rounded-2xl p-6 shadow-lg">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <span className="text-[#94A3B8] font-medium">Subscription</span>
                  <span className="bg-[#F97316]/10 text-[#F97316] font-bold px-3 py-1 rounded-lg text-sm border border-[#F97316]/30">Public Free</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <span className="text-[#94A3B8] font-medium">Saved Routes</span>
                  <span className="text-white font-bold">{savedRoutes.length} / 5</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[#94A3B8] font-medium">Emergency SMS</span>
                  <button className="text-sm text-[#F97316] font-bold hover:underline">Configure Setup</button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}