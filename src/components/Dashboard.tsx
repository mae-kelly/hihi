import React, { useState, useEffect, useRef } from 'react';
import { Shield, Activity, AlertTriangle, Database, Server, Cloud, Wifi, Terminal, Zap, Globe, Lock, Eye, Target, TrendingUp, Users, BarChart3, AlertCircle, ChevronRight, Monitor, Cpu, HardDrive, Network, Layers, Box, Hexagon, Triangle, Circle } from 'lucide-react';

interface DashboardProps {
  user: string;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [activeMetric, setActiveMetric] = useState<string | null>(null);
  const [dataPoints, setDataPoints] = useState<number[]>([]);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [systemHealth, setSystemHealth] = useState(92);
  const [threats, setThreats] = useState(3);
  const [dataFlow, setDataFlow] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [particles, setParticles] = useState<Array<{x: number, y: number, vx: number, vy: number}>>([]);

  // Initialize particle system
  useEffect(() => {
    const newParticles = [];
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5
      });
    }
    setParticles(newParticles);
  }, []);

  // Animate particles
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => prev.map(p => ({
        x: (p.x + p.vx + window.innerWidth) % window.innerWidth,
        y: (p.y + p.vy + window.innerHeight) % window.innerHeight,
        vx: p.vx,
        vy: p.vy
      })));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Generate random data for visualization
  useEffect(() => {
    const interval = setInterval(() => {
      setDataPoints(Array.from({ length: 20 }, () => Math.random() * 100));
      setDataFlow(prev => (prev + 1) % 100);
      setSystemHealth(85 + Math.random() * 15);
      setThreats(Math.floor(Math.random() * 10));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // 3D holographic wave animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let time = 0;
    const animate = () => {
      time += 0.02;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw holographic waves
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.strokeStyle = i % 2 === 0 
          ? `rgba(0, 255, 255, ${0.3 - i * 0.05})`
          : `rgba(192, 132, 252, ${0.3 - i * 0.05})`;
        ctx.lineWidth = 2;
        
        for (let x = 0; x < canvas.width; x += 5) {
          const y = canvas.height / 2 + 
                   Math.sin((x / 50) + time + i * 0.5) * 30 * (1 - i * 0.1) +
                   Math.sin((x / 30) + time * 1.5 + i * 0.3) * 20 * (1 - i * 0.1);
          
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }
      
      requestAnimationFrame(animate);
    };
    animate();
  }, []);

  const metrics = [
    {
      icon: Eye,
      label: 'VISIBILITY',
      value: systemHealth,
      unit: '%',
      color: 'cyan',
      gradient: 'from-cyan-400 to-blue-400'
    },
    {
      icon: Shield,
      label: 'SECURITY',
      value: 95.5,
      unit: '%',
      color: 'purple',
      gradient: 'from-purple-400 to-pink-400'
    },
    {
      icon: AlertTriangle,
      label: 'THREATS',
      value: threats,
      unit: '',
      color: 'pink',
      gradient: 'from-pink-400 to-rose-400'
    },
    {
      icon: Activity,
      label: 'UPTIME',
      value: 99.9,
      unit: '%',
      color: 'cyan',
      gradient: 'from-blue-400 to-cyan-400'
    }
  ];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Quantum grid background */}
      <div className="quantum-grid" />
      
      {/* Floating particles */}
      {particles.map((particle, i) => (
        <div
          key={i}
          className="quantum-particle"
          style={{
            left: particle.x,
            top: particle.y,
            background: i % 2 === 0 ? '#00ffff' : '#c084fc',
            boxShadow: i % 2 === 0 
              ? '0 0 10px #00ffff, 0 0 20px rgba(0, 255, 255, 0.5)'
              : '0 0 10px #c084fc, 0 0 20px rgba(192, 132, 252, 0.5)'
          }}
        />
      ))}

      {/* Main content */}
      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-6xl font-black mb-4 holo-text">
            QUANTUM SECURITY MATRIX
          </h1>
          <div className="flex items-center gap-4">
            <div className="glass-panel px-4 py-2 rounded-full">
              <span className="text-sm font-medium text-cyan-300">
                AGENT: {user.toUpperCase()}
              </span>
            </div>
            <div className="glass-panel px-4 py-2 rounded-full">
              <span className="text-sm font-medium text-purple-300">
                CLEARANCE: OMEGA
              </span>
            </div>
            <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-green-400">
                SYSTEM ONLINE
              </span>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.label}
                className="holo-card rounded-2xl p-6 cursor-pointer transition-all duration-500 holo-shine"
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  transform: hoveredCard === index ? 'scale(1.05) translateY(-10px)' : 'scale(1)',
                  boxShadow: hoveredCard === index 
                    ? `0 20px 60px rgba(0, 255, 255, 0.3), 0 0 100px rgba(192, 132, 252, 0.2)`
                    : 'none'
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <Icon className={`w-8 h-8 ${
                    metric.color === 'cyan' ? 'text-cyan-400' :
                    metric.color === 'purple' ? 'text-purple-400' :
                    'text-pink-400'
                  }`} />
                  <Hexagon className="w-6 h-6 text-gray-600" />
                </div>
                
                <div className="text-4xl font-bold mb-2">
                  <span className={`bg-gradient-to-r ${metric.gradient} bg-clip-text text-transparent`}>
                    {metric.value}{metric.unit}
                  </span>
                </div>
                
                <div className="text-sm text-gray-400 uppercase tracking-wider">
                  {metric.label}
                </div>
                
                {/* Mini chart */}
                <div className="mt-4 flex items-end gap-1 h-12">
                  {dataPoints.slice(0, 10).map((point, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t rounded-t"
                      style={{
                        height: `${point * 0.5}px`,
                        background: metric.color === 'cyan' 
                          ? 'linear-gradient(to top, rgba(0, 255, 255, 0.5), rgba(0, 255, 255, 0.1))'
                          : metric.color === 'purple'
                          ? 'linear-gradient(to top, rgba(192, 132, 252, 0.5), rgba(192, 132, 252, 0.1))'
                          : 'linear-gradient(to top, rgba(255, 0, 255, 0.5), rgba(255, 0, 255, 0.1))'
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Main visualization area */}
        <div className="grid grid-cols-12 gap-6">
          {/* 3D Wave Visualization */}
          <div className="col-span-8">
            <div className="glass-panel rounded-2xl p-6 h-[400px] relative">
              <h3 className="text-lg font-semibold mb-4 text-cyan-300 uppercase tracking-wider">
                Quantum Data Flow
              </h3>
              <canvas 
                ref={canvasRef}
                className="w-full h-[300px]"
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(0, 255, 255, 0.5))'
                }}
              />
              
              {/* Overlay metrics */}
              <div className="absolute bottom-6 left-6 right-6 flex justify-between">
                <div className="glass-panel px-3 py-2 rounded">
                  <span className="text-xs text-gray-400">THROUGHPUT</span>
                  <div className="text-lg font-bold text-cyan-400">2.4 TB/s</div>
                </div>
                <div className="glass-panel px-3 py-2 rounded">
                  <span className="text-xs text-gray-400">LATENCY</span>
                  <div className="text-lg font-bold text-purple-400">0.3ms</div>
                </div>
                <div className="glass-panel px-3 py-2 rounded">
                  <span className="text-xs text-gray-400">PACKETS</span>
                  <div className="text-lg font-bold text-pink-400">1.2M/s</div>
                </div>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="col-span-4">
            <div className="glass-panel rounded-2xl p-6 h-[400px]">
              <h3 className="text-lg font-semibold mb-4 text-purple-300 uppercase tracking-wider">
                System Status
              </h3>
              
              <div className="space-y-4">
                {['Core Systems', 'Neural Network', 'Quantum Engine', 'Data Pipeline'].map((system, index) => {
                  const status = index === 2 ? 'warning' : 'online';
                  const progress = index === 2 ? 67 : 90 + Math.random() * 10;
                  
                  return (
                    <div key={system} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">{system}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          status === 'online' 
                            ? 'bg-green-400/20 text-green-400'
                            : 'bg-yellow-400/20 text-yellow-400'
                        }`}>
                          {status.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all duration-500 rounded-full"
                          style={{
                            width: `${progress}%`,
                            background: status === 'online'
                              ? 'linear-gradient(90deg, #00ffff, #00e5ff)'
                              : 'linear-gradient(90deg, #f0abfc, #e879f9)'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Circular progress indicator */}
              <div className="mt-8 flex justify-center">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="rgba(0, 255, 255, 0.1)"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="url(#gradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - systemHealth / 100)}`}
                      className="transition-all duration-1000"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00ffff" />
                        <stop offset="100%" stopColor="#c084fc" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-cyan-400">{systemHealth.toFixed(1)}%</div>
                      <div className="text-xs text-gray-400">HEALTH</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom monitoring strip */}
        <div className="mt-8 glass-panel rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-cyan-400" />
                <div>
                  <div className="text-xs text-gray-400">CPU</div>
                  <div className="text-sm font-bold text-cyan-400">42%</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <HardDrive className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="text-xs text-gray-400">MEMORY</div>
                  <div className="text-sm font-bold text-purple-400">8.6 GB</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Wifi className="w-5 h-5 text-pink-400" />
                <div>
                  <div className="text-xs text-gray-400">NETWORK</div>
                  <div className="text-sm font-bold text-pink-400">1.2 Gbps</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500">
                {typeof window !== 'undefined' 
                  ? new Date().toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false 
                    })
                  : '00:00:00'
                }
              </span>
              <button className="neon-btn px-6 py-2 rounded-lg text-sm font-medium">
                SCAN NETWORK
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;