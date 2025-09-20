import React, { useState, useEffect, useRef } from 'react';
import { Shield, Activity, AlertTriangle, Database, Server, Cloud, Wifi, Terminal, Zap, Globe, Lock, Eye, Target, TrendingUp, Users, BarChart3, AlertCircle, Cpu, HardDrive } from 'lucide-react';
import { DashboardData } from '@/types';
import { generateMockDashboardData, generateTimeSeriesData } from '@/data/mockData';

interface AdvancedDashboardProps {
  user: string;
}

const AdvancedDashboard: React.FC<AdvancedDashboardProps> = ({ user }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);
  const [particleCount, setParticleCount] = useState(100);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const [pulseRings, setPulseRings] = useState<Array<{id: number, x: number, y: number}>>([]);

  // Initialize data
  useEffect(() => {
    setData(generateMockDashboardData());
    setTimeSeriesData(generateTimeSeriesData(24));

    const interval = setInterval(() => {
      setData(generateMockDashboardData());
      setTimeSeriesData(generateTimeSeriesData(24));
      
      // Add random pulse rings for threat detection
      if (Math.random() > 0.7) {
        setPulseRings(prev => [...prev, {
          id: Date.now(),
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight
        }]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Animated particle background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{x: number, y: number, vx: number, vy: number, size: number}> = [];
    
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2
      });
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(10, 10, 15, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle, i) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        
        const gradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.size * 2);
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Connect nearby particles
        particles.forEach((particle2, j) => {
          if (i === j) return;
          const dx = particle.x - particle2.x;
          const dy = particle.y - particle2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(particle2.x, particle2.y);
            ctx.strokeStyle = `rgba(0, 255, 255, ${0.2 * (1 - distance / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [particleCount]);

  // Globe rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => ({
        x: prev.x + 0.5,
        y: prev.y + 1
      }));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Remove old pulse rings
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseRings(prev => prev.filter(ring => Date.now() - ring.id < 3000));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  if (!data) return null;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated particle canvas */}
      <canvas 
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
      />

      {/* Pulse rings for threats */}
      {pulseRings.map(ring => (
        <div
          key={ring.id}
          className="absolute pointer-events-none"
          style={{
            left: ring.x,
            top: ring.y,
            transform: 'translate(-50%, -50%)',
            zIndex: 2
          }}
        >
          <div className="relative">
            <div className="absolute w-20 h-20 border-2 border-red-400 rounded-full animate-ping" />
            <div className="absolute w-20 h-20 border-2 border-red-400 rounded-full animate-ping animation-delay-200" />
            <div className="absolute w-20 h-20 border-2 border-red-400 rounded-full animate-ping animation-delay-400" />
          </div>
        </div>
      ))}

      <div className="relative z-10 p-6">
        {/* 3D Rotating Globe Header */}
        <div className="mb-8 relative">
          <div className="absolute -top-10 -right-10 w-64 h-64 opacity-20">
            <div 
              ref={globeRef}
              className="relative w-full h-full"
              style={{
                transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
                transformStyle: 'preserve-3d'
              }}
            >
              <div className="absolute inset-0 rounded-full border border-cyan-400/30"
                   style={{ transform: 'rotateY(0deg) translateZ(0px)' }}>
                <Globe className="w-full h-full text-cyan-400/20" />
              </div>
              <div className="absolute inset-0 rounded-full border border-purple-400/30"
                   style={{ transform: 'rotateY(90deg) translateZ(0px)' }}>
                <Globe className="w-full h-full text-purple-400/20" />
              </div>
              {/* Connection points on globe */}
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-cyan-400 rounded-full animate-pulse"
                  style={{
                    top: `${30 + Math.sin(i * Math.PI / 4) * 30}%`,
                    left: `${50 + Math.cos(i * Math.PI / 4) * 30}%`,
                    boxShadow: '0 0 10px rgba(0, 255, 255, 0.8)'
                  }}
                />
              ))}
            </div>
          </div>

          <h1 className="text-5xl font-black relative" style={{
            fontFamily: 'Orbitron, monospace',
            textShadow: '0 0 30px rgba(0, 255, 255, 0.5)'
          }}>
            <span className="inline-block animate-pulse" style={{
              background: 'linear-gradient(135deg, #00ffff, #00d4ff, #a855f7, #ff00ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundSize: '200% 200%',
              animation: 'gradient 3s ease infinite'
            }}>
              GLOBAL SECURITY OPERATIONS
            </span>
          </h1>
        </div>

        {/* Advanced Metrics Grid with 3D Effects */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { icon: Eye, label: 'VISIBILITY', value: data.overallVisibility, color: 'cyan' },
            { icon: Server, label: 'SYSTEMS', value: data.systemsMonitored, color: 'purple' },
            { icon: AlertTriangle, label: 'THREATS', value: data.activeThreats, color: 'red' },
            { icon: Shield, label: 'COMPLIANCE', value: data.complianceScore, color: 'green' }
          ].map((metric, index) => {
            const Icon = metric.icon;
            const isHovered = hoveredMetric === metric.label;
            
            return (
              <div
                key={metric.label}
                className="relative group"
                onMouseEnter={() => setHoveredMetric(metric.label)}
                onMouseLeave={() => setHoveredMetric(null)}
              >
                <div className={`
                  relative backdrop-blur-xl rounded-2xl p-6 border transition-all duration-500
                  ${isHovered ? 'transform scale-105 -translate-y-2' : ''}
                `}
                style={{
                  background: `linear-gradient(135deg, 
                    ${metric.color === 'cyan' ? 'rgba(0, 255, 255, 0.1)' :
                      metric.color === 'purple' ? 'rgba(168, 85, 247, 0.1)' :
                      metric.color === 'red' ? 'rgba(255, 0, 68, 0.1)' :
                      'rgba(0, 255, 136, 0.1)'
                    }, rgba(0, 0, 0, 0.4))`,
                  borderColor: `${metric.color === 'cyan' ? '#00ffff' :
                    metric.color === 'purple' ? '#a855f7' :
                    metric.color === 'red' ? '#ff0044' :
                    '#00ff88'}33`,
                  boxShadow: isHovered ? `
                    0 20px 40px rgba(0, 0, 0, 0.5),
                    0 0 60px ${metric.color === 'cyan' ? 'rgba(0, 255, 255, 0.4)' :
                      metric.color === 'purple' ? 'rgba(168, 85, 247, 0.4)' :
                      metric.color === 'red' ? 'rgba(255, 0, 68, 0.4)' :
                      'rgba(0, 255, 136, 0.4)'}
                  ` : '0 10px 30px rgba(0, 0, 0, 0.3)',
                  transform: isHovered ? 'perspective(1000px) rotateX(-10deg)' : 'perspective(1000px) rotateX(0deg)',
                  transformStyle: 'preserve-3d'
                }}>
                  {/* Animated background pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                      backgroundImage: `repeating-linear-gradient(
                        45deg,
                        transparent,
                        transparent 10px,
                        ${metric.color === 'cyan' ? '#00ffff' :
                          metric.color === 'purple' ? '#a855f7' :
                          metric.color === 'red' ? '#ff0044' :
                          '#00ff88'}22 10px,
                        ${metric.color === 'cyan' ? '#00ffff' :
                          metric.color === 'purple' ? '#a855f7' :
                          metric.color === 'red' ? '#ff0044' :
                          '#00ff88'}22 20px
                      )`,
                      animation: 'slide 20s linear infinite'
                    }} />
                  </div>

                  <div className="relative">
                    <Icon className={`w-8 h-8 mb-3 ${isHovered ? 'animate-bounce' : 'animate-pulse'}`}
                         style={{
                           color: metric.color === 'cyan' ? '#00ffff' :
                             metric.color === 'purple' ? '#a855f7' :
                             metric.color === 'red' ? '#ff0044' :
                             '#00ff88',
                           filter: 'drop-shadow(0 0 10px currentColor)'
                         }} />
                    
                    <div className="text-5xl font-black font-mono mb-2"
                         style={{
                           color: metric.color === 'cyan' ? '#00ffff' :
                             metric.color === 'purple' ? '#a855f7' :
                             metric.color === 'red' ? '#ff0044' :
                             '#00ff88',
                           textShadow: '0 0 20px currentColor'
                         }}>
                      {typeof metric.value === 'number' && metric.value < 100 
                        ? metric.value.toFixed(1) + '%' 
                        : metric.value}
                    </div>
                    
                    <div className="text-xs font-mono opacity-60 tracking-wider">
                      {metric.label}
                    </div>

                    {/* Live mini chart */}
                    <div className="mt-3 h-8 flex items-end gap-px">
                      {[...Array(20)].map((_, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t"
                          style={{
                            height: `${20 + Math.random() * 80}%`,
                            background: `linear-gradient(to top, 
                              ${metric.color === 'cyan' ? '#00ffff' :
                                metric.color === 'purple' ? '#a855f7' :
                                metric.color === 'red' ? '#ff0044' :
                                '#00ff88'}88,
                              transparent)`,
                            animation: `pulse ${1 + Math.random()}s ease-in-out infinite`,
                            animationDelay: `${i * 50}ms`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Real-time Activity Stream */}
        <div className="backdrop-blur-xl bg-black/40 rounded-2xl border border-cyan-400/30 p-6 mb-8"
             style={{ boxShadow: '0 0 40px rgba(0, 255, 255, 0.1), inset 0 0 40px rgba(0, 0, 0, 0.5)' }}>
          <h2 className="text-2xl font-bold mb-4" style={{
            fontFamily: 'Orbitron, monospace',
            background: 'linear-gradient(90deg, #00ffff, #a855f7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            REAL-TIME THREAT ACTIVITY
          </h2>
          
          <div className="relative h-48 overflow-hidden">
            {/* Scrolling threat feed */}
            <div className="absolute inset-0">
              {data.threats.map((threat, index) => (
                <div
                  key={threat.id}
                  className="absolute w-full flex items-center gap-4 p-2 rounded-lg bg-black/30 border border-red-400/20"
                  style={{
                    top: `${index * 40}px`,
                    animation: 'slideUp 10s linear infinite',
                    animationDelay: `${index * 2}s`
                  }}
                >
                  <div className={`w-3 h-3 rounded-full animate-pulse ${
                    threat.severity === 'critical' ? 'bg-red-400' :
                    threat.severity === 'high' ? 'bg-orange-400' :
                    'bg-yellow-400'
                  }`} />
                  <span className="text-sm font-mono text-cyan-300">{threat.type}</span>
                  <span className="text-xs text-cyan-400/60">{threat.source}</span>
                  <div className="ml-auto text-xs font-mono text-red-400">
                    {threat.affectedSystems} systems
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3D Network Topology Visualization */}
        <div className="backdrop-blur-xl bg-black/40 rounded-2xl border border-purple-400/30 p-6"
             style={{ boxShadow: '0 0 40px rgba(168, 85, 247, 0.1), inset 0 0 40px rgba(0, 0, 0, 0.5)' }}>
          <h2 className="text-2xl font-bold mb-4" style={{
            fontFamily: 'Orbitron, monospace',
            background: 'linear-gradient(90deg, #a855f7, #ff00ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            NETWORK TOPOLOGY
          </h2>
          
          <div className="relative h-64">
            <svg className="absolute inset-0 w-full h-full">
              {/* Network nodes */}
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Connection lines */}
              <line x1="50%" y1="20%" x2="30%" y2="50%" stroke="rgba(0, 255, 255, 0.3)" strokeWidth="2" strokeDasharray="5,5">
                <animate attributeName="stroke-dashoffset" values="0;10" dur="1s" repeatCount="indefinite" />
              </line>
              <line x1="50%" y1="20%" x2="70%" y2="50%" stroke="rgba(168, 85, 247, 0.3)" strokeWidth="2" strokeDasharray="5,5">
                <animate attributeName="stroke-dashoffset" values="0;10" dur="1s" repeatCount="indefinite" />
              </line>
              <line x1="30%" y1="50%" x2="40%" y2="80%" stroke="rgba(0, 255, 136, 0.3)" strokeWidth="2" strokeDasharray="5,5">
                <animate attributeName="stroke-dashoffset" values="0;10" dur="1s" repeatCount="indefinite" />
              </line>
              <line x1="70%" y1="50%" x2="60%" y2="80%" stroke="rgba(255, 0, 255, 0.3)" strokeWidth="2" strokeDasharray="5,5">
                <animate attributeName="stroke-dashoffset" values="0;10" dur="1s" repeatCount="indefinite" />
              </line>
              
              {/* Nodes */}
              <g filter="url(#glow)">
                <circle cx="50%" cy="20%" r="30" fill="none" stroke="#00ffff" strokeWidth="2">
                  <animate attributeName="r" values="30;35;30" dur="2s" repeatCount="indefinite" />
                </circle>
                <text x="50%" y="20%" textAnchor="middle" fill="#00ffff" fontSize="12" fontFamily="monospace">CORE</text>
                
                <circle cx="30%" cy="50%" r="25" fill="none" stroke="#a855f7" strokeWidth="2">
                  <animate attributeName="r" values="25;30;25" dur="2s" repeatCount="indefinite" begin="0.5s" />
                </circle>
                <text x="30%" y="50%" textAnchor="middle" fill="#a855f7" fontSize="12" fontFamily="monospace">DMZ</text>
                
                <circle cx="70%" cy="50%" r="25" fill="none" stroke="#ff00ff" strokeWidth="2">
                  <animate attributeName="r" values="25;30;25" dur="2s" repeatCount="indefinite" begin="1s" />
                </circle>
                <text x="70%" y="50%" textAnchor="middle" fill="#ff00ff" fontSize="12" fontFamily="monospace">CLOUD</text>
                
                <circle cx="40%" cy="80%" r="20" fill="none" stroke="#00ff88" strokeWidth="2">
                  <animate attributeName="r" values="20;25;20" dur="2s" repeatCount="indefinite" begin="1.5s" />
                </circle>
                <text x="40%" y="80%" textAnchor="middle" fill="#00ff88" fontSize="12" fontFamily="monospace">DATA</text>
                
                <circle cx="60%" cy="80%" r="20" fill="none" stroke="#ff8800" strokeWidth="2">
                  <animate attributeName="r" values="20;25;20" dur="2s" repeatCount="indefinite" begin="2s" />
                </circle>
                <text x="60%" y="80%" textAnchor="middle" fill="#ff8800" fontSize="12" fontFamily="monospace">APPS</text>
              </g>
              
              {/* Data flow particles */}
              <circle r="2" fill="#00ffff">
                <animateMotion dur="3s" repeatCount="indefinite">
                  <mpath href="#flow1" />
                </animateMotion>
              </circle>
              <path id="flow1" d="M 50% 20% L 30% 50% L 40% 80%" fill="none" />
            </svg>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes slide {
          0% { transform: translateX(0); }
          100% { transform: translateX(20px); }
        }
        @keyframes slideUp {
          0% { transform: translateY(0); }
          100% { transform: translateY(-200px); }
        }
        .animation-delay-200 {
          animation-delay: 200ms;
        }
        .animation-delay-400 {
          animation-delay: 400ms;
        }
      `}</style>
    </div>
  );
};

export default AdvancedDashboard;