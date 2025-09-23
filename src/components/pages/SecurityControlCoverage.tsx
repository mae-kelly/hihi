import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Shield, Server, Activity, AlertTriangle, Eye, Database, CheckCircle, XCircle } from 'lucide-react';

const SecurityControlCoverage = () => {
  const [taniumData, setTaniumData] = useState(null);
  const [cmdbData, setCmdbData] = useState(null);
  const [loading, setLoading] = useState(true);
  const fortressRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const frameRef = useRef(null);
  const coverageFlowRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [taniumResponse, cmdbResponse] = await Promise.all([
          fetch('http://localhost:5000/api/tanium_coverage'),
          fetch('http://localhost:5000/api/cmdb_presence')
        ]);

        if (!taniumResponse.ok || !cmdbResponse.ok) {
          throw new Error('Failed to fetch security data');
        }

        const tanium = await taniumResponse.json();
        const cmdb = await cmdbResponse.json();

        setTaniumData(tanium);
        setCmdbData(cmdb);

      } catch (error) {
        console.error('Error:', error);
        setTaniumData({
          coverage_percentage: 0,
          tanium_deployed: 0,
          total_assets: 0,
          deployment_analysis: { coverage_status: 'CRITICAL' },
          regional_coverage: {},
          infrastructure_coverage: {},
          business_unit_coverage: {}
        });
        setCmdbData({
          registration_rate: 0,
          cmdb_registered: 0,
          total_assets: 0,
          compliance_analysis: { compliance_status: 'CRITICAL' },
          regional_compliance: {},
          infrastructure_compliance: {},
          business_unit_compliance: {}
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // 3D Security Fortress
  useEffect(() => {
    if (!fortressRef.current || !taniumData || !cmdbData || loading) return;

    if (rendererRef.current) {
      rendererRef.current.dispose();
      if (fortressRef.current.contains(rendererRef.current.domElement)) {
        fortressRef.current.removeChild(rendererRef.current.domElement);
      }
    }

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x000000, 0.001);

    const camera = new THREE.PerspectiveCamera(
      60,
      fortressRef.current.clientWidth / fortressRef.current.clientHeight,
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    
    rendererRef.current = renderer;
    renderer.setSize(fortressRef.current.clientWidth, fortressRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    fortressRef.current.appendChild(renderer.domElement);

    const fortressGroup = new THREE.Group();
    
    // Base platform
    const platformGeometry = new THREE.CylinderGeometry(70, 80, 10, 64);
    const platformMaterial = new THREE.MeshPhongMaterial({
      color: 0x001122,
      emissive: 0x00d4ff,
      emissiveIntensity: 0.05,
      transparent: true,
      opacity: 0.8
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    fortressGroup.add(platform);

    // Security layers
    const controls = [
      { 
        name: 'Tanium', 
        coverage: taniumData.coverage_percentage || 0,
        deployed: taniumData.tanium_deployed || 0,
        total: taniumData.total_assets || 0,
        height: 40, 
        radius: 55, 
        yPos: 25 
      },
      { 
        name: 'CMDB', 
        coverage: cmdbData.registration_rate || 0,
        deployed: cmdbData.cmdb_registered || 0,
        total: cmdbData.total_assets || 0,
        height: 35, 
        radius: 45, 
        yPos: 55 
      }
    ];

    controls.forEach(control => {
      // Outer ring (total capacity)
      const outerGeometry = new THREE.CylinderGeometry(
        control.radius, 
        control.radius, 
        control.height, 
        32, 1, true
      );
      const outerMaterial = new THREE.MeshPhongMaterial({
        color: 0x111111,
        emissive: control.coverage > 50 ? 0x00d4ff : 0xa855f7,
        emissiveIntensity: 0.1,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      });
      const outerRing = new THREE.Mesh(outerGeometry, outerMaterial);
      outerRing.position.y = control.yPos;
      fortressGroup.add(outerRing);
      
      // Inner cylinder (protected hosts)
      const protectedHeight = control.height * (control.coverage / 100);
      const innerGeometry = new THREE.CylinderGeometry(
        control.radius - 5,
        control.radius - 5,
        protectedHeight,
        32
      );
      const innerMaterial = new THREE.MeshPhongMaterial({
        color: control.coverage > 70 ? 0x00d4ff : control.coverage > 40 ? 0xffaa00 : 0xa855f7,
        emissive: control.coverage > 70 ? 0x00d4ff : control.coverage > 40 ? 0xffaa00 : 0xa855f7,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.9
      });
      const innerCylinder = new THREE.Mesh(innerGeometry, innerMaterial);
      innerCylinder.position.y = control.yPos - (control.height - protectedHeight) / 2;
      fortressGroup.add(innerCylinder);
      
      // Coverage percentage ring
      const ringGeometry = new THREE.RingGeometry(control.radius + 2, control.radius + 4, 64);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: control.coverage > 50 ? 0x00d4ff : 0xa855f7,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = control.yPos;
      fortressGroup.add(ring);
    });

    // Central core (combined coverage)
    const combinedCoverage = ((taniumData.coverage_percentage || 0) + (cmdbData.registration_rate || 0)) / 2;
    const coreGeometry = new THREE.SphereGeometry(15, 32, 32);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: combinedCoverage > 50 ? 0x00d4ff : 0xa855f7,
      emissive: combinedCoverage > 50 ? 0x00d4ff : 0xa855f7,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.9
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.position.y = 90;
    fortressGroup.add(core);

    scene.add(fortressGroup);

    // Threat particles (unprotected hosts)
    const unprotectedTanium = taniumData.total_assets - taniumData.tanium_deployed;
    const unprotectedCMDB = cmdbData.total_assets - cmdbData.cmdb_registered;
    const maxUnprotected = Math.max(unprotectedTanium, unprotectedCMDB);
    const particleCount = Math.min(1000, Math.max(100, maxUnprotected / 100));
    
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 90 + Math.random() * 60;
      const height = Math.random() * 150;
      
      positions[i] = Math.cos(angle) * radius;
      positions[i + 1] = height;
      positions[i + 2] = Math.sin(angle) * radius;
      
      // Purple for threats
      colors[i] = 0.66;
      colors[i + 1] = 0.33;
      colors[i + 2] = 0.97;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
      size: 2,
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

    const pointLight1 = new THREE.PointLight(0x00d4ff, 2, 300);
    pointLight1.position.set(150, 150, 150);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xa855f7, 1, 300);
    pointLight2.position.set(-150, 50, -150);
    scene.add(pointLight2);

    camera.position.set(200, 150, 200);
    camera.lookAt(0, 50, 0);

    // Animation
    const animate = () => {
      if (!sceneRef.current) return;
      frameRef.current = requestAnimationFrame(animate);
      
      fortressGroup.rotation.y += 0.002;
      core.scale.setScalar(1 + Math.sin(Date.now() * 0.001) * 0.1);
      particles.rotation.y += 0.001;
      
      const time = Date.now() * 0.0003;
      camera.position.x = Math.sin(time) * 250;
      camera.position.z = Math.cos(time) * 250;
      camera.lookAt(0, 50, 0);
      
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!fortressRef.current || !camera || !renderer) return;
      camera.aspect = fortressRef.current.clientWidth / fortressRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(fortressRef.current.clientWidth, fortressRef.current.clientHeight);
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (fortressRef.current && fortressRef.current.contains(rendererRef.current.domElement)) {
          fortressRef.current.removeChild(rendererRef.current.domElement);
        }
      }
    };
  }, [taniumData, cmdbData, loading]);

  // Coverage Flow Animation
  useEffect(() => {
    const canvas = coverageFlowRef.current;
    if (!canvas || !taniumData || !cmdbData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let animationId;
    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const controls = [
        { name: 'TANIUM', coverage: taniumData.coverage_percentage || 0, deployed: taniumData.tanium_deployed || 0, total: taniumData.total_assets || 0 },
        { name: 'CMDB', coverage: cmdbData.registration_rate || 0, deployed: cmdbData.cmdb_registered || 0, total: cmdbData.total_assets || 0 }
      ];

      controls.forEach((control, index) => {
        const y = (index + 1) * (canvas.height / 3);
        const barWidth = canvas.width - 100;
        const protectedWidth = barWidth * (control.coverage / 100);
        
        // Background bar
        ctx.fillStyle = 'rgba(168, 85, 247, 0.1)';
        ctx.fillRect(50, y - 15, barWidth, 30);
        
        // Protected portion
        const gradient = ctx.createLinearGradient(50, y, 50 + protectedWidth, y);
        if (control.coverage > 70) {
          gradient.addColorStop(0, '#00d4ff');
          gradient.addColorStop(1, '#0099ff');
        } else if (control.coverage > 40) {
          gradient.addColorStop(0, '#ffaa00');
          gradient.addColorStop(1, '#ff8800');
        } else {
          gradient.addColorStop(0, '#a855f7');
          gradient.addColorStop(1, '#ff00ff');
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(50, y - 15, protectedWidth, 30);
        
        // Control name
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(control.name, 50, y - 20);
        
        // Percentage
        ctx.fillStyle = control.coverage > 50 ? '#00d4ff' : '#a855f7';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${control.coverage.toFixed(1)}%`, canvas.width - 10, y + 5);
        
        // Host counts
        ctx.fillStyle = '#ffffff60';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          `${control.deployed.toLocaleString()} / ${control.total.toLocaleString()} hosts`,
          canvas.width / 2,
          y + 20
        );
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [taniumData, cmdbData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
          <div className="mt-4 text-xl font-bold text-cyan-400">ANALYZING SECURITY CONTROLS</div>
        </div>
      </div>
    );
  }

  const taniumCoverage = taniumData?.coverage_percentage || 0;
  const cmdbCoverage = cmdbData?.registration_rate || 0;
  const combinedCoverage = (taniumCoverage + cmdbCoverage) / 2;
  const totalHosts = Math.max(taniumData?.total_assets || 0, cmdbData?.total_assets || 0);
  const taniumDeployed = taniumData?.tanium_deployed || 0;
  const cmdbRegistered = cmdbData?.cmdb_registered || 0;
  const taniumGaps = taniumData?.deployment_gaps || {};
  const cmdbGaps = cmdbData?.compliance_gaps || {};

  return (
    <div className="h-full flex flex-col p-6 bg-black">
      {combinedCoverage < 50 && (
        <div className="mb-4 bg-purple-500/10 border border-purple-500 rounded-xl p-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-purple-400 animate-pulse" />
            <span className="text-purple-400 font-bold">CRITICAL:</span>
            <span className="text-white">
              Security control coverage at {combinedCoverage.toFixed(1)}% - Tanium: {taniumCoverage.toFixed(1)}%, CMDB: {cmdbCoverage.toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 grid grid-cols-12 gap-6">
        {/* 3D Fortress */}
        <div className="col-span-8">
          <div className="h-full bg-black/90 border border-cyan-400/30 rounded-xl">
            <div className="p-4 border-b border-cyan-400/20">
              <h2 className="text-2xl font-bold text-cyan-400">SECURITY CONTROL FORTRESS</h2>
              <p className="text-sm text-white/60 mt-1">Tanium and CMDB coverage visualization</p>
            </div>
            
            <div ref={fortressRef} className="h-[calc(100%-80px)]" />
          </div>
        </div>

        {/* Metrics Panel */}
        <div className="col-span-4 space-y-4">
          {/* Combined Coverage */}
          <div className="bg-black/90 border border-cyan-400/30 rounded-xl p-4">
            <h3 className="text-lg font-bold text-white mb-3">COMBINED SECURITY COVERAGE</h3>
            <div className="text-5xl font-bold text-center py-4">
              <span className={combinedCoverage < 50 ? 'text-purple-400' : 'text-cyan-400'}>
                {combinedCoverage.toFixed(1)}%
              </span>
            </div>
            <div className="text-center text-sm text-white/60">
              Across {totalHosts.toLocaleString()} hosts
            </div>
            <div className="h-4 bg-black rounded-full overflow-hidden border border-cyan-400/30 mt-3">
              <div 
                className="h-full transition-all duration-1000"
                style={{
                  width: `${combinedCoverage}%`,
                  background: combinedCoverage < 50 
                    ? 'linear-gradient(90deg, #a855f7, #ff00ff)'
                    : 'linear-gradient(90deg, #00d4ff, #0099ff)'
                }}
              />
            </div>
          </div>

          {/* Individual Controls */}
          <div className="space-y-3">
            {/* Tanium */}
            <div className="bg-black/90 border border-cyan-400/30 rounded-xl p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  TANIUM COVERAGE
                </span>
                <span className={`text-xs px-2 py-1 rounded ${
                  taniumData?.deployment_analysis?.coverage_status === 'CRITICAL' 
                    ? 'bg-purple-500/20 text-purple-400'
                    : taniumData?.deployment_analysis?.coverage_status === 'ACCEPTABLE'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-cyan-500/20 text-cyan-400'
                }`}>
                  {taniumData?.deployment_analysis?.coverage_status || 'UNKNOWN'}
                </span>
              </div>
              <div className="text-2xl font-bold text-white">
                {taniumCoverage.toFixed(1)}%
              </div>
              <div className="text-xs text-white/60">
                {taniumDeployed.toLocaleString()} deployed ({(taniumDeployed / totalHosts * 100).toFixed(1)}% of total)
              </div>
              <div className="h-2 bg-black rounded-full overflow-hidden mt-2">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600 transition-all duration-1000"
                  style={{ width: `${taniumCoverage}%` }}
                />
              </div>
              {taniumGaps.total_unprotected_assets > 0 && (
                <div className="mt-2 text-xs text-red-400">
                  Gap: {taniumGaps.total_unprotected_assets.toLocaleString()} unprotected
                </div>
              )}
            </div>

            {/* CMDB */}
            <div className="bg-black/90 border border-cyan-400/30 rounded-xl p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  CMDB REGISTRATION
                </span>
                <span className={`text-xs px-2 py-1 rounded ${
                  cmdbData?.compliance_analysis?.compliance_status === 'NON_COMPLIANT'
                    ? 'bg-purple-500/20 text-purple-400'
                    : cmdbData?.compliance_analysis?.compliance_status === 'PARTIAL_COMPLIANCE'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-cyan-500/20 text-cyan-400'
                }`}>
                  {cmdbData?.compliance_analysis?.compliance_status || 'UNKNOWN'}
                </span>
              </div>
              <div className="text-2xl font-bold text-white">
                {cmdbCoverage.toFixed(1)}%
              </div>
              <div className="text-xs text-white/60">
                {cmdbRegistered.toLocaleString()} registered ({(cmdbRegistered / totalHosts * 100).toFixed(1)}% of total)
              </div>
              <div className="h-2 bg-black rounded-full overflow-hidden mt-2">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600 transition-all duration-1000"
                  style={{ width: `${cmdbCoverage}%` }}
                />
              </div>
              {cmdbGaps.total_unregistered_assets > 0 && (
                <div className="mt-2 text-xs text-red-400">
                  Gap: {cmdbGaps.total_unregistered_assets.toLocaleString()} unregistered
                </div>
              )}
            </div>
          </div>

          {/* Coverage Flow */}
          <div className="bg-black/90 border border-cyan-400/30 rounded-xl p-4">
            <h3 className="text-lg font-bold text-white mb-3">CONTROL COVERAGE FLOW</h3>
            <canvas ref={coverageFlowRef} className="w-full h-32" />
          </div>

          {/* Regional Breakdown */}
          {taniumData?.regional_coverage && Object.keys(taniumData.regional_coverage).length > 0 && (
            <div className="bg-black/90 border border-cyan-400/30 rounded-xl p-4">
              <h3 className="text-lg font-bold text-white mb-3">TOP REGIONS - TANIUM</h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {Object.entries(taniumData.regional_coverage)
                  .sort((a, b) => (b[1]?.deployed || 0) - (a[1]?.deployed || 0))
                  .slice(0, 5)
                  .map(([region, data]) => (
                  <div key={region} className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 capitalize truncate max-w-[100px]">{region}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white">{data?.deployed?.toLocaleString() || 0}</span>
                      <span className={`font-bold ${
                        (data?.coverage_percentage || 0) > 70 ? 'text-cyan-400' :
                        (data?.coverage_percentage || 0) > 40 ? 'text-yellow-400' :
                        'text-purple-400'
                      }`}>
                        {data?.coverage_percentage?.toFixed(1) || '0.0'}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deployment Recommendations */}
          {taniumData?.deployment_recommendations?.length > 0 && (
            <div className="bg-black/90 border border-red-400/30 rounded-xl p-4">
              <h3 className="text-sm font-bold text-red-400 mb-2">CRITICAL ACTIONS</h3>
              <div className="space-y-2">
                {taniumData.deployment_recommendations.slice(0, 3).map((rec, idx) => (
                  <div key={idx} className="text-xs">
                    <div className="font-bold text-white">{rec.target}</div>
                    <div className="text-gray-400">{rec.reason}</div>
                    <div className="text-red-400">{rec.assets.toLocaleString()} assets need coverage</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="bg-black/90 border border-cyan-400/30 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="text-xl font-bold text-cyan-400">
                  {Math.max(taniumDeployed, cmdbRegistered).toLocaleString()}
                </div>
                <div className="text-xs text-gray-400">Best Coverage</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-purple-400">
                  {(totalHosts - Math.min(taniumDeployed, cmdbRegistered)).toLocaleString()}
                </div>
                <div className="text-xs text-gray-400">Worst Gap</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityControlCoverage;