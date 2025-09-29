// src/components/pages/BUandApplicationView.tsx
import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Building, Users, Eye, AlertTriangle, Activity, Briefcase, TrendingUp, Layers, Zap } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Treemap, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const BUandApplicationView = () => {
  // ========== STATE MANAGEMENT ==========
  // Main data from API
  const [buData, setBuData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // UI state for interactions
  const [selectedTab, setSelectedTab] = useState('business_units');
  const [hoveredMetric, setHoveredMetric] = useState(null);
  const [selectedBU, setSelectedBU] = useState(null);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  
  // References for 3D visualization
  const threeDRef = useRef(null);  // Container for 3D scene
  const rendererRef = useRef(null); // Three.js renderer instance
  const mousePos = useRef({ x: 0, y: 0 }); // Track mouse for parallax effect

  // ========== COLOR THEME ==========
  // Neon pastel colors for cyberpunk aesthetic
  const COLORS = {
    cyan: '#7dffff',    // Primary color for good metrics
    purple: '#b19dff',  // Secondary color for medium metrics
    pink: '#ff9ec7',    // Alert/warning color for poor metrics
    white: '#ffffff',
    black: '#000000'
  };

  // Helper to convert hex colors to Three.js format
  const hexToThree = (hex) => parseInt(hex.replace('#', '0x'));

  // ========== DATA FETCHING ==========
  // Fetch business unit and application data from backend
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
    // Refresh data every 30 seconds for real-time updates
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // ========== MOUSE TRACKING ==========
  // Track mouse position for 3D camera parallax effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      // Convert mouse position to normalized device coordinates (-1 to +1)
      mousePos.current = { 
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1
      };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // ========== 3D NETWORK VISUALIZATION ==========
  // Creates an interactive 3D visualization of business unit relationships
  useEffect(() => {
    if (!threeDRef.current || !buData || loading) return;

    // Clean up previous renderer if it exists
    if (rendererRef.current) {
      rendererRef.current.dispose();
      if (threeDRef.current.contains(rendererRef.current.domElement)) {
        threeDRef.current.removeChild(rendererRef.current.domElement);
      }
    }

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75, // Field of view
      threeDRef.current.clientWidth / threeDRef.current.clientHeight, // Aspect ratio
      0.1, // Near clipping plane
      1000 // Far clipping plane
    );
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, // Smooth edges
      alpha: true, // Transparent background
      powerPreference: "high-performance" 
    });
    rendererRef.current = renderer;
    
    renderer.setSize(threeDRef.current.clientWidth, threeDRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Optimize for retina displays
    threeDRef.current.appendChild(renderer.domElement);

    // ===== CREATE BU NODES =====
    // Each business unit is represented as a glowing sphere
    const businessUnits = buData?.business_units?.slice(0, 10) || [];
    const nodeGroup = new THREE.Group();
    
    businessUnits.forEach((bu, index) => {
      // Position nodes in a circle around center
      const angle = (index / businessUnits.length) * Math.PI * 2;
      const radius = 25;
      
      // Node size based on actual asset count (logarithmic scale for better visualization)
      const nodeSize = Math.max(2, Math.min(8, Math.log(bu.total_assets / 100 + 1) * 2));
      
      // Create glowing sphere with custom shader for neon effect
      const geometry = new THREE.SphereGeometry(nodeSize, 32, 32);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 }, // For animation
          color: { 
            value: new THREE.Color(
              // Color based on risk level
              bu.risk_level === 'CRITICAL' ? hexToThree(COLORS.pink) :
              bu.risk_level === 'HIGH' ? hexToThree(COLORS.purple) :
              hexToThree(COLORS.cyan)
            )
          }
        },
        // Vertex shader - handles vertex positions
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        // Fragment shader - creates the glow effect
        fragmentShader: `
          uniform float time;
          uniform vec3 color;
          varying vec3 vNormal;
          void main() {
            // Create rim lighting effect for glow
            float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
            vec3 glow = color * intensity * 2.0;
            // Add pulsing animation
            float pulse = sin(time * 3.0) * 0.2 + 0.8;
            gl_FragColor = vec4(glow * pulse, intensity);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending // Makes colors blend/glow
      });
      
      const node = new THREE.Mesh(geometry, material);
      // Position based on circle calculation
      node.position.x = Math.cos(angle) * radius;
      node.position.z = Math.sin(angle) * radius;
      // Y position based on visibility (higher visibility = higher position)
      node.position.y = (bu.overall_visibility - 50) / 8;
      node.userData = { bu, material }; // Store data for later access
      nodeGroup.add(node);
      
      // ===== CREATE CONNECTION LINES =====
      // Lines from center to each node showing relationships
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

    // ===== CREATE CENTRAL CORE =====
    // Pulsing geometric shape at center representing the organization
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
          // Gradient between cyan and purple
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

    // ===== CREATE PARTICLE SYSTEM =====
    // Floating particles for atmospheric effect
    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 500;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for(let i = 0; i < particleCount * 3; i += 3) {
      // Random positions in 3D space
      positions[i] = (Math.random() - 0.5) * 80;
      positions[i + 1] = (Math.random() - 0.5) * 60;
      positions[i + 2] = (Math.random() - 0.5) * 80;
      
      // Random neon colors
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

    // ===== LIGHTING SETUP =====
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(hexToThree(COLORS.cyan), 0.8, 200);
    pointLight.position.set(50, 50, 50);
    scene.add(pointLight);

    // Position camera
    camera.position.set(0, 25, 50);
    camera.lookAt(0, 0, 0);

    // ===== ANIMATION LOOP =====
    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      
      // Rotate elements
      nodeGroup.rotation.y += 0.003 * animationSpeed;
      core.rotation.y += 0.01;
      core.rotation.x += 0.005;
      particles.rotation.y -= 0.001;
      
      // Update shader uniforms for animation
      coreMaterial.uniforms.time.value = elapsedTime;
      nodeGroup.children.forEach((child) => {
        if(child.userData?.material) {
          child.userData.material.uniforms.time.value = elapsedTime;
        }
      });
      
      // Camera follows mouse for parallax effect
      camera.position.x = mousePos.current.x * 10;
      camera.position.y = 25 + mousePos.current.y * 10;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup on unmount
    return () => {
      if (rendererRef.current && threeDRef.current) {
        threeDRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [buData, loading, animationSpeed]);

  // ========== LOADING SCREEN ==========
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: COLORS.black }}>
        <div style={{ textAlign: 'center' }}>
          {/* Animated concentric circles */}
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

  // ========== DATA PREPARATION ==========
  // Extract and prepare data for visualization
  const businessUnits = buData?.business_units || [];
  const applicationClasses = buData?.application_classes || [];
  const totalBUs = buData?.total_business_units || 0;
  const totalAppClasses = buData?.total_app_classes || 0;
  const totalCIOs = buData?.total_cios || 0;

  // Calculate risk distribution across all BUs
  const riskDistribution = {
    CRITICAL: businessUnits.filter(bu => bu.risk_level === 'CRITICAL').length,
    HIGH: businessUnits.filter(bu => bu.risk_level === 'HIGH').length,
    MEDIUM: businessUnits.filter(bu => bu.risk_level === 'MEDIUM').length,
    LOW: businessUnits.filter(bu => bu.risk_level === 'LOW').length
  };

  // Prepare data for pie chart
  const pieData = Object.entries(riskDistribution).map(([level, count]) => ({
    name: level,
    value: count,
    color: level === 'CRITICAL' ? COLORS.pink : 
           level === 'HIGH' ? COLORS.purple : 
           level === 'MEDIUM' ? COLORS.cyan : COLORS.cyan
  }));

  // Prepare data for radar chart (top 6 BUs)
  const radarData = businessUnits.slice(0, 6).map(bu => ({
    subject: bu.business_unit.substring(0, 10),
    visibility: bu.overall_visibility,
    fullMark: 100
  }));

  // Prepare data for bar chart (visibility metrics comparison)
  const barData = businessUnits.slice(0, 8).map(bu => ({
    name: bu.business_unit.length > 12 ? bu.business_unit.substring(0, 12) + '..' : bu.business_unit,
    cmdb: bu.visibility_metrics.cmdb,
    tanium: bu.visibility_metrics.tanium,
    splunk: bu.visibility_metrics.splunk
  }));

  // ========== CUSTOM TOOLTIP COMPONENT ==========
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

  // ========== MAIN RENDER ==========
  return (
    <div style={{ padding: '20px', height: '100%', overflow: 'auto', backgroundColor: COLORS.black, position: 'relative' }}>
      {/* Animated gradient background */}
      <div style={{
        position: 'fixed', inset: 0,
        background: `radial-gradient(circle at 20% 50%, ${COLORS.purple}11, transparent 50%),
                     radial-gradient(circle at 80% 80%, ${COLORS.pink}11, transparent 50%)`,
        pointerEvents: 'none'
      }} />

      {/* ===== HEADER SECTION ===== */}
      <div style={{ marginBottom: '28px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ 
              fontSize: '28px', fontWeight: 'bold', color: COLORS.white,
              textShadow: `0 0 40px ${COLORS.purple}, 0 0 80px ${COLORS.purple}66`
            }}>
              BUSINESS UNIT & APPLICATION
            </h1>
            {/* Live status indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: COLORS.purple,
                           boxShadow: `0 0 20px ${COLORS.purple}`, animation: 'pulse 2s infinite' }} />
              <p style={{ fontSize: '11px', color: `${COLORS.white}99`, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                Organizational visibility analysis
              </p>
            </div>
          </div>
          {/* Summary metric */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building size={16} style={{ color: COLORS.purple, filter: `drop-shadow(0 0 10px ${COLORS.purple})` }} />
            <span style={{ fontSize: '11px', color: COLORS.white }}>{totalBUs} BUs</span>
          </div>
        </div>
        
        {/* Tab navigation */}
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

      {/* ===== METRICS CARDS ===== */}
      {/* Key performance indicators in card format */}
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

      {/* ===== MAIN CHARTS GRID ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '28px' }}>
        {/* 3D Visualization Container */}
        <div style={{ 
          backgroundColor: COLORS.black, border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px', padding: '20px', position: 'relative'
        }}>
          {/* Animated gradient border */}
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

        {/* Risk Distribution Pie Chart */}
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

        {/* Visibility Radar Chart */}
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

      {/* ===== VISIBILITY METRICS BAR CHART ===== */}
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

      {/* ===== DATA TABLE ===== */}
      {/* Conditional rendering based on selected tab */}
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
                    {/* Color-coded based on performance */}
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
                    {/* Risk level badge */}
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

      {/* ===== CSS ANIMATIONS ===== */}
      <style>{`
        @keyframes pulse { 
          0%, 100% { opacity: 0.8; } 
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

export default BUandApplicationView;