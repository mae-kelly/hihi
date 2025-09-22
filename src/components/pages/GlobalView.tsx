import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

const GlobalView = () => {
  const [globalData, setGlobalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const globeRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const frameRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/global_visibility');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setGlobalData(data);
      } catch (error) {
        console.error('Error:', error);
        setGlobalData({
          global_visibility_percentage: 0,
          total_hosts: 0,
          visible_hosts: 0,
          invisible_hosts: 0,
          splunk_visibility_percentage: 0,
          chronicle_visibility_percentage: 0,
          visibility_gap_percentage: 0,
          status: 'OFFLINE'
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
    if (!globeRef.current || !globalData || loading) return;

    // Clean up previous scene
    if (rendererRef.current) {
      rendererRef.current.dispose();
      if (globeRef.current.contains(rendererRef.current.domElement)) {
        globeRef.current.removeChild(rendererRef.current.domElement);
      }
    }

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(
      45, 
      globeRef.current.clientWidth / globeRef.current.clientHeight, 
      0.1, 
      1000
    );
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    
    rendererRef.current = renderer;
    renderer.setSize(globeRef.current.clientWidth, globeRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    globeRef.current.appendChild(renderer.domElement);

    // Create earth sphere
    const earthGeometry = new THREE.SphereGeometry(100, 64, 64);
    const earthMaterial = new THREE.MeshPhongMaterial({
      color: 0x2233ff,
      emissive: 0x112244,
      shininess: 10,
      wireframe: true
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);

    // Add atmosphere glow
    const atmosphereGeometry = new THREE.SphereGeometry(105, 32, 32);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);

    // Add region markers
    const regionData = [
      { name: 'North America', lat: 45, lon: -100, visibility: 85, hosts: 45000 },
      { name: 'Europe', lat: 50, lon: 10, visibility: 78, hosts: 38000 },
      { name: 'Asia', lat: 30, lon: 100, visibility: 62, hosts: 52000 },
      { name: 'South America', lat: -15, lon: -60, visibility: 45, hosts: 12000 },
      { name: 'Africa', lat: 0, lon: 20, visibility: 38, hosts: 8000 },
      { name: 'Oceania', lat: -25, lon: 135, visibility: 72, hosts: 15000 }
    ];

    const markers = [];
    regionData.forEach(region => {
      const phi = (90 - region.lat) * Math.PI / 180;
      const theta = (region.lon + 180) * Math.PI / 180;
      
      const x = 100 * Math.sin(phi) * Math.cos(theta);
      const y = 100 * Math.cos(phi);
      const z = 100 * Math.sin(phi) * Math.sin(theta);
      
      const markerGeometry = new THREE.SphereGeometry(3, 8, 8);
      const markerMaterial = new THREE.MeshBasicMaterial({
        color: region.visibility < 40 ? 0xff00ff : region.visibility < 70 ? 0xffaa00 : 0x00d4ff
      });
      
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(x * 1.05, y * 1.05, z * 1.05);
      marker.userData = region;
      markers.push(marker);
      scene.add(marker);
    });

    // Add particles
    const particleCount = 1000;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      const radius = 150 + Math.random() * 100;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = radius * Math.cos(phi);
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
      color: 0x00d4ff,
      size: 1,
      transparent: true,
      opacity: 0.6
    });
    
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0x00d4ff, 0.5);
    directionalLight.position.set(100, 100, 100);
    scene.add(directionalLight);

    camera.position.set(0, 0, 300);

    // Animation
    const animate = () => {
      if (!sceneRef.current) return;
      
      frameRef.current = requestAnimationFrame(animate);
      
      earth.rotation.y = rotation.y;
      earth.rotation.x = rotation.x;
      atmosphere.rotation.y = rotation.y;
      atmosphere.rotation.x = rotation.x;
      
      markers.forEach(marker => {
        marker.lookAt(camera.position);
      });
      
      particles.rotation.y += 0.0001;
      
      camera.position.z = 300 / zoom;
      
      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!globeRef.current) return;
      camera.aspect = globeRef.current.clientWidth / globeRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(globeRef.current.clientWidth, globeRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (renderer) renderer.dispose();
      if (globeRef.current && renderer.domElement && globeRef.current.contains(renderer.domElement)) {
        globeRef.current.removeChild(renderer.domElement);
      }
    };
  }, [globalData, rotation, zoom, loading]);

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
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
          <div className="mt-3 text-sm font-bold text-cyan-400">INITIALIZING GLOBAL SURVEILLANCE</div>
        </div>
      </div>
    );
  }

  const isCritical = globalData?.global_visibility_percentage < 50;

  return (
    <div className="h-full bg-black p-4 overflow-hidden">
      <div className="h-full grid grid-cols-12 gap-3">
        <div className="col-span-8">
          <div className="h-full bg-black/80 border border-white/10 rounded-xl backdrop-blur-xl flex flex-col">
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white">PLANETARY SURVEILLANCE NETWORK</h3>
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
              className="flex-1"
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            />
            
            <div className="p-2 flex items-center justify-between text-xs text-white/40 border-t border-white/10">
              <div>Drag to rotate • Scroll to zoom</div>
              <div>ZOOM: {(zoom * 100).toFixed(0)}%</div>
            </div>
          </div>
        </div>

        <div className="col-span-4 flex flex-col gap-3">
          <div className="bg-black/80 border border-white/10 rounded-xl p-3 backdrop-blur-xl">
            <h3 className="text-xs font-bold text-white/60 mb-2">GLOBAL VISIBILITY STATUS</h3>
            <div className="text-3xl font-bold mb-1">
              <span className={isCritical ? 'text-pink-400' : 'text-cyan-400'}>
                {globalData?.global_visibility_percentage?.toFixed(1) || '0.0'}%
              </span>
            </div>
            <div className="text-xs text-white/60 mb-2">
              {globalData?.visible_hosts?.toLocaleString() || '0'} / {globalData?.total_hosts?.toLocaleString() || '0'} ASSETS
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-cyan-400">SPLUNK</span>
                  <span className="text-white">{globalData?.splunk_visibility_percentage?.toFixed(1) || '0.0'}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-400 to-cyan-400/50"
                    style={{ width: `${globalData?.splunk_visibility_percentage || 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-purple-400">CHRONICLE</span>
                  <span className="text-white">{globalData?.chronicle_visibility_percentage?.toFixed(1) || '0.0'}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-400 to-purple-400/50"
                    style={{ width: `${globalData?.chronicle_visibility_percentage || 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-black/80 border border-white/10 rounded-xl p-3 backdrop-blur-xl flex-1">
            <h3 className="text-xs font-bold text-white/60 mb-2">THREAT ANALYSIS</h3>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/60">INVISIBLE HOSTS</span>
                <span className="text-xs font-bold text-pink-400">
                  {globalData?.invisible_hosts?.toLocaleString() || '0'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/60">VISIBILITY GAP</span>
                <span className="text-xs font-bold text-purple-400">
                  {globalData?.visibility_gap_percentage?.toFixed(1) || '0.0'}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/60">STATUS</span>
                <span className={`text-xs font-bold ${
                  globalData?.status === 'CRITICAL' ? 'text-pink-400' : 
                  globalData?.status === 'WARNING' ? 'text-purple-400' : 
                  'text-cyan-400'
                }`}>
                  {globalData?.status || 'UNKNOWN'}
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