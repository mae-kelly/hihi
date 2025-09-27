import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Building, Users, Eye, AlertTriangle, Activity, Briefcase, TrendingUp, Layers } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Treemap, Sankey } from 'recharts';

const BUandApplicationView = () => {
  const [buData, setBuData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('business_units');
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
    threeDRef.current.appendChild(renderer.domElement);

    // Create BU nodes
    const businessUnits = buData?.business_units?.slice(0, 10) || [];
    const nodeGroup = new THREE.Group();
    
    businessUnits.forEach((bu, index) => {
      const angle = (index / businessUnits.length) * Math.PI * 2;
      const radius = 30;
      
      const geometry = new THREE.SphereGeometry(
        Math.max(3, Math.min(10, Math.log(bu.total_assets / 100 + 1) * 3)),
        16, 16
      );
      
      const material = new THREE.MeshPhongMaterial({
        color: bu.risk_level === 'CRITICAL' ? 0xff0000 :
               bu.risk_level === 'HIGH' ? 0xffaa00 :
               bu.risk_level === 'MEDIUM' ? 0xffff00 : 0x00ff00,
        emissive: bu.risk_level === 'CRITICAL' ? 0xff0000 : 0x00ff00,
        emissiveIntensity: 0.2
      });
      
      const node = new THREE.Mesh(geometry, material);
      node.position.x = Math.cos(angle) * radius;
      node.position.z = Math.sin(angle) * radius;
      node.position.y = (bu.overall_visibility - 50) / 5;
      nodeGroup.add(node);
      
      // Add connections to center
      const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(node.position.x, node.position.y, node.position.z)
      ];
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00d4ff, opacity: 0.3, transparent: true });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      nodeGroup.add(line);
    });
    
    scene.add(nodeGroup);

    // Central core
    const coreGeometry = new THREE.OctahedronGeometry(5, 0);
    const coreMaterial = new THREE.MeshPhongMaterial({ color: 0x00d4ff, emissive: 0x00d4ff, emissiveIntensity: 0.5 });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(50, 50, 50);
    scene.add(pointLight);

    camera.position.set(0, 30, 60);
    camera.lookAt(0, 0, 0);

    const animate = () => {
      requestAnimationFrame(animate);
      nodeGroup.rotation.y += 0.003;
      core.rotation.y += 0.01;
      core.rotation.x += 0.005;
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
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
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
  const buBarData = businessUnits.slice(0, 10).map(bu => ({
    name: bu.business_unit.length > 20 ? bu.business_unit.substring(0, 20) + '...' : bu.business_unit,
    assets: bu.total_assets,
    cmdb: bu.visibility_metrics.cmdb,
    tanium: bu.visibility_metrics.tanium,
    splunk: bu.visibility_metrics.splunk,
    overall: bu.overall_visibility
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
    color: level === 'CRITICAL' ? '#ef4444' : level === 'HIGH' ? '#f59e0b' : level === 'MEDIUM' ? '#eab308' : '#22c55e'
  }));

  const treemapData = businessUnits.slice(0, 15).map(bu => ({
    name: bu.business_unit,
    size: bu.total_assets,
    visibility: bu.overall_visibility,
    risk: bu.risk_level
  }));

  const colors = ['#00d4ff', '#22c55e', '#a855f7', '#ffaa00', '#ef4444', '#3b82f6', '#ec4899'];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-cyan-400 mb-2">Business Unit & Application Analysis</h1>
        <div className="flex gap-2">
          <button onClick={() => setSelectedTab('business_units')} 
                  className={`px-4 py-2 rounded ${selectedTab === 'business_units' ? 'bg-cyan-600' : 'bg-gray-700'}`}>
            Business Units
          </button>
          <button onClick={() => setSelectedTab('applications')} 
                  className={`px-4 py-2 rounded ${selectedTab === 'applications' ? 'bg-cyan-600' : 'bg-gray-700'}`}>
            Applications
          </button>
          <button onClick={() => setSelectedTab('cio')} 
                  className={`px-4 py-2 rounded ${selectedTab === 'cio' ? 'bg-cyan-600' : 'bg-gray-700'}`}>
            CIO Ownership
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total BUs</p>
              <p className="text-2xl font-bold">{totalBUs}</p>
            </div>
            <Building className="h-8 w-8 text-cyan-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">App Classes</p>
              <p className="text-2xl font-bold">{totalAppClasses}</p>
            </div>
            <Layers className="h-8 w-8 text-purple-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">CIOs</p>
              <p className="text-2xl font-bold">{totalCIOs}</p>
            </div>
            <Users className="h-8 w-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Critical BUs</p>
              <p className="text-2xl font-bold text-red-400">{riskDistribution.CRITICAL}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* 3D Visualization */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
            <h2 className="text-xl font-bold mb-3 text-cyan-400">BU Network Topology</h2>
            <div ref={threeDRef} style={{ height: '300px' }} />
          </div>
        </div>

        {/* Risk Distribution Pie */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
            <h2 className="text-xl font-bold mb-3 text-cyan-400">Risk Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value"
                     label={(entry) => `${entry.name}: ${entry.value}`}>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top App Classes */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
            <h2 className="text-xl font-bold mb-3 text-cyan-400">Top Application Classes</h2>
            <div className="space-y-2">
              {applicationClasses.slice(0, 10).map((app, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm truncate">{app.class}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-700 rounded-full h-2">
                      <div className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400"
                           style={{ width: `${(app.total_assets / Math.max(...applicationClasses.map(a => a.total_assets))) * 100}%` }} />
                    </div>
                    <span className="text-xs text-gray-400">{app.total_assets.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30 mb-6">
        <h2 className="text-xl font-bold mb-3 text-cyan-400">Business Unit Visibility Metrics</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={buBarData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" height={100} />
            <YAxis stroke="#9ca3af" />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
            <Legend />
            <Bar dataKey="cmdb" fill="#00d4ff" name="CMDB %" />
            <Bar dataKey="tanium" fill="#22c55e" name="Tanium %" />
            <Bar dataKey="splunk" fill="#a855f7" name="Splunk %" />
            <Bar dataKey="overall" fill="#ffaa00" name="Overall %" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Units Table */}
        {selectedTab === 'business_units' && (
          <div className="lg:col-span-2 bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
            <h2 className="text-xl font-bold mb-3 text-cyan-400">Business Units Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-2 text-gray-400">Business Unit</th>
                    <th className="text-right p-2 text-gray-400">Assets</th>
                    <th className="text-right p-2 text-gray-400">CIOs</th>
                    <th className="text-right p-2 text-gray-400">App Classes</th>
                    <th className="text-right p-2 text-gray-400">CMDB %</th>
                    <th className="text-right p-2 text-gray-400">Tanium %</th>
                    <th className="text-right p-2 text-gray-400">Splunk %</th>
                    <th className="text-right p-2 text-gray-400">Overall %</th>
                    <th className="text-center p-2 text-gray-400">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {businessUnits.slice(0, 20).map((bu, idx) => (
                    <tr key={idx} className="border-b border-gray-700 hover:bg-gray-700/50">
                      <td className="p-2">{bu.business_unit}</td>
                      <td className="p-2 text-right">{bu.total_assets.toLocaleString()}</td>
                      <td className="p-2 text-right">{bu.cio_count}</td>
                      <td className="p-2 text-right">{bu.app_class_count}</td>
                      <td className="p-2 text-right">{bu.visibility_metrics.cmdb.toFixed(1)}%</td>
                      <td className="p-2 text-right">{bu.visibility_metrics.tanium.toFixed(1)}%</td>
                      <td className="p-2 text-right">{bu.visibility_metrics.splunk.toFixed(1)}%</td>
                      <td className="p-2 text-right">
                        <span className={`font-bold ${
                          bu.overall_visibility > 70 ? 'text-green-400' :
                          bu.overall_visibility > 40 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {bu.overall_visibility.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${
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

        {/* CIO Ownership Table */}
        {selectedTab === 'cio' && (
          <div className="lg:col-span-2 bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
            <h2 className="text-xl font-bold mb-3 text-cyan-400">CIO Ownership</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-2 text-gray-400">CIO</th>
                    <th className="text-right p-2 text-gray-400">Total Assets</th>
                    <th className="text-right p-2 text-gray-400">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cioOwnership.map((cio, idx) => (
                    <tr key={idx} className="border-b border-gray-700 hover:bg-gray-700/50">
                      <td className="p-2">{cio.cio}</td>
                      <td className="p-2 text-right">{cio.total_assets.toLocaleString()}</td>
                      <td className="p-2 text-right">
                        {((cio.total_assets / businessUnits.reduce((sum, bu) => sum + bu.total_assets, 1)) * 100).toFixed(2)}%
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
          <div className="lg:col-span-2 bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
            <h2 className="text-xl font-bold mb-3 text-cyan-400">Application Classes</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-2 text-gray-400">Class</th>
                    <th className="text-right p-2 text-gray-400">Total Assets</th>
                    <th className="text-right p-2 text-gray-400">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {applicationClasses.map((app, idx) => (
                    <tr key={idx} className="border-b border-gray-700 hover:bg-gray-700/50">
                      <td className="p-2">{app.class}</td>
                      <td className="p-2 text-right">{app.total_assets.toLocaleString()}</td>
                      <td className="p-2 text-right">
                        {((app.total_assets / businessUnits.reduce((sum, bu) => sum + bu.total_assets, 1)) * 100).toFixed(2)}%
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