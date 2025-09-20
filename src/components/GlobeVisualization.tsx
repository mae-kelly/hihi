import React, { useRef, useEffect, useState } from 'react';
import { Globe, Activity, AlertTriangle, Shield, Zap } from 'lucide-react';

interface GlobeVisualizationProps {
  threats?: Array<{
    id: string;
    lat: number;
    lon: number;
    severity: 'critical' | 'high' | 'medium' | 'low';
    type: string;
  }>;
  connections?: Array<{
    from: { lat: number; lon: number };
    to: { lat: number; lon: number };
    active: boolean;
  }>;
}

const GlobeVisualization: React.FC<GlobeVisualizationProps> = ({ 
  threats = [],
  connections = []
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [hoveredLocation, setHoveredLocation] = useState<any>(null);
  const animationRef = useRef<number>();

  // Global threat locations
  const globalLocations = [
    { id: 'nyc', name: 'New York', lat: 40.7128, lon: -74.0060, status: 'secure', systems: 45 },
    { id: 'lon', name: 'London', lat: 51.5074, lon: -0.1278, status: 'warning', systems: 32 },
    { id: 'tok', name: 'Tokyo', lat: 35.6762, lon: 139.6503, status: 'secure', systems: 28 },
    { id: 'syd', name: 'Sydney', lat: -33.8688, lon: 151.2093, status: 'critical', systems: 18 },
    { id: 'sin', name: 'Singapore', lat: 1.3521, lon: 103.8198, status: 'secure', systems: 22 },
    { id: 'fra', name: 'Frankfurt', lat: 50.1109, lon: 8.6821, status: 'warning', systems: 35 },
    { id: 'sfo', name: 'San Francisco', lat: 37.7749, lon: -122.4194, status: 'secure', systems: 41 },
    { id: 'tor', name: 'Toronto', lat: 43.6532, lon: -79.3832, status: 'secure', systems: 15 }
  ];

  // Connection paths between locations
  const connectionPaths = [
    { from: 'nyc', to: 'lon', active: true, bandwidth: 85 },
    { from: 'lon', to: 'fra', active: true, bandwidth: 92 },
    { from: 'fra', to: 'sin', active: true, bandwidth: 78 },
    { from: 'sin', to: 'tok', active: true, bandwidth: 88 },
    { from: 'tok', to: 'syd', active: false, bandwidth: 45 },
    { from: 'syd', to: 'sfo', active: true, bandwidth: 67 },
    { from: 'sfo', to: 'nyc', active: true, bandwidth: 95 },
    { from: 'nyc', to: 'tor', active: true, bandwidth: 99 }
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Animation loop
    let time = 0;
    const animate = () => {
      time += 0.01;
      
      // Clear canvas
      ctx.fillStyle = 'rgba(10, 10, 15, 0.95)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.offsetWidth / 2;
      const centerY = canvas.offsetHeight / 2;
      const radius = Math.min(centerX, centerY) * 0.8 * zoom;

      // Draw globe outline
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Draw latitude lines
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        const y = centerY + (lat / 90) * radius;
        const lineRadius = Math.cos((lat * Math.PI) / 180) * radius;
        
        ctx.ellipse(centerX, y, lineRadius, lineRadius * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw longitude lines
      for (let lon = 0; lon < 360; lon += 30) {
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        const angle = ((lon + rotation.y) * Math.PI) / 180;
        const x = centerX + Math.sin(angle) * radius;
        
        ctx.ellipse(x, centerY, Math.abs(Math.cos(angle)) * radius * 0.3, radius, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw connections
      connectionPaths.forEach(conn => {
        const fromLoc = globalLocations.find(l => l.id === conn.from);
        const toLoc = globalLocations.find(l => l.id === conn.to);
        
        if (fromLoc && toLoc) {
          // Convert lat/lon to 3D coordinates
          const from3D = latLonTo3D(fromLoc.lat, fromLoc.lon, radius, rotation);
          const to3D = latLonTo3D(toLoc.lat, toLoc.lon, radius, rotation);
          
          if (from3D.z > 0 && to3D.z > 0) {
            // Draw connection arc
            const gradient = ctx.createLinearGradient(
              centerX + from3D.x, centerY + from3D.y,
              centerX + to3D.x, centerY + to3D.y
            );
            
            if (conn.active) {
              gradient.addColorStop(0, 'rgba(0, 255, 255, 0.6)');
              gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.8)');
              gradient.addColorStop(1, 'rgba(255, 0, 255, 0.6)');
            } else {
              gradient.addColorStop(0, 'rgba(255, 0, 68, 0.3)');
              gradient.addColorStop(1, 'rgba(255, 136, 0, 0.3)');
            }
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = conn.active ? 2 : 1;
            ctx.setLineDash(conn.active ? [] : [5, 5]);
            ctx.beginPath();
            ctx.moveTo(centerX + from3D.x, centerY + from3D.y);
            
            // Create curved path
            const midX = (from3D.x + to3D.x) / 2;
            const midY = (from3D.y + to3D.y) / 2;
            const curveHeight = Math.sqrt(Math.pow(to3D.x - from3D.x, 2) + Math.pow(to3D.y - from3D.y, 2)) * 0.3;
            
            ctx.quadraticCurveTo(
              centerX + midX, centerY + midY - curveHeight,
              centerX + to3D.x, centerY + to3D.y
            );
            ctx.stroke();
            ctx.setLineDash([]);

            // Animate data packets
            if (conn.active) {
              const progress = (time * 50) % 100 / 100;
              const packetX = from3D.x + (to3D.x - from3D.x) * progress;
              const packetY = from3D.y + (to3D.y - from3D.y) * progress - 
                curveHeight * 4 * progress * (1 - progress);
              
              ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
              ctx.beginPath();
              ctx.arc(centerX + packetX, centerY + packetY, 3, 0, Math.PI * 2);
              ctx.fill();
              
              // Glow effect
              const glowGradient = ctx.createRadialGradient(
                centerX + packetX, centerY + packetY, 0,
                centerX + packetX, centerY + packetY, 10
              );
              glowGradient.addColorStop(0, 'rgba(0, 255, 255, 0.8)');
              glowGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
              ctx.fillStyle = glowGradient;
              ctx.fillRect(centerX + packetX - 10, centerY + packetY - 10, 20, 20);
            }
          }
        }
      });

      // Draw location nodes
      globalLocations.forEach(loc => {
        const coords = latLonTo3D(loc.lat, loc.lon, radius, rotation);
        
        if (coords.z > 0) { // Only draw if visible
          const x = centerX + coords.x;
          const y = centerY + coords.y;
          
          // Node glow
          const glowSize = loc.status === 'critical' ? 20 : 15;
          const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
          
          if (loc.status === 'critical') {
            glowGradient.addColorStop(0, 'rgba(255, 0, 68, 0.8)');
            glowGradient.addColorStop(1, 'rgba(255, 0, 68, 0)');
          } else if (loc.status === 'warning') {
            glowGradient.addColorStop(0, 'rgba(255, 136, 0, 0.8)');
            glowGradient.addColorStop(1, 'rgba(255, 136, 0, 0)');
          } else {
            glowGradient.addColorStop(0, 'rgba(0, 255, 136, 0.8)');
            glowGradient.addColorStop(1, 'rgba(0, 255, 136, 0)');
          }
          
          ctx.fillStyle = glowGradient;
          ctx.fillRect(x - glowSize, y - glowSize, glowSize * 2, glowSize * 2);
          
          // Node core
          ctx.fillStyle = loc.status === 'critical' ? '#ff0044' : 
                         loc.status === 'warning' ? '#ff8800' : '#00ff88';
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fill();
          
          // Pulse ring
          const pulseRadius = 8 + Math.sin(time * 4) * 3;
          ctx.strokeStyle = loc.status === 'critical' ? 'rgba(255, 0, 68, 0.5)' : 
                           loc.status === 'warning' ? 'rgba(255, 136, 0, 0.5)' : 
                           'rgba(0, 255, 136, 0.5)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
          ctx.stroke();
          
          // Label
          ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
          ctx.font = '10px monospace';
          ctx.fillText(loc.name, x + 10, y - 10);
          ctx.fillText(`${loc.systems} systems`, x + 10, y + 2);
        }
      });

      // Auto-rotate
      if (!isDragging) {
        setRotation(prev => ({
          x: prev.x,
          y: prev.y + 0.5,
          z: prev.z
        }));
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [rotation, zoom, isDragging]);

  // Convert lat/lon to 3D coordinates
  const latLonTo3D = (lat: number, lon: number, radius: number, rotation: { x: number, y: number, z: number }) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + rotation.y) * (Math.PI / 180);
    
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    
    // Apply X rotation
    const rotX = rotation.x * (Math.PI / 180);
    const y2 = y * Math.cos(rotX) - z * Math.sin(rotX);
    const z2 = y * Math.sin(rotX) + z * Math.cos(rotX);
    
    return { x, y: y2, z: z2 };
  };

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      setRotation(prev => ({
        x: Math.max(-90, Math.min(90, prev.x + deltaY * 0.5)),
        y: prev.y + deltaX * 0.5,
        z: prev.z
      }));
      
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(prev => Math.max(0.5, Math.min(2, prev + e.deltaY * -0.001)));
  };

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
      
      {/* Controls overlay */}
      <div className="absolute top-4 right-4 backdrop-blur-xl bg-black/60 rounded-lg p-3 border border-cyan-400/30">
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setZoom(prev => Math.min(2, prev + 0.1))}
            className="p-2 bg-cyan-400/10 hover:bg-cyan-400/20 rounded border border-cyan-400/30 transition-colors"
          >
            <Zap className="w-4 h-4 text-cyan-400" />
          </button>
          <button
            onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
            className="p-2 bg-cyan-400/10 hover:bg-cyan-400/20 rounded border border-cyan-400/30 transition-colors"
          >
            <Activity className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>
      
      {/* Stats overlay */}
      <div className="absolute bottom-4 left-4 backdrop-blur-xl bg-black/60 rounded-lg p-4 border border-purple-400/30">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs font-mono text-green-400">5 SECURE</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
            <span className="text-xs font-mono text-orange-400">2 WARNING</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
            <span className="text-xs font-mono text-red-400">1 CRITICAL</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobeVisualization;