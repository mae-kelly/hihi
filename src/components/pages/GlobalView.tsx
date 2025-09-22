import React, { useState, useEffect, useRef } from 'react';
import { Globe, AlertTriangle, Eye, TrendingDown, Shield, Activity, Database, Zap } from 'lucide-react';
import * as THREE from 'three';

const GlobalView: React.FC = () => {
  const [globalData, setGlobalData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const globeRef = useRef<HTMLDivElement>(null);
  const visibilityRef = useRef<HTMLCanvasElement>(null);

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

  // 3D Globe showing visibility coverage
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
    camera.position.set(0, 0, 300);

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(globeRef.current.clientWidth, globeRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    globeRef.current.appendChild(renderer.domElement);

    // Globe with visibility-based coloring
    const visibility = globalData.global_visibility_percentage;
    const globeGeometry = new THREE.IcosahedronGeometry(100, 4);
    const globeMaterial = new THREE.MeshPhongMaterial({
      color: visibility < 50 ? 0xa855f7 : 0x00d4ff,
      emissive: visibility < 50 ? 0xa855f7 : 0x00d4ff,
      emissiveIntensity: 0.1,
      wireframe: false,
      transparent: true,
      opacity: 0.8,
    });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);

    // Visible nodes
    const visibleCount = Math.floor((visibility / 100) * 50);
    for (let i = 0; i < visibleCount; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();
      const radius = 102;
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      const nodeGeometry = new THREE.SphereGeometry(2, 8, 8);
      const nodeMaterial = new THREE.MeshBasicMaterial({
        color: 0x00d4ff,
        emissive: 0x00d4ff
      });
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
      node.position.set(x, y, z);
      scene.add(node);
    }

    // Invisible nodes (threats)
    const invisibleCount = Math.floor(((100 - visibility) / 100) * 30);
    for (let i = 0; i < invisibleCount; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();
      const radius = 105;
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      const nodeGeometry = new THREE.BoxGeometry(3, 3, 3);
      const nodeMaterial = new THREE.MeshBasicMaterial({
        color: 0xa855f7,
        emissive: 0xa855f7
      });
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
      node.position.set(x, y, z);
      scene.add(node);
    }

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
      
      const time = Date.now() * 0.0005;
      camera.position.x = Math.sin(time) * 300;
      camera.position.z = Math.cos(time) * 300;
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

  // Visibility gauge animation
  useEffect(() => {
    const canvas = visibilityRef.current;
    if (!canvas || !globalData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let currentAngle = -Math.PI;
    const targetAngle = -Math.PI + (globalData.global_visibility_percentage / 100) * Math.PI;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height - 20;
      const radius = Math.min(canvas.width, canvas.height) * 0.4;

      // Draw arc background
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 30;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI);
      ctx.stroke();

      // Draw visibility arc
      if (currentAngle < targetAngle) {
        currentAngle += 0.02;
      }
      
      const gradient = ctx.createLinearGradient(centerX - radius, centerY, centerX + radius, centerY);
      gradient.addColorStop(0, globalData.global_visibility_percentage < 50 ? '#a855f7' : '#00d4ff');
      gradient.addColorStop(1, globalData.global_visibility_percentage < 50 ? '#a855f7' : '#00d4ff');
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 30;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, Math.PI, currentAngle);
      ctx.stroke();

      // Draw percentage text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${globalData.global_visibility_percentage.toFixed(1)}%`, centerX, centerY - 20);
      
      ctx.font = '14px monospace';
      ctx.fillStyle = globalData.global_visibility_percentage < 50 ? '#a855f7' : '#00d4ff';
      ctx.fillText('GLOBAL VISIBILITY', centerX, centerY + 10);

      if (currentAngle < targetAngle) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [globalData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400"></div>
          <div className="mt-4 text-xl font-bold text-cyan-400">LOADING GLOBAL VISIBILITY</div>
        </div>
      </div>
    );
  }

  if (error || !globalData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center glass-panel rounded-xl p-8">
          <AlertTriangle className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <div className="text-xl font-bold text-purple-400 mb-2">DATA LOAD ERROR</div>
          <div className="text-sm text-white">{error || 'No data available'}</div>
        </div>
      </div>
    );
  }

  const isHealthy = globalData.global_visibility_percentage >= 80;
  const isWarning = globalData.global_visibility_percentage >= 50 && globalData.global_visibility_percentage < 80;
  const isCritical = globalData.global_visibility_percentage < 50;

  return (
    <div className="p-6 h-full bg-black flex flex-col">
      {/* Critical Alert Bar */}
      {isCritical && (
        <div className="mb-4 bg-black border-2 border-purple-500 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-purple-400 animate-pulse" />
            <div>
              <span className="text-purple-400 font-bold text-lg">CRITICAL VISIBILITY FAILURE</span>
              <span className="text-white ml-4">
                Only {globalData.global_visibility_percentage.toFixed(1)}% of {globalData.total_hosts.toLocaleString()} hosts visible
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-12 gap-4">
        {/* Left - 3D Globe */}
        <div className="col-span-7">
          <div className="h-full bg-black border border-white/10 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-cyan-400" />
                GLOBAL HOST VISIBILITY MAP
              </h3>
            </div>
            <div ref={globeRef} className="w-full" style={{ height: 'calc(100% - 60px)' }} />
          </div>
        </div>

        {/* Right - Metrics and Gauge */}
        <div className="col-span-5 space-y-4">
          {/* Visibility Gauge */}
          <div className="bg-black border border-white/10 rounded-xl p-4">
            <canvas ref={visibilityRef} className="w-full h-48" />
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black border border-cyan-400/30 rounded-xl p-4">
              <Eye className="w-6 h-6 text-cyan-400 mb-2" />
              <div className="text-3xl font-bold text-white">{globalData.visible_hosts.toLocaleString()}</div>
              <div className="text-sm text-cyan-400">VISIBLE HOSTS</div>
              <div className="text-xs text-white/60 mt-1">Can see logs</div>
            </div>
            <div className="bg-black border border-purple-400/30 rounded-xl p-4">
              <TrendingDown className="w-6 h-6 text-purple-400 mb-2" />
              <div className="text-3xl font-bold text-white">{globalData.invisible_hosts.toLocaleString()}</div>
              <div className="text-sm text-purple-400">INVISIBLE HOSTS</div>
              <div className="text-xs text-white/60 mt-1">No visibility</div>
            </div>
          </div>

          {/* Platform Breakdown */}
          <div className="bg-black border border-white/10 rounded-xl p-4">
            <h3 className="text-sm font-bold text-white mb-4">PLATFORM VISIBILITY</h3>
            
            <div className="space-y-3">
              {/* Splunk */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-cyan-400">SPLUNK</span>
                  <span className="text-white font-mono">{globalData.splunk_visibility_percentage.toFixed(1)}%</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-cyan-400 rounded-full transition-all duration-1000"
                    style={{ width: `${globalData.splunk_visibility_percentage}%` }}
                  />
                </div>
              </div>

              {/* Chronicle */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-purple-400">CHRONICLE</span>
                  <span className="text-white font-mono">{globalData.chronicle_visibility_percentage.toFixed(1)}%</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-400 rounded-full transition-all duration-1000"
                    style={{ width: `${globalData.chronicle_visibility_percentage}%` }}
                  />
                </div>
              </div>

              {/* Combined */}
              <div className="pt-2 border-t border-white/10">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white font-bold">COMBINED VISIBILITY</span>
                  <span className="text-white font-mono font-bold">{globalData.global_visibility_percentage.toFixed(1)}%</span>
                </div>
                <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${globalData.global_visibility_percentage}%`,
                      background: globalData.global_visibility_percentage < 50 ? '#a855f7' : '#00d4ff'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Status Indicator */}
          <div className={`bg-black border-2 rounded-xl p-4 ${
            isCritical ? 'border-purple-500' : 
            isWarning ? 'border-yellow-500' : 
            'border-cyan-500'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-lg font-bold ${
                  isCritical ? 'text-purple-400' : 
                  isWarning ? 'text-yellow-400' : 
                  'text-cyan-400'
                }`}>
                  {globalData.status}
                </div>
                <div className="text-xs text-white/60">
                  {isCritical ? 'Immediate action required' : 
                   isWarning ? 'Improvement needed' : 
                   'Meeting visibility targets'}
                </div>
              </div>
              <Shield className={`w-8 h-8 ${
                isCritical ? 'text-purple-400' : 
                isWarning ? 'text-yellow-400' : 
                'text-cyan-400'
              }`} />
            </div>
          </div>

          {/* Gap Analysis */}
          <div className="bg-black border border-white/10 rounded-xl p-4">
            <h3 className="text-sm font-bold text-white mb-2">VISIBILITY GAP</h3>
            <div className="text-3xl font-bold text-purple-400">
              {globalData.visibility_gap_percentage.toFixed(1)}%
            </div>
            <div className="text-xs text-white/60">
              {globalData.invisible_hosts.toLocaleString()} hosts need logging configuration
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalView;