import React, { useState, useEffect } from 'react';
import { Shield, BarChart3, Database, Globe, Activity, Settings, Network, FileSearch, Layers, Eye, Cpu, Lock, Zap, Hexagon, Triangle, Server, Cloud } from 'lucide-react';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, onNavigate }) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [pulseAnimation, setPulseAnimation] = useState<Record<string, boolean>>({});

  const navItems = [
    { id: 'dashboard', label: 'DASHBOARD', icon: BarChart3, color: '#00d4ff' },
    { id: 'global-view', label: 'GLOBAL VIEW', icon: Globe, color: '#a855f7' },
    { id: 'infrastructure', label: 'INFRASTRUCTURE', icon: Server, color: '#00d4ff' },
    { id: 'regional-country', label: 'REGIONAL', icon: Network, color: '#a855f7' },
    { id: 'bu-application', label: 'BU & APP', icon: Layers, color: '#00d4ff' },
    { id: 'system-classification', label: 'SYSTEMS', icon: Cpu, color: '#a855f7' },
    { id: 'security-coverage', label: 'SECURITY', icon: Shield, color: '#00d4ff' },
    { id: 'compliance', label: 'COMPLIANCE', icon: FileSearch, color: '#a855f7' },
    { id: 'domain-visibility', label: 'DOMAINS', icon: Database, color: '#00d4ff' },
    { id: 'logging-standards', label: 'STANDARDS', icon: Activity, color: '#a855f7' },
  ];

  // Simulate data updates
  useEffect(() => {
    const interval = setInterval(() => {
      const randomItem = navItems[Math.floor(Math.random() * navItems.length)];
      setPulseAnimation(prev => ({ ...prev, [randomItem.id]: true }));
      
      setTimeout(() => {
        setPulseAnimation(prev => ({ ...prev, [randomItem.id]: false }));
      }, 1000);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="fixed left-0 top-0 h-full w-64 z-40">
      <div className="h-full bg-black/95 backdrop-blur-xl border-r border-white/10">
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Hexagon className="w-10 h-10 text-blue-400" />
              <div className="absolute inset-0 w-10 h-10 animate-pulse">
                <Hexagon className="w-10 h-10 text-blue-400/30" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold">
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  LOG LENS
                </span>
              </h1>
              <p className="text-xs text-white/60 uppercase tracking-widest">
                AO1 Visibility
              </p>
            </div>
          </div>
        </div>

        {/* Navigation items - scrollable if needed */}
        <div className="overflow-y-auto" style={{ height: 'calc(100% - 200px)' }}>
          <div className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              const isHovered = hoveredItem === item.id;
              const isPulsing = pulseAnimation[item.id];
              
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`w-full group relative overflow-hidden rounded-lg transition-all duration-300 ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10' 
                      : 'bg-black/30 hover:bg-white/5'
                  }`}
                  style={{
                    border: `1px solid ${
                      isActive 
                        ? item.color === '#00d4ff' ? 'rgba(0, 212, 255, 0.3)' :
                          'rgba(168, 85, 247, 0.3)'
                        : 'transparent'
                    }`,
                    boxShadow: isActive || isHovered
                      ? `0 0 20px ${
                          item.color === '#00d4ff' ? 'rgba(0, 212, 255, 0.1)' :
                          'rgba(168, 85, 247, 0.1)'
                        }`
                      : 'none'
                  }}
                >
                  {isPulsing && (
                    <div className="absolute inset-0 animate-ping">
                      <div className="h-full w-full rounded-lg"
                           style={{
                             background: `radial-gradient(circle, 
                               ${item.color === '#00d4ff' ? 'rgba(0, 212, 255, 0.2)' :
                                 'rgba(168, 85, 247, 0.2)'} 0%, 
                               transparent 70%)`
                           }}
                      />
                    </div>
                  )}

                  <div className="relative flex items-center gap-3 px-3 py-2">
                    <div className="relative">
                      <Icon className={`w-4 h-4 transition-all`}
                           style={{ 
                             color: isActive ? item.color : '#ffffff60',
                             filter: isActive ? `drop-shadow(0 0 8px ${item.color})` : 'none'
                           }} />
                    </div>
                    
                    <span className={`text-xs font-semibold tracking-wider transition-all ${
                      isActive 
                        ? 'text-white'
                        : 'text-white/60'
                    }`}>
                      {item.label}
                    </span>
                    
                    {isActive && (
                      <div className="ml-auto">
                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse`}
                             style={{ backgroundColor: item.color }} />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Platform Status - Fixed at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10 bg-black/95">
          <div className="bg-black/50 rounded-lg p-3 border border-white/10">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60 uppercase">Status</span>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                  <span className="text-xs text-blue-400">LIVE</span>
                </div>
              </div>
              
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/40">CMDB</span>
                  <span className="text-blue-400">100%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">SPLUNK</span>
                  <span className="text-purple-400">63.9%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">CHRONICLE</span>
                  <span className="text-blue-400">19.2%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;