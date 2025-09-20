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
    { id: 'dashboard', label: 'AO1 DASHBOARD', icon: BarChart3, color: 'cyan' },
    { id: 'global-visibility', label: 'GLOBAL VIEW', icon: Globe, color: 'purple' },
    { id: 'infrastructure', label: 'INFRASTRUCTURE', icon: Server, color: 'cyan' },
    { id: 'regional-country', label: 'REGIONAL', icon: Network, color: 'purple' },
    { id: 'system-classification', label: 'SYSTEMS', icon: Cpu, color: 'pink' },
    { id: 'security-coverage', label: 'SECURITY', icon: Shield, color: 'cyan' },
    { id: 'compliance', label: 'COMPLIANCE', icon: FileSearch, color: 'purple' },
    { id: 'domain-visibility', label: 'DOMAINS', icon: Database, color: 'pink' },
    { id: 'logging-standards', label: 'STANDARDS', icon: Activity, color: 'cyan' },
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
    <nav className="fixed left-0 top-0 h-full w-72 z-40">
      <div className="h-full glass-panel border-r border-cyan-400/10">
        {/* Header */}
        <div className="p-6 border-b border-cyan-400/10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Hexagon className="w-12 h-12 text-cyan-400" />
              <div className="absolute inset-0 w-12 h-12 animate-pulse">
                <Hexagon className="w-12 h-12 text-cyan-400/30" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  AO1
                </span>
              </h1>
              <p className="text-xs text-pink-400/60 uppercase tracking-widest">
                Log Visibility
              </p>
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <div className="p-4 space-y-2">
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
                className={`w-full group relative overflow-hidden rounded-xl transition-all duration-300 ${
                  isActive 
                    ? 'scale-105' 
                    : 'scale-100 hover:scale-102'
                }`}
                style={{
                  background: isActive 
                    ? `linear-gradient(135deg, 
                        ${item.color === 'cyan' ? 'rgba(0, 255, 255, 0.1)' :
                          item.color === 'purple' ? 'rgba(192, 132, 252, 0.1)' :
                          'rgba(255, 0, 255, 0.1)'} 0%, 
                        rgba(0, 0, 0, 0.3) 100%)`
                    : 'rgba(0, 0, 0, 0.3)',
                  border: `1px solid ${
                    isActive 
                      ? item.color === 'cyan' ? 'rgba(0, 255, 255, 0.3)' :
                        item.color === 'purple' ? 'rgba(192, 132, 252, 0.3)' :
                        'rgba(255, 0, 255, 0.3)'
                      : 'transparent'
                  }`,
                  boxShadow: isActive || isHovered
                    ? `0 0 30px ${
                        item.color === 'cyan' ? 'rgba(0, 255, 255, 0.2)' :
                        item.color === 'purple' ? 'rgba(192, 132, 252, 0.2)' :
                        'rgba(255, 0, 255, 0.2)'
                      }`
                    : 'none'
                }}
              >
                {isPulsing && (
                  <div className="absolute inset-0 animate-ping">
                    <div className="h-full w-full rounded-xl"
                         style={{
                           background: `radial-gradient(circle, 
                             ${item.color === 'cyan' ? 'rgba(0, 255, 255, 0.3)' :
                               item.color === 'purple' ? 'rgba(192, 132, 252, 0.3)' :
                               'rgba(255, 0, 255, 0.3)'} 0%, 
                             transparent 70%)`
                         }}
                    />
                  </div>
                )}

                <div className="relative flex items-center gap-4 px-4 py-3">
                  <div className="relative">
                    <Icon className={`w-5 h-5 transition-all ${
                      item.color === 'cyan' ? 'text-cyan-400' :
                      item.color === 'purple' ? 'text-purple-400' :
                      'text-pink-400'
                    } ${isActive ? 'drop-shadow-[0_0_10px_currentColor]' : ''}`} />
                    
                    {isActive && (
                      <div className="absolute inset-0 w-5 h-5 animate-pulse">
                        <Icon className={`w-5 h-5 ${
                          item.color === 'cyan' ? 'text-cyan-400/30' :
                          item.color === 'purple' ? 'text-purple-400/30' :
                          'text-pink-400/30'
                        }`} />
                      </div>
                    )}
                  </div>
                  
                  <span className={`text-sm font-semibold tracking-wider transition-all ${
                    isActive 
                      ? item.color === 'cyan' ? 'text-cyan-300' :
                        item.color === 'purple' ? 'text-purple-300' :
                        'text-pink-300'
                      : 'text-gray-400'
                  }`}>
                    {item.label}
                  </span>
                  
                  {isActive && (
                    <div className="ml-auto flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full animate-pulse ${
                        item.color === 'cyan' ? 'bg-cyan-400' :
                        item.color === 'purple' ? 'bg-purple-400' :
                        'bg-pink-400'
                      }`} />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Platform Status */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-cyan-400/10">
          <div className="glass-panel rounded-xl p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-cyan-400/60 uppercase">Platform Status</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs text-green-400">LIVE</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">CMDB</span>
                  <span className="text-cyan-400">CONNECTED</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">SPLUNK</span>
                  <span className="text-purple-400">SYNCED</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">CHRONICLE</span>
                  <span className="text-pink-400">ACTIVE</span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="text-center">
                  <Cpu className="w-4 h-4 mx-auto mb-1 text-cyan-400/60" />
                  <span className="text-xs text-gray-500">42%</span>
                </div>
                <div className="text-center">
                  <Zap className="w-4 h-4 mx-auto mb-1 text-purple-400/60" />
                  <span className="text-xs text-gray-500">2.4TB</span>
                </div>
                <div className="text-center">
                  <Globe className="w-4 h-4 mx-auto mb-1 text-pink-400/60" />
                  <span className="text-xs text-gray-500">262K</span>
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