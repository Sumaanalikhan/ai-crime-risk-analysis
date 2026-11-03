import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import API from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await API.post('/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col justify-center items-center px-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#F97316]/10 rounded-full blur-[120px] pointer-events-none" />

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
          <h1 className="text-2xl font-black text-white tracking-tight mb-2">Welcome Back</h1>
          <p className="text-[#94A3B8] text-sm">Sign in to access your personal dashboard.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-xl mb-6 flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div>
            <label className="block text-[#94A3B8] text-xs font-bold uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail size={18} className="text-[#64748B]" />
              </div>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#162032] border border-white/10 text-white rounded-xl pl-11 pr-4 py-3.5 text-sm outline-none focus:border-[#F97316] transition-colors"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-[#94A3B8] text-xs font-bold uppercase tracking-wider">Password</label>
              <Link to="/forgot-password" className="text-[#F97316] text-xs font-bold hover:underline">Forgot?</Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={18} className="text-[#64748B]" />
              </div>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#162032] border border-white/10 text-white rounded-xl pl-11 pr-4 py-3.5 text-sm outline-none focus:border-[#F97316] transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#F97316] hover:bg-orange-600 disabled:bg-[#F97316]/50 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-orange-500/20 flex justify-center items-center gap-2 mt-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Sign In <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm font-medium text-[#94A3B8]">
          Don't have an account? <Link to="/register" className="text-[#F97316] font-bold hover:underline">Sign up</Link>
        </div>
      </div>
    </div>
  );
}