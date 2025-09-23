import React, { useState, useEffect, useRef } from 'react';
import { Building, Users, Eye, AlertTriangle, Activity, Briefcase, Target, Database, Network, Shield, Layers, GitBranch, X, ChevronRight } from 'lucide-react';
import * as THREE from 'three';

const BUandApplicationView = () => {
  const [businessData, setBusinessData] = useState(null);
  const [cioData, setCioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('bu');
  const [selectedItem, setSelectedItem] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [detailPanel, setDetailPanel] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const hierarchyRef = useRef(null);
  const treemapRef = useRef(null);
  const flowRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const frameRef = useRef(null);
  const nodesRef = useRef([]);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

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

        // Process business unit data
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
              tanium_coverage: analytics.tanium_coverage || 0,
              geographic_spread: analytics.geographic_spread || 0,
              infrastructure_diversity: analytics.infrastructure_diversity || 0
            };
          }).sort((a, b) => b.total_hosts - a.total_hosts),
          total_assets: buData.organizational_analytics?.total_assets || 0,
          security_leaders: buData.organizational_analytics?.security_leaders || [],
          vulnerable_units: buData.organizational_analytics?.vulnerable_units || [],
          risk_assessment: buData.organizational_analytics?.risk_assessment || {}
        });

        // Process CIO data
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
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const searchUnitHosts = async (unitName) => {
    try {
      const response = await fetch(`http://localhost:5000/api/host_search?q=${unitName}`);
      const data = await response.json();
      setSearchResults(data);
      return data;
    } catch (error) {
      console.error('Search error:', error);
      return null;
    }
  };

  // 3D Organizational Hierarchy - Tree structure for BU/CIO relationships
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

    nodesRef.current = [];
    const connections = [];
    
    // Get data based on view
    const viewData = selectedView === 'bu' 
      ? businessData.business_unit_breakdown || []
      : cioData.cio_breakdown || [];
    
    const maxHosts = Math.max(...viewData.map(d => d.total_hosts), 1);
    
    // Central organization node
    const coreGeometry = new THREE.OctahedronGeometry(12, 2);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: 0x00d4ff,
      emissive: 0x00d4ff,
      emissiveIntensity: 0.2,
      wireframe: false,
      transparent: true,
      opacity: 0.8
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);
    
    // Create hierarchical levels
    const levels = 3;
    const itemsPerLevel = Math.ceil(viewData.length / levels);
    
    viewData.slice(0, 20).forEach((item, index) => {
      const level = Math.floor(index / itemsPerLevel);
      const levelRadius = 30 + level * 40;
      const angleInLevel = (index % itemsPerLevel) / itemsPerLevel * Math.PI * 2;
      const verticalOffset = (level - 1) * 30;
      
      const x = Math.cos(angleInLevel) * levelRadius;
      const z = Math.sin(angleInLevel) * levelRadius;
      const y = verticalOffset;
      
      const nodeGroup = new THREE.Group();
      
      // Node size based on hosts
      const nodeSize = 4 + (item.total_hosts / maxHosts) * 10;
      
      // Main node sphere
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
      node.userData = item;
      nodesRef.current.push(node);
      nodeGroup.add(node);
      
      // Visibility indicator (inner sphere)
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
      
      // Add organizational rings for structure
      const ringGeometry = new THREE.RingGeometry(nodeSize + 2, nodeSize + 3, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: item.status === 'CRITICAL' ? 0xa855f7 : 0x00d4ff,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.lookAt(camera.position);
      nodeGroup.add(ring);
      
      nodeGroup.position.set(x, y, z);
      scene.add(nodeGroup);
      
      // Connection to core or parent level
      const connectionPoints = level === 0 
        ? [new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, y, z)]
        : [new THREE.Vector3(x * 0.5, (level - 1) * 30, z * 0.5), new THREE.Vector3(x, y, z)];
      
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(connectionPoints);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: item.status === 'CRITICAL' ? 0xa855f7 : 0x00d4ff,
        transparent: true,
        opacity: 0.3
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      connections.push(line);
      scene.add(line);
    });
    
    // Add data flow particles
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
    
    // Mouse interaction
    const handleMouseMove = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(nodesRef.current);
      
      nodesRef.current.forEach(node => {
        node.scale.setScalar(1);
      });
      
      if (intersects.length > 0) {
        const hoveredNode = intersects[0].object;
        hoveredNode.scale.setScalar(1.2);
        setHoveredNode(hoveredNode.userData);
        document.body.style.cursor = 'pointer';
      } else {
        setHoveredNode(null);
        document.body.style.cursor = 'default';
      }
    };

    const handleClick = async (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(nodesRef.current);
      
      if (intersects.length > 0) {
        const clickedNode = intersects[0].object;
        const unitName = clickedNode.userData.business_unit || clickedNode.userData.cio;
        await searchUnitHosts(unitName);
        setSelectedItem(clickedNode.userData);
        setDetailPanel(true);
      }
    };

    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('click', handleClick);
    
    // Animation
    const animate = () => {
      if (!sceneRef.current) return;
      frameRef.current = requestAnimationFrame(animate);
      
      core.rotation.x += 0.005;
      core.rotation.y += 0.005;
      
      particles.rotation.y += 0.001;
      
      const time = Date.now() * 0.0003;
      camera.position.x = Math.sin(time) * 150;
      camera.position.z = Math.cos(time) * 150;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
    };
    
    animate();

    return () => {
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('click', handleClick);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (hierarchyRef.current && hierarchyRef.current.contains(rendererRef.current.domElement)) {
          hierarchyRef.current.removeChild(rendererRef.current.domElement);
        }
      }
    };
  }, [businessData, cioData, selectedView, loading]);

  // Interactive Treemap for BU distribution
  useEffect(() => {
    const canvas = treemapRef.current;
    if (!canvas || !businessData || !cioData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const data = selectedView === 'bu' 
      ? businessData.business_unit_breakdown?.slice(0, 10) || []
      : cioData.cio_breakdown?.slice(0, 10) || [];
    
    const total = data.reduce((sum, item) => sum + item.total_hosts, 1);

    const drawTreemap = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let currentX = 2;
      let currentY = 2;
      let rowHeight = canvas.height - 4;
      
      data.forEach((item, index) => {
        const width = ((item.total_hosts / total) * (canvas.width - 4));
        
        // Draw rectangle with gradient
        const gradient = ctx.createLinearGradient(currentX, currentY, currentX + width, currentY + rowHeight);
        
        if (item.status === 'CRITICAL') {
          gradient.addColorStop(0, 'rgba(168, 85, 247, 0.8)');
          gradient.addColorStop(1, 'rgba(168, 85, 247, 0.3)');
        } else if (item.status === 'WARNING') {
          gradient.addColorStop(0, 'rgba(255, 170, 0, 0.8)');
          gradient.addColorStop(1, 'rgba(255, 170, 0, 0.3)');
        } else {
          gradient.addColorStop(0, 'rgba(0, 212, 255, 0.8)');
          gradient.addColorStop(1, 'rgba(0, 212, 255, 0.3)');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(currentX, currentY, width - 2, rowHeight);

        // Border
        ctx.strokeStyle = item.status === 'CRITICAL' ? '#a855f7' : '#00d4ff';
        ctx.lineWidth = 1;
        ctx.strokeRect(currentX, currentY, width - 2, rowHeight);

        // Text if space allows
        if (width > 40) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          const name = (item.business_unit || item.cio || '').substring(0, Math.floor(width / 8));
          ctx.fillText(name, currentX + width / 2, currentY + rowHeight / 2 - 10);
          
          ctx.font = 'bold 14px monospace';
          ctx.fillStyle = item.status === 'CRITICAL' ? '#a855f7' : '#00d4ff';
          ctx.fillText(`${item.visibility_percentage.toFixed(0)}%`, currentX + width / 2, currentY + rowHeight / 2 + 10);
        }

        currentX += width;
      });
    };

    const handleCanvasClick = (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      
      // Determine which section was clicked
      let currentX = 2;
      const total = data.reduce((sum, item) => sum + item.total_hosts, 1);
      
      for (const item of data) {
        const width = ((item.total_hosts / total) * (canvas.width - 4));
        if (x >= currentX && x < currentX + width) {
          setSelectedItem(item);
          searchUnitHosts(item.business_unit || item.cio);
          setDetailPanel(true);
          break;
        }
        currentX += width;
      }
    };

    canvas.addEventListener('click', handleCanvasClick);
    drawTreemap();

    return () => {
      canvas.removeEventListener('click', handleCanvasClick);
    };
  }, [businessData, cioData, selectedView]);

  // Organization Flow visualization
  useEffect(() => {
    const canvas = flowRef.current;
    if (!canvas || !businessData || !cioData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let animationId;
    let flowOffset = 0;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      flowOffset += 2;
      if (flowOffset > 20) flowOffset = 0;

      const data = selectedView === 'bu' 
        ? businessData.business_unit_breakdown?.slice(0, 5) || []
        : cioData.cio_breakdown?.slice(0, 5) || [];

      data.forEach((item, index) => {
        const y = (index + 1) * (canvas.height / 6);
        const width = (canvas.width - 100) * (item.visibility_percentage / 100);
        
        // Flow effect
        ctx.strokeStyle = item.status === 'CRITICAL' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(0, 212, 255, 0.3)';
        ctx.lineWidth = 20;
        ctx.setLineDash([10, 10]);
        ctx.lineDashOffset = -flowOffset;
        ctx.beginPath();
        ctx.moveTo(50, y);
        ctx.lineTo(50 + width, y);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Labels
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText((item.business_unit || item.cio || '').substring(0, 15), 5, y + 3);
        
        ctx.fillStyle = item.status === 'CRITICAL' ? '#a855f7' : '#00d4ff';
        ctx.textAlign = 'right';
        ctx.fillText(`${item.visibility_percentage.toFixed(1)}%`, canvas.width - 5, y + 3);
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
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
  const avgVisibility = currentData.length > 0
    ? currentData.reduce((sum, item) => sum + (item.visibility_percentage || 0), 0) / currentData.length
    : 0;

  return (
    <div className="h-full flex flex-col p-4">
      {avgVisibility < 30 && (
        <div className="mb-3 bg-black border border-purple-500/50 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-purple-400 animate-pulse" />
            <span className="text-purple-400 font-bold text-sm">CRITICAL:</span>
            <span className="text-white text-sm">
              Organizational visibility at {avgVisibility.toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 grid grid-cols-12 gap-4">
        {/* 3D Hierarchy */}
        <div className="col-span-7">
          <div className="h-full glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-cyan-400">ORGANIZATIONAL HIERARCHY</h2>
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
                  CIO VIEW
                </button>
              </div>
            </div>
            
            <div ref={hierarchyRef} className="w-full" style={{ height: 'calc(100% - 40px)' }} />
            
            {hoveredNode && (
              <div className="absolute bottom-4 left-4 bg-black/95 border border-cyan-400/50 rounded-lg p-3">
                <div className="text-sm font-bold text-cyan-400">
                  {hoveredNode.business_unit || hoveredNode.cio}
                </div>
                <div className="text-xs text-white mt-1">
                  <div>Hosts: {hoveredNode.total_hosts?.toLocaleString()}</div>
                  <div>Coverage: {hoveredNode.visibility_percentage?.toFixed(1)}%</div>
                  <div className="text-cyan-400 mt-1">Click for details →</div>
                </div>
              </div>
            )}
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

          {/* Treemap */}
          <div className="glass-panel rounded-xl p-3">
            <h3 className="text-sm font-bold text-purple-400 mb-2">DISTRIBUTION MAP</h3>
            <canvas ref={treemapRef} className="w-full h-32 cursor-pointer" />
          </div>

          {/* Flow Visualization */}
          <div className="glass-panel rounded-xl p-3">
            <h3 className="text-sm font-bold text-cyan-400 mb-2">VISIBILITY FLOW</h3>
            <canvas ref={flowRef} className="w-full h-32" />
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {detailPanel && selectedItem && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-6">
          <div className="bg-black border-2 border-cyan-400/50 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-cyan-400/30 flex items-center justify-between">
              <h2 className="text-xl font-bold text-cyan-400">
                {(selectedItem.business_unit || selectedItem.cio || '').toUpperCase()} ANALYSIS
              </h2>
              <button 
                onClick={() => {
                  setDetailPanel(false);
                  setSelectedItem(null);
                  setSearchResults(null);
                }}
                className="text-white hover:text-cyan-400 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-black/50 border border-cyan-400/30 rounded-lg p-4">
                  <div className="text-2xl font-bold text-white">{selectedItem.total_hosts?.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">Total Hosts</div>
                </div>
                <div className="bg-black/50 border border-cyan-400/30 rounded-lg p-4">
                  <div className="text-2xl font-bold text-cyan-400">{selectedItem.visibility_percentage?.toFixed(1)}%</div>
                  <div className="text-xs text-gray-400">Visibility Coverage</div>
                </div>
                <div className="bg-black/50 border border-purple-400/30 rounded-lg p-4">
                  <div className={`text-2xl font-bold ${
                    selectedItem.status === 'CRITICAL' ? 'text-purple-400' :
                    selectedItem.status === 'WARNING' ? 'text-yellow-400' :
                    'text-cyan-400'
                  }`}>
                    {selectedItem.status}
                  </div>
                  <div className="text-xs text-gray-400">Security Status</div>
                </div>
              </div>

              {selectedView === 'bu' && selectedItem.regions && (
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-cyan-400 mb-2">GEOGRAPHIC SPREAD</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.regions.slice(0, 10).map((region, idx) => (
                      <span key={idx} className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded text-xs text-cyan-400">
                        {region}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {searchResults && searchResults.hosts && (
                <div className="mt-6">
                  <h3 className="text-lg font-bold text-cyan-400 mb-3">SAMPLE HOSTS</h3>
                  <div className="bg-black/50 border border-cyan-400/30 rounded-lg overflow-hidden">
                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-black/70 sticky top-0">
                          <tr className="border-b border-cyan-400/30">
                            <th className="text-left p-2 text-cyan-400">Host</th>
                            <th className="text-left p-2 text-cyan-400">Infrastructure</th>
                            <th className="text-left p-2 text-cyan-400">Region</th>
                            <th className="text-center p-2 text-cyan-400">CMDB</th>
                            <th className="text-center p-2 text-cyan-400">Tanium</th>
                          </tr>
                        </thead>
                        <tbody>
                          {searchResults.hosts.slice(0, 20).map((host, idx) => (
                            <tr key={idx} className="border-b border-gray-800 hover:bg-cyan-400/5">
                              <td className="p-2 text-white font-mono">{host.host}</td>
                              <td className="p-2 text-gray-400">{host.infrastructure_type}</td>
                              <td className="p-2 text-gray-400">{host.region}</td>
                              <td className="p-2 text-center">
                                {host.present_in_cmdb?.toLowerCase().includes('yes') ? 
                                  <span className="text-cyan-400">✓</span> : 
                                  <span className="text-purple-400">✗</span>}
                              </td>
                              <td className="p-2 text-center">
                                {host.tanium_coverage?.toLowerCase().includes('tanium') ? 
                                  <span className="text-cyan-400">✓</span> : 
                                  <span className="text-purple-400">✗</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BUandApplicationView;