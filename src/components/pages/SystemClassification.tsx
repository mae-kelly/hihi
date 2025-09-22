import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

const SystemClassification = () => {
  const [systemData, setSystemData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const galaxyRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const frameRef = useRef(null);
  const radarRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/system_classification_visibility');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setSystemData(data);
      } catch (error) {
        console.error('Error:', error);
        setSystemData({
          category_summary: {},
          detailed_breakdown: [],
          total_system_types: 0,
          critical_systems: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // 3D System Galaxy Visualization
  useEffect(() => {
    if (!galaxyRef.current || !systemData || loading) return;

    if (rendererRef.current) {
      rendererRef.current.dispose();
      if (galaxyRef.current.contains(rendererRef.current.domElement)) {
        galaxyRef.current.removeChild(rendererRef.current.domElement);
      }
    }

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x000000, 0.001);
    
    const camera = new THREE.PerspectiveCamera(
      60,
      galaxyRef.current.clientWidth / galaxyRef.current.clientHeight,
      0.1,
      1000
    );
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    rendererRef.current = renderer;
    
    renderer.setSize(galaxyRef.current.clientWidth, galaxyRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    galaxyRef.current.appendChild(renderer.domElement);

    const categories = systemData.category_summary || {};
    const systems = systemData.detailed_breakdown || [];
    
    // Create central core representing total visibility
    const overallVisibility = Object.values(categories).reduce((sum, cat) => 
      sum + (cat.visibility_percentage || 0), 0) / Math.max(Object.keys(categories).length, 1);
    
    const coreGeometry = new THREE.SphereGeometry(20, 32, 32);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: overallVisibility > 50 ? 0x00d4ff : 0xa855f7,
      emissive: overallVisibility > 50 ? 0x00d4ff : 0xa855f7,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.9
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);

    // Create category rings
    const categoryGroups = [];
    Object.entries(categories).forEach(([category, data], catIndex) => {
      const categoryGroup = new THREE.Group();
      const orbitRadius = 60 + catIndex * 50;
      
      // Category orbit ring
      const ringGeometry = new THREE.TorusGeometry(orbitRadius, 1, 8, 100);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: data.visibility_percentage < 50 ? 0xa855f7 : 0x00d4ff,
        transparent: true,
        opacity: 0.2
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      categoryGroup.add(ring);
      
      // Systems in this category
      const categorySystems = systems.filter(s => s.category === category);
      const filteredSystems = selectedCategory === 'all' ? categorySystems : 
                             selectedCategory === category ? categorySystems : [];
      
      filteredSystems.slice(0, 20).forEach((system, sysIndex) => {
        const angle = (sysIndex / Math.min(categorySystems.length, 20)) * Math.PI * 2;
        const x = Math.cos(angle) * orbitRadius;
        const z = Math.sin(angle) * orbitRadius;
        const y = (Math.random() - 0.5) * 20;
        
        // System node
        const size = 3 + Math.log(system.total_hosts / 1000 + 1) * 3;
        
        // Outer sphere for total hosts
        const outerGeometry = new THREE.SphereGeometry(size, 16, 16);
        const outerMaterial = new THREE.MeshPhongMaterial({
          color: 0x111111,
          emissive: system.status === 'CRITICAL' ? 0xa855f7 : 0x00d4ff,
          emissiveIntensity: 0.1,
          transparent: true,
          opacity: 0.3
        });
        const outerSphere = new THREE.Mesh(outerGeometry, outerMaterial);
        outerSphere.position.set(x, y, z);
        
        // Inner sphere for visible hosts
        const visRadius = size * (system.visibility_percentage / 100);
        const visGeometry = new THREE.SphereGeometry(visRadius, 12, 12);
        const visMaterial = new THREE.MeshPhongMaterial({
          color: system.visibility_percentage > 50 ? 0x00d4ff : 0xa855f7,
          emissive: system.visibility_percentage > 50 ? 0x00d4ff : 0xa855f7,
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 1
        });
        const visSphere = new THREE.Mesh(visGeometry, visMaterial);
        visSphere.position.copy(outerSphere.position);
        
        categoryGroup.add(outerSphere);
        categoryGroup.add(visSphere);
      });
      
      categoryGroup.userData = { category, data };
      categoryGroups.push(categoryGroup);
      scene.add(categoryGroup);
    });

    // Add global particles
    const particleCount = 1000;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 400;
      positions[i + 1] = (Math.random() - 0.5) * 300;
      positions[i + 2] = (Math.random() - 0.5) * 400;
      
      const isVisible = Math.random() < overallVisibility / 100;
      colors[i] = isVisible ? 0 : 0.66;
      colors[i + 1] = isVisible ? 0.83 : 0.33;
      colors[i + 2] = 1;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const pointLight1 = new THREE.PointLight(0x00d4ff, 1, 400);
    pointLight1.position.set(200, 150, 200);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0xa855f7, 1, 400);
    pointLight2.position.set(-200, -150, -200);
    scene.add(pointLight2);

    camera.position.set(0, 100, 250);
    camera.lookAt(0, 0, 0);

    // Animation
    const animate = () => {
      if (!sceneRef.current) return;
      frameRef.current = requestAnimationFrame(animate);
      
      core.rotation.y += 0.002;
      core.scale.setScalar(1 + Math.sin(Date.now() * 0.001) * 0.05);
      
      categoryGroups.forEach((group, index) => {
        group.rotation.y += 0.001 * (index + 1);
      });
      
      particles.rotation.y += 0.0002;
      
      const time = Date.now() * 0.0003;
      camera.position.x = Math.sin(time) * 300;
      camera.position.z = Math.cos(time) * 300;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
    };
    
    animate();

    const handleResize = () => {
      if (!galaxyRef.current || !camera || !renderer) return;
      camera.aspect = galaxyRef.current.clientWidth / galaxyRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(galaxyRef.current.clientWidth, galaxyRef.current.clientHeight);
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (galaxyRef.current && galaxyRef.current.contains(rendererRef.current.domElement)) {
          galaxyRef.current.removeChild(rendererRef.current.domElement);
        }
      }
    };
  }, [systemData, selectedCategory, loading]);

  // Radar Visualization
  useEffect(() => {
    const canvas = radarRef.current;
    if (!canvas || !systemData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) - 30;

    let sweepAngle = 0;

    const animate = () => {
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

      // Draw categories
      const categories = systemData.category_summary || {};
      const categoryArray = Object.entries(categories);
      
      if (categoryArray.length > 0) {
        categoryArray.forEach(([name, data], index) => {
          const startAngle = (index / categoryArray.length) * Math.PI * 2;
          const endAngle = ((index + 1) / categoryArray.length) * Math.PI * 2;
          const radius = (data.visibility_percentage / 100) * maxRadius;
          
          // Draw segment
          const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
          if (data.status === 'CRITICAL') {
            gradient.addColorStop(0, 'rgba(168, 85, 247, 0.5)');
            gradient.addColorStop(1, 'rgba(168, 85, 247, 0.1)');
          } else if (data.status === 'WARNING') {
            gradient.addColorStop(0, 'rgba(255, 170, 0, 0.5)');
            gradient.addColorStop(1, 'rgba(255, 170, 0, 0.1)');
          } else {
            gradient.addColorStop(0, 'rgba(0, 212, 255, 0.5)');
            gradient.addColorStop(1, 'rgba(0, 212, 255, 0.1)');
          }
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.arc(centerX, centerY, radius, startAngle, endAngle);
          ctx.closePath();
          ctx.fill();
          
          // Category label
          const labelAngle = (startAngle + endAngle) / 2;
          const labelX = centerX + Math.cos(labelAngle) * (maxRadius + 20);
          const labelY = centerY + Math.sin(labelAngle) * (maxRadius + 20);
          
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(name.substring(0, 15), labelX, labelY);
        });
      }

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
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
          <div className="mt-4 text-xl font-bold text-cyan-400">CLASSIFYING SYSTEMS</div>
        </div>
      </div>
    );
  }

  const categories = systemData?.category_summary || {};
  const systems = systemData?.detailed_breakdown || [];
  const criticalSystems = systemData?.critical_systems || [];
  
  const overallVisibility = Object.values(categories).reduce((sum, cat) => 
    sum + (cat.visibility_percentage || 0), 0) / Math.max(Object.keys(categories).length, 1);

  return (
    <div className="h-full flex flex-col p-6 bg-black">
      {criticalSystems.length > 5 && (
        <div className="mb-4 bg-purple-500/10 border border-purple-500 rounded-xl p-3">
          <div className="flex items-center gap-3">
            <span className="text-purple-400 font-bold">⚠️ CRITICAL:</span>
            <span className="text-white">{criticalSystems.length} system types below 30% visibility</span>
          </div>
        </div>
      )}

      <div className="flex-1 grid grid-cols-12 gap-6">
        {/* 3D Galaxy */}
        <div className="col-span-8">
          <div className="h-full bg-black/90 border border-cyan-400/30 rounded-xl">
            <div className="p-4 border-b border-cyan-400/20">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-cyan-400">SYSTEM CLASSIFICATION GALAXY</h2>
                  <p className="text-sm text-white/60 mt-1">Visibility across all system types</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                      selectedCategory === 'all'
                        ? 'bg-cyan-400/20 border border-cyan-400 text-cyan-400'
                        : 'bg-black/50 border border-white/20 text-white/60'
                    }`}
                  >
                    ALL
                  </button>
                  {Object.keys(categories).slice(0, 3).map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                        selectedCategory === category
                          ? 'bg-cyan-400/20 border border-cyan-400 text-cyan-400'
                          : 'bg-black/50 border border-white/20 text-white/60'
                      }`}
                    >
                      {category.toUpperCase().substring(0, 10)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div ref={galaxyRef} className="h-[calc(100%-80px)]" />
          </div>
        </div>

        {/* Metrics Panel */}
        <div className="col-span-4 space-y-4">
          {/* Overall Visibility */}
          <div className="bg-black/90 border border-cyan-400/30 rounded-xl p-4">
            <h3 className="text-lg font-bold text-white mb-3">OVERALL SYSTEM VISIBILITY</h3>
            <div className="text-5xl font-bold text-center py-4">
              <span className={overallVisibility < 50 ? 'text-purple-400' : 'text-cyan-400'}>
                {overallVisibility.toFixed(1)}%
              </span>
            </div>
            <div className="text-center text-sm text-white/60">
              Across {systemData?.total_system_types || 0} system types
            </div>
          </div>

          {/* Category Radar */}
          <div className="bg-black/90 border border-cyan-400/30 rounded-xl p-4">
            <h3 className="text-lg font-bold text-white mb-3">CATEGORY RADAR</h3>
            <canvas ref={radarRef} className="w-full h-48" />
          </div>

          {/* Category Stats */}
          <div className="bg-black/90 border border-cyan-400/30 rounded-xl p-4 max-h-64 overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-3">CATEGORY BREAKDOWN</h3>
            <div className="space-y-2">
              {Object.entries(categories).map(([category, data]) => (
                <div key={category} className="border border-cyan-400/20 rounded-lg p-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-cyan-400">{category.toUpperCase()}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      data.status === 'CRITICAL' ? 'bg-purple-500/20 text-purple-400' :
                      data.status === 'WARNING' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-cyan-500/20 text-cyan-400'
                    }`}>
                      {data.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white/60">
                      {data.visible_hosts?.toLocaleString()} / {data.total_hosts?.toLocaleString()}
                    </span>
                    <span className="text-lg font-bold text-white">
                      {data.visibility_percentage?.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1 bg-black rounded-full overflow-hidden mt-1">
                    <div 
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${data.visibility_percentage}%`,
                        background: data.status === 'CRITICAL' 
                          ? 'linear-gradient(90deg, #a855f7, #ff00ff)'
                          : 'linear-gradient(90deg, #00d4ff, #0099ff)'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemClassification;