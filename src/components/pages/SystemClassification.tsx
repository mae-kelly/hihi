import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Monitor, Server, Cloud, Database, Network, AlertTriangle, Activity, Cpu } from 'lucide-react';

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
        const response = await fetch('http://localhost:5000/api/system_classification');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setSystemData(data);
      } catch (error) {
        console.error('Error:', error);
        setSystemData({
          system_matrix: {},
          system_analytics: {},
          os_distribution: {},
          version_analysis: {},
          security_distribution: {},
          total_systems: 0,
          modernization_analysis: {
            legacy_systems: 0,
            legacy_assets: 0,
            modernization_priority: [],
            security_risk_level: 0
          },
          taxonomy_intelligence: {
            os_diversity: 0,
            dominant_os: 'Unknown',
            system_sprawl: 0,
            standardization_score: 0
          }
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

    const systems = Object.entries(systemData.system_matrix || {});
    const osTypes = systemData.os_distribution || {};
    
    // Create central core representing total systems
    const securityRiskLevel = systemData.modernization_analysis?.security_risk_level || 0;
    
    const coreGeometry = new THREE.SphereGeometry(20, 32, 32);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: securityRiskLevel > 50 ? 0xa855f7 : 0x00d4ff,
      emissive: securityRiskLevel > 50 ? 0xa855f7 : 0x00d4ff,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.9
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);

    // Create OS category rings
    const categoryGroups = [];
    Object.entries(osTypes).forEach(([osType, count], catIndex) => {
      const categoryGroup = new THREE.Group();
      const orbitRadius = 60 + catIndex * 40;
      
      // Category orbit ring
      const ringGeometry = new THREE.TorusGeometry(orbitRadius, 1, 8, 100);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: count < 1000 ? 0xa855f7 : 0x00d4ff,
        transparent: true,
        opacity: 0.2
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      categoryGroup.add(ring);
      
      // Systems in this OS category
      const categorySystems = systems.filter(([name]) => {
        const nameLower = name.toLowerCase();
        const osTypeLower = osType.toLowerCase();
        return nameLower.includes(osTypeLower) || 
               (osTypeLower === 'windows' && nameLower.includes('win')) ||
               (osTypeLower === 'linux' && (nameLower.includes('ubuntu') || nameLower.includes('centos') || nameLower.includes('rhel')));
      });
      
      categorySystems.slice(0, 10).forEach((system, sysIndex) => {
        const [systemName, systemCount] = system;
        const angle = (sysIndex / Math.min(categorySystems.length, 10)) * Math.PI * 2;
        const x = Math.cos(angle) * orbitRadius;
        const z = Math.sin(angle) * orbitRadius;
        const y = (Math.random() - 0.5) * 20;
        
        // System node
        const size = 3 + Math.log(systemCount / 100 + 1) * 3;
        const analytics = systemData.system_analytics?.[systemName] || {};
        
        const nodeGeometry = new THREE.SphereGeometry(size, 16, 16);
        const nodeMaterial = new THREE.MeshPhongMaterial({
          color: analytics.security_category === 'legacy' ? 0xa855f7 : 0x00d4ff,
          emissive: analytics.security_category === 'legacy' ? 0xa855f7 : 0x00d4ff,
          emissiveIntensity: 0.3,
          transparent: true,
          opacity: 0.8
        });
        const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
        node.position.set(x, y, z);
        node.userData = { systemName, count: systemCount, analytics };
        
        categoryGroup.add(node);
      });
      
      categoryGroup.userData = { osType, count };
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

      // Draw OS distribution segments
      const osDistribution = systemData.os_distribution || {};
      const totalSystems = Object.values(osDistribution).reduce((sum, count) => sum + count, 1);
      
      let startAngle = 0;
      Object.entries(osDistribution).forEach(([osType, count]) => {
        const sweepSize = (count / totalSystems) * Math.PI * 2;
        const endAngle = startAngle + sweepSize;
        const radius = maxRadius * (count / Math.max(...Object.values(osDistribution), 1));
        
        // Draw segment
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        if (osType === 'Windows') {
          gradient.addColorStop(0, 'rgba(0, 212, 255, 0.5)');
          gradient.addColorStop(1, 'rgba(0, 212, 255, 0.1)');
        } else if (osType === 'Linux') {
          gradient.addColorStop(0, 'rgba(168, 85, 247, 0.5)');
          gradient.addColorStop(1, 'rgba(168, 85, 247, 0.1)');
        } else {
          gradient.addColorStop(0, 'rgba(255, 170, 0, 0.5)');
          gradient.addColorStop(1, 'rgba(255, 170, 0, 0.1)');
        }
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fill();
        
        // OS label
        const labelAngle = (startAngle + endAngle) / 2;
        const labelX = centerX + Math.cos(labelAngle) * (maxRadius + 20);
        const labelY = centerY + Math.sin(labelAngle) * (maxRadius + 20);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(osType, labelX, labelY);
        
        startAngle = endAngle;
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
  const legacyAssets = systemData?.modernization_analysis?.legacy_assets || 0;
  const securityRiskLevel = systemData?.modernization_analysis?.security_risk_level || 0;
  const osDiversity = systemData?.taxonomy_intelligence?.os_diversity || 0;
  const dominantOs = systemData?.taxonomy_intelligence?.dominant_os || 'Unknown';
  const standardizationScore = systemData?.taxonomy_intelligence?.standardization_score || 0;

  return (
    <div className="h-full flex flex-col p-6 bg-black">
      {legacySystems > 5 && (
        <div className="mb-4 bg-purple-500/10 border border-purple-500 rounded-xl p-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-purple-400 animate-pulse" />
            <span className="text-purple-400 font-bold">CRITICAL:</span>
            <span className="text-white">
              {legacySystems} legacy system types with {legacyAssets.toLocaleString()} assets at {securityRiskLevel.toFixed(1)}% risk
            </span>
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
                  <p className="text-sm text-white/60 mt-1">
                    Tracking {totalSystems} unique system types across {osDiversity} OS families
                  </p>
                </div>
              </div>
            </div>
            
            <div ref={galaxyRef} className="h-[calc(100%-80px)]" />
          </div>
        </div>

        {/* Metrics Panel */}
        <div className="col-span-4 space-y-4">
          {/* Security Risk Level */}
          <div className="bg-black/90 border border-cyan-400/30 rounded-xl p-4">
            <h3 className="text-lg font-bold text-white mb-3">SECURITY RISK LEVEL</h3>
            <div className="text-5xl font-bold text-center py-4">
              <span className={securityRiskLevel > 50 ? 'text-purple-400' : 'text-cyan-400'}>
                {securityRiskLevel.toFixed(1)}%
              </span>
            </div>
            <div className="text-center text-sm text-white/60">
              Legacy system exposure
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

          {/* OS Radar */}
          <div className="bg-black/90 border border-cyan-400/30 rounded-xl p-4">
            <h3 className="text-lg font-bold text-white mb-3">OS DISTRIBUTION RADAR</h3>
            <canvas ref={radarRef} className="w-full h-48" />
          </div>

          {/* Taxonomy Intelligence */}
          <div className="bg-black/90 border border-cyan-400/30 rounded-xl p-4">
            <h3 className="text-lg font-bold text-white mb-3">TAXONOMY INTELLIGENCE</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">OS Diversity</span>
                <span className="text-sm font-bold text-white">{osDiversity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Dominant OS</span>
                <span className="text-sm font-bold text-cyan-400">{dominantOs}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Standardization</span>
                <span className="text-sm font-bold text-white">{standardizationScore.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">System Sprawl</span>
                <span className="text-sm font-bold text-purple-400">{systemData?.taxonomy_intelligence?.system_sprawl || 0}</span>
              </div>
            </div>
          </div>

          {/* Security Distribution */}
          <div className="bg-black/90 border border-cyan-400/30 rounded-xl p-4">
            <h3 className="text-lg font-bold text-white mb-3">SECURITY CATEGORIES</h3>
            <div className="space-y-2">
              {Object.entries(systemData?.security_distribution || {}).map(([category, count]) => (
                <div key={category} className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 capitalize">{category}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-black rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          category === 'legacy' ? 'bg-purple-400' :
                          category === 'modern' ? 'bg-cyan-400' :
                          'bg-yellow-400'
                        }`}
                        style={{ width: `${(count / legacyAssets * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-white min-w-[60px] text-right">
                      {count.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modernization Priority */}
          {systemData?.modernization_analysis?.modernization_priority?.length > 0 && (
            <div className="bg-black/90 border border-red-400/30 rounded-xl p-4 max-h-48 overflow-y-auto">
              <h3 className="text-sm font-bold text-red-400 mb-2">MODERNIZATION PRIORITY</h3>
              <div className="space-y-2">
                {systemData.modernization_analysis.modernization_priority.slice(0, 5).map((system, idx) => (
                  <div key={idx} className="text-xs">
                    <div className="font-bold text-white">{system.system}</div>
                    <div className="text-gray-400">{system.count.toLocaleString()} assets</div>
                    <div className="text-purple-400">Regions: {system.regions?.slice(0, 3).join(', ')}</div>
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