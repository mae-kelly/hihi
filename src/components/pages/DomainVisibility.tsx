import React, { useState, useEffect, useRef } from 'react';
import { Globe, Shield, Database, Network, Server, Cloud, Activity, Lock, Eye, Layers, Zap, Wifi, Radio, Satellite, Radar, Target, Navigation, Circle, Binary, Cpu, AlertTriangle } from 'lucide-react';
import * as THREE from 'three';

const DomainVisibility: React.FC = () => {
  const [domainData, setDomainData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [hoveredDomain, setHoveredDomain] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotationSpeed, setRotationSpeed] = useState(0.001);
  const [viewMode, setViewMode] = useState<'network' | 'hierarchy' | 'matrix'>('network');
  const networkRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLCanvasElement>(null);
  const matrixRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/domain_visibility');
        if (!response.ok) throw new Error('Failed to fetch domain data');
        const data = await response.json();
        setDomainData(data);
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
    if (!networkRef.current || !domainData) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0008);

    const camera = new THREE.PerspectiveCamera(
      75,
      networkRef.current.clientWidth / networkRef.current.clientHeight,
      0.1,
      2000
    );

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance'
    });
    
    renderer.setSize(networkRef.current.clientWidth, networkRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    networkRef.current.appendChild(renderer.domElement);

    const centralCore = new THREE.Group();
    
    const coreGeometry = new THREE.IcosahedronGeometry(20, 3);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: 0x00d4ff,
      emissive: 0x00d4ff,
      emissiveIntensity: 0.4,
      wireframe: true,
      transparent: true,
      opacity: 0.9
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    centralCore.add(core);

    const innerCoreGeometry = new THREE.SphereGeometry(15, 32, 32);
    const innerCoreMaterial = new THREE.MeshPhongMaterial({
      color: 0xa855f7,
      emissive: 0xa855f7,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.7
    });
    const innerCore = new THREE.Mesh(innerCoreGeometry, innerCoreMaterial);
    centralCore.add(innerCore);

    scene.add(centralCore);

    const domains = domainData.domain_breakdown || [];
    const domainNodes: THREE.Group[] = [];
    const connections: THREE.Line[] = [];
    const dataFlows: THREE.Points[] = [];
    
    const tdcDomains = domains.filter((d: any) => d.domain && d.domain.toLowerCase().includes('tdc'));
    const leadDomains = domains.filter((d: any) => d.domain && (d.domain.toLowerCase().includes('lead') || d.domain.toLowerCase().includes('fead')));
    const otherDomains = domains.filter((d: any) => d.domain && !d.domain.toLowerCase().includes('tdc') && !d.domain.toLowerCase().includes('lead') && !d.domain.toLowerCase().includes('fead'));
    
    const allDomains = [...tdcDomains, ...leadDomains, ...otherDomains].slice(0, 20);
    
    allDomains.forEach((domain: any, index: number) => {
      const domainGroup = new THREE.Group();
      
      const angle = (index / allDomains.length) * Math.PI * 2;
      const radius = 100 + (index % 3) * 30;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = (Math.random() - 0.5) * 50;
      
      const nodeSize = 8 + Math.log(domain.total_hosts / 1000 + 1) * 5;
      
      const nodeGeometry = new THREE.OctahedronGeometry(nodeSize, 2);
      const isHealthy = domain.visibility_percentage > 70;
      const isWarning = domain.visibility_percentage > 40 && domain.visibility_percentage <= 70;
      
      const nodeMaterial = new THREE.MeshPhongMaterial({
        color: isHealthy ? 0x00d4ff : isWarning ? 0xc084fc : 0xff00ff,
        emissive: isHealthy ? 0x00d4ff : isWarning ? 0xc084fc : 0xff00ff,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.9
      });
      
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
      node.castShadow = true;
      node.receiveShadow = true;
      domainGroup.add(node);
      
      const visRadius = nodeSize * (domain.visibility_percentage / 100);
      const visGeometry = new THREE.SphereGeometry(visRadius, 24, 24);
      const visMaterial = new THREE.MeshPhongMaterial({
        color: 0x00d4ff,
        emissive: 0x00d4ff,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 1
      });
      const visSphere = new THREE.Mesh(visGeometry, visMaterial);
      domainGroup.add(visSphere);
      
      const ringCount = 3;
      for (let i = 0; i < ringCount; i++) {
        const ringGeometry = new THREE.TorusGeometry(nodeSize + i * 3, 0.3, 8, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: isHealthy ? 0x00d4ff : 0xff00ff,
          transparent: true,
          opacity: 0.3 - i * 0.1
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.random() * Math.PI;
        ring.rotation.y = Math.random() * Math.PI;
        domainGroup.add(ring);
      }
      
      const invisibleCount = Math.floor((domain.invisible_hosts / domain.total_hosts) * 100);
      const particlesGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(invisibleCount * 3);
      const colors = new Float32Array(invisibleCount * 3);
      
      for (let i = 0; i < invisibleCount * 3; i += 3) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const r = nodeSize + 5 + Math.random() * 15;
        
        positions[i] = r * Math.sin(phi) * Math.cos(theta);
        positions[i + 1] = r * Math.cos(phi);
        positions[i + 2] = r * Math.sin(phi) * Math.sin(theta);
        
        colors[i] = 1;
        colors[i + 1] = 0;
        colors[i + 2] = 1;
      }
      
      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      
      const particlesMaterial = new THREE.PointsMaterial({
        size: 1.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      });
      const particles = new THREE.Points(particlesGeometry, particlesMaterial);
      domainGroup.add(particles);
      
      domainGroup.position.set(x, y, z);
      domainGroup.userData = domain;
      domainNodes.push(domainGroup);
      scene.add(domainGroup);
      
      const curve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(x * 0.3, y + 20, z * 0.3),
        new THREE.Vector3(x * 0.7, y - 20, z * 0.7),
        new THREE.Vector3(x, y, z)
      );
      
      const points = curve.getPoints(50);
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      
      const lineMaterial = new THREE.LineBasicMaterial({
        color: domain.status === 'CRITICAL' ? 0xff00ff : 0x00d4ff,
        transparent: true,
        opacity: domain.visibility_percentage / 100,
        linewidth: 2
      });
      
      const line = new THREE.Line(lineGeometry, lineMaterial);
      connections.push(line);
      scene.add(line);
      
      const flowParticleCount = 20;
      const flowGeometry = new THREE.BufferGeometry();
      const flowPositions = new Float32Array(flowParticleCount * 3);
      
      for (let i = 0; i < flowParticleCount; i++) {
        const t = i / flowParticleCount;
        const point = curve.getPoint(t);
        flowPositions[i * 3] = point.x;
        flowPositions[i * 3 + 1] = point.y;
        flowPositions[i * 3 + 2] = point.z;
      }
      
      flowGeometry.setAttribute('position', new THREE.BufferAttribute(flowPositions, 3));
      
      const flowMaterial = new THREE.PointsMaterial({
        color: 0x00d4ff,
        size: 3,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      });
      
      const flowPoints = new THREE.Points(flowGeometry, flowMaterial);
      flowPoints.userData = { curve, particleCount: flowParticleCount };
      dataFlows.push(flowPoints);
      scene.add(flowPoints);
    });
    
    for (let i = 0; i < domainNodes.length - 1; i++) {
      for (let j = i + 1; j < Math.min(i + 3, domainNodes.length); j++) {
        const node1 = domainNodes[i];
        const node2 = domainNodes[j];
        
        const distance = node1.position.distanceTo(node2.position);
        if (distance < 200) {
          const midPoint = new THREE.Vector3().lerpVectors(node1.position, node2.position, 0.5);
          midPoint.y += 30;
          
          const curve = new THREE.QuadraticBezierCurve3(
            node1.position,
            midPoint,
            node2.position
          );
          
          const points = curve.getPoints(30);
          const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
          const lineMaterial = new THREE.LineBasicMaterial({
            color: 0xc084fc,
            transparent: true,
            opacity: 0.2,
            linewidth: 1
          });
          const line = new THREE.Line(lineGeometry, lineMaterial);
          scene.add(line);
        }
      }
    }
    
    const globalParticleCount = 2000;
    const globalGeometry = new THREE.BufferGeometry();
    const globalPositions = new Float32Array(globalParticleCount * 3);
    const globalColors = new Float32Array(globalParticleCount * 3);
    
    for (let i = 0; i < globalParticleCount * 3; i += 3) {
      globalPositions[i] = (Math.random() - 0.5) * 500;
      globalPositions[i + 1] = (Math.random() - 0.5) * 300;
      globalPositions[i + 2] = (Math.random() - 0.5) * 500;
      
      const isVisible = Math.random() > 0.3;
      if (isVisible) {
        globalColors[i] = 0;
        globalColors[i + 1] = 0.83;
        globalColors[i + 2] = 1;
      } else {
        globalColors[i] = 0.66;
        globalColors[i + 1] = 0.33;
        globalColors[i + 2] = 0.97;
      }
    }
    
    globalGeometry.setAttribute('position', new THREE.BufferAttribute(globalPositions, 3));
    globalGeometry.setAttribute('color', new THREE.BufferAttribute(globalColors, 3));
    
    const globalMaterial = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    });
    
    const globalParticles = new THREE.Points(globalGeometry, globalMaterial);
    scene.add(globalParticles);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    
    const pointLight1 = new THREE.PointLight(0x00d4ff, 2, 500);
    pointLight1.position.set(200, 200, 200);
    pointLight1.castShadow = true;
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0xff00ff, 1.5, 500);
    pointLight2.position.set(-200, -100, -200);
    scene.add(pointLight2);
    
    const spotLight = new THREE.SpotLight(0xc084fc, 1, 500, Math.PI / 6);
    spotLight.position.set(0, 300, 0);
    spotLight.target.position.set(0, 0, 0);
    scene.add(spotLight);

    camera.position.set(150, 100, 250);
    camera.lookAt(0, 0, 0);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    const handleMouseMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(domainNodes, true);
      
      if (intersects.length > 0) {
        const domain = intersects[0].object.parent?.userData || intersects[0].object.userData;
        if (domain && domain.domain) {
          setHoveredDomain(domain);
          renderer.domElement.style.cursor = 'pointer';
        }
      } else {
        setHoveredDomain(null);
        renderer.domElement.style.cursor = 'default';
      }
    };
    
    const handleClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(domainNodes, true);
      
      if (intersects.length > 0) {
        const domain = intersects[0].object.parent?.userData || intersects[0].object.userData;
        if (domain && domain.domain) {
          setSelectedDomain(domain.domain);
        }
      }
    };
    
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY * 0.01;
      setZoomLevel(prev => Math.max(0.5, Math.min(3, prev - delta)));
    };
    
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('click', handleClick);
    renderer.domElement.addEventListener('wheel', handleWheel);

    let frameId: number;
    let flowTime = 0;
    
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      flowTime += 0.01;
      
      core.rotation.x += 0.003;
      core.rotation.y += 0.005;
      innerCore.rotation.x -= 0.004;
      innerCore.rotation.y -= 0.006;
      
      const pulseScale = 1 + Math.sin(Date.now() * 0.001) * 0.05;
      innerCore.scale.setScalar(pulseScale);
      
      domainNodes.forEach((node, index) => {
        node.rotation.y += rotationSpeed * (index % 2 === 0 ? 1 : -1);
        node.position.y += Math.sin(Date.now() * 0.0005 + index) * 0.1;
        
        node.children.forEach((child: any, childIndex: number) => {
          if (child.geometry && child.geometry.type === 'TorusGeometry') {
            child.rotation.x += 0.01 * (childIndex + 1);
            child.rotation.y += 0.01 * (childIndex % 2 === 0 ? 1 : -1);
          }
        });
      });
      
      dataFlows.forEach((flow: any) => {
        const positions = flow.geometry.attributes.position.array;
        const curve = flow.userData.curve;
        const particleCount = flow.userData.particleCount;
        
        for (let i = 0; i < particleCount; i++) {
          const t = ((flowTime * 0.5 + i / particleCount) % 1);
          const point = curve.getPoint(t);
          positions[i * 3] = point.x;
          positions[i * 3 + 1] = point.y;
          positions[i * 3 + 2] = point.z;
        }
        
        flow.geometry.attributes.position.needsUpdate = true;
      });
      
      globalParticles.rotation.y += 0.0002;
      
      const time = Date.now() * 0.0003;
      const orbitRadius = 250 / zoomLevel;
      camera.position.x = Math.sin(time) * orbitRadius;
      camera.position.z = Math.cos(time) * orbitRadius;
      camera.position.y = 100 + Math.sin(time * 2) * 50;
      camera.lookAt(0, 0, 0);
      
      pointLight1.position.x = Math.sin(time * 2) * 200;
      pointLight1.position.z = Math.cos(time * 2) * 200;
      
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('click', handleClick);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      if (frameId) cancelAnimationFrame(frameId);
      if (networkRef.current && renderer.domElement) {
        networkRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [domainData, zoomLevel, rotationSpeed]);

  useEffect(() => {
    const canvas = flowRef.current;
    if (!canvas || !domainData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let time = 0;

    const animate = () => {
      time += 0.02;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const domains = domainData.domain_breakdown || [];
      const maxDomains = 15;
      const displayDomains = domains.slice(0, maxDomains);

      displayDomains.forEach((domain: any, index: number) => {
        const y = (index + 1) * (canvas.height / (maxDomains + 1));
        const barWidth = (canvas.width * 0.8) * (domain.visibility_percentage / 100);
        
        const gradient = ctx.createLinearGradient(0, y, barWidth, y);
        if (domain.status === 'CRITICAL') {
          gradient.addColorStop(0, '#ff00ff');
          gradient.addColorStop(0.5, '#c084fc');
          gradient.addColorStop(1, '#ff00ff40');
        } else if (domain.status === 'WARNING') {
          gradient.addColorStop(0, '#c084fc');
          gradient.addColorStop(0.5, '#a855f7');
          gradient.addColorStop(1, '#c084fc40');
        } else {
          gradient.addColorStop(0, '#00d4ff');
          gradient.addColorStop(0.5, '#0099ff');
          gradient.addColorStop(1, '#00d4ff40');
        }
        
        const waveOffset = Math.sin(time + index * 0.5) * 5;
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 15;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(10, y + waveOffset);
        
        for (let x = 10; x <= barWidth; x += 5) {
          const waveY = y + Math.sin((x / 30) + time) * 3 + waveOffset;
          ctx.lineTo(x, waveY);
        }
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.1)';
        ctx.lineWidth = 15;
        ctx.beginPath();
        ctx.moveTo(barWidth, y);
        ctx.lineTo(canvas.width * 0.8, y);
        ctx.stroke();
        
        ctx.shadowColor = domain.status === 'CRITICAL' ? '#ff00ff' : '#00d4ff';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(domain.domain.substring(0, 30), 15, y - 20);
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = domain.status === 'CRITICAL' ? '#ff00ff' : 
                       domain.status === 'WARNING' ? '#c084fc' : '#00d4ff';
        ctx.font = 'bold 14px monospace';
        ctx.fillText(`${domain.visibility_percentage.toFixed(1)}%`, barWidth + 15, y + 5);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '10px monospace';
        ctx.fillText(
          `${domain.visible_hosts.toLocaleString()} / ${domain.total_hosts.toLocaleString()}`,
          15,
          y + 20
        );
        
        const pulseRadius = 5 + Math.sin(time * 3 + index) * 2;
        ctx.beginPath();
        ctx.arc(barWidth, y, pulseRadius, 0, Math.PI * 2);
        ctx.strokeStyle = domain.status === 'CRITICAL' ? '#ff00ff' : '#00d4ff';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, [domainData]);

  useEffect(() => {
    const canvas = matrixRef.current;
    if (!canvas || !domainData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let time = 0;

    const animate = () => {
      time += 0.01;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cellSize = 30;
      const cols = Math.floor(canvas.width / cellSize);
      const rows = Math.floor(canvas.height / cellSize);

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * cellSize;
          const y = j * cellSize;
          
          const intensity = (Math.sin(time + i * 0.1) + Math.sin(time + j * 0.1)) * 0.5;
          const isActive = Math.random() > 0.95;
          
          if (isActive) {
            const isCritical = Math.random() > 0.7;
            ctx.fillStyle = isCritical ? 
              `rgba(255, 0, 255, ${0.3 + intensity * 0.5})` : 
              `rgba(0, 212, 255, ${0.3 + intensity * 0.5})`;
            ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
            
            ctx.strokeStyle = isCritical ? '#ff00ff' : '#00d4ff';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const value = Math.floor(Math.random() * 100);
            ctx.fillText(value.toString(), x + cellSize / 2, y + cellSize / 2);
          } else {
            ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x, y, cellSize, cellSize);
          }
        }
      }

      const scanLineY = (Math.sin(time) * 0.5 + 0.5) * canvas.height;
      const gradient = ctx.createLinearGradient(0, scanLineY - 10, 0, scanLineY + 10);
      gradient.addColorStop(0, 'rgba(0, 212, 255, 0)');
      gradient.addColorStop(0.5, 'rgba(0, 212, 255, 0.5)');
      gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, scanLineY - 10, canvas.width, 20);

      requestAnimationFrame(animate);
    };

    animate();
  }, [domainData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="relative">
          <div className="w-32 h-32 border-4 border-t-transparent border-b-transparent border-l-[#00d4ff] border-r-[#ff00ff] rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-32 h-32 border-4 border-t-transparent border-b-transparent border-l-[#c084fc] border-r-[#00d4ff] rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-xs font-bold text-white">SYNCING</div>
          </div>
        </div>
      </div>
    );
  }

  if (!domainData) return null;

  const tdcData = domainData.tdc_visibility || {};
  const leadData = domainData.lead_visibility || {};
  const overallVisibility = domainData.overall_domain_visibility || 0;
  const criticalDomains = domainData.critical_domains || [];

  return (
    <div className="h-full bg-black p-4 overflow-hidden">
      {criticalDomains.length > 3 && (
        <div className="mb-3 bg-black border border-[#ff00ff] rounded-lg p-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#ff00ff] animate-pulse" />
          <span className="text-[#ff00ff] font-bold text-xs uppercase">Alert:</span>
          <span className="text-white text-xs">{criticalDomains.length} Critical Domains Detected</span>
        </div>
      )}

      <div className="grid grid-cols-12 gap-3 h-[calc(100%-3rem)]">
        <div className="col-span-8">
          <div className="h-full bg-black border border-[#00d4ff]/30 rounded-xl overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 z-10 bg-black/80 backdrop-blur-xl border-b border-[#00d4ff]/30 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-[#00d4ff]">DOMAIN NETWORK TOPOLOGY</h2>
                  {hoveredDomain && (
                    <div className="text-xs text-white bg-black/60 px-2 py-1 rounded border border-[#c084fc]/50">
                      {hoveredDomain.domain} • {hoveredDomain.visibility_percentage?.toFixed(1)}% • {hoveredDomain.total_hosts?.toLocaleString()} hosts
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {['network', 'hierarchy', 'matrix'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode as any)}
                      className={`px-3 py-1 rounded text-xs font-bold uppercase transition-all ${
                        viewMode === mode
                          ? 'bg-[#00d4ff]/20 border border-[#00d4ff] text-[#00d4ff]'
                          : 'bg-black border border-white/20 text-white hover:border-[#c084fc]'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/60">Zoom</span>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={zoomLevel}
                    onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                    className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #00d4ff 0%, #00d4ff ${((zoomLevel - 0.5) / 2.5) * 100}%, rgba(255,255,255,0.2) ${((zoomLevel - 0.5) / 2.5) * 100}%, rgba(255,255,255,0.2) 100%)`
                    }}
                  />
                  <span className="text-xs text-[#00d4ff] font-mono">{(zoomLevel * 100).toFixed(0)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/60">Rotation</span>
                  <input
                    type="range"
                    min="0"
                    max="0.01"
                    step="0.001"
                    value={rotationSpeed}
                    onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
                    className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #c084fc 0%, #c084fc ${(rotationSpeed / 0.01) * 100}%, rgba(255,255,255,0.2) ${(rotationSpeed / 0.01) * 100}%, rgba(255,255,255,0.2) 100%)`
                    }}
                  />
                </div>
              </div>
            </div>
            <div ref={networkRef} className="w-full h-full" />
            
            {selectedDomain && (
              <div className="absolute bottom-4 left-4 right-4 bg-black/90 backdrop-blur-xl rounded-lg border border-[#00d4ff] p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-[#00d4ff]">{selectedDomain}</h3>
                  <button
                    onClick={() => setSelectedDomain(null)}
                    className="text-white/60 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {domainData.domain_breakdown?.find((d: any) => d.domain === selectedDomain) && (() => {
                    const domain = domainData.domain_breakdown.find((d: any) => d.domain === selectedDomain);
                    return (
                      <>
                        <div>
                          <span className="text-white/60">Visibility</span>
                          <div className="text-[#00d4ff] font-bold">{domain.visibility_percentage.toFixed(1)}%</div>
                        </div>
                        <div>
                          <span className="text-white/60">Total Hosts</span>
                          <div className="text-white font-bold">{domain.total_hosts.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-white/60">Status</span>
                          <div className={`font-bold ${
                            domain.status === 'CRITICAL' ? 'text-[#ff00ff]' :
                            domain.status === 'WARNING' ? 'text-[#c084fc]' : 'text-[#00d4ff]'
                          }`}>
                            {domain.status}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="col-span-4 space-y-3 overflow-y-auto">
          <div className="bg-black border border-[#c084fc]/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#c084fc]">OVERALL DOMAIN VISIBILITY</h3>
              <Globe className="w-4 h-4 text-[#c084fc]" />
            </div>
            <div className="text-4xl font-bold mb-2">
              <span className={overallVisibility < 40 ? 'text-[#ff00ff]' : overallVisibility < 70 ? 'text-[#c084fc]' : 'text-[#00d4ff]'}>
                {overallVisibility.toFixed(1)}%
              </span>
            </div>
            <div className="text-xs text-white/60">Across {domainData.total_domains || 0} domains</div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-black border border-[#00d4ff]/30 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <Network className="w-3 h-3 text-[#00d4ff]" />
                <span className={`text-xs px-2 py-0.5 rounded border ${
                  tdcData.status === 'CRITICAL' 
                    ? 'bg-[#ff00ff]/10 border-[#ff00ff] text-[#ff00ff]'
                    : tdcData.status === 'WARNING'
                    ? 'bg-[#c084fc]/10 border-[#c084fc] text-[#c084fc]'
                    : 'bg-[#00d4ff]/10 border-[#00d4ff] text-[#00d4ff]'
                }`}>
                  {tdcData.status || 'N/A'}
                </span>
              </div>
              <div className="text-xs font-bold text-white mb-1">TDC DOMAIN</div>
              <div className="text-2xl font-bold text-[#00d4ff]">
                {tdcData.visibility_percentage?.toFixed(1) || '0.0'}%
              </div>
              <div className="text-xs text-white/60">
                {tdcData.visible_hosts?.toLocaleString() || 0} / {tdcData.total_hosts?.toLocaleString() || 0}
              </div>
            </div>
            
            <div className="bg-black border border-[#c084fc]/30 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <Server className="w-3 h-3 text-[#c084fc]" />
                <span className={`text-xs px-2 py-0.5 rounded border ${
                  leadData.status === 'CRITICAL' 
                    ? 'bg-[#ff00ff]/10 border-[#ff00ff] text-[#ff00ff]'
                    : leadData.status === 'WARNING'
                    ? 'bg-[#c084fc]/10 border-[#c084fc] text-[#c084fc]'
                    : 'bg-[#00d4ff]/10 border-[#00d4ff] text-[#00d4ff]'
                }`}>
                  {leadData.status || 'N/A'}
                </span>
              </div>
              <div className="text-xs font-bold text-white mb-1">LEAD/FEAD</div>
              <div className="text-2xl font-bold text-[#c084fc]">
                {leadData.visibility_percentage?.toFixed(1) || '0.0'}%
              </div>
              <div className="text-xs text-white/60">
                {leadData.visible_hosts?.toLocaleString() || 0} / {leadData.total_hosts?.toLocaleString() || 0}
              </div>
            </div>
          </div>

          <div className="bg-black border border-[#00d4ff]/30 rounded-xl p-3">
            <h3 className="text-sm font-bold text-[#00d4ff] mb-2">DOMAIN FLOW ANALYSIS</h3>
            <canvas ref={flowRef} className="w-full h-48" />
          </div>

          <div className="bg-black border border-[#ff00ff]/30 rounded-xl p-3">
            <h3 className="text-sm font-bold text-[#ff00ff] mb-2">SECURITY MATRIX</h3>
            <canvas ref={matrixRef} className="w-full h-32" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DomainVisibility;