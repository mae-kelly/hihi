import React, { useRef, useEffect, useState } from 'react';
import { Network, Globe, Shield, Server, Cloud, Wifi, Database, Activity, AlertTriangle, CheckCircle, Cpu, HardDrive, Router, Lock } from 'lucide-react';

const NetworkTopology: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [dataFlow, setDataFlow] = useState<number>(0);
  const [securityStatus, setSecurityStatus] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<'2d' | '3d' | 'flow'>('3d');

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
      id: 'core-router',
      label: 'CORE ROUTER',
      type: 'router',
      x: 0, y: 0, z: 0,
      status: 'secure',
      traffic: 95,
      connections: ['firewall-1', 'firewall-2', 'cloud-gateway'],
      metrics: { cpu: 45, memory: 62, bandwidth: 850, packets: 125000 }
    },
    {
      id: 'firewall-1',
      label: 'FIREWALL ALPHA',
      type: 'firewall',
      x: -150, y: -100, z: 50,
      status: 'secure',
      traffic: 78,
      connections: ['dmz-server', 'internal-net'],
      metrics: { cpu: 38, memory: 55, bandwidth: 650, packets: 98000 }
    },
    {
      id: 'firewall-2',
      label: 'FIREWALL BETA',
      type: 'firewall',
      x: 150, y: -100, z: 50,
      status: 'warning',
      traffic: 82,
      connections: ['dmz-server', 'cloud-gateway'],
      metrics: { cpu: 72, memory: 81, bandwidth: 720, packets: 112000 }
    },
    {
      id: 'dmz-server',
      label: 'DMZ CLUSTER',
      type: 'server',
      x: 0, y: -150, z: 100,
      status: 'secure',
      traffic: 65,
      connections: ['database-1', 'cloud-gateway'],
      metrics: { cpu: 55, memory: 68, bandwidth: 450, packets: 67000 }
    },
    {
      id: 'internal-net',
      label: 'INTERNAL NETWORK',
      type: 'endpoint',
      x: -200, y: 50, z: 75,
      status: 'secure',
      traffic: 45,
      connections: ['database-1', 'database-2'],
      metrics: { cpu: 28, memory: 42, bandwidth: 320, packets: 45000 }
    },
    {
      id: 'cloud-gateway',
      label: 'CLOUD GATEWAY',
      type: 'cloud',
      x: 200, y: 50, z: 75,
      status: 'critical',
      traffic: 92,
      connections: ['cloud-services'],
      metrics: { cpu: 88, memory: 92, bandwidth: 980, packets: 156000 }
    },
    {
      id: 'database-1',
      label: 'PRIMARY DB',
      type: 'database',
      x: -100, y: 150, z: 125,
      status: 'secure',
      traffic: 55,
      connections: ['database-2'],
      metrics: { cpu: 42, memory: 78, bandwidth: 280, packets: 34000 }
    },
    {
      id: 'database-2',
      label: 'REPLICA DB',
      type: 'database',
      x: 100, y: 150, z: 125,
      status: 'secure',
      traffic: 48,
      connections: [],
      metrics: { cpu: 35, memory: 72, bandwidth: 240, packets: 28000 }
    },
    {
      id: 'cloud-services',
      label: 'CLOUD SERVICES',
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
    for (let i = 0; i < 50; i++) {
      particles.push({
        path: nodes[Math.floor(Math.random() * nodes.length)].id,
        target: nodes[Math.floor(Math.random() * nodes.length)].id,
        progress: Math.random(),
        speed: 0.005 + Math.random() * 0.01,
        color: `hsl(${180 + Math.random() * 60}, 100%, 50%)`
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
      
      // Rotate around Y axis
      const x1 = x * cosY - z * sinY;
      const z1 = x * sinY + z * cosY;
      
      // Rotate around X axis
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

      // Clear canvas with trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Sort nodes by Z depth for proper rendering
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
            gradient.addColorStop(0, 'rgba(255, 0, 68, 0.6)');
            gradient.addColorStop(1, 'rgba(255, 136, 0, 0.6)');
          } else if (node.status === 'warning' || target.status === 'warning') {
            gradient.addColorStop(0, 'rgba(255, 255, 0, 0.6)');
            gradient.addColorStop(1, 'rgba(255, 136, 0, 0.6)');
          } else {
            gradient.addColorStop(0, 'rgba(0, 255, 255, 0.4)');
            gradient.addColorStop(1, 'rgba(168, 85, 247, 0.4)');
          }

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 2 * Math.min(start.scale, end.scale);
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          
          // Create curved connection
          const midX = (start.x + end.x) / 2;
          const midY = (start.y + end.y) / 2 - 50 * Math.min(start.scale, end.scale);
          ctx.quadraticCurveTo(midX, midY, end.x, end.y);
          ctx.stroke();

          // Animated data packets
          particles.forEach(particle => {
            if (particle.path === node.id && particle.target === targetId) {
              particle.progress += particle.speed;
              if (particle.progress > 1) {
                particle.progress = 0;
                particle.path = nodes[Math.floor(Math.random() * nodes.length)].id;
                particle.target = nodes[Math.floor(Math.random() * nodes.length)].id;
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

        // Node glow effect
        const glowGradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, size * 2);
        if (node.status === 'critical') {
          glowGradient.addColorStop(0, 'rgba(255, 0, 68, 0.8)');
          glowGradient.addColorStop(1, 'rgba(255, 0, 68, 0)');
        } else if (node.status === 'warning') {
          glowGradient.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
          glowGradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
        } else {
          glowGradient.addColorStop(0, 'rgba(0, 255, 255, 0.8)');
          glowGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
        }
        
        ctx.fillStyle = glowGradient;
        ctx.fillRect(pos.x - size * 2, pos.y - size * 2, size * 4, size * 4);

        // Node body
        ctx.fillStyle = node.status === 'critical' ? 'rgba(255, 0, 68, 0.9)' :
                       node.status === 'warning' ? 'rgba(255, 255, 0, 0.9)' :
                       'rgba(0, 255, 255, 0.9)';
        ctx.strokeStyle = node.status === 'critical' ? '#ff0044' :
                         node.status === 'warning' ? '#ffff00' :
                         '#00ffff';
        ctx.lineWidth = 2 * pos.scale;
        
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
        ctx.stroke();

        // Node label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = `${10 * pos.scale}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(node.label, pos.x, pos.y + size + 15 * pos.scale);

        // Traffic indicator
        const trafficHeight = (node.traffic / 100) * size * 2;
        ctx.fillStyle = `rgba(0, 255, 136, ${0.3 + (node.traffic / 100) * 0.4})`;
        ctx.fillRect(pos.x - size - 10 * pos.scale, pos.y + size - trafficHeight, 5 * pos.scale, trafficHeight);
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, [viewMode]);

  // Update data flow
  useEffect(() => {
    const interval = setInterval(() => {
      setDataFlow(prev => (prev + 1) % 100);
      
      // Randomly update node statuses
      const newStatus: Record<string, string> = {};
      nodes.forEach(node => {
        const rand = Math.random();
        if (rand < 0.05) {
          newStatus[node.id] = 'critical';
        } else if (rand < 0.15) {
          newStatus[node.id] = 'warning';
        } else {
          newStatus[node.id] = 'secure';
        }
      });
      setSecurityStatus(newStatus);
    }, 2000);

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
    <div className="p-6 min-h-screen relative">
      {/* Animated background */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(0, 255, 255, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(255, 0, 255, 0.3) 0%, transparent 50%)
          `,
          animation: 'pulse 8s ease-in-out infinite'
        }} />
      </div>

      {/* Header */}
      <div className="relative z-10 mb-8">
        <h1 className="text-5xl font-black mb-2" style={{
          fontFamily: 'Orbitron, monospace',
          textShadow: '0 0 40px rgba(0, 255, 255, 0.8)'
        }}>
          <span style={{
            background: 'linear-gradient(135deg, #00ffff, #a855f7, #ff00ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundSize: '200% 200%',
            animation: 'gradient-shift 3s ease infinite'
          }}>
            NETWORK TOPOLOGY MATRIX
          </span>
        </h1>
        <p className="text-cyan-400/60 font-mono text-sm tracking-wider">
          REAL-TIME 3D INFRASTRUCTURE VISUALIZATION & MONITORING
        </p>
      </div>

      {/* View mode selector */}
      <div className="relative z-10 flex gap-2 mb-6">
        {(['3d', '2d', 'flow'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-6 py-3 rounded-lg font-mono text-sm font-bold uppercase tracking-wider transition-all ${
              viewMode === mode
                ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/50 text-cyan-400'
                : 'bg-black/40 border border-cyan-400/20 text-cyan-400/60 hover:border-cyan-400/40'
            }`}
          >
            {mode.toUpperCase()} VIEW
          </button>
        ))}
      </div>

      {/* Main visualization area */}
      <div className="relative z-10 grid grid-cols-12 gap-6">
        {/* 3D Network Canvas */}
        <div className="col-span-8">
          <div className="backdrop-blur-xl bg-black/40 rounded-2xl border border-cyan-400/30 p-4"
               style={{
                 boxShadow: '0 0 60px rgba(0, 255, 255, 0.2), inset 0 0 60px rgba(0, 0, 0, 0.5)'
               }}>
            <canvas 
              ref={canvasRef}
              className="w-full h-[500px]"
              style={{
                filter: 'contrast(1.2) brightness(1.1)'
              }}
            />
            
            {/* Network stats overlay */}
            <div className="absolute top-6 left-6 space-y-2">
              <div className="backdrop-blur-xl bg-black/60 rounded-lg px-3 py-2 border border-cyan-400/30">
                <div className="text-xs text-cyan-400/60">TOTAL NODES</div>
                <div className="text-xl font-bold font-mono text-cyan-400">{nodes.length}</div>
              </div>
              <div className="backdrop-blur-xl bg-black/60 rounded-lg px-3 py-2 border border-green-400/30">
                <div className="text-xs text-green-400/60">SECURE</div>
                <div className="text-xl font-bold font-mono text-green-400">
                  {nodes.filter(n => n.status === 'secure').length}
                </div>
              </div>
              <div className="backdrop-blur-xl bg-black/60 rounded-lg px-3 py-2 border border-red-400/30">
                <div className="text-xs text-red-400/60">THREATS</div>
                <div className="text-xl font-bold font-mono text-red-400">
                  {nodes.filter(n => n.status === 'critical').length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Node details panel */}
        <div className="col-span-4 space-y-4">
          {/* Node list */}
          <div className="backdrop-blur-xl bg-black/40 rounded-2xl border border-purple-400/30 p-4 max-h-[500px] overflow-y-auto custom-scrollbar"
               style={{
                 boxShadow: '0 0 40px rgba(168, 85, 247, 0.2), inset 0 0 40px rgba(0, 0, 0, 0.5)'
               }}>
            <h3 className="text-sm font-mono text-purple-400 mb-4 uppercase tracking-wider">Network Nodes</h3>
            
            <div className="space-y-2">
              {nodes.map(node => (
                <div
                  key={node.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedNode === node.id
                      ? 'bg-purple-500/20 border-purple-500'
                      : 'bg-black/30 border-purple-400/20 hover:border-purple-400/40'
                  }`}
                  onClick={() => setSelectedNode(node.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getNodeIcon(node.type)}
                      <span className="text-sm font-mono font-bold">{node.label}</span>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      node.status === 'critical' ? 'bg-red-500 animate-pulse' :
                      node.status === 'warning' ? 'bg-yellow-500' :
                      'bg-green-500'
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
                    <div>
                      <span className="text-purple-400/60">BW:</span>
                      <span className="ml-1 font-mono">{node.metrics.bandwidth}Mbps</span>
                    </div>
                    <div>
                      <span className="text-purple-400/60">PKT:</span>
                      <span className="ml-1 font-mono">{(node.metrics.packets / 1000).toFixed(0)}K</span>
                    </div>
                  </div>
                  
                  <div className="mt-2 h-1 bg-black/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                      style={{ width: `${node.traffic}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Traffic flow monitor */}
          <div className="backdrop-blur-xl bg-black/40 rounded-2xl border border-cyan-400/30 p-4"
               style={{
                 boxShadow: '0 0 40px rgba(0, 255, 255, 0.2), inset 0 0 40px rgba(0, 0, 0, 0.5)'
               }}>
            <h3 className="text-sm font-mono text-cyan-400 mb-4 uppercase tracking-wider">Data Flow Monitor</h3>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-cyan-400/60">INBOUND</span>
                  <span className="font-mono text-cyan-400">2.4 GB/s</span>
                </div>
                <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500" 
                       style={{ width: `${65 + Math.sin(dataFlow * 0.1) * 20}%` }} />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-purple-400/60">OUTBOUND</span>
                  <span className="font-mono text-purple-400">1.8 GB/s</span>
                </div>
                <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" 
                       style={{ width: `${55 + Math.cos(dataFlow * 0.1) * 20}%` }} />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-green-400/60">INTERNAL</span>
                  <span className="font-mono text-green-400">3.2 GB/s</span>
                </div>
                <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-500 to-cyan-500" 
                       style={{ width: `${75 + Math.sin(dataFlow * 0.15) * 15}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(168, 85, 247, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.5);
          border-radius: 2px;
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
};

export default NetworkTopology;