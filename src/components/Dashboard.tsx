import React, { useState, useEffect } from 'react';
import { Shield, Activity, AlertTriangle, Database, Server, Cloud, Wifi, Terminal, Zap, Globe, Lock, Eye, Target, TrendingUp, Users, BarChart3, AlertCircle, ChevronRight, Monitor, Cpu, HardDrive, Network } from 'lucide-react';
import { DashboardData, SystemVisibility } from '@/types';
import { generateMockDashboardData, generateTimeSeriesData } from '@/data/mockData';

interface DashboardProps {
  user: string;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [selectedSystem, setSelectedSystem] = useState<SystemVisibility | null>(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [refreshing, setRefreshing] = useState(false);
  const [threatPulse, setThreatPulse] = useState(false);

  useEffect(() => {
    setData(generateMockDashboardData());

    const interval = setInterval(() => {
      setData(generateMockDashboardData());
      setThreatPulse(true);
      setTimeout(() => setThreatPulse(false), 1000);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setData(generateMockDashboardData());
      setRefreshing(false);
    }, 1000);
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-cyan-400 font-mono animate-pulse">LOADING SECURITY DATA...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-cyan-400 overflow-x-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900/5 via-purple-900/5 to-pink-900/5"></div>
      <div className="fixed inset-0" style={{
        backgroundImage: `linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }}></div>
      
      {/* Header */}
      <header className="relative backdrop-blur-xl bg-black/60 border-b border-cyan-400/20 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Shield className="w-8 h-8 text-cyan-400" />
                  <div className="absolute -inset-1 bg-cyan-400/20 blur-lg"></div>
                </div>
                <h1 className="text-3xl font-black" style={{
                  fontFamily: 'Orbitron, monospace',
                  background: 'linear-gradient(135deg, #00ffff, #00d4ff, #a855f7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  CYBERVISION <span className="text-pink-400">5000</span>
                </h1>
              </div>
              <div className="h-8 w-px bg-cyan-400/30"></div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                <span className="text-green-400 text-sm font-mono font-bold">SYSTEM ONLINE</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={handleRefresh}
                className={`backdrop-blur-xl bg-black/40 px-5 py-2.5 rounded-lg border border-cyan-400/30 hover:border-cyan-400 hover:bg-cyan-400/10 transition-all flex items-center gap-2 ${refreshing ? 'animate-spin' : ''}`}
                style={{ boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.5)' }}
              >
                <Zap className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-mono font-bold text-cyan-400">REFRESH</span>
              </button>
              
              <div className="flex items-center gap-3 backdrop-blur-xl bg-purple-400/10 px-5 py-2.5 rounded-lg border border-purple-400/30">
                <Lock className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-mono font-bold text-purple-400">{user.toUpperCase()}</span>
                <span className="text-xs text-purple-400/60 font-mono">OMEGA</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 p-6">
        {/* Top metrics cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="backdrop-blur-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl p-6 border border-cyan-400/30 hover:border-cyan-400/60 transition-all group"
               style={{ boxShadow: '0 0 30px rgba(0, 255, 255, 0.1), inset 0 0 30px rgba(0, 0, 0, 0.5)' }}>
            <div className="flex items-center justify-between mb-3">
              <Eye className="w-6 h-6 text-cyan-400 group-hover:animate-pulse" />
              <span className="text-xs font-mono text-cyan-400/60 uppercase tracking-wider">Visibility</span>
            </div>
            <div className="text-4xl font-black font-mono text-cyan-400" style={{ textShadow: '0 0 20px currentColor' }}>
              {data.overallVisibility.toFixed(1)}%
            </div>
            <div className="mt-3 h-2 bg-black/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 relative"
                style={{ width: `${data.overallVisibility}%` }}
              >
                <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-400/30 hover:border-purple-400/60 transition-all group"
               style={{ boxShadow: '0 0 30px rgba(168, 85, 247, 0.1), inset 0 0 30px rgba(0, 0, 0, 0.5)' }}>
            <div className="flex items-center justify-between mb-3">
              <Server className="w-6 h-6 text-purple-400 group-hover:animate-pulse" />
              <span className="text-xs font-mono text-purple-400/60 uppercase tracking-wider">Systems</span>
            </div>
            <div className="text-4xl font-black font-mono text-purple-400" style={{ textShadow: '0 0 20px currentColor' }}>
              {data.systemsMonitored}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-xs font-mono text-green-400">+12 this week</span>
            </div>
          </div>

          <div className={`backdrop-blur-xl bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-xl p-6 border transition-all group ${
            threatPulse ? 'border-red-400 animate-pulse shadow-lg shadow-red-400/50' : 'border-red-400/30 hover:border-red-400/60'
          }`} style={{ boxShadow: `0 0 30px rgba(255, 0, 68, ${threatPulse ? 0.3 : 0.1}), inset 0 0 30px rgba(0, 0, 0, 0.5)` }}>
            <div className="flex items-center justify-between mb-3">
              <AlertTriangle className="w-6 h-6 text-red-400 group-hover:animate-pulse" />
              <span className="text-xs font-mono text-red-400/60 uppercase tracking-wider">Threats</span>
            </div>
            <div className="text-4xl font-black font-mono text-red-400" style={{ textShadow: '0 0 20px currentColor' }}>
              {data.activeThreats}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-400 animate-pulse" />
              <span className="text-xs font-mono text-orange-400">2 critical</span>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/10 to-cyan-500/10 rounded-xl p-6 border border-green-400/30 hover:border-green-400/60 transition-all group"
               style={{ boxShadow: '0 0 30px rgba(0, 255, 136, 0.1), inset 0 0 30px rgba(0, 0, 0, 0.5)' }}>
            <div className="flex items-center justify-between mb-3">
              <Shield className="w-6 h-6 text-green-400 group-hover:animate-pulse" />
              <span className="text-xs font-mono text-green-400/60 uppercase tracking-wider">Compliance</span>
            </div>
            <div className="text-4xl font-black font-mono text-green-400" style={{ textShadow: '0 0 20px currentColor' }}>
              {data.complianceScore.toFixed(1)}%
            </div>
            <div className="mt-3 h-2 bg-black/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-cyan-400 relative"
                style={{ width: `${data.complianceScore}%` }}
              >
                <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* System Visibility Matrix */}
          <div className="backdrop-blur-xl bg-black/40 rounded-xl border border-cyan-400/30"
               style={{ boxShadow: '0 0 40px rgba(0, 255, 255, 0.1), inset 0 0 40px rgba(0, 0, 0, 0.5)' }}>
            <div className="p-6 border-b border-cyan-400/20">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-cyan-400" style={{ fontFamily: 'Orbitron, monospace' }}>
                  SYSTEM VISIBILITY MATRIX
                </h2>
                <Database className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
            </div>
            
            <div className="p-6 space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              {data.systems.map((system) => (
                <div
                  key={system.name}
                  className="backdrop-blur bg-black/30 rounded-lg p-4 border border-cyan-400/10 hover:border-cyan-400/30 hover:bg-cyan-400/5 transition-all cursor-pointer group"
                  onClick={() => setSelectedSystem(system)}
                  style={{ boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.5)' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        system.status === 'secure' ? 'bg-green-400 shadow-lg shadow-green-400/50' :
                        system.status === 'warning' ? 'bg-orange-400 shadow-lg shadow-orange-400/50' :
                        system.status === 'critical' ? 'bg-red-400 shadow-lg shadow-red-400/50 animate-pulse' : 
                        'bg-gray-500'
                      }`} />
                      <span className="text-sm font-mono font-bold text-cyan-300 group-hover:text-cyan-400">
                        {system.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-xs text-cyan-400/60">Coverage</span>
                        <p className="text-sm font-mono font-bold text-green-400">{system.coverage}%</p>
                      </div>
                      {system.threats > 0 && (
                        <div className="flex items-center gap-1 bg-red-400/10 px-2 py-1 rounded">
                          <AlertTriangle className="w-3 h-3 text-red-400" />
                          <span className="text-xs font-mono text-red-400">{system.threats}</span>
                        </div>
                      )}
                      <ChevronRight className="w-4 h-4 text-cyan-400/30 group-hover:text-cyan-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Threat Intelligence Panel */}
          <div className="backdrop-blur-xl bg-black/40 rounded-xl border border-purple-400/30"
               style={{ boxShadow: '0 0 40px rgba(168, 85, 247, 0.1), inset 0 0 40px rgba(0, 0, 0, 0.5)' }}>
            <div className="p-6 border-b border-purple-400/20">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-purple-400" style={{ fontFamily: 'Orbitron, monospace' }}>
                  THREAT INTELLIGENCE
                </h2>
                <Target className="w-5 h-5 text-purple-400 animate-pulse" />
              </div>
            </div>
            
            <div className="p-6 space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              {data.threats.map((threat) => (
                <div
                  key={threat.id}
                  className="backdrop-blur bg-black/30 rounded-lg p-4 border border-purple-400/10 hover:border-purple-400/30 hover:bg-purple-400/5 transition-all"
                  style={{ boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.5)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                        threat.severity === 'critical' ? 'bg-red-400/20 text-red-400 border border-red-400/30' :
                        threat.severity === 'high' ? 'bg-orange-400/20 text-orange-400 border border-orange-400/30' :
                        threat.severity === 'medium' ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30' :
                        'bg-blue-400/20 text-blue-400 border border-blue-400/30'
                      }`}>
                        {threat.severity.toUpperCase()}
                      </div>
                      <span className="text-sm font-mono text-cyan-300">{threat.type}</span>
                    </div>
                    <div className={`px-3 py-1 rounded text-xs font-mono font-bold ${
                      threat.status === 'active' ? 'bg-red-400/10 text-red-400 animate-pulse' :
                      threat.status === 'investigating' ? 'bg-orange-400/10 text-orange-400' :
                      'bg-green-400/10 text-green-400'
                    }`}>
                      {threat.status.toUpperCase()}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-purple-400/60">
                    <span className="font-mono">Source: {threat.source}</span>
                    <span className="font-mono">{threat.affectedSystems} systems affected</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Real-time metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="backdrop-blur-xl bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-xl p-5 border border-cyan-400/30"
               style={{ boxShadow: '0 0 30px rgba(0, 255, 255, 0.1), inset 0 0 30px rgba(0, 0, 0, 0.5)' }}>
            <div className="flex items-center justify-between mb-3">
              <Activity className="w-5 h-5 text-cyan-400" />
              <span className="text-xs font-mono text-cyan-400/60">EVENTS/SEC</span>
            </div>
            <div className="text-3xl font-black font-mono text-cyan-400">
              {data.metrics.eventsPerSecond.toLocaleString()}
            </div>
            <div className="mt-3 h-8 bg-black/50 rounded flex items-end p-1 gap-px">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-cyan-400 to-blue-400 rounded-t"
                  style={{
                    height: `${Math.random() * 100}%`,
                    animation: `pulse ${1 + Math.random()}s ease-in-out infinite`,
                    animationDelay: `${i * 50}ms`
                  }}
                />
              ))}
            </div>
          </div>

          <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-xl p-5 border border-purple-400/30"
               style={{ boxShadow: '0 0 30px rgba(168, 85, 247, 0.1), inset 0 0 30px rgba(0, 0, 0, 0.5)' }}>
            <div className="flex items-center justify-between mb-3">
              <Database className="w-5 h-5 text-purple-400" />
              <span className="text-xs font-mono text-purple-400/60">DATA</span>
            </div>
            <div className="text-3xl font-black font-mono text-purple-400">{data.metrics.dataIngested}</div>
            <div className="mt-3 text-xs font-mono text-purple-400/60">Per 24 hours</div>
          </div>

          <div className="backdrop-blur-xl bg-gradient-to-br from-orange-500/5 to-red-500/5 rounded-xl p-5 border border-orange-400/30"
               style={{ boxShadow: '0 0 30px rgba(255, 136, 0, 0.1), inset 0 0 30px rgba(0, 0, 0, 0.5)' }}>
            <div className="flex items-center justify-between mb-3">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              <span className="text-xs font-mono text-orange-400/60">ALERTS</span>
            </div>
            <div className="text-3xl font-black font-mono text-orange-400">{data.metrics.alertsGenerated}</div>
            <div className="mt-3 text-xs font-mono text-orange-400/60">Last 24 hours</div>
          </div>

          <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/5 to-cyan-500/5 rounded-xl p-5 border border-green-400/30"
               style={{ boxShadow: '0 0 30px rgba(0, 255, 136, 0.1), inset 0 0 30px rgba(0, 0, 0, 0.5)' }}>
            <div className="flex items-center justify-between mb-3">
              <Zap className="w-5 h-5 text-green-400" />
              <span className="text-xs font-mono text-green-400/60">MTTR</span>
            </div>
            <div className="text-3xl font-black font-mono text-green-400">{data.metrics.mttr} min</div>
            <div className="mt-3 text-xs font-mono text-green-400/60">Response time</div>
          </div>
        </div>
      </main>

      {/* System detail modal */}
      {selectedSystem && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedSystem(null)}
        >
          <div 
            className="backdrop-blur-xl bg-black/60 rounded-xl border border-cyan-400/30 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
            style={{ boxShadow: '0 0 60px rgba(0, 255, 255, 0.3), inset 0 0 40px rgba(0, 0, 0, 0.5)' }}
          >
            <div className="p-6 border-b border-cyan-400/20">
              <h3 className="text-2xl font-bold text-cyan-400" style={{ fontFamily: 'Orbitron, monospace' }}>
                {selectedSystem.name}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                <span className="text-sm font-mono text-cyan-400/60">Coverage</span>
                <span className="text-lg font-bold font-mono text-green-400">{selectedSystem.coverage}%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                <span className="text-sm font-mono text-cyan-400/60">Status</span>
                <span className={`text-lg font-bold font-mono ${
                  selectedSystem.status === 'secure' ? 'text-green-400' :
                  selectedSystem.status === 'warning' ? 'text-orange-400' :
                  'text-red-400'
                }`}>{selectedSystem.status.toUpperCase()}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                <span className="text-sm font-mono text-cyan-400/60">Active Threats</span>
                <span className="text-lg font-bold font-mono text-orange-400">{selectedSystem.threats}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                <span className="text-sm font-mono text-cyan-400/60">Last Scan</span>
                <span className="text-sm font-mono text-cyan-300">
                  {new Date(selectedSystem.lastScan).toLocaleTimeString()}
                </span>
              </div>
            </div>
            <div className="p-6 pt-0">
              <button
                onClick={() => setSelectedSystem(null)}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-bold py-3 rounded-lg hover:from-cyan-400 hover:to-blue-400 transition-all"
                style={{ boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)' }}
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 212, 255, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #00d4ff, #a855f7);
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;