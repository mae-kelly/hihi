import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Globe, AlertTriangle, Eye, Database, Shield } from 'lucide-react';

const GlobalView = () => {
  const [globalData, setGlobalData] = useState(null);
  const [databaseStatus, setDatabaseStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const globeRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dbResponse, regionResponse, cmdbResponse] = await Promise.all([
          fetch('http://localhost:5000/api/database_status'),
          fetch('http://localhost:5000/api/region_metrics'),
          fetch('http://localhost:5000/api/cmdb_presence')
        ]);

        const dbData = await dbResponse.json();
        const regionData = await regionResponse.json();
        const cmdbData = await cmdbResponse.json();

        setDatabaseStatus(dbData);
        setGlobalData({
          regional_data: regionData.regional_analytics || [],
          total_assets: dbData.row_count || 0,
          cmdb_registration_rate: cmdbData.registration_rate || 0,
          cmdb_registered: cmdbData.cmdb_registered || 0,
          overall_status: cmdbData.compliance_analysis?.compliance_status || 'UNKNOWN'
        });
      } catch (error) {
        console.error('Error fetching global data:', error);
        setGlobalData({
          regional_data: [],
          total_assets: 0,
          cmdb_registration_rate: 0,
          cmdb_registered: 0,
          overall_status: 'ERROR'
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
    if (!globeRef.current || !globalData) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, globeRef.current.clientWidth / globeRef.current.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(globeRef.current.clientWidth, globeRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    globeRef.current.appendChild(renderer.domElement);

    const earthGeometry = new THREE.SphereGeometry(100, 128, 128);
    
    const earthMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float visibility;
        varying vec2 vUv;
        varying vec3 vNormal;
        
        void main() {
          vec2 uv = vUv;
          float lat = (uv.y - 0.5) * 3.14159;
          float lon = (uv.x - 0.5) * 6.28318;
          
          vec3 baseColor = vec3(0.0, 0.05, 0.1);
          vec3 landColor = vec3(0.0, 0.3, 0.4);
          vec3 threatColor = vec3(1.0, 0.0, 1.0);
          
          float continents = step(0.3, sin(lon * 3.0) * sin(lat * 2.0));
          vec3 earthColor = mix(baseColor, landColor, continents);
          
          float grid = step(0.98, max(sin(lon * 40.0), sin(lat * 20.0)));
          earthColor += vec3(0.0, 0.8, 1.0) * grid * 0.3;
          
          float threat = sin(lon * 10.0 + time) * sin(lat * 8.0 - time) * 0.5 + 0.5;
          threat *= (1.0 - visibility / 100.0);
          earthColor = mix(earthColor, threatColor, threat * 0.3);
          
          float rim = 1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0));
          rim = pow(rim, 2.0);
          vec3 rimColor = mix(vec3(0.0, 0.8, 1.0), vec3(1.0, 0.0, 1.0), threat);
          
          gl_FragColor = vec4(earthColor + rimColor * rim * 0.5, 1.0);
        }
      `,
      uniforms: {
        time: { value: 0 },
        visibility: { value: globalData.cmdb_registration_rate || 0 }
      },
      transparent: true
    });
    
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);

    const atmosphereGeometry = new THREE.SphereGeometry(105, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(0.0, 0.8, 1.0, 1.0) * intensity;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);

    // Create markers from real regional data
    const markers = [];
    globalData.regional_data.forEach(region => {
      // Map region names to approximate coordinates
      const regionCoords = {
        'north america': { lat: 45, lon: -100 },
        'europe': { lat: 50, lon: 10 },
        'emea': { lat: 30, lon: 20 },
        'asia': { lat: 30, lon: 100 },
        'apac': { lat: 10, lon: 120 },
        'latam': { lat: -15, lon: -60 },
        'oceania': { lat: -25, lon: 135 }
      };

      const coords = regionCoords[region.region.toLowerCase()] || { lat: 0, lon: 0 };
      const phi = (90 - coords.lat) * Math.PI / 180;
      const theta = (coords.lon + 180) * Math.PI / 180;
      
      const x = 100 * Math.sin(phi) * Math.cos(theta);
      const y = 100 * Math.cos(phi);
      const z = 100 * Math.sin(phi) * Math.sin(theta);
      
      const markerGeometry = new THREE.SphereGeometry(2 + Math.log(region.count / 1000 + 1), 16, 16);
      const markerMaterial = new THREE.MeshBasicMaterial({
        color: region.security_score < 40 ? 0xff00ff : region.security_score < 70 ? 0xc084fc : 0x00d4ff,
        emissive: region.security_score < 40 ? 0xff00ff : 0x00d4ff,
        emissiveIntensity: 0.5
      });
      
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(x * 1.05, y * 1.05, z * 1.05);
      marker.userData = region;
      markers.push(marker);
      scene.add(marker);
      
      const pulseGeometry = new THREE.RingGeometry(3, 5, 32);
      const pulseMaterial = new THREE.MeshBasicMaterial({
        color: region.security_score < 40 ? 0xff00ff : 0x00d4ff,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      });
      const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
      pulse.position.copy(marker.position);
      pulse.lookAt(0, 0, 0);
      pulse.userData = { isPulse: true, baseScale: 1 };
      scene.add(pulse);
    });

    const particleCount = 5000;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      const radius = 150 + Math.random() * 100;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = radius * Math.cos(phi);
      
      const isVisible = Math.random() > 0.5;
      colors[i] = isVisible ? 0 : 1;
      colors[i + 1] = isVisible ? 0.8 : 0;
      colors[i + 2] = 1;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0x00d4ff, 0.5);
    directionalLight.position.set(100, 100, 100);
    scene.add(directionalLight);

    camera.position.set(0, 0, 300);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleMouseMove = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(markers);
      
      if (intersects.length > 0) {
        setHoveredCountry(intersects[0].object.userData);
        document.body.style.cursor = 'pointer';
      } else {
        setHoveredCountry(null);
        document.body.style.cursor = isDragging ? 'grabbing' : 'grab';
      }
    };

    const handleClick = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(markers);
      
      if (intersects.length > 0) {
        setSelectedRegion(intersects[0].object.userData);
      }
    };

    const handleResize = () => {
      if (!globeRef.current) return;
      camera.aspect = globeRef.current.clientWidth / globeRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(globeRef.current.clientWidth, globeRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('click', handleClick);

    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      earth.rotation.y = rotation.y;
      earth.rotation.x = rotation.x;
      atmosphere.rotation.y = rotation.y;
      atmosphere.rotation.x = rotation.x;
      
      markers.forEach(marker => {
        marker.rotation.y = rotation.y;
        marker.rotation.x = rotation.x;
      });
      
      scene.children.forEach(child => {
        if (child.userData.isPulse) {
          const scale = 1 + Math.sin(Date.now() * 0.003) * 0.3;
          child.scale.setScalar(child.userData.baseScale * scale);
        }
      });
      
      particles.rotation.y += 0.0001;
      earthMaterial.uniforms.time.value = Date.now() * 0.001;
      
      camera.position.z = 300 / zoom;
      
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameId) cancelAnimationFrame(frameId);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('click', handleClick);
      if (globeRef.current && renderer.domElement) {
        globeRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [globalData, rotation, zoom, isDragging]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    setRotation(prev => ({
      x: prev.x + deltaY * 0.005,
      y: prev.y - deltaX * 0.005
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    setZoom(prev => Math.max(0.5, Math.min(3, prev + e.deltaY * -0.001)));
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
          <div className="mt-3 text-sm font-bold text-cyan-400">LOADING GLOBAL CMDB VISIBILITY</div>
        </div>
      </div>
    );
  }

  if (!globalData) return null;

  const isCritical = globalData.cmdb_registration_rate < 50;

  return (
    <div className="w-full h-full p-3 bg-black">
      {/* Critical Alert */}
      {isCritical && (
        <div className="mb-3 bg-black border border-purple-500/50 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-purple-400 animate-pulse" />
            <span className="text-purple-400 font-bold text-sm">CRITICAL CMDB VISIBILITY:</span>
            <span className="text-white text-sm">
              Only {globalData.cmdb_registration_rate.toFixed(1)}% of assets visible in CMDB
            </span>
          </div>
        </div>
      )}

      <div className="h-full grid grid-cols-12 gap-3">
        <div className="col-span-8 h-full">
          <div className="h-full bg-black/80 border border-white/10 rounded-xl backdrop-blur-xl flex flex-col">
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  GLOBAL CMDB VISIBILITY
                </h3>
                <div className="text-xs text-gray-400">Asset registration across regions</div>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => setZoom(prev => Math.min(3, prev + 0.2))}
                  className="px-2 py-1 bg-white/5 border border-white/20 rounded text-cyan-400 hover:bg-white/10 transition-all text-xs"
                >
                  +
                </button>
                <button 
                  onClick={() => setZoom(prev => Math.max(0.5, prev - 0.2))}
                  className="px-2 py-1 bg-white/5 border border-white/20 rounded text-cyan-400 hover:bg-white/10 transition-all text-xs"
                >
                  −
                </button>
                <button 
                  onClick={() => { setZoom(1); setRotation({ x: 0, y: 0 }); }}
                  className="px-2 py-1 bg-white/5 border border-white/20 rounded text-cyan-400 hover:bg-white/10 transition-all text-xs"
                >
                  RESET
                </button>
              </div>
            </div>
            
            <div 
              ref={globeRef} 
              className="flex-1 cursor-grab relative"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            >
              {hoveredCountry && (
                <div className="absolute bottom-4 left-4 bg-black/90 border border-cyan-400/50 rounded-lg p-2 backdrop-blur-xl">
                  <div className="text-xs font-bold text-cyan-400 mb-1">{hoveredCountry.region.toUpperCase()}</div>
                  <div className="text-xs text-white/80">
                    <div>Assets: {hoveredCountry.count.toLocaleString()}</div>
                    <div>CMDB Coverage: {hoveredCountry.cmdb_coverage.toFixed(1)}%</div>
                    <div>Tanium Coverage: {hoveredCountry.tanium_coverage.toFixed(1)}%</div>
                    <div>Security Score: {hoveredCountry.security_score.toFixed(1)}</div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-2 flex items-center justify-between text-xs text-white/40 border-t border-white/10">
              <div>Drag to rotate • Scroll to zoom • Click regions for details</div>
              <div>ZOOM: {(zoom * 100).toFixed(0)}%</div>
            </div>
          </div>
        </div>

        <div className="col-span-4 h-full flex flex-col gap-3">
          {/* CMDB Status */}
          <div className="bg-black/80 border border-white/10 rounded-xl p-3 backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white/60">CMDB REGISTRATION STATUS</h3>
            </div>
            <div className="text-3xl font-bold mb-1">
              <span className={isCritical ? 'text-pink-400' : 'text-cyan-400'}>
                {globalData.cmdb_registration_rate.toFixed(1)}%
              </span>
            </div>
            <div className="text-xs text-white/60 mb-2">
              {globalData.cmdb_registered.toLocaleString()} / {globalData.total_assets.toLocaleString()} ASSETS REGISTERED
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full transition-all duration-1000"
                style={{
                  width: `${globalData.cmdb_registration_rate}%`,
                  background: isCritical 
                    ? 'linear-gradient(90deg, #ff00ff, #ff00ff)'
                    : 'linear-gradient(90deg, #00d4ff, #00d4ff)'
                }}
              />
            </div>
          </div>

          {/* Database Connection Status */}
          <div className="bg-black/80 border border-white/10 rounded-xl p-3 backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-green-400" />
              <h3 className="text-xs font-bold text-white/60">DATABASE STATUS</h3>
            </div>
            <div className="text-sm font-bold text-green-400">
              {databaseStatus?.status === 'connected' ? 'CONNECTED' : 'DISCONNECTED'}
            </div>
            <div className="text-xs text-white/60">
              {databaseStatus?.row_count?.toLocaleString() || 0} records available
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Database: {databaseStatus?.database_type?.toUpperCase() || 'UNKNOWN'}
            </div>
          </div>

          {selectedRegion && (
            <div className="bg-black/80 border border-cyan-400/30 rounded-xl p-3 backdrop-blur-xl">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-cyan-400">{selectedRegion.region.toUpperCase()}</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-white/60">TOTAL ASSETS</span>
                  <span className="text-xs font-bold text-white">{selectedRegion.count.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-white/60">CMDB COVERAGE</span>
                  <span className="text-xs font-bold text-white">{selectedRegion.cmdb_coverage.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-white/60">TANIUM COVERAGE</span>
                  <span className="text-xs font-bold text-white">{selectedRegion.tanium_coverage.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-white/60">SECURITY SCORE</span>
                  <span className={`text-xs font-bold ${
                    selectedRegion.security_score < 40 ? 'text-pink-400' : 
                    selectedRegion.security_score < 70 ? 'text-purple-400' : 
                    'text-cyan-400'
                  }`}>
                    {selectedRegion.security_score.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-white/60">RISK CATEGORY</span>
                  <span className={`text-xs font-bold ${
                    selectedRegion.risk_category === 'HIGH' ? 'text-pink-400' : 
                    selectedRegion.risk_category === 'MEDIUM' ? 'text-purple-400' : 
                    'text-cyan-400'
                  }`}>
                    {selectedRegion.risk_category}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Overall Status */}
          <div className="bg-black/80 border border-white/10 rounded-xl p-3 backdrop-blur-xl flex-1">
            <h3 className="text-xs font-bold text-white/60 mb-2">ANALYSIS</h3>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/60">OVERALL STATUS</span>
                <span className={`text-xs font-bold ${
                  globalData.overall_status === 'CRITICAL' ? 'text-pink-400' : 
                  globalData.overall_status === 'PARTIAL_COMPLIANCE' ? 'text-purple-400' : 
                  globalData.overall_status === 'COMPLIANT' ? 'text-cyan-400' : 'text-gray-400'
                }`}>
                  {globalData.overall_status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/60">UNREGISTERED ASSETS</span>
                <span className="text-xs font-bold text-pink-400">
                  {(globalData.total_assets - globalData.cmdb_registered).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/60">VISIBILITY GAP</span>
                <span className="text-xs font-bold text-purple-400">
                  {(100 - globalData.cmdb_registration_rate).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalView;