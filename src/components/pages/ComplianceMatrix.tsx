import React, { useState, useEffect, useRef } from 'react';
import { Shield, CheckCircle, XCircle, AlertCircle, TrendingUp, TrendingDown, FileSearch, Database, Server, Cloud, Network, Activity, Lock, AlertTriangle, Scale, Gavel, BookOpen, FileCheck, Cpu, Zap, Binary, Layers } from 'lucide-react';
import * as THREE from 'three';

const ComplianceMatrix: React.FC = () => {
  const [selectedFramework, setSelectedFramework] = useState<string>('all');
  const [animatedScores, setAnimatedScores] = useState<Record<string, number>>({});
  const cubeRef = useRef<HTMLDivElement>(null);
  const matrixRef = useRef<HTMLCanvasElement>(null);
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
      color: '#ff00ff',
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

  // 3D Compliance Cube
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
            
            let color = 0x00ffff; // Blue for complete
            if (requirement) {
              if (requirement.gso === 'failed' || requirement.splunk === 'failed') {
                color = 0xff00ff; // Pink for failed
              } else if (requirement.gso === 'partial' || requirement.splunk === 'partial') {
                color = 0xc084fc; // Purple for partial
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
        color: 0xff00ff,
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
        colors[i] = 1; colors[i + 1] = 0; colors[i + 2] = 1; // Pink
      } else if (complianceLevel < 0.7) {
        colors[i] = 0.75; colors[i + 1] = 0.52; colors[i + 2] = 0.99; // Purple
      } else {
        colors[i] = 0; colors[i + 1] = 1; colors[i + 2] = 1; // Blue
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

  // Compliance Matrix Canvas
  useEffect(() => {
    const canvas = matrixRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let animationId: number;
    
    const animate = () => {
      // Matrix rain effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw compliance matrix grid
      const cellSize = 40;
      const frameworks = Object.keys(complianceData);
      const platforms = ['GSO', 'Splunk'];
      
      // Draw grid
      frameworks.forEach((framework, fIndex) => {
        platforms.forEach((platform, pIndex) => {
          const x = (pIndex + 1) * cellSize * 3;
          const y = (fIndex + 1) * cellSize * 2;
          
          const data = complianceData[framework as keyof typeof complianceData];
          const score = platform === 'GSO' ? data.gsoScore : data.splunkScore;
          
          // Cell background
          const color = score < 30 ? '#ff00ff' : score < 60 ? '#c084fc' : '#00ffff';
          ctx.fillStyle = color + '40';
          ctx.fillRect(x, y, cellSize * 2, cellSize);
          
          // Cell border
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, cellSize * 2, cellSize);
          
          // Score text
          ctx.fillStyle = color;
          ctx.font = 'bold 14px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${score.toFixed(1)}%`, x + cellSize, y + cellSize / 2);
        });
      });

      // Draw flowing data streams
      const time = Date.now() * 0.001;
      for (let i = 0; i < 5; i++) {
        const x = (Math.sin(time + i) + 1) * canvas.width / 2;
        const gradient = ctx.createLinearGradient(x, 0, x, canvas.height);
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0)');
        gradient.addColorStop(0.5, 'rgba(192, 132, 252, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 0, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x - 1, 0, 2, canvas.height);
      }

      // Digital rain characters
      const chars = '01';
      ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
      ctx.font = '10px monospace';
      
      for (let i = 0; i < 10; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = Math.random() * canvas.width;
        const y = (Date.now() * 0.1 + i * 100) % canvas.height;
        ctx.fillText(char, x, y);
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
      case 'complete': return <CheckCircle className="w-5 h-5 text-blue-400" />;
      case 'partial': return <AlertCircle className="w-5 h-5 text-purple-400" />;
      case 'failed': return <XCircle className="w-5 h-5 text-pink-400" />;
      case 'assumed': return <AlertTriangle className="w-5 h-5 text-purple-400" />;
      case 'notapplicable': return <div className="w-5 h-5 text-gray-500 text-center">N/A</div>;
      default: return null;
    }
  };

  return (
    <div className="p-8 min-h-screen bg-black">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-black mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          QUANTUM COMPLIANCE MATRIX
        </h1>
        <p className="text-gray-400 uppercase tracking-widest text-xs">
          Multi-Dimensional Compliance Analysis • Regulatory Quantum State
        </p>
      </div>

      {/* Critical Alert */}
      <div className="mb-6 bg-black border border-pink-500/30 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-pink-400 animate-pulse" />
          <div>
            <span className="text-pink-400 font-bold">COMPLIANCE COLLAPSE:</span>
            <span className="text-white ml-2">GSO at 19.17% - ALL regulatory frameworks in CRITICAL FAILURE state</span>
          </div>
        </div>
      </div>

      {/* Overall Scores */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <div className="bg-gray-900/30 rounded-xl p-6 border border-gray-800">
          <Shield className="w-6 h-6 text-pink-400 mb-2" />
          <div className="text-3xl font-bold text-pink-400">19.17%</div>
          <div className="text-xs text-gray-400 uppercase">GSO Score</div>
        </div>
        <div className="bg-gray-900/30 rounded-xl p-6 border border-gray-800">
          <Database className="w-6 h-6 text-purple-400 mb-2" />
          <div className="text-3xl font-bold text-purple-400">63.93%</div>
          <div className="text-xs text-gray-400 uppercase">Splunk Score</div>
        </div>
        <div className="bg-gray-900/30 rounded-xl p-6 border border-gray-800">
          <XCircle className="w-6 h-6 text-pink-400 mb-2" />
          <div className="text-3xl font-bold text-pink-400">FAILED</div>
          <div className="text-xs text-gray-400 uppercase">Status</div>
        </div>
        <div className="bg-gray-900/30 rounded-xl p-6 border border-gray-800">
          <AlertTriangle className="w-6 h-6 text-purple-400 mb-2" />
          <div className="text-3xl font-bold text-purple-400">27</div>
          <div className="text-xs text-gray-400 uppercase">Violations</div>
        </div>
        <div className="bg-gray-900/30 rounded-xl p-6 border border-gray-800">
          <Gavel className="w-6 h-6 text-blue-400 mb-2" />
          <div className="text-3xl font-bold text-blue-400">0/4</div>
          <div className="text-xs text-gray-400 uppercase">Compliant</div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={() => setIsScrambled(!isScrambled)}
          className={`px-6 py-3 rounded-xl font-bold uppercase tracking-wider transition-all ${
            isScrambled
              ? 'bg-pink-500/20 border-2 border-pink-500'
              : 'bg-blue-500/20 border-2 border-blue-500'
          }`}
        >
          <span className={isScrambled ? 'text-pink-400' : 'text-blue-400'}>
            {isScrambled ? 'SCRAMBLED' : 'SOLVING'}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6 mb-8">
        {/* Compliance Rubik's Cube */}
        <div className="col-span-7">
          <div className="bg-black border border-blue-500/30 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-blue-500/20">
              <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Compliance Quantum Cube
              </h3>
            </div>
            <div ref={cubeRef} className="w-full h-[500px] cursor-grab active:cursor-grabbing" />
            
            {/* Cube Status */}
            <div className="absolute top-16 left-4 text-xs font-mono text-blue-400/60 space-y-1">
              <div>STATE: {isScrambled ? 'CHAOTIC' : 'STABILIZING'}</div>
              <div>ROTATION: X:{rotation.x.toFixed(2)} Y:{rotation.y.toFixed(2)}</div>
              <div>VIOLATIONS: 27 CRITICAL</div>
              <div>DRAG TO ROTATE</div>
            </div>
          </div>
        </div>

        {/* Compliance Matrix */}
        <div className="col-span-5">
          <div className="bg-black border border-purple-500/30 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-purple-500/20">
              <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                <Binary className="w-4 h-4" />
                Digital Compliance Matrix
              </h3>
            </div>
            <canvas ref={matrixRef} className="w-full h-[500px]" />
          </div>
        </div>
      </div>

      {/* Compliance Frameworks */}
      <div className="space-y-6">
        {Object.entries(complianceData).map(([framework, data]) => (
          <div key={framework} className="bg-gray-900/30 rounded-2xl p-6 border"
               style={{
                 borderColor: data.actualState === 'CRITICAL' || data.actualState === 'CRITICAL FAILURE' 
                   ? 'rgba(255, 0, 255, 0.3)'
                   : 'rgba(192, 132, 252, 0.3)'
               }}>
            {/* Framework Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">{framework}</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Status: <span className={
                    data.actualState === 'CRITICAL' || data.actualState === 'CRITICAL FAILURE' 
                      ? 'text-pink-400' 
                      : 'text-purple-400'
                  }>
                    {data.currentState} → {data.actualState}
                  </span>
                </p>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-xs text-blue-400/60 mb-1">GSO</div>
                  <div className={`text-2xl font-bold ${
                    data.gsoScore < 50 ? 'text-pink-400' : 
                    data.gsoScore < 80 ? 'text-purple-400' : 
                    'text-blue-400'
                  }`}>
                    {animatedScores[`${framework}-gso`]?.toFixed(1) || 0}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-purple-400/60 mb-1">SPLUNK</div>
                  <div className={`text-2xl font-bold ${
                    data.splunkScore < 50 ? 'text-pink-400' : 
                    data.splunkScore < 80 ? 'text-purple-400' : 
                    'text-blue-400'
                  }`}>
                    {animatedScores[`${framework}-splunk`]?.toFixed(1) || 0}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-pink-400/60 mb-1">OVERALL</div>
                  <div className={`text-2xl font-bold ${
                    animatedScores[`${framework}-overall`] < 50 ? 'text-pink-400' : 
                    animatedScores[`${framework}-overall`] < 80 ? 'text-purple-400' : 
                    'text-blue-400'
                  }`}>
                    {animatedScores[`${framework}-overall`]?.toFixed(1) || 0}%
                  </div>
                </div>
              </div>
            </div>

            {/* Requirements Grid */}
            <div className="grid grid-cols-2 gap-3">
              {data.requirements.slice(0, 4).map((req, idx) => (
                <div key={idx} className="bg-black/50 rounded-lg p-3 border border-gray-800">
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
                      req.risk === 'CRITICAL' ? 'bg-pink-500/20 text-pink-400' :
                      req.risk === 'HIGH' ? 'bg-purple-500/20 text-purple-400' :
                      req.risk === 'MEDIUM' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {req.risk}
                    </span>
                  </div>
                  <p className="text-xs text-pink-400 mt-2">{req.gap}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Action Plan */}
      <div className="mt-8 bg-gray-900/30 rounded-2xl p-6 border border-pink-500/30">
        <h3 className="text-xl font-bold text-pink-400 mb-4">CRITICAL ACTIONS FOR COMPLIANCE</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-black/50 rounded-lg border border-gray-800">
            <div className="text-sm font-bold text-purple-400 mb-2">PRIORITY 1: EMEA DEPLOYMENT</div>
            <p className="text-xs text-gray-400">Deploy 5 regional collectors. Current 12.3% coverage is critical risk.</p>
          </div>
          <div className="p-4 bg-black/50 rounded-lg border border-gray-800">
            <div className="text-sm font-bold text-purple-400 mb-2">PRIORITY 2: LINUX SYSTEMS</div>
            <p className="text-xs text-gray-400">Configure rsyslog on 24,001 Linux servers (30.71% gap).</p>
          </div>
          <div className="p-4 bg-black/50 rounded-lg border border-gray-800">
            <div className="text-sm font-bold text-purple-400 mb-2">PRIORITY 3: DLP EXPANSION</div>
            <p className="text-xs text-gray-400">Deploy DLP to 97,465 unprotected assets immediately.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceMatrix;