import React, { useState, useEffect, useRef } from 'react';
import { Database, Server, Cloud, Shield, Activity, Terminal, Zap, Wifi, HardDrive, Cpu, Network, Layers, Box, Hexagon, Circle } from 'lucide-react';

const LogSources: React.FC = () => {
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [dataStreams, setDataStreams] = useState<any[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streamMetrics, setStreamMetrics] = useState<Record<string, number>>({});

  const logSources = [
    {
      id: 'quantum-stream-01',
      name: 'QUANTUM FIREWALL ALPHA',
      type: 'network',
      status: 'active',
      eventsPerSecond: 15420,
      coverage: 100,
      dataVolume: '2.4TB',
      platforms: { quantum: true, neural: true, photon: true, plasma: true }
    },
    {
      id: 'neural-collector',
      name: 'NEURAL EDR MATRIX',
      type: 'endpoint',
      status: 'active',
      eventsPerSecond: 8930,
      coverage: 87,
      dataVolume: '1.8TB',
      platforms: { quantum: true, neural: true, photon: false, plasma: true }
    },
    {
      id: 'photon-cloud',
      name: 'PHOTON CLOUD SHIELD',
      type: 'cloud',
      status: 'active',
      eventsPerSecond: 12350,
      coverage: 93,
      dataVolume: '3.1TB',
      platforms: { quantum: true, neural: true, photon: true, plasma: false }
    },
    {
      id: 'plasma-gateway',
      name: 'PLASMA API NEXUS',
      type: 'application',
      status: 'error',
      eventsPerSecond: 0,
      coverage: 45,
      dataVolume: '0.0TB',
      platforms: { quantum: false, neural: false, photon: false, plasma: false }
    },
    {
      id: 'void-identity',
      name: 'VOID IDENTITY MATRIX',
      type: 'identity',
      status: 'active',
      eventsPerSecond: 3240,
      coverage: 78,
      dataVolume: '0.9TB',
      platforms: { quantum: true, neural: false, photon: true, plasma: true }
    }
  ];

  // Data stream visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const streams: any[] = [];
    const numStreams = 15;

    for (let i = 0; i < numStreams; i++) {
      streams.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 1 + Math.random() * 3,
        width: 1 + Math.random() * 3,
        color: Math.random() > 0.5 ? '#00ffff' : '#c084fc',
        data: Array(20).fill(0).map(() => Math.random())
      });
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      streams.forEach(stream => {
        stream.y += stream.speed;
        if (stream.y > canvas.height) {
          stream.y = -50;
          stream.x = Math.random() * canvas.width;
        }

        // Draw data stream
        stream.data.forEach((value: number, index: number) => {
          const opacity = 1 - (index / stream.data.length);
          ctx.fillStyle = stream.color + Math.floor(opacity * 255).toString(16).padStart(2, '0');
          ctx.fillRect(
            stream.x + Math.sin(index * 0.5) * 10,
            stream.y - index * 5,
            stream.width,
            3
          );
        });

        // Update data
        stream.data.pop();
        stream.data.unshift(Math.random());
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  // Update metrics
  useEffect(() => {
    const interval = setInterval(() => {
      const newMetrics: Record<string, number> = {};
      logSources.forEach(source => {
        newMetrics[source.id] = 50 + Math.random() * 50;
      });
      setStreamMetrics(newMetrics);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'network': return <Network className="w-5 h-5" />;
      case 'endpoint': return <Cpu className="w-5 h-5" />;
      case 'cloud': return <Cloud className="w-5 h-5" />;
      case 'application': return <Box className="w-5 h-5" />;
      case 'identity': return <Shield className="w-5 h-5" />;
      default: return <Database className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return { bg: 'bg-green-400/20', text: 'text-green-400', border: 'border-green-400/30' };
      case 'error': return { bg: 'bg-pink-400/20', text: 'text-pink-400', border: 'border-pink-400/30' };
      default: return { bg: 'bg-yellow-400/20', text: 'text-yellow-400', border: 'border-yellow-400/30' };
    }
  };

  const totalEvents = logSources.reduce((sum, source) => sum + source.eventsPerSecond, 0);
  const avgCoverage = logSources.reduce((sum, source) => sum + source.coverage, 0) / logSources.length;

  return (
    <div className="p-8 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-black mb-3 holo-text">
          DATA STREAMS
        </h1>
        <p className="text-cyan-300/60 uppercase tracking-widest text-sm">
          Quantum Log Source Management • Real-Time Data Collection
        </p>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="glass-panel rounded-xl p-6 holo-shine">
          <Activity className="w-6 h-6 text-cyan-400 mb-2" />
          <div className="text-3xl font-bold text-cyan-400">
            {(totalEvents / 1000).toFixed(1)}K
          </div>
          <div className="text-xs text-cyan-400/60 uppercase">Events/Sec</div>
        </div>
        
        <div className="glass-panel rounded-xl p-6 holo-shine">
          <Database className="w-6 h-6 text-purple-400 mb-2" />
          <div className="text-3xl font-bold text-purple-400">8.2TB</div>
          <div className="text-xs text-purple-400/60 uppercase">Daily Volume</div>
        </div>
        
        <div className="glass-panel rounded-xl p-6 holo-shine">
          <Shield className="w-6 h-6 text-pink-400 mb-2" />
          <div className="text-3xl font-bold text-pink-400">{avgCoverage.toFixed(0)}%</div>
          <div className="text-xs text-pink-400/60 uppercase">Coverage</div>
        </div>
        
        <div className="glass-panel rounded-xl p-6 holo-shine">
          <Zap className="w-6 h-6 text-green-400 mb-2" />
          <div className="text-3xl font-bold text-green-400">
            {logSources.filter(s => s.status === 'active').length}/{logSources.length}
          </div>
          <div className="text-xs text-green-400/60 uppercase">Active</div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Data Stream Visualization */}
        <div className="col-span-4">
          <div className="glass-panel rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-purple-300 mb-4 uppercase tracking-wider">
              Live Data Streams
            </h3>
            <canvas 
              ref={canvasRef}
              className="w-full h-[400px] rounded-lg"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.8) 0%, rgba(0,0,0,1) 100%)'
              }}
            />
          </div>
        </div>

        {/* Log Sources List */}
        <div className="col-span-8">
          <div className="space-y-4">
            {logSources.map(source => {
              const statusColors = getStatusColor(source.status);
              return (
                <div
                  key={source.id}
                  className={`glass-panel rounded-xl cursor-pointer transition-all holo-shine ${
                    selectedSource === source.id ? 'scale-102 border-purple-400/50' : ''
                  }`}
                  onClick={() => setSelectedSource(source.id)}
                  style={{
                    boxShadow: selectedSource === source.id
                      ? '0 0 30px rgba(192, 132, 252, 0.3)'
                      : undefined
                  }}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          {getTypeIcon(source.type)}
                          {source.status === 'active' && (
                            <div className="absolute -inset-1 w-7 h-7 border border-green-400 rounded-full animate-ping" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-mono font-bold text-purple-300">{source.name}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={`text-xs px-2 py-1 rounded-full ${statusColors.bg} ${statusColors.text} ${statusColors.border} border`}>
                              {source.status.toUpperCase()}
                            </span>
                            <span className="text-xs text-cyan-400/60">ID: {source.id}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-cyan-400">
                          {source.eventsPerSecond.toLocaleString()}
                        </div>
                        <div className="text-xs text-cyan-400/60 uppercase">Events/Sec</div>
                      </div>
                    </div>

                    {/* Metrics Bar */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="text-xs text-purple-400/60 mb-1">COVERAGE</div>
                        <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full"
                            style={{
                              width: `${source.coverage}%`,
                              background: 'linear-gradient(90deg, #c084fc, #00ffff)'
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-cyan-400/60 mb-1">VOLUME</div>
                        <div className="font-mono text-sm">{source.dataVolume}</div>
                      </div>
                      <div>
                        <div className="text-xs text-pink-400/60 mb-1">THROUGHPUT</div>
                        <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full animate-pulse"
                            style={{
                              width: `${streamMetrics[source.id] || 0}%`,
                              background: 'linear-gradient(90deg, #ff00ff, #e879f9)'
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Platform Status */}
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-500 uppercase">Platforms:</span>
                      <div className="flex gap-2">
                        {Object.entries(source.platforms).map(([platform, enabled]) => (
                          <div
                            key={platform}
                            className={`px-2 py-1 rounded text-xs font-mono ${
                              enabled 
                                ? 'bg-green-400/20 text-green-400 border border-green-400/30'
                                : 'bg-gray-700/20 text-gray-500 border border-gray-700/30'
                            }`}
                          >
                            {platform.toUpperCase()}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-4">
            <button className="neon-btn px-6 py-3 rounded-xl font-semibold uppercase tracking-wider">
              Add Source
            </button>
            <button className="neon-btn px-6 py-3 rounded-xl font-semibold uppercase tracking-wider">
              Configure
            </button>
            <button className="neon-btn px-6 py-3 rounded-xl font-semibold uppercase tracking-wider">
              Export Config
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogSources;