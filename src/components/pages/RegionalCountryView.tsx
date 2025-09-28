// src/components/pages/RegionalCountryView.tsx
import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Globe, MapPin, Eye, AlertTriangle, Activity, Building, Cloud, Server, Users, Flag, TrendingUp, Layers, Zap } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area, ScatterChart, Scatter } from 'recharts';

const RegionalCountryView = () => {
  const [regionalData, setRegionalData] = useState(null);
  const [countryData, setCountryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('regional');
  const [hoveredMetric, setHoveredMetric] = useState(null);
  const globeRef = useRef(null);
  const rendererRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [regionalResponse, countryResponse] = await Promise.all([
          fetch('http://localhost:5000/api/region_metrics'),
          fetch('http://localhost:5000/api/country_metrics')
        ]);
        
        if (!regionalResponse.ok || !countryResponse.ok) throw new Error('Failed to fetch');
        
        const regional = await regionalResponse.json();
        const country = await countryResponse.json();
        
        setRegionalData(regional);
        setCountryData(country);
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

  // 3D Globe Visualization
  useEffect(() => {
    if (!globeRef.current || !regionalData || loading) return;

    if (rendererRef.current) {
      rendererRef.current.dispose();
      if (globeRef.current.contains(rendererRef.current.domElement)) {
        globeRef.current.removeChild(rendererRef.current.domElement);
      }
    }

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.001);
    
    const camera = new THREE.PerspectiveCamera(60, globeRef.current.clientWidth / globeRef.current.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    
    renderer.setSize(globeRef.current.clientWidth, globeRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    globeRef.current.appendChild(renderer.domElement);

    // Create globe
    const globeRadius = 45;
    const globeGeometry = new THREE.SphereGeometry(globeRadius, 64, 64);
    const globeMaterial = new THREE.MeshPhongMaterial({
      color: 0x0a0a0a,
      emissive: 0x0077be,
      emissiveIntensity: 0.02,
      transparent: true,
      opacity: 0.9
    });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);

    // Add wireframe
    const wireGeometry = new THREE.SphereGeometry(globeRadius + 0.5, 32, 32);
    const wireMaterial = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      wireframe: true,
      transparent: true,
      opacity: 0.08
    });
    const wireframe = new THREE.Mesh(wireGeometry, wireMaterial);
    scene.add(wireframe);

    // Add regional markers
    const regionCoords = {
      'north america': { lat: 45, lon: -100 },
      'emea': { lat: 30, lon: 20 },
      'apac': { lat: 10, lon: 120 },
      'latam': { lat: -15, lon: -60 },
      'europe': { lat: 50, lon: 10 },
      'asia': { lat: 30, lon: 90 }
    };

    Object.entries(regionalData.global_surveillance || {}).forEach(([region, count]) => {
      const coords = regionCoords[region.toLowerCase()] || { lat: Math.random() * 180 - 90, lon: Math.random() * 360 - 180 };
      const phi = (90 - coords.lat) * Math.PI / 180;
      const theta = (coords.lon + 180) * Math.PI / 180;
      
      const x = globeRadius * Math.sin(phi) * Math.cos(theta);
      const y = globeRadius * Math.cos(phi);
      const z = globeRadius * Math.sin(phi) * Math.sin(theta);
      
      // Create marker with glow
      const markerSize = Math.max(1, Math.min(5, Math.log(count / 100 + 1)));
      
      // Glow
      const glowGeometry = new THREE.SphereGeometry(markerSize * 2, 8, 8);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: count > 10000 ? 0x00ff88 : count > 5000 ? 0xffaa00 : 0xff0044,
        transparent: true,
        opacity: 0.2
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.set(x * 1.05, y * 1.05, z * 1.05);
      scene.add(glow);
      
      // Core
      const markerGeometry = new THREE.SphereGeometry(markerSize, 8, 8);
      const markerMaterial = new THREE.MeshPhongMaterial({
        color: count > 10000 ? 0x00ff88 : count > 5000 ? 0xffaa00 : 0xff0044,
        emissive: count > 10000 ? 0x00ff88 : count > 5000 ? 0xffaa00 : 0xff0044,
        emissiveIntensity: 0.3
      });
      
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(x * 1.05, y * 1.05, z * 1.05);
      scene.add(marker);
    });

    // Particles
    const particleCount = 800;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();
      const radius = globeRadius + Math.random() * 20;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi);
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
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

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0x00d4ff, 0.5, 300);
    pointLight.position.set(100, 100, 100);
    scene.add(pointLight);

    camera.position.set(0, 0, 120);
    camera.lookAt(0, 0, 0);

    const animate = () => {
      requestAnimationFrame(animate);
      globe.rotation.y += 0.002;
      wireframe.rotation.y -= 0.001;
      particles.rotation.y += 0.0005;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (rendererRef.current && globeRef.current) {
        globeRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [regionalData, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-10 w-10 border-b border-cyan-400/50"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-10 w-10 border border-cyan-400/20"></div>
          </div>
          <div className="mt-3 text-[10px] text-white/40 uppercase tracking-[0.2em] animate-pulse">Mapping Regions...</div>
        </div>
      </div>
    );
  }

  const totalCoverage = regionalData?.total_coverage || 0;
  const regionDistribution = regionalData?.global_surveillance || {};
  const countryDistribution = countryData?.global_intelligence || {};
  const totalCountries = countryData?.total_countries || 0;

  // Prepare chart data
  const regionalBarData = Object.entries(regionDistribution).slice(0, 8).map(([region, count]) => ({
    name: region.toUpperCase().substring(0, 8),
    assets: count,
    percentage: (count / totalCoverage * 100)
  }));

  const pieData = Object.entries(regionDistribution).slice(0, 6).map(([region, count]) => ({
    name: region.toUpperCase(),
    value: count,
    color: region.includes('america') ? 'rgba(0, 212, 255, 0.7)' :
           region.includes('emea') || region.includes('europe') ? 'rgba(34, 197, 94, 0.7)' :
           region.includes('apac') || region.includes('asia') ? 'rgba(168, 85, 247, 0.7)' :
           region.includes('latam') ? 'rgba(255, 170, 0, 0.7)' : 'rgba(239, 68, 68, 0.7)'
  }));

  const scatterData = Object.entries(countryDistribution).slice(0, 20).map(([country, count], idx) => ({
    x: idx,
    y: count,
    name: country
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
            <h1 className="text-lg font-bold text-white/90 tracking-tight">REGIONAL & COUNTRY ANALYSIS</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
              <p className="text-[9px] text-white/40 uppercase tracking-[0.15em]">Geographic distribution mapping</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-3 h-3 text-cyan-400/60 animate-pulse" />
            <span className="text-[10px] text-white/50">{totalCountries} Countries</span>
          </div>
        </div>
        
        <div className="flex gap-1 mt-3">
          {['regional', 'country', 'global'].map(view => (
            <button
              key={view}
              onClick={() => setSelectedView(view)}
              className={`px-3 py-1 text-[10px] font-medium uppercase tracking-wider rounded transition-all duration-200 ${
                selectedView === view 
                  ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 text-white border border-cyan-400/30' 
                  : 'bg-black/40 text-white/40 border border-white/5 hover:text-white/60 hover:border-white/10'
              }`}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: 'Total Coverage', value: totalCoverage.toLocaleString(), icon: Globe, color: 'cyan' },
          { label: 'Regions', value: Object.keys(regionDistribution).length, icon: MapPin, color: 'purple' },
          { label: 'Countries', value: totalCountries, icon: Flag, color: 'green' },
          { label: 'Top Region', value: Object.keys(regionDistribution)[0]?.toUpperCase() || 'N/A', icon: TrendingUp, color: 'yellow' }
        ].map((metric, idx) => (
          <div 
            key={idx}
            onMouseEnter={() => setHoveredMetric(idx)}
            onMouseLeave={() => setHoveredMetric(null)}
            className={`relative bg-black/60 backdrop-blur-xl rounded-lg p-3 border transition-all duration-300 cursor-pointer
              ${hoveredMetric === idx ? 'border-cyan-400/40 transform -translate-y-0.5' : 'border-white/10'}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-white/40 uppercase tracking-[0.1em] font-medium">{metric.label}</p>
                <p className={`text-base font-bold mt-1 transition-colors ${
                  hoveredMetric === idx ? 'text-cyan-400' : 'text-white/90'
                }`}>{metric.value}</p>
              </div>
              <metric.icon className={`h-4 w-4 transition-all ${
                hoveredMetric === idx ? 'text-cyan-400/80' : 'text-white/20'
              }`} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        {/* 3D Globe */}
        <div className="col-span-1">
          <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
            <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Global Distribution</h2>
            <div ref={globeRef} style={{ height: '240px' }} />
          </div>
        </div>

        {/* Pie Chart */}
        <div className="col-span-1">
          <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
            <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Regional Split</h2>
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
                    border: '1px solid rgba(0, 212, 255, 0.2)',
                    borderRadius: '4px',
                    fontSize: '10px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Countries */}
        <div className="col-span-1">
          <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-green-400/50 to-transparent" />
            <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-3">Top 5 Countries</h2>
            <div className="space-y-3">
              {Object.entries(countryDistribution).slice(0, 5).map(([country, count], idx) => (
                <div key={idx}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] text-white/70">{country.toUpperCase()}</span>
                    <span className="text-[10px] text-cyan-400/80 font-mono">{count.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-black/50 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full transition-all duration-500"
                      style={{ width: `${(count / Math.max(...Object.values(countryDistribution))) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      {selectedView === 'regional' && (
        <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden mb-3">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
          <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Regional Asset Distribution</h2>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={regionalBarData}>
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
              <Bar dataKey="assets" fill="rgba(0, 212, 255, 0.5)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Scatter Chart */}
      {selectedView === 'country' && (
        <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden mb-3">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
          <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Country Distribution Pattern</h2>
          <ResponsiveContainer width="100%" height={150}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" />
              <XAxis type="number" dataKey="x" stroke="#ffffff20" tick={{ fontSize: 9 }} />
              <YAxis type="number" dataKey="y" stroke="#ffffff20" tick={{ fontSize: 9 }} />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }} 
                contentStyle={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.95)', 
                  border: '1px solid rgba(168, 85, 247, 0.2)',
                  borderRadius: '4px',
                  fontSize: '10px'
                }} 
              />
              <Scatter name="Countries" data={scatterData} fill="rgba(168, 85, 247, 0.6)" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Data Tables */}
      <div className="grid grid-cols-2 gap-3">
        {/* Regional Table */}
        <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
          <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Regional Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-1.5 text-white/30 font-medium uppercase tracking-wider">Region</th>
                  <th className="text-right py-1.5 text-white/30 font-medium uppercase tracking-wider">Assets</th>
                  <th className="text-right py-1.5 text-white/30 font-medium uppercase tracking-wider">Share</th>
                  <th className="text-center py-1.5 text-white/30 font-medium uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(regionDistribution).slice(0, 6).map(([region, count], idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-1.5 text-white/70">{region.toUpperCase()}</td>
                    <td className="py-1.5 text-right text-white/50 font-mono">{count.toLocaleString()}</td>
                    <td className="py-1.5 text-right">
                      <span className="text-cyan-400/80 font-bold">
                        {((count / totalCoverage) * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-1.5 text-center">
                      <div className={`inline-flex w-1.5 h-1.5 rounded-full ${
                        count > 10000 ? 'bg-green-400' : 
                        count > 5000 ? 'bg-yellow-400' : 'bg-red-400'
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
          <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Top Countries</h2>
          <div className="overflow-x-auto max-h-48">
            <table className="w-full text-[10px]">
              <thead className="sticky top-0 bg-black/60">
                <tr className="border-b border-white/5">
                  <th className="text-left py-1.5 text-white/30 font-medium uppercase tracking-wider">Country</th>
                  <th className="text-right py-1.5 text-white/30 font-medium uppercase tracking-wider">Assets</th>
                  <th className="text-right py-1.5 text-white/30 font-medium uppercase tracking-wider">Share</th>
                  <th className="text-center py-1.5 text-white/30 font-medium uppercase tracking-wider">Health</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(countryDistribution).slice(0, 10).map(([country, count], idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-1.5 text-white/70">{country.toUpperCase()}</td>
                    <td className="py-1.5 text-right text-white/50 font-mono">{count.toLocaleString()}</td>
                    <td className="py-1.5 text-right">
                      <span className="text-purple-400/80 font-bold">
                        {((count / totalCoverage) * 100).toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-1.5 text-center">
                      <div className="flex justify-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <div 
                            key={i}
                            className={`w-1 h-2 rounded-sm ${
                              i < Math.ceil((count / Math.max(...Object.values(countryDistribution))) * 5) 
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
    </div>
  );
};

export default RegionalCountryView;