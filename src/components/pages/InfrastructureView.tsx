import React, { useState, useEffect, useRef } from 'react';
import { Server, Cloud, Database, Network, Shield, AlertTriangle, TrendingDown, Activity, Cpu, HardDrive, Wifi, Lock, Layers, Globe, Zap, Box } from 'lucide-react';
import * as THREE from 'three';

const InfrastructureView: React.FC = () => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [animatedMetrics, setAnimatedMetrics] = useState<Record<string, number>>({});
  const layersRef = useRef<HTMLDivElement>(null);
  const neuralRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const frameRef = useRef<number>(0);

  // ACTUAL DATA FROM AO1 REQUIREMENTS
  const infrastructureData = {
    'On-Premise': {
      totalAssets: 168234,
      csocCoverage: 36.3,
      splunkCoverage: 78.5,
      chronicleCoverage: 95.1,
      missing: 107187,
      status: 'critical',
      color: '#00d4ff',
      icon: Server,
      layer: 0,
      trends: {
        daily: -0.3,
        weekly: -2.1,
        monthly: -5.4
      }
    },
    'Cloud': {
      totalAssets: 50237,
      csocCoverage: 0.1,
      splunkCoverage: 0.1,
      chronicleCoverage: 78.3,
      missing: 50187,
      status: 'critical',
      color: '#a855f7',
      icon: Cloud,
      layer: 1,
      trends: {
        daily: -1.2,
        weekly: -4.3,
        monthly: -12.7
      }
    },
    'SaaS': {
      totalAssets: 28456,
      csocCoverage: 57.5,
      splunkCoverage: 31.1,
      chronicleCoverage: 88.9,
      missing: 12089,
      status: 'warning',
      color: '#00d4ff',
      icon: Database,
      layer: 2,
      trends: {
        daily: 0,
        weekly: -0.8,
        monthly: -3.2
      }
    },
    'API': {
      totalAssets: 15105,
      csocCoverage: 60.0,
      splunkCoverage: 0.0,
      chronicleCoverage: 60.0,
      missing: 6042,
      status: 'warning',
      color: '#a855f7',
      icon: Network,
      layer: 3,
      trends: {
        daily: 0.2,
        weekly: 1.1,
        monthly: 3.8
      }
    }
  };

  // 3D Layered Infrastructure Visualization
  useEffect(() => {
    if (!layersRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.001);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      layersRef.current.clientWidth / layersRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(150, 100, 150);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(layersRef.current.clientWidth, layersRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    layersRef.current.appendChild(renderer.domElement);

    // Create infrastructure layers
    const layers: THREE.Mesh[] = [];
    const platforms: THREE.Group[] = [];
    
    Object.entries(infrastructureData).forEach(([type, data], index) => {
      const platformGroup = new THREE.Group();
      
      // Hexagonal platform
      const hexRadius = 60 - index * 10;
      const hexShape = new THREE.Shape();
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const x = Math.cos(angle) * hexRadius;
        const z = Math.sin(angle) * hexRadius;
        if (i === 0) hexShape.moveTo(x, z);
        else hexShape.lineTo(x, z);
      }
      hexShape.closePath();
      
      const extrudeSettings = {
        depth: 8,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 2,
        bevelSize: 1,
        bevelThickness: 1
      };
      
      const hexGeometry = new THREE.ExtrudeGeometry(hexShape, extrudeSettings);
      const hexMaterial = new THREE.MeshPhongMaterial({
        color: data.color,
        transparent: true,
        opacity: 0.7,
        emissive: data.color,
        emissiveIntensity: 0.2,
      });
      
      const hexMesh = new THREE.Mesh(hexGeometry, hexMaterial);
      hexMesh.rotation.x = Math.PI / 2;
      hexMesh.position.y = index * 30;
      platformGroup.add(hexMesh);
      
      // Add wireframe
      const wireframeMaterial = new THREE.MeshBasicMaterial({
        color: data.color,
        wireframe: true,
        transparent: true,
        opacity: 0.3,
      });
      const wireframe = new THREE.Mesh(hexGeometry, wireframeMaterial);
      wireframe.rotation.x = Math.PI / 2;
      wireframe.position.y = index * 30;
      platformGroup.add(wireframe);
      
      // Server nodes on platform
      const nodeCount = Math.floor(data.totalAssets / 15000);
      for (let i = 0; i < nodeCount; i++) {
        const angle = (i / nodeCount) * Math.PI * 2;
        const radius = hexRadius * 0.7;
        const nodeGeometry = new THREE.BoxGeometry(4, 8, 4);
        const nodeMaterial = new THREE.MeshPhongMaterial({
          color: data.missing > 20000 ? 0xa855f7 : 0x00d4ff,
          emissive: data.missing > 20000 ? 0xa855f7 : 0x00d4ff,
          emissiveIntensity: 0.3
        });
        const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
        node.position.set(
          Math.cos(angle) * radius,
          index * 30 + 8,
          Math.sin(angle) * radius
        );
        platformGroup.add(node);
      }
      
      scene.add(platformGroup);
      platforms.push(platformGroup);
      
      // Data particles flowing between layers
      const particleCount = 50;
      const particlesGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      
      for (let i = 0; i < particleCount * 3; i += 3) {
        const angle = Math.random() * Math.PI * 2;
        const radius = (60 - index * 10) * Math.random();
        positions[i] = radius * Math.cos(angle);
        positions[i + 1] = index * 30 + Math.random() * 30;
        positions[i + 2] = radius * Math.sin(angle);
        
        const color = new THREE.Color(data.color);
        colors[i] = color.r;
        colors[i + 1] = color.g;
        colors[i + 2] = color.b;
      }
      
      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      
      const particlesMaterial = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
      });
      
      const particles = new THREE.Points(particlesGeometry, particlesMaterial);
      scene.add(particles);
    });

    // Central data core
    const coreGeometry = new THREE.OctahedronGeometry(15, 2);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: 0xa855f7,
      emissive: 0xa855f7,
      emissiveIntensity: 0.5,
      wireframe: false
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.position.y = 45;
    scene.add(core);

    // Grid helper
    const gridHelper = new THREE.GridHelper(150, 15, 0x00d4ff, 0x001122);
    gridHelper.position.y = -15;
    scene.add(gridHelper);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(100, 100, 50);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x00d4ff, 1, 150);
    pointLight.position.set(0, 75, 0);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0xa855f7, 1, 150);
    pointLight2.position.set(-75, 40, -75);
    scene.add(pointLight2);

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      
      // Rotate platforms
      platforms.forEach((platform, index) => {
        platform.rotation.y += 0.002 * (index + 1);
      });
      
      // Animate core
      core.rotation.x += 0.01;
      core.rotation.y += 0.01;
      core.scale.setScalar(1 + Math.sin(Date.now() * 0.002) * 0.1);
      
      // Camera orbit
      const time = Date.now() * 0.0005;
      camera.position.x = Math.cos(time) * 180;
      camera.position.z = Math.sin(time) * 180;
      camera.position.y = 100 + Math.sin(time * 2) * 30;
      camera.lookAt(0, 45, 0);
      
      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!layersRef.current) return;
      camera.aspect = layersRef.current.clientWidth / layersRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(layersRef.current.clientWidth, layersRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (layersRef.current && renderer.domElement) {
        layersRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Neural Network Canvas
  useEffect(() => {
    const canvas = neuralRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const nodes = Object.entries(infrastructureData).map(([type, data], i) => ({
      x: canvas.width / 2 + Math.cos(i * Math.PI * 2 / 4) * 80,
      y: canvas.height / 2 + Math.sin(i * Math.PI * 2 / 4) * 80,
      type,
      data,
      pulsePhase: Math.random() * Math.PI * 2
    }));

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw connections
      nodes.forEach((node, i) => {
        nodes.forEach((target, j) => {
          if (i !== j) {
            const gradient = ctx.createLinearGradient(node.x, node.y, target.x, target.y);
            gradient.addColorStop(0, node.data.color + '20');
            gradient.addColorStop(1, target.data.color + '20');
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = Math.max(1, (node.data.csocCoverage + target.data.csocCoverage) / 50);
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            
            const cp1x = (node.x + target.x) / 2 + (Math.random() - 0.5) * 20;
            const cp1y = (node.y + target.y) / 2 + (Math.random() - 0.5) * 20;
            ctx.quadraticCurveTo(cp1x, cp1y, target.x, target.y);
            ctx.stroke();
            
            // Data packets
            if (Math.random() > 0.95) {
              const t = (Date.now() * 0.001) % 1;
              const px = node.x + (target.x - node.x) * t;
              const py = node.y + (target.y - node.y) * t;
              
              ctx.fillStyle = '#00d4ff';
              ctx.beginPath();
              ctx.arc(px, py, 2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        });
      });

      // Draw nodes
      nodes.forEach(node => {
        node.pulsePhase += 0.05;
        const size = Math.sqrt(node.data.totalAssets) / 60 * (1 + Math.sin(node.pulsePhase) * 0.1);
        
        // Node glow
        const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, size * 2);
        glow.addColorStop(0, node.data.color + '80');
        glow.addColorStop(1, node.data.color + '00');
        ctx.fillStyle = glow;
        ctx.fillRect(node.x - size * 2, node.y - size * 2, size * 4, size * 4);
        
        // Node core
        ctx.fillStyle = node.data.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(node.type, node.x, node.y - size - 10);
        ctx.font = '9px monospace';
        ctx.fillText(`${node.data.csocCoverage}%`, node.x, node.y + size + 15);
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  // Animate metrics
  useEffect(() => {
    Object.entries(infrastructureData).forEach(([type, data], index) => {
      setTimeout(() => {
        setAnimatedMetrics(prev => ({
          ...prev,
          [`${type}-csoc`]: data.csocCoverage,
          [`${type}-splunk`]: data.splunkCoverage,
          [`${type}-chronicle`]: data.chronicleCoverage
        }));
      }, index * 200);
    });
  }, []);

  const totalAssets = Object.values(infrastructureData).reduce((sum, d) => sum + d.totalAssets, 0);
  const totalMissing = Object.values(infrastructureData).reduce((sum, d) => sum + d.missing, 0);

  return (
    <div className="p-3 h-screen bg-black overflow-hidden flex flex-col">
      {/* Critical Alert */}
      <div className="mb-2 bg-black border border-purple-500/30 rounded-lg p-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-purple-400 animate-pulse" />
          <span className="text-purple-400 font-bold text-xs">BREACH:</span>
          <span className="text-white text-xs">Cloud infrastructure at 0.1% - Critical failure</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-6 gap-2 mb-3">
        {Object.entries(infrastructureData).map(([type, data]) => {
          const Icon = data.icon;
          return (
            <div key={type} className="bg-black/50 rounded-lg border border-white/10 p-2 hover:border-blue-500/50 transition-all">
              <Icon className="w-4 h-4 mb-1" style={{ color: data.color }} />
              <div className="text-lg font-bold text-white">{data.csocCoverage}%</div>
              <div className="text-[10px] text-white/60">{type}</div>
            </div>
          );
        })}
        <div className="bg-black/50 rounded-lg border border-purple-500/30 p-2">
          <AlertTriangle className="w-4 h-4 text-purple-400 mb-1" />
          <div className="text-lg font-bold text-purple-400">{(totalMissing / 1000).toFixed(0)}K</div>
          <div className="text-[10px] text-white/60">Missing</div>
        </div>
      </div>

      {/* Main Visualizations */}
      <div className="grid grid-cols-2 gap-3 mb-3 flex-1">
        {/* 3D Layered Infrastructure */}
        <div className="bg-black border border-blue-500/30 rounded-lg overflow-hidden">
          <div className="p-2 border-b border-blue-500/20">
            <h3 className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3 h-3" />
              Infrastructure Stack
            </h3>
          </div>
          <div ref={layersRef} className="w-full h-[240px]" />
        </div>

        {/* Neural Network */}
        <div className="bg-black border border-purple-500/30 rounded-lg overflow-hidden">
          <div className="p-2 border-b border-purple-500/20">
            <h3 className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              Neural Network
            </h3>
          </div>
          <canvas ref={neuralRef} className="w-full h-[240px]" />
        </div>
      </div>

      {/* Infrastructure Grid - Compact */}
      <div className="grid grid-cols-4 gap-2">
        {Object.entries(infrastructureData).map(([type, data]) => {
          const Icon = data.icon;
          return (
            <div key={type} className="bg-black/50 rounded-lg border p-2"
                 style={{
                   borderColor: data.status === 'critical' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(0, 212, 255, 0.3)'
                 }}>
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">
                  <Icon className="w-4 h-4" style={{ color: data.color }} />
                  <div>
                    <h3 className="text-sm font-bold text-white">{type}</h3>
                    <p className="text-[9px] text-white/60">{(data.totalAssets/1000).toFixed(0)}k nodes</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-purple-400">{(data.missing/1000).toFixed(0)}k</div>
                  <div className="text-[8px] text-white/60">BREACH</div>
                </div>
              </div>

              {/* Coverage Bars - Compact */}
              <div className="space-y-1">
                <div>
                  <div className="flex justify-between text-[9px] mb-1">
                    <span className="text-blue-400">CSOC</span>
                    <span className="font-mono text-blue-400">{data.csocCoverage}%</span>
                  </div>
                  <div className="h-1.5 bg-black/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-500"
                      style={{ width: `${animatedMetrics[`${type}-csoc`] || 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[9px] mb-1">
                    <span className="text-purple-400">Splunk</span>
                    <span className="font-mono text-purple-400">{data.splunkCoverage}%</span>
                  </div>
                  <div className="h-1.5 bg-black/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-purple-400 to-purple-500"
                      style={{ width: `${animatedMetrics[`${type}-splunk`] || 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[9px] mb-1">
                    <span className="text-blue-400">Chronicle</span>
                    <span className="font-mono text-blue-400">{data.chronicleCoverage}%</span>
                  </div>
                  <div className="h-1.5 bg-black/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-500"
                      style={{ width: `${animatedMetrics[`${type}-chronicle`] || 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Trends - Compact */}
              <div className="grid grid-cols-3 gap-1 mt-2">
                <div className="text-center bg-black/50 rounded p-1">
                  <div className="text-[8px] text-white/60">D</div>
                  <div className={`text-[10px] font-bold ${data.trends.daily < 0 ? 'text-purple-400' : 'text-blue-400'}`}>
                    {data.trends.daily > 0 ? '+' : ''}{data.trends.daily}%
                  </div>
                </div>
                <div className="text-center bg-black/50 rounded p-1">
                  <div className="text-[8px] text-white/60">W</div>
                  <div className={`text-[10px] font-bold ${data.trends.weekly < 0 ? 'text-purple-400' : 'text-blue-400'}`}>
                    {data.trends.weekly > 0 ? '+' : ''}{data.trends.weekly}%
                  </div>
                </div>
                <div className="text-center bg-black/50 rounded p-1">
                  <div className="text-[8px] text-white/60">M</div>
                  <div className={`text-[10px] font-bold ${data.trends.monthly < 0 ? 'text-purple-400' : 'text-blue-400'}`}>
                    {data.trends.monthly > 0 ? '+' : ''}{data.trends.monthly}%
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InfrastructureView;