import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Globe, AlertTriangle, Database, Shield, Activity, Server, Cloud, BarChart3, TrendingUp, Users, MapPin } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const GlobalView = () => {
  const [globalData, setGlobalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
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

  // 3D Globe Visualization
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

    // Globe
    const globeGeometry = new THREE.SphereGeometry(50, 32, 32);
    const globeMaterial = new THREE.MeshPhongMaterial({
      color: 0x0077be,
      emissive: 0x00d4ff,
      emissiveIntensity: 0.1,
      wireframe: false,
      transparent: true,
      opacity: 0.8
    });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);

    // Add regional markers
    const regions = globalData?.regional_breakdown || [];
    regions.forEach((region, idx) => {
      const markerGeometry = new THREE.SphereGeometry(2, 8, 8);
      const markerMaterial = new THREE.MeshBasicMaterial({
        color: region.cmdb_coverage > 70 ? 0x00ff00 : region.cmdb_coverage > 40 ? 0xffaa00 : 0xff0000
      });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      
      const phi = (90 - (idx * 30 - 60)) * Math.PI / 180;
      const theta = (idx * 60) * Math.PI / 180;
      marker.position.x = 55 * Math.sin(phi) * Math.cos(theta);
      marker.position.y = 55 * Math.cos(phi);
      marker.position.z = 55 * Math.sin(phi) * Math.sin(theta);
      
      scene.add(marker);
    });

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1, 200);
    pointLight.position.set(100, 100, 100);
    scene.add(pointLight);

    camera.position.z = 150;

    const animate = () => {
      requestAnimationFrame(animate);
      globe.rotation.y += 0.002;
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
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
          <div className="mt-4 text-cyan-400">Loading Global Infrastructure Data...</div>
        </div>
      </div>
    );
  }

  const metrics = globalData?.global_metrics || {};
  const regionalData = globalData?.regional_breakdown || [];
  const countryData = globalData?.country_breakdown || [];
  const datacenterData = globalData?.datacenter_breakdown || [];
  const cloudData = globalData?.cloud_breakdown || [];

  // Prepare chart data
  const coverageChartData = [
    { name: 'CMDB', value: metrics.cmdb_coverage, color: '#00d4ff' },
    { name: 'URL/FQDN', value: metrics.url_fqdn_coverage, color: '#22c55e' },
    { name: 'Uncovered', value: 100 - metrics.cmdb_coverage, color: '#ef4444' }
  ];

  const regionalChartData = regionalData.slice(0, 5).map(r => ({
    region: r.region,
    assets: r.assets,
    cmdb: r.cmdb_coverage,
    tanium: r.tanium_coverage,
    splunk: r.splunk_coverage,
    overall: r.overall_visibility
  }));

  const radarData = regionalData.slice(0, 6).map(r => ({
    subject: r.region,
    visibility: r.overall_visibility,
    fullMark: 100
  }));

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-cyan-400 mb-2">Global Infrastructure Dashboard</h1>
        <div className="flex gap-4">
          <button onClick={() => setSelectedTab('overview')} className={`px-4 py-2 rounded ${selectedTab === 'overview' ? 'bg-cyan-600' : 'bg-gray-700'}`}>Overview</button>
          <button onClick={() => setSelectedTab('regional')} className={`px-4 py-2 rounded ${selectedTab === 'regional' ? 'bg-cyan-600' : 'bg-gray-700'}`}>Regional</button>
          <button onClick={() => setSelectedTab('datacenter')} className={`px-4 py-2 rounded ${selectedTab === 'datacenter' ? 'bg-cyan-600' : 'bg-gray-700'}`}>Data Centers</button>
          <button onClick={() => setSelectedTab('cloud')} className={`px-4 py-2 rounded ${selectedTab === 'cloud' ? 'bg-cyan-600' : 'bg-gray-700'}`}>Cloud</button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Assets</p>
              <p className="text-2xl font-bold text-white">{metrics.total_assets?.toLocaleString()}</p>
            </div>
            <Database className="h-8 w-8 text-cyan-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">CMDB Coverage</p>
              <p className="text-2xl font-bold text-cyan-400">{metrics.cmdb_coverage?.toFixed(1)}%</p>
            </div>
            <Shield className="h-8 w-8 text-cyan-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Regions</p>
              <p className="text-2xl font-bold text-green-400">{metrics.regions_covered}</p>
            </div>
            <MapPin className="h-8 w-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Countries</p>
              <p className="text-2xl font-bold text-purple-400">{metrics.countries_covered}</p>
            </div>
            <Globe className="h-8 w-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3D Globe */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
            <h2 className="text-xl font-bold mb-3 text-cyan-400">Global Distribution</h2>
            <div ref={globeRef} style={{ height: '300px' }} />
          </div>
        </div>

        {/* Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Coverage Pie Chart */}
          <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
            <h2 className="text-xl font-bold mb-3 text-cyan-400">Coverage Distribution</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={coverageChartData} cx="50%" cy="50%" labelLine={false} label={(entry) => `${entry.name}: ${entry.value?.toFixed(1)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                  {coverageChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Regional Bar Chart */}
          <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
            <h2 className="text-xl font-bold mb-3 text-cyan-400">Regional Coverage Analysis</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={regionalChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="region" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                <Legend />
                <Bar dataKey="cmdb" fill="#00d4ff" name="CMDB %" />
                <Bar dataKey="tanium" fill="#22c55e" name="Tanium %" />
                <Bar dataKey="splunk" fill="#a855f7" name="Splunk %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Data Tables */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regional Table */}
        <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
          <h2 className="text-xl font-bold mb-3 text-cyan-400">Regional Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-2 text-gray-400">Region</th>
                  <th className="text-right p-2 text-gray-400">Assets</th>
                  <th className="text-right p-2 text-gray-400">CMDB %</th>
                  <th className="text-right p-2 text-gray-400">Visibility %</th>
                </tr>
              </thead>
              <tbody>
                {regionalData.map((region, idx) => (
                  <tr key={idx} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="p-2">{region.region}</td>
                    <td className="p-2 text-right">{region.assets.toLocaleString()}</td>
                    <td className="p-2 text-right">
                      <span className={`font-bold ${region.cmdb_coverage > 70 ? 'text-green-400' : region.cmdb_coverage > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {region.cmdb_coverage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-2 text-right">
                      <span className={`font-bold ${region.overall_visibility > 70 ? 'text-green-400' : region.overall_visibility > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {region.overall_visibility.toFixed(1)}%
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-2 text-gray-400">Country</th>
                  <th className="text-right p-2 text-gray-400">Assets</th>
                  <th className="text-right p-2 text-gray-400">% of Total</th>
                  <th className="text-right p-2 text-gray-400">CMDB %</th>
                </tr>
              </thead>
              <tbody>
                {countryData.slice(0, 10).map((country, idx) => (
                  <tr key={idx} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="p-2">{country.country}</td>
                    <td className="p-2 text-right">{country.assets.toLocaleString()}</td>
                    <td className="p-2 text-right">{country.percentage_of_total.toFixed(1)}%</td>
                    <td className="p-2 text-right">
                      <span className={`font-bold ${country.cmdb_coverage > 70 ? 'text-green-400' : country.cmdb_coverage > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {country.cmdb_coverage.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="mt-6 bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
        <h2 className="text-xl font-bold mb-3 text-cyan-400">Regional Visibility Radar</h2>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#374151" />
            <PolarAngleAxis dataKey="subject" stroke="#9ca3af" />
            <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#9ca3af" />
            <Radar name="Visibility %" dataKey="visibility" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.6} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default GlobalView;