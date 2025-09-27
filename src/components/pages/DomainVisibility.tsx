import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Globe, Shield, Database, Network, Server, Cloud, Activity, Lock, Eye, Layers, Zap, AlertTriangle, Binary, Wifi, Target, Cpu, CheckCircle, XCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Treemap, AreaChart, Area, ScatterChart, Scatter } from 'recharts';

const DomainVisibility = () => {
  const [domainData, setDomainData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('24h');
  const threeDRef = useRef(null);
  const networkRef = useRef(null);
  const flowRef = useRef(null);
  const rendererRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/domain_visibility/breakdown');
        if (!response.ok) throw new Error('Failed to fetch domain data');
        const data = await response.json();
        setDomainData(data);
      } catch (error) {
        console.error('Error fetching domain data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // 3D Domain Sphere Visualization
  useEffect(() => {
    if (!threeDRef.current || !domainData || loading) return;

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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    threeDRef.current.appendChild(renderer.domElement);

    // Create segmented sphere representing domain distribution
    const sphereRadius = 40;
    const distribution = domainData?.domain_distribution || {};
    const percentages = domainData?.domain_percentages || {};
    
    // Create sphere segments for each domain
    const segments = [
      { name: '1dc_only', color: 0x00d4ff, percentage: percentages['1dc_only'] || 0 },
      { name: 'fead_only', color: 0xa855f7, percentage: percentages.fead_only || 0 },
      { name: 'both_domains', color: 0x22c55e, percentage: percentages.both_domains || 0 },
      { name: 'other', color: 0xffaa00, percentage: percentages.other || 0 }
    ];

    let currentAngle = 0;
    segments.forEach(segment => {
      if (segment.percentage > 0) {
        const angleSize = (segment.percentage / 100) * Math.PI * 2;
        const geometry = new THREE.SphereGeometry(
          sphereRadius, 
          32, 
          32, 
          currentAngle, 
          angleSize, 
          0, 
          Math.PI
        );
        const material = new THREE.MeshPhongMaterial({
          color: segment.color,
          emissive: segment.color,
          emissiveIntensity: 0.2,
          transparent: true,
          opacity: 0.7,
          side: THREE.DoubleSide
        });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        currentAngle += angleSize;
      }
    });

    // Add wireframe overlay
    const wireGeometry = new THREE.SphereGeometry(sphereRadius + 0.5, 32, 32);
    const wireMaterial = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      wireframe: true,
      transparent: true,
      opacity: 0.2
    });
    const wireMesh = new THREE.Mesh(wireGeometry, wireMaterial);
    scene.add(wireMesh);

    // Add data rings around sphere
    for (let i = 1; i <= 3; i++) {
      const ringRadius = sphereRadius + i * 10;
      const ringGeometry = new THREE.TorusGeometry(ringRadius, 0.5, 8, 100);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: i === 1 ? 0x00d4ff : i === 2 ? 0xa855f7 : 0x22c55e,
        transparent: true,
        opacity: 0.3
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2 + (i * 0.1);
      scene.add(ring);
    }

    // Data flow particles
    const particleCount = 1000;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const radius = sphereRadius + Math.random() * 30;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi);
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      
      // Color particles based on domain distribution
      const domainChoice = Math.random() * 100;
      if (domainChoice < percentages['1dc_only']) {
        colors[i * 3] = 0;
        colors[i * 3 + 1] = 0.83;
        colors[i * 3 + 2] = 1;
      } else if (domainChoice < percentages['1dc_only'] + percentages.fead_only) {
        colors[i * 3] = 0.66;
        colors[i * 3 + 1] = 0.33;
        colors[i * 3 + 2] = 0.97;
      } else if (domainChoice < percentages['1dc_only'] + percentages.fead_only + percentages.both_domains) {
        colors[i * 3] = 0.13;
        colors[i * 3 + 1] = 0.77;
        colors[i * 3 + 2] = 0.33;
      } else {
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 0.67;
        colors[i * 3 + 2] = 0;
      }
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
      size: 1.5,
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
    
    const pointLight1 = new THREE.PointLight(0x00d4ff, 2, 200);
    pointLight1.position.set(100, 100, 100);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0xa855f7, 1, 200);
    pointLight2.position.set(-100, -100, -100);
    scene.add(pointLight2);

    camera.position.set(0, 0, 120);
    camera.lookAt(0, 0, 0);

    // Animation
    const animate = () => {
      requestAnimationFrame(animate);
      scene.rotation.y += 0.003;
      particles.rotation.y -= 0.002;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (rendererRef.current && threeDRef.current) {
        threeDRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [domainData, loading]);

  // Network Flow Animation Canvas
  useEffect(() => {
    const canvas = networkRef.current;
    if (!canvas || !domainData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let animationId;
    const nodes = [];
    const connections = [];

    // Create domain nodes
    const domains = ['1DC', 'FEAD', 'BOTH', 'OTHER'];
    const coverage = domainData?.domain_coverage || {};
    
    domains.forEach((domain, index) => {
      const angle = (index / domains.length) * Math.PI * 2;
      const radius = 80;
      nodes.push({
        x: canvas.width / 2 + Math.cos(angle) * radius,
        y: canvas.height / 2 + Math.sin(angle) * radius,
        label: domain,
        radius: 20,
        color: domain === '1DC' ? '#00d4ff' : domain === 'FEAD' ? '#a855f7' : domain === 'BOTH' ? '#22c55e' : '#ffaa00'
      });
    });

    // Create connections
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        connections.push({ from: i, to: j, particles: [] });
      }
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw connections
      connections.forEach(conn => {
        const from = nodes[conn.from];
        const to = nodes[conn.to];
        
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();

        // Animate particles along connections
        if (Math.random() < 0.02) {
          conn.particles.push({ progress: 0 });
        }
        
        conn.particles = conn.particles.filter(p => {
          p.progress += 0.02;
          if (p.progress > 1) return false;
          
          const x = from.x + (to.x - from.x) * p.progress;
          const y = from.y + (to.y - from.y) * p.progress;
          
          ctx.fillStyle = 'rgba(0, 212, 255, 0.8)';
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
          
          return true;
        });
      });

      // Draw nodes
      nodes.forEach(node => {
        // Node glow
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius);
        gradient.addColorStop(0, node.color);
        gradient.addColorStop(1, node.color + '00');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Node core
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Node label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.label, node.x, node.y);
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [domainData]);

  // Data Flow Visualization Canvas
  useEffect(() => {
    const canvas = flowRef.current;
    if (!canvas || !domainData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let animationId;
    let flowPosition = 0;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      flowPosition += 2;
      if (flowPosition > canvas.width) flowPosition = 0;

      const percentages = domainData?.domain_percentages || {};
      const domains = [
        { name: '1DC', percentage: percentages['1dc_only'] || 0, color: '#00d4ff' },
        { name: 'FEAD', percentage: percentages.fead_only || 0, color: '#a855f7' },
        { name: 'BOTH', percentage: percentages.both_domains || 0, color: '#22c55e' },
        { name: 'OTHER', percentage: percentages.other || 0, color: '#ffaa00' }
      ];

      domains.forEach((domain, index) => {
        const y = (index + 1) * (canvas.height / 5);
        const barWidth = (canvas.width - 100) * (domain.percentage / 100);
        
        // Flow effect
        for (let i = 0; i < 5; i++) {
          const x = (flowPosition + i * 50) % canvas.width;
          if (x < barWidth + 50) {
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, 10);
            gradient.addColorStop(0, domain.color + 'FF');
            gradient.addColorStop(1, domain.color + '00');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, 10, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        
        // Bar
        ctx.fillStyle = domain.color + '40';
        ctx.fillRect(50, y - 10, barWidth, 20);
        
        ctx.strokeStyle = domain.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(50, y - 10, barWidth, 20);
        
        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(domain.name, 5, y + 4);
        
        ctx.fillStyle = domain.color;
        ctx.textAlign = 'right';
        ctx.fillText(`${domain.percentage.toFixed(1)}%`, canvas.width - 5, y + 4);
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [domainData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
          <div className="mt-4 text-lg text-cyan-400">Loading Domain Visibility Data...</div>
        </div>
      </div>
    );
  }

  const totalHosts = domainData?.total_hosts || 0;
  const distribution = domainData?.domain_distribution || {};
  const percentages = domainData?.domain_percentages || {};
  const coverage = domainData?.domain_coverage || {};
  const warfareStatus = domainData?.warfare_status || 'UNKNOWN';

  // Prepare chart data
  const domainPieData = [
    { name: '1DC Only', value: percentages['1dc_only'] || 0, color: '#00d4ff' },
    { name: 'FEAD Only', value: percentages.fead_only || 0, color: '#a855f7' },
    { name: 'Both Domains', value: percentages.both_domains || 0, color: '#22c55e' },
    { name: 'Other', value: percentages.other || 0, color: '#ffaa00' }
  ];

  const coverageBarData = Object.entries(coverage).map(([domain, data]) => ({
    domain: domain.toUpperCase(),
    assets: data.total_assets,
    cmdb: data.cmdb_coverage,
    tanium: data.tanium_coverage,
    splunk: data.splunk_coverage
  }));

  const radarData = Object.entries(coverage).map(([domain, data]) => ({
    subject: domain.toUpperCase(),
    cmdb: data.cmdb_coverage || 0,
    tanium: data.tanium_coverage || 0,
    splunk: data.splunk_coverage || 0
  }));

  const treemapData = Object.entries(distribution).map(([domain, count]) => ({
    name: domain.replace('_', ' ').toUpperCase(),
    size: count,
    percentage: percentages[domain] || 0
  }));

  const scatterData = Object.entries(coverage).map(([domain, data]) => ({
    x: data.cmdb_coverage || 0,
    y: data.tanium_coverage || 0,
    z: data.total_assets || 0,
    name: domain.toUpperCase()
  }));

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Header with Warfare Status */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-cyan-400">Domain Visibility Analysis</h1>
          <div className="flex items-center gap-4">
            <span className={`px-4 py-2 rounded-lg text-sm font-bold ${
              warfareStatus === 'BALANCED' ? 'bg-green-500/20 text-green-400 border border-green-500' :
              warfareStatus === '1DC DOMINANT' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500' :
              warfareStatus === 'FEAD DOMINANT' ? 'bg-purple-500/20 text-purple-400 border border-purple-500' :
              'bg-yellow-500/20 text-yellow-400 border border-yellow-500'
            }`}>
              WARFARE STATUS: {warfareStatus}
            </span>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="mt-4 flex gap-2">
          <button onClick={() => setSelectedTab('overview')} 
                  className={`px-4 py-2 rounded ${selectedTab === 'overview' ? 'bg-cyan-600' : 'bg-gray-700'}`}>
            Overview
          </button>
          <button onClick={() => setSelectedTab('distribution')} 
                  className={`px-4 py-2 rounded ${selectedTab === 'distribution' ? 'bg-cyan-600' : 'bg-gray-700'}`}>
            Distribution
          </button>
          <button onClick={() => setSelectedTab('coverage')} 
                  className={`px-4 py-2 rounded ${selectedTab === 'coverage' ? 'bg-cyan-600' : 'bg-gray-700'}`}>
            Coverage Analysis
          </button>
          <button onClick={() => setSelectedTab('details')} 
                  className={`px-4 py-2 rounded ${selectedTab === 'details' ? 'bg-cyan-600' : 'bg-gray-700'}`}>
            Detailed View
          </button>
        </div>
      </div>

      {/* Alert for Domain Imbalance */}
      {(percentages['1dc_only'] > 60 || percentages.fead_only > 60) && (
        <div className="mb-4 bg-red-500/10 border border-red-500 rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <span className="text-red-400 font-bold">DOMAIN IMBALANCE DETECTED:</span>
          <span className="text-white">
            {percentages['1dc_only'] > 60 ? `1DC dominance at ${percentages['1dc_only'].toFixed(1)}%` : 
             `FEAD dominance at ${percentages.fead_only.toFixed(1)}%`}
          </span>
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Hosts</p>
              <p className="text-2xl font-bold">{totalHosts.toLocaleString()}</p>
            </div>
            <Server className="h-8 w-8 text-cyan-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">1DC Only</p>
              <p className="text-2xl font-bold text-cyan-400">{percentages['1dc_only']?.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">{distribution['1dc_only']?.toLocaleString()} hosts</p>
            </div>
            <Network className="h-8 w-8 text-cyan-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 border border-purple-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">FEAD Only</p>
              <p className="text-2xl font-bold text-purple-400">{percentages.fead_only?.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">{distribution.fead_only?.toLocaleString()} hosts</p>
            </div>
            <Wifi className="h-8 w-8 text-purple-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 border border-green-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Both Domains</p>
              <p className="text-2xl font-bold text-green-400">{percentages.both_domains?.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">{distribution.both_domains?.toLocaleString()} hosts</p>
            </div>
            <Layers className="h-8 w-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 border border-yellow-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Other</p>
              <p className="text-2xl font-bold text-yellow-400">{percentages.other?.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">{distribution.other?.toLocaleString()} hosts</p>
            </div>
            <Globe className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Domain Coverage</p>
              <p className="text-2xl font-bold text-cyan-400">
                {Object.keys(coverage).length}
              </p>
              <p className="text-xs text-gray-500">Active domains</p>
            </div>
            <Shield className="h-8 w-8 text-cyan-400" />
          </div>
        </div>
      </div>

      {/* Main Content Based on Tab */}
      {selectedTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* 3D Sphere */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
              <h2 className="text-xl font-bold mb-3 text-cyan-400">Domain Distribution Sphere</h2>
              <div ref={threeDRef} style={{ height: '350px' }} />
            </div>
          </div>

          {/* Pie Chart */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
              <h2 className="text-xl font-bold mb-3 text-cyan-400">Domain Distribution</h2>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie data={domainPieData} cx="50%" cy="50%" labelLine={false} outerRadius={120} fill="#8884d8" dataKey="value"
                       label={(entry) => `${entry.name}: ${entry.value.toFixed(1)}%`}>
                    {domainPieData.map((entry, index) => (
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
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="subject" stroke="#9ca3af" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#9ca3af" />
                  <Radar name="CMDB" dataKey="cmdb" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.3} />
                  <Radar name="Tanium" dataKey="tanium" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                  <Radar name="Splunk" dataKey="splunk" stroke="#a855f7" fill="#a855f7" fillOpacity={0.3} />
                  <Tooltip />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'distribution' && (
        <div className="space-y-6">
          {/* Network Flow */}
          <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
            <h2 className="text-xl font-bold mb-3 text-cyan-400">Domain Network Flow</h2>
            <canvas ref={networkRef} style={{ width: '100%', height: '300px' }} />
          </div>

          {/* Treemap */}
          <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
            <h2 className="text-xl font-bold mb-3 text-cyan-400">Domain Distribution Treemap</h2>
            <ResponsiveContainer width="100%" height={400}>
              <Treemap
                data={treemapData}
                dataKey="size"
                aspectRatio={4 / 3}
                stroke="#fff"
                fill="#8884d8"
              >
                <Tooltip content={({ active, payload }) => {
                  if (active && payload && payload[0]) {
                    return (
                      <div className="bg-gray-800 p-2 rounded border border-cyan-400/50">
                        <p className="text-cyan-400 font-bold">{payload[0].payload.name}</p>
                        <p className="text-white">Hosts: {payload[0].value.toLocaleString()}</p>
                        <p className="text-gray-400">Percentage: {payload[0].payload.percentage?.toFixed(1)}%</p>
                      </div>
                    );
                  }
                  return null;
                }} />
              </Treemap>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {selectedTab === 'coverage' && (
        <div className="space-y-6">
          {/* Coverage Bar Chart */}
          <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
            <h2 className="text-xl font-bold mb-3 text-cyan-400">Domain Security Coverage</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={coverageBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="domain" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                <Legend />
                <Bar dataKey="cmdb" fill="#00d4ff" name="CMDB %" />
                <Bar dataKey="tanium" fill="#22c55e" name="Tanium %" />
                <Bar dataKey="splunk" fill="#a855f7" name="Splunk %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Scatter Plot */}
          <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
            <h2 className="text-xl font-bold mb-3 text-cyan-400">CMDB vs Tanium Coverage</h2>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="x" name="CMDB %" stroke="#9ca3af" />
                <YAxis dataKey="y" name="Tanium %" stroke="#9ca3af" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Domains" data={scatterData} fill="#00d4ff">
                  {scatterData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={
                      entry.name.includes('1DC') ? '#00d4ff' :
                      entry.name.includes('FEAD') ? '#a855f7' : '#22c55e'
                    } />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Flow Visualization */}
          <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
            <h2 className="text-xl font-bold mb-3 text-cyan-400">Data Flow Visualization</h2>
            <canvas ref={flowRef} style={{ width: '100%', height: '200px' }} />
          </div>
        </div>
      )}

      {/* Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution Table */}
        <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
          <h2 className="text-xl font-bold mb-3 text-cyan-400">Domain Distribution Details</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-2 text-gray-400">Domain</th>
                  <th className="text-right p-2 text-gray-400">Host Count</th>
                  <th className="text-right p-2 text-gray-400">Percentage</th>
                  <th className="text-center p-2 text-gray-400">Status</th>
                  <th className="text-center p-2 text-gray-400">Trend</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(distribution).map(([domain, count], idx) => {
                  const percentage = percentages[domain] || 0;
                  return (
                    <tr key={idx} className="border-b border-gray-700 hover:bg-gray-700/50">
                      <td className="p-2 flex items-center gap-2">
                        {domain.includes('1dc') ? <Network className="w-4 h-4 text-cyan-400" /> :
                         domain.includes('fead') ? <Wifi className="w-4 h-4 text-purple-400" /> :
                         domain.includes('both') ? <Layers className="w-4 h-4 text-green-400" /> :
                         <Globe className="w-4 h-4 text-yellow-400" />}
                        {domain.replace('_', ' ').toUpperCase()}
                      </td>
                      <td className="p-2 text-right">{count.toLocaleString()}</td>
                      <td className="p-2 text-right">
                        <span className={`font-bold ${
                          domain.includes('both') ? 'text-green-400' :
                          domain.includes('1dc') ? 'text-cyan-400' :
                          domain.includes('fead') ? 'text-purple-400' :
                          'text-yellow-400'
                        }`}>
                          {percentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        {percentage > 40 ? 
                          <CheckCircle className="w-4 h-4 text-green-400 inline" /> :
                          percentage > 20 ?
                          <AlertTriangle className="w-4 h-4 text-yellow-400 inline" /> :
                          <XCircle className="w-4 h-4 text-red-400 inline" />
                        }
                      </td>
                      <td className="p-2 text-center">
                        {Math.random() > 0.5 ? 
                          <TrendingUp className="w-4 h-4 text-green-400 inline" /> :
                          <TrendingDown className="w-4 h-4 text-red-400 inline" />
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Coverage Table */}
        <div className="bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
          <h2 className="text-xl font-bold mb-3 text-cyan-400">Domain Coverage Analysis</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-2 text-gray-400">Domain</th>
                  <th className="text-right p-2 text-gray-400">Assets</th>
                  <th className="text-right p-2 text-gray-400">CMDB %</th>
                  <th className="text-right p-2 text-gray-400">Tanium %</th>
                  <th className="text-right p-2 text-gray-400">Splunk %</th>
                  <th className="text-center p-2 text-gray-400">Risk</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(coverage).map(([domain, data], idx) => {
                  const avgCoverage = (data.cmdb_coverage + data.tanium_coverage + data.splunk_coverage) / 3;
                  return (
                    <tr key={idx} className="border-b border-gray-700 hover:bg-gray-700/50">
                      <td className="p-2">{domain.toUpperCase()}</td>
                      <td className="p-2 text-right">{data.total_assets.toLocaleString()}</td>
                      <td className="p-2 text-right">
                        <span className={`font-bold ${data.cmdb_coverage > 70 ? 'text-green-400' : data.cmdb_coverage > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {data.cmdb_coverage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-2 text-right">
                        <span className={`font-bold ${data.tanium_coverage > 70 ? 'text-green-400' : data.tanium_coverage > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {data.tanium_coverage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-2 text-right">
                        <span className={`font-bold ${data.splunk_coverage > 70 ? 'text-green-400' : data.splunk_coverage > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {data.splunk_coverage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${
                          avgCoverage > 70 ? 'bg-green-500/20 text-green-400' :
                          avgCoverage > 40 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {avgCoverage > 70 ? 'LOW' : avgCoverage > 40 ? 'MEDIUM' : 'HIGH'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Warfare Intelligence Summary */}
      <div className="mt-6 bg-gray-800 rounded-lg p-4 border border-cyan-400/30">
        <h2 className="text-xl font-bold mb-3 text-cyan-400">Warfare Intelligence Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-900 rounded">
            <div className="text-3xl font-bold text-cyan-400">{percentages['1dc_only']?.toFixed(1)}%</div>
            <div className="text-sm text-gray-400 mt-1">1DC Domain Control</div>
            <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-400" style={{ width: `${percentages['1dc_only']}%` }} />
            </div>
          </div>
          <div className="text-center p-4 bg-gray-900 rounded">
            <div className="text-3xl font-bold text-purple-400">{percentages.fead_only?.toFixed(1)}%</div>
            <div className="text-sm text-gray-400 mt-1">FEAD Domain Control</div>
            <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-purple-400" style={{ width: `${percentages.fead_only}%` }} />
            </div>
          </div>
          <div className="text-center p-4 bg-gray-900 rounded">
            <div className="text-3xl font-bold text-green-400">{percentages.both_domains?.toFixed(1)}%</div>
            <div className="text-sm text-gray-400 mt-1">Dual Domain Coverage</div>
            <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-green-400" style={{ width: `${percentages.both_domains}%` }} />
            </div>
          </div>
          <div className="text-center p-4 bg-gray-900 rounded">
            <div className={`text-3xl font-bold ${
              warfareStatus === 'BALANCED' ? 'text-green-400' :
              warfareStatus === '1DC DOMINANT' ? 'text-cyan-400' :
              'text-purple-400'
            }`}>
              {warfareStatus}
            </div>
            <div className="text-sm text-gray-400 mt-1">Current Status</div>
            <div className="mt-2 flex justify-center">
              {warfareStatus === 'BALANCED' ? 
                <CheckCircle className="w-6 h-6 text-green-400" /> :
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DomainVisibility;