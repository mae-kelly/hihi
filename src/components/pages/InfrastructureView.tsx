// src/components/pages/InfrastructureView.tsx
import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Server, Cloud, Database, Network, AlertTriangle, Activity, Cpu, HardDrive, Layers, Shield, Zap, Wifi, Terminal } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const InfrastructureView = () => {
  const [infraData, setInfraData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [hoveredMetric, setHoveredMetric] = useState(null);
  const [selectedInfra, setSelectedInfra] = useState(null);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const threeDRef = useRef(null);
  const rendererRef = useRef(null);
  const mousePos = useRef({ x: 0, y: 0 });

  // NEON PASTEL COLORS
  const COLORS = {
    cyan: '#7dffff',
    purple: '#b19dff',
    pink: '#ff9ec7',
    white: '#ffffff',
    black: '#000000'
  };

  const hexToThree = (hex) => parseInt(hex.replace('#', '0x'));

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/infrastructure_type/breakdown');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setInfraData(data);
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

  // 3D Infrastructure Stack
  useEffect(() => {
    if (!threeDRef.current || !infraData || loading) return;

    if (rendererRef.current) {
      rendererRef.current.dispose();
      if (threeDRef.current.contains(rendererRef.current.domElement)) {
        threeDRef.current.removeChild(rendererRef.current.domElement);
      }
    }

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.002);
    
    const camera = new THREE.PerspectiveCamera(75, threeDRef.current.clientWidth / threeDRef.current.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    rendererRef.current = renderer;
    
    renderer.setSize(threeDRef.current.clientWidth, threeDRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    threeDRef.current.appendChild(renderer.domElement);

    // Create infrastructure layers from real data
    const layers = infraData?.infrastructure_breakdown?.slice(0, 10) || [];
    const group = new THREE.Group();
    
    layers.forEach((infra, index) => {
      const size = Math.max(5, Math.min(25, infra.total_assets / 500));
      const geometry = new THREE.BoxGeometry(size, 3, size);
      
      // Neon colors based on real risk level
      const material = new THREE.MeshPhongMaterial({
        color: infra.risk_level === 'CRITICAL' ? hexToThree(COLORS.pink) :
               infra.risk_level === 'HIGH' ? hexToThree(COLORS.purple) :
               infra.risk_level === 'MEDIUM' ? hexToThree(COLORS.cyan) :
               hexToThree(COLORS.cyan),
        emissive: infra.risk_level === 'CRITICAL' ? hexToThree(COLORS.pink) :
                  infra.risk_level === 'HIGH' ? hexToThree(COLORS.purple) :
                  hexToThree(COLORS.cyan),
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.8
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.y = index * 4 - 20;
      mesh.position.x = (Math.random() - 0.5) * 10;
      mesh.position.z = (Math.random() - 0.5) * 10;
      group.add(mesh);

      // Neon wireframe
      const wireGeometry = new THREE.BoxGeometry(size + 0.1, 3.1, size + 0.1);
      const wireMaterial = new THREE.MeshBasicMaterial({
        color: hexToThree(COLORS.cyan),
        wireframe: true,
        transparent: true,
        opacity: 0.4
      });
      const wireMesh = new THREE.Mesh(wireGeometry, wireMaterial);
      wireMesh.position.copy(mesh.position);
      group.add(wireMesh);
    });

    scene.add(group);

    // Neon particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 1000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for(let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 100;
      positions[i + 1] = (Math.random() - 0.5) * 60;
      positions[i + 2] = (Math.random() - 0.5) * 100;
      
      const colorChoice = Math.random();
      if (colorChoice < 0.33) {
        colors[i] = 0.49;
        colors[i + 1] = 1.0;
        colors[i + 2] = 1.0;
      } else if (colorChoice < 0.66) {
        colors[i] = 0.694;
        colors[i + 1] = 0.616;
        colors[i + 2] = 1.0;
      } else {
        colors[i] = 1.0;
        colors[i + 1] = 0.62;
        colors[i + 2] = 0.78;
      }
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(hexToThree(COLORS.cyan), 0.8);
    pointLight.position.set(50, 50, 50);
    scene.add(pointLight);
    const pointLight2 = new THREE.PointLight(hexToThree(COLORS.purple), 0.6);
    pointLight2.position.set(-50, -50, -50);
    scene.add(pointLight2);

    camera.position.set(40, 10, 40);
    camera.lookAt(0, 0, 0);

    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      
      group.rotation.y += 0.002 * animationSpeed;
      particles.rotation.y -= 0.001 * animationSpeed;
      
      // Float animation
      group.children.forEach((child, idx) => {
        if (child.type === 'Mesh' && !child.material.wireframe) {
          child.position.y += Math.sin(elapsedTime + idx) * 0.01;
        }
      });
      
      // Camera with mouse
      camera.position.x = 40 + mousePos.current.x * 10;
      camera.position.y = 10 + mousePos.current.y * 10;
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
  }, [infraData, loading, animationSpeed]);

  // Loading animation
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
          <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto' }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              border: `2px solid ${COLORS.purple}`,
              borderRadius: '50%',
              borderTopColor: 'transparent',
              animation: 'spin 1s linear infinite',
              boxShadow: `0 0 40px ${COLORS.purple}`
            }} />
            <div style={{
              position: 'absolute',
              inset: '10px',
              border: `2px solid ${COLORS.cyan}`,
              borderRadius: '50%',
              borderRightColor: 'transparent',
              animation: 'spin 1.5s linear infinite reverse',
              boxShadow: `0 0 40px ${COLORS.cyan}`
            }} />
          </div>
          <div style={{ 
            marginTop: '24px',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.3em',
            color: COLORS.white,
            textShadow: `0 0 20px ${COLORS.purple}`
          }}>
            Loading Infrastructure
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const breakdown = infraData?.infrastructure_breakdown || [];
  const categorySummary = infraData?.category_summary || [];
  const totalTypes = infraData?.total_types || 0;

  // Prepare real data
  const pieData = categorySummary.map(cat => ({
    name: cat.category,
    value: cat.total_assets,
    coverage: cat.overall_visibility,
    fill: cat.category === 'Cloud' ? COLORS.purple :
          cat.category === 'On-Premise' ? COLORS.cyan :
          cat.category === 'SaaS' ? COLORS.pink : COLORS.cyan
  }));

  const barData = breakdown.slice(0, 8).map(infra => ({
    name: infra.type.length > 12 ? infra.type.substring(0, 12) + '..' : infra.type,
    cmdb: infra.visibility_metrics.cmdb,
    tanium: infra.visibility_metrics.tanium,
    splunk: infra.visibility_metrics.splunk
  }));

  const radarData = categorySummary.map(cat => ({
    category: cat.category,
    visibility: cat.overall_visibility,
    cmdb: cat.cmdb_coverage,
    tanium: cat.tanium_coverage,
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
          boxShadow: `0 8px 32px ${COLORS.cyan}44`
        }}>
          <p style={{ color: COLORS.white, fontSize: '12px', fontWeight: 'bold' }}>{label}</p>
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
      backgroundColor: COLORS.black
    }}>
      {/* Animated background */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: `
          radial-gradient(circle at 20% 50%, ${COLORS.purple}11, transparent 50%),
          radial-gradient(circle at 80% 50%, ${COLORS.cyan}11, transparent 50%)
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
              INFRASTRUCTURE ANALYSIS
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: COLORS.purple,
                  boxShadow: `0 0 20px ${COLORS.purple}, 0 0 40px ${COLORS.purple}`
                }} />
                <span style={{ fontSize: '11px', color: COLORS.purple, textTransform: 'uppercase' }}>Live</span>
              </div>
              <p style={{ fontSize: '11px', color: `${COLORS.white}99`, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                {totalTypes} Infrastructure Types
              </p>
            </div>
          </div>
          
          {/* Speed control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Layers size={20} style={{ color: COLORS.purple, filter: `drop-shadow(0 0 20px ${COLORS.purple})` }} />
            <input 
              type="range" 
              min="0.1" 
              max="3" 
              step="0.1" 
              value={animationSpeed}
              onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
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
        
        {/* Category tabs */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
          {['all', 'On-Premise', 'Cloud', 'SaaS'].map(cat => (
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
                backgroundColor: selectedCategory === cat ? `${COLORS.cyan}33` : 'transparent',
                color: selectedCategory === cat ? COLORS.white : `${COLORS.white}99`,
                border: selectedCategory === cat ? `1px solid ${COLORS.cyan}66` : '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: selectedCategory === cat ? `0 0 20px ${COLORS.cyan}44` : 'none'
              }}
            >
              {cat}
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
            border: hoveredMetric === 0 ? `1px solid ${COLORS.purple}` : '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '20px',
            transition: 'all 0.3s',
            cursor: 'pointer',
            transform: hoveredMetric === 0 ? 'translateY(-8px)' : 'translateY(0)',
            boxShadow: hoveredMetric === 0 ? `0 20px 60px ${COLORS.purple}66, 0 0 60px ${COLORS.purple}44` : `0 0 20px ${COLORS.purple}22`
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '10px', color: `${COLORS.white}66`, textTransform: 'uppercase', marginBottom: '8px' }}>Total Types</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: COLORS.white }}>{totalTypes}</p>
            </div>
            <Layers size={24} style={{ color: COLORS.purple, filter: `drop-shadow(0 0 20px ${COLORS.purple})` }} />
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
              border: hoveredMetric === idx + 1 ? `1px solid ${COLORS.cyan}` : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '20px',
              transition: 'all 0.3s',
              cursor: 'pointer',
              transform: hoveredMetric === idx + 1 ? 'translateY(-8px)' : 'translateY(0)',
              boxShadow: hoveredMetric === idx + 1 ? `0 20px 60px ${COLORS.cyan}66, 0 0 60px ${COLORS.cyan}44` : `0 0 20px ${COLORS.cyan}22`
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '10px', color: `${COLORS.white}66`, textTransform: 'uppercase', marginBottom: '8px' }}>{cat.category}</p>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: COLORS.white }}>{cat.total_assets.toLocaleString()}</p>
                <p style={{ fontSize: '10px', color: COLORS.cyan, marginTop: '4px' }}>{cat.overall_visibility.toFixed(1)}% visible</p>
              </div>
              {cat.category === 'Cloud' ? <Cloud size={24} style={{ color: COLORS.purple, filter: `drop-shadow(0 0 20px ${COLORS.purple})` }} /> :
               cat.category === 'On-Premise' ? <Server size={24} style={{ color: COLORS.cyan, filter: `drop-shadow(0 0 20px ${COLORS.cyan})` }} /> :
               <Database size={24} style={{ color: COLORS.pink, filter: `drop-shadow(0 0 20px ${COLORS.pink})` }} />}
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '28px' }}>
        {/* 3D Visualization */}
        <div style={{ 
          backgroundColor: COLORS.black,
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h2 style={{ fontSize: '12px', fontWeight: '600', color: `${COLORS.white}cc`, textTransform: 'uppercase', marginBottom: '12px' }}>
            Infrastructure Stack
          </h2>
          <div ref={threeDRef} style={{ height: '280px' }} />
        </div>

        {/* Pie Chart */}
        <div style={{ 
          backgroundColor: COLORS.black,
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h2 style={{ fontSize: '12px', fontWeight: '600', color: `${COLORS.white}cc`, textTransform: 'uppercase', marginBottom: '12px' }}>
            Category Distribution
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie 
                data={pieData} 
                cx="50%" 
                cy="50%" 
                innerRadius={50}
                outerRadius={90} 
                paddingAngle={5}
                dataKey="value"
                onClick={(data) => setSelectedInfra(data)}
                animationBegin={0}
                animationDuration={1000}
              >
                {pieData.map((entry, index) => (
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
          <h2 style={{ fontSize: '12px', fontWeight: '600', color: `${COLORS.white}cc`, textTransform: 'uppercase', marginBottom: '12px' }}>
            Coverage Radar
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="category" stroke={`${COLORS.white}66`} tick={{ fontSize: 9 }} />
              <PolarRadiusAxis stroke={`${COLORS.white}66`} tick={{ fontSize: 8 }} domain={[0, 100]} />
              <Radar name="Visibility" dataKey="visibility" stroke={COLORS.cyan} fill={COLORS.cyan} fillOpacity={0.3} />
              <Radar name="CMDB" dataKey="cmdb" stroke={COLORS.purple} fill={COLORS.purple} fillOpacity={0.3} />
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
        <h2 style={{ fontSize: '12px', fontWeight: '600', color: `${COLORS.white}cc`, textTransform: 'uppercase', marginBottom: '16px' }}>
          Security Coverage by Type
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis dataKey="name" stroke={`${COLORS.white}66`} tick={{ fontSize: 10, fill: `${COLORS.white}66` }} angle={-45} textAnchor="end" height={60} />
            <YAxis stroke={`${COLORS.white}66`} tick={{ fontSize: 10, fill: `${COLORS.white}66` }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="cmdb" fill={COLORS.cyan} radius={[8, 8, 0, 0]} />
            <Bar dataKey="tanium" fill={COLORS.purple} radius={[8, 8, 0, 0]} />
            <Bar dataKey="splunk" fill={COLORS.pink} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Data Table */}
      <div style={{ 
        backgroundColor: COLORS.black,
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <h2 style={{ fontSize: '12px', fontWeight: '600', color: `${COLORS.white}cc`, textTransform: 'uppercase', marginBottom: '16px' }}>
          Infrastructure Breakdown
        </h2>
        <table style={{ width: '100%', fontSize: '11px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <th style={{ textAlign: 'left', padding: '8px 0', color: `${COLORS.white}66` }}>Type</th>
              <th style={{ textAlign: 'left', padding: '8px 0', color: `${COLORS.white}66` }}>Category</th>
              <th style={{ textAlign: 'right', padding: '8px 0', color: `${COLORS.white}66` }}>Assets</th>
              <th style={{ textAlign: 'right', padding: '8px 0', color: `${COLORS.white}66` }}>CMDB</th>
              <th style={{ textAlign: 'right', padding: '8px 0', color: `${COLORS.white}66` }}>Visibility</th>
              <th style={{ textAlign: 'center', padding: '8px 0', color: `${COLORS.white}66` }}>Risk</th>
            </tr>
          </thead>
          <tbody>
            {breakdown
              .filter(infra => selectedCategory === 'all' || infra.category === selectedCategory)
              .slice(0, 10)
              .map((infra, idx) => (
                <tr 
                  key={idx} 
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => setSelectedInfra(infra)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <td style={{ padding: '12px 0', color: COLORS.white }}>{infra.type.substring(0, 20)}</td>
                  <td style={{ padding: '12px 0' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      backgroundColor: infra.category === 'Cloud' ? `${COLORS.purple}33` :
                                      infra.category === 'On-Premise' ? `${COLORS.cyan}33` :
                                      `${COLORS.pink}33`,
                      color: infra.category === 'Cloud' ? COLORS.purple :
                            infra.category === 'On-Premise' ? COLORS.cyan :
                            COLORS.pink,
                      boxShadow: infra.category === 'Cloud' ? `0 0 20px ${COLORS.purple}44` :
                                infra.category === 'On-Premise' ? `0 0 20px ${COLORS.cyan}44` :
                                `0 0 20px ${COLORS.pink}44`
                    }}>
                      {infra.category}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', padding: '12px 0', color: `${COLORS.white}cc` }}>{infra.total_assets.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', padding: '12px 0' }}>
                    <span style={{ 
                      color: infra.visibility_metrics.cmdb > 70 ? COLORS.cyan :
                            infra.visibility_metrics.cmdb > 40 ? COLORS.purple : COLORS.pink,
                      fontWeight: 'bold',
                      textShadow: infra.visibility_metrics.cmdb > 70 ? `0 0 10px ${COLORS.cyan}` :
                                 infra.visibility_metrics.cmdb > 40 ? `0 0 10px ${COLORS.purple}` :
                                 `0 0 10px ${COLORS.pink}`
                    }}>
                      {infra.visibility_metrics.cmdb.toFixed(1)}%
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', padding: '12px 0' }}>
                    <span style={{ 
                      color: infra.overall_visibility > 70 ? COLORS.cyan :
                            infra.overall_visibility > 40 ? COLORS.purple : COLORS.pink,
                      fontWeight: 'bold'
                    }}>
                      {infra.overall_visibility.toFixed(1)}%
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', padding: '12px 0' }}>
                    <div style={{ 
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: infra.risk_level === 'CRITICAL' ? COLORS.pink :
                                      infra.risk_level === 'HIGH' ? COLORS.purple :
                                      infra.risk_level === 'MEDIUM' ? COLORS.cyan :
                                      COLORS.cyan,
                      boxShadow: `0 0 20px ${infra.risk_level === 'CRITICAL' ? COLORS.pink :
                                            infra.risk_level === 'HIGH' ? COLORS.purple :
                                            COLORS.cyan}`
                    }} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default InfrastructureView;