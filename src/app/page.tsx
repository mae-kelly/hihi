'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Activity, Database, Server, Cloud, Network, AlertCircle, TrendingDown, Eye, BarChart3, Globe, Building, Layers, FileSearch, Lock } from 'lucide-react';
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
  const [currentPage, setCurrentPage] = useState('dashboard');
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

  // ACTUAL AO1 DATA - Executive Summary
  const executiveMetrics = {
    totalAssets: 262032,
    csocCoverage: 19.17,
    splunkCoverage: 63.93,
    chronicleCoverage: 92.24,
    criticalGaps: 211795,
    complianceStatus: 'FAILED',
    riskLevel: 'CRITICAL'
  };

  const renderPage = () => {
    switch(currentPage) {
      case 'dashboard':
        return <ExecutiveDashboard metrics={executiveMetrics} />;
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
        return <ExecutiveDashboard metrics={executiveMetrics} />;
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
      
      <div className="ml-64">
        <header className="relative z-20">
          <div className="bg-black/90 backdrop-blur-xl border-b border-gray-800 px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {currentPage === 'dashboard' && 'AO1 LOG VISIBILITY MEASUREMENT'}
                  {currentPage === 'global-view' && 'GLOBAL VIEW - CSOC VISIBILITY'}
                  {currentPage === 'infrastructure' && 'INFRASTRUCTURE TYPE ANALYSIS'}
                  {currentPage === 'regional-country' && 'REGIONAL & COUNTRY VIEW'}
                  {currentPage === 'bu-application' && 'BU & APPLICATION VIEW'}
                  {currentPage === 'system-classification' && 'SYSTEM CLASSIFICATION'}
                  {currentPage === 'security-coverage' && 'SECURITY CONTROL COVERAGE'}
                  {currentPage === 'compliance' && 'GSO & SPLUNK COMPLIANCE'}
                  {currentPage === 'domain-visibility' && 'DOMAIN VISIBILITY'}
                  {currentPage === 'logging-standards' && 'LOGGING STANDARDS'}
                </h2>
                <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">
                  Fiserv Cybersecurity Logging Standard • Real-Time Visibility Measurement
                </p>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="bg-gray-900/50 px-4 py-2 rounded-lg border border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${
                      executiveMetrics.csocCoverage < 20 ? 'bg-red-400' : 'bg-green-400'
                    }`} />
                    <span className="text-sm font-medium">
                      <span className={executiveMetrics.csocCoverage < 20 ? 'text-red-400' : 'text-green-400'}>
                        {executiveMetrics.complianceStatus}
                      </span>
                    </span>
                  </div>
                </div>
                
                <div className="bg-gray-900/50 px-4 py-2 rounded-lg border border-gray-800">
                  <span className="text-sm font-medium">
                    <span className="text-purple-400">RISK:</span>
                    <span className="text-red-400 ml-2">{executiveMetrics.riskLevel}</span>
                  </span>
                </div>
                
                <div className="text-xs font-mono text-gray-400">
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

// Executive Dashboard Component
interface ExecutiveDashboardProps {
  metrics: typeof executiveMetrics;
}

const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ metrics }) => {
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({});

  useEffect(() => {
    // Animate metrics on mount
    setTimeout(() => {
      setAnimatedValues({
        csoc: metrics.csocCoverage,
        splunk: metrics.splunkCoverage,
        chronicle: metrics.chronicleCoverage
      });
    }, 100);
  }, []);

  return (
    <div className="p-8 bg-black">
      {/* Critical Alert Banner */}
      <div className="mb-8 bg-black/90 rounded-xl p-6 border border-red-500/30">
        <div className="flex items-center gap-4">
          <AlertCircle className="w-8 h-8 text-red-400 animate-pulse" />
          <div>
            <h3 className="text-xl font-bold text-red-400">CRITICAL VISIBILITY FAILURE</h3>
            <p className="text-white mt-1">
              CSOC coverage at {metrics.csocCoverage}% - {metrics.criticalGaps.toLocaleString()} assets unmonitored
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Immediate action required: Deploy log collectors to achieve minimum 80% coverage for compliance
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
          <Database className="w-6 h-6 text-cyan-400 mb-3" />
          <div className="text-3xl font-bold text-white">{metrics.totalAssets.toLocaleString()}</div>
          <div className="text-sm text-gray-400">Total Assets</div>
          <div className="mt-3 text-xs text-cyan-400">100% in CMDB</div>
        </div>

        <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl p-6 border border-red-500/30">
          <Eye className="w-6 h-6 text-red-400 mb-3" />
          <div className="text-3xl font-bold text-red-400">{metrics.csocCoverage}%</div>
          <div className="text-sm text-gray-400">CSOC Visibility</div>
          <div className="mt-3 text-xs text-red-400">↓ 60.83% below target</div>
        </div>

        <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
          <Server className="w-6 h-6 text-purple-400 mb-3" />
          <div className="text-3xl font-bold text-purple-400">{metrics.splunkCoverage}%</div>
          <div className="text-sm text-gray-400">Splunk Coverage</div>
          <div className="mt-3 text-xs text-purple-400">Partial deployment</div>
        </div>

        <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
          <Cloud className="w-6 h-6 text-pink-400 mb-3" />
          <div className="text-3xl font-bold text-pink-400">{metrics.chronicleCoverage}%</div>
          <div className="text-sm text-gray-400">Chronicle Coverage</div>
          <div className="mt-3 text-xs text-pink-400">Near complete</div>
        </div>
      </div>

      {/* Critical Issues Summary */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4">TOP CRITICAL GAPS</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-black/50 rounded-lg border border-gray-800">
              <span className="text-white">EMEA Region</span>
              <span className="text-red-400 font-bold">12.3% coverage</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-black/50 rounded-lg border border-gray-800">
              <span className="text-white">Linux Servers</span>
              <span className="text-red-400 font-bold">30.71% missing</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-black/50 rounded-lg border border-gray-800">
              <span className="text-white">Network Appliances</span>
              <span className="text-red-400 font-bold">45.2% coverage</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-black/50 rounded-lg border border-gray-800">
              <span className="text-white">DLP Controls</span>
              <span className="text-red-400 font-bold">62.8% coverage</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-purple-400 mb-4">COMPLIANCE STATUS</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-black/50 rounded-lg border border-gray-800">
              <span className="text-white">ISO 27001</span>
              <span className="text-red-400 font-bold">FAILED</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-black/50 rounded-lg border border-gray-800">
              <span className="text-white">NIST CSF</span>
              <span className="text-red-400 font-bold">FAILED</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-black/50 rounded-lg border border-gray-800">
              <span className="text-white">PCI DSS</span>
              <span className="text-yellow-400 font-bold">AT RISK</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-black/50 rounded-lg border border-gray-800">
              <span className="text-white">SOX</span>
              <span className="text-red-400 font-bold">FAILED</span>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Coverage Comparison */}
      <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl p-6 border border-gray-800 mb-8">
        <h3 className="text-lg font-semibold text-white mb-6">PLATFORM COVERAGE COMPARISON</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-cyan-400">CSOC (Google Chronicle)</span>
              <span className="font-mono text-cyan-400">{animatedValues.csoc?.toFixed(1) || 0}%</span>
            </div>
            <div className="relative h-8 bg-black/50 rounded-full overflow-hidden border border-gray-800">
              <div 
                className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-cyan-400 to-cyan-500"
                style={{ width: `${animatedValues.csoc || 0}%` }}
              />
              <div className="absolute inset-0 flex items-center px-4">
                <span className="text-xs text-gray-400">50,237 / 262,032 assets</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-purple-400">Splunk</span>
              <span className="font-mono text-purple-400">{animatedValues.splunk?.toFixed(1) || 0}%</span>
            </div>
            <div className="relative h-8 bg-black/50 rounded-full overflow-hidden border border-gray-800">
              <div 
                className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-purple-400 to-purple-500"
                style={{ width: `${animatedValues.splunk || 0}%` }}
              />
              <div className="absolute inset-0 flex items-center px-4">
                <span className="text-xs text-gray-400">167,517 / 262,032 assets</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-pink-400">Chronicle (Direct)</span>
              <span className="font-mono text-pink-400">{animatedValues.chronicle?.toFixed(1) || 0}%</span>
            </div>
            <div className="relative h-8 bg-black/50 rounded-full overflow-hidden border border-gray-800">
              <div 
                className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-pink-400 to-pink-500"
                style={{ width: `${animatedValues.chronicle || 0}%` }}
              />
              <div className="absolute inset-0 flex items-center px-4">
                <span className="text-xs text-gray-400">241,691 / 262,032 assets</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Required */}
      <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl p-6 border border-red-500/30">
        <h3 className="text-xl font-bold text-red-400 mb-4">IMMEDIATE ACTIONS REQUIRED</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-black/50 rounded-lg border border-gray-800">
            <div className="text-sm font-bold text-yellow-400 mb-2">PRIORITY 1: EMEA DEPLOYMENT</div>
            <p className="text-xs text-gray-400">Deploy 5 regional collectors. Current 12.3% coverage is critical risk.</p>
          </div>
          <div className="p-4 bg-black/50 rounded-lg border border-gray-800">
            <div className="text-sm font-bold text-yellow-400 mb-2">PRIORITY 2: LINUX SYSTEMS</div>
            <p className="text-xs text-gray-400">Configure rsyslog on 24,001 Linux servers (30.71% gap).</p>
          </div>
          <div className="p-4 bg-black/50 rounded-lg border border-gray-800">
            <div className="text-sm font-bold text-yellow-400 mb-2">PRIORITY 3: DLP EXPANSION</div>
            <p className="text-xs text-gray-400">Deploy DLP to 97,465 unprotected assets immediately.</p>
          </div>
        </div>
      </div>
    </div>
  );
};