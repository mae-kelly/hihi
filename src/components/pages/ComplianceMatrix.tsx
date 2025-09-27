import React, { useState, useEffect, useRef } from 'react';
import { Shield, CheckCircle, XCircle, AlertCircle, TrendingUp, TrendingDown, FileSearch, Database, Server, Activity, AlertTriangle, Layers, Binary, Zap, ChevronRight, X, Eye } from 'lucide-react';
import * as THREE from 'three';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area } from 'recharts';

const ComplianceMatrix = () => {
  const [complianceData, setComplianceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState('both');
  const [selectedTab, setSelectedTab] = useState('overview');
  const matrixRef = useRef(null);
  const rendererRef = useRef(null);

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

  // 3D Compliance Matrix Visualization
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

    // Create compliance matrix grid
    const platformGroup = new THREE.Group();
    
    // Splunk Platform (Left)
    const splunkPercent = complianceData?.platform_percentages?.splunk_only || 0;
    const splunkTotal = complianceData?.platform_breakdown?.splunk_only || 0;
    
    const splunkRadius = 25;
    const splunkHeight = 50;
    
    // Outer cylinder for Splunk
    const splunkOuterGeometry = new THREE.CylinderGeometry(splunkRadius, splunkRadius, splunkHeight, 32, 1, true);
    const splunkOuterMaterial = new THREE.MeshPhongMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    const splunkOuter = new THREE.Mesh(splunkOuterGeometry, splunkOuterMaterial);
    splunkOuter.position.x = -30;
    platformGroup.add(splunkOuter);
    
    // Inner filled cylinder for Splunk
    const splunkFillHeight = splunkHeight * (splunkPercent / 100);
    if (splunkFillHeight > 0) {
      const splunkFillGeometry = new THREE.CylinderGeometry(splunkRadius - 2, splunkRadius - 2, splunkFillHeight, 32);
      const splunkFillMaterial = new THREE.MeshPhongMaterial({
        color: 0x00d4ff,
        emissive: 0x00d4ff,
        emissiveIntensity: 0.3
      });
      const splunkFill = new THREE.Mesh(splunkFillGeometry, splunkFillMaterial);
      splunkFill.position.x = -30;
      splunkFill.position.y = -splunkHeight/2 + splunkFillHeight/2;
      platformGroup.add(splunkFill);
    }
    
    // GSO Platform (Right)
    const gsoPercent = complianceData?.platform_percentages?.gso_only || 0;
    
    const gsoRadius = 25;
    const gsoHeight = 50;
    
    // Outer cylinder for GSO
    const gsoOuterGeometry = new THREE.CylinderGeometry(gsoRadius, gsoRadius, gsoHeight, 32, 1, true);
    const gsoOuterMaterial = new THREE.MeshPhongMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    const gsoOuter = new THREE.Mesh(gsoOuterGeometry, gsoOuterMaterial);
    gsoOuter.position.x = 30;
    platformGroup.add(gsoOuter);
    
    // Inner filled cylinder for GSO
    const gsoFillHeight = gsoHeight * (gsoPercent / 100);
    if (gsoFillHeight > 0) {
      const gsoFillGeometry = new THREE.CylinderGeometry(gsoRadius - 2, gsoRadius - 2, gsoFillHeight, 32);
      const gsoFillMaterial = new THREE.MeshPhongMaterial({
        color: 0xa855f7,
        emissive: 0xa855f7,
        emissiveIntensity: 0.3
      });
      const gsoFill = new THREE.Mesh(gsoFillGeometry, gsoFillMaterial);
      gsoFill.position.x = 30;
      gsoFill.position.y = -gsoHeight/2 + gsoFillHeight/2;
      platformGroup.add(gsoFill);
    }
    
    // Central bridge for both platforms
    const bothPercent = complianceData?.platform_percentages?.both_platforms || 0;
    const bridgeHeight = gsoHeight * (bothPercent / 100);
    if (bridgeHeight > 0) {
      const bridgeGeometry = new THREE.BoxGeometry(60, bridgeHeight, 10);
      const bridgeMaterial = new THREE.MeshPhongMaterial({
        color: 0x22c55e,
        emissive: 0x22c55e,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.7
      });
      const bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
      bridge.position.y = -gsoHeight/2 + bridgeHeight/2;
      platformGroup.add(bridge);
    }
    
    scene.add(platformGroup);
    
    // Non-compliant particles
    const noLoggingPercent = complianceData?.platform_percentages?.no_logging || 0;
    const particleCount = Math.min(500, Math.floor(noLoggingPercent * 10));
    
    if (particleCount > 0) {
      const particlesGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      
      for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 150;
        positions[i + 1] = (Math.random() - 0.5) * 100;
        positions[i + 2] = (Math.random() - 0.5) * 150;
      }
      
      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      
      const particlesMaterial = new THREE.PointsMaterial({
        size: 2,
        color: 0xff0000,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
      });
      
      const particles = new THREE.Points(particlesGeometry, particlesMaterial);
      scene.add(particles);
    }
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const pointLight1 = new THREE.PointLight(0x00d4ff, 1, 200);
    pointLight1.position.set(100, 50, 100);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0xa855f7, 1, 200);
    pointLight2.position.set(-100, 50, -100);
    scene.add(pointLight2);
    
    camera.position.set(0, 50, 120);
    camera.lookAt(0, 0, 0);
    
    // Animation
    const animate = () => {
      requestAnimationFrame(animate);
      platformGroup.rotation.y += 0.002;
      renderer.render(scene, camera);
    };
    
    animate();
    
    return () => {
      if (rendererRef.current && matrixRef.current) {
        matrixRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [complianceData, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
          <div className="mt-4 text-cyan-400">Loading Compliance Data...</div>
        </div>
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
    { name: 'Splunk Only', value: platformPercentages.splunk_only || 0, color: '#00d4ff' },
    { name: 'GSO Only', value: platformPercentages.gso_only || 0, color: '#a855f7' },
    { name: 'Both Platforms', value: platformPercentages.both_platforms || 0, color: '#22c55e' },
    { name: 'No Logging', value: platformPercentages.no_logging || 0, color: '#ef4444' }
  ];

  const regionalData = regionalCompliance.slice(0, 10).map(region => ({
    region: region.region,
    splunk: region.splunk_coverage,
    gso: region.gso_coverage,
    any: region.any_logging
  }));

  const radarData = regionalCompliance.slice(0, 6).map(region => ({
    subject: region.region,
    splunk: region.splunk_coverage,
    gso: region.gso_coverage,
    combined: region.any_logging
  }));

  const areaChartData = regionalCompliance.slice(0, 8).map(region => ({
    name: region.region,
    splunk: region.splunk_coverage,
    gso: region.gso_coverage,
    gap: 100 - region.any_logging
  }));

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Header with Alert */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-cyan-400 mb-2">Logging Compliance Matrix</h1>
        {platformPercentages.no_logging > 30 && (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <span className="text-red-400 font-bold">CRITICAL:</span>
            <span className="text-white">{platformPercentages.no_logging?.toFixed(1)}% of assets have no logging enabled</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setSelectedTab('overview')} className={`px-4 py-2 rounded ${selectedTab === 'overview' ? 'bg-cyan-600' : 'bg-gray-700'}`}>
          Overview
        </button>
        <button onClick={() => setSelectedTab('regional')} className={`px-4 py-2 rounded ${selectedTab === 'regional' ? 'bg-cyan-600' : 'bg-gray-700'}`}>
          Regional
        </button>
        <button onClick={() => setSelectedTab('platforms')} className={`px-4 py-2 rounded ${selectedTab === 'platforms' ? 'bg-cyan-600' : 'bg-gray-700'}`}>
          Platforms
        </button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Assets</p>
              <p className="text-2xl font-bold">{totalAssets.toLocaleString()}</p>
            </div>
            <Server className="h-8 w-8 text-cyan-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Overall Compliance</p>
              <p className="text-2xl font-bold text-cyan-400">{overallCompliance.toFixed(1)}%</p>
            </div>
            <Shield className="h-8 w-8 text-cyan-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 border border-green-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Both Platforms</p>
              <p className="text-2xl font-bold text-green-400">{platformPercentages.both_platforms?.toFixed(1)}%</p>
              <p className="text-xs text-gray-400">{platformBreakdown.both_platforms?.toLocaleString()} hosts</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 border border-yellow-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Single Platform</p>
              <p className="text-2xl font-bold text-yellow-400">
                {((platformPercentages.splunk_only || 0) + (platformPercentages.gso_only || 0)).toFixed(1)}%
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 border border-red-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">No Logging</p>
              <p className="text-2xl font-bold text-red-400">{platformPercentages.no_logging?.toFixed(1)}%</p>
              <p className="text-xs text-gray-400">{platformBreakdown.no_logging?.toLocaleString()} hosts</p>
            </div>
            <XCircle className="h-8 w-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      {selectedTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* 3D Matrix Visualization */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
              <h2 className="text-xl font-bold mb-3 text-cyan-400">Compliance Matrix 3D</h2>
              <div ref={matrixRef} style={{ height: '300px' }} />
            </div>
          </div>

          {/* Pie Chart */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
              <h2 className="text-xl font-bold mb-3 text-cyan-400">Platform Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={compliancePieData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value"
                       label={(entry) => `${entry.name}: ${entry.value.toFixed(1)}%`}>
                    {compliancePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Card */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
              <h2 className="text-xl font-bold mb-3 text-cyan-400">Compliance Status</h2>
              <div className="flex items-center justify-center h-[250px]">
                <div className="text-center">
                  <div className={`text-5xl font-bold mb-4 ${
                    complianceStatus === 'COMPLIANT' ? 'text-green-400' :
                    complianceStatus === 'PARTIAL' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {complianceStatus}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Splunk Coverage:</span>
                      <span className="text-white">{(platformPercentages.splunk_only + platformPercentages.both_platforms).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">GSO Coverage:</span>
                      <span className="text-white">{(platformPercentages.gso_only + platformPercentages.both_platforms).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Regional Tab Content */}
      {selectedTab === 'regional' && (
        <div className="space-y-6">
          {/* Regional Bar Chart */}
          <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
            <h2 className="text-xl font-bold mb-3 text-cyan-400">Regional Compliance Analysis</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={regionalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="region" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                <Legend />
                <Bar dataKey="splunk" fill="#00d4ff" name="Splunk %" />
                <Bar dataKey="gso" fill="#a855f7" name="GSO %" />
                <Bar dataKey="any" fill="#22c55e" name="Any Logging %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Radar Chart */}
          <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
            <h2 className="text-xl font-bold mb-3 text-cyan-400">Regional Coverage Radar</h2>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="subject" stroke="#9ca3af" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#9ca3af" />
                <Radar name="Splunk" dataKey="splunk" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.3} />
                <Radar name="GSO" dataKey="gso" stroke="#a855f7" fill="#a855f7" fillOpacity={0.3} />
                <Radar name="Combined" dataKey="combined" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Area Chart */}
      {selectedTab === 'platforms' && (
        <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30 mb-6">
          <h2 className="text-xl font-bold mb-3 text-cyan-400">Platform Coverage Trends</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={areaChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
              <Legend />
              <Area type="monotone" dataKey="splunk" stackId="1" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.6} name="Splunk %" />
              <Area type="monotone" dataKey="gso" stackId="1" stroke="#a855f7" fill="#a855f7" fillOpacity={0.6} name="GSO %" />
              <Area type="monotone" dataKey="gap" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Gap %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Breakdown Table */}
        <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
          <h2 className="text-xl font-bold mb-3 text-cyan-400">Platform Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-2 text-gray-400">Platform Configuration</th>
                  <th className="text-right p-2 text-gray-400">Host Count</th>
                  <th className="text-right p-2 text-gray-400">Percentage</th>
                  <th className="text-center p-2 text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-700 hover:bg-gray-700/50">
                  <td className="p-2">Splunk Only</td>
                  <td className="p-2 text-right">{platformBreakdown.splunk_only?.toLocaleString()}</td>
                  <td className="p-2 text-right text-cyan-400">{platformPercentages.splunk_only?.toFixed(1)}%</td>
                  <td className="p-2 text-center"><AlertCircle className="w-4 h-4 text-yellow-400 inline" /></td>
                </tr>
                <tr className="border-b border-gray-700 hover:bg-gray-700/50">
                  <td className="p-2">GSO Only</td>
                  <td className="p-2 text-right">{platformBreakdown.gso_only?.toLocaleString()}</td>
                  <td className="p-2 text-right text-purple-400">{platformPercentages.gso_only?.toFixed(1)}%</td>
                  <td className="p-2 text-center"><AlertCircle className="w-4 h-4 text-yellow-400 inline" /></td>
                </tr>
                <tr className="border-b border-gray-700 hover:bg-gray-700/50">
                  <td className="p-2">Both Platforms</td>
                  <td className="p-2 text-right">{platformBreakdown.both_platforms?.toLocaleString()}</td>
                  <td className="p-2 text-right text-green-400">{platformPercentages.both_platforms?.toFixed(1)}%</td>
                  <td className="p-2 text-center"><CheckCircle className="w-4 h-4 text-green-400 inline" /></td>
                </tr>
                <tr className="border-b border-gray-700 hover:bg-gray-700/50">
                  <td className="p-2">No Logging</td>
                  <td className="p-2 text-right">{platformBreakdown.no_logging?.toLocaleString()}</td>
                  <td className="p-2 text-right text-red-400">{platformPercentages.no_logging?.toFixed(1)}%</td>
                  <td className="p-2 text-center"><XCircle className="w-4 h-4 text-red-400 inline" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Regional Compliance Table */}
        <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
          <h2 className="text-xl font-bold mb-3 text-cyan-400">Regional Compliance</h2>
          <div className="overflow-x-auto max-h-64">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-800">
                <tr className="border-b border-gray-700">
                  <th className="text-left p-2 text-gray-400">Region</th>
                  <th className="text-right p-2 text-gray-400">Assets</th>
                  <th className="text-right p-2 text-gray-400">Splunk %</th>
                  <th className="text-right p-2 text-gray-400">GSO %</th>
                  <th className="text-right p-2 text-gray-400">Any %</th>
                </tr>
              </thead>
              <tbody>
                {regionalCompliance.map((region, idx) => (
                  <tr key={idx} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="p-2">{region.region}</td>
                    <td className="p-2 text-right">{region.total_assets.toLocaleString()}</td>
                    <td className="p-2 text-right">
                      <span className={`font-bold ${region.splunk_coverage > 70 ? 'text-green-400' : region.splunk_coverage > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {region.splunk_coverage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-2 text-right">
                      <span className={`font-bold ${region.gso_coverage > 70 ? 'text-green-400' : region.gso_coverage > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {region.gso_coverage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-2 text-right">
                      <span className={`font-bold ${region.any_logging > 70 ? 'text-green-400' : region.any_logging > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {region.any_logging.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceMatrix;