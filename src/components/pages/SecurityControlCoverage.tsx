import React, { useState, useEffect, useRef } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Activity, Lock, Eye, Zap, Database, Server, Network, Target, Radar, Layers, Binary } from 'lucide-react';
import * as THREE from 'three';

const SecurityControlCoverage: React.FC = () => {
  const [securityData, setSecurityData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedControl, setSelectedControl] = useState<string>('all');
  const [hoveredControl, setHoveredControl] = useState<string | null>(null);
  const fortressRef = useRef<HTMLDivElement>(null);
  const coverageRef = useRef<HTMLCanvasElement>(null);
  const threatRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const frameRef = useRef<number | null>(null);
  const coverageFrameRef = useRef<number | null>(null);
  const threatFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/security_control_coverage');
        if (!response.ok) throw new Error('Failed to fetch security data');
        const data = await response.json();
        setSecurityData(data);
      } catch (error) {
        console.error('Error:', error);
        // Fallback data
        setSecurityData({
          total_hosts: 0,
          edr_coverage: {
            protected_hosts: 0,
            unprotected_hosts: 0,
            coverage_percentage: 0,
            status: 'CRITICAL'
          },
          tanium_coverage: {
            managed_hosts: 0,
            unmanaged_hosts: 0,
            coverage_percentage: 0,
            status: 'CRITICAL'
          },
          dlp_coverage: {
            protected_hosts: 0,
            unprotected_hosts: 0,
            coverage_percentage: 0,
            status: 'CRITICAL'
          },
          all_controls_coverage: {
            fully_protected_hosts: 0,
            partially_protected_hosts: 0,
            coverage_percentage: 0,
            status: 'CRITICAL'
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // 3D Security Fortress Visualization
  useEffect(() => {
    if (!fortressRef.current || !securityData || loading) return;

    // Clean up previous scene
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

    // Central fortress core
    const fortressGroup = new THREE.Group();
    
    // Base platform
    const platformGeometry = new THREE.CylinderGeometry(50, 60, 5, 32);
    const platformMaterial = new THREE.MeshPhongMaterial({
      color: 0x001122,
      emissive: 0x00d4ff,
      emissiveIntensity: 0.05
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    fortressGroup.add(platform);

    // Three security layers - EDR, Tanium, DLP
    const layers: THREE.Group[] = [];

    // EDR Layer
    if (securityData.edr_coverage) {
      const edrGroup = new THREE.Group();
      const edrCoverage = securityData.edr_coverage.coverage_percentage;
      const edrRadius = 40;
      const edrHeight = 30;
      
      // Create simple cylinder for EDR
      const edrGeometry = new THREE.CylinderGeometry(edrRadius, edrRadius, edrHeight, 32, 1, true);
      const edrMaterial = new THREE.MeshPhongMaterial({
        color: edrCoverage > 50 ? 0x00d4ff : 0xa855f7,
        emissive: edrCoverage > 50 ? 0x00d4ff : 0xa855f7,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
      });
      
      const edrMesh = new THREE.Mesh(edrGeometry, edrMaterial);
      edrMesh.position.y = 10;
      edrGroup.add(edrMesh);
      
      // Protected portion indicator
      const protectedHeight = edrHeight * (edrCoverage / 100);
      const protectedGeometry = new THREE.CylinderGeometry(edrRadius - 5, edrRadius - 5, protectedHeight, 32);
      const protectedMaterial = new THREE.MeshPhongMaterial({
        color: 0x00d4ff,
        emissive: 0x00d4ff,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.8
      });
      
      const protectedMesh = new THREE.Mesh(protectedGeometry, protectedMaterial);
      protectedMesh.position.y = 10 - (edrHeight - protectedHeight) / 2;
      edrGroup.add(protectedMesh);
      
      edrGroup.userData = { type: 'EDR', coverage: edrCoverage };
      layers.push(edrGroup);
      fortressGroup.add(edrGroup);
    }

    // Tanium Layer
    if (securityData.tanium_coverage) {
      const taniumGroup = new THREE.Group();
      const taniumCoverage = securityData.tanium_coverage.coverage_percentage;
      const taniumRadius = 35;
      const taniumHeight = 25;
      
      const taniumGeometry = new THREE.CylinderGeometry(taniumRadius, taniumRadius, taniumHeight, 32, 1, true);
      const taniumMaterial = new THREE.MeshPhongMaterial({
        color: taniumCoverage > 50 ? 0x00d4ff : 0xa855f7,
        emissive: taniumCoverage > 50 ? 0x00d4ff : 0xa855f7,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
      });
      
      const taniumMesh = new THREE.Mesh(taniumGeometry, taniumMaterial);
      taniumMesh.position.y = 45;
      taniumGroup.add(taniumMesh);
      
      const protectedHeight = taniumHeight * (taniumCoverage / 100);
      const protectedGeometry = new THREE.CylinderGeometry(taniumRadius - 5, taniumRadius - 5, protectedHeight, 32);
      const protectedMaterial = new THREE.MeshPhongMaterial({
        color: 0x00d4ff,
        emissive: 0x00d4ff,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.8
      });
      
      const protectedMesh = new THREE.Mesh(protectedGeometry, protectedMaterial);
      protectedMesh.position.y = 45 - (taniumHeight - protectedHeight) / 2;
      taniumGroup.add(protectedMesh);
      
      taniumGroup.userData = { type: 'Tanium', coverage: taniumCoverage };
      layers.push(taniumGroup);
      fortressGroup.add(taniumGroup);
    }

    // DLP Layer
    if (securityData.dlp_coverage) {
      const dlpGroup = new THREE.Group();
      const dlpCoverage = securityData.dlp_coverage.coverage_percentage;
      const dlpRadius = 30;
      const dlpHeight = 20;
      
      const dlpGeometry = new THREE.CylinderGeometry(dlpRadius, dlpRadius, dlpHeight, 32, 1, true);
      const dlpMaterial = new THREE.MeshPhongMaterial({
        color: dlpCoverage > 50 ? 0x00d4ff : 0xa855f7,
        emissive: dlpCoverage > 50 ? 0x00d4ff : 0xa855f7,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
      });
      
      const dlpMesh = new THREE.Mesh(dlpGeometry, dlpMaterial);
      dlpMesh.position.y = 75;
      dlpGroup.add(dlpMesh);
      
      const protectedHeight = dlpHeight * (dlpCoverage / 100);
      const protectedGeometry = new THREE.CylinderGeometry(dlpRadius - 5, dlpRadius - 5, protectedHeight, 32);
      const protectedMaterial = new THREE.MeshPhongMaterial({
        color: 0x00d4ff,
        emissive: 0x00d4ff,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.8
      });
      
      const protectedMesh = new THREE.Mesh(protectedGeometry, protectedMaterial);
      protectedMesh.position.y = 75 - (dlpHeight - protectedHeight) / 2;
      dlpGroup.add(protectedMesh);
      
      dlpGroup.userData = { type: 'DLP', coverage: dlpCoverage };
      layers.push(dlpGroup);
      fortressGroup.add(dlpGroup);
    }

    // Add complete coverage indicator
    if (securityData.all_controls_coverage) {
      const coreGeometry = new THREE.SphereGeometry(10, 32, 32);
      const coreMaterial = new THREE.MeshPhongMaterial({
        color: securityData.all_controls_coverage.status === 'CRITICAL' ? 0xa855f7 : 0x00d4ff,
        emissive: securityData.all_controls_coverage.status === 'CRITICAL' ? 0xa855f7 : 0x00d4ff,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.9
      });
      const core = new THREE.Mesh(coreGeometry, coreMaterial);
      core.position.y = 100;
      fortressGroup.add(core);
    }

    // Add threat particles
    const unprotectedCount = securityData.total_hosts - 
      (securityData.all_controls_coverage?.fully_protected_hosts || 0);
    const particleCount = Math.min(500, Math.max(50, Math.floor(unprotectedCount / 100)));
    
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 70 + Math.random() * 50;
      const height = Math.random() * 100;
      
      positions[i] = Math.cos(angle) * radius;
      positions[i + 1] = height;
      positions[i + 2] = Math.sin(angle) * radius;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
      size: 2,
      color: 0xa855f7,
      transparent: true,
      opacity: 0.6
    });
    
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    scene.add(fortressGroup);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00d4ff, 1, 200);
    pointLight1.position.set(100, 100, 100);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xa855f7, 1, 200);
    pointLight2.position.set(-100, 50, -100);
    scene.add(pointLight2);

    camera.position.set(150, 100, 150);
    camera.lookAt(0, 50, 0);

    // Animation
    const animate = () => {
      if (!sceneRef.current) return;
      frameRef.current = requestAnimationFrame(animate);
      
      fortressGroup.rotation.y += 0.002;
      particles.rotation.y += 0.001;
      
      const time = Date.now() * 0.0003;
      camera.position.x = Math.sin(time) * 200;
      camera.position.z = Math.cos(time) * 200;
      camera.lookAt(0, 50, 0);
      
      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
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

  // Coverage Flow Visualization
  useEffect(() => {
    const canvas = coverageRef.current;
    if (!canvas || !securityData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const controls = [
        { name: 'EDR', data: securityData.edr_coverage },
        { name: 'Tanium', data: securityData.tanium_coverage },
        { name: 'DLP', data: securityData.dlp_coverage }
      ];

      controls.forEach((control, index) => {
        if (!control.data) return;
        
        const y = (index + 1) * (canvas.height / 4);
        const barWidth = canvas.width * 0.8;
        const protectedWidth = barWidth * (control.data.coverage_percentage / 100);
        
        // Protected hosts bar
        const protectedGradient = ctx.createLinearGradient(0, y, protectedWidth, y);
        protectedGradient.addColorStop(0, '#00d4ff');
        protectedGradient.addColorStop(1, '#00d4ff80');
        
        ctx.fillStyle = protectedGradient;
        ctx.fillRect(50, y - 15, protectedWidth, 30);
        
        // Unprotected hosts bar
        ctx.fillStyle = '#a855f720';
        ctx.fillRect(50 + protectedWidth, y - 15, barWidth - protectedWidth, 30);
        
        // Control name
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(control.name, 50, y - 20);
        
        // Coverage percentage
        ctx.fillStyle = '#00d4ff';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(
          `${control.data.coverage_percentage?.toFixed(1) || '0.0'}%`,
          50 + barWidth + 10,
          y + 5
        );
        
        // Host counts
        ctx.fillStyle = '#ffffff60';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          `${control.data.protected_hosts?.toLocaleString() || control.data.managed_hosts?.toLocaleString() || 0} / ${securityData.total_hosts?.toLocaleString() || 0} hosts`,
          canvas.width / 2,
          y + 25
        );
      });

      coverageFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (coverageFrameRef.current) cancelAnimationFrame(coverageFrameRef.current);
    };
  }, [securityData]);

  // Threat Matrix
  useEffect(() => {
    const canvas = threatRef.current;
    if (!canvas || !securityData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let time = 0;

    const animate = () => {
      time += 0.02;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw threat matrix grid
      const gridSize = 20;
      const cols = Math.floor(canvas.width / gridSize);
      const rows = Math.floor(canvas.height / gridSize);
      
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * gridSize;
          const y = j * gridSize;
          
          const avgCoverage = (
            (securityData.edr_coverage?.coverage_percentage || 0) +
            (securityData.tanium_coverage?.coverage_percentage || 0) +
            (securityData.dlp_coverage?.coverage_percentage || 0)
          ) / 3;
          
          const isThreat = Math.random() > avgCoverage / 100;
          const intensity = Math.sin(time + i * 0.1 + j * 0.1) * 0.5 + 0.5;
          
          if (isThreat && Math.random() > 0.9) {
            ctx.fillStyle = `rgba(168, 85, 247, ${intensity})`;
            ctx.fillRect(x, y, gridSize - 2, gridSize - 2);
          } else if (!isThreat && Math.random() > 0.95) {
            ctx.fillStyle = `rgba(0, 212, 255, ${intensity * 0.3})`;
            ctx.fillRect(x, y, gridSize - 2, gridSize - 2);
          }
        }
      }

      // Draw scan line
      const scanY = (Math.sin(time) * 0.5 + 0.5) * canvas.height;
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(canvas.width, scanY);
      ctx.stroke();

      threatFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (threatFrameRef.current) cancelAnimationFrame(threatFrameRef.current);
    };
  }, [securityData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
          <div className="mt-4 text-lg font-bold text-cyan-400">ANALYZING SECURITY CONTROLS</div>
        </div>
      </div>
    );
  }

  const overallStatus = securityData?.all_controls_coverage?.status || 'CRITICAL';
  const fullyProtected = securityData?.all_controls_coverage?.fully_protected_hosts || 0;
  const totalHosts = securityData?.total_hosts || 0;
  const overallCoverage = totalHosts > 0 ? (fullyProtected / totalHosts * 100) : 0;

  return (
    <div className="h-full flex flex-col p-4">
      {overallStatus === 'CRITICAL' && (
        <div className="mb-3 bg-black border border-purple-500/50 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-purple-400 animate-pulse" />
            <span className="text-purple-400 font-bold text-sm">CRITICAL:</span>
            <span className="text-white text-sm">
              Only {overallCoverage.toFixed(1)}% of hosts have all security controls
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 grid grid-cols-12 gap-4">
        {/* 3D Fortress */}
        <div className="col-span-7">
          <div className="h-full glass-panel rounded-xl">
            <div className="p-3 border-b border-cyan-400/20">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-cyan-400">SECURITY CONTROL FORTRESS</h2>
                <div className="text-xs text-gray-400">
                  Rotate view • Each layer = Control coverage
                </div>
              </div>
            </div>
            
            <div ref={fortressRef} className="w-full" style={{ height: 'calc(100% - 60px)' }} />
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-5 space-y-3">
          {/* Overall Coverage Card */}
          <div className="glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">ALL CONTROLS COVERAGE</h3>
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="text-3xl font-bold text-cyan-400 mb-2">
              {overallCoverage.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-400 mb-3">
              {fullyProtected.toLocaleString()} / {totalHosts.toLocaleString()} hosts fully protected
            </div>
            <div className="h-2 bg-black/50 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${overallCoverage}%`,
                  background: overallStatus === 'CRITICAL' 
                    ? 'linear-gradient(90deg, #a855f7, #ff00ff)'
                    : 'linear-gradient(90deg, #00d4ff, #00d4ff)'
                }}
              />
            </div>
          </div>

          {/* Individual Controls */}
          <div className="space-y-2">
            {/* EDR Coverage */}
            {securityData?.edr_coverage && (
              <div className="glass-panel rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-bold text-white">EDR COVERAGE</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    securityData.edr_coverage.status === 'CRITICAL' 
                      ? 'bg-purple-500/20 text-purple-400'
                      : securityData.edr_coverage.status === 'WARNING'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-cyan-500/20 text-cyan-400'
                  }`}>
                    {securityData.edr_coverage.status}
                  </span>
                </div>
                <div className="text-2xl font-bold text-cyan-400">
                  {securityData.edr_coverage.coverage_percentage?.toFixed(1) || '0.0'}%
                </div>
                <div className="text-xs text-gray-400">
                  {securityData.edr_coverage.protected_hosts?.toLocaleString() || 0} protected
                </div>
              </div>
            )}

            {/* Tanium Coverage */}
            {securityData?.tanium_coverage && (
              <div className="glass-panel rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Network className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-bold text-white">TANIUM COVERAGE</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    securityData.tanium_coverage.status === 'CRITICAL' 
                      ? 'bg-purple-500/20 text-purple-400'
                      : securityData.tanium_coverage.status === 'WARNING'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-cyan-500/20 text-cyan-400'
                  }`}>
                    {securityData.tanium_coverage.status}
                  </span>
                </div>
                <div className="text-2xl font-bold text-cyan-400">
                  {securityData.tanium_coverage.coverage_percentage?.toFixed(1) || '0.0'}%
                </div>
                <div className="text-xs text-gray-400">
                  {securityData.tanium_coverage.managed_hosts?.toLocaleString() || 0} managed
                </div>
              </div>
            )}

            {/* DLP Coverage */}
            {securityData?.dlp_coverage && (
              <div className="glass-panel rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-bold text-white">DLP COVERAGE</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    securityData.dlp_coverage.status === 'CRITICAL' 
                      ? 'bg-purple-500/20 text-purple-400'
                      : securityData.dlp_coverage.status === 'WARNING'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-cyan-500/20 text-cyan-400'
                  }`}>
                    {securityData.dlp_coverage.status}
                  </span>
                </div>
                <div className="text-2xl font-bold text-cyan-400">
                  {securityData.dlp_coverage.coverage_percentage?.toFixed(1) || '0.0'}%
                </div>
                <div className="text-xs text-gray-400">
                  {securityData.dlp_coverage.protected_hosts?.toLocaleString() || 0} protected
                </div>
              </div>
            )}
          </div>

          {/* Coverage Flow */}
          <div className="glass-panel rounded-xl p-3">
            <h3 className="text-sm font-bold text-purple-400 mb-2">CONTROL COVERAGE FLOW</h3>
            <canvas ref={coverageRef} className="w-full h-32" />
          </div>

          {/* Threat Matrix */}
          <div className="glass-panel rounded-xl p-3">
            <h3 className="text-sm font-bold text-cyan-400 mb-2">THREAT EXPOSURE MATRIX</h3>
            <canvas ref={threatRef} className="w-full h-24" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityControlCoverage;