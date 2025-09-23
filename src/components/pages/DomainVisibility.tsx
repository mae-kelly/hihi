import React, { useState, useEffect, useRef } from 'react';
import { Globe, Shield, Database, Network, Server, Cloud, Activity, Lock, Eye, Layers, Zap, AlertTriangle, X, ChevronRight, Binary, Wifi, Target, Cpu } from 'lucide-react';
import * as THREE from 'three';

const DomainVisibility = () => {
  const [domainData, setDomainData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [hoveredDomain, setHoveredDomain] = useState(null);
  const [detailPanel, setDetailPanel] = useState(null);
  const [hostDetails, setHostDetails] = useState(null);
  const domainSphereRef = useRef(null);
  const matrixFlowRef = useRef(null);
  const radarRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const frameRef = useRef(null);
  const domainMeshesRef = useRef([]);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

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
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Search for hosts in specific domains
  const searchDomainHosts = async (domainType) => {
    try {
      const response = await fetch(`http://localhost:5000/api/host_search?q=${domainType}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Search error:', error);
      return null;
    }
  };

  // 3D Domain Sphere - Segmented visualization showing domain distribution
  useEffect(() => {
    if (!domainSphereRef.current || !domainData || loading) return;

    if (rendererRef.current) {
      rendererRef.current.dispose();
      if (domainSphereRef.current.contains(rendererRef.current.domElement)) {
        domainSphereRef.current.removeChild(rendererRef.current.domElement);
      }
    }

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x000000, 0.002);

    const camera = new THREE.PerspectiveCamera(
      60,
      domainSphereRef.current.clientWidth / domainSphereRef.current.clientHeight,
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    
    rendererRef.current = renderer;
    renderer.setSize(domainSphereRef.current.clientWidth, domainSphereRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    domainSphereRef.current.appendChild(renderer.domElement);

    // Clear previous meshes
    domainMeshesRef.current = [];

    // Main container group
    const domainGroup = new THREE.Group();

    // Domain data
    const tdcCount = domainData.domain_analysis?.tdc || 0;
    const feadCount = domainData.domain_analysis?.fead || 0;
    const otherCount = domainData.domain_analysis?.other || 0;
    const totalCount = tdcCount + feadCount + otherCount;

    const tdcPercentage = (tdcCount / totalCount) * 100;
    const feadPercentage = (feadCount / totalCount) * 100;
    const otherPercentage = (otherCount / totalCount) * 100;

    // Create segmented sphere representing domain distribution
    const sphereRadius = 40;
    const sphereSegments = 64;
    
    // TDC Segment (Top hemisphere)
    if (tdcCount > 0 && (selectedDomain === 'all' || selectedDomain === 'tdc')) {
      const tdcAngle = (tdcPercentage / 100) * Math.PI * 2;
      const tdcGeometry = new THREE.SphereGeometry(
        sphereRadius, 
        sphereSegments, 
        sphereSegments,
        0, tdcAngle,
        0, Math.PI / 2
      );
      
      const tdcMaterial = new THREE.MeshPhongMaterial({
        color: 0x00d4ff,
        emissive: 0x00d4ff,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      });
      
      const tdcMesh = new THREE.Mesh(tdcGeometry, tdcMaterial);
      tdcMesh.userData = {
        domain: 'TDC',
        count: tdcCount,
        percentage: tdcPercentage
      };
      domainMeshesRef.current.push(tdcMesh);
      domainGroup.add(tdcMesh);

      // TDC inner core showing actual visibility
      const tdcCoreRadius = sphereRadius * 0.7 * (tdcPercentage / 100);
      const tdcCoreGeometry = new THREE.SphereGeometry(tdcCoreRadius, 32, 32);
      const tdcCoreMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.9
      });
      const tdcCore = new THREE.Mesh(tdcCoreGeometry, tdcCoreMaterial);
      tdcCore.position.y = 10;
      domainGroup.add(tdcCore);
    }

    // FEAD Segment (Middle belt)
    if (feadCount > 0 && (selectedDomain === 'all' || selectedDomain === 'fead')) {
      const feadAngle = (feadPercentage / 100) * Math.PI * 2;
      const feadGeometry = new THREE.SphereGeometry(
        sphereRadius,
        sphereSegments,
        sphereSegments,
        tdcPercentage ? (tdcPercentage / 100) * Math.PI * 2 : 0,
        feadAngle,
        Math.PI / 3, Math.PI / 3
      );
      
      const feadMaterial = new THREE.MeshPhongMaterial({
        color: 0xa855f7,
        emissive: 0xa855f7,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      });
      
      const feadMesh = new THREE.Mesh(feadGeometry, feadMaterial);
      feadMesh.userData = {
        domain: 'FEAD',
        count: feadCount,
        percentage: feadPercentage
      };
      domainMeshesRef.current.push(feadMesh);
      domainGroup.add(feadMesh);

      // FEAD data rings
      for (let i = 0; i < 3; i++) {
        const ringRadius = sphereRadius + (i + 1) * 5;
        const ringGeometry = new THREE.TorusGeometry(ringRadius, 1, 8, 100);
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: 0xa855f7,
          transparent: true,
          opacity: 0.3 - i * 0.1
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        ring.userData = { type: 'ring', domain: 'FEAD' };
        domainGroup.add(ring);
      }
    }

    // OTHER Segment (Bottom hemisphere)
    if (otherCount > 0 && (selectedDomain === 'all' || selectedDomain === 'other')) {
      const otherGeometry = new THREE.SphereGeometry(
        sphereRadius,
        sphereSegments,
        sphereSegments,
        0, Math.PI * 2,
        Math.PI / 2, Math.PI / 2
      );
      
      const otherMaterial = new THREE.MeshPhongMaterial({
        color: 0xffaa00,
        emissive: 0xffaa00,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      });
      
      const otherMesh = new THREE.Mesh(otherGeometry, otherMaterial);
      otherMesh.userData = {
        domain: 'OTHER',
        count: otherCount,
        percentage: otherPercentage
      };
      domainMeshesRef.current.push(otherMesh);
      domainGroup.add(otherMesh);
    }

    // Add grid lines for better visualization
    const gridGeometry = new THREE.SphereGeometry(sphereRadius + 0.5, 32, 32);
    const gridMaterial = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      wireframe: true,
      transparent: true,
      opacity: 0.1
    });
    const gridMesh = new THREE.Mesh(gridGeometry, gridMaterial);
    domainGroup.add(gridMesh);

    // Add data flow particles around domains
    const particleCount = 1000;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const radius = sphereRadius + Math.random() * 40;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi);
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      
      // Color based on domain
      const domainChoice = Math.random();
      if (domainChoice < tdcPercentage / 100) {
        colors[i * 3] = 0;
        colors[i * 3 + 1] = 0.83;
        colors[i * 3 + 2] = 1;
      } else if (domainChoice < (tdcPercentage + feadPercentage) / 100) {
        colors[i * 3] = 0.66;
        colors[i * 3 + 1] = 0.33;
        colors[i * 3 + 2] = 0.97;
      } else {
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 0.67;
        colors[i * 3 + 2] = 0;
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

    scene.add(domainGroup);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00d4ff, 2, 200);
    pointLight1.position.set(100, 100, 100);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xa855f7, 1, 200);
    pointLight2.position.set(-100, -100, -100);
    scene.add(pointLight2);

    const spotLight = new THREE.SpotLight(0x00d4ff, 1);
    spotLight.position.set(0, 100, 50);
    spotLight.target = domainGroup;
    scene.add(spotLight);

    // Mouse interaction
    const handleMouseMove = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(domainMeshesRef.current);
      
      if (intersects.length > 0) {
        const hoveredMesh = intersects[0].object;
        setHoveredDomain(hoveredMesh.userData);
        document.body.style.cursor = 'pointer';
        hoveredMesh.material.emissiveIntensity = 0.5;
      } else {
        setHoveredDomain(null);
        document.body.style.cursor = 'default';
        domainMeshesRef.current.forEach(mesh => {
          if (mesh.material) mesh.material.emissiveIntensity = 0.2;
        });
      }
    };

    const handleClick = async (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(domainMeshesRef.current);
      
      if (intersects.length > 0) {
        const clickedMesh = intersects[0].object;
        const domainInfo = clickedMesh.userData;
        
        const hostData = await searchDomainHosts(domainInfo.domain.toLowerCase());
        setDetailPanel({
          ...domainInfo,
          hosts: hostData?.hosts || [],
          totalHosts: hostData?.total_found || 0
        });
      }
    };

    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('click', handleClick);

    camera.position.set(0, 0, 150);
    camera.lookAt(0, 0, 0);

    // Animation
    const animate = () => {
      if (!sceneRef.current) return;
      frameRef.current = requestAnimationFrame(animate);
      
      domainGroup.rotation.y += 0.003;
      domainGroup.rotation.x = Math.sin(Date.now() * 0.0005) * 0.1;
      
      particles.rotation.y += 0.001;
      
      // Pulse rings
      domainGroup.children.forEach(child => {
        if (child.userData?.type === 'ring') {
          child.scale.setScalar(1 + Math.sin(Date.now() * 0.002) * 0.05);
        }
      });
      
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('click', handleClick);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (domainSphereRef.current && domainSphereRef.current.contains(rendererRef.current.domElement)) {
          domainSphereRef.current.removeChild(rendererRef.current.domElement);
        }
      }
    };
  }, [domainData, selectedDomain, loading]);

  // Matrix Flow Visualization - Shows data flow between domains
  useEffect(() => {
    const canvas = matrixFlowRef.current;
    if (!canvas || !domainData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let animationId;
    let particles = [];
    
    // Initialize flow particles
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        domain: ['tdc', 'fead', 'other'][Math.floor(Math.random() * 3)],
        size: Math.random() * 3 + 1,
        trail: []
      });
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        // Store trail
        particle.trail.push({ x: particle.x, y: particle.y });
        if (particle.trail.length > 20) particle.trail.shift();
        
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Bounce off walls
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
        
        // Draw trail
        particle.trail.forEach((point, idx) => {
          const alpha = idx / particle.trail.length * 0.5;
          const color = particle.domain === 'tdc' ? `rgba(0, 212, 255, ${alpha})` :
                       particle.domain === 'fead' ? `rgba(168, 85, 247, ${alpha})` :
                       `rgba(255, 170, 0, ${alpha})`;
          
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(point.x, point.y, particle.size * (idx / particle.trail.length), 0, Math.PI * 2);
          ctx.fill();
        });
        
        // Draw particle
        const gradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.size * 3);
        const baseColor = particle.domain === 'tdc' ? '0, 212, 255' :
                         particle.domain === 'fead' ? '168, 85, 247' :
                         '255, 170, 0';
        
        gradient.addColorStop(0, `rgba(${baseColor}, 1)`);
        gradient.addColorStop(0.5, `rgba(${baseColor}, 0.5)`);
        gradient.addColorStop(1, `rgba(${baseColor}, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [domainData]);

  // Radar Scanner Visualization
  useEffect(() => {
    const canvas = radarRef.current;
    if (!canvas || !domainData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let animationId;
    let sweepAngle = 0;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxRadius = Math.min(centerX, centerY) - 10;

      // Draw radar circles
      for (let i = 1; i <= 4; i++) {
        ctx.strokeStyle = `rgba(0, 212, 255, ${0.2 - i * 0.03})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, (maxRadius / 4) * i, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw domain sectors
      const domains = ['tdc', 'fead', 'other'];
      const domainData_ = domainData.domain_analysis || {};
      const total = Object.values(domainData_).reduce((sum, val) => sum + val, 1);
      
      let startAngle = 0;
      domains.forEach(domain => {
        const count = domainData_[domain] || 0;
        const percentage = count / total;
        const endAngle = startAngle + percentage * Math.PI * 2;
        
        // Draw sector
        ctx.fillStyle = domain === 'tdc' ? 'rgba(0, 212, 255, 0.1)' :
                       domain === 'fead' ? 'rgba(168, 85, 247, 0.1)' :
                       'rgba(255, 170, 0, 0.1)';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, maxRadius, startAngle, endAngle);
        ctx.closePath();
        ctx.fill();
        
        // Draw domain points
        const numPoints = Math.max(3, Math.floor(count / 500));
        for (let i = 0; i < numPoints; i++) {
          const angle = startAngle + (endAngle - startAngle) * Math.random();
          const radius = Math.random() * maxRadius;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          
          ctx.fillStyle = domain === 'tdc' ? 'rgba(0, 212, 255, 0.8)' :
                         domain === 'fead' ? 'rgba(168, 85, 247, 0.8)' :
                         'rgba(255, 170, 0, 0.8)';
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        
        startAngle = endAngle;
      });

      // Draw sweep line
      sweepAngle += 0.02;
      const sweepGradient = ctx.createLinearGradient(
        centerX, centerY,
        centerX + Math.cos(sweepAngle) * maxRadius,
        centerY + Math.sin(sweepAngle) * maxRadius
      );
      sweepGradient.addColorStop(0, 'rgba(0, 212, 255, 0)');
      sweepGradient.addColorStop(0.5, 'rgba(0, 212, 255, 0.5)');
      sweepGradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
      
      ctx.strokeStyle = sweepGradient;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(sweepAngle) * maxRadius,
        centerY + Math.sin(sweepAngle) * maxRadius
      );
      ctx.stroke();

      // Draw trail
      for (let i = 1; i < 10; i++) {
        const trailAngle = sweepAngle - i * 0.1;
        ctx.strokeStyle = `rgba(0, 212, 255, ${0.3 - i * 0.03})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + Math.cos(trailAngle) * maxRadius,
          centerY + Math.sin(trailAngle) * maxRadius
        );
        ctx.stroke();
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
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

      {/* Domain Selector */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex gap-2">
          {['all', 'tdc', 'fead', 'other'].map(domain => (
            <button
              key={domain}
              onClick={() => setSelectedDomain(domain)}
              className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                selectedDomain === domain
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400'
                  : 'bg-gray-900/50 hover:bg-gray-800/50 border border-transparent'
              }`}
            >
              <span className={selectedDomain === domain ? 'text-cyan-400' : 'text-gray-400'}>
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
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-12 gap-3">
        {/* 3D Domain Sphere */}
        <div className="col-span-7">
          <div className="h-full bg-black border border-cyan-400/30 rounded-xl overflow-hidden flex flex-col">
            <div className="p-2 border-b border-cyan-400/20">
              <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-3 h-3" />
                INTERACTIVE DOMAIN SPHERE - SEGMENTED VISIBILITY
              </h3>
              <p className="text-[9px] text-gray-400 mt-1">Click segments to explore domain hosts • Size represents host count</p>
            </div>
            <div className="relative flex-1">
              <div ref={domainSphereRef} className="w-full h-full" />
              {hoveredDomain && (
                <div className="absolute bottom-2 left-2 bg-black/90 rounded border border-cyan-400/30 px-2 py-1">
                  <div className="text-xs font-bold text-cyan-400">{hoveredDomain.domain}</div>
                  <div className="text-xs text-white">Count: {hoveredDomain.count?.toLocaleString()}</div>
                  <div className="text-xs text-cyan-400">Coverage: {hoveredDomain.percentage?.toFixed(1)}%</div>
                  <div className="text-[10px] text-gray-400 mt-1">Click for detailed analysis</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-5 flex flex-col gap-3">
          {/* Matrix Flow */}
          <div className="bg-black border border-purple-500/30 rounded-xl overflow-hidden">
            <div className="p-2 border-b border-purple-500/20">
              <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-3 h-3" />
                DOMAIN DATA FLOW MATRIX
              </h3>
            </div>
            <canvas ref={matrixFlowRef} className="w-full h-[120px]" />
          </div>

          {/* Radar Scanner */}
          <div className="bg-black border border-cyan-400/30 rounded-xl overflow-hidden">
            <div className="p-2 border-b border-cyan-400/20">
              <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <Target className="w-3 h-3" />
                DOMAIN RADAR SCANNER
              </h3>
            </div>
            <canvas ref={radarRef} className="w-full h-[120px]" />
          </div>

          {/* Domain Distribution Bars */}
          <div className="bg-black border border-cyan-400/30 rounded-xl p-3">
            <h3 className="text-xs font-bold text-cyan-400 mb-2 uppercase">Real-Time Distribution</h3>
            <div className="space-y-2">
              {[
                { name: 'TDC', percentage: tdcPercentage, count: domainData?.domain_analysis?.tdc || 0, color: 'cyan' },
                { name: 'FEAD', percentage: feadPercentage, count: domainData?.domain_analysis?.fead || 0, color: 'purple' },
                { name: 'OTHER', percentage: otherPercentage, count: domainData?.domain_analysis?.other || 0, color: 'yellow' }
              ].map(domain => (
                <div key={domain.name} 
                     className="cursor-pointer hover:bg-cyan-400/5 p-1 rounded transition-all"
                     onClick={async () => {
                       const hostData = await searchDomainHosts(domain.name.toLowerCase());
                       setDetailPanel({
                         domain: domain.name,
                         count: domain.count,
                         percentage: domain.percentage,
                         hosts: hostData?.hosts || [],
                         totalHosts: hostData?.total_found || 0
                       });
                     }}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-400 uppercase">{domain.name}</span>
                    <span className="text-xs text-white">{domain.count.toLocaleString()} hosts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-3 bg-gray-900 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          domain.color === 'cyan' ? 'bg-gradient-to-r from-cyan-400 to-cyan-600' :
                          domain.color === 'purple' ? 'bg-gradient-to-r from-purple-400 to-purple-600' :
                          'bg-gradient-to-r from-yellow-400 to-yellow-600'
                        }`}
                        style={{ width: `${domain.percentage}%` }}
                      />
                    </div>
                    <span className={`text-sm font-bold ${
                      domain.color === 'cyan' ? 'text-cyan-400' :
                      domain.color === 'purple' ? 'text-purple-400' :
                      'text-yellow-400'
                    } min-w-[50px] text-right`}>
                      {domain.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Warfare Intelligence */}
          {domainData?.warfare_intelligence && (
            <div className="bg-black border border-purple-500/30 rounded-xl p-3">
              <h3 className="text-xs font-bold text-purple-400 mb-2 uppercase">Warfare Intelligence</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-black/50 rounded p-2">
                  <div className="text-xs text-gray-400">Dominant</div>
                  <div className="text-lg font-bold text-cyan-400">{dominantDomain.toUpperCase()}</div>
                </div>
                <div className="bg-black/50 rounded p-2">
                  <div className="text-xs text-gray-400">Status</div>
                  <div className={`text-lg font-bold ${
                    tacticalStatus === 'BALANCED' ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {tacticalStatus}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {detailPanel && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-6">
          <div className="bg-black border-2 border-cyan-400/50 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-cyan-400/30 flex items-center justify-between">
              <h2 className="text-xl font-bold text-cyan-400">
                {detailPanel.domain} DOMAIN ANALYSIS
              </h2>
              <button onClick={() => setDetailPanel(null)} className="text-white hover:text-cyan-400">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-black/50 border border-cyan-400/30 rounded-lg p-4">
                  <div className="text-2xl font-bold text-white">{detailPanel.count?.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">Total Hosts</div>
                </div>
                <div className="bg-black/50 border border-cyan-400/30 rounded-lg p-4">
                  <div className="text-2xl font-bold text-cyan-400">{detailPanel.percentage?.toFixed(1)}%</div>
                  <div className="text-xs text-gray-400">Coverage</div>
                </div>
                <div className="bg-black/50 border border-purple-400/30 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-400">
                    {detailPanel.totalHosts || detailPanel.hosts?.length || 0}
                  </div>
                  <div className="text-xs text-gray-400">Sample Results</div>
                </div>
              </div>

              {detailPanel.hosts && detailPanel.hosts.length > 0 && (
                <div className="bg-black/50 border border-cyan-400/30 rounded-lg overflow-hidden">
                  <div className="p-3 border-b border-cyan-400/20">
                    <h3 className="text-sm font-bold text-cyan-400">DOMAIN HOSTS</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-black/70 sticky top-0">
                        <tr className="border-b border-cyan-400/20">
                          <th className="text-left p-2 text-cyan-400">Host</th>
                          <th className="text-left p-2 text-cyan-400">Infrastructure</th>
                          <th className="text-left p-2 text-cyan-400">Region</th>
                          <th className="text-center p-2 text-cyan-400">CMDB</th>
                          <th className="text-center p-2 text-cyan-400">Tanium</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailPanel.hosts.slice(0, 50).map((host, idx) => (
                          <tr key={idx} className="border-b border-gray-800 hover:bg-cyan-400/5">
                            <td className="p-2 text-white font-mono">{host.host}</td>
                            <td className="p-2 text-gray-400">{host.infrastructure_type}</td>
                            <td className="p-2 text-gray-400">{host.region}</td>
                            <td className="p-2 text-center">
                              {host.present_in_cmdb?.toLowerCase().includes('yes') ? 
                                <span className="text-cyan-400">✓</span> : 
                                <span className="text-purple-400">✗</span>}
                            </td>
                            <td className="p-2 text-center">
                              {host.tanium_coverage?.toLowerCase().includes('tanium') ? 
                                <span className="text-cyan-400">✓</span> : 
                                <span className="text-purple-400">✗</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

export default DomainVisibility;