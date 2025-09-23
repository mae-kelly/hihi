import React, { useState, useEffect, useRef } from 'react';
import { FileText, CheckCircle, XCircle, AlertCircle, Shield, Database, Network, Activity, Terminal, Lock, Layers, Server, Wifi, Cloud, AlertTriangle, Eye, Target, Zap, X, ChevronRight, Binary } from 'lucide-react';
import * as THREE from 'three';

const LoggingStandards: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [complianceScore, setComplianceScore] = useState(0);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [detailView, setDetailView] = useState<any>(null);
  const [hostSearchResults, setHostSearchResults] = useState<any>(null);
  const standardsRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLCanvasElement>(null);
  const matrixRef = useRef<HTMLCanvasElement>(null);
  const pipelineRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const frameRef = useRef<number | null>(null);
  const roleNodesRef = useRef<THREE.Mesh[]>([]);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

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
    'Identity': {
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

  // Search for hosts by logging standard
  const searchLoggingHosts = async (role: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/host_search?q=${role.toLowerCase()}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Search error:', error);
      return null;
    }
  };

  // Interactive 3D Standards Visualization - Hierarchical Tree
  useEffect(() => {
    if (!standardsRef.current) return;

    if (rendererRef.current) {
      rendererRef.current.dispose();
      if (standardsRef.current.contains(rendererRef.current.domElement)) {
        standardsRef.current.removeChild(rendererRef.current.domElement);
      }
    }

    const scene = new THREE.Scene();
    sceneRef.current = scene;
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
    rendererRef.current = renderer;
    
    renderer.setSize(standardsRef.current.clientWidth, standardsRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    standardsRef.current.appendChild(renderer.domElement);

    // Clear node references
    roleNodesRef.current = [];

    // Create central compliance core
    const coreGeometry = new THREE.IcosahedronGeometry(15, 2);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: complianceScore < 50 ? 0xa855f7 : complianceScore < 80 ? 0xffaa00 : 0x00d4ff,
      emissive: complianceScore < 50 ? 0xa855f7 : 0x00d4ff,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.9
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.userData = { type: 'core', complianceScore };
    roleNodesRef.current.push(core);
    scene.add(core);

    // Create role nodes in hierarchical layout
    const roleNodeGroups: THREE.Group[] = [];
    Object.entries(loggingRoles).forEach(([roleName, role], index) => {
      const angle = (index / Object.keys(loggingRoles).length) * Math.PI * 2;
      const radius = 50;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = role.coverage > 70 ? 20 : role.coverage > 40 ? 0 : -20; // Height based on compliance
      
      const nodeGroup = new THREE.Group();
      
      // Role node
      const nodeSize = 5 + Math.log(role.coverage / 10 + 1) * 3;
      const nodeGeometry = new THREE.SphereGeometry(nodeSize, 16, 16);
      const nodeMaterial = new THREE.MeshPhongMaterial({
        color: role.status === 'critical' ? 0xa855f7 :
               role.status === 'warning' ? 0xffaa00 :
               role.status === 'partial' ? 0xc084fc : 0x00d4ff,
        emissive: role.status === 'critical' ? 0xa855f7 : 0x00d4ff,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.8
      });
      
      const nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
      nodeMesh.position.set(x, y, z);
      nodeMesh.userData = { 
        type: 'role',
        role: roleName,
        data: role
      };
      roleNodesRef.current.push(nodeMesh);
      nodeGroup.add(nodeMesh);
      
      // Coverage indicator sphere
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
        new THREE.Vector3(x, y, z)
      ];
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: role.status === 'critical' ? 0xa855f7 : 0x00d4ff,
        transparent: true,
        opacity: 0.3
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      nodeGroup.add(line);
      
      // Add visibility factor satellites
      role.visibilityFactors.forEach((factor, factorIndex) => {
        const factorAngle = (factorIndex / role.visibilityFactors.length) * Math.PI * 2;
        const factorRadius = 15;
        const factorX = x + Math.cos(factorAngle) * factorRadius;
        const factorZ = z + Math.sin(factorAngle) * factorRadius;
        
        const factorGeometry = new THREE.BoxGeometry(2, 2, 2);
        const factorMaterial = new THREE.MeshBasicMaterial({
          color: factor.status === 'failed' ? 0xa855f7 :
                 factor.status === 'partial' ? 0xffaa00 : 0x00d4ff,
          transparent: true,
          opacity: factor.percentage / 100
        });
        const factorMesh = new THREE.Mesh(factorGeometry, factorMaterial);
        factorMesh.position.set(factorX, y, factorZ);
        factorMesh.userData = { type: 'factor', factor: factor.factor, data: factor };
        nodeGroup.add(factorMesh);
      });
      
      roleNodeGroups.push(nodeGroup);
      scene.add(nodeGroup);
    });

    // Data flow particles
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
    
    const pointLight2 = new THREE.PointLight(0xa855f7, 1, 300);
    pointLight2.position.set(-150, -100, -150);
    scene.add(pointLight2);

    camera.position.set(0, 80, 150);
    camera.lookAt(0, 0, 0);

    // Mouse interaction
    const handleMouseMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(roleNodesRef.current);
      
      if (intersects.length > 0) {
        const hoveredMesh = intersects[0].object;
        setHoveredItem(hoveredMesh.userData.role || hoveredMesh.userData.type);
        document.body.style.cursor = 'pointer';
        hoveredMesh.scale.setScalar(1.2);
      } else {
        setHoveredItem(null);
        document.body.style.cursor = 'default';
        roleNodesRef.current.forEach(node => node.scale.setScalar(1));
      }
    };

    const handleClick = async (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(roleNodesRef.current);
      
      if (intersects.length > 0) {
        const clickedMesh = intersects[0].object;
        if (clickedMesh.userData.type === 'role') {
          const hostData = await searchLoggingHosts(clickedMesh.userData.role);
          setDetailView({
            role: clickedMesh.userData.role,
            data: clickedMesh.userData.data,
            hosts: hostData?.hosts || []
          });
        }
      }
    };

    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('click', handleClick);

    // Animation
    const animate = () => {
      core.rotation.y += 0.002;
      core.rotation.x += 0.001;
      
      roleNodeGroups.forEach((node, index) => {
        node.rotation.y += 0.001 * (index + 1);
      });
      
      particles.rotation.y += 0.0005;
      
      const time = Date.now() * 0.0003;
      camera.position.x = Math.sin(time) * 200;
      camera.position.z = Math.cos(time) * 200;
      camera.position.y = 80 + Math.sin(time * 2) * 20;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
      frameRef.current = requestAnimationFrame(animate);
    };
    
    animate();

    return () => {
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('click', handleClick);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (standardsRef.current && standardsRef.current.contains(rendererRef.current.domElement)) {
          standardsRef.current.removeChild(rendererRef.current.domElement);
        }
      }
    };
  }, [complianceScore]);

  // Logging Pipeline Visualization
  useEffect(() => {
    const canvas = pipelineRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let animationId: number;
    let flowPosition = 0;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      flowPosition += 2;
      if (flowPosition > canvas.width) flowPosition = 0;

      // Draw pipeline stages
      Object.entries(loggingProcess).forEach(([step, data], index) => {
        const x = (index + 1) * (canvas.width / 6);
        const y = canvas.height / 2;
        const radius = 20 * (data.completion / 100);
        
        // Animated flow between stages
        if (index < Object.keys(loggingProcess).length - 1) {
          const nextX = (index + 2) * (canvas.width / 6);
          const particleX = x + (flowPosition % (nextX - x));
          
          if (particleX < nextX) {
            const gradient = ctx.createRadialGradient(particleX, y, 0, particleX, y, 5);
            gradient.addColorStop(0, 'rgba(0, 212, 255, 0.8)');
            gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(particleX, y, 5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        
        // Stage circle
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = data.status === 'failed' ? 'rgba(168, 85, 247, 0.5)' :
                       data.status === 'warning' ? 'rgba(255, 170, 0, 0.5)' :
                       data.status === 'partial' ? 'rgba(192, 132, 252, 0.5)' :
                       'rgba(0, 212, 255, 0.5)';
        ctx.fill();
        
        // Connection line
        if (index < Object.keys(loggingProcess).length - 1) {
          const nextX = (index + 2) * (canvas.width / 6);
          ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + radius, y);
          ctx.lineTo(nextX - 20, y);
          ctx.stroke();
        }
        
        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(step, x, y - 30);
        ctx.fillText(`${data.completion}%`, x, y + 35);
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, []);

  // Calculate overall compliance
  useEffect(() => {
    const overallScore = Object.values(loggingRoles).reduce((sum, role) => sum + role.coverage, 0) / Object.keys(loggingRoles).length;
    setComplianceScore(overallScore);
  }, []);

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
                <h2 className="text-lg font-bold text-cyan-400">INTERACTIVE LOGGING STANDARDS</h2>
                <div className="text-3xl font-bold">
                  <span className={complianceScore < 50 ? 'text-purple-400' : complianceScore < 80 ? 'text-yellow-400' : 'text-cyan-400'}>
                    {complianceScore.toFixed(1)}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">Click nodes to explore logging roles and gaps</p>
            </div>
            
            <div ref={standardsRef} className="w-full" style={{ height: 'calc(100% - 80px)' }} />
            
            {hoveredItem && (
              <div className="absolute bottom-4 left-4 bg-black/95 border border-cyan-400/50 rounded-lg p-3">
                <div className="text-sm font-bold text-cyan-400">{hoveredItem}</div>
                <div className="text-xs text-white mt-1">Click for detailed analysis →</div>
              </div>
            )}
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
              <div className="text-xs text-gray-400">Failed</div>
            </div>
            <div className="glass-panel rounded-lg p-3">
              <Activity className="w-4 h-4 text-yellow-400 mb-1" />
              <div className="text-xl font-bold text-yellow-400">2/5</div>
              <div className="text-xs text-gray-400">Pipeline</div>
            </div>
            <div className="glass-panel rounded-lg p-3">
              <Shield className="w-4 h-4 text-purple-400 mb-1" />
              <div className="text-xl font-bold text-purple-400">HIGH</div>
              <div className="text-xs text-gray-400">Risk</div>
            </div>
          </div>

          {/* Logging Pipeline */}
          <div className="glass-panel rounded-xl p-3">
            <h3 className="text-sm font-bold text-purple-400 mb-2">LOGGING PIPELINE STATUS</h3>
            <canvas ref={pipelineRef} className="w-full h-24" />
          </div>

          {/* Role Cards */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {Object.entries(loggingRoles).map(([roleName, role]) => (
              <div
                key={roleName}
                className={`glass-panel rounded-lg p-2.5 cursor-pointer transition-all hover:scale-102 hover:border-cyan-400 ${
                  selectedRole === roleName ? 'border-cyan-400' : ''
                }`}
                onClick={() => {
                  setSelectedRole(roleName);
                  searchLoggingHosts(roleName).then(data => {
                    setDetailView({
                      role: roleName,
                      data: role,
                      hosts: data?.hosts || []
                    });
                  });
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {roleName === 'Network' && <Network className="w-4 h-4 text-cyan-400" />}
                    {roleName === 'Endpoint' && <Server className="w-4 h-4 text-purple-400" />}
                    {roleName === 'Cloud' && <Cloud className="w-4 h-4 text-purple-400" />}
                    {roleName === 'Application' && <Layers className="w-4 h-4 text-yellow-400" />}
                    {roleName === 'Identity' && <Lock className="w-4 h-4 text-cyan-400" />}
                    <div>
                      <div className="text-xs font-bold text-white">{roleName}</div>
                      <div className="text-xs text-gray-400">{role.logTypes.length} log types</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-bold ${
                      role.coverage < 30 ? 'text-purple-400' :
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
                        ? 'linear-gradient(90deg, #a855f7, #ff00ff)'
                        : role.coverage < 80
                        ? 'linear-gradient(90deg, #ffaa00, #ff8800)'
                        : 'linear-gradient(90deg, #00d4ff, #0099ff)'
                    }}
                  />
                </div>
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
            </div>
          </div>
        </div>
      </div>

      {/* Detail View Modal */}
      {detailView && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-6">
          <div className="bg-black border-2 border-cyan-400/50 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-cyan-400/30 flex items-center justify-between">
              <h2 className="text-xl font-bold text-cyan-400">
                {detailView.role} LOGGING STANDARDS ANALYSIS
              </h2>
              <button onClick={() => setDetailView(null)} className="text-white hover:text-cyan-400">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              {detailView.data && (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-black/50 border border-cyan-400/30 rounded-lg p-4">
                      <div className="text-2xl font-bold text-white">{detailView.data.coverage.toFixed(1)}%</div>
                      <div className="text-xs text-gray-400">Coverage</div>
                    </div>
                    <div className="bg-black/50 border border-purple-400/30 rounded-lg p-4">
                      <div className="text-2xl font-bold text-purple-400">{detailView.data.status.toUpperCase()}</div>
                      <div className="text-xs text-gray-400">Status</div>
                    </div>
                    <div className="bg-black/50 border border-cyan-400/30 rounded-lg p-4">
                      <div className="text-2xl font-bold text-cyan-400">{detailView.data.logTypes.length}</div>
                      <div className="text-xs text-gray-400">Log Types</div>
                    </div>
                  </div>

                  <div className="bg-black/50 border border-purple-400/30 rounded-lg p-4 mb-4">
                    <h3 className="text-sm font-bold text-purple-400 mb-2">GAP ANALYSIS</h3>
                    <p className="text-xs text-white">{detailView.data.gaps}</p>
                    <div className="mt-2 p-2 bg-cyan-400/10 border border-cyan-400/30 rounded">
                      <p className="text-xs text-cyan-400">
                        <strong>Recommendation:</strong> {detailView.data.recommendation}
                      </p>
                    </div>
                  </div>

                  <div className="bg-black/50 border border-cyan-400/30 rounded-lg p-4 mb-4">
                    <h3 className="text-sm font-bold text-cyan-400 mb-2">VISIBILITY FACTORS</h3>
                    <div className="space-y-2">
                      {detailView.data.visibilityFactors.map((factor, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span className="text-xs text-gray-400">{factor.factor}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-900 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${
                                  factor.status === 'failed' ? 'bg-purple-400' :
                                  factor.status === 'partial' ? 'bg-yellow-400' :
                                  'bg-cyan-400'
                                }`}
                                style={{ width: `${factor.percentage}%` }}
                              />
                            </div>
                            <span className={`text-xs font-bold ${
                              factor.status === 'failed' ? 'text-purple-400' :
                              factor.status === 'partial' ? 'text-yellow-400' :
                              'text-cyan-400'
                            }`}>
                              {factor.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoggingStandards;