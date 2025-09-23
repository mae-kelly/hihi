import React, { useState, useEffect, useRef } from 'react';
import { Globe, Shield, Database, Network, Server, Cloud, Activity, Lock, Eye, Layers, Zap, AlertTriangle } from 'lucide-react';
import * as THREE from 'three';

const DomainVisibility = () => {
  const [domainData, setDomainData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [hoveredNode, setHoveredNode] = useState(null);
  const networkRef = useRef(null);
  const constellationRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/domain_metrics');
        if (!response.ok) throw new Error('Failed to fetch domain data');
        const data = await response.json();
        setDomainData(data);
      } catch (error) {
        console.error('Error:', error);
        setDomainData({
          domain_analysis: { tdc: 0, fead: 0, other: 0 },
          domain_details: {},
          unique_domains: [],
          total_analyzed: 0,
          multi_domain_hosts: 0,
          domain_distribution: {},
          warfare_intelligence: {}
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // 3D Network Visualization
  useEffect(() => {
    if (!networkRef.current || !domainData || loading) return;

    if (rendererRef.current) {
      rendererRef.current.dispose();
      if (networkRef.current.contains(rendererRef.current.domElement)) {
        networkRef.current.removeChild(rendererRef.current.domElement);
      }
    }

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x000000, 0.001);

    const camera = new THREE.PerspectiveCamera(
      60,
      networkRef.current.clientWidth / networkRef.current.clientHeight,
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    
    rendererRef.current = renderer;
    renderer.setSize(networkRef.current.clientWidth, networkRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    networkRef.current.appendChild(renderer.domElement);

    const nodes = [];
    const connections = [];
    
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

    // Create domain clusters based on actual data
    const domainTypes = ['tdc', 'fead', 'other'];
    const domainColors = { tdc: 0x00ffff, fead: 0xff00ff, other: 0xc084fc };
    
    domainTypes.forEach((domainType, typeIndex) => {
      const count = domainData.domain_analysis?.[domainType] || 0;
      const details = domainData.domain_details?.[domainType] || {};
      const percentage = details.percentage || 0;
      
      if (count > 0 && (selectedDomain === 'all' || selectedDomain === domainType)) {
        const angleOffset = (typeIndex / 3) * Math.PI * 2;
        const radius = 60;
        
        // Create multiple nodes for each domain type based on scale
        const nodeCount = Math.min(5, Math.max(1, Math.floor(count / 1000)));
        
        for (let i = 0; i < nodeCount; i++) {
          const angle = angleOffset + (i / nodeCount) * (Math.PI * 2 / 3);
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          const y = (Math.random() - 0.5) * 30;
          
          // Domain node
          const nodeSize = Math.max(5, Math.sqrt(count / nodeCount) / 20);
          const nodeGeometry = new THREE.SphereGeometry(nodeSize, 16, 16);
          const nodeColor = domainColors[domainType];
          
          const nodeMaterial = new THREE.MeshPhongMaterial({
            color: nodeColor,
            emissive: nodeColor,
            emissiveIntensity: 0.2,
            transparent: true,
            opacity: 0.8
          });
          
          const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
          node.position.set(x, y, z);
          node.userData = { 
            domain: domainType.toUpperCase(), 
            count, 
            percentage,
            type: domainType 
          };
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
            opacity: percentage / 100
          });
          const line = new THREE.Line(lineGeometry, lineMaterial);
          scene.add(line);
          connections.push(line);
          
          // Add orbiting satellites for subdomains
          for (let j = 0; j < 2; j++) {
            const satelliteGeometry = new THREE.TetrahedronGeometry(1.5);
            const satelliteMaterial = new THREE.MeshBasicMaterial({
              color: nodeColor,
              transparent: true,
              opacity: 0.5
            });
            const satellite = new THREE.Mesh(satelliteGeometry, satelliteMaterial);
            satellite.userData = { parent: node, offset: j };
            scene.add(satellite);
          }
        }
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
    
    const handleMouseMove = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodes);
      
      nodes.forEach(node => {
        node.scale.setScalar(1);
      });
      
      if (intersects.length > 0) {
        const hoveredNodeMesh = intersects[0].object;
        hoveredNodeMesh.scale.setScalar(1.3);
        setHoveredNode(hoveredNodeMesh.userData);
      } else {
        setHoveredNode(null);
      }
    };
    
    renderer.domElement.addEventListener('mousemove', handleMouseMove);

    camera.position.set(0, 80, 150);
    camera.lookAt(0, 0, 0);

    // Animation loop
    const animate = () => {
      if (!sceneRef.current) return;
      frameRef.current = requestAnimationFrame(animate);
      
      hub.rotation.x += 0.005;
      hub.rotation.y += 0.005;
      
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
      
      particles.rotation.y += 0.0005;
      
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
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (networkRef.current && networkRef.current.contains(rendererRef.current.domElement)) {
          networkRef.current.removeChild(rendererRef.current.domElement);
        }
      }
    };
  }, [domainData, selectedDomain, loading]);

  // Constellation Map Canvas
  useEffect(() => {
    const canvas = constellationRef.current;
    if (!canvas || !domainData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw constellation connections
      const domainTypes = ['tdc', 'fead', 'other'];
      const colors = { tdc: '#00ffff', fead: '#ff00ff', other: '#c084fc' };
      
      domainTypes.forEach((domainType, typeIndex) => {
        const centerX = (typeIndex + 1) * (canvas.width / 4);
        const centerY = canvas.height / 2;
        
        const count = domainData.domain_analysis?.[domainType] || 0;
        const details = domainData.domain_details?.[domainType] || {};
        const percentage = details.percentage || 0;
        
        // Draw central star
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 20);
        gradient.addColorStop(0, colors[domainType]);
        gradient.addColorStop(0.5, colors[domainType] + '80');
        gradient.addColorStop(1, colors[domainType] + '00');
        ctx.fillStyle = gradient;
        ctx.fillRect(centerX - 20, centerY - 20, 40, 40);
        
        // Draw domain points
        const nodeCount = Math.min(5, Math.max(1, Math.floor(count / 1000)));
        for (let i = 0; i < nodeCount; i++) {
          const angle = (i / nodeCount) * Math.PI * 2;
          const radius = 35 + percentage * 0.3;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          
          // Connection line
          ctx.strokeStyle = colors[domainType] + '40';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(x, y);
          ctx.stroke();
          
          // Domain point
          ctx.fillStyle = colors[domainType];
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(domainType.toUpperCase(), centerX, centerY - 50);
        
        // Metrics
        ctx.font = '9px monospace';
        ctx.fillStyle = colors[domainType];
        ctx.fillText(`${percentage.toFixed(1)}%`, centerX, centerY + 55);
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, [domainData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
          <div className="mt-4 text-lg font-bold text-cyan-400">ANALYZING DOMAIN VISIBILITY</div>
        </div>
      </div>
    );
  }

  const totalAnalyzed = domainData?.total_analyzed || 0;
  const uniqueDomains = domainData?.unique_domains?.length || 0;
  const multiDomainHosts = domainData?.multi_domain_hosts || 0;
  const tdcPercentage = domainData?.domain_distribution?.tdc_percentage || 0;
  const feadPercentage = domainData?.domain_distribution?.fead_percentage || 0;
  const otherPercentage = domainData?.domain_distribution?.other_percentage || 0;
  const dominantDomain = domainData?.warfare_intelligence?.dominant_domain || 'unknown';
  const tacticalStatus = domainData?.warfare_intelligence?.tactical_status || 'UNKNOWN';

  return (
    <div className="p-4 h-screen bg-black overflow-hidden flex flex-col">
      {tacticalStatus !== 'BALANCED' && (
        <div className="mb-3 bg-black border border-purple-500/50 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-purple-400 animate-pulse" />
            <span className="text-purple-400 font-bold text-sm">DOMAIN IMBALANCE:</span>
            <span className="text-white text-sm">
              {dominantDomain.toUpperCase()} domain is dominant with {Math.max(tdcPercentage, feadPercentage, otherPercentage).toFixed(1)}% coverage
            </span>
          </div>
        </div>
      )}

      {/* Domain Selector and Stats */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex gap-2">
          {['all', 'tdc', 'fead', 'other'].map(domain => (
            <button
              key={domain}
              onClick={() => setSelectedDomain(domain)}
              className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                selectedDomain === domain
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-cyan-400'
                  : 'bg-gray-900/50 hover:bg-gray-800/50 border border-transparent'
              }`}
            >
              <span className={selectedDomain === domain ? 'text-blue-400' : 'text-gray-400'}>
                {domain}
              </span>
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <div className="bg-gray-900/30 rounded-lg px-3 py-1.5 border border-gray-800">
            <div className="text-lg font-bold text-white">{totalAnalyzed.toLocaleString()}</div>
            <div className="text-[9px] text-gray-400">Total Analyzed</div>
          </div>
          <div className="bg-gray-900/30 rounded-lg px-3 py-1.5 border border-gray-800">
            <div className="text-lg font-bold text-cyan-400">{uniqueDomains}</div>
            <div className="text-[9px] text-gray-400">Unique Domains</div>
          </div>
          <div className="bg-gray-900/30 rounded-lg px-3 py-1.5 border border-gray-800">
            <div className="text-lg font-bold text-purple-400">{multiDomainHosts}</div>
            <div className="text-[9px] text-gray-400">Multi-Domain</div>
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
                  <div className="text-xs font-bold text-blue-400">{hoveredNode.domain}</div>
                  <div className="text-xs text-white">Count: {hoveredNode.count?.toLocaleString()}</div>
                  <div className="text-xs text-cyan-400">Coverage: {hoveredNode.percentage?.toFixed(1)}%</div>
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
                <Globe className="w-3 h-3" />
                Domain Constellation
              </h3>
            </div>
            <canvas ref={constellationRef} className="w-full h-[140px]" />
          </div>

          {/* Domain Distribution */}
          <div className="bg-black border border-blue-500/30 rounded-xl p-3">
            <h3 className="text-xs font-bold text-blue-400 mb-2 uppercase">Domain Distribution</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">TDC</span>
                <div className="flex items-center gap-2 flex-1 ml-4">
                  <div className="flex-1 h-2 bg-gray-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600 transition-all"
                      style={{ width: `${tdcPercentage}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-cyan-400 min-w-[45px] text-right">
                    {tdcPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">FEAD</span>
                <div className="flex items-center gap-2 flex-1 ml-4">
                  <div className="flex-1 h-2 bg-gray-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all"
                      style={{ width: `${feadPercentage}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-purple-400 min-w-[45px] text-right">
                    {feadPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Other</span>
                <div className="flex items-center gap-2 flex-1 ml-4">
                  <div className="flex-1 h-2 bg-gray-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 transition-all"
                      style={{ width: `${otherPercentage}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-yellow-400 min-w-[45px] text-right">
                    {otherPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Warfare Intelligence */}
          {domainData?.warfare_intelligence && (
            <div className="bg-black border border-purple-500/30 rounded-xl p-3">
              <h3 className="text-xs font-bold text-purple-400 mb-2 uppercase">Warfare Intelligence</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs text-gray-400">Dominant</div>
                  <div className="text-lg font-bold text-cyan-400">{dominantDomain.toUpperCase()}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Status</div>
                  <div className={`text-lg font-bold ${
                    tacticalStatus === 'BALANCED' ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {tacticalStatus}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Balance</div>
                  <div className="text-lg font-bold text-white">
                    {domainData.warfare_intelligence.domain_balance || 0}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Multi-Domain</div>
                  <div className="text-lg font-bold text-purple-400">{multiDomainHosts}</div>
                </div>
              </div>
            </div>
          )}

          {/* Domain Details Table */}
          <div className="flex-1 bg-black border border-blue-500/30 rounded-xl p-3 overflow-hidden">
            <h3 className="text-xs font-bold text-blue-400 mb-2 uppercase">Domain Analysis</h3>
            <div className="overflow-x-auto overflow-y-auto h-[calc(100%-24px)]">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-black">
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-1.5 px-2 text-[10px] font-semibold text-gray-400">Domain</th>
                    <th className="text-center py-1.5 px-2 text-[10px] font-semibold text-gray-400">Count</th>
                    <th className="text-center py-1.5 px-2 text-[10px] font-semibold text-gray-400">%</th>
                    <th className="text-center py-1.5 px-2 text-[10px] font-semibold text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(domainData.domain_analysis || {}).map(([domain, count]) => {
                    const details = domainData.domain_details?.[domain] || {};
                    const percentage = details.percentage || 0;
                    
                    return (
                      <tr key={domain} className="border-b border-gray-800 hover:bg-gray-900/30 transition-colors">
                        <td className="py-1.5 px-2 text-white font-medium uppercase">{domain}</td>
                        <td className="py-1.5 px-2 text-center font-mono text-gray-300">
                          {count.toLocaleString()}
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className={`font-mono font-bold ${
                              percentage < 30 ? 'text-pink-400' : 
                              percentage < 60 ? 'text-purple-400' : 
                              'text-blue-400'
                            }`}>
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            percentage < 30 ? 'bg-pink-500/20 text-pink-400 border border-pink-500/50' :
                            percentage < 60 ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' :
                            'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                          }`}>
                            {percentage < 30 ? 'CRITICAL' : percentage < 60 ? 'WARNING' : 'GOOD'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Unique Domains */}
          {domainData?.unique_domains?.length > 0 && (
            <div className="bg-black border border-cyan-500/30 rounded-xl p-3 max-h-32 overflow-y-auto">
              <h3 className="text-xs font-bold text-cyan-400 mb-2 uppercase">Sample Unique Domains</h3>
              <div className="flex flex-wrap gap-1">
                {domainData.unique_domains.slice(0, 20).map((domain, idx) => (
                  <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-cyan-500/10 border border-cyan-500/30 rounded text-cyan-400">
                    {domain}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DomainVisibility;