import React, { useState, useEffect, useRef } from 'react';
import { Server, Cloud, Database, Network, Eye, AlertTriangle, Activity, Layers, HardDrive, Wifi, Globe, Shield } from 'lucide-react';
import * as THREE from 'three';

const InfrastructureView: React.FC = () => {
  const [infrastructureData, setInfrastructureData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [hoveredInfra, setHoveredInfra] = useState<string | null>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const matrixRef = useRef<HTMLCanvasElement>(null);
  const radarRef = useRef<HTMLCanvasElement>(null);

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
    if (!stackRef.current || !infrastructureData) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, stackRef.current.clientWidth / stackRef.current.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(stackRef.current.clientWidth, stackRef.current.clientHeight);
    stackRef.current.appendChild(renderer.domElement);

    const layers: THREE.Group[] = [];
    
    // Create infrastructure layers
    const infrastructureTypes = infrastructureData.detailed_breakdown || [];
    const maxHosts = Math.max(...infrastructureTypes.map((t: any) => t.total_hosts));
    
    infrastructureTypes.forEach((infra: any, index: number) => {
      const layerGroup = new THREE.Group();
      
      // Main platform
      const width = 120 * (infra.total_hosts / maxHosts);
      const height = 15;
      const depth = 80;
      
      const geometry = new THREE.BoxGeometry(width, height, depth);
      const material = new THREE.MeshPhongMaterial({
        color: infra.status === 'CRITICAL' ? 0xa855f7 : 
               infra.status === 'WARNING' ? 0xffaa00 : 0x00d4ff,
        transparent: true,
        opacity: 0.7,
        emissive: infra.status === 'CRITICAL' ? 0xa855f7 : 0x00d4ff,
        emissiveIntensity: 0.1
      });
      
      const platform = new THREE.Mesh(geometry, material);
      platform.position.y = index * 35 - 50;
      layerGroup.add(platform);
      
      // Visibility indicator
      const visibleWidth = width * (infra.visibility_percentage / 100);
      const visGeometry = new THREE.BoxGeometry(visibleWidth, height - 2, depth - 5);
      const visMaterial = new THREE.MeshPhongMaterial({
        color: 0x00d4ff,
        emissive: 0x00d4ff,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.9
      });
      
      const visLayer = new THREE.Mesh(visGeometry, visMaterial);
      visLayer.position.y = platform.position.y;
      visLayer.position.x = -(width - visibleWidth) / 2;
      layerGroup.add(visLayer);
      
      // Add edge glow for critical systems
      if (infra.status === 'CRITICAL') {
        const glowGeometry = new THREE.BoxGeometry(width + 5, height + 5, depth + 5);
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: 0xa855f7,
          transparent: true,
          opacity: 0.2,
          wireframe: true
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.y = platform.position.y;
        layerGroup.add(glow);
      }
      
      layerGroup.userData = infra;
      layers.push(layerGroup);
      scene.add(layerGroup);
    });

    // Add floating particles for data flow
    const particleCount = 1000;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 300;
      positions[i + 1] = (Math.random() - 0.5) * 200;
      positions[i + 2] = (Math.random() - 0.5) * 200;
      
      const isVisible = Math.random() > 0.5;
      colors[i] = isVisible ? 0 : 0.66;
      colors[i + 1] = isVisible ? 1 : 0.33;
      colors[i + 2] = isVisible ? 1 : 0.97;
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    const particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);

    // Lighting
    const light1 = new THREE.PointLight(0x00d4ff, 1, 300);
    light1.position.set(150, 100, 100);
    scene.add(light1);
    
    const light2 = new THREE.PointLight(0xa855f7, 1, 300);
    light2.position.set(-150, -100, 100);
    scene.add(light2);
    
    scene.add(new THREE.AmbientLight(0x404040));

    camera.position.set(0, 0, 250);
    camera.lookAt(0, 0, 0);

    // Mouse interaction
    const handleMouseMove = (event: MouseEvent) => {
      const rect = stackRef.current!.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      camera.position.x = x * 50;
      camera.position.y = y * 50;
    };
    
    stackRef.current.addEventListener('mousemove', handleMouseMove);

    // Animation
    const animate = () => {
      layers.forEach((layer, index) => {
        layer.rotation.y = Math.sin(Date.now() * 0.001 + index) * 0.05;
        layer.position.x = Math.sin(Date.now() * 0.0005 + index) * 5;
      });
      
      particleSystem.rotation.y += 0.001;
      
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    
    animate();

    return () => {
      if (stackRef.current) {
        stackRef.current.removeEventListener('mousemove', handleMouseMove);
        if (renderer.domElement) {
          stackRef.current.removeChild(renderer.domElement);
        }
      }
      renderer.dispose();
    };
  }, [infrastructureData]);

  // Log Type Matrix Visualization
  useEffect(() => {
    const canvas = matrixRef.current;
    if (!canvas || !infrastructureData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const logTypes = ['System', 'Application', 'Security', 'Network', 'Cloud'];
    const colors = ['#00d4ff', '#00d4ff', '#a855f7', '#a855f7', '#00d4ff'];

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const infrastructureTypes = infrastructureData.detailed_breakdown || [];
      const cellWidth = canvas.width / logTypes.length;
      const cellHeight = canvas.height / infrastructureTypes.length;

      // Draw matrix grid
      infrastructureTypes.forEach((infra: any, row: number) => {
        logTypes.forEach((logType, col: number) => {
          const x = col * cellWidth;
          const y = row * cellHeight;
          
          // Simulate visibility percentage for each log type
          const visibility = Math.random() * infra.visibility_percentage;
          const intensity = visibility / 100;
          
          // Cell background
          ctx.fillStyle = `rgba(${visibility < 30 ? '168, 85, 247' : '0, 212, 255'}, ${intensity * 0.3})`;
          ctx.fillRect(x + 2, y + 2, cellWidth - 4, cellHeight - 4);
          
          // Cell border
          ctx.strokeStyle = colors[col] + '40';
          ctx.strokeRect(x, y, cellWidth, cellHeight);
          
          // Visibility percentage text
          ctx.fillStyle = colors[col];
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${visibility.toFixed(0)}%`, x + cellWidth / 2, y + cellHeight / 2);
        });
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, [infrastructureData, selectedType]);

  // Radar Chart for Infrastructure Coverage
  useEffect(() => {
    const canvas = radarRef.current;
    if (!canvas || !infrastructureData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 30;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw radar circles
      for (let i = 1; i <= 4; i++) {
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, (radius / 4) * i, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw axes
      const categories = infrastructureData.category_summary ? Object.keys(infrastructureData.category_summary) : [];
      const angleStep = (Math.PI * 2) / categories.length;

      categories.forEach((category, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();

        // Category labels
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        const labelX = centerX + Math.cos(angle) * (radius + 20);
        const labelY = centerY + Math.sin(angle) * (radius + 20);
        ctx.fillText(category.toUpperCase(), labelX, labelY);
      });

      // Draw coverage polygon
      ctx.beginPath();
      categories.forEach((category, index) => {
        const data = infrastructureData.category_summary[category];
        const angle = index * angleStep - Math.PI / 2;
        const distance = (data.visibility_percentage / 100) * radius;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;

        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();

      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      gradient.addColorStop(0, 'rgba(0, 212, 255, 0.3)');
      gradient.addColorStop(1, 'rgba(168, 85, 247, 0.1)');
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = 2;
      ctx.stroke();

      requestAnimationFrame(animate);
    };

    animate();
  }, [infrastructureData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
          <div className="mt-4 text-lg font-bold text-cyan-400">ANALYZING INFRASTRUCTURE VISIBILITY</div>
        </div>
      </div>
    );
  }

  if (!infrastructureData) return null;

  const getIcon = (name: string) => {
    if (name.toLowerCase().includes('cloud')) return Cloud;
    if (name.toLowerCase().includes('container')) return Layers;
    if (name.toLowerCase().includes('virtual')) return Server;
    return Database;
  };

  return (
    <div className="h-full flex flex-col p-4">
      {/* Alert if critical visibility */}
      {infrastructureData.overall_infrastructure_visibility < 30 && (
        <div className="mb-3 bg-black border border-purple-500/50 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-purple-400 animate-pulse" />
            <span className="text-purple-400 font-bold text-sm">CRITICAL:</span>
            <span className="text-white text-sm">
              Infrastructure visibility at {infrastructureData.overall_infrastructure_visibility.toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 grid grid-cols-12 gap-4">
        {/* 3D Infrastructure Stack */}
        <div className="col-span-7">
          <div className="h-full glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-cyan-400">INFRASTRUCTURE VISIBILITY LAYERS</h2>
              <div className="text-xs text-gray-400">Move mouse to explore</div>
            </div>
            <div ref={stackRef} className="w-full" style={{ height: 'calc(100% - 40px)' }} />
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-5 space-y-3">
          {/* Log Type Matrix */}
          <div className="glass-panel rounded-xl p-3">
            <h3 className="text-sm font-bold text-purple-400 mb-2">LOG TYPE VISIBILITY MATRIX</h3>
            <canvas ref={matrixRef} className="w-full h-32" />
          </div>

          {/* Radar Chart */}
          <div className="glass-panel rounded-xl p-3">
            <h3 className="text-sm font-bold text-cyan-400 mb-2">CATEGORY COVERAGE RADAR</h3>
            <canvas ref={radarRef} className="w-full h-48" />
          </div>

          {/* Infrastructure Cards */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(infrastructureData.detailed_breakdown || []).map((infra: any) => {
              const Icon = getIcon(infra.infrastructure_type);
              
              return (
                <div
                  key={infra.infrastructure_type}
                  className={`glass-panel rounded-lg p-3 cursor-pointer transition-all hover:scale-102 ${
                    selectedType === infra.infrastructure_type ? 'border-cyan-400' : ''
                  }`}
                  onClick={() => setSelectedType(infra.infrastructure_type)}
                  onMouseEnter={() => setHoveredInfra(infra.infrastructure_type)}
                  onMouseLeave={() => setHoveredInfra(null)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-cyan-400" />
                      <div>
                        <div className="text-sm font-bold text-white">{infra.infrastructure_type}</div>
                        <div className="text-xs text-gray-400">
                          {infra.total_hosts.toLocaleString()} hosts
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${
                        infra.status === 'CRITICAL' ? 'text-purple-400' :
                        infra.status === 'WARNING' ? 'text-yellow-400' :
                        'text-cyan-400'
                      }`}>
                        {infra.visibility_percentage.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-400">visibility</div>
                    </div>
                  </div>
                  
                  {/* Visibility Bar */}
                  <div className="mt-2 h-3 bg-black/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-1000"
                      style={{
                        width: `${infra.visibility_percentage}%`,
                        background: infra.status === 'CRITICAL' 
                          ? 'linear-gradient(90deg, #a855f7, #ff00ff)'
                          : 'linear-gradient(90deg, #00d4ff, #00d4ff)'
                      }}
                    />
                  </div>
                  
                  <div className="mt-2 flex justify-between items-center">
                    <div className="flex gap-2">
                      <Eye className={`w-3 h-3 ${
                        infra.visibility_percentage > 60 ? 'text-cyan-400' : 'text-gray-600'
                      }`} />
                      <span className="text-xs text-cyan-400">
                        {infra.visible_hosts.toLocaleString()} visible
                      </span>
                    </div>
                    <span className={`text-xs font-bold ${
                      infra.status === 'CRITICAL' ? 'text-purple-400' :
                      infra.status === 'WARNING' ? 'text-yellow-400' :
                      'text-cyan-400'
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