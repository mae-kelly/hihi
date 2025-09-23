import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Server, Cloud, Database, Monitor, AlertTriangle, Eye, Activity } from 'lucide-react';

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
        const response = await fetch('http://localhost:5000/api/infrastructure_type_metrics');
        if (!response.ok) throw new Error('Failed to fetch infrastructure data');
        const data = await response.json();
        setInfrastructureData(data);
      } catch (error) {
        console.error('Error:', error);
        setInfrastructureData({
          infrastructure_matrix: {},
          detailed_data: [],
          regional_analysis: {},
          business_unit_analysis: {},
          total_types: 0,
          modernization_analysis: {
            modernization_score: 0,
            modernization_percentage: 0,
            legacy_systems: 0,
            cloud_adoption: 0
          },
          distribution: {
            top_5: [],
            total_instances: 0,
            diversity_score: 0,
            concentration_risk: 0
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!stackRef.current || !infrastructureData || loading) return;

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

    const infrastructureTypes = infrastructureData.detailed_data || [];
    const maxHosts = Math.max(...infrastructureTypes.map((t) => t.frequency), 1);
    
    const layers = [];
    const clickableObjects = [];
    
    infrastructureTypes.slice(0, 15).forEach((infra, index) => {
      const layerGroup = new THREE.Group();
      
      // Calculate size based on frequency (number of hosts)
      const radius = 20 + (infra.frequency / maxHosts) * 60;
      const height = 8 + (infra.percentage / 10) * 5;
      const yPosition = index * 20 - (Math.min(infrastructureTypes.length, 15) * 10);
      
      // Main infrastructure ring
      const ringGeometry = new THREE.TorusGeometry(radius, height/2, 8, 32);
      const ringMaterial = new THREE.MeshPhongMaterial({
        color: infra.threat_level === 'CRITICAL' ? 0xff00ff :
               infra.threat_level === 'HIGH' ? 0xc084fc :
               infra.threat_level === 'MEDIUM' ? 0xffaa00 : 0x00d4ff,
        transparent: true,
        opacity: 0.4,
        emissive: infra.threat_level === 'CRITICAL' ? 0xff00ff : 0x00d4ff,
        emissiveIntensity: 0.1
      });
      
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = yPosition;
      ring.castShadow = true;
      ring.receiveShadow = true;
      layerGroup.add(ring);
      
      // Visible portion (inner filled area) - represents percentage
      const visibleRadius = radius * (infra.percentage / 100);
      const visibleGeometry = new THREE.CylinderGeometry(visibleRadius, visibleRadius, height, 32);
      
      const visibleMaterial = new THREE.MeshPhongMaterial({
        color: 0x00d4ff,
        emissive: 0x00d4ff,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.8
      });
      
      const visibleMesh = new THREE.Mesh(visibleGeometry, visibleMaterial);
      visibleMesh.position.y = yPosition;
      visibleMesh.castShadow = true;
      visibleMesh.userData = infra;
      layerGroup.add(visibleMesh);
      clickableObjects.push(visibleMesh);
      
      // Add floating particles for invisible hosts (gaps)
      const invisiblePercentage = 100 - infra.percentage;
      if (invisiblePercentage > 0) {
        const particleCount = Math.min(Math.floor(invisiblePercentage / 2), 50);
        const particlesGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i += 3) {
          const angle = Math.random() * Math.PI * 2;
          const r = radius + Math.random() * 30;
          positions[i] = Math.cos(angle) * r;
          positions[i + 1] = yPosition + (Math.random() - 0.5) * height * 2;
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
        particles.userData = { isParticles: true };
        layerGroup.add(particles);
      }
      
      layerGroup.userData = infra;
      layers.push(layerGroup);
      scene.add(layerGroup);
    });

    // Add grid helper for reference
    const gridHelper = new THREE.GridHelper(200, 20, 0x00d4ff, 0x00d4ff);
    gridHelper.material.opacity = 0.1;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // Lighting
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
          if (child.userData.isParticles) {
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
  }, [infrastructureData, viewAngle, zoom, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
          <div className="mt-4 text-lg font-bold text-cyan-400">ANALYZING INFRASTRUCTURE TYPES</div>
        </div>
      </div>
    );
  }

  if (!infrastructureData) return null;

  const criticalInfra = infrastructureData.detailed_data?.filter(item => item.threat_level === 'CRITICAL') || [];
  const modernizationPercentage = infrastructureData.modernization_analysis?.modernization_percentage || 0;
  const legacySystems = infrastructureData.modernization_analysis?.legacy_systems || 0;
  const cloudAdoption = infrastructureData.modernization_analysis?.cloud_adoption || 0;
  const totalInstances = infrastructureData.distribution?.total_instances || 0;
  const totalTypes = infrastructureData.total_types || 0;
  const concentrationRisk = infrastructureData.distribution?.concentration_risk || 0;
  const diversityScore = infrastructureData.distribution?.diversity_score || 0;

  return (
    <div className="h-full bg-black p-4">
      {criticalInfra.length > 0 && (
        <div className="mb-3 bg-black border border-purple-500/50 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-purple-400 animate-pulse" />
            <span className="text-purple-400 font-bold text-sm">CRITICAL:</span>
            <span className="text-white text-sm">
              {criticalInfra.length} infrastructure types showing high concentration risk ({concentrationRisk.toFixed(1)}% concentration in top type)
            </span>
          </div>
        </div>
      )}

      <div className="h-full grid grid-cols-12 gap-4">
        <div className="col-span-8">
          <div className="h-full bg-black/80 border border-white/10 rounded-xl p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-cyan-400" />
                  INFRASTRUCTURE TYPE DISTRIBUTION
                </h3>
                <div className="text-xs text-gray-400">
                  Tracking {totalInstances.toLocaleString()} instances across {totalTypes} types
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
                <button 
                  onClick={() => {setViewAngle({ x: 0, y: 0 }); setZoom(1);}}
                  className="px-3 py-1 bg-white/5 border border-white/20 rounded text-cyan-400 hover:bg-white/10 text-xs"
                >
                  RESET
                </button>
              </div>
            </div>
            
            <div 
              ref={stackRef} 
              className="w-full"
              style={{ height: 'calc(100% - 100px)' }}
            />
            
            {hoveredInfra && (
              <div className="absolute bottom-8 left-8 bg-black/90 border border-cyan-400/50 rounded-lg p-3 backdrop-blur-xl">
                <div className="text-sm font-bold text-cyan-400">{hoveredInfra.type}</div>
                <div className="text-xs text-white/80 mt-1">
                  <div>Host Count: {hoveredInfra.frequency?.toLocaleString()}</div>
                  <div>Percentage: {hoveredInfra.percentage?.toFixed(1)}%</div>
                  <div>Threat Level: {hoveredInfra.threat_level}</div>
                </div>
              </div>
            )}
            
            <div className="mt-2 text-xs text-white/40">
              Click infrastructure layers for details • Auto-rotating view • Size = host count, Fill = visibility %
            </div>
          </div>
        </div>

        <div className="col-span-4 space-y-3">
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
            <div className="text-xs text-white/60 mb-3">MODERNIZATION SCORE</div>
            
            <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
              <div 
                className="h-full transition-all duration-1000"
                style={{
                  width: `${Math.min(100, Math.max(0, modernizationPercentage))}%`,
                  background: modernizationPercentage < 30 
                    ? 'linear-gradient(90deg, #ff00ff, #ff00ff)'
                    : modernizationPercentage < 60
                    ? 'linear-gradient(90deg, #ffaa00, #ff8800)'
                    : 'linear-gradient(90deg, #00d4ff, #00d4ff)'
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-cyan-400 font-bold">{cloudAdoption}</div>
                <div className="text-gray-400">Cloud Types</div>
              </div>
              <div>
                <div className="text-purple-400 font-bold">{legacySystems}</div>
                <div className="text-gray-400">Legacy Types</div>
              </div>
            </div>
          </div>

          {/* Infrastructure Summary */}
          <div className="bg-black/80 border border-white/10 rounded-xl p-4 backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white/60">INFRASTRUCTURE SUMMARY</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-2xl font-bold text-white">{totalTypes}</div>
                <div className="text-xs text-gray-400">TOTAL TYPES</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">{criticalInfra.length}</div>
                <div className="text-xs text-gray-400">CRITICAL</div>
              </div>
            </div>

            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Total Instances</span>
                <span className="text-white">{totalInstances.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Diversity Score</span>
                <span className="text-cyan-400">{diversityScore}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Concentration Risk</span>
                <span className={concentrationRisk > 50 ? 'text-purple-400' : 'text-cyan-400'}>
                  {concentrationRisk.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {selectedType && (
            <div className="bg-black/80 border border-cyan-400/30 rounded-xl p-4 backdrop-blur-xl">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-cyan-400">{selectedType.type?.toUpperCase()}</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-white/60">HOST COUNT</span>
                  <span className="text-sm font-bold text-white">{selectedType.frequency?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-white/60">PERCENTAGE OF TOTAL</span>
                  <span className="text-sm font-bold text-white">{selectedType.percentage?.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-white/60">THREAT LEVEL</span>
                  <span className={`text-sm font-bold ${
                    selectedType.threat_level === 'CRITICAL' ? 'text-pink-400' :
                    selectedType.threat_level === 'HIGH' ? 'text-purple-400' :
                    selectedType.threat_level === 'MEDIUM' ? 'text-yellow-400' :
                    'text-cyan-400'
                  }`}>
                    {selectedType.threat_level}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Top 5 Infrastructure Types */}
          {infrastructureData.distribution?.top_5 && (
            <div className="bg-black/80 border border-white/10 rounded-xl p-3 backdrop-blur-xl">
              <h3 className="text-sm font-bold text-white/60 mb-3">TOP 5 INFRASTRUCTURE TYPES</h3>
              <div className="space-y-2">
                {infrastructureData.distribution.top_5.map((infra, index) => (
                  <div key={index} className="bg-gray-900/30 rounded p-2 cursor-pointer hover:bg-gray-800/50 transition-all"
                       onClick={() => setSelectedType(infra)}>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-xs font-bold text-white truncate max-w-[180px]">
                          {infra.type}
                        </div>
                        <div className="text-xs text-gray-400">
                          {infra.frequency?.toLocaleString()} hosts
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          infra.threat_level === 'CRITICAL' ? 'text-pink-400' :
                          infra.threat_level === 'HIGH' ? 'text-purple-400' :
                          infra.threat_level === 'MEDIUM' ? 'text-yellow-400' :
                          'text-cyan-400'
                        }`}>
                          {infra.percentage?.toFixed(1)}%
                        </div>
                        <div className={`text-xs font-bold ${
                          infra.threat_level === 'CRITICAL' ? 'text-pink-400' :
                          infra.threat_level === 'HIGH' ? 'text-purple-400' :
                          infra.threat_level === 'MEDIUM' ? 'text-yellow-400' :
                          'text-cyan-400'
                        }`}>
                          {infra.threat_level}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Infrastructure Types List */}
          <div className="bg-black/80 border border-white/10 rounded-xl p-3 backdrop-blur-xl flex-1 max-h-64 overflow-hidden">
            <h3 className="text-sm font-bold text-white/60 mb-3">ALL INFRASTRUCTURE TYPES</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {infrastructureData.detailed_data?.slice(0, 20).map((infra, index) => (
                <div key={index} className="flex justify-between items-center p-1.5 bg-gray-900/30 rounded hover:bg-gray-800/50 transition-all cursor-pointer"
                     onClick={() => setSelectedType(infra)}>
                  <span className="text-xs text-white truncate max-w-[150px]">{infra.type}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{infra.frequency?.toLocaleString()}</span>
                    <span className={`text-xs font-bold ${
                      infra.percentage < 30 ? 'text-red-400' :
                      infra.percentage < 60 ? 'text-yellow-400' :
                      'text-cyan-400'
                    }`}>
                      {infra.percentage?.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfrastructureView;