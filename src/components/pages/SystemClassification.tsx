// src/components/pages/SystemClassification.tsx
import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Monitor, Server, Cloud, Database, Network, AlertTriangle, Activity, Cpu, HardDrive, Shield, Zap, Layers, Terminal, Binary } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area, Treemap } from 'recharts';

const SystemClassification = () => {
  const [systemData, setSystemData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [hoveredMetric, setHoveredMetric] = useState(null);
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
    scene.fog = new THREE.FogExp2(0x000000, 0.001);
    
    const camera = new THREE.PerspectiveCamera(75, threeDRef.current.clientWidth / threeDRef.current.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    
    renderer.setSize(threeDRef.current.clientWidth, threeDRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    threeDRef.current.appendChild(renderer.domElement);

    // Central core
    const coreGeometry = new THREE.IcosahedronGeometry(8, 2);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: 0x00d4ff,
      emissive: 0x00d4ff,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.8
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);

    // Create OS category orbits
    const categorySummary = systemData?.category_summary || [];
    categorySummary.forEach((category, index) => {
      const orbitRadius = 25 + index * 12;
      
      // Orbit ring
      const ringGeometry = new THREE.TorusGeometry(orbitRadius, 0.2, 8, 100);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: category.category === 'Windows Server' ? 0x00d4ff :
               category.category === 'Linux Server' ? 0x00ff88 :
               category.category === '*Nix' ? 0xff8800 :
               category.category === 'Network Appliance' ? 0xa855f7 : 0xff0044,
        transparent: true,
        opacity: 0.2
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      scene.add(ring);
      
      // System nodes on orbit
      const nodeCount = Math.min(6, Math.ceil(category.total_assets / 1000));
      for (let i = 0; i < nodeCount; i++) {
        const angle = (i / nodeCount) * Math.PI * 2;
        const x = Math.cos(angle) * orbitRadius;
        const z = Math.sin(angle) * orbitRadius;
        
        const nodeGeometry = new THREE.SphereGeometry(1.5 + Math.log(category.total_assets / 1000 + 1) * 0.5, 8, 8);
        const nodeMaterial = new THREE.MeshPhongMaterial({
          color: ringMaterial.color,
          emissive: ringMaterial.color,
          emissiveIntensity: 0.1
        });
        const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
        node.position.set(x, 0, z);
        scene.add(node);
      }
    });

    // Particles
    const particleCount = 400;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 120;
      positions[i + 1] = (Math.random() - 0.5) * 80;
      positions[i + 2] = (Math.random() - 0.5) * 120;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      color: 0x00d4ff,
      size: 0.5,
      transparent: true,
      opacity: 0.2
    });
    
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0x00d4ff, 0.5);
    pointLight.position.set(50, 50, 50);
    scene.add(pointLight);

    camera.position.set(0, 40, 80);
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
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-10 w-10 border-b border-cyan-400/50"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-10 w-10 border border-cyan-400/20"></div>
          </div>
          <div className="mt-3 text-[10px] text-white/40 uppercase tracking-[0.2em] animate-pulse">Analyzing Systems...</div>
        </div>
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
    color: cat.category === 'Windows Server' ? 'rgba(0, 212, 255, 0.7)' :
           cat.category === 'Linux Server' ? 'rgba(0, 255, 136, 0.7)' :
           cat.category === '*Nix' ? 'rgba(255, 136, 0, 0.7)' :
           cat.category === 'Network Appliance' ? 'rgba(168, 85, 247, 0.7)' : 'rgba(255, 0, 68, 0.7)'
  }));

  const systemBarData = systemBreakdown.slice(0, 8).map(sys => ({
    name: sys.system.length > 12 ? sys.system.substring(0, 12) + '..' : sys.system,
    cmdb: sys.cmdb_coverage,
    tanium: sys.tanium_coverage,
    visibility: sys.overall_visibility
  }));

  const radarData = categorySummary.map(cat => ({
    subject: cat.category.substring(0, 10),
    cmdb: cat.cmdb_coverage,
    tanium: cat.tanium_coverage
  }));

  const treemapData = systemBreakdown.slice(0, 15).map(sys => ({
    name: sys.system,
    size: sys.total_assets,
    visibility: sys.overall_visibility
  }));

  return (
    <div className="p-3 h-full overflow-auto bg-black">
      {/* Grid background */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none"
           style={{
             backgroundImage: 'linear-gradient(rgba(0, 212, 255, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.3) 1px, transparent 1px)',
             backgroundSize: '50px 50px'
           }} />
      
      {/* Header */}
      <div className="mb-4 relative">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white/90 tracking-tight">SYSTEM CLASSIFICATION</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
              <p className="text-[9px] text-white/40 uppercase tracking-[0.15em]">Operating system analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Cpu className="w-3 h-3 text-cyan-400/60 animate-pulse" />
            <span className="text-[10px] text-white/50">{totalSystems} Systems</span>
          </div>
        </div>
        
        <div className="flex gap-1 mt-3">
          {['all', 'Windows Server', 'Linux Server', '*Nix'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-[10px] font-medium uppercase tracking-wider rounded transition-all duration-200 ${
                selectedCategory === cat 
                  ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 text-white border border-cyan-400/30' 
                  : 'bg-black/40 text-white/40 border border-white/5 hover:text-white/60 hover:border-white/10'
              }`}
            >
              {cat === '*Nix' ? '*NIX' : cat.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div 
          onMouseEnter={() => setHoveredMetric(0)}
          onMouseLeave={() => setHoveredMetric(null)}
          className={`relative bg-black/60 backdrop-blur-xl rounded-lg p-3 border transition-all duration-300 cursor-pointer
            ${hoveredMetric === 0 ? 'border-cyan-400/40 transform -translate-y-0.5' : 'border-white/10'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] text-white/40 uppercase tracking-[0.1em] font-medium">Total Systems</p>
              <p className={`text-base font-bold mt-1 transition-colors ${
                hoveredMetric === 0 ? 'text-cyan-400' : 'text-white/90'
              }`}>{totalSystems}</p>
            </div>
            <Monitor className={`h-4 w-4 transition-all ${
              hoveredMetric === 0 ? 'text-cyan-400/80' : 'text-white/20'
            }`} />
          </div>
        </div>

        {categorySummary.slice(0, 3).map((cat, idx) => (
          <div 
            key={idx}
            onMouseEnter={() => setHoveredMetric(idx + 1)}
            onMouseLeave={() => setHoveredMetric(null)}
            className={`relative bg-black/60 backdrop-blur-xl rounded-lg p-3 border transition-all duration-300 cursor-pointer
              ${hoveredMetric === idx + 1 ? 'border-cyan-400/40 transform -translate-y-0.5' : 'border-white/10'}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-white/40 uppercase tracking-[0.1em] font-medium">{cat.category.substring(0, 10)}</p>
                <p className={`text-base font-bold mt-1 transition-colors ${
                  hoveredMetric === idx + 1 ? 'text-cyan-400' : 'text-white/90'
                }`}>{cat.total_assets.toLocaleString()}</p>
                <p className="text-[9px] text-cyan-400/60 mt-0.5">CMDB: {cat.cmdb_coverage.toFixed(1)}%</p>
              </div>
              {cat.category === 'Windows Server' ? <Server className="h-4 w-4 text-cyan-400/40" /> :
               cat.category === 'Linux Server' ? <Terminal className="h-4 w-4 text-green-400/40" /> :
               <Database className="h-4 w-4 text-yellow-400/40" />}
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        {/* 3D OS Galaxy */}
        <div className="col-span-1">
          <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
            <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">OS Galaxy</h2>
            <div ref={threeDRef} style={{ height: '240px' }} />
          </div>
        </div>

        {/* Category Pie Chart */}
        <div className="col-span-1">
          <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
            <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Category Distribution</h2>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie 
                  data={categoryPieData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={40}
                  outerRadius={80} 
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.95)', 
                    border: '1px solid rgba(0, 212, 255, 0.2)',
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
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-green-400/50 to-transparent" />
            <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Coverage Radar</h2>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255, 255, 255, 0.05)" />
                <PolarAngleAxis dataKey="subject" stroke="#ffffff20" tick={{ fontSize: 8 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#ffffff20" tick={{ fontSize: 8 }} />
                <Radar name="CMDB %" dataKey="cmdb" stroke="rgba(0, 212, 255, 0.6)" fill="rgba(0, 212, 255, 0.2)" />
                <Radar name="Tanium %" dataKey="tanium" stroke="rgba(0, 255, 136, 0.6)" fill="rgba(0, 255, 136, 0.2)" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.95)', 
                    border: '1px solid rgba(0, 212, 255, 0.2)',
                    borderRadius: '4px',
                    fontSize: '10px'
                  }} 
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* System Bar Chart */}
      <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden mb-3">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
        <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Top Systems Coverage</h2>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={systemBarData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" />
            <XAxis dataKey="name" stroke="#ffffff20" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={50} />
            <YAxis stroke="#ffffff20" tick={{ fontSize: 9 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.95)', 
                border: '1px solid rgba(0, 212, 255, 0.2)',
                borderRadius: '4px',
                fontSize: '10px'
              }} 
            />
            <Bar dataKey="cmdb" fill="rgba(0, 212, 255, 0.5)" radius={[2, 2, 0, 0]} />
            <Bar dataKey="tanium" fill="rgba(0, 255, 136, 0.5)" radius={[2, 2, 0, 0]} />
            <Bar dataKey="visibility" fill="rgba(168, 85, 247, 0.5)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Data Tables */}
      <div className="grid grid-cols-2 gap-3">
        {/* System Breakdown Table */}
        <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
          <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">System Breakdown</h2>
          <div className="overflow-x-auto max-h-48">
            <table className="w-full text-[10px]">
              <thead className="sticky top-0 bg-black/60">
                <tr className="border-b border-white/5">
                  <th className="text-left py-1.5 text-white/30 font-medium uppercase tracking-wider">System</th>
                  <th className="text-right py-1.5 text-white/30 font-medium uppercase tracking-wider">Assets</th>
                  <th className="text-right py-1.5 text-white/30 font-medium uppercase tracking-wider">CMDB</th>
                  <th className="text-right py-1.5 text-white/30 font-medium uppercase tracking-wider">Visibility</th>
                </tr>
              </thead>
              <tbody>
                {systemBreakdown
                  .filter(sys => selectedCategory === 'all' || sys.system.includes(selectedCategory))
                  .slice(0, 10)
                  .map((sys, idx) => (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-1.5 text-white/70">{sys.system.substring(0, 20)}</td>
                      <td className="py-1.5 text-right text-white/50 font-mono">{sys.total_assets.toLocaleString()}</td>
                      <td className="py-1.5 text-right">
                        <span className={`${
                          sys.cmdb_coverage > 70 ? 'text-green-400/80' : 
                          sys.cmdb_coverage > 40 ? 'text-yellow-400/80' : 'text-red-400/80'
                        }`}>
                          {sys.cmdb_coverage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-1.5 text-right">
                        <span className={`font-bold ${
                          sys.overall_visibility > 70 ? 'text-green-400/80' : 
                          sys.overall_visibility > 40 ? 'text-yellow-400/80' : 'text-red-400/80'
                        }`}>
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
        <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
          <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Category Summary</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-1.5 text-white/30 font-medium uppercase tracking-wider">Category</th>
                  <th className="text-right py-1.5 text-white/30 font-medium uppercase tracking-wider">Assets</th>
                  <th className="text-right py-1.5 text-white/30 font-medium uppercase tracking-wider">CMDB</th>
                  <th className="text-center py-1.5 text-white/30 font-medium uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {categorySummary.map((cat, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-1.5 flex items-center gap-2">
                      {cat.category === 'Windows Server' ? <Server className="h-3 w-3 text-cyan-400/60" /> :
                       cat.category === 'Linux Server' ? <Terminal className="h-3 w-3 text-green-400/60" /> :
                       cat.category === '*Nix' ? <Cpu className="h-3 w-3 text-yellow-400/60" /> :
                       cat.category === 'Network Appliance' ? <Network className="h-3 w-3 text-purple-400/60" /> :
                       <Database className="h-3 w-3 text-red-400/60" />}
                      <span className="text-white/70">{cat.category}</span>
                    </td>
                    <td className="py-1.5 text-right text-white/50 font-mono">{cat.total_assets.toLocaleString()}</td>
                    <td className="py-1.5 text-right">
                      <span className={`font-bold ${
                        cat.cmdb_coverage > 70 ? 'text-green-400/80' : 
                        cat.cmdb_coverage > 40 ? 'text-yellow-400/80' : 'text-red-400/80'
                      }`}>
                        {cat.cmdb_coverage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-1.5 text-center">
                      <div className={`inline-flex w-1.5 h-1.5 rounded-full ${
                        cat.cmdb_coverage > 70 ? 'bg-green-400' : 
                        cat.cmdb_coverage > 40 ? 'bg-yellow-400' : 'bg-red-400'
                      } animate-pulse`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Treemap */}
      <div className="mt-3 bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
        <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">System Distribution Treemap</h2>
        <ResponsiveContainer width="100%" height={250}>
          <Treemap
            data={treemapData}
            dataKey="size"
            aspectRatio={4 / 3}
            stroke="#ffffff10"
            fill="#00d4ff"
          >
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload[0]) {
                  return (
                    <div className="bg-black/95 p-2 rounded border border-cyan-400/20">
                      <p className="text-cyan-400 text-[10px] font-bold">{payload[0].payload.name}</p>
                      <p className="text-white/70 text-[9px]">Assets: {payload[0].value.toLocaleString()}</p>
                      <p className="text-white/70 text-[9px]">Visibility: {payload[0].payload.visibility?.toFixed(1)}%</p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </Treemap>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SystemClassification;