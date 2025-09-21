import React, { useState, useEffect, useRef } from 'react';
import { Globe, Shield, Database, Network, Server, Cloud, Activity, Lock, Eye, Layers, Zap, Wifi, Radio, Satellite, Radar, Target, Navigation, Circle } from 'lucide-react';
import * as THREE from 'three';

const DomainVisibility: React.FC = () => {
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [animatedMetrics, setAnimatedMetrics] = useState<Record<string, number>>({});
  const networkRef = useRef<HTMLDivElement>(null);
  const constellationRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Domain visibility data
  const domainData = {
    'External': {
      totalAssets: 45678,
      visibility: 78.9,
      gaps: 9654,
      status: 'active',
      color: '#00ffff',
      domains: [
        { name: 'api.company.com', visibility: 92.3, assets: 5234, risk: 'low' },
        { name: 'portal.company.com', visibility: 85.7, assets: 8901, risk: 'medium' },
        { name: 'cdn.company.com', visibility: 95.1, assets: 3456, risk: 'low' },
        { name: 'services.company.com', visibility: 67.4, assets: 12345, risk: 'high' },
        { name: 'mobile.company.com', visibility: 71.2, assets: 7890, risk: 'medium' }
      ],
      connections: 234,
      dataFlow: '2.4TB/day'
    },
    'Internal': {
      totalAssets: 89012,
      visibility: 45.2,
      gaps: 49093,
      status: 'critical',
      color: '#ff00ff',
      domains: [
        { name: 'intranet.local', visibility: 52.1, assets: 23456, risk: 'high' },
        { name: 'database.internal', visibility: 38.9, assets: 34567, risk: 'critical' },
        { name: 'admin.internal', visibility: 41.3, assets: 12345, risk: 'critical' },
        { name: 'dev.internal', visibility: 67.8, assets: 8901, risk: 'medium' },
        { name: 'staging.internal', visibility: 55.4, assets: 9743, risk: 'high' }
      ],
      connections: 567,
      dataFlow: '5.8TB/day'
    },
    'Cloud': {
      totalAssets: 67234,
      visibility: 62.3,
      gaps: 25322,
      status: 'warning',
      color: '#c084fc',
      domains: [
        { name: 'aws.cloud', visibility: 71.2, assets: 23456, risk: 'medium' },
        { name: 'azure.cloud', visibility: 68.9, assets: 19012, risk: 'medium' },
        { name: 'gcp.cloud', visibility: 58.3, assets: 15678, risk: 'high' },
        { name: 'kubernetes.cloud', visibility: 45.7, assets: 9088, risk: 'critical' }
      ],
      connections: 412,
      dataFlow: '3.9TB/day'
    }
  };

  // 3D Network Visualization
  useEffect(() => {
    if (!networkRef.current) return;

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
    camera.position.set(0, 100, 200);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(networkRef.current.clientWidth, networkRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    networkRef.current.appendChild(renderer.domElement);

    // Create domain nodes
    const nodes: THREE.Mesh[] = [];
    const connections: THREE.Line[] = [];
    
    // Central hub
    const hubGeometry = new THREE.OctahedronGeometry(15, 2);
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

    // Create domain clusters
    Object.entries(domainData).forEach(([domainType, data], typeIndex) => {
      const angleOffset = (typeIndex / 3) * Math.PI * 2;
      const radius = 80;
      
      data.domains.forEach((domain, index) => {
        const angle = angleOffset + (index / data.domains.length) * (Math.PI * 2 / 3);
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = (Math.random() - 0.5) * 40;
        
        // Domain node
        const nodeSize = Math.sqrt(domain.assets) / 50;
        const nodeGeometry = new THREE.SphereGeometry(nodeSize, 16, 16);
        const nodeColor = domain.risk === 'critical' ? 0xff00ff : 
                         domain.risk === 'high' ? 0xc084fc :
                         domain.risk === 'medium' ? 0x00ffff :
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
        node.userData = { domain, type: domainType };
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
          opacity: domain.visibility / 100
        });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        scene.add(line);
        connections.push(line);
        
        // Add orbiting satellites for subdomains
        for (let i = 0; i < 3; i++) {
          const satelliteGeometry = new THREE.TetrahedronGeometry(2);
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
    });

    // Particle field for data flow
    const particleCount = 1000;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 300;
      positions[i + 1] = (Math.random() - 0.5) * 200;
      positions[i + 2] = (Math.random() - 0.5) * 300;
      
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
        setHoveredNode(hoveredNode.userData.domain.name);
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
          child.position.x = parent.position.x + Math.cos(time) * 20;
          child.position.y = parent.position.y;
          child.position.z = parent.position.z + Math.sin(time) * 20;
        }
      });
      
      // Animate particles
      particles.rotation.y += 0.0005;
      
      // Camera orbit
      const time = Date.now() * 0.0003;
      camera.position.x = Math.sin(time) * 250;
      camera.position.z = Math.cos(time) * 250;
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
  }, [selectedDomain]);

  // Constellation Map Canvas
  useEffect(() => {
    const canvas = constellationRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw constellation connections
      Object.entries(domainData).forEach(([domainType, data], typeIndex) => {
        const centerX = (typeIndex + 1) * (canvas.width / 4);
        const centerY = canvas.height / 2;
        
        // Draw central star
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 30);
        gradient.addColorStop(0, data.color);
        gradient.addColorStop(0.5, data.color + '80');
        gradient.addColorStop(1, data.color + '00');
        ctx.fillStyle = gradient;
        ctx.fillRect(centerX - 30, centerY - 30, 60, 60);
        
        // Draw domain points
        data.domains.forEach((domain, index) => {
          const angle = (index / data.domains.length) * Math.PI * 2;
          const radius = 60 + domain.visibility * 0.5;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          
          // Connection line
          ctx.strokeStyle = data.color + '40';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(x, y);
          ctx.stroke();
          
          // Domain point
          ctx.fillStyle = domain.risk === 'critical' ? '#ff00ff' : 
                         domain.risk === 'high' ? '#c084fc' :
                         '#00ffff';
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        });
        
        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(domainType, centerX, centerY - 80);
        
        // Metrics
        ctx.font = '10px monospace';
        ctx.fillStyle = data.color;
        ctx.fillText(`${data.visibility}%`, centerX, centerY + 90);
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  // Animate metrics
  useEffect(() => {
    Object.entries(domainData).forEach(([domain, data], index) => {
      setTimeout(() => {
        setAnimatedMetrics(prev => ({
          ...prev,
          [domain]: data.visibility
        }));
      }, index * 200);
    });
  }, []);

  return (
    <div className="p-8 min-h-screen bg-black">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-black mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          DOMAIN VISIBILITY MATRIX
        </h1>
        <p className="text-gray-400 uppercase tracking-widest text-xs">
          Network Domain Analysis • URL/FQDN Coverage • Real-Time Monitoring
        </p>
      </div>

      {/* Domain Selector */}
      <div className="flex gap-2 mb-8">
        {['all', 'External', 'Internal', 'Cloud'].map(domain => (
          <button
            key={domain}
            onClick={() => setSelectedDomain(domain)}
            className={`px-6 py-3 rounded-lg font-bold uppercase tracking-wider transition-all ${
              selectedDomain === domain
                ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20'
                : 'bg-gray-900/50 hover:bg-gray-800/50'
            }`}
            style={{
              border: selectedDomain === domain 
                ? '2px solid #00ffff' 
                : '2px solid transparent'
            }}
          >
            <span className={selectedDomain === domain ? 'text-blue-400' : 'text-gray-400'}>
              {domain}
            </span>
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        {/* 3D Network Visualization */}
        <div className="col-span-7">
          <div className="bg-black border border-blue-500/30 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-blue-500/20">
              <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <Network className="w-4 h-4" />
                Domain Network Topology
              </h3>
            </div>
            <div ref={networkRef} className="w-full h-[400px]" />
            
            {hoveredNode && (
              <div className="absolute bottom-4 left-4 bg-black/90 rounded-lg border border-blue-500/30 p-3">
                <div className="text-sm font-bold text-blue-400">{hoveredNode}</div>
              </div>
            )}
          </div>
        </div>

        {/* Metrics Panel */}
        <div className="col-span-5 space-y-6">
          {/* Overall Stats */}
          <div className="bg-black border border-purple-500/30 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-purple-400 mb-4 uppercase tracking-wider">
              Domain Statistics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-3xl font-bold text-white">201K</div>
                <div className="text-xs text-gray-400">Total Assets</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-pink-400">84K</div>
                <div className="text-xs text-gray-400">Visibility Gaps</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-400">62.1%</div>
                <div className="text-xs text-gray-400">Avg Visibility</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-400">1,213</div>
                <div className="text-xs text-gray-400">Connections</div>
              </div>
            </div>
          </div>

          {/* Constellation Map */}
          <div className="bg-black border border-pink-500/30 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-pink-500/20">
              <h3 className="text-sm font-bold text-pink-400 uppercase tracking-wider flex items-center gap-2">
                <Satellite className="w-4 h-4" />
                Domain Constellation
              </h3>
            </div>
            <canvas ref={constellationRef} className="w-full h-[200px]" />
          </div>
        </div>
      </div>

      {/* Domain Details Table */}
      <div className="bg-black border border-blue-500/30 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-blue-400 mb-4">DOMAIN VISIBILITY DETAILS</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Domain Type</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">Assets</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">Visibility</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">Gaps</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">Status</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">Data Flow</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(domainData).map(([domain, data]) => (
                <tr key={domain} className="border-b border-gray-800 hover:bg-gray-900/30 transition-colors">
                  <td className="py-3 px-4 text-white font-medium">{domain}</td>
                  <td className="py-3 px-4 text-center font-mono text-gray-300">
                    {data.totalAssets.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className={`font-mono font-bold ${
                        data.visibility < 50 ? 'text-pink-400' : 
                        data.visibility < 80 ? 'text-purple-400' : 
                        'text-blue-400'
                      }`}>
                        {animatedMetrics[domain]?.toFixed(1) || 0}%
                      </span>
                      <div className="w-16 h-2 bg-gray-900 rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all duration-500 bg-gradient-to-r from-blue-400 to-purple-400"
                          style={{ width: `${animatedMetrics[domain] || 0}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-pink-400">
                    {data.gaps.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      data.status === 'critical' ? 'bg-pink-500/20 text-pink-400 border border-pink-500/50' :
                      data.status === 'warning' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' :
                      'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                    }`}>
                      {data.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-purple-400">
                    {data.dataFlow}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DomainVisibility;