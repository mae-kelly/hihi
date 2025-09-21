import React, { useState, useEffect, useRef } from 'react';
import { Shield, Activity, Database, Server, Cloud, AlertCircle, TrendingDown, Eye, BarChart3, Network, Layers, Zap, Cpu, HardDrive, Lock, Globe, Radar, Satellite, Binary, Code } from 'lucide-react';
import * as THREE from 'three';

interface DashboardProps {
  metrics: {
    totalAssets: number;
    csocCoverage: number;
    splunkCoverage: number;
    chronicleCoverage: number;
    criticalGaps: number;
    complianceStatus: string;
    riskLevel: string;
  };
}

const Dashboard: React.FC<DashboardProps> = ({ metrics }) => {
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({});
  const hologramRef = useRef<HTMLDivElement>(null);
  const matrixRef = useRef<HTMLCanvasElement>(null);
  const pulseRef = useRef<HTMLCanvasElement>(null);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  // 3D Holographic Core Visualization
  useEffect(() => {
    if (!hologramRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.002);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      hologramRef.current.clientWidth / hologramRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 50, 150);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(hologramRef.current.clientWidth, hologramRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    hologramRef.current.appendChild(renderer.domElement);

    // Central Core - Multi-layered sphere
    const coreGroup = new THREE.Group();
    
    // Inner core
    const innerGeometry = new THREE.IcosahedronGeometry(15, 2);
    const innerMaterial = new THREE.MeshPhongMaterial({
      color: 0xff00ff,
      emissive: 0xff00ff,
      emissiveIntensity: 0.5,
      wireframe: false,
      transparent: true,
      opacity: 0.8
    });
    const innerCore = new THREE.Mesh(innerGeometry, innerMaterial);
    coreGroup.add(innerCore);

    // Middle layer - represents coverage
    const middleGeometry = new THREE.IcosahedronGeometry(25, 1);
    const middleMaterial = new THREE.MeshPhongMaterial({
      color: 0xc084fc,
      wireframe: true,
      transparent: true,
      opacity: metrics.csocCoverage / 100
    });
    const middleCore = new THREE.Mesh(middleGeometry, middleMaterial);
    coreGroup.add(middleCore);

    // Outer shield
    const outerGeometry = new THREE.IcosahedronGeometry(35, 1);
    const outerMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ffff,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });
    const outerCore = new THREE.Mesh(outerGeometry, outerMaterial);
    coreGroup.add(outerCore);

    scene.add(coreGroup);

    // Orbital rings representing different platforms
    const createRing = (radius: number, color: number, coverage: number) => {
      const ringGeometry = new THREE.TorusGeometry(radius, 2, 8, 100);
      const ringMaterial = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: coverage / 100
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.random() * Math.PI;
      ring.rotation.y = Math.random() * Math.PI;
      return ring;
    };

    const csocRing = createRing(50, 0x00ffff, metrics.csocCoverage);
    const splunkRing = createRing(60, 0xc084fc, metrics.splunkCoverage);
    const chronicleRing = createRing(70, 0xff00ff, metrics.chronicleCoverage);
    
    scene.add(csocRing);
    scene.add(splunkRing);
    scene.add(chronicleRing);

    // Threat particles
    const particleCount = 1000;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      const radius = 30 + Math.random() * 100;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = radius * Math.cos(phi);
      
      // Color based on threat level
      if (metrics.csocCoverage < 20) {
        colors[i] = 1; colors[i + 1] = 0; colors[i + 2] = 1; // Pink for critical
      } else if (metrics.csocCoverage < 50) {
        colors[i] = 0.75; colors[i + 1] = 0.52; colors[i + 2] = 0.99; // Purple for warning
      } else {
        colors[i] = 0; colors[i + 1] = 1; colors[i + 2] = 1; // Blue for normal
      }
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

    // Data streams
    const streamGroup = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const streamGeometry = new THREE.CylinderGeometry(0.5, 0.5, 100, 8);
      const streamMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.3
      });
      const stream = new THREE.Mesh(streamGeometry, streamMaterial);
      const angle = (i / 5) * Math.PI * 2;
      stream.position.x = Math.cos(angle) * 80;
      stream.position.z = Math.sin(angle) * 80;
      streamGroup.add(stream);
    }
    scene.add(streamGroup);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00ffff, 1, 200);
    pointLight1.position.set(100, 50, 100);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff00ff, 1, 200);
    pointLight2.position.set(-100, 50, -100);
    scene.add(pointLight2);

    // Animation loop
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      // Rotate cores
      innerCore.rotation.x += 0.01;
      innerCore.rotation.y += 0.01;
      middleCore.rotation.x -= 0.005;
      middleCore.rotation.z += 0.005;
      outerCore.rotation.y += 0.003;
      
      // Rotate rings
      csocRing.rotation.x += 0.002;
      csocRing.rotation.y += 0.003;
      splunkRing.rotation.x -= 0.003;
      splunkRing.rotation.z += 0.002;
      chronicleRing.rotation.y += 0.004;
      chronicleRing.rotation.z -= 0.002;
      
      // Animate particles
      particles.rotation.y += 0.001;
      
      // Pulse core based on coverage
      const scale = 1 + Math.sin(Date.now() * 0.002) * 0.1;
      innerCore.scale.setScalar(scale);
      
      // Rotate data streams
      streamGroup.rotation.y += 0.001;
      
      // Camera movement
      const time = Date.now() * 0.0005;
      camera.position.x = Math.sin(time) * 150;
      camera.position.z = Math.cos(time) * 150;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      if (hologramRef.current && renderer.domElement) {
        hologramRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [metrics]);

  // Matrix Rain Effect
  useEffect(() => {
    const canvas = matrixRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const columns = Math.floor(canvas.width / 20);
    const drops: number[] = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100;
    }

    const matrix = '01';
    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.font = '15px monospace';
      
      for (let i = 0; i < drops.length; i++) {
        const text = matrix[Math.floor(Math.random() * matrix.length)];
        const x = i * 20;
        const y = drops[i] * 20;
        
        // Color based on platform
        if (i % 3 === 0) ctx.fillStyle = '#00ffff';
        else if (i % 3 === 1) ctx.fillStyle = '#c084fc';
        else ctx.fillStyle = '#ff00ff';
        
        ctx.fillText(text, x, y);
        
        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      
      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  // Pulse Wave Visualization
  useEffect(() => {
    const canvas = pulseRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const time = Date.now() * 0.001;
      
      // Draw three waves for each platform
      const platforms = [
        { coverage: metrics.csocCoverage, color: '#00ffff', offset: 0 },
        { coverage: metrics.splunkCoverage, color: '#c084fc', offset: 2 },
        { coverage: metrics.chronicleCoverage, color: '#ff00ff', offset: 4 }
      ];

      platforms.forEach(platform => {
        ctx.strokeStyle = platform.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        
        for (let x = 0; x < canvas.width; x += 2) {
          const y = canvas.height / 2 + 
                   Math.sin((x / 50) + time + platform.offset) * 
                   (platform.coverage / 2) * 
                   Math.sin(time * 0.5);
          
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        
        ctx.stroke();
      });
      
      ctx.globalAlpha = 1;
      requestAnimationFrame(animate);
    };

    animate();
  }, [metrics]);

  // Animate values
  useEffect(() => {
    setTimeout(() => {
      setAnimatedValues({
        csoc: metrics.csocCoverage,
        splunk: metrics.splunkCoverage,
        chronicle: metrics.chronicleCoverage,
        assets: metrics.totalAssets,
        gaps: metrics.criticalGaps
      });
    }, 100);
  }, [metrics]);

  const criticalSystems = [
    { name: 'EMEA Region', coverage: 12.3, gap: 78456, status: 'critical' },
    { name: 'Linux Servers', coverage: 69.29, gap: 24001, status: 'warning' },
    { name: 'Network Appliances', coverage: 45.2, gap: 7537, status: 'warning' },
    { name: 'Cloud Infrastructure', coverage: 19.17, gap: 40626, status: 'critical' }
  ];

  return (
    <div className="p-8 bg-black min-h-screen">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-5xl font-black mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          QUANTUM SECURITY COMMAND CENTER
        </h1>
        <p className="text-gray-400 uppercase tracking-widest text-xs">
          Real-Time Visibility Matrix • {metrics.totalAssets.toLocaleString()} Assets Under Surveillance
        </p>
      </div>

      {/* Critical Alert */}
      <div className="mb-8 bg-black border border-pink-500/30 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <AlertCircle className="w-8 h-8 text-pink-400 animate-pulse" />
            <div className="absolute inset-0 w-8 h-8">
              <AlertCircle className="w-8 h-8 text-pink-400 animate-ping" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-pink-400">CRITICAL VISIBILITY BREACH</h3>
            <p className="text-white mt-1">
              CSOC coverage at {metrics.csocCoverage}% - {metrics.criticalGaps.toLocaleString()} assets compromised
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Immediate deployment required: 80% minimum coverage for compliance
            </p>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        {/* 3D Holographic Core */}
        <div className="col-span-7">
          <div className="bg-black border border-blue-500/30 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-blue-500/20">
              <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Security Core Matrix
              </h3>
            </div>
            <div ref={hologramRef} className="w-full h-[400px]" />
            <div className="p-4 grid grid-cols-3 gap-4 border-t border-blue-500/20">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{animatedValues.csoc?.toFixed(1) || 0}%</div>
                <div className="text-xs text-gray-400">CSOC Shield</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{animatedValues.splunk?.toFixed(1) || 0}%</div>
                <div className="text-xs text-gray-400">Splunk Grid</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-400">{animatedValues.chronicle?.toFixed(1) || 0}%</div>
                <div className="text-xs text-gray-400">Chronicle Net</div>
              </div>
            </div>
          </div>
        </div>

        {/* Side Metrics */}
        <div className="col-span-5 space-y-6">
          {/* Matrix Rain */}
          <div className="bg-black border border-purple-500/30 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-purple-500/20">
              <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                <Binary className="w-4 h-4" />
                Data Stream Matrix
              </h3>
            </div>
            <canvas ref={matrixRef} className="w-full h-[180px]" />
          </div>

          {/* Pulse Wave */}
          <div className="bg-black border border-pink-500/30 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-pink-500/20">
              <h3 className="text-sm font-bold text-pink-400 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Coverage Pulse Analysis
              </h3>
            </div>
            <canvas ref={pulseRef} className="w-full h-[180px]" />
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <div className="bg-gray-900/30 rounded-xl p-6 border border-gray-800 hover:border-blue-500/50 transition-all">
          <Database className="w-6 h-6 text-blue-400 mb-3" />
          <div className="text-3xl font-bold text-white">{(animatedValues.assets / 1000 || 0).toFixed(1)}K</div>
          <div className="text-sm text-gray-400">Total Assets</div>
          <div className="mt-3 text-xs text-blue-400">100% CMDB</div>
        </div>

        <div className="bg-gray-900/30 rounded-xl p-6 border border-pink-500/30 hover:border-pink-500/50 transition-all">
          <Eye className="w-6 h-6 text-pink-400 mb-3" />
          <div className="text-3xl font-bold text-pink-400">{metrics.csocCoverage}%</div>
          <div className="text-sm text-gray-400">CSOC Visibility</div>
          <div className="mt-3 text-xs text-pink-400">↓ 60.83% below</div>
        </div>

        <div className="bg-gray-900/30 rounded-xl p-6 border border-gray-800 hover:border-purple-500/50 transition-all">
          <Server className="w-6 h-6 text-purple-400 mb-3" />
          <div className="text-3xl font-bold text-purple-400">{metrics.splunkCoverage}%</div>
          <div className="text-sm text-gray-400">Splunk Coverage</div>
          <div className="mt-3 text-xs text-purple-400">Partial deploy</div>
        </div>

        <div className="bg-gray-900/30 rounded-xl p-6 border border-gray-800 hover:border-blue-500/50 transition-all">
          <Cloud className="w-6 h-6 text-blue-400 mb-3" />
          <div className="text-3xl font-bold text-blue-400">{metrics.chronicleCoverage}%</div>
          <div className="text-sm text-gray-400">Chronicle</div>
          <div className="mt-3 text-xs text-blue-400">Near complete</div>
        </div>

        <div className="bg-gray-900/30 rounded-xl p-6 border border-pink-500/30 hover:border-pink-500/50 transition-all">
          <AlertCircle className="w-6 h-6 text-pink-400 mb-3" />
          <div className="text-3xl font-bold text-pink-400">{(animatedValues.gaps / 1000 || 0).toFixed(0)}K</div>
          <div className="text-sm text-gray-400">Critical Gaps</div>
          <div className="mt-3 text-xs text-pink-400">URGENT</div>
        </div>
      </div>

      {/* Critical Systems Grid */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-900/30 rounded-2xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-blue-400 mb-4">CRITICAL SYSTEM GAPS</h3>
          <div className="space-y-3">
            {criticalSystems.map((system, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-black/50 rounded-lg border border-gray-800">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${
                    system.status === 'critical' ? 'bg-pink-400' : 'bg-purple-400'
                  }`} />
                  <span className="text-white">{system.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-sm font-mono ${
                    system.status === 'critical' ? 'text-pink-400' : 'text-purple-400'
                  }`}>
                    {system.coverage}%
                  </span>
                  <span className="text-sm text-gray-400">
                    {(system.gap / 1000).toFixed(1)}K gap
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900/30 rounded-2xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-purple-400 mb-4">COMPLIANCE STATUS</h3>
          <div className="space-y-3">
            {['ISO 27001', 'NIST CSF', 'PCI DSS', 'SOX'].map((standard, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-black/50 rounded-lg border border-gray-800">
                <span className="text-white">{standard}</span>
                <span className={`text-sm font-bold ${
                  idx === 2 ? 'text-purple-400' : 'text-pink-400'
                }`}>
                  {idx === 2 ? 'AT RISK' : 'FAILED'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Platform Coverage Comparison */}
      <div className="bg-gray-900/30 rounded-2xl p-6 border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-6">PLATFORM COVERAGE ANALYSIS</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-blue-400">CSOC (Google Chronicle)</span>
              <span className="font-mono text-blue-400">{animatedValues.csoc?.toFixed(1) || 0}%</span>
            </div>
            <div className="relative h-8 bg-black/50 rounded-full overflow-hidden border border-gray-800">
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-1000 rounded-full"
                style={{ width: `${animatedValues.csoc || 0}%` }}
              />
              <div className="absolute inset-0 flex items-center px-4">
                <span className="text-xs text-gray-400">50,237 / 262,032 assets</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-purple-400">Splunk</span>
              <span className="font-mono text-purple-400">{animatedValues.splunk?.toFixed(1) || 0}%</span>
            </div>
            <div className="relative h-8 bg-black/50 rounded-full overflow-hidden border border-gray-800">
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-400 to-purple-500 transition-all duration-1000 rounded-full"
                style={{ width: `${animatedValues.splunk || 0}%` }}
              />
              <div className="absolute inset-0 flex items-center px-4">
                <span className="text-xs text-gray-400">167,517 / 262,032 assets</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-pink-400">Chronicle (Direct)</span>
              <span className="font-mono text-pink-400">{animatedValues.chronicle?.toFixed(1) || 0}%</span>
            </div>
            <div className="relative h-8 bg-black/50 rounded-full overflow-hidden border border-gray-800">
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-pink-400 to-pink-500 transition-all duration-1000 rounded-full"
                style={{ width: `${animatedValues.chronicle || 0}%` }}
              />
              <div className="absolute inset-0 flex items-center px-4">
                <span className="text-xs text-gray-400">241,691 / 262,032 assets</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;