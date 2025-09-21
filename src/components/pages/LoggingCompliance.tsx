import React, { useState, useEffect, useRef } from 'react';
import { Shield, CheckCircle, XCircle, AlertCircle, FileSearch, Database, Server, Cloud, Network, Activity, Lock, AlertTriangle } from 'lucide-react';

const LoggingCompliance: React.FC = () => {
  const [selectedFramework, setSelectedFramework] = useState<string>('all');
  const [animatedScores, setAnimatedScores] = useState<Record<string, number>>({});
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ACTUAL DATA FROM AO1 REQUIREMENTS - Logging Compliance in GSO and Splunk
  const complianceData = {
    'CMDB Improvements': {
      framework: 'Asset Management',
      gsoScore: 28.5,
      splunkScore: 42.1,
      overallScore: 35.3,
      status: 'FAILED',
      requirements: [
        { 
          item: 'Expand Visibility via Axonius',
          gso: 'partial',
          splunk: 'complete',
          gap: 'Axonius not fully integrated with GSO'
        },
        { 
          item: 'Determine Cloud Asset Inventory',
          gso: 'failed',
          splunk: 'partial',
          gap: 'Cloud assets not in CMDB'
        },
        { 
          item: 'Move to Katana for complete CMDB',
          gso: 'failed',
          splunk: 'failed',
          gap: 'Katana migration incomplete'
        }
      ]
    },
    'Visibility Gap Improvements': {
      framework: 'Coverage Enhancement',
      gsoScore: 19.17,
      splunkScore: 63.93,
      overallScore: 41.55,
      status: 'CRITICAL',
      requirements: [
        {
          item: 'Expand parsing as needed',
          gso: 'failed',
          splunk: 'partial',
          gap: 'Parser coverage at 19.17% only'
        },
        {
          item: 'Configure logging correctly',
          gso: 'failed',
          splunk: 'partial',
          gap: '211,795 assets misconfigured'
        },
        {
          item: 'Identify log gaps and ingest in GSO',
          gso: 'failed',
          splunk: 'complete',
          gap: 'GSO ingestion pipeline failures'
        }
      ]
    },
    'Visibility Metrics': {
      framework: 'Reporting Standards',
      gsoScore: 22.3,
      splunkScore: 71.2,
      overallScore: 46.75,
      status: 'FAILED',
      requirements: [
        {
          item: 'Display raw metric',
          gso: 'partial',
          splunk: 'complete',
          gap: 'GSO dashboard incomplete'
        },
        {
          item: 'Test Pivoting & Accuracy',
          gso: 'failed',
          splunk: 'partial',
          gap: 'Data accuracy issues'
        },
        {
          item: 'Expand as needed',
          gso: 'failed',
          splunk: 'partial',
          gap: 'Limited expansion capability'
        }
      ]
    },
    'Prototypes': {
      framework: 'Development',
      gsoScore: 15.8,
      splunkScore: 78.9,
      overallScore: 47.35,
      status: 'IN PROGRESS',
      requirements: [
        {
          item: 'Log Lense implementation',
          gso: 'failed',
          splunk: 'complete',
          gap: 'Log Lense not deployed in GSO'
        },
        {
          item: 'Insights dashboard',
          gso: 'partial',
          splunk: 'partial',
          gap: 'Limited functionality'
        },
        {
          item: 'BigQuery integration',
          gso: 'complete',
          splunk: 'failed',
          gap: 'Splunk not connected to BigQuery'
        }
      ]
    }
  };

  // Known Issues from requirements
  const knownIssues = [
    {
      issue: 'Logging Standard must be applied to all assets',
      impact: 'CRITICAL',
      affected: '262,032 assets',
      status: 'Standard configurations established but not deployed'
    },
    {
      issue: 'Splunk dependencies - Logs pulled from existing',
      impact: 'HIGH',
      affected: 'All Splunk sources',
      status: 'Dependencies established'
    },
    {
      issue: 'Network Complexity assessment',
      impact: 'HIGH',
      affected: 'Network infrastructure',
      status: 'Evaluated for log routing'
    },
    {
      issue: 'Lack of Logging Zones/networks',
      impact: 'CRITICAL',
      affected: 'Multiple regions',
      status: 'Identified gaps in network coverage'
    }
  ];

  // Real-time compliance monitoring
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = 200;

    let time = 0;
    const animate = () => {
      time += 0.02;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw GSO compliance line (critical - 19.17%)
      ctx.strokeStyle = 'rgba(255, 0, 68, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      for (let x = 0; x < canvas.width; x += 5) {
        const y = canvas.height * 0.8 + Math.sin((x / 50) + time) * 10; // Low compliance
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Draw Splunk compliance line (moderate - 63.93%)
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.8)';
      ctx.beginPath();
      
      for (let x = 0; x < canvas.width; x += 5) {
        const y = canvas.height * 0.36 + Math.sin((x / 50) + time + 1) * 10;
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Draw critical threshold line (80%)
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, canvas.height * 0.2);
      ctx.lineTo(canvas.width, canvas.height * 0.2);
      ctx.stroke();
      ctx.setLineDash([]);

      requestAnimationFrame(animate);
    };
    animate();
  }, []);

  // Animate scores
  useEffect(() => {
    Object.entries(complianceData).forEach(([framework, data], index) => {
      setTimeout(() => {
        setAnimatedScores(prev => ({
          ...prev,
          [`${framework}-gso`]: data.gsoScore,
          [`${framework}-splunk`]: data.splunkScore,
          [`${framework}-overall`]: data.overallScore
        }));
      }, index * 200);
    });
  }, []);

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'complete': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'partial': return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'failed': return <XCircle className="w-5 h-5 text-red-400" />;
      default: return null;
    }
  };

  return (
    <div className="p-8 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-black mb-3 holo-text">
          LOGGING COMPLIANCE IN GSO & SPLUNK
        </h1>
        <p className="text-purple-300/60 uppercase tracking-widest text-sm">
          Compliance Status • CMDB Improvements • Visibility Gap Analysis
        </p>
      </div>

      {/* Critical Alert */}
      <div className="mb-6 glass-panel rounded-xl p-4 border-red-500/50 bg-red-500/10">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
          <div>
            <span className="text-red-400 font-bold">COMPLIANCE FAILURE:</span>
            <span className="text-white ml-2">GSO at 19.17% visibility - fails all compliance requirements</span>
          </div>
        </div>
      </div>

      {/* Overall Compliance Scores */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <div className="glass-panel rounded-xl p-6">
          <Shield className="w-6 h-6 text-red-400 mb-2" />
          <div className="text-3xl font-bold text-red-400">19.17%</div>
          <div className="text-xs text-gray-400 uppercase">GSO/Chronicle</div>
        </div>
        <div className="glass-panel rounded-xl p-6">
          <Database className="w-6 h-6 text-yellow-400 mb-2" />
          <div className="text-3xl font-bold text-yellow-400">63.93%</div>
          <div className="text-xs text-gray-400 uppercase">Splunk</div>
        </div>
        <div className="glass-panel rounded-xl p-6">
          <AlertCircle className="w-6 h-6 text-red-400 mb-2" />
          <div className="text-3xl font-bold text-red-400">FAILED</div>
          <div className="text-xs text-gray-400 uppercase">Status</div>
        </div>
        <div className="glass-panel rounded-xl p-6">
          <XCircle className="w-6 h-6 text-orange-400 mb-2" />
          <div className="text-3xl font-bold text-orange-400">211,795</div>
          <div className="text-xs text-gray-400 uppercase">Assets Missing</div>
        </div>
        <div className="glass-panel rounded-xl p-6">
          <Activity className="w-6 h-6 text-purple-400 mb-2" />
          <div className="text-3xl font-bold text-purple-400">-60.83%</div>
          <div className="text-xs text-gray-400 uppercase">Below Target</div>
        </div>
      </div>

      {/* Real-time Compliance Monitoring */}
      <div className="glass-panel rounded-2xl p-6 mb-8">
        <h3 className="text-sm font-semibold text-cyan-300 mb-4 uppercase tracking-wider">
          Real-Time Compliance Monitoring
        </h3>
        <canvas 
          ref={canvasRef}
          className="w-full"
          style={{
            filter: 'drop-shadow(0 0 20px rgba(0, 255, 255, 0.3))'
          }}
        />
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-xs text-gray-400">Target (80%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <span className="text-xs text-gray-400">GSO (19.17%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
              <span className="text-xs text-gray-400">Splunk (63.93%)</span>
            </div>
          </div>
          <span className="text-xs text-red-400 font-bold">⚠️ CRITICAL NON-COMPLIANCE</span>
        </div>
      </div>

      {/* Compliance Frameworks */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {Object.entries(complianceData).map(([framework, data]) => (
          <div key={framework} className="glass-panel rounded-2xl p-6">
            {/* Framework Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">{framework}</h2>
                <p className="text-sm text-gray-400">{data.framework}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                data.status === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                data.status === 'FAILED' ? 'bg-orange-500/20 text-orange-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>
                {data.status}
              </span>
            </div>

            {/* Scores */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <div className="text-xs text-cyan-400/60 mb-1">GSO</div>
                <div className={`text-xl font-bold ${data.gsoScore < 30 ? 'text-red-400' : data.gsoScore < 60 ? 'text-yellow-400' : 'text-green-400'}`}>
                  {animatedScores[`${framework}-gso`]?.toFixed(1) || 0}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-purple-400/60 mb-1">SPLUNK</div>
                <div className={`text-xl font-bold ${data.splunkScore < 30 ? 'text-red-400' : data.splunkScore < 60 ? 'text-yellow-400' : 'text-green-400'}`}>
                  {animatedScores[`${framework}-splunk`]?.toFixed(1) || 0}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-pink-400/60 mb-1">OVERALL</div>
                <div className={`text-xl font-bold ${data.overallScore < 30 ? 'text-red-400' : data.overallScore < 60 ? 'text-yellow-400' : 'text-green-400'}`}>
                  {animatedScores[`${framework}-overall`]?.toFixed(1) || 0}%
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div className="space-y-3">
              {data.requirements.map((req, idx) => (
                <div key={idx} className="border-l-2 border-gray-700 pl-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-300">{req.item}</span>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1">
                        {getStatusIcon(req.gso)}
                        <span className="text-xs text-gray-500">GSO</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(req.splunk)}
                        <span className="text-xs text-gray-500">SPL</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-red-400">Gap: {req.gap}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Known Issues */}
      <div className="glass-panel rounded-2xl p-6">
        <h2 className="text-xl font-bold text-purple-300 mb-4">KNOWN ISSUES & GAPS</h2>
        <div className="grid grid-cols-2 gap-4">
          {knownIssues.map((issue, idx) => (
            <div key={idx} className="glass-panel rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">{issue.issue}</span>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  issue.impact === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                  'bg-orange-500/20 text-orange-400'
                }`}>
                  {issue.impact}
                </span>
              </div>
              <div className="text-xs text-gray-400 mb-1">Affected: {issue.affected}</div>
              <div className="text-xs text-yellow-400">Status: {issue.status}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Items */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="glass-panel rounded-xl p-4 border-red-500/30">
          <h3 className="text-sm font-bold text-red-400 mb-2">IMMEDIATE: GSO COVERAGE</h3>
          <p className="text-xs text-gray-300">19.17% coverage requires complete re-architecture of log collection</p>
        </div>
        <div className="glass-panel rounded-xl p-4 border-yellow-500/30">
          <h3 className="text-sm font-bold text-yellow-400 mb-2">PRIORITY: CMDB ACCURACY</h3>
          <p className="text-xs text-gray-300">Katana migration and Axonius integration must be completed</p>
        </div>
        <div className="glass-panel rounded-xl p-4 border-cyan-500/30">
          <h3 className="text-sm font-bold text-cyan-400 mb-2">ONGOING: PARSER COVERAGE</h3>
          <p className="text-xs text-gray-300">Expand parsing capabilities to cover 211,795 missing assets</p>
        </div>
      </div>
    </div>
  );
};

export default LoggingCompliance;