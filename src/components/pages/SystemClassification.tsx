import React, { useState, useEffect, useRef } from 'react';
import { Shield, AlertTriangle, Activity, Lock, Network, Database, Zap, Eye, Server, Cpu, HardDrive } from 'lucide-react';
import * as THREE from 'three';

const SystemClassification: React.FC = () => {
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [systemData, setSystemData] = useState<any>(null);
  const [infrastructureData, setInfrastructureData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const threatMapRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<HTMLCanvasElement>(null);
  
  // Fetch real data from Flask API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [infraResponse, domainResponse] = await Promise.all([
          fetch('http://localhost:5000/api/infrastructure_type'),
          fetch('http://localhost:5000/api/domain_metrics')
        ]);

        if (!infraResponse.ok || !domainResponse.ok) {
          throw new Error('Failed to fetch system data');
        }

        const infraData = await infraResponse.json();
        const domData = await domainResponse.json();
        
        setInfrastructureData(infraData);
        setSystemData(domData);
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

  // Process real data into systems structure
  const systems = React.useMemo(() => {
    if (!infrastructureData) return {};

    const systemsMap: any = {};
    
    // Map infrastructure types to system classifications
    infrastructureData.detailed_data?.slice(0, 6).forEach((infra: any) => {
      const systemName = infra.type.includes('windows') ? 'Windows' :
                        infra.type.includes('linux') ? 'Linux' :
                        infra.type.includes('vmware') ? 'VMware' :
                        infra.type.includes('aws') || infra.type.includes('azure') || infra.type.includes('gcp') ? 'Cloud' :
                        infra.type.includes('docker') || infra.type.includes('kubernetes') ? 'Container' :
                        infra.type.includes('physical') ? 'Physical' :
                        'Network';
      
      if (!systemsMap[systemName]) {
        systemsMap[systemName] = {
          vuln: 0,
          risk: 0,
          attacks: 0,
          detection: 0,
          response: 0,
          encrypted: 0,
          threat: 'low',
          count: 0
        };
      }
      
      systemsMap[systemName].vuln += infra.frequency || 0;
      systemsMap[systemName].risk = Math.max(systemsMap[systemName].risk, 
        infra.threat_level === 'CRITICAL' ? 90 :
        infra.threat_level === 'HIGH' ? 70 :
        infra.threat_level === 'MEDIUM' ? 50 : 30);
      systemsMap[systemName].attacks += Math.floor((infra.frequency || 0) * (100 - infra.percentage) / 100);
      systemsMap[systemName].detection = infra.percentage || 0;
      systemsMap[systemName].response = Math.min(100, (infra.percentage || 0) * 1.5);
      systemsMap[systemName].encrypted = Math.min(100, (infra.percentage || 0) * 2);
      systemsMap[systemName].threat = infra.threat_level === 'CRITICAL' ? 'critical' :
                                      infra.threat_level === 'HIGH' ? 'high' :
                                      infra.threat_level === 'MEDIUM' ? 'medium' : 'low';
      systemsMap[systemName].count++;
    });

    // Average out values for systems with multiple entries
    Object.keys(systemsMap).forEach(key => {
      const system = systemsMap[key];
      if (system.count > 1) {
        system.detection = system.detection / system.count;
        system.response = system.response / system.count;
        system.encrypted = system.encrypted / system.count;
      }
    });

    return systemsMap;
  }, [infrastructureData]);

  // 3D Threat Map with real data
  useEffect(() => {
    if (!threatMapRef.current || !systems || Object.keys(systems).length === 0) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.002);

    const camera = new THREE.PerspectiveCamera(
      75,
      threatMapRef.current.clientWidth / threatMapRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(100, 100, 100);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(threatMapRef.current.clientWidth, threatMapRef.current.clientHeight);
    threatMapRef.current.appendChild(renderer.domElement);

    // Create threat nodes based on real system data
    const nodes: THREE.Mesh[] = [];
    
    Object.entries(systems).forEach(([name, data], i) => {
      const angle = (i / Object.keys(systems).length) * Math.PI * 2;
      const radius = 40 + (100 - data.risk);
      
      // Node with colors based on threat level
      const geometry = new THREE.SphereGeometry(Math.log(data.vuln + 1) * 2, 16, 16);
      const material = new THREE.MeshPhongMaterial({
        color: data.threat === 'critical' ? 0xb19cd9 : 
               data.threat === 'high' ? 0xa8c3ff : 
               0x87ceeb,
        emissive: data.threat === 'critical' ? 0xb19cd9 : 0x87ceeb,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.8
      });
      
      const node = new THREE.Mesh(geometry, material);
      node.position.set(
        Math.cos(angle) * radius,
        (data.detection - 50) * 0.5,
        Math.sin(angle) * radius
      );
      node.userData = { name, data };
      scene.add(node);
      nodes.push(node);

      // Attack vectors for systems with attacks
      if (data.attacks > 0) {
        const points = [];
        for (let j = 0; j < Math.min(5, Math.ceil(data.attacks / 5000)); j++) {
          points.push(new THREE.Vector3(
            node.position.x + (Math.random() - 0.5) * 20,
            node.position.y + Math.random() * 30,
            node.position.z + (Math.random() - 0.5) * 20
          ));
        }
        
        if (points.length > 1) {
          const curve = new THREE.CatmullRomCurve3(points);
          const geometry = new THREE.TubeGeometry(curve, 20, 0.5, 8, false);
          const material = new THREE.MeshBasicMaterial({
            color: 0xb19cd9,
            transparent: true,
            opacity: 0.3
          });
          
          const threat = new THREE.Mesh(geometry, material);
          scene.add(threat);
        }
      }
    });

    // Defense grid
    const gridGeometry = new THREE.PlaneGeometry(200, 200, 20, 20);
    const gridMaterial = new THREE.MeshBasicMaterial({
      color: 0x87ceeb,
      wireframe: true,
      transparent: true,
      opacity: 0.1
    });
    const grid = new THREE.Mesh(gridGeometry, gridMaterial);
    grid.rotation.x = -Math.PI / 2;
    scene.add(grid);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0x87ceeb, 1, 200);
    pointLight.position.set(50, 50, 50);
    scene.add(pointLight);

    // Animation
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      nodes.forEach((node, i) => {
        node.rotation.y += 0.01;
        if (node.userData.data.threat === 'critical') {
          node.scale.setScalar(1 + Math.sin(Date.now() * 0.003 + i) * 0.1);
        }
      });
      
      camera.position.x = Math.cos(Date.now() * 0.0005) * 150;
      camera.position.z = Math.sin(Date.now() * 0.0005) * 150;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      if (threatMapRef.current && renderer.domElement) {
        threatMapRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [systems]);

  // Network Graph with real data
  useEffect(() => {
    const canvas = networkRef.current;
    if (!canvas || !systems || Object.keys(systems).length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const time = Date.now() * 0.001;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Draw connections based on real system data
      Object.entries(systems).forEach(([name, data], i) => {
        const angle = (i / Object.keys(systems).length) * Math.PI * 2 + time * 0.1;
        const radius = 60 + data.detection * 0.5;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        // Connection lines
        ctx.strokeStyle = data.threat === 'critical' ? 'rgba(177, 156, 217, 0.3)' : 'rgba(135, 206, 235, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();

        // Nodes based on vulnerability count
        const nodeSize = Math.min(10, Math.sqrt(data.vuln) / 20);
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, nodeSize * 2);
        gradient.addColorStop(0, data.threat === 'critical' ? '#b19cd9' : '#87ceeb');
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, nodeSize, 0, Math.PI * 2);
        ctx.fill();

        // Pulse effect for critical systems
        if (data.threat === 'critical') {
          ctx.strokeStyle = 'rgba(177, 156, 217, 0.5)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, nodeSize + Math.sin(time * 3) * 5, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Label for selected system
        if (selectedSystem === name) {
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(name, x, y - nodeSize - 5);
          ctx.fillText(`${data.detection.toFixed(1)}%`, x, y + nodeSize + 12);
        }
      });

      // Central shield
      ctx.strokeStyle = 'rgba(177, 156, 217, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 20 + Math.sin(time * 2) * 5, 0, Math.PI * 2);
      ctx.stroke();

      requestAnimationFrame(animate);
    };

    animate();
  }, [selectedSystem, systems]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400"></div>
          <div className="mt-4 text-xl font-bold text-cyan-400">LOADING SYSTEM DATA</div>
        </div>
      </div>
    );
  }

  if (error || !infrastructureData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center glass-panel rounded-xl p-8">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <div className="text-xl font-bold text-red-400 mb-2">DATA LOAD ERROR</div>
          <div className="text-sm text-gray-400">{error || 'No data available'}</div>
        </div>
      </div>
    );
  }

  // Calculate metrics from real data
  const totalVulnerabilities = Object.values(systems).reduce((sum: number, s: any) => sum + s.vuln, 0);
  const totalAttacks = Object.values(systems).reduce((sum: number, s: any) => sum + s.attacks, 0);
  const avgDetection = Object.values(systems).reduce((sum: number, s: any) => sum + s.detection, 0) / Object.keys(systems).length;
  const avgResponse = Object.values(systems).reduce((sum: number, s: any) => sum + s.response, 0) / Object.keys(systems).length;
  const criticalSystems = Object.values(systems).filter((s: any) => s.threat === 'critical').length;

  return (
    <div className="h-screen w-screen bg-black text-white p-4 overflow-hidden">
      {/* Main Grid */}
      <div className="h-full grid grid-cols-12 gap-3">
        
        {/* Left Panel - Threat Matrix */}
        <div className="col-span-3 space-y-3">
          {/* Critical Alerts from Real Data */}
          <div className="bg-black border border-purple-300/30 rounded p-3 h-[120px]">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-purple-300 animate-pulse" />
              <span className="text-xs font-bold text-white">ACTIVE THREATS</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-white/70">Total Vulnerabilities:</span>
                <span className="text-purple-300 font-mono">{totalVulnerabilities.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Active Attacks:</span>
                <span className="text-purple-300 font-mono">{totalAttacks.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Detection Rate:</span>
                <span className="text-blue-300 font-mono">{avgDetection.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* System Status from Real Data */}
          <div className="bg-black border border-blue-300/30 rounded p-3 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-blue-300" />
              <span className="text-xs font-bold text-white">SYSTEMS</span>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {Object.entries(systems).map(([name, data]) => (
                <div 
                  key={name}
                  className={`p-2 rounded border cursor-pointer transition-all ${
                    selectedSystem === name 
                      ? 'border-blue-300 bg-blue-300/10' 
                      : 'border-white/20 hover:border-white/40'
                  }`}
                  onClick={() => setSelectedSystem(name)}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-white">{name}</span>
                    <span className={`text-xs px-1 rounded ${
                      data.threat === 'critical' ? 'bg-purple-300/20 text-purple-300' :
                      data.threat === 'high' ? 'bg-purple-300/15 text-purple-300' :
                      data.threat === 'medium' ? 'bg-blue-300/20 text-blue-300' :
                      'bg-blue-300/10 text-blue-300'
                    }`}>
                      {data.threat.toUpperCase()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div>
                      <span className="text-white/50">DET:</span>
                      <span className={`ml-1 font-mono ${data.detection < 20 ? 'text-purple-300' : 'text-blue-300'}`}>
                        {data.detection.toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-white/50">RSP:</span>
                      <span className="ml-1 font-mono text-purple-300">{data.response.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="mt-1 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-300 to-purple-300"
                      style={{ width: `${data.encrypted}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center - 3D Threat Map */}
        <div className="col-span-5">
          <div className="bg-black border border-purple-300/30 rounded h-full relative">
            <div className="absolute top-3 left-3 z-10">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-300" />
                <span className="text-xs font-bold text-white">THREAT TOPOLOGY</span>
              </div>
            </div>
            <div ref={threatMapRef} className="w-full h-full" />
            
            {/* HUD Overlay */}
            <div className="absolute bottom-3 left-3 text-xs font-mono space-y-1">
              <div className="text-blue-300/60">● DETECTION LAYER</div>
              <div className="text-purple-300/60">● RESPONSE TIME</div>
              <div className="text-white/40">● ACTIVE ATTACKS</div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="col-span-4 space-y-3">
          {/* Network Graph */}
          <div className="bg-black border border-blue-300/30 rounded h-[280px] relative">
            <div className="absolute top-3 left-3 z-10">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-blue-300" />
                <span className="text-xs font-bold text-white">DEFENSE NETWORK</span>
              </div>
            </div>
            <canvas ref={networkRef} className="w-full h-full" />
          </div>

          {/* Real-Time Metrics from Real Data */}
          <div className="bg-black border border-purple-300/30 rounded p-3 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-purple-300" />
              <span className="text-xs font-bold text-white">REAL-TIME METRICS</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {/* Vulnerability Score */}
              <div className="bg-white/5 rounded p-2">
                <div className="text-xs text-white/70 mb-1">VULNERABILITIES</div>
                <div className="text-2xl font-bold text-purple-300">
                  {totalVulnerabilities.toLocaleString()}
                </div>
                <div className="text-xs text-purple-300">
                  {criticalSystems} CRITICAL
                </div>
              </div>
              
              {/* Attack Surface */}
              <div className="bg-white/5 rounded p-2">
                <div className="text-xs text-white/70 mb-1">ATTACK SURFACE</div>
                <div className="text-2xl font-bold text-blue-300">
                  {totalAttacks.toLocaleString()}
                </div>
                <div className="text-xs text-blue-300">EXPANDING</div>
              </div>
              
              {/* Detection Rate */}
              <div className="bg-white/5 rounded p-2">
                <div className="text-xs text-white/70 mb-1">AVG DETECTION</div>
                <div className="text-2xl font-bold text-blue-300">
                  {avgDetection.toFixed(1)}%
                </div>
                <div className="text-xs text-blue-300">
                  {avgDetection < 50 ? 'CRITICAL' : 'SUBOPTIMAL'}
                </div>
              </div>
              
              {/* Response Time */}
              <div className="bg-white/5 rounded p-2">
                <div className="text-xs text-white/70 mb-1">RESPONSE CAP</div>
                <div className="text-2xl font-bold text-purple-300">
                  {avgResponse.toFixed(1)}%
                </div>
                <div className="text-xs text-purple-300">
                  {avgResponse < 50 ? 'DEGRADED' : 'ACTIVE'}
                </div>
              </div>
            </div>

            {/* Threat Level Indicator based on Real Data */}
            <div className="mt-3 bg-gradient-to-r from-purple-300/10 to-blue-300/10 rounded p-2 border border-purple-300/30">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-300" />
                  <span className="text-xs font-bold text-white">THREAT LEVEL</span>
                </div>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(i => (
                    <div 
                      key={i} 
                      className={`w-2 h-4 ${i <= Math.ceil(criticalSystems * 5 / Object.keys(systems).length) ? 'bg-purple-300' : 'bg-white/20'}`}
                    />
                  ))}
                </div>
              </div>
              <div className="text-xs text-white/70 mt-1">{criticalSystems} CRITICAL SYSTEMS DETECTED</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemClassification;