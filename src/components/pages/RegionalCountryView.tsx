import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Globe, MapPin, Eye, AlertTriangle, Activity, Building, Cloud, Server, Users, Flag, TrendingUp, Layers } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area, ScatterChart, Scatter } from 'recharts';

const RegionalCountryView = () => {
  const [regionalData, setRegionalData] = useState(null);
  const [countryData, setCountryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('regional');
  const [selectedRegion, setSelectedRegion] = useState(null);
  const globeRef = useRef(null);
  const rendererRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch both regional and country metrics
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
    scene.fog = new THREE.FogExp2(0x000011, 0.001);
    
    const camera = new THREE.PerspectiveCamera(60, globeRef.current.clientWidth / globeRef.current.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    
    renderer.setSize(globeRef.current.clientWidth, globeRef.current.clientHeight);
    globeRef.current.appendChild(renderer.domElement);

    // Create globe
    const globeRadius = 50;
    const globeGeometry = new THREE.SphereGeometry(globeRadius, 64, 64);
    const globeMaterial = new THREE.MeshPhongMaterial({
      color: 0x001133,
      emissive: 0x00d4ff,
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
      opacity: 0.15
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
      
      // Create marker
      const markerSize = Math.max(2, Math.min(8, Math.log(count / 100 + 1) * 2));
      const markerGeometry = new THREE.ConeGeometry(markerSize, markerSize * 2, 8);
      const markerMaterial = new THREE.MeshPhongMaterial({
        color: count > 10000 ? 0x00ff00 : count > 5000 ? 0xffaa00 : 0xff0000,
        emissive: count > 10000 ? 0x00ff00 : count > 5000 ? 0xffaa00 : 0xff0000,
        emissiveIntensity: 0.3
      });
      
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(x * 1.1, y * 1.1, z * 1.1);
      marker.lookAt(0, 0, 0);
      marker.rotateX(Math.PI);
      scene.add(marker);
      
      // Add pulse rings for high-density regions
      if (count > 10000) {
        const ringGeometry = new THREE.RingGeometry(markerSize * 1.5, markerSize * 2, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: 0x00ff00,
          transparent: true,
          opacity: 0.3,
          side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(marker.position);
        ring.lookAt(x, y, z);
        scene.add(ring);
      }
    });

    // Add data flow particles
    const particleCount = 500;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();
      const radius = globeRadius + Math.random() * 30;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi);
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      
      colors[i * 3] = 0;
      colors[i * 3 + 1] = 0.83;
      colors[i * 3 + 2] = 1;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    const pointLight1 = new THREE.PointLight(0x00d4ff, 1, 300);
    pointLight1.position.set(150, 150, 150);
    scene.add(pointLight1);
    const pointLight2 = new THREE.PointLight(0xa855f7, 0.5, 300);
    pointLight2.position.set(-150, -150, -150);
    scene.add(pointLight2);

    camera.position.set(0, 0, 150);
    camera.lookAt(0, 0, 0);

    const animate = () => {
      requestAnimationFrame(animate);
      globe.rotation.y += 0.002;
      wireframe.rotation.y += 0.002;
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
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  const totalCoverage = regionalData?.total_coverage || 0;
  const regionDistribution = regionalData?.global_surveillance || {};
  const countryDistribution = countryData?.global_intelligence || {};
  const totalCountries = countryData?.total_countries || 0;

  // Prepare chart data
  const regionalBarData = Object.entries(regionDistribution).slice(0, 10).map(([region, count]) => ({
    name: region.toUpperCase(),
    assets: count,
    percentage: (count / totalCoverage * 100).toFixed(1)
  }));

  const countryBarData = Object.entries(countryDistribution).slice(0, 15).map(([country, count]) => ({
    name: country.toUpperCase().substring(0, 20),
    assets: count,
    percentage: (count / totalCoverage * 100).toFixed(1)
  }));

  const regionPieData = Object.entries(regionDistribution).slice(0, 6).map(([region, count]) => ({
    name: region.toUpperCase(),
    value: count,
    color: region.includes('america') ? '#00d4ff' :
           region.includes('emea') || region.includes('europe') ? '#22c55e' :
           region.includes('apac') || region.includes('asia') ? '#a855f7' :
           region.includes('latam') ? '#ffaa00' : '#ef4444'
  }));

  const scatterData = Object.entries(countryDistribution).slice(0, 30).map(([country, count], idx) => ({
    x: idx,
    y: count,
    name: country
  }));

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-cyan-400 mb-2">Regional & Country Distribution</h1>
        <div className="flex gap-2">
          <button onClick={() => setSelectedView('regional')} 
                  className={`px-4 py-2 rounded ${selectedView === 'regional' ? 'bg-cyan-600' : 'bg-gray-700'}`}>
            Regional View
          </button>
          <button onClick={() => setSelectedView('country')} 
                  className={`px-4 py-2 rounded ${selectedView === 'country' ? 'bg-cyan-600' : 'bg-gray-700'}`}>
            Country View
          </button>
          <button onClick={() => setSelectedView('global')} 
                  className={`px-4 py-2 rounded ${selectedView === 'global' ? 'bg-cyan-600' : 'bg-gray-700'}`}>
            Global Overview
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Coverage</p>
              <p className="text-2xl font-bold">{totalCoverage.toLocaleString()}</p>
            </div>
            <Globe className="h-8 w-8 text-cyan-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Regions</p>
              <p className="text-2xl font-bold">{Object.keys(regionDistribution).length}</p>
            </div>
            <MapPin className="h-8 w-8 text-purple-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Countries</p>
              <p className="text-2xl font-bold">{totalCountries}</p>
            </div>
            <Flag className="h-8 w-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Top Region</p>
              <p className="text-lg font-bold">{Object.keys(regionDistribution)[0]?.toUpperCase() || 'N/A'}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* 3D Globe */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
            <h2 className="text-xl font-bold mb-3 text-cyan-400">Global Distribution</h2>
            <div ref={globeRef} style={{ height: '300px' }} />
          </div>
        </div>

        {/* Regional Pie Chart */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
            <h2 className="text-xl font-bold mb-3 text-cyan-400">Regional Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={regionPieData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value"
                     label={(entry) => `${entry.name}: ${(entry.value / totalCoverage * 100).toFixed(1)}%`}>
                  {regionPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Countries Bar */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
            <h2 className="text-xl font-bold mb-3 text-cyan-400">Top 5 Countries</h2>
            <div className="space-y-3">
              {Object.entries(countryDistribution).slice(0, 5).map(([country, count], idx) => (
                <div key={idx}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">{country.toUpperCase()}</span>
                    <span className="text-sm text-cyan-400">{count.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-cyan-400 to-purple-400 h-2 rounded-full"
                         style={{ width: `${(count / Math.max(...Object.values(countryDistribution))) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bar Charts */}
      {selectedView === 'regional' && (
        <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30 mb-6">
          <h2 className="text-xl font-bold mb-3 text-cyan-400">Regional Asset Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={regionalBarData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
              <Bar dataKey="assets" fill="#00d4ff" name="Assets" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {selectedView === 'country' && (
        <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30 mb-6">
          <h2 className="text-xl font-bold mb-3 text-cyan-400">Country Asset Distribution</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={countryBarData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9ca3af" />
              <YAxis type="category" dataKey="name" stroke="#9ca3af" width={100} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
              <Bar dataKey="assets" fill="#a855f7" name="Assets" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Scatter Chart */}
      {selectedView === 'global' && (
        <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30 mb-6">
          <h2 className="text-xl font-bold mb-3 text-cyan-400">Global Asset Scatter</h2>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" dataKey="x" name="index" stroke="#9ca3af" />
              <YAxis type="number" dataKey="y" name="assets" stroke="#9ca3af" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} 
                       contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
              <Scatter name="Countries" data={scatterData} fill="#00d4ff" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regional Table */}
        <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
          <h2 className="text-xl font-bold mb-3 text-cyan-400">Regional Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-2 text-gray-400">Region</th>
                  <th className="text-right p-2 text-gray-400">Assets</th>
                  <th className="text-right p-2 text-gray-400">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(regionDistribution).map(([region, count], idx) => (
                  <tr key={idx} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="p-2">{region.toUpperCase()}</td>
                    <td className="p-2 text-right">{count.toLocaleString()}</td>
                    <td className="p-2 text-right">
                      <span className="font-bold text-cyan-400">
                        {((count / totalCoverage) * 100).toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Country Table */}
        <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
          <h2 className="text-xl font-bold mb-3 text-cyan-400">Top Countries</h2>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-800">
                <tr className="border-b border-gray-700">
                  <th className="text-left p-2 text-gray-400">Country</th>
                  <th className="text-right p-2 text-gray-400">Assets</th>
                  <th className="text-right p-2 text-gray-400">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(countryDistribution).slice(0, 20).map(([country, count], idx) => (
                  <tr key={idx} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="p-2">{country.toUpperCase()}</td>
                    <td className="p-2 text-right">{count.toLocaleString()}</td>
                    <td className="p-2 text-right">
                      <span className="font-bold text-purple-400">
                        {((count / totalCoverage) * 100).toFixed(2)}%
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

export default RegionalCountryView;