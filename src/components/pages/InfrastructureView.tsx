import React, { useState, useEffect, useRef } from 'react';
import { Server, Cloud, Database, Network, Shield, AlertTriangle, TrendingDown, Activity, Cpu, HardDrive, Wifi, Lock, Layers, Globe, Zap, Box } from 'lucide-react';
import * as THREE from 'three';

const InfrastructureView: React.FC = () => {
  const [infrastructureData, setInfrastructureData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const layersRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/infrastructure_type');
        if (!response.ok) throw new Error('Failed to fetch infrastructure data');
        const data = await response.json();
        setInfrastructureData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // 3D Layered Infrastructure Visualization with real data
  useEffect(() => {
    if (!layersRef.current || !infrastructureData) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.001);

    const camera = new THREE.PerspectiveCamera(
      45,
      layersRef.current.clientWidth / layersRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(150, 100, 150);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(layersRef.current.clientWidth, layersRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    layersRef.current.appendChild(renderer.domElement);

    const platforms: THREE.Group[] = [];
    
    // Create layers based on real infrastructure data
    infrastructureData.detailed_data.slice(0, 5).forEach((infra: any, index: number) => {
      const platformGroup = new THREE.Group();
      
      const radius = 60 - index * 10;
      const height = 8 - index;
      
      // Create platform based on percentage
      const geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
      const material = new THREE.MeshPhongMaterial({
        color: infra.threat_level === 'CRITICAL' ? 0xff00ff : 
               infra.threat_level === 'HIGH' ? 0xc084fc : 
               infra.threat_level === 'MEDIUM' ? 0x00ffff : 
               0x00ff88,
        transparent: true,
        opacity: 0.7,
        emissive: infra.threat_level === 'CRITICAL' ? 0xff00ff : 0x00ffff,
        emissiveIntensity: 0.2,
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.y = index * 25;
      platformGroup.add(mesh);
      
      // Add nodes representing assets (scaled by frequency)
      const nodeCount = Math.min(20, Math.floor(infra.frequency / 1000));
      for (let i = 0; i < nodeCount; i++) {
        const angle = (i / nodeCount) * Math.PI * 2;
        const nodeRadius = radius * 0.7;
        const nodeGeometry = new THREE.BoxGeometry(4, 6, 4);
        const nodeMaterial = new THREE.MeshPhongMaterial({
          color: infra.percentage < 30 ? 0xff00ff : 0x00ffff,
          emissive: infra.percentage < 30 ? 0xff00ff : 0x00ffff,
          emissiveIntensity: 0.3
        });
        const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
        node.position.set(
          Math.cos(angle) * nodeRadius,
          index * 25 + height,
          Math.sin(angle) * nodeRadius
        );
        platformGroup.add(node);
      }
      
      scene.add(platformGroup);
      platforms.push(platformGroup);
    });

    // Add connecting lines between layers
    for (let i = 0; i < platforms.length - 1; i++) {
      const points = [
        new THREE.Vector3(0, i * 25, 0),
        new THREE.Vector3(0, (i + 1) * 25, 0)
      ];
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const lineMaterial = new THREE.LineBasicMaterial({ 
        color: 0x00ffff, 
        transparent: true, 
        opacity: 0.3 
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(100, 100, 50);
    scene.add(directionalLight);

    // Animation loop
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      platforms.forEach((platform, index) => {
        platform.rotation.y += 0.002 * (index + 1);
      });
      
      const time = Date.now() * 0.0005;
      camera.position.x = Math.cos(time) * 180;
      camera.position.z = Math.sin(time) * 180;
      camera.position.y = 100 + Math.sin(time * 2) * 30;
      camera.lookAt(0, 30, 0);
      
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      if (layersRef.current && renderer.domElement) {
        layersRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [infrastructureData]);

  // Network visualization with real data
  useEffect(() => {
    const canvas = networkRef.current;
    if (!canvas || !infrastructureData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const nodes = infrastructureData.detailed_data.slice(0, 6).map((infra: any, i: number) => ({
      x: canvas.width / 2 + Math.cos(i * Math.PI * 2 / 6) * 80,
      y: canvas.height / 2 + Math.sin(i * Math.PI * 2 / 6) * 80,
      type: infra.type,
      data: infra,
      pulsePhase: Math.random() * Math.PI * 2
    }));

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw connections
      nodes.forEach((node, i) => {
        nodes.forEach((target, j) => {
          if (i !== j) {
            const gradient = ctx.createLinearGradient(node.x, node.y, target.x, target.y);
            gradient.addColorStop(0, node.data.threat_level === 'CRITICAL' ? '#ff00ff20' : '#00ffff20');
            gradient.addColorStop(1, target.data.threat_level === 'CRITICAL' ? '#ff00ff20' : '#00ffff20');
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = Math.max(1, node.data.percentage / 50);
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(target.x, target.y);
            ctx.stroke();
          }
        });
      });

      // Draw nodes
      nodes.forEach(node => {
        node.pulsePhase += 0.05;
        const size = Math.sqrt(node.data.frequency) / 20 * (1 + Math.sin(node.pulsePhase) * 0.1);
        
        const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, size * 2);
        glow.addColorStop(0, node.data.threat_level === 'CRITICAL' ? '#ff00ff80' : '#00ffff80');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(node.x - size * 2, node.y - size * 2, size * 4, size * 4);
        
        ctx.fillStyle = node.data.threat_level === 'CRITICAL' ? '#ff00ff' : '#00ffff';
        ctx.beginPath();
        ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(node.type.substring(0, 15), node.x, node.y - size - 10);
        ctx.font = '9px monospace';
        ctx.fillText(`${node.data.percentage.toFixed(1)}%`, node.x, node.y + size + 15);
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, [infrastructureData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400"></div>
          <div className="mt-4 text-xl font-bold text-cyan-400">LOADING INFRASTRUCTURE DATA</div>
        </div>
      </div>
    );
  }

  if (error || !infrastructureData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center glass-panel rounded-xl p-8">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <div className="text-xl font-bold text-red-400 mb-2">DATA LOAD ERROR</div>
          <div className="text-sm text-gray-400">{error || 'No data available'}</div>
        </div>
      </div>
    );
  }

  const totalAssets = Object.values(infrastructureData.infrastructure_matrix).reduce((sum: number, count: any) => sum + count, 0);

  return (
    <div className="p-3 h-screen bg-black overflow-hidden flex flex-col">
      {/* Critical Alert for Low Modernization */}
      {infrastructureData.modernization_analysis.modernization_percentage < 50 && (
        <div className="mb-2 bg-black border border-purple-500/30 rounded-lg p-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-purple-400 animate-pulse" />
            <span className="text-purple-400 font-bold text-xs">MODERNIZATION ALERT:</span>
            <span className="text-white text-xs">
              Only {infrastructureData.modernization_analysis.modernization_percentage.toFixed(1)}% cloud adoption - {infrastructureData.modernization_analysis.legacy_systems.length} legacy systems detected
            </span>
          </div>
        </div>
      )}

      {/* Summary Stats from Real Data */}
      <div className="grid grid-cols-6 gap-2 mb-3">
        {infrastructureData.detailed_data.slice(0, 5).map((infra: any) => (
          <div key={infra.type} className="bg-black/50 rounded-lg border border-white/10 p-2 hover:border-blue-500/50 transition-all">
            <Server className="w-4 h-4 mb-1" style={{ 
              color: infra.threat_level === 'CRITICAL' ? '#ff00ff' : 
                     infra.threat_level === 'HIGH' ? '#c084fc' :
                     infra.threat_level === 'MEDIUM' ? '#00ffff' :
                     '#00ff88'
            }} />
            <div className="text-lg font-bold text-white">{infra.percentage.toFixed(1)}%</div>
            <div className="text-[10px] text-white/60 truncate">{infra.type}</div>
          </div>
        ))}
        <div className="bg-black/50 rounded-lg border border-purple-500/30 p-2">
          <AlertTriangle className="w-4 h-4 text-purple-400 mb-1" />
          <div className="text-lg font-bold text-purple-400">{infrastructureData.total_types}</div>
          <div className="text-[10px] text-white/60">Types</div>
        </div>
      </div>

      {/* Main Visualizations */}
      <div className="grid grid-cols-2 gap-3 mb-3 flex-1">
        {/* 3D Layered Infrastructure */}
        <div className="bg-black border border-blue-500/30 rounded-lg overflow-hidden">
          <div className="p-2 border-b border-blue-500/20">
            <h3 className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3 h-3" />
              Infrastructure Stack - {totalAssets.toLocaleString()} Assets
            </h3>
          </div>
          <div ref={layersRef} className="w-full h-[240px]" />
        </div>

        {/* Network Visualization */}
        <div className="bg-black border border-purple-500/30 rounded-lg overflow-hidden">
          <div className="p-2 border-b border-purple-500/20">
            <h3 className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
              <Network className="w-3 h-3" />
              Infrastructure Network
            </h3>
          </div>
          <canvas ref={networkRef} className="w-full h-[240px]" />
        </div>
      </div>

      {/* Infrastructure Grid from Real Data */}
      <div className="grid grid-cols-4 gap-2">
        {infrastructureData.detailed_data.slice(0, 8).map((infra: any) => (
          <div 
            key={infra.type} 
            className="bg-black/50 rounded-lg border p-2 cursor-pointer hover:bg-gray-900/30 transition-all"
            style={{
              borderColor: infra.threat_level === 'CRITICAL' ? 'rgba(255, 0, 255, 0.3)' : 
                          infra.threat_level === 'HIGH' ? 'rgba(168, 85, 247, 0.3)' : 
                          infra.threat_level === 'MEDIUM' ? 'rgba(0, 212, 255, 0.3)' :
                          'rgba(0, 255, 136, 0.3)'
            }}
            onClick={() => setSelectedType(infra.type)}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <Server className="w-4 h-4" style={{ 
                  color: infra.threat_level === 'CRITICAL' ? '#ff00ff' : 
                         infra.threat_level === 'HIGH' ? '#c084fc' :
                         infra.threat_level === 'MEDIUM' ? '#00ffff' :
                         '#00ff88'
                }} />
                <div>
                  <h3 className="text-sm font-bold text-white truncate">{infra.type}</h3>
                  <p className="text-[9px] text-white/60">{infra.frequency.toLocaleString()} assets</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold" style={{
                  color: infra.threat_level === 'CRITICAL' ? '#ff00ff' : 
                         infra.threat_level === 'HIGH' ? '#c084fc' :
                         infra.threat_level === 'MEDIUM' ? '#00ffff' :
                         '#00ff88'
                }}>
                  {infra.percentage.toFixed(1)}%
                </div>
                <div className="text-[8px] text-white/60">{infra.threat_level}</div>
              </div>
            </div>

            {/* Coverage Bar */}
            <div className="mb-2">
              <div className="h-1.5 bg-black/50 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${infra.percentage}%`,
                    background: infra.threat_level === 'CRITICAL' ? 
                      'linear-gradient(90deg, #ff00ff, #ff00ffdd)' :
                      infra.threat_level === 'HIGH' ?
                      'linear-gradient(90deg, #c084fc, #c084fcdd)' :
                      infra.threat_level === 'MEDIUM' ?
                      'linear-gradient(90deg, #00ffff, #00ffffdd)' :
                      'linear-gradient(90deg, #00ff88, #00ff88dd)'
                  }}
                />
              </div>
            </div>

            {/* Percentage of total */}
            <div className="text-[8px] text-gray-400">
              {((infra.frequency / totalAssets) * 100).toFixed(2)}% of total infrastructure
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InfrastructureView;