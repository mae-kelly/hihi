import React, { useState, useEffect, useRef } from 'react';
import { Building, Users, Eye, AlertTriangle, Activity, Briefcase, Target, Database } from 'lucide-react';
import * as THREE from 'three';

const BUandApplicationView = () => {
  const [businessData, setBusinessData] = useState(null);
  const [cioData, setCioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('bu');
  const [selectedItem, setSelectedItem] = useState(null);
  const hierarchyRef = useRef(null);
  const sankeyRef = useRef(null);
  const bubbleRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const frameRef = useRef(null);
  const sankeyFrameRef = useRef(null);
  const bubbleFrameRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [buResponse, cioResponse] = await Promise.all([
          fetch('http://localhost:5000/api/business_unit_metrics'),
          fetch('http://localhost:5000/api/cio_metrics')
        ]);

        if (!buResponse.ok || !cioResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const buData = await buResponse.json();
        const cioDataRaw = await cioResponse.json();

        // Process and set business unit data
        setBusinessData({
          business_unit_breakdown: Object.entries(buData.business_intelligence || {}).map(([name, count]) => {
            const analytics = buData.bu_security_analysis?.[name] || {};
            return {
              business_unit: name,
              total_hosts: count,
              percentage: ((count / (buData.organizational_analytics?.total_assets || 1)) * 100),
              visibility_percentage: analytics.security_score || 0,
              status: analytics.security_status === 'VULNERABLE' ? 'CRITICAL' :
                     analytics.security_status === 'AT_RISK' ? 'WARNING' : 'GOOD',
              visible_hosts: Math.floor((analytics.security_score || 0) * count / 100),
              regions: analytics.regions || [],
              infrastructure_types: analytics.infrastructure_types || [],
              cmdb_coverage: analytics.cmdb_coverage || 0,
              tanium_coverage: analytics.tanium_coverage || 0
            };
          }).sort((a, b) => b.total_hosts - a.total_hosts),
          total_assets: buData.organizational_analytics?.total_assets || 0,
          security_leaders: buData.organizational_analytics?.security_leaders || [],
          vulnerable_units: buData.organizational_analytics?.vulnerable_units || [],
          risk_assessment: buData.organizational_analytics?.risk_assessment || {}
        });

        // Process and set CIO data
        setCioData({
          cio_breakdown: Object.entries(cioDataRaw.operative_intelligence || {}).map(([name, count]) => {
            const analytics = cioDataRaw.leadership_analysis?.[name] || {};
            const percentage = ((count / (cioDataRaw.governance_analytics?.total_assets_under_management || 1)) * 100);
            
            return {
              cio: name,
              total_hosts: count,
              percentage: percentage,
              visibility_percentage: Math.min(100, (analytics.span_of_control || 0) * 10),
              status: percentage > 20 ? 'CRITICAL' : percentage > 10 ? 'WARNING' : 'GOOD',
              visible_hosts: count,
              business_units: analytics.business_unit_list || [],
              regions: analytics.region_list || [],
              leadership_tier: analytics.leadership_tier || 'MANAGER',
              span_of_control: analytics.span_of_control || 0
            };
          }).sort((a, b) => b.total_hosts - a.total_hosts),
          total_assets: cioDataRaw.governance_analytics?.total_assets_under_management || 0,
          executive_summary: cioDataRaw.executive_summary || {},
          governance_analytics: cioDataRaw.governance_analytics || {}
        });

      } catch (error) {
        console.error('Error:', error);
        setBusinessData({
          business_unit_breakdown: [],
          total_assets: 0,
          security_leaders: [],
          vulnerable_units: []
        });
        setCioData({
          cio_breakdown: [],
          total_assets: 0,
          executive_summary: {}
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // 3D Organizational Hierarchy Visualization
  useEffect(() => {
    if (!hierarchyRef.current || !businessData || !cioData || loading) return;

    if (rendererRef.current) {
      rendererRef.current.dispose();
      if (hierarchyRef.current.contains(rendererRef.current.domElement)) {
        hierarchyRef.current.removeChild(rendererRef.current.domElement);
      }
    }

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x000000, 0.001);
    
    const camera = new THREE.PerspectiveCamera(
      60,
      hierarchyRef.current.clientWidth / hierarchyRef.current.clientHeight,
      0.1,
      1000
    );
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    
    rendererRef.current = renderer;
    renderer.setSize(hierarchyRef.current.clientWidth, hierarchyRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    hierarchyRef.current.appendChild(renderer.domElement);

    const nodes = [];
    const connections = [];
    
    // Get data based on selected view
    const viewData = selectedView === 'bu' 
      ? businessData.business_unit_breakdown || []
      : cioData.cio_breakdown || [];
    
    const maxHosts = Math.max(...viewData.map(d => d.total_hosts), 1);
    
    // Central core
    const coreGeometry = new THREE.IcosahedronGeometry(10, 2);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: 0x00d4ff,
      emissive: 0x00d4ff,
      emissiveIntensity: 0.2,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);
    
    // Create nodes for each business unit/CIO
    viewData.slice(0, 20).forEach((item, index) => {
      const angle = (index / Math.min(viewData.length, 20)) * Math.PI * 2;
      const radius = 60;
      
      const nodeGroup = new THREE.Group();
      
      // Node size based on total hosts
      const nodeSize = 5 + (item.total_hosts / maxHosts) * 15;
      
      // Node geometry
      const nodeGeometry = new THREE.SphereGeometry(nodeSize, 16, 16);
      
      const nodeMaterial = new THREE.MeshPhongMaterial({
        color: item.status === 'CRITICAL' ? 0xa855f7 :
               item.status === 'WARNING' ? 0xffaa00 : 0x00d4ff,
        emissive: item.status === 'CRITICAL' ? 0xa855f7 : 0x00d4ff,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.8
      });
      
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
      nodeGroup.add(node);
      
      // Visibility indicator sphere inside
      const visRadius = nodeSize * (item.visibility_percentage / 100);
      const visGeometry = new THREE.SphereGeometry(visRadius, 12, 12);
      const visMaterial = new THREE.MeshPhongMaterial({
        color: 0x00d4ff,
        emissive: 0x00d4ff,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.9
      });
      
      const visSphere = new THREE.Mesh(visGeometry, visMaterial);
      nodeGroup.add(visSphere);
      
      // Position node
      nodeGroup.position.x = Math.cos(angle) * radius;
      nodeGroup.position.z = Math.sin(angle) * radius;
      nodeGroup.position.y = (Math.random() - 0.5) * 20;
      
      nodeGroup.userData = item;
      nodes.push(nodeGroup);
      scene.add(nodeGroup);
      
      // Connection to center
      const points = [
        new THREE.Vector3(0, 0, 0),
        nodeGroup.position
      ];
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: item.status === 'CRITICAL' ? 0xa855f7 : 0x00d4ff,
        transparent: true,
        opacity: 0.3
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      connections.push(line);
      scene.add(line);
    });
    
    // Add particles
    const particleCount = 500;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 200;
      positions[i + 1] = (Math.random() - 0.5) * 100;
      positions[i + 2] = (Math.random() - 0.5) * 200;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
      size: 1,
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.6
    });
    
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const pointLight1 = new THREE.PointLight(0x00d4ff, 1, 200);
    pointLight1.position.set(100, 100, 100);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0xa855f7, 0.5, 200);
    pointLight2.position.set(-100, -50, -100);
    scene.add(pointLight2);
    
    camera.position.set(100, 80, 150);
    camera.lookAt(0, 0, 0);
    
    // Animation
    const animate = () => {
      if (!sceneRef.current) return;
      frameRef.current = requestAnimationFrame(animate);
      
      core.rotation.x += 0.005;
      core.rotation.y += 0.005;
      
      nodes.forEach((nodeGroup, index) => {
        nodeGroup.rotation.y += 0.01;
        nodeGroup.position.y += Math.sin(Date.now() * 0.001 + index) * 0.05;
      });
      
      particles.rotation.y += 0.001;
      
      const time = Date.now() * 0.0003;
      camera.position.x = Math.sin(time) * 150;
      camera.position.z = Math.cos(time) * 150;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
    };
    
    animate();

    const handleResize = () => {
      if (!hierarchyRef.current || !camera || !renderer) return;
      camera.aspect = hierarchyRef.current.clientWidth / hierarchyRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(hierarchyRef.current.clientWidth, hierarchyRef.current.clientHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (hierarchyRef.current && hierarchyRef.current.contains(rendererRef.current.domElement)) {
          hierarchyRef.current.removeChild(rendererRef.current.domElement);
        }
      }
    };
  }, [businessData, cioData, selectedView, loading]);

  // Sankey Diagram for visibility flow
  useEffect(() => {
    const canvas = sankeyRef.current;
    if (!canvas || !businessData || !cioData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const viewData = selectedView === 'bu' ? businessData.business_unit_breakdown :
                      cioData.cio_breakdown || [];

      const flowHeight = canvas.height / Math.min(viewData.length || 1, 10);
      
      viewData.slice(0, 10).forEach((item, index) => {
        const y = index * flowHeight + flowHeight / 2;
        const flowWidth = (canvas.width * 0.7) * (item.percentage / 100);
        
        ctx.strokeStyle = item.status === 'CRITICAL' ? '#a855f7' :
                         item.status === 'WARNING' ? '#ffaa00' : '#00d4ff';
        ctx.lineWidth = flowHeight * 0.6;
        ctx.globalAlpha = 0.6;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(flowWidth, y);
        ctx.stroke();
        
        ctx.globalAlpha = 1;
        
        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(
          `${(item.business_unit || item.cio || '').substring(0, 20)}`,
          5,
          y - flowHeight / 4
        );
        
        // Percentage
        ctx.fillStyle = item.status === 'CRITICAL' ? '#a855f7' : '#00d4ff';
        ctx.fillText(`${item.percentage?.toFixed(1)}%`, flowWidth + 10, y);
      });

      sankeyFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (sankeyFrameRef.current) cancelAnimationFrame(sankeyFrameRef.current);
    };
  }, [businessData, cioData, selectedView]);

  // Bubble Chart
  useEffect(() => {
    const canvas = bubbleRef.current;
    if (!canvas || !businessData || !cioData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const viewData = selectedView === 'bu' ? businessData.business_unit_breakdown :
                    cioData.cio_breakdown || [];

    const bubbles = viewData.slice(0, 10).map((item) => ({
      x: Math.random() * (canvas.width - 100) + 50,
      y: Math.random() * (canvas.height - 100) + 50,
      radius: Math.max(20, Math.min(50, Math.sqrt(item.total_hosts) * 2)),
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      data: item
    }));

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      bubbles.forEach(bubble => {
        // Update position
        bubble.x += bubble.vx;
        bubble.y += bubble.vy;
        
        // Bounce off walls
        if (bubble.x - bubble.radius < 0 || bubble.x + bubble.radius > canvas.width) {
          bubble.vx *= -1;
        }
        if (bubble.y - bubble.radius < 0 || bubble.y + bubble.radius > canvas.height) {
          bubble.vy *= -1;
        }
        
        // Draw bubble
        const gradient = ctx.createRadialGradient(
          bubble.x, bubble.y, 0,
          bubble.x, bubble.y, bubble.radius
        );
        
        if (bubble.data.status === 'CRITICAL') {
          gradient.addColorStop(0, 'rgba(168, 85, 247, 0.8)');
          gradient.addColorStop(1, 'rgba(168, 85, 247, 0.2)');
        } else {
          gradient.addColorStop(0, 'rgba(0, 212, 255, 0.8)');
          gradient.addColorStop(1, 'rgba(0, 212, 255, 0.2)');
        }
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw percentage
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.max(10, bubble.radius / 3)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          `${bubble.data.visibility_percentage?.toFixed(0)}%`,
          bubble.x,
          bubble.y
        );
      });

      bubbleFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (bubbleFrameRef.current) cancelAnimationFrame(bubbleFrameRef.current);
    };
  }, [businessData, cioData, selectedView]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
          <div className="mt-4 text-lg font-bold text-cyan-400">ANALYZING ORGANIZATIONAL VISIBILITY</div>
        </div>
      </div>
    );
  }

  const currentData = selectedView === 'bu' ? businessData?.business_unit_breakdown : cioData?.cio_breakdown || [];
  const totalAssets = selectedView === 'bu' ? businessData?.total_assets : cioData?.total_assets || 0;
  const avgVisibility = currentData.length > 0
    ? currentData.reduce((sum, item) => sum + (item.visibility_percentage || 0), 0) / currentData.length
    : 0;
  const criticalCount = currentData.filter(item => item.status === 'CRITICAL').length;

  return (
    <div className="h-full flex flex-col p-4">
      {avgVisibility < 30 && (
        <div className="mb-3 bg-black border border-purple-500/50 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-purple-400 animate-pulse" />
            <span className="text-purple-400 font-bold text-sm">CRITICAL:</span>
            <span className="text-white text-sm">
              {selectedView === 'bu' ? 'Business unit' : 'CIO'} visibility at {avgVisibility.toFixed(1)}% - {criticalCount} critical {selectedView === 'bu' ? 'units' : 'leaders'}
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 grid grid-cols-12 gap-4">
        {/* 3D Hierarchy */}
        <div className="col-span-7">
          <div className="h-full glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-cyan-400">ORGANIZATIONAL VISIBILITY</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedView('bu')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1 ${
                    selectedView === 'bu'
                      ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-400'
                      : 'bg-gray-900/50 border border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  <Building className="w-3 h-3" />
                  BUSINESS UNITS
                </button>
                <button
                  onClick={() => setSelectedView('cio')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1 ${
                    selectedView === 'cio'
                      ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-400'
                      : 'bg-gray-900/50 border border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  <Users className="w-3 h-3" />
                  CIO
                </button>
              </div>
            </div>
            
            <div ref={hierarchyRef} className="w-full" style={{ height: 'calc(100% - 40px)' }} />
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-5 space-y-3">
          {/* Summary Stats */}
          <div className="glass-panel rounded-xl p-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-3xl font-bold">
                  <span className={avgVisibility < 30 ? 'text-purple-400' : avgVisibility < 60 ? 'text-yellow-400' : 'text-cyan-400'}>
                    {avgVisibility.toFixed(1)}%
                  </span>
                </div>
                <div className="text-xs text-gray-400 uppercase">Avg Coverage</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">
                  {currentData.length}
                </div>
                <div className="text-xs text-gray-400 uppercase">Total {selectedView === 'bu' ? 'Units' : 'CIOs'}</div>
              </div>
            </div>
          </div>

          {/* Visibility Flow */}
          <div className="glass-panel rounded-xl p-3">
            <h3 className="text-sm font-bold text-purple-400 mb-2">VISIBILITY FLOW</h3>
            <canvas ref={sankeyRef} className="w-full h-32" />
          </div>

          {/* Bubble Chart */}
          <div className="glass-panel rounded-xl p-3">
            <h3 className="text-sm font-bold text-cyan-400 mb-2">RELATIVE SCALE</h3>
            <canvas ref={bubbleRef} className="w-full h-32" />
          </div>

          {/* Detail Cards */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {currentData.slice(0, 10).map((item, index) => {
              const name = item.business_unit || item.cio || 'Unknown';
              
              return (
                <div
                  key={`${selectedView}-${index}`}
                  className={`glass-panel rounded-lg p-2.5 cursor-pointer transition-all hover:scale-102 ${
                    selectedItem === name ? 'border-cyan-400' : ''
                  }`}
                  onClick={() => setSelectedItem(name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-xs font-bold text-white truncate max-w-[180px]">
                        {name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {item.total_hosts?.toLocaleString() || 0} hosts ({item.percentage?.toFixed(1)}% of total)
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-bold ${
                        item.status === 'CRITICAL' ? 'text-purple-400' :
                        item.status === 'WARNING' ? 'text-yellow-400' :
                        'text-cyan-400'
                      }`}>
                        {item.visibility_percentage?.toFixed(1) || '0.0'}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2 h-2 bg-black/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${item.visibility_percentage || 0}%`,
                        background: item.status === 'CRITICAL' 
                          ? 'linear-gradient(90deg, #a855f7, #ff00ff)'
                          : 'linear-gradient(90deg, #00d4ff, #0099ff)'
                      }}
                    />
                  </div>
                  
                  <div className="mt-1 flex justify-between items-center">
                    <span className="text-xs text-cyan-400">
                      <Eye className="w-3 h-3 inline mr-1" />
                      {item.visible_hosts?.toLocaleString() || 0}
                    </span>
                    <span className={`text-xs font-bold ${
                      item.status === 'CRITICAL' ? 'text-purple-400' :
                      item.status === 'WARNING' ? 'text-yellow-400' :
                      'text-cyan-400'
                    }`}>
                      {item.status || 'UNKNOWN'}
                    </span>
                  </div>

                  {/* Additional info for selected item */}
                  {selectedItem === name && (
                    <div className="mt-2 pt-2 border-t border-white/10 text-xs">
                      {selectedView === 'bu' ? (
                        <div>
                          <div className="text-gray-400">Regions: {(item.regions || []).slice(0, 3).join(', ') || 'None'}</div>
                          <div className="text-gray-400">CMDB: {item.cmdb_coverage?.toFixed(1) || '0.0'}%</div>
                          <div className="text-gray-400">Tanium: {item.tanium_coverage?.toFixed(1) || '0.0'}%</div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-gray-400">Tier: {item.leadership_tier}</div>
                          <div className="text-gray-400">Span of Control: {item.span_of_control}</div>
                          <div className="text-gray-400">BUs: {(item.business_units || []).slice(0, 2).join(', ') || 'None'}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Risk Assessment (BU View only) */}
          {selectedView === 'bu' && businessData?.risk_assessment?.high_risk_units?.length > 0 && (
            <div className="glass-panel rounded-xl p-3 border border-red-500/30">
              <h3 className="text-sm font-bold text-red-400 mb-2">HIGH RISK UNITS</h3>
              <div className="text-xs space-y-1">
                {businessData.risk_assessment.high_risk_units.slice(0, 3).map((unit, idx) => (
                  <div key={idx} className="text-white">• {unit}</div>
                ))}
                <div className="text-red-400 mt-2">
                  {businessData.risk_assessment.assets_at_risk?.toLocaleString() || 0} assets at risk
                </div>
              </div>
            </div>
          )}

          {/* Governance Analytics (CIO View only) */}
          {selectedView === 'cio' && cioData?.governance_analytics && (
            <div className="glass-panel rounded-xl p-3">
              <h3 className="text-sm font-bold text-cyan-400 mb-2">GOVERNANCE METRICS</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-gray-400">Executives</div>
                  <div className="text-lg font-bold text-white">
                    {cioData.governance_analytics.governance_distribution?.executive_leaders || 0}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">Avg Portfolio</div>
                  <div className="text-lg font-bold text-cyan-400">
                    {cioData.governance_analytics.average_portfolio_size?.toLocaleString() || 0}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BUandApplicationView;