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
    
    const splunkRadius = 20;
    const splunkHeight = 40;
    
    // Outer cylinder for Splunk
    const splunkOuterGeometry = new THREE.CylinderGeometry(splunkRadius, splunkRadius, splunkHeight, 32, 1, true);
    const splunkOuterMaterial = new THREE.MeshPhongMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide
    });
    const splunkOuter = new THREE.Mesh(splunkOuterGeometry, splunkOuterMaterial);
    splunkOuter.position.x = -25;
    platformGroup.add(splunkOuter);
    
    // Inner filled cylinder for Splunk
    const splunkFillHeight = splunkHeight * (splunkPercent / 100);
    if (splunkFillHeight > 0) {
      const splunkFillGeometry = new THREE.CylinderGeometry(splunkRadius - 2, splunkRadius - 2, splunkFillHeight, 32);
      const splunkFillMaterial = new THREE.MeshPhongMaterial({
        color: 0x00d4ff,
        emissive: 0x00d4ff,
        emissiveIntensity: 0.2
      });
      const splunkFill = new THREE.Mesh(splunkFillGeometry, splunkFillMaterial);
      splunkFill.position.x = -25;
      splunkFill.position.y = -splunkHeight/2 + splunkFillHeight/2;
      platformGroup.add(splunkFill);
    }
    
    // GSO Platform (Right)
    const gsoPercent = complianceData?.platform_percentages?.gso_only || 0;
    
    const gsoRadius = 20;
    const gsoHeight = 40;
    
    // Outer cylinder for GSO
    const gsoOuterGeometry = new THREE.CylinderGeometry(gsoRadius, gsoRadius, gsoHeight, 32, 1, true);
    const gsoOuterMaterial = new THREE.MeshPhongMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide
    });
    const gsoOuter = new THREE.Mesh(gsoOuterGeometry, gsoOuterMaterial);
    gsoOuter.position.x = 25;
    platformGroup.add(gsoOuter);
    
    // Inner filled cylinder for GSO
    const gsoFillHeight = gsoHeight * (gsoPercent / 100);
    if (gsoFillHeight > 0) {
      const gsoFillGeometry = new THREE.CylinderGeometry(gsoRadius - 2, gsoRadius - 2, gsoFillHeight, 32);
      const gsoFillMaterial = new THREE.MeshPhongMaterial({
        color: 0xa855f7,
        emissive: 0xa855f7,
        emissiveIntensity: 0.2
      });
      const gsoFill = new THREE.Mesh(gsoFillGeometry, gsoFillMaterial);
      gsoFill.position.x = 25;
      gsoFill.position.y = -gsoHeight/2 + gsoFillHeight/2;
      platformGroup.add(gsoFill);
    }
    
    // Central bridge for both platforms
    const bothPercent = complianceData?.platform_percentages?.both_platforms || 0;
    const bridgeHeight = gsoHeight * (bothPercent / 100);
    if (bridgeHeight > 0) {
      const bridgeGeometry = new THREE.BoxGeometry(50, bridgeHeight, 8);
      const bridgeMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ff88,
        emissive: 0x00ff88,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.6
      });
      const bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
      bridge.position.y = -gsoHeight/2 + bridgeHeight/2;
      platformGroup.add(bridge);
    }
    
    scene.add(platformGroup);
    
    // Non-compliant particles
    const noLoggingPercent = complianceData?.platform_percentages?.no_logging || 0;
    const particleCount = Math.min(300, Math.floor(noLoggingPercent * 6));
    
    if (particleCount > 0) {
      const particlesGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      
      for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 120;
        positions[i + 1] = (Math.random() - 0.5) * 80;
        positions[i + 2] = (Math.random() - 0.5) * 120;
      }
      
      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      
      const particlesMaterial = new THREE.PointsMaterial({
        size: 1,
        color: 0xff0044,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending
      });
      
      const particles = new THREE.Points(particlesGeometry, particlesMaterial);
      scene.add(particles);
    }
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);
    
    const pointLight1 = new THREE.PointLight(0x00d4ff, 0.5, 200);
    pointLight1.position.set(80, 50, 80);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0xa855f7, 0.5, 200);
    pointLight2.position.set(-80, 50, -80);
    scene.add(pointLight2);
    
    camera.position.set(0, 40, 100);
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
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-10 w-10 border-b border-purple-400/50"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-10 w-10 border border-purple-400/20"></div>
          </div>
          <div className="mt-3 text-[10px] text-white/40 uppercase tracking-[0.2em] animate-pulse">Loading Compliance...</div>
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
    { name: 'Splunk Only', value: platformPercentages.splunk_only || 0, color: 'rgba(0, 212, 255, 0.7)' },
    { name: 'GSO Only', value: platformPercentages.gso_only || 0, color: 'rgba(168, 85, 247, 0.7)' },
    { name: 'Both Platforms', value: platformPercentages.both_platforms || 0, color: 'rgba(0, 255, 136, 0.7)' },
    { name: 'No Logging', value: platformPercentages.no_logging || 0, color: 'rgba(255, 0, 68, 0.7)' }
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

  return (
    <div className="p-3 h-full overflow-auto bg-black">
      {/* Grid background */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none"
           style={{
             backgroundImage: 'linear-gradient(rgba(168, 85, 247, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(168, 85, 247, 0.3) 1px, transparent 1px)',
             backgroundSize: '50px 50px'
           }} />
      
      {/* Header with Alert */}
      <div className="mb-4 relative">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white/90 tracking-tight">LOGGING COMPLIANCE MATRIX</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1 h-1 rounded-full bg-purple-400 animate-pulse" />
              <p className="text-[9px] text-white/40 uppercase tracking-[0.15em]">Platform logging analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FileSearch className="w-3 h-3 text-purple-400/60 animate-pulse" />
            <span className="text-[10px] text-white/50">Compliance</span>
          </div>
        </div>
        
        {platformPercentages.no_logging > 30 && (
          <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-lg p-2 flex items-center gap-2">
            <AlertTriangle className="h-3 w-3 text-red-400" />
            <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Critical:</span>
            <span className="text-[10px] text-white/80">{platformPercentages.no_logging?.toFixed(1)}% of assets have no logging</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {['overview', 'regional', 'platforms'].map(tab => (
          <button 
            key={tab}
            onClick={() => setSelectedTab(tab)} 
            className={`px-3 py-1 text-[10px] font-medium uppercase tracking-wider rounded transition-all duration-200 ${
              selectedTab === tab 
                ? 'bg-gradient-to-r from-purple-500/10 to-cyan-500/10 text-white border border-purple-400/30' 
                : 'bg-black/40 text-white/40 border border-white/5 hover:text-white/60 hover:border-white/10'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        {[
          { label: 'Total Assets', value: totalAssets.toLocaleString(), icon: Server },
          { label: 'Overall Compliance', value: `${overallCompliance.toFixed(1)}%`, icon: Shield, color: 'cyan' },
          { label: 'Both Platforms', value: `${platformPercentages.both_platforms?.toFixed(1)}%`, icon: CheckCircle, color: 'green' },
          { label: 'Single Platform', value: `${((platformPercentages.splunk_only || 0) + (platformPercentages.gso_only || 0)).toFixed(1)}%`, icon: AlertCircle, color: 'yellow' },
          { label: 'No Logging', value: `${platformPercentages.no_logging?.toFixed(1)}%`, icon: XCircle, color: 'red', critical: true }
        ].map((metric, idx) => (
          <div 
            key={idx}
            onMouseEnter={() => setHoveredMetric(idx)}
            onMouseLeave={() => setHoveredMetric(null)}
            className={`relative bg-black/60 backdrop-blur-xl rounded-lg p-3 border transition-all duration-300 cursor-pointer
              ${hoveredMetric === idx ? 'border-purple-400/40 transform -translate-y-0.5' : 'border-white/10'}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-white/40 uppercase tracking-[0.1em] font-medium">{metric.label}</p>
                <p className={`text-sm font-bold mt-1 transition-colors ${
                  hoveredMetric === idx ? 
                    (metric.critical ? 'text-red-400' : metric.color === 'green' ? 'text-green-400' : 'text-purple-400') : 
                    (metric.critical ? 'text-red-400/80' : 'text-white/90')
                }`}>{metric.value}</p>
              </div>
              <metric.icon className={`h-3 w-3 transition-all ${
                metric.critical ? 'text-red-400/60' :
                metric.color === 'green' ? 'text-green-400/60' :
                metric.color === 'yellow' ? 'text-yellow-400/60' :
                metric.color === 'cyan' ? 'text-cyan-400/60' :
                'text-white/20'
              }`} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Grid */}
      {selectedTab === 'overview' && (
        <div className="grid grid-cols-3 gap-3 mb-3">
          {/* 3D Matrix Visualization */}
          <div className="col-span-1">
            <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
              <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Compliance Matrix 3D</h2>
              <div ref={matrixRef} style={{ height: '240px' }} />
            </div>
          </div>

          {/* Pie Chart */}
          <div className="col-span-1">
            <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
              <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Platform Distribution</h2>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie 
                    data={compliancePieData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={40}
                    outerRadius={80} 
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {compliancePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0, 0, 0, 0.95)', 
                      border: '1px solid rgba(168, 85, 247, 0.2)',
                      borderRadius: '4px',
                      fontSize: '10px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Card */}
          <div className="col-span-1">
            <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-green-400/50 to-transparent" />
              <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Compliance Status</h2>
              <div className="flex items-center justify-center h-[200px]">
                <div className="text-center">
                  <div className={`text-3xl font-bold mb-3 ${
                    complianceStatus === 'COMPLIANT' ? 'text-green-400' :
                    complianceStatus === 'PARTIAL' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {complianceStatus}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/40">Splunk Coverage:</span>
                      <span className="text-white/70 font-mono">{(platformPercentages.splunk_only + platformPercentages.both_platforms).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/40">GSO Coverage:</span>
                      <span className="text-white/70 font-mono">{(platformPercentages.gso_only + platformPercentages.both_platforms).toFixed(1)}%</span>
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
        <div className="space-y-3">
          {/* Regional Bar Chart */}
          <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
            <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Regional Compliance Analysis</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={regionalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" />
                <XAxis dataKey="region" stroke="#ffffff20" tick={{ fontSize: 9 }} />
                <YAxis stroke="#ffffff20" tick={{ fontSize: 9 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.95)', 
                    border: '1px solid rgba(168, 85, 247, 0.2)',
                    borderRadius: '4px',
                    fontSize: '10px'
                  }} 
                />
                <Bar dataKey="splunk" fill="rgba(0, 212, 255, 0.5)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="gso" fill="rgba(168, 85, 247, 0.5)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="any" fill="rgba(0, 255, 136, 0.5)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Radar Chart */}
          <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
            <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Regional Coverage Radar</h2>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255, 255, 255, 0.05)" />
                <PolarAngleAxis dataKey="subject" stroke="#ffffff20" tick={{ fontSize: 8 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#ffffff20" tick={{ fontSize: 8 }} />
                <Radar name="Splunk" dataKey="splunk" stroke="rgba(0, 212, 255, 0.6)" fill="rgba(0, 212, 255, 0.2)" />
                <Radar name="GSO" dataKey="gso" stroke="rgba(168, 85, 247, 0.6)" fill="rgba(168, 85, 247, 0.2)" />
                <Radar name="Combined" dataKey="combined" stroke="rgba(0, 255, 136, 0.6)" fill="rgba(0, 255, 136, 0.2)" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.95)', 
                    border: '1px solid rgba(168, 85, 247, 0.2)',
                    borderRadius: '4px',
                    fontSize: '10px'
                  }} 
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Data Tables */}
      <div className="grid grid-cols-2 gap-3">
        {/* Platform Breakdown Table */}
        <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
          <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Platform Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-1.5 text-white/30 font-medium uppercase tracking-wider">Configuration</th>
                  <th className="text-right py-1.5 text-white/30 font-medium uppercase tracking-wider">Hosts</th>
                  <th className="text-right py-1.5 text-white/30 font-medium uppercase tracking-wider">Percentage</th>
                  <th className="text-center py-1.5 text-white/30 font-medium uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="py-1.5 text-white/70">Splunk Only</td>
                  <td className="py-1.5 text-right text-white/50 font-mono">{platformBreakdown.splunk_only?.toLocaleString()}</td>
                  <td className="py-1.5 text-right text-cyan-400/80">{platformPercentages.splunk_only?.toFixed(1)}%</td>
                  <td className="py-1.5 text-center"><AlertCircle className="w-3 h-3 text-yellow-400 inline" /></td>
                </tr>
                <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="py-1.5 text-white/70">GSO Only</td>
                  <td className="py-1.5 text-right text-white/50 font-mono">{platformBreakdown.gso_only?.toLocaleString()}</td>
                  <td className="py-1.5 text-right text-purple-400/80">{platformPercentages.gso_only?.toFixed(1)}%</td>
                  <td className="py-1.5 text-center"><AlertCircle className="w-3 h-3 text-yellow-400 inline" /></td>
                </tr>
                <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="py-1.5 text-white/70">Both Platforms</td>
                  <td className="py-1.5 text-right text-white/50 font-mono">{platformBreakdown.both_platforms?.toLocaleString()}</td>
                  <td className="py-1.5 text-right text-green-400/80">{platformPercentages.both_platforms?.toFixed(1)}%</td>
                  <td className="py-1.5 text-center"><CheckCircle className="w-3 h-3 text-green-400 inline" /></td>
                </tr>
                <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="py-1.5 text-white/70">No Logging</td>
                  <td className="py-1.5 text-right text-white/50 font-mono">{platformBreakdown.no_logging?.toLocaleString()}</td>
                  <td className="py-1.5 text-right text-red-400/80">{platformPercentages.no_logging?.toFixed(1)}%</td>
                  <td className="py-1.5 text-center"><XCircle className="w-3 h-3 text-red-400 inline" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Regional Compliance Table */}
        <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
          <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Regional Compliance</h2>
          <div className="overflow-x-auto max-h-32">
            <table className="w-full text-[10px]">
              <thead className="sticky top-0 bg-black/60">
                <tr className="border-b border-white/5">
                  <th className="text-left py-1.5 text-white/30 font-medium uppercase tracking-wider">Region</th>
                  <th className="text-right py-1.5 text-white/30 font-medium uppercase tracking-wider">Assets</th>
                  <th className="text-right py-1.5 text-white/30 font-medium uppercase tracking-wider">Splunk</th>
                  <th className="text-right py-1.5 text-white/30 font-medium uppercase tracking-wider">GSO</th>
                  <th className="text-right py-1.5 text-white/30 font-medium uppercase tracking-wider">Any</th>
                </tr>
              </thead>
              <tbody>
                {regionalCompliance.slice(0, 10).map((region, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-1.5 text-white/70">{region.region}</td>
                    <td className="py-1.5 text-right text-white/50 font-mono">{region.total_assets.toLocaleString()}</td>
                    <td className="py-1.5 text-right">
                      <span className={`${
                        region.splunk_coverage > 70 ? 'text-green-400/80' : 
                        region.splunk_coverage > 40 ? 'text-yellow-400/80' : 'text-red-400/80'
                      }`}>
                        {region.splunk_coverage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-1.5 text-right">
                      <span className={`${
                        region.gso_coverage > 70 ? 'text-green-400/80' : 
                        region.gso_coverage > 40 ? 'text-yellow-400/80' : 'text-red-400/80'
                      }`}>
                        {region.gso_coverage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-1.5 text-right">
                      <span className={`font-bold ${
                        region.any_logging > 70 ? 'text-green-400/80' : 
                        region.any_logging > 40 ? 'text-yellow-400/80' : 'text-red-400/80'
                      }`}>
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