'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Building, Layers, Database, Network, Shield, AlertTriangle, Activity, TrendingDown, Server, Cloud, Dna, Star, Orbit, Atom, Binary, Cpu, XCircle } from 'lucide-react';
import * as THREE from 'three';

const BUandApplicationView: React.FC = () => {
  const [selectedView, setSelectedView] = useState<'bu' | 'application'>('bu');
  const [selectedBU, setSelectedBU] = useState<string | null>(null);
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({});
  const dnaRef = useRef<HTMLDivElement>(null);
  const constellationRef = useRef<HTMLCanvasElement>(null);
  const pulseRef = useRef<HTMLCanvasElement>(null);

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
      color: '#ff00ff',
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
      color: '#ff00ff',
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
      color: '#ff00ff',
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

  // Compact DNA Helix Visualization
  useEffect(() => {
    if (!dnaRef.current || selectedView !== 'bu') return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.002);

    const camera = new THREE.PerspectiveCamera(
      45,
      dnaRef.current.clientWidth / dnaRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 120);

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(dnaRef.current.clientWidth, dnaRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    dnaRef.current.appendChild(renderer.domElement);

    // Create DNA double helix
    const helixGroup = new THREE.Group();
    const helixHeight = 100;
    const helixRadius = 20;
    const helixTurns = 2;
    const pointsPerTurn = 15;
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
      const tubeGeometry = new THREE.TubeGeometry(curve, 50, 1.5, 6, false);
      const tubeMaterial = new THREE.MeshPhongMaterial({
        color: data.status === 'critical' ? 0xff00ff : 0x00ffff,
        emissive: data.status === 'critical' ? 0xff00ff : 0x00ffff,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.8
      });
      const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
      helixGroup.add(tube);
      
      // Add connecting bars
      if (strand === 0 && index % 2 === 0) {
        for (let i = 0; i < totalPoints; i += 4) {
          const t = i / totalPoints;
          const angle1 = t * Math.PI * 2 * helixTurns;
          const angle2 = angle1 + Math.PI;
          const y = (t - 0.5) * helixHeight;
          
          const x1 = Math.cos(angle1) * helixRadius;
          const z1 = Math.sin(angle1) * helixRadius;
          const x2 = Math.cos(angle2) * helixRadius;
          const z2 = Math.sin(angle2) * helixRadius;
          
          const barGeometry = new THREE.CylinderGeometry(0.5, 0.5, helixRadius * 2);
          const barMaterial = new THREE.MeshPhongMaterial({
            color: data.csocCoverage < 20 ? 0xff00ff : 0x00ffff,
            emissive: data.csocCoverage < 20 ? 0xff00ff : 0x00ffff,
            emissiveIntensity: 0.1,
            transparent: true,
            opacity: 0.3
          });
          const bar = new THREE.Mesh(barGeometry, barMaterial);
          bar.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
          bar.rotation.z = Math.PI / 2;
          bar.lookAt(new THREE.Vector3(x2, y, z2));
          helixGroup.add(bar);
        }
      }
    });

    scene.add(helixGroup);

    // Add particle field
    const particleCount = 200;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 150;
      positions[i + 1] = (Math.random() - 0.5) * 150;
      positions[i + 2] = (Math.random() - 0.5) * 150;
      
      if (Math.random() > 0.7) {
        colors[i] = 1; colors[i + 1] = 0; colors[i + 2] = 1;
      } else if (Math.random() > 0.4) {
        colors[i] = 0.75; colors[i + 1] = 0.52; colors[i + 2] = 0.99;
      } else {
        colors[i] = 0; colors[i + 1] = 1; colors[i + 2] = 1;
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

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x0a0a0a);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00ffff, 1, 150);
    pointLight1.position.set(50, 50, 50);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff00ff, 1, 150);
    pointLight2.position.set(-50, -50, -50);
    scene.add(pointLight2);

    // Animation loop
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      helixGroup.rotation.y += 0.005;
      particles.rotation.x += 0.001;
      particles.rotation.y += 0.001;
      
      const time = Date.now() * 0.0005;
      camera.position.x = Math.sin(time) * 100;
      camera.position.z = Math.cos(time) * 100;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
    };

    animate();

    return () => {
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
      radius: Math.sqrt(data.assets) / 15,
      pulsePhase: Math.random() * Math.PI * 2
    }));

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw connections
      stars.forEach((star) => {
        star.data.constellation.connections.forEach(targetIndex => {
          if (targetIndex < stars.length) {
            const target = stars[targetIndex];
            
            const gradient = ctx.createLinearGradient(star.x, star.y, target.x, target.y);
            gradient.addColorStop(0, star.data.color + '40');
            gradient.addColorStop(0.5, '#ffffff20');
            gradient.addColorStop(1, target.data.color + '40');
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 10]);
            ctx.beginPath();
            ctx.moveTo(star.x, star.y);
            ctx.lineTo(target.x, target.y);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        });
      });

      // Draw stars
      stars.forEach(star => {
        star.pulsePhase += 0.05;
        const pulseScale = 1 + Math.sin(star.pulsePhase) * 0.2;
        const currentRadius = star.radius * pulseScale;
        
        // Star glow
        const glow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, currentRadius * 2);
        glow.addColorStop(0, star.data.color + '80');
        glow.addColorStop(0.5, star.data.color + '40');
        glow.addColorStop(1, star.data.color + '00');
        ctx.fillStyle = glow;
        ctx.fillRect(star.x - currentRadius * 2, star.y - currentRadius * 2, currentRadius * 4, currentRadius * 4);
        
        // Star core
        ctx.fillStyle = star.data.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(star.name, star.x, star.y - currentRadius - 10);
        
        // Coverage
        ctx.font = '9px monospace';
        ctx.fillStyle = star.data.coverage < 30 ? '#ff00ff' : 
                       star.data.coverage < 60 ? '#c084fc' : 
                       '#00ffff';
        ctx.fillText(`${star.data.coverage}%`, star.x, star.y + currentRadius + 10);
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, [selectedView]);

  // Pulse Wave Visualization
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
      
      // Draw BU waves
      Object.entries(businessUnits).forEach((bu, index) => {
        const data = bu[1];
        ctx.strokeStyle = data.color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        
        for (let x = 0; x < canvas.width; x++) {
          const y = (index + 1) * (canvas.height / 6) + 
                   Math.sin((x / 30) + time + index * 2) * 
                   (data.csocCoverage / 5);
          
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        
        ctx.stroke();
      });
      
      ctx.globalAlpha = 1;
      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  // Animate values
  useEffect(() => {
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
  }, [selectedView]);

  return (
    <div className="p-2 h-screen bg-black overflow-hidden flex flex-col">
      {/* Critical Alert */}
      <div className="mb-2 border border-pink-500/50 bg-black rounded-lg p-1.5 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-pink-400 animate-pulse" />
        <span className="text-pink-400 font-bold text-xs">DNA CORRUPTION:</span>
        <span className="text-white text-xs">Risk & Compliance at 8.9% • Regulatory genome failing</span>
      </div>

      {/* View Selector */}
      <div className="flex gap-2 mb-2">
        <button
          onClick={() => setSelectedView('bu')}
          className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
            selectedView === 'bu'
              ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20'
              : 'bg-gray-900/50 hover:bg-gray-800/50'
          }`}
          style={{
            border: selectedView === 'bu' ? '1px solid #00ffff' : '1px solid transparent'
          }}
        >
          <Dna className="inline w-3 h-3 mr-1" />
          <span className={selectedView === 'bu' ? 'text-blue-400' : 'text-gray-400'}>
            BUSINESS UNITS
          </span>
        </button>
        
        <button
          onClick={() => setSelectedView('application')}
          className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
            selectedView === 'application'
              ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20'
              : 'bg-gray-900/50 hover:bg-gray-800/50'
          }`}
          style={{
            border: selectedView === 'application' ? '1px solid #c084fc' : '1px solid transparent'
          }}
        >
          <Star className="inline w-3 h-3 mr-1" />
          <span className={selectedView === 'application' ? 'text-purple-400' : 'text-gray-400'}>
            APPLICATIONS
          </span>
        </button>
      </div>

      {/* Main Content */}
      {selectedView === 'bu' ? (
        <div className="flex-1 grid grid-cols-12 gap-2">
          {/* DNA Helix */}
          <div className="col-span-5 grid grid-rows-2 gap-2">
            <div className="bg-black border border-blue-500/30 rounded-lg overflow-hidden">
              <div className="p-1.5 border-b border-blue-500/20">
                <h3 className="text-[10px] font-bold text-blue-400 uppercase flex items-center gap-1">
                  <Dna className="w-3 h-3" />
                  Corporate DNA
                </h3>
              </div>
              <div ref={dnaRef} className="w-full" style={{ height: 'calc(100% - 28px)' }} />
            </div>

            <div className="bg-black border border-purple-500/30 rounded-lg overflow-hidden">
              <div className="p-1.5 border-b border-purple-500/20">
                <h3 className="text-[10px] font-bold text-purple-400 uppercase flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  BU Pulse
                </h3>
              </div>
              <canvas ref={pulseRef} className="w-full" style={{ height: 'calc(100% - 28px)' }} />
            </div>
          </div>

          {/* BU Details */}
          <div className="col-span-7 overflow-y-auto pr-2 space-y-2">
            {Object.entries(businessUnits).map(([bu, data]) => (
              <div key={bu} className="bg-gray-900/30 rounded-lg p-2 border border-gray-800">
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <h4 className="text-sm font-bold text-white">{bu}</h4>
                    <div className="flex items-center gap-2 text-[9px] text-gray-400">
                      <span>{data.cio}</span>
                      <span>•</span>
                      <span>{data.apm}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-pink-400">{(data.missing/1000).toFixed(0)}K</div>
                    <div className="text-[8px] text-gray-400">MISSING</div>
                  </div>
                </div>

                {/* Coverage Bars */}
                <div className="grid grid-cols-3 gap-1">
                  <div>
                    <div className="flex justify-between text-[8px] mb-0.5">
                      <span className="text-blue-400">CSOC</span>
                      <span className="font-mono text-blue-400">{data.csocCoverage}%</span>
                    </div>
                    <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${animatedValues[`${bu}-csoc`] || 0}%`,
                          background: data.csocCoverage < 20 ? '#ff00ff' : '#00ffff'
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[8px] mb-0.5">
                      <span className="text-purple-400">SPL</span>
                      <span className="font-mono text-purple-400">{data.splunkCoverage}%</span>
                    </div>
                    <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${animatedValues[`${bu}-splunk`] || 0}%`,
                          background: '#c084fc'
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[8px] mb-0.5">
                      <span className="text-pink-400">CHR</span>
                      <span className="font-mono text-pink-400">{data.chronicleCoverage}%</span>
                    </div>
                    <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${animatedValues[`${bu}-chronicle`] || 0}%`,
                          background: '#ff00ff'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Applications */}
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {data.applications.slice(0, 3).map((app, i) => (
                    <span key={i} className="text-[8px] px-1.5 py-0.5 bg-black/50 rounded border border-gray-700 text-gray-400">
                      {app}
                    </span>
                  ))}
                  {data.applications.length > 3 && (
                    <span className="text-[8px] px-1.5 py-0.5 bg-black/50 rounded border border-gray-700 text-gray-500">
                      +{data.applications.length - 3}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-2 gap-2">
          {/* Application Constellation */}
          <div className="bg-black border border-purple-500/30 rounded-lg overflow-hidden">
            <div className="p-1.5 border-b border-purple-500/20">
              <h3 className="text-[10px] font-bold text-purple-400 uppercase flex items-center gap-1">
                <Star className="w-3 h-3" />
                Application Map
              </h3>
            </div>
            <canvas ref={constellationRef} className="w-full" style={{ height: 'calc(100% - 28px)' }} />
          </div>

          {/* Application Details */}
          <div className="overflow-y-auto pr-2 space-y-2">
            {Object.entries(applicationClasses).map(([app, data]) => (
              <div key={app} className="bg-gray-900/30 rounded-lg p-2 border border-gray-800">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-sm font-bold text-white">{app}</h4>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                    data.criticality === 'CRITICAL' ? 'bg-pink-500/20 text-pink-400' :
                    data.criticality === 'HIGH' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {data.criticality}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[9px]">
                  <div>
                    <div className="text-gray-400">Coverage</div>
                    <div className="font-mono" style={{ color: data.coverage < 30 ? '#ff00ff' : data.coverage < 60 ? '#c084fc' : '#00ffff' }}>
                      {data.coverage}%
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Assets</div>
                    <div className="font-mono text-blue-400">{(data.assets/1000).toFixed(0)}K</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Missing</div>
                    <div className="font-mono text-pink-400">{(data.missing/1000).toFixed(0)}K</div>
                  </div>
                </div>

                <div className="mt-1.5">
                  <div className="h-3 bg-black/50 rounded-full overflow-hidden border border-gray-800">
                    <div 
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${data.coverage}%`,
                        background: `linear-gradient(90deg, ${data.color}, ${data.color}dd)`
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BUandApplicationView;