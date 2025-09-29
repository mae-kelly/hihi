// src/components/pages/RegionalCountryView.tsx
import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Globe, MapPin, Eye, AlertTriangle, Activity, Building, Cloud, Server, Users, Flag, TrendingUp, Layers, Zap } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area, ScatterChart, Scatter } from 'recharts';

const RegionalCountryView = () => {
  const [regionalData, setRegionalData] = useState(null);
  const [countryData, setCountryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('regional');
  const [hoveredMetric, setHoveredMetric] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const globeRef = useRef(null);
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
        const [regionalResponse, countryResponse] = await Promise.all([
          fetch('http://localhost:5000/api/region_metrics'),
          fetch('http://localhost:5000/api/country_metrics')
        ]);
        
        if (!regionalResponse.ok || !countryResponse.ok) throw new Error('Failed to fetch');
        
        const regional = await regionalResponse.json();
        const country = await countryResponse.json();
        
        setRegionalData(regional);
        setCountryData(country);
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

  // Epic 3D Globe Visualization
  useEffect(() => {
    if (!globeRef.current || !regionalData || loading) return;

    if (rendererRef.current) {
      rendererRef.current.dispose();
      if (globeRef.current.contains(rendererRef.current.domElement)) {
        globeRef.current.removeChild(rendererRef.current.domElement);
      }
    }

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.001);
    
    const camera = new THREE.PerspectiveCamera(60, globeRef.current.clientWidth / globeRef.current.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    rendererRef.current = renderer;
    
    renderer.setSize(globeRef.current.clientWidth, globeRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    globeRef.current.appendChild(renderer.domElement);

    // Create globe with neon glow
    const globeRadius = 45;
    const globeGeometry = new THREE.SphereGeometry(globeRadius, 128, 128);
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
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
          vec3 color = mix(vec3(0.49, 1.0, 1.0), vec3(1.0, 0.62, 0.78), sin(time) * 0.5 + 0.5);
          gl_FragColor = vec4(color * intensity * 2.0, intensity);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);

    // Core sphere
    const coreGeometry = new THREE.SphereGeometry(44, 64, 64);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: hexToThree(COLORS.black),
      emissive: hexToThree(COLORS.purple),
      emissiveIntensity: 0.03
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);

    // Wireframe
    const wireGeometry = new THREE.SphereGeometry(46, 32, 32);
    const wireMaterial = new THREE.MeshBasicMaterial({
      color: hexToThree(COLORS.cyan),
      wireframe: true,
      transparent: true,
      opacity: 0.2
    });
    const wireframe = new THREE.Mesh(wireGeometry, wireMaterial);
    scene.add(wireframe);

    // Add regional markers from real data
    const regionCoords = {
      'north america': { lat: 45, lon: -100 },
      'emea': { lat: 30, lon: 20 },
      'apac': { lat: 10, lon: 120 },
      'latam': { lat: -15, lon: -60 },
      'europe': { lat: 50, lon: 10 },
      'asia': { lat: 30, lon: 90 }
    };

    const markersGroup = new THREE.Group();
    Object.entries(regionalData.global_surveillance || {}).forEach(([region, count]) => {
      const coords = regionCoords[region.toLowerCase()] || { lat: Math.random() * 180 - 90, lon: Math.random() * 360 - 180 };
      const phi = (90 - coords.lat) * Math.PI / 180;
      const theta = (coords.lon + 180) * Math.PI / 180;
      
      const x = globeRadius * Math.sin(phi) * Math.cos(theta);
      const y = globeRadius * Math.cos(phi);
      const z = globeRadius * Math.sin(phi) * Math.sin(theta);
      
      // Create marker based on real count
      const markerSize = Math.max(1, Math.min(5, Math.log(count / 100 + 1)));
      
      // Glow sphere
      const glowGeometry = new THREE.SphereGeometry(markerSize * 2, 16, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: count > 10000 ? hexToThree(COLORS.cyan) : 
               count > 5000 ? hexToThree(COLORS.purple) : hexToThree(COLORS.pink),
        transparent: true,
        opacity: 0.3
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.set(x * 1.05, y * 1.05, z * 1.05);
      markersGroup.add(glow);
      
      // Core marker
      const markerGeometry = new THREE.OctahedronGeometry(markerSize, 0);
      const markerMaterial = new THREE.MeshPhongMaterial({
        color: hexToThree(COLORS.white),
        emissive: count > 10000 ? hexToThree(COLORS.cyan) : 
                  count > 5000 ? hexToThree(COLORS.purple) : hexToThree(COLORS.pink),
        emissiveIntensity: 0.5
      });
      
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(x * 1.05, y * 1.05, z * 1.05);
      markersGroup.add(marker);
    });
    scene.add(markersGroup);

    // Particles
    const particleCount = 1500;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();
      const radius = globeRadius + Math.random() * 30;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi);
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      
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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(hexToThree(COLORS.cyan), 0.8, 300);
    pointLight.position.set(100, 100, 100);
    scene.add(pointLight);

    camera.position.set(0, 0, 120);
    camera.lookAt(0, 0, 0);

    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      
      globeMaterial.uniforms.time.value = elapsedTime;
      globe.rotation.y += 0.002;
      wireframe.rotation.y -= 0.001;
      particleSystem.rotation.y += 0.0005;
      markersGroup.rotation.y += 0.002;
      
      // Camera movement based on mouse
      camera.position.x = mousePos.current.x * 20;
      camera.position.y = mousePos.current.y * 20;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (rendererRef.current && globeRef.current) {
        globeRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [regionalData, loading]);

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
              border: `2px solid ${COLORS.cyan}`,
              borderRadius: '50%',
              borderTopColor: 'transparent',
              animation: 'spin 1s linear infinite',
              boxShadow: `0 0 40px ${COLORS.cyan}, inset 0 0 20px ${COLORS.cyan}`
            }} />
            <div style={{
              position: 'absolute',
              inset: '15px',
              border: `2px solid ${COLORS.purple}`,
              borderRadius: '50%',
              borderRightColor: 'transparent',
              animation: 'spin 1.5s linear infinite reverse',
              boxShadow: `0 0 40px ${COLORS.purple}, inset 0 0 20px ${COLORS.purple}`
            }} />
          </div>
          <div style={{ 
            marginTop: '24px', 
            fontSize: '11px', 
            textTransform: 'uppercase', 
            letterSpacing: '0.3em',
            color: COLORS.white,
            textShadow: `0 0 20px ${COLORS.cyan}`
          }}>
            Mapping Regions...
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const totalCoverage = regionalData?.total_coverage || 0;
  const regionDistribution = regionalData?.global_surveillance || {};
  const countryDistribution = countryData?.global_intelligence || {};
  const totalCountries = countryData?.total_countries || 0;

  // Real data for charts
  const regionalBarData = Object.entries(regionDistribution).slice(0, 8).map(([region, count]) => ({
    name: region.toUpperCase().substring(0, 8),
    assets: count,
    percentage: (count / totalCoverage * 100)
  }));

  const pieData = Object.entries(regionDistribution).slice(0, 6).map(([region, count], idx) => ({
    name: region.toUpperCase(),
    value: count,
    fill: [COLORS.cyan, COLORS.purple, COLORS.pink][idx % 3]
  }));

  const scatterData = Object.entries(countryDistribution).slice(0, 20).map(([country, count], idx) => ({
    x: idx,
    y: count,
    name: country
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload[0]) {
      return (
        <div style={{ 
          backgroundColor: 'rgba(0,0,0,0.95)',
          padding: '12px',
          borderRadius: '8px',
          border: `1px solid ${COLORS.cyan}66`,
          backdropFilter: 'blur(10px)',
          boxShadow: `0 8px 32px ${COLORS.cyan}44, 0 0 40px ${COLORS.cyan}22`
        }}>
          <p style={{ color: COLORS.white, fontSize: '12px', fontWeight: 'bold' }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: COLORS.white, fontSize: '11px', opacity: 0.9 }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
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
          radial-gradient(circle at 30% 30%, ${COLORS.purple}11, transparent 50%),
          radial-gradient(circle at 70% 70%, ${COLORS.pink}11, transparent 50%)
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
              REGIONAL & COUNTRY ANALYSIS
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: COLORS.pink,
                  boxShadow: `0 0 20px ${COLORS.pink}, 0 0 40px ${COLORS.pink}`,
                  animation: 'pulse 2s ease-in-out infinite'
                }} />
                <span style={{ fontSize: '11px', color: COLORS.pink, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Live
                </span>
              </div>
              <p style={{ fontSize: '11px', color: `${COLORS.white}99`, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                Geographic distribution mapping
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Globe size={20} style={{ color: COLORS.cyan, filter: `drop-shadow(0 0 10px ${COLORS.cyan})` }} />
            <span style={{ fontSize: '12px', color: COLORS.white }}>{totalCountries} Countries</span>
          </div>
        </div>
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
          {['regional', 'country', 'global'].map(view => (
            <button
              key={view}
              onClick={() => setSelectedView(view)}
              style={{
                padding: '10px 20px',
                fontSize: '11px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                borderRadius: '6px',
                backgroundColor: selectedView === view ? `${COLORS.pink}33` : 'transparent',
                color: selectedView === view ? COLORS.white : `${COLORS.white}99`,
                border: selectedView === view ? `1px solid ${COLORS.pink}66` : '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: selectedView === view ? `0 0 20px ${COLORS.pink}44` : 'none'
              }}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Total Coverage', value: totalCoverage.toLocaleString(), icon: Globe, color: COLORS.cyan },
          { label: 'Regions', value: Object.keys(regionDistribution).length, icon: MapPin, color: COLORS.purple },
          { label: 'Countries', value: totalCountries, icon: Flag, color: COLORS.pink },
          { label: 'Top Region', value: Object.keys(regionDistribution)[0]?.toUpperCase() || 'N/A', icon: TrendingUp, color: COLORS.cyan }
        ].map((metric, idx) => (
          <div 
            key={idx}
            onMouseEnter={() => setHoveredMetric(idx)}
            onMouseLeave={() => setHoveredMetric(null)}
            style={{
              backgroundColor: COLORS.black,
              border: `1px solid ${hoveredMetric === idx ? metric.color : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '12px',
              padding: '20px',
              transition: 'all 0.3s',
              cursor: 'pointer',
              transform: hoveredMetric === idx ? 'translateY(-8px) scale(1.02)' : 'translateY(0)',
              boxShadow: hoveredMetric === idx ? `0 20px 60px ${metric.color}66, 0 0 60px ${metric.color}44` : `0 0 20px ${metric.color}11`
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '10px', color: `${COLORS.white}66`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                  {metric.label}
                </p>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: COLORS.white }}>
                  {metric.value}
                </p>
              </div>
              <metric.icon size={24} style={{ 
                color: metric.color,
                filter: `drop-shadow(0 0 20px ${metric.color}) drop-shadow(0 0 40px ${metric.color})`
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '28px' }}>
        {/* 3D Globe */}
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
            background: `linear-gradient(45deg, ${COLORS.cyan}, ${COLORS.purple}, ${COLORS.pink})`,
            borderRadius: '12px',
            opacity: 0.2,
            animation: 'gradientRotate 6s linear infinite'
          }} />
          <h2 style={{ fontSize: '12px', fontWeight: '600', color: `${COLORS.white}cc`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
            Global Distribution
          </h2>
          <div ref={globeRef} style={{ height: '240px' }} />
        </div>

        {/* Pie Chart */}
        <div style={{ 
          backgroundColor: COLORS.black,
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h2 style={{ fontSize: '12px', fontWeight: '600', color: `${COLORS.white}cc`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
            Regional Split
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie 
                data={pieData} 
                cx="50%" 
                cy="50%" 
                innerRadius={40}
                outerRadius={80} 
                paddingAngle={3}
                dataKey="value"
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

        {/* Top Countries */}
        <div style={{ 
          backgroundColor: COLORS.black,
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h2 style={{ fontSize: '12px', fontWeight: '600', color: `${COLORS.white}cc`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
            Top 5 Countries
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(countryDistribution).slice(0, 5).map(([country, count], idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', color: COLORS.white }}>{country.toUpperCase()}</span>
                  <span style={{ fontSize: '11px', color: COLORS.cyan, fontWeight: 'bold' }}>{count.toLocaleString()}</span>
                </div>
                <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${(count / Math.max(...Object.values(countryDistribution))) * 100}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${COLORS.cyan}, ${COLORS.purple})`,
                    borderRadius: '2px',
                    boxShadow: `0 0 10px ${COLORS.cyan}`,
                    animation: 'slideIn 1s ease-out'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      {selectedView === 'regional' && (
        <div style={{ 
          backgroundColor: COLORS.black,
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '28px'
        }}>
          <h2 style={{ fontSize: '12px', fontWeight: '600', color: `${COLORS.white}cc`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
            Regional Asset Distribution
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={regionalBarData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis dataKey="name" stroke={`${COLORS.white}66`} tick={{ fontSize: 10, fill: `${COLORS.white}66` }} />
              <YAxis stroke={`${COLORS.white}66`} tick={{ fontSize: 10, fill: `${COLORS.white}66` }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="assets" fill={COLORS.cyan} radius={[8, 8, 0, 0]}>
                {regionalBarData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={[COLORS.cyan, COLORS.purple, COLORS.pink][index % 3]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Scatter Chart */}
      {selectedView === 'country' && (
        <div style={{ 
          backgroundColor: COLORS.black,
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '28px'
        }}>
          <h2 style={{ fontSize: '12px', fontWeight: '600', color: `${COLORS.white}cc`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
            Country Distribution Pattern
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis type="number" dataKey="x" stroke={`${COLORS.white}66`} tick={{ fontSize: 10, fill: `${COLORS.white}66` }} />
              <YAxis type="number" dataKey="y" stroke={`${COLORS.white}66`} tick={{ fontSize: 10, fill: `${COLORS.white}66` }} />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: COLORS.purple }} />
              <Scatter name="Countries" data={scatterData} fill={COLORS.purple} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Data Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        {/* Regional Table */}
        <div style={{ 
          backgroundColor: COLORS.black,
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h2 style={{ fontSize: '12px', fontWeight: '600', color: `${COLORS.white}cc`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
            Regional Breakdown
          </h2>
          <table style={{ width: '100%', fontSize: '11px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ textAlign: 'left', padding: '8px 0', color: `${COLORS.white}66` }}>Region</th>
                <th style={{ textAlign: 'right', padding: '8px 0', color: `${COLORS.white}66` }}>Assets</th>
                <th style={{ textAlign: 'right', padding: '8px 0', color: `${COLORS.white}66` }}>Share</th>
                <th style={{ textAlign: 'center', padding: '8px 0', color: `${COLORS.white}66` }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(regionDistribution).slice(0, 6).map(([region, count], idx) => (
                <tr key={idx} 
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}>
                  <td style={{ padding: '12px 0', color: COLORS.white }}>{region.toUpperCase()}</td>
                  <td style={{ textAlign: 'right', padding: '12px 0', color: `${COLORS.white}cc` }}>{count.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', padding: '12px 0' }}>
                    <span style={{ color: COLORS.cyan, fontWeight: 'bold', textShadow: `0 0 10px ${COLORS.cyan}` }}>
                      {((count / totalCoverage) * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', padding: '12px 0' }}>
                    <div style={{ 
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: count > 10000 ? COLORS.cyan : count > 5000 ? COLORS.purple : COLORS.pink,
                      boxShadow: `0 0 20px ${count > 10000 ? COLORS.cyan : count > 5000 ? COLORS.purple : COLORS.pink}`
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
          <h2 style={{ fontSize: '12px', fontWeight: '600', color: `${COLORS.white}cc`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
            Top Countries
          </h2>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            <table style={{ width: '100%', fontSize: '11px' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: COLORS.black }}>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ textAlign: 'left', padding: '8px 0', color: `${COLORS.white}66` }}>Country</th>
                  <th style={{ textAlign: 'right', padding: '8px 0', color: `${COLORS.white}66` }}>Assets</th>
                  <th style={{ textAlign: 'right', padding: '8px 0', color: `${COLORS.white}66` }}>Share</th>
                  <th style={{ textAlign: 'center', padding: '8px 0', color: `${COLORS.white}66` }}>Health</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(countryDistribution).slice(0, 10).map(([country, count], idx) => (
                  <tr key={idx}
                      onClick={() => setSelectedCountry(country)}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}>
                    <td style={{ padding: '12px 0', color: COLORS.white }}>{country.toUpperCase()}</td>
                    <td style={{ textAlign: 'right', padding: '12px 0', color: `${COLORS.white}cc` }}>{count.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', padding: '12px 0' }}>
                      <span style={{ color: COLORS.purple, fontWeight: 'bold', textShadow: `0 0 10px ${COLORS.purple}` }}>
                        {((count / totalCoverage) * 100).toFixed(2)}%
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', padding: '12px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '2px' }}>
                        {[...Array(5)].map((_, i) => (
                          <div key={i} style={{
                            width: '4px',
                            height: '12px',
                            borderRadius: '2px',
                            backgroundColor: i < Math.ceil((count / Math.max(...Object.values(countryDistribution))) * 5) ? COLORS.cyan : 'rgba(255,255,255,0.1)',
                            boxShadow: i < Math.ceil((count / Math.max(...Object.values(countryDistribution))) * 5) ? `0 0 10px ${COLORS.cyan}` : 'none'
                          }} />
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes gradientRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default RegionalCountryView;