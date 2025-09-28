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
  const threeDRef = useRef(null);
  const rendererRef = useRef(null);

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
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    
    renderer.setSize(threeDRef.current.clientWidth, threeDRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    threeDRef.current.appendChild(renderer.domElement);

    // Create security shield layers
    const controls = ['tanium', 'dlp', 'crowdstrike', 'ssc'];
    const coverage = securityData?.overall_coverage || {};
    
    controls.forEach((control, index) => {
      const radius = 25 - index * 4;
      const height = 15;
      const coveragePercent = coverage[control]?.coverage || 0;
      
      // Shield layer
      const geometry = new THREE.CylinderGeometry(radius, radius, height, 32, 1, true);
      const material = new THREE.MeshPhongMaterial({
        color: coveragePercent > 70 ? 0x00ff88 : coveragePercent > 40 ? 0xff8800 : 0xff0044,
        transparent: true,
        opacity: 0.2 + (coveragePercent / 100) * 0.3,
        side: THREE.DoubleSide
      });
      
      const shield = new THREE.Mesh(geometry, material);
      shield.position.y = index * 4;
      scene.add(shield);
      
      // Coverage indicator
      const coveredAngle = (coveragePercent / 100) * Math.PI * 2;
      const coveredGeometry = new THREE.CylinderGeometry(radius - 1, radius - 1, height - 2, 32, 1, true, 0, coveredAngle);
      const coveredMaterial = new THREE.MeshPhongMaterial({
        color: 0x00d4ff,
        emissive: 0x00d4ff,
        emissiveIntensity: 0.2
      });
      
      const coveredMesh = new THREE.Mesh(coveredGeometry, coveredMaterial);
      coveredMesh.position.y = index * 4;
      scene.add(coveredMesh);
    });

    // Central core
    const coreGeometry = new THREE.IcosahedronGeometry(6, 1);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: 0x00d4ff,
      emissive: 0x00d4ff,
      emissiveIntensity: 0.3
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);

    // Particles for unprotected assets
    const particleCount = 300;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 80;
      positions[i + 1] = (Math.random() - 0.5) * 50;
      positions[i + 2] = (Math.random() - 0.5) * 80;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.5,
      color: 0xff0044,
      transparent: true,
      opacity: 0.3
    });
    
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0x00d4ff, 0.5);
    pointLight.position.set(50, 50, 50);
    scene.add(pointLight);

    camera.position.set(40, 25, 40);
    camera.lookAt(0, 8, 0);

    const animate = () => {
      requestAnimationFrame(animate);
      scene.rotation.y += 0.002;
      core.rotation.y += 0.01;
      particles.rotation.y -= 0.001;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (rendererRef.current && threeDRef.current) {
        threeDRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [securityData, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-10 w-10 border-b border-green-400/50"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-10 w-10 border border-green-400/20"></div>
          </div>
          <div className="mt-3 text-[10px] text-white/40 uppercase tracking-[0.2em] animate-pulse">Scanning Security...</div>
        </div>
      </div>
    );
  }

  const totalAssets = securityData?.total_assets || 0;
  const overallCoverage = securityData?.overall_coverage || {};
  const regionalCoverage = securityData?.regional_coverage || [];
  const maturityLevel = securityData?.security_maturity || 'BASIC';

  // Prepare chart data
  const controlsBarData = Object.entries(overallCoverage).map(([control, data]) => ({
    name: control.toUpperCase(),
    deployed: data.deployed,
    coverage: data.coverage
  }));

  const pieData = Object.entries(overallCoverage).map(([control, data]) => ({
    name: control.toUpperCase(),
    value: data.coverage,
    deployed: data.deployed,
    color: data.coverage > 70 ? 'rgba(0, 255, 136, 0.7)' : 
           data.coverage > 40 ? 'rgba(255, 170, 0, 0.7)' : 'rgba(255, 0, 68, 0.7)'
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

  return (
    <div className="p-3 h-full overflow-auto bg-black">
      {/* Grid background */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none"
           style={{
             backgroundImage: 'linear-gradient(rgba(0, 255, 136, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 136, 0.3) 1px, transparent 1px)',
             backgroundSize: '50px 50px'
           }} />
      
      {/* Header */}
      <div className="mb-4 relative">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white/90 tracking-tight">SECURITY CONTROL COVERAGE</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
              <p className="text-[9px] text-white/40 uppercase tracking-[0.15em]">Agent deployment analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-2 py-0.5 rounded text-[9px] font-medium ${
              maturityLevel === 'ADVANCED' ? 'bg-green-500/20 text-green-400 border border-green-400/30' :
              maturityLevel === 'INTERMEDIATE' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-400/30' :
              'bg-red-500/20 text-red-400 border border-red-400/30'
            }`}>
              {maturityLevel} MATURITY
            </span>
            <div className="flex items-center gap-2">
              <Shield className="w-3 h-3 text-green-400/60 animate-pulse" />
              <span className="text-[10px] text-white/50">Security</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div 
          onMouseEnter={() => setHoveredMetric(0)}
          onMouseLeave={() => setHoveredMetric(null)}
          className={`relative bg-black/60 backdrop-blur-xl rounded-lg p-3 border transition-all duration-300 cursor-pointer
            ${hoveredMetric === 0 ? 'border-green-400/40 transform -translate-y-0.5' : 'border-white/10'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] text-white/40 uppercase tracking-[0.1em] font-medium">Total Assets</p>
              <p className={`text-base font-bold mt-1 transition-colors ${
                hoveredMetric === 0 ? 'text-green-400' : 'text-white/90'
              }`}>{totalAssets.toLocaleString()}</p>
            </div>
            <Server className={`h-4 w-4 transition-all ${
              hoveredMetric === 0 ? 'text-green-400/80' : 'text-white/20'
            }`} />
          </div>
        </div>
        
        {Object.entries(overallCoverage).slice(0, 3).map(([control, data], idx) => (
          <div 
            key={idx}
            onMouseEnter={() => setHoveredMetric(idx + 1)}
            onMouseLeave={() => setHoveredMetric(null)}
            className={`relative bg-black/60 backdrop-blur-xl rounded-lg p-3 border transition-all duration-300 cursor-pointer
              ${hoveredMetric === idx + 1 ? 'border-green-400/40 transform -translate-y-0.5' : 'border-white/10'}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-white/40 uppercase tracking-[0.1em] font-medium">{control.toUpperCase()}</p>
                <p className={`text-base font-bold mt-1 transition-colors ${
                  hoveredMetric === idx + 1 ? 'text-green-400' : 'text-white/90'
                }`}>{data.coverage.toFixed(1)}%</p>
                <p className="text-[9px] text-cyan-400/60 mt-0.5">{data.deployed.toLocaleString()} protected</p>
              </div>
              <Shield className={`h-4 w-4 transition-all ${
                data.coverage > 70 ? 'text-green-400/60' : 
                data.coverage > 40 ? 'text-yellow-400/60' : 'text-red-400/60'
              }`} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        {/* 3D Visualization */}
        <div className="col-span-1">
          <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-green-400/50 to-transparent" />
            <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Security Shield Layers</h2>
            <div ref={threeDRef} style={{ height: '240px' }} />
          </div>
        </div>

        {/* Coverage Pie Chart */}
        <div className="col-span-1">
          <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
            <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Control Distribution</h2>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie 
                  data={pieData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={40}
                  outerRadius={80} 
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.95)', 
                    border: '1px solid rgba(0, 255, 136, 0.2)',
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
                <Radar name="Coverage %" dataKey="coverage" stroke="rgba(0, 255, 136, 0.6)" fill="rgba(0, 255, 136, 0.2)" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.95)', 
                    border: '1px solid rgba(0, 255, 136, 0.2)',
                    borderRadius: '4px',
                    fontSize: '10px'
                  }} 
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Regional Coverage Bar Chart */}
      <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden mb-3">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-green-400/50 to-transparent" />
        <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Regional Security Coverage</h2>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={regionalBarData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" />
            <XAxis dataKey="region" stroke="#ffffff20" tick={{ fontSize: 9 }} />
            <YAxis stroke="#ffffff20" tick={{ fontSize: 9 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.95)', 
                border: '1px solid rgba(0, 255, 136, 0.2)',
                borderRadius: '4px',
                fontSize: '10px'
              }} 
            />
            <Bar dataKey="tanium" fill="rgba(0, 212, 255, 0.5)" radius={[2, 2, 0, 0]} />
            <Bar dataKey="dlp" fill="rgba(0, 255, 136, 0.5)" radius={[2, 2, 0, 0]} />
            <Bar dataKey="crowdstrike" fill="rgba(168, 85, 247, 0.5)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Data Tables */}
      <div className="grid grid-cols-2 gap-3">
        {/* Overall Coverage Table */}
        <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-green-400/50 to-transparent" />
          <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Security Controls Summary</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-1.5 text-white/30 font-medium uppercase tracking-wider">Control</th>
                  <th className="text-right py-1.5 text-white/30 font-medium uppercase tracking-wider">Deployed</th>
                  <th className="text-right py-1.5 text-white/30 font-medium uppercase tracking-wider">Coverage</th>
                  <th className="text-center py-1.5 text-white/30 font-medium uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(overallCoverage).map(([control, data], idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-1.5 text-white/70 uppercase">{control}</td>
                    <td className="py-1.5 text-right text-white/50 font-mono">{data.deployed.toLocaleString()}</td>
                    <td className="py-1.5 text-right">
                      <span className={`font-bold ${
                        data.coverage > 70 ? 'text-green-400/80' :
                        data.coverage > 40 ? 'text-yellow-400/80' : 'text-red-400/80'
                      }`}>
                        {data.coverage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-1.5 text-center">
                      {data.coverage > 70 ? 
                        <CheckCircle className="w-3 h-3 text-green-400 inline" /> :
                        data.coverage > 40 ?
                        <AlertTriangle className="w-3 h-3 text-yellow-400 inline" /> :
                        <XCircle className="w-3 h-3 text-red-400 inline" />
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Regional Coverage Table */}
        <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
          <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Regional Breakdown</h2>
          <div className="overflow-x-auto max-h-32">
            <table className="w-full text-[10px]">
              <thead className="sticky top-0 bg-black/60">
                <tr className="border-b border-white/5">
                  <th className="text-left py-1.5 text-white/30 font-medium uppercase tracking-wider">Region</th>
                  <th className="text-right py-1.5 text-white/30 font-medium uppercase tracking-wider">Assets</th>
                  <th className="text-right py-1.5 text-white/30 font-medium uppercase tracking-wider">Tanium</th>
                  <th className="text-right py-1.5 text-white/30 font-medium uppercase tracking-wider">DLP</th>
                </tr>
              </thead>
              <tbody>
                {regionalCoverage.slice(0, 10).map((region, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-1.5 text-white/70">{region.region}</td>
                    <td className="py-1.5 text-right text-white/50 font-mono">{region.total_assets.toLocaleString()}</td>
                    <td className="py-1.5 text-right">
                      <span className={`${
                        region.tanium_coverage > 70 ? 'text-green-400/80' : 
                        region.tanium_coverage > 40 ? 'text-yellow-400/80' : 'text-red-400/80'
                      }`}>
                        {region.tanium_coverage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-1.5 text-right">
                      <span className={`${
                        region.dlp_coverage > 70 ? 'text-green-400/80' : 
                        region.dlp_coverage > 40 ? 'text-yellow-400/80' : 'text-red-400/80'
                      }`}>
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
    </div>
  );
};

export default SecurityControlCoverage;