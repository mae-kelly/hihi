import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Globe, AlertTriangle, Eye, Database, Shield, TrendingDown, Activity, Server, Clock, Target, AlertCircle, ChevronDown } from 'lucide-react';

const GlobalView = () => {
  const [cmdbData, setCmdbData] = useState(null);
  const [regionData, setRegionData] = useState(null);
  const [countryData, setCountryData] = useState(null);
  const [infrastructureData, setInfrastructureData] = useState(null);
  const [securityData, setSecurityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('registration');
  const [timeRange, setTimeRange] = useState('24h');
  const [drillDown, setDrillDown] = useState(null);
  const globeRef = useRef(null);
  const criticalGapsRef = useRef(null);
  const trendRef = useRef(null);

  // Fetch ALL relevant data from Flask API
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        // Parallel fetch all endpoints for comprehensive view
        const [
          cmdbResponse,
          regionResponse, 
          countryResponse,
          infrastructureResponse,
          securityResponse,
          dbStatusResponse
        ] = await Promise.all([
          fetch('http://localhost:5000/api/cmdb_presence'),
          fetch('http://localhost:5000/api/region_metrics'),
          fetch('http://localhost:5000/api/country_metrics'),
          fetch('http://localhost:5000/api/infrastructure_type'),
          fetch('http://localhost:5000/api/security_control_coverage'),
          fetch('http://localhost:5000/api/database_status')
        ]);

        const cmdb = await cmdbResponse.json();
        const region = await regionResponse.json();
        const country = await countryResponse.json();
        const infrastructure = await infrastructureResponse.json();
        const security = await securityResponse.json();
        const dbStatus = await dbStatusResponse.json();

        setCmdbData(cmdb);
        setRegionData(region);
        setCountryData(country);
        setInfrastructureData(infrastructure);
        setSecurityData(security);

      } catch (error) {
        console.error('Critical data fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
    const interval = setInterval(fetchAllData, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);

  // 3D Globe with REAL asset distribution
  useEffect(() => {
    if (!globeRef.current || !regionData || !cmdbData || loading) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, globeRef.current.clientWidth / globeRef.current.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(globeRef.current.clientWidth, globeRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    globeRef.current.appendChild(renderer.domElement);

    // Earth with visibility heat map shader
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
        uniform float cmdbCoverage;
        uniform float criticalGaps;
        varying vec2 vUv;
        varying vec3 vNormal;
        
        void main() {
          vec2 uv = vUv;
          
          // Base earth colors
          vec3 baseColor = vec3(0.0, 0.05, 0.1);
          vec3 landColor = vec3(0.0, 0.3, 0.4);
          vec3 gapColor = vec3(1.0, 0.0, 1.0); // Purple for gaps
          vec3 registeredColor = vec3(0.0, 0.8, 1.0); // Cyan for registered
          
          // Continents pattern
          float continents = step(0.3, sin(uv.x * 6.28318) * sin(uv.y * 3.14159));
          vec3 earthColor = mix(baseColor, landColor, continents);
          
          // Visibility heat map based on CMDB coverage
          float visibilityMap = cmdbCoverage / 100.0;
          earthColor = mix(earthColor, registeredColor, visibilityMap * continents);
          
          // Critical gaps pulsing
          float gapPulse = sin(time * 3.0) * 0.5 + 0.5;
          float gapIntensity = (100.0 - cmdbCoverage) / 100.0;
          earthColor = mix(earthColor, gapColor, gapIntensity * gapPulse * 0.3);
          
          // Grid overlay
          float grid = step(0.98, max(sin(uv.x * 80.0), sin(uv.y * 40.0)));
          earthColor += vec3(0.0, 0.8, 1.0) * grid * 0.3;
          
          // Atmosphere rim
          float rim = 1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0));
          rim = pow(rim, 2.0);
          vec3 rimColor = mix(registeredColor, gapColor, gapIntensity);
          
          gl_FragColor = vec4(earthColor + rimColor * rim * 0.5, 1.0);
        }
      `,
      uniforms: {
        time: { value: 0 },
        cmdbCoverage: { value: cmdbData?.registration_rate || 0 },
        criticalGaps: { value: 100 - (cmdbData?.registration_rate || 0) }
      },
      transparent: true
    });
    
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);

    // Add regional markers with REAL data
    const markers = [];
    regionData.regional_analytics?.forEach(region => {
      const regionCoords = {
        'north america': { lat: 45, lon: -100 },
        'europe': { lat: 50, lon: 10 },
        'emea': { lat: 30, lon: 20 },
        'asia': { lat: 30, lon: 100 },
        'apac': { lat: 10, lon: 120 },
        'latam': { lat: -15, lon: -60 }
      };

      const coords = regionCoords[region.region?.toLowerCase()] || { lat: 0, lon: 0 };
      const phi = (90 - coords.lat) * Math.PI / 180;
      const theta = (coords.lon + 180) * Math.PI / 180;
      
      const x = 100 * Math.sin(phi) * Math.cos(theta);
      const y = 100 * Math.cos(phi);
      const z = 100 * Math.sin(phi) * Math.sin(theta);
      
      // Marker size based on ACTUAL asset count
      const markerSize = 2 + Math.log(region.count / 1000 + 1) * 2;
      const markerGeometry = new THREE.SphereGeometry(markerSize, 16, 16);
      
      // Color based on ACTUAL security score
      const markerMaterial = new THREE.MeshBasicMaterial({
        color: region.security_score < 40 ? 0xff00ff : 
               region.security_score < 70 ? 0xffaa00 : 0x00d4ff,
        emissive: region.security_score < 40 ? 0xff00ff : 0x00d4ff,
        emissiveIntensity: 0.5
      });
      
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(x * 1.05, y * 1.05, z * 1.05);
      marker.userData = region;
      markers.push(marker);
      scene.add(marker);
      
      // Pulse for critical regions
      if (region.security_score < 40) {
        const pulseGeometry = new THREE.RingGeometry(markerSize + 2, markerSize + 4, 32);
        const pulseMaterial = new THREE.MeshBasicMaterial({
          color: 0xff00ff,
          transparent: true,
          opacity: 0.3,
          side: THREE.DoubleSide
        });
        const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
        pulse.position.copy(marker.position);
        pulse.lookAt(0, 0, 0);
        pulse.userData = { isPulse: true, baseScale: 1 };
        scene.add(pulse);
      }
    });

    // Add unregistered asset particles
    const unregisteredCount = (cmdbData?.total_assets || 0) - (cmdbData?.cmdb_registered || 0);
    const particleCount = Math.min(5000, Math.max(100, unregisteredCount / 10));
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
      
      // Purple for unregistered assets
      colors[i] = 1;
      colors[i + 1] = 0;
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

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0x00d4ff, 0.5);
    directionalLight.position.set(100, 100, 100);
    scene.add(directionalLight);

    camera.position.set(0, 0, 300);

    // Animation
    const animate = () => {
      earth.rotation.y += 0.001;
      particles.rotation.y += 0.0001;
      
      // Update shader uniforms with real-time data
      earthMaterial.uniforms.time.value = Date.now() * 0.001;
      earthMaterial.uniforms.cmdbCoverage.value = cmdbData?.registration_rate || 0;
      
      // Pulse critical markers
      scene.children.forEach(child => {
        if (child.userData.isPulse) {
          const scale = 1 + Math.sin(Date.now() * 0.003) * 0.3;
          child.scale.setScalar(child.userData.baseScale * scale);
        }
      });
      
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      if (globeRef.current && renderer.domElement) {
        globeRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [cmdbData, regionData, loading]);

  // Critical Gaps Visualization
  useEffect(() => {
    const canvas = criticalGapsRef.current;
    if (!canvas || !cmdbData || !infrastructureData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw critical infrastructure gaps
      const criticalInfra = infrastructureData.detailed_data?.filter(i => i.threat_level === 'CRITICAL') || [];
      
      criticalInfra.slice(0, 5).forEach((infra, index) => {
        const y = (index + 1) * (canvas.height / 6);
        const gapPercentage = 100 - infra.percentage;
        const barWidth = (canvas.width - 100) * (gapPercentage / 100);
        
        // Gap bar
        const gradient = ctx.createLinearGradient(0, y, barWidth, y);
        gradient.addColorStop(0, '#ff00ff');
        gradient.addColorStop(1, '#ff00ff80');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(50, y - 10, barWidth, 20);
        
        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(infra.type?.substring(0, 20) || 'Unknown', 5, y + 3);
        
        // Gap count
        ctx.fillStyle = '#ff00ff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${gapPercentage.toFixed(1)}% GAP`, canvas.width - 5, y + 3);
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, [cmdbData, infrastructureData]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
          <div className="mt-3 text-sm font-bold text-cyan-400">LOADING CRITICAL VISIBILITY DATA</div>
        </div>
      </div>
    );
  }

  // CRITICAL METRICS
  const registrationRate = cmdbData?.registration_rate || 0;
  const totalAssets = cmdbData?.total_assets || 0;
  const registeredAssets = cmdbData?.cmdb_registered || 0;
  const unregisteredAssets = totalAssets - registeredAssets;
  const complianceStatus = cmdbData?.compliance_analysis?.compliance_status || 'CRITICAL';
  const governanceMaturity = cmdbData?.compliance_analysis?.governance_maturity || 'IMMATURE';

  // Regional critical gaps
  const criticalRegions = regionData?.regional_analytics?.filter(r => r.risk_category === 'HIGH') || [];
  const regionWithLowestScore = regionData?.regional_analytics?.reduce((min, r) => 
    r.security_score < min.security_score ? r : min, 
    regionData?.regional_analytics?.[0] || { security_score: 100 }
  );

  // Infrastructure critical gaps
  const criticalInfraTypes = infrastructureData?.detailed_data?.filter(i => i.threat_level === 'CRITICAL') || [];
  const cloudInfra = infrastructureData?.detailed_data?.find(i => i.type?.toLowerCase().includes('cloud'));
  const legacySystems = infrastructureData?.modernization_analysis?.legacy_systems || [];

  // Security control gaps
  const allControlsCoverage = securityData?.all_controls_coverage?.coverage_percentage || 0;
  const unprotectedHosts = totalAssets - (securityData?.all_controls_coverage?.fully_protected_hosts || 0);

  return (
    <div className="w-full h-full p-3 bg-black">
      {/* EXECUTIVE ALERT BANNER */}
      {registrationRate < 50 && (
        <div className="mb-3 bg-black border-2 border-red-500 rounded-xl p-3 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <div>
                <span className="text-red-500 font-bold text-lg">CRITICAL VISIBILITY FAILURE</span>
                <span className="text-white text-sm ml-3">
                  {unregisteredAssets.toLocaleString()} assets ({(100 - registrationRate).toFixed(1)}%) invisible to CMDB
                </span>
              </div>
            </div>
            <div className="text-2xl font-bold text-red-500">
              {registrationRate.toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      <div className="h-full grid grid-cols-12 gap-3">
        {/* LEFT: Globe and Regional Intelligence */}
        <div className="col-span-7 flex flex-col gap-3">
          {/* 3D Globe */}
          <div className="flex-1 bg-black/80 border border-white/10 rounded-xl backdrop-blur-xl">
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  GLOBAL ASSET VISIBILITY - REAL-TIME CMDB STATUS
                </h3>
                <div className="text-xs text-gray-400">
                  Live tracking {totalAssets.toLocaleString()} assets across {regionData?.regional_analytics?.length || 0} regions
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setSelectedMetric('registration')}
                  className={`px-2 py-1 rounded text-xs font-bold ${
                    selectedMetric === 'registration' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-white/60'
                  }`}
                >
                  CMDB
                </button>
                <button 
                  onClick={() => setSelectedMetric('security')}
                  className={`px-2 py-1 rounded text-xs font-bold ${
                    selectedMetric === 'security' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-white/60'
                  }`}
                >
                  SECURITY
                </button>
                <button 
                  onClick={() => setSelectedMetric('compliance')}
                  className={`px-2 py-1 rounded text-xs font-bold ${
                    selectedMetric === 'compliance' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-white/60'
                  }`}
                >
                  COMPLIANCE
                </button>
              </div>
            </div>
            
            <div ref={globeRef} className="h-[400px]" />
            
            {/* Regional Risk Matrix */}
            <div className="p-3 border-t border-white/10">
              <div className="grid grid-cols-3 gap-2 text-xs">
                {regionData?.regional_analytics?.slice(0, 6).map(region => (
                  <div key={region.region} className="bg-black/50 rounded p-2 border border-white/10">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-white">{region.region?.toUpperCase()}</span>
                      <span className={`px-1 py-0.5 rounded text-[9px] font-bold ${
                        region.risk_category === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                        region.risk_category === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {region.risk_category}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Assets:</span>
                        <span className="text-white font-mono">{region.count?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">CMDB:</span>
                        <span className={`font-mono ${region.cmdb_coverage < 50 ? 'text-red-400' : 'text-cyan-400'}`}>
                          {region.cmdb_coverage?.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Security:</span>
                        <span className={`font-mono ${region.security_score < 40 ? 'text-red-400' : 'text-cyan-400'}`}>
                          {region.security_score?.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Critical Infrastructure Gaps */}
          <div className="h-48 bg-black/80 border border-white/10 rounded-xl p-3 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                CRITICAL INFRASTRUCTURE GAPS
              </h3>
              <span className="text-xs text-red-400 font-bold">
                {criticalInfraTypes.length} CRITICAL TYPES
              </span>
            </div>
            <canvas ref={criticalGapsRef} className="w-full h-32" />
          </div>
        </div>

        {/* RIGHT: Critical Metrics and Actions */}
        <div className="col-span-5 flex flex-col gap-3">
          {/* CMDB Registration Critical Status */}
          <div className="bg-black/80 border-2 border-cyan-400/30 rounded-xl p-3 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-white/60">CMDB REGISTRATION STATUS</h3>
              <Database className="w-4 h-4 text-cyan-400" />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-4xl font-bold">
                  <span className={registrationRate < 50 ? 'text-red-400' : registrationRate < 80 ? 'text-yellow-400' : 'text-cyan-400'}>
                    {registrationRate.toFixed(1)}%
                  </span>
                </div>
                <div className="text-xs text-white/60">VISIBILITY RATE</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-red-400">
                  {unregisteredAssets.toLocaleString()}
                </div>
                <div className="text-xs text-white/60">INVISIBLE ASSETS</div>
              </div>
            </div>
            
            <div className="mt-3 space-y-2">
              <div className="h-3 bg-black rounded-full overflow-hidden">
                <div 
                  className="h-full transition-all duration-1000"
                  style={{
                    width: `${registrationRate}%`,
                    background: registrationRate < 50 
                      ? 'linear-gradient(90deg, #ff0044, #ff0044)'
                      : registrationRate < 80
                      ? 'linear-gradient(90deg, #ffaa00, #ff8800)'
                      : 'linear-gradient(90deg, #00d4ff, #00d4ff)'
                  }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-cyan-400">{registeredAssets.toLocaleString()} Registered</span>
                <span className="text-red-400">{unregisteredAssets.toLocaleString()} Missing</span>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-white/10">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-black/50 rounded p-1.5">
                  <div className="text-gray-400">Compliance</div>
                  <div className={`font-bold ${
                    complianceStatus === 'COMPLIANT' ? 'text-green-400' :
                    complianceStatus === 'PARTIAL_COMPLIANCE' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {complianceStatus}
                  </div>
                </div>
                <div className="bg-black/50 rounded p-1.5">
                  <div className="text-gray-400">Maturity</div>
                  <div className={`font-bold ${
                    governanceMaturity === 'MATURE' ? 'text-green-400' :
                    governanceMaturity === 'DEVELOPING' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {governanceMaturity}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Control Coverage */}
          <div className="bg-black/80 border border-white/10 rounded-xl p-3 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-white/60">SECURITY CONTROL GAPS</h3>
              <Shield className="w-4 h-4 text-purple-400" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">EDR Coverage</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-black rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600"
                      style={{ width: `${securityData?.edr_coverage?.coverage_percentage || 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-white">
                    {securityData?.edr_coverage?.coverage_percentage?.toFixed(1) || '0.0'}%
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Tanium Coverage</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-black rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600"
                      style={{ width: `${securityData?.tanium_coverage?.coverage_percentage || 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-white">
                    {securityData?.tanium_coverage?.coverage_percentage?.toFixed(1) || '0.0'}%
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">DLP Coverage</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-black rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600"
                      style={{ width: `${securityData?.dlp_coverage?.coverage_percentage || 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-white">
                    {securityData?.dlp_coverage?.coverage_percentage?.toFixed(1) || '0.0'}%
                  </span>
                </div>
              </div>
              
              <div className="pt-2 mt-2 border-t border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-purple-400">ALL CONTROLS</span>
                  <span className={`text-lg font-bold ${
                    allControlsCoverage < 50 ? 'text-red-400' : 'text-cyan-400'
                  }`}>
                    {allControlsCoverage.toFixed(1)}%
                  </span>
                </div>
                <div className="text-xs text-red-400 mt-1">
                  {unprotectedHosts.toLocaleString()} hosts without full protection
                </div>
              </div>
            </div>
          </div>

          {/* Critical Actions Required */}
          <div className="bg-black/80 border-2 border-red-500/50 rounded-xl p-3 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-red-400">IMMEDIATE ACTIONS REQUIRED</h3>
              <Target className="w-4 h-4 text-red-400 animate-pulse" />
            </div>
            
            <div className="space-y-2">
              {unregisteredAssets > 10000 && (
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5"></div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-white">CMDB Registration</div>
                    <div className="text-xs text-gray-400">
                      Register {unregisteredAssets.toLocaleString()} missing assets immediately
                    </div>
                  </div>
                </div>
              )}
              
              {cloudInfra && cloudInfra.percentage < 30 && (
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5"></div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-white">Cloud Infrastructure</div>
                    <div className="text-xs text-gray-400">
                      Only {cloudInfra.percentage.toFixed(1)}% visibility - Enable CloudTrail and VPC logs
                    </div>
                  </div>
                </div>
              )}
              
              {criticalRegions.length > 0 && (
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5"></div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-white">Regional Gaps</div>
                    <div className="text-xs text-gray-400">
                      {criticalRegions.length} regions at HIGH risk - {regionWithLowestScore?.region} at {regionWithLowestScore?.security_score?.toFixed(0)} score
                    </div>
                  </div>
                </div>
              )}
              
              {legacySystems.length > 3 && (
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1.5"></div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-white">Legacy Systems</div>
                    <div className="text-xs text-gray-400">
                      {legacySystems.length} legacy infrastructure types need modernization
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Top Unregistered Infrastructure Types */}
          <div className="flex-1 bg-black/80 border border-white/10 rounded-xl p-3 backdrop-blur-xl">
            <h3 className="text-xs font-bold text-white/60 mb-2">TOP VISIBILITY GAPS BY TYPE</h3>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {infrastructureData?.detailed_data?.sort((a, b) => a.percentage - b.percentage).slice(0, 5).map(infra => (
                <div key={infra.type} className="flex justify-between items-center p-1.5 bg-black/50 rounded">
                  <span className="text-xs text-white truncate max-w-[150px]">{infra.type}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{infra.frequency.toLocaleString()} hosts</span>
                    <span className={`text-xs font-bold ${
                      infra.percentage < 30 ? 'text-red-400' :
                      infra.percentage < 60 ? 'text-yellow-400' :
                      'text-cyan-400'
                    }`}>
                      {infra.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Metrics */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-black/80 border border-white/10 rounded-lg p-2">
              <Activity className="w-3 h-3 text-cyan-400 mb-1" />
              <div className="text-lg font-bold text-white">{totalAssets.toLocaleString()}</div>
              <div className="text-[9px] text-gray-400">TOTAL ASSETS</div>
            </div>
            <div className="bg-black/80 border border-white/10 rounded-lg p-2">
              <TrendingDown className="w-3 h-3 text-red-400 mb-1" />
              <div className="text-lg font-bold text-red-400">{criticalInfraTypes.length}</div>
              <div className="text-[9px] text-gray-400">CRITICAL GAPS</div>
            </div>
            <div className="bg-black/80 border border-white/10 rounded-lg p-2">
              <Clock className="w-3 h-3 text-yellow-400 mb-1" />
              <div className="text-lg font-bold text-yellow-400">LIVE</div>
              <div className="text-[9px] text-gray-400">MONITORING</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalView;