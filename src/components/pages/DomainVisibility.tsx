// src/components/pages/DomainVisibility.tsx
import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Globe, Shield, Database, Network, Server, Cloud, Activity, Lock, Eye, Layers, Zap, AlertTriangle, Binary, Wifi, Target, Cpu, CheckCircle, XCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area, ScatterChart, Scatter } from 'recharts';

const DomainVisibility = () => {
  const [domainData, setDomainData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [hoveredMetric, setHoveredMetric] = useState(null);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [selectedDomainDetail, setSelectedDomainDetail] = useState(null);
  const threeDRef = useRef(null);
  const networkRef = useRef(null);
  const rendererRef = useRef(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const frameCount = useRef(0);

  // NEON PASTEL COLORS - GLOWING VERSIONS ONLY
  const COLORS = {
    cyan: '#7dffff',     // Neon pastel cyan
    purple: '#b19dff',   // Neon pastel purple
    pink: '#ff9ec7',     // Neon pastel pink
    white: '#ffffff',
    black: '#000000'
  };

  // Convert hex to Three.js color
  const hexToThree = (hex) => {
    return parseInt(hex.replace('#', '0x'));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/domain_visibility/breakdown');
        if (!response.ok) throw new Error('Failed to fetch domain data');
        const data = await response.json();
        setDomainData(data);
      } catch (error) {
        console.error('Error fetching domain data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Mouse tracking for parallax
  useEffect(() => {
    const handleMouseMove = (e) => {
      mousePos.current = { 
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1
      };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Epic 3D Domain Sphere Visualization
  useEffect(() => {
    if (!threeDRef.current || !domainData || loading) return;

    if (rendererRef.current) {
      rendererRef.current.dispose();
      if (threeDRef.current.contains(rendererRef.current.domElement)) {
        threeDRef.current.removeChild(rendererRef.current.domElement);
      }
    }

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.002);
    
    const camera = new THREE.PerspectiveCamera(75, threeDRef.current.clientWidth / threeDRef.current.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    rendererRef.current = renderer;
    
    renderer.setSize(threeDRef.current.clientWidth, threeDRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    threeDRef.current.appendChild(renderer.domElement);

    const sphereRadius = 35;
    const percentages = domainData?.domain_percentages || {};
    
    // Create segmented sphere with shader material
    const sphereGroup = new THREE.Group();
    
    // Main sphere with custom shader for neon glow
    const sphereGeometry = new THREE.SphereGeometry(sphereRadius, 128, 128);
    const sphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        mousePos: { value: new THREE.Vector2(0, 0) },
        domains: { value: new THREE.Vector4(
          (percentages['1dc_only'] || 0) / 100,
          (percentages.fead_only || 0) / 100,
          (percentages.both_domains || 0) / 100,
          (percentages.other || 0) / 100
        )}
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec2 mousePos;
        uniform vec4 domains;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        
        void main() {
          float angle = atan(vPosition.x, vPosition.z);
          float normalizedAngle = (angle + 3.14159) / (2.0 * 3.14159);
          
          vec3 color;
          if (normalizedAngle < domains.x) {
            color = vec3(0.49, 1.0, 1.0); // Neon cyan for 1DC
          } else if (normalizedAngle < domains.x + domains.y) {
            color = vec3(0.694, 0.616, 1.0); // Neon purple for FEAD
          } else if (normalizedAngle < domains.x + domains.y + domains.z) {
            color = vec3(0.49, 1.0, 1.0); // Neon cyan for both
          } else {
            color = vec3(1.0, 0.62, 0.78); // Neon pink for other
          }
          
          float intensity = pow(0.8 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          float pulse = sin(time * 2.0 + length(vPosition) * 0.1) * 0.2 + 0.8;
          
          color *= intensity * pulse * 1.5;
          
          gl_FragColor = vec4(color, intensity * 0.9);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphereGroup.add(sphere);

    // Inner black sphere
    const innerGeometry = new THREE.SphereGeometry(sphereRadius - 1, 64, 64);
    const innerMaterial = new THREE.MeshPhongMaterial({
      color: hexToThree(COLORS.black),
      emissive: hexToThree(COLORS.purple),
      emissiveIntensity: 0.02
    });
    const innerSphere = new THREE.Mesh(innerGeometry, innerMaterial);
    sphereGroup.add(innerSphere);

    // Wireframe overlay with neon glow
    const wireGeometry = new THREE.SphereGeometry(sphereRadius + 0.5, 32, 32);
    const wireMaterial = new THREE.MeshBasicMaterial({
      color: hexToThree(COLORS.cyan),
      wireframe: true,
      transparent: true,
      opacity: 0.2
    });
    const wireMesh = new THREE.Mesh(wireGeometry, wireMaterial);
    sphereGroup.add(wireMesh);

    // Data rings around sphere
    for (let i = 1; i <= 3; i++) {
      const ringRadius = sphereRadius + i * 8;
      const ringGeometry = new THREE.TorusGeometry(ringRadius, 0.5, 8, 100);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: i === 1 ? hexToThree(COLORS.cyan) : 
               i === 2 ? hexToThree(COLORS.purple) : 
               hexToThree(COLORS.pink),
        transparent: true,
        opacity: 0.4
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2 + (i * 0.1);
      sphereGroup.add(ring);
    }

    scene.add(sphereGroup);

    // Data flow particles with neon colors
    const particleCount = 1500;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      const radius = sphereRadius + Math.random() * 30;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi);
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      
      // Neon colors only
      const colorChoice = Math.random();
      if (colorChoice < 0.33) {
        colors[i * 3] = 0.49;      // Neon cyan
        colors[i * 3 + 1] = 1.0;
        colors[i * 3 + 2] = 1.0;
      } else if (colorChoice < 0.66) {
        colors[i * 3] = 0.694;     // Neon purple
        colors[i * 3 + 1] = 0.616;
        colors[i * 3 + 2] = 1.0;
      } else {
        colors[i * 3] = 1.0;       // Neon pink
        colors[i * 3 + 1] = 0.62;
        colors[i * 3 + 2] = 0.78;
      }
      
      sizes[i] = Math.random() * 2;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const particlesMaterial = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Holographic grid
    const gridHelper = new THREE.GridHelper(150, 30, hexToThree(COLORS.cyan), hexToThree(COLORS.purple));
    gridHelper.material.opacity = 0.1;
    gridHelper.material.transparent = true;
    gridHelper.position.y = -50;
    scene.add(gridHelper);

    // Neon lighting
    const ambientLight = new THREE.AmbientLight(hexToThree(COLORS.white), 0.3);
    scene.add(ambientLight);
    
    const pointLight1 = new THREE.PointLight(hexToThree(COLORS.cyan), 1.5, 200);
    pointLight1.position.set(80, 80, 80);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(hexToThree(COLORS.purple), 1.2, 200);
    pointLight2.position.set(-80, -80, -80);
    scene.add(pointLight2);

    camera.position.set(0, 0, 100);
    camera.lookAt(0, 0, 0);

    // Animation loop
    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      frameCount.current++;
      
      const elapsedTime = clock.getElapsedTime();
      
      // Update shader uniforms
      sphereMaterial.uniforms.time.value = elapsedTime;
      sphereMaterial.uniforms.mousePos.value = mousePos.current;
      
      // Rotate sphere group
      sphereGroup.rotation.y += 0.002 * animationSpeed;
      
      // Rotate rings at different speeds
      sphereGroup.children.forEach((child, idx) => {
        if (child.geometry?.type === 'TorusGeometry') {
          child.rotation.z += 0.01 * (idx + 1);
          child.rotation.y += 0.005 * (idx + 1);
        }
      });
      
      // Particle animation
      particles.rotation.y -= 0.001 * animationSpeed;
      const particlePositions = particlesGeometry.getAttribute('position').array;
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        particlePositions[i3 + 1] += Math.sin(elapsedTime * 0.5 + i * 0.1) * 0.05;
      }
      particlesGeometry.getAttribute('position').needsUpdate = true;
      
      // Camera movement with mouse
      camera.position.x = mousePos.current.x * 30;
      camera.position.y = mousePos.current.y * 20;
      camera.lookAt(0, 0, 0);
      
      // Dynamic lighting
      pointLight1.position.x = Math.sin(elapsedTime * 0.5) * 100;
      pointLight1.position.z = Math.cos(elapsedTime * 0.5) * 100;
      pointLight1.intensity = 1.5 + Math.sin(elapsedTime * 2) * 0.3;
      
      renderer.render(scene, camera);
    };
    
    animate();

    // Handle resize
    const handleResize = () => {
      if (threeDRef.current) {
        camera.aspect = threeDRef.current.clientWidth / threeDRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(threeDRef.current.clientWidth, threeDRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current && threeDRef.current) {
        threeDRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [domainData, loading, animationSpeed]);

  // Network Flow Animation Canvas
  useEffect(() => {
    const canvas = networkRef.current;
    if (!canvas || !domainData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let animationId;
    const nodes = [];
    const connections = [];

    // Create domain nodes with neon colors
    const domains = ['1DC', 'FEAD', 'BOTH', 'OTHER'];
    
    domains.forEach((domain, index) => {
      const angle = (index / domains.length) * Math.PI * 2;
      const radius = 60;
      nodes.push({
        x: canvas.width / 2 + Math.cos(angle) * radius,
        y: canvas.height / 2 + Math.sin(angle) * radius,
        label: domain,
        radius: 15,
        color: domain === '1DC' ? COLORS.cyan : 
               domain === 'FEAD' ? COLORS.purple : 
               domain === 'BOTH' ? COLORS.cyan : COLORS.pink
      });
    });

    // Create connections
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        connections.push({ from: i, to: j, particles: [] });
      }
    }

    const animate = () => {
      // Fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw connections with neon glow
      connections.forEach(conn => {
        const from = nodes[conn.from];
        const to = nodes[conn.to];
        
        ctx.strokeStyle = COLORS.cyan + '33';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 20;
        ctx.shadowColor = COLORS.cyan;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Animate particles
        if (Math.random() < 0.02) {
          conn.particles.push({ progress: 0 });
        }
        
        conn.particles = conn.particles.filter(p => {
          p.progress += 0.02;
          if (p.progress > 1) return false;
          
          const x = from.x + (to.x - from.x) * p.progress;
          const y = from.y + (to.y - from.y) * p.progress;
          
          ctx.fillStyle = COLORS.cyan;
          ctx.shadowBlur = 15;
          ctx.shadowColor = COLORS.cyan;
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          return true;
        });
      });

      // Draw nodes with neon glow
      nodes.forEach(node => {
        // Outer glow
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius * 2);
        gradient.addColorStop(0, node.color);
        gradient.addColorStop(1, node.color + '00');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Node core
        ctx.fillStyle = node.color;
        ctx.shadowBlur = 30;
        ctx.shadowColor = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Node label
        ctx.fillStyle = COLORS.white;
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.label, node.x, node.y);
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [domainData]);

  // Ultra cool loading animation
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh', 
        backgroundColor: COLORS.black,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 50% 50%, ${COLORS.cyan}22, transparent 70%)`,
          animation: 'pulse 3s ease-in-out infinite'
        }} />
        
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto' }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              border: `2px solid ${COLORS.cyan}`,
              borderRadius: '50%',
              borderTopColor: 'transparent',
              animation: 'spin 1s linear infinite',
              boxShadow: `0 0 30px ${COLORS.cyan}, inset 0 0 30px ${COLORS.cyan}44`
            }} />
            <div style={{
              position: 'absolute',
              inset: '10px',
              border: `2px solid ${COLORS.purple}`,
              borderRadius: '50%',
              borderRightColor: 'transparent',
              animation: 'spin 1.5s linear infinite reverse',
              boxShadow: `0 0 30px ${COLORS.purple}, inset 0 0 30px ${COLORS.purple}44`
            }} />
            <div style={{
              position: 'absolute',
              inset: '20px',
              border: `2px solid ${COLORS.pink}`,
              borderRadius: '50%',
              borderBottomColor: 'transparent',
              animation: 'spin 2s linear infinite',
              boxShadow: `0 0 30px ${COLORS.pink}, inset 0 0 30px ${COLORS.pink}44`
            }} />
          </div>
          
          <div style={{ 
            marginTop: '24px', 
            fontSize: '11px', 
            textTransform: 'uppercase', 
            letterSpacing: '0.3em',
            color: COLORS.white,
            textShadow: `0 0 20px ${COLORS.cyan}`,
            opacity: 0.9
          }}>
            Analyzing Domains
          </div>
        </div>
        
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  const totalHosts = domainData?.total_hosts || 0;
  const distribution = domainData?.domain_distribution || {};
  const percentages = domainData?.domain_percentages || {};
  const coverage = domainData?.domain_coverage || {};
  const warfareStatus = domainData?.warfare_status || 'UNKNOWN';

  // Prepare real data for charts
  const domainPieData = [
    { name: '1DC Only', value: percentages['1dc_only'] || 0, fill: COLORS.cyan },
    { name: 'FEAD Only', value: percentages.fead_only || 0, fill: COLORS.purple },
    { name: 'Both Domains', value: percentages.both_domains || 0, fill: COLORS.cyan },
    { name: 'Other', value: percentages.other || 0, fill: COLORS.pink }
  ];

  const coverageBarData = Object.entries(coverage).map(([domain, data]) => ({
    domain: domain.toUpperCase().substring(0, 8),
    cmdb: data.cmdb_coverage,
    tanium: data.tanium_coverage,
    splunk: data.splunk_coverage
  }));

  const radarData = Object.entries(coverage).map(([domain, data]) => ({
    subject: domain.toUpperCase().substring(0, 6),
    cmdb: data.cmdb_coverage || 0,
    tanium: data.tanium_coverage || 0,
    splunk: data.splunk_coverage || 0
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload[0]) {
      return (
        <div style={{ 
          backgroundColor: 'rgba(0,0,0,0.95)',
          padding: '12px',
          borderRadius: '8px',
          border: `1px solid ${COLORS.cyan}44`,
          backdropFilter: 'blur(10px)',
          boxShadow: `0 8px 32px ${COLORS.cyan}33, 0 0 40px ${COLORS.cyan}22`
        }}>
          <p style={{ color: COLORS.white, fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: COLORS.white, fontSize: '11px', opacity: 0.8 }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ 
      padding: '20px',
      height: '100%',
      overflow: 'auto',
      backgroundColor: COLORS.black,
      position: 'relative'
    }}>
      {/* Animated background */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: `
          radial-gradient(circle at 20% 50%, ${COLORS.cyan}11, transparent 50%),
          radial-gradient(circle at 80% 50%, ${COLORS.purple}11, transparent 50%),
          radial-gradient(circle at 50% 100%, ${COLORS.pink}11, transparent 50%)
        `,
        pointerEvents: 'none',
        animation: 'backgroundShift 20s ease-in-out infinite'
      }} />
      
      {/* Header with Warfare Status */}
      <div style={{ marginBottom: '28px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ 
              fontSize: '28px',
              fontWeight: 'bold',
              color: COLORS.white,
              letterSpacing: '-0.5px',
              textShadow: `0 0 40px ${COLORS.cyan}, 0 0 80px ${COLORS.cyan}66`
            }}>
              DOMAIN VISIBILITY ANALYSIS
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: COLORS.cyan,
                    boxShadow: `0 0 20px ${COLORS.cyan}, 0 0 40px ${COLORS.cyan}`,
                    animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
                  }} />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    backgroundColor: COLORS.cyan
                  }} />
                </div>
                <span style={{ fontSize: '11px', color: COLORS.cyan, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Active
                </span>
              </div>
              
              <p style={{ fontSize: '11px', color: `${COLORS.white}99`, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                Hostname & domain mapping • {frameCount.current} frames
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '10px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              backgroundColor: warfareStatus === 'BALANCED' ? `${COLORS.cyan}22` :
                            warfareStatus === '1DC DOMINANT' ? `${COLORS.cyan}22` :
                            warfareStatus === 'FEAD DOMINANT' ? `${COLORS.purple}22` :
                            `${COLORS.pink}22`,
              color: warfareStatus === 'BALANCED' ? COLORS.cyan :
                    warfareStatus === '1DC DOMINANT' ? COLORS.cyan :
                    warfareStatus === 'FEAD DOMINANT' ? COLORS.purple :
                    COLORS.pink,
              border: `1px solid ${warfareStatus === 'BALANCED' ? COLORS.cyan :
                                 warfareStatus === '1DC DOMINANT' ? COLORS.cyan :
                                 warfareStatus === 'FEAD DOMINANT' ? COLORS.purple :
                                 COLORS.pink}66`,
              boxShadow: `0 0 20px ${warfareStatus === 'BALANCED' ? COLORS.cyan :
                                    warfareStatus === '1DC DOMINANT' ? COLORS.cyan :
                                    warfareStatus === 'FEAD DOMINANT' ? COLORS.purple :
                                    COLORS.pink}44`
            }}>
              {warfareStatus}
            </span>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Network size={20} style={{ color: COLORS.cyan, filter: `drop-shadow(0 0 20px ${COLORS.cyan})` }} />
              <span style={{ fontSize: '11px', color: `${COLORS.white}99` }}>{totalHosts.toLocaleString()} Hosts</span>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
          {['overview', 'distribution', 'coverage', 'details'].map(tab => (
            <button 
              key={tab}
              onClick={() => setSelectedTab(tab)}
              style={{
                padding: '10px 20px',
                fontSize: '11px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                borderRadius: '6px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                backgroundColor: selectedTab === tab ? `${COLORS.purple}33` : 'transparent',
                color: selectedTab === tab ? COLORS.white : `${COLORS.white}99`,
                border: selectedTab === tab ? `1px solid ${COLORS.purple}66` : '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 4px 12px ${COLORS.purple}22`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Alert for Domain Imbalance */}
      {(percentages['1dc_only'] > 60 || percentages.fead_only > 60) && (
        <div style={{
          marginBottom: '20px',
          padding: '12px 16px',
          background: `linear-gradient(90deg, ${COLORS.pink}22, ${COLORS.pink}11)`,
          border: `1px solid ${COLORS.pink}66`,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: `0 0 30px ${COLORS.pink}44, inset 0 0 20px ${COLORS.pink}22`
        }}>
          <AlertTriangle size={20} style={{ color: COLORS.pink, filter: `drop-shadow(0 0 10px ${COLORS.pink})` }} />
          <span style={{ fontSize: '12px', color: COLORS.pink, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Imbalance:
          </span>
          <span style={{ fontSize: '11px', color: COLORS.white, opacity: 0.9 }}>
            {percentages['1dc_only'] > 60 ? `1DC dominance at ${percentages['1dc_only'].toFixed(1)}%` : 
             `FEAD dominance at ${percentages.fead_only.toFixed(1)}%`}
          </span>
        </div>
      )}

      {/* Key Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Total Hosts', value: totalHosts.toLocaleString(), icon: Server, color: COLORS.cyan },
          { label: '1DC Only', value: `${percentages['1dc_only']?.toFixed(1)}%`, icon: Network, color: COLORS.cyan },
          { label: 'FEAD Only', value: `${percentages.fead_only?.toFixed(1)}%`, icon: Wifi, color: COLORS.purple },
          { label: 'Both Domains', value: `${percentages.both_domains?.toFixed(1)}%`, icon: Layers, color: COLORS.cyan },
          { label: 'Other', value: `${percentages.other?.toFixed(1)}%`, icon: Globe, color: COLORS.pink },
          { label: 'Domains', value: Object.keys(coverage).length, icon: Shield, color: COLORS.purple }
        ].map((metric, idx) => (
          <div 
            key={idx}
            onMouseEnter={() => setHoveredMetric(idx)}
            onMouseLeave={() => setHoveredMetric(null)}
            style={{
              backgroundColor: COLORS.black,
              border: hoveredMetric === idx ? `1px solid ${metric.color}` : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '16px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
              transform: hoveredMetric === idx ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
              boxShadow: hoveredMetric === idx ? `0 20px 60px ${metric.color}66, 0 0 60px ${metric.color}44` : `0 0 20px ${metric.color}22`,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '9px', color: `${COLORS.white}66`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>{metric.label}</p>
                <p style={{ fontSize: '18px', fontWeight: 'bold', color: COLORS.white }}>{metric.value}</p>
              </div>
              <metric.icon size={18} style={{ 
                color: metric.color,
                filter: `drop-shadow(0 0 20px ${metric.color}) drop-shadow(0 0 40px ${metric.color})`
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Based on Tab */}
      {selectedTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '28px' }}>
          {/* 3D Sphere */}
          <div style={{ 
            backgroundColor: COLORS.black,
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              inset: '-2px',
              background: `linear-gradient(45deg, ${COLORS.cyan}, ${COLORS.purple}, ${COLORS.pink}, ${COLORS.cyan})`,
              borderRadius: '12px',
              opacity: 0.3,
              animation: 'gradientRotate 4s linear infinite',
              zIndex: -1
            }} />
            
            <h2 style={{ fontSize: '12px', fontWeight: '600', color: `${COLORS.white}cc`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
              Domain Sphere
            </h2>
            <div ref={threeDRef} style={{ height: '240px' }} />
          </div>

          {/* Pie Chart */}
          <div style={{ 
            backgroundColor: COLORS.black,
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h2 style={{ fontSize: '12px', fontWeight: '600', color: `${COLORS.white}cc`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
              Domain Distribution
            </h2>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie 
                  data={domainPieData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={40}
                  outerRadius={80} 
                  paddingAngle={3}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1000}
                  onClick={(data) => setSelectedDomainDetail(data)}
                >
                  {domainPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Radar Chart */}
          <div style={{ 
            backgroundColor: COLORS.black,
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h2 style={{ fontSize: '12px', fontWeight: '600', color: `${COLORS.white}cc`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
              Coverage Radar
            </h2>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" stroke={`${COLORS.white}66`} tick={{ fontSize: 8 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke={`${COLORS.white}66`} tick={{ fontSize: 8 }} />
                <Radar name="CMDB" dataKey="cmdb" stroke={COLORS.cyan} fill={COLORS.cyan} fillOpacity={0.3} />
                <Radar name="Tanium" dataKey="tanium" stroke={COLORS.purple} fill={COLORS.purple} fillOpacity={0.3} />
                <Radar name="Splunk" dataKey="splunk" stroke={COLORS.pink} fill={COLORS.pink} fillOpacity={0.3} />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {selectedTab === 'distribution' && (
        <div style={{ marginBottom: '28px' }}>
          {/* Network Flow */}
          <div style={{ 
            backgroundColor: COLORS.black,
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h2 style={{ fontSize: '12px', fontWeight: '600', color: `${COLORS.white}cc`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
              Domain Network Flow
            </h2>
            <canvas ref={networkRef} style={{ width: '100%', height: '200px' }} />
          </div>
        </div>
      )}

      {selectedTab === 'coverage' && (
        <div style={{ marginBottom: '28px' }}>
          {/* Coverage Bar Chart */}
          <div style={{ 
            backgroundColor: COLORS.black,
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h2 style={{ fontSize: '12px', fontWeight: '600', color: `${COLORS.white}cc`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
              Domain Security Coverage
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={coverageBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey="domain" stroke={`${COLORS.white}66`} tick={{ fontSize: 10, fill: `${COLORS.white}66` }} />
                <YAxis stroke={`${COLORS.white}66`} tick={{ fontSize: 10, fill: `${COLORS.white}66` }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                <Bar dataKey="cmdb" fill={COLORS.cyan} radius={[8, 8, 0, 0]} />
                <Bar dataKey="tanium" fill={COLORS.purple} radius={[8, 8, 0, 0]} />
                <Bar dataKey="splunk" fill={COLORS.pink} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Data Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        {/* Distribution Table */}
        <div style={{ 
          backgroundColor: COLORS.black,
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h2 style={{ fontSize: '12px', fontWeight: '600', color: `${COLORS.white}cc`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
            Domain Distribution
          </h2>
          <table style={{ width: '100%', fontSize: '11px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ textAlign: 'left', padding: '8px 0', color: `${COLORS.white}66` }}>Domain</th>
                <th style={{ textAlign: 'right', padding: '8px 0', color: `${COLORS.white}66` }}>Hosts</th>
                <th style={{ textAlign: 'right', padding: '8px 0', color: `${COLORS.white}66` }}>Share</th>
                <th style={{ textAlign: 'center', padding: '8px 0', color: `${COLORS.white}66` }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(distribution).map(([domain, count], idx) => {
                const percentage = percentages[domain] || 0;
                return (
                  <tr 
                    key={idx} 
                    style={{ 
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <td style={{ padding: '12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {domain.includes('1dc') ? <Network size={14} style={{ color: COLORS.cyan, filter: `drop-shadow(0 0 10px ${COLORS.cyan})` }} /> :
                       domain.includes('fead') ? <Wifi size={14} style={{ color: COLORS.purple, filter: `drop-shadow(0 0 10px ${COLORS.purple})` }} /> :
                       domain.includes('both') ? <Layers size={14} style={{ color: COLORS.cyan, filter: `drop-shadow(0 0 10px ${COLORS.cyan})` }} /> :
                       <Globe size={14} style={{ color: COLORS.pink, filter: `drop-shadow(0 0 10px ${COLORS.pink})` }} />}
                      <span style={{ color: COLORS.white }}>{domain.replace('_', ' ').toUpperCase()}</span>
                    </td>
                    <td style={{ textAlign: 'right', padding: '12px 0', color: `${COLORS.white}cc` }}>{count.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', padding: '12px 0' }}>
                      <span style={{ 
                        fontWeight: 'bold',
                        color: domain.includes('both') ? COLORS.cyan :
                               domain.includes('1dc') ? COLORS.cyan :
                               domain.includes('fead') ? COLORS.purple :
                               COLORS.pink,
                        textShadow: `0 0 10px ${domain.includes('both') ? COLORS.cyan :
                                              domain.includes('1dc') ? COLORS.cyan :
                                              domain.includes('fead') ? COLORS.purple :
                                              COLORS.pink}`
                      }}>
                        {percentage.toFixed(1)}%
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', padding: '12px 0' }}>
                      {percentage > 40 ? 
                        <CheckCircle size={14} style={{ color: COLORS.cyan, filter: `drop-shadow(0 0 10px ${COLORS.cyan})` }} /> :
                        percentage > 20 ?
                        <AlertTriangle size={14} style={{ color: COLORS.purple, filter: `drop-shadow(0 0 10px ${COLORS.purple})` }} /> :
                        <XCircle size={14} style={{ color: COLORS.pink, filter: `drop-shadow(0 0 10px ${COLORS.pink})` }} />
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Coverage Table */}
        <div style={{ 
          backgroundColor: COLORS.black,
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h2 style={{ fontSize: '12px', fontWeight: '600', color: `${COLORS.white}cc`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
            Coverage Analysis
          </h2>
          <table style={{ width: '100%', fontSize: '11px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ textAlign: 'left', padding: '8px 0', color: `${COLORS.white}66` }}>Domain</th>
                <th style={{ textAlign: 'right', padding: '8px 0', color: `${COLORS.white}66` }}>Assets</th>
                <th style={{ textAlign: 'right', padding: '8px 0', color: `${COLORS.white}66` }}>CMDB</th>
                <th style={{ textAlign: 'right', padding: '8px 0', color: `${COLORS.white}66` }}>Tanium</th>
                <th style={{ textAlign: 'center', padding: '8px 0', color: `${COLORS.white}66` }}>Risk</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(coverage).map(([domain, data], idx) => {
                const avgCoverage = (data.cmdb_coverage + data.tanium_coverage + data.splunk_coverage) / 3;
                return (
                  <tr 
                    key={idx} 
                    style={{ 
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <td style={{ padding: '12px 0', color: COLORS.white }}>{domain.toUpperCase()}</td>
                    <td style={{ textAlign: 'right', padding: '12px 0', color: `${COLORS.white}cc` }}>{data.total_assets.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', padding: '12px 0' }}>
                      <span style={{ 
                        color: data.cmdb_coverage > 70 ? COLORS.cyan : 
                               data.cmdb_coverage > 40 ? COLORS.purple : COLORS.pink,
                        textShadow: `0 0 10px ${data.cmdb_coverage > 70 ? COLORS.cyan : 
                                               data.cmdb_coverage > 40 ? COLORS.purple : COLORS.pink}`
                      }}>
                        {data.cmdb_coverage.toFixed(1)}%
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', padding: '12px 0' }}>
                      <span style={{ 
                        color: data.tanium_coverage > 70 ? COLORS.cyan : 
                               data.tanium_coverage > 40 ? COLORS.purple : COLORS.pink,
                        textShadow: `0 0 10px ${data.tanium_coverage > 70 ? COLORS.cyan : 
                                               data.tanium_coverage > 40 ? COLORS.purple : COLORS.pink}`
                      }}>
                        {data.tanium_coverage.toFixed(1)}%
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', padding: '12px 0' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '9px',
                        fontWeight: '600',
                        backgroundColor: avgCoverage > 70 ? `${COLORS.cyan}22` :
                                        avgCoverage > 40 ? `${COLORS.purple}22` :
                                        `${COLORS.pink}22`,
                        color: avgCoverage > 70 ? COLORS.cyan :
                              avgCoverage > 40 ? COLORS.purple :
                              COLORS.pink,
                        border: `1px solid ${avgCoverage > 70 ? COLORS.cyan :
                                            avgCoverage > 40 ? COLORS.purple :
                                            COLORS.pink}44`,
                        boxShadow: `0 0 10px ${avgCoverage > 70 ? COLORS.cyan :
                                              avgCoverage > 40 ? COLORS.purple :
                                              COLORS.pink}44`
                      }}>
                        {avgCoverage > 70 ? 'LOW' : avgCoverage > 40 ? 'MED' : 'HIGH'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        @keyframes backgroundShift {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes gradientRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default DomainVisibility;