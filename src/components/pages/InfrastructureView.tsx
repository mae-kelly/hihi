import React, { useState, useEffect, useRef } from 'react';
import { Server, Cloud, Database, Network, Eye, AlertTriangle, Activity, Layers, HardDrive, Wifi, Globe, Shield, Cpu, Monitor, Router, Zap, Binary, Lock, Target } from 'lucide-react';
import * as THREE from 'three';

const InfrastructureView: React.FC = () => {
  const [infrastructureData, setInfrastructureData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [hoveredInfra, setHoveredInfra] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotationSpeed, setRotationSpeed] = useState(0.001);
  const [selectedMetric, setSelectedMetric] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const stackRef = useRef<HTMLDivElement>(null);
  const matrixRef = useRef<HTMLCanvasElement>(null);
  const radarRef = useRef<HTMLCanvasElement>(null);
  const networkRef = useRef<HTMLCanvasElement>(null);
  const flowRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const nodesRef = useRef<THREE.Group[]>([]);
  const selectedNodeRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/infrastructure_visibility');
        if (!response.ok) throw new Error('Failed to fetch infrastructure data');
        const data = await response.json();
        setInfrastructureData(data);
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
    if (!stackRef.current || !infrastructureData) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x000000, 0.0008);
    
    const camera = new THREE.PerspectiveCamera(
      60, 
      stackRef.current.clientWidth / stackRef.current.clientHeight, 
      0.1, 
      2000
    );
    cameraRef.current = camera;
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    rendererRef.current = renderer;
    
    renderer.setSize(stackRef.current.clientWidth, stackRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    stackRef.current.appendChild(renderer.domElement);

    const layers: THREE.Group[] = [];
    nodesRef.current = [];
    
    const infrastructureTypes = infrastructureData.detailed_breakdown || [];
    const maxHosts = Math.max(...infrastructureTypes.map((t: any) => t.total_hosts));
    
    const createInteractiveLayer = (infra: any, index: number) => {
      const layerGroup = new THREE.Group();
      
      const width = 150 * (infra.total_hosts / maxHosts);
      const height = 20;
      const depth = 100;
      
      const geometry = new THREE.BoxGeometry(width, height, depth);
      const edges = new THREE.EdgesGeometry(geometry);
      const edgeMaterial = new THREE.LineBasicMaterial({
        color: infra.status === 'CRITICAL' ? 0xff00ff : 
               infra.status === 'WARNING' ? 0xc084fc : 0x00d4ff,
        linewidth: 2
      });
      const edgeMesh = new THREE.LineSegments(edges, edgeMaterial);
      
      const material = new THREE.MeshPhongMaterial({
        color: infra.status === 'CRITICAL' ? 0xff00ff : 
               infra.status === 'WARNING' ? 0xc084fc : 0x00d4ff,
        transparent: true,
        opacity: 0.3,
        emissive: infra.status === 'CRITICAL' ? 0xff00ff : 0x00d4ff,
        emissiveIntensity: 0.1,
        side: THREE.DoubleSide
      });
      
      const platform = new THREE.Mesh(geometry, material);
      platform.position.y = index * 40 - 100;
      platform.userData = infra;
      layerGroup.add(platform);
      layerGroup.add(edgeMesh);
      
      const visibleWidth = width * (infra.visibility_percentage / 100);
      const visGeometry = new THREE.BoxGeometry(visibleWidth, height - 4, depth - 10);
      const visMaterial = new THREE.MeshPhongMaterial({
        color: 0x00d4ff,
        emissive: 0x00d4ff,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.8
      });
      
      const visLayer = new THREE.Mesh(visGeometry, visMaterial);
      visLayer.position.y = platform.position.y;
      visLayer.position.x = -(width - visibleWidth) / 2;
      visLayer.userData = infra;
      layerGroup.add(visLayer);
      
      if (infra.status === 'CRITICAL') {
        const pulseGeometry = new THREE.RingGeometry(width/2, width/2 + 10, 32);
        const pulseMaterial = new THREE.MeshBasicMaterial({
          color: 0xff00ff,
          transparent: true,
          opacity: 0.3,
          side: THREE.DoubleSide
        });
        const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
        pulse.rotation.x = Math.PI / 2;
        pulse.position.y = platform.position.y;
        pulse.userData = { isPulse: true, baseScale: 1 };
        layerGroup.add(pulse);
      }
      
      const particleCount = Math.floor(infra.invisible_hosts / 100);
      if (particleCount > 0) {
        const particlesGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i += 3) {
          positions[i] = (Math.random() - 0.5) * width * 1.5;
          positions[i + 1] = platform.position.y + (Math.random() - 0.5) * 20;
          positions[i + 2] = (Math.random() - 0.5) * depth * 1.5;
        }
        
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particlesMaterial = new THREE.PointsMaterial({
          color: 0xff00ff,
          size: 2,
          transparent: true,
          opacity: 0.6,
          blending: THREE.AdditiveBlending
        });
        const particles = new THREE.Points(particlesGeometry, particlesMaterial);
        particles.userData = { isParticle: true };
        layerGroup.add(particles);
      }
      
      for (let i = 0; i < 3; i++) {
        const connectorGeometry = new THREE.CylinderGeometry(0.5, 0.5, 20, 8);
        const connectorMaterial = new THREE.MeshPhongMaterial({
          color: 0x00d4ff,
          emissive: 0x00d4ff,
          emissiveIntensity: 0.3,
          transparent: true,
          opacity: 0.6
        });
        const connector = new THREE.Mesh(connectorGeometry, connectorMaterial);
        connector.position.set(
          (Math.random() - 0.5) * width * 0.8,
          platform.position.y + height/2 + 10,
          (Math.random() - 0.5) * depth * 0.8
        );
        layerGroup.add(connector);
      }
      
      layerGroup.userData = infra;
      nodesRef.current.push(layerGroup);
      layers.push(layerGroup);
      scene.add(layerGroup);
    };
    
    infrastructureTypes.forEach((infra: any, index: number) => {
      createInteractiveLayer(infra, index);
    });

    const globalParticleCount = 2000;
    const globalGeometry = new THREE.BufferGeometry();
    const globalPositions = new Float32Array(globalParticleCount * 3);
    const globalColors = new Float32Array(globalParticleCount * 3);
    const globalSizes = new Float32Array(globalParticleCount);
    
    for (let i = 0; i < globalParticleCount; i++) {
      globalPositions[i * 3] = (Math.random() - 0.5) * 500;
      globalPositions[i * 3 + 1] = (Math.random() - 0.5) * 400;
      globalPositions[i * 3 + 2] = (Math.random() - 0.5) * 500;
      
      const isVisible = Math.random() > 0.5;
      if (isVisible) {
        globalColors[i * 3] = 0;
        globalColors[i * 3 + 1] = 0.83;
        globalColors[i * 3 + 2] = 1;
      } else {
        globalColors[i * 3] = 1;
        globalColors[i * 3 + 1] = 0;
        globalColors[i * 3 + 2] = 1;
      }
      
      globalSizes[i] = Math.random() * 2 + 0.5;
    }
    
    globalGeometry.setAttribute('position', new THREE.BufferAttribute(globalPositions, 3));
    globalGeometry.setAttribute('color', new THREE.BufferAttribute(globalColors, 3));
    globalGeometry.setAttribute('size', new THREE.BufferAttribute(globalSizes, 1));
    
    const globalMaterial = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    
    const globalParticles = new THREE.Points(globalGeometry, globalMaterial);
    scene.add(globalParticles);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    
    const light1 = new THREE.PointLight(0x00d4ff, 2, 500);
    light1.position.set(200, 150, 150);
    scene.add(light1);
    
    const light2 = new THREE.PointLight(0xff00ff, 1.5, 500);
    light2.position.set(-200, -100, 150);
    scene.add(light2);
    
    const light3 = new THREE.DirectionalLight(0xc084fc, 0.5);
    light3.position.set(0, 200, 100);
    scene.add(light3);

    camera.position.set(0, 0, 350);
    camera.lookAt(0, 0, 0);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    const handleClick = (event: MouseEvent) => {
      const rect = stackRef.current!.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      
      if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        if (clickedObject.userData && clickedObject.userData.infrastructure_type) {
          setSelectedType(clickedObject.userData.infrastructure_type);
          setSelectedMetric(clickedObject.userData);
          
          if (selectedNodeRef.current) {
            selectedNodeRef.current.material.emissiveIntensity = 0.1;
          }
          if (clickedObject instanceof THREE.Mesh) {
            clickedObject.material.emissiveIntensity = 0.6;
            selectedNodeRef.current = clickedObject;
          }
        }
      }
    };
    
    const handleMouseMove = (event: MouseEvent) => {
      const rect = stackRef.current!.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      
      if (intersects.length > 0 && intersects[0].object.userData.infrastructure_type) {
        setHoveredInfra(intersects[0].object.userData.infrastructure_type);
        renderer.domElement.style.cursor = 'pointer';
      } else {
        setHoveredInfra(null);
        renderer.domElement.style.cursor = 'move';
      }
    };
    
    const handleMouseDown = (e: MouseEvent) => {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    const handleMouseDrag = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      setRotation({
        x: rotation.x + deltaY * 0.01,
        y: rotation.y + deltaX * 0.01
      });
      
      setDragStart({ x: e.clientX, y: e.clientY });
    };
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoomLevel(prev => Math.max(0.5, Math.min(3, prev + e.deltaY * -0.001)));
    };
    
    renderer.domElement.addEventListener('click', handleClick);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('mousemove', handleMouseDrag);
    renderer.domElement.addEventListener('wheel', handleWheel);

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      layers.forEach((layer, index) => {
        layer.rotation.y += rotationSpeed * (index + 1);
        layer.position.x = Math.sin(Date.now() * 0.0003 + index) * 10;
        
        layer.children.forEach((child: any) => {
          if (child.userData?.isPulse) {
            const scale = 1 + Math.sin(Date.now() * 0.003) * 0.2;
            child.scale.set(scale, scale, 1);
            child.material.opacity = 0.3 + Math.sin(Date.now() * 0.003) * 0.2;
          }
          if (child.userData?.isParticle) {
            child.rotation.y += 0.002;
          }
        });
      });
      
      globalParticles.rotation.y += 0.0005;
      
      const time = Date.now() * 0.0002;
      camera.position.x = Math.sin(time + rotation.y) * 300 * zoomLevel;
      camera.position.z = Math.cos(time + rotation.y) * 300 * zoomLevel;
      camera.position.y = 50 + Math.sin(time * 2) * 30 + rotation.x * 50;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
    };
    
    animate();

    const handleResize = () => {
      if (!stackRef.current || !camera || !renderer) return;
      camera.aspect = stackRef.current.clientWidth / stackRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(stackRef.current.clientWidth, stackRef.current.clientHeight);
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', handleClick);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('mousemove', handleMouseDrag);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      if (frameId) cancelAnimationFrame(frameId);
      if (stackRef.current && renderer.domElement) {
        stackRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [infrastructureData, zoomLevel, rotationSpeed, isDragging, rotation]);

  useEffect(() => {
    const canvas = matrixRef.current;
    if (!canvas || !infrastructureData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const logTypes = ['System', 'Application', 'Security', 'Network', 'Cloud', 'Container', 'Database'];
    const colors = ['#00d4ff', '#c084fc', '#ff00ff', '#00d4ff', '#c084fc', '#ff00ff', '#00d4ff'];

    let time = 0;
    const animate = () => {
      time += 0.02;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const infrastructureTypes = infrastructureData.detailed_breakdown || [];
      const cellWidth = canvas.width / logTypes.length;
      const cellHeight = canvas.height / Math.min(infrastructureTypes.length, 8);

      infrastructureTypes.slice(0, 8).forEach((infra: any, row: number) => {
        logTypes.forEach((logType, col: number) => {
          const x = col * cellWidth;
          const y = row * cellHeight;
          
          const visibility = Math.random() * infra.visibility_percentage;
          const intensity = visibility / 100;
          const pulse = Math.sin(time + row * 0.5 + col * 0.3) * 0.3 + 0.7;
          
          ctx.fillStyle = `rgba(${visibility < 30 ? '255, 0, 255' : '0, 212, 255'}, ${intensity * pulse * 0.4})`;
          ctx.fillRect(x + 2, y + 2, cellWidth - 4, cellHeight - 4);
          
          ctx.strokeStyle = colors[col] + '60';
          ctx.strokeRect(x, y, cellWidth, cellHeight);
          
          ctx.fillStyle = colors[col];
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${visibility.toFixed(0)}%`, x + cellWidth / 2, y + cellHeight / 2);
        });
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, [infrastructureData]);

  useEffect(() => {
    const canvas = radarRef.current;
    if (!canvas || !infrastructureData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 40;

    let sweepAngle = 0;
    let blipTrails: any[] = [];

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 1; i <= 4; i++) {
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, (radius / 4) * i, 0, Math.PI * 2);
        ctx.stroke();
      }

      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        ctx.strokeStyle = 'rgba(192, 132, 252, 0.1)';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
        ctx.stroke();
      }

      const categories = infrastructureData.category_summary || {};
      const categoryCount = Object.keys(categories).length;
      
      Object.entries(categories).forEach(([category, data]: [string, any], index) => {
        const startAngle = (index / categoryCount) * Math.PI * 2;
        const endAngle = ((index + 1) / categoryCount) * Math.PI * 2;
        const dataRadius = (data.visibility_percentage / 100) * radius;
        
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, dataRadius);
        gradient.addColorStop(0, data.status === 'CRITICAL' ? 'rgba(255, 0, 255, 0.4)' :
                                 data.status === 'WARNING' ? 'rgba(192, 132, 252, 0.4)' :
                                 'rgba(0, 212, 255, 0.4)');
        gradient.addColorStop(1, data.status === 'CRITICAL' ? 'rgba(255, 0, 255, 0.1)' :
                                 data.status === 'WARNING' ? 'rgba(192, 132, 252, 0.1)' :
                                 'rgba(0, 212, 255, 0.1)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, dataRadius, startAngle, endAngle);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = data.status === 'CRITICAL' ? '#ff00ff' :
                         data.status === 'WARNING' ? '#c084fc' : '#00d4ff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        const labelAngle = (startAngle + endAngle) / 2;
        const labelX = centerX + Math.cos(labelAngle) * (radius + 25);
        const labelY = centerY + Math.sin(labelAngle) * (radius + 25);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(category.substring(0, 12).toUpperCase(), labelX, labelY);
        
        ctx.fillStyle = data.status === 'CRITICAL' ? '#ff00ff' : '#00d4ff';
        ctx.font = '9px monospace';
        ctx.fillText(`${data.visibility_percentage.toFixed(1)}%`, labelX, labelY + 12);
      });

      sweepAngle += 0.02;
      const sweepGradient = ctx.createLinearGradient(
        centerX, centerY,
        centerX + Math.cos(sweepAngle) * radius,
        centerY + Math.sin(sweepAngle) * radius
      );
      sweepGradient.addColorStop(0, 'rgba(0, 212, 255, 0)');
      sweepGradient.addColorStop(0.7, 'rgba(0, 212, 255, 0.4)');
      sweepGradient.addColorStop(1, 'rgba(0, 212, 255, 0.8)');
      
      ctx.strokeStyle = sweepGradient;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(sweepAngle) * radius,
        centerY + Math.sin(sweepAngle) * radius
      );
      ctx.stroke();

      if (Math.random() > 0.95) {
        blipTrails.push({
          x: centerX + (Math.random() - 0.5) * radius * 1.8,
          y: centerY + (Math.random() - 0.5) * radius * 1.8,
          life: 1,
          color: Math.random() > 0.5 ? '#00d4ff' : '#ff00ff'
        });
      }
      
      blipTrails = blipTrails.filter(blip => {
        blip.life -= 0.02;
        if (blip.life <= 0) return false;
        
        ctx.fillStyle = blip.color + Math.floor(blip.life * 255).toString(16).padStart(2, '0');
        ctx.beginPath();
        ctx.arc(blip.x, blip.y, 3 * blip.life, 0, Math.PI * 2);
        ctx.fill();
        
        return true;
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, [infrastructureData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-center">
          <div className="relative">
            <div className="w-32 h-32 border-4 border-t-transparent border-r-transparent border-b-[#00d4ff] border-l-[#ff00ff] rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Server className="w-12 h-12 text-[#c084fc]" />
            </div>
          </div>
          <div className="mt-4 text-lg font-bold text-[#00d4ff] animate-pulse">ANALYZING INFRASTRUCTURE</div>
        </div>
      </div>
    );
  }

  if (!infrastructureData) return null;

  const getIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('cloud')) return Cloud;
    if (lower.includes('container') || lower.includes('docker') || lower.includes('kubernetes')) return Layers;
    if (lower.includes('virtual') || lower.includes('vmware')) return Server;
    if (lower.includes('physical')) return HardDrive;
    if (lower.includes('network')) return Network;
    return Database;
  };

  return (
    <div className="h-full flex flex-col p-6 bg-black overflow-hidden">
      {infrastructureData.overall_infrastructure_visibility < 30 && (
        <div className="mb-4 bg-black border border-[#ff00ff] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-[#ff00ff] animate-pulse" />
            <span className="text-[#ff00ff] font-bold">CRITICAL:</span>
            <span className="text-white">
              Infrastructure visibility at {infrastructureData.overall_infrastructure_visibility.toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 grid grid-cols-12 gap-4">
        <div className="col-span-7">
          <div className="h-full bg-black border border-[#00d4ff]/30 rounded-xl">
            <div className="p-4 border-b border-[#00d4ff]/20">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#00d4ff]">INFRASTRUCTURE STACK</h2>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.5))}
                    className="p-2 bg-black border border-[#00d4ff]/30 rounded hover:border-[#00d4ff] transition-colors"
                  >
                    <Zap className="w-4 h-4 text-[#00d4ff]" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(1)}
                    className="p-2 bg-black border border-[#c084fc]/30 rounded hover:border-[#c084fc] transition-colors"
                  >
                    <Target className="w-4 h-4 text-[#c084fc]" />
                  </button>
                  <button
                    onClick={() => setRotationSpeed(prev => prev === 0 ? 0.001 : 0)}
                    className="p-2 bg-black border border-[#ff00ff]/30 rounded hover:border-[#ff00ff] transition-colors"
                  >
                    <Lock className="w-4 h-4 text-[#ff00ff]" />
                  </button>
                </div>
              </div>
              {hoveredInfra && (
                <div className="mt-2 text-sm text-[#c084fc]">
                  Hovering: {hoveredInfra}
                </div>
              )}
            </div>
            
            <div ref={stackRef} className="w-full" style={{ height: 'calc(100% - 80px)', cursor: 'move' }} />
          </div>
        </div>

        <div className="col-span-5 space-y-4 overflow-y-auto">
          {selectedMetric && (
            <div className="bg-black border-2 border-[#00d4ff] rounded-xl p-4">
              <h3 className="text-sm font-bold text-[#00d4ff] mb-3">SELECTED INFRASTRUCTURE</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white text-sm">Type:</span>
                  <span className="text-[#c084fc] font-bold">{selectedMetric.infrastructure_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white text-sm">Visibility:</span>
                  <span className="text-[#00d4ff] font-bold">{selectedMetric.visibility_percentage?.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white text-sm">Total Hosts:</span>
                  <span className="text-white">{selectedMetric.total_hosts?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white text-sm">Visible:</span>
                  <span className="text-[#00d4ff]">{selectedMetric.visible_hosts?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white text-sm">Invisible:</span>
                  <span className="text-[#ff00ff]">{selectedMetric.invisible_hosts?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-black border border-[#c084fc]/30 rounded-xl p-3">
            <h3 className="text-sm font-bold text-[#c084fc] mb-2">LOG TYPE MATRIX</h3>
            <canvas ref={matrixRef} className="w-full h-40" />
          </div>

          <div className="bg-black border border-[#00d4ff]/30 rounded-xl p-3">
            <h3 className="text-sm font-bold text-[#00d4ff] mb-2">COVERAGE RADAR</h3>
            <canvas ref={radarRef} className="w-full h-48" />
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(infrastructureData.detailed_breakdown || []).map((infra: any) => {
              const Icon = getIcon(infra.infrastructure_type);
              
              return (
                <div
                  key={infra.infrastructure_type}
                  className={`bg-black border rounded-lg p-3 cursor-pointer transition-all hover:scale-[1.02] ${
                    selectedType === infra.infrastructure_type 
                      ? 'border-[#00d4ff]' 
                      : 'border-white/10 hover:border-[#c084fc]/50'
                  }`}
                  onClick={() => {
                    setSelectedType(infra.infrastructure_type);
                    setSelectedMetric(infra);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-[#00d4ff]" />
                      <div>
                        <div className="text-sm font-bold text-white">{infra.infrastructure_type}</div>
                        <div className="text-xs text-white/60">
                          {infra.total_hosts.toLocaleString()} hosts
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${
                        infra.status === 'CRITICAL' ? 'text-[#ff00ff]' :
                        infra.status === 'WARNING' ? 'text-[#c084fc]' :
                        'text-[#00d4ff]'
                      }`}>
                        {infra.visibility_percentage.toFixed(1)}%
                      </div>
                      <div className="text-xs text-white/60">visibility</div>
                    </div>
                  </div>
                  
                  <div className="mt-2 h-3 bg-black border border-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-1000"
                      style={{
                        width: `${infra.visibility_percentage}%`,
                        background: infra.status === 'CRITICAL' 
                          ? 'linear-gradient(90deg, #ff00ff, #c084fc)'
                          : 'linear-gradient(90deg, #00d4ff, #c084fc)'
                      }}
                    />
                  </div>
                  
                  <div className="mt-2 flex justify-between items-center">
                    <div className="flex gap-2">
                      <Eye className={`w-3 h-3 ${
                        infra.visibility_percentage > 60 ? 'text-[#00d4ff]' : 'text-white/30'
                      }`} />
                      <span className="text-xs text-[#00d4ff]">
                        {infra.visible_hosts.toLocaleString()} visible
                      </span>
                    </div>
                    <span className={`text-xs font-bold ${
                      infra.status === 'CRITICAL' ? 'text-[#ff00ff]' :
                      infra.status === 'WARNING' ? 'text-[#c084fc]' :
                      'text-[#00d4ff]'
                    }`}>
                      {infra.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfrastructureView;