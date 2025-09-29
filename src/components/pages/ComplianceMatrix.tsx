// src/components/pages/ComplianceMatrix.tsx
import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Shield, CheckCircle, XCircle, AlertCircle, TrendingUp, TrendingDown, FileSearch, Database, Server, Activity, AlertTriangle, Layers, Binary, Zap } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area } from 'recharts';

const ComplianceMatrix = () => {
  const [complianceData, setComplianceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState('both');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [hoveredMetric, setHoveredMetric] = useState(null);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const matrixRef = useRef(null);
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

  const hexToThree = (hex) => {
    return parseInt(hex.replace('#', '0x'));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/logging_compliance/breakdown');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setComplianceData(data);
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

  // Epic 3D Compliance Matrix Visualization
  useEffect(() => {
    if (!matrixRef.current || !complianceData || loading) return;

    if (rendererRef.current) {
      rendererRef.current.dispose();
      if (matrixRef.current.contains(rendererRef.current.domElement)) {
        matrixRef.current.removeChild(rendererRef.current.domElement);
      }
    }

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.001);
    
    const camera = new THREE.PerspectiveCamera(
      60,
      matrixRef.current.clientWidth / matrixRef.current.clientHeight,
      0.1,
      1000
    );
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    rendererRef.current = renderer;
    
    renderer.setSize(matrixRef.current.clientWidth, matrixRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    matrixRef.current.appendChild(renderer.domElement);

    const platformGroup = new THREE.Group();
    
    // Splunk Platform - Neon Cyan
    const splunkPercent = complianceData?.platform_percentages?.splunk_only || 0;
    const splunkRadius = 20;
    const splunkHeight = 40;
    
    // Glowing outer cylinder
    const splunkOuterGeometry = new THREE.CylinderGeometry(splunkRadius, splunkRadius, splunkHeight, 32, 1, true);
    const splunkOuterMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(hexToThree(COLORS.cyan)) }
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
        uniform vec3 color;
        varying vec3 vPosition;
        void main() {
          float glow = 1.0 - abs(vPosition.y / 20.0);
          float pulse = sin(time * 2.0 + vPosition.y * 0.1) * 0.1 + 0.9;
          gl_FragColor = vec4(color, glow * pulse * 0.4);
        }
      `,
      side: THREE.DoubleSide,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    const splunkOuter = new THREE.Mesh(splunkOuterGeometry, splunkOuterMaterial);
    splunkOuter.position.x = -25;
    platformGroup.add(splunkOuter);
    
    // Inner filled cylinder
    const splunkFillHeight = splunkHeight * (splunkPercent / 100);
    if (splunkFillHeight > 0) {
      const splunkFillGeometry = new THREE.CylinderGeometry(splunkRadius - 2, splunkRadius - 2, splunkFillHeight, 32);
      const splunkFillMaterial = new THREE.MeshPhongMaterial({
        color: hexToThree(COLORS.cyan),
        emissive: hexToThree(COLORS.cyan),
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.8
      });
      const splunkFill = new THREE.Mesh(splunkFillGeometry, splunkFillMaterial);
      splunkFill.position.x = -25;
      splunkFill.position.y = -splunkHeight/2 + splunkFillHeight/2;
      platformGroup.add(splunkFill);
    }
    
    // GSO Platform - Neon Purple
    const gsoPercent = complianceData?.platform_percentages?.gso_only || 0;
    const gsoRadius = 20;
    const gsoHeight = 40;
    
    const gsoOuterGeometry = new THREE.CylinderGeometry(gsoRadius, gsoRadius, gsoHeight, 32, 1, true);
    const gsoOuterMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(hexToThree(COLORS.purple)) }
      },
      vertexShader: splunkOuterMaterial.vertexShader,
      fragmentShader: splunkOuterMaterial.fragmentShader,
      side: THREE.DoubleSide,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    const gsoOuter = new THREE.Mesh(gsoOuterGeometry, gsoOuterMaterial);
    gsoOuter.position.x = 25;
    platformGroup.add(gsoOuter);
    
    const gsoFillHeight = gsoHeight * (gsoPercent / 100);
    if (gsoFillHeight > 0) {
      const gsoFillGeometry = new THREE.CylinderGeometry(gsoRadius - 2, gsoRadius - 2, gsoFillHeight, 32);
      const gsoFillMaterial = new THREE.MeshPhongMaterial({
        color: hexToThree(COLORS.purple),
        emissive: hexToThree(COLORS.purple),
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.8
      });
      const gsoFill = new THREE.Mesh(gsoFillGeometry, gsoFillMaterial);
      gsoFill.position.x = 25;
      gsoFill.position.y = -gsoHeight/2 + gsoFillHeight/2;
      platformGroup.add(gsoFill);
    }
    
    // Central bridge - Neon Pink
    const bothPercent = complianceData?.platform_percentages?.both_platforms || 0;
    const bridgeHeight = gsoHeight * (bothPercent / 100);
    if (bridgeHeight > 0) {
      const bridgeGeometry = new THREE.BoxGeometry(50, bridgeHeight, 8);
      const bridgeMaterial = new THREE.MeshPhongMaterial({
        color: hexToThree(COLORS.pink),
        emissive: hexToThree(COLORS.pink),
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.7
      });
      const bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
      bridge.position.y = -gsoHeight/2 + bridgeHeight/2;
      platformGroup.add(bridge);
    }
    
    scene.add(platformGroup);
    
    // Non-compliant particles - Pink warning
    const noLoggingPercent = complianceData?.platform_percentages?.no_logging || 0;
    const particleCount = Math.min(500, Math.floor(noLoggingPercent * 10));
    
    if (particleCount > 0) {
      const particlesGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      
      for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 120;
        positions[i + 1] = (Math.random() - 0.5) * 80;
        positions[i + 2] = (Math.random() - 0.5) * 120;
        
        colors[i] = 1.0;
        colors[i + 1] = 0.62;
        colors[i + 2] = 0.78;
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
    }
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);
    
    const pointLight1 = new THREE.PointLight(hexToThree(COLORS.cyan), 0.8, 200);
    pointLight1.position.set(-50, 50, 50);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(hexToThree(COLORS.purple), 0.8, 200);
    pointLight2.position.set(50, 50, -50);
    scene.add(pointLight2);
    
    camera.position.set(0, 40, 100);
    camera.lookAt(0, 0, 0);
    
    // Animation
    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      
      platformGroup.rotation.y += 0.002 * animationSpeed;
      
      // Update shader uniforms
      splunkOuterMaterial.uniforms.time.value = elapsedTime;
      gsoOuterMaterial.uniforms.time.value = elapsedTime;
      
      // Camera movement
      camera.position.x = 60 * Math.sin(elapsedTime * 0.1) + mousePos.current.x * 20;
      camera.position.z = 100 * Math.cos(elapsedTime * 0.1);
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    return () => {
      if (rendererRef.current && matrixRef.current) {
        matrixRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [complianceData, loading, animationSpeed]);

  // Cool loading animation
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
          background: `radial-gradient(circle at 50% 50%, ${COLORS.purple}22, transparent 70%)`,
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
              boxShadow: `0 0 20px ${COLORS.cyan}, 0 0 40px ${COLORS.cyan}`
            }} />
            <div style={{
              position: 'absolute',
              inset: '10px',
              border: `2px solid ${COLORS.purple}`,
              borderRadius: '50%',
              borderRightColor: 'transparent',
              animation: 'spin 1.5s linear infinite reverse',
              boxShadow: `0 0 20px ${COLORS.purple}, 0 0 40px ${COLORS.purple}`
            }} />
          </div>
          
          <div style={{ 
            marginTop: '24px', 
            fontSize: '11px', 
            textTransform: 'uppercase', 
            letterSpacing: '0.3em',
            color: COLORS.white,
            opacity: 0.8,
            textShadow: `0 0 10px ${COLORS.white}`
          }}>
            Loading Compliance Data
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

  const totalAssets = complianceData?.total_assets || 0;
  const platformBreakdown = complianceData?.platform_breakdown || {};
  const platformPercentages = complianceData?.platform_percentages || {};
  const regionalCompliance = complianceData?.regional_compliance || [];
  const overallCompliance = complianceData?.overall_compliance || 0;
  const complianceStatus = complianceData?.compliance_status || 'NON_COMPLIANT';

  // Prepare chart data
  const compliancePieData = [
    { name: 'Splunk Only', value: platformPercentages.splunk_only || 0, fill: COLORS.cyan },
    { name: 'GSO Only', value: platformPercentages.gso_only || 0, fill: COLORS.purple },
    { name: 'Both Platforms', value: platformPercentages.both_platforms || 0, fill: COLORS.pink },
    { name: 'No Logging', value: platformPercentages.no_logging || 0, fill: '#ff0000' }
  ];

  const regionalData = regionalCompliance.slice(0, 8).map(region => ({
    region: region.region.substring(0, 10),
    splunk: region.splunk_coverage,
    gso: region.gso_coverage,
    any: region.any_logging
  }));

  const radarData = regionalCompliance.slice(0, 6).map(region => ({
    subject: region.region.substring(0, 8),
    splunk: region.splunk_coverage,
    gso: region.gso_coverage,
    combined: region.any_logging
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
          radial-gradient(circle at 20% 50%, ${COLORS.cyan}11, transparent 50%),
          radial-gradient(circle at 80% 50%, ${COLORS.purple}11, transparent 50%),
          radial-gradient(circle at 50% 100%, ${COLORS.pink}11, transparent 50%)
        `,
        pointerEvents: 'none',
        animation: 'backgroundShift 20s ease-in-out infinite'
      }} />
      
      {/* Header with Alert */}
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
              LOGGING COMPLIANCE MATRIX
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: COLORS.purple,
                    boxShadow: `0 0 20px ${COLORS.purple}, 0 0 40px ${COLORS.purple}`,
                    animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
                  }} />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    backgroundColor: COLORS.purple
                  }} />
                </div>
                <span style={{ fontSize: '11px', color: COLORS.purple, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Live
                </span>
              </div>
              <p style={{ fontSize: '11px', color: `${COLORS.white}99`, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                Platform logging analysis
              </p>
            </div>
          </div>
          
          {/* Speed control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileSearch size={16} style={{ color: COLORS.purple, filter: `drop-shadow(0 0 10px ${COLORS.purple})` }} />
            <span style={{ fontSize: '10px', color: `${COLORS.white}99`, textTransform: 'uppercase' }}>Speed</span>
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
        
        {/* Critical Alert */}
        {platformPercentages.no_logging > 30 && (
          <div style={{
            marginTop: '20px',
            backgroundColor: `${COLORS.pink}22`,
            border: `1px solid ${COLORS.pink}66`,
            borderRadius: '8px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: `0 0 20px ${COLORS.pink}44`
          }}>
            <AlertTriangle size={20} style={{ 
              color: COLORS.pink,
              filter: `drop-shadow(0 0 10px ${COLORS.pink})`
            }} />
            <span style={{ fontSize: '12px', color: COLORS.pink, fontWeight: 'bold', textTransform: 'uppercase' }}>Critical:</span>
            <span style={{ fontSize: '12px', color: COLORS.white }}>
              {platformPercentages.no_logging?.toFixed(1)}% of assets have no logging
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {['overview', 'regional', 'platforms'].map(tab => (
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
              boxShadow: selectedTab === tab ? `0 0 20px ${COLORS.purple}44` : 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 4px 12px ${COLORS.purple}22`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = selectedTab === tab ? `0 0 20px ${COLORS.purple}44` : 'none';
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Key Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Total Assets', value: totalAssets.toLocaleString(), icon: Server, color: COLORS.cyan },
          { label: 'Overall Compliance', value: `${overallCompliance.toFixed(1)}%`, icon: Shield, color: COLORS.purple },
          { label: 'Both Platforms', value: `${platformPercentages.both_platforms?.toFixed(1)}%`, icon: CheckCircle, color: COLORS.cyan },
          { label: 'Single Platform', value: `${((platformPercentages.splunk_only || 0) + (platformPercentages.gso_only || 0)).toFixed(1)}%`, icon: AlertCircle, color: COLORS.purple },
          { label: 'No Logging', value: `${platformPercentages.no_logging?.toFixed(1)}%`, icon: XCircle, color: COLORS.pink, critical: true }
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
                  fontSize: '9px',
                  color: `${COLORS.white}66`,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: '6px'
                }}>
                  {metric.label}
                </p>
                <p style={{ 
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: metric.critical ? COLORS.pink : COLORS.white,
                  textShadow: metric.critical ? `0 0 20px ${COLORS.pink}` : 'none'
                }}>
                  {metric.value}
                </p>
              </div>
              <metric.icon size={20} style={{ 
                color: metric.color,
                filter: `drop-shadow(0 0 20px ${metric.color}) drop-shadow(0 0 40px ${metric.color})`,
                transition: 'all 0.3s'
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Grid */}
      {selectedTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '28px' }}>
          {/* 3D Matrix Visualization */}
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
            
            <h2 style={{ 
              fontSize: '12px',
              fontWeight: '600',
              color: `${COLORS.white}cc`,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '12px'
            }}>
              Compliance Matrix 3D
            </h2>
            <div ref={matrixRef} style={{ height: '240px' }} />
          </div>

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
              Platform Distribution
            </h2>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie 
                  data={compliancePieData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={40}
                  outerRadius={80} 
                  paddingAngle={3}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1000}
                  onClick={(data) => console.log('Clicked:', data)}
                >
                  {compliancePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Status Card */}
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
              Compliance Status
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  marginBottom: '16px',
                  color: complianceStatus === 'COMPLIANT' ? COLORS.cyan :
                        complianceStatus === 'PARTIAL' ? COLORS.purple : COLORS.pink,
                  textShadow: complianceStatus === 'COMPLIANT' ? `0 0 40px ${COLORS.cyan}` :
                             complianceStatus === 'PARTIAL' ? `0 0 40px ${COLORS.purple}` :
                             `0 0 40px ${COLORS.pink}`
                }}>
                  {complianceStatus}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ color: `${COLORS.white}66` }}>Splunk Coverage:</span>
                    <span style={{ color: COLORS.cyan, fontWeight: 'bold' }}>
                      {((platformPercentages.splunk_only || 0) + (platformPercentages.both_platforms || 0)).toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ color: `${COLORS.white}66` }}>GSO Coverage:</span>
                    <span style={{ color: COLORS.purple, fontWeight: 'bold' }}>
                      {((platformPercentages.gso_only || 0) + (platformPercentages.both_platforms || 0)).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Regional Tab Content */}
      {selectedTab === 'regional' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Regional Bar Chart */}
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
              Regional Compliance Analysis
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={regionalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey="region" stroke={`${COLORS.white}66`} tick={{ fontSize: 10, fill: `${COLORS.white}66` }} />
                <YAxis stroke={`${COLORS.white}66`} tick={{ fontSize: 10, fill: `${COLORS.white}66` }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="splunk" fill={COLORS.cyan} radius={[8, 8, 0, 0]} />
                <Bar dataKey="gso" fill={COLORS.purple} radius={[8, 8, 0, 0]} />
                <Bar dataKey="any" fill={COLORS.pink} radius={[8, 8, 0, 0]} />
              </BarChart>
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
              marginBottom: '16px'
            }}>
              Regional Coverage Radar
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" stroke={`${COLORS.white}66`} tick={{ fontSize: 9 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke={`${COLORS.white}66`} tick={{ fontSize: 8 }} />
                <Radar name="Splunk" dataKey="splunk" stroke={COLORS.cyan} fill={COLORS.cyan} fillOpacity={0.3} />
                <Radar name="GSO" dataKey="gso" stroke={COLORS.purple} fill={COLORS.purple} fillOpacity={0.3} />
                <Radar name="Combined" dataKey="combined" stroke={COLORS.pink} fill={COLORS.pink} fillOpacity={0.3} />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Data Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginTop: '28px' }}>
        {/* Platform Breakdown Table */}
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
            Platform Breakdown
          </h2>
          <table style={{ width: '100%', fontSize: '11px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ textAlign: 'left', padding: '8px 0', color: `${COLORS.white}66` }}>Configuration</th>
                <th style={{ textAlign: 'right', padding: '8px 0', color: `${COLORS.white}66` }}>Hosts</th>
                <th style={{ textAlign: 'right', padding: '8px 0', color: `${COLORS.white}66` }}>Percentage</th>
                <th style={{ textAlign: 'center', padding: '8px 0', color: `${COLORS.white}66` }}>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px 0', color: COLORS.white }}>Splunk Only</td>
                <td style={{ textAlign: 'right', padding: '12px 0', color: `${COLORS.white}cc` }}>
                  {platformBreakdown.splunk_only?.toLocaleString()}
                </td>
                <td style={{ textAlign: 'right', padding: '12px 0', color: COLORS.cyan, fontWeight: 'bold' }}>
                  {platformPercentages.splunk_only?.toFixed(1)}%
                </td>
                <td style={{ textAlign: 'center', padding: '12px 0' }}>
                  <AlertCircle size={16} style={{ color: COLORS.purple, filter: `drop-shadow(0 0 10px ${COLORS.purple})` }} />
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px 0', color: COLORS.white }}>GSO Only</td>
                <td style={{ textAlign: 'right', padding: '12px 0', color: `${COLORS.white}cc` }}>
                  {platformBreakdown.gso_only?.toLocaleString()}
                </td>
                <td style={{ textAlign: 'right', padding: '12px 0', color: COLORS.purple, fontWeight: 'bold' }}>
                  {platformPercentages.gso_only?.toFixed(1)}%
                </td>
                <td style={{ textAlign: 'center', padding: '12px 0' }}>
                  <AlertCircle size={16} style={{ color: COLORS.purple, filter: `drop-shadow(0 0 10px ${COLORS.purple})` }} />
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px 0', color: COLORS.white }}>Both Platforms</td>
                <td style={{ textAlign: 'right', padding: '12px 0', color: `${COLORS.white}cc` }}>
                  {platformBreakdown.both_platforms?.toLocaleString()}
                </td>
                <td style={{ textAlign: 'right', padding: '12px 0', color: COLORS.cyan, fontWeight: 'bold' }}>
                  {platformPercentages.both_platforms?.toFixed(1)}%
                </td>
                <td style={{ textAlign: 'center', padding: '12px 0' }}>
                  <CheckCircle size={16} style={{ color: COLORS.cyan, filter: `drop-shadow(0 0 10px ${COLORS.cyan})` }} />
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px 0', color: COLORS.white }}>No Logging</td>
                <td style={{ textAlign: 'right', padding: '12px 0', color: `${COLORS.white}cc` }}>
                  {platformBreakdown.no_logging?.toLocaleString()}
                </td>
                <td style={{ textAlign: 'right', padding: '12px 0', color: COLORS.pink, fontWeight: 'bold' }}>
                  {platformPercentages.no_logging?.toFixed(1)}%
                </td>
                <td style={{ textAlign: 'center', padding: '12px 0' }}>
                  <XCircle size={16} style={{ color: COLORS.pink, filter: `drop-shadow(0 0 10px ${COLORS.pink})` }} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Regional Compliance Table */}
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
            Regional Compliance
          </h2>
          <div style={{ maxHeight: '200px', overflow: 'auto' }}>
            <table style={{ width: '100%', fontSize: '11px' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: COLORS.black }}>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ textAlign: 'left', padding: '8px 0', color: `${COLORS.white}66` }}>Region</th>
                  <th style={{ textAlign: 'right', padding: '8px 0', color: `${COLORS.white}66` }}>Assets</th>
                  <th style={{ textAlign: 'right', padding: '8px 0', color: `${COLORS.white}66` }}>Splunk</th>
                  <th style={{ textAlign: 'right', padding: '8px 0', color: `${COLORS.white}66` }}>GSO</th>
                  <th style={{ textAlign: 'right', padding: '8px 0', color: `${COLORS.white}66` }}>Any</th>
                </tr>
              </thead>
              <tbody>
                {regionalCompliance.slice(0, 10).map((region, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '8px 0', color: COLORS.white }}>{region.region}</td>
                    <td style={{ textAlign: 'right', padding: '8px 0', color: `${COLORS.white}cc` }}>
                      {region.total_assets.toLocaleString()}
                    </td>
                    <td style={{ 
                      textAlign: 'right', 
                      padding: '8px 0',
                      color: region.splunk_coverage > 70 ? COLORS.cyan : 
                             region.splunk_coverage > 40 ? COLORS.purple : COLORS.pink,
                      fontWeight: 'bold'
                    }}>
                      {region.splunk_coverage.toFixed(1)}%
                    </td>
                    <td style={{ 
                      textAlign: 'right', 
                      padding: '8px 0',
                      color: region.gso_coverage > 70 ? COLORS.cyan : 
                             region.gso_coverage > 40 ? COLORS.purple : COLORS.pink,
                      fontWeight: 'bold'
                    }}>
                      {region.gso_coverage.toFixed(1)}%
                    </td>
                    <td style={{ 
                      textAlign: 'right', 
                      padding: '8px 0',
                      color: region.any_logging > 70 ? COLORS.cyan : 
                             region.any_logging > 40 ? COLORS.purple : COLORS.pink,
                      fontWeight: 'bold',
                      textShadow: region.any_logging > 70 ? `0 0 10px ${COLORS.cyan}` : 'none'
                    }}>
                      {region.any_logging.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

export default ComplianceMatrix;