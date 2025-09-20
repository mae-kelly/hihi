import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, AlertCircle, TrendingUp, TrendingDown, FileText, Hexagon, Triangle, Circle, Lock, Key, Zap } from 'lucide-react';

const CompliancePage: React.FC = () => {
  const [selectedFramework, setSelectedFramework] = useState('ISO27001');
  const [animatedScores, setAnimatedScores] = useState<Record<string, number>>({});

  const frameworks = {
    ISO27001: {
      name: 'ISO 27001:2025',
      score: 92,
      controls: 114,
      met: 105,
      partial: 6,
      failed: 3,
      trend: 'up',
      lastAudit: '2025-01-15',
      categories: [
        { name: 'Quantum Security', score: 95, controls: 12 },
        { name: 'Neural Protection', score: 88, controls: 15 },
        { name: 'Data Integrity', score: 91, controls: 10 },
        { name: 'Access Matrix', score: 94, controls: 20 },
        { name: 'Encryption Protocols', score: 96, controls: 8 }
      ]
    },
    NIST: {
      name: 'NIST Quantum Framework',
      score: 88,
      controls: 98,
      met: 86,
      partial: 7,
      failed: 5,
      trend: 'up',
      lastAudit: '2025-01-10',
      categories: [
        { name: 'Identify', score: 85, controls: 20 },
        { name: 'Protect', score: 90, controls: 25 },
        { name: 'Detect', score: 87, controls: 18 },
        { name: 'Respond', score: 89, controls: 20 },
        { name: 'Recover', score: 88, controls: 15 }
      ]
    },
    SOC2: {
      name: 'SOC 2 Quantum',
      score: 95,
      controls: 64,
      met: 61,
      partial: 1,
      failed: 2,
      trend: 'stable',
      lastAudit: '2025-01-20',
      categories: [
        { name: 'Security', score: 96, controls: 20 },
        { name: 'Availability', score: 94, controls: 12 },
        { name: 'Integrity', score: 95, controls: 10 },
        { name: 'Confidentiality', score: 97, controls: 12 },
        { name: 'Privacy', score: 93, controls: 10 }
      ]
    }
  };

  // Animate scores
  useEffect(() => {
    const framework = frameworks[selectedFramework as keyof typeof frameworks];
    framework.categories.forEach((category, index) => {
      setTimeout(() => {
        setAnimatedScores(prev => ({
          ...prev,
          [category.name]: category.score
        }));
      }, index * 100);
    });
  }, [selectedFramework]);

  const framework = frameworks[selectedFramework as keyof typeof frameworks];

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#00ffff';
    if (score >= 70) return '#c084fc';
    return '#ff00ff';
  };

  return (
    <div className="p-8 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-black mb-3 holo-text">
          COMPLIANCE PROTOCOLS
        </h1>
        <p className="text-purple-300/60 uppercase tracking-widest text-sm">
          Quantum Compliance Tracking • Regulatory Matrix Analysis
        </p>
      </div>

      {/* Framework Selector */}
      <div className="flex gap-2 mb-8">
        {Object.keys(frameworks).map(fw => (
          <button
            key={fw}
            onClick={() => setSelectedFramework(fw)}
            className={`px-6 py-3 rounded-xl font-semibold uppercase tracking-wider transition-all ${
              selectedFramework === fw
                ? 'glass-panel scale-105'
                : 'bg-black/30 hover:bg-black/50'
            }`}
            style={{
              borderColor: selectedFramework === fw ? 'rgba(192, 132, 252, 0.3)' : 'transparent',
              boxShadow: selectedFramework === fw 
                ? '0 0 30px rgba(192, 132, 252, 0.3)' 
                : 'none'
            }}
          >
            <span className={selectedFramework === fw ? 'text-purple-300' : 'text-gray-500'}>
              {fw}
            </span>
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Central Score Display */}
        <div className="col-span-4">
          <div className="glass-panel rounded-2xl p-8 relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-purple-400 animate-pulse" />
            </div>

            <div className="relative">
              {/* Score Circle */}
              <div className="relative w-48 h-48 mx-auto mb-6">
                <svg className="w-48 h-48 transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="rgba(192, 132, 252, 0.1)"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="url(#scoreGradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 88}`}
                    strokeDashoffset={`${2 * Math.PI * 88 * (1 - framework.score / 100)}`}
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00ffff" />
                      <stop offset="50%" stopColor="#c084fc" />
                      <stop offset="100%" stopColor="#ff00ff" />
                    </linearGradient>
                  </defs>
                </svg>
                
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-5xl font-black" style={{ color: getScoreColor(framework.score) }}>
                      {framework.score}%
                    </div>
                    <div className="text-xs text-purple-400/60 uppercase">Compliance</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center glass-panel rounded-lg p-3">
                  <span className="text-xs text-cyan-400/60">FRAMEWORK</span>
                  <span className="text-sm font-bold text-cyan-400">{framework.name}</span>
                </div>
                <div className="flex justify-between items-center glass-panel rounded-lg p-3">
                  <span className="text-xs text-purple-400/60">CONTROLS</span>
                  <span className="text-sm font-bold text-purple-400">{framework.controls}</span>
                </div>
                <div className="flex justify-between items-center glass-panel rounded-lg p-3">
                  <span className="text-xs text-pink-400/60">LAST AUDIT</span>
                  <span className="text-sm font-bold text-pink-400">{framework.lastAudit}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="col-span-5">
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-cyan-300 mb-6 uppercase tracking-wider">
              Control Categories
            </h3>
            
            <div className="space-y-4">
              {framework.categories.map((category, index) => (
                <div key={category.name} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{category.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs opacity-60">{category.controls} controls</span>
                      <span className="text-sm font-bold" style={{ color: getScoreColor(category.score) }}>
                        {animatedScores[category.name]?.toFixed(0) || 0}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="relative h-3 bg-black/50 rounded-full overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 holo-shine"
                      style={{
                        width: `${animatedScores[category.name] || 0}%`,
                        background: `linear-gradient(90deg, ${getScoreColor(category.score)}, ${
                          category.score >= 90 ? '#c084fc' : '#ff00ff'
                        })`,
                        boxShadow: `0 0 20px ${getScoreColor(category.score)}`,
                        animationDelay: `${index * 0.1}s`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="col-span-3 space-y-4">
          {/* Control Status */}
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-purple-300 mb-4 uppercase tracking-wider">
              Control Status
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-sm">MET</span>
                </div>
                <div className="text-2xl font-bold text-green-400">{framework.met}</div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm">PARTIAL</span>
                </div>
                <div className="text-2xl font-bold text-yellow-400">{framework.partial}</div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-400" />
                  <span className="text-sm">FAILED</span>
                </div>
                <div className="text-2xl font-bold text-red-400">{framework.failed}</div>
              </div>
            </div>
          </div>

          {/* Trend Indicator */}
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-cyan-300 mb-4 uppercase tracking-wider">
              Trend Analysis
            </h3>
            
            <div className="flex items-center justify-center">
              {framework.trend === 'up' ? (
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 text-green-400" />
                  <span className="text-sm text-green-400">IMPROVING</span>
                </div>
              ) : framework.trend === 'down' ? (
                <div className="text-center">
                  <TrendingDown className="w-12 h-12 mx-auto mb-2 text-red-400" />
                  <span className="text-sm text-red-400">DECLINING</span>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 border-2 border-yellow-400 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                  </div>
                  <span className="text-sm text-yellow-400">STABLE</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}
          <button className="w-full neon-btn py-4 rounded-xl font-semibold uppercase tracking-wider">
            Generate Report
          </button>
        </div>
      </div>

      {/* Platform Compliance */}
      <div className="mt-8 glass-panel rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-purple-300 mb-6 uppercase tracking-wider">
          Platform Integration Status
        </h3>
        
        <div className="grid grid-cols-3 gap-4">
          {[
            { name: 'QUANTUM CORE', compliant: 95, color: '#00ffff' },
            { name: 'NEURAL MATRIX', compliant: 72, color: '#c084fc' },
            { name: 'PHOTON GRID', compliant: 88, color: '#ff00ff' }
          ].map(platform => (
            <div key={platform.name} className="glass-panel rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono font-bold text-sm">{platform.name}</span>
                <span className="text-sm font-bold" style={{ color: platform.color }}>
                  {platform.compliant}%
                </span>
              </div>
              <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${platform.compliant}%`,
                    background: platform.color,
                    boxShadow: `0 0 10px ${platform.color}`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompliancePage;