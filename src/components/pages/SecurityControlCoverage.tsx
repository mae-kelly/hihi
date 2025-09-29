// src/components/pages/SecurityControlCoverage.tsx
import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Shield, Server, Activity, AlertTriangle, Lock, CheckCircle, XCircle, TrendingUp, Layers, Zap } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area } from 'recharts';

const SecurityControlCoverage = () => {
  const [securityData, setSecurityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('overview');
  const [hoveredMetric, setHoveredMetric] = useState(null);
  const [selectedControl, setSelectedControl] = useState(null);
  const [shieldIntensity, setShieldIntensity] = useState(1);
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
        const response = await fetch('http://localhost:5000/api/security_control/coverage');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setSecurityData(data);
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

  // 3D Security Shield Visualization
  useEffect(() => {
    if (!threeDRef.current || !securityData || loading) return;

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

    // Create security shield layers from real data
    const controls = ['tanium', 'dlp', 'crowdstrike', 'ssc'];
    const coverage = securityData?.overall_coverage || {};
    const shieldGroup = new THREE.Group();
    
    controls.forEach((control, index) => {
      const radius = 25 - index * 4;
      const height = 15;
      const coveragePercent = coverage[control]?.coverage || 0;
      
      // Shield layer with neon glow
      const geometry = new THREE.CylinderGeometry(radius, radius, height, 32, 1, true);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          coverage: { value: coveragePercent / 100 },
          color: { 
            value: new THREE.Color(
              coveragePercent > 70 ? hexToThree(COLORS.cyan) :
              coveragePercent > 40 ? hexToThree(COLORS.purple) :
              hexToThree(COLORS.pink)
            )
          }
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
          uniform float coverage;
          uniform vec3 color;
          varying vec3 vPosition;
          void main() {
            float angle = atan(vPosition.z, vPosition.x);
            float coveredAngle = coverage * 3.14159 * 2.0;
            float isCovered = angle < coveredAngle - 3.14159 ? 1.0 : 0.0;
            
            vec3 finalColor = color * (0.5 + isCovered * 0.5);
            float pulse = sin(time * 2.0 + vPosition.y * 0.5) * 0.2 + 0.8;
            finalColor *= pulse * 2.0;
            
            gl_FragColor = vec4(finalColor, 0.3 + isCovered * 0.3);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      });
      
      const shield = new THREE.Mesh(geometry, material);
      shield.position.y = index * 4;
      shield.userData = { material, control };
      shieldGroup.add(shield);
    });
    
    scene.add(shieldGroup);

    // Central core - protected asset
    const coreGeometry = new THREE.IcosahedronGeometry(6, 1);
    const coreMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec3 vNormal;
        void main() {
          vec3 color = vec3(0.49, 1.0, 1.0);
          float intensity = pow(0.8 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
          color *= intensity * 3.0;
          float pulse = sin(time * 3.0) * 0.3 + 0.7;
          gl_FragColor = vec4(color * pulse, 0.9);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);

    // Threat particles (unprotected assets)
    const particleCount = 500;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 80;
      positions[i + 1] = (Math.random() - 0.5) * 50;
      positions[i + 2] = (Math.random() - 0.5) * 80;
      
      // Threats are pink
      colors[i] = 1.0;
      colors[i + 1] = 0.62;
      colors[i + 2] = 0.78;
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
      size: 1.0,
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
    const pointLight = new THREE.PointLight(hexToThree(COLORS.cyan), 0.8, 200);
    pointLight.position.set(50, 50, 50);
    scene.add(pointLight);

    camera.position.set(40, 25, 40);
    camera.lookAt(0, 8, 0);

    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      
      shieldGroup.rotation.y += 0.002 * shieldIntensity;
      core.rotation.y += 0.01;
      particleSystem.rotation.y -= 0.001;
      
      // Update shaders
      coreMaterial.uniforms.time.value = elapsedTime;
      shieldGroup.children.forEach(child => {
        if(child.userData?.material) {
          child.userData.material.uniforms.time.value = elapsedTime;
        }
      });
      
      // Camera movement
      camera.position.x = 40 + mousePos.current.x * 10;
      camera.position.z = 40 + mousePos.current.y * 10;
      camera.lookAt(0, 8, 0);
      
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (rendererRef.current && threeDRef.current) {
        threeDRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [securityData, loading, shieldIntensity]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: COLORS.black }}>
        <div style={{ textAlign: 'center' }}>
          <Shield size={48} style={{ 
            color: COLORS.cyan, 
            filter: `drop-shadow(0 0 40px ${COLORS.cyan})`,
            animation: 'pulse 1.5s infinite',
            margin: '0 auto'
          }} />
          <div style={{ marginTop: '24px', color: COLORS.white, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.3em' }}>
            Scanning Security
          </div>
        </div>
        <style>{`@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); }}`}</style>
      </div>
    );
  }

  const totalAssets = securityData?.total_assets || 0;
  const overallCoverage = securityData?.overall_coverage || {};
  const regionalCoverage = securityData?.regional_coverage || [];
  const maturityLevel = securityData?.security_maturity || 'BASIC';

  // Real data preparation
  const controlsBarData = Object.entries(overallCoverage).map(([control, data]) => ({
    name: control.toUpperCase(),
    deployed: data.deployed,
    coverage: data.coverage
  }));

  const pieData = Object.entries(overallCoverage).map(([control, data]) => ({
    name: control.toUpperCase(),
    value: data.coverage,
    deployed: data.deployed,
    color: data.coverage > 70 ? COLORS.cyan : 
           data.coverage > 40 ? COLORS.purple : COLORS.pink
  }));

  const regionalBarData = regionalCoverage.slice(0, 8).map(region => ({
    region: region.region.substring(0, 10),
    tanium: region.tanium_coverage,
    dlp: region.dlp_coverage,
    crowdstrike: region.crowdstrike_coverage
  }));

  const radarData = Object.entries(overallCoverage).map(([control, data]) => ({
    subject: control.toUpperCase(),
    coverage: data.coverage,
    fullMark: 100
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload[0]) {
      return (
        <div style={{ 
          backgroundColor: 'rgba(0,0,0,0.95)',
          padding: '12px',
          borderRadius: '8px',
          border: `1px solid ${COLORS.cyan}44`,
          backdropFilter: 'blur(10px)',
          boxShadow: `0 8px 32px ${COLORS.cyan}33`
        }}>
          <p style={{ color: COLORS.white, fontSize: '12px', fontWeight: 'bold' }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: COLORS.white, fontSize: '11px', opacity: 0.9 }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ padding: '20px', height: '100%', overflow: 'auto', backgroundColor: COLORS.black, position: 'relative' }}>
      {/* Animated background */}
      <div style={{
        position: 'fixed', inset: 0,
        background: `radial-gradient(circle at 50% 20%, ${COLORS.cyan}11, transparent 50%),
                     radial-gradient(circle at 80% 80%, ${COLORS.purple}11, transparent 50%)`,
        pointerEvents: 'none'
      }} />
      
      {/* Header */}
      <div style={{ marginBottom: '28px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ 
              fontSize: '28px', fontWeight: 'bold', color: COLORS.white,
              textShadow: `0 0 40px ${COLORS.cyan}, 0 0 80px ${COLORS.cyan}66`
            }}>
              SECURITY CONTROL COVERAGE
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', 
                           backgroundColor: maturityLevel === 'ADVANCED' ? COLORS.cyan : maturityLevel === 'INTERMEDIATE' ? COLORS.purple : COLORS.pink,
                           boxShadow: `0 0 20px ${maturityLevel === 'ADVANCED' ? COLORS.cyan : maturityLevel === 'INTERMEDIATE' ? COLORS.purple : COLORS.pink}`,
                           animation: 'pulse 2s infinite' }} />
              <p style={{ fontSize: '11px', color: `${COLORS.white}99`, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                Agent deployment analysis
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              padding: '6px 12px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase',
              backgroundColor: maturityLevel === 'ADVANCED' ? `${COLORS.cyan}33` : 
                             maturityLevel === 'INTERMEDIATE' ? `${COLORS.purple}33` : `${COLORS.pink}33`,
              color: maturityLevel === 'ADVANCED' ? COLORS.cyan : 
                    maturityLevel === 'INTERMEDIATE' ? COLORS.purple : COLORS.pink,
              border: `1px solid ${maturityLevel === 'ADVANCED' ? COLORS.cyan : 
                                  maturityLevel === 'INTERMEDIATE' ? COLORS.purple : COLORS.pink}66`,
              boxShadow: `0 0 20px ${maturityLevel === 'ADVANCED' ? COLORS.cyan : 
                                    maturityLevel === 'INTERMEDIATE' ? COLORS.purple : COLORS.pink}44`
            }}>
              {maturityLevel} MATURITY
            </span>
            <Shield size={16} style={{ color: COLORS.cyan, filter: `drop-shadow(0 0 10px ${COLORS.cyan})` }} />
            <span style={{ fontSize: '11px', color: COLORS.white }}>Security</span>
          </div>
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
            borderRadius: '12px', padding: '20px',
            transition: 'all 0.3s',
            transform: hoveredMetric === 0 ? 'translateY(-8px)' : 'translateY(0)',
            boxShadow: hoveredMetric === 0 ? `0 20px 60px ${COLORS.cyan}66, 0 0 60px ${COLORS.cyan}44` : `0 0 20px ${COLORS.cyan}22`,
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '10px', color: `${COLORS.white}66`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                Total Assets
              </p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: COLORS.white }}>{totalAssets.toLocaleString()}</p>
            </div>
            <Server size={24} style={{ 
              color: COLORS.cyan,
              filter: `drop-shadow(0 0 20px ${COLORS.cyan}) drop-shadow(0 0 40px ${COLORS.cyan})`
            }} />
          </div>
        </div>
        
        {Object.entries(overallCoverage).slice(0, 3).map(([control, data], idx) => (
          <div 
            key={idx}
            onMouseEnter={() => setHoveredMetric(idx + 1)}
            onMouseLeave={() => setHoveredMetric(null)}
            onClick={() => setSelectedControl(control)}
            style={{
              backgroundColor: COLORS.black,
              border: hoveredMetric === idx + 1 ? `1px solid ${data.coverage > 70 ? COLORS.cyan : data.coverage > 40 ? COLORS.purple : COLORS.pink}` : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px', padding: '20px',
              transition: 'all 0.3s',
              transform: hoveredMetric === idx + 1 ? 'translateY(-8px)' : 'translateY(0)',
              boxShadow: hoveredMetric === idx + 1 ? `0 20px 60px ${data.coverage > 70 ? COLORS.cyan : data.coverage > 40 ? COLORS.purple : COLORS.pink}66` : 'none',
              cursor: 'pointer'
          }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '10px', color: `${COLORS.white}66`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                  {control.toUpperCase()}
                </p>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: COLORS.white }}>{data.coverage.toFixed(1)}%</p>
                <p style={{ fontSize: '10px', color: COLORS.cyan, marginTop: '4px' }}>
                  {data.deployed.toLocaleString()} protected
                </p>
              </div>
              <Shield size={24} style={{ 
                color: data.coverage > 70 ? COLORS.cyan : data.coverage > 40 ? COLORS.purple : COLORS.pink,
                filter: `drop-shadow(0 0 20px ${data.coverage > 70 ? COLORS.cyan : data.coverage > 40 ? COLORS.purple : COLORS.pink})`
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '28px' }}>
        {/* 3D Visualization */}
        <div style={{ 
          backgroundColor: COLORS.black, border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px', padding: '20px', position: 'relative'
        }}>
          <div style={{
            position: 'absolute', inset: '-2px',
            background: `linear-gradient(45deg, ${COLORS.cyan}, ${COLORS.purple}, ${COLORS.pink})`,
            borderRadius: '12px', opacity: 0.2, animation: 'gradientRotate 4s linear infinite', zIndex: -1
          }} />
          <h2 style={{ fontSize: '12px', fontWeight: '600', color: `${COLORS.white}cc`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
            Security Shield Layers
          </h2>
          <div ref={threeDRef} style={{ height: '240px' }} />
        </div>

        {/* Coverage Pie Chart */}
        <div style={{ backgroundColor: COLORS.black, border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ fontSize: '12px', fontWeight: '600', color: `${COLORS.white}cc`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
            Control Distribution
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie 
                data={pieData} 
                cx="50%" cy="50%" 
                innerRadius={40} outerRadius={80} 
                paddingAngle={5}
                dataKey="value"
                onClick={(data) => setSelectedControl(data.name)}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Radar Chart */}
        <div style={{ backgroundColor: COLORS.black, border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ fontSize: '12px', fontWeight: '600', color: `${COLORS.white}cc`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
            Coverage Radar
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255, 255, 255, 0.1)" />
              <PolarAngleAxis dataKey="subject" stroke={`${COLORS.white}66`} tick={{ fontSize: 8 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} stroke={`${COLORS.white}66`} tick={{ fontSize: 8 }} />
              <Radar name="Coverage %" dataKey="coverage" stroke={COLORS.cyan} fill={COLORS.cyan} fillOpacity={0.3} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Regional Coverage Bar Chart */}
      <div style={{ backgroundColor: COLORS.black, border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px', marginBottom: '28px' }}>
        <h2 style={{ fontSize: '12px', fontWeight: '600', color: `${COLORS.white}cc`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
          Regional Security Coverage
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={regionalBarData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis dataKey="region" stroke={`${COLORS.white}66`} tick={{ fontSize: 9, fill: `${COLORS.white}66` }} />
            <YAxis stroke={`${COLORS.white}66`} tick={{ fontSize: 9, fill: `${COLORS.white}66` }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="tanium" fill={COLORS.cyan} radius={[8, 8, 0, 0]} />
            <Bar dataKey="dlp" fill={COLORS.purple} radius={[8, 8, 0, 0]} />
            <Bar dataKey="crowdstrike" fill={COLORS.pink} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Data Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        {/* Overall Coverage Table */}
        <div style={{ backgroundColor: COLORS.black, border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ fontSize: '12px', fontWeight: '600', color: `${COLORS.white}cc`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
            Security Controls Summary
          </h2>
          <table style={{ width: '100%', fontSize: '11px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ textAlign: 'left', padding: '12px 0', color: `${COLORS.white}66` }}>Control</th>
                <th style={{ textAlign: 'right', padding: '12px 0', color: `${COLORS.white}66` }}>Deployed</th>
                <th style={{ textAlign: 'right', padding: '12px 0', color: `${COLORS.white}66` }}>Coverage</th>
                <th style={{ textAlign: 'center', padding: '12px 0', color: `${COLORS.white}66` }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(overallCoverage).map(([control, data], idx) => (
                <tr key={idx} 
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                    onClick={() => setSelectedControl(control)}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                  <td style={{ padding: '12px 0', color: COLORS.white, textTransform: 'uppercase' }}>{control}</td>
                  <td style={{ padding: '12px 0', textAlign: 'right', color: `${COLORS.white}cc` }}>{data.deployed.toLocaleString()}</td>
                  <td style={{ padding: '12px 0', textAlign: 'right' }}>
                    <span style={{ 
                      fontWeight: 'bold',
                      color: data.coverage > 70 ? COLORS.cyan : data.coverage > 40 ? COLORS.purple : COLORS.pink,
                      textShadow: `0 0 10px ${data.coverage > 70 ? COLORS.cyan : data.coverage > 40 ? COLORS.purple : COLORS.pink}`
                    }}>
                      {data.coverage.toFixed(1)}%
                    </span>
                  </td>
                  <td style={{ padding: '12px 0', textAlign: 'center' }}>
                    {data.coverage > 70 ? 
                      <CheckCircle size={14} style={{ color: COLORS.cyan, filter: `drop-shadow(0 0 10px ${COLORS.cyan})` }} /> :
                      data.coverage > 40 ?
                      <AlertTriangle size={14} style={{ color: COLORS.purple, filter: `drop-shadow(0 0 10px ${COLORS.purple})` }} /> :
                      <XCircle size={14} style={{ color: COLORS.pink, filter: `drop-shadow(0 0 10px ${COLORS.pink})` }} />
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Regional Breakdown Table */}
        <div style={{ backgroundColor: COLORS.black, border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ fontSize: '12px', fontWeight: '600', color: `${COLORS.white}cc`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
            Regional Breakdown
          </h2>
          <div style={{ maxHeight: '200px', overflow: 'auto' }}>
            <table style={{ width: '100%', fontSize: '11px' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: COLORS.black }}>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ textAlign: 'left', padding: '12px 0', color: `${COLORS.white}66` }}>Region</th>
                  <th style={{ textAlign: 'right', padding: '12px 0', color: `${COLORS.white}66` }}>Assets</th>
                  <th style={{ textAlign: 'right', padding: '12px 0', color: `${COLORS.white}66` }}>Tanium</th>
                  <th style={{ textAlign: 'right', padding: '12px 0', color: `${COLORS.white}66` }}>DLP</th>
                </tr>
              </thead>
              <tbody>
                {regionalCoverage.slice(0, 10).map((region, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 0', color: COLORS.white }}>{region.region}</td>
                    <td style={{ padding: '12px 0', textAlign: 'right', color: `${COLORS.white}cc` }}>{region.total_assets.toLocaleString()}</td>
                    <td style={{ padding: '12px 0', textAlign: 'right' }}>
                      <span style={{ 
                        color: region.tanium_coverage > 70 ? COLORS.cyan : region.tanium_coverage > 40 ? COLORS.purple : COLORS.pink,
                        textShadow: `0 0 10px ${region.tanium_coverage > 70 ? COLORS.cyan : region.tanium_coverage > 40 ? COLORS.purple : COLORS.pink}`
                      }}>
                        {region.tanium_coverage.toFixed(1)}%
                      </span>
                    </td>
                    <td style={{ padding: '12px 0', textAlign: 'right' }}>
                      <span style={{ 
                        color: region.dlp_coverage > 70 ? COLORS.cyan : region.dlp_coverage > 40 ? COLORS.purple : COLORS.pink,
                        textShadow: `0 0 10px ${region.dlp_coverage > 70 ? COLORS.cyan : region.dlp_coverage > 40 ? COLORS.purple : COLORS.pink}`
                      }}>
                        {region.dlp_coverage.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.8; } 50% { opacity: 1; } }
        @keyframes gradientRotate { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default SecurityControlCoverage;