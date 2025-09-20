import React, { useState } from 'react';
import { Shield, CheckCircle, XCircle, AlertCircle, TrendingUp, TrendingDown, FileText } from 'lucide-react';

const CompliancePage: React.FC = () => {
  const [selectedFramework, setSelectedFramework] = useState<string>('ISO27001');

  const frameworks = {
    ISO27001: {
      score: 92,
      controls: 114,
      met: 105,
      partial: 6,
      failed: 3,
      trend: 'up',
      lastAudit: '2025-01-15'
    },
    NIST: {
      score: 88,
      controls: 98,
      met: 86,
      partial: 7,
      failed: 5,
      trend: 'up',
      lastAudit: '2025-01-10'
    },
    SOC2: {
      score: 95,
      controls: 64,
      met: 61,
      partial: 1,
      failed: 2,
      trend: 'stable',
      lastAudit: '2025-01-20'
    }
  };

  const loggingCompliance = {
    GSO: { compliant: 85, partial: 10, failed: 5 },
    Splunk: { compliant: 72, partial: 18, failed: 10 },
    Chronicle: { compliant: 65, partial: 20, failed: 15 }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-2" style={{
          fontFamily: 'Orbitron, monospace',
          background: 'linear-gradient(135deg, #00ffff, #00d4ff, #a855f7)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          COMPLIANCE & GOVERNANCE
        </h1>
        <p className="text-cyan-400/60 font-mono text-sm">
          Real-time compliance tracking across GSO, Splunk, and Chronicle platforms
        </p>
      </div>

      {/* Framework Selection Tabs */}
      <div className="flex gap-2 mb-6">
        {Object.keys(frameworks).map(fw => (
          <button
            key={fw}
            onClick={() => setSelectedFramework(fw)}
            className={`px-6 py-2 rounded-lg font-mono text-sm font-bold transition-all ${
              selectedFramework === fw
                ? 'bg-cyan-400/20 border border-cyan-400/50 text-cyan-400'
                : 'bg-black/40 border border-cyan-400/20 text-cyan-400/60 hover:border-cyan-400/40'
            }`}
          >
            {fw}
          </button>
        ))}
      </div>

      {/* Framework Details */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/10 to-cyan-500/10 rounded-xl p-6 border border-green-400/30">
          <div className="flex items-center justify-between mb-3">
            <Shield className="w-6 h-6 text-green-400" />
            <span className="text-xs font-mono text-green-400/60">SCORE</span>
          </div>
          <div className="text-4xl font-black font-mono text-green-400">
            {frameworks[selectedFramework as keyof typeof frameworks].score}%
          </div>
          <div className="mt-3 flex items-center gap-2">
            {frameworks[selectedFramework as keyof typeof frameworks].trend === 'up' ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
            <span className="text-xs font-mono text-green-400/60">
              Last audit: {frameworks[selectedFramework as keyof typeof frameworks].lastAudit}
            </span>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl p-6 border border-cyan-400/30">
          <div className="flex items-center justify-between mb-3">
            <CheckCircle className="w-6 h-6 text-cyan-400" />
            <span className="text-xs font-mono text-cyan-400/60">MET</span>
          </div>
          <div className="text-4xl font-black font-mono text-cyan-400">
            {frameworks[selectedFramework as keyof typeof frameworks].met}
          </div>
          <div className="mt-3 text-xs font-mono text-cyan-400/60">
            Controls passed
          </div>
        </div>

        <div className="backdrop-blur-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-xl p-6 border border-yellow-400/30">
          <div className="flex items-center justify-between mb-3">
            <AlertCircle className="w-6 h-6 text-yellow-400" />
            <span className="text-xs font-mono text-yellow-400/60">PARTIAL</span>
          </div>
          <div className="text-4xl font-black font-mono text-yellow-400">
            {frameworks[selectedFramework as keyof typeof frameworks].partial}
          </div>
          <div className="mt-3 text-xs font-mono text-yellow-400/60">
            Needs improvement
          </div>
        </div>

        <div className="backdrop-blur-xl bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-xl p-6 border border-red-400/30">
          <div className="flex items-center justify-between mb-3">
            <XCircle className="w-6 h-6 text-red-400" />
            <span className="text-xs font-mono text-red-400/60">FAILED</span>
          </div>
          <div className="text-4xl font-black font-mono text-red-400">
            {frameworks[selectedFramework as keyof typeof frameworks].failed}
          </div>
          <div className="mt-3 text-xs font-mono text-red-400/60">
            Critical gaps
          </div>
        </div>
      </div>

      {/* Logging Compliance by Platform */}
      <div className="backdrop-blur-xl bg-black/40 rounded-xl border border-cyan-400/30 p-6 mb-8"
           style={{ boxShadow: '0 0 40px rgba(0, 255, 255, 0.1), inset 0 0 40px rgba(0, 0, 0, 0.5)' }}>
        <h2 className="text-xl font-bold text-cyan-400 mb-6" style={{ fontFamily: 'Orbitron, monospace' }}>
          LOGGING COMPLIANCE BY PLATFORM
        </h2>
        
        <div className="space-y-4">
          {Object.entries(loggingCompliance).map(([platform, stats]) => (
            <div key={platform} className="bg-black/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono font-bold text-cyan-300">{platform}</span>
                <span className="text-sm font-mono text-green-400">{stats.compliant}% Compliant</span>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 h-3 bg-green-400/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-400 to-cyan-400"
                    style={{ width: `${stats.compliant}%` }}
                  />
                </div>
                <div className="flex-1 h-3 bg-yellow-400/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-400"
                    style={{ width: `${stats.partial}%` }}
                  />
                </div>
                <div className="flex-1 h-3 bg-red-400/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-red-400 to-pink-400"
                    style={{ width: `${stats.failed}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Critical Compliance Issues */}
      <div className="grid grid-cols-2 gap-6">
        <div className="backdrop-blur-xl bg-red-400/5 rounded-xl p-6 border border-red-400/30">
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-bold text-red-400">CRITICAL ISSUES</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-black/30 rounded">
              <span className="text-sm font-mono text-red-400/80">Missing EDR logs from endpoints</span>
              <span className="text-xs font-mono text-red-400">HIGH</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-black/30 rounded">
              <span className="text-sm font-mono text-red-400/80">Cloud security logs not forwarded</span>
              <span className="text-xs font-mono text-red-400">HIGH</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-black/30 rounded">
              <span className="text-sm font-mono text-red-400/80">API gateway logging disabled</span>
              <span className="text-xs font-mono text-red-400">CRITICAL</span>
            </div>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-green-400/5 rounded-xl p-6 border border-green-400/30">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-bold text-green-400">RECENT IMPROVEMENTS</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-black/30 rounded">
              <span className="text-sm font-mono text-green-400/80">Firewall logging enabled</span>
              <span className="text-xs font-mono text-green-400">+15%</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-black/30 rounded">
              <span className="text-sm font-mono text-green-400/80">DNS query logging active</span>
              <span className="text-xs font-mono text-green-400">+8%</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-black/30 rounded">
              <span className="text-sm font-mono text-green-400/80">SIEM integration complete</span>
              <span className="text-xs font-mono text-green-400">+12%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompliancePage;