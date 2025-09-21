import React, { useState, useEffect } from 'react';
import { Building, Layers, Database, Network, Shield, AlertTriangle, Activity, TrendingDown, Server, Cloud } from 'lucide-react';

const BUandApplicationView: React.FC = () => {
  const [selectedView, setSelectedView] = useState<'bu' | 'application'>('bu');
  const [selectedBU, setSelectedBU] = useState<string | null>(null);
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({});

  // ACTUAL DATA FROM AO1 REQUIREMENTS - BU and Application View
  const businessUnits = {
    'Merchant Solutions': {
      assets: 78234,
      csocCoverage: 22.4,
      splunkCoverage: 71.2,
      chronicleCoverage: 89.3,
      missing: 60678,
      status: 'critical',
      cio: 'CIO-1',
      apm: 'APM-MS',
      applications: ['Payment Gateway', 'Merchant Portal', 'Settlement Engine', 'Risk Analytics'],
      priority: 1
    },
    'Card Services': {
      assets: 67890,
      csocCoverage: 18.9,
      splunkCoverage: 68.4,
      chronicleCoverage: 92.1,
      missing: 55028,
      status: 'critical',
      cio: 'CIO-2',
      apm: 'APM-CS',
      applications: ['Card Processing', 'Authorization System', 'Fraud Detection', 'Card Management'],
      priority: 1
    },
    'Digital Banking': {
      assets: 45678,
      csocCoverage: 31.2,
      splunkCoverage: 78.9,
      chronicleCoverage: 94.5,
      missing: 31413,
      status: 'warning',
      cio: 'CIO-3',
      apm: 'APM-DB',
      applications: ['Mobile Banking', 'Online Banking', 'Digital Wallet', 'API Platform'],
      priority: 2
    },
    'Enterprise Services': {
      assets: 34567,
      csocCoverage: 15.7,
      splunkCoverage: 52.3,
      chronicleCoverage: 87.6,
      missing: 29142,
      status: 'critical',
      cio: 'CIO-4',
      apm: 'APM-ES',
      applications: ['ERP Systems', 'Data Warehouse', 'BI Platform', 'Integration Hub'],
      priority: 3
    },
    'Risk & Compliance': {
      assets: 35663,
      csocCoverage: 8.9,
      splunkCoverage: 45.6,
      chronicleCoverage: 91.2,
      missing: 32490,
      status: 'critical',
      cio: 'CIO-5',
      apm: 'APM-RC',
      applications: ['Risk Management', 'Compliance Portal', 'Audit System', 'Regulatory Reporting'],
      priority: 1
    }
  };

  const applicationClasses = {
    'Payment Processing': {
      assets: 45678,
      coverage: 24.3,
      missing: 34567,
      criticality: 'CRITICAL',
      businessImpact: 'HIGH',
      regulatoryRequirement: true,
      platforms: ['On-Prem', 'Cloud', 'Hybrid'],
      gaps: [
        { component: 'Transaction Engine', coverage: 18.2 },
        { component: 'Settlement System', coverage: 22.4 },
        { component: 'Authorization Gateway', coverage: 31.1 },
        { component: 'Fraud Detection', coverage: 25.5 }
      ]
    },
    'Customer Facing': {
      assets: 38901,
      coverage: 42.1,
      missing: 22534,
      criticality: 'HIGH',
      businessImpact: 'HIGH',
      regulatoryRequirement: true,
      platforms: ['Web', 'Mobile', 'API'],
      gaps: [
        { component: 'Web Portal', coverage: 45.6 },
        { component: 'Mobile Apps', coverage: 38.9 },
        { component: 'API Gateway', coverage: 41.8 }
      ]
    },
    'Internal Systems': {
      assets: 28456,
      coverage: 67.8,
      missing: 9178,
      criticality: 'MEDIUM',
      businessImpact: 'MEDIUM',
      regulatoryRequirement: false,
      platforms: ['On-Prem'],
      gaps: [
        { component: 'ERP', coverage: 71.2 },
        { component: 'HR Systems', coverage: 65.4 },
        { component: 'Finance Systems', coverage: 66.7 }
      ]
    },
    'Data & Analytics': {
      assets: 23456,
      coverage: 35.6,
      missing: 15112,
      criticality: 'HIGH',
      businessImpact: 'HIGH',
      regulatoryRequirement: true,
      platforms: ['Cloud', 'Big Data'],
      gaps: [
        { component: 'Data Lake', coverage: 28.9 },
        { component: 'Analytics Platform', coverage: 41.2 },
        { component: 'Reporting Engine', coverage: 36.7 }
      ]
    }
  };

  // Animate values
  useEffect(() => {
    if (selectedView === 'bu') {
      Object.entries(businessUnits).forEach(([bu, data], index) => {
        setTimeout(() => {
          setAnimatedValues(prev => ({
            ...prev,
            [`${bu}-csoc`]: data.csocCoverage,
            [`${bu}-splunk`]: data.splunkCoverage,
            [`${bu}-chronicle`]: data.chronicleCoverage
          }));
        }, index * 100);
      });
    } else {
      Object.entries(applicationClasses).forEach(([app, data], index) => {
        setTimeout(() => {
          setAnimatedValues(prev => ({
            ...prev,
            [app]: data.coverage
          }));
        }, index * 100);
      });
    }
  }, [selectedView]);

  const totalBUAssets = Object.values(businessUnits).reduce((sum, bu) => sum + bu.assets, 0);
  const totalBUMissing = Object.values(businessUnits).reduce((sum, bu) => sum + bu.missing, 0);
  const avgBUCoverage = Object.values(businessUnits).reduce((sum, bu) => sum + bu.csocCoverage, 0) / Object.keys(businessUnits).length;

  return (
    <div className="p-8 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-black mb-3 holo-text">
          BU & APPLICATION VIEW
        </h1>
        <p className="text-purple-300/60 uppercase tracking-widest text-sm">
          Business Unit Visibility • Application Class Coverage • CIO/APM Mapping
        </p>
      </div>

      {/* Critical Alert */}
      <div className="mb-6 glass-panel rounded-xl p-4 border-red-500/50 bg-red-500/10">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
          <div>
            <span className="text-red-400 font-bold">CRITICAL:</span>
            <span className="text-white ml-2">Risk & Compliance BU at 8.9% coverage - regulatory exposure risk</span>
          </div>
        </div>
      </div>

      {/* View Selector */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setSelectedView('bu')}
          className={`px-6 py-3 rounded-xl font-semibold uppercase tracking-wider transition-all ${
            selectedView === 'bu'
              ? 'glass-panel scale-105'
              : 'bg-black/30 hover:bg-black/50'
          }`}
          style={{
            borderColor: selectedView === 'bu' ? 'rgba(0, 255, 255, 0.3)' : 'transparent',
            boxShadow: selectedView === 'bu' ? '0 0 30px rgba(0, 255, 255, 0.3)' : 'none'
          }}
        >
          <Building className="inline w-4 h-4 mr-2" />
          <span className={selectedView === 'bu' ? 'text-cyan-300' : 'text-gray-500'}>
            BUSINESS UNITS
          </span>
        </button>
        
        <button
          onClick={() => setSelectedView('application')}
          className={`px-6 py-3 rounded-xl font-semibold uppercase tracking-wider transition-all ${
            selectedView === 'application'
              ? 'glass-panel scale-105'
              : 'bg-black/30 hover:bg-black/50'
          }`}
          style={{
            borderColor: selectedView === 'application' ? 'rgba(192, 132, 252, 0.3)' : 'transparent',
            boxShadow: selectedView === 'application' ? '0 0 30px rgba(192, 132, 252, 0.3)' : 'none'
          }}
        >
          <Layers className="inline w-4 h-4 mr-2" />
          <span className={selectedView === 'application' ? 'text-purple-300' : 'text-gray-500'}>
            APPLICATION CLASS
          </span>
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="glass-panel rounded-xl p-6">
          <Building className="w-6 h-6 text-cyan-400 mb-2" />
          <div className="text-3xl font-bold text-cyan-400">5</div>
          <div className="text-xs text-gray-400 uppercase">Business Units</div>
        </div>
        <div className="glass-panel rounded-xl p-6">
          <Database className="w-6 h-6 text-purple-400 mb-2" />
          <div className="text-3xl font-bold text-purple-400">{(totalBUAssets / 1000).toFixed(0)}K</div>
          <div className="text-xs text-gray-400 uppercase">Total Assets</div>
        </div>
        <div className="glass-panel rounded-xl p-6">
          <AlertTriangle className="w-6 h-6 text-red-400 mb-2" />
          <div className="text-3xl font-bold text-red-400">{(totalBUMissing / 1000).toFixed(0)}K</div>
          <div className="text-xs text-gray-400 uppercase">Missing Coverage</div>
        </div>
        <div className="glass-panel rounded-xl p-6">
          <Activity className="w-6 h-6 text-orange-400 mb-2" />
          <div className="text-3xl font-bold text-orange-400">{avgBUCoverage.toFixed(1)}%</div>
          <div className="text-xs text-gray-400 uppercase">Avg Coverage</div>
        </div>
      </div>

      {/* Business Units View */}
      {selectedView === 'bu' && (
        <div className="grid grid-cols-1 gap-6">
          {Object.entries(businessUnits).map(([bu, data]) => (
            <div 
              key={bu}
              className={`glass-panel rounded-2xl p-6 cursor-pointer transition-all ${
                selectedBU === bu ? 'scale-101 border-purple-400/50' : ''
              }`}
              onClick={() => setSelectedBU(bu === selectedBU ? null : bu)}
              style={{
                borderColor: data.status === 'critical' ? 'rgba(255, 0, 68, 0.3)' : 'rgba(255, 170, 0, 0.3)'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-white">{bu}</h3>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm text-gray-400">CIO: {data.cio}</span>
                    <span className="text-sm text-gray-400">APM: {data.apm}</span>
                    <span className="text-sm text-gray-400">{data.assets.toLocaleString()} assets</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    data.status === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {data.status.toUpperCase()}
                  </span>
                  <div className="mt-2">
                    <span className="text-xs text-gray-400">Priority:</span>
                    <span className="text-sm font-bold text-orange-400 ml-2">P{data.priority}</span>
                  </div>
                </div>
              </div>

              {/* Coverage Metrics */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-cyan-400">CSOC</span>
                    <span className="font-mono text-cyan-400">{data.csocCoverage}%</span>
                  </div>
                  <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${animatedValues[`${bu}-csoc`] || 0}%`,
                        background: data.csocCoverage < 20 ? '#ff0044' : '#00ffff'
                      }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-purple-400">Splunk</span>
                    <span className="font-mono text-purple-400">{data.splunkCoverage}%</span>
                  </div>
                  <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${animatedValues[`${bu}-splunk`] || 0}%`,
                        background: 'linear-gradient(90deg, #c084fc, #a855f7)'
                      }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-pink-400">Chronicle</span>
                    <span className="font-mono text-pink-400">{data.chronicleCoverage}%</span>
                  </div>
                  <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${animatedValues[`${bu}-chronicle`] || 0}%`,
                        background: 'linear-gradient(90deg, #ff00ff, #e879f9)'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Applications */}
              {selectedBU === bu && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">Applications</h4>
                  <div className="flex flex-wrap gap-2">
                    {data.applications.map(app => (
                      <span key={app} className="px-3 py-1 rounded bg-gray-700/50 text-xs text-gray-300">
                        {app}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded">
                    <p className="text-sm text-red-400">
                      Missing Coverage: {data.missing.toLocaleString()} assets require immediate attention
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Application Class View */}
      {selectedView === 'application' && (
        <div className="grid grid-cols-2 gap-6">
          {Object.entries(applicationClasses).map(([appClass, data]) => (
            <div key={appClass} className="glass-panel rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{appClass}</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {data.assets.toLocaleString()} assets • {data.platforms.join(', ')}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    data.criticality === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                    data.criticality === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {data.criticality}
                  </span>
                </div>
              </div>

              {/* Coverage Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Overall Coverage</span>
                  <span className={`font-mono font-bold ${
                    data.coverage < 30 ? 'text-red-400' : 
                    data.coverage < 60 ? 'text-yellow-400' : 
                    'text-green-400'
                  }`}>
                    {data.coverage}%
                  </span>
                </div>
                <div className="h-3 bg-black/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${animatedValues[appClass] || 0}%`,
                      background: data.coverage < 30 ? '#ff0044' : 
                                 data.coverage < 60 ? '#ffaa00' : 
                                 '#00ff88'
                    }}
                  />
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="glass-panel rounded-lg p-2">
                  <div className="text-xs text-gray-400">Missing</div>
                  <div className="text-lg font-bold text-red-400">{(data.missing / 1000).toFixed(1)}K</div>
                </div>
                <div className="glass-panel rounded-lg p-2">
                  <div className="text-xs text-gray-400">Impact</div>
                  <div className="text-lg font-bold text-orange-400">{data.businessImpact}</div>
                </div>
              </div>

              {/* Component Gaps */}
              <div className="border-t border-gray-700 pt-3">
                <h4 className="text-xs font-semibold text-gray-400 mb-2">Component Coverage</h4>
                <div className="space-y-1">
                  {data.gaps.slice(0, 3).map(gap => (
                    <div key={gap.component} className="flex items-center justify-between text-xs">
                      <span className="text-gray-300">{gap.component}</span>
                      <span className={`font-mono ${
                        gap.coverage < 30 ? 'text-red-400' : 
                        gap.coverage < 60 ? 'text-yellow-400' : 
                        'text-green-400'
                      }`}>
                        {gap.coverage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Regulatory Flag */}
              {data.regulatoryRequirement && (
                <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-400">
                  ⚠️ Regulatory Compliance Required
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BUandApplicationView;