import React, { useState, useEffect, useRef } from 'react';
import { Server, Cloud, Database, Network, Shield, AlertTriangle, TrendingDown, Activity, Cpu, HardDrive, Wifi, Lock, Layers, Globe, Zap, Box } from 'lucide-react';
import * as THREE from 'three';

const InfrastructureView: React.FC = () => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [animatedMetrics, setAnimatedMetrics] = useState<Record<string, number>>({});
  const layersRef = useRef<HTMLDivElement>(null);
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
      color: '#00ffff',
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
      color: '#c084fc',
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
      color: '#ff00ff',
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
      color: '#00ff88',
      icon: Network,
      layer: 3,
      trends: {
        daily: 0.2,
        weekly: 1.1,
        monthly: 3.8
      }
    }
  };

  // 3D Layered Cake Visualization
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
    camera.position.set(200, 150, 200);
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
    Object.entries(infrastructureData).forEach(([type, data], index) => {
      const height = (data.totalAssets / 200000) * 50;
      const geometry = new THREE.CylinderGeometry(80 - index * 10, 80 - index * 10, height, 32, 1, false);
      const material = new THREE.MeshPhongMaterial({
        color: data.color,
        transparent: true,
        opacity: 0.7,
        emissive: data.color,
        emissiveIntensity: 0.2,
      });
      
      const layer = new THREE.Mesh(geometry, material);
      layer.position.y = index * 30;
      scene.add(layer);
      layers.push(layer);

      // Add wireframe
      const wireframeGeometry = new THREE.CylinderGeometry(81 - index * 10, 81 - index * 10, height + 1, 16, 1, false);
      const wireframeMaterial = new THREE.MeshBasicMaterial({
        color: data.color,
        wireframe: true,
        transparent: true,
        opacity: 0.3,
      });
      const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
      wireframe.position.y = index * 30;
      scene.add(wireframe);

      // Add data particles flowing between layers
      const particleCount = 100;
      const particlesGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      
      for (let i = 0; i < particleCount * 3; i += 3) {
        const angle = Math.random() * Math.PI * 2;
        const radius = (80 - index * 10) * Math.random();
        positions[i] = radius * Math.cos(angle);
        positions[i + 1] = index * 30 + Math.random() * height;
        positions[i + 2] = radius * Math.sin(angle);
      }
      
      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const particlesMaterial = new THREE.PointsMaterial({
        color: data.color,
        size: 2,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
      });
      
      const particles = new THREE.Points(particlesGeometry, particlesMaterial);
      scene.add(particles);
    });

    // Grid helper
    const gridHelper = new THREE.GridHelper(200, 20, 0x00ffff, 0x003333);
    gridHelper.position.y = -20;
    scene.add(gridHelper);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(100, 100, 50);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x00ffff, 1, 200);
    pointLight.position.set(0, 50, 0);
    scene.add(pointLight);

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      
      // Rotate layers
      layers.forEach((layer, index) => {
        layer.rotation.y += 0.002 * (index + 1);
      });
      
      // Camera orbit
      const time = Date.now() * 0.0005;
      camera.position.x = Math.cos(time) * 200;
      camera.position.z = Math.sin(time) * 200;
      camera.lookAt(0, 30, 0);
      
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

  // Neural Network Topology
  const NeuralNetwork = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      const nodes = Object.entries(infrastructureData).map(([type, data], i) => ({
        x: canvas.width / 2 + Math.cos(i * Math.PI * 2 / 4) * 150,
        y: canvas.height / 2 + Math.sin(i * Math.PI * 2 / 4) * 150,
        type,
        data,
        connections: []
      }));

      const animate = () => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw connections
        nodes.forEach((node, i) => {
          nodes.forEach((target, j) => {
            if (i !== j) {
              const gradient = ctx.createLinearGradient(node.x, node.y, target.x, target.y);
              gradient.addColorStop(0, node.data.color + '40');
              gradient.addColorStop(1, target.data.color + '40');
              
              ctx.strokeStyle = gradient;
              ctx.lineWidth = Math.max(1, (node.data.csocCoverage + target.data.csocCoverage) / 50);
              ctx.beginPath();
              ctx.moveTo(node.x, node.y);
              
              // Create curved path
              const cp1x = (node.x + target.x) / 2 + (Math.random() - 0.5) * 50;
              const cp1y = (node.y + target.y) / 2 + (Math.random() - 0.5) * 50;
              ctx.quadraticCurveTo(cp1x, cp1y, target.x, target.y);
              ctx.stroke();
            }
          });
        });

        // Draw nodes
        nodes.forEach(node => {
          const size = Math.sqrt(node.data.totalAssets) / 50;
          
          // Node glow
          const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, size * 3);
          glow.addColorStop(0, node.data.color + '80');
          glow.addColorStop(1, node.data.color + '00');
          ctx.fillStyle = glow;
          ctx.fillRect(node.x - size * 3, node.y - size * 3, size * 6, size * 6);
          
          // Node core
          ctx.fillStyle = node.data.color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
          ctx.fill();
          
          // Pulse effect
          ctx.strokeStyle = node.data.color;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.5 * (1 + Math.sin(Date.now() * 0.003));
          ctx.beginPath();
          ctx.arc(node.x, node.y, size + 10, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
          
          // Label
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(node.type, node.x, node.y - size - 15);
          ctx.font = '10px monospace';
          ctx.fillText(`${node.data.csocCoverage}%`, node.x, node.y + size + 20);
        });

        requestAnimationFrame(animate);
      };

      animate();
    }, []);

    return <canvas ref={canvasRef} className="w-full h-full" />;
  };

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
    <div className="p-8 min-h-screen bg-black">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(45deg, transparent 30%, rgba(0, 255, 255, 0.1) 50%, transparent 70%),
            linear-gradient(-45deg, transparent 30%, rgba(192, 132, 252, 0.1) 50%, transparent 70%)
          `,
          backgroundSize: '200% 200%',
          animation: 'gradient 15s ease infinite'
        }} />
      </div>

      {/* Header */}
      <div className="relative z-20 mb-8">
        <h1 className="text-6xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
          INFRASTRUCTURE QUANTUM LAYERS
        </h1>
        <p className="text-gray-400 uppercase tracking-[0.3em] text-sm">
          MULTI-DIMENSIONAL ASSET TOPOLOGY • {totalAssets.toLocaleString()} NODES
        </p>
      </div>

      {/* Critical Alerts */}
      <div className="relative z-20 space-y-3 mb-6">
        <div className="border border-red-500/50 bg-red-500/10 rounded-lg p-4 backdrop-blur-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
            <div>
              <span className="text-red-400 font-bold">DIMENSION BREACH:</span>
              <span className="text-white ml-2">Cloud infrastructure at 0.1% - Quantum firewall compromised</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="relative z-20 grid grid-cols-6 gap-4 mb-8">
        {Object.entries(infrastructureData).map(([type, data]) => {
          const Icon = data.icon;
          return (
            <div key={type} className="bg-black/80 backdrop-blur-xl rounded-xl border border-gray-800 p-4 hover:border-cyan-500/50 transition-all">
              <Icon className="w-6 h-6 mb-2" style={{ color: data.color }} />
              <div className="text-2xl font-bold text-white">{data.csocCoverage}%</div>
              <div className="text-xs text-gray-400">{type}</div>
            </div>
          );
        })}
        <div className="bg-black/80 backdrop-blur-xl rounded-xl border border-red-500/30 p-4">
          <AlertTriangle className="w-6 h-6 text-red-400 mb-2" />
          <div className="text-2xl font-bold text-red-400">{(totalMissing / 1000).toFixed(0)}K</div>
          <div className="text-xs text-gray-400">Missing</div>
        </div>
      </div>

      {/* Main Visualizations */}
      <div className="relative z-10 grid grid-cols-2 gap-6 mb-8">
        {/* 3D Layered Cake */}
        <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-cyan-500/30 overflow-hidden"
             style={{
               boxShadow: '0 0 80px rgba(0, 255, 255, 0.2), inset 0 0 40px rgba(0,0,0,0.8)'
             }}>
          <div className="p-4 border-b border-cyan-500/20">
            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Infrastructure Stack Topology
            </h3>
          </div>
          <div ref={layersRef} className="w-full h-[400px]" />
          <div className="absolute top-16 left-4 text-xs font-mono text-cyan-400/60 space-y-1">
            <div>ROTATION: AUTO</div>
            <div>PARTICLES: ACTIVE</div>
            <div>LAYER ISOLATION: OFF</div>
          </div>
        </div>

        {/* Neural Network */}
        <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-purple-500/30 overflow-hidden"
             style={{
               boxShadow: '0 0 80px rgba(192, 132, 252, 0.2), inset 0 0 40px rgba(0,0,0,0.8)'
             }}>
          <div className="p-4 border-b border-purple-500/20">
            <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              Neural Infrastructure Network
            </h3>
          </div>
          <div className="w-full h-[400px]">
            <NeuralNetwork />
          </div>
        </div>
      </div>

      {/* Infrastructure Grid */}
      <div className="relative z-20 grid grid-cols-2 gap-6">
        {Object.entries(infrastructureData).map(([type, data]) => {
          const Icon = data.icon;
          return (
            <div key={type} className="bg-black/80 backdrop-blur-xl rounded-2xl border p-6 hover:scale-[1.02] transition-all"
                 style={{
                   borderColor: data.status === 'critical' ? 'rgba(255, 0, 68, 0.5)' : 'rgba(255, 170, 0, 0.5)',
                   boxShadow: `0 0 40px ${data.color}20`
                 }}>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Icon className="w-8 h-8" style={{ color: data.color }} />
                  <div>
                    <h3 className="text-2xl font-bold text-white">{type}</h3>
                    <p className="text-sm text-gray-400">{data.totalAssets.toLocaleString()} quantum nodes</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-red-400">{data.missing.toLocaleString()}</div>
                  <div className="text-xs text-gray-400 uppercase">Breached</div>
                </div>
              </div>

              {/* Coverage Bars */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-cyan-400">CSOC Shield</span>
                    <span className="font-mono text-cyan-400">{data.csocCoverage}%</span>
                  </div>
                  <div className="h-3 bg-gray-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${animatedMetrics[`${type}-csoc`] || 0}%`,
                        background: data.csocCoverage < 20 
                          ? 'linear-gradient(90deg, #ff0044, #ff00ff)' 
                          : 'linear-gradient(90deg, #00ffff, #00ccff)',
                        boxShadow: `0 0 10px ${data.csocCoverage < 20 ? '#ff0044' : '#00ffff'}`
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-purple-400">Splunk Matrix</span>
                    <span className="font-mono text-purple-400">{data.splunkCoverage}%</span>
                  </div>
                  <div className="h-3 bg-gray-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${animatedMetrics[`${type}-splunk`] || 0}%`,
                        background: 'linear-gradient(90deg, #c084fc, #a855f7)',
                        boxShadow: '0 0 10px #c084fc'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-pink-400">Chronicle Core</span>
                    <span className="font-mono text-pink-400">{data.chronicleCoverage}%</span>
                  </div>
                  <div className="h-3 bg-gray-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${animatedMetrics[`${type}-chronicle`] || 0}%`,
                        background: 'linear-gradient(90deg, #ff00ff, #ff00aa)',
                        boxShadow: '0 0 10px #ff00ff'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Trends */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="text-center bg-gray-900/50 rounded-lg p-2">
                  <div className="text-xs text-gray-400">Daily Δ</div>
                  <div className={`text-sm font-bold ${data.trends.daily < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {data.trends.daily > 0 ? '+' : ''}{data.trends.daily}%
                  </div>
                </div>
                <div className="text-center bg-gray-900/50 rounded-lg p-2">
                  <div className="text-xs text-gray-400">Weekly Δ</div>
                  <div className={`text-sm font-bold ${data.trends.weekly < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {data.trends.weekly > 0 ? '+' : ''}{data.trends.weekly}%
                  </div>
                </div>
                <div className="text-center bg-gray-900/50 rounded-lg p-2">
                  <div className="text-xs text-gray-400">Monthly Δ</div>
                  <div className={`text-sm font-bold ${data.trends.monthly < 0 ? 'text-red-400' : 'text-green-400'}`}>
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