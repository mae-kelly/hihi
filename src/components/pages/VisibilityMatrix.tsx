import React, { useState, useEffect, useRef } from 'react';
import { Database, Server, Cloud, Shield, AlertCircle, CheckCircle, XCircle, Activity, Zap, Globe, Network, Cpu, BarChart3, Layers, Hexagon, Triangle, Circle } from 'lucide-react';

const VisibilityMatrix: React.FC = () => {
  const [selectedCell, setSelectedCell] = useState<{row: string, col: string} | null>(null);
  const [viewMode, setViewMode] = useState<'matrix' | 'wave' | 'sphere'>('matrix');
  const [hoveredSystem, setHoveredSystem] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotationAngle, setRotationAngle] = useState(0);

  const systems = [
    'QUANTUM-NODE-01', 'NEURAL-CLUSTER', 'PHOTON-GATEWAY', 'PLASMA-CORE', 
    'FUSION-MATRIX', 'CYBER-NEXUS', 'VOID-SERVER', 'HOLO-FRAME'
  ];

  const platforms = ['CMDB', 'CHRONICLE', 'SPLUNK', 'AVERAGE'];
  
  const visibilityData: Record<string, Record<string, number>> = {
    'QUANTUM-NODE-01': { CMDB: 100, CHRONICLE: 36.3, SPLUNK: 78.5, AVERAGE: 71.6 },
    'NEURAL-CLUSTER': { CMDB: 100, CHRONICLE: 2.7, SPLUNK: 15.6, AVERAGE: 39.4 },
    'PHOTON-GATEWAY': { CMDB: 100, CHRONICLE: 0.1, SPLUNK: 0.1, AVERAGE: 33.4 },
    'PLASMA-CORE': { CMDB: 100, CHRONICLE: 57.5, SPLUNK: 31.1, AVERAGE: 62.9 },
    'FUSION-MATRIX': { CMDB: 100, CHRONICLE: 60, SPLUNK: 0, AVERAGE: 53.3 },
    'CYBER-NEXUS': { CMDB: 100, CHRONICLE: 0, SPLUNK: 0, AVERAGE: 33.3 },
    'VOID-SERVER': { CMDB: 99.1, CHRONICLE: 0, SPLUNK: 0.5, AVERAGE: 33.2 },
    'HOLO-FRAME': { CMDB: 100, CHRONICLE: 0, SPLUNK: 0, AVERAGE: 33.3 }
  };

  // 3D Wave visualization
  useEffect(() => {
    if (viewMode !== 'wave') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let time = 0;
    const animate = () => {
      time += 0.02;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Create 3D wave grid
      const rows = 20;
      const cols = 30;
      const cellWidth = canvas.width / cols;
      const cellHeight = canvas.height / rows;

      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const x = j * cellWidth;
          const y = i * cellHeight;
          
          // Calculate wave height
          const waveHeight = Math.sin(time + (i * 0.3) + (j * 0.3)) * 30;
          
          // Get data value for coloring
          const systemIndex = Math.floor(i / (rows / systems.length));
          const platformIndex = Math.floor(j / (cols / platforms.length));
          const system = systems[systemIndex] || systems[0];
          const platform = platforms[platformIndex] || platforms[0];
          const value = visibilityData[system]?.[platform] || 0;
          
          // Color based on value
          const hue = value > 80 ? 180 : value > 50 ? 280 : 320;
          const lightness = 50 + (value / 2);
          
          ctx.fillStyle = `hsla(${hue}, 100%, ${lightness}%, ${0.3 + value / 200})`;
          ctx.strokeStyle = `hsla(${hue}, 100%, ${lightness}%, ${0.5 + value / 200})`;
          
          // Draw 3D box
          ctx.beginPath();
          ctx.moveTo(x, y + waveHeight);
          ctx.lineTo(x + cellWidth, y + waveHeight);
          ctx.lineTo(x + cellWidth, y + cellHeight + waveHeight);
          ctx.lineTo(x, y + cellHeight + waveHeight);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }
      
      requestAnimationFrame(animate);
    };
    animate();
  }, [viewMode]);

  // Sphere visualization
  useEffect(() => {
    if (viewMode !== 'sphere') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let rotation = 0;
    const animate = () => {
      rotation += 0.01;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) * 0.7;

      // Draw sphere grid
      for (let lat = 0; lat < Math.PI; lat += Math.PI / 10) {
        for (let lon = 0; lon < Math.PI * 2; lon += Math.PI / 10) {
          const x = radius * Math.sin(lat) * Math.cos(lon + rotation);
          const y = radius * Math.sin(lat) * Math.sin(lon + rotation);
          const z = radius * Math.cos(lat);
          
          // 3D to 2D projection
          const scale = 1 / (1 + z / (radius * 2));
          const x2d = centerX + x * scale;
          const y2d = centerY + y * scale;
          
          // Color based on position
          const value = (Math.sin(lat * 3) + Math.cos(lon * 3)) * 50 + 50;
          const hue = z > 0 ? 180 : 280;
          
          ctx.beginPath();
          ctx.arc(x2d, y2d, 3 * scale, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${scale})`;
          ctx.fill();
          
          // Connect points
          if (lon > 0) {
            const prevLon = lon - Math.PI / 10;
            const px = radius * Math.sin(lat) * Math.cos(prevLon + rotation);
            const py = radius * Math.sin(lat) * Math.sin(prevLon + rotation);
            const pz = radius * Math.cos(lat);
            const pScale = 1 / (1 + pz / (radius * 2));
            const px2d = centerX + px * pScale;
            const py2d = centerY + py * pScale;
            
            ctx.beginPath();
            ctx.moveTo(px2d, py2d);
            ctx.lineTo(x2d, y2d);
            ctx.strokeStyle = `hsla(${hue}, 100%, 50%, ${scale * 0.3})`;
            ctx.stroke();
          }
        }
      }
      
      requestAnimationFrame(animate);
    };
    animate();
  }, [viewMode]);

  const getColorForValue = (value: number) => {
    if (value >= 90) return '#00ffff';
    if (value >= 70) return '#00e5ff';
    if (value >= 50) return '#c084fc';
    if (value >= 20) return '#e879f9';
    return '#ff00ff';
  };

  return (
    <div className="p-8 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-black mb-3 holo-text">
          VISIBILITY MATRIX
        </h1>
        <p className="text-purple-300/60 uppercase tracking-widest text-sm">
          Quantum Coverage Analysis • Real-Time System Monitoring
        </p>
      </div>

      {/* View mode selector */}
      <div className="flex gap-2 mb-8">
        {(['matrix', 'wave', 'sphere'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-6 py-3 rounded-xl font-semibold uppercase tracking-wider transition-all ${
              viewMode === mode
                ? 'glass-panel scale-105'
                : 'bg-black/30 hover:bg-black/50'
            }`}
            style={{
              borderColor: viewMode === mode ? 'rgba(0, 255, 255, 0.3)' : 'transparent',
              boxShadow: viewMode === mode 
                ? '0 0 30px rgba(0, 255, 255, 0.3)' 
                : 'none'
            }}
          >
            <span className={viewMode === mode ? 'text-cyan-300' : 'text-gray-500'}>
              {mode}
            </span>
          </button>
        ))}
      </div>

      {/* Main visualization */}
      {viewMode === 'matrix' ? (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cyan-400/20">
                  <th className="p-6 text-left">
                    <div className="flex items-center gap-3">
                      <Hexagon className="w-5 h-5 text-cyan-400 animate-pulse" />
                      <span className="text-cyan-400 font-semibold uppercase tracking-wider">
                        System Node
                      </span>
                    </div>
                  </th>
                  {platforms.map(platform => (
                    <th key={platform} className="p-6 text-center">
                      <div className="flex flex-col items-center gap-2">
                        {platform === 'CMDB' && <Database className="w-5 h-5 text-cyan-400" />}
                        {platform === 'CHRONICLE' && <Cloud className="w-5 h-5 text-purple-400" />}
                        {platform === 'SPLUNK' && <Server className="w-5 h-5 text-pink-400" />}
                        {platform === 'AVERAGE' && <BarChart3 className="w-5 h-5 text-yellow-400" />}
                        <span className="text-sm font-semibold uppercase tracking-wider"
                              style={{
                                color: platform === 'CMDB' ? '#00ffff' :
                                       platform === 'CHRONICLE' ? '#c084fc' :
                                       platform === 'SPLUNK' ? '#ff00ff' :
                                       '#f0abfc'
                              }}>
                          {platform}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="p-6 text-center">
                    <span className="text-green-400 font-semibold uppercase tracking-wider">
                      Status
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {systems.map((system) => (
                  <tr 
                    key={system}
                    className="border-b border-cyan-400/10 hover:bg-cyan-400/5 transition-all"
                    onMouseEnter={() => setHoveredSystem(system)}
                    onMouseLeave={() => setHoveredSystem(null)}
                  >
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Circle className={`w-5 h-5 text-purple-400/60 ${
                            hoveredSystem === system ? 'animate-spin' : ''
                          }`} />
                          {hoveredSystem === system && (
                            <div className="absolute inset-0 w-5 h-5 border-2 border-purple-400 rounded-full animate-ping" />
                          )}
                        </div>
                        <span className="font-mono text-sm text-purple-300 font-semibold">
                          {system}
                        </span>
                      </div>
                    </td>
                    {platforms.map(platform => {
                      const value = visibilityData[system][platform];
                      const isSelected = selectedCell?.row === system && selectedCell?.col === platform;
                      
                      return (
                        <td 
                          key={platform}
                          className="p-6 text-center cursor-pointer"
                          onClick={() => setSelectedCell({row: system, col: platform})}
                        >
                          <div className="relative inline-block">
                            <div className={`
                              px-6 py-3 rounded-xl font-mono font-bold text-lg
                              backdrop-blur-xl transition-all transform holo-shine
                              ${isSelected ? 'scale-110' : 'hover:scale-105'}
                            `} style={{
                              background: `linear-gradient(135deg, ${getColorForValue(value)}15, rgba(0, 0, 0, 0.4))`,
                              border: `1px solid ${getColorForValue(value)}40`,
                              color: getColorForValue(value),
                              boxShadow: isSelected 
                                ? `0 0 30px ${getColorForValue(value)}80`
                                : `0 0 10px ${getColorForValue(value)}30`
                            }}>
                              {value.toFixed(1)}%
                              
                              {/* Progress indicator */}
                              <div className="absolute bottom-1 left-1 right-1 h-1 bg-black/50 rounded-full overflow-hidden">
                                <div 
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${value}%`,
                                    background: getColorForValue(value)
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </td>
                      );
                    })}
                    <td className="p-6 text-center">
                      <div className="flex justify-center">
                        {visibilityData[system].AVERAGE >= 70 ? (
                          <CheckCircle className="w-6 h-6 text-green-400" />
                        ) : visibilityData[system].AVERAGE >= 40 ? (
                          <AlertCircle className="w-6 h-6 text-yellow-400" />
                        ) : (
                          <XCircle className="w-6 h-6 text-red-400 animate-pulse" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-8">
          <canvas 
            ref={canvasRef}
            className="w-full h-[500px]"
            style={{
              filter: 'drop-shadow(0 0 30px rgba(0, 255, 255, 0.5))'
            }}
          />
        </div>
      )}

      {/* Statistics bar */}
      <div className="mt-8 glass-panel rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div>
              <span className="text-xs text-cyan-400/60 uppercase">Total Coverage</span>
              <div className="text-2xl font-bold text-cyan-400">87.3%</div>
            </div>
            <div>
              <span className="text-xs text-purple-400/60 uppercase">Critical Gaps</span>
              <div className="text-2xl font-bold text-purple-400">3</div>
            </div>
            <div>
              <span className="text-xs text-pink-400/60 uppercase">Systems Online</span>
              <div className="text-2xl font-bold text-pink-400">8/8</div>
            </div>
          </div>
          
          <button className="neon-btn px-8 py-3 rounded-xl font-semibold uppercase tracking-wider">
            Export Matrix
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisibilityMatrix;