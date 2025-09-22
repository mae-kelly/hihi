import React, { useState, useEffect, useRef } from 'react';
import { Shield, CheckCircle, XCircle, AlertCircle, TrendingUp, TrendingDown, FileSearch, Database, Server, Activity, AlertTriangle, Layers, Binary, Zap, Lock, Eye, Radio, Wifi, Target, Radar } from 'lucide-react';
import * as THREE from 'three';

const ComplianceMatrix: React.FC = () => {
  const [complianceData, setComplianceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<'splunk' | 'chronicle' | 'both'>('both');
  const [hoveredMetric, setHoveredMetric] = useState<any>(null);
  const [selectedDetail, setSelectedDetail] = useState<any>(null);
  const matrixRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLCanvasElement>(null);
  const waveRef = useRef<HTMLCanvasElement>(null);
  const radarRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/logging_compliance');
        if (!response.ok) throw new Error('Failed to fetch compliance data');
        const data = await response.json();
        setComplianceData(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!matrixRef.current || !complianceData) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.001);

    const camera = new THREE.PerspectiveCamera(
      60,
      matrixRef.current.clientWidth / matrixRef.current.clientHeight,
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    
    renderer.setSize(matrixRef.current.clientWidth, matrixRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    matrixRef.current.appendChild(renderer.domElement);

    const platformGroup = new THREE.Group();
    
    const createPlatformVisualization = (data: any, color: number, xOffset: number, name: string) => {
      const group = new THREE.Group();
      const compliance = data.compliance_percentage;
      
      const segments = 36;
      const radius = 35;
      const height = 50;
      
      for (let i = 0; i < segments; i++) {
        const startAngle = (i / segments) * Math.PI * 2;
        const endAngle = ((i + 1) / segments) * Math.PI * 2;
        
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.arc(0, 0, radius, startAngle, endAngle, false);
        shape.lineTo(0, 0);
        
        const geometry = new THREE.ExtrudeGeometry(shape, {
          depth: height,
          bevelEnabled: true,
          bevelThickness: 1,
          bevelSize: 1,
          bevelOffset: 0,
          bevelSegments: 3
        });
        
        const isCompliant = (i / segments) < (compliance / 100);
        const material = new THREE.MeshPhongMaterial({
          color: isCompliant ? color : 0x1a1a1a,
          emissive: isCompliant ? color : 0x000000,
          emissiveIntensity: isCompliant ? 0.3 : 0,
          transparent: true,
          opacity: isCompliant ? 0.9 : 0.3,
          metalness: 0.8,
          roughness: 0.2
        });
        
        const segment = new THREE.Mesh(geometry, material);
        segment.rotation.x = -Math.PI / 2;
        segment.userData = { 
          platform: name, 
          segmentIndex: i, 
          isCompliant,
          percentage: compliance
        };
        
        segment.scale.set(1, 1, 1 + Math.sin(Date.now() * 0.001 + i * 0.2) * 0.05);
        
        group.add(segment);
      }
      
      const ringGeometry = new THREE.RingGeometry(radius + 2, radius + 4, segments);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = height + 1;
      group.add(ring);
      
      const pulseRing = ring.clone();
      pulseRing.scale.set(1.2, 1.2, 1);
      pulseRing.material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.1
      });
      group.add(pulseRing);
      
      group.position.x = xOffset;
      return { group, ring, pulseRing };
    };
    
    let splunkVis: any = null;
    let chronicleVis: any = null;
    
    if (complianceData.splunk_compliance && (selectedPlatform === 'splunk' || selectedPlatform === 'both')) {
      splunkVis = createPlatformVisualization(
        complianceData.splunk_compliance,
        0x00d4ff,
        selectedPlatform === 'both' ? -50 : 0,
        'SPLUNK'
      );
      platformGroup.add(splunkVis.group);
    }
    
    if (complianceData.chronicle_compliance && (selectedPlatform === 'chronicle' || selectedPlatform === 'both')) {
      chronicleVis = createPlatformVisualization(
        complianceData.chronicle_compliance,
        0xc084fc,
        selectedPlatform === 'both' ? 50 : 0,
        'CHRONICLE'
      );
      platformGroup.add(chronicleVis.group);
    }
    
    if (selectedPlatform === 'both' && complianceData.combined_compliance) {
      const bothCompliance = complianceData.combined_compliance.both_platforms.percentage;
      
      for (let i = 0; i < 20; i++) {
        const bridgeGeometry = new THREE.CylinderGeometry(
          2 - i * 0.08,
          2 - i * 0.08,
          100,
          16
        );
        const bridgeMaterial = new THREE.MeshPhongMaterial({
          color: 0xff00ff,
          emissive: 0xff00ff,
          emissiveIntensity: 0.1 * (bothCompliance / 100),
          transparent: true,
          opacity: (bothCompliance / 100) * (1 - i / 20),
          metalness: 0.9,
          roughness: 0.1
        });
        const bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
        bridge.rotation.z = Math.PI / 2;
        bridge.position.y = 25 + i * 2;
        platformGroup.add(bridge);
      }
    }
    
    scene.add(platformGroup);
    
    const noncompliantHosts = complianceData.combined_compliance?.neither_platform.host_count || 0;
    const particleCount = Math.min(2000, Math.floor(noncompliantHosts / 50));
    
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      const radius = 100 + Math.random() * 100;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = radius * Math.cos(phi);
      
      const colorChoice = Math.random();
      if (colorChoice < 0.33) {
        colors[i] = 1; colors[i + 1] = 0; colors[i + 2] = 1;
      } else if (colorChoice < 0.66) {
        colors[i] = 0.75; colors[i + 1] = 0.52; colors[i + 2] = 0.99;
      } else {
        colors[i] = 0; colors[i + 1] = 0.83; colors[i + 2] = 1;
      }
      
      sizes[i / 3] = Math.random() * 3 + 1;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const particlesMaterial = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);
    
    const ambientLight = new THREE.AmbientLight(0x0a0a0a);
    scene.add(ambientLight);
    
    const pointLight1 = new THREE.PointLight(0x00d4ff, 2, 300);
    pointLight1.position.set(100, 100, 100);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0xc084fc, 2, 300);
    pointLight2.position.set(-100, 100, -100);
    scene.add(pointLight2);
    
    const pointLight3 = new THREE.PointLight(0xff00ff, 1, 200);
    pointLight3.position.set(0, 150, 0);
    scene.add(pointLight3);
    
    camera.position.set(0, 120, 200);
    camera.lookAt(0, 30, 0);
    
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    const handleMouseMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(platformGroup.children, true);
      
      if (intersects.length > 0) {
        const object = intersects[0].object;
        if (object.userData.platform) {
          setHoveredMetric({
            platform: object.userData.platform,
            percentage: object.userData.percentage,
            isCompliant: object.userData.isCompliant
          });
        }
      } else {
        setHoveredMetric(null);
      }
      
      if (isDragging) {
        const deltaX = event.clientX - dragStart.x;
        const deltaY = event.clientY - dragStart.y;
        setRotation({
          x: rotation.x + deltaY * 0.01,
          y: rotation.y + deltaX * 0.01
        });
        setDragStart({ x: event.clientX, y: event.clientY });
      }
    };
    
    const handleMouseDown = (event: MouseEvent) => {
      setIsDragging(true);
      setDragStart({ x: event.clientX, y: event.clientY });
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY * -0.001;
      setZoomLevel(prev => Math.max(0.5, Math.min(3, prev + delta)));
    };
    
    const handleClick = (event: MouseEvent) => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(platformGroup.children, true);
      
      if (intersects.length > 0) {
        const object = intersects[0].object;
        if (object.userData.platform) {
          const platform = object.userData.platform.toLowerCase();
          const data = platform === 'splunk' ? complianceData.splunk_compliance : complianceData.chronicle_compliance;
          setSelectedDetail({
            platform: object.userData.platform,
            data: data
          });
        }
      }
    };
    
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('wheel', handleWheel);
    renderer.domElement.addEventListener('click', handleClick);
    
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      platformGroup.rotation.y = rotation.y;
      platformGroup.rotation.x = rotation.x * 0.3;
      
      if (splunkVis) {
        splunkVis.pulseRing.scale.setScalar(1.2 + Math.sin(Date.now() * 0.003) * 0.1);
        splunkVis.pulseRing.material.opacity = 0.1 + Math.sin(Date.now() * 0.003) * 0.05;
      }
      
      if (chronicleVis) {
        chronicleVis.pulseRing.scale.setScalar(1.2 + Math.cos(Date.now() * 0.003) * 0.1);
        chronicleVis.pulseRing.material.opacity = 0.1 + Math.cos(Date.now() * 0.003) * 0.05;
      }
      
      particles.rotation.y += 0.001;
      particles.rotation.x += 0.0005;
      
      camera.position.z = 200 / zoomLevel;
      camera.position.y = 120 / zoomLevel;
      camera.lookAt(0, 30, 0);
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    return () => {
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      renderer.domElement.removeEventListener('click', handleClick);
      if (frameId) cancelAnimationFrame(frameId);
      if (matrixRef.current && renderer.domElement) {
        matrixRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [complianceData, selectedPlatform, rotation, zoomLevel, isDragging, dragStart]);
  
  useEffect(() => {
    const canvas = flowRef.current;
    if (!canvas || !complianceData) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    let animationTime = 0;
    
    const animate = () => {
      animationTime += 0.02;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const centerY = canvas.height / 2;
      const amplitude = 40;
      
      if (selectedPlatform === 'splunk' || selectedPlatform === 'both') {
        const splunkCompliance = complianceData.splunk_compliance.compliance_percentage;
        const splunkWidth = (canvas.width * 0.9) * (splunkCompliance / 100);
        
        for (let x = 0; x < splunkWidth; x += 2) {
          const y = centerY - 30 + Math.sin((x / 50) + animationTime) * amplitude * (splunkCompliance / 100);
          
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, 10);
          gradient.addColorStop(0, 'rgba(0, 212, 255, 0.8)');
          gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00d4ff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        for (let x = 0; x < splunkWidth; x++) {
          const y = centerY - 30 + Math.sin((x / 50) + animationTime) * amplitude * (splunkCompliance / 100);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('SPLUNK', 10, centerY - 50);
        
        ctx.fillStyle = '#00d4ff';
        ctx.font = 'bold 20px monospace';
        ctx.fillText(`${splunkCompliance.toFixed(1)}%`, canvas.width - 80, centerY - 30);
      }
      
      if (selectedPlatform === 'chronicle' || selectedPlatform === 'both') {
        const chronicleCompliance = complianceData.chronicle_compliance.compliance_percentage;
        const chronicleWidth = (canvas.width * 0.9) * (chronicleCompliance / 100);
        
        for (let x = 0; x < chronicleWidth; x += 2) {
          const y = centerY + 30 + Math.sin((x / 50) + animationTime + Math.PI) * amplitude * (chronicleCompliance / 100);
          
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, 10);
          gradient.addColorStop(0, 'rgba(192, 132, 252, 0.8)');
          gradient.addColorStop(1, 'rgba(192, 132, 252, 0)');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        for (let x = 0; x < chronicleWidth; x++) {
          const y = centerY + 30 + Math.sin((x / 50) + animationTime + Math.PI) * amplitude * (chronicleCompliance / 100);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('CHRONICLE', 10, centerY + 50);
        
        ctx.fillStyle = '#c084fc';
        ctx.font = 'bold 20px monospace';
        ctx.fillText(`${chronicleCompliance.toFixed(1)}%`, canvas.width - 80, centerY + 30);
      }
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }, [complianceData, selectedPlatform]);
  
  useEffect(() => {
    const canvas = waveRef.current;
    if (!canvas || !complianceData) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    let time = 0;
    
    const animate = () => {
      time += 0.02;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const splunkCompliance = complianceData.splunk_compliance.compliance_percentage;
      const chronicleCompliance = complianceData.chronicle_compliance.compliance_percentage;
      const bothCompliance = complianceData.combined_compliance.both_platforms.percentage;
      
      for (let i = 0; i < 3; i++) {
        const offset = i * 20;
        
        ctx.strokeStyle = i === 0 ? '#00d4ff' : i === 1 ? '#c084fc' : '#ff00ff';
        ctx.lineWidth = 3 - i;
        ctx.globalAlpha = 1 - i * 0.3;
        
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x++) {
          const compliance = i === 0 ? splunkCompliance : i === 1 ? chronicleCompliance : bothCompliance;
          const y = canvas.height / 2 + 
                   Math.sin((x / 60) + time + i) * (compliance / 3) +
                   Math.sin((x / 30) + time * 2 + i) * 10 +
                   offset;
          
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      
      ctx.globalAlpha = 1;
      requestAnimationFrame(animate);
    };
    
    animate();
  }, [complianceData]);
  
  useEffect(() => {
    const canvas = radarRef.current;
    if (!canvas || !complianceData) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) - 30;
    
    let sweepAngle = 0;
    let detectedPoints: any[] = [];
    
    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 1; i <= 5; i++) {
        ctx.strokeStyle = `rgba(0, 212, 255, ${0.1 * (6 - i) / 5})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, (maxRadius / 5) * i, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        ctx.strokeStyle = 'rgba(192, 132, 252, 0.1)';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + Math.cos(angle) * maxRadius,
          centerY + Math.sin(angle) * maxRadius
        );
        ctx.stroke();
      }
      
      sweepAngle += 0.02;
      
      const gradient = ctx.createLinearGradient(
        centerX, centerY,
        centerX + Math.cos(sweepAngle) * maxRadius,
        centerY + Math.sin(sweepAngle) * maxRadius
      );
      gradient.addColorStop(0, 'rgba(0, 212, 255, 0)');
      gradient.addColorStop(0.5, 'rgba(0, 212, 255, 0.3)');
      gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00d4ff';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(sweepAngle) * maxRadius,
        centerY + Math.sin(sweepAngle) * maxRadius
      );
      ctx.stroke();
      ctx.shadowBlur = 0;
      
      if (Math.random() > 0.95) {
        detectedPoints.push({
          x: centerX + Math.cos(sweepAngle) * (Math.random() * maxRadius),
          y: centerY + Math.sin(sweepAngle) * (Math.random() * maxRadius),
          age: 0
        });
      }
      
      detectedPoints = detectedPoints.filter(point => {
        point.age++;
        const opacity = Math.max(0, 1 - point.age / 60);
        
        if (opacity > 0) {
          const size = 5 + point.age * 0.5;
          ctx.strokeStyle = `rgba(255, 0, 255, ${opacity})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
          ctx.stroke();
          
          ctx.fillStyle = `rgba(255, 0, 255, ${opacity * 0.5})`;
          ctx.beginPath();
          ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
          ctx.fill();
          
          return true;
        }
        return false;
      });
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }, [complianceData]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="relative">
          <div className="w-32 h-32 border-4 border-transparent border-t-cyan-400 border-r-purple-400 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-32 h-32 border-4 border-transparent border-b-pink-400 border-l-cyan-400 rounded-full animate-spin-reverse"></div>
          <div className="absolute inset-4 w-24 h-24 border-4 border-transparent border-t-purple-400 rounded-full animate-pulse"></div>
        </div>
      </div>
    );
  }
  
  if (!complianceData) return null;
  
  const overallCompliance = complianceData.combined_compliance?.either_platform.percentage || 0;
  const bothPlatforms = complianceData.combined_compliance?.both_platforms.percentage || 0;
  const neitherPlatform = complianceData.combined_compliance?.neither_platform.percentage || 0;
  const overallStatus = complianceData.combined_compliance?.overall_status || 'CRITICAL';
  
  return (
    <div className="h-full bg-black overflow-hidden p-3">
      {overallStatus === 'CRITICAL' && (
        <div className="mb-2 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-500/20 to-transparent animate-pulse"></div>
          <div className="relative bg-black border border-pink-500/50 rounded-lg p-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-pink-400 animate-pulse" />
              <span className="text-pink-400 font-bold text-xs">CRITICAL:</span>
              <span className="text-white text-xs">
                {neitherPlatform.toFixed(1)}% of hosts not logging to any platform
              </span>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-12 gap-3 h-[calc(100%-3rem)]">
        <div className="col-span-8">
          <div className="h-full bg-black border border-cyan-400/20 rounded-xl relative group">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative h-full flex flex-col">
              <div className="p-3 border-b border-cyan-400/20">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold">
                    <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                      LOGGING COMPLIANCE MATRIX
                    </span>
                  </h2>
                  <div className="flex gap-2">
                    {['both', 'splunk', 'chronicle'].map(platform => (
                      <button
                        key={platform}
                        onClick={() => setSelectedPlatform(platform as any)}
                        className={`px-3 py-1 rounded text-xs font-bold transition-all border ${
                          selectedPlatform === platform
                            ? 'bg-cyan-400/20 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(0,212,255,0.5)]'
                            : 'bg-black border-white/20 text-white/60 hover:border-white/40'
                        }`}
                      >
                        {platform.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div ref={matrixRef} className="flex-1 relative">
                {hoveredMetric && (
                  <div className="absolute top-4 left-4 bg-black/90 backdrop-blur-xl border border-cyan-400/50 rounded-lg p-3 z-10 pointer-events-none">
                    <div className="text-cyan-400 font-bold text-sm">{hoveredMetric.platform}</div>
                    <div className="text-white text-xs mt-1">{hoveredMetric.percentage?.toFixed(1)}% Compliant</div>
                    <div className="text-xs text-white/60 mt-1">Click for details</div>
                  </div>
                )}
                
                <div className="absolute bottom-4 right-4 text-xs text-white/40 z-10">
                  <div className="flex items-center gap-2">
                    <Radar className="w-3 h-3" />
                    <span>DRAG TO ROTATE • SCROLL TO ZOOM • CLICK FOR DETAILS</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-span-4 space-y-3">
          <div className="bg-black border border-purple-400/20 rounded-xl p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 to-transparent"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-purple-400">COMPLIANCE OVERVIEW</h3>
                <Shield className="w-4 h-4 text-cyan-400" />
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-white/60">OVERALL</span>
                    <span className="text-2xl font-bold text-cyan-400">{overallCompliance.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 transition-all duration-1000 shadow-[0_0_10px_currentColor]"
                      style={{ width: `${overallCompliance}%` }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <div className="text-xs text-white/40">BOTH</div>
                    <div className="text-lg font-bold text-cyan-400">{bothPlatforms.toFixed(0)}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-white/40">EITHER</div>
                    <div className="text-lg font-bold text-purple-400">{overallCompliance.toFixed(0)}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-white/40">NEITHER</div>
                    <div className="text-lg font-bold text-pink-400">{neitherPlatform.toFixed(0)}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-black border border-cyan-400/20 rounded-xl p-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 to-transparent"></div>
            <div className="relative">
              <h3 className="text-xs font-bold text-purple-400 mb-2">PLATFORM COMPLIANCE FLOW</h3>
              <canvas ref={flowRef} className="w-full h-32" />
            </div>
          </div>
          
          <div className="bg-black border border-purple-400/20 rounded-xl p-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 to-transparent"></div>
            <div className="relative">
              <h3 className="text-xs font-bold text-cyan-400 mb-2">COMPLIANCE PULSE</h3>
              <canvas ref={waveRef} className="w-full h-20" />
            </div>
          </div>
          
          <div className="bg-black border border-pink-400/20 rounded-xl p-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-400/5 to-transparent"></div>
            <div className="relative">
              <h3 className="text-xs font-bold text-pink-400 mb-2">THREAT DETECTION RADAR</h3>
              <canvas ref={radarRef} className="w-full h-32" />
            </div>
          </div>
          
          {selectedDetail && (
            <div className="bg-black border border-cyan-400/30 rounded-xl p-3 relative">
              <button 
                onClick={() => setSelectedDetail(null)}
                className="absolute top-2 right-2 text-white/40 hover:text-white"
              >
                <XCircle className="w-4 h-4" />
              </button>
              <h3 className="text-xs font-bold text-cyan-400 mb-2">{selectedDetail.platform} DETAILS</h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/60">Compliant Hosts</span>
                  <span className="text-cyan-400">{selectedDetail.data.compliant_hosts?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Non-Compliant</span>
                  <span className="text-pink-400">{selectedDetail.data.non_compliant_hosts?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Compliance</span>
                  <span className="text-purple-400">{selectedDetail.data.compliance_percentage?.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Status</span>
                  <span className={`font-bold ${
                    selectedDetail.data.status === 'CRITICAL' ? 'text-pink-400' :
                    selectedDetail.data.status === 'WARNING' ? 'text-purple-400' :
                    'text-cyan-400'
                  }`}>
                    {selectedDetail.data.status}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplianceMatrix;