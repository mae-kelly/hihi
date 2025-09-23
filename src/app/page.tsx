'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import GlobalView from '@/components/pages/GlobalView';
import InfrastructureView from '@/components/pages/InfrastructureView';
import RegionalCountryView from '@/components/pages/RegionalCountryView';
import BUandApplicationView from '@/components/pages/BUandApplicationView';
import SystemClassification from '@/components/pages/SystemClassification';
import SecurityControlCoverage from '@/components/pages/SecurityControlCoverage';
import ComplianceMatrix from '@/components/pages/ComplianceMatrix';
import DomainVisibility from '@/components/pages/DomainVisibility';
import LoggingStandards from '@/components/pages/LoggingStandards';

export default function Home() {
  const [currentPage, setCurrentPage] = useState('global-view');
  const [currentTime, setCurrentTime] = useState<string>('00:00:00');

  useEffect(() => {
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
  }, []);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch(currentPage) {
      case 'global-view':
        return <GlobalView />;
      case 'infrastructure':
        return <InfrastructureView />;
      case 'regional-country':
        return <RegionalCountryView />;
      case 'bu-application':
        return <BUandApplicationView />;
      case 'system-classification':
        return <SystemClassification />;
      case 'security-coverage':
        return <SecurityControlCoverage />;
      case 'compliance':
        return <ComplianceMatrix />;
      case 'domain-visibility':
        return <DomainVisibility />;
      case 'logging-standards':
        return <LoggingStandards />;
      default:
        return <GlobalView />;
    }
  };

  const getPageTitle = () => {
    switch(currentPage) {
      case 'global-view': return 'GLOBAL VIEW';
      case 'infrastructure': return 'INFRASTRUCTURE';
      case 'regional-country': return 'GEOGRAPHY ';
      case 'bu-application': return 'ORGANIZATIONS';
      case 'system-classification': return 'SYSTEM CLASSIFICATION';
      case 'security-coverage': return 'SECURITY COVERAGE';
      case 'compliance': return 'COMPLIANCE';
      case 'domain-visibility': return 'DOMAIN VISIBILITY';
      case 'logging-standards': return 'LOGGING STANDARDS';
      default: return 'DASHBOARD';
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-black">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/5 via-purple-900/5 to-pink-900/5" />
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.1) 0%, transparent 50%),
                           radial-gradient(circle at 80% 50%, rgba(255, 0, 255, 0.05) 0%, transparent 50%),
                           radial-gradient(circle at 50% 100%, rgba(0, 212, 255, 0.05) 0%, transparent 50%)`
        }} />
      </div>
      
      {/* Navigation Sidebar - Fixed width 256px (w-64) */}
      <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
      
      {/* Main Content Area - Adjusted for correct sidebar width */}
      <div className="flex-1 ml-64 flex flex-col relative z-10 h-screen">
        {/* Header - Fixed height */}
        <header className="flex-shrink-0 border-b border-white/10 bg-black/80 backdrop-blur-xl h-12">
          <div className="px-3 h-full flex items-center">
            <div className="flex items-center justify-between w-full">
              <div>
                <h2 className="text-base font-bold tracking-tight">
                  <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {getPageTitle()}
                  </span>
                </h2>
                <p className="text-[9px] text-white/40 uppercase tracking-widest">
                  AO1 VISIBILITY
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 border border-white/10">
                  <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-[9px] font-medium text-cyan-400">LIVE</span>
                </div>
                
                <div className="text-xs font-mono text-white/60">
                  {currentTime}
                </div>
              </div>
            </div>
          </div>
        </header>
        
        {/* Main Content - Full remaining height */}
        <main className="flex-1 overflow-hidden bg-black">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}