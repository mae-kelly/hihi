// src/components/pages/BUandApplicationView.tsx
import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Building, Users, Eye, AlertTriangle, Activity, Briefcase, TrendingUp, Layers, Zap } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Treemap, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const BUandApplicationView = () => {
  const [buData, setBuData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('business_units');
  const [hoveredMetric, setHoveredMetric] = useState(null);
  const threeDRef = useRef(null);
  const rendererRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/bu_application/breakdown');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setBuData(data);
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

  // 3D Network Visualization
  useEffect(() => {
    if (!threeDRef.current || !buData || loading) return;

    if (rendererRef.current) {
      rendererRef.current.dispose();
      if (threeDRef.current.contains(rendererRef.current.domElement)) {
        threeDRef.current.removeChild(rendererRef.current.domElement);
      }
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, threeDRef.current.clientWidth / threeDRef.current.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    
    renderer.setSize(threeDRef.current.clientWidth, threeDRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    threeDRef.current.appendChild(renderer.domElement);

    // Create BU nodes
    const businessUnits = buData?.business_units?.slice(0, 10) || [];
    const nodeGroup = new THREE.Group();
    
    businessUnits.forEach((bu, index) => {
      const angle = (index / businessUnits.length) * Math.PI * 2;
      const radius = 25;
      
      const geometry = new THREE.SphereGeometry(
        Math.max(2, Math.min(8, Math.log(bu.total_assets / 100 + 1) * 2)),
        16, 16
      );
      
      const material = new THREE.MeshPhongMaterial({
        color: bu.risk_level === 'CRITICAL' ? 0xff0044 :
               bu.risk_level === 'HIGH' ? 0xff8800 :
               bu.risk_level === 'MEDIUM' ? 0xffff00 : 0x00ff88,
        emissive: bu.risk_level === 'CRITICAL' ? 0xff0044 : 0x00d4ff,
        emissiveIntensity: 0.1,
        transparent: true,
        opacity: 0.8
      });
      
      const node = new THREE.Mesh(geometry, material);
      node.position.x = Math.cos(angle) * radius;
      node.position.z = Math.sin(angle) * radius;
      node.position.y = (bu.overall_visibility - 50) / 8;
      nodeGroup.add(node);
      
      // Add connections to center
      const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(node.position.x, node.position.y, node.position.z)
      ];
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const lineMaterial = new THREE.LineBasicMaterial({ 
        color: 0x00d4ff, 
        opacity: 0.2, 
        transparent: true 
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      nodeGroup.add(line);
    });
    
    scene.add(nodeGroup);

    // Central core
    const coreGeometry = new THREE.OctahedronGeometry(4, 0);
    const coreMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x00d4ff, 
      emissive: 0x00d4ff, 
      emissiveIntensity: 0.3 
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);

    // Particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 300;
    const positions = new Float32Array(particleCount * 3);
    
    for(let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 80;
      positions[i + 1] = (Math.random() - 0.5) * 60;
      positions[i + 2] = (Math.random() - 0.5) * 80;
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
    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(50, 50, 50);
    scene.add(pointLight);

    camera.position.set(0, 25, 50);
    camera.lookAt(0, 0, 0);

    const animate = () => {
      requestAnimationFrame(animate);
      nodeGroup.rotation.y += 0.003;
      core.rotation.y += 0.01;
      core.rotation.x += 0.005;
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
  }, [buData, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-10 w-10 border-b border-purple-400/50"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-10 w-10 border border-purple-400/20"></div>
          </div>
          <div className="mt-3 text-[10px] text-white/40 uppercase tracking-[0.2em] animate-pulse">Loading Business Units...</div>
        </div>
      </div>
    );
  }

  const businessUnits = buData?.business_units || [];
  const applicationClasses = buData?.application_classes || [];
  const cioOwnership = buData?.cio_ownership || [];
  const totalBUs = buData?.total_business_units || 0;
  const totalAppClasses = buData?.total_app_classes || 0;
  const totalCIOs = buData?.total_cios || 0;

  // Prepare chart data
  const buBarData = businessUnits.slice(0, 8).map(bu => ({
    name: bu.business_unit.length > 12 ? bu.business_unit.substring(0, 12) + '..' : bu.business_unit,
    cmdb: bu.visibility_metrics.cmdb,
    tanium: bu.visibility_metrics.tanium,
    splunk: bu.visibility_metrics.splunk
  }));

  const riskDistribution = {
    CRITICAL: businessUnits.filter(bu => bu.risk_level === 'CRITICAL').length,
    HIGH: businessUnits.filter(bu => bu.risk_level === 'HIGH').length,
    MEDIUM: businessUnits.filter(bu => bu.risk_level === 'MEDIUM').length,
    LOW: businessUnits.filter(bu => bu.risk_level === 'LOW').length
  };

  const pieData = Object.entries(riskDistribution).map(([level, count]) => ({
    name: level,
    value: count,
    color: level === 'CRITICAL' ? 'rgba(255, 0, 68, 0.7)' : 
           level === 'HIGH' ? 'rgba(255, 136, 0, 0.7)' : 
           level === 'MEDIUM' ? 'rgba(255, 255, 0, 0.7)' : 'rgba(0, 255, 136, 0.7)'
  }));

  const radarData = businessUnits.slice(0, 6).map(bu => ({
    subject: bu.business_unit.substring(0, 10),
    visibility: bu.overall_visibility,
    fullMark: 100
  }));

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
            <h1 className="text-lg font-bold text-white/90 tracking-tight">BUSINESS UNIT & APPLICATION</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1 h-1 rounded-full bg-purple-400 animate-pulse" />
              <p className="text-[9px] text-white/40 uppercase tracking-[0.15em]">Organizational visibility analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Building className="w-3 h-3 text-purple-400/60 animate-pulse" />
            <span className="text-[10px] text-white/50">{totalBUs} BUs</span>
          </div>
        </div>
        
        <div className="flex gap-1 mt-3">
          {['business_units', 'applications', 'cio'].map(tab => (
            <button 
              key={tab}
              onClick={() => setSelectedTab(tab)} 
              className={`px-3 py-1 text-[10px] font-medium uppercase tracking-wider rounded transition-all duration-200 ${
                selectedTab === tab 
                  ? 'bg-gradient-to-r from-purple-500/10 to-cyan-500/10 text-white border border-purple-400/30' 
                  : 'bg-black/40 text-white/40 border border-white/5 hover:text-white/60 hover:border-white/10'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: 'Total BUs', value: totalBUs, icon: Building },
          { label: 'App Classes', value: totalAppClasses, icon: Layers },
          { label: 'CIOs', value: totalCIOs, icon: Users },
          { label: 'Critical BUs', value: riskDistribution.CRITICAL, icon: AlertTriangle, critical: true }
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
                <p className={`text-base font-bold mt-1 transition-colors ${
                  hoveredMetric === idx ? (metric.critical ? 'text-red-400' : 'text-purple-400') : 
                  (metric.critical ? 'text-red-400/80' : 'text-white/90')
                }`}>{metric.value}</p>
              </div>
              <metric.icon className={`h-4 w-4 transition-all ${
                hoveredMetric === idx ? (metric.critical ? 'text-red-400/80' : 'text-purple-400/80') : 'text-white/20'
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
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
            <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">BU Network Topology</h2>
            <div ref={threeDRef} style={{ height: '240px' }} />
          </div>
        </div>

        {/* Risk Distribution Pie */}
        <div className="col-span-1">
          <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
            <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Risk Distribution</h2>
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
                    border: '1px solid rgba(168, 85, 247, 0.2)',
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
            <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Visibility Radar</h2>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255, 255, 255, 0.05)" />
                <PolarAngleAxis dataKey="subject" stroke="#ffffff20" tick={{ fontSize: 8 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#ffffff20" tick={{ fontSize: 8 }} />
                <Radar name="Visibility %" dataKey="visibility" stroke="rgba(0, 212, 255, 0.6)" fill="rgba(0, 212, 255, 0.2)" />
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

      {/* Bar Chart */}
      <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden mb-3">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
        <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Business Unit Visibility Metrics</h2>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={buBarData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" />
            <XAxis dataKey="name" stroke="#ffffff20" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={50} />
            <YAxis stroke="#ffffff20" tick={{ fontSize: 9 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.95)', 
                border: '1px solid rgba(168, 85, 247, 0.2)',
                borderRadius: '4px',
                fontSize: '10px'
              }} 
            />
            <Bar dataKey="cmdb" fill="rgba(0, 212, 255, 0.5)" radius={[2, 2, 0, 0]} />
            <Bar dataKey="tanium" fill="rgba(0, 255, 136, 0.5)" radius={[2, 2, 0, 0]} />
            <Bar dataKey="splunk" fill="rgba(168, 85, 247, 0.5)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Data Tables */}
      <div className="grid grid-cols-2 gap-3">
        {/* Business Units Table */}
        {selectedTab === 'business_units' && (
          <div className="col-span-2 bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
            <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Business Units Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left py-1.5 text-white/30 font-medium uppercase tracking-wider">Business Unit</th>
                    <th className="text-right py-1.5 text-white/30 font-medium uppercase tracking-wider">Assets</th>
                    <th className="text-right py-1.5 text-white/30 font-medium uppercase tracking-wider">CIOs</th>
                    <th className="text-right py-1.5 text-white/30 font-medium uppercase tracking-wider">CMDB</th>
                    <th className="text-right py-1.5 text-white/30 font-medium uppercase tracking-wider">Overall</th>
                    <th className="text-center py-1.5 text-white/30 font-medium uppercase tracking-wider">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {businessUnits.slice(0, 10).map((bu, idx) => (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-1.5 text-white/70">{bu.business_unit.substring(0, 25)}</td>
                      <td className="py-1.5 text-right text-white/50 font-mono">{bu.total_assets.toLocaleString()}</td>
                      <td className="py-1.5 text-right text-white/50">{bu.cio_count}</td>
                      <td className="py-1.5 text-right">
                        <span className={`${
                          bu.visibility_metrics.cmdb > 70 ? 'text-green-400/80' :
                          bu.visibility_metrics.cmdb > 40 ? 'text-yellow-400/80' : 'text-red-400/80'
                        }`}>
                          {bu.visibility_metrics.cmdb.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-1.5 text-right">
                        <span className={`font-bold ${
                          bu.overall_visibility > 70 ? 'text-green-400/80' :
                          bu.overall_visibility > 40 ? 'text-yellow-400/80' : 'text-red-400/80'
                        }`}>
                          {bu.overall_visibility.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-1.5 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                          bu.risk_level === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                          bu.risk_level === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                          bu.risk_level === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {bu.risk_level}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Application Classes Table */}
        {selectedTab === 'applications' && (
          <div className="col-span-2 bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
            <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Application Classes</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left py-1.5 text-white/30 font-medium uppercase tracking-wider">Class</th>
                    <th className="text-right py-1.5 text-white/30 font-medium uppercase tracking-wider">Total Assets</th>
                    <th className="text-right py-1.5 text-white/30 font-medium uppercase tracking-wider">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {applicationClasses.slice(0, 15).map((app, idx) => (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-1.5 text-white/70">{app.class}</td>
                      <td className="py-1.5 text-right text-white/50 font-mono">{app.total_assets.toLocaleString()}</td>
                      <td className="py-1.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-black/50 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full"
                              style={{ width: `${(app.total_assets / Math.max(...applicationClasses.map(a => a.total_assets))) * 100}%` }}
                            />
                          </div>
                          <span className="text-cyan-400/80 font-mono text-[9px]">
                            {((app.total_assets / businessUnits.reduce((sum, bu) => sum + bu.total_assets, 1)) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BUandApplicationView;