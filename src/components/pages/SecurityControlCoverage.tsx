import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Shield, Server, Activity, AlertTriangle, Eye, Database, CheckCircle, XCircle, Lock, Layers, Zap, Target, ChevronRight, X } from 'lucide-react';

const SecurityControlCoverage = () => {
  const [taniumData, setTaniumData] = useState(null);
  const [cmdbData, setCmdbData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedControl, setSelectedControl] = useState(null);
  const [hoveredLayer, setHoveredLayer] = useState(null);
  const [detailView, setDetailView] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const fortressRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const frameRef = useRef(null);
  const coverageFlowRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const controlMeshesRef = useRef([]);
  const pulseWaveRef = useRef(null);

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
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Search for hosts with specific security controls
  const searchSecurityHosts = async (controlType, status) => {
    try {
      const query = controlType === 'tanium' ? 'tanium' : 'cmdb';
      const response = await fetch(`http://localhost:5000/api/host_search?q=${query}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Host search error:', error);
      return null;
    }
  };

  // Interactive 3D Security Fortress
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

    // Clear previous meshes
    controlMeshesRef.current = [];

    const fortressGroup = new THREE.Group();
    
    // Interactive base platform
    const platformGeometry = new THREE.CylinderGeometry(70, 80, 10, 64);
    const platformMaterial = new THREE.MeshPhongMaterial({
      color: 0x001122,
      emissive: 0x00d4ff,
      emissiveIntensity: 0.05,
      transparent: true,
      opacity: 0.8
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.userData = { type: 'platform', name: 'Base Infrastructure' };
    controlMeshesRef.current.push(platform);
    fortressGroup.add(platform);

    // Interactive security layers with real data
    const controls = [
      { 
        name: 'Tanium', 
        coverage: taniumData.coverage_percentage || 0,
        deployed: taniumData.tanium_deployed || 0,
        total: taniumData.total_assets || 0,
        height: 40, 
        radius: 55, 
        yPos: 25,
        data: taniumData
      },
      { 
        name: 'CMDB', 
        coverage: cmdbData.registration_rate || 0,
        deployed: cmdbData.cmdb_registered || 0,
        total: cmdbData.total_assets || 0,
        height: 35, 
        radius: 45, 
        yPos: 55,
        data: cmdbData
      }
    ];

    controls.forEach((control, index) => {
      // Interactive outer ring
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
      outerRing.userData = { 
        type: 'control_ring',
        control: control.name,
        coverage: control.coverage,
        data: control.data
      };
      controlMeshesRef.current.push(outerRing);
      fortressGroup.add(outerRing);
      
      // Interactive inner cylinder (protected hosts)
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
      innerCylinder.userData = { 
        type: 'protected_layer',
        control: control.name,
        protected: control.deployed,
        total: control.total,
        coverage: control.coverage,
        data: control.data
      };
      controlMeshesRef.current.push(innerCylinder);
      fortressGroup.add(innerCylinder);
      
      // Interactive data flow particles
      const particleCount = 100;
      const particleGeometry = new THREE.BufferGeometry();
      const particlePositions = new Float32Array(particleCount * 3);
      
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        const radiusVariation = control.radius + Math.random() * 10;
        particlePositions[i * 3] = Math.cos(angle) * radiusVariation;
        particlePositions[i * 3 + 1] = control.yPos + (Math.random() - 0.5) * control.height;
        particlePositions[i * 3 + 2] = Math.sin(angle) * radiusVariation;
      }
      
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
      
      const particleMaterial = new THREE.PointsMaterial({
        size: 2,
        color: control.coverage > 50 ? 0x00d4ff : 0xa855f7,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
      });
      
      const particles = new THREE.Points(particleGeometry, particleMaterial);
      particles.userData = { type: 'particles', control: control.name };
      fortressGroup.add(particles);
    });

    // Interactive central core
    const combinedCoverage = ((taniumData.coverage_percentage || 0) + (cmdbData.registration_rate || 0)) / 2;
    const coreGeometry = new THREE.IcosahedronGeometry(15, 2);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: combinedCoverage > 50 ? 0x00d4ff : 0xa855f7,
      emissive: combinedCoverage > 50 ? 0x00d4ff : 0xa855f7,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.9
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.position.y = 90;
    core.userData = {
      type: 'core',
      combinedCoverage,
      taniumCoverage: taniumData.coverage_percentage,
      cmdbCoverage: cmdbData.registration_rate
    };
    controlMeshesRef.current.push(core);
    fortressGroup.add(core);

    scene.add(fortressGroup);

    // Threat visualization particles
    const unprotectedTanium = taniumData.total_assets - taniumData.tanium_deployed;
    const unprotectedCMDB = cmdbData.total_assets - cmdbData.cmdb_registered;
    const maxUnprotected = Math.max(unprotectedTanium, unprotectedCMDB);
    const threatParticleCount = Math.min(1000, Math.max(100, maxUnprotected / 100));
    
    const threatGeometry = new THREE.BufferGeometry();
    const threatPositions = new Float32Array(threatParticleCount * 3);
    const threatColors = new Float32Array(threatParticleCount * 3);
    
    for (let i = 0; i < threatParticleCount * 3; i += 3) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 90 + Math.random() * 60;
      const height = Math.random() * 150;
      
      threatPositions[i] = Math.cos(angle) * radius;
      threatPositions[i + 1] = height;
      threatPositions[i + 2] = Math.sin(angle) * radius;
      
      threatColors[i] = 0.66;
      threatColors[i + 1] = 0.33;
      threatColors[i + 2] = 0.97;
    }
    
    threatGeometry.setAttribute('position', new THREE.BufferAttribute(threatPositions, 3));
    threatGeometry.setAttribute('color', new THREE.BufferAttribute(threatColors, 3));
    
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
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00d4ff, 2, 300);
    pointLight1.position.set(150, 150, 150);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xa855f7, 1, 300);
    pointLight2.position.set(-150, 50, -150);
    scene.add(pointLight2);

    // Spotlight for dramatic effect
    const spotLight = new THREE.SpotLight(0x00d4ff, 1);
    spotLight.position.set(0, 200, 100);
    spotLight.target = core;
    spotLight.angle = Math.PI / 6;
    spotLight.penumbra = 0.1;
    scene.add(spotLight);

    camera.position.set(200, 150, 200);
    camera.lookAt(0, 50, 0);

    // Mouse interaction
    const handleMouseMove = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(controlMeshesRef.current);
      
      if (intersects.length > 0) {
        const hoveredObject = intersects[0].object;
        setHoveredLayer(hoveredObject.userData);
        document.body.style.cursor = 'pointer';
        
        // Highlight effect
        if (hoveredObject.userData.type === 'protected_layer' || hoveredObject.userData.type === 'control_ring') {
          hoveredObject.scale.setScalar(1.05);
        }
      } else {
        setHoveredLayer(null);
        document.body.style.cursor = 'default';
        
        // Reset scales
        controlMeshesRef.current.forEach(mesh => {
          mesh.scale.setScalar(1);
        });
      }
    };

    const handleClick = async (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(controlMeshesRef.current);
      
      if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        const controlData = clickedObject.userData;
        
        // Fetch detailed host data
        if (controlData.control) {
          const hostData = await searchSecurityHosts(controlData.control.toLowerCase(), 'all');
          setSelectedControl({
            ...controlData,
            hosts: hostData?.hosts || [],
            searchSummary: hostData?.search_summary || {}
          });
          setDetailView('control');
        }
      }
    };

    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('click', handleClick);

    // Animation
    const animate = () => {
      if (!sceneRef.current) return;
      frameRef.current = requestAnimationFrame(animate);
      
      // Rotate fortress
      fortressGroup.rotation.y += 0.002;
      
      // Pulsing core
      core.scale.setScalar(1 + Math.sin(Date.now() * 0.001) * 0.1);
      
      // Rotate threat particles
      threatParticles.rotation.y += 0.001;
      
      // Animate control particles
      fortressGroup.children.forEach(child => {
        if (child.userData.type === 'particles') {
          child.rotation.y += 0.01;
        }
      });
      
      // Camera orbit
      const time = Date.now() * 0.0003;
      camera.position.x = Math.sin(time) * 250;
      camera.position.z = Math.cos(time) * 250;
      camera.lookAt(0, 50, 0);
      
      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('click', handleClick);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (fortressRef.current && fortressRef.current.contains(rendererRef.current.domElement)) {
          fortressRef.current.removeChild(rendererRef.current.domElement);
        }
      }
    };
  }, [taniumData, cmdbData, loading]);

  // Interactive Coverage Flow
  useEffect(() => {
    const canvas = coverageFlowRef.current;
    if (!canvas || !taniumData || !cmdbData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Make canvas interactive
    const handleCanvasClick = (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      const controls = [
        { name: 'TANIUM', coverage: taniumData.coverage_percentage || 0, data: taniumData },
        { name: 'CMDB', coverage: cmdbData.registration_rate || 0, data: cmdbData }
      ];
      
      controls.forEach((control, index) => {
        const barY = (index + 1) * (canvas.height / 3);
        
        if (y >= barY - 15 && y <= barY + 15) {
          setSelectedControl(control);
          setDetailView('metrics');
        }
      });
    };
    
    canvas.addEventListener('click', handleCanvasClick);

    let animationId;
    let flowPosition = 0;
    
    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      flowPosition += 2;
      if (flowPosition > canvas.width) flowPosition = 0;

      const controls = [
        { name: 'TANIUM', coverage: taniumData.coverage_percentage || 0, deployed: taniumData.tanium_deployed || 0, total: taniumData.total_assets || 0 },
        { name: 'CMDB', coverage: cmdbData.registration_rate || 0, deployed: cmdbData.cmdb_registered || 0, total: cmdbData.total_assets || 0 }
      ];

      controls.forEach((control, index) => {
        const y = (index + 1) * (canvas.height / 3);
        const barWidth = canvas.width - 100;
        const protectedWidth = barWidth * (control.coverage / 100);
        
        // Animated background
        ctx.fillStyle = 'rgba(168, 85, 247, 0.05)';
        ctx.fillRect(50, y - 15, barWidth, 30);
        
        // Protected portion with flow effect
        const gradient = ctx.createLinearGradient(flowPosition - 100, y, flowPosition + 100, y);
        if (control.coverage > 70) {
          gradient.addColorStop(0, 'rgba(0, 212, 255, 0)');
          gradient.addColorStop(0.5, 'rgba(0, 212, 255, 1)');
          gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
        } else if (control.coverage > 40) {
          gradient.addColorStop(0, 'rgba(255, 170, 0, 0)');
          gradient.addColorStop(0.5, 'rgba(255, 170, 0, 1)');
          gradient.addColorStop(1, 'rgba(255, 170, 0, 0)');
        } else {
          gradient.addColorStop(0, 'rgba(168, 85, 247, 0)');
          gradient.addColorStop(0.5, 'rgba(168, 85, 247, 1)');
          gradient.addColorStop(1, 'rgba(168, 85, 247, 0)');
        }
        
        ctx.save();
        ctx.beginPath();
        ctx.rect(50, y - 15, protectedWidth, 30);
        ctx.clip();
        ctx.fillStyle = gradient;
        ctx.fillRect(0, y - 15, canvas.width, 30);
        ctx.restore();
        
        // Static fill
        const staticGradient = ctx.createLinearGradient(50, y, 50 + protectedWidth, y);
        if (control.coverage > 70) {
          staticGradient.addColorStop(0, 'rgba(0, 212, 255, 0.3)');
          staticGradient.addColorStop(1, 'rgba(0, 153, 255, 0.3)');
        } else if (control.coverage > 40) {
          staticGradient.addColorStop(0, 'rgba(255, 170, 0, 0.3)');
          staticGradient.addColorStop(1, 'rgba(255, 136, 0, 0.3)');
        } else {
          staticGradient.addColorStop(0, 'rgba(168, 85, 247, 0.3)');
          staticGradient.addColorStop(1, 'rgba(255, 0, 255, 0.3)');
        }
        
        ctx.fillStyle = staticGradient;
        ctx.fillRect(50, y - 15, protectedWidth, 30);
        
        // Glowing border
        ctx.strokeStyle = control.coverage > 50 ? 'rgba(0, 212, 255, 0.5)' : 'rgba(168, 85, 247, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, y - 15, barWidth, 30);
        
        // Control name
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(control.name, 50, y - 20);
        
        // Percentage with glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = control.coverage > 50 ? '#00d4ff' : '#a855f7';
        ctx.fillStyle = control.coverage > 50 ? '#00d4ff' : '#a855f7';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${control.coverage.toFixed(1)}%`, canvas.width - 10, y + 5);
        ctx.shadowBlur = 0;
        
        // Host counts
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
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
      canvas.removeEventListener('click', handleCanvasClick);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [taniumData, cmdbData]);

  // Pulse Wave Visualization
  useEffect(() => {
    const canvas = pulseWaveRef.current;
    if (!canvas || !taniumData || !cmdbData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let animationId;
    let time = 0;

    const animate = () => {
      time += 0.02;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw security pulse waves
      const waves = [
        { coverage: taniumData.coverage_percentage || 0, color: '#00d4ff', offset: 0 },
        { coverage: cmdbData.registration_rate || 0, color: '#a855f7', offset: Math.PI }
      ];

      waves.forEach(wave => {
        ctx.strokeStyle = wave.coverage > 50 ? wave.color : '#a855f7';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        
        for (let x = 0; x < canvas.width; x++) {
          const y = canvas.height / 2 + 
                   Math.sin((x / 50) + time + wave.offset) * (wave.coverage / 2) +
                   Math.sin((x / 25) + time * 2 + wave.offset) * 10;
          
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      ctx.globalAlpha = 1;

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
          <div className="mt-4 text-xl font-bold text-cyan-400">INITIALIZING SECURITY CONTROLS</div>
        </div>
      </div>
    );
  }

  const taniumCoverage = taniumData?.coverage_percentage || 0;
  const cmdbCoverage = cmdbData?.registration_rate || 0;
  const combinedCoverage = (taniumCoverage + cmdbCoverage) / 2;

  return (
    <div className="h-full flex flex-col p-6 bg-black">
      {combinedCoverage < 50 && (
        <div className="mb-4 bg-purple-500/10 border border-purple-500 rounded-xl p-3 animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-purple-400" />
            <span className="text-purple-400 font-bold">CRITICAL:</span>
            <span className="text-white">
              Security control coverage at {combinedCoverage.toFixed(1)}% - Multiple vulnerabilities detected
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 grid grid-cols-12 gap-6">
        {/* Interactive 3D Fortress */}
        <div className="col-span-8">
          <div className="h-full bg-black/90 border border-cyan-400/30 rounded-xl relative">
            <div className="p-4 border-b border-cyan-400/20">
              <h2 className="text-2xl font-bold text-cyan-400">INTERACTIVE SECURITY FORTRESS</h2>
              <p className="text-sm text-white/60 mt-1">Click layers to explore control coverage • Hover for details</p>
            </div>
            
            <div ref={fortressRef} className="h-[calc(100%-80px)]" />
            
            {/* Hover tooltip */}
            {hoveredLayer && (
              <div className="absolute bottom-4 left-4 bg-black/95 border border-cyan-400/50 rounded-lg p-3 backdrop-blur-xl">
                <div className="text-sm font-bold text-cyan-400">{hoveredLayer.control || hoveredLayer.type}</div>
                {hoveredLayer.coverage && (
                  <div className="text-xs text-white mt-1">
                    <div>Coverage: {hoveredLayer.coverage?.toFixed(1)}%</div>
                    {hoveredLayer.protected && (
                      <div>Protected: {hoveredLayer.protected?.toLocaleString()} hosts</div>
                    )}
                    <div className="text-cyan-400 mt-1">Click for detailed analysis →</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Metrics Panel */}
        <div className="col-span-4 space-y-4">
          {/* Combined Coverage */}
          <div className="bg-black/90 border border-cyan-400/30 rounded-xl p-4 cursor-pointer hover:border-cyan-400 transition-all" 
               onClick={() => setDetailView('overview')}>
            <h3 className="text-lg font-bold text-white mb-3">COMBINED SECURITY COVERAGE</h3>
            <div className="text-5xl font-bold text-center py-4">
              <span className={combinedCoverage < 50 ? 'text-purple-400' : 'text-cyan-400'}>
                {combinedCoverage.toFixed(1)}%
              </span>
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

          {/* Interactive Coverage Flow */}
          <div className="bg-black/90 border border-cyan-400/30 rounded-xl p-4">
            <h3 className="text-lg font-bold text-white mb-3">CONTROL COVERAGE FLOW</h3>
            <canvas ref={coverageFlowRef} className="w-full h-32 cursor-pointer" />
          </div>

          {/* Pulse Wave */}
          <div className="bg-black/90 border border-cyan-400/30 rounded-xl p-4">
            <h3 className="text-lg font-bold text-white mb-3">SECURITY PULSE</h3>
            <canvas ref={pulseWaveRef} className="w-full h-24" />
          </div>

          {/* Quick Actions */}
          <div className="bg-black/90 border border-purple-400/30 rounded-xl p-4">
            <h3 className="text-sm font-bold text-purple-400 mb-2">CRITICAL ACTIONS</h3>
            <div className="space-y-2">
              <button 
                onClick={() => searchSecurityHosts('tanium', 'missing').then(data => {
                  setSearchResults(data);
                  setDetailView('search');
                })}
                className="w-full text-left p-2 bg-black/50 border border-purple-400/30 rounded hover:bg-purple-400/10 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white">Find Unprotected Tanium Hosts</span>
                  <ChevronRight className="w-4 h-4 text-purple-400" />
                </div>
              </button>
              <button 
                onClick={() => searchSecurityHosts('cmdb', 'missing').then(data => {
                  setSearchResults(data);
                  setDetailView('search');
                })}
                className="w-full text-left p-2 bg-black/50 border border-purple-400/30 rounded hover:bg-purple-400/10 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white">Find Unregistered CMDB Assets</span>
                  <ChevronRight className="w-4 h-4 text-purple-400" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed View Modal */}
      {detailView && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-6">
          <div className="bg-black border-2 border-cyan-400/50 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-cyan-400/30 flex items-center justify-between">
              <h2 className="text-xl font-bold text-cyan-400">
                {detailView === 'control' ? 'SECURITY CONTROL DETAILS' : 
                 detailView === 'metrics' ? 'COVERAGE METRICS' :
                 detailView === 'search' ? 'HOST SEARCH RESULTS' : 
                 'SECURITY OVERVIEW'}
              </h2>
              <button 
                onClick={() => {
                  setDetailView(null);
                  setSelectedControl(null);
                  setSearchResults(null);
                }}
                className="text-white hover:text-cyan-400 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              {selectedControl && detailView === 'control' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-black/50 border border-cyan-400/30 rounded-lg p-4">
                      <div className="text-2xl font-bold text-white">
                        {selectedControl.protected?.toLocaleString() || selectedControl.deployed?.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-400">Protected Hosts</div>
                    </div>
                    <div className="bg-black/50 border border-cyan-400/30 rounded-lg p-4">
                      <div className="text-2xl font-bold text-cyan-400">{selectedControl.coverage?.toFixed(1)}%</div>
                      <div className="text-xs text-gray-400">Coverage Rate</div>
                    </div>
                    <div className="bg-black/50 border border-purple-400/30 rounded-lg p-4">
                      <div className="text-2xl font-bold text-purple-400">
                        {(selectedControl.total - (selectedControl.protected || selectedControl.deployed || 0)).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-400">Unprotected</div>
                    </div>
                  </div>

                  {selectedControl.data?.regional_coverage && (
                    <div className="mt-6">
                      <h3 className="text-lg font-bold text-cyan-400 mb-3">REGIONAL BREAKDOWN</h3>
                      <div className="bg-black/50 border border-cyan-400/30 rounded-lg overflow-hidden">
                        <div className="max-h-48 overflow-y-auto">
                          {Object.entries(selectedControl.data.regional_coverage).map(([region, data]) => (
                            <div key={region} className="p-2 border-b border-gray-800 hover:bg-cyan-400/5">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-white capitalize">{region}</span>
                                <div className="flex items-center gap-4">
                                  <span className="text-xs text-gray-400">
                                    {data.deployed || data.registered}/{data.total}
                                  </span>
                                  <span className={`text-sm font-bold ${
                                    data.coverage_percentage > 70 ? 'text-cyan-400' : 
                                    data.coverage_percentage > 40 ? 'text-yellow-400' : 
                                    'text-purple-400'
                                  }`}>
                                    {data.coverage_percentage?.toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {searchResults && detailView === 'search' && (
                <div className="space-y-4">
                  <div className="bg-black/50 border border-cyan-400/30 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-2xl font-bold text-white">{searchResults.total_found}</div>
                        <div className="text-xs text-gray-400">Total Hosts Found</div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">CMDB: </span>
                          <span className="text-cyan-400">{searchResults.search_summary?.cmdb_registered || 0}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Tanium: </span>
                          <span className="text-cyan-400">{searchResults.search_summary?.tanium_deployed || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {searchResults.hosts && searchResults.hosts.length > 0 && (
                    <div className="bg-black/50 border border-cyan-400/30 rounded-lg overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-black/70">
                          <tr className="border-b border-cyan-400/30">
                            <th className="text-left p-2 text-cyan-400">Host</th>
                            <th className="text-left p-2 text-cyan-400">Region</th>
                            <th className="text-left p-2 text-cyan-400">Infrastructure</th>
                            <th className="text-left p-2 text-cyan-400">CMDB</th>
                            <th className="text-left p-2 text-cyan-400">Tanium</th>
                          </tr>
                        </thead>
                        <tbody>
                          {searchResults.hosts.slice(0, 50).map((host, idx) => (
                            <tr key={idx} className="border-b border-gray-800 hover:bg-cyan-400/5">
                              <td className="p-2 text-white font-mono">{host.host}</td>
                              <td className="p-2 text-gray-400">{host.region}</td>
                              <td className="p-2 text-gray-400">{host.infrastructure_type}</td>
                              <td className="p-2">
                                {host.present_in_cmdb?.toLowerCase().includes('yes') ? 
                                  <CheckCircle className="w-4 h-4 text-cyan-400" /> : 
                                  <XCircle className="w-4 h-4 text-purple-400" />}
                              </td>
                              <td className="p-2">
                                {host.tanium_coverage?.toLowerCase().includes('tanium') ? 
                                  <CheckCircle className="w-4 h-4 text-cyan-400" /> : 
                                  <XCircle className="w-4 h-4 text-purple-400" />}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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

export default SecurityControlCoverage;