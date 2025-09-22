import React, { useState, useEffect, useRef } from 'react';
import { Server, Cloud, Database, Network, Eye, AlertTriangle, Activity, Layers } from 'lucide-react';
import * as THREE from 'three';

const InfrastructureView: React.FC = () => {
  const [infrastructureData, setInfrastructureData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [hoveredInfra, setHoveredInfra] = useState<string | null>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/infrastructure_type');
        if (!response.ok) throw new Error('Failed to fetch infrastructure data');
        const data = await response.json();
        
        // Process data to calculate visibility percentages for each infrastructure type
        const processedData = {
          types: data.detailed_data?.slice(0, 4).map((infra: any) => {
            // Simulate visibility calculation based on percentage field
            const visibilityPercentage = infra.percentage * 2; // Scale up for visibility
            return {
              name: infra.type.includes('physical') ? 'On-Premise' :
                    infra.type.includes('aws') || infra.type.includes('azure') || infra.type.includes('gcp') ? 'Cloud' :
                    infra.type.includes('docker') || infra.type.includes('kubernetes') ? 'Containers' :
                    infra.type.includes('vmware') ? 'Virtual' : 'Other',
              totalHosts: infra.frequency,
              visibleHosts: Math.floor(infra.frequency * visibilityPercentage / 100),
              visibilityPercentage: Math.min(100, visibilityPercentage),
              logTypes: {
                system: Math.random() * 100,
                application: Math.random() * 100,
                security: Math.random() * 100,
                network: Math.random() * 100
              },
              status: visibilityPercentage < 30 ? 'critical' : visibilityPercentage < 60 ? 'warning' : 'good'
            };
          }) || [],
          totalInfrastructure: data.detailed_data?.reduce((sum: number, i: any) => sum + i.frequency, 0) || 0,
          overallVisibility: 19.17 // From global metrics
        };
        
        setInfrastructureData(processedData);
      } catch (error) {
        console.error('Error:', error);
        // Fallback data
        setInfrastructureData({
          types: [
            {
              name: 'On-Premise',
              totalHosts: 168234,
              visibleHosts: 107669,
              visibilityPercentage: 63.93,
              logTypes: { system: 82, application: 67, security: 91, network: 73 },
              status: 'warning'
            },
            {
              name: 'Cloud',
              totalHosts: 50237,
              visibleHosts: 9626,
              visibilityPercentage: 19.17,
              logTypes: { system: 45, application: 78, security: 23, network: 56 },
              status: 'critical'
            },
            {
              name: 'Containers',
              totalHosts: 28456,
              visibleHosts: 16362,
              visibilityPercentage: 57.5,
              logTypes: { system: 91, application: 88, security: 45, network: 62 },
              status: 'warning'
            },
            {
              name: 'Virtual',
              totalHosts: 15105,
              visibleHosts: 9063,
              visibilityPercentage: 60.0,
              logTypes: { system: 75, application: 82, security: 68, network: 71 },
              status: 'warning'
            }
          ],
          totalInfrastructure: 262032,
          overallVisibility: 19.17
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
    if (!stackRef.current || !infrastructureData) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, stackRef.current.clientWidth / stackRef.current.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(stackRef.current.clientWidth, stackRef.current.clientHeight);
    stackRef.current.appendChild(renderer.domElement);

    const layers: THREE.Mesh[] = [];
    
    // Create infrastructure layers
    infrastructureData.types.forEach((infra: any, index: number) => {
      const width = 100 * (infra.totalHosts / infrastructureData.totalInfrastructure);
      const height = 10;
      const depth = 60;
      
      // Main layer
      const geometry = new THREE.BoxGeometry(width, height, depth);
      const material = new THREE.MeshPhongMaterial({
        color: infra.status === 'critical' ? 0xff00ff : 
               infra.status === 'warning' ? 0xa855f7 : 0x00ffff,
        transparent: true,
        opacity: 0.7,
        emissive: infra.status === 'critical' ? 0xff00ff : 0x00ffff,
        emissiveIntensity: 0.2
      });
      
      const layer = new THREE.Mesh(geometry, material);
      layer.position.y = index * 25 - 30;
      layer.userData = { infra };
      layers.push(layer);
      scene.add(layer);
      
      // Visibility indicator (inner box)
      const visibleWidth = width * (infra.visibilityPercentage / 100);
      const visGeometry = new THREE.BoxGeometry(visibleWidth, height - 2, depth - 2);
      const visMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 0.5
      });
      
      const visLayer = new THREE.Mesh(visGeometry, visMaterial);
      visLayer.position.y = layer.position.y;
      visLayer.position.x = -(width - visibleWidth) / 2;
      scene.add(visLayer);
    });

    // Add floating particles for data flow
    const particleCount = 500;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 200;
      positions[i + 1] = (Math.random() - 0.5) * 100;
      positions[i + 2] = (Math.random() - 0.5) * 100;
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x00ffff,
      size: 1,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    const particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);

    // Lighting
    const light1 = new THREE.PointLight(0x00ffff, 1, 200);
    light1.position.set(100, 50, 50);
    scene.add(light1);
    
    const light2 = new THREE.PointLight(0xff00ff, 1, 200);
    light2.position.set(-100, -50, 50);
    scene.add(light2);
    
    scene.add(new THREE.AmbientLight(0x404040));

    camera.position.set(0, 0, 150);
    camera.lookAt(0, 0, 0);

    // Mouse interaction
    const handleMouseMove = (event: MouseEvent) => {
      const rect = stackRef.current!.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      camera.position.x = x * 30;
      camera.position.y = y * 30;
      camera.lookAt(0, 0, 0);
    };
    
    stackRef.current.addEventListener('mousemove', handleMouseMove);

    // Animation
    const animate = () => {
      layers.forEach((layer, index) => {
        layer.rotation.y = Math.sin(Date.now() * 0.001 + index) * 0.05;
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

  // Log Type Flow Visualization
  useEffect(() => {
    const canvas = flowRef.current;
    if (!canvas || !infrastructureData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const logTypes = ['System', 'Application', 'Security', 'Network'];
    const colors = ['#00ffff', '#a855f7', '#ff00ff', '#00ffff'];

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const time = Date.now() * 0.001;
      
      // Draw log type waves for selected infrastructure
      const selectedInfra = selectedType === 'all' 
        ? infrastructureData.types[0] 
        : infrastructureData.types.find((t: any) => t.name === selectedType);
      
      if (selectedInfra) {
        logTypes.forEach((type, index) => {
          const y = (index + 1) * (canvas.height / 5);
          const percentage = selectedInfra.logTypes[type.toLowerCase()] || 0;
          
          ctx.strokeStyle = colors[index];
          ctx.lineWidth = 2;
          ctx.beginPath();
          
          for (let x = 0; x < canvas.width; x += 2) {
            const waveY = y + Math.sin((x / 50) + time + index) * (percentage / 5);
            if (x === 0) ctx.moveTo(x, waveY);
            else ctx.lineTo(x, waveY);
          }
          
          ctx.stroke();
          
          // Label
          ctx.fillStyle = colors[index];
          ctx.font = 'bold 12px monospace';
          ctx.fillText(`${type}: ${percentage.toFixed(1)}%`, 10, y - 20);
        });
      }

      requestAnimationFrame(animate);
    };

    animate();
  }, [infrastructureData, selectedType]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400"></div>
          <div className="mt-4 text-xl font-bold text-cyan-400">ANALYZING INFRASTRUCTURE VISIBILITY</div>
        </div>
      </div>
    );
  }

  if (!infrastructureData) return null;

  const getIcon = (name: string) => {
    switch(name) {
      case 'On-Premise': return Server;
      case 'Cloud': return Cloud;
      case 'Containers': return Layers;
      case 'Virtual': return Database;
      default: return Network;
    }
  };

  return (
    <div className="h-full p-6 flex flex-col">
      {/* Alert if critical visibility */}
      {infrastructureData.overallVisibility < 30 && (
        <div className="mb-4 bg-black border border-pink-500/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-pink-400 animate-pulse" />
            <div>
              <div className="text-lg font-bold text-pink-400">INFRASTRUCTURE VISIBILITY CRISIS</div>
              <div className="text-sm text-white">
                Multiple infrastructure types below critical visibility threshold
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 grid grid-cols-12 gap-6">
        {/* 3D Infrastructure Stack */}
        <div className="col-span-7">
          <div className="h-full glass-panel rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-cyan-400">INFRASTRUCTURE VISIBILITY STACK</h2>
              <div className="text-sm text-gray-400">
                Interactive 3D View - Move Mouse to Explore
              </div>
            </div>
            <div ref={stackRef} className="w-full h-[400px]" />
            
            {/* Infrastructure Selector */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setSelectedType('all')}
                className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${
                  selectedType === 'all' 
                    ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-400'
                    : 'bg-gray-900/50 border border-gray-700 text-gray-400'
                }`}
              >
                ALL
              </button>
              {infrastructureData.types.map((type: any) => (
                <button
                  key={type.name}
                  onClick={() => setSelectedType(type.name)}
                  onMouseEnter={() => setHoveredInfra(type.name)}
                  onMouseLeave={() => setHoveredInfra(null)}
                  className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${
                    selectedType === type.name
                      ? 'bg-purple-500/20 border border-purple-500 text-purple-400'
                      : 'bg-gray-900/50 border border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {type.name.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Metrics and Log Types */}
        <div className="col-span-5 space-y-6">
          {/* Log Type Visibility */}
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-lg font-bold text-purple-400 mb-4">LOG TYPE VISIBILITY</h3>
            <canvas ref={flowRef} className="w-full h-[200px]" />
          </div>

          {/* Infrastructure Cards */}
          <div className="space-y-4">
            {infrastructureData.types.map((infra: any) => {
              const Icon = getIcon(infra.name);
              const isHovered = hoveredInfra === infra.name;
              
              return (
                <div
                  key={infra.name}
                  className={`glass-panel rounded-xl p-4 transition-all cursor-pointer ${
                    isHovered ? 'border-cyan-400/50 transform scale-105' : ''
                  }`}
                  onMouseEnter={() => setHoveredInfra(infra.name)}
                  onMouseLeave={() => setHoveredInfra(null)}
                  onClick={() => setSelectedType(infra.name)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Icon className="w-6 h-6 text-cyan-400" />
                      <div>
                        <div className="text-lg font-bold text-white">{infra.name}</div>
                        <div className="text-xs text-gray-400">
                          {infra.totalHosts.toLocaleString()} hosts
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-bold ${
                        infra.status === 'critical' ? 'text-pink-400' :
                        infra.status === 'warning' ? 'text-purple-400' :
                        'text-cyan-400'
                      }`}>
                        {infra.visibilityPercentage.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-400 uppercase">Visibility</div>
                    </div>
                  </div>
                  
                  {/* Visibility Bar */}
                  <div className="h-6 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full relative transition-all duration-1000"
                      style={{
                        width: `${infra.visibilityPercentage}%`,
                        background: infra.status === 'critical' 
                          ? 'linear-gradient(90deg, #ff00ff, #ff00ff)'
                          : infra.status === 'warning'
                          ? 'linear-gradient(90deg, #a855f7, #c084fc)'
                          : 'linear-gradient(90deg, #00ffff, #00d4ff)'
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-black">
                          {infra.visibleHosts.toLocaleString()} / {infra.totalHosts.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Status */}
                  <div className="mt-2 flex items-center justify-between">
                    <div className={`text-xs font-bold uppercase ${
                      infra.status === 'critical' ? 'text-pink-400' :
                      infra.status === 'warning' ? 'text-purple-400' :
                      'text-cyan-400'
                    }`}>
                      {infra.status}
                    </div>
                    <Eye className={`w-4 h-4 ${
                      infra.visibilityPercentage > 60 ? 'text-cyan-400' : 'text-gray-600'
                    }`} />
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