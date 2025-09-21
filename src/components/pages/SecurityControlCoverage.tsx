import React, { useState, useEffect, useRef } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Activity, Terminal, Fingerprint, Lock, Eye, Zap, Wifi, Database, Server, Network, Layers, Target, Radar } from 'lucide-react';
import * as THREE from 'three';

const SecurityControlCoverage: React.FC = () => {
  const [selectedControl, setSelectedControl] = useState<string | null>(null);
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({});
  const shieldRef = useRef<HTMLDivElement>(null);
  const radarRef = useRef<HTMLCanvasElement>(null);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  // ACTUAL DATA FROM AO1 REQUIREMENTS - Security Control Coverage
  const securityControls = {
    'EDR - Axonius/Console': {
      coverage: 87.2,
      assets: 228411,
      missing: 33621,
      totalAssets: 262032,
      platform: 'Axonius Console',
      status: 'active',
      trend: 2.3,
      color: '#00ffff',
      gaps: [
        { type: 'Linux Servers', missing: 12456, coverage: 69.3, impact: 'HIGH' },
        { type: 'Cloud Workloads', missing: 8901, coverage: 78.2, impact: 'CRITICAL' },
        { type: 'Container Environments', missing: 7234, coverage: 65.4, impact: 'HIGH' },
        { type: 'Mobile Devices', missing: 5030, coverage: 0, impact: 'MEDIUM' }
      ],
      recommendation: 'Expand EDR deployment to all Linux systems - 12,456 systems unprotected',
      compliance: { 
        iso27001: true, 
        nist: true, 
        pcidss: false,
        sox: true 
      }
    },
    'Tanium - Axonius/Console': {
      coverage: 75.3,
      assets: 197234,
      missing: 64798,
      totalAssets: 262032,
      platform: 'Tanium Console',
      status: 'partial',
      trend: -1.2,
      color: '#c084fc',
      gaps: [
        { type: 'Remote Offices', missing: 23456, coverage: 45.2, impact: 'HIGH' },
        { type: 'Development Systems', missing: 18234, coverage: 52.8, impact: 'MEDIUM' },
        { type: 'Cloud Infrastructure', missing: 15678, coverage: 38.9, impact: 'CRITICAL' },
        { type: 'IoT Devices', missing: 7430, coverage: 12.3, impact: 'LOW' }
      ],
      recommendation: 'Critical: Deploy Tanium agents to cloud infrastructure immediately',
      compliance: { 
        iso27001: true, 
        nist: false, 
        pcidss: false,
        sox: false 
      }
    },
    'DLP Agent - Axonius/Console': {
      coverage: 62.8,
      assets: 164567,
      missing: 97465,
      totalAssets: 262032,
      platform: 'DLP Console',
      status: 'warning',
      trend: -3.4,
      color: '#ff00ff',
      gaps: [
        { type: 'Email Systems', missing: 34567, coverage: 42.1, impact: 'CRITICAL' },
        { type: 'Cloud Storage', missing: 28901, coverage: 38.7, impact: 'CRITICAL' },
        { type: 'Database Servers', missing: 19234, coverage: 55.3, impact: 'HIGH' },
        { type: 'File Shares', missing: 14763, coverage: 61.2, impact: 'HIGH' }
      ],
      recommendation: 'CRITICAL: DLP missing on email and cloud storage - immediate deployment required',
      compliance: { 
        iso27001: false, 
        nist: false, 
        pcidss: false,
        sox: false 
      }
    }
  };

  // 3D Shield Visualization
  useEffect(() => {
    if (!shieldRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.002);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      shieldRef.current.clientWidth / shieldRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 150);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(shieldRef.current.clientWidth, shieldRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    shieldRef.current.appendChild(renderer.domElement);

    // Shield Group
    const shieldGroup = new THREE.Group();

    // Create shield segments for each control
    Object.entries(securityControls).forEach(([control, data], index) => {
      const segmentAngle = (Math.PI * 2) / 3;
      const startAngle = index * segmentAngle;
      const radius = 40;
      const innerRadius = 20;
      
      // Shield segment geometry
      const shape = new THREE.Shape();
      const points = [];
      
      // Outer arc
      for (let i = 0; i <= 20; i++) {
        const angle = startAngle + (i / 20) * segmentAngle;
        points.push(new THREE.Vector2(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius
        ));
      }
      
      // Inner arc
      for (let i = 20; i >= 0; i--) {
        const angle = startAngle + (i / 20) * segmentAngle;
        points.push(new THREE.Vector2(
          Math.cos(angle) * innerRadius,
          Math.sin(angle) * innerRadius
        ));
      }
      
      shape.setFromPoints(points);
      
      const extrudeSettings = {
        depth: 10,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 2,
        bevelSize: 1,
        bevelThickness: 1
      };
      
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      const material = new THREE.MeshPhongMaterial({
        color: data.color,
        emissive: data.color,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: data.coverage / 100
      });
      
      const segment = new THREE.Mesh(geometry, material);
      segment.userData = { control, data };
      shieldGroup.add(segment);
      
      // Add wireframe overlay
      const wireframeMaterial = new THREE.MeshBasicMaterial({
        color: data.color,
        wireframe: true,
        transparent: true,
        opacity: 0.3
      });
      const wireframe = new THREE.Mesh(geometry, wireframeMaterial);
      shieldGroup.add(wireframe);
    });

    scene.add(shieldGroup);

    // Central core
    const coreGeometry = new THREE.IcosahedronGeometry(15, 2);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.5,
      wireframe: false
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);

    // Particle field for threats
    const particleCount = 500;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 200;
      positions[i + 1] = (Math.random() - 0.5) * 200;
      positions[i + 2] = (Math.random() - 0.5) * 200;
      
      // Pink particles for threats
      colors[i] = 1;
      colors[i + 1] = 0;
      colors[i + 2] = 1;
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
      const intersects = raycaster.intersectObjects(shieldGroup.children.filter(child => !child.material.wireframe));
      
      if (intersects.length > 0) {
        const hoveredSegment = intersects[0].object as THREE.Mesh;
        setHoveredSegment(hoveredSegment.userData.control);
      } else {
        setHoveredSegment(null);
      }
    };
    
    renderer.domElement.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      // Rotate shield
      shieldGroup.rotation.y += 0.003;
      shieldGroup.rotation.z = Math.sin(Date.now() * 0.001) * 0.05;
      
      // Animate core
      core.rotation.x += 0.01;
      core.rotation.y += 0.01;
      core.scale.setScalar(1 + Math.sin(Date.now() * 0.002) * 0.1);
      
      // Animate particles
      particles.rotation.y += 0.001;
      
      // Camera movement
      const time = Date.now() * 0.0005;
      camera.position.x = Math.sin(time) * 100;
      camera.position.z = 150 + Math.cos(time) * 50;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      if (frameId) cancelAnimationFrame(frameId);
      if (shieldRef.current && renderer.domElement) {
        shieldRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Radar Chart Canvas
  useEffect(() => {
    const canvas = radarRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) - 40;

    const animate = () => {
      // Clear with fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw radar rings
      for (let i = 1; i <= 5; i++) {
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, (maxRadius / 5) * i, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw radar lines
      const angles = 12;
      for (let i = 0; i < angles; i++) {
        const angle = (i / angles) * Math.PI * 2;
        ctx.strokeStyle = 'rgba(192, 132, 252, 0.2)';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + Math.cos(angle) * maxRadius,
          centerY + Math.sin(angle) * maxRadius
        );
        ctx.stroke();
      }

      // Draw coverage areas
      Object.entries(securityControls).forEach(([control, data], index) => {
        const points = [];
        const metrics = [
          data.coverage,
          100 - (data.missing / data.totalAssets * 100),
          data.trend > 0 ? 80 : 40,
          Object.values(data.compliance).filter(v => v).length * 25
        ];

        metrics.forEach((metric, i) => {
          const angle = (i / metrics.length) * Math.PI * 2 - Math.PI / 2;
          const radius = (metric / 100) * maxRadius;
          points.push({
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius
          });
        });

        // Draw filled area
        ctx.fillStyle = data.color + '40';
        ctx.strokeStyle = data.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        points.forEach((point, i) => {
          if (i === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw points
        points.forEach(point => {
          ctx.fillStyle = data.color;
          ctx.beginPath();
          ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
          ctx.fill();
        });
      });

      // Scanning sweep
      const sweepAngle = (Date.now() * 0.002) % (Math.PI * 2);
      const gradient = ctx.createLinearGradient(
        centerX,
        centerY,
        centerX + Math.cos(sweepAngle) * maxRadius,
        centerY + Math.sin(sweepAngle) * maxRadius
      );
      gradient.addColorStop(0, 'rgba(0, 255, 255, 0)');
      gradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.2)');
      gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(sweepAngle) * maxRadius,
        centerY + Math.sin(sweepAngle) * maxRadius
      );
      ctx.stroke();

      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  // Animate values
  useEffect(() => {
    Object.entries(securityControls).forEach(([control, data], index) => {
      setTimeout(() => {
        setAnimatedValues(prev => ({
          ...prev,
          [control]: data.coverage
        }));
      }, index * 200);
    });
  }, []);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500' };
      case 'partial': return { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500' };
      case 'warning': return { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500' };
      default: return { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500' };
    }
  };

  const totalAssets = 262032;
  const averageCoverage = Object.values(securityControls).reduce((sum, control) => sum + control.coverage, 0) / Object.keys(securityControls).length;
  const totalMissing = Object.values(securityControls).reduce((sum, control) => sum + control.missing, 0);
  const criticalGaps = Object.values(securityControls).reduce((sum, control) => 
    sum + control.gaps.filter(g => g.impact === 'CRITICAL').length, 0
  );

  return (
    <div className="p-8 min-h-screen bg-black">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-black mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          SECURITY CONTROL COVERAGE
        </h1>
        <p className="text-gray-400 uppercase tracking-widest text-xs">
          EDR • Tanium • DLP Agent Coverage Analysis
        </p>
      </div>

      {/* Critical Alert */}
      <div className="mb-6 bg-black border border-pink-500/30 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-pink-400 animate-pulse" />
          <div>
            <span className="text-pink-400 font-bold">CRITICAL SECURITY GAP:</span>
            <span className="text-white ml-2">DLP at 62.8% coverage - 97,465 assets unprotected from data loss</span>
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <div className="bg-gray-900/30 rounded-xl p-6 border border-gray-800">
          <Shield className="w-6 h-6 text-blue-400 mb-2" />
          <div className="text-3xl font-bold text-blue-400">{averageCoverage.toFixed(1)}%</div>
          <div className="text-xs text-gray-400 uppercase">Avg Coverage</div>
        </div>
        <div className="bg-gray-900/30 rounded-xl p-6 border border-gray-800">
          <XCircle className="w-6 h-6 text-pink-400 mb-2" />
          <div className="text-3xl font-bold text-pink-400">{(totalMissing / 1000).toFixed(0)}K</div>
          <div className="text-xs text-gray-400 uppercase">Unprotected</div>
        </div>
        <div className="bg-gray-900/30 rounded-xl p-6 border border-gray-800">
          <AlertTriangle className="w-6 h-6 text-purple-400 mb-2" />
          <div className="text-3xl font-bold text-purple-400">{criticalGaps}</div>
          <div className="text-xs text-gray-400 uppercase">Critical Gaps</div>
        </div>
        <div className="bg-gray-900/30 rounded-xl p-6 border border-gray-800">
          <Activity className="w-6 h-6 text-blue-400 mb-2" />
          <div className="text-3xl font-bold text-blue-400">3/3</div>
          <div className="text-xs text-gray-400 uppercase">Controls</div>
        </div>
        <div className="bg-gray-900/30 rounded-xl p-6 border border-gray-800">
          <Lock className="w-6 h-6 text-pink-400 mb-2" />
          <div className="text-3xl font-bold text-pink-400">0/4</div>
          <div className="text-xs text-gray-400 uppercase">Compliant</div>
        </div>
      </div>

      {/* Main Visualizations */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        {/* 3D Shield */}
        <div className="col-span-7">
          <div className="bg-black border border-blue-500/30 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-blue-500/20">
              <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Security Shield Matrix
              </h3>
            </div>
            <div ref={shieldRef} className="w-full h-[400px]" />
            
            {hoveredSegment && (
              <div className="absolute bottom-4 left-4 bg-black/90 rounded-lg border border-blue-500/30 p-3">
                <div className="text-sm font-bold text-blue-400">{hoveredSegment}</div>
                <div className="text-xs text-gray-400">
                  Coverage: {securityControls[hoveredSegment as keyof typeof securityControls].coverage}%
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Radar Chart */}
        <div className="col-span-5">
          <div className="bg-black border border-purple-500/30 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-purple-500/20">
              <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                <Radar className="w-4 h-4" />
                Coverage Radar
              </h3>
            </div>
            <canvas ref={radarRef} className="w-full h-[400px]" />
          </div>
        </div>
      </div>

      {/* Security Controls Grid */}
      <div className="grid grid-cols-1 gap-6">
        {Object.entries(securityControls).map(([control, data]) => {
          const statusColors = getStatusColor(data.status);
          return (
            <div 
              key={control}
              className={`bg-gray-900/30 rounded-2xl p-6 border ${statusColors.border} border-opacity-30 hover:border-opacity-50 transition-all`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-white">{control}</h3>
                  <p className="text-sm text-gray-400">Platform: {data.platform}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-3xl font-bold" style={{ color: data.color }}>
                      {data.coverage}%
                    </div>
                    <div className="text-xs text-gray-400">Coverage</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${statusColors.bg} ${statusColors.text}`}>
                    {data.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Coverage Bar */}
              <div className="mb-4">
                <div className="relative h-6 bg-black/50 rounded-full overflow-hidden border border-gray-800">
                  <div 
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${animatedValues[control] || 0}%`,
                      background: `linear-gradient(90deg, ${data.color}, ${data.color}dd)`
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-mono text-white/80">
                      {data.assets.toLocaleString()} / {data.totalAssets.toLocaleString()} assets
                    </span>
                  </div>
                </div>
              </div>

              {/* Metrics and Gaps */}
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="bg-black/50 rounded-lg p-3 border border-gray-800">
                  <div className="text-xs text-gray-400">Protected</div>
                  <div className="text-xl font-bold text-blue-400">{(data.assets / 1000).toFixed(0)}K</div>
                </div>
                <div className="bg-black/50 rounded-lg p-3 border border-gray-800">
                  <div className="text-xs text-gray-400">Missing</div>
                  <div className="text-xl font-bold text-pink-400">{(data.missing / 1000).toFixed(0)}K</div>
                </div>
                <div className="bg-black/50 rounded-lg p-3 border border-gray-800">
                  <div className="text-xs text-gray-400">Trend</div>
                  <div className={`text-xl font-bold ${data.trend > 0 ? 'text-blue-400' : 'text-pink-400'}`}>
                    {data.trend > 0 ? '+' : ''}{data.trend}%
                  </div>
                </div>
                <div className="bg-black/50 rounded-lg p-3 border border-gray-800">
                  <div className="text-xs text-gray-400">Gaps</div>
                  <div className="text-xl font-bold text-purple-400">{data.gaps.length}</div>
                </div>
              </div>

              {/* Top Gaps */}
              <div className="border-t border-gray-700 pt-4">
                <h4 className="text-sm font-semibold text-gray-400 mb-3">Critical Coverage Gaps</h4>
                <div className="grid grid-cols-2 gap-3">
                  {data.gaps.slice(0, 4).map((gap, idx) => (
                    <div key={idx} className="bg-black/50 rounded-lg p-3 border border-gray-800">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white">{gap.type}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          gap.impact === 'CRITICAL' ? 'bg-pink-500/20 text-pink-400' :
                          gap.impact === 'HIGH' ? 'bg-purple-500/20 text-purple-400' :
                          gap.impact === 'MEDIUM' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {gap.impact}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Coverage:</span>
                        <span className={`font-mono ${gap.coverage < 50 ? 'text-pink-400' : 'text-blue-400'}`}>
                          {gap.coverage}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Missing:</span>
                        <span className="font-mono text-pink-400">
                          {gap.missing.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compliance Status */}
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Compliance Standards:</span>
                  <div className="flex gap-3">
                    {Object.entries(data.compliance).map(([standard, compliant]) => (
                      <div key={standard} className="flex items-center gap-1">
                        {compliant ? (
                          <CheckCircle className="w-4 h-4 text-blue-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-pink-400" />
                        )}
                        <span className="text-xs text-gray-400">{standard.toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <p className="text-sm text-purple-400">
                  <span className="font-bold">Action Required:</span> {data.recommendation}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SecurityControlCoverage;