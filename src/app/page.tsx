'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Shield, Activity, Database, Server, Cloud, Network, AlertCircle, TrendingDown, Eye, BarChart3, Globe, Building, Layers, FileSearch, Lock, AlertTriangle, XCircle, Zap, Cpu, Binary, Radar, Wifi } from 'lucide-react';
import Navigation from '@/components/Navigation';
import GlobalView from '@/components/pages/GlobalView';
import InfrastructureView from '@/components/pages/InfrastructureView';
import RegionalCountryView from '@/components/pages/RegionalCountryView';
import BUandApplicationView from '@/components/pages/BUandApplicationView';
import SystemClassification from '@/components/pages/SystemClassification';
import SecurityControlCoverage from '@/components/pages/SecurityControlCoverage';
import ComplianceMatrix from '@/components/pages/ComplianceMatrix';
import DomainVisibility from '@/components/pages/DomainVisibility';
import LoggingStandards from '@/components/pages/LoggingStandards';
import * as THREE from 'three';

export default function Home() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [currentTime, setCurrentTime] = useState<string>('00:00:00');

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: false 
      }));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  // ACTUAL AO1 DATA - Executive Summary
  const executiveMetrics = {
    totalAssets: 262032,
    csocCoverage: 19.17,
    splunkCoverage: 63.93,
    chronicleCoverage: 92.24,
    criticalGaps: 211795,
    complianceStatus: 'FAILED',
    riskLevel: 'CRITICAL'
  };

  const renderPage = () => {
    switch(currentPage) {
      case 'dashboard':
        return <ExecutiveDashboard metrics={executiveMetrics} />;
      case 'global-view':
        return <GlobalView />;
      case 'infrastructure':
        return <InfrastructureView />;
      case 'regional-country':
        return <RegionalCountryView />;
      case 'bu-application':
        return <BUandApplicationView />;
      case 'system-classification':
        return <SystemClassification />;
      case 'security-coverage':
        return <SecurityControlCoverage />;
      case 'compliance':
        return <ComplianceMatrix />;
      case 'domain-visibility':
        return <DomainVisibility />;
      case 'logging-standards':
        return <LoggingStandards />;
      default:
        return <ExecutiveDashboard metrics={executiveMetrics} />;
    }
  };

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      <div className="fixed inset-0">
        <div className="quantum-grid" />
      </div>
      
      <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
      
      <div className="ml-64 h-screen flex flex-col">
        <header className="relative z-20 flex-shrink-0">
          <div className="glass-panel px-6 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {currentPage === 'dashboard' && 'AO1 LOG VISIBILITY MEASUREMENT'}
                    {currentPage === 'global-view' && 'GLOBAL VIEW - CSOC VISIBILITY'}
                    {currentPage === 'infrastructure' && 'INFRASTRUCTURE TYPE ANALYSIS'}
                    {currentPage === 'regional-country' && 'REGIONAL & COUNTRY VIEW'}
                    {currentPage === 'bu-application' && 'BU & APPLICATION VIEW'}
                    {currentPage === 'system-classification' && 'SYSTEM CLASSIFICATION'}
                    {currentPage === 'security-coverage' && 'SECURITY CONTROL COVERAGE'}
                    {currentPage === 'compliance' && 'GSO & SPLUNK COMPLIANCE'}
                    {currentPage === 'domain-visibility' && 'DOMAIN VISIBILITY'}
                    {currentPage === 'logging-standards' && 'LOGGING STANDARDS'}
                  </span>
                </h2>
                <p className="text-xs text-gray-500 uppercase tracking-widest">
                  Fiserv Cybersecurity Logging Standard • Real-Time Visibility Measurement
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="glass-panel px-3 py-1 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${
                      executiveMetrics.csocCoverage < 20 ? 'bg-red-400' : 'bg-green-400'
                    }`} />
                    <span className="text-xs font-medium">
                      <span className={executiveMetrics.csocCoverage < 20 ? 'text-red-400' : 'text-green-400'}>
                        {executiveMetrics.complianceStatus}
                      </span>
                    </span>
                  </div>
                </div>
                
                <div className="glass-panel px-3 py-1 rounded-lg">
                  <span className="text-xs font-medium">
                    <span className="text-purple-300">RISK:</span>
                    <span className="text-red-400 ml-1">{executiveMetrics.riskLevel}</span>
                  </span>
                </div>
                
                <div className="text-xs font-mono text-cyan-400">
                  {currentTime}
                </div>
              </div>
            </div>
          </div>
          {/* Separator line */}
          <div className="h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
        </header>
        
        <main className="relative z-10 flex-1 overflow-hidden">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

// Executive Dashboard Component with Cyberpunk Style
interface ExecutiveDashboardProps {
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

const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ metrics }) => {
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({});
  const threeDRef = useRef<HTMLDivElement>(null);
  const waveRef = useRef<HTMLCanvasElement>(null);
  const networkRef = useRef<HTMLCanvasElement>(null);
  const matrixRef = useRef<HTMLCanvasElement>(null);

  // 3D Security Shield Visualization
  useEffect(() => {
    if (!threeDRef.current) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.002);

    const camera = new THREE.PerspectiveCamera(
      45,
      threeDRef.current.clientWidth / threeDRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 100);

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(threeDRef.current.clientWidth, threeDRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    threeDRef.current.appendChild(renderer.domElement);

    // Central security core
    const coreGeometry = new THREE.IcosahedronGeometry(15, 2);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: metrics.csocCoverage < 20 ? 0xff00ff : 0x00ffff,
      emissive: metrics.csocCoverage < 20 ? 0xff00ff : 0x00ffff,
      emissiveIntensity: 0.3,
      wireframe: false,
      transparent: true,
      opacity: 0.9
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);

    // Security layers
    const layers = [];
    for (let i = 0; i < 3; i++) {
      const layerGeometry = new THREE.IcosahedronGeometry(20 + i * 8, 1);
      const layerMaterial = new THREE.MeshPhongMaterial({
        color: i === 0 ? 0x00ffff : i === 1 ? 0xc084fc : 0xff00ff,
        wireframe: true,
        transparent: true,
        opacity: 0.3 - i * 0.1
      });
      const layer = new THREE.Mesh(layerGeometry, layerMaterial);
      layers.push(layer);
      scene.add(layer);
    }

    // Threat particles
    const particleCount = 300;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 100;
      positions[i + 1] = (Math.random() - 0.5) * 100;
      positions[i + 2] = (Math.random() - 0.5) * 100;
      
      if (Math.random() > 0.7) {
        colors[i] = 1; colors[i + 1] = 0; colors[i + 2] = 1; // Pink
      } else if (Math.random() > 0.4) {
        colors[i] = 0.75; colors[i + 1] = 0.52; colors[i + 2] = 0.99; // Purple
      } else {
        colors[i] = 0; colors[i + 1] = 1; colors[i + 2] = 1; // Cyan
      }
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 1.5,
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

    const pointLight1 = new THREE.PointLight(0x00ffff, 2, 100);
    pointLight1.position.set(50, 50, 50);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff00ff, 2, 100);
    pointLight2.position.set(-50, -50, -50);
    scene.add(pointLight2);

    // Animation
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      core.rotation.x += 0.005;
      core.rotation.y += 0.005;
      core.scale.setScalar(1 + Math.sin(Date.now() * 0.002) * 0.1);
      
      layers.forEach((layer, i) => {
        layer.rotation.x += 0.001 * (i + 1);
        layer.rotation.y -= 0.002 * (i + 1);
        layer.rotation.z += 0.001 * (i + 1);
      });
      
      particles.rotation.y += 0.001;
      
      const time = Date.now() * 0.0005;
      camera.position.x = Math.sin(time) * 80;
      camera.position.z = 100 + Math.cos(time) * 30;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      if (threeDRef.current && renderer.domElement) {
        threeDRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [metrics]);

  // Wave Visualization
  useEffect(() => {
    const canvas = waveRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const time = Date.now() * 0.001;
      
      // Draw coverage waves
      const platforms = [
        { value: metrics.csocCoverage, color: '#00ffff', offset: 0 },
        { value: metrics.splunkCoverage, color: '#c084fc', offset: 2 },
        { value: metrics.chronicleCoverage, color: '#ff00ff', offset: 4 }
      ];

      platforms.forEach(platform => {
        ctx.strokeStyle = platform.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        
        for (let x = 0; x < canvas.width; x++) {
          const y = canvas.height / 2 + 
                   Math.sin((x / 40) + time + platform.offset) * 
                   (platform.value / 4) * 
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

  // Network Visualization
  useEffect(() => {
    const canvas = networkRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const nodes: any[] = [];
    for (let i = 0; i < 20; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 3 + 1,
        color: Math.random() > 0.5 ? '#ff00ff' : Math.random() > 0.5 ? '#c084fc' : '#00ffff'
      });
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw connections
      nodes.forEach((n1, i) => {
        nodes.forEach((n2, j) => {
          if (i !== j) {
            const dx = n1.x - n2.x;
            const dy = n1.y - n2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 60) {
              ctx.strokeStyle = `rgba(192, 132, 252, ${0.3 * (1 - distance / 60)})`;
              ctx.lineWidth = 0.5;
              ctx.beginPath();
              ctx.moveTo(n1.x, n1.y);
              ctx.lineTo(n2.x, n2.y);
              ctx.stroke();
            }
          }
        });
        
        // Update node
        n1.x += n1.vx;
        n1.y += n1.vy;
        
        if (n1.x < 0 || n1.x > canvas.width) n1.vx *= -1;
        if (n1.y < 0 || n1.y > canvas.height) n1.vy *= -1;
        
        // Draw node
        ctx.shadowColor = n1.color;
        ctx.shadowBlur = 5;
        ctx.fillStyle = n1.color;
        ctx.beginPath();
        ctx.arc(n1.x, n1.y, n1.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  // Matrix Rain
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
      drops[i] = Math.random() * -50;
    }

    const matrix = '01CRITICAL1917FAILED';
    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.font = '10px monospace';
      
      for (let i = 0; i < drops.length; i++) {
        const text = matrix[Math.floor(Math.random() * matrix.length)];
        const x = i * 10;
        const y = drops[i] * 10;
        
        if (i % 3 === 0) ctx.fillStyle = '#00ffff';
        else if (i % 3 === 1) ctx.fillStyle = '#c084fc';
        else ctx.fillStyle = '#ff00ff';
        
        ctx.fillText(text, x, y);
        
        if (y > canvas.height && Math.random() > 0.98) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      
      requestAnimationFrame(animate);
    };

    animate();
  }, []);

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

  const criticalGaps = [
    { name: 'EMEA Region', coverage: 12.3, status: 'critical' },
    { name: 'Linux Servers', coverage: 30.71, status: 'critical' },
    { name: 'Network Appliances', coverage: 45.2, status: 'warning' },
    { name: 'DLP Controls', coverage: 62.8, status: 'warning' }
  ];

  const compliance = [
    { name: 'ISO 27001', status: 'FAILED' },
    { name: 'NIST CSF', status: 'FAILED' },
    { name: 'PCI DSS', status: 'AT RISK' },
    { name: 'SOX', status: 'FAILED' }
  ];

  return (
    <div className="p-4 h-full flex flex-col bg-black">
      {/* Critical Alert */}
      <div className="mb-4 bg-black border border-pink-500/50 rounded-xl p-3 flex items-center gap-3">
        <AlertTriangle className="w-6 h-6 text-pink-400 animate-pulse" />
        <div className="flex-1">
          <h3 className="text-lg font-bold text-pink-400">CRITICAL VISIBILITY FAILURE</h3>
          <p className="text-white text-sm">
            CSOC coverage at {metrics.csocCoverage}% - {metrics.criticalGaps.toLocaleString()} assets unmonitored
          </p>
        </div>
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" />
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="glass-panel rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <TrendingDown className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-white">{metrics.totalAssets.toLocaleString()}</div>
          <div className="text-xs text-gray-400">Total Assets</div>
        </div>

        <div className="glass-panel rounded-xl p-3 border-red-500/30">
          <div className="flex items-center justify-between mb-2">
            <Eye className="w-5 h-5 text-red-400" />
            <span className="text-xs bg-red-500/20 text-red-400 px-1 py-0.5 rounded">CRITICAL</span>
          </div>
          <div className="text-2xl font-bold text-red-400">{metrics.csocCoverage}%</div>
          <div className="text-xs text-gray-400">CSOC Visibility</div>
        </div>

        <div className="glass-panel rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <Server className="w-5 h-5 text-purple-400" />
            <Activity className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-2xl font-bold text-yellow-400">{metrics.splunkCoverage}%</div>
          <div className="text-xs text-gray-400">Splunk Coverage</div>
        </div>

        <div className="glass-panel rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <Cloud className="w-5 h-5 text-green-400" />
            <span className="text-xs bg-green-500/20 text-green-400 px-1 py-0.5 rounded">GOOD</span>
          </div>
          <div className="text-2xl font-bold text-green-400">{metrics.chronicleCoverage}%</div>
          <div className="text-xs text-gray-400">Chronicle Coverage</div>
        </div>
      </div>

      {/* Main Visualizations */}
      <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
        <div className="grid grid-rows-2 gap-4">
          {/* 3D Shield */}
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="p-2 border-b border-blue-500/20">
              <h3 className="text-sm font-bold text-cyan-400 uppercase">SECURITY SHIELD</h3>
            </div>
            <div ref={threeDRef} className="w-full" style={{ height: 'calc(100% - 40px)' }} />
          </div>

          {/* Wave Visualization */}
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="p-2 border-b border-purple-500/20">
              <h3 className="text-sm font-bold text-purple-400 uppercase">COVERAGE WAVE</h3>
            </div>
            <canvas ref={waveRef} className="w-full" style={{ height: 'calc(100% - 40px)' }} />
          </div>
        </div>

        <div className="grid grid-rows-3 gap-4">
          {/* Network */}
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="p-2 border-b border-pink-500/20">
              <h3 className="text-sm font-bold text-pink-400 uppercase">THREAT NETWORK</h3>
            </div>
            <canvas ref={networkRef} className="w-full" style={{ height: 'calc(100% - 40px)' }} />
          </div>

          {/* Matrix */}
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="p-2 border-b border-cyan-500/20">
              <h3 className="text-sm font-bold text-cyan-400 uppercase">DATA STREAM</h3>
            </div>
            <canvas ref={matrixRef} className="w-full" style={{ height: 'calc(100% - 40px)' }} />
          </div>

          {/* Platform Coverage */}
          <div className="glass-panel rounded-xl p-3">
            <h3 className="text-sm font-bold text-purple-400 mb-2">PLATFORM STATUS</h3>
            <div className="space-y-2">
              {[
                { name: 'CSOC', value: animatedValues.csoc, color: '#00ffff' },
                { name: 'Splunk', value: animatedValues.splunk, color: '#c084fc' },
                { name: 'Chronicle', value: animatedValues.chronicle, color: '#ff00ff' }
              ].map((platform, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: platform.color }}>{platform.name}</span>
                    <span className="font-mono" style={{ color: platform.color }}>
                      {(platform.value || 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-4 bg-black/50 rounded-full overflow-hidden border border-gray-800">
                    <div 
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ 
                        width: `${platform.value || 0}%`,
                        background: `linear-gradient(90deg, ${platform.color}, ${platform.color}dd)`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};