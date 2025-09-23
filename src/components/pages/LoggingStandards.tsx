import React, { useState, useEffect, useRef } from 'react';
import { FileText, CheckCircle, XCircle, AlertCircle, Shield, Database, Network, Activity, Terminal, Lock, Layers, Server, Wifi, Cloud, AlertTriangle, Eye, Target, Zap } from 'lucide-react';
import * as THREE from 'three';

const LoggingStandards: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [complianceScore, setComplianceScore] = useState(0);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const standardsRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLCanvasElement>(null);
  const matrixRef = useRef<HTMLCanvasElement>(null);
  const complianceRef = useRef<HTMLCanvasElement>(null);

  // ACTUAL DATA FROM AO1 REQUIREMENTS
  const loggingRoles = {
    'Network': {
      role: 'Network',
      status: 'partial',
      coverage: 45.2,
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
      logTypes: ['OS logs (WinEVT, Linux syslog)', 'EDR', 'DLP', 'FIM'],
      commonDataFields: ['system name', 'IP', 'filename'],
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
      logTypes: ['Cloud Event', 'Cloud Load Balancer', 'Cloud Config', 'Theom', 'WIZ', 'Cloud Security'],
      commonDataFields: ['VPC', 'Instance ID', 'Region', 'Account ID', 'Resource Tags'],
      visibilityFactors: [
        { factor: 'VPC', status: 'failed', percentage: 19.17 },
        { factor: 'IPAM Public IP Coverage', status: 'failed', percentage: 23.4 },
        { factor: 'URL/FQDN coverage', status: 'failed', percentage: 28.7 },
        { factor: 'Crowdstrike Agent Coverage', status: 'partial', percentage: 62.3 }
      ],
      gaps: 'Cloud infrastructure at critical 19.17% coverage',
      recommendation: 'IMMEDIATE: Enable CloudTrail, VPC Flow Logs, and cloud-native logging'
    },
    'Application': {
      role: 'Application',
      status: 'warning',
      coverage: 42.8,
      logTypes: ['Web Logs (HTTP Access)', 'API Gateway'],
      commonDataFields: ['URL', 'Method', 'Status Code', 'Response Time', 'User Agent'],
      visibilityFactors: [
        { factor: 'URL/FQDN coverage', status: 'partial', percentage: 67.2 },
        { factor: 'Control Coverage', status: 'failed', percentage: 42.8 }
      ],
      gaps: 'API Gateway logging incomplete',
      recommendation: 'Enable comprehensive API logging and monitoring'
    },
    'Identity & Authentication': {
      role: 'Identity and Authentication',
      status: 'active',
      coverage: 82.3,
      logTypes: ['Authentication attempts', 'Privilege escalation', 'Identity create/modify/destroy'],
      commonDataFields: ['Username', 'Domain', 'Authentication Type', 'Source IP', 'Result'],
      visibilityFactors: [
        { factor: 'Domain', status: 'complete', percentage: 95.2 },
        { factor: 'Internal', status: 'partial', percentage: 78.9 },
        { factor: 'External', status: 'partial', percentage: 72.8 },
        { factor: 'Controls', status: 'partial', percentage: 82.3 }
      ],
      gaps: 'External authentication not fully covered',
      recommendation: 'Integrate external IdP logging with SIEM'
    }
  };

  const loggingProcess = {
    'Configure': {
      step: 1,
      status: 'complete',
      completion: 100,
      description: 'Assets determined if they fall within scope',
      issues: [],
      action: 'Completed - all assets mapped'
    },
    'Collect': {
      step: 2,
      status: 'partial',
      completion: 75,
      description: 'Mechanism to collect logs from local systems',
      issues: ['Linux syslog collection incomplete', 'Cloud collectors not deployed'],
      action: 'Deploy missing collectors'
    },
    'Transport': {
      step: 3,
      status: 'partial',
      completion: 68,
      description: 'Transport layer ensures log forwarding to SIEM',
      issues: ['Bandwidth constraints', 'TLS not enabled'],
      action: 'Upgrade transport infrastructure'
    },
    'Ingest': {
      step: 4,
      status: 'warning',
      completion: 52,
      description: 'Data ingested into SIEM',
      issues: ['High ingestion latency', 'Chronicle failing'],
      action: 'Optimize ingestion pipeline'
    },
    'Normalize': {
      step: 5,
      status: 'failed',
      completion: 38,
      description: 'Data normalization requirement',
      issues: ['Custom formats not parsed', 'Field mapping incomplete'],
      action: 'Implement parsing rules'
    }
  };

  // 3D Standards Visualization
  useEffect(() => {
    if (!standardsRef.current) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.001);
    
    const camera = new THREE.PerspectiveCamera(
      60,
      standardsRef.current.clientWidth / standardsRef.current.clientHeight,
      0.1,
      1000
    );
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    
    renderer.setSize(standardsRef.current.clientWidth, standardsRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    standardsRef.current.appendChild(renderer.domElement);

    // Create central compliance core
    const coreGeometry = new THREE.IcosahedronGeometry(15, 2);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: complianceScore < 50 ? 0xff00ff : complianceScore < 80 ? 0xc084fc : 0x00d4ff,
      emissive: complianceScore < 50 ? 0xff00ff : 0x00d4ff,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.9
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);

    // Create role nodes around core
    const roleNodes: THREE.Group[] = [];
    Object.entries(loggingRoles).forEach(([roleName, role], index) => {
      const angle = (index / Object.keys(loggingRoles).length) * Math.PI * 2;
      const radius = 50;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      const nodeGroup = new THREE.Group();
      
      // Node sphere
      const nodeSize = 5 + Math.log(role.coverage / 10 + 1) * 3;
      const nodeGeometry = new THREE.SphereGeometry(nodeSize, 16, 16);
      const nodeMaterial = new THREE.MeshPhongMaterial({
        color: role.status === 'critical' ? 0xff00ff :
               role.status === 'warning' ? 0xffaa00 :
               role.status === 'partial' ? 0xc084fc : 0x00d4ff,
        emissive: role.status === 'critical' ? 0xff00ff : 0x00d4ff,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.8
      });
      
      const nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
      nodeMesh.position.set(x, 0, z);
      nodeGroup.add(nodeMesh);
      
      // Coverage indicator
      const coverageRadius = nodeSize * (role.coverage / 100);
      const coverageGeometry = new THREE.SphereGeometry(coverageRadius, 12, 12);
      const coverageMaterial = new THREE.MeshPhongMaterial({
        color: 0x00d4ff,
        emissive: 0x00d4ff,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.9
      });
      const coverageSphere = new THREE.Mesh(coverageGeometry, coverageMaterial);
      coverageSphere.position.copy(nodeMesh.position);
      nodeGroup.add(coverageSphere);
      
      // Connection to core
      const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(x, 0, z)
      ];
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: role.status === 'critical' ? 0xff00ff : 0x00d4ff,
        transparent: true,
        opacity: 0.3
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      nodeGroup.add(line);
      
      roleNodes.push(nodeGroup);
      scene.add(nodeGroup);
    });

    // Add particles for data flow
    const particleCount = 500;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 200;
      positions[i + 1] = (Math.random() - 0.5) * 150;
      positions[i + 2] = (Math.random() - 0.5) * 200;
      
      const isCompliant = Math.random() < (complianceScore / 100);
      colors[i] = isCompliant ? 0 : 1;
      colors[i + 1] = isCompliant ? 0.83 : 0;
      colors[i + 2] = 1;
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
    
    const pointLight1 = new THREE.PointLight(0x00d4ff, 1, 300);
    pointLight1.position.set(150, 100, 150);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0xff00ff, 1, 300);
    pointLight2.position.set(-150, -100, -150);
    scene.add(pointLight2);

    camera.position.set(0, 80, 150);
    camera.lookAt(0, 0, 0);

    // Animation
    const animate = () => {
      core.rotation.y += 0.002;
      core.rotation.x += 0.001;
      
      roleNodes.forEach((node, index) => {
        node.rotation.y += 0.001 * (index + 1);
      });
      
      particles.rotation.y += 0.0005;
      
      const time = Date.now() * 0.0003;
      camera.position.x = Math.sin(time) * 200;
      camera.position.z = Math.cos(time) * 200;
      camera.position.y = 80 + Math.sin(time * 2) * 20;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    
    animate();

    return () => {
      if (standardsRef.current && renderer.domElement) {
        standardsRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [complianceScore]);

  // Flow visualization
  useEffect(() => {
    const canvas = flowRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw process flow
      Object.entries(loggingProcess).forEach(([ step, data], index) => {
        const x = (index + 1) * (canvas.width / 6);
        const y = canvas.height / 2;
        const radius = 20 * (data.completion / 100);
        
        // Draw circle
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = data.status === 'failed' ? 'rgba(255, 0, 255, 0.5)' :
                       data.status === 'warning' ? 'rgba(255, 170, 0, 0.5)' :
                       data.status === 'partial' ? 'rgba(192, 132, 252, 0.5)' :
                       'rgba(0, 212, 255, 0.5)';
        ctx.fill();
        
        // Draw connection line
        if (index < Object.keys(loggingProcess).length - 1) {
          const nextX = (index + 2) * (canvas.width / 6);
          ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + radius, y);
          ctx.lineTo(nextX - 20, y);
          ctx.stroke();
        }
        
        // Draw label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(step, x, y - 30);
        ctx.fillText(`${data.completion}%`, x, y + 35);
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  // Matrix visualization
  useEffect(() => {
    const canvas = matrixRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const roles = Object.values(loggingRoles);
      const cellWidth = canvas.width / roles.length;
      const cellHeight = canvas.height / 5;

      roles.forEach((role, col) => {
        role.visibilityFactors.forEach((factor, row) => {
          const x = col * cellWidth;
          const y = row * cellHeight;
          
          const intensity = factor.percentage / 100;
          ctx.fillStyle = factor.status === 'failed' ? `rgba(255, 0, 255, ${intensity * 0.5})` :
                         factor.status === 'partial' ? `rgba(192, 132, 252, ${intensity * 0.5})` :
                         `rgba(0, 212, 255, ${intensity * 0.5})`;
          ctx.fillRect(x + 2, y + 2, cellWidth - 4, cellHeight - 4);
          
          ctx.strokeStyle = 'rgba(0, 212, 255, 0.2)';
          ctx.strokeRect(x, y, cellWidth, cellHeight);
        });
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
      case 'complete': return <CheckCircle className="w-4 h-4 text-cyan-400" />;
      case 'partial': return <AlertCircle className="w-4 h-4 text-purple-400" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      case 'failed': return <XCircle className="w-4 h-4 text-pink-400" />;
      default: return <Shield className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="h-full flex flex-col p-4">
      {/* Critical Alert */}
      <div className="mb-3 bg-black border border-purple-500/50 rounded-xl p-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-purple-400 animate-pulse" />
          <span className="text-purple-400 font-bold text-sm">CRITICAL COMPLIANCE FAILURE:</span>
          <span className="text-white text-sm">
            Cloud at 19.17% • Network at 45.2% • Multiple standards violations
          </span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-4">
        {/* 3D Standards Visualization */}
        <div className="col-span-7">
          <div className="h-full glass-panel rounded-xl">
            <div className="p-3 border-b border-cyan-400/20">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-cyan-400">LOGGING STANDARDS</h2>
                <div className="text-3xl font-bold">
                  <span className={complianceScore < 50 ? 'text-purple-400' : complianceScore < 80 ? 'text-yellow-400' : 'text-cyan-400'}>
                    {complianceScore.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
            
            <div ref={standardsRef} className="w-full" style={{ height: 'calc(100% - 60px)' }} />
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-5 space-y-3">
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-2">
            <div className="glass-panel rounded-lg p-3">
              <FileText className="w-4 h-4 text-cyan-400 mb-1" />
              <div className="text-xl font-bold text-yellow-400">{complianceScore.toFixed(0)}%</div>
              <div className="text-xs text-gray-400">Compliance</div>
            </div>
            <div className="glass-panel rounded-lg p-3">
              <Network className="w-4 h-4 text-purple-400 mb-1" />
              <div className="text-xl font-bold text-purple-400">3/5</div>
              <div className="text-xs text-gray-400">Failed Roles</div>
            </div>
            <div className="glass-panel rounded-lg p-3">
              <Activity className="w-4 h-4 text-yellow-400 mb-1" />
              <div className="text-xl font-bold text-yellow-400">2/5</div>
              <div className="text-xs text-gray-400">Process Failed</div>
            </div>
            <div className="glass-panel rounded-lg p-3">
              <Shield className="w-4 h-4 text-purple-400 mb-1" />
              <div className="text-xl font-bold text-purple-400">HIGH</div>
              <div className="text-xs text-gray-400">Risk Level</div>
            </div>
          </div>

          {/* Process Pipeline */}
          <div className="glass-panel rounded-xl p-3">
            <h3 className="text-sm font-bold text-purple-400 mb-2">LOGGING PIPELINE</h3>
            <canvas ref={flowRef} className="w-full h-24" />
          </div>

          {/* Visibility Matrix */}
          <div className="glass-panel rounded-xl p-3">
            <h3 className="text-sm font-bold text-cyan-400 mb-2">VISIBILITY FACTORS</h3>
            <canvas ref={matrixRef} className="w-full h-32" />
          </div>

          {/* Role Cards */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {Object.entries(loggingRoles).map(([roleName, role]) => (
              <div
                key={roleName}
                className={`glass-panel rounded-lg p-2.5 cursor-pointer transition-all hover:scale-102 ${
                  selectedRole === roleName ? 'border-cyan-400' : ''
                }`}
                onClick={() => setSelectedRole(selectedRole === roleName ? null : roleName)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {roleName === 'Network' && <Network className="w-4 h-4 text-cyan-400" />}
                    {roleName === 'Endpoint' && <Server className="w-4 h-4 text-purple-400" />}
                    {roleName === 'Cloud' && <Cloud className="w-4 h-4 text-pink-400" />}
                    {roleName === 'Application' && <Layers className="w-4 h-4 text-yellow-400" />}
                    {roleName === 'Identity & Authentication' && <Lock className="w-4 h-4 text-cyan-400" />}
                    <div>
                      <div className="text-xs font-bold text-white">{roleName}</div>
                      <div className="text-xs text-gray-400">{role.logTypes.length} log types</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-bold ${
                      role.coverage < 30 ? 'text-purple-400' :
                      role.coverage < 60 ? 'text-yellow-400' :
                      role.coverage < 80 ? 'text-yellow-400' :
                      'text-cyan-400'
                    }`}>
                      {role.coverage.toFixed(1)}%
                    </div>
                  </div>
                </div>
                
                <div className="mt-2 h-2 bg-black/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${role.coverage}%`,
                      background: role.coverage < 30 
                        ? 'linear-gradient(90deg, #ff00ff, #ff00ff)'
                        : role.coverage < 60
                        ? 'linear-gradient(90deg, #ffaa00, #ff8800)'
                        : role.coverage < 80
                        ? 'linear-gradient(90deg, #c084fc, #ff00ff)'
                        : 'linear-gradient(90deg, #00d4ff, #00d4ff)'
                    }}
                  />
                </div>
                
                {selectedRole === roleName && (
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <div className="text-xs text-purple-400 mb-1">GAP: {role.gaps}</div>
                    <div className="text-xs text-cyan-400">ACTION: {role.recommendation}</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Critical Actions */}
          <div className="glass-panel rounded-xl p-3 border border-purple-500/30">
            <h3 className="text-sm font-bold text-purple-400 mb-2">CRITICAL ACTIONS</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Target className="w-3 h-3 text-purple-400 mt-0.5" />
                <div className="text-xs">
                  <span className="text-purple-400 font-bold">CLOUD:</span>
                  <span className="text-white ml-1">Enable CloudTrail, VPC Flow Logs (19.17%)</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Target className="w-3 h-3 text-yellow-400 mt-0.5" />
                <div className="text-xs">
                  <span className="text-yellow-400 font-bold">NETWORK:</span>
                  <span className="text-white ml-1">Configure SNMP/NetFlow (45.2%)</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Target className="w-3 h-3 text-cyan-400 mt-0.5" />
                <div className="text-xs">
                  <span className="text-cyan-400 font-bold">NORMALIZE:</span>
                  <span className="text-white ml-1">Fix parsing rules (38%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoggingStandards;