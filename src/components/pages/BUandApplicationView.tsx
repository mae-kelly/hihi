// src/components/pages/BUandApplicationView.tsx
import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Building, Users, Eye, AlertTriangle, Activity, Briefcase, TrendingUp, Layers, Zap } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Treemap, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const BUandApplicationView = () => {
  const [buData, setBuData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('business_units');
  const [hoveredMetric, setHoveredMetric] = useState(null);
  const [selectedBU, setSelectedBU] = useState(null);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const threeDRef = useRef(null);
  const rendererRef = useRef(null);
  const mousePos = useRef({ x: 0, y: 0 });

  // NEON PASTEL COLORS - GLOWING
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
        const response = await fetch('http://localhost:5000/api/bu_application/breakdown');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setBuData(data);
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

  // 3D Network Visualization
  useEffect(() => {
    if (!threeDRef.current || !buData || loading) return;

    if (rendererRef.current) {
      rendererRef.current.dispose();
      if (threeDRef.current.contains(rendererRef.current.domElement)) {
        threeDRef.current.removeChild(rendererRef.current.domElement);
      }
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, threeDRef.current.clientWidth / threeDRef.current.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    rendererRef.current = renderer;
    
    renderer.setSize(threeDRef.current.clientWidth, threeDRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    threeDRef.current.appendChild(renderer.domElement);

    // Create BU nodes from real data
    const businessUnits = buData?.business_units?.slice(0, 10) || [];
    const nodeGroup = new THREE.Group();
    
    businessUnits.forEach((bu, index) => {
      const angle = (index / businessUnits.length) * Math.PI * 2;
      const radius = 25;
      
      // Node size based on real asset count
      const nodeSize = Math.max(2, Math.min(8, Math.log(bu.total_assets / 100 + 1) * 2));
      
      // Glowing sphere with neon colors based on risk
      const geometry = new THREE.SphereGeometry(nodeSize, 32, 32);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color: { 
            value: new THREE.Color(
              bu.risk_level === 'CRITICAL' ? hexToThree(COLORS.pink) :
              bu.risk_level === 'HIGH' ? hexToThree(COLORS.purple) :
              hexToThree(COLORS.cyan)
            )
          }
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
          uniform vec3 color;
          varying vec3 vNormal;
          void main() {
            float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
            vec3 glow = color * intensity * 2.0;
            float pulse = sin(time * 3.0) * 0.2 + 0.8;
            gl_FragColor = vec4(glow * pulse, intensity);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending
      });
      
      const node = new THREE.Mesh(geometry, material);
      node.position.x = Math.cos(angle) * radius;
      node.position.z = Math.sin(angle) * radius;
      node.position.y = (bu.overall_visibility - 50) / 8;
      node.userData = { bu, material };
      nodeGroup.add(node);
      
      // Connection to center with gradient
      const points = [];
      for(let i = 0; i <= 20; i++) {
        const t = i / 20;
        points.push(new THREE.Vector3(
          node.position.x * t,
          node.position.y * t,
          node.position.z * t
        ));
      }
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const lineMaterial = new THREE.LineBasicMaterial({ 
        color: hexToThree(COLORS.cyan),
        transparent: true,
        opacity: 0.2
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      nodeGroup.add(line);
    });
    
    scene.add(nodeGroup);

    // Central core - pulsing neon
    const coreGeometry = new THREE.OctahedronGeometry(4, 2);
    const coreMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
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
        varying vec3 vPosition;
        void main() {
          vec3 color1 = vec3(0.49, 1.0, 1.0);  // neon cyan
          vec3 color2 = vec3(0.694, 0.616, 1.0); // neon purple
          float mixFactor = sin(time + length(vPosition)) * 0.5 + 0.5;
          vec3 finalColor = mix(color1, color2, mixFactor) * 2.0;
          gl_FragColor = vec4(finalColor, 0.8);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);

    // Neon particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 500;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for(let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 80;
      positions[i + 1] = (Math.random() - 0.5) * 60;
      positions[i + 2] = (Math.random() - 0.5) * 80;
      
      const colorChoice = Math.random();
      if(colorChoice < 0.33) {
        colors[i] = 0.49; colors[i + 1] = 1.0; colors[i + 2] = 1.0; // cyan
      } else if(colorChoice < 0.66) {
        colors[i] = 0.694; colors[i + 1] = 0.616; colors[i + 2] = 1.0; // purple
      } else {
        colors[i] = 1.0; colors[i + 1] = 0.62; colors[i + 2] = 0.78; // pink
      }
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      size: 1.0,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(hexToThree(COLORS.cyan), 0.8, 200);
    pointLight.position.set(50, 50, 50);
    scene.add(pointLight);

    camera.position.set(0, 25, 50);
    camera.lookAt(0, 0, 0);

    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      
      nodeGroup.rotation.y += 0.003 * animationSpeed;
      core.rotation.y += 0.01;
      core.rotation.x += 0.005;
      particles.rotation.y -= 0.001;
      
      // Update shaders
      coreMaterial.uniforms.time.value = elapsedTime;
      nodeGroup.children.forEach((child) => {
        if(child.userData?.material) {
          child.userData.material.uniforms.time.value = elapsedTime;
        }
      });
      
      // Camera movement with mouse
      camera.position.x = mousePos.current.x * 10;
      camera.position.y = 25 + mousePos.current.y * 10;
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
  }, [buData, loading, animationSpeed]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: COLORS.black }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto' }}>
            <div style={{
              position: 'absolute', inset: 0,
              border: `2px solid ${COLORS.purple}`,
              borderRadius: '50%',
              borderTopColor: 'transparent',
              boxShadow: `0 0 40px ${COLORS.purple}, inset 0 0 20px ${COLORS.purple}`,
              animation: 'spin 1s linear infinite'
            }} />
            <div style={{
              position: 'absolute', inset: '15px',
              border: `2px solid ${COLORS.cyan}`,
              borderRadius: '50%',
              borderBottomColor: 'transparent',
              boxShadow: `0 0 40px ${COLORS.cyan}`,
              animation: 'spin 1.5s linear infinite reverse'
            }} />
          </div>
          <div style={{ marginTop: '24px', color: COLORS.white, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.3em' }}>
            Loading Business Units
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
      </div>
    );
  }

  const businessUnits = buData?.business_units || [];
  const applicationClasses = buData?.application_classes || [];
  const totalBUs = buData?.total_business_units || 0;
  const totalAppClasses = buData?.total_app_classes || 0;
  const totalCIOs = buData?.total_cios || 0;

  // Prepare real data
  const riskDistribution = {
    CRITICAL: businessUnits.filter(bu => bu.risk_level === 'CRITICAL').length,
    HIGH: businessUnits.filter(bu => bu.risk_level === 'HIGH').length,
    MEDIUM: businessUnits.filter(bu => bu.risk_level === 'MEDIUM').length,
    LOW: businessUnits.filter(bu => bu.risk_level === 'LOW').length
  };

  const pieData = Object.entries(riskDistribution).map(([level, count]) => ({
    name: level,
    value: count,
    color: level === 'CRITICAL' ? COLORS.pink : 
           level === 'HIGH' ? COLORS.purple : 
           level === 'MEDIUM' ? COLORS.cyan : COLORS.cyan
  }));

  const radarData = businessUnits.slice(0, 6).map(bu => ({
    subject: bu.business_unit.substring(0, 10),
    visibility: bu.overall_visibility,
    fullMark: 100
  }));

  const barData = businessUnits.slice(0, 8).map(bu => ({
    name: bu.business_unit.length > 12 ? bu.business_unit.substring(0, 12) + '..' : bu.business_unit,
    cmdb: bu.visibility_metrics.cmdb,
    tanium: bu.visibility_metrics.tanium,
    splunk: bu.visibility_metrics.splunk
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
        background: `radial-gradient(circle at 20% 50%, ${COLORS.purple}11, transparent 50%),
                     radial-gradient(circle at 80% 80%, ${COLORS.pink}11, transparent 50%)`,
        pointerEvents: 'none'
      }} />

      {/* Header */}
      <div style={{ marginBottom: '28px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ 
              fontSize: '28px', fontWeight: 'bold', color: COLORS.white,
              textShadow: `0 0 40px ${COLORS.purple}, 0 0 80px ${COLORS.purple}66`
            }}>
              BUSINESS UNIT & APPLICATION
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: COLORS.purple,
                           boxShadow: `0 0 20px ${COLORS.purple}`, animation: 'pulse 2s infinite' }} />
              <p style={{ fontSize: '11px', color: `${COLORS.white}99`, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                Organizational visibility analysis
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building size={16} style={{ color: COLORS.purple, filter: `drop-shadow(0 0 10px ${COLORS.purple})` }} />
            <span style={{ fontSize: '11px', color: COLORS.white }}>{totalBUs} BUs</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
          {['business_units', 'applications', 'cio'].map(tab => (
            <button 
              key={tab}
              onClick={() => setSelectedTab(tab)}
              style={{
                padding: '10px 20px', fontSize: '11px', fontWeight: '600',
                textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: '6px',
                backgroundColor: selectedTab === tab ? `${COLORS.purple}33` : 'transparent',
                color: selectedTab === tab ? COLORS.white : `${COLORS.white}99`,
                border: selectedTab === tab ? `1px solid ${COLORS.purple}66` : '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer', transition: 'all 0.3s',
                boxShadow: selectedTab === tab ? `0 4px 20px ${COLORS.purple}44` : 'none'
              }}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Total BUs', value: totalBUs, icon: Building, color: COLORS.purple },
          { label: 'App Classes', value: totalAppClasses, icon: Layers, color: COLORS.cyan },
          { label: 'CIOs', value: totalCIOs, icon: Users, color: COLORS.pink },
          { label: 'Critical BUs', value: riskDistribution.CRITICAL, icon: AlertTriangle, color: COLORS.pink, critical: true }
        ].map((metric, idx) => (
          <div 
            key={idx}
            onMouseEnter={() => setHoveredMetric(idx)}
            onMouseLeave={() => setHoveredMetric(null)}
            style={{
              backgroundColor: COLORS.black,
              border: hoveredMetric === idx ? `1px solid ${metric.color}` : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px', padding: '20px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: hoveredMetric === idx ? 'translateY(-8px)' : 'translateY(0)',
              boxShadow: hoveredMetric === idx ? `0 20px 60px ${metric.color}66, 0 0 60px ${metric.color}44` : `0 0 20px ${metric.color}22`,
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '10px', color: `${COLORS.white}66`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                  {metric.label}
                </p>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: metric.critical ? metric.color : COLORS.white }}>
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
            BU Network Topology
          </h2>
          <div ref={threeDRef} style={{ height: '240px' }} />
        </div>

        {/* Risk Distribution Pie */}
        <div style={{ backgroundColor: COLORS.black, border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ fontSize: '12px', fontWeight: '600', color: `${COLORS.white}cc`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
            Risk Distribution
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie 
                data={pieData} 
                cx="50%" cy="50%" 
                innerRadius={40} outerRadius={80} 
                paddingAngle={5}
                dataKey="value"
                animationBegin={0} animationDuration={1000}
                onClick={(data) => console.log('Risk level:', data)}
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
            Visibility Radar
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255, 255, 255, 0.1)" />
              <PolarAngleAxis dataKey="subject" stroke={`${COLORS.white}66`} tick={{ fontSize: 8 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} stroke={`${COLORS.white}66`} tick={{ fontSize: 8 }} />
              <Radar name="Visibility %" dataKey="visibility" stroke={COLORS.cyan} fill={COLORS.cyan} fillOpacity={0.3} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart */}
      <div style={{ backgroundColor: COLORS.black, border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px', marginBottom: '28px' }}>
        <h2 style={{ fontSize: '12px', fontWeight: '600', color: `${COLORS.white}cc`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
          Business Unit Visibility Metrics
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis dataKey="name" stroke={`${COLORS.white}66`} tick={{ fontSize: 9, fill: `${COLORS.white}66` }} angle={-45} textAnchor="end" height={60} />
            <YAxis stroke={`${COLORS.white}66`} tick={{ fontSize: 9, fill: `${COLORS.white}66` }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="cmdb" fill={COLORS.cyan} radius={[8, 8, 0, 0]} />
            <Bar dataKey="tanium" fill={COLORS.purple} radius={[8, 8, 0, 0]} />
            <Bar dataKey="splunk" fill={COLORS.pink} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Data Tables */}
      {selectedTab === 'business_units' && (
        <div style={{ backgroundColor: COLORS.black, border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ fontSize: '12px', fontWeight: '600', color: `${COLORS.white}cc`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
            Business Units Breakdown
          </h2>
          <table style={{ width: '100%', fontSize: '11px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ textAlign: 'left', padding: '12px 0', color: `${COLORS.white}66` }}>Business Unit</th>
                <th style={{ textAlign: 'right', padding: '12px 0', color: `${COLORS.white}66` }}>Assets</th>
                <th style={{ textAlign: 'right', padding: '12px 0', color: `${COLORS.white}66` }}>CIOs</th>
                <th style={{ textAlign: 'right', padding: '12px 0', color: `${COLORS.white}66` }}>CMDB</th>
                <th style={{ textAlign: 'right', padding: '12px 0', color: `${COLORS.white}66` }}>Overall</th>
                <th style={{ textAlign: 'center', padding: '12px 0', color: `${COLORS.white}66` }}>Risk</th>
              </tr>
            </thead>
            <tbody>
              {businessUnits.slice(0, 10).map((bu, idx) => (
                <tr key={idx} 
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'all 0.2s' }}
                    onClick={() => setSelectedBU(bu)}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                  <td style={{ padding: '12px 0', color: COLORS.white }}>{bu.business_unit.substring(0, 25)}</td>
                  <td style={{ padding: '12px 0', textAlign: 'right', color: `${COLORS.white}cc` }}>{bu.total_assets.toLocaleString()}</td>
                  <td style={{ padding: '12px 0', textAlign: 'right', color: `${COLORS.white}cc` }}>{bu.cio_count}</td>
                  <td style={{ padding: '12px 0', textAlign: 'right' }}>
                    <span style={{ color: bu.visibility_metrics.cmdb > 70 ? COLORS.cyan : bu.visibility_metrics.cmdb > 40 ? COLORS.purple : COLORS.pink,
                                   textShadow: `0 0 10px ${bu.visibility_metrics.cmdb > 70 ? COLORS.cyan : bu.visibility_metrics.cmdb > 40 ? COLORS.purple : COLORS.pink}` }}>
                      {bu.visibility_metrics.cmdb.toFixed(1)}%
                    </span>
                  </td>
                  <td style={{ padding: '12px 0', textAlign: 'right' }}>
                    <span style={{ fontWeight: 'bold', color: bu.overall_visibility > 70 ? COLORS.cyan : bu.overall_visibility > 40 ? COLORS.purple : COLORS.pink,
                                   textShadow: `0 0 10px ${bu.overall_visibility > 70 ? COLORS.cyan : bu.overall_visibility > 40 ? COLORS.purple : COLORS.pink}` }}>
                      {bu.overall_visibility.toFixed(1)}%
                    </span>
                  </td>
                  <td style={{ padding: '12px 0', textAlign: 'center' }}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: 'bold',
                      backgroundColor: bu.risk_level === 'CRITICAL' ? `${COLORS.pink}33` :
                                      bu.risk_level === 'HIGH' ? `${COLORS.purple}33` :
                                      bu.risk_level === 'MEDIUM' ? `${COLORS.cyan}33` : `${COLORS.cyan}22`,
                      color: bu.risk_level === 'CRITICAL' ? COLORS.pink :
                            bu.risk_level === 'HIGH' ? COLORS.purple : COLORS.cyan,
                      border: `1px solid ${bu.risk_level === 'CRITICAL' ? COLORS.pink : bu.risk_level === 'HIGH' ? COLORS.purple : COLORS.cyan}66`,
                      boxShadow: `0 0 20px ${bu.risk_level === 'CRITICAL' ? COLORS.pink : bu.risk_level === 'HIGH' ? COLORS.purple : COLORS.cyan}44`
                    }}>
                      {bu.risk_level}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.8; } 50% { opacity: 1; } }
        @keyframes gradientRotate { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default BUandApplicationView;