import React, { useState } from 'react';
import { AlertCircle, XCircle, TrendingUp, Database, Shield, Activity, Network, Cloud } from 'lucide-react';

const VisibilityGapsPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const visibilityGaps = [
    {
      id: 'GAP-001',
      category: 'infrastructure',
      system: 'Hyper-V Server',
      gap: 'No Chronicle Integration',
      coverage: 0,
      impact: 'critical',
      description: 'Hyper-V servers have 0% visibility in Chronicle platform',
      recommendation: 'Deploy Chronicle forwarders on all Hyper-V hosts',
      effort: 'high',
      priority: 1
    },
    {
      id: 'GAP-002',
      category: 'infrastructure',
      system: 'IBM HMC Server',
      gap: 'Missing Splunk Logs',
      coverage: 0,
      impact: 'critical',
      description: 'IBM HMC servers not forwarding logs to Splunk',
      recommendation: 'Configure syslog forwarding to Splunk indexers',
      effort: 'medium',
      priority: 1
    },
    {
      id: 'GAP-003',
      category: 'cloud',
      system: 'AWS CloudTrail',
      gap: 'Incomplete Event Coverage',
      coverage: 45,
      impact: 'high',
      description: 'Only management events logged, data events missing',
      recommendation: 'Enable data event logging for S3 and Lambda',
      effort: 'low',
      priority: 2
    },
    {
      id: 'GAP-004',
      category: 'application',
      system: 'API Gateway',
      gap: 'No Request/Response Logging',
      coverage: 30,
      impact: 'high',
      description: 'API Gateway not logging full request/response data',
      recommendation: 'Enable comprehensive API logging with body capture',
      effort: 'medium',
      priority: 2
    },
    {
      id: 'GAP-005',
      category: 'endpoint',
      system: 'Mobile Devices',
      gap: 'No EDR Coverage',
      coverage: 0,
      impact: 'high',
      description: 'Mobile devices lack endpoint detection and response',
      recommendation: 'Deploy mobile EDR solution',
      effort: 'high',
      priority: 3
    },
    {
      id: 'GAP-006',
      category: 'network',
      system: 'DNS Servers',
      gap: 'Query Logging Disabled',
      coverage: 20,
      impact: 'medium',
      description: 'DNS query logs not captured for threat hunting',
      recommendation: 'Enable DNS query logging on all resolvers',
      effort: 'low',
      priority: 3
    },
    {
      id: 'GAP-007',
      category: 'identity',
      system: 'Privileged Access',
      gap: 'PAM Events Not Forwarded',
      coverage: 60,
      impact: 'high',
      description: 'Privileged access management events not in SIEM',
      recommendation: 'Integrate PAM solution with SIEM platforms',
      effort: 'medium',
      priority: 2
    },
    {
      id: 'GAP-008',
      category: 'cloud',
      system: 'Container Orchestration',
      gap: 'Kubernetes Audit Logs Missing',
      coverage: 10,
      impact: 'critical',
      description: 'K8s audit logs not collected from clusters',
      recommendation: 'Deploy Falco and forward to SIEM',
      effort: 'medium',
      priority: 1
    }
  ];

  const categories = [
    { id: 'all', label: 'All', icon: Database },
    { id: 'infrastructure', label: 'Infrastructure', icon: Shield },
    { id: 'cloud', label: 'Cloud', icon: Cloud },
    { id: 'network', label: 'Network', icon: Network },
    { id: 'endpoint', label: 'Endpoint', icon: Activity },
    { id: 'application', label: 'Application', icon: Database },
    { id: 'identity', label: 'Identity', icon: Shield }
  ];

  const filteredGaps = selectedCategory === 'all' 
    ? visibilityGaps 
    : visibilityGaps.filter(gap => gap.category === selectedCategory);

  const getImpactColor = (impact: string) => {
    switch(impact) {
      case 'critical': return 'text-red-400 bg-red-400/10 border-red-400/30';
      case 'high': return 'text-orange-400 bg-orange-400/10 border-orange-400/30';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      default: return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
    }
  };

  const getEffortColor = (effort: string) => {
    switch(effort) {
      case 'high': return 'text-purple-400';
      case 'medium': return 'text-cyan-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const totalGaps = visibilityGaps.length;
  const criticalGaps = visibilityGaps.filter(g => g.impact === 'critical').length;
  const avgCoverage = visibilityGaps.reduce((acc, g) => acc + g.coverage, 0) / totalGaps;

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-2" style={{
          fontFamily: 'Orbitron, monospace',
          background: 'linear-gradient(135deg, #ff8800, #ffff00, #00ff88)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          VISIBILITY GAP ANALYSIS
        </h1>
        <p className="text-orange-400/60 font-mono text-sm">
          Identify and remediate critical blind spots in security monitoring coverage
        </p>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="backdrop-blur-xl bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-xl p-4 border border-red-400/30">
          <XCircle className="w-6 h-6 text-red-400 mb-2" />
          <div className="text-3xl font-bold font-mono text-red-400">{totalGaps}</div>
          <div className="text-xs text-red-400/60 font-mono">TOTAL GAPS</div>
        </div>
        <div className="backdrop-blur-xl bg-gradient-to-br from-orange-500/10 to-yellow-500/10 rounded-xl p-4 border border-orange-400/30">
          <AlertCircle className="w-6 h-6 text-orange-400 mb-2" />
          <div className="text-3xl font-bold font-mono text-orange-400">{criticalGaps}</div>
          <div className="text-xs text-orange-400/60 font-mono">CRITICAL</div>
        </div>
        <div className="backdrop-blur-xl bg-gradient-to-br from-yellow-500/10 to-green-500/10 rounded-xl p-4 border border-yellow-400/30">
          <Activity className="w-6 h-6 text-yellow-400 mb-2" />
          <div className="text-3xl font-bold font-mono text-yellow-400">{avgCoverage.toFixed(0)}%</div>
          <div className="text-xs text-yellow-400/60 font-mono">AVG COVERAGE</div>
        </div>
        <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/10 to-cyan-500/10 rounded-xl p-4 border border-green-400/30">
          <TrendingUp className="w-6 h-6 text-green-400 mb-2" />
          <div className="text-3xl font-bold font-mono text-green-400">+5%</div>
          <div className="text-xs text-green-400/60 font-mono">IMPROVEMENT</div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map(cat => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm font-bold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-orange-400/20 border border-orange-400/50 text-orange-400'
                  : 'bg-black/40 border border-orange-400/20 text-orange-400/60 hover:border-orange-400/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Gaps Grid */}
      <div className="grid grid-cols-1 gap-6">
        {filteredGaps.map(gap => (
          <div
            key={gap.id}
            className="backdrop-blur-xl bg-black/40 rounded-xl border border-orange-400/20 hover:border-orange-400/40 transition-all"
            style={{ boxShadow: '0 0 30px rgba(255, 136, 0, 0.05), inset 0 0 30px rgba(0, 0, 0, 0.5)' }}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${getImpactColor(gap.impact)}`}>
                    {gap.impact.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-mono font-bold text-cyan-300">{gap.system}</h3>
                    <p className="text-sm text-orange-400">{gap.gap}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold font-mono text-red-400">{gap.coverage}%</div>
                  <div className="text-xs text-cyan-400/60">CURRENT COVERAGE</div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-black/30 rounded-lg p-4 mb-4">
                <p className="text-sm text-cyan-300 mb-3">{gap.description}</p>
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-xs text-cyan-400/60">PRIORITY</span>
                    <div className="flex gap-1 mt-1">
                      {[1,2,3,4,5].map(p => (
                        <div key={p} className={`w-2 h-2 rounded-full ${
                          p <= gap.priority ? 'bg-red-400' : 'bg-gray-600'
                        }`} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-cyan-400/60">EFFORT</span>
                    <div className={`text-sm font-mono font-bold mt-1 ${getEffortColor(gap.effort)}`}>
                      {gap.effort.toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-cyan-400/60">CATEGORY</span>
                    <div className="text-sm font-mono text-cyan-400 mt-1">
                      {gap.category.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div className="flex items-center gap-2 bg-green-400/5 rounded-lg p-3 border border-green-400/20">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <div className="flex-1">
                  <div className="text-xs text-green-400/60 mb-1">RECOMMENDATION</div>
                  <p className="text-sm text-green-400">{gap.recommendation}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Impact Matrix */}
      <div className="mt-8 backdrop-blur-xl bg-black/40 rounded-xl border border-cyan-400/30 p-6"
           style={{ boxShadow: '0 0 40px rgba(0, 255, 255, 0.1), inset 0 0 40px rgba(0, 0, 0, 0.5)' }}>
        <h2 className="text-xl font-bold text-cyan-400 mb-4" style={{ fontFamily: 'Orbitron, monospace' }}>
          IMPACT vs EFFORT MATRIX
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-red-400/10 rounded-lg p-4 border border-red-400/30">
            <h3 className="text-sm font-mono font-bold text-red-400 mb-2">HIGH IMPACT / LOW EFFORT</h3>
            <p className="text-xs text-red-400/80">Quick wins - DNS logging, API logging</p>
          </div>
          <div className="bg-orange-400/10 rounded-lg p-4 border border-orange-400/30">
            <h3 className="text-sm font-mono font-bold text-orange-400 mb-2">HIGH IMPACT / HIGH EFFORT</h3>
            <p className="text-xs text-orange-400/80">Strategic - Mobile EDR, Chronicle integration</p>
          </div>
          <div className="bg-yellow-400/10 rounded-lg p-4 border border-yellow-400/30">
            <h3 className="text-sm font-mono font-bold text-yellow-400 mb-2">LOW IMPACT / LOW EFFORT</h3>
            <p className="text-xs text-yellow-400/80">Fill-ins - Minor configuration updates</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisibilityGapsPage;