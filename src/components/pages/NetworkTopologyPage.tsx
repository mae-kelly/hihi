import React, { useRef, useEffect, useState } from 'react';
import { Network, Globe, Shield, Server, Cloud, Wifi, Database, Activity, AlertTriangle, CheckCircle, Cpu, HardDrive, Router, Lock, Hexagon, Circle, Triangle } from 'lucide-react';

const NetworkTopologyPage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'3d' | '2d' | 'flow'>('3d');
  const [dataFlow, setDataFlow] = useState<number>(0);

  interface NetworkNode {
    id: string;
    label: string;
    type: 'firewall' | 'server' | 'cloud' | 'database' | 'endpoint' | 'router';
    x: number;
    y: number;
    z: number;
    status: 'secure' | 'warning' | 'critical';
    traffic: number;
    connections: string[];
    metrics: {
      cpu: number;
      memory: number;
      bandwidth: number;
      packets: number;
    };
  }

  const nodes: NetworkNode[] = [
    {
      id: 'quantum-core',
      label: 'QUANTUM CORE',
      type: 'router',
      x: 0, y: 0, z: 0,
      status: 'secure',
      traffic: 95,
      connections: ['firewall-alpha', 'firewall-beta', 'cloud-nexus'],
      metrics: { cpu: 45, memory: 62, bandwidth: 850, packets: 125000 }
    },
    {
      id: 'firewall-alpha',
      label: 'FIREWALL ALPHA',
      type: 'firewall',
      x: -150, y: -100, z: 50,
      status: 'secure',
      traffic: 78,
      connections: ['plasma-server', 'neural-net'],
      metrics: { cpu: 38, memory: 55, bandwidth: 650, packets: 98000 }
    },
    {
      id: 'firewall-beta',
      label: 'FIREWALL BETA',
      type: 'firewall',
      x: 150, y: -100, z: 50,
      status: 'warning',
      traffic: 82,
      connections: ['plasma-server', 'cloud-nexus'],
      metrics: { cpu: 72, memory: 81, bandwidth: 720, packets: 112000 }
    },
    {
      id: 'plasma-server',
      label: 'PLASMA CLUSTER',
      type: 'server',
      x: 0, y: -150, z: 100,
      status: 'secure',
      traffic: 65,
      connections: ['database-prime', 'cloud-nexus'],
      metrics: { cpu: 55, memory: 68, bandwidth: 450, packets: 67000 }
    },
    {
      id: 'neural-net',
      label: 'NEURAL NETWORK',
      type: 'endpoint',
      x: -200, y: 50, z: 75,
      status: 'secure',
      traffic: 45,
      connections: ['database-prime', 'database-secondary'],
      metrics: { cpu: 28, memory: 42, bandwidth: 320, packets: 45000 }
    },
    {
      id: 'cloud-nexus',
      label: 'CLOUD NEXUS',
      type: 'cloud',
      x: 200, y: 50, z: 75,
      status: 'critical',
      traffic: 92,
      connections: ['photon-services'],
      metrics: { cpu: 88, memory: 92, bandwidth: 980, packets: 156000 }
    },
    {
      id: 'database-prime',
      label: 'DATABASE PRIME',
      type: 'database',
      x: -100, y: 150, z: 125,
      status: 'secure',
      traffic: 55,
      connections: ['database-secondary'],
      metrics: { cpu: 42, memory: 78, bandwidth: 280, packets: 34000 }
    },
    {
      id: 'database-secondary',
      label: 'DATABASE REPLICA',
      type: 'database',
      x: 100, y: 150, z: 125,
      status: 'secure',
      traffic: 48,
      connections: [],
      metrics: { cpu: 35, memory: 72, bandwidth: 240, packets: 28000 }
    },
    {
      id: 'photon-services',
      label: 'PHOTON SERVICES',
      type: 'cloud',
      x: 250, y: -50, z: 150,
      status: 'warning',
      traffic: 75,
      connections: [],
      metrics: { cpu: 62, memory: 74, bandwidth: 750, packets: 95000 }
    }
  ];

  // 3D Network Visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let rotation = { x: 0, y: 0, z: 0 };
    let particles: any[] = [];
    let time = 0;

    // Create data particles
    for (let i = 0; i < 30; i++) {
      particles.push({
        source: nodes[Math.floor(Math.random() * nodes.length)].id,
        target: nodes[Math.floor(Math.random() * nodes.length)].id,
        progress: Math.random(),
        speed: 0.005 + Math.random() * 0.01,
        color: i % 2 === 0 ? '#00ffff' : '#c084fc'
      });
    }

    const project3D = (x: number, y: number, z: number) => {
      const scale = 1000 / (1000 + z);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Apply rotation
      const cosX = Math.cos(rotation.x);
      const sinX = Math.sin(rotation.x);
      const cosY = Math.cos(rotation.y);
      const sinY = Math.sin(rotation.y);
      
      const x1 = x * cosY - z * sinY;
      const z1 = x * sinY + z * cosY;
      const y1 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;
      
      return {
        x: centerX + x1 * scale,
        y: centerY + y1 * scale,
        scale: scale,
        z: z2
      };
    };

    const animate = () => {
      time += 0.01;
      rotation.y += 0.005;
      rotation.x = Math.sin(time * 0.5) * 0.1;

      // Clear canvas
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Sort nodes by Z depth
      const sortedNodes = [...nodes].sort((a, b) => {
        const aProj = project3D(a.x, a.y, a.z);
        const bProj = project3D(b.x, b.y, b.z);
        return aProj.z - bProj.z;
      });

      // Draw connections
      nodes.forEach(node => {
        node.connections.forEach(targetId => {
          const target = nodes.find(n => n.id === targetId);
          if (!target) return;

          const start = project3D(node.x, node.y, node.z);
          const end = project3D(target.x, target.y, target.z);

          // Connection line with gradient
          const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
          
          if (node.status === 'critical' || target.status === 'critical') {
            gradient.addColorStop(0, 'rgba(255, 0, 255, 0.6)');
            gradient.addColorStop(1, 'rgba(232, 121, 249, 0.6)');
          } else if (node.status === 'warning' || target.status === 'warning') {
            gradient.addColorStop(0, 'rgba(192, 132, 252, 0.6)');
            gradient.addColorStop(1, 'rgba(192, 132, 252, 0.3)');
          } else {
            gradient.addColorStop(0, 'rgba(0, 255, 255, 0.4)');
            gradient.addColorStop(1, 'rgba(0, 229, 255, 0.2)');
          }

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 2 * Math.min(start.scale, end.scale);
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          
          // Curved connection
          const midX = (start.x + end.x) / 2;
          const midY = (start.y + end.y) / 2 - 50 * Math.min(start.scale, end.scale);
          ctx.quadraticCurveTo(midX, midY, end.x, end.y);
          ctx.stroke();

          // Data flow particles
          particles.forEach(particle => {
            if (particle.source === node.id && particle.target === targetId) {
              particle.progress += particle.speed;
              if (particle.progress > 1) {
                particle.progress = 0;
              }

              const px = start.x + (end.x - start.x) * particle.progress;
              const py = start.y + (end.y - start.y) * particle.progress - 
                        Math.sin(particle.progress * Math.PI) * 30 * Math.min(start.scale, end.scale);
              
              ctx.fillStyle = particle.color;
              ctx.shadowColor = particle.color;
              ctx.shadowBlur = 10;
              ctx.beginPath();
              ctx.arc(px, py, 3 * Math.min(start.scale, end.scale), 0, Math.PI * 2);
              ctx.fill();
              ctx.shadowBlur = 0;
            }
          });
        });
      });

      // Draw nodes
      sortedNodes.forEach(node => {
        const pos = project3D(node.x, node.y, node.z);
        const size = 30 * pos.scale;

        // Node glow
        const glowGradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, size * 2);
        if (node.status === 'critical') {
          glowGradient.addColorStop(0, 'rgba(255, 0, 255, 0.8)');
          glowGradient.addColorStop(1, 'rgba(255, 0, 255, 0)');
        } else if (node.status === 'warning') {
          glowGradient.addColorStop(0, 'rgba(192, 132, 252, 0.8)');
          glowGradient.addColorStop(1, 'rgba(192, 132, 252, 0)');
        } else {
          glowGradient.addColorStop(0, 'rgba(0, 255, 255, 0.8)');
          glowGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
        }
        
        ctx.fillStyle = glowGradient;
        ctx.fillRect(pos.x - size * 2, pos.y - size * 2, size * 4, size * 4);

        // Node body
        ctx.fillStyle = node.status === 'critical' ? '#ff00ff' :
                       node.status === 'warning' ? '#c084fc' :
                       '#00ffff';
        
        // Draw node shape based on type
        ctx.beginPath();
        if (node.type === 'firewall') {
          // Shield shape
          ctx.moveTo(pos.x, pos.y - size);
          ctx.lineTo(pos.x + size, pos.y);
          ctx.lineTo(pos.x, pos.y + size);
          ctx.lineTo(pos.x - size, pos.y);
          ctx.closePath();
        } else if (node.type === 'database') {
          // Cylinder shape
          ctx.ellipse(pos.x, pos.y, size, size * 0.6, 0, 0, Math.PI * 2);
        } else if (node.type === 'cloud') {
          // Cloud shape
          ctx.arc(pos.x - size/2, pos.y, size/2, 0, Math.PI * 2);
          ctx.arc(pos.x + size/2, pos.y, size/2, 0, Math.PI * 2);
          ctx.arc(pos.x, pos.y - size/3, size/2, 0, Math.PI * 2);
        } else {
          // Default circle
          ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
        }
        ctx.fill();

        // Node label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = `${10 * pos.scale}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(node.label, pos.x, pos.y + size + 15 * pos.scale);
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, [viewMode]);

  // Update data flow
  useEffect(() => {
    const interval = setInterval(() => {
      setDataFlow(prev => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const getNodeIcon = (type: string) => {
    switch(type) {
      case 'firewall': return <Shield className="w-5 h-5" />;
      case 'server': return <Server className="w-5 h-5" />;
      case 'cloud': return <Cloud className="w-5 h-5" />;
      case 'database': return <Database className="w-5 h-5" />;
      case 'endpoint': return <Cpu className="w-5 h-5" />;
      case 'router': return <Router className="w-5 h-5" />;
      default: return <Network className="w-5 h-5" />;
    }
  };

  return (
    <div className="p-8 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-black mb-3 holo-text">
          NETWORK TOPOLOGY
        </h1>
        <p className="text-purple-300/60 uppercase tracking-widest text-sm">
          Quantum Network Infrastructure • 3D Visualization Matrix
        </p>
      </div>

      {/* View mode selector */}
      <div className="flex gap-2 mb-8">
        {(['3d', '2d', 'flow'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-6 py-3 rounded-xl font-semibold uppercase tracking-wider transition-all ${
              viewMode === mode
                ? 'glass-panel scale-105'
                : 'bg-black/30 hover:bg-black/50'
            }`}
            style={{
              borderColor: viewMode === mode ? 'rgba(192, 132, 252, 0.3)' : 'transparent',
              boxShadow: viewMode === mode 
                ? '0 0 30px rgba(192, 132, 252, 0.3)' 
                : 'none'
            }}
          >
            <span className={viewMode === mode ? 'text-purple-300' : 'text-gray-500'}>
              {mode.toUpperCase()} VIEW
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* 3D Network Canvas */}
        <div className="col-span-8">
          <div className="glass-panel rounded-2xl p-4">
            <canvas 
              ref={canvasRef}
              className="w-full h-[500px]"
              style={{
                filter: 'contrast(1.2) brightness(1.1)'
              }}
            />
            
            {/* Network stats overlay */}
            <div className="absolute top-6 left-6 space-y-2">
              <div className="glass-panel rounded-lg px-3 py-2">
                <div className="text-xs text-cyan-400/60 uppercase">Nodes</div>
                <div className="text-xl font-bold text-cyan-400">{nodes.length}</div>
              </div>
              <div className="glass-panel rounded-lg px-3 py-2">
                <div className="text-xs text-green-400/60 uppercase">Secure</div>
                <div className="text-xl font-bold text-green-400">
                  {nodes.filter(n => n.status === 'secure').length}
                </div>
              </div>
              <div className="glass-panel rounded-lg px-3 py-2">
                <div className="text-xs text-pink-400/60 uppercase">Threats</div>
                <div className="text-xl font-bold text-pink-400">
                  {nodes.filter(n => n.status === 'critical').length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Node details panel */}
        <div className="col-span-4 space-y-4">
          {/* Node list */}
          <div className="glass-panel rounded-2xl p-4 max-h-[300px] overflow-y-auto">
            <h3 className="text-sm font-semibold text-purple-300 mb-4 uppercase tracking-wider">
              Network Nodes
            </h3>
            
            <div className="space-y-2">
              {nodes.map(node => (
                <div
                  key={node.id}
                  className={`glass-panel rounded-lg p-3 cursor-pointer transition-all holo-shine ${
                    selectedNode === node.id
                      ? 'scale-102 border-purple-400/50'
                      : 'hover:border-purple-400/30'
                  }`}
                  onClick={() => setSelectedNode(node.id)}
                  style={{
                    boxShadow: selectedNode === node.id
                      ? '0 0 20px rgba(192, 132, 252, 0.3)'
                      : undefined
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getNodeIcon(node.type)}
                      <span className="text-sm font-mono font-bold">{node.label}</span>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      node.status === 'critical' ? 'bg-pink-400 animate-pulse' :
                      node.status === 'warning' ? 'bg-purple-400' :
                      'bg-green-400'
                    }`} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-purple-400/60">CPU:</span>
                      <span className="ml-1 font-mono">{node.metrics.cpu}%</span>
                    </div>
                    <div>
                      <span className="text-purple-400/60">MEM:</span>
                      <span className="ml-1 font-mono">{node.metrics.memory}%</span>
                    </div>
                  </div>
                  
                  <div className="mt-2 h-1 bg-black/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${node.traffic}%`,
                        background: 'linear-gradient(90deg, #c084fc, #00ffff)'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Traffic flow monitor */}
          <div className="glass-panel rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-cyan-300 mb-4 uppercase tracking-wider">
              Data Flow Monitor
            </h3>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-cyan-400/60">INBOUND</span>
                  <span className="font-mono text-cyan-400">2.4 GB/s</span>
                </div>
                <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" 
                       style={{ 
                         width: `${65 + Math.sin(dataFlow * 0.1) * 20}%`,
                         background: 'linear-gradient(90deg, #00ffff, #00e5ff)'
                       }} />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-purple-400/60">OUTBOUND</span>
                  <span className="font-mono text-purple-400">1.8 GB/s</span>
                </div>
                <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" 
                       style={{ 
                         width: `${55 + Math.cos(dataFlow * 0.1) * 20}%`,
                         background: 'linear-gradient(90deg, #c084fc, #ff00ff)'
                       }} />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-pink-400/60">INTERNAL</span>
                  <span className="font-mono text-pink-400">3.2 GB/s</span>
                </div>
                <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" 
                       style={{ 
                         width: `${75 + Math.sin(dataFlow * 0.15) * 15}%`,
                         background: 'linear-gradient(90deg, #ff00ff, #e879f9)'
                       }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkTopologyPage;