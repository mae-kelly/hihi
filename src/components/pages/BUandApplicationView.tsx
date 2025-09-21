import React, { useState, useEffect, useRef } from 'react';
import { Building, Layers, Database, Network, Shield, AlertTriangle, Activity, TrendingDown, Server, Cloud, Dna, Star, Orbit, Atom, Binary, Cpu } from 'lucide-react';
import * as THREE from 'three';

const BUandApplicationView: React.FC = () => {
  const [selectedView, setSelectedView] = useState<'bu' | 'application'>('bu');
  const [selectedBU, setSelectedBU] = useState<string | null>(null);
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({});
  const dnaRef = useRef<HTMLDivElement>(null);
  const constellationRef = useRef<HTMLCanvasElement>(null);

  // ACTUAL DATA FROM AO1 REQUIREMENTS
  const businessUnits = {
    'Merchant Solutions': {
      assets: 78234,
      csocCoverage: 22.4,
      splunkCoverage: 71.2,
      chronicleCoverage: 89.3,
      missing: 60678,
      status: 'critical',
      cio: 'CIO-ALPHA',
      apm: 'APM-QUANTUM',
      applications: ['Payment Gateway', 'Merchant Portal', 'Settlement Engine', 'Risk Analytics'],
      priority: 1,
      color: '#ff0044',
      dnaStrand: 0
    },
    'Card Services': {
      assets: 67890,
      csocCoverage: 18.9,
      splunkCoverage: 68.4,
      chronicleCoverage: 92.1,
      missing: 55028,
      status: 'critical',
      cio: 'CIO-BETA',
      apm: 'APM-NEXUS',
      applications: ['Card Processing', 'Authorization System', 'Fraud Detection', 'Card Management'],
      priority: 1,
      color: '#ff00ff',
      dnaStrand: 1
    },
    'Digital Banking': {
      assets: 45678,
      csocCoverage: 31.2,
      splunkCoverage: 78.9,
      chronicleCoverage: 94.5,
      missing: 31413,
      status: 'warning',
      cio: 'CIO-GAMMA',
      apm: 'APM-CYBER',
      applications: ['Mobile Banking', 'Online Banking', 'Digital Wallet', 'API Platform'],
      priority: 2,
      color: '#c084fc',
      dnaStrand: 0
    },
    'Enterprise Services': {
      assets: 34567,
      csocCoverage: 15.7,
      splunkCoverage: 52.3,
      chronicleCoverage: 87.6,
      missing: 29142,
      status: 'critical',
      cio: 'CIO-DELTA',
      apm: 'APM-MATRIX',
      applications: ['ERP Systems', 'Data Warehouse', 'BI Platform', 'Integration Hub'],
      priority: 3,
      color: '#00ffff',
      dnaStrand: 1
    },
    'Risk & Compliance': {
      assets: 35663,
      csocCoverage: 8.9,
      splunkCoverage: 45.6,
      chronicleCoverage: 91.2,
      missing: 32490,
      status: 'critical',
      cio: 'CIO-OMEGA',
      apm: 'APM-SHIELD',
      applications: ['Risk Management', 'Compliance Portal', 'Audit System', 'Regulatory Reporting'],
      priority: 1,
      color: '#00ff88',
      dnaStrand: 0
    }
  };

  const applicationClasses = {
    'Payment Processing': {
      assets: 45678,
      coverage: 24.3,
      missing: 34567,
      criticality: 'CRITICAL',
      businessImpact: 'QUANTUM',
      regulatoryRequirement: true,
      platforms: ['On-Prem', 'Cloud', 'Hybrid'],
      color: '#ff0044',
      constellation: { x: 50, y: 30, connections: [1, 2] }
    },
    'Customer Facing': {
      assets: 38901,
      coverage: 42.1,
      missing: 22534,
      criticality: 'HIGH',
      businessImpact: 'SEVERE',
      regulatoryRequirement: true,
      platforms: ['Web', 'Mobile', 'API'],
      color: '#c084fc',
      constellation: { x: 30, y: 50, connections: [0, 2, 3] }
    },
    'Internal Systems': {
      assets: 28456,
      coverage: 67.8,
      missing: 9178,
      criticality: 'MEDIUM',
      businessImpact: 'MODERATE',
      regulatoryRequirement: false,
      platforms: ['On-Prem'],
      color: '#00ffff',
      constellation: { x: 70, y: 50, connections: [0, 1, 3] }
    },
    'Data & Analytics': {
      assets: 23456,
      coverage: 35.6,
      missing: 15112,
      criticality: 'HIGH',
      businessImpact: 'CRITICAL',
      regulatoryRequirement: true,
      platforms: ['Cloud', 'Big Data'],
      color: '#ff00ff',
      constellation: { x: 50, y: 70, connections: [1, 2] }
    }
  };

  // DNA Helix Visualization
  useEffect(() => {
    if (!dnaRef.current || selectedView !== 'bu') return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.001);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      dnaRef.current.clientWidth / dnaRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 200);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(dnaRef.current.clientWidth, dnaRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    dnaRef.current.appendChild(renderer.domElement);

    // Create DNA double helix
    const helixGroup = new THREE.Group();
    const helixHeight = 200;
    const helixRadius = 30;
    const helixTurns = 3;
    const pointsPerTurn = 20;
    const totalPoints = helixTurns * pointsPerTurn;

    // Create strands
    Object.entries(businessUnits).forEach(([name, data], index) => {
      const strand = data.dnaStrand;
      const points = [];
      
      for (let i = 0; i < totalPoints; i++) {
        const t = i / totalPoints;
        const angle = t * Math.PI * 2 * helixTurns + (strand * Math.PI);
        const y = (t - 0.5) * helixHeight;
        const x = Math.cos(angle) * helixRadius;
        const z = Math.sin(angle) * helixRadius;
        
        points.push(new THREE.Vector3(x, y, z));
      }
      
      // Create strand curve
      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeometry = new THREE.TubeGeometry(curve, 100, 2, 8, false);
      const tubeMaterial = new THREE.MeshPhongMaterial({
        color: data.color,
        emissive: data.color,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.8
      });
      const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
      helixGroup.add(tube);
      
      // Add connecting bars between strands
      if (strand === 0 && index % 3 === 0) {
        for (let i = 0; i < totalPoints; i += 5) {
          const t = i / totalPoints;
          const angle1 = t * Math.PI * 2 * helixTurns;
          const angle2 = angle1 + Math.PI;
          const y = (t - 0.5) * helixHeight;
          
          const x1 = Math.cos(angle1) * helixRadius;
          const z1 = Math.sin(angle1) * helixRadius;
          const x2 = Math.cos(angle2) * helixRadius;
          const z2 = Math.sin(angle2) * helixRadius;
          
          const barGeometry = new THREE.CylinderGeometry(1, 1, helixRadius * 2);
          const barMaterial = new THREE.MeshPhongMaterial({
            color: data.status === 'critical' ? 0xff0044 : 0x00ffff,
            emissive: data.status === 'critical' ? 0xff0044 : 0x00ffff,
            emissiveIntensity: 0.2,
            transparent: true,
            opacity: 0.5
          });
          const bar = new THREE.Mesh(barGeometry, barMaterial);
          bar.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
          bar.rotation.z = Math.PI / 2;
          bar.lookAt(new THREE.Vector3(x2, y, z2));
          helixGroup.add(bar);
        }
      }
      
      // Add data nodes
      data.applications.forEach((app, appIndex) => {
        const t = (index * data.applications.length + appIndex) / (Object.keys(businessUnits).length * 4);
        const angle = t * Math.PI * 2 * helixTurns + (strand * Math.PI);
        const y = (t - 0.5) * helixHeight;
        const x = Math.cos(angle) * helixRadius * 1.5;
        const z = Math.sin(angle) * helixRadius * 1.5;
        
        const nodeGeometry = new THREE.SphereGeometry(3, 16, 16);
        const nodeMaterial = new THREE.MeshPhongMaterial({
          color: data.color,
          emissive: data.color,
          emissiveIntensity: 0.5
        });
        const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
        node.position.set(x, y, z);
        helixGroup.add(node);
      });
    });

    scene.add(helixGroup);

    // Add particle field for mutations/gaps
    const particleCount = 1000;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 200;
      positions[i + 1] = (Math.random() - 0.5) * 200;
      positions[i + 2] = (Math.random() - 0.5) * 200;
      
      // Red particles for critical gaps
      colors[i] = 1;
      colors[i + 1] = 0;
      colors[i + 2] = Math.random();
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

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00ffff, 1, 200);
    pointLight1.position.set(50, 50, 50);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff00ff, 1, 200);
    pointLight2.position.set(-50, -50, -50);
    scene.add(pointLight2);

    // Animation loop
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      // Rotate DNA helix
      helixGroup.rotation.y += 0.005;
      
      // Float particles
      particles.rotation.x += 0.001;
      particles.rotation.y += 0.001;
      
      // Camera orbit
      const time = Date.now() * 0.0005;
      camera.position.x = Math.sin(time) * 200;
      camera.position.z = Math.cos(time) * 200;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!dnaRef.current) return;
      camera.aspect = dnaRef.current.clientWidth / dnaRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(dnaRef.current.clientWidth, dnaRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameId) cancelAnimationFrame(frameId);
      if (dnaRef.current && renderer.domElement) {
        dnaRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [selectedView]);

  // Constellation Map for Applications
  useEffect(() => {
    if (!constellationRef.current || selectedView !== 'application') return;
    
    const canvas = constellationRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const stars = Object.entries(applicationClasses).map(([name, data], index) => ({
      name,
      data,
      x: (data.constellation.x / 100) * canvas.width,
      y: (data.constellation.y / 100) * canvas.height,
      radius: Math.sqrt(data.assets) / 10,
      pulsePhase: Math.random() * Math.PI * 2
    }));

    const animate = () => {
      // Dark space background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw connections (data streams)
      stars.forEach((star, index) => {
        star.data.constellation.connections.forEach(targetIndex => {
          if (targetIndex < stars.length) {
            const target = stars[targetIndex];
            
            // Draw curved connection
            const gradient = ctx.createLinearGradient(star.x, star.y, target.x, target.y);
            gradient.addColorStop(0, star.data.color + '40');
            gradient.addColorStop(0.5, '#ffffff20');
            gradient.addColorStop(1, target.data.color + '40');
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 10]);
            ctx.beginPath();
            ctx.moveTo(star.x, star.y);
            
            const cp1x = (star.x + target.x) / 2 + (Math.random() - 0.5) * 50;
            const cp1y = (star.y + target.y) / 2 + (Math.random() - 0.5) * 50;
            ctx.quadraticCurveTo(cp1x, cp1y, target.x, target.y);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Data packets animation
            const progress = (Date.now() * 0.001) % 1;
            const px = star.x + (target.x - star.x) * progress;
            const py = star.y + (target.y - star.y) * progress;
            
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      });

      // Draw star systems
      stars.forEach(star => {
        // Pulsing effect
        star.pulsePhase += 0.05;
        const pulseScale = 1 + Math.sin(star.pulsePhase) * 0.2;
        const currentRadius = star.radius * pulseScale;
        
        // Star glow
        const glow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, currentRadius * 3);
        glow.addColorStop(0, star.data.color + '80');
        glow.addColorStop(0.5, star.data.color + '40');
        glow.addColorStop(1, star.data.color + '00');
        ctx.fillStyle = glow;
        ctx.fillRect(star.x - currentRadius * 3, star.y - currentRadius * 3, currentRadius * 6, currentRadius * 6);
        
        // Star core
        ctx.fillStyle = star.data.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(star.x, star.y, currentRadius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Planets (applications)
        star.data.platforms.forEach((platform, i) => {
          const orbitRadius = currentRadius * (2 + i);
          const angle = (Date.now() * 0.001 + i * Math.PI * 2 / star.data.platforms.length) % (Math.PI * 2);
          const px = star.x + Math.cos(angle) * orbitRadius;
          const py = star.y + Math.sin(angle) * orbitRadius;
          
          // Orbit path
          ctx.strokeStyle = star.data.color + '20';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(star.x, star.y, orbitRadius, 0, Math.PI * 2);
          ctx.stroke();
          
          // Planet
          ctx.fillStyle = star.data.color;
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fill();
        });
        
        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(star.name, star.x, star.y - currentRadius - 20);
        
        // Coverage percentage
        ctx.font = '10px monospace';
        ctx.fillStyle = star.data.coverage < 30 ? '#ff0044' : 
                       star.data.coverage < 60 ? '#ffaa00' : 
                       '#00ff88';
        ctx.fillText(`${star.data.coverage}%`, star.x, star.y + currentRadius + 20);
        
        // Critical gaps (black holes)
        if (star.data.criticality === 'CRITICAL') {
          const blackHoleX = star.x + currentRadius * 2;
          const blackHoleY = star.y;
          
          // Event horizon
          const horizon = ctx.createRadialGradient(blackHoleX, blackHoleY, 5, blackHoleX, blackHoleY, 15);
          horizon.addColorStop(0, '#000000');
          horizon.addColorStop(0.5, '#ff004480');
          horizon.addColorStop(1, '#ff004400');
          ctx.fillStyle = horizon;
          ctx.beginPath();
          ctx.arc(blackHoleX, blackHoleY, 15, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Nebula effect for undefined assets
      const time = Date.now() * 0.0001;
      const nebula = ctx.createRadialGradient(canvas.width * 0.7, canvas.height * 0.3, 0, canvas.width * 0.7, canvas.height * 0.3, 100);
      nebula.addColorStop(0, `rgba(192, 132, 252, ${0.1 + Math.sin(time) * 0.05})`);
      nebula.addColorStop(0.5, `rgba(255, 0, 255, ${0.05 + Math.sin(time) * 0.02})`);
      nebula.addColorStop(1, 'rgba(0, 255, 255, 0)');
      ctx.fillStyle = nebula;
      ctx.fillRect(canvas.width * 0.6, canvas.height * 0.2, 200, 200);

      requestAnimationFrame(animate);
    };

    animate();
  }, [selectedView]);

  // Animate values
  useEffect(() => {
    if (selectedView === 'bu') {
      Object.entries(businessUnits).forEach(([bu, data], index) => {
        setTimeout(() => {
          setAnimatedValues(prev => ({
            ...prev,
            [`${bu}-csoc`]: data.csocCoverage,
            [`${bu}-splunk`]: data.splunkCoverage,
            [`${bu}-chronicle`]: data.chronicleCoverage
          }));
        }, index * 100);
      });
    } else {
      Object.entries(applicationClasses).forEach(([app, data], index) => {
        setTimeout(() => {
          setAnimatedValues(prev => ({
            ...prev,
            [app]: data.coverage
          }));
        }, index * 100);
      });
    }
  }, [selectedView]);

  return (
    <div className="p-8 min-h-screen bg-black">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(ellipse at 20% 30%, rgba(255, 0, 68, 0.1) 0%, transparent 40%),
            radial-gradient(ellipse at 80% 70%, rgba(192, 132, 252, 0.1) 0%, transparent 40%),
            radial-gradient(ellipse at 50% 50%, rgba(0, 255, 255, 0.1) 0%, transparent 50%)
          `,
          animation: 'pulse 8s ease-in-out infinite'
        }} />
      </div>

      {/* Header */}
      <div className="relative z-20 mb-8">
        <h1 className="text-6xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
          ORGANIZATIONAL QUANTUM DNA
        </h1>
        <p className="text-gray-400 uppercase tracking-[0.3em] text-sm">
          Business Unit Genome • Application Constellation Mapping
        </p>
      </div>

      {/* Critical Alert */}
      <div className="relative z-20 mb-6 border border-red-500/50 bg-red-500/10 rounded-lg p-4 backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
          <div>
            <span className="text-red-400 font-bold">DNA CORRUPTION DETECTED:</span>
            <span className="text-white ml-2">Risk & Compliance strand at 8.9% integrity - Regulatory genome failing</span>
          </div>
        </div>
      </div>

      {/* View Selector */}
      <div className="relative z-20 flex gap-2 mb-8">
        <button
          onClick={() => setSelectedView('bu')}
          className={`px-8 py-4 rounded-lg font-bold uppercase tracking-wider transition-all duration-300 backdrop-blur-lg ${
            selectedView === 'bu'
              ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 scale-105 shadow-2xl'
              : 'bg-gray-900/50 hover:bg-gray-800/50'
          }`}
          style={{
            border: selectedView === 'bu' ? '2px solid #00ffff' : '2px solid transparent',
            boxShadow: selectedView === 'bu' ? '0 0 40px rgba(0, 255, 255, 0.4)' : 'none'
          }}
        >
          <Dna className="inline w-5 h-5 mr-2" />
          <span style={{ 
            color: selectedView === 'bu' ? '#00ffff' : '#666',
            textShadow: selectedView === 'bu' ? '0 0 20px #00ffff' : 'none'
          }}>
            BUSINESS UNITS
          </span>
        </button>
        
        <button
          onClick={() => setSelectedView('application')}
          className={`px-8 py-4 rounded-lg font-bold uppercase tracking-wider transition-all duration-300 backdrop-blur-lg ${
            selectedView === 'application'
              ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 scale-105 shadow-2xl'
              : 'bg-gray-900/50 hover:bg-gray-800/50'
          }`}
          style={{
            border: selectedView === 'application' ? '2px solid #c084fc' : '2px solid transparent',
            boxShadow: selectedView === 'application' ? '0 0 40px rgba(192, 132, 252, 0.4)' : 'none'
          }}
        >
          <Star className="inline w-5 h-5 mr-2" />
          <span style={{ 
            color: selectedView === 'application' ? '#c084fc' : '#666',
            textShadow: selectedView === 'application' ? '0 0 20px #c084fc' : 'none'
          }}>
            APPLICATION CLASS
          </span>
        </button>
      </div>

      {/* Main Visualization Area */}
      {selectedView === 'bu' ? (
        <div className="relative z-10 grid grid-cols-2 gap-6 mb-8">
          {/* DNA Helix */}
          <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-cyan-500/30 overflow-hidden"
               style={{
                 boxShadow: '0 0 80px rgba(0, 255, 255, 0.3), inset 0 0 40px rgba(0,0,0,0.8)'
               }}>
            <div className="p-4 border-b border-cyan-500/20">
              <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <Dna className="w-4 h-4" />
                Corporate DNA Helix
              </h3>
            </div>
            <div ref={dnaRef} className="w-full h-[500px]" />
            <div className="absolute top-16 left-4 text-xs font-mono text-cyan-400/60 space-y-1">
              <div>MUTATIONS: DETECTED</div>
              <div>STRAND INTEGRITY: CRITICAL</div>
              <div>REPLICATION: FAILING</div>
            </div>
          </div>

          {/* BU Details */}
          <div className="space-y-4">
            {Object.entries(businessUnits).map(([bu, data]) => (
              <div key={bu} className="bg-black/80 backdrop-blur-xl rounded-xl border p-4 hover:scale-[1.02] transition-all"
                   style={{
                     borderColor: data.status === 'critical' ? 'rgba(255, 0, 68, 0.5)' : 'rgba(255, 170, 0, 0.5)',
                     boxShadow: `0 0 30px ${data.color}20`
                   }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-lg font-bold text-white">{bu}</h4>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{data.cio}</span>
                      <span>•</span>
                      <span>{data.apm}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-400">{data.missing.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">CORRUPTED</div>
                  </div>
                </div>

                {/* Coverage DNA Bars */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-cyan-400 w-16">CSOC</span>
                    <div className="flex-1 h-2 bg-gray-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${animatedValues[`${bu}-csoc`] || 0}%`,
                          background: data.csocCoverage < 20 ? '#ff0044' : '#00ffff'
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono text-cyan-400 w-12 text-right">{data.csocCoverage}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="relative z-10">
          {/* Application Constellation */}
          <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-purple-500/30 overflow-hidden"
               style={{
                 boxShadow: '0 0 80px rgba(192, 132, 252, 0.3), inset 0 0 40px rgba(0,0,0,0.8)'
               }}>
            <div className="p-4 border-b border-purple-500/20">
              <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                <Star className="w-4 h-4" />
                Application Star Map
              </h3>
            </div>
            <canvas ref={constellationRef} className="w-full h-[600px]" />
            <div className="absolute top-16 right-4 text-xs font-mono text-purple-400/60 space-y-1">
              <div>STAR SYSTEMS: 4</div>
              <div>BLACK HOLES: 2</div>
              <div>CONNECTIONS: ACTIVE</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BUandApplicationView;