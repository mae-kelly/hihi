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
  const threeDRef = useRef(null);
  const rendererRef = useRef(null);

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
        
        setLoggingData({
          compliance: complianceData,
          security: securityData,
          logging_roles: {
            'Network': {
              coverage: complianceData?.overall_compliance || 45.2,
              status: complianceData?.compliance_status === 'COMPLIANT' ? 'active' : 'partial',
              gaps: complianceData?.platform_percentages?.no_logging || 0
            },
            'Endpoint': {
              coverage: securityData?.overall_coverage?.tanium?.coverage || 69.29,
              status: securityData?.security_maturity === 'ADVANCED' ? 'active' : 'warning',
              gaps: 100 - (securityData?.overall_coverage?.tanium?.coverage || 0)
            },
            'Cloud': {
              coverage: complianceData?.regional_compliance?.[0]?.any_logging || 19.17,
              status: 'critical',
              gaps: 100 - (complianceData?.regional_compliance?.[0]?.any_logging || 0)
            },
            'Application': {
              coverage: complianceData?.platform_percentages?.both_platforms || 42.8,
              status: 'warning',
              gaps: 100 - (complianceData?.platform_percentages?.both_platforms || 0)
            },
            'Identity': {
              coverage: securityData?.overall_coverage?.dlp?.coverage || 82.3,
              status: 'active',
              gaps: 100 - (securityData?.overall_coverage?.dlp?.coverage || 0)
            }
          }
        });
      } catch (error) {
        console.error('Error:', error);
        setLoggingData({
          compliance: {},
          security: {},
          logging_roles: {}
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // 3D Hierarchical Tree Visualization
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
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    
    renderer.setSize(threeDRef.current.clientWidth, threeDRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    threeDRef.current.appendChild(renderer.domElement);

    // Central compliance core
    const complianceScore = loggingData?.compliance?.overall_compliance || 50;
    const coreGeometry = new THREE.IcosahedronGeometry(10, 2);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: complianceScore < 50 ? 0xff0044 : complianceScore < 80 ? 0xff8800 : 0x00d4ff,
      emissive: complianceScore < 50 ? 0xff0044 : 0x00d4ff,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.8
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);

    // Create role nodes in hierarchical layout
    const roles = Object.entries(loggingData?.logging_roles || {});
    roles.forEach(([roleName, role], index) => {
      const angle = (index / roles.length) * Math.PI * 2;
      const radius = 40;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = role.coverage > 70 ? 15 : role.coverage > 40 ? 0 : -15;
      
      // Role node
      const nodeSize = 3 + Math.log(role.coverage / 10 + 1) * 2;
      const nodeGeometry = new THREE.SphereGeometry(nodeSize, 16, 16);
      const nodeMaterial = new THREE.MeshPhongMaterial({
        color: role.status === 'critical' ? 0xff0044 :
               role.status === 'warning' ? 0xff8800 :
               role.status === 'partial' ? 0xa855f7 : 0x00d4ff,
        emissive: role.status === 'critical' ? 0xff0044 : 0x00d4ff,
        emissiveIntensity: 0.1,
        transparent: true,
        opacity: 0.7
      });
      
      const nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
      nodeMesh.position.set(x, y, z);
      scene.add(nodeMesh);
      
      // Coverage indicator ring
      const ringGeometry = new THREE.TorusGeometry(nodeSize + 2, 0.3, 8, 100);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff88,
        transparent: true,
        opacity: role.coverage / 100
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.copy(nodeMesh.position);
      ring.rotation.x = Math.PI / 2;
      scene.add(ring);
      
      // Connection to core
      const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(x, y, z)
      ];
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: role.status === 'critical' ? 0xff0044 : 0x00d4ff,
        transparent: true,
        opacity: 0.2
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
    });

    // Data flow particles
    const particleCount = 400;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 150;
      positions[i + 1] = (Math.random() - 0.5) * 100;
      positions[i + 2] = (Math.random() - 0.5) * 150;
      
      const isCompliant = Math.random() < (complianceScore / 100);
      colors[i] = isCompliant ? 0 : 1;
      colors[i + 1] = isCompliant ? 0.83 : 0;
      colors[i + 2] = 1;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);
    const pointLight1 = new THREE.PointLight(0x00d4ff, 0.5, 200);
    pointLight1.position.set(100, 80, 100);
    scene.add(pointLight1);
    const pointLight2 = new THREE.PointLight(0xa855f7, 0.5, 200);
    pointLight2.position.set(-100, -80, -100);
    scene.add(pointLight2);

    camera.position.set(0, 60, 120);
    camera.lookAt(0, 0, 0);

    const animate = () => {
      requestAnimationFrame(animate);
      core.rotation.y += 0.002;
      core.rotation.x += 0.001;
      particles.rotation.y += 0.0005;
      
      const time = Date.now() * 0.0002;
      camera.position.x = Math.sin(time) * 150;
      camera.position.z = Math.cos(time) * 150;
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
  }, [loggingData, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-10 w-10 border-b border-yellow-400/50"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-10 w-10 border border-yellow-400/20"></div>
          </div>
          <div className="mt-3 text-[10px] text-white/40 uppercase tracking-[0.2em] animate-pulse">Analyzing Standards...</div>
        </div>
      </div>
    );
  }

  const complianceData = loggingData?.compliance || {};
  const securityData = loggingData?.security || {};
  const loggingRoles = loggingData?.logging_roles || {};
  const overallCompliance = complianceData?.overall_compliance || 0;

  // Prepare chart data
  const rolesPieData = Object.entries(loggingRoles).map(([role, data]) => ({
    name: role,
    value: data.coverage,
    status: data.status,
    color: data.status === 'critical' ? 'rgba(255, 0, 68, 0.7)' : 
           data.status === 'warning' ? 'rgba(255, 136, 0, 0.7)' : 
           data.status === 'partial' ? 'rgba(168, 85, 247, 0.7)' : 'rgba(0, 212, 255, 0.7)'
  }));

  const complianceBarData = [
    { name: 'Splunk', value: complianceData?.platform_percentages?.splunk_only || 0 },
    { name: 'GSO', value: complianceData?.platform_percentages?.gso_only || 0 },
    { name: 'Both', value: complianceData?.platform_percentages?.both_platforms || 0 },
    { name: 'None', value: complianceData?.platform_percentages?.no_logging || 0 }
  ];

  const radarData = Object.entries(loggingRoles).map(([role, data]) => ({
    subject: role,
    coverage: data.coverage,
    fullMark: 100
  }));

  const pipelineData = [
    { name: 'Configure', value: 100, fill: 'rgba(0, 212, 255, 0.7)' },
    { name: 'Collect', value: 75, fill: 'rgba(0, 255, 136, 0.7)' },
    { name: 'Transport', value: 68, fill: 'rgba(255, 170, 0, 0.7)' },
    { name: 'Ingest', value: 52, fill: 'rgba(245, 158, 11, 0.7)' },
    { name: 'Normalize', value: 38, fill: 'rgba(255, 0, 68, 0.7)' }
  ];

  return (
    <div className="p-3 h-full overflow-auto bg-black">
      {/* Grid background */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none"
           style={{
             backgroundImage: 'linear-gradient(rgba(255, 170, 0, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 170, 0, 0.3) 1px, transparent 1px)',
             backgroundSize: '50px 50px'
           }} />
      
      {/* Header with Critical Alert */}
      <div className="mb-4 relative">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white/90 tracking-tight">LOGGING STANDARDS COMPLIANCE</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1 h-1 rounded-full bg-yellow-400 animate-pulse" />
              <p className="text-[9px] text-white/40 uppercase tracking-[0.15em]">Standards validation dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-3 h-3 text-yellow-400/60 animate-pulse" />
            <span className="text-[10px] text-white/50">Standards</span>
          </div>
        </div>

        {overallCompliance < 50 && (
          <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-lg p-2 flex items-center gap-2">
            <AlertTriangle className="h-3 w-3 text-red-400" />
            <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Critical:</span>
            <span className="text-[10px] text-white/80">
              Overall logging compliance at {overallCompliance.toFixed(1)}% - Multiple standards violations
            </span>
          </div>
        )}
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        <div 
          onMouseEnter={() => setHoveredMetric(0)}
          onMouseLeave={() => setHoveredMetric(null)}
          className={`relative bg-black/60 backdrop-blur-xl rounded-lg p-3 border transition-all duration-300 cursor-pointer
            ${hoveredMetric === 0 ? 'border-yellow-400/40 transform -translate-y-0.5' : 'border-white/10'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] text-white/40 uppercase tracking-[0.1em] font-medium">Overall</p>
              <p className={`text-base font-bold mt-1 transition-colors ${
                hoveredMetric === 0 ? 'text-yellow-400' : 'text-white/90'
              }`}>{overallCompliance.toFixed(1)}%</p>
            </div>
            <FileText className={`h-4 w-4 transition-all ${
              hoveredMetric === 0 ? 'text-yellow-400/80' : 'text-white/20'
            }`} />
          </div>
        </div>
        
        {Object.entries(loggingRoles).slice(0, 4).map(([role, data], idx) => (
          <div 
            key={idx}
            onMouseEnter={() => setHoveredMetric(idx + 1)}
            onMouseLeave={() => setHoveredMetric(null)}
            className={`relative bg-black/60 backdrop-blur-xl rounded-lg p-3 border transition-all duration-300 cursor-pointer
              ${hoveredMetric === idx + 1 ? 'border-yellow-400/40 transform -translate-y-0.5' : 'border-white/10'}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-white/40 uppercase tracking-[0.1em] font-medium">{role}</p>
                <p className={`text-base font-bold mt-1 transition-colors ${
                  data.status === 'critical' ? 'text-red-400' : 
                  data.status === 'warning' ? 'text-yellow-400' : 
                  hoveredMetric === idx + 1 ? 'text-cyan-400' : 'text-white/90'
                }`}>
                  {data.coverage.toFixed(1)}%
                </p>
              </div>
              {role === 'Network' ? <Network className="h-4 w-4 text-purple-400/40" /> :
               role === 'Endpoint' ? <Server className="h-4 w-4 text-cyan-400/40" /> :
               role === 'Cloud' ? <Cloud className="h-4 w-4 text-purple-400/40" /> :
               <Lock className="h-4 w-4 text-green-400/40" />}
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        {/* 3D Visualization */}
        <div className="col-span-1">
          <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent" />
            <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Standards Hierarchy</h2>
            <div ref={threeDRef} style={{ height: '240px' }} />
          </div>
        </div>

        {/* Roles Pie Chart */}
        <div className="col-span-1">
          <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
            <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Role Coverage</h2>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie 
                  data={rolesPieData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={40}
                  outerRadius={80} 
                  paddingAngle={2}
                  dataKey="value"
                >
                  {rolesPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.95)', 
                    border: '1px solid rgba(255, 170, 0, 0.2)',
                    borderRadius: '4px',
                    fontSize: '10px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="col-span-1">
          <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
            <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Coverage Radar</h2>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255, 255, 255, 0.05)" />
                <PolarAngleAxis dataKey="subject" stroke="#ffffff20" tick={{ fontSize: 8 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#ffffff20" tick={{ fontSize: 8 }} />
                <Radar name="Coverage %" dataKey="coverage" stroke="rgba(255, 170, 0, 0.6)" fill="rgba(255, 170, 0, 0.2)" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.95)', 
                    border: '1px solid rgba(255, 170, 0, 0.2)',
                    borderRadius: '4px',
                    fontSize: '10px'
                  }} 
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Pipeline Status */}
      <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden mb-3">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent" />
        <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Logging Pipeline Status</h2>
        <div className="flex justify-between items-center px-6">
          {pipelineData.map((stage, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-white/10 flex items-center justify-center">
                  <div 
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(${stage.fill} ${stage.value}%, transparent ${stage.value}%)`,
                      opacity: 0.3
                    }}
                  />
                  <span className="text-[10px] font-bold text-white/80">{stage.value}%</span>
                </div>
                <p className="text-[9px] text-white/40 mt-2 uppercase tracking-wider">{stage.name}</p>
              </div>
              {idx < pipelineData.length - 1 && (
                <div className="absolute ml-16 mt-8 w-20 h-0.5 bg-white/10">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-400 to-purple-400"
                    style={{ width: `${stage.value}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Platform Compliance Bar Chart */}
      <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden mb-3">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
        <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Platform Compliance</h2>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={complianceBarData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" />
            <XAxis dataKey="name" stroke="#ffffff20" tick={{ fontSize: 9 }} />
            <YAxis stroke="#ffffff20" tick={{ fontSize: 9 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.95)', 
                border: '1px solid rgba(255, 170, 0, 0.2)',
                borderRadius: '4px',
                fontSize: '10px'
              }} 
            />
            <Bar dataKey="value" fill="rgba(255, 170, 0, 0.5)" radius={[2, 2, 0, 0]}>
              {complianceBarData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={
                  entry.name === 'Both' ? 'rgba(0, 255, 136, 0.5)' :
                  entry.name === 'None' ? 'rgba(255, 0, 68, 0.5)' :
                  'rgba(255, 170, 0, 0.5)'
                } />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Data Tables */}
      <div className="grid grid-cols-2 gap-3">
        {/* Logging Roles Table */}
        <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent" />
          <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Role Standards</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-1.5 text-white/30 font-medium uppercase tracking-wider">Role</th>
                  <th className="text-right py-1.5 text-white/30 font-medium uppercase tracking-wider">Coverage</th>
                  <th className="text-right py-1.5 text-white/30 font-medium uppercase tracking-wider">Gap</th>
                  <th className="text-center py-1.5 text-white/30 font-medium uppercase tracking-wider">Status</th>
                  <th className="text-center py-1.5 text-white/30 font-medium uppercase tracking-wider">Risk</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(loggingRoles).map(([role, data], idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-1.5 text-white/70">{role}</td>
                    <td className="py-1.5 text-right">
                      <span className={`font-bold ${
                        data.coverage > 70 ? 'text-green-400/80' :
                        data.coverage > 40 ? 'text-yellow-400/80' : 'text-red-400/80'
                      }`}>
                        {data.coverage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-1.5 text-right text-red-400/60">{data.gaps.toFixed(1)}%</td>
                    <td className="py-1.5 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                        data.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        data.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                        data.status === 'partial' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {data.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-1.5 text-center">
                      {data.coverage < 30 ? <XCircle className="w-3 h-3 text-red-400 inline" /> :
                       data.coverage < 70 ? <AlertCircle className="w-3 h-3 text-yellow-400 inline" /> :
                       <CheckCircle className="w-3 h-3 text-green-400 inline" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Critical Actions Table */}
        <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-400/50 to-transparent" />
          <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Critical Actions</h2>
          <div className="space-y-2">
            {Object.entries(loggingRoles)
              .filter(([_, data]) => data.coverage < 50)
              .map(([role, data], idx) => (
                <div key={idx} className="p-2 bg-red-500/10 border border-red-500/20 rounded">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider">{role}</div>
                      <div className="text-[9px] text-white/60 mt-1">
                        Current: {data.coverage.toFixed(1)}% | Gap: {data.gaps.toFixed(1)}%
                      </div>
                    </div>
                    <Target className="w-3 h-3 text-red-400" />
                  </div>
                  <div className="mt-1 text-[9px] text-white/40">
                    {role === 'Cloud' ? 'Enable CloudTrail, VPC Flow Logs' :
                     role === 'Network' ? 'Configure SNMP/NetFlow on devices' :
                     'Deploy agent-based logging'}
                  </div>
                </div>
              ))}
            
            {overallCompliance > 50 && (
              <div className="p-2 bg-green-500/10 border border-green-500/20 rounded">
                <div className="text-[10px] text-green-400">
                  Continue monitoring to reach 95% compliance target
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoggingStandards;