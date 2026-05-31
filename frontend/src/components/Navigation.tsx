import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Home, LayoutDashboard, LineChart, Shuffle, TrendingUp, Brain, BookOpen, Info } from 'lucide-react';

const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/results', label: 'Results', icon: LineChart },
    { path: '/simulation', label: 'Simulation', icon: Shuffle },
    { path: '/montecarlo', label: 'Monte Carlo', icon: TrendingUp },
    { path: '/ai-insights', label: 'AI Insights', icon: Brain },
    { path: '/methodology', label: 'Methodology', icon: BookOpen },
    { path: '/about', label: 'About', icon: Info },
  ];
  
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-brand-blue" />
            <span className="text-xl font-heading font-bold bg-gradient-to-r from-brand-blue to-brand-teal bg-clip-text text-transparent">
              Smart Allocation Lab
            </span>
          </Link>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-blue text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="p-2 rounded-lg text-gray-600 hover:bg-gray-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
