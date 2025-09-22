import React, { useState, useEffect, useRef } from 'react';
import { Shield, CheckCircle, XCircle, AlertCircle, FileSearch, Database, Server, Cloud, Network, Activity, Lock, AlertTriangle, Zap, Binary, Layers } from 'lucide-react';
import * as THREE from 'three';

const LoggingCompliance: React.FC = () => {
  const [loggingData, setLoggingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<'splunk' | 'chronicle' | 'combined'>('combined');
  const sphereRef = useRef<HTMLDivElement>(null);
  const waveRef = useRef<HTMLCanvasElement>(null);
  const matrixRef = useRef<HTMLCanvasElement>(null);

  // Fetch real data from Flask API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/logging_compliance');
        if (!response.ok) throw new Error('Failed to fetch logging compliance data');
        const data = await response.json();
        setLoggingData(data);
        setError(null);
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

  // 3D Compliance Sphere Visualization
  useEffect(() => {
    if (!sphereRef.current || !loggingData) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.001);

    const camera = new THREE.PerspectiveCamera(
      45,
      sphereRef.current.clientWidth / sphereRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 200);

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(sphereRef.current.clientWidth, sphereRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    sphereRef.current.appendChild(renderer.domElement);

    // Main sphere representing total hosts
    const sphereGeometry = new THREE.SphereGeometry(50, 64, 64);
    const sphereMaterial = new THREE.MeshPhongMaterial({
      color: 0x000000,
      emissive: 0x00d4ff,
      emissiveIntensity: 0.05,
      wireframe: false,
      transparent: true,
      opacity: 0.2
    });
    const mainSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(mainSphere);

    // Splunk coverage sphere
    const splunkRadius = 50 * (loggingData.splunk_compliance.compliance_percentage / 100);
    const splunkGeometry = new THREE.SphereGeometry(splunkRadius, 32, 32);
    const splunkMaterial = new THREE.MeshPhongMaterial({
      color: 0x00d4ff,
      emissive: 0x00d4ff,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.6
    });
    const splunkSphere = new THREE.Mesh(splunkGeometry, splunkMaterial);
    scene.add(splunkSphere);

    // Chronicle coverage sphere
    const chronicleRadius = 50 * (loggingData.chronicle_compliance.compliance_percentage / 100);
    const chronicleGeometry = new THREE.SphereGeometry(chronicleRadius, 32, 32);
    const chronicleMaterial = new THREE.MeshPhongMaterial({
      color: 0xa855f7,
      emissive: 0xa855f7,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.6
    });
    const chronicleSphere = new THREE.Mesh(chronicleGeometry, chronicleMaterial);
    scene.add(chronicleSphere);

    // Particle field for hosts
    const particleCount = Math.min(2000, loggingData.total_hosts / 50);
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 55 + Math.random() * 30;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // Color based on logging status
      const isInSplunk = Math.random() < loggingData.splunk_compliance.compliance_percentage / 100;
      const isInChronicle = Math.random() < loggingData.chronicle_compliance.compliance_percentage / 100;
      
      if (isInSplunk && isInChronicle) {
        colors[i * 3] = 0; colors[i * 3 + 1] = 1; colors[i * 3 + 2] = 1; // Cyan
      } else if (isInSplunk) {
        colors[i * 3] = 0; colors[i * 3 + 1] = 0.83; colors[i * 3 + 2] = 1; // Blue
      } else if (isInChronicle) {
        colors[i * 3] = 0.66; colors[i * 3 + 1] = 0.33; colors[i * 3 + 2] = 0.97; // Purple
      } else {
        colors[i * 3] = 1; colors[i * 3 + 1] = 0; colors[i * 3 + 2] = 0.27; // Pink
      }
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00d4ff, 1, 300);
    pointLight1.position.set(100, 100, 100);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xa855f7, 1, 300);
    pointLight2.position.set(-100, -100, -100);
    scene.add(pointLight2);

    // Animation
    const animate = () => {
      mainSphere.rotation.y += 0.002;
      splunkSphere.rotation.y += 0.003;
      chronicleSphere.rotation.y -= 0.003;
      particles.rotation.y += 0.001;

      // Pulse effect
      const pulse = 1 + Math.sin(Date.now() * 0.002) * 0.05;
      splunkSphere.scale.setScalar(pulse);
      chronicleSphere.scale.setScalar(1.1 - pulse * 0.1);

      // Camera orbit
      const time = Date.now() * 0.0005;
      camera.position.x = Math.sin(time) * 200;
      camera.position.z = Math.cos(time) * 200;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (sphereRef.current && renderer.domElement) {
        sphereRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [loggingData]);

  // Wave visualization for compliance trends
  useEffect(() => {
    const canvas = waveRef.current;
    if (!canvas || !loggingData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const time = Date.now() * 0.001;
      
      // Splunk wave
      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      for (let x = 0; x < canvas.width; x++) {
        const y = canvas.height / 2 + 
                 Math.sin((x / 50) + time) * (loggingData.splunk_compliance.compliance_percentage / 5) +
                 Math.sin((x / 25) + time * 2) * 10;
        
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Chronicle wave
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      for (let x = 0; x < canvas.width; x++) {
        const y = canvas.height / 2 + 
                 Math.sin((x / 50) + time + Math.PI) * (loggingData.chronicle_compliance.compliance_percentage / 5) +
                 Math.sin((x / 25) + time * 2 + Math.PI) * 10;
        
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      requestAnimationFrame(animate);
    };

    animate();
  }, [loggingData]);

  // Status matrix visualization
  useEffect(() => {
    const canvas = matrixRef.current;
    if (!canvas || !loggingData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw status breakdown grid
      const statuses = [
        ...loggingData.splunk_compliance.status_breakdown,
        ...loggingData.chronicle_compliance.status_breakdown
      ];

      const cols = 4;
      const rows = Math.ceil(statuses.length / cols);
      const cellWidth = canvas.width / cols;
      const cellHeight = canvas.height / rows;

      statuses.forEach((status: any, index: number) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const x = col * cellWidth;
        const y = row * cellHeight;

        // Cell color based on compliance
        const color = status.is_compliant ? '#00d4ff' : '#a855f7';
        const opacity = status.percentage / 100;

        ctx.fillStyle = `${color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
        ctx.fillRect(x + 2, y + 2, cellWidth - 4, cellHeight - 4);

        // Status text
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          status.status.substring(0, 12),
          x + cellWidth / 2,
          y + cellHeight / 2 - 10
        );

        // Percentage
        ctx.font = 'bold 14px monospace';
        ctx.fillStyle = status.is_compliant ? '#00d4ff' : '#a855f7';
        ctx.fillText(
          `${status.percentage.toFixed(1)}%`,
          x + cellWidth / 2,
          y + cellHeight / 2 + 10
        );
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, [loggingData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
          <div className="mt-4 text-lg font-bold text-cyan-400">ANALYZING LOGGING COMPLIANCE</div>
        </div>
      </div>
    );
  }

  if (error || !loggingData) {
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

  const getStatusColor = (percentage: number) => {
    if (percentage >= 80) return 'text-cyan-400';
    if (percentage >= 50) return 'text-purple-400';
    return 'text-pink-400';
  };

  const getStatusLabel = (percentage: number) => {
    if (percentage >= 80) return 'HEALTHY';
    if (percentage >= 50) return 'WARNING';
    return 'CRITICAL';
  };

  return (
    <div className="h-full flex flex-col p-4">
      {/* Critical Alert */}
      {loggingData.combined_compliance.either_platform.percentage < 50 && (
        <div className="mb-3 bg-black border border-purple-500/50 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-purple-400 animate-pulse" />
            <span className="text-purple-400 font-bold text-sm">CRITICAL:</span>
            <span className="text-white text-sm">
              Only {loggingData.combined_compliance.either_platform.percentage.toFixed(1)}% of hosts have logging enabled
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 grid grid-cols-12 gap-4">
        {/* 3D Compliance Sphere */}
        <div className="col-span-7">
          <div className="h-full glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-cyan-400">LOGGING PLATFORM COVERAGE</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedPlatform('splunk')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                    selectedPlatform === 'splunk' 
                      ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-400'
                      : 'bg-gray-900/50 border border-gray-700 text-gray-400'
                  }`}
                >
                  SPLUNK
                </button>
                <button
                  onClick={() => setSelectedPlatform('chronicle')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                    selectedPlatform === 'chronicle' 
                      ? 'bg-purple-500/20 border border-purple-500 text-purple-400'
                      : 'bg-gray-900/50 border border-gray-700 text-gray-400'
                  }`}
                >
                  CHRONICLE
                </button>
                <button
                  onClick={() => setSelectedPlatform('combined')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                    selectedPlatform === 'combined' 
                      ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500 text-white'
                      : 'bg-gray-900/50 border border-gray-700 text-gray-400'
                  }`}
                >
                  COMBINED
                </button>
              </div>
            </div>
            <div ref={sphereRef} className="w-full" style={{ height: 'calc(100% - 60px)' }} />
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-5 space-y-3">
          {/* Main Metrics */}
          <div className="glass-panel rounded-xl p-4">
            <h3 className="text-sm font-bold text-purple-400 mb-3">COMPLIANCE OVERVIEW</h3>
            
            {/* Splunk */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <span className="text-white font-bold">SPLUNK</span>
                </div>
                <div>
                  <span className={`text-2xl font-bold ${getStatusColor(loggingData.splunk_compliance.compliance_percentage)}`}>
                    {loggingData.splunk_compliance.compliance_percentage.toFixed(1)}%
                  </span>
                  <span className={`ml-2 text-xs ${getStatusColor(loggingData.splunk_compliance.compliance_percentage)}`}>
                    {getStatusLabel(loggingData.splunk_compliance.compliance_percentage)}
                  </span>
                </div>
              </div>
              <div className="h-3 bg-black/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-400 to-cyan-400/50 transition-all duration-1000"
                  style={{ width: `${loggingData.splunk_compliance.compliance_percentage}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs">
                <span className="text-cyan-400">
                  {loggingData.splunk_compliance.compliant_hosts.toLocaleString()} compliant
                </span>
                <span className="text-purple-400">
                  {loggingData.splunk_compliance.non_compliant_hosts.toLocaleString()} missing
                </span>
              </div>
            </div>

            {/* Chronicle */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span className="text-white font-bold">CHRONICLE</span>
                </div>
                <div>
                  <span className={`text-2xl font-bold ${getStatusColor(loggingData.chronicle_compliance.compliance_percentage)}`}>
                    {loggingData.chronicle_compliance.compliance_percentage.toFixed(1)}%
                  </span>
                  <span className={`ml-2 text-xs ${getStatusColor(loggingData.chronicle_compliance.compliance_percentage)}`}>
                    {getStatusLabel(loggingData.chronicle_compliance.compliance_percentage)}
                  </span>
                </div>
              </div>
              <div className="h-3 bg-black/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-400 to-purple-400/50 transition-all duration-1000"
                  style={{ width: `${loggingData.chronicle_compliance.compliance_percentage}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs">
                <span className="text-purple-400">
                  {loggingData.chronicle_compliance.compliant_hosts.toLocaleString()} compliant
                </span>
                <span className="text-pink-400">
                  {loggingData.chronicle_compliance.non_compliant_hosts.toLocaleString()} missing
                </span>
              </div>
            </div>

            {/* Combined Coverage */}
            <div className="pt-3 border-t border-white/10">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-xs text-gray-400 mb-1">BOTH</div>
                  <div className="text-lg font-bold text-cyan-400">
                    {loggingData.combined_compliance.both_platforms.percentage.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">EITHER</div>
                  <div className="text-lg font-bold text-purple-400">
                    {loggingData.combined_compliance.either_platform.percentage.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">NEITHER</div>
                  <div className="text-lg font-bold text-pink-400">
                    {loggingData.combined_compliance.neither_platform.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Wave Visualization */}
          <div className="glass-panel rounded-xl p-3">
            <h3 className="text-sm font-bold text-cyan-400 mb-2">COMPLIANCE SIGNAL</h3>
            <canvas ref={waveRef} className="w-full h-24" />
          </div>

          {/* Status Matrix */}
          <div className="glass-panel rounded-xl p-3">
            <h3 className="text-sm font-bold text-purple-400 mb-2">STATUS BREAKDOWN</h3>
            <canvas ref={matrixRef} className="w-full h-32" />
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-panel rounded-xl p-3">
              <Activity className="w-4 h-4 text-cyan-400 mb-2" />
              <div className="text-2xl font-bold text-white">
                {loggingData.total_hosts.toLocaleString()}
              </div>
              <div className="text-xs text-cyan-400">TOTAL HOSTS</div>
            </div>
            <div className="glass-panel rounded-xl p-3">
              <AlertCircle className="w-4 h-4 text-purple-400 mb-2" />
              <div className="text-2xl font-bold text-white">
                {loggingData.combined_compliance.neither_platform.host_count.toLocaleString()}
              </div>
              <div className="text-xs text-purple-400">NOT LOGGING</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoggingCompliance;