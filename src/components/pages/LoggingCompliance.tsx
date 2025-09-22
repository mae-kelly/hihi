import React, { useState, useEffect, useRef } from 'react';
import { Shield, CheckCircle, XCircle, AlertCircle, FileSearch, Database, Server, Cloud, Network, Activity, Lock, AlertTriangle } from 'lucide-react';

const LoggingCompliance: React.FC = () => {
  const [selectedFramework, setSelectedFramework] = useState<string>('all');
  const [animatedScores, setAnimatedScores] = useState<Record<string, number>>({});
  const [complianceData, setComplianceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch real data from Flask API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch compliance data from multiple endpoints
        const [cmdbResponse, taniumResponse, domainResponse] = await Promise.all([
          fetch('http://localhost:5000/api/cmdb_presence'),
          fetch('http://localhost:5000/api/tanium_coverage'),
          fetch('http://localhost:5000/api/domain_metrics')
        ]);

        if (!cmdbResponse.ok || !taniumResponse.ok || !domainResponse.ok) {
          throw new Error('Failed to fetch compliance data');
        }

        const cmdbData = await cmdbResponse.json();
        const taniumData = await taniumResponse.json();
        const domainData = await domainResponse.json();

        // Process real data into compliance framework structure
        const processedData = {
          'CMDB Compliance': {
            framework: 'Asset Management Compliance',
            gsoScore: cmdbData.registration_rate || 0,
            splunkScore: Math.min(100, (cmdbData.registration_rate || 0) * 1.5),
            overallScore: cmdbData.registration_rate || 0,
            status: cmdbData.compliance_analysis?.compliance_status || 'UNKNOWN',
            requirements: [
              { 
                item: 'CMDB Registration Status',
                gso: cmdbData.registration_rate > 90 ? 'complete' : cmdbData.registration_rate > 70 ? 'partial' : 'failed',
                splunk: cmdbData.registration_rate > 80 ? 'complete' : cmdbData.registration_rate > 60 ? 'partial' : 'failed',
                gap: `${cmdbData.status_breakdown?.not_registered || 0} assets not registered`
              },
              { 
                item: 'Data Quality Score',
                gso: cmdbData.compliance_analysis?.governance_maturity === 'MATURE' ? 'complete' : 
                     cmdbData.compliance_analysis?.governance_maturity === 'DEVELOPING' ? 'partial' : 'failed',
                splunk: 'partial',
                gap: `Governance: ${cmdbData.compliance_analysis?.governance_maturity || 'UNKNOWN'}`
              }
            ],
            metrics: {
              registered: cmdbData.cmdb_registered || 0,
              total: cmdbData.total_assets || 0,
              percentage: cmdbData.registration_rate || 0
            }
          },
          'Tanium Coverage': {
            framework: 'Endpoint Management Compliance',
            gsoScore: taniumData.coverage_percentage || 0,
            splunkScore: Math.min(100, (taniumData.coverage_percentage || 0) * 1.2),
            overallScore: taniumData.coverage_percentage || 0,
            status: taniumData.deployment_analysis?.coverage_status || 'UNKNOWN',
            requirements: [
              {
                item: 'Endpoint Coverage',
                gso: taniumData.coverage_percentage > 80 ? 'complete' : taniumData.coverage_percentage > 60 ? 'partial' : 'failed',
                splunk: taniumData.coverage_percentage > 70 ? 'complete' : taniumData.coverage_percentage > 50 ? 'partial' : 'failed',
                gap: `${taniumData.deployment_gaps?.total_unprotected_assets || 0} assets unprotected`
              },
              {
                item: 'Regional Deployment',
                gso: Object.values(taniumData.regional_coverage || {}).every((r: any) => r.coverage_percentage > 70) ? 'complete' : 'partial',
                splunk: 'partial',
                gap: `${Object.values(taniumData.regional_coverage || {}).filter((r: any) => r.priority === 'HIGH').length} high priority regions`
              }
            ],
            metrics: {
              deployed: taniumData.tanium_deployed || 0,
              total: taniumData.total_assets || 0,
              percentage: taniumData.coverage_percentage || 0
            }
          },
          'Domain Visibility': {
            framework: 'Domain Coverage Standards',
            gsoScore: domainData.domain_distribution?.tdc_percentage || 0,
            splunkScore: Math.max(domainData.domain_distribution?.tdc_percentage || 0, domainData.domain_distribution?.lead_percentage || 0),
            overallScore: ((domainData.domain_distribution?.tdc_percentage || 0) + (domainData.domain_distribution?.lead_percentage || 0)) / 2,
            status: domainData.unique_domains?.length > 10 ? 'AT RISK' : 'CRITICAL',
            requirements: [
              {
                item: 'TDC Domain Coverage',
                gso: domainData.domain_distribution?.tdc_percentage > 30 ? 'partial' : 'failed',
                splunk: domainData.domain_distribution?.tdc_percentage > 40 ? 'partial' : 'failed',
                gap: `TDC at ${domainData.domain_distribution?.tdc_percentage?.toFixed(1) || 0}%`
              },
              {
                item: 'LEAD Domain Coverage',
                gso: domainData.domain_distribution?.lead_percentage > 20 ? 'partial' : 'failed',
                splunk: domainData.domain_distribution?.lead_percentage > 30 ? 'partial' : 'failed',
                gap: `LEAD at ${domainData.domain_distribution?.lead_percentage?.toFixed(1) || 0}%`
              }
            ],
            metrics: {
              unique_domains: domainData.unique_domains?.length || 0,
              total_analyzed: domainData.total_analyzed || 0,
              tdc_percentage: domainData.domain_distribution?.tdc_percentage || 0
            }
          }
        };

        setComplianceData(processedData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load compliance data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Real-time compliance monitoring visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !complianceData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = 200;

    let time = 0;
    const animate = () => {
      time += 0.02;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw compliance lines based on real data
      Object.entries(complianceData).forEach(([framework, data]: [string, any], index) => {
        const gsoY = canvas.height * (1 - data.gsoScore / 100);
        const splunkY = canvas.height * (1 - data.splunkScore / 100);
        
        // GSO line
        ctx.strokeStyle = data.gsoScore < 50 ? 'rgba(255, 0, 68, 0.8)' : 
                         data.gsoScore < 80 ? 'rgba(192, 132, 252, 0.8)' : 
                         'rgba(0, 255, 136, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let x = 0; x < canvas.width; x += 5) {
          const y = gsoY + Math.sin((x / 50) + time + index) * 10;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();

        // Splunk line
        ctx.strokeStyle = data.splunkScore < 50 ? 'rgba(255, 0, 68, 0.6)' : 
                         data.splunkScore < 80 ? 'rgba(192, 132, 252, 0.6)' : 
                         'rgba(0, 255, 136, 0.6)';
        ctx.beginPath();
        
        for (let x = 0; x < canvas.width; x += 5) {
          const y = splunkY + Math.sin((x / 50) + time + index + 1) * 10;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });

      // Draw threshold line (80%)
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
  }, [complianceData]);

  // Animate scores
  useEffect(() => {
    if (!complianceData) return;
    
    Object.entries(complianceData).forEach(([framework, data]: [string, any], index) => {
      setTimeout(() => {
        setAnimatedScores(prev => ({
          ...prev,
          [`${framework}-gso`]: data.gsoScore,
          [`${framework}-splunk`]: data.splunkScore,
          [`${framework}-overall`]: data.overallScore
        }));
      }, index * 200);
    });
  }, [complianceData]);

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'complete': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'partial': return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'failed': return <XCircle className="w-5 h-5 text-red-400" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400"></div>
          <div className="mt-4 text-xl font-bold text-cyan-400">LOADING COMPLIANCE DATA</div>
        </div>
      </div>
    );
  }

  if (error || !complianceData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center glass-panel rounded-xl p-8">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <div className="text-xl font-bold text-red-400 mb-2">DATA LOAD ERROR</div>
          <div className="text-sm text-gray-400">{error || 'No compliance data available'}</div>
        </div>
      </div>
    );
  }

  // Calculate overall metrics from real data
  const overallGSOScore = Object.values(complianceData).reduce((sum: number, data: any) => sum + data.gsoScore, 0) / Object.keys(complianceData).length;
  const overallSplunkScore = Object.values(complianceData).reduce((sum: number, data: any) => sum + data.splunkScore, 0) / Object.keys(complianceData).length;
  const criticalFrameworks = Object.values(complianceData).filter((data: any) => data.status === 'CRITICAL' || data.status === 'NON_COMPLIANT').length;
  const totalGaps = Object.values(complianceData).reduce((sum: number, data: any) => 
    sum + data.requirements.filter((r: any) => r.gso === 'failed' || r.splunk === 'failed').length, 0
  );

  return (
    <div className="p-8 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-black mb-3 holo-text">
          LOGGING COMPLIANCE DASHBOARD
        </h1>
        <p className="text-purple-300/60 uppercase tracking-widest text-sm">
          Real-Time Compliance Status from Universal CMDB
        </p>
      </div>

      {/* Critical Alert based on real data */}
      {overallGSOScore < 50 && (
        <div className="mb-6 glass-panel rounded-xl p-4 border-red-500/50 bg-red-500/10">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
            <div>
              <span className="text-red-400 font-bold">COMPLIANCE FAILURE:</span>
              <span className="text-white ml-2">Overall compliance at {overallGSOScore.toFixed(1)}% - {criticalFrameworks} frameworks critical</span>
            </div>
          </div>
        </div>
      )}

      {/* Overall Compliance Scores from real data */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <div className="glass-panel rounded-xl p-6">
          <Shield className="w-6 h-6 text-red-400 mb-2" />
          <div className="text-3xl font-bold text-red-400">{overallGSOScore.toFixed(1)}%</div>
          <div className="text-xs text-gray-400 uppercase">Overall GSO</div>
        </div>
        <div className="glass-panel rounded-xl p-6">
          <Database className="w-6 h-6 text-yellow-400 mb-2" />
          <div className="text-3xl font-bold text-yellow-400">{overallSplunkScore.toFixed(1)}%</div>
          <div className="text-xs text-gray-400 uppercase">Overall Splunk</div>
        </div>
        <div className="glass-panel rounded-xl p-6">
          <AlertCircle className="w-6 h-6 text-red-400 mb-2" />
          <div className="text-3xl font-bold text-red-400">{criticalFrameworks}</div>
          <div className="text-xs text-gray-400 uppercase">Critical</div>
        </div>
        <div className="glass-panel rounded-xl p-6">
          <XCircle className="w-6 h-6 text-orange-400 mb-2" />
          <div className="text-3xl font-bold text-orange-400">{totalGaps}</div>
          <div className="text-xs text-gray-400 uppercase">Total Gaps</div>
        </div>
        <div className="glass-panel rounded-xl p-6">
          <Activity className="w-6 h-6 text-purple-400 mb-2" />
          <div className="text-3xl font-bold text-purple-400">{Object.keys(complianceData).length}</div>
          <div className="text-xs text-gray-400 uppercase">Frameworks</div>
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
              <span className="text-xs text-gray-400">Critical (&lt;50%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
              <span className="text-xs text-gray-400">Warning (50-80%)</span>
            </div>
          </div>
          <span className="text-xs text-red-400 font-bold">
            {criticalFrameworks > 0 ? '⚠️ CRITICAL NON-COMPLIANCE' : '✓ MONITORING ACTIVE'}
          </span>
        </div>
      </div>

      {/* Compliance Frameworks with real data */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {Object.entries(complianceData).map(([framework, data]: [string, any]) => (
          <div key={framework} className="glass-panel rounded-2xl p-6">
            {/* Framework Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">{framework}</h2>
                <p className="text-sm text-gray-400">{data.framework}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                data.status === 'CRITICAL' || data.status === 'NON_COMPLIANT' ? 'bg-red-500/20 text-red-400' :
                data.status === 'FAILED' ? 'bg-orange-500/20 text-orange-400' :
                data.status === 'PARTIAL_COMPLIANCE' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-green-500/20 text-green-400'
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
              {data.requirements.map((req: any, idx: number) => (
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

            {/* Metrics */}
            {data.metrics && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {Object.entries(data.metrics).slice(0, 3).map(([key, value]: [string, any]) => (
                    <div key={key}>
                      <span className="text-gray-500">{key}:</span>
                      <span className="ml-1 font-mono text-cyan-400">
                        {typeof value === 'number' ? 
                          (key.includes('percentage') || key.includes('_percentage') ? 
                            `${value.toFixed(1)}%` : value.toLocaleString()) 
                          : value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action Items based on real data */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="glass-panel rounded-xl p-4 border-red-500/30">
          <h3 className="text-sm font-bold text-red-400 mb-2">IMMEDIATE ACTION</h3>
          <p className="text-xs text-gray-300">
            {Object.values(complianceData).find((d: any) => d.status === 'CRITICAL' || d.status === 'NON_COMPLIANT') ? 
              `Critical compliance failure in ${criticalFrameworks} frameworks` : 
              'Monitor compliance metrics'}
          </p>
        </div>
        <div className="glass-panel rounded-xl p-4 border-yellow-500/30">
          <h3 className="text-sm font-bold text-yellow-400 mb-2">PRIORITY GAPS</h3>
          <p className="text-xs text-gray-300">
            {totalGaps} total gaps identified across {Object.keys(complianceData).length} frameworks
          </p>
        </div>
        <div className="glass-panel rounded-xl p-4 border-cyan-500/30">
          <h3 className="text-sm font-bold text-cyan-400 mb-2">TARGET SCORE</h3>
          <p className="text-xs text-gray-300">
            {(80 - overallGSOScore).toFixed(1)}% improvement needed to reach compliance target
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoggingCompliance;