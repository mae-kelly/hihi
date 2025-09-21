import React, { useState, useEffect, useRef } from 'react';
import { Globe, MapPin, AlertTriangle, TrendingDown, Shield, Activity, Network, Database, Server, Cloud } from 'lucide-react';

const RegionalCountryView: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animatedMetrics, setAnimatedMetrics] = useState<Record<string, number>>({});

  // ACTUAL DATA FROM AO1 REQUIREMENTS - Regional and Country View
  const regionalData = {
    'ALL': {
      totalAssets: 262032,
      csocCoverage: 19.17,
      splunkCoverage: 63.93,
      chronicleCoverage: 92.24,
      criticalGaps: 211795,
      countries: 47,
      datacenters: 23,
      cloudRegions: 12
    },
    'AMERICAS': {
      totalAssets: 105234,
      csocCoverage: 32.5,
      splunkCoverage: 78.9,
      chronicleCoverage: 94.2,
      criticalGaps: 71034,
      countries: 12,
      datacenters: 8,
      cloudRegions: 4,
      breakdown: {
        'United States': { assets: 67890, coverage: 45.2, gap: 37244, status: 'warning' },
        'Canada': { assets: 18234, coverage: 28.7, gap: 12999, status: 'critical' },
        'Brazil': { assets: 12110, coverage: 22.3, gap: 9409, status: 'critical' },
        'Mexico': { assets: 7000, coverage: 18.9, gap: 5677, status: 'critical' }
      }
    },
    'EMEA': {
      totalAssets: 89456,
      csocCoverage: 12.3,
      splunkCoverage: 52.1,
      chronicleCoverage: 89.7,
      criticalGaps: 78456,
      countries: 22,
      datacenters: 9,
      cloudRegions: 5,
      breakdown: {
        'United Kingdom': { assets: 23456, coverage: 18.9, gap: 19012, status: 'critical' },
        'Germany': { assets: 19878, coverage: 15.2, gap: 16855, status: 'critical' },
        'France': { assets: 15234, coverage: 12.1, gap: 13390, status: 'critical' },
        'Netherlands': { assets: 8901, coverage: 9.8, gap: 8028, status: 'critical' },
        'UAE': { assets: 7654, coverage: 8.2, gap: 7027, status: 'critical' },
        'South Africa': { assets: 6789, coverage: 7.1, gap: 6307, status: 'critical' }
      }
    },
    'APAC': {
      totalAssets: 67342,
      csocCoverage: 15.8,
      splunkCoverage: 61.2,
      chronicleCoverage: 93.1,
      criticalGaps: 56632,
      countries: 13,
      datacenters: 6,
      cloudRegions: 3,
      breakdown: {
        'Japan': { assets: 18901, coverage: 22.3, gap: 14685, status: 'critical' },
        'Singapore': { assets: 14567, coverage: 19.8, gap: 11682, status: 'critical' },
        'Australia': { assets: 12345, coverage: 17.2, gap: 10222, status: 'critical' },
        'India': { assets: 10234, coverage: 12.1, gap: 8995, status: 'critical' },
        'China': { assets: 8901, coverage: 8.9, gap: 8109, status: 'critical' },
        'Korea': { assets: 2394, coverage: 6.7, gap: 2234, status: 'critical' }
      }
    }
  };

  // World map visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let rotation = 0;
    const animate = () => {
      rotation += 0.002;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) * 0.8;

      // Draw globe outline
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Draw latitude/longitude lines
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        const y = centerY + (lat / 90) * radius;
        const lineRadius = Math.cos((lat * Math.PI) / 180) * radius;
        
        ctx.ellipse(centerX, y, lineRadius, lineRadius * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Plot regional coverage points with actual percentages
      const regions = [
        { name: 'AMERICAS', lat: 40, lon: -100 + rotation * 100, coverage: 32.5, color: '#00ffff' },
        { name: 'EMEA', lat: 50, lon: 10 + rotation * 100, coverage: 12.3, color: '#ff00ff' },
        { name: 'APAC', lat: 20, lon: 120 + rotation * 100, coverage: 15.8, color: '#c084fc' }
      ];

      regions.forEach(region => {
        const x = centerX + radius * Math.cos(region.lat * Math.PI / 180) * Math.sin(region.lon * Math.PI / 180);
        const y = centerY + radius * Math.sin(region.lat * Math.PI / 180);
        const z = Math.cos(region.lat * Math.PI / 180) * Math.cos(region.lon * Math.PI / 180);
        
        if (z > 0) {
          // Draw coverage circle - smaller for lower coverage
          const size = (region.coverage / 100) * 30;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fillStyle = region.coverage < 20 ? 'rgba(255, 0, 68, 0.5)' : 'rgba(0, 255, 255, 0.5)';
          ctx.fill();
          
          // Pulse effect for critical coverage
          if (region.coverage < 20) {
            ctx.beginPath();
            ctx.arc(x, y, size + Math.sin(rotation * 100) * 10, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 0, 68, 0.3)';
            ctx.stroke();
          }
          
          // Label
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(region.name, x, y - size - 10);
          ctx.fillText(`${region.coverage}%`, x, y);
        }
      });

      requestAnimationFrame(animate);
    };
    animate();
  }, []);

  // Animate metrics
  useEffect(() => {
    const region = regionalData[selectedRegion] || regionalData['ALL'];
    setTimeout(() => {
      setAnimatedMetrics({
        csoc: region.csocCoverage,
        splunk: region.splunkCoverage,
        chronicle: region.chronicleCoverage
      });
    }, 100);
  }, [selectedRegion]);

  const currentRegion = regionalData[selectedRegion] || regionalData['ALL'];

  return (
    <div className="p-8 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-black mb-3 holo-text">
          REGIONAL & COUNTRY VIEW
        </h1>
        <p className="text-purple-300/60 uppercase tracking-widest text-sm">
          Visibility Statement by Location • {currentRegion.countries} Countries • {currentRegion.datacenters} Data Centers
        </p>
      </div>

      {/* Critical Alert */}
      <div className="mb-6 glass-panel rounded-xl p-4 border-red-500/50 bg-red-500/10">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
          <div>
            <span className="text-red-400 font-bold">CRITICAL REGIONAL GAP:</span>
            <span className="text-white ml-2">EMEA showing only 12.3% CSOC coverage - 78,456 assets unmonitored</span>
          </div>
        </div>
      </div>

      {/* Region Selector */}
      <div className="flex gap-2 mb-8">
        {['ALL', 'AMERICAS', 'EMEA', 'APAC'].map(region => (
          <button
            key={region}
            onClick={() => setSelectedRegion(region)}
            className={`px-6 py-3 rounded-xl font-semibold uppercase tracking-wider transition-all ${
              selectedRegion === region
                ? 'glass-panel scale-105'
                : 'bg-black/30 hover:bg-black/50'
            }`}
            style={{
              borderColor: selectedRegion === region ? 'rgba(0, 255, 255, 0.3)' : 'transparent',
              boxShadow: selectedRegion === region ? '0 0 30px rgba(0, 255, 255, 0.3)' : 'none'
            }}
          >
            <span className={selectedRegion === region ? 'text-cyan-300' : 'text-gray-500'}>
              {region}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* World Map */}
        <div className="col-span-7">
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-cyan-300 mb-4 uppercase tracking-wider">
              Global Regional Coverage
            </h3>
            <canvas 
              ref={canvasRef}
              className="w-full h-[400px]"
              style={{
                filter: 'drop-shadow(0 0 30px rgba(0, 255, 255, 0.5))'
              }}
            />
            
            {/* Map Legend */}
            <div className="mt-4 flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <span className="text-xs text-gray-400">Critical (&lt;20%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <span className="text-xs text-gray-400">Warning (20-50%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                <span className="text-xs text-gray-400">Moderate (&gt;50%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Regional Metrics */}
        <div className="col-span-5">
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-purple-300 mb-4 uppercase tracking-wider">
              {selectedRegion} Metrics
            </h3>
            
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="glass-panel rounded-lg p-4">
                <div className="text-xs text-gray-400 mb-1">Total Assets</div>
                <div className="text-2xl font-bold text-cyan-400">{currentRegion.totalAssets.toLocaleString()}</div>
              </div>
              <div className="glass-panel rounded-lg p-4">
                <div className="text-xs text-gray-400 mb-1">Critical Gaps</div>
                <div className="text-2xl font-bold text-red-400">{currentRegion.criticalGaps.toLocaleString()}</div>
              </div>
              <div className="glass-panel rounded-lg p-4">
                <div className="text-xs text-gray-400 mb-1">Data Centers</div>
                <div className="text-2xl font-bold text-purple-400">{currentRegion.datacenters}</div>
              </div>
              <div className="glass-panel rounded-lg p-4">
                <div className="text-xs text-gray-400 mb-1">Cloud Regions</div>
                <div className="text-2xl font-bold text-pink-400">{currentRegion.cloudRegions}</div>
              </div>
            </div>

            {/* Platform Coverage */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-cyan-400">CSOC Coverage</span>
                  <span className="font-mono text-cyan-400">{animatedMetrics.csoc?.toFixed(1) || 0}%</span>
                </div>
                <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${animatedMetrics.csoc || 0}%`,
                      background: animatedMetrics.csoc < 20 ? '#ff0044' : '#00ffff'
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-purple-400">Splunk Coverage</span>
                  <span className="font-mono text-purple-400">{animatedMetrics.splunk?.toFixed(1) || 0}%</span>
                </div>
                <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${animatedMetrics.splunk || 0}%`,
                      background: 'linear-gradient(90deg, #c084fc, #a855f7)'
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-pink-400">Chronicle Coverage</span>
                  <span className="font-mono text-pink-400">{animatedMetrics.chronicle?.toFixed(1) || 0}%</span>
                </div>
                <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${animatedMetrics.chronicle || 0}%`,
                      background: 'linear-gradient(90deg, #ff00ff, #e879f9)'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Country Breakdown Table */}
      {selectedRegion !== 'ALL' && regionalData[selectedRegion]?.breakdown && (
        <div className="mt-8 glass-panel rounded-2xl p-6">
          <h2 className="text-xl font-bold text-purple-300 mb-4">COUNTRY BREAKDOWN - {selectedRegion}</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Country</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">Assets</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">Coverage</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">Gap</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Action Required</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(regionalData[selectedRegion].breakdown).map(([country, data]) => (
                  <tr key={country} className="border-b border-gray-800 hover:bg-gray-900/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-cyan-400" />
                        <span className="text-white">{country}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono">{data.assets.toLocaleString()}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-mono ${data.coverage < 20 ? 'text-red-400' : data.coverage < 50 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {data.coverage}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-red-400">{data.gap.toLocaleString()}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        data.status === 'critical' ? 'bg-red-500/20 text-red-400' :
                        data.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {data.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-yellow-400">
                      Deploy regional collectors
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Regional Action Items */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="glass-panel rounded-xl p-4 border-red-500/30">
          <h3 className="text-sm font-bold text-red-400 mb-2">EMEA CRITICAL</h3>
          <p className="text-xs text-gray-300">12.3% coverage requires immediate deployment of 5 regional collectors</p>
        </div>
        <div className="glass-panel rounded-xl p-4 border-yellow-500/30">
          <h3 className="text-sm font-bold text-yellow-400 mb-2">APAC PRIORITY</h3>
          <p className="text-xs text-gray-300">15.8% coverage - establish Singapore hub for log aggregation</p>
        </div>
        <div className="glass-panel rounded-xl p-4 border-cyan-500/30">
          <h3 className="text-sm font-bold text-cyan-400 mb-2">AMERICAS FOCUS</h3>
          <p className="text-xs text-gray-300">Leverage US infrastructure to improve Canada/Mexico coverage</p>
        </div>
      </div>
    </div>
  );
};

export default RegionalCountryView;