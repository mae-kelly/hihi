import React, { useState, useEffect, useRef } from 'react';
import { Globe, Database, Server, Cloud, Shield, Activity, Zap, Wifi, Eye, AlertTriangle, TrendingDown, Satellite, Radio, Radar } from 'lucide-react';
import * as THREE from 'three';

const GlobalView: React.FC = () => {
  const [selectedPlatform, setSelectedPlatform] = useState<'csoc' | 'splunk' | 'chronicle'>('csoc');
  const globeRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>(0);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // ACTUAL DATA FROM AO1 REQUIREMENTS
  const globalData = {
    csoc: {
      totalAssets: 262032,
      covered: 50237,
      percentage: 19.17,
      missing: 211795,
      color: '#00ffff',
      glowColor: '#00ccff',
      status: 'CRITICAL',
      trend: -2.3,
    },
    splunk: {
      totalAssets: 262032,
      covered: 167517,
      percentage: 63.93,
      missing: 94515,
      color: '#c084fc',
      glowColor: '#a855f7',
      status: 'WARNING',
      trend: 0.8,
    },
    chronicle: {
      totalAssets: 262032,
      covered: 241691,
      percentage: 92.24,
      missing: 20341,
      color: '#ff00ff',
      glowColor: '#ff00aa',
      status: 'GOOD',
      trend: 3.2,
    }
  };

  const currentData = globalData[selectedPlatform];

  // Regional data with coordinates
  const regions = [
    { name: 'AMERICAS', lat: 40, lon: -100, coverage: 32.5, assets: 105234, status: 'warning' },
    { name: 'EMEA', lat: 50, lon: 10, coverage: 12.3, assets: 89456, status: 'critical' },
    { name: 'APAC', lat: 20, lon: 120, coverage: 15.8, assets: 67342, status: 'critical' },
    { name: 'NORTH POLE', lat: 90, lon: 0, coverage: 95.2, assets: 12, status: 'secure' },
    { name: 'ANTARCTICA', lat: -82, lon: 0, coverage: 88.9, assets: 8, status: 'secure' }
  ];

  // 3D Globe Setup
  useEffect(() => {
    if (!globeRef.current) return;

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
    camera.position.set(0, 0, 300);

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
    const globeGeometry = new THREE.SphereGeometry(100, 64, 64);
    const globeMaterial = new THREE.MeshPhongMaterial({
      color: 0x001122,
      emissive: currentData.color,
      emissiveIntensity: 0.1,
      wireframe: false,
      transparent: true,
      opacity: 0.8,
    });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);

    // Wireframe overlay
    const wireframeGeometry = new THREE.SphereGeometry(101, 32, 32);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: currentData.color,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
    scene.add(wireframe);

    // Add atmosphere glow
    const atmosphereGeometry = new THREE.SphereGeometry(105, 32, 32);
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
          gl_FragColor = vec4(${currentData.color === '#00ffff' ? '0.0, 1.0, 1.0' : 
                              currentData.color === '#c084fc' ? '0.75, 0.52, 0.99' : 
                              '1.0, 0.0, 1.0'}, 1.0) * intensity;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);

    // Data points for regions
    regions.forEach(region => {
      const phi = (90 - region.lat) * (Math.PI / 180);
      const theta = (region.lon + 180) * (Math.PI / 180);
      
      const x = 100 * Math.sin(phi) * Math.cos(theta);
      const y = 100 * Math.cos(phi);
      const z = 100 * Math.sin(phi) * Math.sin(theta);

      // Create beacon
      const beaconGeometry = new THREE.ConeGeometry(3, 10, 4);
      const beaconMaterial = new THREE.MeshPhongMaterial({
        color: region.status === 'critical' ? 0xff0044 : 
               region.status === 'warning' ? 0xffaa00 : 
               0x00ff88,
        emissive: region.status === 'critical' ? 0xff0044 : 
                  region.status === 'warning' ? 0xffaa00 : 
                  0x00ff88,
        emissiveIntensity: 0.5,
      });
      const beacon = new THREE.Mesh(beaconGeometry, beaconMaterial);
      beacon.position.set(x, y, z);
      beacon.lookAt(0, 0, 0);
      scene.add(beacon);

      // Pulse ring
      const ringGeometry = new THREE.RingGeometry(5, 7, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: beaconMaterial.color,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.set(x * 1.1, y * 1.1, z * 1.1);
      ring.lookAt(0, 0, 0);
      scene.add(ring);
    });

    // Particle system for data flow
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 2000;
    const positions = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i += 3) {
      const radius = 110 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = radius * Math.cos(phi);
      positions[i + 2] = radius * Math.sin(phi) * Math.sin(theta);
      
      const color = new THREE.Color(currentData.color);
      colors[i] = color.r;
      colors[i + 1] = color.g;
      colors[i + 2] = color.b;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
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
      
      // Animate particles
      particles.rotation.y -= 0.001;
      
      // Pulse beacons
      scene.children.forEach(child => {
        if (child instanceof THREE.Mesh && child.geometry instanceof THREE.RingGeometry) {
          child.scale.x = 1 + Math.sin(Date.now() * 0.002) * 0.2;
          child.scale.y = 1 + Math.sin(Date.now() * 0.002) * 0.2;
          child.material.opacity = 0.5 - Math.sin(Date.now() * 0.002) * 0.3;
        }
      });
      
      // Camera orbit
      const time = Date.now() * 0.0005;
      camera.position.x = Math.sin(time) * 300 * zoomLevel;
      camera.position.z = Math.cos(time) * 300 * zoomLevel;
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
  }, [selectedPlatform, zoomLevel]);

  return (
    <div className="p-8 min-h-screen bg-black">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20" />
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(0, 255, 255, 0.1) 0%, transparent 50%),
                           radial-gradient(circle at 80% 80%, rgba(192, 132, 252, 0.1) 0%, transparent 50%),
                           radial-gradient(circle at 40% 20%, rgba(255, 0, 255, 0.1) 0%, transparent 50%)`,
          animation: 'pulse 10s ease-in-out infinite'
        }} />
      </div>

      {/* Header */}
      <div className="relative z-20 mb-8">
        <h1 className="text-6xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 animate-pulse">
          GLOBAL QUANTUM SURVEILLANCE MATRIX
        </h1>
        <p className="text-gray-400 uppercase tracking-[0.3em] text-sm">
          CLASSIFICATION: COSMIC TOP SECRET • {currentData.totalAssets.toLocaleString()} ASSETS • YEAR 5000
        </p>
      </div>

      {/* Critical Alert */}
      {selectedPlatform === 'csoc' && (
        <div className="relative z-20 mb-6 border border-red-500/50 bg-red-500/10 rounded-lg p-4 backdrop-blur-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
            <div>
              <span className="text-red-400 font-bold">QUANTUM BREACH DETECTED:</span>
              <span className="text-white ml-2">Timeline corruption at 19.17% - {currentData.missing.toLocaleString()} nodes compromised</span>
            </div>
          </div>
        </div>
      )}

      {/* Platform Selector */}
      <div className="relative z-20 flex gap-2 mb-8">
        {(['csoc', 'splunk', 'chronicle'] as const).map(platform => (
          <button
            key={platform}
            onClick={() => setSelectedPlatform(platform)}
            className={`px-8 py-4 rounded-lg font-bold uppercase tracking-wider transition-all duration-300 backdrop-blur-lg ${
              selectedPlatform === platform
                ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 scale-105 shadow-2xl'
                : 'bg-gray-900/50 hover:bg-gray-800/50'
            }`}
            style={{
              border: selectedPlatform === platform 
                ? `2px solid ${globalData[platform].color}` 
                : '2px solid transparent',
              boxShadow: selectedPlatform === platform 
                ? `0 0 40px ${globalData[platform].glowColor}40, inset 0 0 20px ${globalData[platform].glowColor}20` 
                : 'none'
            }}
          >
            <span style={{ 
              color: selectedPlatform === platform ? globalData[platform].color : '#666',
              textShadow: selectedPlatform === platform ? `0 0 20px ${globalData[platform].glowColor}` : 'none'
            }}>
              {platform.toUpperCase()}
            </span>
          </button>
        ))}
      </div>

      <div className="relative z-10 grid grid-cols-12 gap-6">
        {/* 3D Globe Container */}
        <div className="col-span-8">
          <div className="relative bg-black/80 backdrop-blur-xl rounded-2xl border border-cyan-500/30 overflow-hidden" 
               style={{
                 boxShadow: `0 0 80px ${currentData.glowColor}30, inset 0 0 40px rgba(0,0,0,0.8)`
               }}>
            {/* HUD Overlay */}
            <div className="absolute top-4 left-4 z-10">
              <div className="text-cyan-400 text-xs font-mono space-y-1">
                <div>ORBITAL VIEW: ACTIVE</div>
                <div>QUANTUM ENCRYPTION: AES-5000</div>
                <div>TIMELINE: {new Date().toISOString()}</div>
              </div>
            </div>
            
            <div className="absolute top-4 right-4 z-10 space-y-2">
              <button 
                onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.2))}
                className="block p-2 bg-cyan-500/20 border border-cyan-500/50 rounded hover:bg-cyan-500/30 transition-colors"
              >
                <Zap className="w-4 h-4 text-cyan-400" />
              </button>
              <button 
                onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.2))}
                className="block p-2 bg-cyan-500/20 border border-cyan-500/50 rounded hover:bg-cyan-500/30 transition-colors"
              >
                <Satellite className="w-4 h-4 text-cyan-400" />
              </button>
            </div>

            {/* Globe Viewport */}
            <div ref={globeRef} className="w-full h-[600px]" />
            
            {/* Scanner Line Effect */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan" />
            </div>
          </div>
        </div>

        {/* Metrics Panel */}
        <div className="col-span-4 space-y-6">
          {/* Coverage Meter */}
          <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-6"
               style={{
                 boxShadow: `0 0 60px ${currentData.glowColor}20, inset 0 0 30px rgba(0,0,0,0.8)`
               }}>
            <div className="text-center">
              <div className="relative inline-block">
                <svg className="w-48 h-48 transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke={currentData.color}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 88}`}
                    strokeDashoffset={`${2 * Math.PI * 88 * (1 - currentData.percentage / 100)}`}
                    className="transition-all duration-1000"
                    style={{
                      filter: `drop-shadow(0 0 10px ${currentData.glowColor})`
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div>
                    <div className="text-6xl font-black text-white">
                      {currentData.percentage}%
                    </div>
                    <div className="text-sm text-gray-400 uppercase tracking-wider">
                      Quantum Coverage
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={`mt-4 px-3 py-1 inline-block rounded-full text-sm font-bold ${
                currentData.status === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/50' :
                currentData.status === 'WARNING' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' :
                'bg-green-500/20 text-green-400 border border-green-500/50'
              }`}>
                {currentData.status} PROTOCOL
              </div>
            </div>
          </div>

          {/* Regional Threats */}
          <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-pink-500/30 p-6"
               style={{
                 boxShadow: `0 0 60px rgba(255, 0, 255, 0.2), inset 0 0 30px rgba(0,0,0,0.8)`
               }}>
            <h3 className="text-sm font-bold text-pink-400 mb-4 uppercase tracking-wider flex items-center gap-2">
              <Radar className="w-4 h-4" />
              Regional Quantum States
            </h3>
            
            <div className="space-y-3">
              {regions.map(region => (
                <div 
                  key={region.name}
                  className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-cyan-500/50 transition-all cursor-pointer"
                  onMouseEnter={() => setHoveredCountry(region.name)}
                  onMouseLeave={() => setHoveredCountry(null)}
                  style={{
                    boxShadow: hoveredCountry === region.name ? '0 0 20px rgba(0, 255, 255, 0.3)' : 'none'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${
                      region.status === 'critical' ? 'bg-red-400' :
                      region.status === 'warning' ? 'bg-yellow-400' :
                      'bg-green-400'
                    }`} />
                    <span className="text-white font-medium">{region.name}</span>
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-bold ${
                      region.coverage < 20 ? 'text-red-400' :
                      region.coverage < 50 ? 'text-yellow-400' :
                      'text-green-400'
                    }`}>
                      {region.coverage}%
                    </div>
                    <div className="text-xs text-gray-400">{region.assets.toLocaleString()} nodes</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quantum Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/80 backdrop-blur-xl rounded-xl border border-cyan-500/30 p-4">
              <Eye className="w-6 h-6 text-cyan-400 mb-2" />
              <div className="text-2xl font-bold text-cyan-400">{(currentData.covered / 1000).toFixed(1)}K</div>
              <div className="text-xs text-gray-400">Monitored</div>
            </div>
            <div className="bg-black/80 backdrop-blur-xl rounded-xl border border-red-500/30 p-4">
              <Shield className="w-6 h-6 text-red-400 mb-2" />
              <div className="text-2xl font-bold text-red-400">{(currentData.missing / 1000).toFixed(1)}K</div>
              <div className="text-xs text-gray-400">Vulnerable</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quantum Wave Interference Pattern */}
      <div className="relative z-10 mt-8 bg-black/80 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-6">
        <h3 className="text-sm font-bold text-purple-400 mb-4 uppercase tracking-wider">
          Quantum Wave Interference Analysis
        </h3>
        <div className="h-32 relative overflow-hidden rounded-lg bg-gray-950">
          <svg className="w-full h-full">
            {/* Wave patterns for each platform */}
            <path
              d={`M 0 66 ${Array.from({length: 50}, (_, i) => {
                const x = (i / 49) * 100;
                const y = 50 + Math.sin(i * 0.3) * 20 * (globalData.csoc.percentage / 100);
                return `L ${x}% ${y}%`;
              }).join(' ')}`}
              stroke="#00ffff"
              strokeWidth="2"
              fill="none"
              opacity="0.8"
            />
            <path
              d={`M 0 66 ${Array.from({length: 50}, (_, i) => {
                const x = (i / 49) * 100;
                const y = 50 + Math.sin(i * 0.3 + 2) * 20 * (globalData.splunk.percentage / 100);
                return `L ${x}% ${y}%`;
              }).join(' ')}`}
              stroke="#c084fc"
              strokeWidth="2"
              fill="none"
              opacity="0.8"
            />
            <path
              d={`M 0 66 ${Array.from({length: 50}, (_, i) => {
                const x = (i / 49) * 100;
                const y = 50 + Math.sin(i * 0.3 + 4) * 20 * (globalData.chronicle.percentage / 100);
                return `L ${x}% ${y}%`;
              }).join(' ')}`}
              stroke="#ff00ff"
              strokeWidth="2"
              fill="none"
              opacity="0.8"
            />
          </svg>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export default GlobalView;