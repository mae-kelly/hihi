import React from 'react';
import { Shield, BarChart3, Database, AlertTriangle, Activity, Settings, Network, FileSearch } from 'lucide-react';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, onNavigate }) => {
  const navItems = [
    { id: 'overview', label: 'OVERVIEW', icon: BarChart3 },
    { id: 'visibility', label: 'VISIBILITY MATRIX', icon: Database },
    { id: 'logsources', label: 'LOG SOURCES', icon: FileSearch },
    { id: 'compliance', label: 'COMPLIANCE', icon: Shield },
    { id: 'threats', label: 'THREATS', icon: AlertTriangle },
    { id: 'gaps', label: 'VISIBILITY GAPS', icon: Activity },
    { id: 'topology', label: 'NETWORK', icon: Network },
    { id: 'settings', label: 'SETTINGS', icon: Settings },
  ];

  return (
    <nav className="fixed left-0 top-0 h-full w-64 backdrop-blur-xl bg-black/60 border-r border-cyan-400/20 z-30">
      <div className="p-6 border-b border-cyan-400/20">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-cyan-400" />
          <div>
            <h1 className="text-xl font-black" style={{
              fontFamily: 'Orbitron, monospace',
              background: 'linear-gradient(135deg, #00ffff, #00d4ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              CYBERVISION
            </h1>
            <p className="text-xs text-pink-400 font-mono">5000</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive 
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/50 shadow-lg shadow-cyan-400/20' 
                  : 'hover:bg-cyan-400/10 border border-transparent hover:border-cyan-400/20'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-cyan-400/60'}`} />
              <span className={`text-sm font-mono font-bold ${
                isActive ? 'text-cyan-400' : 'text-cyan-400/60'
              }`}>
                {item.label}
              </span>
              {isActive && (
                <div className="ml-auto w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-lg shadow-cyan-400/50" />
              )}
            </button>
          );
        })}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-cyan-400/20">
        <div className="text-xs font-mono text-cyan-400/40 space-y-1">
          <p>SYSTEM STATUS: <span className="text-green-400">ONLINE</span></p>
          <p>LAST SYNC: <span className="text-cyan-400/60">2 MIN AGO</span></p>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;