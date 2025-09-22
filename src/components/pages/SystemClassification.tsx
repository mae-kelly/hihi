import React, { useState, useEffect, useRef } from 'react';
import { Server, Database, Network, Globe, HardDrive, Cpu, Eye, AlertTriangle, Shield, Wifi, Monitor, Router, Activity, Layers } from 'lucide-react';
import * as THREE from 'three';

const SystemClassification: React.FC = () => {
  const [systemData, setSystemData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hoveredSystem, setHoveredSystem] = useState<string | null>(null);
  const galaxyRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLCanvasElement>(null);
  const pulseRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/system_classification_visibility');
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

  // 3D System Galaxy Visualization - Each system type as a solar system
  useEffect(() => {
    if (!galaxyRef.current || !systemData) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.001);
    
    const camera = new THREE.PerspectiveCamera(
      60,
      galaxyRef.current.clientWidth / galaxyRef.current.clientHeight,
      0.1,
      1000
    );
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    
    renderer.setSize(galaxyRef.current.clientWidth, galaxyRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    galaxyRef.current.appendChild(renderer.domElement);

    // Get systems grouped by category
    const categories = systemData.category_summary || {};
    const systems = systemData.detailed_breakdown || [];
    
    // Create central visibility core
    const coreGeometry = new THREE.SphereGeometry(15, 32, 32);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: 0x00d4ff,
      emissive: 0x00d4ff,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.9
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);

    // Create category rings around core
    const categoryGroups: THREE.Group[] = [];
    Object.entries(categories).forEach(([category, data]: [string, any], catIndex) => {
      const categoryGroup = new THREE.Group();
      const orbitRadius = 60 + catIndex * 40;
      
      // Category orbit ring
      const ringGeometry = new THREE.TorusGeometry(orbitRadius, 0.5, 8, 100);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: data.visibility_percentage < 40 ? 0xa855f7 : 0x00d4ff,
        transparent: true,
        opacity: 0.3
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      categoryGroup.add(ring);
      
      // Systems in this category
      const categorySystems = systems.filter((s: any) => s.category === category);
      categorySystems.forEach((system: any, sysIndex: number) => {
        const angle = (sysIndex / categorySystems.length) * Math.PI * 2;
        const x = Math.cos(angle) * orbitRadius;
        const z = Math.sin(angle) * orbitRadius;
        
        // System sphere size based on host count
        const size = 3 + Math.log(system.total_hosts / 1000 + 1) * 2;
        const systemGeometry = new THREE.SphereGeometry(size, 16, 16);
        const systemMaterial = new THREE.MeshPhongMaterial({
          color: system.status === 'CRITICAL' ? 0xa855f7 :
                 system.status === 'WARNING' ? 0xffaa00 : 0x00d4ff,
          emissive: system.status === 'CRITICAL' ? 0xa855f7 : 0x00d4ff,
          emissiveIntensity: 0.2,
          transparent: true,
          opacity: 0.8
        });
        
        const systemMesh = new THREE.Mesh(systemGeometry, systemMaterial);
        systemMesh.position.set(x, 0, z);
        systemMesh.userData = system;
        
        // Visibility indicator - inner core shows actual visibility
        const visRadius = size * (system.visibility_percentage / 100);
        const visGeometry = new THREE.SphereGeometry(visRadius, 12, 12);
        const visMaterial = new THREE.MeshPhongMaterial({
          color: 0x00d4ff,
          emissive: 0x00d4ff,
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 1
        });
        const visSphere = new THREE.Mesh(visGeometry, visMaterial);
        visSphere.position.copy(systemMesh.position);
        
        // Add invisible hosts as dark particles around system
        const invisibleCount = Math.floor((system.invisible_hosts / system.total_hosts) * 50);
        const particlesGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(invisibleCount * 3);
        
        for (let i = 0; i < invisibleCount * 3; i += 3) {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI;
          const r = size + 2 + Math.random() * 5;
          
          positions[i] = x + r * Math.sin(phi) * Math.cos(theta);
          positions[i + 1] = r * Math.cos(phi);
          positions[i + 2] = z + r * Math.sin(phi) * Math.sin(theta);
        }
        
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particlesMaterial = new THREE.PointsMaterial({
          color: 0xa855f7,
          size: 1,
          transparent: true,
          opacity: 0.6,
          blending: THREE.AdditiveBlending
        });
        const particles = new THREE.Points(particlesGeometry, particlesMaterial);
        
        categoryGroup.add(systemMesh);
        categoryGroup.add(visSphere);
        categoryGroup.add(particles);
      });
      
      categoryGroup.userData = { category, data };
      categoryGroups.push(categoryGroup);
      scene.add(categoryGroup);
    });

    // Global particle field for data flow
    const globalParticleCount = 1000;
    const globalGeometry = new THREE.BufferGeometry();
    const globalPositions = new Float32Array(globalParticleCount * 3);
    const globalColors = new Float32Array(globalParticleCount * 3);
    
    for (let i = 0; i < globalParticleCount * 3; i += 3) {
      globalPositions[i] = (Math.random() - 0.5) * 400;
      globalPositions[i + 1] = (Math.random() - 0.5) * 300;
      globalPositions[i + 2] = (Math.random() - 0.5) * 400;
      
      const isVisible = Math.random() > 0.5;
      globalColors[i] = isVisible ? 0 : 0.66;
      globalColors[i + 1] = isVisible ? 1 : 0.33;
      globalColors[i + 2] = isVisible ? 1 : 0.97;
    }
    
    globalGeometry.setAttribute('position', new THREE.BufferAttribute(globalPositions, 3));
    globalGeometry.setAttribute('color', new THREE.BufferAttribute(globalColors, 3));
    
    const globalMaterial = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    });
    
    const globalParticles = new THREE.Points(globalGeometry, globalMaterial);
    scene.add(globalParticles);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const pointLight1 = new THREE.PointLight(0x00d4ff, 1, 300);
    pointLight1.position.set(150, 100, 150);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0xa855f7, 1, 300);
    pointLight2.position.set(-150, -100, -150);
    scene.add(pointLight2);

    camera.position.set(0, 100, 200);
    camera.lookAt(0, 0, 0);

    // Mouse interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    const handleMouseMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      
      if (intersects.length > 0 && intersects[0].object.userData.system_classification) {
        setHoveredSystem(intersects[0].object.userData.system_classification);
      } else {
        setHoveredSystem(null);
      }
    };
    
    renderer.domElement.addEventListener('mousemove', handleMouseMove);

    // Animation
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      // Rotate core
      core.rotation.y += 0.002;
      core.scale.setScalar(1 + Math.sin(Date.now() * 0.001) * 0.05);
      
      // Rotate category groups with different speeds
      categoryGroups.forEach((group, index) => {
        group.rotation.y += 0.001 * (index + 1);
        
        // Animate systems within category
        group.children.forEach((child: any) => {
          if (child.isMesh && child.userData.system_classification) {
            child.rotation.y += 0.01;
            child.position.y = Math.sin(Date.now() * 0.001 + index) * 5;
          }
        });
      });
      
      // Animate global particles
      globalParticles.rotation.y += 0.0002;
      
      // Camera orbit
      const time = Date.now() * 0.0003;
      camera.position.x = Math.sin(time) * 250;
      camera.position.z = Math.cos(time) * 250;
      camera.position.y = 100 + Math.sin(time * 2) * 30;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
    };
    
    animate();

    return () => {
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      if (frameId) cancelAnimationFrame(frameId);
      if (galaxyRef.current && renderer.domElement) {
        galaxyRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [systemData, selectedCategory]);

  // Visibility Flow Animation
  useEffect(() => {
    const canvas = flowRef.current;
    if (!canvas || !systemData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const systems = systemData.detailed_breakdown || [];
    
    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw flow lines for each system
      const filteredSystems = selectedCategory === 'all' 
        ? systems 
        : systems.filter((s: any) => s.category === selectedCategory);
      
      filteredSystems.slice(0, 10).forEach((system: any, index: number) => {
        const y = (index + 1) * (canvas.height / 11);
        const flowWidth = (canvas.width * 0.8) * (system.visibility_percentage / 100);
        
        // Visibility flow
        const gradient = ctx.createLinearGradient(0, y, flowWidth, y);
        gradient.addColorStop(0, system.status === 'CRITICAL' ? '#a855f7' : '#00d4ff');
        gradient.addColorStop(1, system.status === 'CRITICAL' ? '#a855f740' : '#00d4ff40');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 20;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(10, y);
        ctx.lineTo(flowWidth, y);
        ctx.stroke();
        
        // Invisible portion
        ctx.strokeStyle = '#a855f720';
        ctx.beginPath();
        ctx.moveTo(flowWidth, y);
        ctx.lineTo(canvas.width * 0.8, y);
        ctx.stroke();
        
        // System label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(system.system_classification.substring(0, 20), 10, y - 25);
        
        // Percentage
        ctx.fillStyle = system.status === 'CRITICAL' ? '#a855f7' : '#00d4ff';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(`${system.visibility_percentage.toFixed(1)}%`, flowWidth + 10, y + 5);
        
        // Host counts
        ctx.fillStyle = '#ffffff60';
        ctx.font = '9px monospace';
        ctx.fillText(
          `${system.visible_hosts.toLocaleString()} / ${system.total_hosts.toLocaleString()}`,
          10,
          y + 15
        );
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, [systemData, selectedCategory]);

  // Pulse Radar
  useEffect(() => {
    const canvas = pulseRef.current;
    if (!canvas || !systemData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) - 20;

    let sweepAngle = 0;

    const animate = () => {
      // Fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw radar circles
      for (let i = 1; i <= 4; i++) {
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, (maxRadius / 4) * i, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw category segments
      const categories = systemData.category_summary || {};
      const categoryCount = Object.keys(categories).length;
      
      Object.entries(categories).forEach(([category, data]: [string, any], index) => {
        const startAngle = (index / categoryCount) * Math.PI * 2;
        const endAngle = ((index + 1) / categoryCount) * Math.PI * 2;
        const radius = (data.visibility_percentage / 100) * maxRadius;
        
        // Draw segment
        ctx.fillStyle = data.status === 'CRITICAL' ? 'rgba(168, 85, 247, 0.3)' :
                       data.status === 'WARNING' ? 'rgba(255, 170, 0, 0.3)' :
                       'rgba(0, 212, 255, 0.3)';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fill();
        
        // Category label
        const labelAngle = (startAngle + endAngle) / 2;
        const labelX = centerX + Math.cos(labelAngle) * (maxRadius + 15);
        const labelY = centerY + Math.sin(labelAngle) * (maxRadius + 15);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(category.substring(0, 10), labelX, labelY);
      });

      // Sweep line
      sweepAngle += 0.02;
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(sweepAngle) * maxRadius,
        centerY + Math.sin(sweepAngle) * maxRadius
      );
      ctx.stroke();

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

  const getSystemIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('windows')) return Monitor;
    if (lower.includes('linux')) return Server;
    if (lower.includes('database')) return Database;
    if (lower.includes('network') || lower.includes('firewall')) return Network;
    if (lower.includes('router')) return Router;
    if (lower.includes('mainframe')) return HardDrive;
    if (lower.includes('container')) return Layers;
    return Cpu;
  };

  const categories = systemData.category_summary || {};
  const systems = systemData.detailed_breakdown || [];
  const criticalSystems = systemData.critical_systems || [];
  const totalSystems = systemData.total_system_types || 0;

  return (
    <div className="h-full flex flex-col p-4">
      {/* Critical Alert if low visibility */}
      {criticalSystems.length > 5 && (
        <div className="mb-3 bg-black border border-purple-500/50 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-purple-400 animate-pulse" />
            <span className="text-purple-400 font-bold text-sm">CRITICAL:</span>
            <span className="text-white text-sm">
              {criticalSystems.length} system types below 30% visibility
            </span>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-12 gap-4">
        {/* 3D Galaxy Visualization */}
        <div className="col-span-7">
          <div className="h-full glass-panel rounded-xl">
            <div className="p-3 border-b border-cyan-400/20">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-cyan-400">SYSTEM VISIBILITY GALAXY</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                      selectedCategory === 'all'
                        ? 'bg-cyan-400/20 border border-cyan-400 text-cyan-400'
                        : 'bg-black/50 border border-gray-700 text-gray-400'
                    }`}
                  >
                    ALL
                  </button>
                  {Object.keys(categories).slice(0, 4).map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                        selectedCategory === category
                          ? 'bg-cyan-400/20 border border-cyan-400 text-cyan-400'
                          : 'bg-black/50 border border-gray-700 text-gray-400'
                      }`}
                    >
                      {category.toUpperCase().substring(0, 8)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div ref={galaxyRef} className="w-full" style={{ height: 'calc(100% - 60px)' }} />
            
            {hoveredSystem && (
              <div className="absolute bottom-4 left-4 bg-black/90 rounded-lg border border-cyan-400/30 p-3">
                <div className="text-sm font-bold text-cyan-400">{hoveredSystem}</div>
                <div className="text-xs text-white">
                  Click to focus • Drag to rotate
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-5 space-y-3">
          {/* Category Summary Cards */}
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(categories).map(([category, data]: [string, any]) => (
              <div
                key={category}
                className="glass-panel rounded-lg p-3 cursor-pointer hover:border-cyan-400 transition-all"
                onClick={() => setSelectedCategory(category)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white">{category.toUpperCase()}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    data.status === 'CRITICAL' ? 'bg-purple-500/20 text-purple-400' :
                    data.status === 'WARNING' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-cyan-500/20 text-cyan-400'
                  }`}>
                    {data.status}
                  </span>
                </div>
                <div className="text-2xl font-bold text-cyan-400">
                  {data.visibility_percentage.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-400">
                  {data.visible_hosts.toLocaleString()} / {data.total_hosts.toLocaleString()}
                </div>
                <div className="mt-2 h-1 bg-black/50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${data.visibility_percentage}%`,
                      background: data.status === 'CRITICAL' 
                        ? 'linear-gradient(90deg, #a855f7, #ff00ff)'
                        : 'linear-gradient(90deg, #00d4ff, #00d4ff)'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Visibility Flow */}
          <div className="glass-panel rounded-xl p-3">
            <h3 className="text-sm font-bold text-purple-400 mb-2">SYSTEM VISIBILITY FLOW</h3>
            <canvas ref={flowRef} className="w-full h-48" />
          </div>

          {/* Radar */}
          <div className="glass-panel rounded-xl p-3">
            <h3 className="text-sm font-bold text-cyan-400 mb-2">CATEGORY RADAR</h3>
            <canvas ref={pulseRef} className="w-full h-32" />
          </div>

          {/* Critical Systems Alert */}
          {criticalSystems.length > 0 && (
            <div className="glass-panel rounded-xl p-3 border border-purple-500/30">
              <h3 className="text-sm font-bold text-purple-400 mb-2">CRITICAL SYSTEMS</h3>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {criticalSystems.slice(0, 5).map((system: any) => (
                  <div key={system.system_classification} className="flex justify-between items-center">
                    <span className="text-xs text-white">{system.system_classification}</span>
                    <span className="text-xs font-bold text-purple-400">
                      {system.visibility_percentage.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemClassification;