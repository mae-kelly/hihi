import React, { useState, useEffect, useRef } from 'react';
import { Globe, Shield, Database, Network, Server, Cloud, Activity, Lock, Eye, Layers, Zap, Wifi, Radio, Satellite, Radar, Target, Navigation, Circle } from 'lucide-react';
import * as THREE from 'three';

const DomainVisibility: React.FC = () => {
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [animatedMetrics, setAnimatedMetrics] = useState<Record<string, number>>({});
  const [domainData, setDomainData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const networkRef = useRef<HTMLDivElement>(null);
  const constellationRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Fetch real data from Flask API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/domain_metrics');
        if (!response.ok) throw new Error('Failed to fetch domain data');
        const data = await response.json();
        setDomainData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // 3D Network Visualization with real data
  useEffect(() => {
    if (!networkRef.current || !domainData) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.001);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      networkRef.current.clientWidth / networkRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 80, 150);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(networkRef.current.clientWidth, networkRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    networkRef.current.appendChild(renderer.domElement);

    // Create domain nodes based on real data
    const nodes: THREE.Mesh[] = [];
    const connections: THREE.Line[] = [];
    
    // Central hub
    const hubGeometry = new THREE.OctahedronGeometry(10, 2);
    const hubMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.3,
      wireframe: false,
      transparent: true,
      opacity: 0.8
    });
    const hub = new THREE.Mesh(hubGeometry, hubMaterial);
    scene.add(hub);

    // Create domain clusters from real data
    Object.entries(domainData.domain_details || {}).slice(0, 8).forEach(([domain, data]: [string, any], index) => {
      const angle = (index / 8) * Math.PI * 2;
      const radius = 60;
      
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = (Math.random() - 0.5) * 30;
      
      // Domain node
      const nodeSize = Math.sqrt(data.count) / 50;
      const nodeGeometry = new THREE.SphereGeometry(nodeSize, 16, 16);
      
      // Color based on domain percentage
      const nodeColor = data.percentage > 10 ? 0xff00ff : 
                       data.percentage > 5 ? 0xc084fc :
                       0x00ffff;
      
      const nodeMaterial = new THREE.MeshPhongMaterial({
        color: nodeColor,
        emissive: nodeColor,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.8
      });
      
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
      node.position.set(x, y, z);
      node.userData = { domain, data };
      scene.add(node);
      nodes.push(node);
      
      // Connection to hub
      const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(x, y, z)
      ];
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: nodeColor,
        transparent: true,
        opacity: data.percentage / 100
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
      connections.push(line);
      
      // Add orbiting satellites for subdomains
      for (let i = 0; i < 2; i++) {
        const satelliteGeometry = new THREE.TetrahedronGeometry(1.5);
        const satelliteMaterial = new THREE.MeshBasicMaterial({
          color: nodeColor,
          transparent: true,
          opacity: 0.5
        });
        const satellite = new THREE.Mesh(satelliteGeometry, satelliteMaterial);
        satellite.userData = { parent: node, offset: i };
        scene.add(satellite);
      }
    });

    // Particle field for data flow
    const particleCount = 500;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 200;
      positions[i + 1] = (Math.random() - 0.5) * 150;
      positions[i + 2] = (Math.random() - 0.5) * 200;
      
      const colorChoice = Math.random();
      if (colorChoice < 0.33) {
        colors[i] = 0; colors[i + 1] = 1; colors[i + 2] = 1; // Cyan
      } else if (colorChoice < 0.66) {
        colors[i] = 0.75; colors[i + 1] = 0.52; colors[i + 2] = 0.99; // Purple
      } else {
        colors[i] = 1; colors[i + 1] = 0; colors[i + 2] = 1; // Pink
      }
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 1.5,
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

    const pointLight1 = new THREE.PointLight(0x00ffff, 1, 200);
    pointLight1.position.set(100, 50, 100);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff00ff, 1, 200);
    pointLight2.position.set(-100, 50, -100);
    scene.add(pointLight2);

    // Mouse interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    const handleMouseMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodes);
      
      nodes.forEach(node => {
        node.scale.setScalar(1);
      });
      
      if (intersects.length > 0) {
        const hoveredNode = intersects[0].object as THREE.Mesh;
        hoveredNode.scale.setScalar(1.3);
        setHoveredNode(hoveredNode.userData.domain);
      } else {
        setHoveredNode(null);
      }
    };
    
    renderer.domElement.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      // Rotate hub
      hub.rotation.x += 0.005;
      hub.rotation.y += 0.005;
      
      // Animate nodes
      nodes.forEach((node, index) => {
        node.rotation.y += 0.01;
        node.position.y += Math.sin(Date.now() * 0.001 + index) * 0.05;
      });
      
      // Animate satellites
      scene.children.forEach(child => {
        if (child.userData.parent) {
          const parent = child.userData.parent;
          const offset = child.userData.offset;
          const time = Date.now() * 0.002 + offset * Math.PI * 2 / 3;
          child.position.x = parent.position.x + Math.cos(time) * 15;
          child.position.y = parent.position.y;
          child.position.z = parent.position.z + Math.sin(time) * 15;
        }
      });
      
      // Animate particles
      particles.rotation.y += 0.0005;
      
      // Camera orbit
      const time = Date.now() * 0.0003;
      camera.position.x = Math.sin(time) * 180;
      camera.position.z = Math.cos(time) * 180;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      if (frameId) cancelAnimationFrame(frameId);
      if (networkRef.current && renderer.domElement) {
        networkRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [domainData]);

  // Constellation Map Canvas with real data
  useEffect(() => {
    const canvas = constellationRef.current;
    if (!canvas || !domainData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Convert domain data to visualization format
    const domains = Object.entries(domainData.domain_details || {})
      .slice(0, 6)
      .map(([domain, data]: [string, any], i) => ({
        name: domain,
        x: ((i % 3 + 1) * canvas.width / 4),
        y: (Math.floor(i / 3) + 1) * canvas.height / 3,
        percentage: data.percentage,
        count: data.count,
        color: data.percentage > 10 ? '#ff00ff' : 
               data.percentage > 5 ? '#c084fc' : 
               '#00ffff'
      }));

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw constellation connections
      domains.forEach((domain, i) => {
        domains.forEach((target, j) => {
          if (i !== j && Math.abs(i - j) <= 2) {
            const gradient = ctx.createLinearGradient(domain.x, domain.y, target.x, target.y);
            gradient.addColorStop(0, domain.color + '40');
            gradient.addColorStop(1, target.color + '40');
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(domain.x, domain.y);
            ctx.lineTo(target.x, target.y);
            ctx.stroke();
          }
        });
      });

      // Draw domain points
      domains.forEach(domain => {
        const time = Date.now() * 0.001;
        const pulseScale = 1 + Math.sin(time) * 0.1;
        const size = Math.sqrt(domain.count) / 30 * pulseScale;
        
        // Domain glow
        const glow = ctx.createRadialGradient(domain.x, domain.y, 0, domain.x, domain.y, size * 2);
        glow.addColorStop(0, domain.color + '80');
        glow.addColorStop(0.5, domain.color + '40');
        glow.addColorStop(1, domain.color + '00');
        ctx.fillStyle = glow;
        ctx.fillRect(domain.x - size * 2, domain.y - size * 2, size * 4, size * 4);
        
        // Domain core
        ctx.fillStyle = domain.color;
        ctx.beginPath();
        ctx.arc(domain.x, domain.y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(domain.name.substring(0, 20), domain.x, domain.y - size - 10);
        
        // Percentage
        ctx.font = '9px monospace';
        ctx.fillStyle = domain.color;
        ctx.fillText(`${domain.percentage.toFixed(1)}%`, domain.x, domain.y + size + 10);
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, [domainData]);

  // Animate metrics
  useEffect(() => {
    if (domainData && domainData.domain_details) {
      Object.entries(domainData.domain_details).forEach(([domain, data]: [string, any], index) => {
        setTimeout(() => {
          setAnimatedMetrics(prev => ({
            ...prev,
            [domain]: data.percentage
          }));
        }, index * 100);
      });
    }
  }, [domainData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400"></div>
          <div className="mt-4 text-xl font-bold text-cyan-400">LOADING DOMAIN DATA</div>
        </div>
      </div>
    );
  }

  if (error || !domainData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center glass-panel rounded-xl p-8">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <div className="text-xl font-bold text-red-400 mb-2">DATA LOAD ERROR</div>
          <div className="text-sm text-gray-400">{error || 'No data available'}</div>
        </div>
      </div>
    );
  }

  const AlertTriangle = () => (
    <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );

  return (
    <div className="p-4 h-screen bg-black overflow-hidden flex flex-col">
      {/* Domain Selector and Stats */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex gap-2">
          {['all', 'tdc', 'lead', 'corp'].map(domain => (
            <button
              key={domain}
              onClick={() => setSelectedDomain(domain)}
              className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                selectedDomain === domain
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20'
                  : 'bg-gray-900/50 hover:bg-gray-800/50'
              }`}
              style={{
                border: selectedDomain === domain 
                  ? '1px solid #00ffff' 
                  : '1px solid transparent'
              }}
            >
              <span className={selectedDomain === domain ? 'text-blue-400' : 'text-gray-400'}>
                {domain}
              </span>
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <div className="bg-gray-900/30 rounded-lg px-3 py-1.5 border border-gray-800">
            <div className="text-lg font-bold text-white">{domainData.total_analyzed?.toLocaleString() || '0'}</div>
            <div className="text-[9px] text-gray-400">Total Assets</div>
          </div>
          <div className="bg-gray-900/30 rounded-lg px-3 py-1.5 border border-gray-800">
            <div className="text-lg font-bold text-blue-400">{domainData.unique_domains?.length || 0}</div>
            <div className="text-[9px] text-gray-400">Domains</div>
          </div>
          <div className="bg-gray-900/30 rounded-lg px-3 py-1.5 border border-gray-800">
            <div className="text-lg font-bold text-purple-400">
              {domainData.domain_distribution?.tdc_percentage?.toFixed(1) || '0'}%
            </div>
            <div className="text-[9px] text-gray-400">TDC</div>
          </div>
          <div className="bg-gray-900/30 rounded-lg px-3 py-1.5 border border-gray-800">
            <div className="text-lg font-bold text-pink-400">
              {domainData.domain_distribution?.lead_percentage?.toFixed(1) || '0'}%
            </div>
            <div className="text-[9px] text-gray-400">LEAD</div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-12 gap-3">
        {/* 3D Network Visualization */}
        <div className="col-span-7">
          <div className="h-full bg-black border border-blue-500/30 rounded-xl overflow-hidden flex flex-col">
            <div className="p-2 border-b border-blue-500/20">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <Network className="w-3 h-3" />
                Domain Network Topology
              </h3>
            </div>
            <div className="relative flex-1">
              <div ref={networkRef} className="w-full h-full" />
              {hoveredNode && (
                <div className="absolute bottom-2 left-2 bg-black/90 rounded border border-blue-500/30 px-2 py-1">
                  <div className="text-xs font-bold text-blue-400">{hoveredNode}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-5 flex flex-col gap-3">
          {/* Constellation Map */}
          <div className="bg-black border border-pink-500/30 rounded-xl overflow-hidden">
            <div className="p-2 border-b border-pink-500/20">
              <h3 className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-2">
                <Satellite className="w-3 h-3" />
                Domain Constellation
              </h3>
            </div>
            <canvas ref={constellationRef} className="w-full h-[140px]" />
          </div>

          {/* Domain Details Table from Real Data */}
          <div className="flex-1 bg-black border border-blue-500/30 rounded-xl p-3 overflow-hidden">
            <h3 className="text-xs font-bold text-blue-400 mb-2 uppercase">Domain Visibility Details</h3>
            <div className="overflow-x-auto overflow-y-auto h-[calc(100%-24px)]">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-black">
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-1.5 px-2 text-[10px] font-semibold text-gray-400">Domain</th>
                    <th className="text-center py-1.5 px-2 text-[10px] font-semibold text-gray-400">Assets</th>
                    <th className="text-center py-1.5 px-2 text-[10px] font-semibold text-gray-400">Percentage</th>
                    <th className="text-center py-1.5 px-2 text-[10px] font-semibold text-gray-400">Unique Hosts</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(domainData.domain_details || {})
                    .filter(([domain]) => selectedDomain === 'all' || domain.includes(selectedDomain))
                    .slice(0, 15)
                    .map(([domain, data]: [string, any]) => (
                      <tr key={domain} className="border-b border-gray-800 hover:bg-gray-900/30 transition-colors">
                        <td className="py-1.5 px-2 text-white font-medium truncate">{domain}</td>
                        <td className="py-1.5 px-2 text-center font-mono text-gray-300 text-[10px]">
                          {data.count.toLocaleString()}
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className={`font-mono font-bold text-[10px] ${
                              data.percentage < 5 ? 'text-blue-400' : 
                              data.percentage < 10 ? 'text-purple-400' : 
                              'text-pink-400'
                            }`}>
                              {animatedMetrics[domain]?.toFixed(1) || data.percentage.toFixed(1)}%
                            </span>
                            <div className="w-12 h-1.5 bg-gray-900 rounded-full overflow-hidden">
                              <div 
                                className="h-full transition-all duration-500 bg-gradient-to-r from-blue-400 to-purple-400"
                                style={{ width: `${animatedMetrics[domain] || data.percentage}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-1.5 px-2 text-center font-mono text-purple-400 text-[10px]">
                          {data.unique_hosts || '-'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DomainVisibility;