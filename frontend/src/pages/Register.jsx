import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, User, ArrowRight, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import API from '../services/api';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await API.post('/auth/register', formData);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col justify-center items-center px-6 py-12 relative overflow-hidden">
      {/* Back to Home Button */}
      <Link to="/" className="absolute top-6 left-6 md:top-10 md:left-10 text-[#94A3B8] hover:text-white flex items-center gap-2 text-sm font-bold transition-colors z-20">
        <ArrowLeft size={18} /> Back to Home
      </Link>

      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#22C55E]/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mb-8 relative z-10">
        <div className="bg-[#F97316] rounded-lg p-2 flex items-center justify-center shadow-lg shadow-orange-500/20">
          <Shield className="w-6 h-6 text-white stroke-[2.5]" />
        </div>
        <span className="text-[#F1F5F9] text-2xl font-extrabold tracking-tight">
          Crime<span className="text-[#F97316]">Guard</span>
        </span>
      </Link>

      {/* Auth Card */}
      <div className="w-full max-w-md bg-[#1E293B] border border-white/10 rounded-3xl p-8 lg:p-10 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-white tracking-tight mb-2">Create Account</h1>
          <p className="text-[#94A3B8] text-sm">Join CrimeGuard for safe navigation in Karachi.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-xl mb-6 flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-5">
          <div>
            <label className="block text-[#94A3B8] text-xs font-bold uppercase tracking-wider mb-2">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User size={18} className="text-[#64748B]" />
              </div>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-[#162032] border border-white/10 text-white rounded-xl pl-11 pr-4 py-3.5 text-sm outline-none focus:border-[#F97316] transition-colors"
                placeholder="Ali Khan"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#94A3B8] text-xs font-bold uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail size={18} className="text-[#64748B]" />
              </div>
              <input 
                type="email" 
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-[#162032] border border-white/10 text-white rounded-xl pl-11 pr-4 py-3.5 text-sm outline-none focus:border-[#F97316] transition-colors"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#94A3B8] text-xs font-bold uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={18} className="text-[#64748B]" />
              </div>
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full bg-[#162032] border border-white/10 text-white rounded-xl pl-11 pr-12 py-3.5 text-sm outline-none focus:border-[#F97316] transition-colors"
                placeholder="••••••••"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#64748B] hover:text-[#F1F5F9] transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#22C55E] hover:bg-green-600 disabled:bg-[#22C55E]/50 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-green-500/20 flex justify-center items-center gap-2 mt-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Create Account <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm font-medium text-[#94A3B8]">
          Already have an account? <Link to="/login" className="text-[#F97316] font-bold hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
}