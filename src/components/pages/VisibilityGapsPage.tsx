import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, XCircle, TrendingUp, Database, Shield, Activity, Network, Cloud, Hexagon, Triangle, Zap, Wifi } from 'lucide-react';

const VisibilityGapsPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [animatedGaps, setAnimatedGaps] = useState<any[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const visibilityGaps = [
    {
      id: 'GAP-001',
      category: 'infrastructure',
      system: 'QUANTUM-NODE-07',
      gap: 'Neural Link Disconnected',
      coverage: 0,
      impact: 'critical',
      description: 'Quantum nodes showing 0% visibility in neural pathways',
      recommendation: 'Deploy quantum forwarders on all nodes',
      effort: 'high',
      priority: 1
    },
    {
      id: 'GAP-002',
      category: 'cloud',
      system: 'PHOTON-CLOUD',
      gap: 'Incomplete Event Matrix',
      coverage: 45,
      impact: 'high',
      description: 'Only partial photon events captured',
      recommendation: 'Enable full spectrum event logging',
      effort: 'low',
      priority: 2
    },
    {
      id: 'GAP-003',
      category: 'network',
      system: 'VOID-DNS',
      gap: 'Query Logs Missing',
      coverage: 20,
      impact: 'medium',
      description: 'DNS quantum queries not captured',
      recommendation: 'Activate void query logging',
      effort: 'low',
      priority: 3
    },
    {
      id: 'GAP-004',
      category: 'endpoint',
      system: 'HOLO-DEVICES',
      gap: 'No Holographic Coverage',
      coverage: 0,
      impact: 'high',
      description: 'Holographic endpoints lack detection',
      recommendation: 'Deploy holo-detection matrix',
      effort: 'high',
      priority: 2
    },
    {
      id: 'GAP-005',
      category: 'application',
      system: 'PLASMA-GATEWAY',
      gap: 'API Stream Gaps',
      coverage: 30,
      impact: 'high',
      description: 'Plasma API streams not fully monitored',
      recommendation: 'Enable quantum API logging',
      effort: 'medium',
      priority: 2
    }
  ];

  const categories = [
    { id: 'all', label: 'ALL', icon: Database },
    { id: 'infrastructure', label: 'INFRA', icon: Shield },
    { id: 'cloud', label: 'CLOUD', icon: Cloud },
    { id: 'network', label: 'NETWORK', icon: Network },
    { id: 'endpoint', label: 'ENDPOINT', icon: Activity },
    { id: 'application', label: 'APPS', icon: Database }
  ];

  // 3D visualization of gaps
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
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw gap visualization
      visibilityGaps.forEach((gap, index) => {
        const x = (canvas.width / visibilityGaps.length) * index + 50;
        const baseY = canvas.height - 20;
        const height = (100 - gap.coverage) * 1.5;
        
        // Draw bar
        const gradient = ctx.createLinearGradient(x, baseY, x, baseY - height);
        if (gap.impact === 'critical') {
          gradient.addColorStop(0, '#ff00ff');
          gradient.addColorStop(1, 'rgba(255, 0, 255, 0.2)');
        } else if (gap.impact === 'high') {
          gradient.addColorStop(0, '#c084fc');
          gradient.addColorStop(1, 'rgba(192, 132, 252, 0.2)');
        } else {
          gradient.addColorStop(0, '#00ffff');
          gradient.addColorStop(1, 'rgba(0, 255, 255, 0.2)');
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x - 20, baseY - height, 40, height);
        
        // Add pulsing effect
        if (gap.impact === 'critical') {
          ctx.strokeStyle = '#ff00ff';
          ctx.globalAlpha = Math.sin(time * 3) * 0.5 + 0.5;
          ctx.strokeRect(x - 22, baseY - height - 2, 44, height + 4);
          ctx.globalAlpha = 1;
        }
        
        // Label
        ctx.fillStyle = '#00ffff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(gap.coverage + '%', x, baseY + 15);
      });

      requestAnimationFrame(animate);
    };
    animate();
  }, []);

  const filteredGaps = selectedCategory === 'all' 
    ? visibilityGaps 
    : visibilityGaps.filter(gap => gap.category === selectedCategory);

  const getImpactColor = (impact: string) => {
    switch(impact) {
      case 'critical': return { bg: 'bg-pink-400/20', text: 'text-pink-400', border: 'border-pink-400/30' };
      case 'high': return { bg: 'bg-purple-400/20', text: 'text-purple-400', border: 'border-purple-400/30' };
      case 'medium': return { bg: 'bg-cyan-400/20', text: 'text-cyan-400', border: 'border-cyan-400/30' };
      default: return { bg: 'bg-cyan-300/20', text: 'text-cyan-300', border: 'border-cyan-300/30' };
    }
  };

  const totalGaps = visibilityGaps.length;
  const criticalGaps = visibilityGaps.filter(g => g.impact === 'critical').length;
  const avgCoverage = visibilityGaps.reduce((acc, g) => acc + g.coverage, 0) / totalGaps;

  return (
    <div className="p-8 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-black mb-3 holo-text">
          VISIBILITY ANOMALIES
        </h1>
        <p className="text-cyan-300/60 uppercase tracking-widest text-sm">
          Quantum Gap Analysis • System Blind Spot Detection
        </p>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="glass-panel rounded-xl p-6 holo-shine">
          <XCircle className="w-6 h-6 text-pink-400 mb-2" />
          <div className="text-3xl font-bold text-pink-400">{totalGaps}</div>
          <div className="text-xs text-pink-400/60 uppercase">Total Gaps</div>
        </div>
        
        <div className="glass-panel rounded-xl p-6 holo-shine">
          <AlertCircle className="w-6 h-6 text-purple-400 mb-2" />
          <div className="text-3xl font-bold text-purple-400">{criticalGaps}</div>
          <div className="text-xs text-purple-400/60 uppercase">Critical</div>
        </div>
        
        <div className="glass-panel rounded-xl p-6 holo-shine">
          <Activity className="w-6 h-6 text-cyan-400 mb-2" />
          <div className="text-3xl font-bold text-cyan-400">{avgCoverage.toFixed(0)}%</div>
          <div className="text-xs text-cyan-400/60 uppercase">Avg Coverage</div>
        </div>
        
        <div className="glass-panel rounded-xl p-6 holo-shine">
          <TrendingUp className="w-6 h-6 text-green-400 mb-2" />
          <div className="text-3xl font-bold text-green-400">+5%</div>
          <div className="text-xs text-green-400/60 uppercase">Improvement</div>
        </div>
      </div>

      {/* Gap Visualization */}
      <div className="glass-panel rounded-2xl p-6 mb-8">
        <h3 className="text-sm font-semibold text-purple-300 mb-4 uppercase tracking-wider">
          Gap Magnitude Analysis
        </h3>
        <canvas ref={canvasRef} className="w-full" />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map(cat => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold uppercase tracking-wider transition-all ${
                selectedCategory === cat.id
                  ? 'glass-panel scale-105'
                  : 'bg-black/30 hover:bg-black/50'
              }`}
              style={{
                borderColor: selectedCategory === cat.id ? 'rgba(0, 255, 255, 0.3)' : 'transparent',
                boxShadow: selectedCategory === cat.id ? '0 0 20px rgba(0, 255, 255, 0.3)' : 'none'
              }}
            >
              <Icon className="w-4 h-4" />
              <span className={selectedCategory === cat.id ? 'text-cyan-300' : 'text-gray-500'}>
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Gaps List */}
      <div className="grid grid-cols-1 gap-6">
        {filteredGaps.map(gap => {
          const colors = getImpactColor(gap.impact);
          return (
            <div
              key={gap.id}
              className="glass-panel rounded-xl hover:scale-101 transition-all holo-shine"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${colors.bg} ${colors.text} ${colors.border} border`}>
                      {gap.impact}
                    </div>
                    <div>
                      <h3 className="font-mono font-bold text-purple-300">{gap.system}</h3>
                      <p className="text-sm text-cyan-400">{gap.gap}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-pink-400">{gap.coverage}%</div>
                    <div className="text-xs text-cyan-400/60 uppercase">Coverage</div>
                  </div>
                </div>

                {/* Description */}
                <div className="glass-panel rounded-lg p-4 mb-4">
                  <p className="text-sm text-cyan-300 mb-3">{gap.description}</p>
                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-xs text-cyan-400/60 uppercase">Priority</span>
                      <div className="flex gap-1 mt-1">
                        {[1,2,3,4,5].map(p => (
                          <div key={p} className={`w-2 h-2 rounded-full ${
                            p <= gap.priority ? 'bg-pink-400' : 'bg-gray-600'
                          }`} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-purple-400/60 uppercase">Effort</span>
                      <div className={`text-sm font-bold mt-1 ${
                        gap.effort === 'high' ? 'text-pink-400' :
                        gap.effort === 'medium' ? 'text-purple-400' :
                        'text-cyan-400'
                      }`}>
                        {gap.effort.toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-cyan-400/60 uppercase">Category</span>
                      <div className="text-sm font-mono text-cyan-400 mt-1">
                        {gap.category.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendation */}
                <div className="flex items-center gap-2 glass-panel rounded-lg p-3">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <div className="flex-1">
                    <div className="text-xs text-green-400/60 uppercase mb-1">Recommendation</div>
                    <p className="text-sm text-green-400">{gap.recommendation}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Impact Matrix */}
      <div className="mt-8 glass-panel rounded-2xl p-6">
        <h2 className="text-xl font-bold text-purple-300 mb-4 uppercase tracking-wider">
          Impact vs Effort Matrix
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-panel rounded-lg p-4">
            <h3 className="text-sm font-bold text-cyan-400 mb-2 uppercase">Quick Wins</h3>
            <p className="text-xs text-cyan-400/80">High impact, low effort gaps</p>
          </div>
          <div className="glass-panel rounded-lg p-4">
            <h3 className="text-sm font-bold text-purple-400 mb-2 uppercase">Strategic</h3>
            <p className="text-xs text-purple-400/80">High impact, high effort gaps</p>
          </div>
          <div className="glass-panel rounded-lg p-4">
            <h3 className="text-sm font-bold text-pink-400 mb-2 uppercase">Fill-ins</h3>
            <p className="text-xs text-pink-400/80">Low impact, low effort gaps</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisibilityGapsPage;