import React, { useState, useEffect, useRef } from 'react';
import { Shield, CheckCircle, XCircle, AlertCircle, TrendingUp, TrendingDown, FileSearch, Database, Server, Cloud, Network, Activity, Lock, AlertTriangle } from 'lucide-react';

const ComplianceMatrix: React.FC = () => {
  const [selectedFramework, setSelectedFramework] = useState<string>('all');
  const [animatedScores, setAnimatedScores] = useState<Record<string, number>>({});
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ACTUAL DATA FROM AO1 REQUIREMENTS - GSO and Splunk Compliance
  const complianceData = {
    'CMDB Requirements': {
      framework: 'Asset Management Compliance',
      currentState: 'ASSUMED 100%',
      actualState: 'UNKNOWN',
      gsoScore: 28.6, // 2/7 complete
      splunkScore: 42.9, // 3/7 complete
      requirements: [
        { 
          item: 'CMDB is accurate and complete',
          gso: 'assumed',
          splunk: 'assumed',
          risk: 'CRITICAL',
          gap: 'Secondary assumption: CMDB NOT accurate, script must measure fault with CMDB',
          impact: 'If inaccurate, all visibility metrics are invalid'
        },
        { 
          item: 'CMDB incorporates asset inventory from Asset Management paperwork',
          gso: 'complete',
          splunk: 'complete',
          risk: 'MEDIUM',
          gap: 'Manual processes may miss assets',
          impact: 'Undiscovered assets remain unmonitored'
        },
        { 
          item: 'CMDB incorporates all discovery scanning to populate assets',
          gso: 'partial',
          splunk: 'partial',
          risk: 'HIGH',
          gap: 'Not all discovery tools integrated',
          impact: 'Network segments may be invisible'
        },
        { 
          item: 'CMDB incorporates DHCP records to map assets to IP assignment',
          gso: 'failed',
          splunk: 'partial',
          risk: 'CRITICAL',
          gap: 'DHCP integration incomplete - dynamic IPs not tracked',
          impact: 'Cannot correlate logs to assets'
        },
        { 
          item: 'CMDB integrates Vulnerability Scanning to identify assets',
          gso: 'complete',
          splunk: 'complete',
          risk: 'LOW',
          gap: 'Working as designed',
          impact: 'None - functioning correctly'
        },
        { 
          item: 'CMDB incorporates all Cloud Hosting controls to map assets in the cloud',
          gso: 'failed',
          splunk: 'failed',
          risk: 'CRITICAL',
          gap: 'Cloud asset discovery not implemented - 19.17% cloud visibility',
          impact: 'Cloud infrastructure largely invisible'
        },
        { 
          item: 'CMDB incorporates external discovery services into the CMDB',
          gso: 'failed',
          splunk: 'partial',
          risk: 'HIGH',
          gap: 'Limited external service integration',
          impact: 'Third-party managed assets not tracked'
        }
      ]
    },
    'Visibility Requirements': {
      framework: 'Logging Compliance Standards',
      currentState: '19.17% CSOC',
      actualState: 'CRITICAL FAILURE',
      gsoScore: 11.1, // 1/9 complete
      splunkScore: 44.4, // 4/9 complete
      requirements: [
        {
          item: 'Global View - CSOC able to view x% of all assets globally',
          gso: 'failed',
          splunk: 'partial',
          risk: 'CRITICAL',
          gap: 'Only 19.17% CSOC visibility - 211,795 assets missing',
          impact: 'Cannot detect threats on 80.83% of infrastructure'
        },
        {
          item: 'Infrastructure Type - CSOC displays % visibility by host and log type',
          gso: 'partial',
          splunk: 'complete',
          risk: 'HIGH',
          gap: 'Cloud at 19.17%, On-Prem at 63.93%',
          impact: 'Cloud infrastructure vulnerable'
        },
        {
          item: 'Regional and Country view - Visibility statement by location',
          gso: 'failed',
          splunk: 'partial',
          risk: 'CRITICAL',
          gap: 'EMEA at 12.3% coverage - 78,456 assets unmonitored',
          impact: 'Entire regions blind to attacks'
        },
        {
          item: 'BU and Application view - Business Unit and Application Class visibility',
          gso: 'failed',
          splunk: 'failed',
          risk: 'HIGH',
          gap: 'No BU-level visibility metrics available',
          impact: 'Cannot prioritize by business criticality'
        },
        {
          item: 'System Classification - Server function visibility',
          gso: 'partial',
          splunk: 'complete',
          risk: 'HIGH',
          gap: 'Network appliances at 45.2%, Linux at 69.29%',
          impact: 'Critical systems inadequately monitored'
        },
        {
          item: 'Security Control Coverage - Agent-based security visibility',
          gso: 'failed',
          splunk: 'partial',
          risk: 'HIGH',
          gap: 'DLP at 62.8%, missing 97,465 assets',
          impact: 'Data exfiltration risk'
        },
        {
          item: 'Logging Compliance in GSO and Splunk',
          gso: 'failed',
          splunk: 'partial',
          risk: 'CRITICAL',
          gap: 'Multiple compliance failures across frameworks',
          impact: 'Regulatory penalties and audit failures'
        },
        {
          item: 'Domain Visibility - Asset visibility by hostname and domain',
          gso: 'failed',
          splunk: 'complete',
          risk: 'MEDIUM',
          gap: 'Some domains not fully mapped',
          impact: 'Cannot track asset ownership'
        },
        {
          item: 'Visibility Factor Metrics - Host Parity comparison',
          gso: 'failed',
          splunk: 'partial',
          risk: 'HIGH',
          gap: 'URL/FQDN and Public IP coverage incomplete',
          impact: 'External-facing assets vulnerable'
        }
      ]
    },
    'Technical Implementation': {
      framework: 'Platform Integration Requirements',
      currentState: 'PARTIAL',
      actualState: 'AT RISK',
      gsoScore: 57.1, // 4/7 complete
      splunkScore: 71.4, // 5/7 complete
      requirements: [
        {
          item: 'IPAM integration for asset visibility',
          gso: 'partial',
          splunk: 'complete',
          risk: 'HIGH',
          gap: 'IPAM not fully synchronized with CMDB',
          impact: 'IP address tracking incomplete'
        },
        {
          item: 'Kafka data pipeline implementation',
          gso: 'complete',
          splunk: 'complete',
          risk: 'LOW',
          gap: 'Functioning as expected',
          impact: 'None - working correctly'
        },
        {
          item: 'Chronicle Data Replicator deployment',
          gso: 'complete',
          splunk: 'notapplicable',
          risk: 'LOW',
          gap: 'GSO-specific, working correctly',
          impact: 'None - functioning'
        },
        {
          item: 'Splunk API integration',
          gso: 'notapplicable',
          splunk: 'complete',
          risk: 'LOW',
          gap: 'Splunk-specific, functioning',
          impact: 'None - working'
        },
        {
          item: 'BigQuery analytics integration',
          gso: 'complete',
          splunk: 'failed',
          risk: 'MEDIUM',
          gap: 'Splunk not connected to BigQuery',
          impact: 'Limited analytics capability'
        },
        {
          item: 'Insights dashboard deployment',
          gso: 'partial',
          splunk: 'partial',
          risk: 'MEDIUM',
          gap: 'Limited dashboard functionality',
          impact: 'Reduced visibility into metrics'
        },
        {
          item: 'Log parsing and normalization',
          gso: 'complete',
          splunk: 'complete',
          risk: 'LOW',
          gap: 'Functioning correctly',
          impact: 'None - working'
        }
      ]
    },
    'Regulatory Compliance': {
      framework: 'Industry Standards Compliance',
      currentState: 'FAILED',
      actualState: 'CRITICAL',
      gsoScore: 0, // 0/4 complete
      splunkScore: 0, // 0/4 complete
      requirements: [
        {
          item: 'ISO 27001 - Event logging requirement',
          gso: 'failed',
          splunk: 'failed',
          risk: 'CRITICAL',
          gap: 'Clause 12.4.1 - Only 19.17% visibility fails requirement',
          impact: 'Certification at risk'
        },
        {
          item: 'NIST CSF - Detection capability',
          gso: 'failed',
          splunk: 'failed',
          risk: 'CRITICAL',
          gap: 'DE.AE-3 - 80.83% of assets not monitored',
          impact: 'Cannot meet NIST requirements'
        },
        {
          item: 'PCI DSS - Log review requirements',
          gso: 'failed',
          splunk: 'failed',
          risk: 'CRITICAL',
          gap: 'Requirement 10.2 - Incomplete log coverage',
          impact: 'PCI certification failure risk'
        },
        {
          item: 'SOX - Audit trail requirements',
          gso: 'failed',
          splunk: 'failed',
          risk: 'CRITICAL',
          gap: 'Section 404 - Inadequate logging controls',
          impact: 'Material weakness in controls'
        }
      ]
    }
  };

  // Calculate overall compliance scores
  const calculateCompliance = (framework: any) => {
    const total = framework.requirements.length;
    const completeGSO = framework.requirements.filter((r: any) => r.gso === 'complete').length;
    const completeSplunk = framework.requirements.filter((r: any) => r.splunk === 'complete').length;
    
    return {
      gso: framework.gsoScore || (completeGSO / total * 100),
      splunk: framework.splunkScore || (completeSplunk / total * 100),
      overall: ((framework.gsoScore || 0) + (framework.splunkScore || 0)) / 2
    };
  };

  // Real-time compliance monitoring visualization
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

      // Draw compliance wave based on actual 19.17% coverage
      ctx.strokeStyle = 'rgba(255, 0, 68, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      for (let x = 0; x < canvas.width; x += 5) {
        const y = canvas.height * 0.8 - Math.sin((x / 50) + time) * 10; // Low on chart = bad
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Draw critical threshold line at 80%
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, canvas.height * 0.2);
      ctx.lineTo(canvas.width, canvas.height * 0.2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label the lines
      ctx.fillStyle = 'rgba(255, 0, 68, 0.8)';
      ctx.font = '10px monospace';
      ctx.fillText('Current: 19.17%', 10, canvas.height * 0.85);
      
      ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
      ctx.fillText('Required: 80%', 10, canvas.height * 0.15);

      // Add warning zone
      ctx.fillStyle = 'rgba(255, 0, 68, 0.1)';
      ctx.fillRect(0, canvas.height * 0.2, canvas.width, canvas.height * 0.8);

      requestAnimationFrame(animate);
    };
    animate();
  }, []);

  // Animate scores
  useEffect(() => {
    Object.entries(complianceData).forEach(([framework, data], index) => {
      const scores = calculateCompliance(data);
      setTimeout(() => {
        setAnimatedScores(prev => ({
          ...prev,
          [`${framework}-gso`]: scores.gso,
          [`${framework}-splunk`]: scores.splunk,
          [`${framework}-overall`]: scores.overall
        }));
      }, index * 200);
    });
  }, []);

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'complete': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'partial': return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'failed': return <XCircle className="w-5 h-5 text-red-400" />;
      case 'assumed': return <AlertTriangle className="w-5 h-5 text-orange-400" />;
      case 'notapplicable': return <div className="w-5 h-5 text-gray-500 text-center">N/A</div>;
      default: return null;
    }
  };

  const getRiskColor = (risk: string) => {
    switch(risk) {
      case 'CRITICAL': return 'text-red-400 bg-red-500/20';
      case 'HIGH': return 'text-orange-400 bg-orange-500/20';
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-500/20';
      case 'LOW': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  // Calculate totals
  const totalRequirements = Object.values(complianceData).reduce((sum, framework) => sum + framework.requirements.length, 0);
  const failedRequirements = Object.values(complianceData).reduce((sum, framework) => 
    sum + framework.requirements.filter(r => r.gso === 'failed').length, 0
  );
  const criticalRisks = Object.values(complianceData).reduce((sum, framework) => 
    sum + framework.requirements.filter(r => r.risk === 'CRITICAL').length, 0
  );

  return (
    <div className="p-8 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-black mb-3 holo-text">
          GSO & SPLUNK COMPLIANCE
        </h1>
        <p className="text-purple-300/60 uppercase tracking-widest text-sm">
          Logging Compliance Matrix • CMDB Accuracy • Platform Requirements
        </p>
      </div>

      {/* Critical Alert */}
      <div className="mb-6 glass-panel rounded-xl p-4 border-red-500/50 bg-red-500/10">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
          <div>
            <span className="text-red-400 font-bold">COMPLIANCE FAILURE:</span>
            <span className="text-white ml-2">GSO at 19.17% visibility - ALL regulatory frameworks FAILED</span>
          </div>
        </div>
      </div>

      {/* Overall Compliance Scores */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <div className="glass-panel rounded-xl p-6">
          <Shield className="w-6 h-6 text-red-400 mb-2" />
          <div className="text-3xl font-bold text-red-400">19.17%</div>
          <div className="text-xs text-gray-400 uppercase">GSO Coverage</div>
        </div>
        <div className="glass-panel rounded-xl p-6">
          <Database className="w-6 h-6 text-yellow-400 mb-2" />
          <div className="text-3xl font-bold text-yellow-400">63.93%</div>
          <div className="text-xs text-gray-400 uppercase">Splunk Coverage</div>
        </div>
        <div className="glass-panel rounded-xl p-6">
          <AlertCircle className="w-6 h-6 text-red-400 mb-2" />
          <div className="text-3xl font-bold text-red-400">{failedRequirements}/{totalRequirements}</div>
          <div className="text-xs text-gray-400 uppercase">Failed Items</div>
        </div>
        <div className="glass-panel rounded-xl p-6">
          <AlertTriangle className="w-6 h-6 text-orange-400 mb-2" />
          <div className="text-3xl font-bold text-orange-400">{criticalRisks}</div>
          <div className="text-xs text-gray-400 uppercase">Critical Risks</div>
        </div>
        <div className="glass-panel rounded-xl p-6">
          <Lock className="w-6 h-6 text-red-400 mb-2" />
          <div className="text-3xl font-bold text-red-400">0/4</div>
          <div className="text-xs text-gray-400 uppercase">Compliant</div>
        </div>
      </div>

      {/* Real-time Compliance Monitoring */}
      <div className="glass-panel rounded-2xl p-6 mb-8">
        <h3 className="text-sm font-semibold text-cyan-300 mb-4 uppercase tracking-wider">
          Real-Time Compliance Gap Analysis
        </h3>
        <canvas 
          ref={canvasRef}
          className="w-full"
          style={{
            filter: 'drop-shadow(0 0 20px rgba(255, 0, 68, 0.3))'
          }}
        />
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4">
            <span className="text-xs text-red-400">⚠️ 60.83% BELOW MINIMUM COMPLIANCE THRESHOLD</span>
          </div>
          <span className="text-xs text-gray-400">Required: 80% | Current: 19.17%</span>
        </div>
      </div>

      {/* Compliance Framework Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setSelectedFramework('all')}
          className={`px-6 py-3 rounded-xl font-semibold uppercase tracking-wider transition-all ${
            selectedFramework === 'all'
              ? 'glass-panel scale-105'
              : 'bg-black/30 hover:bg-black/50'
          }`}
        >
          <span className={selectedFramework === 'all' ? 'text-cyan-300' : 'text-gray-500'}>
            ALL FRAMEWORKS
          </span>
        </button>
        {Object.keys(complianceData).map(framework => (
          <button
            key={framework}
            onClick={() => setSelectedFramework(framework)}
            className={`px-4 py-3 rounded-xl font-semibold text-sm uppercase tracking-wider transition-all ${
              selectedFramework === framework
                ? 'glass-panel scale-105'
                : 'bg-black/30 hover:bg-black/50'
            }`}
          >
            <span className={selectedFramework === framework ? 'text-purple-300' : 'text-gray-500'}>
              {framework}
            </span>
          </button>
        ))}
      </div>

      {/* Compliance Details */}
      {(selectedFramework === 'all' ? Object.entries(complianceData) : [[selectedFramework, complianceData[selectedFramework as keyof typeof complianceData]]]).map(([framework, data]) => {
        if (!data) return null;
        const scores = calculateCompliance(data);
        
        return (
          <div key={framework} className="mb-8 glass-panel rounded-2xl p-6">
            {/* Framework Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">{framework}</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Status: <span className={data.actualState === 'CRITICAL' || data.actualState === 'CRITICAL FAILURE' ? 'text-red-400' : 
                                data.actualState === 'AT RISK' ? 'text-yellow-400' : 'text-gray-400'}>
                    {data.currentState} → {data.actualState}
                  </span>
                </p>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-xs text-cyan-400/60 mb-1">GSO</div>
                  <div className={`text-2xl font-bold ${scores.gso < 50 ? 'text-red-400' : scores.gso < 80 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {animatedScores[`${framework}-gso`]?.toFixed(1) || 0}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-purple-400/60 mb-1">SPLUNK</div>
                  <div className={`text-2xl font-bold ${scores.splunk < 50 ? 'text-red-400' : scores.splunk < 80 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {animatedScores[`${framework}-splunk`]?.toFixed(1) || 0}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-pink-400/60 mb-1">OVERALL</div>
                  <div className={`text-2xl font-bold ${scores.overall < 50 ? 'text-red-400' : scores.overall < 80 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {animatedScores[`${framework}-overall`]?.toFixed(1) || 0}%
                  </div>
                </div>
              </div>
            </div>

            {/* Requirements Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Requirement</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">GSO</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">Splunk</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">Risk</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Gap</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {data.requirements.map((req, idx) => (
                    <tr key={idx} className="border-b border-gray-800 hover:bg-gray-900/50">
                      <td className="py-3 px-4 text-sm text-white">{req.item}</td>
                      <td className="py-3 px-4 text-center">{getStatusIcon(req.gso)}</td>
                      <td className="py-3 px-4 text-center">{getStatusIcon(req.splunk)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${getRiskColor(req.risk)}`}>
                          {req.risk}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-red-400">{req.gap}</td>
                      <td className="py-3 px-4 text-xs text-yellow-400">{req.impact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Critical Actions */}
      <div className="glass-panel rounded-2xl p-6 bg-red-500/5 border border-red-500/30">
        <h3 className="text-xl font-bold text-red-400 mb-4">CRITICAL COMPLIANCE ACTIONS</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-black/50 rounded-lg">
            <div className="text-sm font-bold text-red-400 mb-2">IMMEDIATE: ACHIEVE 80% COVERAGE</div>
            <p className="text-xs text-gray-300">Current 19.17% coverage fails ALL compliance frameworks. Deploy collectors to 211,795 assets.</p>
          </div>
          <div className="p-4 bg-black/50 rounded-lg">
            <div className="text-sm font-bold text-orange-400 mb-2">PRIORITY: CMDB ACCURACY</div>
            <p className="text-xs text-gray-300">Validate CMDB accuracy - all metrics assume 100% accuracy which may be false.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceMatrix;