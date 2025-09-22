import React, { useState, useEffect, useRef } from 'react';
import { Server, Cloud, Database, Network, Eye, AlertTriangle, Activity, Layers, HardDrive, Wifi, Globe, Shield, Cpu, Monitor, Router, Zap, Binary, Lock, Target } from 'lucide-react';
import * as THREE from 'three';

const InfrastructureView: React.FC = () => {
  const [infrastructureData, setInfrastructureData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [hoveredInfra, setHoveredInfra] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotationSpeed, setRotationSpeed] = useState(0.001);
  const stackRef = useRef<HTMLDivElement>(null);
  const matrixRef = useRef<HTMLCanvasElement>(null);
  const radarRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/infrastructure_visibility');
        if (!response.ok) throw new Error('Failed to fetch infrastructure data');
        const data = await response.json();
        setInfrastructureData(data);
      } catch (error) {
        console.error('Error:', error);
        // Fallback data
        setInfrastructureData({
          overall_infrastructure_visibility: 0,
          category_summary: {},
          detailed_breakdown: [],
          critical_gaps: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // 3D Infrastructure Stack Visualization
  useEffect(() => {
    if (!stackRef.current || !infrastructureData || loading) return;

    // Clean up previous scene
    if (rendererRef.current) {
      rendererRef.current.dispose();
      if (stackRef.current.contains(rendererRef.current.domElement)) {
        stackRef.current.removeChild(rendererRef.current.domElement);
      }
    }

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x000000, 0.0008);
    
    const camera = new THREE.PerspectiveCamera(
      60, 
      stackRef.current.clientWidth / stackRef.current.clientHeight, 
      0.1, 
      2000
    );
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    rendererRef.current = renderer;
    
    renderer.setSize(stackRef.current.clientWidth, stackRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    stackRef.current.appendChild(renderer.domElement);

    const layers: THREE.Group[] = [];
    const infrastructureTypes = infrastructureData.detailed_breakdown || [];
    const maxHosts = Math.max(...infrastructureTypes.map((t: any) => t.total_hosts), 1);
    
    // Create infrastructure layers
    infrastructureTypes.forEach((infra: any, index: number) => {
      const layerGroup = new THREE.Group();
      
      const width = Math.max(50, 150 * (infra.total_hosts / maxHosts));
      const height = 20;
      const depth = 100;
      
      // Main platform
      const geometry = new THREE.BoxGeometry(width, height, depth);
      const material = new THREE.MeshPhongMaterial({
        color: infra.status === 'CRITICAL' ? 0xff00ff : 
               infra.status === 'WARNING' ? 0xc084fc : 0x00d4ff,
        transparent: true,
        opacity: 0.3,
        emissive: infra.status === 'CRITICAL' ? 0xff00ff : 0x00d4ff,
        emissiveIntensity: 0.1
      });
      
      const platform = new THREE.Mesh(geometry, material);
      platform.position.y = index * 40 - 100;
      platform.userData = infra;
      layerGroup.add(platform);
      
      // Visibility layer
      const visibleWidth = width * (infra.visibility_percentage / 100);
      const visGeometry = new THREE.BoxGeometry(visibleWidth, height - 4, depth - 10);
      const visMaterial = new THREE.MeshPhongMaterial({
        color: 0x00d4ff,
        emissive: 0x00d4ff,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.8
      });
      
      const visLayer = new THREE.Mesh(visGeometry, visMaterial);
      visLayer.position.y = platform.position.y;
      visLayer.position.x = -(width - visibleWidth) / 2;
      layerGroup.add(visLayer);
      
      layers.push(layerGroup);
      scene.add(layerGroup);
    });

    // Add particles for atmosphere
    const particleCount = 500;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 500;
      positions[i + 1] = (Math.random() - 0.5) * 400;
      positions[i + 2] = (Math.random() - 0.5) * 500;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
      size: 1.5,
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.6
    });
    
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    
    const light1 = new THREE.PointLight(0x00d4ff, 2, 500);
    light1.position.set(200, 150, 150);
    scene.add(light1);
    
    const light2 = new THREE.PointLight(0xff00ff, 1.5, 500);
    light2.position.set(-200, -100, 150);
    scene.add(light2);

    camera.position.set(0, 0, 350);
    camera.lookAt(0, 0, 0);

    // Animation
    const animate = () => {
      if (!sceneRef.current) return;
      frameRef.current = requestAnimationFrame(animate);
      
      layers.forEach((layer, index) => {
        layer.rotation.y += rotationSpeed * (index + 1);
        layer.position.x = Math.sin(Date.now() * 0.0003 + index) * 10;
      });
      
      particles.rotation.y += 0.0005;
      
      const time = Date.now() * 0.0002;
      camera.position.x = Math.sin(time) * 300 * zoomLevel;
      camera.position.z = Math.cos(time) * 300 * zoomLevel;
      camera.position.y = 50 + Math.sin(time * 2) * 30;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
    };
    
    animate();

    // Handle resize
    const handleResize = () => {
      if (!stackRef.current || !camera || !renderer) return;
      camera.aspect = stackRef.current.clientWidth / stackRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(stackRef.current.clientWidth, stackRef.current.clientHeight);
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (stackRef.current && stackRef.current.contains(rendererRef.current.domElement)) {
          stackRef.current.removeChild(rendererRef.current.domElement);
        }
      }
    };
  }, [infrastructureData, zoomLevel, rotationSpeed, loading]);

  // Matrix visualization
  useEffect(() => {
    const canvas = matrixRef.current;
    if (!canvas || !infrastructureData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const infrastructureTypes = infrastructureData.detailed_breakdown || [];
      const cellSize = 30;
      const cols = Math.floor(canvas.width / cellSize);
      const rows = Math.min(infrastructureTypes.length, 8);

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * cellSize;
          const y = row * cellSize;
          
          const infra = infrastructureTypes[row];
          if (!infra) continue;
          
          const visibility = Math.random() * infra.visibility_percentage;
          const intensity = visibility / 100;
          
          ctx.fillStyle = `rgba(${visibility < 30 ? '255, 0, 255' : '0, 212, 255'}, ${intensity * 0.4})`;
          ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
          
          ctx.strokeStyle = 'rgba(0, 212, 255, 0.2)';
          ctx.strokeRect(x, y, cellSize, cellSize);
        }
      }

      requestAnimationFrame(animate);
    };

    animate();
  }, [infrastructureData]);

  // Radar visualization
  useEffect(() => {
    const canvas = radarRef.current;
    if (!canvas || !infrastructureData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 40;

    let sweepAngle = 0;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw radar circles
      for (let i = 1; i <= 4; i++) {
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, (radius / 4) * i, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw categories
      const categories = infrastructureData.category_summary || {};
      const categoryCount = Object.keys(categories).length;
      
      if (categoryCount > 0) {
        Object.entries(categories).forEach(([category, data]: [string, any], index) => {
          const startAngle = (index / categoryCount) * Math.PI * 2;
          const endAngle = ((index + 1) / categoryCount) * Math.PI * 2;
          const dataRadius = (data.visibility_percentage / 100) * radius;
          
          ctx.fillStyle = data.status === 'CRITICAL' ? 'rgba(255, 0, 255, 0.3)' :
                         data.status === 'WARNING' ? 'rgba(192, 132, 252, 0.3)' :
                         'rgba(0, 212, 255, 0.3)';
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.arc(centerX, centerY, dataRadius, startAngle, endAngle);
          ctx.closePath();
          ctx.fill();
        });
      }

      // Sweep line
      sweepAngle += 0.02;
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(sweepAngle) * radius,
        centerY + Math.sin(sweepAngle) * radius
      );
      ctx.stroke();

      requestAnimationFrame(animate);
    };

    animate();
  }, [infrastructureData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-center">
          <div className="relative">
            <div className="w-32 h-32 border-4 border-t-transparent border-r-transparent border-b-[#00d4ff] border-l-[#ff00ff] rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Server className="w-12 h-12 text-[#c084fc]" />
            </div>
          </div>
          <div className="mt-4 text-lg font-bold text-[#00d4ff] animate-pulse">ANALYZING INFRASTRUCTURE</div>
        </div>
      </div>
    );
  }

  const getIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('cloud')) return Cloud;
    if (lower.includes('container') || lower.includes('docker') || lower.includes('kubernetes')) return Layers;
    if (lower.includes('virtual') || lower.includes('vmware')) return Server;
    if (lower.includes('physical')) return HardDrive;
    if (lower.includes('network')) return Network;
    return Database;
  };

  return (
    <div className="h-full flex flex-col p-6 bg-black overflow-hidden">
      {infrastructureData?.overall_infrastructure_visibility < 30 && (
        <div className="mb-4 bg-black border border-[#ff00ff] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-[#ff00ff] animate-pulse" />
            <span className="text-[#ff00ff] font-bold">CRITICAL:</span>
            <span className="text-white">
              Infrastructure visibility at {infrastructureData?.overall_infrastructure_visibility?.toFixed(1) || '0.0'}%
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 grid grid-cols-12 gap-4">
        <div className="col-span-7">
          <div className="h-full bg-black border border-[#00d4ff]/30 rounded-xl">
            <div className="p-4 border-b border-[#00d4ff]/20">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#00d4ff]">INFRASTRUCTURE STACK</h2>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.5))}
                    className="p-2 bg-black border border-[#00d4ff]/30 rounded hover:border-[#00d4ff] transition-colors"
                  >
                    <Zap className="w-4 h-4 text-[#00d4ff]" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(1)}
                    className="p-2 bg-black border border-[#c084fc]/30 rounded hover:border-[#c084fc] transition-colors"
                  >
                    <Target className="w-4 h-4 text-[#c084fc]" />
                  </button>
                  <button
                    onClick={() => setRotationSpeed(prev => prev === 0 ? 0.001 : 0)}
                    className="p-2 bg-black border border-[#ff00ff]/30 rounded hover:border-[#ff00ff] transition-colors"
                  >
                    <Lock className="w-4 h-4 text-[#ff00ff]" />
                  </button>
                </div>
              </div>
              {hoveredInfra && (
                <div className="mt-2 text-sm text-[#c084fc]">
                  Hovering: {hoveredInfra}
                </div>
              )}
            </div>
            
            <div ref={stackRef} className="w-full" style={{ height: 'calc(100% - 80px)', cursor: 'move' }} />
          </div>
        </div>

        <div className="col-span-5 space-y-4 overflow-y-auto">
          <div className="bg-black border border-[#c084fc]/30 rounded-xl p-3">
            <h3 className="text-sm font-bold text-[#c084fc] mb-2">LOG TYPE MATRIX</h3>
            <canvas ref={matrixRef} className="w-full h-40" />
          </div>

          <div className="bg-black border border-[#00d4ff]/30 rounded-xl p-3">
            <h3 className="text-sm font-bold text-[#00d4ff] mb-2">COVERAGE RADAR</h3>
            <canvas ref={radarRef} className="w-full h-48" />
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(infrastructureData?.detailed_breakdown || []).map((infra: any) => {
              const Icon = getIcon(infra.infrastructure_type);
              
              return (
                <div
                  key={infra.infrastructure_type}
                  className={`bg-black border rounded-lg p-3 cursor-pointer transition-all hover:scale-[1.02] ${
                    selectedType === infra.infrastructure_type 
                      ? 'border-[#00d4ff]' 
                      : 'border-white/10 hover:border-[#c084fc]/50'
                  }`}
                  onClick={() => setSelectedType(infra.infrastructure_type)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-[#00d4ff]" />
                      <div>
                        <div className="text-sm font-bold text-white">{infra.infrastructure_type}</div>
                        <div className="text-xs text-white/60">
                          {infra.total_hosts?.toLocaleString() || 0} hosts
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${
                        infra.status === 'CRITICAL' ? 'text-[#ff00ff]' :
                        infra.status === 'WARNING' ? 'text-[#c084fc]' :
                        'text-[#00d4ff]'
                      }`}>
                        {infra.visibility_percentage?.toFixed(1) || '0.0'}%
                      </div>
                      <div className="text-xs text-white/60">visibility</div>
                    </div>
                  </div>
                  
                  <div className="mt-2 h-3 bg-black border border-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-1000"
                      style={{
                        width: `${infra.visibility_percentage || 0}%`,
                        background: infra.status === 'CRITICAL' 
                          ? 'linear-gradient(90deg, #ff00ff, #c084fc)'
                          : 'linear-gradient(90deg, #00d4ff, #c084fc)'
                      }}
                    />
                  </div>
                  
                  <div className="mt-2 flex justify-between items-center">
                    <div className="flex gap-2">
                      <Eye className={`w-3 h-3 ${
                        infra.visibility_percentage > 60 ? 'text-[#00d4ff]' : 'text-white/30'
                      }`} />
                      <span className="text-xs text-[#00d4ff]">
                        {infra.visible_hosts?.toLocaleString() || 0} visible
                      </span>
                    </div>
                    <span className={`text-xs font-bold ${
                      infra.status === 'CRITICAL' ? 'text-[#ff00ff]' :
                      infra.status === 'WARNING' ? 'text-[#c084fc]' :
                      'text-[#00d4ff]'
                    }`}>
                      {infra.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfrastructureView;