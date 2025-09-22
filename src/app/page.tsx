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
      case 'global-view': return 'GLOBAL SURVEILLANCE MATRIX';
      case 'infrastructure': return 'INFRASTRUCTURE RECONNAISSANCE';
      case 'regional-country': return 'GEOGRAPHIC INTELLIGENCE';
      case 'bu-application': return 'ORGANIZATIONAL INFILTRATION';
      case 'system-classification': return 'SYSTEM CLASSIFICATION MATRIX';
      case 'security-coverage': return 'DEFENSIVE PERIMETER STATUS';
      case 'compliance': return 'COMPLIANCE ENFORCEMENT';
      case 'domain-visibility': return 'DOMAIN SURVEILLANCE';
      case 'logging-standards': return 'INTELLIGENCE COLLECTION STANDARDS';
      default: return 'OPERATIONAL DASHBOARD';
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
      
      {/* Navigation Sidebar */}
      <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
      
      {/* Main Content Area */}
      <div className="flex-1 ml-56 flex flex-col relative z-10 h-screen">
        {/* Header */}
        <header className="flex-shrink-0 border-b border-white/10 bg-black/80 backdrop-blur-xl h-14">
          <div className="px-4 h-full flex items-center">
            <div className="flex items-center justify-between w-full">
              <div>
                <h2 className="text-lg font-bold tracking-tight">
                  <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {getPageTitle()}
                  </span>
                </h2>
                <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0">
                  CLEARANCE LEVEL: OMEGA • REAL-TIME SURVEILLANCE ACTIVE
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-[10px] font-medium text-cyan-400">LIVE</span>
                </div>
                
                <div className="text-xs font-mono text-white/60">
                  {currentTime}
                </div>
              </div>
            </div>
          </div>
        </header>
        
        {/* Main Content - Full height minus header */}
        <main className="flex-1 overflow-hidden bg-black">
          <div className="h-full">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}