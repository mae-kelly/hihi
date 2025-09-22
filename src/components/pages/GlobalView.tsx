import React, { useState, useEffect, useRef } from 'react';
import { Globe, Database, Server, Cloud, Shield, Activity, Zap, Wifi, Eye, AlertTriangle, TrendingDown, Satellite, Radio, Radar } from 'lucide-react';
import * as THREE from 'three';

const GlobalView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalData, setGlobalData] = useState<any>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<'overview' | 'regional' | 'infrastructure'>('overview');
  const globeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const endpoints = [
          '/api/database_status',
          '/api/cmdb_presence',
          '/api/tanium_coverage',
          '/api/region_metrics',
          '/api/infrastructure_type'
        ];

        const responses = await Promise.all(
          endpoints.map(endpoint => 
            fetch(`http://localhost:5000${endpoint}`).then(res => res.json())
          )
        );

        setGlobalData({
          status: responses[0],
          cmdb: responses[1],
          tanium: responses[2],
          regional: responses[3],
          infrastructure: responses[4]
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // 3D Globe visualization with real data
  useEffect(() => {
    if (!globeRef.current || !globalData) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.00025);

    const camera = new THREE.PerspectiveCamera(
      45,
      globeRef.current.clientWidth / globeRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 250);

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(globeRef.current.clientWidth, globeRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    globeRef.current.appendChild(renderer.domElement);

    // Globe based on real coverage
    const coverage = globalData.cmdb?.registration_rate || 0;
    const globeGeometry = new THREE.SphereGeometry(80, 64, 64);
    const globeMaterial = new THREE.MeshPhongMaterial({
      color: coverage < 50 ? 0xff00ff : coverage < 80 ? 0xc084fc : 0x00ffff,
      emissive: coverage < 50 ? 0xff00ff : 0x00ffff,
      emissiveIntensity: 0.1,
      wireframe: false,
      transparent: true,
      opacity: 0.8,
    });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);

    // Add regional indicators from real data
    if (globalData.regional?.regional_analytics) {
      Object.entries(globalData.regional.regional_analytics).forEach(([region, data]: [string, any], index) => {
        const phi = (90 - (index * 30 - 30)) * (Math.PI / 180);
        const theta = (index * 60) * (Math.PI / 180);
        const radius = 85;
        
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);

        const beaconGeometry = new THREE.ConeGeometry(3, 10, 4);
        const beaconMaterial = new THREE.MeshPhongMaterial({
          color: data.security_score < 50 ? 0xff00ff : 0x00ffff,
          emissive: data.security_score < 50 ? 0xff00ff : 0x00ffff,
          emissiveIntensity: 0.5,
        });
        const beacon = new THREE.Mesh(beaconGeometry, beaconMaterial);
        beacon.position.set(x, y, z);
        beacon.lookAt(0, 0, 0);
        scene.add(beacon);
      });
    }

    // Particles based on total assets
    const particleCount = Math.min(2000, globalData.status?.row_count / 100 || 500);
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      const radius = 90 + Math.random() * 40;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = radius * Math.cos(phi);
      positions[i + 2] = radius * Math.sin(phi) * Math.sin(theta);
      
      colors[i] = coverage < 50 ? 1 : 0;
      colors[i + 1] = coverage < 50 ? 0 : 1;
      colors[i + 2] = coverage < 50 ? 1 : 1;
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
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      globe.rotation.y += 0.002;
      particles.rotation.y -= 0.001;
      
      const time = Date.now() * 0.0005;
      camera.position.x = Math.sin(time) * 250;
      camera.position.z = Math.cos(time) * 250;
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
  }, [globalData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400"></div>
          <div className="mt-4 text-xl font-bold text-cyan-400">LOADING DATABASE</div>
          <div className="text-sm text-gray-400">Connecting to Universal CMDB...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center glass-panel rounded-xl p-8">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <div className="text-xl font-bold text-red-400 mb-2">CONNECTION ERROR</div>
          <div className="text-sm text-gray-400">{error}</div>
          <div className="text-xs text-gray-500 mt-2">Make sure Python backend is running on port 5000</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full bg-black flex flex-col">
      {/* Critical Alert based on real data */}
      {globalData?.cmdb?.registration_rate < 50 && (
        <div className="mb-3 bg-black border border-red-500/30 rounded-lg p-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
            <span className="text-red-400 font-bold text-sm">CRITICAL COVERAGE:</span>
            <span className="text-white ml-2 text-sm">
              CMDB at {globalData.cmdb.registration_rate.toFixed(1)}% - {globalData.cmdb.status_breakdown.not_registered.toLocaleString()} assets unregistered
            </span>
          </div>
        </div>
      )}

      {/* Platform Selector */}
      <div className="flex gap-2 mb-3 flex-shrink-0">
        {['overview', 'regional', 'infrastructure'].map(platform => (
          <button
            key={platform}
            onClick={() => setSelectedPlatform(platform as any)}
            className={`px-4 py-2 rounded-lg font-bold uppercase tracking-wider transition-all text-sm ${
              selectedPlatform === platform
                ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20'
                : 'bg-gray-900/50 hover:bg-gray-800/50'
            }`}
            style={{
              border: selectedPlatform === platform ? '2px solid #00ffff' : '2px solid transparent'
            }}
          >
            {platform}
          </button>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-12 gap-3 min-h-0">
        {/* 3D Globe Container */}
        <div className="col-span-8">
          <div className="bg-black border border-cyan-500/30 rounded-xl overflow-hidden h-full">
            <div className="absolute top-2 left-2 z-10 text-cyan-400 text-xs font-mono space-y-0.5">
              <div>UNIVERSAL CMDB ACTIVE</div>
              <div>ASSETS: {globalData?.status?.row_count?.toLocaleString() || '0'}</div>
              <div>CMDB: {globalData?.cmdb?.registration_rate?.toFixed(1) || '0'}%</div>
              <div>TANIUM: {globalData?.tanium?.coverage_percentage?.toFixed(1) || '0'}%</div>
            </div>
            <div ref={globeRef} className="w-full h-full" />
          </div>
        </div>

        {/* Real Metrics Panel */}
        <div className="col-span-4 space-y-3">
          {/* Coverage Meters from Real Data */}
          <div className="bg-black border border-purple-500/30 rounded-xl p-3">
            <h3 className="text-xs font-bold text-purple-400 mb-2 uppercase">System Coverage</h3>
            
            {/* CMDB Coverage */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-cyan-400">CMDB Registration</span>
                <span className="font-mono text-cyan-400">
                  {globalData?.cmdb?.registration_rate?.toFixed(1) || '0'}%
                </span>
              </div>
              <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-cyan-400 to-blue-400"
                  style={{ width: `${globalData?.cmdb?.registration_rate || 0}%` }}
                />
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {globalData?.cmdb?.cmdb_registered?.toLocaleString() || '0'} / {globalData?.cmdb?.total_assets?.toLocaleString() || '0'} assets
              </div>
            </div>

            {/* Tanium Coverage */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-purple-400">Tanium Deployment</span>
                <span className="font-mono text-purple-400">
                  {globalData?.tanium?.coverage_percentage?.toFixed(1) || '0'}%
                </span>
              </div>
              <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-purple-400 to-pink-400"
                  style={{ width: `${globalData?.tanium?.coverage_percentage || 0}%` }}
                />
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {globalData?.tanium?.tanium_deployed?.toLocaleString() || '0'} / {globalData?.tanium?.total_assets?.toLocaleString() || '0'} assets
              </div>
            </div>

            {/* Compliance Status */}
            <div className={`mt-2 px-2 py-1 inline-block rounded-full text-xs font-bold ${
              globalData?.cmdb?.compliance_analysis?.compliance_status === 'COMPLIANT' 
                ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                : globalData?.cmdb?.compliance_analysis?.compliance_status === 'PARTIAL_COMPLIANCE'
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                : 'bg-red-500/20 text-red-400 border border-red-500/50'
            }`}>
              {globalData?.cmdb?.compliance_analysis?.compliance_status || 'UNKNOWN'}
            </div>
          </div>

          {/* Regional Distribution from Real Data */}
          {selectedPlatform === 'regional' && globalData?.regional && (
            <div className="bg-black border border-purple-500/30 rounded-xl p-3 flex-1">
              <h3 className="text-xs font-bold text-purple-400 mb-2 uppercase tracking-wider flex items-center gap-1">
                <Radar className="w-3 h-3" />
                Regional Distribution
              </h3>
              
              <div className="space-y-1.5 text-xs max-h-64 overflow-y-auto">
                {Object.entries(globalData.regional.regional_analytics || {}).map(([region, data]: [string, any]) => (
                  <div 
                    key={region}
                    className="flex items-center justify-between p-2 bg-black/50 rounded border border-white/10 hover:border-cyan-500/50 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                        data.security_score < 50 ? 'bg-red-400' :
                        data.security_score < 75 ? 'bg-yellow-400' :
                        'bg-green-400'
                      }`} />
                      <span className="text-white font-medium capitalize">{region}</span>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${
                        data.security_score < 50 ? 'text-red-400' :
                        data.security_score < 75 ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {data.security_score.toFixed(1)}%
                      </div>
                      <div className="text-[9px] text-gray-400">
                        {data.count.toLocaleString()} assets
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {globalData.regional.threat_assessment && (
                <div className="mt-2 pt-2 border-t border-gray-700">
                  <div className="text-[10px] text-red-400">
                    Highest Risk: {globalData.regional.threat_assessment.highest_risk_region}
                  </div>
                  <div className="text-[10px] text-green-400">
                    Most Secure: {globalData.regional.threat_assessment.most_secure_region}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Infrastructure Types from Real Data */}
          {selectedPlatform === 'infrastructure' && globalData?.infrastructure && (
            <div className="bg-black border border-purple-500/30 rounded-xl p-3 flex-1">
              <h3 className="text-xs font-bold text-purple-400 mb-2 uppercase tracking-wider flex items-center gap-1">
                <Server className="w-3 h-3" />
                Infrastructure Types
              </h3>
              
              <div className="space-y-1.5 text-xs max-h-64 overflow-y-auto">
                {globalData.infrastructure.detailed_data?.slice(0, 10).map((infra: any) => (
                  <div 
                    key={infra.type}
                    className="flex items-center justify-between p-2 bg-black/50 rounded border border-white/10"
                  >
                    <span className="text-white font-medium">{infra.type}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${
                        infra.threat_level === 'CRITICAL' ? 'text-red-400' :
                        infra.threat_level === 'HIGH' ? 'text-orange-400' :
                        infra.threat_level === 'MEDIUM' ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {infra.percentage.toFixed(1)}%
                      </span>
                      <span className="text-[9px] text-gray-400">
                        ({infra.frequency.toLocaleString()})
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {globalData.infrastructure.modernization_analysis && (
                <div className="mt-2 pt-2 border-t border-gray-700">
                  <div className="text-[10px] text-cyan-400">
                    Cloud Adoption: {globalData.infrastructure.modernization_analysis.modernization_percentage.toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-purple-400">
                    Legacy Systems: {globalData.infrastructure.modernization_analysis.legacy_systems?.length || 0}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Key Metrics Summary */}
          {selectedPlatform === 'overview' && (
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-black border border-cyan-500/30 rounded-lg p-2">
                <Database className="w-4 h-4 text-cyan-400 mb-1" />
                <div className="text-lg font-bold text-cyan-400">
                  {(globalData?.status?.row_count / 1000).toFixed(1)}K
                </div>
                <div className="text-xs text-white/60">Total Assets</div>
              </div>
              <div className="bg-black border border-purple-500/30 rounded-lg p-2">
                <Shield className="w-4 h-4 text-purple-400 mb-1" />
                <div className="text-lg font-bold text-purple-400">
                  {globalData?.infrastructure?.total_types || 0}
                </div>
                <div className="text-xs text-white/60">Infra Types</div>
              </div>
              <div className="bg-black border border-green-500/30 rounded-lg p-2">
                <Eye className="w-4 h-4 text-green-400 mb-1" />
                <div className="text-lg font-bold text-green-400">
                  {globalData?.regional?.total_coverage ? (globalData.regional.total_coverage / 1000).toFixed(1) + 'K' : '0'}
                </div>
                <div className="text-xs text-white/60">Monitored</div>
              </div>
              <div className="bg-black border border-red-500/30 rounded-lg p-2">
                <AlertTriangle className="w-4 h-4 text-red-400 mb-1" />
                <div className="text-lg font-bold text-red-400">
                  {globalData?.tanium?.deployment_gaps?.total_unprotected_assets ? 
                    (globalData.tanium.deployment_gaps.total_unprotected_assets / 1000).toFixed(1) + 'K' : '0'}
                </div>
                <div className="text-xs text-white/60">Unprotected</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalView;