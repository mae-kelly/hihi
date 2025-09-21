import React, { useState, useEffect, useRef } from 'react';
import { Shield, AlertTriangle, Activity, Lock, Network, Database, Zap, Eye } from 'lucide-react';
import * as THREE from 'three';

const SystemClassification: React.FC = () => {
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const threatMapRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<HTMLCanvasElement>(null);
  
  const systems = {
    'Windows': { vuln: 67891, risk: 85.84, attacks: 9623, detection: 36.3, response: 78.5, encrypted: 100, threat: 'high' },
    'Linux': { vuln: 78234, risk: 69.29, attacks: 24001, detection: 2.7, response: 15.6, encrypted: 72.8, threat: 'critical' },
    'AIX': { vuln: 5234, risk: 100, attacks: 0, detection: 100, response: 100, encrypted: 100, threat: 'low' },
    'Network': { vuln: 13751, risk: 45.2, attacks: 7537, detection: 0.1, response: 0.1, encrypted: 45.0, threat: 'critical' },
    'Container': { vuln: 45678, risk: 52.3, attacks: 21871, detection: 15.2, response: 45.6, encrypted: 78.9, threat: 'medium' },
    'Cloud': { vuln: 50237, risk: 19.17, attacks: 40626, detection: 0.1, response: 0.1, encrypted: 78.3, threat: 'critical' }
  };

  // 3D Threat Map
  useEffect(() => {
    if (!threatMapRef.current) return;

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

    // Create threat nodes
    const nodes: THREE.Mesh[] = [];
    const threats: THREE.Line[] = [];
    
    Object.entries(systems).forEach(([name, data], i) => {
      const angle = (i / Object.keys(systems).length) * Math.PI * 2;
      const radius = 40 + (100 - data.risk);
      
      // Node with pastel blue/purple colors
      const geometry = new THREE.SphereGeometry(Math.log(data.vuln) * 2, 16, 16);
      const material = new THREE.MeshPhongMaterial({
        color: data.threat === 'critical' ? 0xb19cd9 : data.threat === 'high' ? 0xa8c3ff : 0x87ceeb,
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

      // Attack vectors in pastel purple
      if (data.attacks > 0) {
        const points = [];
        for (let j = 0; j < 5; j++) {
          points.push(new THREE.Vector3(
            node.position.x + (Math.random() - 0.5) * 20,
            node.position.y + Math.random() * 30,
            node.position.z + (Math.random() - 0.5) * 20
          ));
        }
        
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
    });

    // Defense grid in pastel blue
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
    const animate = () => {
      requestAnimationFrame(animate);
      
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
      if (threatMapRef.current && renderer.domElement) {
        threatMapRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Network Graph
  useEffect(() => {
    const canvas = networkRef.current;
    if (!canvas) return;

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

      // Draw connections
      Object.entries(systems).forEach(([name, data], i) => {
        const angle = (i / Object.keys(systems).length) * Math.PI * 2 + time * 0.1;
        const radius = 60 + data.detection * 0.5;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        // Connection lines in pastel colors
        ctx.strokeStyle = data.threat === 'critical' ? 'rgba(177, 156, 217, 0.3)' : 'rgba(135, 206, 235, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();

        // Nodes
        const nodeSize = Math.sqrt(data.vuln) / 20;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, nodeSize * 2);
        gradient.addColorStop(0, data.threat === 'critical' ? '#b19cd9' : '#87ceeb');
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, nodeSize, 0, Math.PI * 2);
        ctx.fill();

        // Pulse effect
        if (data.threat === 'critical') {
          ctx.strokeStyle = 'rgba(177, 156, 217, 0.5)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, nodeSize + Math.sin(time * 3) * 5, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Label
        if (selectedSystem === name) {
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(name, x, y - nodeSize - 5);
        }
      });

      // Central shield in pastel purple
      ctx.strokeStyle = 'rgba(177, 156, 217, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 20 + Math.sin(time * 2) * 5, 0, Math.PI * 2);
      ctx.stroke();

      requestAnimationFrame(animate);
    };

    animate();
  }, [selectedSystem]);

  return (
    <div className="h-screen w-screen bg-black text-white p-4 overflow-hidden">
      {/* Main Grid */}
      <div className="h-full grid grid-cols-12 gap-3">
        
        {/* Left Panel - Threat Matrix */}
        <div className="col-span-3 space-y-3">
          {/* Critical Alerts */}
          <div className="bg-black border border-purple-300/30 rounded p-3 h-[120px]">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-purple-300 animate-pulse" />
              <span className="text-xs font-bold text-white">ACTIVE THREATS</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-white/70">Linux Breach:</span>
                <span className="text-purple-300 font-mono">24,001</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Cloud Exposure:</span>
                <span className="text-purple-300 font-mono">40,626</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Detection Rate:</span>
                <span className="text-blue-300 font-mono">2.7%</span>
              </div>
            </div>
          </div>

          {/* System Status */}
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
                        {data.detection}%
                      </span>
                    </div>
                    <div>
                      <span className="text-white/50">RSP:</span>
                      <span className="ml-1 font-mono text-purple-300">{data.response}%</span>
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

          {/* Metrics Grid */}
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
                  {Object.values(systems).reduce((sum, s) => sum + s.vuln, 0).toLocaleString()}
                </div>
                <div className="text-xs text-purple-300">↑ 12.3%</div>
              </div>
              
              {/* Attack Surface */}
              <div className="bg-white/5 rounded p-2">
                <div className="text-xs text-white/70 mb-1">ATTACK SURFACE</div>
                <div className="text-2xl font-bold text-blue-300">
                  {Object.values(systems).reduce((sum, s) => sum + s.attacks, 0).toLocaleString()}
                </div>
                <div className="text-xs text-blue-300">EXPANDING</div>
              </div>
              
              {/* Detection Rate */}
              <div className="bg-white/5 rounded p-2">
                <div className="text-xs text-white/70 mb-1">AVG DETECTION</div>
                <div className="text-2xl font-bold text-blue-300">
                  {(Object.values(systems).reduce((sum, s) => sum + s.detection, 0) / Object.keys(systems).length).toFixed(1)}%
                </div>
                <div className="text-xs text-blue-300">SUBOPTIMAL</div>
              </div>
              
              {/* Response Time */}
              <div className="bg-white/5 rounded p-2">
                <div className="text-xs text-white/70 mb-1">RESPONSE CAP</div>
                <div className="text-2xl font-bold text-purple-300">
                  {(Object.values(systems).reduce((sum, s) => sum + s.response, 0) / Object.keys(systems).length).toFixed(1)}%
                </div>
                <div className="text-xs text-purple-300">DEGRADED</div>
              </div>
            </div>

            {/* Threat Level Indicator */}
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
                      className={`w-2 h-4 ${i <= 4 ? 'bg-purple-300' : 'bg-white/20'}`}
                    />
                  ))}
                </div>
              </div>
              <div className="text-xs text-white/70 mt-1">3 CRITICAL SYSTEMS COMPROMISED</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemClassification;