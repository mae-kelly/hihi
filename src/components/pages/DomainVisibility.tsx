import React, { useState, useEffect, useRef } from 'react';
import { Globe, Shield, Database, Network, Server, Cloud, Activity, Lock, Eye, Layers, Zap, Wifi, Radio, Satellite, Radar, Target, Navigation, Circle, Binary, Cpu } from 'lucide-react';
import * as THREE from 'three';

const DomainVisibility: React.FC = () => {
  const [domainData, setDomainData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [hoveredDomain, setHoveredDomain] = useState<string | null>(null);
  const domainRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLCanvasElement>(null);
  const radarRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/domain_visibility');
        if (!response.ok) throw new Error('Failed to fetch domain data');
        const data = await response.json();
        setDomainData(data);
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

  // 3D Domain Network Visualization
  useEffect(() => {
    if (!domainRef.current || !domainData) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.001);

    const camera = new THREE.PerspectiveCamera(
      60,
      domainRef.current.clientWidth / domainRef.current.clientHeight,
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    
    renderer.setSize(domainRef.current.clientWidth, domainRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    domainRef.current.appendChild(renderer.domElement);

    // Create central hub
    const hubGeometry = new THREE.OctahedronGeometry(15, 2);
    const hubMaterial = new THREE.MeshPhongMaterial({
      color: 0x00d4ff,
      emissive: 0x00d4ff,
      emissiveIntensity: 0.3,
      wireframe: false,
      transparent: true,
      opacity: 0.9
    });
    const hub = new THREE.Mesh(hubGeometry, hubMaterial);
    scene.add(hub);

    // Create domain nodes
    const domains = domainData.domain_breakdown || [];
    const nodes: THREE.Group[] = [];
    const connections: THREE.Line[] = [];
    
    // Focus on TDC and LEAD domains
    const tdcDomains = domains.filter((d: any) => 
      d.domain && (d.domain.toLowerCase().includes('tdc') || d.domain === 'tdc.company.com')
    );
    const leadDomains = domains.filter((d: any) => 
      d.domain && (d.domain.toLowerCase().includes('lead') || d.domain.toLowerCase().includes('fead'))
    );
    const otherDomains = domains.filter((d: any) => 
      d.domain && !d.domain.toLowerCase().includes('tdc') && 
      !d.domain.toLowerCase().includes('lead') && !d.domain.toLowerCase().includes('fead')
    );
    
    // Combine and limit domains for visualization
    const visualDomains = [...tdcDomains, ...leadDomains, ...otherDomains].slice(0, 12);
    
    visualDomains.forEach((domain: any, index: number) => {
      const angle = (index / visualDomains.length) * Math.PI * 2;
      const radius = 80;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = (Math.random() - 0.5) * 30;
      
      const domainGroup = new THREE.Group();
      
      // Domain sphere size based on total hosts
      const size = 5 + Math.log(domain.total_hosts / 1000 + 1) * 3;
      const sphereGeometry = new THREE.SphereGeometry(size, 16, 16);
      
      // Color based on domain type and visibility
      let nodeColor = 0x00d4ff;
      if (domain.domain.toLowerCase().includes('tdc')) {
        nodeColor = domain.visibility_percentage < 40 ? 0xa855f7 : 0x00d4ff;
      } else if (domain.domain.toLowerCase().includes('lead') || domain.domain.toLowerCase().includes('fead')) {
        nodeColor = domain.visibility_percentage < 40 ? 0xa855f7 : 0x00d4ff;
      } else {
        nodeColor = domain.visibility_percentage < 40 ? 0xa855f7 : 0x00d4ff;
      }
      
      const sphereMaterial = new THREE.MeshPhongMaterial({
        color: nodeColor,
        emissive: nodeColor,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.8
      });
      
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      domainGroup.add(sphere);
      
      // Visibility core inside
      const visRadius = size * (domain.visibility_percentage / 100);
      const visGeometry = new THREE.SphereGeometry(visRadius, 12, 12);
      const visMaterial = new THREE.MeshPhongMaterial({
        color: 0x00d4ff,
        emissive: 0x00d4ff,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 1
      });
      const visSphere = new THREE.Mesh(visGeometry, visMaterial);
      domainGroup.add(visSphere);
      
      // Invisible hosts as particles
      const invisibleCount = Math.floor((domain.invisible_hosts / domain.total_hosts) * 30);
      const particlesGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(invisibleCount * 3);
      
      for (let i = 0; i < invisibleCount * 3; i += 3) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const r = size + 2 + Math.random() * 5;
        
        positions[i] = r * Math.sin(phi) * Math.cos(theta);
        positions[i + 1] = r * Math.cos(phi);
        positions[i + 2] = r * Math.sin(phi) * Math.sin(theta);
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
      domainGroup.add(particles);
      
      domainGroup.position.set(x, y, z);
      domainGroup.userData = domain;
      nodes.push(domainGroup);
      scene.add(domainGroup);
      
      // Connection to hub
      const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(x, y, z)
      ];
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: nodeColor,
        transparent: true,
        opacity: domain.visibility_percentage / 100
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      connections.push(line);
      scene.add(line);
    });
    
    // Add data flow particles
    const flowCount = 500;
    const flowGeometry = new THREE.BufferGeometry();
    const flowPositions = new Float32Array(flowCount * 3);
    const flowColors = new Float32Array(flowCount * 3);
    
    for (let i = 0; i < flowCount * 3; i += 3) {
      flowPositions[i] = (Math.random() - 0.5) * 300;
      flowPositions[i + 1] = (Math.random() - 0.5) * 200;
      flowPositions[i + 2] = (Math.random() - 0.5) * 300;
      
      const isVisible = Math.random() > 0.5;
      flowColors[i] = isVisible ? 0 : 0.66;
      flowColors[i + 1] = isVisible ? 1 : 0.33;
      flowColors[i + 2] = isVisible ? 1 : 0.97;
    }
    
    flowGeometry.setAttribute('position', new THREE.BufferAttribute(flowPositions, 3));
    flowGeometry.setAttribute('color', new THREE.BufferAttribute(flowColors, 3));
    
    const flowMaterial = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    });
    
    const flowParticles = new THREE.Points(flowGeometry, flowMaterial);
    scene.add(flowParticles);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const pointLight1 = new THREE.PointLight(0x00d4ff, 1, 300);
    pointLight1.position.set(150, 100, 150);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0xa855f7, 1, 300);
    pointLight2.position.set(-150, -100, -150);
    scene.add(pointLight2);
    
    camera.position.set(0, 50, 200);
    camera.lookAt(0, 0, 0);
    
    // Mouse interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    const handleMouseMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodes, true);
      
      if (intersects.length > 0) {
        const domain = intersects[0].object.parent?.userData || intersects[0].object.userData;
        if (domain && domain.domain) {
          setHoveredDomain(domain.domain);
        }
      } else {
        setHoveredDomain(null);
      }
    };
    
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    
    // Animation
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      // Rotate hub
      hub.rotation.x += 0.005;
      hub.rotation.y += 0.005;
      hub.scale.setScalar(1 + Math.sin(Date.now() * 0.001) * 0.05);
      
      // Animate nodes
      nodes.forEach((node, index) => {
        node.rotation.y += 0.01;
        node.position.y += Math.sin(Date.now() * 0.001 + index) * 0.05;
      });
      
      // Rotate particles
      flowParticles.rotation.y += 0.0005;
      
      // Camera orbit
      const time = Date.now() * 0.0003;
      camera.position.x = Math.sin(time) * 250;
      camera.position.z = Math.cos(time) * 250;
      camera.position.y = 50 + Math.sin(time * 2) * 30;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    return () => {
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      if (frameId) cancelAnimationFrame(frameId);
      if (domainRef.current && renderer.domElement) {
        domainRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [domainData]);
  
  // Domain Flow Visualization
  useEffect(() => {
    const canvas = flowRef.current;
    if (!canvas || !domainData) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const domains = domainData.domain_breakdown || [];
      let displayDomains = domains;
      
      if (selectedDomain === 'tdc') {
        displayDomains = domains.filter((d: any) => d.domain && d.domain.toLowerCase().includes('tdc'));
      } else if (selectedDomain === 'lead') {
        displayDomains = domains.filter((d: any) => d.domain && (d.domain.toLowerCase().includes('lead') || d.domain.toLowerCase().includes('fead')));
      }
      
      displayDomains.slice(0, 10).forEach((domain: any, index: number) => {
        const y = (index + 1) * (canvas.height / 11);
        const barWidth = (canvas.width * 0.8) * (domain.visibility_percentage / 100);
        
        // Visibility bar
        const gradient = ctx.createLinearGradient(0, y, barWidth, y);
        gradient.addColorStop(0, domain.status === 'CRITICAL' ? '#a855f7' : '#00d4ff');
        gradient.addColorStop(1, domain.status === 'CRITICAL' ? '#a855f740' : '#00d4ff40');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 20;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(10, y);
        ctx.lineTo(barWidth, y);
        ctx.stroke();
        
        // Invisible portion
        ctx.strokeStyle = '#a855f720';
        ctx.beginPath();
        ctx.moveTo(barWidth, y);
        ctx.lineTo(canvas.width * 0.8, y);
        ctx.stroke();
        
        // Domain name
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(domain.domain.substring(0, 25), 10, y - 25);
        
        // Percentage
        ctx.fillStyle = domain.status === 'CRITICAL' ? '#a855f7' : '#00d4ff';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(`${domain.visibility_percentage.toFixed(1)}%`, barWidth + 10, y + 5);
        
        // Host counts
        ctx.fillStyle = '#ffffff60';
        ctx.font = '9px monospace';
        ctx.fillText(
          `${domain.visible_hosts.toLocaleString()} / ${domain.total_hosts.toLocaleString()}`,
          10,
          y + 15
        );
      });
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }, [domainData, selectedDomain]);
  
  // Radar Visualization
  useEffect(() => {
    const canvas = radarRef.current;
    if (!canvas || !domainData) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) - 20;
    
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
      
      // Draw domain segments
      const domains = domainData.domain_breakdown?.slice(0, 8) || [];
      const segmentCount = domains.length;
      
      domains.forEach((domain: any, index: number) => {
        const startAngle = (index / segmentCount) * Math.PI * 2;
        const endAngle = ((index + 1) / segmentCount) * Math.PI * 2;
        const radius = (domain.visibility_percentage / 100) * maxRadius;
        
        // Draw segment
        ctx.fillStyle = domain.status === 'CRITICAL' ? 'rgba(168, 85, 247, 0.3)' :
                       domain.status === 'WARNING' ? 'rgba(255, 170, 0, 0.3)' :
                       'rgba(0, 212, 255, 0.3)';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fill();
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
  
  if (!domainData) return null;
  
  const tdcData = domainData.tdc_visibility || {};
  const leadData = domainData.lead_visibility || {};
  const overallVisibility = domainData.overall_domain_visibility || 0;
  const criticalDomains = domainData.critical_domains || [];
  
  return (
    <div className="h-full flex flex-col p-4">
      {/* Critical Alert */}
      {criticalDomains.length > 3 && (
        <div className="mb-3 bg-black border border-purple-500/50 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-purple-400 animate-pulse" />
            <span className="text-purple-400 font-bold text-sm">CRITICAL:</span>
            <span className="text-white text-sm">
              {criticalDomains.length} domains below 40% visibility
            </span>
          </div>
        </div>
      )}
      
      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-12 gap-4">
        {/* 3D Domain Network */}
        <div className="col-span-7">
          <div className="h-full glass-panel rounded-xl">
            <div className="p-3 border-b border-cyan-400/20">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-cyan-400">DOMAIN VISIBILITY NETWORK</h2>
                <div className="flex gap-2">
                  {['all', 'tdc', 'lead'].map(domain => (
                    <button
                      key={domain}
                      onClick={() => setSelectedDomain(domain)}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                        selectedDomain === domain
                          ? 'bg-cyan-400/20 border border-cyan-400 text-cyan-400'
                          : 'bg-black/50 border border-gray-700 text-gray-400'
                      }`}
                    >
                      {domain.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div ref={domainRef} className="w-full" style={{ height: 'calc(100% - 60px)' }} />
            
            {hoveredDomain && (
              <div className="absolute bottom-4 left-4 bg-black/90 rounded-lg border border-cyan-400/30 p-3">
                <div className="text-sm font-bold text-cyan-400">{hoveredDomain}</div>
                <div className="text-xs text-white">
                  Click to focus • Scroll to zoom
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Column */}
        <div className="col-span-5 space-y-3">
          {/* Overall Domain Stats */}
          <div className="glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">OVERALL DOMAIN VISIBILITY</h3>
              <Globe className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="text-3xl font-bold text-cyan-400 mb-2">
              {overallVisibility.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-400">
              Across {domainData.total_domains || 0} domains
            </div>
          </div>
          
          {/* TDC and LEAD Cards */}
          <div className="grid grid-cols-2 gap-2">
            {/* TDC Card */}
            <div className="glass-panel rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <Network className="w-4 h-4 text-cyan-400" />
                <span className={`text-xs px-2 py-1 rounded ${
                  tdcData.status === 'CRITICAL' 
                    ? 'bg-purple-500/20 text-purple-400'
                    : tdcData.status === 'WARNING'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-cyan-500/20 text-cyan-400'
                }`}>
                  {tdcData.status || 'N/A'}
                </span>
              </div>
              <div className="text-xs font-bold text-white mb-1">TDC DOMAIN</div>
              <div className="text-2xl font-bold text-cyan-400">
                {tdcData.visibility_percentage?.toFixed(1) || '0.0'}%
              </div>
              <div className="text-xs text-gray-400">
                {tdcData.visible_hosts?.toLocaleString() || 0} / {tdcData.total_hosts?.toLocaleString() || 0}
              </div>
            </div>
            
            {/* LEAD Card */}
            <div className="glass-panel rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <Server className="w-4 h-4 text-cyan-400" />
                <span className={`text-xs px-2 py-1 rounded ${
                  leadData.status === 'CRITICAL' 
                    ? 'bg-purple-500/20 text-purple-400'
                    : leadData.status === 'WARNING'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-cyan-500/20 text-cyan-400'
                }`}>
                  {leadData.status || 'N/A'}
                </span>
              </div>
              <div className="text-xs font-bold text-white mb-1">LEAD/FEAD DOMAIN</div>
              <div className="text-2xl font-bold text-cyan-400">
                {leadData.visibility_percentage?.toFixed(1) || '0.0'}%
              </div>
              <div className="text-xs text-gray-400">
                {leadData.visible_hosts?.toLocaleString() || 0} / {leadData.total_hosts?.toLocaleString() || 0}
              </div>
            </div>
          </div>
          
          {/* Domain Flow */}
          <div className="glass-panel rounded-xl p-3">
            <h3 className="text-sm font-bold text-purple-400 mb-2">DOMAIN VISIBILITY FLOW</h3>
            <canvas ref={flowRef} className="w-full h-48" />
          </div>
          
          {/* Domain Radar */}
          <div className="glass-panel rounded-xl p-3">
            <h3 className="text-sm font-bold text-cyan-400 mb-2">DOMAIN RADAR</h3>
            <canvas ref={radarRef} className="w-full h-32" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DomainVisibility;