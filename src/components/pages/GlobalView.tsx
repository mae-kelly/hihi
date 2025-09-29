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
  const [selectedRegion, setSelectedRegion] = useState(null);
  const globeRef = useRef(null);
  const rendererRef = useRef(null);
  const frameCount = useRef(0);

  // ONLY these colors allowed - pastel neon
  const COLORS = {
    cyan: '#a8dadc',     // Pastel neon cyan
    purple: '#c8b6ff',   // Pastel neon purple  
    pink: '#ffafcc',     // Pastel neon pink
    white: '#ffffff',
    whiteAlpha: 'rgba(255, 255, 255, 0.6)',
    black: '#000000'
  };

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

    // Black globe with subtle purple glow
    const globeGeometry = new THREE.SphereGeometry(45, 64, 64);
    const globeMaterial = new THREE.MeshPhongMaterial({
      color: 0x000000,
      emissive: 0xc8b6ff,
      emissiveIntensity: 0.02,
      transparent: true,
      opacity: 0.9
    });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);

    // Wireframe with pastel cyan
    const wireGeometry = new THREE.SphereGeometry(46, 24, 24);
    const wireMaterial = new THREE.MeshBasicMaterial({
      color: 0xa8dadc,
      wireframe: true,
      transparent: true,
      opacity: 0.1
    });
    const wireMesh = new THREE.Mesh(wireGeometry, wireMaterial);
    scene.add(wireMesh);

    // Data points from API
    const regions = globalData?.regional_breakdown || [];
    regions.forEach((region, idx) => {
      const phi = (90 - (idx * 30 - 60)) * Math.PI / 180;
      const theta = (idx * 60) * Math.PI / 180;
      const x = 48 * Math.sin(phi) * Math.cos(theta);
      const y = 48 * Math.cos(phi);
      const z = 48 * Math.sin(phi) * Math.sin(theta);

      // Only use our 3 colors based on coverage
      const glowGeometry = new THREE.SphereGeometry(3, 8, 8);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: region.cmdb_coverage > 70 ? 0xa8dadc : // cyan for good
               region.cmdb_coverage > 40 ? 0xc8b6ff : // purple for medium
               0xffafcc, // pink for low
        transparent: true,
        opacity: 0.3
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.set(x, y, z);
      scene.add(glow);

      // White point
      const markerGeometry = new THREE.SphereGeometry(1, 8, 8);
      const markerMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9
      });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(x, y, z);
      scene.add(marker);

      // Connection line in cyan
      const points = [];
      points.push(new THREE.Vector3(0, 0, 0));
      points.push(new THREE.Vector3(x * 0.9, y * 0.9, z * 0.9));
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const lineMaterial = new THREE.LineBasicMaterial({ 
        color: 0xa8dadc,
        transparent: true, 
        opacity: 0.2 
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
    });

    // Purple particles
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
      color: 0xc8b6ff,
      size: 0.5,
      transparent: true,
      opacity: 0.4
    });
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Simple white lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 0.3, 200);
    pointLight.position.set(100, 100, 100);
    scene.add(pointLight);

    camera.position.z = 130;

    const animate = () => {
      requestAnimationFrame(animate);
      frameCount.current++;
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
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: COLORS.black }}>
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: COLORS.cyan }}></div>
            <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border" style={{ borderColor: `${COLORS.purple}33` }}></div>
          </div>
          <div className="mt-4 text-xs uppercase tracking-[0.3em]" style={{ color: COLORS.whiteAlpha }}>Initializing...</div>
        </div>
      </div>
    );
  }

  const metrics = globalData?.global_metrics || {};
  const regionalData = globalData?.regional_breakdown || [];
  const countryData = globalData?.country_breakdown || [];

  // Chart data with real API values
  const coverageChartData = [
    { name: 'CMDB', value: metrics.cmdb_coverage || 0, fill: COLORS.cyan },
    { name: 'Protected', value: metrics.url_fqdn_coverage || 0, fill: COLORS.purple },
    { name: 'Gap', value: Math.max(0, 100 - (metrics.cmdb_coverage || 0)), fill: COLORS.pink }
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

  // Custom tooltip - black background, white text
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload[0]) {
      return (
        <div style={{ backgroundColor: 'rgba(0,0,0,0.95)', padding: '8px', borderRadius: '4px', border: `1px solid ${COLORS.whiteAlpha}` }}>
          <p style={{ color: COLORS.white, fontSize: '12px', fontWeight: 'bold' }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: COLORS.whiteAlpha, fontSize: '11px' }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ padding: '16px', height: '100%', overflow: 'auto', backgroundColor: COLORS.black }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: COLORS.white, letterSpacing: '-0.5px' }}>GLOBAL INFRASTRUCTURE</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: COLORS.cyan }} className="animate-pulse" />
              <p style={{ fontSize: '11px', color: COLORS.whiteAlpha, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Real-time monitoring active</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={16} style={{ color: COLORS.pink }} className="animate-pulse" />
            <span style={{ fontSize: '11px', color: COLORS.whiteAlpha }}>Live Data</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          {['overview', 'regional', 'datacenter', 'cloud'].map(tab => (
            <button 
              key={tab}
              onClick={() => setSelectedTab(tab)}
              style={{
                padding: '8px 16px',
                fontSize: '11px',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                borderRadius: '4px',
                transition: 'all 0.3s',
                backgroundColor: selectedTab === tab ? `${COLORS.purple}33` : 'rgba(255,255,255,0.05)',
                color: selectedTab === tab ? COLORS.white : COLORS.whiteAlpha,
                border: selectedTab === tab ? `1px solid ${COLORS.purple}66` : '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Assets', value: metrics.total_assets?.toLocaleString(), icon: Database, color: COLORS.cyan },
          { label: 'CMDB Coverage', value: `${metrics.cmdb_coverage?.toFixed(1)}%`, icon: Shield, color: COLORS.purple },
          { label: 'Regions', value: metrics.regions_covered, icon: MapPin, color: COLORS.pink },
          { label: 'Countries', value: metrics.countries_covered, icon: Globe, color: COLORS.cyan }
        ].map((metric, idx) => (
          <div 
            key={idx}
            onMouseEnter={() => setHoveredMetric(idx)}
            onMouseLeave={() => setHoveredMetric(null)}
            style={{
              backgroundColor: COLORS.black,
              border: hoveredMetric === idx ? `1px solid ${metric.color}` : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '16px',
              transition: 'all 0.3s',
              cursor: 'pointer',
              transform: hoveredMetric === idx ? 'translateY(-4px)' : 'translateY(0)',
              boxShadow: hoveredMetric === idx ? `0 10px 20px ${metric.color}33` : 'none'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '10px', color: COLORS.whiteAlpha, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>{metric.label}</p>
                <p style={{ fontSize: '20px', fontWeight: 'bold', color: COLORS.white }}>{metric.value}</p>
              </div>
              <metric.icon size={20} style={{ color: metric.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
        {/* 3D Globe */}
        <div style={{ backgroundColor: COLORS.black, border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '16px', height: '320px' }}>
          <h2 style={{ fontSize: '11px', fontWeight: '600', color: COLORS.whiteAlpha, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Global Network</h2>
          <div ref={globeRef} style={{ height: '280px' }} />
        </div>

        {/* Charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Pie Chart */}
          <div style={{ backgroundColor: COLORS.black, border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '16px' }}>
            <h2 style={{ fontSize: '11px', fontWeight: '600', color: COLORS.whiteAlpha, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Coverage Analysis</h2>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie 
                  data={coverageChartData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={30}
                  outerRadius={55} 
                  paddingAngle={2}
                  dataKey="value"
                  onClick={(data) => console.log('Clicked:', data)}
                >
                  {coverageChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Area Chart */}
          <div style={{ backgroundColor: COLORS.black, border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '16px' }}>
            <h2 style={{ fontSize: '11px', fontWeight: '600', color: COLORS.whiteAlpha, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Visibility Trend</h2>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={areaChartData}>
                <defs>
                  <linearGradient id="colorVis" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.cyan} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.cyan} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey="name" stroke={COLORS.whiteAlpha} tick={{ fontSize: 9, fill: COLORS.whiteAlpha }} />
                <YAxis stroke={COLORS.whiteAlpha} tick={{ fontSize: 9, fill: COLORS.whiteAlpha }} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="visibility" 
                  stroke={COLORS.cyan}
                  fillOpacity={1} 
                  fill="url(#colorVis)" 
                  strokeWidth={2}
                  onClick={(data) => setSelectedRegion(data)}
                />
                <Area 
                  type="monotone" 
                  dataKey="baseline" 
                  stroke={COLORS.pink}
                  fillOpacity={0.1} 
                  fill={COLORS.pink}
                  strokeWidth={1} 
                  strokeDasharray="5 5" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Data Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginTop: '24px' }}>
        {/* Regional Table */}
        <div style={{ backgroundColor: COLORS.black, border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '16px' }}>
          <h2 style={{ fontSize: '11px', fontWeight: '600', color: COLORS.whiteAlpha, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Regional Analysis</h2>
          <table style={{ width: '100%', fontSize: '11px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ textAlign: 'left', padding: '8px 0', color: COLORS.whiteAlpha }}>Region</th>
                <th style={{ textAlign: 'right', padding: '8px 0', color: COLORS.whiteAlpha }}>Assets</th>
                <th style={{ textAlign: 'right', padding: '8px 0', color: COLORS.whiteAlpha }}>CMDB</th>
                <th style={{ textAlign: 'center', padding: '8px 0', color: COLORS.whiteAlpha }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {regionalData.slice(0, 5).map((region, idx) => (
                <tr key={idx} 
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                    onClick={() => setSelectedRegion(region)}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '8px 0', color: COLORS.white }}>{region.region}</td>
                  <td style={{ textAlign: 'right', padding: '8px 0', color: COLORS.whiteAlpha }}>{region.assets.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', padding: '8px 0', 
                             color: region.cmdb_coverage > 70 ? COLORS.cyan : 
                                    region.cmdb_coverage > 40 ? COLORS.purple : COLORS.pink }}>
                    {region.cmdb_coverage.toFixed(1)}%
                  </td>
                  <td style={{ textAlign: 'center', padding: '8px 0' }}>
                    <div style={{ 
                      display: 'inline-block',
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%',
                      backgroundColor: region.overall_visibility > 70 ? COLORS.cyan : 
                                      region.overall_visibility > 40 ? COLORS.purple : COLORS.pink
                    }} className="animate-pulse" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Country Table */}
        <div style={{ backgroundColor: COLORS.black, border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '16px' }}>
          <h2 style={{ fontSize: '11px', fontWeight: '600', color: COLORS.whiteAlpha, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Top Locations</h2>
          <table style={{ width: '100%', fontSize: '11px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ textAlign: 'left', padding: '8px 0', color: COLORS.whiteAlpha }}>Country</th>
                <th style={{ textAlign: 'right', padding: '8px 0', color: COLORS.whiteAlpha }}>Assets</th>
                <th style={{ textAlign: 'right', padding: '8px 0', color: COLORS.whiteAlpha }}>Share</th>
                <th style={{ textAlign: 'right', padding: '8px 0', color: COLORS.whiteAlpha }}>Health</th>
              </tr>
            </thead>
            <tbody>
              {countryData.slice(0, 5).map((country, idx) => (
                <tr key={idx} 
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '8px 0', color: COLORS.white }}>{country.country}</td>
                  <td style={{ textAlign: 'right', padding: '8px 0', color: COLORS.whiteAlpha }}>{country.assets.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', padding: '8px 0', color: COLORS.purple }}>{country.percentage_of_total.toFixed(1)}%</td>
                  <td style={{ textAlign: 'right', padding: '8px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2px' }}>
                      {[...Array(5)].map((_, i) => (
                        <div 
                          key={i}
                          style={{
                            width: '4px',
                            height: '12px',
                            borderRadius: '1px',
                            backgroundColor: i < Math.ceil(country.cmdb_coverage / 20) ? COLORS.cyan : 'rgba(255,255,255,0.1)'
                          }}
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

      {/* Bar Chart */}
      <div style={{ marginTop: '24px', backgroundColor: COLORS.black, border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '16px' }}>
        <h2 style={{ fontSize: '11px', fontWeight: '600', color: COLORS.whiteAlpha, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Regional Performance Matrix</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={regionalChartData} onClick={(data) => console.log('Bar clicked:', data)}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis dataKey="region" stroke={COLORS.whiteAlpha} tick={{ fontSize: 10, fill: COLORS.whiteAlpha }} />
            <YAxis stroke={COLORS.whiteAlpha} tick={{ fontSize: 10, fill: COLORS.whiteAlpha }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="cmdb" fill={COLORS.cyan} radius={[4, 4, 0, 0]} />
            <Bar dataKey="tanium" fill={COLORS.purple} radius={[4, 4, 0, 0]} />
            <Bar dataKey="splunk" fill={COLORS.pink} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default GlobalView;