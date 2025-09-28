// src/components/pages/InfrastructureView.tsx
import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Server, Cloud, Database, Network, AlertTriangle, Activity, Cpu, HardDrive, Layers, Shield, Zap } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

const InfrastructureView = () => {
  const [infraData, setInfraData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [hoveredMetric, setHoveredMetric] = useState(null);
  const threeDRef = useRef(null);
  const rendererRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/infrastructure_type/breakdown');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setInfraData(data);
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

  // 3D Visualization
  useEffect(() => {
    if (!threeDRef.current || !infraData || loading) return;

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

    // Create infrastructure layers
    const layers = infraData?.infrastructure_breakdown?.slice(0, 10) || [];
    const group = new THREE.Group();
    
    layers.forEach((infra, index) => {
      const size = Math.max(5, Math.min(25, infra.total_assets / 500));
      const geometry = new THREE.BoxGeometry(size, 3, size);
      
      const material = new THREE.MeshPhongMaterial({
        color: infra.risk_level === 'CRITICAL' ? 0xff0044 : 
               infra.risk_level === 'HIGH' ? 0xff8800 : 
               infra.risk_level === 'MEDIUM' ? 0xffff00 : 0x00ff88,
        emissive: infra.risk_level === 'CRITICAL' ? 0xff0044 : 0x00d4ff,
        emissiveIntensity: 0.05,
        transparent: true,
        opacity: 0.8
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.y = index * 4 - 20;
      mesh.position.x = (Math.random() - 0.5) * 10;
      mesh.position.z = (Math.random() - 0.5) * 10;
      group.add(mesh);

      // Add wireframe overlay
      const wireGeometry = new THREE.BoxGeometry(size + 0.1, 3.1, size + 0.1);
      const wireMaterial = new THREE.MeshBasicMaterial({
        color: 0x00d4ff,
        wireframe: true,
        transparent: true,
        opacity: 0.2
      });
      const wireMesh = new THREE.Mesh(wireGeometry, wireMaterial);
      wireMesh.position.copy(mesh.position);
      group.add(wireMesh);
    });

    scene.add(group);

    // Particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 500;
    const positions = new Float32Array(particleCount * 3);
    
    for(let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 100;
      positions[i + 1] = (Math.random() - 0.5) * 60;
      positions[i + 2] = (Math.random() - 0.5) * 100;
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

    camera.position.set(40, 10, 40);
    camera.lookAt(0, 0, 0);

    const animate = () => {
      requestAnimationFrame(animate);
      group.rotation.y += 0.002;
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
  }, [infraData, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-10 w-10 border-b border-purple-400/50"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-10 w-10 border border-purple-400/20"></div>
          </div>
          <div className="mt-3 text-[10px] text-white/40 uppercase tracking-[0.2em] animate-pulse">Loading Infrastructure...</div>
        </div>
      </div>
    );
  }

  const breakdown = infraData?.infrastructure_breakdown || [];
  const categorySummary = infraData?.category_summary || [];
  const totalTypes = infraData?.total_types || 0;

  // Prepare chart data
  const pieData = categorySummary.map(cat => ({
    name: cat.category,
    value: cat.total_assets,
    coverage: cat.overall_visibility
  }));

  const barData = breakdown.slice(0, 8).map(infra => ({
    name: infra.type.length > 12 ? infra.type.substring(0, 12) + '..' : infra.type,
    cmdb: infra.visibility_metrics.cmdb,
    tanium: infra.visibility_metrics.tanium,
    splunk: infra.visibility_metrics.splunk
  }));

  const areaData = breakdown.slice(0, 6).map(infra => ({
    name: infra.type.substring(0, 8),
    visibility: infra.overall_visibility,
    risk: 100 - infra.overall_visibility
  }));

  const colors = {
    'On-Premise': 'rgba(0, 212, 255, 0.7)',
    'Cloud': 'rgba(168, 85, 247, 0.7)',
    'SaaS': 'rgba(0, 255, 136, 0.7)',
    'API': 'rgba(255, 136, 0, 0.7)',
    'Other': 'rgba(255, 0, 68, 0.7)'
  };

  return (
    <div className="p-3 h-full overflow-auto bg-black">
      {/* Grid background */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none"
           style={{
             backgroundImage: 'linear-gradient(rgba(168, 85, 247, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(168, 85, 247, 0.3) 1px, transparent 1px)',
             backgroundSize: '50px 50px'
           }} />
      
      {/* Header */}
      <div className="mb-4 relative">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white/90 tracking-tight">INFRASTRUCTURE ANALYSIS</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1 h-1 rounded-full bg-purple-400 animate-pulse" />
              <p className="text-[9px] text-white/40 uppercase tracking-[0.15em]">Infrastructure type monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Layers className="w-3 h-3 text-purple-400/60 animate-pulse" />
            <span className="text-[10px] text-white/50">{totalTypes} Types</span>
          </div>
        </div>
        
        <div className="flex gap-1 mt-3">
          {['all', 'On-Premise', 'Cloud', 'SaaS'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-[10px] font-medium uppercase tracking-wider rounded transition-all duration-200 ${
                selectedCategory === cat 
                  ? 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-white border border-purple-400/30' 
                  : 'bg-black/40 text-white/40 border border-white/5 hover:text-white/60 hover:border-white/10'
              }`}
            >
              {cat}
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
            ${hoveredMetric === 0 ? 'border-purple-400/40 transform -translate-y-0.5' : 'border-white/10'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] text-white/40 uppercase tracking-[0.1em] font-medium">Total Types</p>
              <p className={`text-base font-bold mt-1 transition-colors ${
                hoveredMetric === 0 ? 'text-purple-400' : 'text-white/90'
              }`}>{totalTypes}</p>
            </div>
            <Layers className={`h-4 w-4 transition-all ${
              hoveredMetric === 0 ? 'text-purple-400/80' : 'text-white/20'
            }`} />
          </div>
        </div>

        {categorySummary.slice(0, 3).map((cat, idx) => (
          <div 
            key={idx}
            onMouseEnter={() => setHoveredMetric(idx + 1)}
            onMouseLeave={() => setHoveredMetric(null)}
            className={`relative bg-black/60 backdrop-blur-xl rounded-lg p-3 border transition-all duration-300 cursor-pointer
              ${hoveredMetric === idx + 1 ? 'border-purple-400/40 transform -translate-y-0.5' : 'border-white/10'}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-white/40 uppercase tracking-[0.1em] font-medium">{cat.category}</p>
                <p className={`text-base font-bold mt-1 transition-colors ${
                  hoveredMetric === idx + 1 ? 'text-purple-400' : 'text-white/90'
                }`}>{cat.total_assets.toLocaleString()}</p>
                <p className="text-[9px] text-cyan-400/60 mt-0.5">{cat.overall_visibility.toFixed(1)}% visible</p>
              </div>
              {cat.category === 'Cloud' ? <Cloud className="h-4 w-4 text-purple-400/40" /> :
               cat.category === 'On-Premise' ? <Server className="h-4 w-4 text-cyan-400/40" /> :
               <Database className="h-4 w-4 text-green-400/40" />}
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        {/* 3D Visualization */}
        <div className="col-span-1">
          <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
            <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Infrastructure Stack</h2>
            <div ref={threeDRef} style={{ height: '240px' }} />
          </div>
        </div>

        {/* Pie Chart */}
        <div className="col-span-1">
          <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
            <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Category Distribution</h2>
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
                    <Cell key={`cell-${index}`} fill={colors[entry.name] || 'rgba(136, 136, 136, 0.7)'} />
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

        {/* Risk Summary */}
        <div className="col-span-1">
          <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-green-400/50 to-transparent" />
            <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-3">Risk Distribution</h2>
            <div className="space-y-3">
              {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(risk => {
                const count = breakdown.filter(i => i.risk_level === risk).length;
                const percentage = (count / breakdown.length) * 100;
                return (
                  <div key={risk}>
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] text-white/50 uppercase tracking-wider">{risk}</span>
                      <span className="text-[10px] text-white/70 font-mono">{count}</span>
                    </div>
                    <div className="w-full bg-black/50 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          risk === 'CRITICAL' ? 'bg-gradient-to-r from-red-500 to-red-400' :
                          risk === 'HIGH' ? 'bg-gradient-to-r from-orange-500 to-orange-400' :
                          risk === 'MEDIUM' ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' : 
                          'bg-gradient-to-r from-green-500 to-green-400'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Area Chart */}
      <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden mb-3">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />
        <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Visibility & Risk Analysis</h2>
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={areaData}>
            <defs>
              <linearGradient id="colorVis" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff0044" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ff0044" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" />
            <XAxis dataKey="name" stroke="#ffffff20" tick={{ fontSize: 9 }} />
            <YAxis stroke="#ffffff20" tick={{ fontSize: 9 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.95)', 
                border: '1px solid rgba(168, 85, 247, 0.2)',
                borderRadius: '4px',
                fontSize: '10px'
              }} 
            />
            <Area type="monotone" dataKey="visibility" stackId="1" stroke="#00d4ff" fillOpacity={1} fill="url(#colorVis)" strokeWidth={1.5} />
            <Area type="monotone" dataKey="risk" stackId="1" stroke="#ff0044" fillOpacity={1} fill="url(#colorRisk)" strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bar Chart */}
      <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden mb-3">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
        <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Security Coverage by Type</h2>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={barData}>
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
            <Bar dataKey="cmdb" stackId="a" fill="rgba(0, 212, 255, 0.5)" radius={[2, 2, 0, 0]} />
            <Bar dataKey="tanium" stackId="a" fill="rgba(0, 255, 136, 0.5)" radius={[2, 2, 0, 0]} />
            <Bar dataKey="splunk" stackId="a" fill="rgba(168, 85, 247, 0.5)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Data Table */}
      <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
        <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Infrastructure Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-1.5 text-white/30 font-medium uppercase tracking-wider">Type</th>
                <th className="text-left py-1.5 text-white/30 font-medium uppercase tracking-wider">Category</th>
                <th className="text-right py-1.5 text-white/30 font-medium uppercase tracking-wider">Assets</th>
                <th className="text-right py-1.5 text-white/30 font-medium uppercase tracking-wider">CMDB</th>
                <th className="text-right py-1.5 text-white/30 font-medium uppercase tracking-wider">Visibility</th>
                <th className="text-center py-1.5 text-white/30 font-medium uppercase tracking-wider">Risk</th>
              </tr>
            </thead>
            <tbody>
              {breakdown
                .filter(infra => selectedCategory === 'all' || infra.category === selectedCategory)
                .slice(0, 10)
                .map((infra, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-1.5 text-white/70">{infra.type.substring(0, 20)}</td>
                    <td className="py-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                        infra.category === 'Cloud' ? 'bg-purple-500/20 text-purple-400' :
                        infra.category === 'On-Premise' ? 'bg-cyan-500/20 text-cyan-400' :
                        infra.category === 'SaaS' ? 'bg-green-500/20 text-green-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {infra.category}
                      </span>
                    </td>
                    <td className="py-1.5 text-right text-white/50 font-mono">{infra.total_assets.toLocaleString()}</td>
                    <td className="py-1.5 text-right">
                      <span className={`font-bold ${
                        infra.visibility_metrics.cmdb > 70 ? 'text-green-400/80' :
                        infra.visibility_metrics.cmdb > 40 ? 'text-yellow-400/80' : 'text-red-400/80'
                      }`}>
                        {infra.visibility_metrics.cmdb.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-1.5 text-right">
                      <span className={`font-bold ${
                        infra.overall_visibility > 70 ? 'text-green-400/80' :
                        infra.overall_visibility > 40 ? 'text-yellow-400/80' : 'text-red-400/80'
                      }`}>
                        {infra.overall_visibility.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-1.5 text-center">
                      <div className={`inline-flex w-1.5 h-1.5 rounded-full ${
                        infra.risk_level === 'CRITICAL' ? 'bg-red-400' :
                        infra.risk_level === 'HIGH' ? 'bg-orange-400' :
                        infra.risk_level === 'MEDIUM' ? 'bg-yellow-400' :
                        'bg-green-400'
                      } animate-pulse`} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InfrastructureView;