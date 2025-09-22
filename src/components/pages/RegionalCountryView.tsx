import React, { useState, useEffect, useRef } from 'react';
import { Globe, MapPin, Eye, AlertTriangle, Activity, Building, Cloud, Server } from 'lucide-react';
import * as THREE from 'three';

const RegionalCountryView: React.FC = () => {
  const [regionalData, setRegionalData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'region' | 'country' | 'datacenter' | 'cloud'>('region');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const globeRef = useRef<HTMLDivElement>(null);
  const heatmapRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/regional_visibility');
        if (!response.ok) throw new Error('Failed to fetch regional data');
        const data = await response.json();
        setRegionalData(data);
      } catch (error) {
        console.error('Error:', error);
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
    if (!globeRef.current || !regionalData) return;

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

    // Location markers based on view mode
    const markers: THREE.Group[] = [];
    const connections: THREE.Line[] = [];
    
    const getLocationData = () => {
      switch (viewMode) {
        case 'region':
          return regionalData.regional_breakdown || [];
        case 'country':
          return regionalData.country_breakdown || [];
        case 'datacenter':
          return regionalData.datacenter_breakdown || [];
        case 'cloud':
          return regionalData.cloud_region_breakdown || [];
        default:
          return [];
      }
    };

    const getCoordinates = (location: any) => {
      // Map location names to approximate coordinates
      const regionCoords: Record<string, { lat: number; lon: number }> = {
        'north america': { lat: 45, lon: -100 },
        'europe': { lat: 50, lon: 10 },
        'asia pacific': { lat: 25, lon: 105 },
        'asia': { lat: 30, lon: 90 },
        'latin america': { lat: -15, lon: -60 },
        'middle east': { lat: 25, lon: 45 },
        'africa': { lat: 0, lon: 20 },
        'oceania': { lat: -25, lon: 135 }
      };

      const countryCoords: Record<string, { lat: number; lon: number }> = {
        'us': { lat: 40, lon: -100 },
        'united states': { lat: 40, lon: -100 },
        'uk': { lat: 51, lon: 0 },
        'de': { lat: 51, lon: 10 },
        'jp': { lat: 35, lon: 139 },
        'cn': { lat: 35, lon: 105 },
        'au': { lat: -25, lon: 135 },
        'ca': { lat: 60, lon: -95 },
        'br': { lat: -15, lon: -47 },
        'in': { lat: 20, lon: 77 }
      };

      const cloudRegions: Record<string, { lat: number; lon: number }> = {
        'us-east-1': { lat: 39, lon: -77 },
        'us-west-2': { lat: 45, lon: -122 },
        'eu-west-1': { lat: 53, lon: -6 },
        'ap-southeast-1': { lat: 1, lon: 103 },
        'ap-northeast-1': { lat: 35, lon: 139 }
      };

      const name = location.region || location.country || location.data_center || location.cloud_region || '';
      const lowerName = name.toLowerCase();
      
      return regionCoords[lowerName] || 
             countryCoords[lowerName] || 
             cloudRegions[lowerName] || 
             { lat: Math.random() * 180 - 90, lon: Math.random() * 360 - 180 };
    };

    const locationData = getLocationData();
    
    locationData.forEach((location: any, index: number) => {
      const coords = getCoordinates(location);
      const phi = (90 - coords.lat) * (Math.PI / 180);
      const theta = (coords.lon + 180) * (Math.PI / 180);
      
      const x = globeRadius * Math.sin(phi) * Math.cos(theta);
      const y = globeRadius * Math.cos(phi);
      const z = globeRadius * Math.sin(phi) * Math.sin(theta);
      
      // Create marker group
      const markerGroup = new THREE.Group();
      markerGroup.position.set(x * 1.05, y * 1.05, z * 1.05);
      
      // Marker cone
      const markerSize = Math.log(location.total_hosts / 1000 + 1) * 2;
      const markerGeometry = new THREE.ConeGeometry(markerSize, markerSize * 2, 8);
      const markerMaterial = new THREE.MeshPhongMaterial({
        color: location.status === 'CRITICAL' ? 0xa855f7 :
               location.status === 'WARNING' ? 0xffaa00 : 0x00d4ff,
        emissive: location.status === 'CRITICAL' ? 0xa855f7 : 0x00d4ff,
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
        color: location.visibility_percentage < 30 ? 0xa855f7 : 0x00d4ff,
        transparent: true,
        opacity: location.visibility_percentage / 100,
        side: THREE.DoubleSide
      });
      
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.lookAt(x, y, z);
      markerGroup.add(ring);
      
      // Pulse effect for critical locations
      if (location.status === 'CRITICAL') {
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

    // Add connections between locations
    if (viewMode === 'region' && markers.length > 1) {
      for (let i = 0; i < markers.length - 1; i++) {
        for (let j = i + 1; j < Math.min(i + 3, markers.length); j++) {
          const start = markers[i].position;
          const end = markers[j].position;
          
          // Create curved connection
          const mid = new THREE.Vector3(
            (start.x + end.x) / 2,
            (start.y + end.y) / 2,
            (start.z + end.z) / 2
          );
          mid.multiplyScalar(1.2);
          
          const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
          const points = curve.getPoints(50);
          const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
          
          const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x00d4ff,
            transparent: true,
            opacity: 0.3,
            linewidth: 1
          });
          
          const line = new THREE.Line(lineGeometry, lineMaterial);
          connections.push(line);
          scene.add(line);
        }
      }
    }

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
    const handleMouseDown = (e: MouseEvent) => {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: MouseEvent) => {
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

    const handleWheel = (e: WheelEvent) => {
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
      
      // Rotate markers
      markers.forEach(markerGroup => {
        markerGroup.rotation.y = rotation.y;
        markerGroup.rotation.x = rotation.x;
        
        // Animate pulse
        markerGroup.children.forEach(child => {
          if (child.userData.isPulse) {
            const scale = 1 + Math.sin(Date.now() * 0.003) * 0.3;
            child.scale.setScalar(scale);
          }
        });
      });
      
      // Rotate connections
      connections.forEach(connection => {
        connection.rotation.y = rotation.y;
        connection.rotation.x = rotation.x;
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
  }, [regionalData, viewMode, rotation, zoom, isDragging]);

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

      const data = viewMode === 'region' ? regionalData.regional_breakdown :
                  viewMode === 'country' ? regionalData.country_breakdown :
                  viewMode === 'datacenter' ? regionalData.datacenter_breakdown :
                  regionalData.cloud_region_breakdown || [];

      const barHeight = canvas.height / Math.min(data.length, 10);
      
      data.slice(0, 10).forEach((item: any, index: number) => {
        const y = index * barHeight;
        const width = (canvas.width - 150) * (item.visibility_percentage / 100);
        
        // Bar gradient
        const gradient = ctx.createLinearGradient(0, y, width, y);
        if (item.status === 'CRITICAL') {
          gradient.addColorStop(0, '#a855f7');
          gradient.addColorStop(1, '#ff00ff');
        } else if (item.status === 'WARNING') {
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
          (item.region || item.country || item.data_center || item.cloud_region || '').substring(0, 20),
          5,
          y + barHeight / 2
        );
        
        // Percentage
        ctx.fillStyle = item.status === 'CRITICAL' ? '#a855f7' : '#00d4ff';
        ctx.fillText(`${item.visibility_percentage.toFixed(1)}%`, width + 5, y + barHeight / 2);
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, [regionalData, viewMode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
          <div className="mt-4 text-lg font-bold text-cyan-400">MAPPING GLOBAL VISIBILITY</div>
        </div>
      </div>
    );
  }

  if (!regionalData) return null;

  const currentData = viewMode === 'region' ? regionalData.regional_breakdown :
                      viewMode === 'country' ? regionalData.country_breakdown :
                      viewMode === 'datacenter' ? regionalData.datacenter_breakdown :
                      regionalData.cloud_region_breakdown || [];

  const avgVisibility = currentData.reduce((sum: number, item: any) => sum + item.visibility_percentage, 0) / currentData.length || 0;
  const criticalCount = currentData.filter((item: any) => item.status === 'CRITICAL').length;

  return (
    <div className="h-full flex flex-col p-4">
      {/* Critical Alert */}
      {avgVisibility < 30 && (
        <div className="mb-3 bg-black border border-purple-500/50 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-purple-400 animate-pulse" />
            <span className="text-purple-400 font-bold text-sm">CRITICAL:</span>
            <span className="text-white text-sm">
              {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} visibility at {avgVisibility.toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 grid grid-cols-12 gap-4">
        {/* Interactive Globe */}
        <div className="col-span-8">
          <div className="h-full glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-cyan-400">GEOGRAPHIC VISIBILITY MAP</h2>
              <div className="flex gap-2">
                {[
                  { key: 'region', label: 'REGIONS', icon: Globe },
                  { key: 'country', label: 'COUNTRIES', icon: MapPin },
                  { key: 'datacenter', label: 'DATA CENTERS', icon: Building },
                  { key: 'cloud', label: 'CLOUD', icon: Cloud }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setViewMode(key as any)}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 transition-all ${
                      viewMode === key
                        ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-400'
                        : 'bg-gray-900/50 border border-gray-700 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {label}
                  </button>
                ))}
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
                  <span className="text-gray-400">Good</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span className="text-gray-400">Warning</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-gray-400">Critical</span>
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
                  <span className={avgVisibility < 30 ? 'text-purple-400' : avgVisibility < 60 ? 'text-yellow-400' : 'text-cyan-400'}>
                    {avgVisibility.toFixed(1)}%
                  </span>
                </div>
                <div className="text-xs text-gray-400 uppercase">Avg Visibility</div>
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
            <h3 className="text-sm font-bold text-purple-400 mb-2">VISIBILITY HEATMAP</h3>
            <canvas ref={heatmapRef} className="w-full h-48" />
          </div>

          {/* Location Cards */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {currentData.slice(0, 10).map((item: any) => (
              <div
                key={item.region || item.country || item.data_center || item.cloud_region}
                className={`glass-panel rounded-lg p-3 cursor-pointer transition-all hover:scale-102 ${
                  selectedLocation === (item.region || item.country || item.data_center || item.cloud_region)
                    ? 'border-cyan-400'
                    : ''
                }`}
                onClick={() => setSelectedLocation(item.region || item.country || item.data_center || item.cloud_region)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-white">
                      {(item.region || item.country || item.data_center || item.cloud_region || '').substring(0, 25)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {item.total_hosts.toLocaleString()} hosts
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${
                      item.status === 'CRITICAL' ? 'text-purple-400' :
                      item.status === 'WARNING' ? 'text-yellow-400' :
                      'text-cyan-400'
                    }`}>
                      {item.visibility_percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
                
                {/* Visibility Bar */}
                <div className="mt-2 h-2 bg-black/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${item.visibility_percentage}%`,
                      background: item.status === 'CRITICAL' 
                        ? 'linear-gradient(90deg, #a855f7, #ff00ff)'
                        : item.status === 'WARNING'
                        ? 'linear-gradient(90deg, #ffaa00, #ff8800)'
                        : 'linear-gradient(90deg, #00d4ff, #0099ff)'
                    }}
                  />
                </div>
                
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-xs text-cyan-400">
                    <Eye className="w-3 h-3 inline mr-1" />
                    {item.visible_hosts.toLocaleString()} visible
                  </span>
                  <span className={`text-xs font-bold ${
                    item.status === 'CRITICAL' ? 'text-purple-400' :
                    item.status === 'WARNING' ? 'text-yellow-400' :
                    'text-cyan-400'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Best/Worst Locations */}
          {regionalData.worst_visibility_region && regionalData.best_visibility_region && (
            <div className="glass-panel rounded-xl p-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">BEST</span>
                  <span className="text-xs font-bold text-cyan-400">
                    {regionalData.best_visibility_region.region} - {regionalData.best_visibility_region.visibility_percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">WORST</span>
                  <span className="text-xs font-bold text-purple-400">
                    {regionalData.worst_visibility_region.region} - {regionalData.worst_visibility_region.visibility_percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegionalCountryView;