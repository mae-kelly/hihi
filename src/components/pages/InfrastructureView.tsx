import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Server, Cloud, Database, Network, AlertTriangle, Activity, Cpu, HardDrive, Layers, Shield } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TreeMap, AreaChart, Area } from 'recharts';

const InfrastructureView = () => {
  const [infraData, setInfraData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
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
    scene.fog = new THREE.FogExp2(0x000011, 0.002);
    
    const camera = new THREE.PerspectiveCamera(75, threeDRef.current.clientWidth / threeDRef.current.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    
    renderer.setSize(threeDRef.current.clientWidth, threeDRef.current.clientHeight);
    threeDRef.current.appendChild(renderer.domElement);

    // Create infrastructure layers
    const layers = infraData?.infrastructure_breakdown?.slice(0, 10) || [];
    
    layers.forEach((infra, index) => {
      const geometry = new THREE.BoxGeometry(
        20 * (infra.total_assets / 1000),
        5,
        20 * (infra.total_assets / 1000)
      );
      
      const material = new THREE.MeshPhongMaterial({
        color: infra.risk_level === 'CRITICAL' ? 0xff0000 : 
               infra.risk_level === 'HIGH' ? 0xffaa00 : 
               infra.risk_level === 'MEDIUM' ? 0xffff00 : 0x00ff00,
        transparent: true,
        opacity: 0.7
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.y = index * 7 - 20;
      scene.add(mesh);
    });

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 0.8);
    pointLight.position.set(50, 50, 50);
    scene.add(pointLight);

    camera.position.set(40, 20, 40);
    camera.lookAt(0, 0, 0);

    const animate = () => {
      requestAnimationFrame(animate);
      scene.rotation.y += 0.002;
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
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
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

  const barData = breakdown.slice(0, 10).map(infra => ({
    name: infra.type.length > 15 ? infra.type.substring(0, 15) + '...' : infra.type,
    assets: infra.total_assets,
    cmdb: infra.visibility_metrics.cmdb,
    tanium: infra.visibility_metrics.tanium,
    splunk: infra.visibility_metrics.splunk,
    crowdstrike: infra.visibility_metrics.crowdstrike
  }));

  const treeMapData = breakdown.slice(0, 15).map(infra => ({
    name: infra.type,
    size: infra.total_assets,
    risk: infra.risk_level,
    visibility: infra.overall_visibility
  }));

  const colors = {
    'On-Premise': '#00d4ff',
    'Cloud': '#a855f7',
    'SaaS': '#22c55e',
    'API': '#ffaa00',
    'Other': '#ef4444'
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-cyan-400 mb-2">Infrastructure Type Analysis</h1>
        <div className="flex gap-2">
          {['all', 'On-Premise', 'Cloud', 'SaaS'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded ${selectedCategory === cat ? 'bg-cyan-600' : 'bg-gray-700'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Types</p>
              <p className="text-2xl font-bold">{totalTypes}</p>
            </div>
            <Layers className="h-8 w-8 text-cyan-400" />
          </div>
        </div>

        {categorySummary.slice(0, 3).map((cat, idx) => (
          <div key={idx} className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{cat.category}</p>
                <p className="text-2xl font-bold">{cat.total_assets.toLocaleString()}</p>
                <p className="text-xs text-cyan-400">{cat.overall_visibility.toFixed(1)}% visible</p>
              </div>
              {cat.category === 'Cloud' ? <Cloud className="h-8 w-8 text-purple-400" /> :
               cat.category === 'On-Premise' ? <Server className="h-8 w-8 text-cyan-400" /> :
               <Database className="h-8 w-8 text-green-400" />}
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* 3D Visualization */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
            <h2 className="text-xl font-bold mb-3 text-cyan-400">Infrastructure Stack</h2>
            <div ref={threeDRef} style={{ height: '300px' }} />
          </div>
        </div>

        {/* Pie Chart */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
            <h2 className="text-xl font-bold mb-3 text-cyan-400">Category Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value"
                     label={(entry) => `${entry.name}: ${entry.coverage?.toFixed(1)}%`}>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[entry.name] || '#888'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Summary */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
            <h2 className="text-xl font-bold mb-3 text-cyan-400">Risk Distribution</h2>
            <div className="space-y-3">
              {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(risk => {
                const count = breakdown.filter(i => i.risk_level === risk).length;
                const percentage = (count / breakdown.length) * 100;
                return (
                  <div key={risk}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">{risk}</span>
                      <span className="text-sm">{count} types</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          risk === 'CRITICAL' ? 'bg-red-500' :
                          risk === 'HIGH' ? 'bg-orange-500' :
                          risk === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
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

      {/* Bar Chart */}
      <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30 mb-6">
        <h2 className="text-xl font-bold mb-3 text-cyan-400">Top Infrastructure Types - Security Coverage</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" height={80} />
            <YAxis stroke="#9ca3af" />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
            <Legend />
            <Bar dataKey="cmdb" stackId="a" fill="#00d4ff" name="CMDB %" />
            <Bar dataKey="tanium" stackId="a" fill="#22c55e" name="Tanium %" />
            <Bar dataKey="splunk" stackId="a" fill="#a855f7" name="Splunk %" />
            <Bar dataKey="crowdstrike" stackId="a" fill="#ffaa00" name="CrowdStrike %" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Data Table */}
      <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
        <h2 className="text-xl font-bold mb-3 text-cyan-400">Infrastructure Breakdown Details</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-2 text-gray-400">Type</th>
                <th className="text-left p-2 text-gray-400">Category</th>
                <th className="text-right p-2 text-gray-400">Assets</th>
                <th className="text-right p-2 text-gray-400">CMDB %</th>
                <th className="text-right p-2 text-gray-400">Tanium %</th>
                <th className="text-right p-2 text-gray-400">Splunk %</th>
                <th className="text-right p-2 text-gray-400">Overall %</th>
                <th className="text-center p-2 text-gray-400">Risk</th>
              </tr>
            </thead>
            <tbody>
              {breakdown
                .filter(infra => selectedCategory === 'all' || infra.category === selectedCategory)
                .slice(0, 20)
                .map((infra, idx) => (
                  <tr key={idx} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="p-2">{infra.type}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        infra.category === 'Cloud' ? 'bg-purple-500/20 text-purple-400' :
                        infra.category === 'On-Premise' ? 'bg-cyan-500/20 text-cyan-400' :
                        infra.category === 'SaaS' ? 'bg-green-500/20 text-green-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {infra.category}
                      </span>
                    </td>
                    <td className="p-2 text-right">{infra.total_assets.toLocaleString()}</td>
                    <td className="p-2 text-right">{infra.visibility_metrics.cmdb.toFixed(1)}%</td>
                    <td className="p-2 text-right">{infra.visibility_metrics.tanium.toFixed(1)}%</td>
                    <td className="p-2 text-right">{infra.visibility_metrics.splunk.toFixed(1)}%</td>
                    <td className="p-2 text-right">
                      <span className={`font-bold ${
                        infra.overall_visibility > 70 ? 'text-green-400' :
                        infra.overall_visibility > 40 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {infra.overall_visibility.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${
                        infra.risk_level === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                        infra.risk_level === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                        infra.risk_level === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {infra.risk_level}
                      </span>
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