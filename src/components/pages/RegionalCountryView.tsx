import React, { useState, useEffect, useRef } from 'react';
import { Globe, MapPin, Eye, AlertTriangle, Activity, Building, Cloud, Server } from 'lucide-react';
import * as THREE from 'three';

const RegionalCountryView = () => {
  const [regionalData, setRegionalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const globeRef = useRef(null);
  const heatmapRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/region_metrics');
        
        if (!response.ok) {
          throw new Error('Failed to fetch regional data');
        }

        const data = await response.json();

        // Transform the API data into a more usable format
        const regionalBreakdown = Object.entries(data.region_distribution || {}).map(([region, count]) => {
          const analytics = data.region_analytics?.[region] || {};
          return {
            region: region,
            count: count,
            percentage: analytics.percentage || ((count / (data.total_analyzed || 1)) * 100),
            details: analytics.details || [],
            // Calculate a security score based on percentage
            security_score: analytics.percentage || 50,
            status: analytics.percentage < 30 ? 'CRITICAL' : 
                   analytics.percentage < 60 ? 'WARNING' : 'GOOD'
          };
        }).sort((a, b) => b.count - a.count);

        setRegionalData({
          regional_breakdown: regionalBreakdown,
          total_analyzed: data.total_analyzed || 0,
          raw_regions: data.raw_regions || [],
          region_analytics: data.region_analytics || {},
          region_distribution: data.region_distribution || {}
        });

      } catch (error) {
        console.error('Error:', error);
        setRegionalData({
          regional_breakdown: [],
          total_analyzed: 0,
          raw_regions: [],
          region_analytics: {},
          region_distribution: {}
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Interactive 3D Globe with visibility heat map
  useEffect(() => {
    if (!globeRef.current || !regionalData || loading) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.001);
    
    const camera = new THREE.PerspectiveCamera(
      60, 
      globeRef.current.clientWidth / globeRef.current.clientHeight, 
      0.1, 
      1000
    );
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    
    renderer.setSize(globeRef.current.clientWidth, globeRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    globeRef.current.appendChild(renderer.domElement);

    // Create globe
    const globeRadius = 100;
    const globeGeometry = new THREE.SphereGeometry(globeRadius, 64, 64);
    const globeMaterial = new THREE.MeshPhongMaterial({
      color: 0x001122,
      emissive: 0x00d4ff,
      emissiveIntensity: 0.02,
      transparent: true,
      opacity: 0.9
    });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);

    // Add wireframe
    const wireGeometry = new THREE.SphereGeometry(globeRadius + 0.5, 32, 32);
    const wireMaterial = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      wireframe: true,
      transparent: true,
      opacity: 0.15
    });
    const wireframe = new THREE.Mesh(wireGeometry, wireMaterial);
    scene.add(wireframe);

    // Location markers based on regional data
    const markers = [];
    
    const regionCoords = {
      'north america': { lat: 45, lon: -100 },
      'na': { lat: 45, lon: -100 },
      'us': { lat: 40, lon: -100 },
      'usa': { lat: 40, lon: -100 },
      'united states': { lat: 40, lon: -100 },
      'canada': { lat: 60, lon: -95 },
      'mexico': { lat: 23, lon: -102 },
      'europe': { lat: 50, lon: 10 },
      'emea': { lat: 30, lon: 20 },
      'uk': { lat: 54, lon: -2 },
      'germany': { lat: 51, lon: 10 },
      'france': { lat: 46, lon: 2 },
      'asia pacific': { lat: 25, lon: 105 },
      'asia': { lat: 30, lon: 90 },
      'apac': { lat: 10, lon: 120 },
      'japan': { lat: 36, lon: 138 },
      'china': { lat: 35, lon: 105 },
      'india': { lat: 20, lon: 77 },
      'australia': { lat: -25, lon: 133 },
      'latin america': { lat: -15, lon: -60 },
      'latam': { lat: -15, lon: -60 },
      'brazil': { lat: -14, lon: -51 },
      'middle east': { lat: 25, lon: 45 },
      'africa': { lat: 0, lon: 20 },
      'oceania': { lat: -25, lon: 135 }
    };
    
    regionalData.regional_breakdown.forEach((location, index) => {
      const coords = regionCoords[location.region.toLowerCase()] || 
                    { lat: Math.random() * 180 - 90, lon: Math.random() * 360 - 180 };
      
      const phi = (90 - coords.lat) * (Math.PI / 180);
      const theta = (coords.lon + 180) * (Math.PI / 180);
      
      const x = globeRadius * Math.sin(phi) * Math.cos(theta);
      const y = globeRadius * Math.cos(phi);
      const z = globeRadius * Math.sin(phi) * Math.sin(theta);
      
      // Create marker group
      const markerGroup = new THREE.Group();
      markerGroup.position.set(x * 1.05, y * 1.05, z * 1.05);
      
      // Marker cone - size based on count/assets
      const assetCount = location.count || 1;
      const markerSize = Math.max(3, Math.min(10, Math.log(assetCount / 100 + 1) * 3));
      const markerGeometry = new THREE.ConeGeometry(markerSize, markerSize * 2, 8);
      
      // Color based on security score or percentage
      const score = location.security_score || location.percentage || 0;
      const markerMaterial = new THREE.MeshPhongMaterial({
        color: score < 30 ? 0xa855f7 :
               score < 60 ? 0xffaa00 : 0x00d4ff,
        emissive: score < 30 ? 0xa855f7 : 0x00d4ff,
        emissiveIntensity: 0.3
      });
      
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.lookAt(0, 0, 0);
      marker.rotateX(Math.PI);
      markerGroup.add(marker);
      
      // Visibility ring
      const ringRadius = markerSize * 2;
      const ringGeometry = new THREE.RingGeometry(ringRadius, ringRadius + 1, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: score < 30 ? 0xa855f7 : 0x00d4ff,
        transparent: true,
        opacity: score / 100,
        side: THREE.DoubleSide
      });
      
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.lookAt(x, y, z);
      markerGroup.add(ring);
      
      // Pulse effect for critical locations
      if (score < 30) {
        const pulseGeometry = new THREE.SphereGeometry(markerSize * 3, 16, 16);
        const pulseMaterial = new THREE.MeshBasicMaterial({
          color: 0xa855f7,
          transparent: true,
          opacity: 0.2,
          wireframe: true
        });
        const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
        pulse.userData = { isPulse: true };
        markerGroup.add(pulse);
      }
      
      markerGroup.userData = location;
      markers.push(markerGroup);
      scene.add(markerGroup);
    });

    // Add data flow particles
    const particleCount = 500;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();
      const radius = globeRadius + Math.random() * 50;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi);
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      
      colors[i * 3] = 0;
      colors[i * 3 + 1] = 0.83;
      colors[i * 3 + 2] = 1;
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
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const pointLight1 = new THREE.PointLight(0x00d4ff, 1, 500);
    pointLight1.position.set(200, 200, 200);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0xa855f7, 0.5, 500);
    pointLight2.position.set(-200, -100, -200);
    scene.add(pointLight2);

    camera.position.set(0, 0, 300);
    camera.lookAt(0, 0, 0);

    // Mouse controls
    const handleMouseDown = (e) => {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      setRotation(prev => ({
        x: prev.x + deltaY * 0.01,
        y: prev.y - deltaX * 0.01
      }));
      
      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleWheel = (e) => {
      e.preventDefault();
      setZoom(prev => Math.max(0.5, Math.min(2, prev + e.deltaY * -0.001)));
    };

    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('wheel', handleWheel);

    // Animation
    const animate = () => {
      // Rotate globe
      globe.rotation.y = rotation.y;
      globe.rotation.x = rotation.x;
      wireframe.rotation.y = rotation.y;
      wireframe.rotation.x = rotation.x;
      
      // Rotate markers with globe
      markers.forEach(markerGroup => {
        // Keep markers facing outward
        const pos = markerGroup.position.clone();
        pos.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation.y);
        pos.applyAxisAngle(new THREE.Vector3(1, 0, 0), rotation.x);
        markerGroup.position.copy(pos);
        
        // Animate pulse
        markerGroup.children.forEach(child => {
          if (child.userData.isPulse) {
            const scale = 1 + Math.sin(Date.now() * 0.003) * 0.3;
            child.scale.setScalar(scale);
          }
        });
      });
      
      // Animate particles
      particles.rotation.y += 0.0005;
      
      // Apply zoom
      camera.position.z = 300 / zoom;
      
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    
    animate();

    return () => {
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      
      if (globeRef.current && renderer.domElement) {
        globeRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [regionalData, rotation, zoom, isDragging, loading]);

  // Visibility Heatmap
  useEffect(() => {
    const canvas = heatmapRef.current;
    if (!canvas || !regionalData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const data = regionalData.regional_breakdown || [];
      const barHeight = canvas.height / Math.min(data.length, 10);
      
      data.slice(0, 10).forEach((item, index) => {
        const y = index * barHeight;
        const score = item.percentage || 0;
        const width = (canvas.width - 150) * (score / 100);
        
        // Bar gradient
        const gradient = ctx.createLinearGradient(0, y, width, y);
        if (score < 30) {
          gradient.addColorStop(0, '#a855f7');
          gradient.addColorStop(1, '#ff00ff');
        } else if (score < 60) {
          gradient.addColorStop(0, '#ffaa00');
          gradient.addColorStop(1, '#ff8800');
        } else {
          gradient.addColorStop(0, '#00d4ff');
          gradient.addColorStop(1, '#0099ff');
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, y + 5, width, barHeight - 10);
        
        // Location name
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(
          item.region.substring(0, 20),
          5,
          y + barHeight / 2
        );
        
        // Score/Percentage
        ctx.fillStyle = score < 30 ? '#a855f7' : '#00d4ff';
        ctx.fillText(`${score.toFixed(1)}%`, width + 5, y + barHeight / 2);
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, [regionalData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
          <div className="mt-4 text-lg font-bold text-cyan-400">ANALYZING REGIONAL VISIBILITY</div>
        </div>
      </div>
    );
  }

  if (!regionalData) return null;

  const avgScore = regionalData.regional_breakdown.reduce((sum, item) => sum + (item.percentage || 0), 0) / 
                  Math.max(regionalData.regional_breakdown.length, 1) || 0;
  const criticalCount = regionalData.regional_breakdown.filter(item => item.status === 'CRITICAL').length;
  const totalAssets = regionalData.total_analyzed || 0;
  const regionCount = regionalData.regional_breakdown.length;

  return (
    <div className="h-full flex flex-col p-4">
      {/* Critical Alert */}
      {avgScore < 30 && (
        <div className="mb-3 bg-black border border-purple-500/50 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-purple-400 animate-pulse" />
            <span className="text-purple-400 font-bold text-sm">CRITICAL:</span>
            <span className="text-white text-sm">
              Regional visibility at {avgScore.toFixed(1)}% - {criticalCount} critical regions
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 grid grid-cols-12 gap-4">
        {/* Interactive Globe */}
        <div className="col-span-8">
          <div className="h-full glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold text-cyan-400 flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  REGIONAL HOST DISTRIBUTION
                </h2>
                <div className="text-xs text-gray-400">
                  Tracking {totalAssets.toLocaleString()} assets across {regionCount} regions
                </div>
              </div>
            </div>
            
            <div ref={globeRef} className="w-full" style={{ height: 'calc(100% - 80px)' }} />
            
            <div className="mt-3 flex items-center justify-between text-xs">
              <div className="text-gray-400">
                🖱️ Drag to rotate • Scroll to zoom
              </div>
              <div className="flex gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  <span className="text-gray-400">Good (&gt;60%)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span className="text-gray-400">Warning (30-60%)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-gray-400">Critical (&lt;30%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Metrics */}
        <div className="col-span-4 space-y-3">
          {/* Summary Stats */}
          <div className="glass-panel rounded-xl p-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-3xl font-bold">
                  <span className={avgScore < 30 ? 'text-purple-400' : avgScore < 60 ? 'text-yellow-400' : 'text-cyan-400'}>
                    {avgScore.toFixed(1)}%
                  </span>
                </div>
                <div className="text-xs text-gray-400 uppercase">Avg Coverage</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-400">
                  {criticalCount}
                </div>
                <div className="text-xs text-gray-400 uppercase">Critical</div>
              </div>
            </div>
          </div>

          {/* Visibility Heatmap */}
          <div className="glass-panel rounded-xl p-3">
            <h3 className="text-sm font-bold text-purple-400 mb-2">REGIONAL VISIBILITY HEATMAP</h3>
            <canvas ref={heatmapRef} className="w-full h-48" />
          </div>

          {/* Region Cards */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {regionalData.regional_breakdown.slice(0, 10).map((item, index) => {
              const name = item.region || 'Unknown';
              const score = item.percentage || 0;
              const count = item.count || 0;
              
              return (
                <div
                  key={`region-${index}`}
                  className={`glass-panel rounded-lg p-3 cursor-pointer transition-all hover:scale-102 ${
                    selectedLocation === name ? 'border-cyan-400' : ''
                  }`}
                  onClick={() => setSelectedLocation(name)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-white truncate max-w-[180px] uppercase">
                        {name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {count.toLocaleString()} hosts
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${
                        score < 30 ? 'text-purple-400' :
                        score < 60 ? 'text-yellow-400' :
                        'text-cyan-400'
                      }`}>
                        {score.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  {/* Coverage Bar */}
                  <div className="mt-2 h-2 bg-black/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${score}%`,
                        background: score < 30 
                          ? 'linear-gradient(90deg, #a855f7, #ff00ff)'
                          : score < 60
                          ? 'linear-gradient(90deg, #ffaa00, #ff8800)'
                          : 'linear-gradient(90deg, #00d4ff, #0099ff)'
                      }}
                    />
                  </div>
                  
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-xs text-cyan-400">
                      <Eye className="w-3 h-3 inline mr-1" />
                      {score.toFixed(1)}% visibility
                    </span>
                    <span className={`text-xs font-bold ${
                      item.status === 'CRITICAL' ? 'text-purple-400' :
                      item.status === 'WARNING' ? 'text-yellow-400' :
                      'text-cyan-400'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  {/* Additional details for selected item */}
                  {selectedLocation === name && item.details && item.details.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/10 text-xs">
                      <div className="text-gray-400">Top infrastructure types:</div>
                      {item.details.slice(0, 3).map((detail, idx) => (
                        <div key={idx} className="text-gray-500">
                          • {detail.infrastructure || 'Unknown'}: {detail.frequency || 0}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Regional Summary */}
          <div className="glass-panel rounded-xl p-3">
            <h3 className="text-sm font-bold text-white mb-2">REGIONAL SUMMARY</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">TOTAL REGIONS</span>
                <span className="text-xs font-bold text-white">{regionCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">TOTAL ASSETS</span>
                <span className="text-xs font-bold text-cyan-400">{totalAssets.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">CRITICAL REGIONS</span>
                <span className="text-xs font-bold text-purple-400">{criticalCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">AVG VISIBILITY</span>
                <span className={`text-xs font-bold ${
                  avgScore < 30 ? 'text-purple-400' :
                  avgScore < 60 ? 'text-yellow-400' :
                  'text-cyan-400'
                }`}>
                  {avgScore.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegionalCountryView;