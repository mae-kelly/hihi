import React, { useState, useEffect, useRef } from 'react';
import { Globe, Database, Server, Cloud, Shield, Activity, Zap, Wifi, Eye, AlertTriangle, TrendingDown, Satellite, Radio, Radar } from 'lucide-react';
import * as THREE from 'three';

interface GlobalData {
  total_assets: number;
  splunk_forwarding: number;
  qso_enabled: number;
  cmdb_present: number;
  edr_covered: number;
  tanium_managed: number;
  dlp_covered: number;
  csoc_coverage: number;
  splunk_coverage: number;
  cmdb_coverage: number;
  edr_coverage: number;
  critical_gaps: number;
}

interface RegionalData {
  region_s: string;
  country_s: string;
  total_assets: number;
  visible_assets: number;
  cmdb_assets: number;
  edr_assets: number;
  visibility_percentage: number;
  cmdb_coverage: number;
  edr_coverage: number;
  visibility_gap: number;
}

const GlobalView: React.FC = () => {
  const [selectedPlatform, setSelectedPlatform] = useState<'csoc' | 'splunk' | 'cmdb'>('csoc');
  const [globalData, setGlobalData] = useState<GlobalData | null>(null);
  const [regionalData, setRegionalData] = useState<RegionalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const globeRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>(0);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Fetch real data from Python backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch global overview
        const globalResponse = await fetch('http://localhost:5000/api/global-view');
        if (!globalResponse.ok) throw new Error('Failed to fetch global data');
        const globalResult = await globalResponse.json();
        setGlobalData(globalResult);

        // Fetch regional breakdown
        const regionalResponse = await fetch('http://localhost:5000/api/regional-view');
        if (!regionalResponse.ok) throw new Error('Failed to fetch regional data');
        const regionalResult = await regionalResponse.json();
        setRegionalData(regionalResult);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate current platform data
  const currentData = React.useMemo(() => {
    if (!globalData) return null;

    const baseData = {
      totalAssets: globalData.total_assets,
      missing: 0,
      color: '#00ffff',
      glowColor: '#00ffff',
      status: 'UNKNOWN',
      trend: 0,
    };

    switch (selectedPlatform) {
      case 'csoc':
        return {
          ...baseData,
          covered: globalData.splunk_forwarding + globalData.qso_enabled, // Combined CSOC coverage
          percentage: globalData.csoc_coverage,
          missing: globalData.critical_gaps,
          status: globalData.csoc_coverage < 20 ? 'CRITICAL' : globalData.csoc_coverage < 50 ? 'WARNING' : 'GOOD',
          color: globalData.csoc_coverage < 20 ? '#ff00ff' : globalData.csoc_coverage < 50 ? '#c084fc' : '#00ffff'
        };
      
      case 'splunk':
        return {
          ...baseData,
          covered: globalData.splunk_forwarding,
          percentage: globalData.splunk_coverage,
          missing: globalData.total_assets - globalData.splunk_forwarding,
          status: globalData.splunk_coverage < 50 ? 'WARNING' : 'GOOD',
          color: globalData.splunk_coverage < 50 ? '#c084fc' : '#00ffff'
        };
      
      case 'cmdb':
        return {
          ...baseData,
          covered: globalData.cmdb_present,
          percentage: globalData.cmdb_coverage,
          missing: globalData.total_assets - globalData.cmdb_present,
          status: globalData.cmdb_coverage < 80 ? 'WARNING' : 'GOOD',
          color: globalData.cmdb_coverage < 80 ? '#c084fc' : '#00ff88'
        };
      
      default:
        return baseData;
    }
  }, [globalData, selectedPlatform]);

  // Group regional data by region for better visualization
  const regionSummary = React.useMemo(() => {
    const regions: Record<string, {
      name: string;
      totalAssets: number;
      coverage: number;
      status: string;
      countries: number;
    }> = {};

    regionalData.forEach(item => {
      if (!regions[item.region_s]) {
        regions[item.region_s] = {
          name: item.region_s,
          totalAssets: 0,
          coverage: 0,
          status: 'unknown',
          countries: 0
        };
      }
      
      regions[item.region_s].totalAssets += item.total_assets;
      regions[item.region_s].countries += 1;
    });

    // Calculate average coverage per region
    Object.keys(regions).forEach(regionKey => {
      const regionCountries = regionalData.filter(item => item.region_s === regionKey);
      const totalAssets = regionCountries.reduce((sum, country) => sum + country.total_assets, 0);
      const weightedCoverage = regionCountries.reduce((sum, country) => 
        sum + (country.visibility_percentage * country.total_assets), 0
      );
      
      regions[regionKey].coverage = totalAssets > 0 ? weightedCoverage / totalAssets : 0;
      regions[regionKey].status = regions[regionKey].coverage < 30 ? 'critical' : 
                                 regions[regionKey].coverage < 60 ? 'warning' : 'secure';
    });

    return Object.values(regions);
  }, [regionalData]);

  // 3D Globe Setup with Real Data
  useEffect(() => {
    if (!globeRef.current || !globalData) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.00025);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      globeRef.current.clientWidth / globeRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 250);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(globeRef.current.clientWidth, globeRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    globeRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Globe
    const globeGeometry = new THREE.SphereGeometry(80, 64, 64);
    const globeMaterial = new THREE.MeshPhongMaterial({
      color: 0x001122,
      emissive: currentData?.color || 0x00ffff,
      emissiveIntensity: 0.1,
      wireframe: false,
      transparent: true,
      opacity: 0.8,
    });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);

    // Wireframe overlay
    const wireframeGeometry = new THREE.SphereGeometry(81, 32, 32);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: currentData?.color || 0x00ffff,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
    scene.add(wireframe);

    // Add atmosphere glow
    const atmosphereGeometry = new THREE.SphereGeometry(85, 32, 32);
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
          float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
          gl_FragColor = vec4(${currentData?.color === '#00ffff' ? '0.0, 1.0, 1.0' : currentData?.color === '#c084fc' ? '0.75, 0.52, 0.99' : '0.0, 1.0, 0.53'}, 1.0) * intensity;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);

    // Regional data points with REAL coordinates and coverage
    const regionCoordinates: Record<string, { lat: number; lon: number }> = {
      'North America': { lat: 45, lon: -100 },
      'Europe': { lat: 55, lon: 10 },
      'Asia Pacific': { lat: 25, lon: 120 },
      'Latin America': { lat: -15, lon: -60 },
      'Middle East': { lat: 25, lon: 45 },
      'Africa': { lat: 0, lon: 20 },
    };

    regionSummary.forEach(region => {
      const coords = regionCoordinates[region.name];
      if (!coords) return;

      const phi = (90 - coords.lat) * (Math.PI / 180);
      const theta = (coords.lon + 180) * (Math.PI / 180);
      
      const x = 80 * Math.sin(phi) * Math.cos(theta);
      const y = 80 * Math.cos(phi);
      const z = 80 * Math.sin(phi) * Math.sin(theta);

      // Create beacon based on real coverage data
      const beaconGeometry = new THREE.ConeGeometry(3, 10, 4);
      const beaconMaterial = new THREE.MeshPhongMaterial({
        color: region.status === 'critical' ? 0xff00ff : 
               region.status === 'warning' ? 0xffaa00 : 
               0x00ff88,
        emissive: region.status === 'critical' ? 0xff00ff : 
                  region.status === 'warning' ? 0xffaa00 : 
                  0x00ff88,
        emissiveIntensity: 0.5,
      });
      const beacon = new THREE.Mesh(beaconGeometry, beaconMaterial);
      beacon.position.set(x, y, z);
      beacon.lookAt(0, 0, 0);
      beacon.userData = { region: region.name, coverage: region.coverage, assets: region.totalAssets };
      scene.add(beacon);

      // Pulse ring based on coverage intensity
      const ringGeometry = new THREE.RingGeometry(5, 7, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: beaconMaterial.color,
        transparent: true,
        opacity: region.coverage / 100,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.set(x * 1.1, y * 1.1, z * 1.1);
      ring.lookAt(0, 0, 0);
      scene.add(ring);
    });

    // Particle system for data flow - intensity based on real metrics
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = Math.min(1500, Math.max(500, globalData.total_assets / 100));
    const positions = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i += 3) {
      const radius = 90 + Math.random() * 40;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = radius * Math.cos(phi);
      positions[i + 2] = radius * Math.sin(phi) * Math.sin(theta);
      
      // Color based on current platform and coverage
      const color = new THREE.Color(currentData?.color || '#00ffff');
      colors[i] = color.r;
      colors[i + 1] = color.g;
      colors[i + 2] = color.b;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: currentData?.percentage < 50 ? 0.5 : 1,
      vertexColors: true,
      transparent: true,
      opacity: Math.max(0.3, (currentData?.percentage || 50) / 100),
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1, 1000);
    pointLight.position.set(100, 100, 100);
    scene.add(pointLight);

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      
      // Rotate globe
      globe.rotation.y += 0.002;
      wireframe.rotation.y += 0.002;
      atmosphere.rotation.y += 0.001;
      
      // Animate particles based on real coverage
      particles.rotation.y -= 0.001 * ((currentData?.percentage || 50) / 50);
      
      // Pulse beacons based on real status
      scene.children.forEach(child => {
        if (child instanceof THREE.Mesh && child.geometry instanceof THREE.RingGeometry) {
          const pulseSpeed = child.material.opacity < 0.5 ? 4 : 2; // Faster pulse for low coverage
          child.scale.x = 1 + Math.sin(Date.now() * 0.002 * pulseSpeed) * 0.2;
          child.scale.y = 1 + Math.sin(Date.now() * 0.002 * pulseSpeed) * 0.2;
          child.material.opacity = Math.max(0.2, 0.5 - Math.sin(Date.now() * 0.002 * pulseSpeed) * 0.3);
        }
      });
      
      // Camera orbit
      const time = Date.now() * 0.0005;
      camera.position.x = Math.sin(time) * 250 * zoomLevel;
      camera.position.z = Math.cos(time) * 250 * zoomLevel;
      camera.position.y = Math.sin(time * 0.5) * 50;
      camera.lookAt(0, 0, 0);
      
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
      if (globeRef.current && renderer.domElement) {
        globeRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [globalData, currentData, zoomLevel, regionSummary]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400"></div>
          <div className="mt-4 text-xl font-bold text-cyan-400">LOADING REAL DATA</div>
          <div className="text-sm text-gray-400">Querying Universal CMDB...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center glass-panel rounded-xl p-8">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <div className="text-xl font-bold text-red-400 mb-2">API CONNECTION ERROR</div>
          <div className="text-sm text-gray-400 mb-4">{error}</div>
          <div className="text-xs text-gray-500">Make sure Python backend is running on port 5000</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full bg-black flex flex-col">
      {/* Critical Alert based on real data */}
      {currentData && currentData.percentage < 50 && (
        <div className="mb-3 bg-black border border-red-500/30 rounded-lg p-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
            <div>
              <span className="text-red-400 font-bold text-sm">CRITICAL VISIBILITY BREACH:</span>
              <span className="text-white ml-2 text-sm">
                Coverage at {currentData.percentage.toFixed(1)}% - {currentData.missing.toLocaleString()} nodes compromised
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Platform Selector */}
      <div className="flex gap-2 mb-3 flex-shrink-0">
        {(['csoc', 'splunk', 'cmdb'] as const).map(platform => {
          const platformData = globalData ? {
            csoc: { coverage: globalData.csoc_coverage, color: '#00ffff' },
            splunk: { coverage: globalData.splunk_coverage, color: '#c084fc' },
            cmdb: { coverage: globalData.cmdb_coverage, color: '#00ff88' }
          }[platform] : null;

          return (
            <button
              key={platform}
              onClick={() => setSelectedPlatform(platform)}
              className={`px-4 py-2 rounded-lg font-bold uppercase tracking-wider transition-all text-sm ${
                selectedPlatform === platform
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20'
                  : 'bg-gray-900/50 hover:bg-gray-800/50'
              }`}
              style={{
                border: selectedPlatform === platform 
                  ? `2px solid ${platformData?.color || '#00ffff'}` 
                  : '2px solid transparent'
              }}
            >
              <span style={{ 
                color: selectedPlatform === platform ? platformData?.color || '#00ffff' : '#ffffff60'
              }}>
                {platform.toUpperCase()}
                {platformData && (
                  <span className="ml-2 text-xs">
                    {platformData.coverage.toFixed(1)}%
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 grid grid-cols-12 gap-3 min-h-0">
        {/* 3D Globe Container */}
        <div className="col-span-8">
          <div className="bg-black border border-cyan-500/30 rounded-xl overflow-hidden h-full">
            <div className="absolute top-2 left-2 z-10 text-cyan-400 text-xs font-mono space-y-0.5">
              <div>REAL-TIME VIEW: ACTIVE</div>
              <div>ASSETS: {globalData?.total_assets.toLocaleString()}</div>
              <div>PLATFORM: {selectedPlatform.toUpperCase()}</div>
            </div>
            
            <div className="absolute top-2 right-2 z-10 space-y-1">
              <button 
                onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.2))}
                className="block p-1 bg-cyan-500/20 border border-cyan-500/50 rounded hover:bg-cyan-500/30"
              >
                <Zap className="w-3 h-3 text-cyan-400" />
              </button>
              <button 
                onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.2))}
                className="block p-1 bg-cyan-500/20 border border-cyan-500/50 rounded hover:bg-cyan-500/30"
              >
                <Satellite className="w-3 h-3 text-cyan-400" />
              </button>
            </div>

            <div ref={globeRef} className="w-full h-full" />
          </div>
        </div>

        {/* Metrics Panel */}
        <div className="col-span-4 space-y-3">
          {/* Coverage Meter */}
          <div className="bg-black border border-purple-500/30 rounded-xl p-3">
            <div className="text-center">
              <div className="relative inline-block">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="58"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="6"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="58"
                    stroke={currentData?.color || '#00ffff'}
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 58}`}
                    strokeDashoffset={`${2 * Math.PI * 58 * (1 - (currentData?.percentage || 0) / 100)}`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div>
                    <div className="text-3xl font-black text-white">
                      {currentData?.percentage.toFixed(1) || '0'}%
                    </div>
                    <div className="text-xs text-white/60 uppercase">
                      {selectedPlatform} Coverage
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={`mt-2 px-2 py-1 inline-block rounded-full text-xs font-bold ${
                currentData?.status === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/50' :
                currentData?.status === 'WARNING' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' :
                'bg-green-500/20 text-green-400 border border-green-500/50'
              }`}>
                {currentData?.status || 'UNKNOWN'}
              </div>
            </div>
          </div>

          {/* Regional Status */}
          <div className="bg-black border border-purple-500/30 rounded-xl p-3 flex-1">
            <h3 className="text-xs font-bold text-purple-400 mb-2 uppercase tracking-wider flex items-center gap-1">
              <Radar className="w-3 h-3" />
              Regional Status (Real Data)
            </h3>
            
            <div className="space-y-1.5 text-xs max-h-64 overflow-y-auto">
              {regionSummary.map((region, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-2 bg-black/50 rounded border border-white/10 hover:border-cyan-500/50 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                      region.status === 'critical' ? 'bg-red-400' :
                      region.status === 'warning' ? 'bg-yellow-400' :
                      'bg-green-400'
                    }`} />
                    <span className="text-white font-medium">{region.name}</span>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${
                      region.coverage < 30 ? 'text-red-400' :
                      region.coverage < 60 ? 'text-yellow-400' :
                      'text-green-400'
                    }`}>
                      {region.coverage.toFixed(1)}%
                    </div>
                    <div className="text-[9px] text-gray-400">
                      {(region.totalAssets / 1000).toFixed(0)}K assets
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-black border border-cyan-500/30 rounded-lg p-2">
              <Eye className="w-4 h-4 text-cyan-400 mb-1" />
              <div className="text-lg font-bold text-cyan-400">
                {currentData ? (currentData.covered / 1000).toFixed(1) + 'K' : '0K'}
              </div>
              <div className="text-xs text-white/60">Monitored</div>
            </div>
            <div className="bg-black border border-red-500/30 rounded-lg p-2">
              <Shield className="w-4 h-4 text-red-400 mb-1" />
              <div className="text-lg font-bold text-red-400">
                {currentData ? (currentData.missing / 1000).toFixed(1) + 'K' : '0K'}
              </div>
              <div className="text-xs text-white/60">Vulnerable</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalView;