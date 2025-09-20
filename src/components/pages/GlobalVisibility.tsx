import React, { useState, useEffect, useRef } from 'react';
import { Globe, Database, Server, Cloud, Shield, Activity, Zap, Wifi, HardDrive, Cpu, Network, Eye, BarChart3 } from 'lucide-react';

const GlobalVisibility: React.FC = () => {
  const [selectedView, setSelectedView] = useState<'csoc' | 'splunk' | 'chronicle'>('csoc');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Data based on requirements document
  const globalData = {
    csoc: {
      totalAssets: 262032,
      coverage: 50237,
      percentage: 19.17,
      color: '#00ffff',
      missing: 211795
    },
    splunk: {
      totalAssets: 262032,
      coverage: 167517,
      percentage: 63.93,
      missing: 94515,
      color: '#c084fc'
    },
    chronicle: {
      totalAssets: 262032,
      coverage: 241691,
      percentage: 92.24,
      missing: 20341,
      color: '#ff00ff'
    }
  };

  const currentData = globalData[selectedView];

  // 3D Globe visualization
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
      rotation += 0.005;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw globe outline
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

      // Draw longitude lines
      for (let lon = 0; lon < 360; lon += 30) {
        ctx.strokeStyle = currentData.color + '20';
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        const angle = ((lon + rotation * 100) * Math.PI) / 180;
        const x = centerX + Math.sin(angle) * radius;
        
        ctx.ellipse(x, centerY, Math.abs(Math.cos(angle)) * radius * 0.3, radius, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw coverage points
      const numPoints = Math.floor(currentData.percentage);
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

      requestAnimationFrame(animate);
    };
    animate();
  }, [selectedView]);

  return (
    <div className="p-8 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-black mb-3 holo-text">
          GLOBAL VIEW - CSOC VISIBILITY
        </h1>
        <p className="text-purple-300/60 uppercase tracking-widest text-sm">
          Comprehensive Asset Coverage Analysis • {currentData.totalAssets.toLocaleString()} Total Assets
        </p>
      </div>

      {/* Platform Selector */}
      <div className="flex gap-2 mb-8">
        {(['csoc', 'splunk', 'chronicle'] as const).map(platform => (
          <button
            key={platform}
            onClick={() => setSelectedView(platform)}
            className={`px-6 py-3 rounded-xl font-semibold uppercase tracking-wider transition-all ${
              selectedView === platform
                ? 'glass-panel scale-105'
                : 'bg-black/30 hover:bg-black/50'
            }`}
            style={{
              borderColor: selectedView === platform 
                ? platform === 'csoc' ? 'rgba(0, 255, 255, 0.3)' 
                : platform === 'splunk' ? 'rgba(192, 132, 252, 0.3)'
                : 'rgba(255, 0, 255, 0.3)'
                : 'transparent',
              boxShadow: selectedView === platform 
                ? `0 0 30px ${globalData[platform].color}40` 
                : 'none'
            }}
          >
            <span className={
              selectedView === platform 
                ? platform === 'csoc' ? 'text-cyan-300' 
                : platform === 'splunk' ? 'text-purple-300'
                : 'text-pink-300'
                : 'text-gray-500'
            }>
              {platform.toUpperCase()}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* 3D Globe Visualization */}
        <div className="col-span-7">
          <div className="glass-panel rounded-2xl p-6">
            <canvas 
              ref={canvasRef}
              className="w-full h-[500px]"
              style={{
                filter: `drop-shadow(0 0 30px ${currentData.color}80)`
              }}
            />
          </div>
        </div>

        {/* Metrics Panel */}
        <div className="col-span-5 space-y-6">
          {/* Main Coverage Metric */}
          <div className="glass-panel rounded-2xl p-8">
            <div className="text-center">
              <div className="text-6xl font-black mb-4" 
                   style={{ color: currentData.color }}>
                {currentData.percentage.toFixed(2)}%
              </div>
              <div className="text-lg text-gray-400 uppercase tracking-wider mb-6">
                Coverage Rate
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-panel rounded-lg p-4">
                  <Eye className="w-6 h-6 mx-auto mb-2 text-cyan-400" />
                  <div className="text-2xl font-bold text-cyan-400">
                    {(currentData.coverage / 1000).toFixed(1)}K
                  </div>
                  <div className="text-xs text-gray-500 uppercase">Covered</div>
                </div>
                
                <div className="glass-panel rounded-lg p-4">
                  <Shield className="w-6 h-6 mx-auto mb-2 text-pink-400" />
                  <div className="text-2xl font-bold text-pink-400">
                    {(currentData.missing / 1000).toFixed(1)}K
                  </div>
                  <div className="text-xs text-gray-500 uppercase">Missing</div>
                </div>
              </div>
            </div>
          </div>

          {/* Regional Breakdown */}
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-purple-300 mb-4 uppercase tracking-wider">
              Regional Coverage
            </h3>
            
            <div className="space-y-3">
              {[
                { region: 'AMERICAS', coverage: 78.5, assets: 89420 },
                { region: 'EMEA', coverage: 65.2, assets: 76891 },
                { region: 'APAC', coverage: 82.1, assets: 95721 }
              ].map(region => (
                <div key={region.region}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">{region.region}</span>
                    <span className="font-mono" style={{ color: currentData.color }}>
                      {region.coverage}%
                    </span>
                  </div>
                  <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${region.coverage}%`,
                        background: `linear-gradient(90deg, ${currentData.color}80, ${currentData.color})`
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {region.assets.toLocaleString()} assets
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Data Center Status */}
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-cyan-300 mb-4 uppercase tracking-wider">
              Data Center Status
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center glass-panel rounded-lg p-3">
                <Server className="w-5 h-5 mx-auto mb-1 text-cyan-400" />
                <div className="text-lg font-bold text-cyan-400">12</div>
                <div className="text-xs text-gray-500">Active DCs</div>
              </div>
              <div className="text-center glass-panel rounded-lg p-3">
                <Cloud className="w-5 h-5 mx-auto mb-1 text-purple-400" />
                <div className="text-lg font-bold text-purple-400">8</div>
                <div className="text-xs text-gray-500">Cloud Regions</div>
              </div>
              <div className="text-center glass-panel rounded-lg p-3">
                <Wifi className="w-5 h-5 mx-auto mb-1 text-pink-400" />
                <div className="text-lg font-bold text-pink-400">245</div>
                <div className="text-xs text-gray-500">Edge Locations</div>
              </div>
              <div className="text-center glass-panel rounded-lg p-3">
                <Activity className="w-5 h-5 mx-auto mb-1 text-green-400" />
                <div className="text-lg font-bold text-green-400">99.9%</div>
                <div className="text-xs text-gray-500">Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Stats Bar */}
      <div className="mt-8 glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div>
              <span className="text-xs text-cyan-400/60 uppercase">URL/FQDN Coverage</span>
              <div className="text-2xl font-bold text-cyan-400">87.3%</div>
            </div>
            <div>
              <span className="text-xs text-purple-400/60 uppercase">IPAM Public IP</span>
              <div className="text-2xl font-bold text-purple-400">92.1%</div>
            </div>
            <div>
              <span className="text-xs text-pink-400/60 uppercase">Control Coverage</span>
              <div className="text-2xl font-bold text-pink-400">76.5%</div>
            </div>
          </div>
          
          <button className="neon-btn px-8 py-3 rounded-xl font-semibold uppercase tracking-wider">
            Export Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalVisibility;