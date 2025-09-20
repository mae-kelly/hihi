import React, { useState, useEffect, useRef } from 'react';
import { Database, Server, Cloud, Shield, AlertCircle, CheckCircle, XCircle, Activity, Zap, Globe, Network, Cpu, BarChart3 } from 'lucide-react';

const VisibilityMatrix: React.FC = () => {
  const [selectedCell, setSelectedCell] = useState<{row: string, col: string} | null>(null);
  const [viewMode, setViewMode] = useState<'matrix' | '3d' | 'heatmap'>('matrix');
  const [hoveredSystem, setHoveredSystem] = useState<string | null>(null);
  const [animationPhase, setAnimationPhase] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const systems = [
    'AIS Server', 'Citrix Netscaler', 'ESX Server', 'F5 BIG-IP', 
    'Firewall Hardware', 'Hyper-V Server', 'IBM Frame', 'IBM HMC Server'
  ];

  const platforms = ['CMDB', 'Chronicle', 'Splunk', 'Average'];
  
  const visibilityData: Record<string, Record<string, number>> = {
    'AIS Server': { CMDB: 100, Chronicle: 36.3, Splunk: 78.5, Average: 71.6 },
    'Citrix Netscaler': { CMDB: 100, Chronicle: 2.7, Splunk: 15.6, Average: 39.4 },
    'ESX Server': { CMDB: 100, Chronicle: 0.1, Splunk: 0.1, Average: 33.4 },
    'F5 BIG-IP': { CMDB: 100, Chronicle: 57.5, Splunk: 31.1, Average: 62.9 },
    'Firewall Hardware': { CMDB: 100, Chronicle: 60, Splunk: 0, Average: 53.3 },
    'Hyper-V Server': { CMDB: 100, Chronicle: 0, Splunk: 0, Average: 33.3 },
    'IBM Frame': { CMDB: 99.1, Chronicle: 0, Splunk: 0.5, Average: 33.2 },
    'IBM HMC Server': { CMDB: 100, Chronicle: 0, Splunk: 0, Average: 33.3 }
  };

  // 3D visualization
  useEffect(() => {
    if (viewMode !== '3d') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let rotation = 0;
    const animate = () => {
      rotation += 0.01;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const scale = 100;

      // Draw 3D bars
      systems.forEach((system, sysIndex) => {
        platforms.forEach((platform, platIndex) => {
          if (platform === 'Average') return;
          
          const value = visibilityData[system][platform];
          const height = value * 2;
          
          // 3D projection
          const x = (platIndex - 1) * 60 + Math.cos(rotation) * sysIndex * 30;
          const y = centerY - height / 2 + Math.sin(rotation) * sysIndex * 20;
          const z = sysIndex * 20;
          
          // Draw bar with perspective
          const barWidth = 40 - z / 10;
          const barHeight = height * (1 - z / 500);
          
          // Color based on value
          const hue = value > 80 ? 120 : value > 50 ? 60 : value > 20 ? 30 : 0;
          ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${0.8 - z / 300})`;
          
          ctx.fillRect(
            centerX + x - barWidth / 2,
            y,
            barWidth,
            barHeight
          );
          
          // Top face
          ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${0.8 - z / 300})`;
          ctx.beginPath();
          ctx.moveTo(centerX + x - barWidth / 2, y);
          ctx.lineTo(centerX + x + barWidth / 2, y);
          ctx.lineTo(centerX + x + barWidth / 2 + 10, y - 10);
          ctx.lineTo(centerX + x - barWidth / 2 + 10, y - 10);
          ctx.closePath();
          ctx.fill();
        });
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, [viewMode]);

  // Animation timer
  useEffect(() => {
    const timer = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(timer);
  }, []);

  const getColorForValue = (value: number) => {
    if (value >= 90) return '#00ff88';
    if (value >= 70) return '#00ffff';
    if (value >= 50) return '#ffff00';
    if (value >= 20) return '#ff8800';
    return '#ff0044';
  };

  const getGlowIntensity = (value: number) => {
    return `0 0 ${20 + value / 5}px ${getColorForValue(value)}`;
  };

  return (
    <div className="p-6 min-h-screen">
      {/* Header with animated gradient */}
      <div className="mb-8 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 blur-3xl" />
        <h1 className="relative text-5xl font-black mb-3" style={{
          fontFamily: 'Orbitron, monospace',
          textShadow: '0 0 40px rgba(0, 255, 255, 0.8)',
          letterSpacing: '0.1em'
        }}>
          <span style={{
            background: 'linear-gradient(135deg, #00ffff, #00d4ff, #a855f7, #ff00ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundSize: '200% 200%',
            animation: 'gradient-shift 3s ease infinite'
          }}>
            VISIBILITY MATRIX COMMAND CENTER
          </span>
        </h1>
        <p className="text-cyan-400/60 font-mono text-sm tracking-wider">
          REAL-TIME CROSS-PLATFORM SECURITY COVERAGE ANALYSIS
        </p>
      </div>

      {/* View mode selector */}
      <div className="flex gap-2 mb-6">
        {(['matrix', '3d', 'heatmap'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-6 py-3 rounded-lg font-mono text-sm font-bold uppercase tracking-wider transition-all ${
              viewMode === mode
                ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/50 text-cyan-400 scale-105'
                : 'bg-black/40 border border-cyan-400/20 text-cyan-400/60 hover:border-cyan-400/40'
            }`}
            style={{
              boxShadow: viewMode === mode 
                ? '0 0 30px rgba(0, 255, 255, 0.5)' 
                : '0 0 20px rgba(0, 0, 0, 0.5)'
            }}
          >
            {mode === '3d' ? '3D VIEW' : mode.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Main visualization area */}
      {viewMode === 'matrix' ? (
        <div className="relative">
          {/* Animated background grid */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `
                repeating-linear-gradient(0deg, rgba(0, 255, 255, 0.1) 0px, transparent 1px, transparent 40px, rgba(0, 255, 255, 0.1) 41px),
                repeating-linear-gradient(90deg, rgba(168, 85, 247, 0.1) 0px, transparent 1px, transparent 40px, rgba(168, 85, 247, 0.1) 41px)
              `,
              animation: 'grid-slide 20s linear infinite'
            }} />
          </div>

          <div className="relative backdrop-blur-2xl bg-black/40 rounded-2xl border border-cyan-400/30 overflow-hidden"
               style={{
                 boxShadow: '0 0 60px rgba(0, 255, 255, 0.2), inset 0 0 60px rgba(0, 0, 0, 0.5)'
               }}>
            
            {/* Scanning line effect */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                   style={{
                     top: `${animationPhase}%`,
                     boxShadow: '0 0 20px rgba(0, 255, 255, 0.8)'
                   }} />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cyan-400/20">
                    <th className="p-6 text-left">
                      <div className="flex items-center gap-3">
                        <Network className="w-5 h-5 text-cyan-400 animate-pulse" />
                        <span className="text-cyan-400 font-mono text-sm font-bold tracking-wider">SYSTEM</span>
                      </div>
                    </th>
                    {platforms.map(platform => (
                      <th key={platform} className="p-6 text-center">
                        <div className="flex flex-col items-center gap-2">
                          {platform === 'CMDB' && <Database className="w-5 h-5 text-cyan-400" />}
                          {platform === 'Chronicle' && <Cloud className="w-5 h-5 text-purple-400" />}
                          {platform === 'Splunk' && <Server className="w-5 h-5 text-pink-400" />}
                          {platform === 'Average' && <BarChart3 className="w-5 h-5 text-yellow-400" />}
                          <span className="text-cyan-400 font-mono text-sm font-bold tracking-wider">
                            {platform.toUpperCase()}
                          </span>
                        </div>
                      </th>
                    ))}
                    <th className="p-6 text-center">
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-green-400" />
                        <span className="text-green-400 font-mono text-sm font-bold tracking-wider">STATUS</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {systems.map((system) => (
                    <tr 
                      key={system}
                      className="border-b border-cyan-400/10 hover:bg-cyan-400/5 transition-all group"
                      onMouseEnter={() => setHoveredSystem(system)}
                      onMouseLeave={() => setHoveredSystem(null)}
                    >
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Cpu className={`w-5 h-5 text-cyan-400/60 ${
                              hoveredSystem === system ? 'animate-spin' : ''
                            }`} />
                            {hoveredSystem === system && (
                              <div className="absolute inset-0 w-5 h-5 border-2 border-cyan-400 rounded-full animate-ping" />
                            )}
                          </div>
                          <span className="font-mono text-sm text-cyan-300 font-bold tracking-wide">
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
                              {/* Glow background */}
                              <div className={`absolute inset-0 rounded-lg blur-xl transition-all ${
                                isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                              }`} style={{
                                background: getColorForValue(value),
                                animation: isSelected ? 'pulse 2s ease-in-out infinite' : 'none'
                              }} />
                              
                              {/* Value display */}
                              <div className={`relative px-6 py-3 rounded-lg font-mono font-bold text-lg backdrop-blur-xl transition-all transform ${
                                isSelected ? 'scale-110' : 'hover:scale-105'
                              }`} style={{
                                background: `linear-gradient(135deg, ${getColorForValue(value)}20, rgba(0, 0, 0, 0.6))`,
                                border: `2px solid ${getColorForValue(value)}`,
                                color: getColorForValue(value),
                                boxShadow: isSelected ? getGlowIntensity(value) : 'none'
                              }}>
                                {value.toFixed(1)}%
                                
                                {/* Mini bar chart */}
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50 rounded-b">
                                  <div 
                                    className="h-full rounded-b transition-all"
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
                          {visibilityData[system].Average >= 70 ? (
                            <div className="relative">
                              <CheckCircle className="w-6 h-6 text-green-400" />
                              <div className="absolute inset-0 w-6 h-6 text-green-400 animate-ping">
                                <CheckCircle className="w-6 h-6" />
                              </div>
                            </div>
                          ) : visibilityData[system].Average >= 40 ? (
                            <AlertCircle className="w-6 h-6 text-yellow-400 animate-pulse" />
                          ) : (
                            <div className="relative">
                              <XCircle className="w-6 h-6 text-red-400 animate-pulse" />
                              <div className="absolute inset-0 w-6 h-6 text-red-400 animate-ping">
                                <XCircle className="w-6 h-6" />
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : viewMode === '3d' ? (
        <div className="relative backdrop-blur-2xl bg-black/40 rounded-2xl border border-purple-400/30 p-8"
             style={{
               boxShadow: '0 0 60px rgba(168, 85, 247, 0.2), inset 0 0 60px rgba(0, 0, 0, 0.5)'
             }}>
          <canvas 
            ref={canvasRef}
            className="w-full h-96"
            style={{
              filter: 'drop-shadow(0 0 20px rgba(168, 85, 247, 0.5))'
            }}
          />
          <p className="text-center text-purple-400/60 font-mono text-sm mt-4">
            3D VISUALIZATION - ROTATING VIEW
          </p>
        </div>
      ) : (
        // Heatmap view
        <div className="relative backdrop-blur-2xl bg-black/40 rounded-2xl border border-pink-400/30 p-8"
             style={{
               boxShadow: '0 0 60px rgba(255, 0, 255, 0.2), inset 0 0 60px rgba(0, 0, 0, 0.5)'
             }}>
          <div className="grid grid-cols-4 gap-2">
            {systems.map(system => (
              <div key={system} className="space-y-2">
                <h3 className="text-xs font-mono text-pink-400/60 truncate">{system}</h3>
                <div className="grid grid-cols-3 gap-1">
                  {platforms.slice(0, 3).map(platform => {
                    const value = visibilityData[system][platform];
                    return (
                      <div
                        key={platform}
                        className="aspect-square rounded transition-all hover:scale-110"
                        style={{
                          background: getColorForValue(value),
                          opacity: value / 100,
                          boxShadow: `0 0 ${value / 5}px ${getColorForValue(value)}`
                        }}
                        title={`${platform}: ${value}%`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live stats ticker */}
      <div className="mt-8 backdrop-blur-xl bg-black/40 rounded-xl border border-cyan-400/30 p-4 overflow-hidden">
        <div className="flex items-center gap-8 animate-scroll-left">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-mono text-yellow-400">LIVE UPDATE</span>
          </div>
          <div className="text-sm font-mono text-cyan-400">
            CMDB: 99.9% COVERAGE
          </div>
          <div className="text-sm font-mono text-purple-400">
            CHRONICLE: 19.6% AVG
          </div>
          <div className="text-sm font-mono text-pink-400">
            SPLUNK: 15.8% AVG
          </div>
          <div className="text-sm font-mono text-red-400">
            CRITICAL GAPS: 3 SYSTEMS
          </div>
          <div className="text-sm font-mono text-green-400">
            COMPLIANT: 2/8 SYSTEMS
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes grid-slide {
          0% { transform: translate(0, 0); }
          100% { transform: translate(40px, 40px); }
        }
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        .animate-scroll-left {
          animation: scroll-left 20s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default VisibilityMatrix;