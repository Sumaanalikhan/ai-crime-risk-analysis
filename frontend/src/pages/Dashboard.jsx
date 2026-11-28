import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Navigation,
  Trash2,
  Plus,
  ShieldCheck,
  LogOut,
  User,
  Activity,
  X,
  Phone,
  Check,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { ENDPOINTS } from '../config/api';

const STORAGE_KEY_ROUTES = 'cg_saved_commutes';
const STORAGE_KEY_EMERGENCY = 'cg_emergency_contact';

const DEFAULT_COMMUTES = [
  {
    id: 1,
    name: 'Morning Commute',
    from: 'DHA Phase 6',
    to: 'Gulshan-e-Iqbal Block A',
    lat: 24.918,
    lng: 67.0971,
    time: '08:00 AM',
    timeOfDay: 'Day',
    risk: 'Moderate',
  },
  {
    id: 2,
    name: 'Evening Return',
    from: 'Saddar Phase 1',
    to: 'DHA Phase 6',
    lat: 24.795,
    lng: 67.0322,
    time: '08:30 PM',
    timeOfDay: 'Night',
    risk: 'Low',
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [zones, setZones] = useState([]);

  const [savedRoutes, setSavedRoutes] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ROUTES);
      return stored ? JSON.parse(stored) : DEFAULT_COMMUTES;
    } catch {
      return DEFAULT_COMMUTES;
    }
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [fromArea, setFromArea] = useState('');
  const [toArea, setToArea] = useState('');
  const [commuteTime, setCommuteTime] = useState('08:30');
  const [formError, setFormError] = useState('');

  const [emergencyPhone, setEmergencyPhone] = useState(
    () => localStorage.getItem(STORAGE_KEY_EMERGENCY) || ''
  );
  const [editingEmergency, setEditingEmergency] = useState(false);
  const [phoneInput, setPhoneInput] = useState(emergencyPhone);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ROUTES, JSON.stringify(savedRoutes));
  }, [savedRoutes]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(ENDPOINTS.HEATMAP);
        const data = await res.json();
        if (data.success && Array.isArray(data.zones)) setZones(data.zones);
      } catch (err) {
        console.error('Failed to load Karachi zones:', err);
      }
    })();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleAddCommute = (e) => {
    e.preventDefault();
    setFormError('');
    if (!routeName.trim() || !fromArea.trim() || !toArea.trim()) {
      setFormError('Please fill in route label, origin, and destination.');
      return;
    }
    if (savedRoutes.length >= 5) {
      setFormError('Maximum 5 saved commutes reached on the Free tier.');
      return;
    }

    const cleanTo = toArea.trim().toLowerCase();
    const matched =
      zones.find((z) => `${z.name} (${z.town})`.toLowerCase() === cleanTo) ||
      zones.find((z) => z.name.toLowerCase() === cleanTo) ||
      zones.find((z) => z.name.toLowerCase().includes(cleanTo)) ||
      null;

    const hr = parseInt(commuteTime.split(':')[0], 10) || 9;
    const isNight = hr >= 18 || hr <= 5;
    const formattedTime = new Date(`1970-01-01T${commuteTime}:00`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const newEntry = {
      id: Date.now(),
      name: routeName.trim(),
      from: fromArea.trim(),
      to: matched ? `${matched.name} (${matched.town})` : toArea.trim(),
      lat: matched ? parseFloat(matched.lat) : null,
      lng: matched ? parseFloat(matched.lng) : null,
      time: formattedTime,
      timeOfDay: isNight ? 'Night' : 'Day',
      risk: matched ? matched.risk : 'Moderate',
    };

    setSavedRoutes((prev) => [newEntry, ...prev]);
    setRouteName('');
    setFromArea('');
    setToArea('');
    setShowAddForm(false);
  };

  const handleDeleteRoute = (id) => {
    setSavedRoutes((prev) => prev.filter((r) => r.id !== id));
  };

  const handleNavigateRoute = (route) => {
    if (Number.isFinite(route.lat) && Number.isFinite(route.lng)) {
      sessionStorage.setItem(
        'cg_pending_route',
        JSON.stringify({
          lat: route.lat,
          lng: route.lng,
          label: route.to,
          timeOfDay: route.timeOfDay || 'Day',
        })
      );
    }
    navigate('/routes');
  };

  const handleCheckRouteRisk = (route) => {
    sessionStorage.setItem(
      'cg_pending_predict',
      JSON.stringify({ label: route.to })
    );
    navigate('/predict');
  };

  const handleSaveEmergency = (e) => {
    e.preventDefault();
    const trimmed = phoneInput.trim();
    setEmergencyPhone(trimmed);
    localStorage.setItem(STORAGE_KEY_EMERGENCY, trimmed);
    setEditingEmergency(false);
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
              <button
                type="button"
                onClick={() => setShowAddForm((v) => !v)}
                disabled={savedRoutes.length >= 5 && !showAddForm}
                className="bg-[#F97316] hover:bg-orange-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
              >
                {showAddForm ? <X size={16} /> : <Plus size={16} />}
                {showAddForm ? 'Cancel' : 'Add Route'}
              </button>
            </div>

            {/* Add New Commute Form */}
            {showAddForm && (
              <form
                onSubmit={handleAddCommute}
                className="bg-[#1E293B] border border-[#F97316]/40 rounded-2xl p-6 space-y-4 shadow-xl"
              >
                <datalist id="dashboard-karachi-areas">
                  {zones.map((z, idx) => (
                    <option key={z.id ?? idx} value={`${z.name} (${z.town})`} />
                  ))}
                </datalist>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#94A3B8] uppercase">Route Label</label>
                    <input
                      type="text"
                      placeholder="e.g. University Morning Run"
                      value={routeName}
                      onChange={(e) => setRouteName(e.target.value)}
                      className="mt-1 w-full bg-[#0F172A] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#F97316]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#94A3B8] uppercase">Departure Time</label>
                    <input
                      type="time"
                      value={commuteTime}
                      onChange={(e) => setCommuteTime(e.target.value)}
                      className="mt-1 w-full bg-[#0F172A] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#F97316] [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#94A3B8] uppercase">From</label>
                    <input
                      type="text"
                      list="dashboard-karachi-areas"
                      placeholder="e.g. DHA Phase 6"
                      value={fromArea}
                      onChange={(e) => setFromArea(e.target.value)}
                      className="mt-1 w-full bg-[#0F172A] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#F97316]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#94A3B8] uppercase">To (Destination)</label>
                    <input
                      type="text"
                      list="dashboard-karachi-areas"
                      placeholder="e.g. Gulshan-e-Iqbal"
                      value={toArea}
                      onChange={(e) => setToArea(e.target.value)}
                      className="mt-1 w-full bg-[#0F172A] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#F97316]"
                    />
                  </div>
                </div>

                {formError && (
                  <p className="text-xs text-red-400 font-medium">{formError}</p>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-[#F97316] hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Save Commute
                  </button>
                </div>
              </form>
            )}

            {savedRoutes.length === 0 ? (
              <div className="bg-[#1E293B] border border-white/10 rounded-2xl p-10 text-center text-[#94A3B8]">
                You haven&apos;t saved any daily routes yet. Click &ldquo;Add Route&rdquo; to create one.
              </div>
            ) : (
              <div className="space-y-4">
                {savedRoutes.map((route) => (
                  <div
                    key={route.id}
                    className="bg-[#1E293B] border border-white/10 hover:border-white/20 transition-colors rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-lg"
                  >
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-white">{route.name}</h3>
                        <span
                          className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                            route.risk === 'Low'
                              ? 'bg-green-500/10 text-green-500 border border-green-500/30'
                              : route.risk === 'High'
                              ? 'bg-red-500/10 text-red-500 border border-red-500/30'
                              : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30'
                          }`}
                        >
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

                    <div className="flex items-center gap-2.5 w-full md:w-auto">
                      <button
                        type="button"
                        onClick={() => handleCheckRouteRisk(route)}
                        className="bg-[#0F172A] hover:bg-white/5 border border-white/10 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Activity size={14} className="text-[#F97316]" /> Risk
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNavigateRoute(route)}
                        className="flex-1 md:flex-none bg-[#3b82f6] hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Navigation size={14} /> Navigate
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRoute(route.id)}
                        title="Delete saved route"
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-500 p-2 rounded-xl transition-colors"
                      >
                        <Trash2 size={16} />
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
                  <span className="bg-[#F97316]/10 text-[#F97316] font-bold px-3 py-1 rounded-lg text-sm border border-[#F97316]/30">
                    Public Free
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <span className="text-[#94A3B8] font-medium">Saved Routes</span>
                  <span className="text-white font-bold">{savedRoutes.length} / 5</span>
                </div>
                <div className="pt-2 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[#94A3B8] font-medium flex items-center gap-1.5">
                      <Phone size={14} className="text-[#F97316]" /> Emergency Contact
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPhoneInput(emergencyPhone);
                        setEditingEmergency((v) => !v);
                      }}
                      className="text-sm text-[#F97316] font-bold hover:underline"
                    >
                      {editingEmergency ? 'Cancel' : emergencyPhone ? 'Edit' : 'Configure Setup'}
                    </button>
                  </div>

                  {editingEmergency ? (
                    <form onSubmit={handleSaveEmergency} className="flex gap-2 pt-1">
                      <input
                        type="tel"
                        placeholder="+92 300 1234567"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        className="flex-1 bg-[#0F172A] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#F97316]"
                      />
                      <button
                        type="submit"
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
                      >
                        <Check size={13} /> Save
                      </button>
                    </form>
                  ) : (
                    <div className="text-xs text-slate-400">
                      {emergencyPhone ? `Active alert contact: ${emergencyPhone}` : 'No emergency number configured yet.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}