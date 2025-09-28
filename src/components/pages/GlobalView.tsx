// src/components/pages/GlobalView.tsx
import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Globe, AlertTriangle, Database, Shield, Activity, Server, Cloud, BarChart3, TrendingUp, Users, MapPin, Zap } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area } from 'recharts';

const GlobalView = () => {
  const [globalData, setGlobalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [hoveredMetric, setHoveredMetric] = useState(null);
  const globeRef = useRef(null);
  const rendererRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/global_view/summary');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setGlobalData(data);
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

  // 3D Globe Visualization with particles
  useEffect(() => {
    if (!globeRef.current || !globalData || loading) return;

    if (rendererRef.current) {
      rendererRef.current.dispose();
      if (globeRef.current.contains(rendererRef.current.domElement)) {
        globeRef.current.removeChild(rendererRef.current.domElement);
      }
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, globeRef.current.clientWidth / globeRef.current.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    
    renderer.setSize(globeRef.current.clientWidth, globeRef.current.clientHeight);
    globeRef.current.appendChild(renderer.domElement);

    // Dark globe core
    const globeGeometry = new THREE.SphereGeometry(45, 32, 32);
    const globeMaterial = new THREE.MeshPhongMaterial({
      color: 0x0a0a0a,
      emissive: 0x0077be,
      emissiveIntensity: 0.01,
      transparent: true,
      opacity: 0.9
    });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);

    // Wireframe overlay
    const wireGeometry = new THREE.SphereGeometry(46, 24, 24);
    const wireMaterial = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      wireframe: true,
      transparent: true,
      opacity: 0.08
    });
    const wireMesh = new THREE.Mesh(wireGeometry, wireMaterial);
    scene.add(wireMesh);

    // Data points with glow
    const regions = globalData?.regional_breakdown || [];
    regions.forEach((region, idx) => {
      const phi = (90 - (idx * 30 - 60)) * Math.PI / 180;
      const theta = (idx * 60) * Math.PI / 180;
      const x = 48 * Math.sin(phi) * Math.cos(theta);
      const y = 48 * Math.cos(phi);
      const z = 48 * Math.sin(phi) * Math.sin(theta);

      // Glow sphere
      const glowGeometry = new THREE.SphereGeometry(3, 8, 8);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: region.cmdb_coverage > 70 ? 0x00ff88 : 
               region.cmdb_coverage > 40 ? 0xffaa00 : 0xff0044,
        transparent: true,
        opacity: 0.2
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.set(x, y, z);
      scene.add(glow);

      // Core point
      const markerGeometry = new THREE.SphereGeometry(1, 8, 8);
      const markerMaterial = new THREE.MeshBasicMaterial({
        color: region.cmdb_coverage > 70 ? 0x00ff88 : 
               region.cmdb_coverage > 40 ? 0xffaa00 : 0xff0044,
        transparent: true,
        opacity: 0.9
      });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(x, y, z);
      scene.add(marker);

      // Connection line to core
      const points = [];
      points.push(new THREE.Vector3(0, 0, 0));
      points.push(new THREE.Vector3(x * 0.9, y * 0.9, z * 0.9));
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const lineMaterial = new THREE.LineBasicMaterial({ 
        color: 0x00d4ff, 
        transparent: true, 
        opacity: 0.1 
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
    });

    // Particle field
    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 1000;
    const positions = new Float32Array(particleCount * 3);
    
    for(let i = 0; i < particleCount * 3; i += 3) {
      const radius = 50 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      
      positions[i] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = radius * Math.cos(phi);
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      color: 0x00d4ff,
      size: 0.5,
      transparent: true,
      opacity: 0.3
    });
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Subtle lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.2);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0x00d4ff, 0.3, 200);
    pointLight.position.set(100, 100, 100);
    scene.add(pointLight);

    camera.position.z = 130;

    const animate = () => {
      requestAnimationFrame(animate);
      globe.rotation.y += 0.001;
      wireMesh.rotation.y -= 0.0005;
      particles.rotation.y += 0.0002;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (rendererRef.current && globeRef.current) {
        globeRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [globalData, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-10 w-10 border-b border-blue-400/50"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-10 w-10 border border-blue-400/20"></div>
          </div>
          <div className="mt-3 text-[10px] text-white/40 uppercase tracking-[0.2em] animate-pulse">Initializing...</div>
        </div>
      </div>
    );
  }

  const metrics = globalData?.global_metrics || {};
  const regionalData = globalData?.regional_breakdown || [];
  const countryData = globalData?.country_breakdown || [];

  // Prepare chart data
  const coverageChartData = [
    { name: 'CMDB', value: metrics.cmdb_coverage, color: 'rgba(0, 212, 255, 0.7)' },
    { name: 'Protected', value: metrics.url_fqdn_coverage, color: 'rgba(0, 255, 136, 0.7)' },
    { name: 'Gap', value: 100 - metrics.cmdb_coverage, color: 'rgba(255, 0, 68, 0.7)' }
  ];

  const regionalChartData = regionalData.slice(0, 5).map(r => ({
    region: r.region.substring(0, 8),
    cmdb: r.cmdb_coverage,
    tanium: r.tanium_coverage,
    splunk: r.splunk_coverage
  }));

  const areaChartData = regionalData.slice(0, 8).map(r => ({
    name: r.region.substring(0, 6),
    visibility: r.overall_visibility,
    baseline: 50
  }));

  return (
    <div className="p-3 h-full overflow-auto bg-black">
      {/* Subtle grid background */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none"
           style={{
             backgroundImage: 'linear-gradient(rgba(0, 212, 255, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.3) 1px, transparent 1px)',
             backgroundSize: '50px 50px'
           }} />
      
      {/* Header */}
      <div className="mb-4 relative">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white/90 tracking-tight">GLOBAL INFRASTRUCTURE</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
              <p className="text-[9px] text-white/40 uppercase tracking-[0.15em]">Real-time monitoring active</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3 text-yellow-400/60 animate-pulse" />
            <span className="text-[10px] text-white/50">Live</span>
          </div>
        </div>
        
        <div className="flex gap-1 mt-3">
          {['overview', 'regional', 'datacenter', 'cloud'].map(tab => (
            <button 
              key={tab}
              onClick={() => setSelectedTab(tab)} 
              className={`px-3 py-1 text-[10px] font-medium uppercase tracking-wider rounded transition-all duration-200 ${
                selectedTab === tab 
                  ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-white border border-blue-400/30' 
                  : 'bg-black/40 text-white/40 border border-white/5 hover:text-white/60 hover:border-white/10'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Cards with hover effects */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: 'Total Assets', value: metrics.total_assets?.toLocaleString(), icon: Database, color: 'blue' },
          { label: 'CMDB Coverage', value: `${metrics.cmdb_coverage?.toFixed(1)}%`, icon: Shield, color: 'cyan' },
          { label: 'Regions', value: metrics.regions_covered, icon: MapPin, color: 'purple' },
          { label: 'Countries', value: metrics.countries_covered, icon: Globe, color: 'pink' }
        ].map((metric, idx) => (
          <div 
            key={idx}
            onMouseEnter={() => setHoveredMetric(idx)}
            onMouseLeave={() => setHoveredMetric(null)}
            className={`relative bg-black/60 backdrop-blur-xl rounded-lg p-3 border transition-all duration-300 cursor-pointer
              ${hoveredMetric === idx 
                ? 'border-blue-400/40 transform -translate-y-0.5' 
                : 'border-white/10'}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-white/40 uppercase tracking-[0.1em] font-medium">{metric.label}</p>
                <p className={`text-base font-bold mt-1 transition-colors ${
                  hoveredMetric === idx ? 'text-blue-400' : 'text-white/90'
                }`}>{metric.value}</p>
              </div>
              <metric.icon className={`h-4 w-4 transition-all ${
                hoveredMetric === idx ? 'text-blue-400/80' : 'text-white/20'
              }`} />
            </div>
            {hoveredMetric === idx && (
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none" />
            )}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-3">
        {/* 3D Globe */}
        <div className="col-span-1">
          <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />
            <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Global Network</h2>
            <div ref={globeRef} style={{ height: '240px' }} />
          </div>
        </div>

        {/* Charts */}
        <div className="col-span-2 space-y-3">
          {/* Pie Chart */}
          <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
            <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Coverage Analysis</h2>
            <ResponsiveContainer width="100%" height={110}>
              <PieChart>
                <Pie 
                  data={coverageChartData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={25}
                  outerRadius={40} 
                  paddingAngle={2}
                  dataKey="value"
                >
                  {coverageChartData.map((entry, index) => (
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

          {/* Area Chart */}
          <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-green-400/50 to-transparent" />
            <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Visibility Trend</h2>
            <ResponsiveContainer width="100%" height={110}>
              <AreaChart data={areaChartData}>
                <defs>
                  <linearGradient id="colorVis" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" />
                <XAxis dataKey="name" stroke="#ffffff20" tick={{ fontSize: 9 }} />
                <YAxis stroke="#ffffff20" tick={{ fontSize: 9 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.95)', 
                    border: '1px solid rgba(0, 212, 255, 0.2)',
                    borderRadius: '4px',
                    fontSize: '10px'
                  }} 
                />
                <Area type="monotone" dataKey="visibility" stroke="#00d4ff" fillOpacity={1} fill="url(#colorVis)" strokeWidth={1.5} />
                <Area type="monotone" dataKey="baseline" stroke="#ff0044" fillOpacity={0.1} fill="#ff0044" strokeWidth={1} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Data Tables with subtle styling */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        {/* Regional Table */}
        <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
          <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Regional Analysis</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-1.5 text-white/30 font-medium uppercase tracking-wider">Region</th>
                  <th className="text-right py-1.5 text-white/30 font-medium uppercase tracking-wider">Assets</th>
                  <th className="text-right py-1.5 text-white/30 font-medium uppercase tracking-wider">CMDB</th>
                  <th className="text-right py-1.5 text-white/30 font-medium uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {regionalData.slice(0, 5).map((region, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-1.5 text-white/70">{region.region}</td>
                    <td className="py-1.5 text-right text-white/50 font-mono text-[9px]">{region.assets.toLocaleString()}</td>
                    <td className="py-1.5 text-right">
                      <span className={`font-bold ${
                        region.cmdb_coverage > 70 ? 'text-green-400/80' : 
                        region.cmdb_coverage > 40 ? 'text-yellow-400/80' : 'text-red-400/80'
                      }`}>
                        {region.cmdb_coverage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-1.5 text-right">
                      <div className={`inline-flex w-1.5 h-1.5 rounded-full ${
                        region.overall_visibility > 70 ? 'bg-green-400' : 
                        region.overall_visibility > 40 ? 'bg-yellow-400' : 'bg-red-400'
                      } animate-pulse`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Country Table */}
        <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
          <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Top Locations</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-1.5 text-white/30 font-medium uppercase tracking-wider">Country</th>
                  <th className="text-right py-1.5 text-white/30 font-medium uppercase tracking-wider">Assets</th>
                  <th className="text-right py-1.5 text-white/30 font-medium uppercase tracking-wider">Share</th>
                  <th className="text-right py-1.5 text-white/30 font-medium uppercase tracking-wider">Health</th>
                </tr>
              </thead>
              <tbody>
                {countryData.slice(0, 5).map((country, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-1.5 text-white/70">{country.country}</td>
                    <td className="py-1.5 text-right text-white/50 font-mono text-[9px]">{country.assets.toLocaleString()}</td>
                    <td className="py-1.5 text-right text-white/50">{country.percentage_of_total.toFixed(1)}%</td>
                    <td className="py-1.5 text-right">
                      <div className="flex justify-end gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <div 
                            key={i}
                            className={`w-1 h-2 rounded-sm ${
                              i < Math.ceil(country.cmdb_coverage / 20) 
                                ? 'bg-cyan-400/60' 
                                : 'bg-white/10'
                            }`}
                          />
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom visualization */}
      <div className="mt-3 bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />
        <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Regional Performance Matrix</h2>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={regionalChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" />
            <XAxis dataKey="region" stroke="#ffffff20" tick={{ fontSize: 9 }} />
            <YAxis stroke="#ffffff20" tick={{ fontSize: 9 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.95)', 
                border: '1px solid rgba(0, 212, 255, 0.2)',
                borderRadius: '4px',
                fontSize: '10px',
                padding: '4px 8px'
              }} 
            />
            <Bar dataKey="cmdb" fill="rgba(0, 212, 255, 0.5)" radius={[2, 2, 0, 0]} />
            <Bar dataKey="tanium" fill="rgba(0, 255, 136, 0.5)" radius={[2, 2, 0, 0]} />
            <Bar dataKey="splunk" fill="rgba(168, 85, 247, 0.5)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default GlobalView;