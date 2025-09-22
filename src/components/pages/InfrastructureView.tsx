import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

const InfrastructureView = () => {
  const [infrastructureData, setInfrastructureData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState(null);
  const [hoveredInfra, setHoveredInfra] = useState(null);
  const stackRef = useRef(null);
  const [viewAngle, setViewAngle] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/infrastructure_visibility');
        if (!response.ok) throw new Error('Failed to fetch');
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

  useEffect(() => {
    if (!stackRef.current || !infrastructureData) return;

    const scene = new THREE.Scene();
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
    
    renderer.setSize(stackRef.current.clientWidth, stackRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    stackRef.current.appendChild(renderer.domElement);

    const infrastructureTypes = infrastructureData.detailed_breakdown || [];
    const maxHosts = Math.max(...infrastructureTypes.map(t => t.total_hosts));
    
    const layers = [];
    const clickableObjects = [];
    
    infrastructureTypes.forEach((infra, index) => {
      const layerGroup = new THREE.Group();
      
      const radius = 40 + (infra.total_hosts / maxHosts) * 40;
      const height = 15;
      const yPosition = index * 25 - (infrastructureTypes.length * 12.5);
      
      const ringGeometry = new THREE.TorusGeometry(radius, height/2, 8, 32);
      const ringMaterial = new THREE.MeshPhongMaterial({
        color: infra.status === 'CRITICAL' ? 0xff00ff :
               infra.status === 'WARNING' ? 0xc084fc : 0x00d4ff,
        transparent: true,
        opacity: 0.3,
        emissive: infra.status === 'CRITICAL' ? 0xff00ff : 0x00d4ff,
        emissiveIntensity: 0.1
      });
      
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = yPosition;
      ring.castShadow = true;
      ring.receiveShadow = true;
      layerGroup.add(ring);
      
      const visibleAngle = (infra.visibility_percentage / 100) * Math.PI * 2;
      const visibleShape = new THREE.Shape();
      visibleShape.moveTo(0, 0);
      visibleShape.arc(0, 0, radius, 0, visibleAngle, false);
      visibleShape.lineTo(0, 0);
      
      const visibleGeometry = new THREE.ExtrudeGeometry(visibleShape, {
        depth: height,
        bevelEnabled: true,
        bevelThickness: 2,
        bevelSize: 1,
        bevelSegments: 2
      });
      
      const visibleMaterial = new THREE.MeshPhongMaterial({
        color: 0x00d4ff,
        emissive: 0x00d4ff,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.8
      });
      
      const visibleMesh = new THREE.Mesh(visibleGeometry, visibleMaterial);
      visibleMesh.rotation.x = -Math.PI / 2;
      visibleMesh.position.y = yPosition;
      visibleMesh.castShadow = true;
      visibleMesh.userData = infra;
      layerGroup.add(visibleMesh);
      clickableObjects.push(visibleMesh);
      
      const particleCount = Math.floor(infra.invisible_hosts / 100);
      const particlesGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      
      for (let i = 0; i < particleCount * 3; i += 3) {
        const angle = Math.random() * Math.PI * 2;
        const r = radius + Math.random() * 20;
        positions[i] = Math.cos(angle) * r;
        positions[i + 1] = yPosition + (Math.random() - 0.5) * height;
        positions[i + 2] = Math.sin(angle) * r;
      }
      
      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const particlesMaterial = new THREE.PointsMaterial({
        color: 0xff00ff,
        size: 2,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
      });
      
      const particles = new THREE.Points(particlesGeometry, particlesMaterial);
      layerGroup.add(particles);
      
      layerGroup.userData = infra;
      layers.push(layerGroup);
      scene.add(layerGroup);
    });

    const gridHelper = new THREE.GridHelper(200, 20, 0x00d4ff, 0x00d4ff);
    gridHelper.material.opacity = 0.1;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const spotLight1 = new THREE.SpotLight(0x00d4ff, 1);
    spotLight1.position.set(100, 200, 100);
    spotLight1.castShadow = true;
    scene.add(spotLight1);
    
    const spotLight2 = new THREE.SpotLight(0xff00ff, 0.5);
    spotLight2.position.set(-100, 200, -100);
    scene.add(spotLight2);

    camera.position.set(150, 100, 150);
    camera.lookAt(0, 0, 0);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(clickableObjects);
      
      if (intersects.length > 0) {
        setSelectedType(intersects[0].object.userData);
      }
    };

    const handleMouseMove = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(clickableObjects);
      
      if (intersects.length > 0) {
        setHoveredInfra(intersects[0].object.userData);
        document.body.style.cursor = 'pointer';
      } else {
        setHoveredInfra(null);
        document.body.style.cursor = 'default';
      }
    };

    renderer.domElement.addEventListener('click', handleClick);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);

    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      layers.forEach((layer, index) => {
        layer.rotation.y += 0.002 * (index % 2 === 0 ? 1 : -1);
        layer.children.forEach(child => {
          if (child.type === 'Points') {
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
      renderer.domElement.removeEventListener('click', handleClick);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      if (stackRef.current && renderer.domElement) {
        stackRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [infrastructureData, viewAngle, zoom]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
          <div className="mt-4 text-lg font-bold text-cyan-400">SCANNING INFRASTRUCTURE</div>
        </div>
      </div>
    );
  }

  if (!infrastructureData) return null;

  return (
    <div className="h-full bg-black p-6">
      <div className="h-full grid grid-cols-12 gap-6">
        <div className="col-span-8">
          <div className="h-full bg-black/80 border border-white/10 rounded-xl p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">INFRASTRUCTURE TOPOLOGY</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
                  className="px-3 py-1 bg-white/5 border border-white/20 rounded text-cyan-400 hover:bg-white/10"
                >
                  ZOOM IN
                </button>
                <button 
                  onClick={() => setZoom(prev => Math.min(2, prev + 0.1))}
                  className="px-3 py-1 bg-white/5 border border-white/20 rounded text-cyan-400 hover:bg-white/10"
                >
                  ZOOM OUT
                </button>
                <button 
                  onClick={() => setViewAngle({ x: 0, y: 0 })}
                  className="px-3 py-1 bg-white/5 border border-white/20 rounded text-cyan-400 hover:bg-white/10"
                >
                  RESET VIEW
                </button>
              </div>
            </div>
            
            <div 
              ref={stackRef} 
              className="w-full"
              style={{ height: 'calc(100% - 80px)' }}
            />
            
            {hoveredInfra && (
              <div className="absolute bottom-8 left-8 bg-black/90 border border-cyan-400/50 rounded-lg p-4 backdrop-blur-xl">
                <div className="text-sm font-bold text-cyan-400">{hoveredInfra.infrastructure_type}</div>
                <div className="text-xs text-white/80 mt-1">
                  <div>Visibility: {hoveredInfra.visibility_percentage.toFixed(1)}%</div>
                  <div>Total: {hoveredInfra.total_hosts.toLocaleString()} hosts</div>
                  <div>Status: {hoveredInfra.status}</div>
                </div>
              </div>
            )}
            
            <div className="mt-2 text-xs text-white/40">
              Click layers for details • Auto-rotating view
            </div>
          </div>
        </div>

        <div className="col-span-4 space-y-4">
          <div className="bg-black/80 border border-white/10 rounded-xl p-6 backdrop-blur-xl">
            <h3 className="text-sm font-bold text-white/60 mb-4">INFRASTRUCTURE METRICS</h3>
            <div className="text-4xl font-bold mb-2">
              <span className={infrastructureData.overall_infrastructure_visibility < 50 ? 'text-pink-400' : 'text-cyan-400'}>
                {infrastructureData.overall_infrastructure_visibility.toFixed(1)}%
              </span>
            </div>
            <div className="text-sm text-white/60 mb-4">OVERALL VISIBILITY</div>
            
            {Object.entries(infrastructureData.category_summary || {}).map(([category, data]) => (
              <div key={category} className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/60">{category.toUpperCase()}</span>
                  <span className="text-white">{data.visibility_percentage.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      data.status === 'CRITICAL' ? 'bg-pink-400' :
                      data.status === 'WARNING' ? 'bg-purple-400' :
                      'bg-cyan-400'
                    }`}
                    style={{ width: `${data.visibility_percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {selectedType && (
            <div className="bg-black/80 border border-cyan-400/30 rounded-xl p-6 backdrop-blur-xl">
              <h3 className="text-sm font-bold text-cyan-400 mb-4">{selectedType.infrastructure_type.toUpperCase()}</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs text-white/60">VISIBILITY</span>
                  <span className="text-sm font-bold text-white">{selectedType.visibility_percentage.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-white/60">TOTAL HOSTS</span>
                  <span className="text-sm font-bold text-white">{selectedType.total_hosts.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-white/60">VISIBLE</span>
                  <span className="text-sm font-bold text-cyan-400">{selectedType.visible_hosts.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-white/60">INVISIBLE</span>
                  <span className="text-sm font-bold text-pink-400">{selectedType.invisible_hosts.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-white/60">STATUS</span>
                  <span className={`text-sm font-bold ${
                    selectedType.status === 'CRITICAL' ? 'text-pink-400' :
                    selectedType.status === 'WARNING' ? 'text-purple-400' :
                    'text-cyan-400'
                  }`}>
                    {selectedType.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          {infrastructureData.critical_gaps && infrastructureData.critical_gaps.length > 0 && (
            <div className="bg-black/80 border border-pink-400/30 rounded-xl p-6 backdrop-blur-xl">
              <h3 className="text-sm font-bold text-pink-400 mb-4">CRITICAL GAPS</h3>
              <div className="space-y-2">
                {infrastructureData.critical_gaps.slice(0, 5).map((gap, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="text-white/60">{gap.infrastructure_type}</span>
                    <span className="text-pink-400 font-bold">{gap.visibility_percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InfrastructureView;