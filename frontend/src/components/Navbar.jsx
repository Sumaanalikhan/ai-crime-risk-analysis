import { Link, useLocation } from 'react-router-dom';
import { Shield, Menu } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

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
        
        {/* Desktop Login & Mobile Menu Button */}
        <div className="flex items-center gap-4">
          <button className="hidden md:block bg-[#F97316] hover:bg-orange-600 text-white rounded-lg px-5 py-2 text-sm font-bold transition-colors">
            Login
          </button>
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-[#94A3B8]">
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="md:hidden pt-4 pb-2 flex flex-col gap-4">
          {links.map(l => (
            <Link key={l.path} to={l.path} onClick={() => setIsOpen(false)} className="text-[#F1F5F9] font-medium text-sm px-2">
              {l.label}
            </Link>
          ))}
          <button className="bg-[#F97316] text-white rounded-lg px-4 py-2 text-sm font-bold w-full mt-2">
            Login
          </button>
        </div>
      )}
    </nav>
  );
}