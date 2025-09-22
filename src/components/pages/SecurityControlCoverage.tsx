import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

const SecurityControlCoverage = () => {
  const [securityData, setSecurityData] = useState(null);
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
        const response = await fetch('http://localhost:5000/api/security_control_coverage');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setSecurityData(data);
      } catch (error) {
        console.error('Error:', error);
        setSecurityData({
          total_hosts: 0,
          edr_coverage: { coverage_percentage: 0, protected_hosts: 0, status: 'CRITICAL' },
          tanium_coverage: { coverage_percentage: 0, managed_hosts: 0, status: 'CRITICAL' },
          dlp_coverage: { coverage_percentage: 0, protected_hosts: 0, status: 'CRITICAL' },
          all_controls_coverage: { coverage_percentage: 0, fully_protected_hosts: 0, status: 'CRITICAL' }
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
    if (!fortressRef.current || !securityData || loading) return;

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

    // Three security layers
    const controls = [
      { name: 'EDR', data: securityData.edr_coverage, height: 40, radius: 55, yPos: 25 },
      { name: 'Tanium', data: securityData.tanium_coverage, height: 35, radius: 45, yPos: 55 },
      { name: 'DLP', data: securityData.dlp_coverage, height: 30, radius: 35, yPos: 80 }
    ];

    controls.forEach(control => {
      if (!control.data) return;
      
      const coverage = control.data.coverage_percentage || 0;
      
      // Outer ring (total capacity)
      const outerGeometry = new THREE.CylinderGeometry(
        control.radius, 
        control.radius, 
        control.height, 
        32, 1, true
      );
      const outerMaterial = new THREE.MeshPhongMaterial({
        color: 0x111111,
        emissive: coverage > 50 ? 0x00d4ff : 0xa855f7,
        emissiveIntensity: 0.1,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      });
      const outerRing = new THREE.Mesh(outerGeometry, outerMaterial);
      outerRing.position.y = control.yPos;
      fortressGroup.add(outerRing);
      
      // Inner cylinder (protected hosts)
      const protectedHeight = control.height * (coverage / 100);
      const innerGeometry = new THREE.CylinderGeometry(
        control.radius - 5,
        control.radius - 5,
        protectedHeight,
        32
      );
      const innerMaterial = new THREE.MeshPhongMaterial({
        color: coverage > 70 ? 0x00d4ff : coverage > 40 ? 0xffaa00 : 0xa855f7,
        emissive: coverage > 70 ? 0x00d4ff : coverage > 40 ? 0xffaa00 : 0xa855f7,
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
        color: coverage > 50 ? 0x00d4ff : 0xa855f7,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = control.yPos;
      fortressGroup.add(ring);
    });

    // Central core (all controls coverage)
    const allCoverage = securityData.all_controls_coverage?.coverage_percentage || 0;
    const coreGeometry = new THREE.SphereGeometry(15, 32, 32);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: allCoverage > 50 ? 0x00d4ff : 0xa855f7,
      emissive: allCoverage > 50 ? 0x00d4ff : 0xa855f7,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.9
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.position.y = 110;
    fortressGroup.add(core);

    scene.add(fortressGroup);

    // Threat particles (unprotected hosts)
    const unprotectedCount = securityData.total_hosts - 
      (securityData.all_controls_coverage?.fully_protected_hosts || 0);
    const particleCount = Math.min(1000, Math.max(100, unprotectedCount / 100));
    
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
  }, [securityData, loading]);

  // Coverage Flow Animation
  useEffect(() => {
    const canvas = coverageFlowRef.current;
    if (!canvas || !securityData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let animationId;
    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const controls = [
        { name: 'EDR', data: securityData.edr_coverage, color: '#00d4ff' },
        { name: 'TANIUM', data: securityData.tanium_coverage, color: '#00d4ff' },
        { name: 'DLP', data: securityData.dlp_coverage, color: '#00d4ff' },
        { name: 'ALL CONTROLS', data: securityData.all_controls_coverage, color: '#a855f7' }
      ];

      controls.forEach((control, index) => {
        if (!control.data) return;
        
        const y = (index + 1) * (canvas.height / 5);
        const barWidth = canvas.width - 100;
        const protectedWidth = barWidth * (control.data.coverage_percentage / 100);
        
        // Background bar
        ctx.fillStyle = 'rgba(168, 85, 247, 0.1)';
        ctx.fillRect(50, y - 15, barWidth, 30);
        
        // Protected portion
        const gradient = ctx.createLinearGradient(50, y, 50 + protectedWidth, y);
        if (control.data.coverage_percentage > 70) {
          gradient.addColorStop(0, '#00d4ff');
          gradient.addColorStop(1, '#0099ff');
        } else if (control.data.coverage_percentage > 40) {
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
        ctx.fillStyle = control.data.coverage_percentage > 50 ? '#00d4ff' : '#a855f7';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${control.data.coverage_percentage?.toFixed(1) || '0.0'}%`, canvas.width - 10, y + 5);
        
        // Host counts
        const hostCount = control.data.protected_hosts || control.data.managed_hosts || control.data.fully_protected_hosts || 0;
        ctx.fillStyle = '#ffffff60';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          `${hostCount.toLocaleString()} / ${securityData.total_hosts?.toLocaleString() || 0} hosts`,
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
  }, [securityData]);

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

  const overallCoverage = securityData?.all_controls_coverage?.coverage_percentage || 0;
  const fullyProtected = securityData?.all_controls_coverage?.fully_protected_hosts || 0;
  const totalHosts = securityData?.total_hosts || 0;

  return (
    <div className="h-full flex flex-col p-6 bg-black">
      {overallCoverage < 50 && (
        <div className="mb-4 bg-purple-500/10 border border-purple-500 rounded-xl p-3">
          <div className="flex items-center gap-3">
            <span className="text-purple-400 font-bold">⚠️ CRITICAL:</span>
            <span className="text-white">
              Only {overallCoverage.toFixed(1)}% of hosts have all security controls
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
              <p className="text-sm text-white/60 mt-1">EDR, Tanium, and DLP agent coverage visualization</p>
            </div>
            
            <div ref={fortressRef} className="h-[calc(100%-80px)]" />
          </div>
        </div>

        {/* Metrics Panel */}
        <div className="col-span-4 space-y-4">
          {/* Overall Coverage */}
          <div className="bg-black/90 border border-cyan-400/30 rounded-xl p-4">
            <h3 className="text-lg font-bold text-white mb-3">ALL CONTROLS COVERAGE</h3>
            <div className="text-5xl font-bold text-center py-4">
              <span className={overallCoverage < 50 ? 'text-purple-400' : 'text-cyan-400'}>
                {overallCoverage.toFixed(1)}%
              </span>
            </div>
            <div className="text-center text-sm text-white/60">
              {fullyProtected.toLocaleString()} / {totalHosts.toLocaleString()} hosts fully protected
            </div>
            <div className="h-4 bg-black rounded-full overflow-hidden border border-cyan-400/30 mt-3">
              <div 
                className="h-full transition-all duration-1000"
                style={{
                  width: `${overallCoverage}%`,
                  background: overallCoverage < 50 
                    ? 'linear-gradient(90deg, #a855f7, #ff00ff)'
                    : 'linear-gradient(90deg, #00d4ff, #0099ff)'
                }}
              />
            </div>
          </div>

          {/* Individual Controls */}
          <div className="space-y-3">
            {/* EDR */}
            <div className="bg-black/90 border border-cyan-400/30 rounded-xl p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-cyan-400">EDR COVERAGE</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  securityData?.edr_coverage?.status === 'CRITICAL' 
                    ? 'bg-purple-500/20 text-purple-400'
                    : securityData?.edr_coverage?.status === 'WARNING'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-cyan-500/20 text-cyan-400'
                }`}>
                  {securityData?.edr_coverage?.status || 'UNKNOWN'}
                </span>
              </div>
              <div className="text-2xl font-bold text-white">
                {securityData?.edr_coverage?.coverage_percentage?.toFixed(1) || '0.0'}%
              </div>
              <div className="text-xs text-white/60">
                {securityData?.edr_coverage?.protected_hosts?.toLocaleString() || 0} protected
              </div>
              <div className="h-2 bg-black rounded-full overflow-hidden mt-2">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600"
                  style={{ width: `${securityData?.edr_coverage?.coverage_percentage || 0}%` }}
                />
              </div>
            </div>

            {/* Tanium */}
            <div className="bg-black/90 border border-cyan-400/30 rounded-xl p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-cyan-400">TANIUM COVERAGE</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  securityData?.tanium_coverage?.status === 'CRITICAL' 
                    ? 'bg-purple-500/20 text-purple-400'
                    : securityData?.tanium_coverage?.status === 'WARNING'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-cyan-500/20 text-cyan-400'
                }`}>
                  {securityData?.tanium_coverage?.status || 'UNKNOWN'}
                </span>
              </div>
              <div className="text-2xl font-bold text-white">
                {securityData?.tanium_coverage?.coverage_percentage?.toFixed(1) || '0.0'}%
              </div>
              <div className="text-xs text-white/60">
                {securityData?.tanium_coverage?.managed_hosts?.toLocaleString() || 0} managed
              </div>
              <div className="h-2 bg-black rounded-full overflow-hidden mt-2">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600"
                  style={{ width: `${securityData?.tanium_coverage?.coverage_percentage || 0}%` }}
                />
              </div>
            </div>

            {/* DLP */}
            <div className="bg-black/90 border border-cyan-400/30 rounded-xl p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-cyan-400">DLP COVERAGE</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  securityData?.dlp_coverage?.status === 'CRITICAL' 
                    ? 'bg-purple-500/20 text-purple-400'
                    : securityData?.dlp_coverage?.status === 'WARNING'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-cyan-500/20 text-cyan-400'
                }`}>
                  {securityData?.dlp_coverage?.status || 'UNKNOWN'}
                </span>
              </div>
              <div className="text-2xl font-bold text-white">
                {securityData?.dlp_coverage?.coverage_percentage?.toFixed(1) || '0.0'}%
              </div>
              <div className="text-xs text-white/60">
                {securityData?.dlp_coverage?.protected_hosts?.toLocaleString() || 0} protected
              </div>
              <div className="h-2 bg-black rounded-full overflow-hidden mt-2">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600"
                  style={{ width: `${securityData?.dlp_coverage?.coverage_percentage || 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Coverage Flow */}
          <div className="bg-black/90 border border-cyan-400/30 rounded-xl p-4">
            <h3 className="text-lg font-bold text-white mb-3">CONTROL COVERAGE FLOW</h3>
            <canvas ref={coverageFlowRef} className="w-full h-48" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityControlCoverage;