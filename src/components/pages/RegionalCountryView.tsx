import React, { useState, useEffect, useRef } from 'react';
import { Globe, MapPin, AlertTriangle, TrendingDown, Shield, Activity, Network, Database, Server, Cloud, Radar, Satellite, Radio, Zap, Navigation, Target } from 'lucide-react';
import * as THREE from 'three';

const RegionalCountryView: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [timelinePosition, setTimelinePosition] = useState(50);
  const globeRef = useRef<HTMLDivElement>(null);
  const radarRef = useRef<HTMLCanvasElement>(null);
  const [animatedMetrics, setAnimatedMetrics] = useState<Record<string, number>>({});
  const frameRef = useRef<number>(0);

  // ACTUAL DATA FROM AO1 REQUIREMENTS
  const regionalData = {
    'ALL': {
      totalAssets: 262032,
      csocCoverage: 19.17,
      splunkCoverage: 63.93,
      chronicleCoverage: 92.24,
      criticalGaps: 211795,
      countries: 47,
      datacenters: 23,
      cloudRegions: 12
    },
    'AMERICAS': {
      totalAssets: 105234,
      csocCoverage: 32.5,
      splunkCoverage: 78.9,
      chronicleCoverage: 94.2,
      criticalGaps: 71034,
      countries: 12,
      datacenters: 8,
      cloudRegions: 4,
      color: '#00ffff',
      breakdown: {
        'United States': { assets: 67890, coverage: 45.2, gap: 37244, status: 'warning', lat: 39.0, lon: -98.0 },
        'Canada': { assets: 18234, coverage: 28.7, gap: 12999, status: 'critical', lat: 56.0, lon: -106.0 },
        'Brazil': { assets: 12110, coverage: 22.3, gap: 9409, status: 'critical', lat: -14.0, lon: -51.0 },
        'Mexico': { assets: 7000, coverage: 18.9, gap: 5677, status: 'critical', lat: 23.0, lon: -102.0 }
      }
    },
    'EMEA': {
      totalAssets: 89456,
      csocCoverage: 12.3,
      splunkCoverage: 52.1,
      chronicleCoverage: 89.7,
      criticalGaps: 78456,
      countries: 22,
      datacenters: 9,
      cloudRegions: 5,
      color: '#c084fc',
      breakdown: {
        'United Kingdom': { assets: 23456, coverage: 18.9, gap: 19012, status: 'critical', lat: 54.0, lon: -2.0 },
        'Germany': { assets: 19878, coverage: 15.2, gap: 16855, status: 'critical', lat: 51.0, lon: 10.0 },
        'France': { assets: 15234, coverage: 12.1, gap: 13390, status: 'critical', lat: 46.0, lon: 2.0 },
        'UAE': { assets: 7654, coverage: 8.2, gap: 7027, status: 'critical', lat: 24.0, lon: 54.0 }
      }
    },
    'APAC': {
      totalAssets: 67342,
      csocCoverage: 15.8,
      splunkCoverage: 61.2,
      chronicleCoverage: 93.1,
      criticalGaps: 56632,
      countries: 13,
      datacenters: 6,
      cloudRegions: 3,
      color: '#ff00ff',
      breakdown: {
        'Japan': { assets: 18901, coverage: 22.3, gap: 14685, status: 'critical', lat: 36.0, lon: 138.0 },
        'Singapore': { assets: 14567, coverage: 19.8, gap: 11682, status: 'critical', lat: 1.3, lon: 103.8 },
        'Australia': { assets: 12345, coverage: 17.2, gap: 10222, status: 'critical', lat: -27.0, lon: 133.0 },
        'India': { assets: 10234, coverage: 12.1, gap: 8995, status: 'critical', lat: 20.0, lon: 77.0 }
      }
    }
  };

  const currentRegion = regionalData[selectedRegion] || regionalData['ALL'];

  // 3D Globe Visualization
  useEffect(() => {
    if (!globeRef.current) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0003);

    const camera = new THREE.PerspectiveCamera(
      45,
      globeRef.current.clientWidth / globeRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 80, 280);

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(globeRef.current.clientWidth, globeRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    globeRef.current.appendChild(renderer.domElement);

    // Globe
    const globeGeometry = new THREE.IcosahedronGeometry(80, 4);
    const globeMaterial = new THREE.MeshPhongMaterial({
      color: 0x001122,
      emissive: 0x00ffff,
      emissiveIntensity: 0.05,
      wireframe: false,
      transparent: true,
      opacity: 0.7,
      flatShading: true
    });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);

    // Wireframe overlay
    const wireframeGeometry = new THREE.IcosahedronGeometry(81, 4);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      wireframe: true,
      transparent: true,
      opacity: 0.2
    });
    const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
    scene.add(wireframe);

    // Regional platforms
    const platforms: THREE.Mesh[] = [];
    
    if (selectedRegion !== 'ALL') {
      const regionData = regionalData[selectedRegion];
      if (regionData && regionData.breakdown) {
        Object.entries(regionData.breakdown).forEach(([country, data]) => {
          const phi = (90 - data.lat) * (Math.PI / 180);
          const theta = (data.lon + 180) * (Math.PI / 180);
          
          const timeFactor = (timelinePosition - 50) / 50;
          const radius = 82 + data.coverage * 0.3 + timeFactor * 10;
          
          const x = radius * Math.sin(phi) * Math.cos(theta);
          const y = radius * Math.cos(phi);
          const z = radius * Math.sin(phi) * Math.sin(theta);

          // Country platform
          const platformGeometry = new THREE.BoxGeometry(12, data.assets / 2500, 12);
          const platformMaterial = new THREE.MeshPhongMaterial({
            color: data.status === 'critical' ? 0xff00ff : 0xffaa00,
            emissive: data.status === 'critical' ? 0xff00ff : 0xffaa00,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.8
          });
          const platform = new THREE.Mesh(platformGeometry, platformMaterial);
          platform.position.set(x, y, z);
          platform.lookAt(0, 0, 0);
          scene.add(platform);
          platforms.push(platform);
        });
      }
    } else {
      // Show all regions
      ['AMERICAS', 'EMEA', 'APAC'].forEach((regionName, index) => {
        const region = regionalData[regionName as keyof typeof regionalData];
        if (!region || !('breakdown' in region)) return;
        
        const regionLat = index === 0 ? 30 : index === 1 ? 50 : 10;
        const regionLon = index === 0 ? -90 : index === 1 ? 20 : 110;
        
        const phi = (90 - regionLat) * (Math.PI / 180);
        const theta = (regionLon + 180) * (Math.PI / 180);
        
        const radius = 85 + (region.csocCoverage / 100) * 20;
        
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);
        
        const sphereGeometry = new THREE.SphereGeometry(15, 16, 16);
        const sphereMaterial = new THREE.MeshPhongMaterial({
          color: region.color || 0x00ffff,
          emissive: region.color || 0x00ffff,
          emissiveIntensity: 0.3,
          transparent: true,
          opacity: 0.6,
          wireframe: true
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.set(x, y, z);
        scene.add(sphere);
        platforms.push(sphere);
      });
    }

    // Particle field
    const particleCount = 3000;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      const radius = 80 + Math.random() * 80;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = radius * Math.cos(phi);
      positions[i + 2] = radius * Math.sin(phi) * Math.sin(theta);
      
      const colorChoice = Math.random();
      if (colorChoice < 0.33) {
        colors[i] = 0; colors[i + 1] = 1; colors[i + 2] = 1; // Cyan
      } else if (colorChoice < 0.66) {
        colors[i] = 0.75; colors[i + 1] = 0.52; colors[i + 2] = 0.99; // Purple
      } else {
        colors[i] = 1; colors[i + 1] = 0; colors[i + 2] = 1; // Pink
      }
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 1.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00ffff, 1, 300);
    pointLight1.position.set(0, 0, 0);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff00ff, 0.5, 200);
    pointLight2.position.set(-100, 50, 100);
    scene.add(pointLight2);

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      
      const timeSpeed = 0.002 + (timelinePosition / 100) * 0.003;
      globe.rotation.y += timeSpeed;
      wireframe.rotation.y += timeSpeed;
      particles.rotation.y -= timeSpeed * 0.5;
      
      platforms.forEach((platform, index) => {
        const timeFactor = Math.sin(Date.now() * 0.001 + index) * 0.05;
        platform.position.y += timeFactor;
        platform.rotation.x += 0.01;
        platform.rotation.z += 0.005;
      });
      
      const cameraRadius = 280 + (timelinePosition - 50) * 2;
      const cameraTime = Date.now() * 0.0002;
      camera.position.x = Math.sin(cameraTime) * cameraRadius;
      camera.position.z = Math.cos(cameraTime) * cameraRadius;
      camera.position.y = 80 + Math.sin(cameraTime * 2) * 40;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (globeRef.current && renderer.domElement) {
        globeRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [selectedRegion, timelinePosition]);

  // Radar Canvas
  useEffect(() => {
    const canvas = radarRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) - 20;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw radar rings
      for (let i = 1; i <= 4; i++) {
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, (maxRadius / 4) * i, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw radar sweep
      const sweepAngle = (Date.now() * 0.002) % (Math.PI * 2);
      const gradient = ctx.createLinearGradient(
        centerX,
        centerY,
        centerX + Math.cos(sweepAngle) * maxRadius,
        centerY + Math.sin(sweepAngle) * maxRadius
      );
      gradient.addColorStop(0, 'rgba(0, 255, 255, 0)');
      gradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.3)');
      gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(sweepAngle) * maxRadius,
        centerY + Math.sin(sweepAngle) * maxRadius
      );
      ctx.stroke();

      // Plot threats
      if (selectedRegion !== 'ALL' && regionalData[selectedRegion]?.breakdown) {
        Object.entries(regionalData[selectedRegion].breakdown).forEach(([country, data], index) => {
          const angle = (index / 4) * Math.PI * 2;
          const distance = (100 - data.coverage) / 100 * maxRadius;
          const x = centerX + Math.cos(angle) * distance;
          const y = centerY + Math.sin(angle) * distance;

          // Threat blip
          ctx.fillStyle = data.status === 'critical' ? '#ff00ff' : '#ffaa00';
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();

          // Pulse effect
          const pulseRadius = 8 + Math.sin(Date.now() * 0.003 + index) * 4;
          ctx.strokeStyle = data.status === 'critical' ? 'rgba(255, 0, 255, 0.3)' : 'rgba(255, 170, 0, 0.3)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
          ctx.stroke();
        });
      }

      requestAnimationFrame(animate);
    };

    animate();
  }, [selectedRegion]);

  // Animate metrics
  useEffect(() => {
    setTimeout(() => {
      setAnimatedMetrics({
        csoc: currentRegion.csocCoverage,
        splunk: currentRegion.splunkCoverage,
        chronicle: currentRegion.chronicleCoverage
      });
    }, 100);
  }, [selectedRegion]);

  return (
    <div className="p-4 h-full bg-black flex flex-col">
      {/* Critical Alert */}
      <div className="mb-3 border border-red-500/50 bg-red-500/10 rounded-lg p-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
          <div>
            <span className="text-red-400 font-bold text-sm">TERRITORIAL BREACH:</span>
            <span className="text-white ml-2 text-sm">EMEA at 12.3% - 78,456 nodes compromised</span>
          </div>
        </div>
      </div>

      {/* Region Selector */}
      <div className="flex gap-2 mb-3 flex-shrink-0">
        {['ALL', 'AMERICAS', 'EMEA', 'APAC'].map(region => (
          <button
            key={region}
            onClick={() => setSelectedRegion(region)}
            className={`px-4 py-2 rounded-lg font-bold uppercase tracking-wider transition-all text-sm ${
              selectedRegion === region
                ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20'
                : 'bg-gray-900/50 hover:bg-gray-800/50'
            }`}
            style={{
              border: selectedRegion === region ? '2px solid #00ffff' : '2px solid transparent'
            }}
          >
            <span style={{ 
              color: selectedRegion === region ? '#00ffff' : '#666'
            }}>
              {region}
            </span>
          </button>
        ))}
      </div>

      {/* Timeline Controller */}
      <div className="mb-3 bg-black/80 rounded-lg border border-purple-500/30 p-2 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-purple-400 text-xs font-bold">TIMELINE:</span>
          <div className="flex-1">
            <input
              type="range"
              min="0"
              max="100"
              value={timelinePosition}
              onChange={(e) => setTimelinePosition(Number(e.target.value))}
              className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, 
                  #ff00ff 0%, 
                  #ff00ff ${timelinePosition}%, 
                  #333 ${timelinePosition}%, 
                  #333 100%)`
              }}
            />
          </div>
          <div className="text-sm font-mono text-cyan-400">
            T{timelinePosition < 50 ? '-' : '+'}{Math.abs(timelinePosition - 50)}
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-3 min-h-0">
        {/* 3D Globe */}
        <div className="col-span-7">
          <div className="bg-black/80 rounded-xl border border-cyan-500/30 overflow-hidden h-full">
            <div className="p-2 border-b border-cyan-500/20">
              <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                <Globe className="w-3 h-3" />
                Territorial Matrix
              </h3>
            </div>
            <div ref={globeRef} className="w-full h-full" style={{ height: 'calc(100% - 32px)' }} />
          </div>
        </div>

        {/* Metrics & Radar */}
        <div className="col-span-5 flex flex-col gap-3">
          {/* Key Metrics */}
          <div className="bg-black/80 rounded-xl border border-purple-500/30 p-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">{currentRegion.totalAssets.toLocaleString()}</div>
                <div className="text-xs text-gray-400">NODES</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{currentRegion.criticalGaps.toLocaleString()}</div>
                <div className="text-xs text-gray-400">BREACHED</div>
              </div>
            </div>

            {/* Coverage Bars */}
            <div className="space-y-2 mt-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-cyan-400">CSOC</span>
                  <span className="font-mono text-cyan-400">{animatedMetrics.csoc?.toFixed(1) || 0}%</span>
                </div>
                <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${animatedMetrics.csoc || 0}%`,
                      background: animatedMetrics.csoc < 20 ? '#ff00ff' : '#00ffff'
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-purple-400">Splunk</span>
                  <span className="font-mono text-purple-400">{animatedMetrics.splunk?.toFixed(1) || 0}%</span>
                </div>
                <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${animatedMetrics.splunk || 0}%`,
                      background: 'linear-gradient(90deg, #c084fc, #ff00ff)'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Radar Map */}
          <div className="bg-black/80 rounded-xl border border-pink-500/30 overflow-hidden flex-1">
            <div className="p-2 border-b border-pink-500/20">
              <h3 className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1">
                <Radar className="w-3 h-3" />
                Threat Radar
              </h3>
            </div>
            <canvas ref={radarRef} className="w-full h-full" style={{ height: 'calc(100% - 32px)' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegionalCountryView;