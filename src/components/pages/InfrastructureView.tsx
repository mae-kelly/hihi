import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Server, Cloud, Database, Monitor, AlertTriangle, Eye, Activity, Cpu, Layers, Network, HardDrive, Zap, X, ChevronRight } from 'lucide-react';

const InfrastructureView = () => {
  const [infrastructureData, setInfrastructureData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState(null);
  const [hoveredInfra, setHoveredInfra] = useState(null);
  const [detailPanel, setDetailPanel] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const stackRef = useRef(null);
  const treemapRef = useRef(null);
  const networkRef = useRef(null);
  const [viewAngle, setViewAngle] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const layersRef = useRef([]);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/infrastructure_type_metrics');
        if (!response.ok) throw new Error('Failed to fetch infrastructure data');
        const data = await response.json();
        setInfrastructureData(data);
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

  const searchInfrastructureHosts = async (infraType) => {
    try {
      const response = await fetch(`http://localhost:5000/api/host_search?q=${infraType}`);
      const data = await response.json();
      setSearchResults(data);
      return data;
    } catch (error) {
      console.error('Search error:', error);
      return null;
    }
  };

  // 3D Layered Stack - Infrastructure types are LAYERS, not random shapes
  useEffect(() => {
    if (!stackRef.current || !infrastructureData || loading) return;

    if (rendererRef.current) {
      rendererRef.current.dispose();
      if (stackRef.current.contains(rendererRef.current.domElement)) {
        stackRef.current.removeChild(rendererRef.current.domElement);
      }
    }

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x000000, 0.002);
    
    const camera = new THREE.PerspectiveCamera(
      60, 
      stackRef.current.clientWidth / stackRef.current.clientHeight, 
      0.1, 
      1000
    );
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    rendererRef.current = renderer;
    
    renderer.setSize(stackRef.current.clientWidth, stackRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    stackRef.current.appendChild(renderer.domElement);

    const infrastructureTypes = infrastructureData.detailed_data || [];
    const maxHosts = Math.max(...infrastructureTypes.map((t) => t.frequency), 1);
    
    layersRef.current = [];
    
    // Create stacked layers - each infrastructure type is a layer in the stack
    infrastructureTypes.slice(0, 15).forEach((infra, index) => {
      const layerGroup = new THREE.Group();
      
      // Layer dimensions based on data
      const width = 100 + (infra.frequency / maxHosts) * 50;
      const depth = 80 + (infra.frequency / maxHosts) * 40;
      const height = 8;
      const yPosition = index * 12 - (Math.min(infrastructureTypes.length, 15) * 6);
      
      // Main layer platform
      const layerGeometry = new THREE.BoxGeometry(width, height, depth);
      const layerMaterial = new THREE.MeshPhongMaterial({
        color: infra.threat_level === 'CRITICAL' ? 0xa855f7 :
               infra.threat_level === 'HIGH' ? 0xc084fc :
               infra.threat_level === 'MEDIUM' ? 0xffaa00 : 0x00d4ff,
        transparent: true,
        opacity: 0.7,
        emissive: infra.threat_level === 'CRITICAL' ? 0xa855f7 : 0x00d4ff,
        emissiveIntensity: 0.1
      });
      
      const layer = new THREE.Mesh(layerGeometry, layerMaterial);
      layer.position.y = yPosition;
      layer.castShadow = true;
      layer.receiveShadow = true;
      layer.userData = infra;
      layerGroup.add(layer);
      layersRef.current.push(layer);
      
      // Visible portion (coverage indicator)
      const visibleWidth = width * (infra.percentage / 100);
      const visibleGeometry = new THREE.BoxGeometry(visibleWidth, height + 1, depth + 1);
      const visibleMaterial = new THREE.MeshPhongMaterial({
        color: 0x00d4ff,
        emissive: 0x00d4ff,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.9
      });
      
      const visibleMesh = new THREE.Mesh(visibleGeometry, visibleMaterial);
      visibleMesh.position.set(-(width - visibleWidth) / 2, yPosition, 0);
      layerGroup.add(visibleMesh);
      
      // Edge glow effect
      const edgeGeometry = new THREE.BoxGeometry(width + 2, height + 0.5, depth + 2);
      const edgeMaterial = new THREE.MeshBasicMaterial({
        color: infra.threat_level === 'CRITICAL' ? 0xa855f7 : 0x00d4ff,
        transparent: true,
        opacity: 0.2,
        wireframe: true
      });
      const edgeMesh = new THREE.Mesh(edgeGeometry, edgeMaterial);
      edgeMesh.position.y = yPosition;
      layerGroup.add(edgeMesh);
      
      // Data flow particles on each layer
      const particleCount = Math.floor(infra.frequency / 100);
      if (particleCount > 0) {
        const particlesGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i += 3) {
          positions[i] = (Math.random() - 0.5) * width;
          positions[i + 1] = yPosition + height;
          positions[i + 2] = (Math.random() - 0.5) * depth;
        }
        
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particlesMaterial = new THREE.PointsMaterial({
          color: 0x00d4ff,
          size: 2,
          transparent: true,
          opacity: 0.6,
          blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(particlesGeometry, particlesMaterial);
        particles.userData = { isParticles: true };
        layerGroup.add(particles);
      }
      
      scene.add(layerGroup);
    });

    // Add connection beams between layers
    for (let i = 0; i < layersRef.current.length - 1; i++) {
      const layer1 = layersRef.current[i];
      const layer2 = layersRef.current[i + 1];
      
      const connectionGeometry = new THREE.CylinderGeometry(0.5, 0.5, 
        Math.abs(layer2.position.y - layer1.position.y), 8);
      const connectionMaterial = new THREE.MeshBasicMaterial({
        color: 0x00d4ff,
        transparent: true,
        opacity: 0.3
      });
      
      const connection = new THREE.Mesh(connectionGeometry, connectionMaterial);
      connection.position.y = (layer1.position.y + layer2.position.y) / 2;
      scene.add(connection);
    }

    // Grid base
    const gridHelper = new THREE.GridHelper(200, 20, 0x00d4ff, 0x00d4ff);
    gridHelper.material.opacity = 0.1;
    gridHelper.material.transparent = true;
    gridHelper.position.y = -100;
    scene.add(gridHelper);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const spotLight1 = new THREE.SpotLight(0x00d4ff, 1);
    spotLight1.position.set(100, 200, 100);
    spotLight1.castShadow = true;
    scene.add(spotLight1);
    
    const spotLight2 = new THREE.SpotLight(0xa855f7, 0.5);
    spotLight2.position.set(-100, 200, -100);
    scene.add(spotLight2);

    camera.position.set(150, 100, 150);
    camera.lookAt(0, 0, 0);

    // Mouse interactions
    const handleMouseMove = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(layersRef.current);
      
      layersRef.current.forEach(layer => {
        layer.scale.setScalar(1);
      });
      
      if (intersects.length > 0) {
        const hoveredLayer = intersects[0].object;
        hoveredLayer.scale.setScalar(1.05);
        setHoveredInfra(hoveredLayer.userData);
        document.body.style.cursor = 'pointer';
      } else {
        setHoveredInfra(null);
        document.body.style.cursor = 'default';
      }
    };

    const handleClick = async (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(layersRef.current);
      
      if (intersects.length > 0) {
        const clickedLayer = intersects[0].object;
        const infraData = clickedLayer.userData;
        await searchInfrastructureHosts(infraData.type);
        setSelectedType(infraData);
        setDetailPanel(true);
      }
    };

    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('click', handleClick);

    // Animation
    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      // Animate layers
      layersRef.current.forEach((layer, index) => {
        // Subtle floating animation
        layer.position.x = Math.sin(Date.now() * 0.0005 + index) * 2;
        
        // Rotate particles
        layer.parent.children.forEach(child => {
          if (child.userData?.isParticles) {
            child.rotation.y += 0.005;
          }
        });
      });
      
      const time = Date.now() * 0.0005;
      camera.position.x = Math.sin(time + viewAngle.y) * 200 * zoom;
      camera.position.z = Math.cos(time + viewAngle.y) * 200 * zoom;
      camera.position.y = 100 + viewAngle.x * 50;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('click', handleClick);
      if (stackRef.current && renderer.domElement) {
        stackRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [infrastructureData, viewAngle, zoom, loading]);

  // Interactive Treemap for Infrastructure Distribution
  useEffect(() => {
    const canvas = treemapRef.current;
    if (!canvas || !infrastructureData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const drawTreemap = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const data = infrastructureData.detailed_data?.slice(0, 10) || [];
      const total = data.reduce((sum, item) => sum + item.frequency, 0);
      
      let currentX = 0;
      let currentY = 0;
      let rowHeight = canvas.height;
      let rowWidth = canvas.width;
      let rowTotal = 0;
      let rowItems = [];

      data.forEach((item, index) => {
        const area = (item.frequency / total) * canvas.width * canvas.height;
        const width = Math.sqrt(area * (canvas.width / canvas.height));
        const height = area / width;

        // Draw rectangle with gradient
        const gradient = ctx.createLinearGradient(currentX, currentY, currentX + width, currentY + height);
        
        if (item.threat_level === 'CRITICAL') {
          gradient.addColorStop(0, 'rgba(168, 85, 247, 0.8)');
          gradient.addColorStop(1, 'rgba(168, 85, 247, 0.4)');
        } else if (item.threat_level === 'HIGH') {
          gradient.addColorStop(0, 'rgba(192, 132, 252, 0.8)');
          gradient.addColorStop(1, 'rgba(192, 132, 252, 0.4)');
        } else {
          gradient.addColorStop(0, 'rgba(0, 212, 255, 0.8)');
          gradient.addColorStop(1, 'rgba(0, 212, 255, 0.4)');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(currentX + 1, currentY + 1, width - 2, height - 2);

        // Draw border
        ctx.strokeStyle = item.threat_level === 'CRITICAL' ? '#a855f7' : '#00d4ff';
        ctx.lineWidth = 1;
        ctx.strokeRect(currentX, currentY, width, height);

        // Draw text if space allows
        if (width > 50 && height > 30) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Infrastructure type name
          const name = item.type.length > 15 ? item.type.substring(0, 15) + '...' : item.type;
          ctx.fillText(name, currentX + width / 2, currentY + height / 2 - 10);
          
          // Percentage
          ctx.font = 'bold 14px monospace';
          ctx.fillStyle = item.threat_level === 'CRITICAL' ? '#a855f7' : '#00d4ff';
          ctx.fillText(`${item.percentage.toFixed(1)}%`, currentX + width / 2, currentY + height / 2 + 10);
        }

        // Update position for next rectangle
        currentX += width;
        if (currentX >= canvas.width - 10) {
          currentX = 0;
          currentY += rowHeight;
          rowHeight = canvas.height - currentY;
        }
      });
    };

    const handleCanvasClick = (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Determine which section was clicked
      // (simplified - would need proper treemap click detection)
      const data = infrastructureData.detailed_data?.slice(0, 10) || [];
      if (data.length > 0) {
        const clickedIndex = Math.floor((y / canvas.height) * Math.min(data.length, 3));
        if (data[clickedIndex]) {
          setSelectedType(data[clickedIndex]);
          searchInfrastructureHosts(data[clickedIndex].type);
          setDetailPanel(true);
        }
      }
    };

    canvas.addEventListener('click', handleCanvasClick);
    drawTreemap();

    return () => {
      canvas.removeEventListener('click', handleCanvasClick);
    };
  }, [infrastructureData]);

  // Network Graph for Infrastructure Relationships
  useEffect(() => {
    const canvas = networkRef.current;
    if (!canvas || !infrastructureData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const nodes = [];
    const connections = [];
    
    // Create nodes for each infrastructure type
    infrastructureData.detailed_data?.slice(0, 8).forEach((infra, index) => {
      const angle = (index / 8) * Math.PI * 2;
      const radius = 80;
      nodes.push({
        x: canvas.width / 2 + Math.cos(angle) * radius,
        y: canvas.height / 2 + Math.sin(angle) * radius,
        radius: Math.max(10, Math.min(30, Math.sqrt(infra.frequency / 100))),
        data: infra,
        vx: 0,
        vy: 0
      });
    });

    // Create connections based on threat level similarity
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].data.threat_level === nodes[j].data.threat_level) {
          connections.push({ from: i, to: j });
        }
      }
    }

    let animationId;
    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
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
      });

      // Draw and update nodes
      nodes.forEach((node, index) => {
        // Apply force to center
        const dx = canvas.width / 2 - node.x;
        const dy = canvas.height / 2 - node.y;
        node.vx += dx * 0.001;
        node.vy += dy * 0.001;
        
        // Apply repulsion between nodes
        nodes.forEach((other, j) => {
          if (index !== j) {
            const dx = node.x - other.x;
            const dy = node.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100) {
              node.vx += (dx / dist) * 2;
              node.vy += (dy / dist) * 2;
            }
          }
        });
        
        // Apply velocity with damping
        node.vx *= 0.9;
        node.vy *= 0.9;
        node.x += node.vx;
        node.y += node.vy;
        
        // Keep within bounds
        node.x = Math.max(node.radius, Math.min(canvas.width - node.radius, node.x));
        node.y = Math.max(node.radius, Math.min(canvas.height - node.radius, node.y));
        
        // Draw node
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius);
        
        if (node.data.threat_level === 'CRITICAL') {
          gradient.addColorStop(0, 'rgba(168, 85, 247, 1)');
          gradient.addColorStop(1, 'rgba(168, 85, 247, 0.3)');
        } else {
          gradient.addColorStop(0, 'rgba(0, 212, 255, 1)');
          gradient.addColorStop(1, 'rgba(0, 212, 255, 0.3)');
        }
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw label
        if (node.radius > 15) {
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(node.data.type.substring(0, 10), node.x, node.y);
        }
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [infrastructureData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
          <div className="mt-4 text-lg font-bold text-cyan-400">ANALYZING INFRASTRUCTURE LAYERS</div>
        </div>
      </div>
    );
  }

  if (!infrastructureData) return null;

  const criticalInfra = infrastructureData.detailed_data?.filter(item => item.threat_level === 'CRITICAL') || [];
  const modernizationPercentage = infrastructureData.modernization_analysis?.modernization_percentage || 0;

  return (
    <div className="h-full bg-black p-4">
      {criticalInfra.length > 0 && (
        <div className="mb-3 bg-black border border-purple-500/50 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-purple-400 animate-pulse" />
            <span className="text-purple-400 font-bold text-sm">CRITICAL:</span>
            <span className="text-white text-sm">
              {criticalInfra.length} infrastructure layers at critical risk level
            </span>
          </div>
        </div>
      )}

      <div className="h-full grid grid-cols-12 gap-4">
        {/* 3D Layered Stack */}
        <div className="col-span-7">
          <div className="h-full bg-black/80 border border-white/10 rounded-xl p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-cyan-400" />
                  INFRASTRUCTURE STACK VISUALIZATION
                </h3>
                <div className="text-xs text-gray-400">
                  Click layers to drill down • Each layer represents an infrastructure type
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
                  className="px-3 py-1 bg-white/5 border border-white/20 rounded text-cyan-400 hover:bg-white/10 text-xs"
                >
                  ZOOM IN
                </button>
                <button 
                  onClick={() => setZoom(prev => Math.min(2, prev + 0.1))}
                  className="px-3 py-1 bg-white/5 border border-white/20 rounded text-cyan-400 hover:bg-white/10 text-xs"
                >
                  ZOOM OUT
                </button>
              </div>
            </div>
            
            <div ref={stackRef} className="w-full" style={{ height: 'calc(100% - 60px)' }} />
            
            {hoveredInfra && (
              <div className="absolute bottom-4 left-4 bg-black/90 border border-cyan-400/50 rounded-lg p-3 backdrop-blur-xl">
                <div className="text-sm font-bold text-cyan-400">{hoveredInfra.type}</div>
                <div className="text-xs text-white/80 mt-1">
                  <div>Instances: {hoveredInfra.frequency?.toLocaleString()}</div>
                  <div>Coverage: {hoveredInfra.percentage?.toFixed(1)}%</div>
                  <div>Risk: {hoveredInfra.threat_level}</div>
                  <div className="text-cyan-400 mt-1">Click to explore →</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Multiple Visualization Types */}
        <div className="col-span-5 space-y-3">
          {/* Modernization Score */}
          <div className="bg-black/80 border border-white/10 rounded-xl p-4 backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-2">
              <Cloud className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white/60">MODERNIZATION ANALYSIS</h3>
            </div>
            <div className="text-3xl font-bold mb-2">
              <span className={modernizationPercentage < 30 ? 'text-pink-400' : modernizationPercentage < 60 ? 'text-yellow-400' : 'text-cyan-400'}>
                {modernizationPercentage.toFixed(1)}%
              </span>
            </div>
            
            <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
              <div 
                className="h-full transition-all duration-1000"
                style={{
                  width: `${modernizationPercentage}%`,
                  background: modernizationPercentage < 30 
                    ? 'linear-gradient(90deg, #ff00ff, #ff00ff)'
                    : modernizationPercentage < 60
                    ? 'linear-gradient(90deg, #ffaa00, #ff8800)'
                    : 'linear-gradient(90deg, #00d4ff, #00d4ff)'
                }}
              />
            </div>
          </div>

          {/* Interactive Treemap */}
          <div className="bg-black/80 border border-white/10 rounded-xl p-3 backdrop-blur-xl">
            <h3 className="text-sm font-bold text-white/60 mb-2">INFRASTRUCTURE DISTRIBUTION TREEMAP</h3>
            <canvas ref={treemapRef} className="w-full h-40 cursor-pointer" />
            <div className="text-xs text-gray-400 mt-2">Click sections to explore infrastructure types</div>
          </div>

          {/* Network Graph */}
          <div className="bg-black/80 border border-white/10 rounded-xl p-3 backdrop-blur-xl">
            <h3 className="text-sm font-bold text-white/60 mb-2">THREAT LEVEL NETWORK</h3>
            <canvas ref={networkRef} className="w-full h-40" />
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {detailPanel && selectedType && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-6">
          <div className="bg-black border-2 border-cyan-400/50 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-cyan-400/30 flex items-center justify-between">
              <h2 className="text-xl font-bold text-cyan-400">
                {selectedType.type?.toUpperCase()} INFRASTRUCTURE ANALYSIS
              </h2>
              <button 
                onClick={() => {
                  setDetailPanel(false);
                  setSelectedType(null);
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
                  <div className="text-2xl font-bold text-white">{selectedType.frequency?.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">Total Instances</div>
                </div>
                <div className="bg-black/50 border border-cyan-400/30 rounded-lg p-4">
                  <div className="text-2xl font-bold text-cyan-400">{selectedType.percentage?.toFixed(1)}%</div>
                  <div className="text-xs text-gray-400">Infrastructure Share</div>
                </div>
                <div className="bg-black/50 border border-purple-400/30 rounded-lg p-4">
                  <div className={`text-2xl font-bold ${
                    selectedType.threat_level === 'CRITICAL' ? 'text-purple-400' :
                    selectedType.threat_level === 'HIGH' ? 'text-purple-400' :
                    'text-yellow-400'
                  }`}>
                    {selectedType.threat_level}
                  </div>
                  <div className="text-xs text-gray-400">Threat Level</div>
                </div>
              </div>

              {searchResults && searchResults.hosts && (
                <div className="mt-6">
                  <h3 className="text-lg font-bold text-cyan-400 mb-3">SAMPLE HOSTS</h3>
                  <div className="bg-black/50 border border-cyan-400/30 rounded-lg overflow-hidden">
                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-black/70 sticky top-0">
                          <tr className="border-b border-cyan-400/30">
                            <th className="text-left p-2 text-cyan-400">Host</th>
                            <th className="text-left p-2 text-cyan-400">Region</th>
                            <th className="text-left p-2 text-cyan-400">BU</th>
                            <th className="text-left p-2 text-cyan-400">CMDB</th>
                            <th className="text-left p-2 text-cyan-400">Tanium</th>
                          </tr>
                        </thead>
                        <tbody>
                          {searchResults.hosts.slice(0, 20).map((host, idx) => (
                            <tr key={idx} className="border-b border-gray-800 hover:bg-cyan-400/5">
                              <td className="p-2 text-white font-mono">{host.host}</td>
                              <td className="p-2 text-gray-400">{host.region}</td>
                              <td className="p-2 text-gray-400">{host.business_unit}</td>
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

export default InfrastructureView;