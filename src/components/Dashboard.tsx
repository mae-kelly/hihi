import React, { useState, useEffect, useRef } from 'react';
import { Shield, Activity, Database, Server, Cloud, AlertCircle, TrendingDown, Eye, BarChart3, Network, Layers, Zap, Cpu, HardDrive, Lock, Globe, Radar, Satellite, Binary, Code, Wifi, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
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
  const threatRef = useRef<HTMLCanvasElement>(null);
  const barChartRef = useRef<HTMLCanvasElement>(null);
  const [glitchActive, setGlitchActive] = useState(false);

  // 3D Holographic Core Visualization with proper colors
  useEffect(() => {
    if (!hologramRef.current) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.002);

    const camera = new THREE.PerspectiveCamera(
      60,
      hologramRef.current.clientWidth / hologramRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 30, 80);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(hologramRef.current.clientWidth, hologramRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    hologramRef.current.appendChild(renderer.domElement);

    // Central Core System with proper colors
    const coreGroup = new THREE.Group();
    
    // Inner core - color based on coverage
    const innerGeometry = new THREE.IcosahedronGeometry(8, 2);
    const innerMaterial = new THREE.MeshPhongMaterial({
      color: metrics.csocCoverage < 20 ? 0xff00ff : metrics.csocCoverage < 50 ? 0xc084fc : 0x00ffff,
      emissive: metrics.csocCoverage < 20 ? 0xff00ff : metrics.csocCoverage < 50 ? 0xc084fc : 0x00ffff,
      emissiveIntensity: 0.5,
      wireframe: false,
      transparent: true,
      opacity: 0.9
    });
    const innerCore = new THREE.Mesh(innerGeometry, innerMaterial);
    coreGroup.add(innerCore);

    // Data streams - wireframe layers
    for (let i = 0; i < 3; i++) {
      const streamGeometry = new THREE.IcosahedronGeometry(12 + i * 6, 1);
      const streamMaterial = new THREE.MeshPhongMaterial({
        color: i === 0 ? 0x00ffff : i === 1 ? 0xc084fc : 0xff00ff,
        wireframe: true,
        transparent: true,
        opacity: 0.3 + (metrics.csocCoverage / 200)
      });
      const stream = new THREE.Mesh(streamGeometry, streamMaterial);
      stream.userData = { layer: i };
      coreGroup.add(stream);
    }

    scene.add(coreGroup);

    // Platform rings with correct colors
    const rings: THREE.Mesh[] = [];
    const createDataRing = (radius: number, color: number, coverage: number, rotSpeed: number) => {
      const ringGroup = new THREE.Group();
      
      const ringGeometry = new THREE.TorusGeometry(radius, 1.2, 6, 100);
      const ringMaterial = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: coverage / 100
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.5;
      ring.userData = { rotSpeed };
      ringGroup.add(ring);
      rings.push(ring);
      
      return ringGroup;
    };

    const csocRing = createDataRing(32, 0x00ffff, metrics.csocCoverage, 0.002);
    const splunkRing = createDataRing(38, 0xc084fc, metrics.splunkCoverage, -0.003);
    const chronicleRing = createDataRing(44, 0xff00ff, metrics.chronicleCoverage, 0.004);
    
    scene.add(csocRing);
    scene.add(splunkRing);
    scene.add(chronicleRing);

    // Threat particles with proper colors
    const threatCount = 500;
    const threatsGeometry = new THREE.BufferGeometry();
    const threatPositions = new Float32Array(threatCount * 3);
    const threatColors = new Float32Array(threatCount * 3);

    for (let i = 0; i < threatCount; i++) {
      const radius = 15 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      threatPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      threatPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      threatPositions[i * 3 + 2] = radius * Math.cos(phi);
      
      // Use proper color scheme
      const severity = Math.random();
      if (severity > 0.7) {
        // Pink for critical
        threatColors[i * 3] = 1;
        threatColors[i * 3 + 1] = 0;
        threatColors[i * 3 + 2] = 1;
      } else if (severity > 0.4) {
        // Purple for warning
        threatColors[i * 3] = 0.75;
        threatColors[i * 3 + 1] = 0.52;
        threatColors[i * 3 + 2] = 0.99;
      } else {
        // Cyan for normal
        threatColors[i * 3] = 0;
        threatColors[i * 3 + 1] = 1;
        threatColors[i * 3 + 2] = 1;
      }
    }

    threatsGeometry.setAttribute('position', new THREE.BufferAttribute(threatPositions, 3));
    threatsGeometry.setAttribute('color', new THREE.BufferAttribute(threatColors, 3));

    const threatsMaterial = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });

    const threats = new THREE.Points(threatsGeometry, threatsMaterial);
    scene.add(threats);

    // Lighting with proper colors
    const ambientLight = new THREE.AmbientLight(0x0a0a0a);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00ffff, 2, 150);
    pointLight1.position.set(50, 30, 50);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff00ff, 2, 150);
    pointLight2.position.set(-50, 30, -50);
    scene.add(pointLight2);

    // Animation loop
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      // Rotate and pulse core
      innerCore.rotation.x += 0.01;
      innerCore.rotation.y += 0.01;
      const pulse = 1 + Math.sin(Date.now() * 0.003) * 0.1;
      innerCore.scale.setScalar(pulse);
      
      // Rotate data streams
      coreGroup.children.forEach((child: any) => {
        if (child.userData.layer !== undefined) {
          child.rotation.x += 0.003 * (child.userData.layer + 1);
          child.rotation.y -= 0.002 * (child.userData.layer + 1);
          child.rotation.z += 0.001 * (child.userData.layer + 1);
        }
      });
      
      // Animate rings
      rings.forEach(ring => {
        ring.rotation.z += ring.userData.rotSpeed;
      });
      
      // Animate threats
      threats.rotation.y += 0.0005;
      const positions = threats.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < threatCount; i++) {
        positions[i * 3 + 1] += Math.sin(Date.now() * 0.001 + i) * 0.05;
      }
      threats.geometry.attributes.position.needsUpdate = true;
      
      // Dynamic camera
      const time = Date.now() * 0.0003;
      camera.position.x = Math.sin(time) * 80;
      camera.position.z = Math.cos(time) * 80;
      camera.position.y = 30 + Math.sin(time * 2) * 10;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      if (hologramRef.current && renderer.domElement) {
        hologramRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [metrics]);

  // Animated Bar Chart
  useEffect(() => {
    const canvas = barChartRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const bars = [
      { label: 'CSOC', value: metrics.csocCoverage, color: '#00ffff', target: 100 },
      { label: 'Splunk', value: metrics.splunkCoverage, color: '#c084fc', target: 100 },
      { label: 'Chronicle', value: metrics.chronicleCoverage, color: '#ff00ff', target: 100 }
    ];

    let animatedBars = bars.map(b => ({ ...b, current: 0 }));

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / bars.length - 20;
      const maxHeight = canvas.height - 40;

      animatedBars.forEach((bar, index) => {
        if (bar.current < bar.value) {
          bar.current += 0.5;
        }

        const x = 10 + index * (barWidth + 20);
        const height = (bar.current / 100) * maxHeight;
        const y = canvas.height - height - 20;

        // Bar gradient
        const gradient = ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, bar.color);
        gradient.addColorStop(1, bar.color + '40');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, height);

        // Glow effect
        ctx.shadowColor = bar.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(x, y, barWidth, 2);
        ctx.shadowBlur = 0;

        // Value text
        ctx.fillStyle = bar.color;
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(bar.current)}%`, x + barWidth / 2, y - 5);

        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px monospace';
        ctx.fillText(bar.label, x + barWidth / 2, canvas.height - 5);

        // Critical line
        if (bar.current < 20) {
          ctx.strokeStyle = '#ff00ff';
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + barWidth, y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, [metrics]);

  // Matrix Rain with proper colors
  useEffect(() => {
    const canvas = matrixRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const columns = Math.floor(canvas.width / 10);
    const drops: number[] = [];
    
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100;
    }

    const matrix = '01CSOC1917CRITICAL';
    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.font = 'bold 10px monospace';
      
      for (let i = 0; i < drops.length; i++) {
        const text = matrix[Math.floor(Math.random() * matrix.length)];
        const x = i * 10;
        const y = drops[i] * 10;
        
        // Use proper colors
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

  // Threat Network Graph
  useEffect(() => {
    const canvas = threatRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles: any[] = [];
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1,
        vy: (Math.random() - 0.5) * 1,
        size: Math.random() * 3 + 1,
        color: Math.random() > 0.5 ? '#ff00ff' : Math.random() > 0.5 ? '#c084fc' : '#00ffff'
      });
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw connections
      particles.forEach((p1, i) => {
        particles.forEach((p2, j) => {
          if (i !== j) {
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 80) {
              const opacity = (1 - distance / 80) * 0.5;
              ctx.strokeStyle = `rgba(192, 132, 252, ${opacity})`;
              ctx.lineWidth = 0.5;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        });
        
        // Update particle
        p1.x += p1.vx;
        p1.y += p1.vy;
        
        if (p1.x < 0 || p1.x > canvas.width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > canvas.height) p1.vy *= -1;
        
        // Draw particle with glow
        ctx.shadowColor = p1.color;
        ctx.shadowBlur = 5;
        ctx.fillStyle = p1.color;
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  // Wave Visualization with proper colors
  useEffect(() => {
    const canvas = pulseRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const time = Date.now() * 0.001;
      
      // Platform waves
      const platforms = [
        { coverage: metrics.csocCoverage, color: '#00ffff', offset: 0, freq: 1 },
        { coverage: metrics.splunkCoverage, color: '#c084fc', offset: 2, freq: 1.5 },
        { coverage: metrics.chronicleCoverage, color: '#ff00ff', offset: 4, freq: 2 }
      ];

      platforms.forEach((platform, idx) => {
        ctx.strokeStyle = platform.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        
        for (let x = 0; x < canvas.width; x++) {
          const y = canvas.height / 2 + 
                   Math.sin((x / 30) * platform.freq + time + platform.offset) * 
                   (platform.coverage / 3) * 
                   Math.sin(time * 0.5 + idx) +
                   Math.sin((x / 10) + time * 2) * 5;
          
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
    { name: 'EMEA', coverage: 12.3, gap: 78456, status: 'critical' },
    { name: 'Linux', coverage: 69.29, gap: 24001, status: 'warning' },
    { name: 'Network', coverage: 45.2, gap: 7537, status: 'warning' },
    { name: 'Cloud', coverage: 19.17, gap: 40626, status: 'critical' }
  ];

  return (
    <div className="p-2 bg-black h-screen overflow-hidden flex flex-col">
      {/* Critical Alert */}
      <div className="mb-2 bg-black border border-pink-500/50 rounded-lg p-1.5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-pink-400 animate-pulse" />
          <span className="text-pink-400 font-bold text-xs">CRITICAL:</span>
          <span className="text-white text-xs">CSOC {metrics.csocCoverage}% • {(metrics.criticalGaps/1000).toFixed(0)}K GAPS</span>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-6 gap-1.5 mb-2">
        {[
          { icon: Database, value: (animatedValues.assets / 1000 || 0).toFixed(0) + 'K', label: 'Assets', color: '#00ffff' },
          { icon: Eye, value: metrics.csocCoverage + '%', label: 'CSOC', color: '#ff00ff' },
          { icon: Server, value: metrics.splunkCoverage + '%', label: 'Splunk', color: '#c084fc' },
          { icon: Cloud, value: metrics.chronicleCoverage + '%', label: 'Chronicle', color: '#00ffff' },
          { icon: AlertCircle, value: (animatedValues.gaps / 1000 || 0).toFixed(0) + 'K', label: 'Gaps', color: '#ff00ff' },
          { icon: Shield, value: 'CRITICAL', label: 'Risk', color: '#ff00ff' }
        ].map((metric, idx) => (
          <div key={idx} className="bg-gray-900/30 rounded-lg p-1.5 border border-gray-800">
            <metric.icon className="w-3 h-3 mb-0.5" style={{ color: metric.color }} />
            <div className="text-sm font-bold" style={{ color: metric.color }}>
              {metric.value}
            </div>
            <div className="text-[8px] text-gray-500">{metric.label}</div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-12 gap-2">
        {/* 3D Core */}
        <div className="col-span-5">
          <div className="bg-black border border-blue-500/30 rounded-lg overflow-hidden h-full">
            <div className="p-1.5 border-b border-blue-500/20">
              <h3 className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                SECURITY CORE
              </h3>
            </div>
            <div ref={hologramRef} className="w-full" style={{ height: 'calc(100% - 32px)' }} />
          </div>
        </div>

        {/* Visualizations */}
        <div className="col-span-7 grid grid-rows-2 gap-2">
          {/* Top Row */}
          <div className="grid grid-cols-2 gap-2">
            {/* Bar Chart */}
            <div className="bg-black border border-purple-500/30 rounded-lg overflow-hidden">
              <div className="p-1.5 border-b border-purple-500/20">
                <h3 className="text-[9px] font-bold text-purple-400 uppercase">COVERAGE LEVELS</h3>
              </div>
              <canvas ref={barChartRef} className="w-full" style={{ height: 'calc(100% - 28px)' }} />
            </div>

            {/* Matrix Rain */}
            <div className="bg-black border border-blue-500/30 rounded-lg overflow-hidden">
              <div className="p-1.5 border-b border-blue-500/20">
                <h3 className="text-[9px] font-bold text-blue-400 uppercase">DATA STREAM</h3>
              </div>
              <canvas ref={matrixRef} className="w-full" style={{ height: 'calc(100% - 28px)' }} />
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-2 gap-2">
            {/* Threat Network */}
            <div className="bg-black border border-pink-500/30 rounded-lg overflow-hidden">
              <div className="p-1.5 border-b border-pink-500/20">
                <h3 className="text-[9px] font-bold text-pink-400 uppercase">THREAT NETWORK</h3>
              </div>
              <canvas ref={threatRef} className="w-full" style={{ height: 'calc(100% - 28px)' }} />
            </div>

            {/* Pulse Wave */}
            <div className="bg-black border border-purple-500/30 rounded-lg overflow-hidden">
              <div className="p-1.5 border-b border-purple-500/20">
                <h3 className="text-[9px] font-bold text-purple-400 uppercase">SYSTEM PULSE</h3>
              </div>
              <canvas ref={pulseRef} className="w-full" style={{ height: 'calc(100% - 28px)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Status */}
      <div className="grid grid-cols-2 gap-2 mt-2">
        {/* Critical Systems */}
        <div className="bg-gray-900/30 rounded-lg p-2 border border-gray-800">
          <h3 className="text-xs font-bold text-pink-400 mb-1.5">CRITICAL SYSTEMS</h3>
          <div className="space-y-1">
            {criticalSystems.map((sys, idx) => (
              <div key={idx} className="flex justify-between items-center p-1 bg-black/50 rounded border border-gray-800">
                <span className="text-[9px] text-white">{sys.name}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-mono ${
                    sys.status === 'critical' ? 'text-pink-400' : 'text-purple-400'
                  }`}>
                    {sys.coverage}%
                  </span>
                  <span className="text-[8px] text-gray-500">{(sys.gap/1000).toFixed(0)}K</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Progress */}
        <div className="bg-gray-900/30 rounded-lg p-2 border border-gray-800">
          <h3 className="text-xs font-bold text-purple-400 mb-1.5">PLATFORM STATUS</h3>
          <div className="space-y-1.5">
            {[
              { name: 'CSOC', value: animatedValues.csoc, color: '#00ffff' },
              { name: 'Splunk', value: animatedValues.splunk, color: '#c084fc' },
              { name: 'Chronicle', value: animatedValues.chronicle, color: '#ff00ff' }
            ].map((platform, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-[9px] mb-0.5">
                  <span style={{ color: platform.color }}>{platform.name}</span>
                  <span className="font-mono" style={{ color: platform.color }}>
                    {(platform.value || 0).toFixed(1)}%
                  </span>
                </div>
                <div className="h-1.5 bg-black/50 rounded-full overflow-hidden border border-gray-800">
                  <div 
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${platform.value || 0}%`,
                      background: platform.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;