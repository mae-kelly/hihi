import React, { useState, useEffect, useRef } from 'react';
import { Server, Cloud, Database, Network, Shield, AlertTriangle, TrendingDown, Activity, Cpu, HardDrive, Wifi, Lock, Layers, Globe } from 'lucide-react';

const InfrastructureView: React.FC = () => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [animatedMetrics, setAnimatedMetrics] = useState<Record<string, number>>({});
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ACTUAL DATA FROM AO1 REQUIREMENTS - Infrastructure Type breakdown
  const infrastructureData = {
    'On-Premise': {
      totalAssets: 168234,
      csocCoverage: 36.3,
      splunkCoverage: 78.5,
      chronicleCoverage: 95.1,
      missing: 107187,
      status: 'critical',
      trends: {
        daily: -0.3,
        weekly: -2.1,
        monthly: -5.4
      },
      subcategories: {
        'Windows Server': { assets: 67891, coverage: 85.84, missing: 9623, csoc: 36.3, splunk: 78.5, chronicle: 100 },
        'Linux Server': { assets: 78234, coverage: 69.29, missing: 24001, csoc: 2.7, splunk: 15.6, chronicle: 72.8 },
        'AIX Server': { assets: 5234, coverage: 100, missing: 0, csoc: 100, splunk: 100, chronicle: 100 },
        'Solaris Server': { assets: 2890, coverage: 100, missing: 0, csoc: 100, splunk: 100, chronicle: 100 },
        'Mainframe': { assets: 234, coverage: 100, missing: 0, csoc: 100, splunk: 100, chronicle: 0 },
        'Network Appliance': { assets: 13751, coverage: 45.2, missing: 7537, csoc: 0.1, splunk: 0.1, chronicle: 45.0 }
      },
      criticalIssues: [
        'Linux servers at 2.7% CSOC coverage - CRITICAL',
        'Network appliances at 0.1% CSOC coverage - CRITICAL',
        '107,187 on-premise assets without CSOC visibility'
      ]
    },
    'Cloud': {
      totalAssets: 50237,
      csocCoverage: 0.1,
      splunkCoverage: 0.1,
      chronicleCoverage: 78.3,
      missing: 50187,
      status: 'critical',
      trends: {
        daily: -1.2,
        weekly: -4.3,
        monthly: -12.7
      },
      subcategories: {
        'AWS': { assets: 23456, coverage: 0.1, missing: 23433, csoc: 0.1, splunk: 0.1, chronicle: 82.1 },
        'Azure': { assets: 18901, coverage: 0.1, missing: 18882, csoc: 0.1, splunk: 0.1, chronicle: 76.3 },
        'GCP': { assets: 7880, coverage: 0.1, missing: 7872, csoc: 0.1, splunk: 0.1, chronicle: 75.4 }
      },
      criticalIssues: [
        'Cloud infrastructure at 0.1% CSOC coverage - EMERGENCY',
        '50,187 cloud assets completely unmonitored',
        'No cloud platform has adequate CSOC integration'
      ]
    },
    'SaaS': {
      totalAssets: 28456,
      csocCoverage: 57.5,
      splunkCoverage: 31.1,
      chronicleCoverage: 88.9,
      missing: 12089,
      status: 'warning',
      trends: {
        daily: 0,
        weekly: -0.8,
        monthly: -3.2
      },
      subcategories: {
        'Office 365': { assets: 12000, coverage: 62.3, missing: 4524, csoc: 60.0, splunk: 45.0, chronicle: 92.1 },
        'Salesforce': { assets: 8456, coverage: 55.2, missing: 3789, csoc: 55.0, splunk: 28.2, chronicle: 87.3 },
        'ServiceNow': { assets: 8000, coverage: 53.1, missing: 3752, csoc: 57.5, splunk: 20.1, chronicle: 86.2 }
      },
      criticalIssues: [
        'SaaS applications show inconsistent coverage',
        '12,089 SaaS assets lack proper monitoring',
        'API-based log collection incomplete'
      ]
    },
    'API': {
      totalAssets: 15105,
      csocCoverage: 60.0,
      splunkCoverage: 0.0,
      chronicleCoverage: 60.0,
      missing: 6042,
      status: 'warning',
      trends: {
        daily: 0.2,
        weekly: 1.1,
        monthly: 3.8
      },
      subcategories: {
        'REST APIs': { assets: 8900, coverage: 62.0, missing: 3382, csoc: 62.0, splunk: 0, chronicle: 62.0 },
        'GraphQL': { assets: 3205, coverage: 58.0, missing: 1346, csoc: 58.0, splunk: 0, chronicle: 58.0 },
        'Webhooks': { assets: 3000, coverage: 57.0, missing: 1290, csoc: 57.0, splunk: 0, chronicle: 57.0 }
      },
      criticalIssues: [
        'No Splunk integration for API monitoring',
        '6,042 API endpoints unmonitored',
        'Inconsistent API gateway logging'
      ]
    },
    'Containers': {
      totalAssets: 0,
      csocCoverage: 0,
      splunkCoverage: 0,
      chronicleCoverage: 0,
      missing: 0,
      status: 'unknown',
      trends: {
        daily: 0,
        weekly: 0,
        monthly: 0
      },
      subcategories: {},
      criticalIssues: [
        'Container infrastructure not classified in CMDB',
        'Kubernetes clusters visibility unknown',
        'Docker hosts potentially uncounted in totals'
      ]
    }
  };

  // Calculate totals
  const totalAssets = Object.values(infrastructureData)
    .reduce((sum, infra) => sum + infra.totalAssets, 0);
  const totalMissing = Object.values(infrastructureData)
    .reduce((sum, infra) => sum + infra.missing, 0);
  const avgCsocCoverage = 19.17; // From requirements
  const avgSplunkCoverage = 63.93;
  const avgChronicleCoverage = 92.24;

  // 3D Visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let time = 0;
    const animate = () => {
      time += 0.01;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw infrastructure breakdown
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxRadius = Math.min(centerX, centerY) * 0.8;

      Object.entries(infrastructureData).forEach(([ type, data ], index) => {
        if (data.totalAssets === 0) return;
        
        const angle = (index / Object.keys(infrastructureData).length) * Math.PI * 2;
        const radius = (data.csocCoverage / 100) * maxRadius;
        
        // Draw connection to center
        ctx.strokeStyle = data.status === 'critical' ? 'rgba(255, 0, 68, 0.3)' : 'rgba(0, 255, 255, 0.3)';
        ctx.lineWidth = Math.max(1, data.totalAssets / 20000);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        const x = centerX + Math.cos(angle + time) * radius;
        const y = centerY + Math.sin(angle + time) * radius;
        ctx.lineTo(x, y);
        ctx.stroke();
        
        // Draw node
        const nodeSize = Math.sqrt(data.totalAssets) / 20;
        ctx.beginPath();
        ctx.arc(x, y, nodeSize, 0, Math.PI * 2);
        ctx.fillStyle = data.status === 'critical' ? '#ff0044' : 
                       data.status === 'warning' ? '#ffaa00' : 
                       '#00ffff';
        ctx.fill();
        
        // Pulse effect for critical
        if (data.status === 'critical') {
          ctx.beginPath();
          ctx.arc(x, y, nodeSize + Math.sin(time * 3) * 5, 0, Math.PI * 2);
          ctx.strokeStyle = '#ff0044';
          ctx.globalAlpha = 0.5;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      });

      requestAnimationFrame(animate);
    };
    animate();
  }, []);

  // Animate metrics
  useEffect(() => {
    Object.entries(infrastructureData).forEach(([type, data], index) => {
      setTimeout(() => {
        setAnimatedMetrics(prev => ({
          ...prev,
          [`${type}-csoc`]: data.csocCoverage,
          [`${type}-splunk`]: data.splunkCoverage,
          [`${type}-chronicle`]: data.chronicleCoverage
        }));
      }, index * 100);
    });
  }, []);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'critical': return { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-400' };
      case 'warning': return { bg: 'bg-yellow-500/20', border: 'border-yellow-500', text: 'text-yellow-400' };
      case 'unknown': return { bg: 'bg-gray-500/20', border: 'border-gray-500', text: 'text-gray-400' };
      default: return { bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-400' };
    }
  };

  const getInfraIcon = (type: string) => {
    switch(type) {
      case 'On-Premise': return <Server className="w-6 h-6" />;
      case 'Cloud': return <Cloud className="w-6 h-6" />;
      case 'SaaS': return <Database className="w-6 h-6" />;
      case 'API': return <Network className="w-6 h-6" />;
      case 'Containers': return <Layers className="w-6 h-6" />;
      default: return <Shield className="w-6 h-6" />;
    }
  };

  const currentData = selectedType === 'all' 
    ? Object.entries(infrastructureData)
    : Object.entries(infrastructureData).filter(([key]) => key === selectedType);

  return (
    <div className="p-8 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-black mb-3 holo-text">
          INFRASTRUCTURE TYPE
        </h1>
        <p className="text-purple-300/60 uppercase tracking-widest text-sm">
          CSOC displays % visibility by host and log type across infrastructure types
        </p>
      </div>

      {/* Critical Alerts */}
      <div className="space-y-3 mb-6">
        <div className="glass-panel rounded-xl p-4 border-red-500/50 bg-red-500/10">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
            <div>
              <span className="text-red-400 font-bold">EMERGENCY:</span>
              <span className="text-white ml-2">Cloud infrastructure at 0.1% CSOC coverage - 50,187 assets blind</span>
            </div>
          </div>
        </div>
        <div className="glass-panel rounded-xl p-4 border-orange-500/50 bg-orange-500/10">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-400 animate-pulse" />
            <div>
              <span className="text-orange-400 font-bold">CRITICAL:</span>
              <span className="text-white ml-2">Linux servers at 2.7% CSOC coverage - 24,001 systems unmonitored</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-6 gap-4 mb-8">
        <div className="glass-panel rounded-xl p-4">
          <div className="text-xs text-gray-400 mb-1">Total Assets</div>
          <div className="text-2xl font-bold text-cyan-400">{totalAssets.toLocaleString()}</div>
        </div>
        <div className="glass-panel rounded-xl p-4">
          <div className="text-xs text-gray-400 mb-1">Missing Coverage</div>
          <div className="text-2xl font-bold text-red-400">{totalMissing.toLocaleString()}</div>
        </div>
        <div className="glass-panel rounded-xl p-4">
          <div className="text-xs text-gray-400 mb-1">CSOC Avg</div>
          <div className="text-2xl font-bold text-red-400">{avgCsocCoverage}%</div>
        </div>
        <div className="glass-panel rounded-xl p-4">
          <div className="text-xs text-gray-400 mb-1">Splunk Avg</div>
          <div className="text-2xl font-bold text-yellow-400">{avgSplunkCoverage}%</div>
        </div>
        <div className="glass-panel rounded-xl p-4">
          <div className="text-xs text-gray-400 mb-1">Chronicle Avg</div>
          <div className="text-2xl font-bold text-green-400">{avgChronicleCoverage}%</div>
        </div>
        <div className="glass-panel rounded-xl p-4">
          <div className="text-xs text-gray-400 mb-1">Critical Types</div>
          <div className="text-2xl font-bold text-orange-400">3/5</div>
        </div>
      </div>

      {/* Infrastructure Grid */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {Object.entries(infrastructureData).filter(([_, data]) => data.totalAssets > 0).map(([type, data]) => {
          const statusColors = getStatusColor(data.status);
          return (
            <div key={type} className={`glass-panel rounded-2xl p-6 ${statusColors.border} ${statusColors.bg}`}>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {getInfraIcon(type)}
                  <div>
                    <h3 className="text-xl font-bold text-white">{type}</h3>
                    <p className="text-sm text-gray-400">{data.totalAssets.toLocaleString()} assets</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${statusColors.bg} ${statusColors.text}`}>
                    {data.status.toUpperCase()}
                  </span>
                  <div className="text-2xl font-bold text-red-400 mt-2">{data.missing.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">Missing Coverage</div>
                </div>
              </div>

              {/* Platform Coverage */}
              <div className="space-y-3 mb-6">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-cyan-400">CSOC Coverage</span>
                    <span className={`font-mono ${data.csocCoverage < 20 ? 'text-red-400' : 'text-cyan-400'}`}>
                      {data.csocCoverage}%
                    </span>
                  </div>
                  <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${animatedMetrics[`${type}-csoc`] || 0}%`,
                        background: data.csocCoverage < 20 ? '#ff0044' : 'linear-gradient(90deg, #00ffff, #00e5ff)'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-purple-400">Splunk Coverage</span>
                    <span className="font-mono text-purple-400">{data.splunkCoverage}%</span>
                  </div>
                  <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${animatedMetrics[`${type}-splunk`] || 0}%`,
                        background: 'linear-gradient(90deg, #c084fc, #a855f7)'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-pink-400">Chronicle Coverage</span>
                    <span className="font-mono text-pink-400">{data.chronicleCoverage}%</span>
                  </div>
                  <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${animatedMetrics[`${type}-chronicle`] || 0}%`,
                        background: 'linear-gradient(90deg, #ff00ff, #e879f9)'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Trends */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center glass-panel rounded-lg p-2">
                  <div className="text-xs text-gray-400">Daily</div>
                  <div className={`text-sm font-bold ${data.trends.daily < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {data.trends.daily > 0 ? '+' : ''}{data.trends.daily}%
                  </div>
                </div>
                <div className="text-center glass-panel rounded-lg p-2">
                  <div className="text-xs text-gray-400">Weekly</div>
                  <div className={`text-sm font-bold ${data.trends.weekly < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {data.trends.weekly > 0 ? '+' : ''}{data.trends.weekly}%
                  </div>
                </div>
                <div className="text-center glass-panel rounded-lg p-2">
                  <div className="text-xs text-gray-400">Monthly</div>
                  <div className={`text-sm font-bold ${data.trends.monthly < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {data.trends.monthly > 0 ? '+' : ''}{data.trends.monthly}%
                  </div>
                </div>
              </div>

              {/* Critical Issues */}
              <div className="border-t border-gray-700 pt-4">
                <h4 className="text-xs font-semibold text-red-400 mb-2">Critical Issues</h4>
                <div className="space-y-1">
                  {data.criticalIssues.slice(0, 2).map((issue, idx) => (
                    <p key={idx} className="text-xs text-red-300">• {issue}</p>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3D Visualization */}
      <div className="glass-panel rounded-2xl p-6 mb-8">
        <h3 className="text-sm font-semibold text-purple-300 mb-4 uppercase tracking-wider">
          Infrastructure Coverage Visualization
        </h3>
        <canvas 
          ref={canvasRef}
          className="w-full h-[300px]"
          style={{
            filter: 'drop-shadow(0 0 20px rgba(192, 132, 252, 0.3))'
          }}
        />
      </div>

      {/* Detailed Breakdown Table */}
      <div className="glass-panel rounded-2xl p-6">
        <h2 className="text-xl font-bold text-red-400 mb-4">CRITICAL INFRASTRUCTURE GAPS</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Infrastructure</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">Assets</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">CSOC %</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">Splunk %</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">Chronicle %</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">Gap</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Action Required</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-800">
                <td className="py-3 px-4 text-white">Cloud - ALL</td>
                <td className="py-3 px-4 text-center font-mono">50,237</td>
                <td className="py-3 px-4 text-center font-mono text-red-400">0.1%</td>
                <td className="py-3 px-4 text-center font-mono text-red-400">0.1%</td>
                <td className="py-3 px-4 text-center font-mono text-yellow-400">78.3%</td>
                <td className="py-3 px-4 text-center font-mono text-red-400">50,187</td>
                <td className="py-3 px-4 text-sm text-yellow-400">EMERGENCY: Enable cloud logging</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-3 px-4 text-white">Linux Servers</td>
                <td className="py-3 px-4 text-center font-mono">78,234</td>
                <td className="py-3 px-4 text-center font-mono text-red-400">2.7%</td>
                <td className="py-3 px-4 text-center font-mono text-red-400">15.6%</td>
                <td className="py-3 px-4 text-center font-mono text-yellow-400">72.8%</td>
                <td className="py-3 px-4 text-center font-mono text-red-400">24,001</td>
                <td className="py-3 px-4 text-sm text-yellow-400">Deploy rsyslog forwarding</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-3 px-4 text-white">Windows Servers</td>
                <td className="py-3 px-4 text-center font-mono">67,891</td>
                <td className="py-3 px-4 text-center font-mono text-yellow-400">36.3%</td>
                <td className="py-3 px-4 text-center font-mono text-yellow-400">78.5%</td>
                <td className="py-3 px-4 text-center font-mono text-green-400">100%</td>
                <td className="py-3 px-4 text-center font-mono text-orange-400">9,623</td>
                <td className="py-3 px-4 text-sm text-yellow-400">Expand WEF deployment</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-3 px-4 text-white">Network Appliances</td>
                <td className="py-3 px-4 text-center font-mono">13,751</td>
                <td className="py-3 px-4 text-center font-mono text-red-400">0.1%</td>
                <td className="py-3 px-4 text-center font-mono text-red-400">0.1%</td>
                <td className="py-3 px-4 text-center font-mono text-yellow-400">45.0%</td>
                <td className="py-3 px-4 text-center font-mono text-red-400">7,537</td>
                <td className="py-3 px-4 text-sm text-yellow-400">Configure SNMP/NetFlow</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InfrastructureView;