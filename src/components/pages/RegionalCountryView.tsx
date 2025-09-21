import React, { useState, useEffect, useRef } from 'react';
import { Globe, MapPin, AlertTriangle, TrendingDown, Shield, Activity, Network, Database, Server, Cloud, Radar, Satellite, Radio, Zap, Navigation, Target } from 'lucide-react';
import * as THREE from 'three';

interface RegionalData {
  global_surveillance: Record<string, number>;
  regional_analytics: Record<string, {
    count: number;
    percentage: number;
    cmdb_coverage: number;
    tanium_coverage: number;
    infrastructure_diversity: number;
    security_score: number;
  }>;
  threat_assessment: {
    highest_risk_region: string;
    most_secure_region: string;
    geographic_balance: number;
  };
  total_coverage: number;
}

interface CountryData {
  total_countries: number;
  country_analysis: Record<string, {
    count: number;
    percentage: number;
    region: string;
    security_score: number;
    threat_level: string;
  }>;
  geographic_concentration: number;
  compliant_regions: string[];
  urgent_infrastructure: string[];
  total_gap_assets: number;
}

const RegionalCountryView: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [regionalData, setRegionalData] = useState<RegionalData | null>(null);
  const [countryData, setCountryData] = useState<CountryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timelinePosition, setTimelinePosition] = useState(50);
  const globeRef = useRef<HTMLDivElement>(null);
  const radarRef = useRef<HTMLCanvasElement>(null);
  const [animatedMetrics, setAnimatedMetrics] = useState<Record<string, number>>({});

  // Fetch real data from Python backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [regionalResponse, countryResponse] = await Promise.all([
          fetch('http://localhost:5000/api/region_metrics'),
          fetch('http://localhost:5000/api/country_metrics')
        ]);

        if (!regionalResponse.ok || !countryResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const regionalResult = await regionalResponse.json();
        const countryResult = await countryResponse.json();
        
        setRegionalData(regionalResult);
        setCountryData(countryResult);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Get current region data
  const currentRegionData = React.useMemo(() => {
    if (!regionalData) return null;
    
    if (selectedRegion === 'ALL') {
      return {
        totalAssets: regionalData.total_coverage,
        coverage: Object.values(regionalData.regional_analytics).reduce((sum, r) => sum + r.security_score, 0) / 
                 Object.keys(regionalData.regional_analytics).length,
        regions: Object.keys(regionalData.regional_analytics).length,
        highestRisk: regionalData.threat_assessment.highest_risk_region,
        mostSecure: regionalData.threat_assessment.most_secure_region
      };
    }
    
    const region = regionalData.regional_analytics[selectedRegion];
    if (!region) return null;
    
    return {
      totalAssets: region.count,
      coverage: region.security_score,
      cmdbCoverage: region.cmdb_coverage,
      taniumCoverage: region.tanium_coverage,
      infrastructureDiversity: region.infrastructure_diversity
    };
  }, [regionalData, selectedRegion]);

  // 3D Globe Visualization with real data
  useEffect(() => {
    if (!globeRef.current || !regionalData || !countryData) return;

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

    // Add regional nodes based on real data
    const platforms: THREE.Mesh[] = [];
    
    if (selectedRegion === 'ALL') {
      // Show all regions
      Object.entries(regionalData.regional_analytics).forEach(([regionName, data], index) => {
        const phi = (90 - (index * 30 - 30)) * (Math.PI / 180);
        const theta = (index * 60) * (Math.PI / 180);
        
        const radius = 85 + (data.security_score / 100) * 20;
        
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);
        
        const sphereGeometry = new THREE.SphereGeometry(10 + data.percentage / 5, 16, 16);
        const sphereMaterial = new THREE.MeshPhongMaterial({
          color: data.security_score < 50 ? 0xff00ff : data.security_score < 75 ? 0xc084fc : 0x00ffff,
          emissive: data.security_score < 50 ? 0xff00ff : 0x00ffff,
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
    } else {
      // Show countries in selected region
      Object.entries(countryData.country_analysis)
        .filter(([_, country]) => country.region === selectedRegion)
        .forEach(([countryName, data], index) => {
          const phi = (90 - (index * 15)) * (Math.PI / 180);
          const theta = (index * 45) * (Math.PI / 180);
          
          const radius = 82 + data.security_score * 0.3;
          
          const x = radius * Math.sin(phi) * Math.cos(theta);
          const y = radius * Math.cos(phi);
          const z = radius * Math.sin(phi) * Math.sin(theta);

          const platformGeometry = new THREE.BoxGeometry(8, data.count / 100, 8);
          const platformMaterial = new THREE.MeshPhongMaterial({
            color: data.threat_level === 'CRITICAL' ? 0xff00ff : 
                   data.threat_level === 'HIGH' ? 0xffaa00 : 
                   0x00ff88,
            emissive: data.threat_level === 'CRITICAL' ? 0xff00ff : 0x00ff88,
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

    // Particle field
    const particleCount = 2000;
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
        colors[i] = 0; colors[i + 1] = 1; colors[i + 2] = 1;
      } else if (colorChoice < 0.66) {
        colors[i] = 0.75; colors[i + 1] = 0.52; colors[i + 2] = 0.99;
      } else {
        colors[i] = 1; colors[i + 1] = 0; colors[i + 2] = 1;
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

    // Animation loop
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      const timeSpeed = 0.002 + (timelinePosition / 100) * 0.003;
      globe.rotation.y += timeSpeed;
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
      if (frameId) cancelAnimationFrame(frameId);
      if (globeRef.current && renderer.domElement) {
        globeRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [regionalData, countryData, selectedRegion, timelinePosition]);

  // Radar Canvas with real threat data
  useEffect(() => {
    const canvas = radarRef.current;
    if (!canvas || !countryData) return;

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

      // Plot threats from urgent infrastructure countries
      countryData.urgent_infrastructure.slice(0, 8).forEach((country, index) => {
        const angle = (index / 8) * Math.PI * 2;
        const countryData = countryData.country_analysis[country];
        if (countryData) {
          const distance = (100 - countryData.security_score) / 100 * maxRadius;
          const x = centerX + Math.cos(angle) * distance;
          const y = centerY + Math.sin(angle) * distance;

          ctx.fillStyle = countryData.threat_level === 'CRITICAL' ? '#ff00ff' : '#ffaa00';
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();

          const pulseRadius = 8 + Math.sin(Date.now() * 0.003 + index) * 4;
          ctx.strokeStyle = countryData.threat_level === 'CRITICAL' ? 
            'rgba(255, 0, 255, 0.3)' : 'rgba(255, 170, 0, 0.3)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, [countryData]);

  // Animate metrics
  useEffect(() => {
    if (currentRegionData) {
      setTimeout(() => {
        setAnimatedMetrics({
          coverage: currentRegionData.coverage,
          cmdb: currentRegionData.cmdbCoverage || 0,
          tanium: currentRegionData.taniumCoverage || 0
        });
      }, 100);
    }
  }, [currentRegionData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400"></div>
          <div className="mt-4 text-xl font-bold text-cyan-400">LOADING REGIONAL DATA</div>
        </div>
      </div>
    );
  }

  if (error || !regionalData || !countryData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center glass-panel rounded-xl p-8">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <div className="text-xl font-bold text-red-400 mb-2">DATA LOAD ERROR</div>
          <div className="text-sm text-gray-400">{error || 'No data available'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full bg-black flex flex-col">
      {/* Critical Alert */}
      {regionalData.threat_assessment.highest_risk_region && (
        <div className="mb-3 border border-red-500/50 bg-red-500/10 rounded-lg p-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
            <div>
              <span className="text-red-400 font-bold text-sm">HIGHEST RISK REGION:</span>
              <span className="text-white ml-2 text-sm">
                {regionalData.threat_assessment.highest_risk_region} - {countryData.total_gap_assets.toLocaleString()} assets at risk
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Region Selector */}
      <div className="flex gap-2 mb-3 flex-shrink-0">
        <button
          onClick={() => setSelectedRegion('ALL')}
          className={`px-4 py-2 rounded-lg font-bold uppercase tracking-wider transition-all text-sm ${
            selectedRegion === 'ALL' ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20' : 'bg-gray-900/50'
          }`}
          style={{ border: selectedRegion === 'ALL' ? '2px solid #00ffff' : '2px solid transparent' }}
        >
          <span style={{ color: selectedRegion === 'ALL' ? '#00ffff' : '#666' }}>ALL</span>
        </button>
        {Object.keys(regionalData.regional_analytics).slice(0, 3).map(region => (
          <button
            key={region}
            onClick={() => setSelectedRegion(region)}
            className={`px-4 py-2 rounded-lg font-bold uppercase tracking-wider transition-all text-sm ${
              selectedRegion === region ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20' : 'bg-gray-900/50'
            }`}
            style={{ border: selectedRegion === region ? '2px solid #00ffff' : '2px solid transparent' }}
          >
            <span style={{ color: selectedRegion === region ? '#00ffff' : '#666' }}>
              {region.substring(0, 10)}
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
                background: `linear-gradient(to right, #ff00ff 0%, #ff00ff ${timelinePosition}%, #333 ${timelinePosition}%, #333 100%)`
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
                Regional Security Matrix (Real Data)
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
                <div className="text-2xl font-bold text-cyan-400">
                  {countryData.total_countries}
                </div>
                <div className="text-xs text-gray-400">COUNTRIES</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">
                  {countryData.urgent_infrastructure.length}
                </div>
                <div className="text-xs text-gray-400">CRITICAL</div>
              </div>
            </div>

            {/* Coverage Bars */}
            {currentRegionData && (
              <div className="space-y-2 mt-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-cyan-400">Security Score</span>
                    <span className="font-mono text-cyan-400">
                      {animatedMetrics.coverage?.toFixed(1) || 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${animatedMetrics.coverage || 0}%`,
                        background: animatedMetrics.coverage < 50 ? '#ff00ff' : '#00ffff'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Radar Map */}
          <div className="bg-black/80 rounded-xl border border-pink-500/30 overflow-hidden flex-1">
            <div className="p-2 border-b border-pink-500/20">
              <h3 className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1">
                <Radar className="w-3 h-3" />
                Threat Radar (Critical Countries)
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