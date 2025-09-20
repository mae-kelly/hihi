'use client';

import React, { useState, useEffect } from 'react';
import LoadingScreen from '@/components/LoadingScreen';
import LoginScreen from '@/components/LoginScreen';
import Navigation from '@/components/Navigation';
import AO1Dashboard from '@/components/AO1Dashboard';
import GlobalVisibility from '@/components/pages/GlobalVisibility';
import InfrastructureView from '@/components/pages/InfrastructureView';
import RegionalCountryView from '@/components/pages/RegionalCountryView';
import SystemClassification from '@/components/pages/SystemClassification';
import SecurityCoverage from '@/components/pages/SecurityCoverage';
import ComplianceMatrix from '@/components/pages/ComplianceMatrix';
import DomainVisibility from '@/components/pages/DomainVisibility';
import LoggingStandards from '@/components/pages/LoggingStandards';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<string>('');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('00:00:00');

  useEffect(() => {
    setMounted(true);
    const savedUser = typeof window !== 'undefined' ? localStorage.getItem('ao1User') : null;
    if (savedUser) {
      setUser(savedUser);
      setAuthenticated(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: false 
      }));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [mounted]);

  const handleLoadingComplete = () => {
    setLoading(false);
  };

  const handleLogin = (username: string) => {
    setUser(username);
    setAuthenticated(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ao1User', username);
    }
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch(currentPage) {
      case 'dashboard':
        return <AO1Dashboard user={user} />;
      case 'global-visibility':
        return <GlobalVisibility />;
      case 'infrastructure':
        return <InfrastructureView />;
      case 'regional-country':
        return <RegionalCountryView />;
      case 'system-classification':
        return <SystemClassification />;
      case 'security-coverage':
        return <SecurityCoverage />;
      case 'compliance':
        return <ComplianceMatrix />;
      case 'domain-visibility':
        return <DomainVisibility />;
      case 'logging-standards':
        return <LoggingStandards />;
      default:
        return <AO1Dashboard user={user} />;
    }
  };

  if (!mounted) {
    return null;
  }

  if (loading && !authenticated) {
    return <LoadingScreen onComplete={handleLoadingComplete} />;
  }

  if (!authenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0">
        <div className="quantum-grid" />
      </div>
      
      <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
      
      <div className="ml-72">
        <header className="relative z-20">
          <div className="glass-panel border-b border-cyan-400/10 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold">
                  <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {currentPage === 'dashboard' && 'AO1 LOG VISIBILITY MEASUREMENT'}
                    {currentPage === 'global-visibility' && 'GLOBAL VIEW - CSOC VISIBILITY'}
                    {currentPage === 'infrastructure' && 'INFRASTRUCTURE TYPE ANALYSIS'}
                    {currentPage === 'regional-country' && 'REGIONAL & COUNTRY VIEW'}
                    {currentPage === 'system-classification' && 'SYSTEM CLASSIFICATION'}
                    {currentPage === 'security-coverage' && 'SECURITY CONTROL COVERAGE'}
                    {currentPage === 'compliance' && 'GSO & SPLUNK COMPLIANCE'}
                    {currentPage === 'domain-visibility' && 'DOMAIN VISIBILITY MATRIX'}
                    {currentPage === 'logging-standards' && 'LOGGING STANDARDS'}
                  </span>
                </h2>
                <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">
                  Fiserv Cybersecurity Logging Standard • Real-Time Visibility Measurement
                </p>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="glass-panel px-4 py-2 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-cyan-300">
                      CMDB: CONNECTED
                    </span>
                  </div>
                </div>
                
                <div className="glass-panel px-4 py-2 rounded-xl">
                  <span className="text-sm font-medium">
                    <span className="text-purple-300">AGENT:</span>
                    <span className="text-cyan-300 ml-2">{user.toUpperCase()}</span>
                  </span>
                </div>
                
                <div className="text-xs font-mono text-pink-400/60">
                  {currentTime}
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <main className="relative z-10">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}