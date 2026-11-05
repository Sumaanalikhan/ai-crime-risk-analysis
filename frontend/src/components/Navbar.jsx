import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Menu, LogOut, User, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Check if the user is currently logged in
  const isAuthenticated = !!localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    setProfileOpen(false);
    navigate('/login');
  };

  const links = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/predict", label: "Predict Risk" },
    { path: "/routes", label: "Safe Routes" },
    { path: "/heatmap", label: "Heatmap" },
  ];

  return (
    <nav className="bg-[#1E293B] border-b border-white/10 px-4 md:px-8 py-3 sticky top-0 z-50">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 md:gap-3">
          <div className="bg-[#F97316] rounded-lg p-1.5 flex items-center justify-center">
            <Shield className="w-4 h-4 md:w-5 md:h-5 text-white stroke-[2.5]" />
          </div>
          <span className="text-[#F1F5F9] text-base md:text-lg font-extrabold tracking-tight">
            Crime<span className="text-[#F97316]">Guard</span>
          </span>
        </Link>
        
        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map(l => {
            const isActive = location.pathname === l.path;
            return (
              <Link
                key={l.path}
                to={l.path}
                className={`text-sm py-1 border-b-2 transition-colors ${
                  isActive 
                    ? "text-[#F97316] border-[#F97316] font-semibold" 
                    : "text-[#94A3B8] border-transparent hover:text-white font-medium"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
        
        {/* Desktop Auth Section & Mobile Menu Button */}
        <div className="flex items-center gap-4">
          <div className="hidden md:block">
            {isAuthenticated ? (
              <div className="relative">
                {/* Profile Avatar Button */}
                <button 
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 bg-[#162032] border border-white/10 hover:border-white/30 rounded-full py-1.5 pr-3 pl-1.5 transition-colors focus:outline-none"
                >
                  <div className="bg-[#F97316] text-white w-7 h-7 rounded-full flex items-center justify-center">
                    <User size={14} />
                  </div>
                  <span className="text-sm font-semibold text-white">My Account</span>
                  <ChevronDown size={14} className="text-[#94A3B8]" />
                </button>

                {/* Dropdown Menu */}
                {profileOpen && (
                  <div className="absolute right-0 mt-3 w-48 bg-[#1E293B] border border-white/10 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2 transition-colors"
                    >
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="bg-[#F97316] hover:bg-orange-600 text-white rounded-lg px-5 py-2 text-sm font-bold transition-colors shadow-lg shadow-orange-500/20">
                Login
              </Link>
            )}
          </div>
          
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-[#94A3B8]">
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isOpen && (
        <div className="md:hidden pt-4 pb-2 flex flex-col gap-4 animate-in slide-in-from-top-2">
          {links.map(l => (
            <Link key={l.path} to={l.path} onClick={() => setIsOpen(false)} className="text-[#F1F5F9] font-medium text-sm px-2">
              {l.label}
            </Link>
          ))}
          
          <div className="h-px bg-white/10 my-2" />

          {isAuthenticated ? (
            <button 
              onClick={() => { setIsOpen(false); handleLogout(); }}
              className="flex items-center gap-2 text-red-400 font-bold text-sm px-2 py-2"
            >
              <LogOut size={16} /> Sign Out
            </button>
          ) : (
            <Link to="/login" onClick={() => setIsOpen(false)} className="bg-[#F97316] text-center text-white rounded-lg px-4 py-3 text-sm font-bold w-full mt-2 block shadow-lg">
              Login
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}