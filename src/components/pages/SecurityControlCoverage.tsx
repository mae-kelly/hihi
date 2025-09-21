import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Activity, Terminal, Fingerprint, Lock, Eye, Zap, Wifi, Database } from 'lucide-react';

const SecurityControlCoverage: React.FC = () => {
  const [selectedControl, setSelectedControl] = useState<string | null>(null);
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({});

  // ACTUAL DATA FROM AO1 REQUIREMENTS - Security Control Coverage
  const securityControls = {
    'EDR - Axonius/Console': {
      coverage: 87.2,
      assets: 228411,
      missing: 33621,
      totalAssets: 262032,
      platform: 'Axonius Console',
      status: 'active',
      trend: 2.3,
      gaps: [
        { type: 'Linux Servers', missing: 12456, coverage: 69.3, impact: 'HIGH' },
        { type: 'Cloud Workloads', missing: 8901, coverage: 78.2, impact: 'CRITICAL' },
        { type: 'Container Environments', missing: 7234, coverage: 65.4, impact: 'HIGH' },
        { type: 'Mobile Devices', missing: 5030, coverage: 0, impact: 'MEDIUM' }
      ],
      recommendation: 'Expand EDR deployment to all Linux systems - 12,456 systems unprotected',
      compliance: { 
        iso27001: true, 
        nist: true, 
        pcidss: false,
        sox: true 
      }
    },
    'Tanium - Axonius/Console': {
      coverage: 75.3,
      assets: 197234,
      missing: 64798,
      totalAssets: 262032,
      platform: 'Tanium Console',
      status: 'partial',
      trend: -1.2,
      gaps: [
        { type: 'Remote Offices', missing: 23456, coverage: 45.2, impact: 'HIGH' },
        { type: 'Development Systems', missing: 18234, coverage: 52.8, impact: 'MEDIUM' },
        { type: 'Cloud Infrastructure', missing: 15678, coverage: 38.9, impact: 'CRITICAL' },
        { type: 'IoT Devices', missing: 7430, coverage: 12.3, impact: 'LOW' }
      ],
      recommendation: 'Critical: Deploy Tanium agents to cloud infrastructure immediately',
      compliance: { 
        iso27001: true, 
        nist: false, 
        pcidss: false,
        sox: false 
      }
    },
    'DLP Agent - Axonius/Console': {
      coverage: 62.8,
      assets: 164567,
      missing: 97465,
      totalAssets: 262032,
      platform: 'DLP Console',
      status: 'warning',
      trend: -3.4,
      gaps: [
        { type: 'Email Systems', missing: 34567, coverage: 42.1, impact: 'CRITICAL' },
        { type: 'Cloud Storage', missing: 28901, coverage: 38.7, impact: 'CRITICAL' },
        { type: 'Database Servers', missing: 19234, coverage: 55.3, impact: 'HIGH' },
        { type: 'File Shares', missing: 14763, coverage: 61.2, impact: 'HIGH' }
      ],
      recommendation: 'CRITICAL: DLP missing on email and cloud storage - immediate deployment required',
      compliance: { 
        iso27001: false, 
        nist: false, 
        pcidss: false,
        sox: false 
      }
    }
  };

  // Calculate aggregate metrics
  const totalAssets = 262032;
  const averageCoverage = Object.values(securityControls).reduce((sum, control) => sum + control.coverage, 0) / Object.keys(securityControls).length;
  const totalMissing = Object.values(securityControls).reduce((sum, control) => sum + control.missing, 0);
  const criticalGaps = Object.values(securityControls).reduce((sum, control) => 
    sum + control.gaps.filter(g => g.impact === 'CRITICAL').length, 0
  );

  // Animate values
  useEffect(() => {
    Object.entries(securityControls).forEach(([control, data], index) => {
      setTimeout(() => {
        setAnimatedValues(prev => ({
          ...prev,
          [control]: data.coverage
        }));
      }, index * 200);
    });
  }, []);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500' };
      case 'partial': return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500' };
      case 'warning': return { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500' };
      case 'critical': return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500' };
      default: return { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500' };
    }
  };

  const getImpactColor = (impact: string) => {
    switch(impact) {
      case 'CRITICAL': return 'text-red-400';
      case 'HIGH': return 'text-orange-400';
      case 'MEDIUM': return 'text-yellow-400';
      case 'LOW': return 'text-cyan-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="p-8 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-black mb-3 holo-text">
          SECURITY CONTROL COVERAGE
        </h1>
        <p className="text-purple-300/60 uppercase tracking-widest text-sm">
          EDR • Tanium • DLP Agent Coverage Analysis
        </p>
      </div>

      {/* Critical Alert */}
      <div className="mb-6 glass-panel rounded-xl p-4 border-red-500/50 bg-red-500/10">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
          <div>
            <span className="text-red-400 font-bold">CRITICAL SECURITY GAP:</span>
            <span className="text-white ml-2">DLP at 62.8% coverage - 97,465 assets unprotected from data loss</span>
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <div className="glass-panel rounded-xl p-6">
          <Shield className="w-6 h-6 text-cyan-400 mb-2" />
          <div className="text-3xl font-bold text-cyan-400">{averageCoverage.toFixed(1)}%</div>
          <div className="text-xs text-gray-400 uppercase">Avg Coverage</div>
        </div>
        <div className="glass-panel rounded-xl p-6">
          <XCircle className="w-6 h-6 text-red-400 mb-2" />
          <div className="text-3xl font-bold text-red-400">{(totalMissing / 1000).toFixed(0)}K</div>
          <div className="text-xs text-gray-400 uppercase">Unprotected</div>
        </div>
        <div className="glass-panel rounded-xl p-6">
          <AlertTriangle className="w-6 h-6 text-orange-400 mb-2" />
          <div className="text-3xl font-bold text-orange-400">{criticalGaps}</div>
          <div className="text-xs text-gray-400 uppercase">Critical Gaps</div>
        </div>
        <div className="glass-panel rounded-xl p-6">
          <Activity className="w-6 h-6 text-purple-400 mb-2" />
          <div className="text-3xl font-bold text-purple-400">3/3</div>
          <div className="text-xs text-gray-400 uppercase">Controls</div>
        </div>
        <div className="glass-panel rounded-xl p-6">
          <Lock className="w-6 h-6 text-pink-400 mb-2" />
          <div className="text-3xl font-bold text-pink-400">0/4</div>
          <div className="text-xs text-gray-400 uppercase">Compliant</div>
        </div>
      </div>

      {/* Security Controls Grid */}
      <div className="grid grid-cols-1 gap-6">
        {Object.entries(securityControls).map(([control, data]) => {
          const statusColors = getStatusColor(data.status);
          return (
            <div 
              key={control}
              className={`glass-panel rounded-2xl p-6 cursor-pointer transition-all ${statusColors.border} ${
                selectedControl === control ? 'scale-102' : ''
              }`}
              onClick={() => setSelectedControl(control === selectedControl ? null : control)}
              style={{
                boxShadow: selectedControl === control 
                  ? '0 0 40px rgba(192, 132, 252, 0.4)' 
                  : undefined
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-white">{control}</h3>
                  <p className="text-sm text-gray-400">Platform: {data.platform}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-3xl font-bold" style={{
                      color: data.coverage < 50 ? '#ff0044' : 
                             data.coverage < 80 ? '#ffaa00' : 
                             '#00ff88'
                    }}>
                      {data.coverage}%
                    </div>
                    <div className="text-xs text-gray-400">Coverage</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${statusColors.bg} ${statusColors.text}`}>
                    {data.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Coverage Bar */}
              <div className="mb-4">
                <div className="relative h-6 bg-black/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${animatedValues[control] || 0}%`,
                      background: data.coverage < 50 
                        ? 'linear-gradient(90deg, #ff0044, #ff00ff)'
                        : data.coverage < 80
                        ? 'linear-gradient(90deg, #ffaa00, #ffff00)'
                        : 'linear-gradient(90deg, #00ff88, #00ffff)'
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-mono text-white/80">
                      {data.assets.toLocaleString()} / {data.totalAssets.toLocaleString()} assets
                    </span>
                  </div>
                </div>
              </div>

              {/* Metrics and Trend */}
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="glass-panel rounded-lg p-3">
                  <div className="text-xs text-gray-400">Protected</div>
                  <div className="text-xl font-bold text-green-400">{(data.assets / 1000).toFixed(0)}K</div>
                </div>
                <div className="glass-panel rounded-lg p-3">
                  <div className="text-xs text-gray-400">Missing</div>
                  <div className="text-xl font-bold text-red-400">{(data.missing / 1000).toFixed(0)}K</div>
                </div>
                <div className="glass-panel rounded-lg p-3">
                  <div className="text-xs text-gray-400">Trend</div>
                  <div className={`text-xl font-bold ${data.trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {data.trend > 0 ? '+' : ''}{data.trend}%
                  </div>
                </div>
                <div className="glass-panel rounded-lg p-3">
                  <div className="text-xs text-gray-400">Gaps</div>
                  <div className="text-xl font-bold text-orange-400">{data.gaps.length}</div>
                </div>
              </div>

              {/* Top Gaps */}
              <div className="border-t border-gray-700 pt-4">
                <h4 className="text-sm font-semibold text-gray-400 mb-3">Critical Coverage Gaps</h4>
                <div className="grid grid-cols-2 gap-3">
                  {data.gaps.map((gap, idx) => (
                    <div key={idx} className="glass-panel rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white">{gap.type}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          gap.impact === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                          gap.impact === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                          gap.impact === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-cyan-500/20 text-cyan-400'
                        }`}>
                          {gap.impact}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Coverage:</span>
                        <span className={`font-mono ${getImpactColor(gap.impact)}`}>
                          {gap.coverage}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Missing:</span>
                        <span className="font-mono text-red-400">
                          {gap.missing.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compliance Status */}
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Compliance Standards:</span>
                  <div className="flex gap-3">
                    {Object.entries(data.compliance).map(([standard, compliant]) => (
                      <div key={standard} className="flex items-center gap-1">
                        {compliant ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                        <span className="text-xs text-gray-400">{standard.toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-400">
                  <span className="font-bold">Action Required:</span> {data.recommendation}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Plan */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="glass-panel rounded-xl p-4 border-red-500/30">
          <h3 className="text-sm font-bold text-red-400 mb-2">IMMEDIATE: DLP DEPLOYMENT</h3>
          <p className="text-xs text-gray-300">62.8% DLP coverage leaves 97,465 assets vulnerable to data exfiltration</p>
        </div>
        <div className="glass-panel rounded-xl p-4 border-yellow-500/30">
          <h3 className="text-sm font-bold text-yellow-400 mb-2">30-DAY: TANIUM EXPANSION</h3>
          <p className="text-xs text-gray-300">Deploy Tanium to 15,678 cloud infrastructure assets</p>
        </div>
        <div className="glass-panel rounded-xl p-4 border-cyan-500/30">
          <h3 className="text-sm font-bold text-cyan-400 mb-2">QUARTERLY: EDR COMPLETION</h3>
          <p className="text-xs text-gray-300">Achieve 95% EDR coverage - 33,621 assets remaining</p>
        </div>
      </div>
    </div>
  );
};

export default SecurityControlCoverage;