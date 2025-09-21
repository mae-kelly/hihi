import React, { useState, useEffect, useRef } from 'react';
import { FileText, CheckCircle, XCircle, AlertCircle, Shield, Database, Network, Activity, Terminal, Lock, Layers, Server, Wifi, Cloud, AlertTriangle, Cpu, Zap, Binary, Code, GitBranch } from 'lucide-react';
import * as THREE from 'three';

const LoggingStandards: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [complianceScore, setComplianceScore] = useState(0);
  const pipelineRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLCanvasElement>(null);
  
  // ACTUAL DATA FROM AO1 REQUIREMENTS
  const loggingRoles = {
    'Network': {
      role: 'Network',
      status: 'partial',
      coverage: 45.2,
      color: '#00ffff',
      icon: Network,
      logTypes: ['Firewall Traffic', 'IDS/IPS', 'NDR', 'Proxy', 'DNS', 'WAF'],
      commonDataFields: [
        'IP (source, target)',
        'Protocol',
        'Detection Signature',
        'Port',
        'DNS record/FQDN',
        'HTTP Headers'
      ],
      visibilityFactors: [
        { factor: 'URL/FQDN Coverage', status: 'partial', percentage: 67.8 },
        { factor: 'CMDB Asset Visibility', status: 'complete', percentage: 100 },
        { factor: 'Network Zones/spans', status: 'failed', percentage: 32.1 },
        { factor: 'IPAM Public IP Coverage', status: 'partial', percentage: 72.3 },
        { factor: 'Geolocation', status: 'partial', percentage: 58.9 },
        { factor: 'VPC', status: 'failed', percentage: 19.2 },
        { factor: '%log ingest volume', status: 'warning', percentage: 45.2 }
      ],
      gaps: 'Network appliances showing only 45.2% coverage - critical gap',
      recommendation: 'Enable SNMP and NetFlow on all network devices'
    },
    'Endpoint': {
      role: 'Endpoint',
      status: 'warning',
      coverage: 69.29,
      color: '#c084fc',
      icon: Server,
      logTypes: ['OS logs (WinEVT, Linux syslog)', 'EDR', 'DLP', 'FIM'],
      commonDataFields: [
        'system name',
        'IP',
        'filename'
      ],
      visibilityFactors: [
        { factor: 'CMDB Asset Visibility', status: 'complete', percentage: 100 },
        { factor: 'Crowdstrike Agent Coverage', status: 'partial', percentage: 87.2 },
        { factor: '%log ingest volume', status: 'partial', percentage: 69.29 }
      ],
      gaps: 'Linux servers at 69.29% coverage - 30.71% missing',
      recommendation: 'Deploy syslog forwarding to all Linux systems'
    },
    'Cloud': {
      role: 'Cloud',
      status: 'critical',
      coverage: 19.17,
      color: '#ff00ff',
      icon: Cloud,
      logTypes: [
        'Cloud Event',
        'Cloud Load Balancer',
        'Cloud Config',
        'Theom',
        'WIZ',
        'Cloud Security'
      ],
      commonDataFields: [
        'VPC',
        'Instance ID',
        'Region',
        'Account ID',
        'Resource Tags'
      ],
      visibilityFactors: [
        { factor: 'VPC', status: 'failed', percentage: 19.17 },
        { factor: 'IPAM Public IP Coverage', status: 'failed', percentage: 23.4 },
        { factor: 'URL/FQDN coverage', status: 'failed', percentage: 28.7 },
        { factor: 'Crowdstrike Agent Coverage', status: 'partial', percentage: 62.3 }
      ],
      gaps: 'Cloud infrastructure at critical 19.17% coverage',
      recommendation: 'IMMEDIATE: Enable CloudTrail, VPC Flow Logs, and cloud-native logging'
    }
  };

  const loggingProcess = {
    'Configure': {
      step: 1,
      status: 'complete',
      completion: 100,
      description: 'Assets mapped to log roles',
      color: '#00ffff'
    },
    'Collect': {
      step: 2,
      status: 'partial',
      completion: 75,
      description: 'Log collection mechanisms',
      color: '#00ffff'
    },
    'Transport': {
      step: 3,
      status: 'partial',
      completion: 68,
      description: 'Transport layer to SIEM',
      color: '#c084fc'
    },
    'Ingest': {
      step: 4,
      status: 'warning',
      completion: 52,
      description: 'Data ingestion pipeline',
      color: '#ff00ff'
    },
    'Normalize': {
      step: 5,
      status: 'failed',
      completion: 38,
      description: 'Data normalization',
      color: '#ff00ff'
    }
  };

  // 3D Pipeline Visualization
  useEffect(() => {
    if (!pipelineRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.001);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      pipelineRef.current.clientWidth / pipelineRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(100, 100, 200);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(pipelineRef.current.clientWidth, pipelineRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    pipelineRef.current.appendChild(renderer.domElement);

    // Create pipeline segments
    const pipelineGroup = new THREE.Group();
    const segments: THREE.Mesh[] = [];
    
    Object.entries(loggingProcess).forEach(([step, data], index) => {
      const x = (index - 2) * 40;
      
      // Cylinder segment
      const geometry = new THREE.CylinderGeometry(15, 15, 30, 32, 1, false);
      const material = new THREE.MeshPhongMaterial({
        color: data.color,
        emissive: data.color,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: data.completion / 100
      });
      
      const segment = new THREE.Mesh(geometry, material);
      segment.position.set(x, 0, 0);
      segment.rotation.z = Math.PI / 2;
      pipelineGroup.add(segment);
      segments.push(segment);
      
      // Connection pipes
      if (index < Object.keys(loggingProcess).length - 1) {
        const pipeGeometry = new THREE.CylinderGeometry(5, 5, 40, 16);
        const pipeMaterial = new THREE.MeshPhongMaterial({
          color: 0x666666,
          transparent: true,
          opacity: 0.5
        });
        const pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
        pipe.position.set(x + 20, 0, 0);
        pipe.rotation.z = Math.PI / 2;
        pipelineGroup.add(pipe);
      }
      
      // Status indicator
      const indicatorGeometry = new THREE.SphereGeometry(5, 16, 16);
      const indicatorColor = data.status === 'complete' ? 0x00ffff :
                             data.status === 'partial' ? 0xc084fc :
                             data.status === 'warning' ? 0xff00ff :
                             0xff00ff;
      const indicatorMaterial = new THREE.MeshPhongMaterial({
        color: indicatorColor,
        emissive: indicatorColor,
        emissiveIntensity: 0.5
      });
      const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
      indicator.position.set(x, 20, 0);
      pipelineGroup.add(indicator);
    });
    
    scene.add(pipelineGroup);

    // Data flow particles
    const particleCount = 200;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount;
      positions[i * 3] = (t - 0.5) * 200;
      positions[i * 3 + 1] = Math.sin(t * Math.PI * 4) * 20;
      positions[i * 3 + 2] = Math.cos(t * Math.PI * 4) * 20;
      
      colors[i * 3] = 0;
      colors[i * 3 + 1] = 1;
      colors[i * 3 + 2] = 1;
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

    const pointLight1 = new THREE.PointLight(0x00ffff, 1, 200);
    pointLight1.position.set(100, 50, 100);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff00ff, 1, 200);
    pointLight2.position.set(-100, 50, -100);
    scene.add(pointLight2);

    // Animation loop
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      // Animate pipeline
      pipelineGroup.rotation.y += 0.003;
      
      // Animate segments
      segments.forEach((segment, index) => {
        segment.rotation.x += 0.01;
        segment.scale.setScalar(1 + Math.sin(Date.now() * 0.001 + index) * 0.05);
      });
      
      // Animate particles flow
      const positions = particles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] += 2;
        if (positions[i * 3] > 100) {
          positions[i * 3] = -100;
        }
      }
      particles.geometry.attributes.position.needsUpdate = true;
      
      // Camera movement
      const time = Date.now() * 0.0005;
      camera.position.x = Math.sin(time) * 200;
      camera.position.z = Math.cos(time) * 200;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      if (pipelineRef.current && renderer.domElement) {
        pipelineRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Data Flow Canvas
  useEffect(() => {
    const canvas = flowRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const nodes: any[] = [];
    const connections: any[] = [];

    // Create nodes for each role
    Object.entries(loggingRoles).forEach(([role, data], index) => {
      nodes.push({
        x: (index + 1) * (canvas.width / 4),
        y: canvas.height / 2,
        role,
        data,
        radius: 20,
        pulsePhase: Math.random() * Math.PI * 2
      });
    });

    // Create connections
    for (let i = 0; i < nodes.length - 1; i++) {
      connections.push({
        from: nodes[i],
        to: nodes[i + 1],
        particles: []
      });
    }

    const animate = () => {
      // Clear with fade
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw connections
      connections.forEach(conn => {
        const gradient = ctx.createLinearGradient(
          conn.from.x, conn.from.y,
          conn.to.x, conn.to.y
        );
        gradient.addColorStop(0, conn.from.data.color + '40');
        gradient.addColorStop(1, conn.to.data.color + '40');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(conn.from.x, conn.from.y);
        ctx.lineTo(conn.to.x, conn.to.y);
        ctx.stroke();
        
        // Animate particles
        if (Math.random() > 0.9) {
          conn.particles.push({ t: 0 });
        }
        
        conn.particles = conn.particles.filter((p: any) => {
          p.t += 0.02;
          if (p.t > 1) return false;
          
          const x = conn.from.x + (conn.to.x - conn.from.x) * p.t;
          const y = conn.from.y + (conn.to.y - conn.from.y) * p.t;
          
          ctx.fillStyle = '#00ffff';
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
          
          return true;
        });
      });

      // Draw nodes
      nodes.forEach(node => {
        // Pulsing effect
        node.pulsePhase += 0.05;
        const pulseScale = 1 + Math.sin(node.pulsePhase) * 0.1;
        const currentRadius = node.radius * pulseScale;
        
        // Node glow
        const glow = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, currentRadius * 2
        );
        glow.addColorStop(0, node.data.color + '80');
        glow.addColorStop(0.5, node.data.color + '40');
        glow.addColorStop(1, node.data.color + '00');
        ctx.fillStyle = glow;
        ctx.fillRect(
          node.x - currentRadius * 2,
          node.y - currentRadius * 2,
          currentRadius * 4,
          currentRadius * 4
        );
        
        // Node core
        ctx.fillStyle = node.data.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Coverage indicator
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius - 5, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.strokeStyle = node.data.coverage < 50 ? '#ff00ff' : 
                         node.data.coverage < 80 ? '#c084fc' : 
                         '#00ffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(
          node.x, node.y, currentRadius - 5,
          -Math.PI / 2,
          -Math.PI / 2 + (node.data.coverage / 100) * Math.PI * 2
        );
        ctx.stroke();
        
        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(node.role, node.x, node.y - currentRadius - 10);
        
        // Percentage
        ctx.font = '9px monospace';
        ctx.fillStyle = node.data.color;
        ctx.fillText(`${node.data.coverage}%`, node.x, node.y + currentRadius + 15);
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  // Calculate overall compliance
  useEffect(() => {
    const overallScore = Object.values(loggingRoles).reduce((sum, role) => sum + role.coverage, 0) / Object.keys(loggingRoles).length;
    setComplianceScore(overallScore);
  }, []);

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'complete': return <CheckCircle className="w-4 h-4 text-blue-400" />;
      case 'partial': return <AlertCircle className="w-4 h-4 text-purple-400" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-purple-400" />;
      case 'failed': return <XCircle className="w-4 h-4 text-pink-400" />;
      default: return <Shield className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="p-4 h-screen bg-black overflow-hidden flex flex-col">
      {/* Critical Alert and Stats Row */}
      <div className="flex gap-3 mb-3">
        <div className="flex-1 bg-black border border-pink-500/30 rounded-lg p-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-pink-400 animate-pulse" />
            <span className="text-pink-400 font-bold text-xs">CRITICAL:</span>
            <span className="text-white text-xs">Cloud at 19.17% - Network at 45.2%</span>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="bg-gray-900/30 rounded-lg px-4 py-2 border border-gray-800">
            <div className="text-lg font-bold text-purple-400">{complianceScore.toFixed(1)}%</div>
            <div className="text-[10px] text-gray-400 uppercase">Compliance</div>
          </div>
          <div className="bg-gray-900/30 rounded-lg px-4 py-2 border border-gray-800">
            <div className="text-lg font-bold text-pink-400">2/3</div>
            <div className="text-[10px] text-gray-400 uppercase">Failed</div>
          </div>
          <div className="bg-gray-900/30 rounded-lg px-4 py-2 border border-gray-800">
            <div className="text-lg font-bold text-blue-400">HIGH</div>
            <div className="text-[10px] text-gray-400 uppercase">Risk</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-12 gap-3">
        {/* Left Column - Visualizations */}
        <div className="col-span-7 flex flex-col gap-3">
          {/* 3D Pipeline */}
          <div className="flex-1 bg-black border border-blue-500/30 rounded-xl overflow-hidden">
            <div className="p-2 border-b border-blue-500/20">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                Logging Pipeline Process
              </h3>
            </div>
            <div ref={pipelineRef} className="w-full h-[200px]" />
          </div>

          {/* Data Flow Network */}
          <div className="flex-1 bg-black border border-purple-500/30 rounded-xl overflow-hidden">
            <div className="p-2 border-b border-purple-500/20">
              <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                Data Flow Network
              </h3>
            </div>
            <canvas ref={flowRef} className="w-full h-[150px]" />
          </div>

          {/* Process Pipeline Status */}
          <div className="bg-gray-900/30 rounded-xl p-3 border border-gray-800">
            <div className="flex items-center justify-between">
              {Object.entries(loggingProcess).map(([step, data], index) => (
                <React.Fragment key={step}>
                  <div className="flex-1">
                    <div className={`text-center ${data.status === 'failed' ? 'animate-pulse' : ''}`}>
                      <div className={`w-10 h-10 mx-auto mb-1 rounded-full flex items-center justify-center border ${
                        data.status === 'complete' ? 'bg-blue-500/20 border-blue-500' :
                        data.status === 'partial' ? 'bg-purple-500/20 border-purple-500' :
                        'bg-pink-500/20 border-pink-500'
                      }`}>
                        {getStatusIcon(data.status)}
                      </div>
                      <h4 className="font-semibold text-white text-[10px]">{step}</h4>
                      <div className={`text-[9px] ${
                        data.status === 'complete' ? 'text-blue-400' :
                        data.status === 'partial' ? 'text-purple-400' :
                        'text-pink-400'
                      }`}>
                        {data.completion}%
                      </div>
                    </div>
                  </div>
                  {index < Object.keys(loggingProcess).length - 1 && (
                    <div className={`flex-shrink-0 w-6 h-0.5 ${
                      data.status === 'complete' ? 'bg-blue-400' :
                      data.status === 'partial' ? 'bg-purple-400' :
                      'bg-pink-400'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Role Details */}
        <div className="col-span-5 overflow-y-auto pr-2 space-y-3">
          {Object.entries(loggingRoles).map(([roleName, role]) => {
            const Icon = role.icon;
            return (
              <div 
                key={roleName}
                className={`bg-gray-900/30 rounded-xl p-3 border ${
                  role.status === 'critical' ? 'border-pink-500/30' :
                  role.status === 'warning' ? 'border-purple-500/30' :
                  'border-blue-500/30'
                }`}
              >
                {/* Role Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" style={{ color: role.color }} />
                    <h3 className="text-sm font-bold text-white">{roleName}</h3>
                  </div>
                  <div className="text-lg font-bold" style={{ color: role.color }}>
                    {role.coverage}%
                  </div>
                </div>

                {/* Coverage Bar */}
                <div className="mb-2">
                  <div className="h-2 bg-black/50 rounded-full overflow-hidden border border-gray-800">
                    <div 
                      className="h-full rounded-full"
                      style={{
                        width: `${role.coverage}%`,
                        background: `linear-gradient(90deg, ${role.color}, ${role.color}dd)`
                      }}
                    />
                  </div>
                </div>

                {/* Log Types */}
                <div className="mb-2">
                  <div className="flex flex-wrap gap-1">
                    {role.logTypes.slice(0, 3).map(type => (
                      <span key={type} className="px-1.5 py-0.5 rounded bg-black/50 border border-gray-700 text-[9px] text-gray-300">
                        {type}
                      </span>
                    ))}
                    {role.logTypes.length > 3 && (
                      <span className="px-1.5 py-0.5 rounded bg-black/50 border border-gray-700 text-[9px] text-gray-400">
                        +{role.logTypes.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Visibility Factors - Compact */}
                <div className="grid grid-cols-2 gap-1 mb-2">
                  {role.visibilityFactors.slice(0, 4).map(factor => (
                    <div key={factor.factor} className="flex items-center justify-between p-1 bg-black/50 rounded border border-gray-800">
                      <span className="text-[9px] text-gray-300 truncate">{factor.factor.split(' ')[0]}</span>
                      <span className={`text-[9px] font-mono font-bold ${
                        factor.percentage < 30 ? 'text-pink-400' :
                        factor.percentage < 60 ? 'text-purple-400' :
                        'text-blue-400'
                      }`}>
                        {factor.percentage}%
                      </span>
                    </div>
                  ))}
                </div>

                {/* Gap and Recommendation - Compact */}
                <div className="grid grid-cols-2 gap-1">
                  <div className="p-1.5 bg-pink-500/10 border border-pink-500/30 rounded">
                    <h4 className="text-[9px] font-semibold text-pink-400">Gap</h4>
                    <p className="text-[8px] text-gray-300 line-clamp-2">{role.gaps}</p>
                  </div>
                  <div className="p-1.5 bg-purple-500/10 border border-purple-500/30 rounded">
                    <h4 className="text-[9px] font-semibold text-purple-400">Action</h4>
                    <p className="text-[8px] text-gray-300 line-clamp-2">{role.recommendation}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LoggingStandards;