// src/components/pages/SystemClassification.tsx
import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Monitor, Server, Cloud, Database, Network, AlertTriangle, Activity, Cpu, HardDrive, Shield, Zap, Layers, Terminal, Binary, Globe, Wifi } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area, Treemap, ScatterChart, Scatter } from 'recharts';

const SystemClassification = () => {
  const [systemData, setSystemData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [hoveredMetric, setHoveredMetric] = useState(null);
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [rotationSpeed, setRotationSpeed] = useState(1);
  const threeDRef = useRef(null);
  const rendererRef = useRef(null);
  const mousePos = useRef({ x: 0, y: 0 });

  // NEON PASTEL COLORS - Same as GlobalView
  const COLORS = {
    cyan: '#7dffff',
    purple: '#b19dff',
    pink: '#ff9ec7',
    white: '#ffffff',
    black: '#000000'
  };

  const hexToThree = (hex) => {
    return parseInt(hex.replace('#', '0x'));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/system_classification/breakdown');
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

  // Mouse tracking
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

  // Epic 3D OS Galaxy Visualization
  useEffect(() => {
    if (!threeDRef.current || !systemData || loading) return;

    if (rendererRef.current) {
      rendererRef.current.dispose();
      if (threeDRef.current.contains(rendererRef.current.domElement)) {
        threeDRef.current.removeChild(rendererRef.current.domElement);
      }
    }

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.001);
    
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

    const galaxyGroup = new THREE.Group();

    // Central core with shader material
    const coreGeometry = new THREE.IcosahedronGeometry(8, 2);
    const coreMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color1: { value: new THREE.Color(hexToThree(COLORS.cyan)) },
        color2: { value: new THREE.Color(hexToThree(COLORS.purple)) }
      },
      vertexShader: `
        varying vec3 vPosition;
        void main() {
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color1;
        uniform vec3 color2;
        varying vec3 vPosition;
        void main() {
          float mixFactor = sin(time + length(vPosition) * 0.5) * 0.5 + 0.5;
          vec3 color = mix(color1, color2, mixFactor);
          float glow = 1.0 - length(vPosition) / 10.0;
          gl_FragColor = vec4(color * 1.5, glow);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    galaxyGroup.add(core);

    // Create OS category orbits from real data
    const categorySummary = systemData?.category_summary || [];
    const systemBreakdown = systemData?.system_breakdown || [];
    
    categorySummary.forEach((category, index) => {
      const orbitRadius = 25 + index * 12;
      
      // Glowing orbit ring
      const ringGeometry = new THREE.TorusGeometry(orbitRadius, 0.3, 8, 100);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: category.category === 'Windows Server' ? hexToThree(COLORS.cyan) :
               category.category === 'Linux Server' ? hexToThree(COLORS.purple) :
               hexToThree(COLORS.pink),
        transparent: true,
        opacity: 0.3
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      galaxyGroup.add(ring);
      
      // System nodes on orbit based on real asset count
      const nodeCount = Math.min(8, Math.ceil(category.total_assets / 1000));
      for (let i = 0; i < nodeCount; i++) {
        const angle = (i / nodeCount) * Math.PI * 2;
        const x = Math.cos(angle) * orbitRadius;
        const z = Math.sin(angle) * orbitRadius;
        const y = Math.sin(angle * 2) * 5;
        
        const nodeSize = 1.5 + Math.log(category.total_assets / 1000 + 1) * 0.5;
        const nodeGeometry = new THREE.OctahedronGeometry(nodeSize, 0);
        const nodeMaterial = new THREE.MeshPhongMaterial({
          color: ringMaterial.color,
          emissive: ringMaterial.color,
          emissiveIntensity: 0.5
        });
        const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
        node.position.set(x, y, z);
        node.userData = { category: category.category, assets: category.total_assets };
        galaxyGroup.add(node);
        
        // Glow sphere around node
        const glowGeometry = new THREE.SphereGeometry(nodeSize * 2, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: ringMaterial.color,
          transparent: true,
          opacity: 0.1
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.copy(node.position);
        galaxyGroup.add(glow);
      }
    });

    scene.add(galaxyGroup);

    // Neon particle field
    const particleCount = 1500;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 120;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 120;
      
      const colorChoice = Math.random();
      if (colorChoice < 0.33) {
        colors[i * 3] = 0.49;
        colors[i * 3 + 1] = 1.0;
        colors[i * 3 + 2] = 1.0;
      } else if (colorChoice < 0.66) {
        colors[i * 3] = 0.694;
        colors[i * 3 + 1] = 0.616;
        colors[i * 3 + 2] = 1.0;
      } else {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.62;
        colors[i * 3 + 2] = 0.78;
      }
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    const particleSystem = new THREE.Points(particles, particlesMaterial);
    scene.add(particleSystem);

    // Lighting
    const ambientLight = new THREE.AmbientLight(hexToThree(COLORS.white), 0.2);
    scene.add(ambientLight);
    const pointLight1 = new THREE.PointLight(hexToThree(COLORS.cyan), 0.6, 200);
    pointLight1.position.set(50, 50, 50);
    scene.add(pointLight1);
    const pointLight2 = new THREE.PointLight(hexToThree(COLORS.purple), 0.4, 200);
    pointLight2.position.set(-50, -50, -50);
    scene.add(pointLight2);

    camera.position.set(0, 40, 80);
    camera.lookAt(0, 0, 0);

    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      
      coreMaterial.uniforms.time.value = elapsedTime;
      galaxyGroup.rotation.y += 0.002 * rotationSpeed;
      core.rotation.y += 0.01 * rotationSpeed;
      core.rotation.x += 0.005 * rotationSpeed;
      particleSystem.rotation.y -= 0.001 * rotationSpeed;
      
      camera.position.x = 80 * Math.cos(elapsedTime * 0.1) + mousePos.current.x * 20;
      camera.position.z = 80 * Math.sin(elapsedTime * 0.1) + mousePos.current.y * 20;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (rendererRef.current && threeDRef.current) {
        threeDRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [systemData, loading, rotationSpeed]);

  // Cool loading animation
  if (loading) {
    return (
      <div style={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: COLORS.black
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto' }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              border: `2px solid ${COLORS.cyan}`,
              borderRadius: '50%',
              borderTopColor: 'transparent',
              animation: 'spin 1s linear infinite',
              boxShadow: `0 0 20px ${COLORS.cyan}, 0 0 40px ${COLORS.cyan}`
            }} />
            <div style={{
              position: 'absolute',
              inset: '15px',
              border: `2px solid ${COLORS.purple}`,
              borderRadius: '50%',
              borderRightColor: 'transparent',
              animation: 'spin 1.5s linear infinite reverse',
              boxShadow: `0 0 20px ${COLORS.purple}, 0 0 40px ${COLORS.purple}`
            }} />
          </div>
          <div style={{ marginTop: '24px', fontSize: '11px', color: COLORS.white, textTransform: 'uppercase', letterSpacing: '0.3em' }}>
            Analyzing Systems...
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const systemBreakdown = systemData?.system_breakdown || [];
  const categorySummary = systemData?.category_summary || [];
  const totalSystems = systemData?.total_systems || 0;

  // Prepare real data for charts
  const categoryPieData = categorySummary.map(cat => ({
    name: cat.category,
    value: cat.total_assets,
    cmdb: cat.cmdb_coverage,
    fill: cat.category === 'Windows Server' ? COLORS.cyan :
          cat.category === 'Linux Server' ? COLORS.purple :
          cat.category === '*Nix' ? COLORS.pink :
          cat.category === 'Network Appliance' ? COLORS.cyan : COLORS.purple
  }));

  const systemBarData = systemBreakdown
    .filter(sys => selectedCategory === 'all' || sys.system.includes(selectedCategory))
    .slice(0, 8)
    .map(sys => ({
      name: sys.system.length > 12 ? sys.system.substring(0, 12) + '..' : sys.system,
      cmdb: sys.cmdb_coverage,
      tanium: sys.tanium_coverage,
      visibility: sys.overall_visibility
    }));

  const radarData = categorySummary.map(cat => ({
    subject: cat.category.substring(0, 10),
    cmdb: cat.cmdb_coverage,
    tanium: cat.tanium_coverage,
    visibility: cat.overall_visibility || ((cat.cmdb_coverage + cat.tanium_coverage) / 2)
  }));

  const treemapData = systemBreakdown.slice(0, 15).map(sys => ({
    name: sys.system,
    size: sys.total_assets,
    visibility: sys.overall_visibility,
    fill: sys.overall_visibility > 70 ? COLORS.cyan :
          sys.overall_visibility > 40 ? COLORS.purple : COLORS.pink
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
          boxShadow: `0 8px 32px ${COLORS.purple}33`
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
      {/* Animated background */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: `
          radial-gradient(circle at 30% 20%, ${COLORS.cyan}11, transparent 50%),
          radial-gradient(circle at 70% 80%, ${COLORS.purple}11, transparent 50%),
          radial-gradient(circle at 10% 90%, ${COLORS.pink}11, transparent 50%)
        `,
        pointerEvents: 'none'
      }} />
      
      {/* Header */}
      <div style={{ marginBottom: '28px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ 
              fontSize: '28px',
              fontWeight: 'bold',
              color: COLORS.white,
              letterSpacing: '-0.5px',
              textShadow: `0 0 40px ${COLORS.purple}, 0 0 80px ${COLORS.purple}66`
            }}>
              SYSTEM CLASSIFICATION
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: COLORS.cyan,
                  boxShadow: `0 0 20px ${COLORS.cyan}, 0 0 40px ${COLORS.cyan}`
                }} />
                <span style={{ fontSize: '11px', color: COLORS.cyan, textTransform: 'uppercase' }}>Live</span>
              </div>
              <p style={{ fontSize: '11px', color: `${COLORS.white}99`, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                Operating system analysis • {totalSystems} Systems
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Cpu size={20} style={{ color: COLORS.purple, filter: `drop-shadow(0 0 20px ${COLORS.purple})` }} />
            <span style={{ fontSize: '10px', color: COLORS.white, textTransform: 'uppercase' }}>Speed</span>
            <input 
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={rotationSpeed}
              onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
              style={{
                width: '100px',
                height: '4px',
                background: `linear-gradient(to right, ${COLORS.cyan}, ${COLORS.purple}, ${COLORS.pink})`,
                borderRadius: '2px',
                outline: 'none',
                cursor: 'pointer'
              }}
            />
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
          {['all', 'Windows Server', 'Linux Server', '*Nix'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '10px 20px',
                fontSize: '11px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                borderRadius: '6px',
                backgroundColor: selectedCategory === cat ? `${COLORS.purple}33` : 'transparent',
                color: selectedCategory === cat ? COLORS.white : `${COLORS.white}99`,
                border: selectedCategory === cat ? `1px solid ${COLORS.purple}` : '1px solid rgba(255,255,255,0.1)',
                boxShadow: selectedCategory === cat ? `0 0 20px ${COLORS.purple}66` : 'none',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              {cat === '*Nix' ? '*NIX' : cat.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        <div 
          onMouseEnter={() => setHoveredMetric(0)}
          onMouseLeave={() => setHoveredMetric(null)}
          style={{
            backgroundColor: COLORS.black,
            border: hoveredMetric === 0 ? `1px solid ${COLORS.cyan}` : '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '20px',
            cursor: 'pointer',
            transform: hoveredMetric === 0 ? 'translateY(-8px)' : 'translateY(0)',
            boxShadow: hoveredMetric === 0 ? `0 20px 60px ${COLORS.cyan}66` : `0 0 20px ${COLORS.cyan}22`,
            transition: 'all 0.3s'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '10px', color: `${COLORS.white}66`, textTransform: 'uppercase', marginBottom: '8px' }}>Total Systems</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: COLORS.white }}>{totalSystems}</p>
            </div>
            <Monitor size={24} style={{ color: COLORS.cyan, filter: `drop-shadow(0 0 20px ${COLORS.cyan})` }} />
          </div>
        </div>

        {categorySummary.slice(0, 3).map((cat, idx) => (
          <div 
            key={idx}
            onMouseEnter={() => setHoveredMetric(idx + 1)}
            onMouseLeave={() => setHoveredMetric(null)}
            onClick={() => setSelectedCategory(cat.category)}
            style={{
              backgroundColor: COLORS.black,
              border: hoveredMetric === idx + 1 ? `1px solid ${COLORS.purple}` : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '20px',
              cursor: 'pointer',
              transform: hoveredMetric === idx + 1 ? 'translateY(-8px)' : 'translateY(0)',
              boxShadow: hoveredMetric === idx + 1 ? `0 20px 60px ${COLORS.purple}66` : `0 0 20px ${COLORS.purple}22`,
              transition: 'all 0.3s'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '10px', color: `${COLORS.white}66`, textTransform: 'uppercase', marginBottom: '8px' }}>
                  {cat.category.substring(0, 10)}
                </p>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: COLORS.white }}>{cat.total_assets.toLocaleString()}</p>
                <p style={{ fontSize: '10px', color: COLORS.cyan, marginTop: '4px' }}>CMDB: {cat.cmdb_coverage.toFixed(1)}%</p>
              </div>
              {cat.category === 'Windows Server' ? <Server size={24} style={{ color: COLORS.cyan, filter: `drop-shadow(0 0 20px ${COLORS.cyan})` }} /> :
               cat.category === 'Linux Server' ? <Terminal size={24} style={{ color: COLORS.purple, filter: `drop-shadow(0 0 20px ${COLORS.purple})` }} /> :
               <Database size={24} style={{ color: COLORS.pink, filter: `drop-shadow(0 0 20px ${COLORS.pink})` }} />}
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '28px' }}>
        {/* 3D OS Galaxy */}
        <div style={{ 
          backgroundColor: COLORS.black,
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '20px',
          position: 'relative'
        }}>
          <h2 style={{ fontSize: '12px', fontWeight: '600', color: `${COLORS.white}cc`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
            OS Galaxy
          </h2>
          <div ref={threeDRef} style={{ height: '240px' }} />
        </div>

        {/* Category Pie Chart */}
        <div style={{ 
          backgroundColor: COLORS.black,
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h2 style={{ fontSize: '12px', fontWeight: '600', color: `${COLORS.white}cc`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
            Category Distribution
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie 
                data={categoryPieData} 
                cx="50%" 
                cy="50%" 
                innerRadius={40}
                outerRadius={80} 
                paddingAngle={3}
                dataKey="value"
                animationBegin={0}
                animationDuration={1000}
                onClick={(data) => setSelectedSystem(data)}
              >
                {categoryPieData.map((entry, index) => (
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
              <Radar name="Visibility" dataKey="visibility" stroke={COLORS.pink} fill={COLORS.pink} fillOpacity={0.3} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart */}
      <div style={{ 
        backgroundColor: COLORS.black,
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '28px'
      }}>
        <h2 style={{ fontSize: '12px', fontWeight: '600', color: `${COLORS.white}cc`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
          Top Systems Coverage
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={systemBarData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis dataKey="name" stroke={`${COLORS.white}66`} tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={60} />
            <YAxis stroke={`${COLORS.white}66`} tick={{ fontSize: 9 }} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
            <Bar dataKey="cmdb" fill={COLORS.cyan} radius={[8, 8, 0, 0]} />
            <Bar dataKey="tanium" fill={COLORS.purple} radius={[8, 8, 0, 0]} />
            <Bar dataKey="visibility" fill={COLORS.pink} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Data Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '28px' }}>
        {/* System Breakdown Table */}
        <div style={{ 
          backgroundColor: COLORS.black,
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h2 style={{ fontSize: '12px', fontWeight: '600', color: `${COLORS.white}cc`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
            System Breakdown
          </h2>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <table style={{ width: '100%', fontSize: '11px' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: COLORS.black }}>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ textAlign: 'left', padding: '8px 0', color: `${COLORS.white}66` }}>System</th>
                  <th style={{ textAlign: 'right', padding: '8px 0', color: `${COLORS.white}66` }}>Assets</th>
                  <th style={{ textAlign: 'right', padding: '8px 0', color: `${COLORS.white}66` }}>CMDB</th>
                  <th style={{ textAlign: 'right', padding: '8px 0', color: `${COLORS.white}66` }}>Visibility</th>
                </tr>
              </thead>
              <tbody>
                {systemBreakdown
                  .filter(sys => selectedCategory === 'all' || sys.system.includes(selectedCategory))
                  .slice(0, 10)
                  .map((sys, idx) => (
                    <tr 
                      key={idx}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                      onClick={() => setSelectedSystem(sys)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td style={{ padding: '12px 0', color: COLORS.white }}>{sys.system.substring(0, 20)}</td>
                      <td style={{ textAlign: 'right', padding: '12px 0', color: `${COLORS.white}cc` }}>{sys.total_assets.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', padding: '12px 0' }}>
                        <span style={{ 
                          color: sys.cmdb_coverage > 70 ? COLORS.cyan : sys.cmdb_coverage > 40 ? COLORS.purple : COLORS.pink,
                          textShadow: sys.cmdb_coverage > 70 ? `0 0 10px ${COLORS.cyan}` : 'none'
                        }}>
                          {sys.cmdb_coverage.toFixed(1)}%
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', padding: '12px 0' }}>
                        <span style={{ 
                          fontWeight: 'bold',
                          color: sys.overall_visibility > 70 ? COLORS.cyan : sys.overall_visibility > 40 ? COLORS.purple : COLORS.pink,
                          textShadow: sys.overall_visibility > 70 ? `0 0 10px ${COLORS.cyan}` : 'none'
                        }}>
                          {sys.overall_visibility.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Summary */}
        <div style={{ 
          backgroundColor: COLORS.black,
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h2 style={{ fontSize: '12px', fontWeight: '600', color: `${COLORS.white}cc`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
            Category Summary
          </h2>
          <table style={{ width: '100%', fontSize: '11px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ textAlign: 'left', padding: '8px 0', color: `${COLORS.white}66` }}>Category</th>
                <th style={{ textAlign: 'right', padding: '8px 0', color: `${COLORS.white}66` }}>Assets</th>
                <th style={{ textAlign: 'right', padding: '8px 0', color: `${COLORS.white}66` }}>CMDB</th>
                <th style={{ textAlign: 'center', padding: '8px 0', color: `${COLORS.white}66` }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {categorySummary.map((cat, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {cat.category === 'Windows Server' ? <Server size={14} style={{ color: COLORS.cyan }} /> :
                     cat.category === 'Linux Server' ? <Terminal size={14} style={{ color: COLORS.purple }} /> :
                     cat.category === '*Nix' ? <Cpu size={14} style={{ color: COLORS.pink }} /> :
                     cat.category === 'Network Appliance' ? <Network size={14} style={{ color: COLORS.cyan }} /> :
                     <Database size={14} style={{ color: COLORS.purple }} />}
                    <span style={{ color: COLORS.white }}>{cat.category}</span>
                  </td>
                  <td style={{ textAlign: 'right', padding: '12px 0', color: `${COLORS.white}cc` }}>{cat.total_assets.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', padding: '12px 0' }}>
                    <span style={{ 
                      fontWeight: 'bold',
                      color: cat.cmdb_coverage > 70 ? COLORS.cyan : cat.cmdb_coverage > 40 ? COLORS.purple : COLORS.pink
                    }}>
                      {cat.cmdb_coverage.toFixed(1)}%
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', padding: '12px 0' }}>
                    <div style={{ 
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: cat.cmdb_coverage > 70 ? COLORS.cyan : cat.cmdb_coverage > 40 ? COLORS.purple : COLORS.pink,
                      boxShadow: `0 0 20px ${cat.cmdb_coverage > 70 ? COLORS.cyan : cat.cmdb_coverage > 40 ? COLORS.purple : COLORS.pink}`
                    }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Treemap */}
      <div style={{ 
        backgroundColor: COLORS.black,
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <h2 style={{ fontSize: '12px', fontWeight: '600', color: `${COLORS.white}cc`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
          System Distribution Treemap
        </h2>
        <ResponsiveContainer width="100%" height={250}>
          <Treemap
            data={treemapData}
            dataKey="size"
            aspectRatio={4 / 3}
            stroke={COLORS.black}
            fill={COLORS.cyan}
            content={({ root, depth, x, y, width, height, index, colors, name, size, visibility }) => {
              return (
                <g>
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    style={{
                      fill: treemapData[index]?.fill || COLORS.cyan,
                      stroke: COLORS.black,
                      strokeWidth: 2,
                      strokeOpacity: 1,
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedSystem(treemapData[index])}
                  />
                  {width > 50 && height > 30 && (
                    <>
                      <text x={x + width / 2} y={y + height / 2 - 7} textAnchor="middle" fill={COLORS.white} fontSize={10}>
                        {name}
                      </text>
                      <text x={x + width / 2} y={y + height / 2 + 7} textAnchor="middle" fill={COLORS.white} fontSize={9} opacity={0.8}>
                        {size}
                      </text>
                    </>
                  )}
                </g>
              );
            }}
          />
        </ResponsiveContainer>
      </div>

      {selectedSystem && (
        <div style={{ 
          backgroundColor: COLORS.black,
          border: `1px solid ${COLORS.cyan}`,
          borderRadius: '12px',
          padding: '20px',
          marginTop: '20px',
          boxShadow: `0 10px 40px ${COLORS.cyan}44, 0 0 60px ${COLORS.cyan}22`
        }}>
          <h3 style={{ color: COLORS.white, fontSize: '14px', fontWeight: 'bold', marginBottom: '16px' }}>
            System Details: {selectedSystem.name || selectedSystem.system}
          </h3>
          <button 
            onClick={() => setSelectedSystem(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              padding: '6px 12px',
              backgroundColor: `${COLORS.pink}33`,
              border: `1px solid ${COLORS.pink}`,
              borderRadius: '4px',
              color: COLORS.white,
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
          <p style={{ color: COLORS.white, fontSize: '12px', opacity: 0.8 }}>
            Interactive system details would appear here
          </p>
        </div>
      )}
    </div>
  );
};

export default SystemClassification;