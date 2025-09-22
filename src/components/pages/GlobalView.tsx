import React, { useState, useEffect, useRef } from 'react';
import { Globe, Eye, AlertTriangle, TrendingDown, Shield, Activity, Database, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import * as THREE from 'three';

const GlobalView: React.FC = () => {
  const [globalData, setGlobalData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const globeRef = useRef<HTMLDivElement>(null);
  const gaugeRef = useRef<HTMLCanvasElement>(null);
  const pulseRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/global_visibility');
        if (!response.ok) throw new Error('Failed to fetch global visibility data');
        const data = await response.json();
        setGlobalData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Animate percentage counter
  useEffect(() => {
    if (!globalData) return;
    
    const target = globalData.global_visibility_percentage;
    const duration = 2000;
    const start = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setAnimatedPercentage(easeOutQuart * target);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }, [globalData]);

  // 3D Globe with visibility heat map
  useEffect(() => {
    if (!globeRef.current || !globalData) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.001);

    const camera = new THREE.PerspectiveCamera(
      45,
      globeRef.current.clientWidth / globeRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 250);

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(globeRef.current.clientWidth, globeRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    globeRef.current.appendChild(renderer.domElement);

    // Create globe with visibility-based coloring
    const globeGeometry = new THREE.IcosahedronGeometry(80, 5);
    const globeMaterial = new THREE.MeshPhongMaterial({
      color: globalData.global_visibility_percentage < 50 ? 0xa855f7 : 0x00d4ff,
      emissive: globalData.global_visibility_percentage < 50 ? 0xa855f7 : 0x00d4ff,
      emissiveIntensity: 0.05,
      wireframe: false,
      transparent: true,
      opacity: 0.9,
    });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);

    // Add wireframe overlay
    const wireGeometry = new THREE.IcosahedronGeometry(81, 2);
    const wireMaterial = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      wireframe: true,
      transparent: true,
      opacity: 0.2
    });
    const wireframe = new THREE.Mesh(wireGeometry, wireMaterial);
    scene.add(wireframe);

    // Visible host particles
    const visibleCount = Math.floor((globalData.global_visibility_percentage / 100) * 200);
    const visibleGeometry = new THREE.BufferGeometry();
    const visiblePositions = new Float32Array(visibleCount * 3);
    
    for (let i = 0; i < visibleCount * 3; i += 3) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();
      const radius = 85 + Math.random() * 15;
      
      visiblePositions[i] = radius * Math.sin(phi) * Math.cos(theta);
      visiblePositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      visiblePositions[i + 2] = radius * Math.cos(phi);
    }
    
    visibleGeometry.setAttribute('position', new THREE.BufferAttribute(visiblePositions, 3));
    const visibleMaterial = new THREE.PointsMaterial({
      color: 0x00d4ff,
      size: 2,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    const visiblePoints = new THREE.Points(visibleGeometry, visibleMaterial);
    scene.add(visiblePoints);

    // Invisible host particles (threats)
    const invisibleCount = Math.floor(((100 - globalData.global_visibility_percentage) / 100) * 100);
    const invisibleGeometry = new THREE.BufferGeometry();
    const invisiblePositions = new Float32Array(invisibleCount * 3);
    
    for (let i = 0; i < invisibleCount * 3; i += 3) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();
      const radius = 90 + Math.random() * 20;
      
      invisiblePositions[i] = radius * Math.sin(phi) * Math.cos(theta);
      invisiblePositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      invisiblePositions[i + 2] = radius * Math.cos(phi);
    }
    
    invisibleGeometry.setAttribute('position', new THREE.BufferAttribute(invisiblePositions, 3));
    const invisibleMaterial = new THREE.PointsMaterial({
      color: 0xa855f7,
      size: 3,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    const invisiblePoints = new THREE.Points(invisibleGeometry, invisibleMaterial);
    scene.add(invisiblePoints);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1, 1000);
    pointLight.position.set(200, 200, 200);
    scene.add(pointLight);

    // Animation
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      globe.rotation.y += 0.002;
      wireframe.rotation.y += 0.002;
      visiblePoints.rotation.y += 0.001;
      invisiblePoints.rotation.y -= 0.001;
      
      const time = Date.now() * 0.0005;
      camera.position.x = Math.sin(time) * 250;
      camera.position.z = Math.cos(time) * 250;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      if (globeRef.current && renderer.domElement) {
        globeRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [globalData]);

  // Animated gauge
  useEffect(() => {
    const canvas = gaugeRef.current;
    if (!canvas || !globalData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    let currentAngle = -Math.PI;
    const targetAngle = -Math.PI + (globalData.global_visibility_percentage / 100) * Math.PI;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background arc
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 20;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI);
      ctx.stroke();

      // Draw visibility arc
      if (currentAngle < targetAngle) {
        currentAngle += 0.02;
      }
      
      const gradient = ctx.createLinearGradient(centerX - radius, centerY, centerX + radius, centerY);
      gradient.addColorStop(0, globalData.global_visibility_percentage < 50 ? '#a855f7' : '#00d4ff');
      gradient.addColorStop(1, globalData.global_visibility_percentage < 50 ? '#ff00ff' : '#00d4ff');
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 20;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, Math.PI, currentAngle);
      ctx.stroke();

      // Draw tick marks
      for (let i = 0; i <= 10; i++) {
        const angle = Math.PI + (i / 10) * Math.PI;
        const x1 = centerX + Math.cos(angle) * (radius - 25);
        const y1 = centerY + Math.sin(angle) * (radius - 25);
        const x2 = centerX + Math.cos(angle) * (radius - 15);
        const y2 = centerY + Math.sin(angle) * (radius - 15);
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      if (currentAngle < targetAngle) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [globalData]);

  // Pulse visualization
  useEffect(() => {
    const canvas = pulseRef.current;
    if (!canvas || !globalData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const time = Date.now() * 0.001;
      
      // Draw visibility pulse
      ctx.strokeStyle = globalData.global_visibility_percentage < 50 ? '#a855f7' : '#00d4ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      for (let x = 0; x < canvas.width; x++) {
        const y = canvas.height / 2 + 
                 Math.sin((x / 50) + time) * (globalData.global_visibility_percentage / 5) +
                 Math.sin((x / 25) + time * 2) * 10;
        
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      
      ctx.stroke();

      requestAnimationFrame(animate);
    };

    animate();
  }, [globalData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
          <div className="mt-4 text-lg font-bold text-cyan-400">ANALYZING GLOBAL VISIBILITY</div>
        </div>
      </div>
    );
  }

  if (error || !globalData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center glass-panel rounded-xl p-8">
          <AlertTriangle className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <div className="text-lg font-bold text-purple-400">DATA LOAD ERROR</div>
          <div className="text-sm text-white">{error || 'No data available'}</div>
        </div>
      </div>
    );
  }

  const isHealthy = globalData.global_visibility_percentage >= 80;
  const isWarning = globalData.global_visibility_percentage >= 50 && globalData.global_visibility_percentage < 80;
  const isCritical = globalData.global_visibility_percentage < 50;

  return (
    <div className="h-full flex flex-col p-4">
      {/* Critical Alert Bar */}
      {isCritical && (
        <div className="mb-3 bg-black border-2 border-purple-500 rounded-xl p-3 animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-purple-400" />
            <span className="text-purple-400 font-bold">CRITICAL:</span>
            <span className="text-white">
              Only {globalData.global_visibility_percentage.toFixed(1)}% of {globalData.total_hosts.toLocaleString()} hosts visible
            </span>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-12 gap-4">
        {/* Left - 3D Globe */}
        <div className="col-span-7">
          <div className="h-full glass-panel rounded-xl p-4">
            <h3 className="text-sm font-bold text-cyan-400 mb-2">GLOBAL HOST VISIBILITY MAP</h3>
            <div ref={globeRef} className="w-full" style={{ height: 'calc(100% - 30px)' }} />
          </div>
        </div>

        {/* Right - Metrics */}
        <div className="col-span-5 space-y-3">
          {/* Main Percentage Display */}
          <div className="glass-panel rounded-xl p-6 text-center">
            <div className="text-6xl font-bold mb-2">
              <span className={isCritical ? 'text-purple-400' : isWarning ? 'text-yellow-400' : 'text-cyan-400'}>
                {animatedPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="text-lg text-white mb-1">GLOBAL VISIBILITY</div>
            <div className="text-xs text-gray-400">
              {globalData.visible_hosts.toLocaleString()} of {globalData.total_hosts.toLocaleString()} hosts
            </div>
          </div>

          {/* Gauge */}
          <div className="glass-panel rounded-xl p-3">
            <canvas ref={gaugeRef} className="w-full h-32" />
          </div>

          {/* Platform Breakdown */}
          <div className="glass-panel rounded-xl p-4">
            <h4 className="text-xs font-bold text-white mb-3">PLATFORM VISIBILITY</h4>
            
            {/* Splunk */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-cyan-400">SPLUNK</span>
                <span className="text-white font-mono">{globalData.splunk_visibility_percentage.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-400 to-cyan-400/50 rounded-full transition-all duration-1000"
                  style={{ width: `${globalData.splunk_visibility_percentage}%` }}
                />
              </div>
            </div>

            {/* Chronicle */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-purple-400">CHRONICLE</span>
                <span className="text-white font-mono">{globalData.chronicle_visibility_percentage.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-400 to-purple-400/50 rounded-full transition-all duration-1000"
                  style={{ width: `${globalData.chronicle_visibility_percentage}%` }}
                />
              </div>
            </div>

            {/* Combined */}
            <div className="pt-2 border-t border-white/10">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white font-bold">COMBINED</span>
                <span className="text-white font-mono font-bold">{globalData.global_visibility_percentage.toFixed(1)}%</span>
              </div>
              <div className="h-3 bg-black/50 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${globalData.global_visibility_percentage}%`,
                    background: `linear-gradient(90deg, ${isCritical ? '#a855f7' : '#00d4ff'}, ${isCritical ? '#ff00ff' : '#00d4ff'})`
                  }}
                />
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-panel rounded-xl p-3">
              <Eye className="w-4 h-4 text-cyan-400 mb-2" />
              <div className="text-2xl font-bold text-white">{(globalData.visible_hosts / 1000).toFixed(0)}K</div>
              <div className="text-xs text-cyan-400">VISIBLE</div>
            </div>
            <div className="glass-panel rounded-xl p-3">
              <TrendingDown className="w-4 h-4 text-purple-400 mb-2" />
              <div className="text-2xl font-bold text-white">{(globalData.invisible_hosts / 1000).toFixed(0)}K</div>
              <div className="text-xs text-purple-400">INVISIBLE</div>
            </div>
          </div>

          {/* Pulse Wave */}
          <div className="glass-panel rounded-xl p-3">
            <canvas ref={pulseRef} className="w-full h-16" />
          </div>

          {/* Status */}
          <div className={`glass-panel rounded-xl p-3 border-2 ${
            isCritical ? 'border-purple-500' : 
            isWarning ? 'border-yellow-500' : 
            'border-cyan-500'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-sm font-bold ${
                  isCritical ? 'text-purple-400' : 
                  isWarning ? 'text-yellow-400' : 
                  'text-cyan-400'
                }`}>
                  {globalData.status}
                </div>
                <div className="text-xs text-white/60">
                  Gap: {globalData.visibility_gap_percentage.toFixed(1)}%
                </div>
              </div>
              <Shield className={`w-6 h-6 ${
                isCritical ? 'text-purple-400' : 
                isWarning ? 'text-yellow-400' : 
                'text-cyan-400'
              }`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalView;