import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Monitor, Server, Cloud, Database, Network, AlertTriangle, Activity, Cpu, HardDrive, Shield, Zap, X, ChevronRight, Layers } from 'lucide-react';

const SystemClassification = () => {
  const [systemData, setSystemData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [hoveredSystem, setHoveredSystem] = useState(null);
  const [detailView, setDetailView] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const galaxyRef = useRef(null);
  const sunburstRef = useRef(null);
  const timelineRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const frameRef = useRef(null);
  const systemNodesRef = useRef([]);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/system_classification');
        if (!response.ok) throw new Error('Failed to fetch');
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

  const searchSystemHosts = async (systemName) => {
    try {
      const response = await fetch(`http://localhost:5000/api/host_search?q=${systemName}`);
      const data = await response.json();
      setSearchResults(data);
      return data;
    } catch (error) {
      console.error('Search error:', error);
      return null;
    }
  };

  // 3D OS Galaxy - Systems grouped by OS family
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

    systemNodesRef.current = [];

    const systems = Object.entries(systemData.system_matrix || {});
    const osTypes = systemData.os_distribution || {};
    
    // Central core representing all systems
    const securityRiskLevel = systemData.modernization_analysis?.security_risk_level || 0;
    
    const coreGeometry = new THREE.IcosahedronGeometry(15, 2);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: securityRiskLevel > 50 ? 0xa855f7 : 0x00d4ff,
      emissive: securityRiskLevel > 50 ? 0xa855f7 : 0x00d4ff,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.9
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);

    // OS Family Clusters - each OS type gets its own orbital ring
    const osColors = {
      'Windows': 0x00d4ff,
      'Linux': 0x00ff88,
      'MacOS': 0xff00ff,
      'Unix': 0xffaa00,
      'Other': 0xa855f7
    };

    Object.entries(osTypes).forEach(([osType, count], osIndex) => {
      if (count === 0) return;
      
      const orbitRadius = 40 + osIndex * 30;
      const systemsOfType = systems.filter(([name]) => {
        const nameLower = name.toLowerCase();
        if (osType === 'Windows') return nameLower.includes('win');
        if (osType === 'Linux') return nameLower.includes('linux') || nameLower.includes('ubuntu') || nameLower.includes('centos');
        if (osType === 'MacOS') return nameLower.includes('mac') || nameLower.includes('osx');
        if (osType === 'Unix') return nameLower.includes('unix') || nameLower.includes('aix');
        return true;
      });

      // Create orbit ring
      const ringGeometry = new THREE.TorusGeometry(orbitRadius, 0.5, 8, 100);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: osColors[osType] || 0xa855f7,
        transparent: true,
        opacity: 0.2
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      scene.add(ring);

      // Place systems on the orbit
      systemsOfType.slice(0, 20).forEach((system, sysIndex) => {
        const [systemName, systemCount] = system;
        const analytics = systemData.system_analytics?.[systemName] || {};
        
        const angle = (sysIndex / Math.min(systemsOfType.length, 20)) * Math.PI * 2;
        const x = Math.cos(angle) * orbitRadius;
        const z = Math.sin(angle) * orbitRadius;
        const y = (Math.random() - 0.5) * 10;
        
        // System node
        const nodeSize = 2 + Math.log(systemCount / 100 + 1) * 2;
        const nodeGeometry = new THREE.SphereGeometry(nodeSize, 16, 16);
        const nodeMaterial = new THREE.MeshPhongMaterial({
          color: analytics.security_category === 'legacy' ? 0xa855f7 : osColors[osType] || 0x00d4ff,
          emissive: analytics.security_category === 'legacy' ? 0xa855f7 : osColors[osType] || 0x00d4ff,
          emissiveIntensity: 0.3,
          transparent: true,
          opacity: 0.8
        });
        const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
        node.position.set(x, y, z);
        node.userData = { 
          systemName, 
          count: systemCount, 
          analytics,
          osType,
          isLegacy: analytics.security_category === 'legacy'
        };
        systemNodesRef.current.push(node);
        scene.add(node);

        // Add version indicator ring if legacy
        if (analytics.security_category === 'legacy') {
          const indicatorGeometry = new THREE.RingGeometry(nodeSize + 1, nodeSize + 2, 32);
          const indicatorMaterial = new THREE.MeshBasicMaterial({
            color: 0xa855f7,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
          });
          const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
          indicator.position.copy(node.position);
          indicator.lookAt(0, 0, 0);
          scene.add(indicator);
        }
      });
    });

    // Add constellation connections between similar systems
    systemNodesRef.current.forEach((node1, i) => {
      systemNodesRef.current.slice(i + 1).forEach(node2 => {
        if (node1.userData.osType === node2.userData.osType) {
          const distance = node1.position.distanceTo(node2.position);
          if (distance < 50) {
            const points = [node1.position, node2.position];
            const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const lineMaterial = new THREE.LineBasicMaterial({
              color: osColors[node1.userData.osType] || 0x00d4ff,
              transparent: true,
              opacity: 0.1
            });
            const line = new THREE.Line(lineGeometry, lineMaterial);
            scene.add(line);
          }
        }
      });
    });

    // Security risk particles
    const particleCount = 1000;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 400;
      positions[i + 1] = (Math.random() - 0.5) * 300;
      positions[i + 2] = (Math.random() - 0.5) * 400;
      
      const isLegacy = Math.random() < securityRiskLevel / 100;
      colors[i] = isLegacy ? 0.66 : 0;
      colors[i + 1] = isLegacy ? 0.33 : 0.83;
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

    // Mouse interaction
    const handleMouseMove = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(systemNodesRef.current);
      
      systemNodesRef.current.forEach(node => {
        node.scale.setScalar(1);
      });
      
      if (intersects.length > 0) {
        const hoveredNode = intersects[0].object;
        hoveredNode.scale.setScalar(1.3);
        setHoveredSystem(hoveredNode.userData);
        document.body.style.cursor = 'pointer';
      } else {
        setHoveredSystem(null);
        document.body.style.cursor = 'default';
      }
    };

    const handleClick = async (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(systemNodesRef.current);
      
      if (intersects.length > 0) {
        const clickedNode = intersects[0].object;
        await searchSystemHosts(clickedNode.userData.systemName);
        setSelectedSystem(clickedNode.userData);
        setDetailView(true);
      }
    };

    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('click', handleClick);

    // Animation
    const animate = () => {
      if (!sceneRef.current) return;
      frameRef.current = requestAnimationFrame(animate);
      
      // Rotate core
      core.rotation.y += 0.002;
      core.scale.setScalar(1 + Math.sin(Date.now() * 0.001) * 0.05);
      
      // Rotate particles
      particles.rotation.y += 0.0002;
      
      // Orbit systems
      systemNodesRef.current.forEach((node, index) => {
        const time = Date.now() * 0.0001;
        const orbitSpeed = 0.5 + (index % 3) * 0.2;
        node.position.x = Math.cos(time * orbitSpeed + index) * Math.sqrt(node.position.x ** 2 + node.position.z ** 2);
        node.position.z = Math.sin(time * orbitSpeed + index) * Math.sqrt(node.position.x ** 2 + node.position.z ** 2);
      });
      
      const time = Date.now() * 0.0003;
      camera.position.x = Math.sin(time) * 300;
      camera.position.z = Math.cos(time) * 300;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
    };
    
    animate();

    return () => {
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('click', handleClick);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (galaxyRef.current && galaxyRef.current.contains(rendererRef.current.domElement)) {
          galaxyRef.current.removeChild(rendererRef.current.domElement);
        }
      }
    };
  }, [systemData, loading]);

  // Sunburst Chart for OS Distribution
  useEffect(() => {
    const canvas = sunburstRef.current;
    if (!canvas || !systemData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) - 10;

    const osDistribution = systemData.os_distribution || {};
    const total = Object.values(osDistribution).reduce((sum, count) => sum + count, 1);
    
    const colors = {
      'Windows': '#00d4ff',
      'Linux': '#00ff88',
      'MacOS': '#ff00ff',
      'Unix': '#ffaa00',
      'Other': '#a855f7'
    };

    let animationId;
    let rotation = 0;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      rotation += 0.002;

      let currentAngle = rotation;
      
      Object.entries(osDistribution).forEach(([osType, count]) => {
        const sweepAngle = (count / total) * Math.PI * 2;
        const endAngle = currentAngle + sweepAngle;
        
        // Draw arc
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, maxRadius, currentAngle, endAngle);
        ctx.closePath();
        
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
        gradient.addColorStop(0, colors[osType] + '40');
        gradient.addColorStop(1, colors[osType]);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Draw border
        ctx.strokeStyle = colors[osType];
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw label if segment is large enough
        if (sweepAngle > 0.2) {
          const labelAngle = currentAngle + sweepAngle / 2;
          const labelX = centerX + Math.cos(labelAngle) * (maxRadius * 0.7);
          const labelY = centerY + Math.sin(labelAngle) * (maxRadius * 0.7);
          
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(osType, labelX, labelY);
          
          ctx.font = '10px monospace';
          ctx.fillText(`${((count / total) * 100).toFixed(1)}%`, labelX, labelY + 15);
        }
        
        currentAngle = endAngle;
      });

      // Central info
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(centerX, centerY, maxRadius * 0.3, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(Object.keys(osDistribution).length.toString(), centerX, centerY - 10);
      ctx.font = '10px monospace';
      ctx.fillText('OS TYPES', centerX, centerY + 10);

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [systemData]);

  // Version Timeline
  useEffect(() => {
    const canvas = timelineRef.current;
    if (!canvas || !systemData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let animationId;
    let scrollX = 0;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      scrollX -= 1;
      if (scrollX < -canvas.width) scrollX = 0;

      // Draw timeline
      const modernizationData = systemData.modernization_analysis?.modernization_priority || [];
      const lineY = canvas.height / 2;
      
      // Timeline line
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, lineY);
      ctx.lineTo(canvas.width, lineY);
      ctx.stroke();
      
      // Draw systems on timeline
      modernizationData.slice(0, 10).forEach((system, index) => {
        const x = (index + 1) * (canvas.width / 11) + scrollX;
        const isLegacy = system.system.toLowerCase().includes('2008') || 
                        system.system.toLowerCase().includes('2012') ||
                        system.system.toLowerCase().includes('xp');
        
        // Node
        const nodeSize = Math.min(20, Math.max(10, Math.sqrt(system.count / 10)));
        ctx.beginPath();
        ctx.arc(x, lineY, nodeSize, 0, Math.PI * 2);
        
        const gradient = ctx.createRadialGradient(x, lineY, 0, x, lineY, nodeSize);
        gradient.addColorStop(0, isLegacy ? 'rgba(168, 85, 247, 1)' : 'rgba(0, 212, 255, 1)');
        gradient.addColorStop(1, isLegacy ? 'rgba(168, 85, 247, 0.3)' : 'rgba(0, 212, 255, 0.3)');
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(system.system.substring(0, 15), x, lineY - nodeSize - 5);
        ctx.fillText(system.count.toLocaleString(), x, lineY + nodeSize + 15);
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
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

  const totalSystems = systemData?.total_systems || 0;
  const legacySystems = systemData?.modernization_analysis?.legacy_systems || 0;
  const securityRiskLevel = systemData?.modernization_analysis?.security_risk_level || 0;

  return (
    <div className="h-full flex flex-col p-6 bg-black">
      {legacySystems > 5 && (
        <div className="mb-4 bg-purple-500/10 border border-purple-500 rounded-xl p-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-purple-400 animate-pulse" />
            <span className="text-purple-400 font-bold">CRITICAL:</span>
            <span className="text-white">
              {legacySystems} legacy system types at {securityRiskLevel.toFixed(1)}% risk
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 grid grid-cols-12 gap-6">
        {/* 3D OS Galaxy */}
        <div className="col-span-8">
          <div className="h-full bg-black/90 border border-cyan-400/30 rounded-xl">
            <div className="p-4 border-b border-cyan-400/20">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-cyan-400">SYSTEM OS GALAXY</h2>
                  <p className="text-sm text-white/60 mt-1">
                    {totalSystems} systems • Click nodes to explore • Orbits represent OS families
                  </p>
                </div>
              </div>
            </div>
            
            <div ref={galaxyRef} className="h-[calc(100%-80px)]" />
            
            {hoveredSystem && (
              <div className="absolute bottom-4 left-4 bg-black/95 border border-cyan-400/50 rounded-lg p-3">
                <div className="text-sm font-bold text-cyan-400">{hoveredSystem.systemName}</div>
                <div className="text-xs text-white mt-1">
                  <div>Count: {hoveredSystem.count}</div>
                  <div>OS: {hoveredSystem.osType}</div>
                  <div className={hoveredSystem.isLegacy ? 'text-purple-400' : 'text-cyan-400'}>
                    {hoveredSystem.isLegacy ? 'LEGACY SYSTEM' : 'MODERN'}
                  </div>
                  <div className="text-cyan-400 mt-1">Click for details →</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-4 space-y-4">
          {/* Security Risk */}
          <div className="bg-black/90 border border-cyan-400/30 rounded-xl p-4">
            <h3 className="text-lg font-bold text-white mb-3">SECURITY RISK LEVEL</h3>
            <div className="text-5xl font-bold text-center py-4">
              <span className={securityRiskLevel > 50 ? 'text-purple-400' : 'text-cyan-400'}>
                {securityRiskLevel.toFixed(1)}%
              </span>
            </div>
            <div className="h-4 bg-black rounded-full overflow-hidden border border-cyan-400/30 mt-3">
              <div 
                className="h-full transition-all duration-1000"
                style={{
                  width: `${securityRiskLevel}%`,
                  background: securityRiskLevel > 50 
                    ? 'linear-gradient(90deg, #a855f7, #ff00ff)'
                    : 'linear-gradient(90deg, #00d4ff, #0099ff)'
                }}
              />
            </div>
          </div>

          {/* OS Distribution Sunburst */}
          <div className="bg-black/90 border border-cyan-400/30 rounded-xl p-4">
            <h3 className="text-sm font-bold text-white mb-3">OS DISTRIBUTION</h3>
            <canvas ref={sunburstRef} className="w-full h-48" />
          </div>

          {/* Version Timeline */}
          <div className="bg-black/90 border border-cyan-400/30 rounded-xl p-4">
            <h3 className="text-sm font-bold text-white mb-3">MODERNIZATION TIMELINE</h3>
            <canvas ref={timelineRef} className="w-full h-24" />
          </div>
        </div>
      </div>

      {/* Detail View Modal */}
      {detailView && selectedSystem && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-6">
          <div className="bg-black border-2 border-cyan-400/50 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-cyan-400/30 flex items-center justify-between">
              <h2 className="text-xl font-bold text-cyan-400">
                {selectedSystem.systemName?.toUpperCase()} ANALYSIS
              </h2>
              <button 
                onClick={() => {
                  setDetailView(false);
                  setSelectedSystem(null);
                  setSearchResults(null);
                }}
                className="text-white hover:text-cyan-400 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-black/50 border border-cyan-400/30 rounded-lg p-4">
                  <div className="text-2xl font-bold text-white">{selectedSystem.count}</div>
                  <div className="text-xs text-gray-400">Total Instances</div>
                </div>
                <div className="bg-black/50 border border-cyan-400/30 rounded-lg p-4">
                  <div className="text-2xl font-bold text-cyan-400">{selectedSystem.osType}</div>
                  <div className="text-xs text-gray-400">OS Family</div>
                </div>
                <div className="bg-black/50 border border-purple-400/30 rounded-lg p-4">
                  <div className={`text-2xl font-bold ${selectedSystem.isLegacy ? 'text-purple-400' : 'text-cyan-400'}`}>
                    {selectedSystem.isLegacy ? 'LEGACY' : 'MODERN'}
                  </div>
                  <div className="text-xs text-gray-400">Status</div>
                </div>
              </div>

              {searchResults && searchResults.hosts && (
                <div className="mt-6">
                  <h3 className="text-lg font-bold text-cyan-400 mb-3">SAMPLE HOSTS</h3>
                  <div className="bg-black/50 border border-cyan-400/30 rounded-lg overflow-hidden">
                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-black/70 sticky top-0">
                          <tr className="border-b border-cyan-400/30">
                            <th className="text-left p-2 text-cyan-400">Host</th>
                            <th className="text-left p-2 text-cyan-400">System</th>
                            <th className="text-left p-2 text-cyan-400">Infrastructure</th>
                            <th className="text-left p-2 text-cyan-400">Region</th>
                          </tr>
                        </thead>
                        <tbody>
                          {searchResults.hosts.slice(0, 20).map((host, idx) => (
                            <tr key={idx} className="border-b border-gray-800 hover:bg-cyan-400/5">
                              <td className="p-2 text-white font-mono">{host.host}</td>
                              <td className="p-2 text-gray-400">{host.system}</td>
                              <td className="p-2 text-gray-400">{host.infrastructure_type}</td>
                              <td className="p-2 text-gray-400">{host.region}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemClassification;