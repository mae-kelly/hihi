import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Globe, AlertTriangle, Eye, Database, Shield } from 'lucide-react';

const GlobalView = () => {
  const [globalData, setGlobalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
        setError(null);
        
        // Test database connection first
        const dbResponse = await fetch('http://localhost:5000/api/database_status');
        if (!dbResponse.ok) {
          throw new Error(`Database API failed: ${dbResponse.status}`);
        }
        const dbData = await dbResponse.json();
        console.log('Database status:', dbData);

        // Then fetch CMDB data
        const cmdbResponse = await fetch('http://localhost:5000/api/cmdb_presence');
        if (!cmdbResponse.ok) {
          throw new Error(`CMDB API failed: ${cmdbResponse.status}`);
        }
        const cmdbData = await cmdbResponse.json();
        console.log('CMDB data:', cmdbData);

        // Try to get regional data (this endpoint might not exist yet)
        let regionData = { regional_analytics: [] };
        try {
          const regionResponse = await fetch('http://localhost:5000/api/region_metrics');
          if (regionResponse.ok) {
            regionData = await regionResponse.json();
            console.log('Region data:', regionData);
          }
        } catch (regionError) {
          console.warn('Region metrics not available:', regionError);
        }

        setGlobalData({
          regional_data: regionData.regional_analytics || [],
          total_assets: dbData.row_count || 0,
          cmdb_registration_rate: cmdbData.registration_rate || 0,
          cmdb_registered: cmdbData.cmdb_registered || 0,
          overall_status: cmdbData.compliance_analysis?.compliance_status || 'UNKNOWN',
          database_connected: dbData.status === 'connected'
        });

      } catch (error) {
        console.error('Error fetching global data:', error);
        setError(error.message);
        setGlobalData({
          regional_data: [],
          total_assets: 0,
          cmdb_registration_rate: 0,
          cmdb_registered: 0,
          overall_status: 'ERROR',
          database_connected: false
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Simple 3D Globe (simplified for debugging)
  useEffect(() => {
    if (!globeRef.current || !globalData) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, globeRef.current.clientWidth / globeRef.current.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(globeRef.current.clientWidth, globeRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    globeRef.current.appendChild(renderer.domElement);

    // Simple globe
    const earthGeometry = new THREE.SphereGeometry(50, 32, 32);
    const earthMaterial = new THREE.MeshPhongMaterial({
      color: globalData.cmdb_registration_rate < 50 ? 0xff00ff : 0x00d4ff,
      emissive: globalData.cmdb_registration_rate < 50 ? 0xff00ff : 0x00d4ff,
      emissiveIntensity: 0.1,
      transparent: true,
      opacity: 0.8
    });
    
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);

    // Add some basic lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0x00d4ff, 0.5);
    directionalLight.position.set(100, 100, 100);
    scene.add(directionalLight);

    camera.position.set(0, 0, 150);

    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      earth.rotation.y = rotation.y;
      earth.rotation.x = rotation.x;
      
      camera.position.z = 150 / zoom;
      
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      if (globeRef.current && renderer.domElement) {
        globeRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [globalData, rotation, zoom]);

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
          <div className="mt-3 text-sm font-bold text-cyan-400">CONNECTING TO FLASK API...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="text-center p-6 bg-red-900/20 border border-red-500 rounded-xl">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <div className="text-lg font-bold text-red-400 mb-2">API CONNECTION ERROR</div>
          <div className="text-sm text-white mb-4">
            {error}
          </div>
          <div className="text-xs text-gray-400">
            Make sure Flask server is running on http://localhost:5000
          </div>
        </div>
      </div>
    );
  }

  if (!globalData) return null;

  const isCritical = globalData.cmdb_registration_rate < 50;

  return (
    <div className="w-full h-full p-3 bg-black">
      {/* Debug Info */}
      <div className="mb-3 bg-gray-900/50 border border-gray-700 rounded-xl p-2">
        <div className="text-xs text-gray-400">
          DEBUG: DB Connected: {globalData.database_connected ? 'Yes' : 'No'} | 
          Total Assets: {globalData.total_assets} | 
          CMDB Rate: {globalData.cmdb_registration_rate}% |
          Status: {globalData.overall_status}
        </div>
      </div>

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
                <div className="text-xs text-gray-400">Real-time asset registration status</div>
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
            />
            
            <div className="p-2 flex items-center justify-between text-xs text-white/40 border-t border-white/10">
              <div>Interactive globe showing CMDB registration status</div>
              <div>ZOOM: {(zoom * 100).toFixed(0)}%</div>
            </div>
          </div>
        </div>

        <div className="col-span-4 h-full flex flex-col gap-3">
          {/* CMDB Status */}
          <div className="bg-black/80 border border-white/10 rounded-xl p-3 backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white/60">CMDB REGISTRATION</h3>
            </div>
            <div className="text-3xl font-bold mb-1">
              <span className={isCritical ? 'text-pink-400' : 'text-cyan-400'}>
                {globalData.cmdb_registration_rate.toFixed(1)}%
              </span>
            </div>
            <div className="text-xs text-white/60 mb-2">
              {globalData.cmdb_registered.toLocaleString()} / {globalData.total_assets.toLocaleString()} ASSETS
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
              <Shield className={`w-4 h-4 ${globalData.database_connected ? 'text-green-400' : 'text-red-400'}`} />
              <h3 className="text-xs font-bold text-white/60">API CONNECTION</h3>
            </div>
            <div className={`text-sm font-bold ${globalData.database_connected ? 'text-green-400' : 'text-red-400'}`}>
              {globalData.database_connected ? 'CONNECTED' : 'DISCONNECTED'}
            </div>
            <div className="text-xs text-white/60">
              Flask API Status
            </div>
          </div>

          {/* Overall Status */}
          <div className="bg-black/80 border border-white/10 rounded-xl p-3 backdrop-blur-xl flex-1">
            <h3 className="text-xs font-bold text-white/60 mb-2">SYSTEM ANALYSIS</h3>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/60">COMPLIANCE STATUS</span>
                <span className={`text-xs font-bold ${
                  globalData.overall_status === 'COMPLIANT' ? 'text-cyan-400' : 
                  globalData.overall_status === 'PARTIAL_COMPLIANCE' ? 'text-yellow-400' : 
                  'text-pink-400'
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

            {/* Raw Data Display */}
            <div className="mt-4 p-2 bg-gray-900/50 rounded border border-gray-700">
              <div className="text-xs text-gray-400 mb-1">RAW API DATA:</div>
              <div className="text-xs text-green-400 font-mono">
                <div>Total: {globalData.total_assets}</div>
                <div>Registered: {globalData.cmdb_registered}</div>
                <div>Rate: {globalData.cmdb_registration_rate}%</div>
                <div>DB: {globalData.database_connected ? 'OK' : 'FAIL'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalView;