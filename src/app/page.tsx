'use client';

import React, { useState, useEffect } from 'react';
import LoadingScreen from '@/components/LoadingScreen';
import LoginScreen from '@/components/LoginScreen';
import Navigation from '@/components/Navigation';
import Dashboard from '@/components/Dashboard';
import VisibilityMatrix from '@/components/pages/VisibilityMatrix';
import LogSources from '@/components/pages/LogSources';
import CompliancePage from '@/components/pages/CompliancePage';
import ThreatsPage from '@/components/pages/ThreatsPage';
import VisibilityGapsPage from '@/components/pages/VisibilityGapsPage';
import NetworkTopologyPage from '@/components/pages/NetworkTopologyPage';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<string>('');
  const [currentPage, setCurrentPage] = useState('overview');

  useEffect(() => {
    const savedUser = typeof window !== 'undefined' ? localStorage.getItem('cyberUser') : null;
    if (savedUser) {
      setUser(savedUser);
      setAuthenticated(true);
      setLoading(false);
    }
  }, []);

  const handleLoadingComplete = () => {
    setLoading(false);
  };

  const handleLogin = (username: string) => {
    setUser(username);
    setAuthenticated(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cyberUser', username);
    }
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch(currentPage) {
      case 'overview':
        return <Dashboard user={user} />;
      case 'visibility':
        return <VisibilityMatrix />;
      case 'logsources':
        return <LogSources />;
      case 'compliance':
        return <CompliancePage />;
      case 'threats':
        return <ThreatsPage />;
      case 'gaps':
        return <VisibilityGapsPage />;
      case 'topology':
        return <NetworkTopologyPage />;
      case 'settings':
        return <SettingsPage user={user} />;
      default:
        return <Dashboard user={user} />;
    }
  };

  if (loading && !authenticated) {
    return <LoadingScreen onComplete={handleLoadingComplete} />;
  }

  if (!authenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900/5 via-purple-900/5 to-pink-900/5"></div>
      <div className="fixed inset-0" style={{
        backgroundImage: `linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }}></div>
      
      {/* Navigation Sidebar */}
      <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
      
      {/* Main Content Area */}
      <div className="ml-64">
        {/* Header */}
        <header className="backdrop-blur-xl bg-black/60 border-b border-cyan-400/20 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-cyan-400" style={{ fontFamily: 'Orbitron, monospace' }}>
                {currentPage === 'overview' && 'DASHBOARD OVERVIEW'}
                {currentPage === 'visibility' && 'VISIBILITY MATRIX'}
                {currentPage === 'logsources' && 'LOG SOURCE MANAGEMENT'}
                {currentPage === 'compliance' && 'COMPLIANCE TRACKING'}
                {currentPage === 'threats' && 'THREAT INTELLIGENCE'}
                {currentPage === 'gaps' && 'GAP ANALYSIS'}
                {currentPage === 'topology' && 'NETWORK TOPOLOGY'}
                {currentPage === 'settings' && 'SYSTEM SETTINGS'}
              </h2>
              <p className="text-xs text-cyan-400/60 font-mono">
                Real-time Security Visibility Platform • CSOC Integration
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm font-mono text-cyan-400/60">
                {new Date().toLocaleTimeString()}
              </div>
              <div className="flex items-center gap-2 backdrop-blur-xl bg-purple-400/10 px-4 py-2 rounded-lg border border-purple-400/30">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-mono text-purple-400">{user.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="relative">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

// Settings Page Component
const SettingsPage: React.FC<{user: string}> = ({ user }) => {
  const [notifications, setNotifications] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState('high');
  const [dataRetention, setDataRetention] = useState('90');

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-2" style={{
          fontFamily: 'Orbitron, monospace',
          background: 'linear-gradient(135deg, #a855f7, #ff00ff, #ff00aa)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          SYSTEM SETTINGS
        </h1>
        <p className="text-purple-400/60 font-mono text-sm">
          Configure platform settings and user preferences
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* User Profile */}
        <div className="backdrop-blur-xl bg-black/40 rounded-xl border border-purple-400/30 p-6"
             style={{ boxShadow: '0 0 40px rgba(168, 85, 247, 0.1), inset 0 0 40px rgba(0, 0, 0, 0.5)' }}>
          <h2 className="text-xl font-bold text-purple-400 mb-4" style={{ fontFamily: 'Orbitron, monospace' }}>
            USER PROFILE
          </h2>
          <div className="space-y-4">
            <div className="bg-black/30 rounded-lg p-4">
              <div className="text-xs text-purple-400/60 mb-1">USERNAME</div>
              <div className="font-mono text-purple-400">{user.toUpperCase()}</div>
            </div>
            <div className="bg-black/30 rounded-lg p-4">
              <div className="text-xs text-purple-400/60 mb-1">CLEARANCE LEVEL</div>
              <div className="font-mono text-purple-400">OMEGA</div>
            </div>
            <div className="bg-black/30 rounded-lg p-4">
              <div className="text-xs text-purple-400/60 mb-1">LAST ACCESS</div>
              <div className="font-mono text-purple-400">{new Date().toLocaleString()}</div>
            </div>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('cyberUser');
                  window.location.reload();
                }
              }}
              className="w-full bg-red-400/10 border border-red-400/30 text-red-400 font-mono font-bold py-3 rounded-lg hover:bg-red-400/20 transition-all"
            >
              LOGOUT
            </button>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="backdrop-blur-xl bg-black/40 rounded-xl border border-cyan-400/30 p-6"
             style={{ boxShadow: '0 0 40px rgba(0, 255, 255, 0.1), inset 0 0 40px rgba(0, 0, 0, 0.5)' }}>
          <h2 className="text-xl font-bold text-cyan-400 mb-4" style={{ fontFamily: 'Orbitron, monospace' }}>
            ALERT CONFIGURATION
          </h2>
          <div className="space-y-4">
            <div className="bg-black/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono text-cyan-400">Enable Notifications</span>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    notifications ? 'bg-green-400' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                    notifications ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
            <div className="bg-black/30 rounded-lg p-4">
              <div className="text-xs text-cyan-400/60 mb-2">ALERT THRESHOLD</div>
              <select 
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(e.target.value)}
                className="w-full bg-black/50 border border-cyan-400/30 text-cyan-400 font-mono p-2 rounded"
              >
                <option value="low">LOW - All Events</option>
                <option value="medium">MEDIUM - Important</option>
                <option value="high">HIGH - Critical Only</option>
              </select>
            </div>
            <div className="bg-black/30 rounded-lg p-4">
              <div className="text-xs text-cyan-400/60 mb-2">DATA RETENTION (DAYS)</div>
              <select 
                value={dataRetention}
                onChange={(e) => setDataRetention(e.target.value)}
                className="w-full bg-black/50 border border-cyan-400/30 text-cyan-400 font-mono p-2 rounded"
              >
                <option value="30">30 DAYS</option>
                <option value="60">60 DAYS</option>
                <option value="90">90 DAYS</option>
                <option value="180">180 DAYS</option>
                <option value="365">365 DAYS</option>
              </select>
            </div>
          </div>
        </div>

        {/* Platform Integration */}
        <div className="backdrop-blur-xl bg-black/40 rounded-xl border border-green-400/30 p-6"
             style={{ boxShadow: '0 0 40px rgba(0, 255, 136, 0.1), inset 0 0 40px rgba(0, 0, 0, 0.5)' }}>
          <h2 className="text-xl font-bold text-green-400 mb-4" style={{ fontFamily: 'Orbitron, monospace' }}>
            PLATFORM INTEGRATION STATUS
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
              <span className="font-mono text-green-400">CSOC/GSO</span>
              <span className="text-xs font-mono text-green-400 bg-green-400/10 px-2 py-1 rounded">CONNECTED</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
              <span className="font-mono text-green-400">Splunk Enterprise</span>
              <span className="text-xs font-mono text-green-400 bg-green-400/10 px-2 py-1 rounded">CONNECTED</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
              <span className="font-mono text-yellow-400">Chronicle</span>
              <span className="text-xs font-mono text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded">PARTIAL</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
              <span className="font-mono text-red-400">DuckDB</span>
              <span className="text-xs font-mono text-red-400 bg-red-400/10 px-2 py-1 rounded">PENDING</span>
            </div>
          </div>
        </div>

        {/* System Stats */}
        <div className="backdrop-blur-xl bg-black/40 rounded-xl border border-orange-400/30 p-6"
             style={{ boxShadow: '0 0 40px rgba(255, 136, 0, 0.1), inset 0 0 40px rgba(0, 0, 0, 0.5)' }}>
          <h2 className="text-xl font-bold text-orange-400 mb-4" style={{ fontFamily: 'Orbitron, monospace' }}>
            SYSTEM PERFORMANCE
          </h2>
          <div className="space-y-3">
            <div className="bg-black/30 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-orange-400/60">CPU USAGE</span>
                <span className="text-sm font-mono text-orange-400">42%</span>
              </div>
              <div className="h-2 bg-black/50 rounded-full mt-2">
                <div className="h-full bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full" style={{width: '42%'}} />
              </div>
            </div>
            <div className="bg-black/30 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-orange-400/60">MEMORY</span>
                <span className="text-sm font-mono text-orange-400">68%</span>
              </div>
              <div className="h-2 bg-black/50 rounded-full mt-2">
                <div className="h-full bg-gradient-to-r from-orange-400 to-red-400 rounded-full" style={{width: '68%'}} />
              </div>
            </div>
            <div className="bg-black/30 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-orange-400/60">STORAGE</span>
                <span className="text-sm font-mono text-orange-400">2.4TB / 5TB</span>
              </div>
              <div className="h-2 bg-black/50 rounded-full mt-2">
                <div className="h-full bg-gradient-to-r from-green-400 to-cyan-400 rounded-full" style={{width: '48%'}} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};