import React, { useState, useEffect, useRef } from 'react';
import { Server, Database, Network, Globe, HardDrive, Cpu, Eye, AlertTriangle, Shield, Wifi } from 'lucide-react';
import * as THREE from 'three';

const SystemClassification: React.FC = () => {
  const [systemData, setSystemData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const matrixRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/system_classification');
        if (!response.ok) throw new Error('Failed to fetch system data');
        const data = await response.json();
        setSystemData(data);
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

  // 3D System Grid Visualization
  useEffect(() => {
    if (!gridRef.current || !systemData) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, gridRef.current.clientWidth / gridRef.current.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(gridRef.current.clientWidth, gridRef.current.clientHeight);
    gridRef.current.appendChild(renderer.domElement);

    const systems = systemData.detailed_breakdown || [];
    const gridSize = Math.ceil(Math.sqrt(systems.length));
    const spacing = 40;
    const nodes: THREE.Mesh[] = [];

    systems.forEach((system: any, index: number) => {
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;
      
      // System node
      const size = 15 + Math.log(system.total_hosts / 1000 + 1) * 5;
      const geometry = new THREE.BoxGeometry(size, size, size);
      const material = new THREE.MeshPhongMaterial({
        color: system.status === 'CRITICAL' ? 0xa855f7 :
               system.status === 'WARNING' ? 0xffaa00 : 0x00d4ff,
        transparent: true,
        opacity: 0.7,
        emissive: system.status === 'CRITICAL' ? 0xa855f7 : 0x00d4ff,
        emissiveIntensity: system.visibility_percentage / 200
      });
      
      const cube = new THREE.Mesh(geometry, material);
      cube.position.x = (col - gridSize / 2) * spacing;
      cube.position.z = (row - gridSize / 2) * spacing;
      cube.userData = system;
      nodes.push(cube);
      scene.add(cube);
      
      // Visibility sphere inside
      const visRadius = (size / 2) * (system.visibility_percentage / 100);
      const visGeometry = new THREE.SphereGeometry(visRadius, 16, 16);
      const visMaterial = new THREE.MeshPhongMaterial({
        color: 0x00d4ff,
        emissive: 0x00d4ff,
        emissiveIntensity: 0.5
      });
      
      const visSphere = new THREE.Mesh(visGeometry, visMaterial);
      visSphere.position.copy(cube.position);
      scene.add(visSphere);
    });

    // Lighting
    const light1 = new THREE.PointLight(0x00d4ff, 1, 200);
    light1.position.set(100, 100, 100);
    scene.add(light1);
    
    scene.add(new THREE.AmbientLight(0x404040));

    camera.position.set(0, 150, 200);
    camera.lookAt(0, 0, 0);

    // Animation
    const animate = () => {
      nodes.forEach((node, i) => {
        node.rotation.x += 0.005;
        node.rotation.y += 0.005;
        node.position.y = Math.sin(Date.now() * 0.001 + i) * 5;
      });
      
      const time = Date.now() * 0.0005;
      camera.position.x = Math.sin(time) * 200;
      camera.position.z = 200 + Math.cos(time) * 50;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    
    animate();

    return () => {
      if (gridRef.current && renderer.domElement) {
        gridRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [systemData]);

  // System visibility matrix
  useEffect(() => {
    const canvas = matrixRef.current;
    if (!canvas || !systemData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const systems = systemData.detailed_breakdown || [];
      const cols = Math.min(systems.length, 5);
      const rows = Math.ceil(systems.length / cols);
      const cellWidth = canvas.width / cols;
      const cellHeight = canvas.height / rows;

      systems.forEach((system: any, index: number) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const x = col * cellWidth;
        const y = row * cellHeight;
        
        // Cell color based on visibility
        const intensity = system.visibility_percentage / 100;
        ctx.fillStyle = system.status === 'CRITICAL' 
          ? `rgba(168, 85, 247, ${intensity * 0.5})`
          : `rgba(0, 212, 255, ${intensity * 0.5})`;
        ctx.fillRect(x + 2, y + 2, cellWidth - 4, cellHeight - 4);
        
        // System name
        ctx.fillStyle = '#ffffff';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          system.system_classification.substring(0, 15),
          x + cellWidth / 2,
          y + cellHeight / 2 - 5
        );
        
        // Percentage
        ctx.fillStyle = system.status === 'CRITICAL' ? '#a855f7' : '#00d4ff';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(
          `${system.visibility_percentage.toFixed(0)}%`,
          x + cellWidth / 2,
          y + cellHeight / 2 + 10
        );
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, [systemData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
          <div className="mt-4 text-lg font-bold text-cyan-400">ANALYZING SYSTEM VISIBILITY</div>
        </div>
      </div>
    );
  }

  if (!systemData) return null;

  const getIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('web')) return Globe;
    if (lower.includes('windows') || lower.includes('linux')) return Server;
    if (lower.includes('database')) return Database;
    if (lower.includes('network') || lower.includes('firewall')) return Network;
    if (lower.includes('mainframe')) return HardDrive;
    return Cpu;
  };

  const systems = systemData.detailed_breakdown || [];
  const avgVisibility = systems.reduce((sum: number, s: any) => sum + s.visibility_percentage, 0) / systems.length || 0;

  return (
    <div className="h-full flex flex-col p-4">
      {avgVisibility < 30 && (
        <div className="mb-3 bg-black border border-purple-500/50 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-purple-400 animate-pulse" />
            <span className="text-purple-400 font-bold text-sm">CRITICAL:</span>
            <span className="text-white text-sm">
              System visibility at {avgVisibility.toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 grid grid-cols-12 gap-4">
        <div className="col-span-7">
          <div className="h-full glass-panel rounded-xl p-4">
            <h2 className="text-lg font-bold text-cyan-400 mb-3">SYSTEM CLASSIFICATION VISIBILITY</h2>
            <div ref={gridRef} className="w-full" style={{ height: 'calc(100% - 40px)' }} />
          </div>
        </div>

        <div className="col-span-5 space-y-3">
          <div className="glass-panel rounded-xl p-3">
            <h3 className="text-sm font-bold text-purple-400 mb-2">SYSTEM MATRIX</h3>
            <canvas ref={matrixRef} className="w-full h-48" />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {systems.map((system: any) => {
              const Icon = getIcon(system.system_classification);
              
              return (
                <div
                  key={system.system_classification}
                  className={`glass-panel rounded-lg p-3 cursor-pointer transition-all hover:scale-102 ${
                    selectedSystem === system.system_classification ? 'border-cyan-400' : ''
                  }`}
                  onClick={() => setSelectedSystem(system.system_classification)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-cyan-400" />
                      <div>
                        <div className="text-xs font-bold text-white">{system.system_classification}</div>
                        <div className="text-xs text-gray-400">{system.total_hosts.toLocaleString()} hosts</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${
                        system.status === 'CRITICAL' ? 'text-purple-400' :
                        system.status === 'WARNING' ? 'text-yellow-400' :
                        'text-cyan-400'
                      }`}>
                        {system.visibility_percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2 h-2 bg-black/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${system.visibility_percentage}%`,
                        background: system.status === 'CRITICAL' 
                          ? 'linear-gradient(90deg, #a855f7, #ff00ff)'
                          : 'linear-gradient(90deg, #00d4ff, #0099ff)'
                      }}
                    />
                  </div>
                  
                  <div className="mt-1 flex justify-between">
                    <span className="text-xs text-cyan-400">
                      <Eye className="w-3 h-3 inline mr-1" />
                      {system.visible_hosts.toLocaleString()} visible
                    </span>
                    <span className={`text-xs font-bold ${
                      system.status === 'CRITICAL' ? 'text-purple-400' :
                      system.status === 'WARNING' ? 'text-yellow-400' :
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