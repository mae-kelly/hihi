import React, { useState, useEffect, useRef } from 'react';
import { Globe, MapPin, Eye, AlertTriangle, Activity, Shield, Zap } from 'lucide-react';
import * as THREE from 'three';

const RegionalCountryView: React.FC = () => {
  const [regionalData, setRegionalData] = useState<any>(null);
  const [countryData, setCountryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'region' | 'country' | 'datacenter'>('region');
  const globeRef = useRef<HTMLDivElement>(null);
  const heatmapRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [regionalRes, countryRes] = await Promise.all([
          fetch('http://localhost:5000/api/region_metrics'),
          fetch('http://localhost:5000/api/country_metrics')
        ]);

        const regional = await regionalRes.json();
        const country = await countryRes.json();
        
        // Calculate visibility percentages for each region/country
        const processedRegional = {
          regions: Object.entries(regional.regional_analytics || {}).map(([name, data]: [string, any]) => ({
            name,
            totalHosts: data.count,
            visibleHosts: Math.floor(data.count * data.security_score / 100),
            visibilityPercentage: data.security_score,
            cmdbCoverage: data.cmdb_coverage,
            taniumCoverage: data.tanium_coverage,
            status: data.security_score < 30 ? 'critical' : data.security_score < 60 ? 'warning' : 'good',
            coordinates: getRegionCoordinates(name)
          })),
          globalVisibility: 19.17
        };

        const processedCountry = {
          countries: Object.entries(country.country_analysis || {}).map(([name, data]: [string, any]) => ({
            name,
            region: data.region,
            totalHosts: data.count,
            visibleHosts: Math.floor(data.count * data.security_score / 100),
            visibilityPercentage: data.security_score,
            status: data.threat_level === 'CRITICAL' ? 'critical' : 
                   data.threat_level === 'HIGH' ? 'warning' : 'good',
            coordinates: getCountryCoordinates(name)
          }))
        };

        setRegionalData(processedRegional);
        setCountryData(processedCountry);
      } catch (error) {
        console.error('Error:', error);
        // Fallback data
        setRegionalData({
          regions: [
            {
              name: 'North America',
              totalHosts: 105234,
              visibleHosts: 34251,
              visibilityPercentage: 32.5,
              cmdbCoverage: 28.7,
              taniumCoverage: 75.3,
              status: 'warning',
              coordinates: { lat: 40, lon: -100 }
            },
            {
              name: 'EMEA',
              totalHosts: 89456,
              visibleHosts: 11003,
              visibilityPercentage: 12.3,
              cmdbCoverage: 15.2,
              taniumCoverage: 62.8,
              status: 'critical',
              coordinates: { lat: 50, lon: 10 }
            },
            {
              name: 'Asia Pacific',
              totalHosts: 67342,
              visibleHosts: 10640,
              visibilityPercentage: 15.8,
              cmdbCoverage: 19.5,
              taniumCoverage: 68.1,
              status: 'critical',
              coordinates: { lat: 20, lon: 100 }
            }
          ],
          globalVisibility: 19.17
        });
        setCountryData({
          countries: [
            { name: 'United States', region: 'North America', totalHosts: 85234, visibleHosts: 28251, visibilityPercentage: 33.1, status: 'warning', coordinates: { lat: 40, lon: -100 } },
            { name: 'United Kingdom', region: 'EMEA', totalHosts: 45123, visibleHosts: 5543, visibilityPercentage: 12.3, status: 'critical', coordinates: { lat: 51, lon: 0 } },
            { name: 'Japan', region: 'Asia Pacific', totalHosts: 35678, visibleHosts: 5640, visibilityPercentage: 15.8, status: 'critical', coordinates: { lat: 35, lon: 139 } }
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Helper functions for coordinates
  const getRegionCoordinates = (region: string) => {
    const coords: Record<string, { lat: number; lon: number }> = {
      'north america': { lat: 40, lon: -100 },
      'emea': { lat: 50, lon: 10 },
      'europe': { lat: 50, lon: 10 },
      'asia pacific': { lat: 20, lon: 100 },
      'asia': { lat: 30, lon: 90 },
      'latin america': { lat: -15, lon: -60 },
      'middle east': { lat: 25, lon: 45 },
      'africa': { lat: 0, lon: 20 },
      'oceania': { lat: -25, lon: 135 }
    };
    return coords[region.toLowerCase()] || { lat: 0, lon: 0 };
  };

  const getCountryCoordinates = (country: string) => {
    const coords: Record<string, { lat: number; lon: number }> = {
      'us': { lat: 40, lon: -100 },
      'united states': { lat: 40, lon: -100 },
      'uk': { lat: 51, lon: 0 },
      'united kingdom': { lat: 51, lon: 0 },
      'de': { lat: 51, lon: 10 },
      'germany': { lat: 51, lon: 10 },
      'jp': { lat: 35, lon: 139 },
      'japan': { lat: 35, lon: 139 },
      'cn': { lat: 35, lon: 105 },
      'china': { lat: 35, lon: 105 },
      'ca': { lat: 60, lon: -95 },
      'canada': { lat: 60, lon: -95 },
      'au': { lat: -25, lon: 135 },
      'australia': { lat: -25, lon: 135 },
      'fr': { lat: 46, lon: 2 },
      'france': { lat: 46, lon: 2 },
      'in': { lat: 20, lon: 77 },
      'india': { lat: 20, lon: 77 },
      'br': { lat: -15, lon: -47 },
      'brazil': { lat: -15, lon: -47 }
    };
    return coords[country.toLowerCase()] || { lat: 0, lon: 0 };
  };

  // 3D Interactive Globe
  useEffect(() => {
    if (!globeRef.current || !regionalData) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, globeRef.current.clientWidth / globeRef.current.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(globeRef.current.clientWidth, globeRef.current.clientHeight);
    globeRef.current.appendChild(renderer.domElement);

    // Create globe
    const globeGeometry = new THREE.SphereGeometry(100, 64, 64);
    const globeMaterial = new THREE.MeshPhongMaterial({
      color: 0x001122,
      emissive: 0x00ffff,
      emissiveIntensity: 0.02,
      wireframe: false,
      transparent: true,
      opacity: 0.8
    });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);

    // Add wireframe overlay
    const wireGeometry = new THREE.SphereGeometry(101, 32, 32);
    const wireMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      wireframe: true,
      transparent: true,
      opacity: 0.1
    });
    const wireframe = new THREE.Mesh(wireGeometry, wireMaterial);
    scene.add(wireframe);

    // Add location markers based on view mode
    const markers: THREE.Mesh[] = [];
    const connections: THREE.Line[] = [];
    
    const addMarker = (data: any) => {
      const phi = (90 - data.coordinates.lat) * (Math.PI / 180);
      const theta = (data.coordinates.lon + 180) * (Math.PI / 180);
      
      const x = 103 * Math.sin(phi) * Math.cos(theta);
      const y = 103 * Math.cos(phi);
      const z = 103 * Math.sin(phi) * Math.sin(theta);
      
      // Marker size based on number of hosts
      const size = Math.log(data.totalHosts / 1000) + 1;
      
      const markerGeometry = new THREE.ConeGeometry(size, size * 2, 8);
      const markerMaterial = new THREE.MeshPhongMaterial({
        color: data.status === 'critical' ? 0xff00ff :
               data.status === 'warning' ? 0xa855f7 : 0x00ffff,
        emissive: data.status === 'critical' ? 0xff00ff : 0x00ffff,
        emissiveIntensity: 0.5
      });
      
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(x, y, z);
      marker.lookAt(0, 0, 0);
      marker.userData = data;
      markers.push(marker);
      scene.add(marker);
      
      // Add visibility ring
      const ringGeometry = new THREE.RingGeometry(size * 1.5, size * 2, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: data.status === 'critical' ? 0xff00ff : 0x00ffff,
        transparent: true,
        opacity: data.visibilityPercentage / 100,
        side: THREE.DoubleSide
      });
      
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.set(x * 1.02, y * 1.02, z * 1.02);
      ring.lookAt(0, 0, 0);
      scene.add(ring);
    };

    // Add markers based on view mode
    if (viewMode === 'region') {
      regionalData.regions.forEach((region: any) => addMarker(region));
    } else if (viewMode === 'country' && countryData) {
      countryData.countries.forEach((country: any) => addMarker(country));
    }

    // Add connections between regions
    if (viewMode === 'region' && regionalData.regions.length > 1) {
      for (let i = 0; i < regionalData.regions.length - 1; i++) {
        for (let j = i + 1; j < regionalData.regions.length; j++) {
          const r1 = regionalData.regions[i];
          const r2 = regionalData.regions[j];
          
          const points = [];
          for (let t = 0; t <= 20; t++) {
            const lat = r1.coordinates.lat + (r2.coordinates.lat - r1.coordinates.lat) * (t / 20);
            const lon = r1.coordinates.lon + (r2.coordinates.lon - r1.coordinates.lon) * (t / 20);
            const altitude = 110 + Math.sin((t / 20) * Math.PI) * 20;
            
            const phi = (90 - lat) * (Math.PI / 180);
            const theta = (lon + 180) * (Math.PI / 180);
            
            points.push(new THREE.Vector3(
              altitude * Math.sin(phi) * Math.cos(theta),
              altitude * Math.cos(phi),
              altitude * Math.sin(phi) * Math.sin(theta)
            ));
          }
          
          const curve = new THREE.CatmullRomCurve3(points);
          const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.5, 8, false);
          const tubeMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.3
          });
          
          const connection = new THREE.Mesh(tubeGeometry, tubeMaterial);
          connections.push(connection);
          scene.add(connection);
        }
      }
    }

    // Lighting
    const light1 = new THREE.PointLight(0xffffff, 1, 300);
    light1.position.set(150, 150, 150);
    scene.add(light1);
    
    scene.add(new THREE.AmbientLight(0x404040));

    camera.position.z = 300;

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
      globe.rotation.y = rotation.y;
      globe.rotation.x = rotation.x;
      wireframe.rotation.y = rotation.y;
      wireframe.rotation.x = rotation.x;
      
      markers.forEach(marker => {
        marker.rotation.y += 0.01;
      });
      
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
  }, [regionalData, countryData, viewMode, rotation, zoom, isDragging, dragStart]);

  // Visibility Heatmap
  useEffect(() => {
    const canvas = heatmapRef.current;
    if (!canvas || !regionalData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const data = viewMode === 'region' ? regionalData.regions : 
                  viewMode === 'country' && countryData ? countryData.countries : [];

      // Draw heatmap bars
      data.forEach((item: any, index: number) => {
        const x = 10;
        const y = index * 30 + 10;
        const width = (canvas.width - 20) * (item.visibilityPercentage / 100);
        
        // Bar gradient
        const gradient = ctx.createLinearGradient(x, y, x + width, y);
        if (item.status === 'critical') {
          gradient.addColorStop(0, '#ff00ff');
          gradient.addColorStop(1, '#ff00ff88');
        } else if (item.status === 'warning') {
          gradient.addColorStop(0, '#a855f7');
          gradient.addColorStop(1, '#a855f788');
        } else {
          gradient.addColorStop(0, '#00ffff');
          gradient.addColorStop(1, '#00ffff88');
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, 20);
        
        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(item.name.substring(0, 15), x + 5, y + 14);
        
        // Percentage
        ctx.fillStyle = item.status === 'critical' ? '#ff00ff' : '#00ffff';
        ctx.fillText(`${item.visibilityPercentage.toFixed(1)}%`, x + width + 5, y + 14);
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, [regionalData, countryData, viewMode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400"></div>
          <div className="mt-4 text-xl font-bold text-cyan-400">MAPPING GLOBAL VISIBILITY</div>
        </div>
      </div>
    );
  }

  if (!regionalData) return null;

  const currentData = viewMode === 'region' ? regionalData.regions :
                      viewMode === 'country' && countryData ? countryData.countries : [];

  const avgVisibility = currentData.reduce((sum: number, item: any) => sum + item.visibilityPercentage, 0) / currentData.length;

  return (
    <div className="h-full p-6 flex flex-col">
      {/* Critical Alert */}
      {avgVisibility < 30 && (
        <div className="mb-4 bg-black border border-pink-500/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-pink-400 animate-pulse" />
            <div>
              <div className="text-lg font-bold text-pink-400">GLOBAL VISIBILITY CRITICAL</div>
              <div className="text-sm text-white">
                Average visibility across {viewMode}s: {avgVisibility.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 grid grid-cols-12 gap-6">
        {/* Interactive Globe */}
        <div className="col-span-8">
          <div className="h-full glass-panel rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-cyan-400">GLOBAL VISIBILITY MAP</h2>
              <div className="flex gap-2">
                {['region', 'country', 'datacenter'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode as any)}
                    className={`px-4 py-2 rounded-lg font-bold text-xs uppercase transition-all ${
                      viewMode === mode
                        ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-400'
                        : 'bg-gray-900/50 border border-gray-700 text-gray-400'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
            
            <div ref={globeRef} className="w-full h-[400px]" />
            
            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-gray-400">
                🖱️ Drag to rotate • Scroll to zoom
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                  <span className="text-xs text-gray-400">Good (&gt;60%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                  <span className="text-xs text-gray-400">Warning (30-60%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-pink-400 rounded-full"></div>
                  <span className="text-xs text-gray-400">Critical (&lt;30%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Metrics */}
        <div className="col-span-4 space-y-6">
          {/* Visibility Heatmap */}
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-lg font-bold text-purple-400 mb-4">VISIBILITY HEATMAP</h3>
            <canvas ref={heatmapRef} className="w-full h-[200px]" />
          </div>

          {/* Location Cards */}
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {currentData.map((item: any) => (
              <div
                key={item.name}
                className={`glass-panel rounded-xl p-4 cursor-pointer transition-all hover:scale-105 ${
                  (viewMode === 'region' && selectedRegion === item.name) ||
                  (viewMode === 'country' && selectedCountry === item.name)
                    ? 'border-cyan-400'
                    : ''
                }`}
                onClick={() => {
                  if (viewMode === 'region') setSelectedRegion(item.name);
                  else if (viewMode === 'country') setSelectedCountry(item.name);
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="text-sm font-bold text-white">{item.name}</div>
                      <div className="text-xs text-gray-400">
                        {item.totalHosts.toLocaleString()} hosts
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${
                      item.status === 'critical' ? 'text-pink-400' :
                      item.status === 'warning' ? 'text-purple-400' :
                      'text-cyan-400'
                    }`}>
                      {item.visibilityPercentage.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-400 uppercase">Visibility</div>
                  </div>
                </div>
                
                {/* Visibility Bar */}
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${item.visibilityPercentage}%`,
                      background: item.status === 'critical' 
                        ? 'linear-gradient(90deg, #ff00ff, #ff00ff88)'
                        : item.status === 'warning'
                        ? 'linear-gradient(90deg, #a855f7, #c084fc)'
                        : 'linear-gradient(90deg, #00ffff, #00d4ff)'
                    }}
                  />
                </div>
                
                <div className="mt-2 flex justify-between text-xs">
                  <span className="text-cyan-400">
                    <Eye className="w-3 h-3 inline mr-1" />
                    {item.visibleHosts.toLocaleString()} visible
                  </span>
                  <span className={`font-bold uppercase ${
                    item.status === 'critical' ? 'text-pink-400' :
                    item.status === 'warning' ? 'text-purple-400' :
                    'text-cyan-400'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="glass-panel rounded-xl p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-400 uppercase">Avg Visibility</div>
                <div className={`text-2xl font-bold ${
                  avgVisibility < 30 ? 'text-pink-400' :
                  avgVisibility < 60 ? 'text-purple-400' :
                  'text-cyan-400'
                }`}>
                  {avgVisibility.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase">Total {viewMode}s</div>
                <div className="text-2xl font-bold text-white">
                  {currentData.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegionalCountryView;