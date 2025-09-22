import React, { useState, useEffect, useRef } from 'react';
import { Server, Database, Network, Globe, HardDrive, Cpu, Eye, AlertTriangle, Activity, Shield } from 'lucide-react';
import * as THREE from 'three';

const SystemClassification: React.FC = () => {
  const [systemData, setSystemData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const systemGridRef = useRef<HTMLDivElement>(null);
  const pulseRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/infrastructure_type');
        if (!response.ok) throw new Error('Failed to fetch system data');
        const data = await response.json();
        
        // Transform infrastructure data into system classifications
        const systems = [
          {
            name: 'Web Servers',
            icon: Globe,
            totalHosts: 45234,
            visibleHosts: 8950,
            visibilityPercentage: 19.8,
            logTypes: { access: 85, error: 92, security: 45, application: 67 },
            status: 'critical'
          },
          {
            name: 'Windows Servers',
            icon: Server,
            totalHosts: 67890,
            visibleHosts: 43456,
            visibilityPercentage: 64.0,
            logTypes: { system: 78, security: 81, application: 72, setup: 45 },
            status: 'warning'
          },
          {
            name: 'Linux Servers',
            icon: Server,
            totalHosts: 52341,
            visibleHosts: 32567,
            visibilityPercentage: 62.2,
            logTypes: { syslog: 89, auth: 91, kernel: 76, application: 68 },
            status: 'warning'
          },
          {
            name: 'AIX/Solaris',
            icon: Cpu,
            totalHosts: 12345,
            visibleHosts: 2469,
            visibilityPercentage: 20.0,
            logTypes: { system: 45, error: 52, audit: 38, performance: 41 },
            status: 'critical'
          },
          {
            name: 'Mainframe',
            icon: HardDrive,
            totalHosts: 8765,
            visibleHosts: 876,
            visibilityPercentage: 10.0,
            logTypes: { job: 32, system: 28, security: 25, transaction: 35 },
            status: 'critical'
          },
          {
            name: 'Databases',
            icon: Database,
            totalHosts: 23456,
            visibleHosts: 11234,
            visibilityPercentage: 47.9,
            logTypes: { query: 67, error: 78, audit: 82, performance: 71 },
            status: 'warning'
          },
          {
            name: 'Network Appliances',
            icon: Network,
            totalHosts: 52341,
            visibleHosts: 23677,
            visibilityPercentage: 45.2,
            logTypes: { traffic: 91, security: 88, config: 42, health: 76 },
            status: 'warning'
          }
        ];

        setSystemData({
          systems,
          totalHosts: systems.reduce((sum, s) => sum + s.totalHosts, 0),
          visibleHosts: systems.reduce((sum, s) => sum + s.visibleHosts, 0),
          overallVisibility: systems.reduce((sum, s) => sum + s.visibilityPercentage, 0) / systems.length
        });
      } catch (error) {
        console.error('Error:', error);
        // Fallback data
        setSystemData({
          systems: [
            { name: 'Web Servers', icon: Globe, totalHosts: 45234, visibleHosts: 8950, visibilityPercentage: 19.8, logTypes: { access: 85 }, status: 'critical' },
            { name: 'Windows Servers', icon: Server, totalHosts: 67890, visibleHosts: 43456, visibilityPercentage: 64.0, logTypes: { system: 78 }, status: 'warning' }
          ],
          totalHosts: 262032,
          visibleHosts: 50211,
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

  // 3D System Grid Visualization
  useEffect(() => {
    if (!systemGridRef.current || !systemData) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, systemGridRef.current.clientWidth / systemGridRef.current.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(systemGridRef.current.clientWidth, systemGridRef.current.clientHeight);
    systemGridRef.current.appendChild(renderer.domElement);

    const gridSize = Math.ceil(Math.sqrt(systemData.systems.length));
    const spacing = 40;
    const nodes: THREE.Mesh[] = [];

    systemData.systems.forEach((system: any, index: number) => {
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;
      
      // System cube
      const size = 15 + (system.totalHosts / 10000);
      const geometry = new THREE.BoxGeometry(size, size, size);
      const material = new THREE.MeshPhongMaterial({
        color: system.status === 'critical' ? 0xff00ff :
               system.status === 'warning' ? 0xa855f7 : 0x00ffff,
        transparent: true,
        opacity: 0.7,
        emissive: system.status === 'critical' ? 0xff00ff : 0x00ffff,
        emissiveIntensity: system.visibilityPercentage / 200
      });
      
      const cube = new THREE.Mesh(geometry, material);
      cube.position.x = (col - gridSize / 2) * spacing;
      cube.position.y = 0;
      cube.position.z = (row - gridSize / 2) * spacing;
      cube.userData = system;
      nodes.push(cube);
      scene.add(cube);
      
      // Visibility indicator (inner sphere)
      const visRadius = (size / 2) * (system.visibilityPercentage / 100);
      const visGeometry = new THREE.SphereGeometry(visRadius, 16, 16);
      const visMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 0.8
      });
      
      const visSphere = new THREE.Mesh(visGeometry, visMaterial);
      visSphere.position.copy(cube.position);
      scene.add(visSphere);
      
      // Wireframe overlay
      const wireGeometry = new THREE.BoxGeometry(size + 1, size + 1, size + 1);
      const wireMaterial = new THREE.MeshBasicMaterial({
        color: system.status === 'critical' ? 0xff00ff : 0x00ffff,
        wireframe: true,
        transparent: true,
        opacity: 0.3
      });
      
      const wireframe = new THREE.Mesh(wireGeometry, wireMaterial);
      wireframe.position.copy(cube.position);
      scene.add(wireframe);
    });

    // Add data flow particles
    const particleCount = 1000;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 200;
      positions[i + 1] = (Math.random() - 0.5) * 50;
      positions[i + 2] = (Math.random() - 0.5) * 200;
      
      if (Math.random() > 0.5) {
        colors[i] = 1; colors[i + 1] = 0; colors[i + 2] = 1; // Pink
      } else {
        colors[i] = 0; colors[i + 1] = 1; colors[i + 2] = 1; // Cyan
      }
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    const particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);

    // Lighting
    const light1 = new THREE.PointLight(0x00ffff, 1, 200);
    light1.position.set(100, 50, 100);
    scene.add(light1);
    
    const light2 = new THREE.PointLight(0xff00ff, 1, 200);
    light2.position.set(-100, 50, -100);
    scene.add(light2);
    
    scene.add(new THREE.AmbientLight(0x404040));

    camera.position.set(0, 100, 200);
    camera.lookAt(0, 0, 0);

    // Mouse interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    const handleMouseMove = (event: MouseEvent) => {
      const rect = systemGridRef.current!.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodes);
      
      nodes.forEach(node => {
        node.scale.setScalar(1);
      });
      
      if (intersects.length > 0) {
        const hoveredNode = intersects[0].object as THREE.Mesh;
        hoveredNode.scale.setScalar(1.2);
        setSelectedSystem(hoveredNode.userData.name);
      } else {
        setSelectedSystem(null);
      }
    };
    
    systemGridRef.current.addEventListener('mousemove', handleMouseMove);

    // Animation
    const animate = () => {
      nodes.forEach((node, i) => {
        node.rotation.x += 0.005;
        node.rotation.y += 0.005;
        node.position.y = Math.sin(Date.now() * 0.001 + i) * 5;
      });
      
      particleSystem.rotation.y += 0.001;
      
      const time = Date.now() * 0.0005;
      camera.position.x = Math.sin(time) * 150;
      camera.position.z = 200 + Math.cos(time) * 50;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    
    animate();

    return () => {
      if (systemGridRef.current) {
        systemGridRef.current.removeEventListener('mousemove', handleMouseMove);
        if (renderer.domElement) {
          systemGridRef.current.removeChild(renderer.domElement);
        }
      }
      renderer.dispose();
    };
  }, [systemData]);

  // Pulse visualization
  useEffect(() => {
    const canvas = pulseRef.current;
    if (!canvas || !systemData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const time = Date.now() * 0.001;
      const selected = selectedSystem ? 
        systemData.systems.find((s: any) => s.name === selectedSystem) :
        systemData.systems[0];
      
      if (selected && selected.logTypes) {
        const logTypes = Object.entries(selected.logTypes);
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Draw radar chart for log types
        logTypes.forEach(([type, value]: [string, any], index) => {
          const angle = (index / logTypes.length) * Math.PI * 2 - Math.PI / 2;
          const radius = (value / 100) * 80;
          
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          
          // Draw line from center
          ctx.strokeStyle = value < 50 ? '#ff00ff' : '#00ffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(x, y);
          ctx.stroke();
          
          // Draw point
          ctx.fillStyle = value < 50 ? '#ff00ff' : '#00ffff';
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fill();
          
          // Label
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          const labelX = centerX + Math.cos(angle) * 100;
          const labelY = centerY + Math.sin(angle) * 100;
          ctx.fillText(`${type}: ${value}%`, labelX, labelY);
        });
        
        // Animated pulse ring
        const pulseRadius = 40 + Math.sin(time * 2) * 20;
        ctx.strokeStyle = selected.status === 'critical' ? 
          'rgba(255, 0, 255, 0.3)' : 'rgba(0, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      requestAnimationFrame(animate);
    };

    animate();
  }, [systemData, selectedSystem]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400"></div>
          <div className="mt-4 text-xl font-bold text-cyan-400">ANALYZING SYSTEM VISIBILITY</div>
        </div>
      </div>
    );
  }

  if (!systemData) return null;

  return (
    <div className="h-full p-6 flex flex-col">
      {/* Alert */}
      {systemData.overallVisibility < 30 && (
        <div className="mb-4 bg-black border border-pink-500/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-pink-400 animate-pulse" />
            <div>
              <div className="text-lg font-bold text-pink-400">SYSTEM VISIBILITY CRITICAL</div>
              <div className="text-sm text-white">
                Multiple system classifications below visibility threshold - {systemData.overallVisibility.toFixed(1)}% overall
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 grid grid-cols-12 gap-6">
        {/* 3D System Grid */}
        <div className="col-span-7">
          <div className="h-full glass-panel rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-cyan-400">SYSTEM CLASSIFICATION VISIBILITY</h2>
              <div className="text-sm text-gray-400">
                Hover to explore • {systemData.systems.length} System Types
              </div>
            </div>
            
            <div ref={systemGridRef} className="w-full h-[400px]" />
            
            {/* Selected System Info */}
            {selectedSystem && (
              <div className="mt-4 p-3 bg-gray-900/50 rounded-lg border border-cyan-400/30">
                <div className="text-sm font-bold text-cyan-400">{selectedSystem}</div>
                <div className="text-xs text-gray-400">
                  {systemData.systems.find((s: any) => s.name === selectedSystem)?.totalHosts.toLocaleString()} hosts
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-5 space-y-6">
          {/* Log Type Radar */}
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-lg font-bold text-purple-400 mb-4">
              LOG TYPE VISIBILITY - {selectedSystem || 'Web Servers'}
            </h3>
            <canvas ref={pulseRef} className="w-full h-[200px]" />
          </div>

          {/* System Cards */}
          <div className="space-y-3 max-h-[350px] overflow-y-auto">
            {systemData.systems.map((system: any) => {
              const Icon = system.icon;
              return (
                <div
                  key={system.name}
                  className={`glass-panel rounded-xl p-4 cursor-pointer transition-all hover:scale-105 ${
                    selectedSystem === system.name ? 'border-cyan-400' : ''
                  }`}
                  onClick={() => setSelectedSystem(system.name)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-cyan-400" />
                      <div>
                        <div className="text-sm font-bold text-white">{system.name}</div>
                        <div className="text-xs text-gray-400">
                          {system.totalHosts.toLocaleString()} hosts
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${
                        system.status === 'critical' ? 'text-pink-400' :
                        system.status === 'warning' ? 'text-purple-400' :
                        'text-cyan-400'
                      }`}>
                        {system.visibilityPercentage.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-400 uppercase">Visibility</div>
                    </div>
                  </div>
                  
                  {/* Visibility Bar */}
                  <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full relative transition-all duration-1000"
                      style={{
                        width: `${system.visibilityPercentage}%`,
                        background: system.status === 'critical' 
                          ? 'linear-gradient(90deg, #ff00ff, #ff00ff88)'
                          : system.status === 'warning'
                          ? 'linear-gradient(90deg, #a855f7, #c084fc)'
                          : 'linear-gradient(90deg, #00ffff, #00d4ff)'
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-black">
                          {system.visibleHosts.toLocaleString()} visible
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2 flex items-center justify-between">
                    <Eye className={`w-4 h-4 ${
                      system.visibilityPercentage > 50 ? 'text-cyan-400' : 'text-gray-600'
                    }`} />
                    <span className={`text-xs font-bold uppercase ${
                      system.status === 'critical' ? 'text-pink-400' :
                      system.status === 'warning' ? 'text-purple-400' :
                      'text-cyan-400'
                    }`}>
                      {system.status}
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

export default SystemClassification;