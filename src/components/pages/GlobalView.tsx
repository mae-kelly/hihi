import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Globe, AlertTriangle, Eye, Database, Shield, TrendingDown, Activity, Server, Clock, Target, AlertCircle, X, ChevronRight, Maximize2, Cpu, Network, Cloud, BarChart3 } from 'lucide-react';

const GlobalView = () => {
  const [cmdbData, setCmdbData] = useState(null);
  const [taniumData, setTaniumData] = useState(null);
  const [infrastructureData, setInfrastructureData] = useState(null);
  const [regionData, setRegionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('registration');
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedInfraType, setSelectedInfraType] = useState(null);
  const [hoveredElement, setHoveredElement] = useState(null);
  const [drillDownData, setDrillDownData] = useState(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [hostSearchResults, setHostSearchResults] = useState(null);
  
  // 3D Refs
  const globeRef = useRef(null);
  const threatMapRef = useRef(null);
  const pulseRadarRef = useRef(null);
  const visibilityMatrixRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const markersRef = useRef([]);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  // Fetch ALL relevant data from Flask API
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        const [
          cmdbResponse,
          taniumResponse,
          infrastructureResponse,
          regionResponse,
          dbStatusResponse,
          advancedResponse
        ] = await Promise.all([
          fetch('http://localhost:5000/api/cmdb_presence'),
          fetch('http://localhost:5000/api/tanium_coverage'),
          fetch('http://localhost:5000/api/infrastructure_type_metrics'),
          fetch('http://localhost:5000/api/region_metrics'),
          fetch('http://localhost:5000/api/database_status'),
          fetch('http://localhost:5000/api/advanced_analytics')
        ]);

        const cmdb = await cmdbResponse.json();
        const tanium = await taniumResponse.json();
        const infrastructure = await infrastructureResponse.json();
        const region = await regionResponse.json();
        const dbStatus = await dbStatusResponse.json();
        const advanced = await advancedResponse.json();

        setCmdbData(cmdb);
        setTaniumData(tanium);
        setInfrastructureData(infrastructure);
        setRegionData(region);
        setDrillDownData(advanced);

      } catch (error) {
        console.error('Critical data fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
    const interval = setInterval(fetchAllData, 15000);
    return () => clearInterval(interval);
  }, []);

  // Search for specific hosts
  const searchHosts = async (query) => {
    try {
      const response = await fetch(`http://localhost:5000/api/host_search?q=${query}`);
      const data = await response.json();
      setHostSearchResults(data);
      return data;
    } catch (error) {
      console.error('Host search error:', error);
      return null;
    }
  };

  // Interactive 3D Globe with Threat Visualization
  useEffect(() => {
    if (!globeRef.current || !regionData || !cmdbData || loading) return;

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
      50, 
      globeRef.current.clientWidth / globeRef.current.clientHeight, 
      0.1, 
      1000
    );
    cameraRef.current = camera;
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    rendererRef.current = renderer;
    
    renderer.setSize(globeRef.current.clientWidth, globeRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    globeRef.current.appendChild(renderer.domElement);

    // Create layered globe representing CMDB coverage
    const globeRadius = 80;
    
    // Inner core - registered assets
    const coreGeometry = new THREE.SphereGeometry(globeRadius * 0.7, 32, 32);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: 0x00d4ff,
      emissive: 0x00d4ff,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.9
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);
    
    // Outer shell - total assets with gaps
    const shellGeometry = new THREE.SphereGeometry(globeRadius, 64, 64);
    const shellMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float cmdbCoverage;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vec2 uv = vUv;
          
          // Create gap pattern based on coverage
          float gaps = step(cmdbCoverage / 100.0, sin(uv.x * 20.0) * sin(uv.y * 20.0));
          
          vec3 registeredColor = vec3(0.0, 0.83, 1.0);
          vec3 unregisteredColor = vec3(0.66, 0.33, 0.97);
          
          vec3 color = mix(registeredColor, unregisteredColor, gaps);
          
          // Pulse effect for critical areas
          float pulse = sin(time * 3.0) * 0.5 + 0.5;
          if (cmdbCoverage < 50.0) {
            color = mix(color, vec3(1.0, 0.0, 1.0), pulse * 0.3);
          }
          
          // Rim lighting
          float rim = 1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0));
          rim = pow(rim, 2.0);
          
          gl_FragColor = vec4(color + rim * 0.3, 0.3);
        }
      `,
      uniforms: {
        time: { value: 0 },
        cmdbCoverage: { value: cmdbData?.registration_rate || 0 }
      },
      transparent: true,
      side: THREE.DoubleSide
    });
    const shell = new THREE.Mesh(shellGeometry, shellMaterial);
    scene.add(shell);

    // Clear markers
    markersRef.current = [];

    // Regional threat markers based on real data
    const regionCoords = {
      'north america': { lat: 45, lon: -100 },
      'europe': { lat: 50, lon: 10 },
      'emea': { lat: 30, lon: 20 },
      'asia': { lat: 30, lon: 100 },
      'apac': { lat: 10, lon: 120 },
      'latam': { lat: -15, lon: -60 }
    };

    // Create threat beacons for each region
    Object.entries(regionData.region_distribution || {}).forEach(([regionName, count]) => {
      const coords = regionCoords[regionName.toLowerCase()] || { lat: 0, lon: 0 };
      const phi = (90 - coords.lat) * Math.PI / 180;
      const theta = (coords.lon + 180) * Math.PI / 180;
      
      const x = globeRadius * Math.sin(phi) * Math.cos(theta);
      const y = globeRadius * Math.cos(phi);
      const z = globeRadius * Math.sin(phi) * Math.sin(theta);
      
      const regionAnalytics = regionData.region_analytics?.[regionName] || {};
      const percentage = regionAnalytics.percentage || 0;
      
      // Create beacon group
      const beaconGroup = new THREE.Group();
      beaconGroup.position.set(x * 1.1, y * 1.1, z * 1.1);
      
      // Threat level indicator
      const threatLevel = percentage < 40 ? 'CRITICAL' : percentage < 70 ? 'WARNING' : 'SECURE';
      const beaconHeight = 20 + (100 - percentage) * 0.3;
      
      // Beacon cone
      const beaconGeometry = new THREE.ConeGeometry(3, beaconHeight, 4);
      const beaconMaterial = new THREE.MeshPhongMaterial({
        color: threatLevel === 'CRITICAL' ? 0xa855f7 : 
               threatLevel === 'WARNING' ? 0xffaa00 : 0x00d4ff,
        emissive: threatLevel === 'CRITICAL' ? 0xa855f7 : 0x00d4ff,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.8
      });
      const beacon = new THREE.Mesh(beaconGeometry, beaconMaterial);
      beacon.lookAt(0, 0, 0);
      beacon.rotateX(Math.PI);
      beacon.userData = {
        type: 'region',
        region: regionName,
        count: count,
        percentage: percentage,
        threatLevel: threatLevel,
        analytics: regionAnalytics
      };
      markersRef.current.push(beacon);
      beaconGroup.add(beacon);
      
      // Pulse rings for critical regions
      if (threatLevel === 'CRITICAL') {
        for (let i = 0; i < 3; i++) {
          const ringGeometry = new THREE.RingGeometry(5 + i * 3, 6 + i * 3, 32);
          const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xa855f7,
            transparent: true,
            opacity: 0.3 - i * 0.1,
            side: THREE.DoubleSide
          });
          const ring = new THREE.Mesh(ringGeometry, ringMaterial);
          ring.lookAt(x, y, z);
          ring.userData = { isPulse: true, index: i };
          beaconGroup.add(ring);
        }
      }
      
      scene.add(beaconGroup);
    });

    // Threat particles flowing from unregistered areas
    const unregisteredCount = (cmdbData?.total_assets || 0) - (cmdbData?.cmdb_registered || 0);
    const threatParticleCount = Math.min(2000, Math.max(100, unregisteredCount / 50));
    
    const threatGeometry = new THREE.BufferGeometry();
    const threatPositions = new Float32Array(threatParticleCount * 3);
    const threatColors = new Float32Array(threatParticleCount * 3);
    const threatSizes = new Float32Array(threatParticleCount);
    
    for (let i = 0; i < threatParticleCount; i++) {
      const radius = globeRadius + Math.random() * 60;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      threatPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      threatPositions[i * 3 + 1] = radius * Math.cos(phi);
      threatPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      
      // Color based on threat
      threatColors[i * 3] = 0.66;
      threatColors[i * 3 + 1] = 0.33;
      threatColors[i * 3 + 2] = 0.97;
      
      threatSizes[i] = Math.random() * 3 + 1;
    }
    
    threatGeometry.setAttribute('position', new THREE.BufferAttribute(threatPositions, 3));
    threatGeometry.setAttribute('color', new THREE.BufferAttribute(threatColors, 3));
    threatGeometry.setAttribute('size', new THREE.BufferAttribute(threatSizes, 1));
    
    const threatMaterial = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    const threatParticles = new THREE.Points(threatGeometry, threatMaterial);
    scene.add(threatParticles);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    
    const spotLight = new THREE.SpotLight(0x00d4ff, 1);
    spotLight.position.set(100, 100, 100);
    spotLight.target = core;
    scene.add(spotLight);
    
    const pointLight = new THREE.PointLight(0xa855f7, 0.5);
    pointLight.position.set(-100, -50, -100);
    scene.add(pointLight);

    camera.position.set(0, 0, 250);
    camera.lookAt(0, 0, 0);

    // Mouse interaction
    const handleMouseMove = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(markersRef.current);
      
      if (intersects.length > 0) {
        const hoveredMarker = intersects[0].object;
        setHoveredElement(hoveredMarker.userData);
        document.body.style.cursor = 'pointer';
        hoveredMarker.scale.setScalar(1.2);
      } else {
        setHoveredElement(null);
        document.body.style.cursor = 'default';
        markersRef.current.forEach(marker => marker.scale.setScalar(1));
      }
    };

    const handleClick = async (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(markersRef.current);
      
      if (intersects.length > 0) {
        const clickedMarker = intersects[0].object;
        const regionInfo = clickedMarker.userData;
        
        const hostData = await searchHosts(regionInfo.region);
        
        setSelectedRegion({
          ...regionInfo,
          hosts: hostData?.hosts || [],
          totalHosts: hostData?.total_found || 0,
          searchSummary: hostData?.search_summary || {}
        });
        setShowDetailPanel(true);
      }
    };

    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('click', handleClick);

    // Animation loop
    let time = 0;
    const animate = () => {
      time += 0.01;
      
      // Rotate globe
      core.rotation.y += 0.001;
      shell.rotation.y += 0.0005;
      
      // Update shader uniforms
      shellMaterial.uniforms.time.value = time;
      shellMaterial.uniforms.cmdbCoverage.value = cmdbData?.registration_rate || 0;
      
      // Animate threat particles
      threatParticles.rotation.y += 0.0002;
      const positions = threatGeometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += Math.sin(time + i) * 0.1;
      }
      threatGeometry.attributes.position.needsUpdate = true;
      
      // Pulse effect for critical regions
      scene.traverse((child) => {
        if (child.userData?.isPulse) {
          const scale = 1 + Math.sin(time * 3 - child.userData.index) * 0.3;
          child.scale.setScalar(scale);
          child.material.opacity = 0.3 - Math.sin(time * 3 - child.userData.index) * 0.2;
        }
      });
      
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('click', handleClick);
      if (globeRef.current && renderer.domElement) {
        globeRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [cmdbData, regionData, loading]);

  // Threat Radar Visualization
  useEffect(() => {
    const canvas = pulseRadarRef.current;
    if (!canvas || !infrastructureData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let sweepAngle = 0;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) - 20;

    const animate = () => {
      // Fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Radar circles
      for (let i = 1; i <= 4; i++) {
        ctx.strokeStyle = `rgba(0, 212, 255, ${0.1 * i})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, (maxRadius / 4) * i, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Sweep line
      sweepAngle += 0.02;
      const sweepX = centerX + Math.cos(sweepAngle) * maxRadius;
      const sweepY = centerY + Math.sin(sweepAngle) * maxRadius;
      
      const gradient = ctx.createLinearGradient(centerX, centerY, sweepX, sweepY);
      gradient.addColorStop(0, 'rgba(0, 212, 255, 0)');
      gradient.addColorStop(0.5, 'rgba(0, 212, 255, 0.5)');
      gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(sweepX, sweepY);
      ctx.stroke();

      // Plot threats
      const threats = infrastructureData?.detailed_data?.filter(i => i.threat_level === 'CRITICAL') || [];
      threats.slice(0, 10).forEach((threat, index) => {
        const angle = (index / 10) * Math.PI * 2;
        const distance = (100 - threat.percentage) / 100 * maxRadius;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        
        // Threat dot with pulse
        const pulse = Math.sin(Date.now() * 0.003 + index) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(168, 85, 247, ${0.5 + pulse * 0.5})`;
        ctx.beginPath();
        ctx.arc(x, y, 3 + pulse * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Threat label
        if (Math.abs(angle - sweepAngle % (Math.PI * 2)) < 0.1) {
          ctx.fillStyle = '#a855f7';
          ctx.font = '10px monospace';
          ctx.fillText(threat.type?.substring(0, 10), x + 5, y);
        }
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, [infrastructureData]);

  // Visibility Matrix Heat Map
  useEffect(() => {
    const canvas = visibilityMatrixRef.current;
    if (!canvas || !drillDownData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const handleMatrixClick = (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      const cellWidth = canvas.width / 5;
      const cellHeight = canvas.height / 5;
      const col = Math.floor(x / cellWidth);
      const row = Math.floor(y / cellHeight);
      
      const correlations = drillDownData?.correlation_analysis || [];
      const index = row * 5 + col;
      if (correlations[index]) {
        setSelectedInfraType(correlations[index]);
        setShowDetailPanel(true);
      }
    };
    
    canvas.addEventListener('click', handleMatrixClick);

    let time = 0;
    const animate = () => {
      time += 0.02;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const correlations = drillDownData?.correlation_analysis?.slice(0, 25) || [];
      const gridSize = 5;
      const cellWidth = canvas.width / gridSize;
      const cellHeight = canvas.height / gridSize;

      correlations.forEach((item, index) => {
        const row = Math.floor(index / gridSize);
        const col = index % gridSize;
        const x = col * cellWidth;
        const y = row * cellHeight;
        
        const security_score = item.security_score || 0;
        const pulse = Math.sin(time + index * 0.5) * 0.2;
        
        // Cell color based on security score
        let r, g, b;
        if (security_score < 30) {
          r = 168 / 255; g = 85 / 255; b = 247 / 255; // Purple for critical
        } else if (security_score < 70) {
          r = 255 / 255; g = 170 / 255; b = 0 / 255; // Yellow for warning
        } else {
          r = 0 / 255; g = 212 / 255; b = 255 / 255; // Cyan for good
        }
        
        ctx.fillStyle = `rgba(${r * 255}, ${g * 255}, ${b * 255}, ${0.3 + pulse})`;
        ctx.fillRect(x + 2, y + 2, cellWidth - 4, cellHeight - 4);
        
        // Grid lines
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.2)';
        ctx.strokeRect(x, y, cellWidth, cellHeight);
        
        // Score text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${security_score.toFixed(0)}%`, x + cellWidth / 2, y + cellHeight / 2);
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      canvas.removeEventListener('click', handleMatrixClick);
    };
  }, [drillDownData]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
          <div className="mt-3 text-sm font-bold text-cyan-400">INITIALIZING GLOBAL THREAT ANALYSIS</div>
        </div>
      </div>
    );
  }

  // Key metrics
  const registrationRate = cmdbData?.registration_rate || 0;
  const totalAssets = cmdbData?.total_assets || 0;
  const unregisteredAssets = totalAssets - (cmdbData?.cmdb_registered || 0);
  const taniumCoverage = taniumData?.coverage_percentage || 0;
  const criticalInfraTypes = infrastructureData?.detailed_data?.filter(i => i.threat_level === 'CRITICAL')?.length || 0;
  const highRiskRegions = Object.values(regionData?.region_analytics || {}).filter(r => r.percentage < 40).length;

  return (
    <div className="w-full h-full p-3 bg-black relative">
      {/* Critical Alert Bar */}
      {registrationRate < 50 && (
        <div className="mb-3 bg-black border-2 border-purple-500 rounded-xl p-3 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-purple-400" />
              <div>
                <span className="text-purple-400 font-bold text-lg">CRITICAL VISIBILITY FAILURE</span>
                <span className="text-white text-sm ml-3">
                  {unregisteredAssets.toLocaleString()} assets invisible • {highRiskRegions} regions at risk
                </span>
              </div>
            </div>
            <button 
              onClick={() => searchHosts('unregistered').then(data => {
                setHostSearchResults(data);
                setShowDetailPanel(true);
              })}
              className="px-3 py-1 bg-purple-500/20 border border-purple-500 rounded text-purple-400 hover:bg-purple-500/30"
            >
              INVESTIGATE
            </button>
          </div>
        </div>
      )}

      <div className="h-full grid grid-cols-12 gap-3">
        {/* LEFT: Interactive Globe and Threat Radar */}
        <div className="col-span-8 flex flex-col gap-3">
          {/* 3D Globe with Threat Visualization */}
          <div className="flex-1 bg-black/80 border border-cyan-400/30 rounded-xl backdrop-blur-xl relative">
            <div className="flex items-center justify-between p-3 border-b border-cyan-400/20">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  GLOBAL THREAT TOPOLOGY
                </h3>
                <div className="text-xs text-gray-400">
                  Real-time tracking • {totalAssets.toLocaleString()} assets • Click beacons to investigate
                </div>
              </div>
            </div>
            
            <div ref={globeRef} className="h-[350px]" />
            
            {hoveredElement && (
              <div className="absolute bottom-4 left-4 bg-black/95 border border-cyan-400/50 rounded-lg p-3 backdrop-blur-xl">
                <div className="text-sm font-bold text-cyan-400 uppercase">{hoveredElement.region}</div>
                <div className="text-xs text-white mt-1">
                  <div>Assets: {hoveredElement.count?.toLocaleString()}</div>
                  <div>Coverage: {hoveredElement.percentage?.toFixed(1)}%</div>
                  <div className={`font-bold ${
                    hoveredElement.threatLevel === 'CRITICAL' ? 'text-purple-400' :
                    hoveredElement.threatLevel === 'WARNING' ? 'text-yellow-400' :
                    'text-cyan-400'
                  }`}>
                    Status: {hoveredElement.threatLevel}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Grid - Threat Radar and Matrix */}
          <div className="grid grid-cols-2 gap-3" style={{ height: '200px' }}>
            {/* Threat Radar */}
            <div className="bg-black/80 border border-cyan-400/30 rounded-xl p-3 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <Target className="w-3 h-3 text-purple-400" />
                  THREAT RADAR
                </h3>
                <span className="text-xs text-purple-400 font-bold">
                  {criticalInfraTypes} CRITICAL
                </span>
              </div>
              <canvas ref={pulseRadarRef} className="w-full h-[140px]" />
            </div>

            {/* Visibility Matrix */}
            <div className="bg-black/80 border border-cyan-400/30 rounded-xl p-3 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-3 h-3 text-cyan-400" />
                  VISIBILITY MATRIX
                </h3>
                <span className="text-xs text-cyan-400">Click cells</span>
              </div>
              <canvas ref={visibilityMatrixRef} className="w-full h-[140px] cursor-pointer" />
            </div>
          </div>
        </div>

        {/* RIGHT: Metrics and Actions */}
        <div className="col-span-4 flex flex-col gap-3">
          {/* Primary Metrics */}
          <div className="bg-black/80 border-2 border-cyan-400/30 rounded-xl p-3 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-white/60">GLOBAL VISIBILITY STATUS</h3>
              <Database className="w-4 h-4 text-cyan-400" />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div 
                className="cursor-pointer hover:scale-105 transition-transform"
                onClick={() => searchHosts('registered').then(data => {
                  setHostSearchResults(data);
                  setShowDetailPanel(true);
                })}
              >
                <div className="text-3xl font-bold">
                  <span className={registrationRate < 50 ? 'text-purple-400' : registrationRate < 80 ? 'text-yellow-400' : 'text-cyan-400'}>
                    {registrationRate.toFixed(1)}%
                  </span>
                </div>
                <div className="text-xs text-white/60">CMDB COVERAGE</div>
              </div>
              <div 
                className="cursor-pointer hover:scale-105 transition-transform"
                onClick={() => searchHosts('tanium').then(data => {
                  setHostSearchResults(data);
                  setShowDetailPanel(true);
                })}
              >
                <div className="text-3xl font-bold">
                  <span className={taniumCoverage < 50 ? 'text-purple-400' : taniumCoverage < 80 ? 'text-yellow-400' : 'text-cyan-400'}>
                    {taniumCoverage.toFixed(1)}%
                  </span>
                </div>
                <div className="text-xs text-white/60">TANIUM COVERAGE</div>
              </div>
            </div>
            
            {/* Coverage bars */}
            <div className="mt-3 space-y-2">
              <div className="h-2 bg-black rounded-full overflow-hidden">
                <div 
                  className="h-full transition-all duration-1000"
                  style={{
                    width: `${registrationRate}%`,
                    background: registrationRate < 50 
                      ? 'linear-gradient(90deg, #a855f7, #ff00ff)'
                      : registrationRate < 80
                      ? 'linear-gradient(90deg, #ffaa00, #ff8800)'
                      : 'linear-gradient(90deg, #00d4ff, #0099ff)'
                  }}
                />
              </div>
              <div className="h-2 bg-black rounded-full overflow-hidden">
                <div 
                  className="h-full transition-all duration-1000"
                  style={{
                    width: `${taniumCoverage}%`,
                    background: taniumCoverage < 50 
                      ? 'linear-gradient(90deg, #a855f7, #ff00ff)'
                      : taniumCoverage < 80
                      ? 'linear-gradient(90deg, #ffaa00, #ff8800)'
                      : 'linear-gradient(90deg, #00d4ff, #0099ff)'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Threat Summary */}
          <div className="bg-black/80 border border-purple-400/30 rounded-xl p-3 backdrop-blur-xl">
            <h3 className="text-xs font-bold text-purple-400 mb-2">ACTIVE THREATS</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-black/50 rounded p-2">
                <div className="text-2xl font-bold text-purple-400">{unregisteredAssets.toLocaleString()}</div>
                <div className="text-xs text-gray-400">Invisible Assets</div>
              </div>
              <div className="bg-black/50 rounded p-2">
                <div className="text-2xl font-bold text-yellow-400">{criticalInfraTypes}</div>
                <div className="text-xs text-gray-400">Critical Gaps</div>
              </div>
              <div className="bg-black/50 rounded p-2">
                <div className="text-2xl font-bold text-purple-400">{highRiskRegions}</div>
                <div className="text-xs text-gray-400">Risk Regions</div>
              </div>
              <div className="bg-black/50 rounded p-2">
                <div className="text-2xl font-bold text-cyan-400">LIVE</div>
                <div className="text-xs text-gray-400">Monitoring</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-black/80 border border-cyan-400/30 rounded-xl p-3 backdrop-blur-xl">
            <h3 className="text-xs font-bold text-cyan-400 mb-2">QUICK ACTIONS</h3>
            <div className="space-y-2">
              <button 
                onClick={() => {
                  setSelectedMetric('gaps');
                  searchHosts('critical').then(data => {
                    setHostSearchResults(data);
                    setShowDetailPanel(true);
                  });
                }}
                className="w-full text-left p-2 bg-black/50 border border-cyan-400/30 rounded hover:bg-cyan-400/10 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white">Investigate Critical Gaps</span>
                  <ChevronRight className="w-4 h-4 text-cyan-400" />
                </div>
              </button>
              <button 
                onClick={() => {
                  searchHosts('unregistered').then(data => {
                    setHostSearchResults(data);
                    setShowDetailPanel(true);
                  });
                }}
                className="w-full text-left p-2 bg-black/50 border border-purple-400/30 rounded hover:bg-purple-400/10 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white">Find Invisible Assets</span>
                  <ChevronRight className="w-4 h-4 text-purple-400" />
                </div>
              </button>
            </div>
          </div>

          {/* Top Threats List */}
          <div className="flex-1 bg-black/80 border border-cyan-400/30 rounded-xl p-3 backdrop-blur-xl overflow-hidden">
            <h3 className="text-xs font-bold text-white mb-2">TOP VISIBILITY GAPS</h3>
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {infrastructureData?.detailed_data?.sort((a, b) => a.percentage - b.percentage).slice(0, 10).map((infra, idx) => (
                <div 
                  key={idx} 
                  className="flex justify-between items-center p-1.5 bg-black/50 rounded hover:bg-cyan-400/10 cursor-pointer"
                  onClick={() => {
                    searchHosts(infra.type).then(data => {
                      setSelectedInfraType({
                        ...infra,
                        hosts: data?.hosts || []
                      });
                      setShowDetailPanel(true);
                    });
                  }}
                >
                  <span className="text-xs text-white truncate max-w-[150px]">{infra.type}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{infra.frequency.toLocaleString()}</span>
                    <span className={`text-xs font-bold ${
                      infra.percentage < 30 ? 'text-purple-400' :
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
        </div>
      </div>

      {/* Detail Panel */}
      {showDetailPanel && (selectedRegion || selectedInfraType || hostSearchResults) && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-6">
          <div className="bg-black border-2 border-cyan-400/50 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-cyan-400/30 flex items-center justify-between">
              <h2 className="text-xl font-bold text-cyan-400">
                {selectedRegion ? `${selectedRegion.region?.toUpperCase()} THREAT ANALYSIS` :
                 selectedInfraType ? `${selectedInfraType.type?.toUpperCase()} INFRASTRUCTURE` :
                 'SEARCH RESULTS'}
              </h2>
              <button 
                onClick={() => {
                  setShowDetailPanel(false);
                  setSelectedRegion(null);
                  setSelectedInfraType(null);
                  setHostSearchResults(null);
                }}
                className="text-white hover:text-cyan-400 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              {hostSearchResults && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-black/50 border border-cyan-400/30 rounded-lg p-4">
                      <div className="text-2xl font-bold text-white">{hostSearchResults.total_found}</div>
                      <div className="text-xs text-gray-400">Total Hosts Found</div>
                    </div>
                    <div className="bg-black/50 border border-cyan-400/30 rounded-lg p-4">
                      <div className="text-2xl font-bold text-cyan-400">
                        {hostSearchResults.search_summary?.cmdb_registered || 0}
                      </div>
                      <div className="text-xs text-gray-400">CMDB Registered</div>
                    </div>
                    <div className="bg-black/50 border border-cyan-400/30 rounded-lg p-4">
                      <div className="text-2xl font-bold text-purple-400">
                        {hostSearchResults.search_summary?.tanium_deployed || 0}
                      </div>
                      <div className="text-xs text-gray-400">Tanium Protected</div>
                    </div>
                  </div>

                  {hostSearchResults.hosts && hostSearchResults.hosts.length > 0 && (
                    <div className="bg-black/50 border border-cyan-400/30 rounded-lg overflow-hidden">
                      <div className="p-3 border-b border-cyan-400/20">
                        <h3 className="text-sm font-bold text-cyan-400">HOST DETAILS</h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-black/70 sticky top-0">
                            <tr className="border-b border-cyan-400/30">
                              <th className="text-left p-2 text-cyan-400">Host</th>
                              <th className="text-left p-2 text-cyan-400">Region</th>
                              <th className="text-left p-2 text-cyan-400">Infrastructure</th>
                              <th className="text-left p-2 text-cyan-400">CMDB</th>
                              <th className="text-left p-2 text-cyan-400">Tanium</th>
                            </tr>
                          </thead>
                          <tbody>
                            {hostSearchResults.hosts.slice(0, 50).map((host, idx) => (
                              <tr key={idx} className="border-b border-gray-800 hover:bg-cyan-400/5">
                                <td className="p-2 text-white font-mono">{host.host}</td>
                                <td className="p-2 text-gray-400">{host.region}</td>
                                <td className="p-2 text-gray-400">{host.infrastructure_type}</td>
                                <td className="p-2">
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    host.present_in_cmdb?.toLowerCase().includes('yes')
                                      ? 'bg-cyan-500/20 text-cyan-400'
                                      : 'bg-purple-500/20 text-purple-400'
                                  }`}>
                                    {host.present_in_cmdb}
                                  </span>
                                </td>
                                <td className="p-2">
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    host.tanium_coverage?.toLowerCase().includes('tanium')
                                      ? 'bg-cyan-500/20 text-cyan-400'
                                      : 'bg-purple-500/20 text-purple-400'
                                  }`}>
                                    {host.tanium_coverage}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalView;