import React, { useState, useEffect, useRef } from 'react';
import { FileText, CheckCircle, XCircle, AlertCircle, Shield, Database, Network, Activity, Terminal, Lock, Layers, Server, Wifi, Cloud, AlertTriangle, Cpu, Zap, Binary, Code, GitBranch } from 'lucide-react';
import * as THREE from 'three';

const LoggingStandards: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [complianceScore, setComplianceScore] = useState(0);
  const [loggingData, setLoggingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pipelineRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLCanvasElement>(null);
  
  // Fetch real data from Flask API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch data from multiple endpoints to construct logging standards view
        const [infraResponse, sourceResponse, cmdbResponse, taniumResponse] = await Promise.all([
          fetch('http://localhost:5000/api/infrastructure_type'),
          fetch('http://localhost:5000/api/source_tables_metrics'),
          fetch('http://localhost:5000/api/cmdb_presence'),
          fetch('http://localhost:5000/api/tanium_coverage')
        ]);

        if (!infraResponse.ok || !sourceResponse.ok || !cmdbResponse.ok || !taniumResponse.ok) {
          throw new Error('Failed to fetch logging data');
        }

        const infraData = await infraResponse.json();
        const sourceData = await sourceResponse.json();
        const cmdbData = await cmdbResponse.json();
        const taniumData = await taniumResponse.json();

        // Process real data into logging roles structure
        const roles: any = {};
        
        // Network Role - based on infrastructure data
        const networkInfra = infraData.detailed_data?.filter((i: any) => 
          i.type.toLowerCase().includes('network') || 
          i.type.toLowerCase().includes('firewall') ||
          i.type.toLowerCase().includes('router')
        );
        
        if (networkInfra && networkInfra.length > 0) {
          const avgNetworkCoverage = networkInfra.reduce((sum: number, n: any) => sum + n.percentage, 0) / networkInfra.length;
          roles['Network'] = {
            role: 'Network',
            status: avgNetworkCoverage < 30 ? 'critical' : avgNetworkCoverage < 60 ? 'partial' : 'active',
            coverage: avgNetworkCoverage,
            color: '#00ffff',
            icon: Network,
            logTypes: ['Firewall Traffic', 'IDS/IPS', 'NDR', 'Proxy', 'DNS', 'WAF'],
            commonDataFields: ['IP (source, target)', 'Protocol', 'Detection Signature', 'Port', 'DNS record/FQDN', 'HTTP Headers'],
            visibilityFactors: [
              { factor: 'CMDB Asset Visibility', status: cmdbData.registration_rate > 80 ? 'complete' : 'partial', percentage: cmdbData.registration_rate },
              { factor: 'Network Infrastructure', status: avgNetworkCoverage > 60 ? 'partial' : 'failed', percentage: avgNetworkCoverage },
              { factor: 'Tanium Coverage', status: taniumData.coverage_percentage > 70 ? 'partial' : 'failed', percentage: taniumData.coverage_percentage }
            ],
            gaps: `Network infrastructure showing ${avgNetworkCoverage.toFixed(1)}% coverage`,
            recommendation: 'Enable comprehensive network logging across all devices',
            assets: networkInfra.reduce((sum: number, n: any) => sum + n.frequency, 0)
          };
        }
        
        // Endpoint Role - based on tanium and infrastructure data
        const endpointInfra = infraData.detailed_data?.filter((i: any) => 
          i.type.toLowerCase().includes('windows') || 
          i.type.toLowerCase().includes('linux') ||
          i.type.toLowerCase().includes('mac') ||
          i.type.toLowerCase().includes('physical')
        );
        
        if (endpointInfra && endpointInfra.length > 0) {
          const avgEndpointCoverage = (taniumData.coverage_percentage + cmdbData.registration_rate) / 2;
          roles['Endpoint'] = {
            role: 'Endpoint',
            status: avgEndpointCoverage < 50 ? 'warning' : avgEndpointCoverage < 80 ? 'partial' : 'active',
            coverage: avgEndpointCoverage,
            color: '#c084fc',
            icon: Server,
            logTypes: ['OS logs (WinEVT, Linux syslog)', 'EDR', 'DLP', 'FIM'],
            commonDataFields: ['system name', 'IP', 'filename'],
            visibilityFactors: [
              { factor: 'CMDB Asset Visibility', status: 'complete', percentage: cmdbData.registration_rate },
              { factor: 'Tanium Agent Coverage', status: taniumData.coverage_percentage > 70 ? 'partial' : 'failed', percentage: taniumData.coverage_percentage },
              { factor: 'Endpoint Systems', status: avgEndpointCoverage > 60 ? 'partial' : 'failed', percentage: avgEndpointCoverage }
            ],
            gaps: `Endpoints at ${avgEndpointCoverage.toFixed(1)}% coverage - ${taniumData.deployment_gaps?.total_unprotected_assets || 0} assets unprotected`,
            recommendation: 'Deploy endpoint agents to all systems',
            assets: endpointInfra.reduce((sum: number, e: any) => sum + e.frequency, 0)
          };
        }
        
        // Cloud Role - based on infrastructure data
        const cloudInfra = infraData.detailed_data?.filter((i: any) => 
          i.type.toLowerCase().includes('aws') || 
          i.type.toLowerCase().includes('azure') ||
          i.type.toLowerCase().includes('gcp') ||
          i.type.toLowerCase().includes('cloud')
        );
        
        if (cloudInfra && cloudInfra.length > 0) {
          const avgCloudCoverage = cloudInfra.reduce((sum: number, c: any) => sum + c.percentage, 0) / cloudInfra.length;
          roles['Cloud'] = {
            role: 'Cloud',
            status: avgCloudCoverage < 20 ? 'critical' : avgCloudCoverage < 50 ? 'warning' : 'partial',
            coverage: avgCloudCoverage,
            color: '#ff00ff',
            icon: Cloud,
            logTypes: ['Cloud Event', 'Cloud Load Balancer', 'Cloud Config', 'Theom', 'WIZ', 'Cloud Security'],
            commonDataFields: ['VPC', 'Instance ID', 'Region', 'Account ID', 'Resource Tags'],
            visibilityFactors: [
              { factor: 'Cloud Infrastructure', status: avgCloudCoverage > 30 ? 'partial' : 'failed', percentage: avgCloudCoverage },
              { factor: 'CMDB Coverage', status: cmdbData.registration_rate > 80 ? 'partial' : 'failed', percentage: cmdbData.registration_rate },
              { factor: 'Cloud Modernization', status: infraData.modernization_analysis?.modernization_percentage > 30 ? 'partial' : 'failed', percentage: infraData.modernization_analysis?.modernization_percentage || 0 }
            ],
            gaps: `Cloud infrastructure at critical ${avgCloudCoverage.toFixed(1)}% coverage`,
            recommendation: 'IMMEDIATE: Enable CloudTrail, VPC Flow Logs, and cloud-native logging',
            assets: cloudInfra.reduce((sum: number, c: any) => sum + c.frequency, 0)
          };
        }
        
        // Container Role - based on infrastructure data
        const containerInfra = infraData.detailed_data?.filter((i: any) => 
          i.type.toLowerCase().includes('docker') || 
          i.type.toLowerCase().includes('kubernetes') ||
          i.type.toLowerCase().includes('container')
        );
        
        if (containerInfra && containerInfra.length > 0) {
          const avgContainerCoverage = containerInfra.reduce((sum: number, c: any) => sum + c.percentage, 0) / containerInfra.length;
          roles['Container'] = {
            role: 'Container',
            status: avgContainerCoverage < 30 ? 'critical' : avgContainerCoverage < 60 ? 'warning' : 'partial',
            coverage: avgContainerCoverage,
            color: '#00ff88',
            icon: Layers,
            logTypes: ['Container Logs', 'Kubernetes Events', 'Docker Daemon', 'Pod Logs'],
            commonDataFields: ['Container ID', 'Pod Name', 'Namespace', 'Image'],
            visibilityFactors: [
              { factor: 'Container Coverage', status: avgContainerCoverage > 40 ? 'partial' : 'failed', percentage: avgContainerCoverage },
              { factor: 'Orchestration Logs', status: 'partial', percentage: 50 }
            ],
            gaps: `Container infrastructure at ${avgContainerCoverage.toFixed(1)}% coverage`,
            recommendation: 'Deploy container logging agents to all clusters',
            assets: containerInfra.reduce((sum: number, c: any) => sum + c.frequency, 0)
          };
        }

        // Logging process data based on source tables
        const processData = {
          'Configure': {
            step: 1,
            status: cmdbData.registration_rate > 90 ? 'complete' : cmdbData.registration_rate > 70 ? 'partial' : 'failed',
            completion: cmdbData.registration_rate,
            description: 'Assets mapped to log roles',
            color: '#00ffff'
          },
          'Collect': {
            step: 2,
            status: sourceData.unique_sources > 5 ? 'partial' : 'failed',
            completion: Math.min(100, sourceData.unique_sources * 10),
            description: 'Log collection mechanisms',
            color: '#00ffff'
          },
          'Transport': {
            step: 3,
            status: taniumData.coverage_percentage > 70 ? 'partial' : 'failed',
            completion: taniumData.coverage_percentage,
            description: 'Transport layer to SIEM',
            color: '#c084fc'
          },
          'Ingest': {
            step: 4,
            status: 'warning',
            completion: (cmdbData.registration_rate + taniumData.coverage_percentage) / 2,
            description: 'Data ingestion pipeline',
            color: '#ff00ff'
          },
          'Normalize': {
            step: 5,
            status: 'failed',
            completion: Math.min(100, sourceData.unique_sources * 5),
            description: 'Data normalization',
            color: '#ff00ff'
          }
        };

        setLoggingData({
          roles,
          process: processData,
          sourceData,
          cmdbData,
          taniumData,
          infraData
        });
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load logging data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // 3D Pipeline Visualization with real data
  useEffect(() => {
    if (!pipelineRef.current || !loggingData) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.001);

    const camera = new THREE.PerspectiveCamera(
      45,
      pipelineRef.current.clientWidth / pipelineRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(100, 100, 200);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(pipelineRef.current.clientWidth, pipelineRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    pipelineRef.current.appendChild(renderer.domElement);

    const pipelineGroup = new THREE.Group();
    const segments: THREE.Mesh[] = [];
    
    Object.entries(loggingData.process).forEach(([step, data]: [string, any], index) => {
      const x = (index - 2) * 40;
      
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
      
      if (index < Object.keys(loggingData.process).length - 1) {
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

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00ffff, 1, 200);
    pointLight1.position.set(100, 50, 100);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff00ff, 1, 200);
    pointLight2.position.set(-100, 50, -100);
    scene.add(pointLight2);

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      pipelineGroup.rotation.y += 0.003;
      
      segments.forEach((segment, index) => {
        segment.rotation.x += 0.01;
        segment.scale.setScalar(1 + Math.sin(Date.now() * 0.001 + index) * 0.05);
      });
      
      const positions = particles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] += 2;
        if (positions[i * 3] > 100) {
          positions[i * 3] = -100;
        }
      }
      particles.geometry.attributes.position.needsUpdate = true;
      
      const time = Date.now() * 0.0005;
      camera.position.x = Math.sin(time) * 200;
      camera.position.z = Math.cos(time) * 200;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      if (pipelineRef.current && renderer.domElement) {
        pipelineRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [loggingData]);

  // Data Flow Canvas with real data
  useEffect(() => {
    const canvas = flowRef.current;
    if (!canvas || !loggingData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const nodes: any[] = [];
    const connections: any[] = [];

    Object.entries(loggingData.roles).forEach(([role, data]: [string, any], index) => {
      nodes.push({
        x: (index + 1) * (canvas.width / (Object.keys(loggingData.roles).length + 1)),
        y: canvas.height / 2,
        role,
        data,
        radius: 20,
        pulsePhase: Math.random() * Math.PI * 2
      });
    });

    for (let i = 0; i < nodes.length - 1; i++) {
      connections.push({
        from: nodes[i],
        to: nodes[i + 1],
        particles: []
      });
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

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

      nodes.forEach(node => {
        node.pulsePhase += 0.05;
        const pulseScale = 1 + Math.sin(node.pulsePhase) * 0.1;
        const currentRadius = node.radius * pulseScale;
        
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
        
        ctx.fillStyle = node.data.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
        
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
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(node.role, node.x, node.y - currentRadius - 10);
        
        ctx.font = '9px monospace';
        ctx.fillStyle = node.data.color;
        ctx.fillText(`${node.data.coverage.toFixed(1)}%`, node.x, node.y + currentRadius + 15);
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, [loggingData]);

  // Calculate overall compliance from real data
  useEffect(() => {
    if (!loggingData) return;
    
    const roles = Object.values(loggingData.roles);
    if (roles.length > 0) {
      const overallScore = roles.reduce((sum: number, role: any) => sum + role.coverage, 0) / roles.length;
      setComplianceScore(overallScore);
    }
  }, [loggingData]);

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'complete': return <CheckCircle className="w-4 h-4 text-blue-400" />;
      case 'partial': return <AlertCircle className="w-4 h-4 text-purple-400" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-purple-400" />;
      case 'failed': return <XCircle className="w-4 h-4 text-pink-400" />;
      default: return <Shield className="w-4 h-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400"></div>
          <div className="mt-4 text-xl font-bold text-cyan-400">LOADING LOGGING STANDARDS</div>
        </div>
      </div>
    );
  }

  if (error || !loggingData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center glass-panel rounded-xl p-8">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <div className="text-xl font-bold text-red-400 mb-2">DATA LOAD ERROR</div>
          <div className="text-sm text-gray-400">{error || 'No logging data available'}</div>
        </div>
      </div>
    );
  }

  const criticalRoles = Object.values(loggingData.roles).filter((r: any) => r.status === 'critical').length;
  const totalAssets = Object.values(loggingData.roles).reduce((sum: number, r: any) => sum + (r.assets || 0), 0);
  const avgCoverage = complianceScore;

  return (
    <div className="p-4 h-screen bg-black overflow-hidden flex flex-col">
      {/* Critical Alert and Stats Row */}
      <div className="flex gap-3 mb-3">
        <div className="flex-1 bg-black border border-pink-500/30 rounded-lg p-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-pink-400 animate-pulse" />
            <span className="text-pink-400 font-bold text-xs">CRITICAL:</span>
            <span className="text-white text-xs">
              {criticalRoles} critical roles - Average coverage {avgCoverage.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="bg-gray-900/30 rounded-lg px-4 py-2 border border-gray-800">
            <div className="text-lg font-bold text-purple-400">{avgCoverage.toFixed(1)}%</div>
            <div className="text-[10px] text-gray-400 uppercase">Compliance</div>
          </div>
          <div className="bg-gray-900/30 rounded-lg px-4 py-2 border border-gray-800">
            <div className="text-lg font-bold text-pink-400">{criticalRoles}/{Object.keys(loggingData.roles).length}</div>
            <div className="text-[10px] text-gray-400 uppercase">Critical</div>
          </div>
          <div className="bg-gray-900/30 rounded-lg px-4 py-2 border border-gray-800">
            <div className="text-lg font-bold text-blue-400">{(totalAssets/1000).toFixed(0)}K</div>
            <div className="text-[10px] text-gray-400 uppercase">Assets</div>
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
              {Object.entries(loggingData.process).map(([step, data]: [string, any], index) => (
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
                        {data.completion.toFixed(0)}%
                      </div>
                    </div>
                  </div>
                  {index < Object.keys(loggingData.process).length - 1 && (
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
          {Object.entries(loggingData.roles).map(([roleName, role]: [string, any]) => {
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
                    {role.coverage.toFixed(1)}%
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

                {/* Assets Count */}
                {role.assets && (
                  <div className="text-[9px] text-gray-400 mb-2">
                    Assets: {role.assets.toLocaleString()}
                  </div>
                )}

                {/* Log Types */}
                <div className="mb-2">
                  <div className="flex flex-wrap gap-1">
                    {role.logTypes.slice(0, 3).map((type: string) => (
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

                {/* Visibility Factors */}
                <div className="grid grid-cols-2 gap-1 mb-2">
                  {role.visibilityFactors.slice(0, 4).map((factor: any) => (
                    <div key={factor.factor} className="flex items-center justify-between p-1 bg-black/50 rounded border border-gray-800">
                      <span className="text-[9px] text-gray-300 truncate">{factor.factor.split(' ')[0]}</span>
                      <span className={`text-[9px] font-mono font-bold ${
                        factor.percentage < 30 ? 'text-pink-400' :
                        factor.percentage < 60 ? 'text-purple-400' :
                        'text-blue-400'
                      }`}>
                        {factor.percentage.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>

                {/* Gap and Recommendation */}
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