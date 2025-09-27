import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Monitor, Server, Cloud, Database, Network, AlertTriangle, Activity, Cpu, HardDrive, Shield, Zap, Layers, Terminal, Binary } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area, Treemap } from 'recharts';

const SystemClassification = () => {
  const [systemData, setSystemData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const threeDRef = useRef(null);
  const rendererRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/system_classification/breakdown');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setSystemData(data);
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

  // 3D OS Galaxy
  useEffect(() => {
    if (!threeDRef.current || !systemData || loading) return;

    if (rendererRef.current) {
      rendererRef.current.dispose();
      if (threeDRef.current.contains(rendererRef.current.domElement)) {
        threeDRef.current.removeChild(rendererRef.current.domElement);
      }
    }

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000011, 0.001);
    
    const camera = new THREE.PerspectiveCamera(75, threeDRef.current.clientWidth / threeDRef.current.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    
    renderer.setSize(threeDRef.current.clientWidth, threeDRef.current.clientHeight);
    threeDRef.current.appendChild(renderer.domElement);

    // Central core
    const coreGeometry = new THREE.IcosahedronGeometry(10, 2);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: 0x00d4ff,
      emissive: 0x00d4ff,
      emissiveIntensity: 0.3
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);

    // Create OS category orbits
    const categorySummary = systemData?.category_summary || [];
    categorySummary.forEach((category, index) => {
      const orbitRadius = 30 + index * 15;
      
      // Orbit ring
      const ringGeometry = new THREE.TorusGeometry(orbitRadius, 0.3, 8, 100);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: category.category === 'Windows Server' ? 0x00d4ff :
               category.category === 'Linux Server' ? 0x22c55e :
               category.category === '*Nix' ? 0xffaa00 :
               category.category === 'Network Appliance' ? 0xa855f7 : 0xef4444,
        transparent: true,
        opacity: 0.3
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      scene.add(ring);
      
      // System nodes on orbit
      const nodeCount = Math.min(8, Math.ceil(category.total_assets / 1000));
      for (let i = 0; i < nodeCount; i++) {
        const angle = (i / nodeCount) * Math.PI * 2;
        const x = Math.cos(angle) * orbitRadius;
        const z = Math.sin(angle) * orbitRadius;
        
        const nodeGeometry = new THREE.SphereGeometry(2 + Math.log(category.total_assets / 1000 + 1), 8, 8);
        const nodeMaterial = new THREE.MeshPhongMaterial({
          color: ringMaterial.color,
          emissive: ringMaterial.color,
          emissiveIntensity: 0.2
        });
        const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
        node.position.set(x, 0, z);
        scene.add(node);
      }
    });

    // Particles
    const particleCount = 500;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 150;
      positions[i + 1] = (Math.random() - 0.5) * 100;
      positions[i + 2] = (Math.random() - 0.5) * 150;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      size: 1,
      color: 0x00d4ff,
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

    camera.position.set(0, 50, 100);
    camera.lookAt(0, 0, 0);

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
  }, [systemData, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  const systemBreakdown = systemData?.system_breakdown || [];
  const categorySummary = systemData?.category_summary || [];
  const totalSystems = systemData?.total_systems || 0;

  // Prepare chart data
  const categoryPieData = categorySummary.map(cat => ({
    name: cat.category,
    value: cat.total_assets,
    cmdb: cat.cmdb_coverage,
    tanium: cat.tanium_coverage,
    color: cat.category === 'Windows Server' ? '#00d4ff' :
           cat.category === 'Linux Server' ? '#22c55e' :
           cat.category === '*Nix' ? '#ffaa00' :
           cat.category === 'Network Appliance' ? '#a855f7' : '#ef4444'
  }));

  const systemBarData = systemBreakdown.slice(0, 15).map(sys => ({
    name: sys.system.length > 20 ? sys.system.substring(0, 20) + '...' : sys.system,
    assets: sys.total_assets,
    cmdb: sys.cmdb_coverage,
    tanium: sys.tanium_coverage,
    visibility: sys.overall_visibility
  }));

  const radarData = categorySummary.map(cat => ({
    subject: cat.category,
    cmdb: cat.cmdb_coverage,
    tanium: cat.tanium_coverage
  }));

  const treemapData = systemBreakdown.slice(0, 20).map(sys => ({
    name: sys.system,
    size: sys.total_assets,
    visibility: sys.overall_visibility
  }));

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-cyan-400 mb-2">System Classification Analysis</h1>
        <div className="flex gap-2">
          <button onClick={() => setSelectedCategory('all')} 
                  className={`px-4 py-2 rounded ${selectedCategory === 'all' ? 'bg-cyan-600' : 'bg-gray-700'}`}>
            All Systems
          </button>
          <button onClick={() => setSelectedCategory('Windows Server')} 
                  className={`px-4 py-2 rounded ${selectedCategory === 'Windows Server' ? 'bg-cyan-600' : 'bg-gray-700'}`}>
            Windows
          </button>
          <button onClick={() => setSelectedCategory('Linux Server')} 
                  className={`px-4 py-2 rounded ${selectedCategory === 'Linux Server' ? 'bg-cyan-600' : 'bg-gray-700'}`}>
            Linux
          </button>
          <button onClick={() => setSelectedCategory('*Nix')} 
                  className={`px-4 py-2 rounded ${selectedCategory === '*Nix' ? 'bg-cyan-600' : 'bg-gray-700'}`}>
            *Nix
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Systems</p>
              <p className="text-2xl font-bold">{totalSystems}</p>
            </div>
            <Monitor className="h-8 w-8 text-cyan-400" />
          </div>
        </div>
        
        {categorySummary.slice(0, 3).map((cat, idx) => (
          <div key={idx} className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{cat.category}</p>
                <p className="text-2xl font-bold">{cat.total_assets.toLocaleString()}</p>
                <p className="text-xs text-cyan-400">CMDB: {cat.cmdb_coverage.toFixed(1)}%</p>
              </div>
              {cat.category === 'Windows Server' ? <Server className="h-8 w-8 text-cyan-400" /> :
               cat.category === 'Linux Server' ? <Terminal className="h-8 w-8 text-green-400" /> :
               <Database className="h-8 w-8 text-yellow-400" />}
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* 3D OS Galaxy */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
            <h2 className="text-xl font-bold mb-3 text-cyan-400">OS Galaxy</h2>
            <div ref={threeDRef} style={{ height: '300px' }} />
          </div>
        </div>

        {/* Category Pie Chart */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
            <h2 className="text-xl font-bold mb-3 text-cyan-400">Category Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={categoryPieData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value"
                     label={(entry) => `${entry.name}: ${entry.cmdb.toFixed(1)}%`}>
                  {categoryPieData.map((entry, index) => (
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
                <Radar name="CMDB %" dataKey="cmdb" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.6} />
                <Radar name="Tanium %" dataKey="tanium" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                <Tooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* System Bar Chart */}
      <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30 mb-6">
        <h2 className="text-xl font-bold mb-3 text-cyan-400">Top Systems Coverage</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={systemBarData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" height={100} />
            <YAxis stroke="#9ca3af" />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
            <Legend />
            <Bar dataKey="cmdb" fill="#00d4ff" name="CMDB %" />
            <Bar dataKey="tanium" fill="#22c55e" name="Tanium %" />
            <Bar dataKey="visibility" fill="#a855f7" name="Visibility %" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Breakdown Table */}
        <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
          <h2 className="text-xl font-bold mb-3 text-cyan-400">System Breakdown</h2>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-800">
                <tr className="border-b border-gray-700">
                  <th className="text-left p-2 text-gray-400">System</th>
                  <th className="text-right p-2 text-gray-400">Assets</th>
                  <th className="text-right p-2 text-gray-400">CMDB %</th>
                  <th className="text-right p-2 text-gray-400">Tanium %</th>
                  <th className="text-right p-2 text-gray-400">Visibility %</th>
                </tr>
              </thead>
              <tbody>
                {systemBreakdown
                  .filter(sys => selectedCategory === 'all' || sys.system.includes(selectedCategory))
                  .slice(0, 20)
                  .map((sys, idx) => (
                    <tr key={idx} className="border-b border-gray-700 hover:bg-gray-700/50">
                      <td className="p-2">{sys.system}</td>
                      <td className="p-2 text-right">{sys.total_assets.toLocaleString()}</td>
                      <td className="p-2 text-right">
                        <span className={`font-bold ${sys.cmdb_coverage > 70 ? 'text-green-400' : sys.cmdb_coverage > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {sys.cmdb_coverage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-2 text-right">
                        <span className={`font-bold ${sys.tanium_coverage > 70 ? 'text-green-400' : sys.tanium_coverage > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {sys.tanium_coverage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-2 text-right">
                        <span className={`font-bold ${sys.overall_visibility > 70 ? 'text-green-400' : sys.overall_visibility > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {sys.overall_visibility.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Summary Table */}
        <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
          <h2 className="text-xl font-bold mb-3 text-cyan-400">Category Summary</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-2 text-gray-400">Category</th>
                  <th className="text-right p-2 text-gray-400">Assets</th>
                  <th className="text-right p-2 text-gray-400">CMDB %</th>
                  <th className="text-right p-2 text-gray-400">Tanium %</th>
                </tr>
              </thead>
              <tbody>
                {categorySummary.map((cat, idx) => (
                  <tr key={idx} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="p-2 flex items-center gap-2">
                      {cat.category === 'Windows Server' ? <Server className="h-4 w-4 text-cyan-400" /> :
                       cat.category === 'Linux Server' ? <Terminal className="h-4 w-4 text-green-400" /> :
                       cat.category === '*Nix' ? <Cpu className="h-4 w-4 text-yellow-400" /> :
                       cat.category === 'Network Appliance' ? <Network className="h-4 w-4 text-purple-400" /> :
                       <Database className="h-4 w-4 text-red-400" />}
                      {cat.category}
                    </td>
                    <td className="p-2 text-right">{cat.total_assets.toLocaleString()}</td>
                    <td className="p-2 text-right">
                      <span className={`font-bold ${cat.cmdb_coverage > 70 ? 'text-green-400' : cat.cmdb_coverage > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {cat.cmdb_coverage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-2 text-right">
                      <span className={`font-bold ${cat.tanium_coverage > 70 ? 'text-green-400' : cat.tanium_coverage > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {cat.tanium_coverage.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Treemap */}
      <div className="mt-6 bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
        <h2 className="text-xl font-bold mb-3 text-cyan-400">System Distribution Treemap</h2>
        <ResponsiveContainer width="100%" height={400}>
          <Treemap
            data={treemapData}
            dataKey="size"
            aspectRatio={4 / 3}
            stroke="#fff"
            fill="#8884d8"
          >
            <Tooltip />
          </Treemap>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SystemClassification;