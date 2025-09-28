// src/components/pages/GlobalView.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Globe, AlertTriangle, Database, Shield, Activity, Server, Cloud, BarChart3, TrendingUp, Users, MapPin, Zap, Wifi, Eye, Lock } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area, ScatterChart, Scatter } from 'recharts';

const GlobalView = () => {
  const [globalData, setGlobalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [hoveredMetric, setHoveredMetric] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [pulseSpeed, setPulseSpeed] = useState(1);
  const globeRef = useRef(null);
  const rendererRef = useRef(null);
  const frameCount = useRef(0);
  const mousePos = useRef({ x: 0, y: 0 });
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  // NEON PASTEL COLORS - GLOWING VERSIONS
  const COLORS = {
    cyan: '#7dffff',     // Neon pastel cyan - glowing
    purple: '#b19dff',   // Neon pastel purple - glowing
    pink: '#ff9ec7',     // Neon pastel pink - glowing
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
        const response = await fetch('http://localhost:5000/api/global_view/summary');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setGlobalData(data);
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

  // EPIC 3D Globe Visualization
  useEffect(() => {
    if (!globeRef.current || !globalData || loading) return;

    if (rendererRef.current) {
      rendererRef.current.dispose();
      if (globeRef.current.contains(rendererRef.current.domElement)) {
        globeRef.current.removeChild(rendererRef.current.domElement);
      }
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, globeRef.current.clientWidth / globeRef.current.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    rendererRef.current = renderer;
    
    renderer.setSize(globeRef.current.clientWidth, globeRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    globeRef.current.appendChild(renderer.domElement);

    // Globe group for all elements
    const globeGroup = new THREE.Group();

    // Main globe - pure black with pastel glow
    const globeGeometry = new THREE.SphereGeometry(45, 128, 128);
    const globeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        mousePos: { value: new THREE.Vector2(0, 0) }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec2 mousePos;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          float intensity = pow(0.8 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          vec3 atmosphere = mix(vec3(0.49, 1.0, 1.0), vec3(0.694, 0.616, 1.0), sin(time * 0.5) * 0.5 + 0.5);
          atmosphere *= intensity * 1.5; // Brighter glow
          
          float pulse = sin(time * 2.0 + length(vPosition) * 0.1) * 0.2 + 0.8;
          
          gl_FragColor = vec4(atmosphere * pulse, intensity * 0.8);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    globeGroup.add(globe);

    // Inner core - black
    const coreGeometry = new THREE.SphereGeometry(44, 64, 64);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: hexToThree(COLORS.black),
      emissive: hexToThree(COLORS.purple),
      emissiveIntensity: 0.02
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    globeGroup.add(core);

    // Animated wireframe grid
    const wireGeometry = new THREE.SphereGeometry(46, 32, 32);
    const wireMaterial = new THREE.MeshBasicMaterial({
      color: hexToThree(COLORS.cyan),
      wireframe: true,
      transparent: true,
      opacity: 0.15
    });
    const wireMesh = new THREE.Mesh(wireGeometry, wireMaterial);
    globeGroup.add(wireMesh);

    // Data visualization from real API data
    const regions = globalData?.regional_breakdown || [];
    const dataPointsGroup = new THREE.Group();
    
    regions.forEach((region, idx) => {
      // Calculate position on sphere
      const phi = (90 - (idx * 30 - 60)) * Math.PI / 180;
      const theta = (idx * 60) * Math.PI / 180;
      const radius = 48;
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);

      // Create data beacon based on real coverage
      const beaconGroup = new THREE.Group();
      
      // Outer glow ring
      const ringGeometry = new THREE.TorusGeometry(4, 0.3, 8, 100);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: region.cmdb_coverage > 70 ? hexToThree(COLORS.cyan) :
               region.cmdb_coverage > 40 ? hexToThree(COLORS.purple) :
               hexToThree(COLORS.pink),
        transparent: true,
        opacity: 0.4
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.random() * Math.PI;
      beaconGroup.add(ring);
      
      // Pulsing sphere based on visibility
      const pulseSize = 2 + (region.overall_visibility / 50);
      const pulseGeometry = new THREE.SphereGeometry(pulseSize, 16, 16);
      const pulseMaterial = new THREE.MeshBasicMaterial({
        color: region.cmdb_coverage > 70 ? hexToThree(COLORS.cyan) :
               region.cmdb_coverage > 40 ? hexToThree(COLORS.purple) :
               hexToThree(COLORS.pink),
        transparent: true,
        opacity: 0.3
      });
      const pulseSphere = new THREE.Mesh(pulseGeometry, pulseMaterial);
      beaconGroup.add(pulseSphere);

      // Core data point - always white
      const pointGeometry = new THREE.OctahedronGeometry(1, 0);
      const pointMaterial = new THREE.MeshPhongMaterial({
        color: hexToThree(COLORS.white),
        emissive: hexToThree(COLORS.white),
        emissiveIntensity: 0.5
      });
      const point = new THREE.Mesh(pointGeometry, pointMaterial);
      beaconGroup.add(point);

      // Data label (region name and coverage)
      beaconGroup.userData = { 
        region: region.region, 
        coverage: region.cmdb_coverage,
        assets: region.assets 
      };
      
      beaconGroup.position.set(x, y, z);
      dataPointsGroup.add(beaconGroup);

      // Connection beam to core
      const curvePoints = [];
      for (let i = 0; i <= 30; i++) {
        const t = i / 30;
        const cX = x * t * 0.95;
        const cY = y * t * 0.95;
        const cZ = z * t * 0.95;
        curvePoints.push(new THREE.Vector3(cX, cY, cZ));
      }
      
      const curve = new THREE.CatmullRomCurve3(curvePoints);
      const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.1, 8, false);
      const tubeMaterial = new THREE.MeshBasicMaterial({
        color: hexToThree(COLORS.cyan),
        transparent: true,
        opacity: 0.1
      });
      const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
      dataPointsGroup.add(tube);
    });
    
    globeGroup.add(dataPointsGroup);
    scene.add(globeGroup);

    // Particle field with data flow simulation
    const particleCount = 2000;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      const r = 50 + Math.random() * 100;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      
      // Only use our 3 colors
      const colorChoice = Math.random();
      if (colorChoice < 0.33) {
        colors[i * 3] = 0.659;
        colors[i * 3 + 1] = 0.855;
        colors[i * 3 + 2] = 0.863;
      } else if (colorChoice < 0.66) {
        colors[i * 3] = 0.784;
        colors[i * 3 + 1] = 0.714;
        colors[i * 3 + 2] = 1.0;
      } else {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.686;
        colors[i * 3 + 2] = 0.8;
      }
      
      sizes[i] = Math.random() * 2;
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    const particleSystem = new THREE.Points(particles, particlesMaterial);
    scene.add(particleSystem);

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(hexToThree(COLORS.white), 0.2);
    scene.add(ambientLight);
    
    const pointLight1 = new THREE.PointLight(hexToThree(COLORS.cyan), 0.5, 200);
    pointLight1.position.set(100, 100, 100);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(hexToThree(COLORS.purple), 0.3, 200);
    pointLight2.position.set(-100, -100, -100);
    scene.add(pointLight2);

    camera.position.z = 150;

    // Animation loop
    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      frameCount.current++;
      
      const elapsedTime = clock.getElapsedTime();
      
      // Update shader uniforms
      globeMaterial.uniforms.time.value = elapsedTime;
      globeMaterial.uniforms.mousePos.value = mousePos.current;
      
      // Rotate globe group
      globeGroup.rotation.y += 0.001 * pulseSpeed;
      
      // Counter-rotate wireframe
      wireMesh.rotation.y -= 0.0005 * pulseSpeed;
      wireMesh.rotation.x = Math.sin(elapsedTime * 0.1) * 0.05;
      
      // Animate data points
      dataPointsGroup.children.forEach((child, idx) => {
        if (child.type === 'Group') {
          // Pulsing animation
          const scale = 1 + Math.sin(elapsedTime * 2 + idx) * 0.2;
          child.scale.set(scale, scale, scale);
          
          // Rotate rings
          child.children.forEach((mesh) => {
            if (mesh.geometry.type === 'TorusGeometry') {
              mesh.rotation.z += 0.01;
            }
          });
        }
      });
      
      // Particle animation
      particleSystem.rotation.y += 0.0002;
      const particlePositions = particles.getAttribute('position').array;
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        particlePositions[i3 + 1] += Math.sin(elapsedTime + i * 0.1) * 0.01;
      }
      particles.getAttribute('position').needsUpdate = true;
      
      // Camera movement based on mouse
      camera.position.x = mousePos.current.x * 30;
      camera.position.y = mousePos.current.y * 20;
      camera.lookAt(0, 0, 0);
      
      // Dynamic lighting
      pointLight1.position.x = Math.sin(elapsedTime * 0.5) * 100;
      pointLight1.position.z = Math.cos(elapsedTime * 0.5) * 100;
      
      renderer.render(scene, camera);
    };
    
    animate();

    // Handle resize
    const handleResize = () => {
      if (globeRef.current) {
        camera.aspect = globeRef.current.clientWidth / globeRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(globeRef.current.clientWidth, globeRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current && globeRef.current) {
        globeRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [globalData, loading, pulseSpeed]);

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
        {/* Animated background gradient */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 50% 50%, ${COLORS.purple}22, transparent 70%)`,
          animation: 'pulse 3s ease-in-out infinite'
        }} />
        
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 10 }}>
          {/* Triple rotating rings */}
          <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto' }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              border: `2px solid ${COLORS.cyan}`,
              borderRadius: '50%',
              borderTopColor: 'transparent',
              animation: 'spin 1s linear infinite'
            }} />
            <div style={{
              position: 'absolute',
              inset: '10px',
              border: `2px solid ${COLORS.purple}`,
              borderRadius: '50%',
              borderRightColor: 'transparent',
              animation: 'spin 1.5s linear infinite reverse'
            }} />
            <div style={{
              position: 'absolute',
              inset: '20px',
              border: `2px solid ${COLORS.pink}`,
              borderRadius: '50%',
              borderBottomColor: 'transparent',
              animation: 'spin 2s linear infinite'
            }} />
          </div>
          
          <div style={{ 
            marginTop: '24px', 
            fontSize: '11px', 
            textTransform: 'uppercase', 
            letterSpacing: '0.3em',
            color: COLORS.white,
            opacity: 0.8
          }}>
            Initializing System
          </div>
          
          {/* Loading dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '12px' }}>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} style={{
                width: '4px',
                height: '4px',
                backgroundColor: COLORS.cyan,
                borderRadius: '50%',
                animation: `bounce 1.4s ease-in-out ${i * 0.1}s infinite`
              }} />
            ))}
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
          @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); opacity: 0; }
            40% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  const metrics = globalData?.global_metrics || {};
  const regionalData = globalData?.regional_breakdown || [];
  const countryData = globalData?.country_breakdown || [];

  // Real data for interactive charts
  const coverageChartData = [
    { name: 'CMDB', value: metrics.cmdb_coverage || 0, fill: COLORS.cyan },
    { name: 'Protected', value: metrics.url_fqdn_coverage || 0, fill: COLORS.purple },
    { name: 'Gap', value: Math.max(0, 100 - (metrics.cmdb_coverage || 0)), fill: COLORS.pink }
  ];

  const regionalChartData = regionalData.slice(0, 5).map(r => ({
    region: r.region.substring(0, 8),
    cmdb: r.cmdb_coverage,
    tanium: r.tanium_coverage,
    splunk: r.splunk_coverage,
    total: r.assets
  }));

  const radarData = regionalData.slice(0, 6).map(r => ({
    region: r.region,
    visibility: r.overall_visibility,
    cmdb: r.cmdb_coverage,
    tanium: r.tanium_coverage,
    fullMark: 100
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
          boxShadow: `0 8px 32px rgba(168, 218, 220, 0.1)`
        }}>
          <p style={{ color: COLORS.white, fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: COLORS.white, fontSize: '11px', opacity: 0.8 }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
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
      {/* Animated background effect */}
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
      
      {/* Header with live status */}
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
              GLOBAL INFRASTRUCTURE
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
              {/* Live indicator */}
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
                  Live
                </span>
              </div>
              
              <p style={{ fontSize: '11px', color: `${COLORS.white}99`, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                Real-time monitoring active • {frameCount.current} frames rendered
              </p>
            </div>
          </div>
          
          {/* Speed control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '10px', color: `${COLORS.white}99`, textTransform: 'uppercase' }}>Speed</span>
            <input 
              type="range" 
              min="0.1" 
              max="3" 
              step="0.1" 
              value={pulseSpeed}
              onChange={(e) => setPulseSpeed(parseFloat(e.target.value))}
              style={{
                width: '100px',
                height: '4px',
                background: `linear-gradient(to right, ${COLORS.cyan} 0%, ${COLORS.purple} 50%, ${COLORS.pink} 100%)`,
                borderRadius: '2px',
                outline: 'none',
                cursor: 'pointer'
              }}
            />
          </div>
        </div>
        
        {/* Tab navigation */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
          {['overview', 'regional', 'security', 'performance'].map(tab => (
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

      {/* Animated Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Total Assets', value: metrics.total_assets?.toLocaleString(), icon: Database, color: COLORS.cyan, trend: '+12%' },
          { label: 'CMDB Coverage', value: `${metrics.cmdb_coverage?.toFixed(1)}%`, icon: Shield, color: COLORS.purple, trend: '+5%' },
          { label: 'Regions', value: metrics.regions_covered, icon: MapPin, color: COLORS.pink, trend: 'Stable' },
          { label: 'Countries', value: metrics.countries_covered, icon: Globe, color: COLORS.cyan, trend: '+3' }
        ].map((metric, idx) => (
          <div 
            key={idx}
            onMouseEnter={() => setHoveredMetric(idx)}
            onMouseLeave={() => setHoveredMetric(null)}
            style={{
              backgroundColor: COLORS.black,
              border: hoveredMetric === idx ? `1px solid ${metric.color}` : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '20px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
              transform: hoveredMetric === idx ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
              boxShadow: hoveredMetric === idx ? `0 20px 60px ${metric.color}66, 0 0 60px ${metric.color}44` : `0 0 20px ${metric.color}22`,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Animated background gradient */}
            {hoveredMetric === idx && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: `radial-gradient(circle at 50% 50%, ${metric.color}22, transparent)`,
                animation: 'pulse 2s ease-in-out infinite'
              }} />
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
              <div>
                <p style={{ 
                  fontSize: '10px',
                  color: `${COLORS.white}66`,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: '8px'
                }}>
                  {metric.label}
                </p>
                <p style={{ 
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: COLORS.white,
                  marginBottom: '4px'
                }}>
                  {metric.value}
                </p>
                <p style={{ 
                  fontSize: '10px',
                  color: metric.color,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <TrendingUp size={12} />
                  {metric.trend}
                </p>
              </div>
              <metric.icon size={24} style={{ 
                color: metric.color,
                filter: `drop-shadow(0 0 20px ${metric.color}) drop-shadow(0 0 40px ${metric.color})`,
                transition: 'all 0.3s'
              }} />
            </div>
            
            {/* Progress bar */}
            <div style={{
              marginTop: '12px',
              height: '2px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: '1px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${Math.random() * 40 + 60}%`,
                background: `linear-gradient(90deg, ${metric.color}, ${metric.color}cc)`,
                borderRadius: '1px',
                animation: 'slideIn 1s ease-out'
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginBottom: '28px' }}>
        {/* 3D Globe Container */}
        <div style={{ 
          backgroundColor: COLORS.black,
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '20px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Animated border gradient */}
          <div style={{
            position: 'absolute',
            inset: '-2px',
            background: `linear-gradient(45deg, ${COLORS.cyan}, ${COLORS.purple}, ${COLORS.pink}, ${COLORS.cyan})`,
            borderRadius: '12px',
            opacity: 0.3,
            animation: 'gradientRotate 4s linear infinite',
            zIndex: -1
          }} />
          
          <h2 style={{ 
            fontSize: '12px',
            fontWeight: '600',
            color: `${COLORS.white}cc`,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '12px'
          }}>
            Global Network Visualization
          </h2>
          <div ref={globeRef} style={{ height: '320px', position: 'relative' }} />
        </div>

        {/* Charts Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Pie Chart */}
          <div style={{ 
            backgroundColor: COLORS.black,
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h2 style={{ 
              fontSize: '12px',
              fontWeight: '600',
              color: `${COLORS.white}cc`,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '12px'
            }}>
              Coverage Analysis
            </h2>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie 
                  data={coverageChartData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={40}
                  outerRadius={70} 
                  paddingAngle={5}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1000}
                  onClick={(data) => {
                    console.log('Pie segment clicked:', data);
                    alert(`${data.name}: ${data.value.toFixed(1)}%`);
                  }}
                >
                  {coverageChartData.map((entry, index) => (
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
            <h2 style={{ 
              fontSize: '12px',
              fontWeight: '600',
              color: `${COLORS.white}cc`,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '12px'
            }}>
              Regional Coverage Radar
            </h2>
            <ResponsiveContainer width="100%" height={160}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="region" stroke={`${COLORS.white}66`} tick={{ fontSize: 9 }} />
                <PolarRadiusAxis stroke={`${COLORS.white}66`} tick={{ fontSize: 8 }} domain={[0, 100]} />
                <Radar name="Visibility" dataKey="visibility" stroke={COLORS.cyan} fill={COLORS.cyan} fillOpacity={0.3} />
                <Radar name="CMDB" dataKey="cmdb" stroke={COLORS.purple} fill={COLORS.purple} fillOpacity={0.3} />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Interactive Data Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '28px' }}>
        {/* Regional Table */}
        <div style={{ 
          backgroundColor: COLORS.black,
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h2 style={{ 
            fontSize: '12px',
            fontWeight: '600',
            color: `${COLORS.white}cc`,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '16px'
          }}>
            Regional Analysis
          </h2>
          <table style={{ width: '100%', fontSize: '11px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ textAlign: 'left', padding: '8px 0', color: `${COLORS.white}66` }}>Region</th>
                <th style={{ textAlign: 'right', padding: '8px 0', color: `${COLORS.white}66` }}>Assets</th>
                <th style={{ textAlign: 'right', padding: '8px 0', color: `${COLORS.white}66` }}>CMDB</th>
                <th style={{ textAlign: 'center', padding: '8px 0', color: `${COLORS.white}66` }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {regionalData.slice(0, 5).map((region, idx) => (
                <tr 
                  key={idx} 
                  style={{ 
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => {
                    setSelectedRegion(region);
                    console.log('Region selected:', region);
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
                  <td style={{ padding: '12px 0', color: COLORS.white }}>{region.region}</td>
                  <td style={{ textAlign: 'right', padding: '12px 0', color: `${COLORS.white}cc` }}>{region.assets.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', padding: '12px 0' }}>
                    <span style={{ 
                      color: region.cmdb_coverage > 70 ? COLORS.cyan :
                             region.cmdb_coverage > 40 ? COLORS.purple : COLORS.pink,
                      fontWeight: 'bold'
                    }}>
                      {region.cmdb_coverage.toFixed(1)}%
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', padding: '12px 0' }}>
                    <div style={{ 
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: region.overall_visibility > 70 ? COLORS.cyan :
                                      region.overall_visibility > 40 ? COLORS.purple : COLORS.pink,
                      boxShadow: `0 0 20px ${region.overall_visibility > 70 ? COLORS.cyan :
                                            region.overall_visibility > 40 ? COLORS.purple : COLORS.pink}, 
                                  0 0 40px ${region.overall_visibility > 70 ? COLORS.cyan :
                                            region.overall_visibility > 40 ? COLORS.purple : COLORS.pink}`,
                      animation: 'pulse 2s ease-in-out infinite'
                    }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Country Table */}
        <div style={{ 
          backgroundColor: COLORS.black,
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h2 style={{ 
            fontSize: '12px',
            fontWeight: '600',
            color: `${COLORS.white}cc`,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '16px'
          }}>
            Top Locations
          </h2>
          <table style={{ width: '100%', fontSize: '11px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ textAlign: 'left', padding: '8px 0', color: `${COLORS.white}66` }}>Country</th>
                <th style={{ textAlign: 'right', padding: '8px 0', color: `${COLORS.white}66` }}>Assets</th>
                <th style={{ textAlign: 'right', padding: '8px 0', color: `${COLORS.white}66` }}>Share</th>
                <th style={{ textAlign: 'right', padding: '8px 0', color: `${COLORS.white}66` }}>Health</th>
              </tr>
            </thead>
            <tbody>
              {countryData.slice(0, 5).map((country, idx) => (
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
                  <td style={{ padding: '12px 0', color: COLORS.white }}>{country.country}</td>
                  <td style={{ textAlign: 'right', padding: '12px 0', color: `${COLORS.white}cc` }}>{country.assets.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', padding: '12px 0', color: COLORS.purple }}>{country.percentage_of_total.toFixed(1)}%</td>
                  <td style={{ textAlign: 'right', padding: '12px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2px' }}>
                      {[...Array(5)].map((_, i) => (
                        <div 
                          key={i}
                          style={{
                            width: '4px',
                            height: '12px',
                            borderRadius: '2px',
                            backgroundColor: i < Math.ceil(country.cmdb_coverage / 20) ? COLORS.cyan : 'rgba(255,255,255,0.1)',
                            boxShadow: i < Math.ceil(country.cmdb_coverage / 20) ? `0 0 10px ${COLORS.cyan}, 0 0 20px ${COLORS.cyan}` : 'none',
                            transition: 'all 0.3s',
                            animation: `fadeIn 0.5s ease-out ${i * 0.1}s`
                          }}
                        />
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Bar Chart */}
      <div style={{ 
        backgroundColor: COLORS.black,
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '28px'
      }}>
        <h2 style={{ 
          fontSize: '12px',
          fontWeight: '600',
          color: `${COLORS.white}cc`,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '16px'
        }}>
          Regional Performance Matrix
        </h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart 
            data={regionalChartData}
            onClick={(data) => {
              if (data && data.activePayload) {
                console.log('Bar clicked:', data.activePayload[0]);
                alert(`Region: ${data.activeLabel}\nTotal Assets: ${data.activePayload[0].payload.total}`);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis dataKey="region" stroke={`${COLORS.white}66`} tick={{ fontSize: 10, fill: `${COLORS.white}66` }} />
            <YAxis stroke={`${COLORS.white}66`} tick={{ fontSize: 10, fill: `${COLORS.white}66` }} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
            <Bar dataKey="cmdb" fill={COLORS.cyan} radius={[8, 8, 0, 0]} animationDuration={1000} />
            <Bar dataKey="tanium" fill={COLORS.purple} radius={[8, 8, 0, 0]} animationDuration={1200} />
            <Bar dataKey="splunk" fill={COLORS.pink} radius={[8, 8, 0, 0]} animationDuration={1400} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Selected Region Details - shows when region is clicked */}
      {selectedRegion && (
        <div style={{ 
          backgroundColor: COLORS.black,
          border: `1px solid ${COLORS.cyan}66`,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '28px',
          animation: 'slideUp 0.3s ease-out',
          boxShadow: `0 10px 40px ${COLORS.cyan}22`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ color: COLORS.white, fontSize: '14px', fontWeight: 'bold' }}>
              {selectedRegion.region} - Detailed View
            </h3>
            <button 
              onClick={() => setSelectedRegion(null)}
              style={{
                padding: '6px 12px',
                backgroundColor: `${COLORS.pink}22`,
                border: `1px solid ${COLORS.pink}66`,
                borderRadius: '4px',
                color: COLORS.white,
                fontSize: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${COLORS.pink}33`}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${COLORS.pink}22`}
            >
              Close
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div>
              <p style={{ fontSize: '10px', color: `${COLORS.white}66`, marginBottom: '4px' }}>Total Assets</p>
              <p style={{ fontSize: '18px', color: COLORS.cyan, fontWeight: 'bold' }}>{selectedRegion.assets?.toLocaleString()}</p>
            </div>
            <div>
              <p style={{ fontSize: '10px', color: `${COLORS.white}66`, marginBottom: '4px' }}>CMDB Coverage</p>
              <p style={{ fontSize: '18px', color: COLORS.purple, fontWeight: 'bold' }}>{selectedRegion.cmdb_coverage?.toFixed(1)}%</p>
            </div>
            <div>
              <p style={{ fontSize: '10px', color: `${COLORS.white}66`, marginBottom: '4px' }}>Tanium Coverage</p>
              <p style={{ fontSize: '18px', color: COLORS.pink, fontWeight: 'bold' }}>{selectedRegion.tanium_coverage?.toFixed(1)}%</p>
            </div>
            <div>
              <p style={{ fontSize: '10px', color: `${COLORS.white}66`, marginBottom: '4px' }}>Overall Visibility</p>
              <p style={{ fontSize: '18px', color: COLORS.cyan, fontWeight: 'bold' }}>{selectedRegion.overall_visibility?.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        @keyframes slideIn {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
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

export default GlobalView;