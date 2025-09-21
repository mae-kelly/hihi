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
        radius: 30,
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
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(node.role, node.x, node.y - currentRadius - 10);
        
        // Percentage
        ctx.font = '10px monospace';
        ctx.fillStyle = node.data.color;
        ctx.fillText(`${node.data.coverage}%`, node.x, node.y + currentRadius + 20);
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
      case 'complete': return <CheckCircle className="w-5 h-5 text-blue-400" />;
      case 'partial': return <AlertCircle className="w-5 h-5 text-purple-400" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-purple-400" />;
      case 'failed': return <XCircle className="w-5 h-5 text-pink-400" />;
      default: return <Shield className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="p-8 min-h-screen bg-black">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-black mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          LOGGING STANDARDS & COMPLIANCE
        </h1>
        <p className="text-gray-400 uppercase tracking-widest text-xs">
          Fiserv Cybersecurity Logging Standard • Process Compliance
        </p>
      </div>

      {/* Critical Alert */}
      <div className="mb-6 bg-black border border-pink-500/30 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-pink-400 animate-pulse" />
          <div>
            <span className="text-pink-400 font-bold">CRITICAL LOGGING FAILURE:</span>
            <span className="text-white ml-2">Cloud at 19.17% - Network at 45.2% - Multiple standards violations</span>
          </div>
        </div>
      </div>

      {/* Overall Compliance Score */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900/30 rounded-xl p-6 border border-gray-800">
          <FileText className="w-6 h-6 text-blue-400 mb-2" />
          <div className="text-3xl font-bold text-purple-400">{complianceScore.toFixed(1)}%</div>
          <div className="text-xs text-gray-400 uppercase">Overall Compliance</div>
        </div>
        <div className="bg-gray-900/30 rounded-xl p-6 border border-gray-800">
          <Network className="w-6 h-6 text-pink-400 mb-2" />
          <div className="text-3xl font-bold text-pink-400">2/3</div>
          <div className="text-xs text-gray-400 uppercase">Failed Roles</div>
        </div>
        <div className="bg-gray-900/30 rounded-xl p-6 border border-gray-800">
          <Activity className="w-6 h-6 text-purple-400 mb-2" />
          <div className="text-3xl font-bold text-purple-400">2/5</div>
          <div className="text-xs text-gray-400 uppercase">Process Failed</div>
        </div>
        <div className="bg-gray-900/30 rounded-xl p-6 border border-gray-800">
          <Shield className="w-6 h-6 text-blue-400 mb-2" />
          <div className="text-3xl font-bold text-blue-400">HIGH</div>
          <div className="text-xs text-gray-400 uppercase">Risk Level</div>
        </div>
      </div>

      {/* Main Visualizations */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        {/* 3D Pipeline */}
        <div className="col-span-7">
          <div className="bg-black border border-blue-500/30 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-blue-500/20">
              <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                Logging Pipeline Process
              </h3>
            </div>
            <div ref={pipelineRef} className="w-full h-[350px]" />
          </div>
        </div>

        {/* Data Flow Network */}
        <div className="col-span-5">
          <div className="bg-black border border-purple-500/30 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-purple-500/20">
              <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                <Code className="w-4 h-4" />
                Data Flow Network
              </h3>
            </div>
            <canvas ref={flowRef} className="w-full h-[350px]" />
          </div>
        </div>
      </div>

      {/* Process Pipeline Status */}
      <div className="mb-8 bg-gray-900/30 rounded-2xl p-6 border border-gray-800">
        <h3 className="text-lg font-bold text-white mb-4">LOGGING PROCESS PIPELINE</h3>
        <div className="flex items-center justify-between mb-6">
          {Object.entries(loggingProcess).map(([step, data], index) => (
            <React.Fragment key={step}>
              <div className="flex-1">
                <div className={`text-center ${data.status === 'failed' ? 'animate-pulse' : ''}`}>
                  <div className={`w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center border-2 ${
                    data.status === 'complete' ? 'bg-blue-500/20 border-blue-500' :
                    data.status === 'partial' ? 'bg-purple-500/20 border-purple-500' :
                    'bg-pink-500/20 border-pink-500'
                  }`}>
                    {getStatusIcon(data.status)}
                  </div>
                  <h4 className="font-semibold text-white text-sm">{step}</h4>
                  <div className={`text-xs mt-1 ${
                    data.status === 'complete' ? 'text-blue-400' :
                    data.status === 'partial' ? 'text-purple-400' :
                    'text-pink-400'
                  }`}>
                    {data.completion}%
                  </div>
                </div>
              </div>
              {index < Object.keys(loggingProcess).length - 1 && (
                <div className={`flex-shrink-0 w-12 h-0.5 ${
                  data.status === 'complete' ? 'bg-blue-400' :
                  data.status === 'partial' ? 'bg-purple-400' :
                  'bg-pink-400'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Log Role Mapping */}
      <div className="grid grid-cols-1 gap-6">
        {Object.entries(loggingRoles).map(([roleName, role]) => {
          const Icon = role.icon;
          return (
            <div 
              key={roleName}
              className={`bg-gray-900/30 rounded-2xl p-6 border transition-all ${
                role.status === 'critical' ? 'border-pink-500/30' :
                role.status === 'warning' ? 'border-purple-500/30' :
                'border-blue-500/30'
              }`}
            >
              {/* Role Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Icon className="w-6 h-6" style={{ color: role.color }} />
                  <div>
                    <h3 className="text-xl font-bold text-white">{roleName}</h3>
                    <p className="text-sm text-gray-400">{role.logTypes.length} log types configured</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold" style={{ color: role.color }}>
                    {role.coverage}%
                  </div>
                  <div className="text-xs text-gray-400">Coverage</div>
                </div>
              </div>

              {/* Coverage Bar */}
              <div className="mb-4">
                <div className="h-4 bg-black/50 rounded-full overflow-hidden border border-gray-800">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${role.coverage}%`,
                      background: `linear-gradient(90deg, ${role.color}, ${role.color}dd)`
                    }}
                  />
                </div>
              </div>

              {/* Log Types */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-400 mb-2">Log Types</h4>
                <div className="flex flex-wrap gap-2">
                  {role.logTypes.map(type => (
                    <span key={type} className="px-2 py-1 rounded bg-black/50 border border-gray-700 text-xs text-gray-300">
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              {/* Visibility Factors */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-400 mb-3">Visibility Factors</h4>
                <div className="grid grid-cols-2 gap-2">
                  {role.visibilityFactors.map(factor => (
                    <div key={factor.factor} className="flex items-center justify-between p-2 bg-black/50 rounded border border-gray-800">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(factor.status)}
                        <span className="text-xs text-gray-300">{factor.factor}</span>
                      </div>
                      <span className={`text-xs font-mono font-bold ${
                        factor.percentage < 30 ? 'text-pink-400' :
                        factor.percentage < 60 ? 'text-purple-400' :
                        'text-blue-400'
                      }`}>
                        {factor.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gaps and Recommendations */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-pink-500/10 border border-pink-500/30 rounded">
                  <h4 className="text-sm font-semibold text-pink-400 mb-1">Gap</h4>
                  <p className="text-xs text-gray-300">{role.gaps}</p>
                </div>
                <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded">
                  <h4 className="text-sm font-semibold text-purple-400 mb-1">Action Required</h4>
                  <p className="text-xs text-gray-300">{role.recommendation}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LoggingStandards;