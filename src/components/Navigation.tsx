// src/components/Navigation.tsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Shield, BarChart3, Database, Globe, Activity, Settings, Network, FileSearch, Layers, Eye, Cpu, Lock, Zap, Hexagon, Triangle, Server, Cloud, AlertTriangle, CheckCircle } from 'lucide-react';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

interface StatusData {
  cmdb_registration: string;
  database_status: string;
  total_assets: number;
  registered_assets: number;
  isLive: boolean;
  isCritical: boolean;
  compliance_status: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  description: string;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, onNavigate }) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [pulseAnimation, setPulseAnimation] = useState<Record<string, boolean>>({});
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);

  // Memoized navigation items
  const navItems: NavItem[] = useMemo(() => [
    { id: 'global-view', label: 'GLOBAL VIEW', icon: Globe, color: '#00d4ff', description: 'CMDB asset visibility globally' },
    { id: 'infrastructure', label: 'INFRASTRUCTURE', icon: Server, color: '#a855f7', description: 'Host visibility by infrastructure type' },
    { id: 'regional-country', label: 'REGIONAL', icon: Network, color: '#00d4ff', description: 'Geographic asset distribution' },
    { id: 'bu-application', label: 'BUSINESS UNITS', icon: Layers, color: '#a855f7', description: 'BU, CIO, APM, Application Class visibility' },
    { id: 'system-classification', label: 'SYSTEMS', icon: Cpu, color: '#00d4ff', description: 'System classification analysis' },
    { id: 'security-coverage', label: 'SECURITY', icon: Shield, color: '#a855f7', description: 'EDR, Tanium, DLP agent coverage' },
    { id: 'compliance', label: 'COMPLIANCE', icon: FileSearch, color: '#00d4ff', description: 'GSO and Splunk logging compliance' },
    { id: 'domain-visibility', label: 'DOMAINS', icon: Database, color: '#a855f7', description: 'Asset visibility by hostname/domain' },
    { id: 'logging-standards', label: 'STANDARDS', icon: Activity, color: '#00d4ff', description: 'Logging platform visibility analysis' }
  ], []);

  // Fetch status data with error handling
  const fetchStatus = useCallback(async () => {
    try {
      setConnectionError(false);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const [cmdbResponse, databaseResponse] = await Promise.all([
        fetch('http://localhost:5000/api/cmdb_presence', { signal: controller.signal }),
        fetch('http://localhost:5000/api/database_status', { signal: controller.signal })
      ]);

      clearTimeout(timeoutId);

      if (!cmdbResponse.ok || !databaseResponse.ok) {
        throw new Error('API response not OK');
      }

      const cmdb = await cmdbResponse.json();
      const database = await databaseResponse.json();

      const cmdbRate = cmdb.registration_rate || 0;
      
      setStatusData({
        cmdb_registration: `${cmdbRate.toFixed(1)}%`,
        database_status: database.status === 'connected' ? 'ONLINE' : 'OFFLINE',
        total_assets: database.total_records || 0,
        registered_assets: cmdb.cmdb_registered || 0,
        isLive: database.status === 'connected',
        isCritical: cmdbRate < 50,
        compliance_status: cmdb.compliance_analysis?.compliance_status || 'UNKNOWN'
      });
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch status:', error);
      setConnectionError(true);
      setStatusData({
        cmdb_registration: '0%',
        database_status: 'OFFLINE',
        total_assets: 0,
        registered_assets: 0,
        isLive: false,
        isCritical: true,
        compliance_status: 'ERROR'
      });
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Pulse animation for critical items
  useEffect(() => {
    if (statusData?.isCritical) {
      const criticalItems = ['global-view', 'security-coverage', 'compliance'];
      const interval = setInterval(() => {
        const randomItem = criticalItems[Math.floor(Math.random() * criticalItems.length)];
        setPulseAnimation(prev => ({ ...prev, [randomItem]: true }));
        
        setTimeout(() => {
          setPulseAnimation(prev => ({ ...prev, [randomItem]: false }));
        }, 1000);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [statusData?.isCritical]);

  // Status indicator component
  const StatusIndicator: React.FC<{ status: 'online' | 'offline' | 'critical' | 'loading' }> = ({ status }) => {
    const colors = {
      online: '#10b981',
      offline: '#6b7280',
      critical: '#ef4444',
      loading: '#f59e0b'
    };

    return (
      <div className="flex items-center gap-1">
        <div 
          className={`w-1.5 h-1.5 rounded-full ${status === 'loading' ? 'animate-pulse' : ''}`}
          style={{ 
            backgroundColor: colors[status],
            boxShadow: `0 0 8px ${colors[status]}` 
          }} 
        />
        <span 
          className="text-xs uppercase"
          style={{ color: colors[status] }}
        >
          {status === 'loading' ? 'LOADING' : status.toUpperCase()}
        </span>
      </div>
    );
  };

  // Get status type
  const getStatusType = (): 'online' | 'offline' | 'critical' | 'loading' => {
    if (loading) return 'loading';
    if (!statusData?.isLive || connectionError) return 'offline';
    if (statusData?.isCritical) return 'critical';
    return 'online';
  };

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
                CMDB VISIBILITY
              </p>
            </div>
          </div>
        </div>

        {/* Navigation items with scrollbar */}
        <div 
          className="overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
          style={{ height: 'calc(100% - 240px)' }}
        >
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
                  className={`
                    w-full group relative overflow-hidden rounded-lg 
                    transition-all duration-300 transform
                    ${isActive ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 scale-[1.02]' : 'bg-black/30 hover:bg-white/5'}
                  `}
                  style={{
                    border: `1px solid ${
                      isActive 
                        ? item.color === '#00d4ff' ? 'rgba(0, 212, 255, 0.3)' : 'rgba(168, 85, 247, 0.3)'
                        : 'transparent'
                    }`,
                    boxShadow: isActive || isHovered
                      ? `0 0 20px ${item.color === '#00d4ff' ? 'rgba(0, 212, 255, 0.1)' : 'rgba(168, 85, 247, 0.1)'}`
                      : 'none'
                  }}
                  title={item.description}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {/* Pulse animation overlay */}
                  {isPulsing && (
                    <div className="absolute inset-0 animate-ping">
                      <div 
                        className="h-full w-full rounded-lg"
                        style={{
                          background: `radial-gradient(circle, ${
                            item.color === '#00d4ff' ? 'rgba(0, 212, 255, 0.2)' : 'rgba(168, 85, 247, 0.2)'
                          } 0%, transparent 70%)`
                        }}
                      />
                    </div>
                  )}

                  <div className="relative flex items-center gap-3 px-3 py-2">
                    <Icon 
                      className="w-4 h-4 transition-all"
                      style={{ 
                        color: isActive ? item.color : '#ffffff60',
                        filter: isActive ? `drop-shadow(0 0 8px ${item.color})` : 'none',
                        transform: isHovered ? 'scale(1.1)' : 'scale(1)'
                      }} 
                    />
                    
                    <span 
                      className={`
                        text-xs font-semibold tracking-wider transition-all
                        ${isActive ? 'text-white' : 'text-white/60'}
                      `}
                    >
                      {item.label}
                    </span>
                    
                    {isActive && (
                      <div className="ml-auto">
                        <div 
                          className="w-1.5 h-1.5 rounded-full animate-pulse"
                          style={{ backgroundColor: item.color }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Hover effect gradient */}
                  {isHovered && !isActive && (
                    <div 
                      className="absolute inset-0 opacity-10 pointer-events-none"
                      style={{
                        background: `linear-gradient(90deg, ${item.color}22, transparent)`
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Platform Status Panel */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10 bg-black/95">
          <div className="bg-black/50 rounded-lg p-3 border border-white/10">
            <div className="space-y-2">
              {/* Status Header */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60 uppercase">CMDB Status</span>
                <StatusIndicator status={getStatusType()} />
              </div>
              
              {/* Metrics */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-white/40">REGISTRATION</span>
                  <span 
                    className={`font-mono ${
                      loading ? 'text-gray-400' : 
                      statusData?.isCritical ? 'text-red-400' : 'text-cyan-400'
                    }`}
                  >
                    {loading ? '...' : statusData?.cmdb_registration || '0%'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/40">DATABASE</span>
                  <span 
                    className={`font-mono ${
                      loading ? 'text-gray-400' :
                      statusData?.database_status === 'ONLINE' ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {loading ? '...' : statusData?.database_status || 'OFFLINE'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/40">ASSETS</span>
                  <span className="text-purple-400 font-mono">
                    {loading ? '...' : statusData?.total_assets?.toLocaleString() || '0'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/40">REGISTERED</span>
                  <span className="text-cyan-400 font-mono">
                    {loading ? '...' : statusData?.registered_assets?.toLocaleString() || '0'}
                  </span>
                </div>
              </div>

              {/* Critical Alert */}
              {!loading && statusData?.isCritical && (
                <div className="mt-2 p-1.5 bg-red-500/10 border border-red-500/30 rounded animate-pulse">
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-red-400" />
                    <div className="text-[10px] text-red-400 font-bold">CRITICAL</div>
                  </div>
                  <div className="text-[9px] text-red-400">Registration below 50%</div>
                </div>
              )}

              {/* Connection Error */}
              {connectionError && (
                <div className="mt-2 p-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded">
                  <div className="text-[10px] text-yellow-400">Connection Error</div>
                  <div className="text-[9px] text-yellow-400/80">Check API server</div>
                </div>
              )}

              {/* Compliance Status */}
              {!loading && statusData?.compliance_status && (
                <div className="mt-2 text-center pt-2 border-t border-white/10">
                  <div className="text-[9px] text-white/40 uppercase">Compliance</div>
                  <div 
                    className={`text-[10px] font-bold ${
                      statusData.compliance_status === 'COMPLIANT' ? 'text-green-400' :
                      statusData.compliance_status === 'PARTIAL' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}
                  >
                    {statusData.compliance_status === 'COMPLIANT' && <CheckCircle className="inline w-3 h-3 mr-1" />}
                    {statusData.compliance_status}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;