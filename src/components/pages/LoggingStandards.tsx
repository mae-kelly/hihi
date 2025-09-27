import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FileText, CheckCircle, XCircle, AlertCircle, Shield, Database, Network, Activity, Terminal, Lock, Layers, Server, Wifi, Cloud, AlertTriangle, Eye, Target, Zap, Binary, TrendingUp } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, FunnelChart, Funnel, LabelList } from 'recharts';

const LoggingStandards = () => {
  const [loggingData, setLoggingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStandard, setSelectedStandard] = useState('overview');
  const threeDRef = useRef(null);
  const rendererRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Using multiple endpoints to gather logging standards data
        const [complianceResponse, securityResponse] = await Promise.all([
          fetch('http://localhost:5000/api/logging_compliance/breakdown'),
          fetch('http://localhost:5000/api/security_control/coverage')
        ]);
        
        if (!complianceResponse.ok || !securityResponse.ok) throw new Error('Failed to fetch');
        
        const complianceData = await complianceResponse.json();
        const securityData = await securityResponse.json();
        
        // Combine data to create logging standards view
        setLoggingData({
          compliance: complianceData,
          security: securityData,
          // Mock logging roles based on actual data structure
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
        // Set default data if API fails
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
    scene.fog = new THREE.FogExp2(0x000011, 0.001);
    
    const camera = new THREE.PerspectiveCamera(60, threeDRef.current.clientWidth / threeDRef.current.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    
    renderer.setSize(threeDRef.current.clientWidth, threeDRef.current.clientHeight);
    threeDRef.current.appendChild(renderer.domElement);

    // Central compliance core
    const complianceScore = loggingData?.compliance?.overall_compliance || 50;
    const coreGeometry = new THREE.IcosahedronGeometry(15, 2);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: complianceScore < 50 ? 0xa855f7 : complianceScore < 80 ? 0xffaa00 : 0x00d4ff,
      emissive: complianceScore < 50 ? 0xa855f7 : 0x00d4ff,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.9
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);

    // Create role nodes in hierarchical layout
    const roles = Object.entries(loggingData?.logging_roles || {});
    roles.forEach(([roleName, role], index) => {
      const angle = (index / roles.length) * Math.PI * 2;
      const radius = 50;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = role.coverage > 70 ? 20 : role.coverage > 40 ? 0 : -20;
      
      // Role node
      const nodeSize = 5 + Math.log(role.coverage / 10 + 1) * 3;
      const nodeGeometry = new THREE.SphereGeometry(nodeSize, 16, 16);
      const nodeMaterial = new THREE.MeshPhongMaterial({
        color: role.status === 'critical' ? 0xa855f7 :
               role.status === 'warning' ? 0xffaa00 :
               role.status === 'partial' ? 0xc084fc : 0x00d4ff,
        emissive: role.status === 'critical' ? 0xa855f7 : 0x00d4ff,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.8
      });
      
      const nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
      nodeMesh.position.set(x, y, z);
      scene.add(nodeMesh);
      
      // Coverage indicator
      const coverageRadius = nodeSize * (role.coverage / 100);
      const coverageGeometry = new THREE.SphereGeometry(coverageRadius, 12, 12);
      const coverageMaterial = new THREE.MeshPhongMaterial({
        color: 0x00d4ff,
        emissive: 0x00d4ff,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.9
      });
      const coverageSphere = new THREE.Mesh(coverageGeometry, coverageMaterial);
      coverageSphere.position.copy(nodeMesh.position);
      scene.add(coverageSphere);
      
      // Connection to core
      const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(x, y, z)
      ];
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: role.status === 'critical' ? 0xa855f7 : 0x00d4ff,
        transparent: true,
        opacity: 0.3
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
    });

    // Data flow particles
    const particleCount = 500;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 200;
      positions[i + 1] = (Math.random() - 0.5) * 150;
      positions[i + 2] = (Math.random() - 0.5) * 200;
      
      const isCompliant = Math.random() < (complianceScore / 100);
      colors[i] = isCompliant ? 0 : 1;
      colors[i + 1] = isCompliant ? 0.83 : 0;
      colors[i + 2] = 1;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    const pointLight1 = new THREE.PointLight(0x00d4ff, 1, 300);
    pointLight1.position.set(150, 100, 150);
    scene.add(pointLight1);
    const pointLight2 = new THREE.PointLight(0xa855f7, 1, 300);
    pointLight2.position.set(-150, -100, -150);
    scene.add(pointLight2);

    camera.position.set(0, 80, 150);
    camera.lookAt(0, 0, 0);

    const animate = () => {
      requestAnimationFrame(animate);
      core.rotation.y += 0.002;
      core.rotation.x += 0.001;
      particles.rotation.y += 0.0005;
      
      const time = Date.now() * 0.0003;
      camera.position.x = Math.sin(time) * 200;
      camera.position.z = Math.cos(time) * 200;
      camera.position.y = 80 + Math.sin(time * 2) * 20;
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
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
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
    color: data.status === 'critical' ? '#ef4444' : 
           data.status === 'warning' ? '#f59e0b' : 
           data.status === 'partial' ? '#c084fc' : '#00d4ff'
  }));

  const complianceBarData = [
    { name: 'Splunk', value: complianceData?.platform_percentages?.splunk_only || 0, deployed: complianceData?.platform_breakdown?.splunk_only || 0 },
    { name: 'GSO', value: complianceData?.platform_percentages?.gso_only || 0, deployed: complianceData?.platform_breakdown?.gso_only || 0 },
    { name: 'Both', value: complianceData?.platform_percentages?.both_platforms || 0, deployed: complianceData?.platform_breakdown?.both_platforms || 0 },
    { name: 'None', value: complianceData?.platform_percentages?.no_logging || 0, deployed: complianceData?.platform_breakdown?.no_logging || 0 }
  ];

  const radarData = Object.entries(loggingRoles).map(([role, data]) => ({
    subject: role,
    coverage: data.coverage,
    fullMark: 100
  }));

  const pipelineData = [
    { name: 'Configure', value: 100, fill: '#00d4ff' },
    { name: 'Collect', value: 75, fill: '#22c55e' },
    { name: 'Transport', value: 68, fill: '#ffaa00' },
    { name: 'Ingest', value: 52, fill: '#f59e0b' },
    { name: 'Normalize', value: 38, fill: '#ef4444' }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Header with Critical Alert */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-cyan-400 mb-2">Logging Standards Compliance Dashboard</h1>
        {overallCompliance < 50 && (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <span className="text-red-400 font-bold">CRITICAL COMPLIANCE FAILURE:</span>
            <span className="text-white">
              Overall logging compliance at {overallCompliance.toFixed(1)}% - Multiple standards violations detected
            </span>
          </div>
        )}
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Overall Compliance</p>
              <p className="text-2xl font-bold text-cyan-400">{overallCompliance.toFixed(1)}%</p>
            </div>
            <FileText className="h-8 w-8 text-cyan-400" />
          </div>
        </div>
        
        {Object.entries(loggingRoles).slice(0, 4).map(([role, data], idx) => (
          <div key={idx} className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{role}</p>
                <p className="text-2xl font-bold">
                  <span className={data.status === 'critical' ? 'text-red-400' : 
                                   data.status === 'warning' ? 'text-yellow-400' : 'text-cyan-400'}>
                    {data.coverage.toFixed(1)}%
                  </span>
                </p>
              </div>
              {role === 'Network' ? <Network className="h-8 w-8 text-purple-400" /> :
               role === 'Endpoint' ? <Server className="h-8 w-8 text-cyan-400" /> :
               role === 'Cloud' ? <Cloud className="h-8 w-8 text-purple-400" /> :
               <Lock className="h-8 w-8 text-green-400" />}
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* 3D Visualization */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
            <h2 className="text-xl font-bold mb-3 text-cyan-400">Logging Standards Hierarchy</h2>
            <div ref={threeDRef} style={{ height: '300px' }} />
          </div>
        </div>

        {/* Roles Pie Chart */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
            <h2 className="text-xl font-bold mb-3 text-cyan-400">Role Coverage Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={rolesPieData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value"
                     label={(entry) => `${entry.name}: ${entry.value.toFixed(1)}%`}>
                  {rolesPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
            <h2 className="text-xl font-bold mb-3 text-cyan-400">Coverage Radar</h2>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="subject" stroke="#9ca3af" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#9ca3af" />
                <Radar name="Coverage %" dataKey="coverage" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.6} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Pipeline Funnel Chart */}
      <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30 mb-6">
        <h2 className="text-xl font-bold mb-3 text-cyan-400">Logging Pipeline Status</h2>
        <ResponsiveContainer width="100%" height={300}>
          <FunnelChart>
            <Tooltip />
            <Funnel dataKey="value" data={pipelineData} isAnimationActive>
              <LabelList position="center" fill="#fff" stroke="none" />
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </div>

      {/* Platform Compliance Bar Chart */}
      <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30 mb-6">
        <h2 className="text-xl font-bold mb-3 text-cyan-400">Platform Compliance Breakdown</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={complianceBarData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
            <Legend />
            <Bar dataKey="value" fill="#00d4ff" name="Coverage %" />
            <Bar dataKey="deployed" fill="#22c55e" name="Deployed Count" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logging Roles Table */}
        <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
          <h2 className="text-xl font-bold mb-3 text-cyan-400">Logging Role Standards</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-2 text-gray-400">Role</th>
                  <th className="text-right p-2 text-gray-400">Coverage %</th>
                  <th className="text-right p-2 text-gray-400">Gap %</th>
                  <th className="text-center p-2 text-gray-400">Status</th>
                  <th className="text-center p-2 text-gray-400">Risk</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(loggingRoles).map(([role, data], idx) => (
                  <tr key={idx} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="p-2">{role}</td>
                    <td className="p-2 text-right">
                      <span className={`font-bold ${
                        data.coverage > 70 ? 'text-green-400' :
                        data.coverage > 40 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {data.coverage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-2 text-right text-red-400">{data.gaps.toFixed(1)}%</td>
                    <td className="p-2 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${
                        data.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        data.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                        data.status === 'partial' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {data.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      {data.coverage < 30 ? <XCircle className="w-4 h-4 text-red-400 inline" /> :
                       data.coverage < 70 ? <AlertCircle className="w-4 h-4 text-yellow-400 inline" /> :
                       <CheckCircle className="w-4 h-4 text-green-400 inline" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Critical Actions Table */}
        <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
          <h2 className="text-xl font-bold mb-3 text-cyan-400">Critical Actions Required</h2>
          <div className="space-y-3">
            {Object.entries(loggingRoles)
              .filter(([_, data]) => data.coverage < 50)
              .map(([role, data], idx) => (
                <div key={idx} className="p-3 bg-red-500/10 border border-red-500/30 rounded">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-red-400">{role.toUpperCase()}</div>
                      <div className="text-sm text-gray-300 mt-1">
                        Current: {data.coverage.toFixed(1)}% | Gap: {data.gaps.toFixed(1)}%
                      </div>
                    </div>
                    <Target className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    {role === 'Cloud' ? 'Enable CloudTrail, VPC Flow Logs immediately' :
                     role === 'Network' ? 'Configure SNMP/NetFlow on all network devices' :
                     'Deploy agent-based logging solution'}
                  </div>
                </div>
              ))}
            
            {overallCompliance > 50 && (
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded">
                <div className="text-sm text-green-400">
                  Continue monitoring and improving logging coverage to reach 95% compliance target
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