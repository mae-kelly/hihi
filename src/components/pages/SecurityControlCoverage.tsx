import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Shield, Server, Activity, AlertTriangle, Lock, CheckCircle, XCircle, TrendingUp, Layers } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area } from 'recharts';

const SecurityControlCoverage = () => {
  const [securityData, setSecurityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('overview');
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
    scene.fog = new THREE.FogExp2(0x000011, 0.002);
    
    const camera = new THREE.PerspectiveCamera(75, threeDRef.current.clientWidth / threeDRef.current.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    
    renderer.setSize(threeDRef.current.clientWidth, threeDRef.current.clientHeight);
    threeDRef.current.appendChild(renderer.domElement);

    // Create security shield layers
    const controls = ['tanium', 'dlp', 'crowdstrike', 'ssc'];
    const coverage = securityData?.overall_coverage || {};
    
    controls.forEach((control, index) => {
      const radius = 30 - index * 5;
      const height = 20;
      const coveragePercent = coverage[control]?.coverage || 0;
      
      // Shield layer
      const geometry = new THREE.CylinderGeometry(radius, radius, height, 32, 1, true);
      const material = new THREE.MeshPhongMaterial({
        color: coveragePercent > 70 ? 0x00ff00 : coveragePercent > 40 ? 0xffaa00 : 0xff0000,
        transparent: true,
        opacity: 0.3 + (coveragePercent / 100) * 0.4,
        side: THREE.DoubleSide
      });
      
      const shield = new THREE.Mesh(geometry, material);
      shield.position.y = index * 5;
      scene.add(shield);
      
      // Coverage indicator
      const coveredAngle = (coveragePercent / 100) * Math.PI * 2;
      const coveredGeometry = new THREE.CylinderGeometry(radius - 1, radius - 1, height - 2, 32, 1, true, 0, coveredAngle);
      const coveredMaterial = new THREE.MeshPhongMaterial({
        color: 0x00d4ff,
        emissive: 0x00d4ff,
        emissiveIntensity: 0.3
      });
      
      const coveredMesh = new THREE.Mesh(coveredGeometry, coveredMaterial);
      coveredMesh.position.y = index * 5;
      scene.add(coveredMesh);
    });

    // Central core
    const coreGeometry = new THREE.IcosahedronGeometry(8, 1);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: 0x00d4ff,
      emissive: 0x00d4ff,
      emissiveIntensity: 0.5
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);

    // Particles for unprotected assets
    const particleCount = 500;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 100;
      positions[i + 1] = (Math.random() - 0.5) * 60;
      positions[i + 2] = (Math.random() - 0.5) * 100;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      size: 1,
      color: 0xff0000,
      transparent: true,
      opacity: 0.6
    });
    
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(50, 50, 50);
    scene.add(pointLight);

    camera.position.set(50, 30, 50);
    camera.lookAt(0, 10, 0);

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
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
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
    coverage: data.coverage,
    unprotected: totalAssets - data.deployed
  }));

  const pieData = Object.entries(overallCoverage).map(([control, data]) => ({
    name: control.toUpperCase(),
    value: data.coverage,
    deployed: data.deployed,
    color: data.coverage > 70 ? '#22c55e' : data.coverage > 40 ? '#f59e0b' : '#ef4444'
  }));

  const regionalBarData = regionalCoverage.slice(0, 10).map(region => ({
    region: region.region,
    assets: region.total_assets,
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
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-cyan-400 mb-2">Security Control Coverage Analysis</h1>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded text-sm font-bold ${
            maturityLevel === 'ADVANCED' ? 'bg-green-500/20 text-green-400' :
            maturityLevel === 'INTERMEDIATE' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            Security Maturity: {maturityLevel}
          </span>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Assets</p>
              <p className="text-2xl font-bold">{totalAssets.toLocaleString()}</p>
            </div>
            <Server className="h-8 w-8 text-cyan-400" />
          </div>
        </div>
        
        {Object.entries(overallCoverage).slice(0, 3).map(([control, data], idx) => (
          <div key={idx} className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{control.toUpperCase()}</p>
                <p className="text-2xl font-bold">{data.coverage.toFixed(1)}%</p>
                <p className="text-xs text-cyan-400">{data.deployed.toLocaleString()} protected</p>
              </div>
              <Shield className={`h-8 w-8 ${data.coverage > 70 ? 'text-green-400' : data.coverage > 40 ? 'text-yellow-400' : 'text-red-400'}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* 3D Visualization */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
            <h2 className="text-xl font-bold mb-3 text-cyan-400">Security Shield Layers</h2>
            <div ref={threeDRef} style={{ height: '300px' }} />
          </div>
        </div>

        {/* Coverage Pie Chart */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
            <h2 className="text-xl font-bold mb-3 text-cyan-400">Control Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value"
                     label={(entry) => `${entry.name}: ${entry.value.toFixed(1)}%`}>
                  {pieData.map((entry, index) => (
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

      {/* Regional Coverage Bar Chart */}
      <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30 mb-6">
        <h2 className="text-xl font-bold mb-3 text-cyan-400">Regional Security Coverage</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={regionalBarData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="region" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
            <Legend />
            <Bar dataKey="tanium" fill="#00d4ff" name="Tanium %" />
            <Bar dataKey="dlp" fill="#22c55e" name="DLP %" />
            <Bar dataKey="crowdstrike" fill="#a855f7" name="CrowdStrike %" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overall Coverage Table */}
        <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
          <h2 className="text-xl font-bold mb-3 text-cyan-400">Security Controls Summary</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-2 text-gray-400">Control</th>
                  <th className="text-right p-2 text-gray-400">Deployed</th>
                  <th className="text-right p-2 text-gray-400">Coverage %</th>
                  <th className="text-right p-2 text-gray-400">Unprotected</th>
                  <th className="text-center p-2 text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(overallCoverage).map(([control, data], idx) => (
                  <tr key={idx} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="p-2 uppercase">{control}</td>
                    <td className="p-2 text-right">{data.deployed.toLocaleString()}</td>
                    <td className="p-2 text-right">
                      <span className={`font-bold ${
                        data.coverage > 70 ? 'text-green-400' :
                        data.coverage > 40 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {data.coverage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-2 text-right text-red-400">
                      {(totalAssets - data.deployed).toLocaleString()}
                    </td>
                    <td className="p-2 text-center">
                      {data.coverage > 70 ? 
                        <CheckCircle className="w-4 h-4 text-green-400 inline" /> :
                        data.coverage > 40 ?
                        <AlertTriangle className="w-4 h-4 text-yellow-400 inline" /> :
                        <XCircle className="w-4 h-4 text-red-400 inline" />
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Regional Coverage Table */}
        <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
          <h2 className="text-xl font-bold mb-3 text-cyan-400">Regional Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-2 text-gray-400">Region</th>
                  <th className="text-right p-2 text-gray-400">Assets</th>
                  <th className="text-right p-2 text-gray-400">Tanium %</th>
                  <th className="text-right p-2 text-gray-400">DLP %</th>
                  <th className="text-right p-2 text-gray-400">CrowdStrike %</th>
                </tr>
              </thead>
              <tbody>
                {regionalCoverage.slice(0, 10).map((region, idx) => (
                  <tr key={idx} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="p-2">{region.region}</td>
                    <td className="p-2 text-right">{region.total_assets.toLocaleString()}</td>
                    <td className="p-2 text-right">
                      <span className={`font-bold ${region.tanium_coverage > 70 ? 'text-green-400' : region.tanium_coverage > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {region.tanium_coverage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-2 text-right">
                      <span className={`font-bold ${region.dlp_coverage > 70 ? 'text-green-400' : region.dlp_coverage > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {region.dlp_coverage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-2 text-right">
                      <span className={`font-bold ${region.crowdstrike_coverage > 70 ? 'text-green-400' : region.crowdstrike_coverage > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {region.crowdstrike_coverage.toFixed(1)}%
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