// src/components/pages/DomainVisibility.tsx
import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Globe, Shield, Database, Network, Server, Cloud, Activity, Lock, Eye, Layers, Zap, AlertTriangle, Binary, Wifi, Target, Cpu, CheckCircle, XCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area, ScatterChart, Scatter } from 'recharts';

const DomainVisibility = () => {
  const [domainData, setDomainData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [hoveredMetric, setHoveredMetric] = useState(null);
  const threeDRef = useRef(null);
  const networkRef = useRef(null);
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
    scene.fog = new THREE.FogExp2(0x000000, 0.002);
    
    const camera = new THREE.PerspectiveCamera(75, threeDRef.current.clientWidth / threeDRef.current.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    
    renderer.setSize(threeDRef.current.clientWidth, threeDRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    threeDRef.current.appendChild(renderer.domElement);

    // Create segmented sphere representing domain distribution
    const sphereRadius = 35;
    const percentages = domainData?.domain_percentages || {};
    
    // Create sphere segments for each domain
    const segments = [
      { name: '1dc_only', color: 0x00d4ff, percentage: percentages['1dc_only'] || 0 },
      { name: 'fead_only', color: 0xa855f7, percentage: percentages.fead_only || 0 },
      { name: 'both_domains', color: 0x00ff88, percentage: percentages.both_domains || 0 },
      { name: 'other', color: 0xff8800, percentage: percentages.other || 0 }
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
          emissiveIntensity: 0.1,
          transparent: true,
          opacity: 0.6,
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
      opacity: 0.1
    });
    const wireMesh = new THREE.Mesh(wireGeometry, wireMaterial);
    scene.add(wireMesh);

    // Add data rings around sphere
    for (let i = 1; i <= 3; i++) {
      const ringRadius = sphereRadius + i * 8;
      const ringGeometry = new THREE.TorusGeometry(ringRadius, 0.3, 8, 100);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: i === 1 ? 0x00d4ff : i === 2 ? 0xa855f7 : 0x00ff88,
        transparent: true,
        opacity: 0.2
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2 + (i * 0.1);
      scene.add(ring);
    }

    // Data flow particles
    const particleCount = 500;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const radius = sphereRadius + Math.random() * 25;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
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
    
    const pointLight1 = new THREE.PointLight(0x00d4ff, 0.5, 200);
    pointLight1.position.set(80, 80, 80);
    scene.add(pointLight1);

    camera.position.set(0, 0, 100);
    camera.lookAt(0, 0, 0);

    const animate = () => {
      requestAnimationFrame(animate);
      scene.rotation.y += 0.002;
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
    
    domains.forEach((domain, index) => {
      const angle = (index / domains.length) * Math.PI * 2;
      const radius = 60;
      nodes.push({
        x: canvas.width / 2 + Math.cos(angle) * radius,
        y: canvas.height / 2 + Math.sin(angle) * radius,
        label: domain,
        radius: 15,
        color: domain === '1DC' ? 'rgba(0, 212, 255, 0.6)' : 
               domain === 'FEAD' ? 'rgba(168, 85, 247, 0.6)' : 
               domain === 'BOTH' ? 'rgba(0, 255, 136, 0.6)' : 'rgba(255, 136, 0, 0.6)'
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
        
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();

        // Animate particles
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
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
          
          return true;
        });
      });

      // Draw nodes
      nodes.forEach(node => {
        // Node glow
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius);
        gradient.addColorStop(0, node.color);
        gradient.addColorStop(1, node.color.replace('0.6', '0'));
        
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
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = 'bold 10px monospace';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-10 w-10 border-b border-cyan-400/50"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-10 w-10 border border-cyan-400/20"></div>
          </div>
          <div className="mt-3 text-[10px] text-white/40 uppercase tracking-[0.2em] animate-pulse">Analyzing Domains...</div>
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
    { name: '1DC Only', value: percentages['1dc_only'] || 0, color: 'rgba(0, 212, 255, 0.7)' },
    { name: 'FEAD Only', value: percentages.fead_only || 0, color: 'rgba(168, 85, 247, 0.7)' },
    { name: 'Both Domains', value: percentages.both_domains || 0, color: 'rgba(0, 255, 136, 0.7)' },
    { name: 'Other', value: percentages.other || 0, color: 'rgba(255, 136, 0, 0.7)' }
  ];

  const coverageBarData = Object.entries(coverage).map(([domain, data]) => ({
    domain: domain.toUpperCase().substring(0, 8),
    cmdb: data.cmdb_coverage,
    tanium: data.tanium_coverage,
    splunk: data.splunk_coverage
  }));

  const radarData = Object.entries(coverage).map(([domain, data]) => ({
    subject: domain.toUpperCase().substring(0, 6),
    cmdb: data.cmdb_coverage || 0,
    tanium: data.tanium_coverage || 0,
    splunk: data.splunk_coverage || 0
  }));

  return (
    <div className="p-3 h-full overflow-auto bg-black">
      {/* Grid background */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none"
           style={{
             backgroundImage: 'linear-gradient(rgba(0, 212, 255, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.3) 1px, transparent 1px)',
             backgroundSize: '50px 50px'
           }} />
      
      {/* Header with Warfare Status */}
      <div className="mb-4 relative">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white/90 tracking-tight">DOMAIN VISIBILITY ANALYSIS</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
              <p className="text-[9px] text-white/40 uppercase tracking-[0.15em]">Hostname & domain mapping</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
              warfareStatus === 'BALANCED' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
              warfareStatus === '1DC DOMINANT' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
              warfareStatus === 'FEAD DOMINANT' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
              'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            }`}>
              {warfareStatus}
            </span>
            <div className="flex items-center gap-2">
              <Network className="w-3 h-3 text-cyan-400/60 animate-pulse" />
              <span className="text-[10px] text-white/50">{totalHosts.toLocaleString()} Hosts</span>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="mt-3 flex gap-1">
          {['overview', 'distribution', 'coverage', 'details'].map(tab => (
            <button 
              key={tab}
              onClick={() => setSelectedTab(tab)} 
              className={`px-3 py-1 text-[10px] font-medium uppercase tracking-wider rounded transition-all duration-200 ${
                selectedTab === tab 
                  ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 text-white border border-cyan-400/30' 
                  : 'bg-black/40 text-white/40 border border-white/5 hover:text-white/60 hover:border-white/10'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Alert for Domain Imbalance */}
      {(percentages['1dc_only'] > 60 || percentages.fead_only > 60) && (
        <div className="mb-3 bg-red-500/10 border border-red-500/30 rounded-lg p-2 flex items-center gap-2">
          <AlertTriangle className="h-3 w-3 text-red-400" />
          <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Imbalance:</span>
          <span className="text-[10px] text-white/80">
            {percentages['1dc_only'] > 60 ? `1DC dominance at ${percentages['1dc_only'].toFixed(1)}%` : 
             `FEAD dominance at ${percentages.fead_only.toFixed(1)}%`}
          </span>
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-6 gap-2 mb-4">
        {[
          { label: 'Total Hosts', value: totalHosts.toLocaleString(), icon: Server },
          { label: '1DC Only', value: `${percentages['1dc_only']?.toFixed(1)}%`, icon: Network, color: 'cyan' },
          { label: 'FEAD Only', value: `${percentages.fead_only?.toFixed(1)}%`, icon: Wifi, color: 'purple' },
          { label: 'Both Domains', value: `${percentages.both_domains?.toFixed(1)}%`, icon: Layers, color: 'green' },
          { label: 'Other', value: `${percentages.other?.toFixed(1)}%`, icon: Globe, color: 'yellow' },
          { label: 'Domains', value: Object.keys(coverage).length, icon: Shield }
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
                <p className={`text-sm font-bold mt-1 transition-colors ${
                  hoveredMetric === idx ? 
                    (metric.color === 'cyan' ? 'text-cyan-400' :
                     metric.color === 'purple' ? 'text-purple-400' :
                     metric.color === 'green' ? 'text-green-400' :
                     metric.color === 'yellow' ? 'text-yellow-400' : 'text-white') : 
                    'text-white/90'
                }`}>{metric.value}</p>
              </div>
              <metric.icon className={`h-3 w-3 transition-all ${
                hoveredMetric === idx ? 'text-cyan-400/80' : 'text-white/20'
              }`} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Based on Tab */}
      {selectedTab === 'overview' && (
        <div className="grid grid-cols-3 gap-3 mb-3">
          {/* 3D Sphere */}
          <div className="col-span-1">
            <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
              <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Domain Sphere</h2>
              <div ref={threeDRef} style={{ height: '240px' }} />
            </div>
          </div>

          {/* Pie Chart */}
          <div className="col-span-1">
            <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
              <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Domain Distribution</h2>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie 
                    data={domainPieData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={40}
                    outerRadius={80} 
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {domainPieData.map((entry, index) => (
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
                  <Radar name="CMDB" dataKey="cmdb" stroke="rgba(0, 212, 255, 0.6)" fill="rgba(0, 212, 255, 0.2)" />
                  <Radar name="Tanium" dataKey="tanium" stroke="rgba(0, 255, 136, 0.6)" fill="rgba(0, 255, 136, 0.2)" />
                  <Radar name="Splunk" dataKey="splunk" stroke="rgba(168, 85, 247, 0.6)" fill="rgba(168, 85, 247, 0.2)" />
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
      )}

      {selectedTab === 'distribution' && (
        <div className="space-y-3">
          {/* Network Flow */}
          <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
            <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Domain Network Flow</h2>
            <canvas ref={networkRef} style={{ width: '100%', height: '200px' }} />
          </div>
        </div>
      )}

      {selectedTab === 'coverage' && (
        <div className="space-y-3">
          {/* Coverage Bar Chart */}
          <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
            <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Domain Security Coverage</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={coverageBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" />
                <XAxis dataKey="domain" stroke="#ffffff20" tick={{ fontSize: 9 }} />
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
                <Bar dataKey="splunk" fill="rgba(168, 85, 247, 0.5)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Data Tables */}
      <div className="grid grid-cols-2 gap-3">
        {/* Distribution Table */}
        <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
          <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Domain Distribution</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-1.5 text-white/30 font-medium uppercase tracking-wider">Domain</th>
                  <th className="text-right py-1.5 text-white/30 font-medium uppercase tracking-wider">Hosts</th>
                  <th className="text-right py-1.5 text-white/30 font-medium uppercase tracking-wider">Share</th>
                  <th className="text-center py-1.5 text-white/30 font-medium uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(distribution).map(([domain, count], idx) => {
                  const percentage = percentages[domain] || 0;
                  return (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-1.5 flex items-center gap-2">
                        {domain.includes('1dc') ? <Network className="w-3 h-3 text-cyan-400/60" /> :
                         domain.includes('fead') ? <Wifi className="w-3 h-3 text-purple-400/60" /> :
                         domain.includes('both') ? <Layers className="w-3 h-3 text-green-400/60" /> :
                         <Globe className="w-3 h-3 text-yellow-400/60" />}
                        <span className="text-white/70">{domain.replace('_', ' ').toUpperCase()}</span>
                      </td>
                      <td className="py-1.5 text-right text-white/50 font-mono">{count.toLocaleString()}</td>
                      <td className="py-1.5 text-right">
                        <span className={`font-bold ${
                          domain.includes('both') ? 'text-green-400/80' :
                          domain.includes('1dc') ? 'text-cyan-400/80' :
                          domain.includes('fead') ? 'text-purple-400/80' :
                          'text-yellow-400/80'
                        }`}>
                          {percentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-1.5 text-center">
                        {percentage > 40 ? 
                          <CheckCircle className="w-3 h-3 text-green-400 inline" /> :
                          percentage > 20 ?
                          <AlertTriangle className="w-3 h-3 text-yellow-400 inline" /> :
                          <XCircle className="w-3 h-3 text-red-400 inline" />
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
        <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
          <h2 className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.15em] mb-2">Coverage Analysis</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-1.5 text-white/30 font-medium uppercase tracking-wider">Domain</th>
                  <th className="text-right py-1.5 text-white/30 font-medium uppercase tracking-wider">Assets</th>
                  <th className="text-right py-1.5 text-white/30 font-medium uppercase tracking-wider">CMDB</th>
                  <th className="text-right py-1.5 text-white/30 font-medium uppercase tracking-wider">Tanium</th>
                  <th className="text-center py-1.5 text-white/30 font-medium uppercase tracking-wider">Risk</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(coverage).map(([domain, data], idx) => {
                  const avgCoverage = (data.cmdb_coverage + data.tanium_coverage + data.splunk_coverage) / 3;
                  return (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-1.5 text-white/70">{domain.toUpperCase()}</td>
                      <td className="py-1.5 text-right text-white/50 font-mono">{data.total_assets.toLocaleString()}</td>
                      <td className="py-1.5 text-right">
                        <span className={`${
                          data.cmdb_coverage > 70 ? 'text-green-400/80' : 
                          data.cmdb_coverage > 40 ? 'text-yellow-400/80' : 'text-red-400/80'
                        }`}>
                          {data.cmdb_coverage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-1.5 text-right">
                        <span className={`${
                          data.tanium_coverage > 70 ? 'text-green-400/80' : 
                          data.tanium_coverage > 40 ? 'text-yellow-400/80' : 'text-red-400/80'
                        }`}>
                          {data.tanium_coverage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-1.5 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                          avgCoverage > 70 ? 'bg-green-500/20 text-green-400' :
                          avgCoverage > 40 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {avgCoverage > 70 ? 'LOW' : avgCoverage > 40 ? 'MED' : 'HIGH'}
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
    </div>
  );
};

export default DomainVisibility;