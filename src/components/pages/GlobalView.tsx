import React, { useState, useEffect, useRef } from 'react';
import { Globe, Database, Server, Cloud, Shield, Activity, Zap, Wifi, Eye, AlertTriangle, TrendingDown } from 'lucide-react';

const GlobalView: React.FC = () => {
  const [selectedPlatform, setSelectedPlatform] = useState<'csoc' | 'splunk' | 'chronicle'>('csoc');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  
  // ACTUAL DATA FROM AO1 REQUIREMENTS - Global View
  const globalData = {
    csoc: {
      totalAssets: 262032,
      covered: 50237,
      percentage: 19.17,
      missing: 211795,
      color: '#00ffff',
      status: 'CRITICAL',
      trend: -2.3, // Monthly decline
      details: {
        'URL/FQDN Coverage': 'Listed for every URL/FQDN covered in SIEM',
        'Public IP Space': 'Full list of CIDR coverage',
        'Compliance': 'FAILING - Below 80% threshold'
      }
    },
    splunk: {
      totalAssets: 262032,
      covered: 167517,
      percentage: 63.93,
      missing: 94515,
      color: '#c084fc',
      status: 'WARNING',
      trend: 0.8,
      details: {
        'Coverage Type': 'Partial deployment',
        'Integration': 'Active',
        'Data Volume': '2.4TB daily'
      }
    },
    chronicle: {
      totalAssets: 262032,
      covered: 241691,
      percentage: 92.24,
      missing: 20341,
      color: '#00ff88',
      status: 'GOOD',
      trend: 3.2,
      details: {
        'Coverage Type': 'Near complete',
        'Integration': 'Full deployment',
        'Data Volume': '3.8TB daily'
      }
    }
  };

  const currentData = globalData[selectedPlatform];

  // Animate percentage on platform change
  useEffect(() => {
    let start = 0;
    const target = currentData.percentage;
    const duration = 1000;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const value = start + (target - start) * progress;
      setAnimatedPercentage(value);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }, [selectedPlatform]);

  // Global coverage visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let rotation = 0;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) * 0.8;

    const animate = () => {
      rotation += 0.003;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw globe
      ctx.strokeStyle = currentData.color + '30';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Draw latitude lines
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.strokeStyle = currentData.color + '20';
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        const y = centerY + (lat / 90) * radius;
        const lineRadius = Math.cos((lat * Math.PI) / 180) * radius;
        
        ctx.ellipse(centerX, y, lineRadius, lineRadius * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw coverage points based on percentage
      const numPoints = Math.floor(currentData.percentage * 2);
      for (let i = 0; i < numPoints; i++) {
        const lat = (Math.random() - 0.5) * Math.PI;
        const lon = (Math.random() * Math.PI * 2) + rotation;
        
        const x = centerX + radius * Math.cos(lat) * Math.sin(lon);
        const y = centerY + radius * Math.sin(lat);
        const z = Math.cos(lat) * Math.cos(lon);
        
        if (z > 0) {
          ctx.beginPath();
          ctx.arc(x, y, 2 * (1 + z), 0, Math.PI * 2);
          ctx.fillStyle = currentData.color + Math.floor(255 * (0.5 + z * 0.5)).toString(16);
          ctx.fill();
        }
      }

      // Draw warning zones for gaps
      if (currentData.percentage < 50) {
        ctx.strokeStyle = 'rgba(255, 0, 68, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 1.1, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      requestAnimationFrame(animate);
    };
    animate();
  }, [selectedPlatform]);

  return (
    <div className="p-8 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-black mb-3 holo-text">
          GLOBAL VIEW - CSOC VISIBILITY
        </h1>
        <p className="text-purple-300/60 uppercase tracking-widest text-sm">
          Total Assets: {currentData.totalAssets.toLocaleString()} • Global Coverage Analysis
        </p>
      </div>

      {/* Critical Alert for CSOC */}
      {selectedPlatform === 'csoc' && (
        <div className="mb-6 glass-panel rounded-xl p-4 border-red-500/50 bg-red-500/10">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
            <div>
              <span className="text-red-400 font-bold">CRITICAL VISIBILITY GAP:</span>
              <span className="text-white ml-2">CSOC coverage at 19.17% - {currentData.missing.toLocaleString()} assets unmonitored</span>
            </div>
          </div>
        </div>
      )}

      {/* Platform Selector */}
      <div className="flex gap-2 mb-8">
        {(['csoc', 'splunk', 'chronicle'] as const).map(platform => (
          <button
            key={platform}
            onClick={() => setSelectedPlatform(platform)}
            className={`px-6 py-3 rounded-xl font-semibold uppercase tracking-wider transition-all ${
              selectedPlatform === platform
                ? 'glass-panel scale-105'
                : 'bg-black/30 hover:bg-black/50'
            }`}
            style={{
              borderColor: selectedPlatform === platform 
                ? globalData[platform].color + '80'
                : 'transparent',
              boxShadow: selectedPlatform === platform 
                ? `0 0 30px ${globalData[platform].color}40` 
                : 'none'
            }}
          >
            <span style={{ color: selectedPlatform === platform ? globalData[platform].color : '#666' }}>
              {platform.toUpperCase()}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Global Visualization */}
        <div className="col-span-7">
          <div className="glass-panel rounded-2xl p-6">
            <canvas 
              ref={canvasRef}
              className="w-full h-[500px]"
              style={{
                filter: `drop-shadow(0 0 30px ${currentData.color}80)`
              }}
            />
            
            {/* Legend */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: currentData.color }}></div>
                  <span className="text-xs text-gray-400">Covered Assets</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <span className="text-xs text-gray-400">Gap Areas</span>
                </div>
              </div>
              <span className="text-xs text-gray-500">Real-time global coverage map</span>
            </div>
          </div>
        </div>

        {/* Metrics Panel */}
        <div className="col-span-5 space-y-6">
          {/* Main Coverage Metric */}
          <div className="glass-panel rounded-2xl p-8">
            <div className="text-center">
              {/* Large percentage display */}
              <div className="relative">
                <div 
                  className="text-7xl font-black mb-4" 
                  style={{ 
                    color: currentData.status === 'CRITICAL' ? '#ff0044' :
                           currentData.status === 'WARNING' ? '#ffaa00' :
                           '#00ff88'
                  }}
                >
                  {animatedPercentage.toFixed(2)}%
                </div>
                <div className={`absolute -top-2 -right-2 px-2 py-1 rounded text-xs font-bold ${
                  currentData.status === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                  currentData.status === 'WARNING' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {currentData.status}
                </div>
              </div>
              
              <div className="text-lg text-gray-400 uppercase tracking-wider mb-6">
                Global Coverage Rate
              </div>
              
              {/* Key metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-panel rounded-lg p-4">
                  <Eye className="w-6 h-6 mx-auto mb-2" style={{ color: currentData.color }} />
                  <div className="text-2xl font-bold" style={{ color: currentData.color }}>
                    {(currentData.covered / 1000).toFixed(1)}K
                  </div>
                  <div className="text-xs text-gray-500 uppercase">Monitored</div>
                </div>
                
                <div className="glass-panel rounded-lg p-4">
                  <Shield className="w-6 h-6 mx-auto mb-2 text-red-400" />
                  <div className="text-2xl font-bold text-red-400">
                    {(currentData.missing / 1000).toFixed(1)}K
                  </div>
                  <div className="text-xs text-gray-500 uppercase">Unprotected</div>
                </div>
              </div>
            </div>
          </div>

          {/* Trend Analysis */}
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-purple-300 mb-4 uppercase tracking-wider">
              Coverage Trend
            </h3>
            
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400">Monthly Change</span>
              <div className="flex items-center gap-2">
                {currentData.trend < 0 ? (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                ) : (
                  <Activity className="w-5 h-5 text-green-400" />
                )}
                <span className={`text-xl font-bold ${currentData.trend < 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {currentData.trend > 0 ? '+' : ''}{currentData.trend}%
                </span>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="h-3 bg-black/50 rounded-full overflow-hidden">
              <div 
                className="h-full transition-all duration-500"
                style={{
                  width: `${currentData.percentage}%`,
                  background: `linear-gradient(90deg, ${currentData.color}80, ${currentData.color})`
                }}
              />
            </div>
            
            {/* Target line */}
            <div className="relative mt-2">
              <div className="absolute left-[80%] -translate-x-1/2">
                <div className="w-0.5 h-4 bg-yellow-400"></div>
                <span className="text-xs text-yellow-400">Target: 80%</span>
              </div>
            </div>
          </div>

          {/* Platform Details */}
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-cyan-300 mb-4 uppercase tracking-wider">
              Platform Details
            </h3>
            
            <div className="space-y-3">
              {Object.entries(currentData.details).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">{key}</span>
                  <span className={`text-sm font-mono ${
                    value.includes('FAILING') ? 'text-red-400' : 'text-cyan-400'
                  }`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="mt-8 glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div>
              <span className="text-xs text-cyan-400/60 uppercase">Assets Requiring Action</span>
              <div className="text-2xl font-bold text-red-400">{currentData.missing.toLocaleString()}</div>
            </div>
            <div>
              <span className="text-xs text-purple-400/60 uppercase">Compliance Status</span>
              <div className="text-2xl font-bold text-red-400">FAILED</div>
            </div>
            <div>
              <span className="text-xs text-pink-400/60 uppercase">Risk Level</span>
              <div className="text-2xl font-bold text-orange-400">CRITICAL</div>
            </div>
          </div>
          
          <button className="neon-btn px-8 py-3 rounded-xl font-semibold uppercase tracking-wider">
            Generate Gap Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalView;