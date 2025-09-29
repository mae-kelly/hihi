// src/components/pages/LoggingStandards.tsx
import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FileText, CheckCircle, XCircle, AlertCircle, Shield, Database, Network, Activity, Terminal, Lock, Layers, Server, Wifi, Cloud, AlertTriangle, Eye, Target, Zap, Binary, TrendingUp } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, FunnelChart, Funnel, LabelList, AreaChart, Area } from 'recharts';

const LoggingStandards = () => {
  const [loggingData, setLoggingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStandard, setSelectedStandard] = useState('overview');
  const [hoveredMetric, setHoveredMetric] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const threeDRef = useRef(null);
  const rendererRef = useRef(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const frameCount = useRef(0);

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
        const [complianceResponse, securityResponse] = await Promise.all([
          fetch('http://localhost:5000/api/logging_compliance/breakdown'),
          fetch('http://localhost:5000/api/security_control/coverage')
        ]);
        
        if (!complianceResponse.ok || !securityResponse.ok) throw new Error('Failed to fetch');
        
        const complianceData = await complianceResponse.json();
        const securityData = await securityResponse.json();
        
        // Build logging_roles from actual API data
        const logging_roles = {};
        
        if (complianceData && securityData) {
          logging_roles['Network'] = {
            coverage: complianceData?.overall_compliance || 0,
            status: complianceData?.compliance_status === 'COMPLIANT' ? 'active' : 'partial',
            gaps: complianceData?.platform_percentages?.no_logging || 0
          };
          
          logging_roles['Endpoint'] = {
            coverage: securityData?.overall_coverage?.tanium?.coverage || 0,
            status: securityData?.security_maturity === 'ADVANCED' ? 'active' : 'warning',
            gaps: 100 - (securityData?.overall_coverage?.tanium?.coverage || 0)
          };
          
          logging_roles['Cloud'] = {
            coverage: complianceData?.regional_compliance?.[0]?.any_logging || 0,
            status: 'critical',
            gaps: 100 - (complianceData?.regional_compliance?.[0]?.any_logging || 0)
          };
          
          logging_roles['Application'] = {
            coverage: complianceData?.platform_percentages?.both_platforms || 0,
            status: 'warning',
            gaps: 100 - (complianceData?.platform_percentages?.both_platforms || 0)
          };
          
          logging_roles['Identity'] = {
            coverage: securityData?.overall_coverage?.dlp?.coverage || 0,
            status: 'active',
            gaps: 100 - (securityData?.overall_coverage?.dlp?.coverage || 0)
          };
        }
        
        setLoggingData({
          compliance: complianceData,
          security: securityData,
          logging_roles: logging_roles
        });
      } catch (error) {
        console.error('Error:', error);
        setLoggingData(null);
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

  // Epic 3D Hierarchical Tree Visualization
  useEffect(() => {
    if (!threeDRef.current || !loggingData || loading) return;

    if (rendererRef.current) {
      rendererRef.current.dispose();
      if (threeDRef.current.contains(rendererRef.current.domElement)) {
        threeDRef.current.removeChild(rendererRef.current.domElement);
      }
    }

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.001);
    
    const camera = new THREE.PerspectiveCamera(60, threeDRef.current.clientWidth / threeDRef.current.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    rendererRef.current = renderer;
    
    renderer.setSize(threeDRef.current.clientWidth, threeDRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    threeDRef.current.appendChild(renderer.domElement);

    // Central compliance core with shader material
    const complianceScore = loggingData?.compliance?.overall_compliance || 50;
    const coreGeometry = new THREE.IcosahedronGeometry(10, 2);
    const coreMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        compliance: { value: complianceScore / 100 }
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
        uniform float compliance;
        varying vec3 vPosition;
        
        void main() {
          vec3 color = mix(vec3(1.0, 0.62, 0.78), vec3(0.49, 1.0, 1.0), compliance);
          float pulse = sin(time * 2.0 + length(vPosition) * 0.5) * 0.2 + 0.8;
          gl_FragColor = vec4(color * pulse, 0.9);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);

    // Create role nodes in hierarchical layout
    const roles = Object.entries(loggingData?.logging_roles || {});
    const nodesGroup = new THREE.Group();
    
    roles.forEach(([roleName, role], index) => {
      const angle = (index / roles.length) * Math.PI * 2;
      const radius = 40;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = role.coverage > 70 ? 15 : role.coverage > 40 ? 0 : -15;
      
      // Role node group
      const nodeGroup = new THREE.Group();
      
      // Node sphere with emission
      const nodeSize = 3 + Math.log(role.coverage / 10 + 1) * 2;
      const nodeGeometry = new THREE.SphereGeometry(nodeSize, 32, 32);
      const nodeMaterial = new THREE.MeshPhongMaterial({
        color: role.status === 'critical' ? hexToThree(COLORS.pink) :
               role.status === 'warning' ? hexToThree(COLORS.purple) :
               hexToThree(COLORS.cyan),
        emissive: role.status === 'critical' ? hexToThree(COLORS.pink) :
                  role.status === 'warning' ? hexToThree(COLORS.purple) :
                  hexToThree(COLORS.cyan),
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.8
      });
      
      const nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
      nodeGroup.add(nodeMesh);
      
      // Coverage indicator rings
      const ringCount = 3;
      for (let i = 0; i < ringCount; i++) {
        const ringGeometry = new THREE.TorusGeometry(nodeSize + 2 + i * 1.5, 0.2, 8, 100);
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: hexToThree(COLORS.cyan),
          transparent: true,
          opacity: (role.coverage / 100) * (1 - i * 0.3)
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2 + (i * 0.2);
        ring.rotation.z = Math.random() * Math.PI;
        nodeGroup.add(ring);
      }
      
      nodeGroup.position.set(x, y, z);
      nodeGroup.userData = { name: roleName, data: role };
      nodesGroup.add(nodeGroup);
      
      // Energy beam connection to core
      const curvePoints = [];
      for (let i = 0; i <= 30; i++) {
        const t = i / 30;
        const bx = x * t;
        const by = y * t + Math.sin(t * Math.PI) * 5;
        const bz = z * t;
        curvePoints.push(new THREE.Vector3(bx, by, bz));
      }
      
      const curve = new THREE.CatmullRomCurve3(curvePoints);
      const tubeGeometry = new THREE.TubeGeometry(curve, 30, 0.3, 8, false);
      const tubeMaterial = new THREE.MeshBasicMaterial({
        color: role.status === 'critical' ? hexToThree(COLORS.pink) : hexToThree(COLORS.cyan),
        transparent: true,
        opacity: 0.3
      });
      const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
      nodesGroup.add(tube);
    });
    
    scene.add(nodesGroup);

    // Data flow particles
    const particleCount = 1000;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 150;
      positions[i + 1] = (Math.random() - 0.5) * 100;
      positions[i + 2] = (Math.random() - 0.5) * 150;
      
      const isCompliant = Math.random() < (complianceScore / 100);
      if (isCompliant) {
        colors[i] = 0.49;     // Neon Cyan R
        colors[i + 1] = 1.0;  // Neon Cyan G
        colors[i + 2] = 1.0;  // Neon Cyan B
      } else {
        colors[i] = 1.0;      // Neon Pink R
        colors[i + 1] = 0.62; // Neon Pink G  
        colors[i + 2] = 0.78; // Neon Pink B
      }
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
      size: 1.0,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Holographic grid
    const gridHelper = new THREE.GridHelper(200, 50, hexToThree(COLORS.cyan), hexToThree(COLORS.purple));
    gridHelper.material.opacity = 0.1;
    gridHelper.material.transparent = true;
    gridHelper.position.y = -30;
    scene.add(gridHelper);

    // Lighting
    const ambientLight = new THREE.AmbientLight(hexToThree(COLORS.white), 0.3);
    scene.add(ambientLight);
    
    const pointLight1 = new THREE.PointLight(hexToThree(COLORS.cyan), 1, 200);
    pointLight1.position.set(100, 80, 100);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(hexToThree(COLORS.purple), 0.8, 200);
    pointLight2.position.set(-100, -80, -100);
    scene.add(pointLight2);

    camera.position.set(0, 60, 120);
    camera.lookAt(0, 0, 0);

    // Animation loop
    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      frameCount.current++;
      
      const elapsedTime = clock.getElapsedTime();
      
      // Update shader uniforms
      coreMaterial.uniforms.time.value = elapsedTime;
      
      // Rotate core
      core.rotation.y += 0.002 * animationSpeed;
      core.rotation.x += 0.001 * animationSpeed;
      
      // Animate nodes
      nodesGroup.children.forEach((child, idx) => {
        if (child.type === 'Group') {
          // Floating animation
          child.position.y += Math.sin(elapsedTime + idx) * 0.05;
          
          // Rotate rings
          child.children.forEach((mesh, i) => {
            if (mesh.geometry.type === 'TorusGeometry') {
              mesh.rotation.z += 0.01 * (i + 1);
            }
          });
          
          // Pulse effect
          const scale = 1 + Math.sin(elapsedTime * 2 + idx) * 0.1;
          child.scale.set(scale, scale, scale);
        }
      });
      
      // Particle flow
      particles.rotation.y += 0.0005 * animationSpeed;
      const particlePositions = particlesGeometry.getAttribute('position').array;
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        particlePositions[i3 + 1] += Math.sin(elapsedTime * 0.5 + i * 0.1) * 0.05;
      }
      particlesGeometry.getAttribute('position').needsUpdate = true;
      
      // Camera orbit with mouse
      const time = elapsedTime * 0.1;
      camera.position.x = Math.sin(time) * 150 + mousePos.current.x * 30;
      camera.position.z = Math.cos(time) * 150 + mousePos.current.y * 30;
      camera.lookAt(0, 0, 0);
      
      // Dynamic lighting
      pointLight1.intensity = 1 + Math.sin(elapsedTime) * 0.3;
      pointLight2.intensity = 0.8 + Math.cos(elapsedTime) * 0.2;
      
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
  }, [loggingData, loading, animationSpeed]);

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
        {/* Animated background */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 50% 50%, ${COLORS.purple}22, transparent 70%)`,
          animation: 'pulse 3s ease-in-out infinite'
        }} />
        
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto' }}>
            {/* Triple rotating rings */}
            <div style={{
              position: 'absolute',
              inset: 0,
              border: `2px solid ${COLORS.cyan}`,
              borderRadius: '50%',
              borderTopColor: 'transparent',
              animation: 'spin 1s linear infinite',
              boxShadow: `0 0 20px ${COLORS.cyan}, inset 0 0 20px ${COLORS.cyan}44`
            }} />
            <div style={{
              position: 'absolute',
              inset: '10px',
              border: `2px solid ${COLORS.purple}`,
              borderRadius: '50%',
              borderRightColor: 'transparent',
              animation: 'spin 1.5s linear infinite reverse',
              boxShadow: `0 0 20px ${COLORS.purple}, inset 0 0 20px ${COLORS.purple}44`
            }} />
            <div style={{
              position: 'absolute',
              inset: '20px',
              border: `2px solid ${COLORS.pink}`,
              borderRadius: '50%',
              borderBottomColor: 'transparent',
              animation: 'spin 2s linear infinite',
              boxShadow: `0 0 20px ${COLORS.pink}, inset 0 0 20px ${COLORS.pink}44`
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
            Analyzing Standards
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

  if (!loggingData) {
    return (
      <div style={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: COLORS.black
      }}>
        <div style={{ textAlign: 'center' }}>
          <AlertTriangle size={48} style={{ color: COLORS.pink, filter: `drop-shadow(0 0 20px ${COLORS.pink})` }} />
          <p style={{ marginTop: '16px', color: COLORS.white, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
            Failed to load data
          </p>
        </div>
      </div>
    );
  }

  const complianceData = loggingData?.compliance || {};
  const securityData = loggingData?.security || {};
  const loggingRoles = loggingData?.logging_roles || {};
  const overallCompliance = complianceData?.overall_compliance || 0;

  // Prepare real data for charts
  const rolesPieData = Object.entries(loggingRoles).map(([role, data]) => ({
    name: role,
    value: data.coverage,
    status: data.status,
    fill: data.status === 'critical' ? COLORS.pink :
          data.status === 'warning' ? COLORS.purple :
          COLORS.cyan
  }));

  const complianceBarData = [
    { name: 'Splunk', value: complianceData?.platform_percentages?.splunk_only || 0, fill: COLORS.cyan },
    { name: 'GSO', value: complianceData?.platform_percentages?.gso_only || 0, fill: COLORS.purple },
    { name: 'Both', value: complianceData?.platform_percentages?.both_platforms || 0, fill: COLORS.cyan },
    { name: 'None', value: complianceData?.platform_percentages?.no_logging || 0, fill: COLORS.pink }
  ];

  const radarData = Object.entries(loggingRoles).map(([role, data]) => ({
    subject: role,
    coverage: data.coverage,
    fullMark: 100
  }));

  const pipelineData = [
    { name: 'Configure', value: 100, fill: COLORS.cyan },
    { name: 'Collect', value: 75, fill: COLORS.cyan },
    { name: 'Transport', value: 68, fill: COLORS.purple },
    { name: 'Ingest', value: 52, fill: COLORS.purple },
    { name: 'Normalize', value: 38, fill: COLORS.pink }
  ];

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
      
      {/* Header with Critical Alert */}
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
              LOGGING STANDARDS COMPLIANCE
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
                  Monitoring
                </span>
              </div>
              
              <p style={{ fontSize: '11px', color: `${COLORS.white}99`, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                Standards validation dashboard • {frameCount.current} frames
              </p>
            </div>
          </div>
          
          {/* Speed control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileText size={20} style={{ color: COLORS.purple, filter: `drop-shadow(0 0 20px ${COLORS.purple})` }} />
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
        {overallCompliance < 50 && (
          <div style={{
            marginTop: '16px',
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
              Critical:
            </span>
            <span style={{ fontSize: '11px', color: COLORS.white, opacity: 0.9 }}>
              Overall logging compliance at {overallCompliance.toFixed(1)}% - Multiple standards violations detected
            </span>
          </div>
        )}
      </div>

      {/* Key Metrics Cards with Neon Glow */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '28px' }}>
        <div 
          onMouseEnter={() => setHoveredMetric(0)}
          onMouseLeave={() => setHoveredMetric(null)}
          style={{
            backgroundColor: COLORS.black,
            border: hoveredMetric === 0 ? `1px solid ${COLORS.purple}` : '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '16px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            transform: hoveredMetric === 0 ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
            boxShadow: hoveredMetric === 0 ? `0 20px 60px ${COLORS.purple}66, 0 0 60px ${COLORS.purple}44` : `0 0 20px ${COLORS.purple}22`,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '10px', color: `${COLORS.white}66`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Overall</p>
              <p style={{ fontSize: '20px', fontWeight: 'bold', color: COLORS.white }}>{overallCompliance.toFixed(1)}%</p>
            </div>
            <FileText size={20} style={{ 
              color: COLORS.purple,
              filter: `drop-shadow(0 0 20px ${COLORS.purple})`
            }} />
          </div>
        </div>
        
        {Object.entries(loggingRoles).slice(0, 4).map(([role, data], idx) => (
          <div 
            key={idx}
            onMouseEnter={() => setHoveredMetric(idx + 1)}
            onMouseLeave={() => setHoveredMetric(null)}
            onClick={() => setSelectedRole({ name: role, ...data })}
            style={{
              backgroundColor: COLORS.black,
              border: hoveredMetric === idx + 1 ? 
                `1px solid ${data.status === 'critical' ? COLORS.pink : data.status === 'warning' ? COLORS.purple : COLORS.cyan}` :
                '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '16px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
              transform: hoveredMetric === idx + 1 ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
              boxShadow: hoveredMetric === idx + 1 ? 
                `0 20px 60px ${data.status === 'critical' ? COLORS.pink : data.status === 'warning' ? COLORS.purple : COLORS.cyan}66, 
                 0 0 60px ${data.status === 'critical' ? COLORS.pink : data.status === 'warning' ? COLORS.purple : COLORS.cyan}44` :
                `0 0 20px ${data.status === 'critical' ? COLORS.pink : data.status === 'warning' ? COLORS.purple : COLORS.cyan}22`,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '10px', color: `${COLORS.white}66`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>{role}</p>
                <p style={{ 
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: data.status === 'critical' ? COLORS.pink : data.status === 'warning' ? COLORS.purple : COLORS.cyan,
                  textShadow: `0 0 20px ${data.status === 'critical' ? COLORS.pink : data.status === 'warning' ? COLORS.purple : COLORS.cyan}`
                }}>
                  {data.coverage.toFixed(1)}%
                </p>
              </div>
              {role === 'Network' ? <Network size={20} style={{ color: COLORS.purple, filter: `drop-shadow(0 0 20px ${COLORS.purple})` }} /> :
               role === 'Endpoint' ? <Server size={20} style={{ color: COLORS.cyan, filter: `drop-shadow(0 0 20px ${COLORS.cyan})` }} /> :
               role === 'Cloud' ? <Cloud size={20} style={{ color: COLORS.purple, filter: `drop-shadow(0 0 20px ${COLORS.purple})` }} /> :
               <Lock size={20} style={{ color: COLORS.cyan, filter: `drop-shadow(0 0 20px ${COLORS.cyan})` }} />}
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '28px' }}>
        {/* 3D Visualization */}
        <div style={{ 
          backgroundColor: COLORS.black,
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '20px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Animated border */}
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
            Standards Hierarchy
          </h2>
          <div ref={threeDRef} style={{ height: '240px' }} />
        </div>

        {/* Roles Pie Chart */}
        <div style={{ 
          backgroundColor: COLORS.black,
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h2 style={{ fontSize: '12px', fontWeight: '600', color: `${COLORS.white}cc`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
            Role Coverage
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie 
                data={rolesPieData} 
                cx="50%" 
                cy="50%" 
                innerRadius={40}
                outerRadius={80} 
                paddingAngle={3}
                dataKey="value"
                animationBegin={0}
                animationDuration={1000}
                onClick={(data) => {
                  setSelectedRole(data);
                  console.log('Role selected:', data);
                }}
              >
                {rolesPieData.map((entry, index) => (
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
              <PolarAngleAxis dataKey="subject" stroke={`${COLORS.white}66`} tick={{ fontSize: 9 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} stroke={`${COLORS.white}66`} tick={{ fontSize: 8 }} />
              <Radar name="Coverage %" dataKey="coverage" stroke={COLORS.cyan} fill={COLORS.cyan} fillOpacity={0.3} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pipeline Status with Neon Glow */}
      <div style={{ 
        backgroundColor: COLORS.black,
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '28px'
      }}>
        <h2 style={{ fontSize: '12px', fontWeight: '600', color: `${COLORS.white}cc`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px' }}>
          Logging Pipeline Status
        </h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {pipelineData.map((stage, idx) => (
            <div key={idx} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
              <div style={{ 
                width: '80px',
                height: '80px',
                margin: '0 auto',
                borderRadius: '50%',
                background: `conic-gradient(${stage.fill} ${stage.value}%, ${COLORS.black} ${stage.value}%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                boxShadow: `0 0 40px ${stage.fill}66, inset 0 0 30px ${stage.fill}33`
              }}>
                <div style={{
                  position: 'absolute',
                  inset: '4px',
                  borderRadius: '50%',
                  backgroundColor: COLORS.black,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: COLORS.white }}>
                    {stage.value}%
                  </span>
                </div>
              </div>
              <p style={{ marginTop: '8px', fontSize: '10px', color: `${COLORS.white}99`, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {stage.name}
              </p>
              
              {/* Connection line */}
              {idx < pipelineData.length - 1 && (
                <div style={{
                  position: 'absolute',
                  top: '40px',
                  left: '80%',
                  width: '40%',
                  height: '2px',
                  background: `linear-gradient(90deg, ${stage.fill}, ${pipelineData[idx + 1].fill})`,
                  opacity: 0.5
                }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Platform Compliance Bar Chart */}
      <div style={{ 
        backgroundColor: COLORS.black,
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '28px'
      }}>
        <h2 style={{ fontSize: '12px', fontWeight: '600', color: `${COLORS.white}cc`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
          Platform Compliance
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={complianceBarData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis dataKey="name" stroke={`${COLORS.white}66`} tick={{ fontSize: 10, fill: `${COLORS.white}66` }} />
            <YAxis stroke={`${COLORS.white}66`} tick={{ fontSize: 10, fill: `${COLORS.white}66` }} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} animationDuration={1000}>
              {complianceBarData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Data Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        {/* Logging Roles Table */}
        <div style={{ 
          backgroundColor: COLORS.black,
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h2 style={{ fontSize: '12px', fontWeight: '600', color: `${COLORS.white}cc`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
            Role Standards
          </h2>
          <table style={{ width: '100%', fontSize: '11px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ textAlign: 'left', padding: '8px 0', color: `${COLORS.white}66` }}>Role</th>
                <th style={{ textAlign: 'right', padding: '8px 0', color: `${COLORS.white}66` }}>Coverage</th>
                <th style={{ textAlign: 'right', padding: '8px 0', color: `${COLORS.white}66` }}>Gap</th>
                <th style={{ textAlign: 'center', padding: '8px 0', color: `${COLORS.white}66` }}>Status</th>
                <th style={{ textAlign: 'center', padding: '8px 0', color: `${COLORS.white}66` }}>Risk</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(loggingRoles).map(([role, data], idx) => (
                <tr 
                  key={idx} 
                  style={{ 
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => setSelectedRole({ name: role, ...data })}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <td style={{ padding: '12px 0', color: COLORS.white }}>{role}</td>
                  <td style={{ textAlign: 'right', padding: '12px 0' }}>
                    <span style={{ 
                      fontWeight: 'bold',
                      color: data.coverage > 70 ? COLORS.cyan : data.coverage > 40 ? COLORS.purple : COLORS.pink,
                      textShadow: `0 0 10px ${data.coverage > 70 ? COLORS.cyan : data.coverage > 40 ? COLORS.purple : COLORS.pink}`
                    }}>
                      {data.coverage.toFixed(1)}%
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', padding: '12px 0', color: COLORS.pink }}>{data.gaps.toFixed(1)}%</td>
                  <td style={{ textAlign: 'center', padding: '12px 0' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '9px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      backgroundColor: data.status === 'active' ? `${COLORS.cyan}22` :
                                      data.status === 'warning' ? `${COLORS.purple}22` :
                                      data.status === 'partial' ? `${COLORS.purple}22` :
                                      `${COLORS.pink}22`,
                      color: data.status === 'active' ? COLORS.cyan :
                            data.status === 'warning' ? COLORS.purple :
                            data.status === 'partial' ? COLORS.purple :
                            COLORS.pink,
                      border: `1px solid ${data.status === 'active' ? COLORS.cyan :
                                          data.status === 'warning' ? COLORS.purple :
                                          data.status === 'partial' ? COLORS.purple :
                                          COLORS.pink}44`,
                      boxShadow: `0 0 10px ${data.status === 'active' ? COLORS.cyan :
                                            data.status === 'warning' ? COLORS.purple :
                                            data.status === 'partial' ? COLORS.purple :
                                            COLORS.pink}44`
                    }}>
                      {data.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', padding: '12px 0' }}>
                    {data.coverage < 30 ? 
                      <XCircle size={16} style={{ color: COLORS.pink, filter: `drop-shadow(0 0 10px ${COLORS.pink})` }} /> :
                     data.coverage < 70 ? 
                      <AlertCircle size={16} style={{ color: COLORS.purple, filter: `drop-shadow(0 0 10px ${COLORS.purple})` }} /> :
                      <CheckCircle size={16} style={{ color: COLORS.cyan, filter: `drop-shadow(0 0 10px ${COLORS.cyan})` }} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Critical Actions */}
        <div style={{ 
          backgroundColor: COLORS.black,
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h2 style={{ fontSize: '12px', fontWeight: '600', color: `${COLORS.white}cc`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
            Critical Actions Required
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(loggingRoles)
              .filter(([_, data]) => data.coverage < 50)
              .map(([role, data], idx) => (
                <div key={idx} style={{
                  padding: '12px',
                  background: `linear-gradient(90deg, ${COLORS.pink}11, transparent)`,
                  border: `1px solid ${COLORS.pink}44`,
                  borderRadius: '8px',
                  boxShadow: `0 0 20px ${COLORS.pink}22`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: COLORS.pink, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        {role}
                      </div>
                      <div style={{ fontSize: '10px', color: `${COLORS.white}99`, marginTop: '4px' }}>
                        Current: {data.coverage.toFixed(1)}% | Gap: {data.gaps.toFixed(1)}%
                      </div>
                    </div>
                    <Target size={16} style={{ color: COLORS.pink, filter: `drop-shadow(0 0 10px ${COLORS.pink})` }} />
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '10px', color: `${COLORS.white}66` }}>
                    {role === 'Cloud' ? 'Enable CloudTrail, VPC Flow Logs, Cloud Watch' :
                     role === 'Network' ? 'Configure SNMP/NetFlow on all network devices' :
                     role === 'Endpoint' ? 'Deploy Tanium agents to remaining endpoints' :
                     role === 'Application' ? 'Implement application-level logging standards' :
                     'Configure identity provider audit logging'}
                  </div>
                </div>
              ))}
            
            {overallCompliance > 50 && (
              <div style={{
                padding: '12px',
                background: `linear-gradient(90deg, ${COLORS.cyan}11, transparent)`,
                border: `1px solid ${COLORS.cyan}44`,
                borderRadius: '8px',
                boxShadow: `0 0 20px ${COLORS.cyan}22`
              }}>
                <div style={{ fontSize: '11px', color: COLORS.cyan, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={16} style={{ filter: `drop-shadow(0 0 10px ${COLORS.cyan})` }} />
                  Continue monitoring to reach 95% compliance target
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Role Details */}
      {selectedRole && (
        <div style={{ 
          marginTop: '20px',
          backgroundColor: COLORS.black,
          border: `1px solid ${COLORS.cyan}66`,
          borderRadius: '12px',
          padding: '20px',
          animation: 'slideUp 0.3s ease-out',
          boxShadow: `0 10px 40px ${COLORS.cyan}33, 0 0 60px ${COLORS.cyan}22`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ color: COLORS.white, fontSize: '14px', fontWeight: 'bold' }}>
              {selectedRole.name} - Detailed Analysis
            </h3>
            <button 
              onClick={() => setSelectedRole(null)}
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
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${COLORS.pink}33`;
                e.currentTarget.style.boxShadow = `0 0 20px ${COLORS.pink}44`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = `${COLORS.pink}22`;
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Close
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div>
              <p style={{ fontSize: '10px', color: `${COLORS.white}66`, marginBottom: '4px' }}>Coverage</p>
              <p style={{ fontSize: '18px', color: COLORS.cyan, fontWeight: 'bold' }}>{selectedRole.coverage?.toFixed(1)}%</p>
            </div>
            <div>
              <p style={{ fontSize: '10px', color: `${COLORS.white}66`, marginBottom: '4px' }}>Gaps</p>
              <p style={{ fontSize: '18px', color: COLORS.pink, fontWeight: 'bold' }}>{selectedRole.gaps?.toFixed(1)}%</p>
            </div>
            <div>
              <p style={{ fontSize: '10px', color: `${COLORS.white}66`, marginBottom: '4px' }}>Status</p>
              <p style={{ fontSize: '18px', color: COLORS.purple, fontWeight: 'bold', textTransform: 'uppercase' }}>{selectedRole.status}</p>
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

export default LoggingStandards;