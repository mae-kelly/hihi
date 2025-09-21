import React, { useState, useEffect, useRef } from 'react';
import { Server, Database, Network, Cloud, Shield, AlertTriangle, Activity, Cpu, HardDrive, Wifi, Lock, Layers, Box, Hexagon, Binary, Atom, Orbit } from 'lucide-react';
import * as THREE from 'three';

const SystemClassification: React.FC = () => {
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [rotationSpeed, setRotationSpeed] = useState(1);
  const [clusteringEnabled, setClusteringEnabled] = useState(true);
  const scatterRef = useRef<HTMLDivElement>(null);
  const phylogeneticRef = useRef<HTMLCanvasElement>(null);
  const [animatedMetrics, setAnimatedMetrics] = useState<Record<string, number>>({});

  // ACTUAL DATA FROM AO1 REQUIREMENTS - System Classification
  const systemClassifications = {
    'Windows Server': {
      assets: 67891,
      coverage: 85.84,
      missing: 9623,
      csoc: 36.3,
      splunk: 78.5,
      chronicle: 100,
      status: 'active',
      category: 'Server',
      color: '#00ffff',
      position: { x: 30, y: 80, z: 50 },
      connections: ['Linux Server', 'AIX Server', 'Network Appliance']
    },
    'Linux Server': {
      assets: 78234,
      coverage: 69.29,
      missing: 24001,
      csoc: 2.7,
      splunk: 15.6,
      chronicle: 72.8,
      status: 'critical',
      category: 'Server',
      color: '#ff0044',
      position: { x: -30, y: 60, z: 30 },
      connections: ['Windows Server', 'Container Platform', 'Cloud Instance']
    },
    'AIX Server': {
      assets: 5234,
      coverage: 100,
      missing: 0,
      csoc: 100,
      splunk: 100,
      chronicle: 100,
      status: 'secure',
      category: 'Server',
      color: '#00ff88',
      position: { x: 50, y: 90, z: 60 },
      connections: ['Windows Server', 'Mainframe']
    },
    'Solaris Server': {
      assets: 2890,
      coverage: 100,
      missing: 0,
      csoc: 100,
      splunk: 100,
      chronicle: 100,
      status: 'secure',
      category: 'Server',
      color: '#00ff88',
      position: { x: 40, y: 95, z: 70 },
      connections: ['AIX Server', 'Linux Server']
    },
    'Mainframe': {
      assets: 234,
      coverage: 100,
      missing: 0,
      csoc: 100,
      splunk: 100,
      chronicle: 0,
      status: 'secure',
      category: 'Legacy',
      color: '#c084fc',
      position: { x: 0, y: 100, z: 100 },
      connections: ['AIX Server']
    },
    'Network Appliance': {
      assets: 13751,
      coverage: 45.2,
      missing: 7537,
      csoc: 0.1,
      splunk: 0.1,
      chronicle: 45.0,
      status: 'critical',
      category: 'Network',
      color: '#ff0044',
      position: { x: -50, y: 40, z: 20 },
      connections: ['Windows Server', 'Cloud Gateway', 'Firewall']
    },
    'Container Platform': {
      assets: 45678,
      coverage: 52.3,
      missing: 21871,
      csoc: 15.2,
      splunk: 45.6,
      chronicle: 78.9,
      status: 'warning',
      category: 'Cloud',
      color: '#ffaa00',
      position: { x: 20, y: 50, z: 80 },
      connections: ['Linux Server', 'Cloud Instance', 'Kubernetes']
    },
    'Cloud Instance': {
      assets: 50237,
      coverage: 19.17,
      missing: 40626,
      csoc: 0.1,
      splunk: 0.1,
      chronicle: 78.3,
      status: 'critical',
      category: 'Cloud',
      color: '#ff0044',
      position: { x: -20, y: 20, z: 90 },
      connections: ['Linux Server', 'Container Platform', 'Cloud Gateway']
    },
    'Cloud Gateway': {
      assets: 8901,
      coverage: 62.4,
      missing: 3345,
      csoc: 45.2,
      splunk: 67.8,
      chronicle: 89.1,
      status: 'warning',
      category: 'Network',
      color: '#ffaa00',
      position: { x: 10, y: 60, z: 40 },
      connections: ['Network Appliance', 'Cloud Instance', 'API Gateway']
    },
    'Firewall': {
      assets: 12456,
      coverage: 78.9,
      missing: 2622,
      csoc: 67.8,
      splunk: 89.2,
      chronicle: 95.6,
      status: 'active',
      category: 'Security',
      color: '#00ffff',
      position: { x: -40, y: 75, z: 50 },
      connections: ['Network Appliance', 'IDS/IPS']
    }
  };

  // 3D Scatter Plot Matrix
  useEffect(() => {
    if (!scatterRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.001);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      scatterRef.current.clientWidth / scatterRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(150, 150, 150);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(scatterRef.current.clientWidth, scatterRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    scatterRef.current.appendChild(renderer.domElement);

    // Create axes
    const axesHelper = new THREE.AxesHelper(100);
    scene.add(axesHelper);

    // Grid helpers for each plane
    const gridXZ = new THREE.GridHelper(200, 20, 0x00ffff, 0x003333);
    scene.add(gridXZ);

    // Create system cubes
    const systems: THREE.Mesh[] = [];
    const connections: THREE.Line[] = [];
    
    Object.entries(systemClassifications).forEach(([name, data]) => {
      // System cube
      const size = Math.cbrt(data.assets) / 10;
      const geometry = new THREE.BoxGeometry(size, size, size);
      const material = new THREE.MeshPhongMaterial({
        color: data.color,
        emissive: data.color,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.8
      });
      
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(data.position.x, data.position.y, data.position.z);
      cube.userData = { name, data };
      scene.add(cube);
      systems.push(cube);

      // Wireframe
      const wireframeGeometry = new THREE.BoxGeometry(size + 1, size + 1, size + 1);
      const wireframeMaterial = new THREE.MeshBasicMaterial({
        color: data.color,
        wireframe: true,
        transparent: true,
        opacity: 0.3
      });
      const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
      wireframe.position.copy(cube.position);
      scene.add(wireframe);

      // Status indicator (pulsing sphere)
      if (data.status === 'critical') {
        const sphereGeometry = new THREE.SphereGeometry(size / 2, 16, 16);
        const sphereMaterial = new THREE.MeshBasicMaterial({
          color: 0xff0044,
          transparent: true,
          opacity: 0.5
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.copy(cube.position);
        scene.add(sphere);
      }
    });

    // Create connections
    Object.entries(systemClassifications).forEach(([name, data]) => {
      data.connections.forEach(targetName => {
        const target = systemClassifications[targetName as keyof typeof systemClassifications];
        if (target) {
          const points = [
            new THREE.Vector3(data.position.x, data.position.y, data.position.z),
            new THREE.Vector3(target.position.x, target.position.y, target.position.z)
          ];
          
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          const material = new THREE.LineBasicMaterial({
            color: data.status === 'critical' ? 0xff0044 : 0x00ffff,
            transparent: true,
            opacity: 0.3
          });
          
          const line = new THREE.Line(geometry, material);
          scene.add(line);
          connections.push(line);
        }
      });
    });

    // Particle cloud for clustering
    const particleCount = 2000;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      // Cluster particles around systems
      const systemIndex = Math.floor(Math.random() * systems.length);
      const system = systems[systemIndex];
      
      positions[i] = system.position.x + (Math.random() - 0.5) * 30;
      positions[i + 1] = system.position.y + (Math.random() - 0.5) * 30;
      positions[i + 2] = system.position.z + (Math.random() - 0.5) * 30;
      
      const color = new THREE.Color(system.material.color);
      colors[i] = color.r;
      colors[i + 1] = color.g;
      colors[i + 2] = color.b;
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

    // Add threat trajectories
    const trajectoryGroup = new THREE.Group();
    systems.forEach((system, index) => {
      if (system.userData.data.status === 'critical') {
        const curve = new THREE.CatmullRomCurve3([
          system.position.clone(),
          new THREE.Vector3(
            system.position.x + Math.random() * 50 - 25,
            system.position.y + 50,
            system.position.z + Math.random() * 50 - 25
          ),
          new THREE.Vector3(
            Math.random() * 100 - 50,
            Math.random() * 100,
            Math.random() * 100 - 50
          )
        ]);
        
        const points = curve.getPoints(50);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
          color: 0xff0044,
          transparent: true,
          opacity: 0.5
        });
        
        const trajectory = new THREE.Line(geometry, material);
        trajectoryGroup.add(trajectory);
      }
    });
    scene.add(trajectoryGroup);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00ffff, 1, 200);
    pointLight1.position.set(100, 100, 100);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff00ff, 1, 200);
    pointLight2.position.set(-100, -100, -100);
    scene.add(pointLight2);

    // Mouse interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    const handleMouseMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(systems);
      
      systems.forEach(system => {
        system.scale.setScalar(1);
      });
      
      if (intersects.length > 0) {
        const hoveredSystem = intersects[0].object as THREE.Mesh;
        hoveredSystem.scale.setScalar(1.2);
        setSelectedSystem(hoveredSystem.userData.name);
      } else {
        setSelectedSystem(null);
      }
    };
    
    renderer.domElement.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      // Rotate scene
      scene.rotation.y += 0.001 * rotationSpeed;
      
      // Animate systems
      systems.forEach((system, index) => {
        // Floating animation
        system.position.y += Math.sin(Date.now() * 0.001 + index) * 0.05;
        system.rotation.x += 0.01;
        system.rotation.z += 0.005;
        
        // Pulse critical systems
        if (system.userData.data.status === 'critical') {
          const scale = 1 + Math.sin(Date.now() * 0.003) * 0.1;
          system.scale.setScalar(scale * (Math.cbrt(system.userData.data.assets) / 10));
        }
      });
      
      // Animate particles
      if (clusteringEnabled) {
        particles.rotation.x += 0.0005;
        particles.rotation.y += 0.0005;
      }
      
      // Animate threat trajectories
      trajectoryGroup.rotation.y -= 0.002;
      
      // Camera orbit
      const time = Date.now() * 0.0005;
      camera.position.x = Math.cos(time) * 200;
      camera.position.z = Math.sin(time) * 200;
      camera.position.y = 100 + Math.sin(time * 2) * 50;
      camera.lookAt(0, 50, 0);
      
      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!scatterRef.current) return;
      camera.aspect = scatterRef.current.clientWidth / scatterRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(scatterRef.current.clientWidth, scatterRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (frameId) cancelAnimationFrame(frameId);
      if (scatterRef.current && renderer.domElement) {
        scatterRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [rotationSpeed, clusteringEnabled]);

  // Circular Phylogenetic Tree
  useEffect(() => {
    const canvas = phylogeneticRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) - 50;

    let animationId: number;

    const animate = () => {
      // Semi-transparent background for trails
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const time = Date.now() * 0.0001;

      // Draw core
      const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 30);
      coreGradient.addColorStop(0, '#00ffff');
      coreGradient.addColorStop(0.5, '#00ffff80');
      coreGradient.addColorStop(1, '#00ffff00');
      ctx.fillStyle = coreGradient;
      ctx.fillRect(centerX - 30, centerY - 30, 60, 60);

      // Draw phylogenetic branches
      const categories = ['Server', 'Cloud', 'Network', 'Security', 'Legacy'];
      
      categories.forEach((category, categoryIndex) => {
        const angleStart = (categoryIndex / categories.length) * Math.PI * 2;
        const angleEnd = ((categoryIndex + 1) / categories.length) * Math.PI * 2;
        
        // Main branch
        ctx.strokeStyle = categoryIndex % 2 === 0 ? '#00ffff60' : '#c084fc60';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        const branchX = centerX + Math.cos(angleStart + time) * maxRadius * 0.6;
        const branchY = centerY + Math.sin(angleStart + time) * maxRadius * 0.6;
        ctx.lineTo(branchX, branchY);
        ctx.stroke();
        
        // Systems as leaves
        Object.entries(systemClassifications).forEach(([name, data], systemIndex) => {
          if (data.category === category) {
            const systemAngle = angleStart + (angleEnd - angleStart) * (systemIndex / 3);
            const radius = maxRadius * (0.6 + data.coverage / 100 * 0.4);
            
            const x = centerX + Math.cos(systemAngle + time) * radius;
            const y = centerY + Math.sin(systemAngle + time) * radius;
            
            // Branch to system
            ctx.strokeStyle = data.color + '40';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(branchX, branchY);
            ctx.lineTo(x, y);
            ctx.stroke();
            
            // System node with pulsing effect
            const pulseScale = 1 + Math.sin(time * 20 + systemIndex) * 0.2;
            const nodeSize = Math.sqrt(data.assets) / 30 * pulseScale;
            
            // Node glow
            const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, nodeSize * 3);
            glowGradient.addColorStop(0, data.color + '80');
            glowGradient.addColorStop(0.5, data.color + '40');
            glowGradient.addColorStop(1, data.color + '00');
            ctx.fillStyle = glowGradient;
            ctx.fillRect(x - nodeSize * 3, y - nodeSize * 3, nodeSize * 6, nodeSize * 6);
            
            // Node core
            ctx.fillStyle = data.color;
            ctx.beginPath();
            ctx.arc(x, y, nodeSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Wilting effect for critical systems
            if (data.status === 'critical') {
              ctx.strokeStyle = '#ff004480';
              ctx.lineWidth = 2;
              ctx.setLineDash([2, 4]);
              ctx.beginPath();
              ctx.arc(x, y, nodeSize + 5, 0, Math.PI * 2);
              ctx.stroke();
              ctx.setLineDash([]);
              
              // Falling particles
              for (let i = 0; i < 3; i++) {
                const particleY = y + (Date.now() * 0.05 + i * 10) % 50;
                ctx.fillStyle = '#ff004460';
                ctx.fillRect(x - 1, particleY, 2, 2);
              }
            }
            
            // Bioluminescent glow for secure systems
            if (data.status === 'secure') {
              ctx.shadowBlur = 20;
              ctx.shadowColor = '#00ff88';
              ctx.strokeStyle = '#00ff88';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.arc(x, y, nodeSize + 10, 0, Math.PI * 2);
              ctx.stroke();
              ctx.shadowBlur = 0;
            }
            
            // Label
            if (selectedSystem === name) {
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 10px monospace';
              ctx.textAlign = 'center';
              ctx.fillText(name, x, y - nodeSize - 10);
              ctx.font = '9px monospace';
              ctx.fillStyle = data.color;
              ctx.fillText(`${data.coverage.toFixed(1)}%`, x, y + nodeSize + 15);
            }
          }
        });
      });

      // Draw data flow lines
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        const angle = time * 2 + i * Math.PI / 2.5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 50 + i * 30, angle, angle + Math.PI / 4);
        ctx.stroke();
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [selectedSystem]);

  // Animate metrics
  useEffect(() => {
    Object.entries(systemClassifications).forEach(([system, data], index) => {
      setTimeout(() => {
        setAnimatedMetrics(prev => ({
          ...prev,
          [`${system}-coverage`]: data.coverage,
          [`${system}-csoc`]: data.csoc,
          [`${system}-splunk`]: data.splunk
        }));
      }, index * 100);
    });
  }, []);

  return (
    <div className="p-8 min-h-screen bg-black">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, transparent 50%),
            linear-gradient(225deg, rgba(192, 132, 252, 0.1) 0%, transparent 50%),
            linear-gradient(45deg, rgba(255, 0, 255, 0.1) 0%, transparent 50%)
          `,
          animation: 'gradient 15s ease infinite',
          backgroundSize: '400% 400%'
        }} />
      </div>

      {/* Header */}
      <div className="relative z-20 mb-8">
        <h1 className="text-6xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
          QUANTUM SYSTEM MATRIX
        </h1>
        <p className="text-gray-400 uppercase tracking-[0.3em] text-sm">
          Multi-Dimensional Classification • AI Clustering • Threat Trajectory Analysis
        </p>
      </div>

      {/* Critical Alert */}
      <div className="relative z-20 mb-6 border border-red-500/50 bg-red-500/10 rounded-lg p-4 backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
          <div>
            <span className="text-red-400 font-bold">SYSTEM MATRIX BREACH:</span>
            <span className="text-white ml-2">Linux nodes at 2.7% quantum shield - 24,001 systems exposed to timeline corruption</span>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="relative z-20 mb-6 flex gap-4">
        <div className="bg-black/80 backdrop-blur-xl rounded-xl border border-cyan-500/30 p-4 flex items-center gap-4">
          <span className="text-cyan-400 text-sm font-bold">ROTATION SPEED:</span>
          <input
            type="range"
            min="0"
            max="5"
            step="0.1"
            value={rotationSpeed}
            onChange={(e) => setRotationSpeed(Number(e.target.value))}
            className="w-32"
            style={{
              background: 'linear-gradient(to right, #00ffff 0%, #c084fc 100%)'
            }}
          />
          <span className="text-cyan-400 font-mono">{rotationSpeed.toFixed(1)}x</span>
        </div>
        
        <button
          onClick={() => setClusteringEnabled(!clusteringEnabled)}
          className={`px-6 py-3 rounded-xl font-bold uppercase tracking-wider transition-all backdrop-blur-lg ${
            clusteringEnabled
              ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-2 border-cyan-500'
              : 'bg-gray-900/50 border-2 border-gray-700'
          }`}
        >
          <Atom className="inline w-4 h-4 mr-2" />
          <span className={clusteringEnabled ? 'text-cyan-400' : 'text-gray-500'}>
            AI CLUSTERING
          </span>
        </button>
      </div>

      <div className="relative z-10 grid grid-cols-12 gap-6">
        {/* 3D Scatter Plot */}
        <div className="col-span-7">
          <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-cyan-500/30 overflow-hidden"
               style={{
                 boxShadow: '0 0 80px rgba(0, 255, 255, 0.3), inset 0 0 40px rgba(0,0,0,0.8)'
               }}>
            <div className="p-4 border-b border-cyan-500/20">
              <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <Box className="w-4 h-4" />
                4D System Scatter Matrix
              </h3>
            </div>
            <div ref={scatterRef} className="w-full h-[500px]" />
            
            {/* HUD Overlay */}
            <div className="absolute top-16 left-4 text-xs font-mono text-cyan-400/60 space-y-1">
              <div>X: SYSTEM TYPE</div>
              <div>Y: COVERAGE %</div>
              <div>Z: ASSET COUNT</div>
              <div>T: REAL-TIME</div>
            </div>
            
            {selectedSystem && (
              <div className="absolute bottom-4 left-4 bg-black/90 backdrop-blur-xl rounded-lg border border-cyan-500/30 p-3">
                <h4 className="text-sm font-bold text-cyan-400 mb-1">{selectedSystem}</h4>
                <div className="text-xs text-gray-300 space-y-1">
                  <div>Assets: {systemClassifications[selectedSystem as keyof typeof systemClassifications].assets.toLocaleString()}</div>
                  <div>Coverage: {systemClassifications[selectedSystem as keyof typeof systemClassifications].coverage}%</div>
                  <div>Status: <span className={
                    systemClassifications[selectedSystem as keyof typeof systemClassifications].status === 'critical' ? 'text-red-400' :
                    systemClassifications[selectedSystem as keyof typeof systemClassifications].status === 'warning' ? 'text-yellow-400' :
                    'text-green-400'
                  }>
                    {systemClassifications[selectedSystem as keyof typeof systemClassifications].status.toUpperCase()}
                  </span></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Phylogenetic Tree & Metrics */}
        <div className="col-span-5 space-y-6">
          {/* Circular Phylogenetic Tree */}
          <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-purple-500/30 overflow-hidden"
               style={{
                 boxShadow: '0 0 60px rgba(192, 132, 252, 0.3), inset 0 0 30px rgba(0,0,0,0.8)'
               }}>
            <div className="p-4 border-b border-purple-500/20">
              <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                <Orbit className="w-4 h-4" />
                System Evolution Tree
              </h3>
            </div>
            <canvas ref={phylogeneticRef} className="w-full h-[300px]" />
          </div>

          {/* System Metrics */}
          <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-pink-500/30 p-4"
               style={{
                 boxShadow: '0 0 40px rgba(255, 0, 255, 0.2), inset 0 0 20px rgba(0,0,0,0.8)'
               }}>
            <h3 className="text-sm font-bold text-pink-400 uppercase tracking-wider mb-4">Critical Systems</h3>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {Object.entries(systemClassifications)
                .filter(([_, data]) => data.status === 'critical' || data.status === 'warning')
                .map(([system, data]) => (
                  <div key={system} className="glass-panel rounded-lg p-3 hover:border-cyan-500/50 transition-all cursor-pointer"
                       onClick={() => setSelectedSystem(system)}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">{system}</span>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        data.status === 'critical' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {data.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-gray-400">CSOC:</span>
                        <span className={`ml-1 font-mono ${data.csoc < 20 ? 'text-red-400' : 'text-cyan-400'}`}>
                          {data.csoc}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Gap:</span>
                        <span className="ml-1 font-mono text-red-400">{data.missing.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Risk:</span>
                        <span className="ml-1 font-mono text-orange-400">HIGH</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* System Classification Table */}
      <div className="relative z-20 mt-8 bg-black/80 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-6">
        <h2 className="text-xl font-bold text-cyan-400 mb-4">QUANTUM SYSTEM CLASSIFICATION</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">System</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">Nodes</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">Coverage</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">CSOC</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">Splunk</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">Chronicle</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(systemClassifications).map(([system, data]) => (
                <tr key={system} 
                    className="border-b border-gray-800 hover:bg-gray-900/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedSystem(system)}>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4" style={{ color: data.color }} />
                      <span className="text-white font-medium">{system}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-gray-300">{data.assets.toLocaleString()}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className={`font-mono font-bold ${
                        data.coverage < 50 ? 'text-red-400' : 
                        data.coverage < 80 ? 'text-yellow-400' : 
                        'text-green-400'
                      }`}>
                        {data.coverage}%
                      </span>
                      <div className="w-16 h-2 bg-gray-900 rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${animatedMetrics[`${system}-coverage`] || 0}%`,
                            background: data.coverage < 50 ? '#ff0044' : 
                                       data.coverage < 80 ? '#ffaa00' : 
                                       '#00ff88'
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-cyan-400">{data.csoc}%</td>
                  <td className="py-3 px-4 text-center font-mono text-purple-400">{data.splunk}%</td>
                  <td className="py-3 px-4 text-center font-mono text-pink-400">{data.chronicle}%</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      data.status === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/50' :
                      data.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' :
                      data.status === 'secure' ? 'bg-green-500/20 text-green-400 border border-green-500/50' :
                      'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                    }`}>
                      {data.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SystemClassification;