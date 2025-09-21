import React, { useState, useEffect, useRef } from 'react';
import { Shield, CheckCircle, XCircle, AlertCircle, TrendingUp, TrendingDown, FileSearch, Database, Server, Cloud, Network, Activity, Lock, AlertTriangle, Scale, Gavel, BookOpen, FileCheck } from 'lucide-react';
import * as THREE from 'three';

const ComplianceMatrix: React.FC = () => {
  const [selectedFramework, setSelectedFramework] = useState<string>('all');
  const [animatedScores, setAnimatedScores] = useState<Record<string, number>>({});
  const cubeRef = useRef<HTMLDivElement>(null);
  const scalesRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [isScrambled, setIsScrambled] = useState(true);

  // ACTUAL DATA FROM AO1 REQUIREMENTS - GSO and Splunk Compliance
  const complianceData = {
    'CMDB Requirements': {
      framework: 'Asset Management Compliance',
      currentState: 'ASSUMED 100%',
      actualState: 'UNKNOWN',
      gsoScore: 28.6,
      splunkScore: 42.9,
      color: '#00ffff',
      faceIndex: 0,
      requirements: [
        { 
          item: 'CMDB is accurate and complete',
          gso: 'assumed',
          splunk: 'assumed',
          risk: 'CRITICAL',
          gap: 'CMDB NOT accurate - all metrics invalid'
        },
        { 
          item: 'CMDB incorporates asset inventory',
          gso: 'complete',
          splunk: 'complete',
          risk: 'MEDIUM',
          gap: 'Manual processes miss assets'
        },
        { 
          item: 'CMDB discovery scanning',
          gso: 'partial',
          splunk: 'partial',
          risk: 'HIGH',
          gap: 'Not all discovery tools integrated'
        },
        { 
          item: 'DHCP records integration',
          gso: 'failed',
          splunk: 'partial',
          risk: 'CRITICAL',
          gap: 'Dynamic IPs not tracked'
        },
        { 
          item: 'Vulnerability scanning integration',
          gso: 'complete',
          splunk: 'complete',
          risk: 'LOW',
          gap: 'Working as designed'
        },
        { 
          item: 'Cloud hosting controls',
          gso: 'failed',
          splunk: 'failed',
          risk: 'CRITICAL',
          gap: 'Cloud discovery not implemented'
        },
        { 
          item: 'External discovery services',
          gso: 'failed',
          splunk: 'partial',
          risk: 'HIGH',
          gap: 'Limited external integration'
        }
      ]
    },
    'Visibility Requirements': {
      framework: 'Logging Compliance Standards',
      currentState: '19.17% CSOC',
      actualState: 'CRITICAL FAILURE',
      gsoScore: 11.1,
      splunkScore: 44.4,
      color: '#c084fc',
      faceIndex: 1,
      requirements: [
        {
          item: 'Global View - CSOC visibility',
          gso: 'failed',
          splunk: 'partial',
          risk: 'CRITICAL',
          gap: 'Only 19.17% CSOC visibility'
        },
        {
          item: 'Infrastructure Type visibility',
          gso: 'partial',
          splunk: 'complete',
          risk: 'HIGH',
          gap: 'Cloud at 19.17%, On-Prem at 63.93%'
        },
        {
          item: 'Regional and Country view',
          gso: 'failed',
          splunk: 'partial',
          risk: 'CRITICAL',
          gap: 'EMEA at 12.3% coverage'
        },
        {
          item: 'BU and Application view',
          gso: 'failed',
          splunk: 'failed',
          risk: 'HIGH',
          gap: 'No BU-level visibility'
        },
        {
          item: 'System Classification',
          gso: 'partial',
          splunk: 'complete',
          risk: 'HIGH',
          gap: 'Network appliances at 45.2%'
        },
        {
          item: 'Security Control Coverage',
          gso: 'failed',
          splunk: 'partial',
          risk: 'HIGH',
          gap: 'DLP at 62.8%, missing 97,465'
        },
        {
          item: 'Logging Compliance',
          gso: 'failed',
          splunk: 'partial',
          risk: 'CRITICAL',
          gap: 'Multiple compliance failures'
        },
        {
          item: 'Domain Visibility',
          gso: 'failed',
          splunk: 'complete',
          risk: 'MEDIUM',
          gap: 'Some domains not mapped'
        },
        {
          item: 'Visibility Factor Metrics',
          gso: 'failed',
          splunk: 'partial',
          risk: 'HIGH',
          gap: 'URL/FQDN coverage incomplete'
        }
      ]
    },
    'Technical Implementation': {
      framework: 'Platform Integration Requirements',
      currentState: 'PARTIAL',
      actualState: 'AT RISK',
      gsoScore: 57.1,
      splunkScore: 71.4,
      color: '#ff00ff',
      faceIndex: 2,
      requirements: [
        {
          item: 'IPAM integration',
          gso: 'partial',
          splunk: 'complete',
          risk: 'HIGH',
          gap: 'IPAM not synchronized'
        },
        {
          item: 'Kafka data pipeline',
          gso: 'complete',
          splunk: 'complete',
          risk: 'LOW',
          gap: 'Functioning as expected'
        },
        {
          item: 'Chronicle Data Replicator',
          gso: 'complete',
          splunk: 'notapplicable',
          risk: 'LOW',
          gap: 'GSO-specific, working'
        },
        {
          item: 'Splunk API integration',
          gso: 'notapplicable',
          splunk: 'complete',
          risk: 'LOW',
          gap: 'Splunk-specific, functioning'
        },
        {
          item: 'BigQuery analytics',
          gso: 'complete',
          splunk: 'failed',
          risk: 'MEDIUM',
          gap: 'Splunk not connected'
        },
        {
          item: 'Insights dashboard',
          gso: 'partial',
          splunk: 'partial',
          risk: 'MEDIUM',
          gap: 'Limited functionality'
        },
        {
          item: 'Log parsing and normalization',
          gso: 'complete',
          splunk: 'complete',
          risk: 'LOW',
          gap: 'Functioning correctly'
        }
      ]
    },
    'Regulatory Compliance': {
      framework: 'Industry Standards Compliance',
      currentState: 'FAILED',
      actualState: 'CRITICAL',
      gsoScore: 0,
      splunkScore: 0,
      color: '#ff0044',
      faceIndex: 3,
      requirements: [
        {
          item: 'ISO 27001 - Event logging',
          gso: 'failed',
          splunk: 'failed',
          risk: 'CRITICAL',
          gap: 'Only 19.17% visibility fails requirement'
        },
        {
          item: 'NIST CSF - Detection capability',
          gso: 'failed',
          splunk: 'failed',
          risk: 'CRITICAL',
          gap: '80.83% of assets not monitored'
        },
        {
          item: 'PCI DSS - Log review',
          gso: 'failed',
          splunk: 'failed',
          risk: 'CRITICAL',
          gap: 'Incomplete log coverage'
        },
        {
          item: 'SOX - Audit trail',
          gso: 'failed',
          splunk: 'failed',
          risk: 'CRITICAL',
          gap: 'Material weakness in controls'
        }
      ]
    }
  };

  // 3D Compliance Rubik's Cube
  useEffect(() => {
    if (!cubeRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.001);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      cubeRef.current.clientWidth / cubeRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(200, 200, 200);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(cubeRef.current.clientWidth, cubeRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    cubeRef.current.appendChild(renderer.domElement);

    // Create Rubik's Cube structure
    const cubeGroup = new THREE.Group();
    const cubeSize = 3;
    const segmentSize = 20;
    const gap = 2;

    // Create individual cube segments
    Object.entries(complianceData).forEach(([framework, data], frameworkIndex) => {
      for (let x = 0; x < cubeSize; x++) {
        for (let y = 0; y < cubeSize; y++) {
          for (let z = 0; z < cubeSize; z++) {
            // Determine segment color based on compliance status
            const requirementIndex = x + y * cubeSize + z * cubeSize * cubeSize;
            const requirement = data.requirements[requirementIndex % data.requirements.length];
            
            let color = 0x00ff88; // Green for complete
            if (requirement) {
              if (requirement.gso === 'failed' || requirement.splunk === 'failed') {
                color = 0xff0044; // Red for failed
              } else if (requirement.gso === 'partial' || requirement.splunk === 'partial') {
                color = 0xffaa00; // Yellow for partial
              }
            }
            
            const geometry = new THREE.BoxGeometry(segmentSize, segmentSize, segmentSize);
            const material = new THREE.MeshPhongMaterial({
              color: color,
              emissive: color,
              emissiveIntensity: 0.1,
              transparent: true,
              opacity: 0.8
            });
            
            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(
              (x - 1) * (segmentSize + gap),
              (y - 1) * (segmentSize + gap),
              (z - 1) * (segmentSize + gap)
            );
            
            cubeGroup.add(cube);
            
            // Add wireframe
            const wireframeGeometry = new THREE.BoxGeometry(segmentSize + 1, segmentSize + 1, segmentSize + 1);
            const wireframeMaterial = new THREE.MeshBasicMaterial({
              color: color,
              wireframe: true,
              transparent: true,
              opacity: 0.3
            });
            const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
            wireframe.position.copy(cube.position);
            cubeGroup.add(wireframe);
          }
        }
      }
    });

    scene.add(cubeGroup);

    // Add glitch effects for violations
    const glitchGroup = new THREE.Group();
    for (let i = 0; i < 20; i++) {
      const glitchGeometry = new THREE.PlaneGeometry(
        Math.random() * 10 + 5,
        Math.random() * 10 + 5
      );
      const glitchMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0044,
        transparent: true,
        opacity: Math.random() * 0.3,
        side: THREE.DoubleSide
      });
      
      const glitch = new THREE.Mesh(glitchGeometry, glitchMaterial);
      glitch.position.set(
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100
      );
      glitch.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      glitchGroup.add(glitch);
    }
    scene.add(glitchGroup);

    // Particle system for audit events
    const particleCount = 1000;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 200;
      positions[i + 1] = (Math.random() - 0.5) * 200;
      positions[i + 2] = (Math.random() - 0.5) * 200;
      
      // Color based on compliance level
      const complianceLevel = Math.random();
      if (complianceLevel < 0.3) {
        colors[i] = 1; // Red
        colors[i + 1] = 0;
        colors[i + 2] = 0;
      } else if (complianceLevel < 0.7) {
        colors[i] = 1; // Yellow
        colors[i + 1] = 0.7;
        colors[i + 2] = 0;
      } else {
        colors[i] = 0; // Green
        colors[i + 1] = 1;
        colors[i + 2] = 0.5;
      }
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 2,
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

    const pointLight1 = new THREE.PointLight(0x00ffff, 1, 300);
    pointLight1.position.set(100, 100, 100);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff00ff, 1, 300);
    pointLight2.position.set(-100, -100, -100);
    scene.add(pointLight2);

    // Mouse interaction for rotation
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    
    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;
      
      cubeGroup.rotation.y += deltaX * 0.01;
      cubeGroup.rotation.x += deltaY * 0.01;
      
      setRotation({
        x: cubeGroup.rotation.x,
        y: cubeGroup.rotation.y,
        z: cubeGroup.rotation.z
      });
      
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };
    
    const handleMouseUp = () => {
      isDragging = false;
    };
    
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('mouseleave', handleMouseUp);

    // Animation loop
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      // Rotate cube if scrambled
      if (isScrambled) {
        cubeGroup.rotation.x += 0.005;
        cubeGroup.rotation.y += 0.005;
        cubeGroup.rotation.z += 0.001;
      }
      
      // Animate particles
      particles.rotation.x += 0.001;
      particles.rotation.y += 0.001;
      
      // Glitch animation
      glitchGroup.children.forEach((glitch, index) => {
        glitch.visible = Math.random() > 0.7;
        if (glitch.visible) {
          glitch.position.x += Math.sin(Date.now() * 0.001 + index) * 0.5;
          glitch.position.y += Math.cos(Date.now() * 0.001 + index) * 0.5;
        }
      });
      
      // Time-based camera orbit
      if (!isDragging) {
        const time = Date.now() * 0.0002;
        camera.position.x = Math.sin(time) * 300;
        camera.position.z = Math.cos(time) * 300;
        camera.position.y = 150 + Math.sin(time * 2) * 50;
        camera.lookAt(0, 0, 0);
      }
      
      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!cubeRef.current) return;
      camera.aspect = cubeRef.current.clientWidth / cubeRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(cubeRef.current.clientWidth, cubeRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('mouseleave', handleMouseUp);
      window.removeEventListener('resize', handleResize);
      if (frameId) cancelAnimationFrame(frameId);
      if (cubeRef.current && renderer.domElement) {
        cubeRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isScrambled]);

  // Legal Scales Animation
  useEffect(() => {
    const canvas = scalesRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let animationId: number;
    
    const animate = () => {
      // Clear with fade
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const baseY = canvas.height - 50;
      const time = Date.now() * 0.001;

      // Draw scales base
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX - 100, baseY);
      ctx.lineTo(centerX + 100, baseY);
      ctx.stroke();
      
      // Central pillar
      ctx.beginPath();
      ctx.moveTo(centerX, baseY);
      ctx.lineTo(centerX, baseY - 150);
      ctx.stroke();
      
      // Balance beam
      const tilt = Math.sin(time) * 0.2; // Imbalance based on compliance
      
      ctx.save();
      ctx.translate(centerX, baseY - 150);
      ctx.rotate(tilt);
      
      ctx.beginPath();
      ctx.moveTo(-150, 0);
      ctx.lineTo(150, 0);
      ctx.stroke();
      
      // Left scale (Requirements)
      ctx.strokeStyle = '#00ffff';
      ctx.beginPath();
      ctx.moveTo(-150, 0);
      ctx.lineTo(-150, 30);
      ctx.stroke();
      
      // Left pan
      ctx.strokeRect(-170, 30, 40, 5);
      
      // Requirements weight
      const reqWeight = Object.values(complianceData).reduce((sum, framework) => 
        sum + framework.requirements.length, 0
      );
      
      for (let i = 0; i < Math.min(reqWeight / 5, 10); i++) {
        ctx.fillStyle = '#00ffff80';
        ctx.fillRect(-165 + (i % 3) * 12, 25 - Math.floor(i / 3) * 8, 10, 5);
      }
      
      // Right scale (Compliance)
      ctx.strokeStyle = '#ff00ff';
      ctx.beginPath();
      ctx.moveTo(150, 0);
      ctx.lineTo(150, 30);
      ctx.stroke();
      
      // Right pan
      ctx.strokeRect(130, 30, 40, 5);
      
      // Compliance weight
      const complianceWeight = Object.values(complianceData).reduce((sum, framework) => 
        sum + (framework.gsoScore + framework.splunkScore) / 2, 0
      ) / Object.keys(complianceData).length;
      
      for (let i = 0; i < Math.min(complianceWeight / 10, 10); i++) {
        ctx.fillStyle = complianceWeight < 50 ? '#ff004480' : '#00ff8880';
        ctx.fillRect(135 + (i % 3) * 12, 25 - Math.floor(i / 3) * 8, 10, 5);
      }
      
      ctx.restore();
      
      // Gavel strikes for audit events
      if (Math.random() > 0.95) {
        const gavelX = centerX + (Math.random() - 0.5) * 200;
        const gavelY = baseY - 100;
        
        // Gavel impact
        const impactGradient = ctx.createRadialGradient(gavelX, gavelY, 0, gavelX, gavelY, 50);
        impactGradient.addColorStop(0, '#ff00ff80');
        impactGradient.addColorStop(0.5, '#ff00ff40');
        impactGradient.addColorStop(1, '#ff00ff00');
        
        ctx.fillStyle = impactGradient;
        ctx.fillRect(gavelX - 50, gavelY - 50, 100, 100);
        
        // Impact text
        ctx.fillStyle = '#ff00ff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('AUDIT EVENT', gavelX, gavelY - 60);
      }
      
      // Labels
      ctx.fillStyle = '#00ffff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('REQUIREMENTS', centerX - 150, baseY - 170);
      
      ctx.fillStyle = '#ff00ff';
      ctx.fillText('COMPLIANCE', centerX + 150, baseY - 170);
      
      // Imbalance indicator
      const imbalance = Math.abs(reqWeight - complianceWeight);
      if (imbalance > 20) {
        ctx.fillStyle = '#ff0044';
        ctx.font = 'bold 14px monospace';
        ctx.fillText(`IMBALANCE: ${imbalance.toFixed(0)}%`, centerX, baseY + 30);
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, []);

  // Animate scores
  useEffect(() => {
    Object.entries(complianceData).forEach(([framework, data], index) => {
      setTimeout(() => {
        setAnimatedScores(prev => ({
          ...prev,
          [`${framework}-gso`]: data.gsoScore,
          [`${framework}-splunk`]: data.splunkScore,
          [`${framework}-overall`]: (data.gsoScore + data.splunkScore) / 2
        }));
      }, index * 200);
    });
  }, []);

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'complete': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'partial': return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'failed': return <XCircle className="w-5 h-5 text-red-400" />;
      case 'assumed': return <AlertTriangle className="w-5 h-5 text-orange-400" />;
      case 'notapplicable': return <div className="w-5 h-5 text-gray-500 text-center">N/A</div>;
      default: return null;
    }
  };

  return (
    <div className="p-8 min-h-screen bg-black">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(45deg, rgba(255, 0, 68, 0.1) 0%, transparent 70%),
            linear-gradient(-45deg, rgba(192, 132, 252, 0.1) 0%, transparent 70%),
            linear-gradient(90deg, rgba(0, 255, 255, 0.1) 0%, transparent 70%)
          `,
          animation: 'gradient 20s ease infinite',
          backgroundSize: '400% 400%'
        }} />
      </div>

      {/* Header */}
      <div className="relative z-20 mb-8">
        <h1 className="text-6xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
          QUANTUM COMPLIANCE MATRIX
        </h1>
        <p className="text-gray-400 uppercase tracking-[0.3em] text-sm">
          Multi-Dimensional Compliance Analysis • Regulatory Quantum State • Audit Timeline
        </p>
      </div>

      {/* Critical Alert */}
      <div className="relative z-20 mb-6 border border-red-500/50 bg-red-500/10 rounded-lg p-4 backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
          <div>
            <span className="text-red-400 font-bold">COMPLIANCE COLLAPSE:</span>
            <span className="text-white ml-2">GSO at 19.17% - ALL regulatory frameworks in CRITICAL FAILURE state</span>
          </div>
        </div>
      </div>

      {/* Overall Scores */}
      <div className="relative z-20 grid grid-cols-5 gap-4 mb-8">
        <div className="bg-black/80 backdrop-blur-xl rounded-xl border border-red-500/30 p-4">
          <Shield className="w-6 h-6 text-red-400 mb-2" />
          <div className="text-2xl font-bold text-red-400">19.17%</div>
          <div className="text-xs text-gray-400 uppercase">GSO Score</div>
        </div>
        <div className="bg-black/80 backdrop-blur-xl rounded-xl border border-yellow-500/30 p-4">
          <Database className="w-6 h-6 text-yellow-400 mb-2" />
          <div className="text-2xl font-bold text-yellow-400">63.93%</div>
          <div className="text-xs text-gray-400 uppercase">Splunk Score</div>
        </div>
        <div className="bg-black/80 backdrop-blur-xl rounded-xl border border-red-500/30 p-4">
          <XCircle className="w-6 h-6 text-red-400 mb-2" />
          <div className="text-2xl font-bold text-red-400">FAILED</div>
          <div className="text-xs text-gray-400 uppercase">Status</div>
        </div>
        <div className="bg-black/80 backdrop-blur-xl rounded-xl border border-orange-500/30 p-4">
          <AlertTriangle className="w-6 h-6 text-orange-400 mb-2" />
          <div className="text-2xl font-bold text-orange-400">27</div>
          <div className="text-xs text-gray-400 uppercase">Violations</div>
        </div>
        <div className="bg-black/80 backdrop-blur-xl rounded-xl border border-purple-500/30 p-4">
          <Gavel className="w-6 h-6 text-purple-400 mb-2" />
          <div className="text-2xl font-bold text-purple-400">0/4</div>
          <div className="text-xs text-gray-400 uppercase">Compliant</div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="relative z-20 mb-6 flex gap-4">
        <button
          onClick={() => setIsScrambled(!isScrambled)}
          className={`px-6 py-3 rounded-xl font-bold uppercase tracking-wider transition-all backdrop-blur-lg ${
            isScrambled
              ? 'bg-red-500/20 border-2 border-red-500'
              : 'bg-green-500/20 border-2 border-green-500'
          }`}
        >
          <span className={isScrambled ? 'text-red-400' : 'text-green-400'}>
            {isScrambled ? 'SCRAMBLED' : 'SOLVING'}
          </span>
        </button>
      </div>

      <div className="relative z-10 grid grid-cols-2 gap-6 mb-8">
        {/* Compliance Rubik's Cube */}
        <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-cyan-500/30 overflow-hidden"
             style={{
               boxShadow: '0 0 80px rgba(0, 255, 255, 0.3), inset 0 0 40px rgba(0,0,0,0.8)'
             }}>
          <div className="p-4 border-b border-cyan-500/20">
            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Compliance Quantum Cube
            </h3>
          </div>
          <div ref={cubeRef} className="w-full h-[500px] cursor-grab active:cursor-grabbing" />
          
          {/* Cube Status */}
          <div className="absolute top-16 left-4 text-xs font-mono text-cyan-400/60 space-y-1">
            <div>STATE: {isScrambled ? 'CHAOTIC' : 'STABILIZING'}</div>
            <div>ROTATION: X:{rotation.x.toFixed(2)} Y:{rotation.y.toFixed(2)}</div>
            <div>VIOLATIONS: 27 CRITICAL</div>
            <div>DRAG TO ROTATE</div>
          </div>
        </div>

        {/* Legal Scales */}
        <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-purple-500/30 overflow-hidden"
             style={{
               boxShadow: '0 0 80px rgba(192, 132, 252, 0.3), inset 0 0 40px rgba(0,0,0,0.8)'
             }}>
          <div className="p-4 border-b border-purple-500/20">
            <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-4 h-4" />
              Quantum Justice Scales
            </h3>
          </div>
          <canvas ref={scalesRef} className="w-full h-[500px]" />
        </div>
      </div>

      {/* Compliance Frameworks */}
      <div className="relative z-20 space-y-6">
        {Object.entries(complianceData).map(([framework, data]) => (
          <div key={framework} className="bg-black/80 backdrop-blur-xl rounded-2xl border p-6"
               style={{
                 borderColor: data.actualState === 'CRITICAL' || data.actualState === 'CRITICAL FAILURE' 
                   ? 'rgba(255, 0, 68, 0.5)'
                   : 'rgba(255, 170, 0, 0.5)',
                 boxShadow: `0 0 40px ${data.color}20`
               }}>
            {/* Framework Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">{framework}</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Status: <span className={
                    data.actualState === 'CRITICAL' || data.actualState === 'CRITICAL FAILURE' 
                      ? 'text-red-400' 
                      : 'text-yellow-400'
                  }>
                    {data.currentState} → {data.actualState}
                  </span>
                </p>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-xs text-cyan-400/60 mb-1">GSO</div>
                  <div className={`text-2xl font-bold ${
                    data.gsoScore < 50 ? 'text-red-400' : 
                    data.gsoScore < 80 ? 'text-yellow-400' : 
                    'text-green-400'
                  }`}>
                    {animatedScores[`${framework}-gso`]?.toFixed(1) || 0}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-purple-400/60 mb-1">SPLUNK</div>
                  <div className={`text-2xl font-bold ${
                    data.splunkScore < 50 ? 'text-red-400' : 
                    data.splunkScore < 80 ? 'text-yellow-400' : 
                    'text-green-400'
                  }`}>
                    {animatedScores[`${framework}-splunk`]?.toFixed(1) || 0}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-pink-400/60 mb-1">OVERALL</div>
                  <div className={`text-2xl font-bold ${
                    animatedScores[`${framework}-overall`] < 50 ? 'text-red-400' : 
                    animatedScores[`${framework}-overall`] < 80 ? 'text-yellow-400' : 
                    'text-green-400'
                  }`}>
                    {animatedScores[`${framework}-overall`]?.toFixed(1) || 0}%
                  </div>
                </div>
              </div>
            </div>

            {/* Requirements Grid */}
            <div className="grid grid-cols-2 gap-3">
              {data.requirements.slice(0, 4).map((req, idx) => (
                <div key={idx} className="bg-gray-900/50 rounded-lg p-3 border border-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-white font-medium">{req.item}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      {getStatusIcon(req.gso)}
                      <span className="text-xs text-gray-400">GSO</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(req.splunk)}
                      <span className="text-xs text-gray-400">SPL</span>
                    </div>
                    <span className={`ml-auto px-2 py-0.5 rounded text-xs font-bold ${
                      req.risk === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                      req.risk === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                      req.risk === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {req.risk}
                    </span>
                  </div>
                  <p className="text-xs text-red-400 mt-2">{req.gap}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComplianceMatrix;