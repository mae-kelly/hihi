import React, { useState, useEffect, useRef } from 'react';
import { Building, Layers, Eye, AlertTriangle, Activity, Users, Briefcase, Target, Database } from 'lucide-react';
import * as THREE from 'three';

const BUandApplicationView: React.FC = () => {
  const [businessData, setBusinessData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'bu' | 'cio' | 'apm' | 'class'>('bu');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const hierarchyRef = useRef<HTMLDivElement>(null);
  const sankeyRef = useRef<HTMLCanvasElement>(null);
  const bubbleRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/business_unit_visibility');
        if (!response.ok) throw new Error('Failed to fetch business data');
        const data = await response.json();
        setBusinessData(data);
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

  // 3D Organizational Hierarchy Visualization
  useEffect(() => {
    if (!hierarchyRef.current || !businessData) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.001);
    
    const camera = new THREE.PerspectiveCamera(
      60,
      hierarchyRef.current.clientWidth / hierarchyRef.current.clientHeight,
      0.1,
      1000
    );
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    
    renderer.setSize(hierarchyRef.current.clientWidth, hierarchyRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    hierarchyRef.current.appendChild(renderer.domElement);

    const nodes: THREE.Group[] = [];
    const connections: THREE.Line[] = [];
    
    // Get data based on selected view
    const getData = () => {
      switch (selectedView) {
        case 'bu':
          return businessData.business_unit_breakdown || [];
        case 'cio':
          return businessData.cio_breakdown || [];
        case 'apm':
          return businessData.apm_breakdown || [];
        case 'class':
          return businessData.application_class_breakdown || [];
        default:
          return [];
      }
    };
    
    const viewData = getData();
    const maxHosts = Math.max(...viewData.map((d: any) => d.total_hosts));
    
    // Central core representing overall visibility
    const coreGeometry = new THREE.IcosahedronGeometry(10, 2);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: 0x00d4ff,
      emissive: 0x00d4ff,
      emissiveIntensity: 0.2,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);
    
    // Create nodes for each business unit/CIO/APM/class
    viewData.forEach((item: any, index: number) => {
      const angle = (index / viewData.length) * Math.PI * 2;
      const radius = 60;
      
      const nodeGroup = new THREE.Group();
      
      // Node size based on total hosts
      const nodeSize = 5 + (item.total_hosts / maxHosts) * 15;
      
      // Node geometry - different shapes for different views
      let nodeGeometry;
      switch (selectedView) {
        case 'bu':
          nodeGeometry = new THREE.BoxGeometry(nodeSize, nodeSize, nodeSize);
          break;
        case 'cio':
          nodeGeometry = new THREE.OctahedronGeometry(nodeSize);
          break;
        case 'apm':
          nodeGeometry = new THREE.TetrahedronGeometry(nodeSize);
          break;
        default:
          nodeGeometry = new THREE.SphereGeometry(nodeSize, 16, 16);
      }
      
      const nodeMaterial = new THREE.MeshPhongMaterial({
        color: item.status === 'CRITICAL' ? 0xa855f7 :
               item.status === 'WARNING' ? 0xffaa00 : 0x00d4ff,
        emissive: item.status === 'CRITICAL' ? 0xa855f7 : 0x00d4ff,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.8
      });
      
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
      nodeGroup.add(node);
      
      // Visibility indicator sphere inside
      const visRadius = nodeSize * (item.visibility_percentage / 100);
      const visGeometry = new THREE.SphereGeometry(visRadius, 12, 12);
      const visMaterial = new THREE.MeshPhongMaterial({
        color: 0x00d4ff,
        emissive: 0x00d4ff,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.9
      });
      
      const visSphere = new THREE.Mesh(visGeometry, visMaterial);
      nodeGroup.add(visSphere);
      
      // Position node
      nodeGroup.position.x = Math.cos(angle) * radius;
      nodeGroup.position.z = Math.sin(angle) * radius;
      nodeGroup.position.y = (Math.random() - 0.5) * 20;
      
      nodeGroup.userData = item;
      nodes.push(nodeGroup);
      scene.add(nodeGroup);
      
      // Connection to center
      const points = [
        new THREE.Vector3(0, 0, 0),
        nodeGroup.position
      ];
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: item.status === 'CRITICAL' ? 0xa855f7 : 0x00d4ff,
        transparent: true,
        opacity: 0.3
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      connections.push(line);
      scene.add(line);
    });
    
    // Add particles for data flow
    const particleCount = 500;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 200;
      positions[i + 1] = (Math.random() - 0.5) * 100;
      positions[i + 2] = (Math.random() - 0.5) * 200;
      
      colors[i] = 0;
      colors[i + 1] = 0.83;
      colors[i + 2] = 1;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const pointLight1 = new THREE.PointLight(0x00d4ff, 1, 200);
    pointLight1.position.set(100, 100, 100);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0xa855f7, 0.5, 200);
    pointLight2.position.set(-100, -50, -100);
    scene.add(pointLight2);
    
    camera.position.set(100, 80, 150);
    camera.lookAt(0, 0, 0);
    
    // Animation
    const animate = () => {
      // Rotate core
      core.rotation.x += 0.005;
      core.rotation.y += 0.005;
      
      // Animate nodes
      nodes.forEach((nodeGroup, index) => {
        nodeGroup.rotation.y += 0.01;
        nodeGroup.children[0].rotation.x += 0.005;
        
        // Floating animation
        nodeGroup.position.y += Math.sin(Date.now() * 0.001 + index) * 0.05;
      });
      
      // Rotate particles
      particles.rotation.y += 0.001;
      
      // Camera orbit
      const time = Date.now() * 0.0003;
      camera.position.x = Math.sin(time) * 150;
      camera.position.z = Math.cos(time) * 150;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (hierarchyRef.current && renderer.domElement) {
        hierarchyRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [businessData, selectedView]);

  // Sankey Diagram for visibility flow
  useEffect(() => {
    const canvas = sankeyRef.current;
    if (!canvas || !businessData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const viewData = selectedView === 'bu' ? businessData.business_unit_breakdown :
                      selectedView === 'cio' ? businessData.cio_breakdown :
                      selectedView === 'apm' ? businessData.apm_breakdown :
                      businessData.application_class_breakdown || [];

      const time = Date.now() * 0.001;
      const flowHeight = canvas.height / viewData.length;
      
      viewData.forEach((item: any, index: number) => {
        const y = index * flowHeight + flowHeight / 2;
        const flowWidth = (canvas.width * 0.7) * (item.visibility_percentage / 100);
        
        // Draw flow
        ctx.strokeStyle = item.status === 'CRITICAL' ? '#a855f7' :
                         item.status === 'WARNING' ? '#ffaa00' : '#00d4ff';
        ctx.lineWidth = flowHeight * 0.6;
        ctx.globalAlpha = 0.6;
        
        ctx.beginPath();
        for (let x = 0; x < flowWidth; x++) {
          const waveY = y + Math.sin((x / 30) + time + index) * 5;
          if (x === 0) ctx.moveTo(x, waveY);
          else ctx.lineTo(x, waveY);
        }
        ctx.stroke();
        
        ctx.globalAlpha = 1;
        
        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(
          `${(item.business_unit || item.cio || item.apm || item.application_class || '').substring(0, 20)}`,
          5,
          y - flowHeight / 4
        );
        
        // Percentage
        ctx.fillStyle = item.status === 'CRITICAL' ? '#a855f7' : '#00d4ff';
        ctx.fillText(`${item.visibility_percentage.toFixed(1)}%`, flowWidth + 10, y);
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, [businessData, selectedView]);

  // Bubble Chart for relative sizes
  useEffect(() => {
    const canvas = bubbleRef.current;
    if (!canvas || !businessData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const viewData = selectedView === 'bu' ? businessData.business_unit_breakdown :
                    selectedView === 'cio' ? businessData.cio_breakdown :
                    selectedView === 'apm' ? businessData.apm_breakdown :
                    businessData.application_class_breakdown || [];

    const bubbles = viewData.map((item: any, index: number) => ({
      x: Math.random() * (canvas.width - 100) + 50,
      y: Math.random() * (canvas.height - 100) + 50,
      radius: Math.sqrt(item.total_hosts) / 10,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      data: item
    }));

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      bubbles.forEach(bubble => {
        // Update position
        bubble.x += bubble.vx;
        bubble.y += bubble.vy;
        
        // Bounce off walls
        if (bubble.x - bubble.radius < 0 || bubble.x + bubble.radius > canvas.width) {
          bubble.vx *= -1;
        }
        if (bubble.y - bubble.radius < 0 || bubble.y + bubble.radius > canvas.height) {
          bubble.vy *= -1;
        }
        
        // Draw bubble
        const gradient = ctx.createRadialGradient(
          bubble.x, bubble.y, 0,
          bubble.x, bubble.y, bubble.radius
        );
        
        if (bubble.data.status === 'CRITICAL') {
          gradient.addColorStop(0, 'rgba(168, 85, 247, 0.8)');
          gradient.addColorStop(1, 'rgba(168, 85, 247, 0.2)');
        } else {
          gradient.addColorStop(0, 'rgba(0, 212, 255, 0.8)');
          gradient.addColorStop(1, 'rgba(0, 212, 255, 0.2)');
        }
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw visibility percentage in center
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.max(10, bubble.radius / 3)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          `${bubble.data.visibility_percentage.toFixed(0)}%`,
          bubble.x,
          bubble.y
        );
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, [businessData, selectedView]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
          <div className="mt-4 text-lg font-bold text-cyan-400">ANALYZING BUSINESS VISIBILITY</div>
        </div>
      </div>
    );
  }

  if (!businessData) return null;

  const currentData = selectedView === 'bu' ? businessData.business_unit_breakdown :
                     selectedView === 'cio' ? businessData.cio_breakdown :
                     selectedView === 'apm' ? businessData.apm_breakdown :
                     businessData.application_class_breakdown || [];

  const avgVisibility = currentData.reduce((sum: number, item: any) => sum + item.visibility_percentage, 0) / currentData.length || 0;
  const criticalCount = currentData.filter((item: any) => item.status === 'CRITICAL').length;

  return (
    <div className="h-full flex flex-col p-4">
      {/* Critical Alert */}
      {avgVisibility < 30 && (
        <div className="mb-3 bg-black border border-purple-500/50 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-purple-400 animate-pulse" />
            <span className="text-purple-400 font-bold text-sm">CRITICAL:</span>
            <span className="text-white text-sm">
              Business visibility at {avgVisibility.toFixed(1)}% - {criticalCount} critical units
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 grid grid-cols-12 gap-4">
        {/* 3D Hierarchy */}
        <div className="col-span-7">
          <div className="h-full glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-cyan-400">ORGANIZATIONAL VISIBILITY</h2>
              <div className="flex gap-2">
                {[
                  { key: 'bu', label: 'BUSINESS UNIT', icon: Building },
                  { key: 'cio', label: 'CIO', icon: Users },
                  { key: 'apm', label: 'APM', icon: Briefcase },
                  { key: 'class', label: 'APP CLASS', icon: Layers }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedView(key as any)}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1 ${
                      selectedView === key
                        ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-400'
                        : 'bg-gray-900/50 border border-gray-700 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
            
            <div ref={hierarchyRef} className="w-full" style={{ height: 'calc(100% - 40px)' }} />
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-5 space-y-3">
          {/* Visibility Flow */}
          <div className="glass-panel rounded-xl p-3">
            <h3 className="text-sm font-bold text-purple-400 mb-2">VISIBILITY FLOW</h3>
            <canvas ref={sankeyRef} className="w-full h-32" />
          </div>

          {/* Bubble Chart */}
          <div className="glass-panel rounded-xl p-3">
            <h3 className="text-sm font-bold text-cyan-400 mb-2">RELATIVE SCALE</h3>
            <canvas ref={bubbleRef} className="w-full h-32" />
          </div>

          {/* Detail Cards */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {currentData.slice(0, 10).map((item: any, index: number) => {
              const name = item.business_unit || item.cio || item.apm || item.application_class || 'Unknown';
              
              return (
                <div
                  key={`${selectedView}-${index}`}
                  className={`glass-panel rounded-lg p-2.5 cursor-pointer transition-all hover:scale-102 ${
                    selectedItem === name ? 'border-cyan-400' : ''
                  }`}
                  onClick={() => setSelectedItem(name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-xs font-bold text-white truncate max-w-[180px]">
                        {name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {item.total_hosts.toLocaleString()} hosts
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-bold ${
                        item.status === 'CRITICAL' ? 'text-purple-400' :
                        item.status === 'WARNING' ? 'text-yellow-400' :
                        'text-cyan-400'
                      }`}>
                        {item.visibility_percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  {/* Visibility Bar */}
                  <div className="mt-2 h-2 bg-black/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${item.visibility_percentage}%`,
                        background: item.status === 'CRITICAL' 
                          ? 'linear-gradient(90deg, #a855f7, #ff00ff)'
                          : 'linear-gradient(90deg, #00d4ff, #0099ff)'
                      }}
                    />
                  </div>
                  
                  <div className="mt-1 flex justify-between items-center">
                    <span className="text-xs text-cyan-400">
                      <Eye className="w-3 h-3 inline mr-1" />
                      {item.visible_hosts.toLocaleString()}
                    </span>
                    <span className={`text-xs font-bold ${
                      item.status === 'CRITICAL' ? 'text-purple-400' :
                      item.status === 'WARNING' ? 'text-yellow-400' :
                      'text-cyan-400'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary Stats */}
          <div className="glass-panel rounded-xl p-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-400">AVG VISIBILITY</div>
                <div className={`text-2xl font-bold ${
                  avgVisibility < 30 ? 'text-purple-400' :
                  avgVisibility < 60 ? 'text-yellow-400' :
                  'text-cyan-400'
                }`}>
                  {avgVisibility.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400">TOTAL</div>
                <div className="text-2xl font-bold text-white">
                  {currentData.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BUandApplicationView;