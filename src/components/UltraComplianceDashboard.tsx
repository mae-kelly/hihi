import React, { useState, useEffect, useRef } from 'react';
import { Shield, CheckCircle, XCircle, AlertCircle, TrendingUp, TrendingDown, FileText, BarChart3, Lock, Key, Award, Target, Zap, Globe } from 'lucide-react';

const UltraComplianceDashboard: React.FC = () => {
  const [selectedFramework, setSelectedFramework] = useState('ISO27001');
  const [complianceScore, setComplianceScore] = useState(0);
  const [animatedScores, setAnimatedScores] = useState<Record<string, number>>({});
  const hologramRef = useRef<HTMLDivElement>(null);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [pulseEffect, setPulseEffect] = useState(0);

  const frameworks = {
    ISO27001: {
      name: 'ISO 27001:2022',
      score: 92,
      controls: 114,
      met: 105,
      partial: 6,
      failed: 3,
      trend: 'up',
      lastAudit: '2025-01-15',
      nextAudit: '2025-04-15',
      categories: [
        { name: 'Information Security Policies', score: 95, controls: 8 },
        { name: 'Organization of Information Security', score: 88, controls: 12 },
        { name: 'Human Resource Security', score: 91, controls: 10 },
        { name: 'Asset Management', score: 94, controls: 15 },
        { name: 'Access Control', score: 89, controls: 20 },
        { name: 'Cryptography', score: 96, controls: 5 },
        { name: 'Physical Security', score: 93, controls: 8 },
        { name: 'Operations Security', score: 90, controls: 18 }
      ]
    },
    NIST: {
      name: 'NIST CSF 2.0',
      score: 88,
      controls: 98,
      met: 86,
      partial: 7,
      failed: 5,
      trend: 'up',
      lastAudit: '2025-01-10',
      nextAudit: '2025-04-10',
      categories: [
        { name: 'Identify', score: 85, controls: 20 },
        { name: 'Protect', score: 90, controls: 25 },
        { name: 'Detect', score: 87, controls: 18 },
        { name: 'Respond', score: 89, controls: 20 },
        { name: 'Recover', score: 88, controls: 15 }
      ]
    },
    SOC2: {
      name: 'SOC 2 Type II',
      score: 95,
      controls: 64,
      met: 61,
      partial: 1,
      failed: 2,
      trend: 'stable',
      lastAudit: '2025-01-20',
      nextAudit: '2025-07-20',
      categories: [
        { name: 'Security', score: 96, controls: 20 },
        { name: 'Availability', score: 94, controls: 12 },
        { name: 'Processing Integrity', score: 95, controls: 10 },
        { name: 'Confidentiality', score: 97, controls: 12 },
        { name: 'Privacy', score: 93, controls: 10 }
      ]
    },
    GDPR: {
      name: 'GDPR',
      score: 91,
      controls: 75,
      met: 68,
      partial: 5,
      failed: 2,
      trend: 'up',
      lastAudit: '2025-01-08',
      nextAudit: '2025-03-08',
      categories: [
        { name: 'Lawfulness & Transparency', score: 92, controls: 15 },
        { name: 'Purpose Limitation', score: 90, controls: 10 },
        { name: 'Data Minimization', score: 88, controls: 8 },
        { name: 'Accuracy', score: 94, controls: 7 },
        { name: 'Storage Limitation', score: 91, controls: 10 },
        { name: 'Integrity & Confidentiality', score: 93, controls: 15 },
        { name: 'Accountability', score: 89, controls: 10 }
      ]
    }
  };

  // Animate scores on mount and framework change
  useEffect(() => {
    const framework = frameworks[selectedFramework as keyof typeof frameworks];
    let current = 0;
    const target = framework.score;
    const increment = target / 50;

    const timer = setInterval(() => {
      current = Math.min(current + increment, target);
      setComplianceScore(current);
      
      if (current >= target) {
        clearInterval(timer);
      }
    }, 20);

    // Animate category scores
    framework.categories.forEach((category, index) => {
      setTimeout(() => {
        setAnimatedScores(prev => ({
          ...prev,
          [category.name]: category.score
        }));
      }, index * 100);
    });

    return () => clearInterval(timer);
  }, [selectedFramework]);

  // 3D rotation animation
  useEffect(() => {
    const interval = setInterval(() => {
      setRotationAngle(prev => (prev + 1) % 360);
      setPulseEffect(prev => (prev + 0.1) % (Math.PI * 2));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const framework = frameworks[selectedFramework as keyof typeof frameworks];

  // Calculate days until next audit
  const daysUntilAudit = Math.floor((new Date(framework.nextAudit).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="p-6 min-h-screen relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 opacity-20">
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at 30% 20%, rgba(0, 255, 136, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 70% 60%, rgba(168, 85, 247, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 50% 90%, rgba(0, 255, 255, 0.3) 0%, transparent 50%)
            `,
            animation: 'pulse 10s ease-in-out infinite'
          }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 mb-8">
        <h1 className="text-5xl font-black mb-2" style={{
          fontFamily: 'Orbitron, monospace',
          textShadow: '0 0 40px rgba(0, 255, 136, 0.8)'
        }}>
          <span style={{
            background: 'linear-gradient(135deg, #00ff88, #00ffff, #a855f7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundSize: '200% 200%',
            animation: 'gradient-shift 3s ease infinite'
          }}>
            COMPLIANCE COMMAND CENTER
          </span>
        </h1>
        <p className="text-green-400/60 font-mono text-sm tracking-wider">
          MULTI-FRAMEWORK REGULATORY COMPLIANCE MONITORING
        </p>
      </div>

      {/* Framework selector with holographic effect */}
      <div className="relative z-10 mb-8">
        <div className="flex gap-3">
          {Object.keys(frameworks).map(fw => (
            <button
              key={fw}
              onClick={() => setSelectedFramework(fw)}
              className={`relative px-8 py-4 rounded-xl font-mono text-sm font-bold transition-all transform ${
                selectedFramework === fw
                  ? 'scale-105'
                  : 'scale-100 hover:scale-102'
              }`}
              style={{
                background: selectedFramework === fw
                  ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(0, 255, 255, 0.2))'
                  : 'rgba(0, 0, 0, 0.4)',
                border: `2px solid ${selectedFramework === fw ? '#00ff88' : 'rgba(0, 255, 136, 0.2)'}`,
                boxShadow: selectedFramework === fw
                  ? '0 0 30px rgba(0, 255, 136, 0.5), inset 0 0 20px rgba(0, 255, 136, 0.1)'
                  : '0 0 20px rgba(0, 0, 0, 0.5)'
              }}
            >
              {selectedFramework === fw && (
                <div className="absolute inset-0 rounded-xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 via-cyan-400/20 to-purple-400/20"
                       style={{ animation: 'shimmer 2s linear infinite' }} />
                </div>
              )}
              <span className="relative z-10">{fw}</span>
              {selectedFramework === fw && (
                <div className="absolute -top-2 -right-2">
                  <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main dashboard grid */}
      <div className="relative z-10 grid grid-cols-12 gap-6">
        {/* Central holographic display */}
        <div className="col-span-4">
          <div 
            ref={hologramRef}
            className="relative backdrop-blur-xl bg-black/40 rounded-2xl border border-green-400/30 p-8"
            style={{
              boxShadow: '0 0 60px rgba(0, 255, 136, 0.3), inset 0 0 60px rgba(0, 0, 0, 0.5)',
              transform: `perspective(1000px) rotateY(${Math.sin(rotationAngle * 0.01) * 5}deg)`
            }}
          >
            {/* 3D Score display */}
            <div className="relative h-64 flex items-center justify-center">
              {/* Rotating rings */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div 
                  className="absolute w-48 h-48 border-4 border-green-400/30 rounded-full"
                  style={{ transform: `rotateX(${rotationAngle}deg) rotateY(${rotationAngle * 0.5}deg)` }}
                />
                <div 
                  className="absolute w-40 h-40 border-4 border-cyan-400/30 rounded-full"
                  style={{ transform: `rotateX(${-rotationAngle * 0.8}deg) rotateZ(${rotationAngle}deg)` }}
                />
                <div 
                  className="absolute w-32 h-32 border-4 border-purple-400/30 rounded-full"
                  style={{ transform: `rotateY(${rotationAngle * 1.2}deg) rotateZ(${-rotationAngle * 0.6}deg)` }}
                />
              </div>

              {/* Central score */}
              <div className="relative text-center">
                <div className="text-6xl font-black font-mono mb-2"
                     style={{
                       color: complianceScore >= 90 ? '#00ff88' :
                              complianceScore >= 75 ? '#00ffff' :
                              complianceScore >= 60 ? '#ffff00' :
                              '#ff0044',
                       textShadow: `0 0 40px currentColor, 0 0 80px currentColor`,
                       transform: `scale(${1 + Math.sin(pulseEffect) * 0.1})`
                     }}>
                  {Math.floor(complianceScore)}%
                </div>
                <div className="text-sm font-mono opacity-80">COMPLIANCE SCORE</div>
              </div>

              {/* Orbiting particles */}
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-green-400 rounded-full"
                  style={{
                    top: `${50 + Math.sin((rotationAngle + i * 60) * Math.PI / 180) * 40}%`,
                    left: `${50 + Math.cos((rotationAngle + i * 60) * Math.PI / 180) * 40}%`,
                    boxShadow: '0 0 10px rgba(0, 255, 136, 0.8)',
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              ))}
            </div>

            {/* Framework details */}
            <div className="space-y-3 mt-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono opacity-60">FRAMEWORK</span>
                <span className="text-sm font-mono font-bold text-green-400">{framework.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono opacity-60">CONTROLS</span>
                <span className="text-sm font-mono font-bold">{framework.controls}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono opacity-60">NEXT AUDIT</span>
                <span className="text-sm font-mono font-bold text-cyan-400">{daysUntilAudit} DAYS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="col-span-5">
          <div className="backdrop-blur-xl bg-black/40 rounded-2xl border border-cyan-400/30 p-6"
               style={{
                 boxShadow: '0 0 60px rgba(0, 255, 255, 0.2), inset 0 0 60px rgba(0, 0, 0, 0.5)'
               }}>
            <h3 className="text-sm font-mono text-cyan-400 mb-6 uppercase tracking-wider">Control Categories</h3>
            
            <div className="space-y-4">
              {framework.categories.map((category, index) => (
                <div key={category.name} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-mono">{category.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs opacity-60">{category.controls} controls</span>
                      <span className="text-sm font-mono font-bold" style={{
                        color: category.score >= 90 ? '#00ff88' :
                               category.score >= 75 ? '#00ffff' :
                               '#ffff00'
                      }}>
                        {animatedScores[category.name]?.toFixed(0) || 0}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="relative h-3 bg-black/50 rounded-full overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000"
                      style={{
                        width: `${animatedScores[category.name] || 0}%`,
                        background: `linear-gradient(90deg, 
                          ${category.score >= 90 ? '#00ff88' : '#00ffff'} 0%, 
                          ${category.score >= 90 ? '#00ffff' : '#a855f7'} 100%)`,
                        boxShadow: `0 0 20px ${category.score >= 90 ? 'rgba(0, 255, 136, 0.6)' : 'rgba(0, 255, 255, 0.6)'}`,
                        animationDelay: `${index * 0.1}s`
                      }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    </div>
                    
                    {/* Scanning effect */}
                    <div 
                      className="absolute inset-y-0 w-1 bg-white/80"
                      style={{
                        left: `${(animatedScores[category.name] || 0) - 1}%`,
                        boxShadow: '0 0 10px rgba(255, 255, 255, 0.8)',
                        animation: 'blink 0.5s ease-in-out infinite'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status indicators */}
        <div className="col-span-3 space-y-4">
          {/* Control status */}
          <div className="backdrop-blur-xl bg-black/40 rounded-2xl border border-purple-400/30 p-6"
               style={{
                 boxShadow: '0 0 40px rgba(168, 85, 247, 0.2), inset 0 0 40px rgba(0, 0, 0, 0.5)'
               }}>
            <h3 className="text-sm font-mono text-purple-400 mb-4 uppercase tracking-wider">Control Status</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-sm">MET</span>
                </div>
                <div className="text-2xl font-bold font-mono text-green-400">{framework.met}</div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm">PARTIAL</span>
                </div>
                <div className="text-2xl font-bold font-mono text-yellow-400">{framework.partial}</div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-400" />
                  <span className="text-sm">FAILED</span>
                </div>
                <div className="text-2xl font-bold font-mono text-red-400">{framework.failed}</div>
              </div>
            </div>
          </div>

          {/* Trend indicator */}
          <div className="backdrop-blur-xl bg-black/40 rounded-2xl border border-green-400/30 p-6"
               style={{
                 boxShadow: '0 0 40px rgba(0, 255, 136, 0.2), inset 0 0 40px rgba(0, 0, 0, 0.5)'
               }}>
            <h3 className="text-sm font-mono text-green-400 mb-4 uppercase tracking-wider">Trend Analysis</h3>
            
            <div className="flex items-center justify-center">
              {framework.trend === 'up' ? (
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 text-green-400" />
                  <span className="text-sm font-mono text-green-400">IMPROVING</span>
                </div>
              ) : framework.trend === 'down' ? (
                <div className="text-center">
                  <TrendingDown className="w-12 h-12 mx-auto mb-2 text-red-400" />
                  <span className="text-sm font-mono text-red-400">DECLINING</span>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 border-2 border-yellow-400 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                  </div>
                  <span className="text-sm font-mono text-yellow-400">STABLE</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl border border-purple-400/30 p-6"
               style={{
                 boxShadow: '0 0 40px rgba(168, 85, 247, 0.2), inset 0 0 40px rgba(0, 0, 0, 0.5)'
               }}>
            <button className="w-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/50 rounded-lg py-3 text-sm font-mono font-bold hover:from-purple-500/30 hover:to-pink-500/30 transition-all">
              GENERATE REPORT
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default UltraComplianceDashboard;