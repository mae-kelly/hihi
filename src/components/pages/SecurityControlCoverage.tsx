import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Activity, Lock, Eye, Zap, Database, Server, Network, Target, Radar, Layers, Binary, Fingerprint, Cpu, GitBranch, Wifi, Radio, Satellite } from 'lucide-react';
import * as THREE from 'three';

const SecurityControlCoverage: React.FC = () => {
  const [securityData, setSecurityData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedControl, setSelectedControl] = useState<string>('all');
  const [hoveredControl, setHoveredControl] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<any>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotationSpeed, setRotationSpeed] = useState(0.002);
  const [interactionMode, setInteractionMode] = useState<'rotate' | 'explore'>('rotate');
  
  const fortressRef = useRef<HTMLDivElement>(null);
  const coverageRef = useRef<HTMLCanvasElement>(null);
  const threatRef = useRef<HTMLCanvasElement>(null);
  const radarRef = useRef<HTMLCanvasElement>(null);
  const matrixRef = useRef<HTMLCanvasElement>(null);
  
  const mouseRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const selectedObjectRef = useRef<THREE.Object3D | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/security_control_coverage');
        if (!response.ok) throw new Error('Failed to fetch security data');
        const data = await response.json();
        setSecurityData(data);
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

  const handleMouseClick = useCallback((event: MouseEvent) => {
    if (!fortressRef.current || !rendererRef.current || !cameraRef.current || !sceneRef.current) return;
    
    const rect = fortressRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    
    raycasterRef.current.setFromCamera(mouse, cameraRef.current);
    const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children, true);
    
    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;
      if (clickedObject.userData && clickedObject.userData.type) {
        setSelectedMetric({
          type: clickedObject.userData.type,
          coverage: clickedObject.userData.coverage,
          protected: clickedObject.userData.protected,
          unprotected: clickedObject.userData.unprotected,
          vendors: clickedObject.userData.vendors
        });
        
        if (selectedObjectRef.current) {
          selectedObjectRef.current.scale.set(1, 1, 1);
        }
        selectedObjectRef.current = clickedObject.parent || clickedObject;
        selectedObjectRef.current.scale.set(1.2, 1.2, 1.2);
      }
    }
  }, []);

  useEffect(() => {
    if (!fortressRef.current || !securityData) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x000000, 0.001);

    const camera = new THREE.PerspectiveCamera(
      60,
      fortressRef.current.clientWidth / fortressRef.current.clientHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    rendererRef.current = renderer;
    
    renderer.setSize(fortressRef.current.clientWidth, fortressRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    fortressRef.current.appendChild(renderer.domElement);

    const fortressGroup = new THREE.Group();
    const layers: THREE.Group[] = [];
    
    const platformGeometry = new THREE.CylinderGeometry(60, 70, 5, 64);
    const platformMaterial = new THREE.MeshPhongMaterial({
      color: 0x000000,
      emissive: 0x00d4ff,
      emissiveIntensity: 0.02,
      specular: 0x00d4ff,
      shininess: 100
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.castShadow = true;
    platform.receiveShadow = true;
    fortressGroup.add(platform);

    const createSecurityLayer = (
      name: string,
      data: any,
      radius: number,
      height: number,
      yPosition: number,
      index: number
    ) => {
      const layerGroup = new THREE.Group();
      layerGroup.userData = { 
        type: name, 
        coverage: data.coverage_percentage,
        protected: data.protected_hosts || data.managed_hosts || 0,
        unprotected: data.unprotected_hosts || data.unmanaged_hosts || 0,
        vendors: data.vendor_breakdown || []
      };
      
      const segments = 64;
      const coverageAngle = (data.coverage_percentage / 100) * Math.PI * 2;
      
      const protectedGeometry = new THREE.RingGeometry(radius - 10, radius, segments, 1, 0, coverageAngle);
      const protectedMaterial = new THREE.MeshPhongMaterial({
        color: 0x00d4ff,
        emissive: 0x00d4ff,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      });
      const protectedRing = new THREE.Mesh(protectedGeometry, protectedMaterial);
      protectedRing.rotation.x = -Math.PI / 2;
      protectedRing.position.y = yPosition;
      protectedRing.castShadow = true;
      layerGroup.add(protectedRing);
      
      const unprotectedGeometry = new THREE.RingGeometry(radius - 10, radius, segments, 1, coverageAngle, Math.PI * 2 - coverageAngle);
      const unprotectedMaterial = new THREE.MeshPhongMaterial({
        color: 0xa855f7,
        emissive: 0xa855f7,
        emissiveIntensity: 0.1,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
      });
      const unprotectedRing = new THREE.Mesh(unprotectedGeometry, unprotectedMaterial);
      unprotectedRing.rotation.x = -Math.PI / 2;
      unprotectedRing.position.y = yPosition;
      layerGroup.add(unprotectedRing);
      
      const cylinderGeometry = new THREE.CylinderGeometry(radius - 5, radius - 5, height, segments, 1, true);
      const cylinderMaterial = new THREE.MeshPhongMaterial({
        color: 0x00d4ff,
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide,
        wireframe: true
      });
      const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
      cylinder.position.y = yPosition + height / 2;
      layerGroup.add(cylinder);
      
      const particleCount = Math.floor((100 - data.coverage_percentage) * 5);
      const particlesGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      
      for (let i = 0; i < particleCount * 3; i += 3) {
        const angle = Math.random() * Math.PI * 2;
        const r = radius + Math.random() * 15;
        const h = yPosition + Math.random() * height;
        
        positions[i] = Math.cos(angle) * r;
        positions[i + 1] = h;
        positions[i + 2] = Math.sin(angle) * r;
        
        colors[i] = 1;
        colors[i + 1] = 0;
        colors[i + 2] = 1;
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
      layerGroup.add(particles);
      
      const dataFlowCount = 20;
      for (let i = 0; i < dataFlowCount; i++) {
        const flowGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const flowMaterial = new THREE.MeshBasicMaterial({
          color: data.coverage_percentage > 70 ? 0x00d4ff : 0xa855f7,
          transparent: true,
          opacity: 0.6
        });
        const flowSphere = new THREE.Mesh(flowGeometry, flowMaterial);
        flowSphere.userData = {
          angle: (i / dataFlowCount) * Math.PI * 2,
          radius: radius,
          height: yPosition,
          speed: 0.01 + Math.random() * 0.02,
          verticalSpeed: Math.random() * 0.5
        };
        layerGroup.add(flowSphere);
      }
      
      return layerGroup;
    };

    if (securityData.edr_coverage) {
      const edrLayer = createSecurityLayer('EDR', securityData.edr_coverage, 45, 20, 10, 0);
      layers.push(edrLayer);
      fortressGroup.add(edrLayer);
    }

    if (securityData.tanium_coverage) {
      const taniumLayer = createSecurityLayer('Tanium', securityData.tanium_coverage, 38, 18, 35, 1);
      layers.push(taniumLayer);
      fortressGroup.add(taniumLayer);
    }

    if (securityData.dlp_coverage) {
      const dlpLayer = createSecurityLayer('DLP', securityData.dlp_coverage, 31, 16, 58, 2);
      layers.push(dlpLayer);
      fortressGroup.add(dlpLayer);
    }

    const coreGeometry = new THREE.IcosahedronGeometry(12, 3);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: securityData.all_controls_coverage?.status === 'CRITICAL' ? 0xff00ff : 0x00d4ff,
      emissive: securityData.all_controls_coverage?.status === 'CRITICAL' ? 0xff00ff : 0x00d4ff,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.9,
      wireframe: false
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.position.y = 80;
    core.castShadow = true;
    core.userData = {
      type: 'All Controls',
      coverage: securityData.all_controls_coverage?.coverage_percentage || 0
    };
    fortressGroup.add(core);

    const coreWireGeometry = new THREE.IcosahedronGeometry(13, 3);
    const coreWireMaterial = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });
    const coreWire = new THREE.Mesh(coreWireGeometry, coreWireMaterial);
    coreWire.position.y = 80;
    fortressGroup.add(coreWire);

    const globalParticleCount = 1000;
    const globalGeometry = new THREE.BufferGeometry();
    const globalPositions = new Float32Array(globalParticleCount * 3);
    const globalColors = new Float32Array(globalParticleCount * 3);
    
    for (let i = 0; i < globalParticleCount * 3; i += 3) {
      const radius = 100 + Math.random() * 100;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      globalPositions[i] = radius * Math.sin(phi) * Math.cos(theta);
      globalPositions[i + 1] = radius * Math.cos(phi);
      globalPositions[i + 2] = radius * Math.sin(phi) * Math.sin(theta);
      
      const isProtected = Math.random() < (securityData.all_controls_coverage?.coverage_percentage || 0) / 100;
      globalColors[i] = isProtected ? 0 : 0.66;
      globalColors[i + 1] = isProtected ? 1 : 0.33;
      globalColors[i + 2] = isProtected ? 1 : 0.97;
    }
    
    globalGeometry.setAttribute('position', new THREE.BufferAttribute(globalPositions, 3));
    globalGeometry.setAttribute('color', new THREE.BufferAttribute(globalColors, 3));
    
    const globalMaterial = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    const globalParticles = new THREE.Points(globalGeometry, globalMaterial);
    scene.add(globalParticles);

    scene.add(fortressGroup);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00d4ff, 2, 300);
    pointLight1.position.set(100, 100, 100);
    pointLight1.castShadow = true;
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xa855f7, 2, 300);
    pointLight2.position.set(-100, 50, -100);
    pointLight2.castShadow = true;
    scene.add(pointLight2);

    const spotLight = new THREE.SpotLight(0xffffff, 1);
    spotLight.position.set(0, 200, 0);
    spotLight.target = core;
    spotLight.castShadow = true;
    scene.add(spotLight);

    camera.position.set(150, 100, 150);
    camera.lookAt(0, 50, 0);

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY * 0.001;
      setZoomLevel(prev => Math.max(0.5, Math.min(3, prev - delta)));
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!fortressRef.current) return;
      const rect = fortressRef.current.getBoundingClientRect();
      mouseRef.current = {
        x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((event.clientY - rect.top) / rect.height) * 2 + 1
      };
      
      if (isDraggingRef.current && interactionMode === 'explore') {
        const deltaX = event.movementX;
        const deltaY = event.movementY;
        fortressGroup.rotation.y += deltaX * 0.01;
        fortressGroup.rotation.x = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, fortressGroup.rotation.x + deltaY * 0.01));
      }
    };

    const handleMouseDown = () => {
      isDraggingRef.current = true;
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    renderer.domElement.addEventListener('wheel', handleWheel);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('click', handleMouseClick);

    let frameId: number;
    let time = 0;
    
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      time += 0.01;
      
      if (interactionMode === 'rotate') {
        fortressGroup.rotation.y += rotationSpeed;
      }
      
      core.rotation.x += 0.005;
      core.rotation.y += 0.005;
      core.scale.setScalar(1 + Math.sin(time * 2) * 0.05);
      
      coreWire.rotation.x -= 0.003;
      coreWire.rotation.y -= 0.003;
      
      layers.forEach((layer, index) => {
        layer.rotation.y += 0.001 * (index + 1);
        
        layer.children.forEach((child: any) => {
          if (child.material && child.material.color && child.material.color.getHex() === 0xa855f7) {
            child.material.opacity = 0.4 + Math.sin(time * 3 + index) * 0.1;
          }
          
          if (child.userData.angle !== undefined) {
            child.userData.angle += child.userData.speed;
            const r = child.userData.radius;
            const h = child.userData.height + Math.sin(time * child.userData.verticalSpeed) * 5;
            child.position.x = Math.cos(child.userData.angle) * r;
            child.position.y = h;
            child.position.z = Math.sin(child.userData.angle) * r;
          }
        });
      });
      
      globalParticles.rotation.y += 0.0003;
      
      if (!isDraggingRef.current && interactionMode === 'rotate') {
        const baseRadius = 200 / zoomLevel;
        camera.position.x = Math.sin(time * 0.3) * baseRadius;
        camera.position.z = Math.cos(time * 0.3) * baseRadius;
        camera.position.y = 100 + Math.sin(time * 0.5) * 30;
      } else {
        const baseRadius = 200 / zoomLevel;
        camera.position.x = camera.position.x * (baseRadius / camera.position.length());
        camera.position.z = camera.position.z * (baseRadius / camera.position.length());
      }
      
      camera.lookAt(0, 50, 0);
      
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(scene.children, true);
      
      if (intersects.length > 0 && !selectedObjectRef.current) {
        const hoveredObject = intersects[0].object;
        if (hoveredObject.userData.type) {
          setHoveredControl(hoveredObject.userData.type);
        }
      } else if (intersects.length === 0) {
        setHoveredControl(null);
      }
      
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      renderer.domElement.removeEventListener('wheel', handleWheel);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('click', handleMouseClick);
      
      if (frameId) cancelAnimationFrame(frameId);
      if (fortressRef.current && renderer.domElement) {
        fortressRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [securityData, zoomLevel, rotationSpeed, interactionMode, handleMouseClick]);

  useEffect(() => {
    const canvas = coverageRef.current;
    if (!canvas || !securityData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let time = 0;
    const animate = () => {
      time += 0.02;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const controls = [
        { name: 'EDR', data: securityData.edr_coverage, color: '#00d4ff' },
        { name: 'Tanium', data: securityData.tanium_coverage, color: '#c084fc' },
        { name: 'DLP', data: securityData.dlp_coverage, color: '#ff00ff' }
      ];

      controls.forEach((control, index) => {
        if (!control.data) return;
        
        const y = (index + 1) * (canvas.height / 4);
        const barWidth = canvas.width * 0.8;
        const protectedWidth = barWidth * (control.data.coverage_percentage / 100);
        
        const pulseWidth = Math.sin(time + index) * 10;
        
        const protectedGradient = ctx.createLinearGradient(0, y, protectedWidth + pulseWidth, y);
        protectedGradient.addColorStop(0, control.color);
        protectedGradient.addColorStop(0.5, control.color + '80');
        protectedGradient.addColorStop(1, control.color + '40');
        
        ctx.fillStyle = protectedGradient;
        ctx.fillRect(50, y - 20, protectedWidth + pulseWidth, 40);
        
        ctx.strokeStyle = control.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(50, y - 20, protectedWidth, 40);
        
        ctx.fillStyle = 'rgba(168, 85, 247, 0.2)';
        ctx.fillRect(50 + protectedWidth, y - 20, barWidth - protectedWidth, 40);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(control.name, 50, y - 25);
        
        ctx.fillStyle = control.color;
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(
          `${control.data.coverage_percentage.toFixed(1)}%`,
          50 + barWidth + 30,
          y + 5
        );
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          `${control.data.protected_hosts?.toLocaleString() || control.data.managed_hosts?.toLocaleString() || 0} protected`,
          canvas.width / 2,
          y + 35
        );
        
        for (let i = 0; i < 3; i++) {
          const particleX = 50 + (time * 50 + i * 100) % protectedWidth;
          const particleY = y + Math.sin(time * 2 + i) * 15;
          
          ctx.fillStyle = control.color;
          ctx.globalAlpha = 0.8;
          ctx.beginPath();
          ctx.arc(particleX, particleY, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, [securityData]);

  useEffect(() => {
    const canvas = threatRef.current;
    if (!canvas || !securityData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let time = 0;
    const particles: any[] = [];
    
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 3 + 1,
        color: Math.random() > 0.5 ? '#00d4ff' : '#ff00ff',
        protected: Math.random() < (securityData.all_controls_coverage?.coverage_percentage || 0) / 100
      });
    }

    const animate = () => {
      time += 0.02;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const gridSize = 30;
      const cols = Math.floor(canvas.width / gridSize);
      const rows = Math.floor(canvas.height / gridSize);
      
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * gridSize;
          const y = j * gridSize;
          
          const intensity = (Math.sin(time + i * 0.1) + Math.sin(time + j * 0.1)) * 0.5;
          const isVulnerable = Math.random() > (securityData.all_controls_coverage?.coverage_percentage || 0) / 100;
          
          if (isVulnerable && Math.random() > 0.95) {
            ctx.fillStyle = `rgba(255, 0, 255, ${Math.abs(intensity)})`;
            ctx.fillRect(x, y, gridSize - 2, gridSize - 2);
          } else if (!isVulnerable && Math.random() > 0.97) {
            ctx.fillStyle = `rgba(0, 212, 255, ${Math.abs(intensity) * 0.5})`;
            ctx.fillRect(x, y, gridSize - 2, gridSize - 2);
          }
        }
      }

      particles.forEach((particle, index) => {
        particles.forEach((other, otherIndex) => {
          if (index !== otherIndex) {
            const dx = particle.x - other.x;
            const dy = particle.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 100) {
              const opacity = (1 - distance / 100) * 0.5;
              ctx.strokeStyle = particle.protected ? `rgba(0, 212, 255, ${opacity})` : `rgba(255, 0, 255, ${opacity})`;
              ctx.lineWidth = 0.5;
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(other.x, other.y);
              ctx.stroke();
            }
          }
        });
        
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
        
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size + Math.sin(time + index) * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      const scanY = ((time * 30) % canvas.height);
      const gradient = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
      gradient.addColorStop(0, 'rgba(0, 212, 255, 0)');
      gradient.addColorStop(0.5, 'rgba(0, 212, 255, 0.5)');
      gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, scanY - 20, canvas.width, 40);
      
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.8)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(canvas.width, scanY);
      ctx.stroke();

      requestAnimationFrame(animate);
    };

    animate();
  }, [securityData]);

  useEffect(() => {
    const canvas = radarRef.current;
    if (!canvas || !securityData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) - 30;

    let sweepAngle = 0;
    let pulseRadius = 0;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 1; i <= 4; i++) {
        ctx.strokeStyle = `rgba(0, 212, 255, ${0.1 - i * 0.02})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, (maxRadius / 4) * i, 0, Math.PI * 2);
        ctx.stroke();
      }

      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        ctx.strokeStyle = 'rgba(192, 132, 252, 0.1)';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + Math.cos(angle) * maxRadius, centerY + Math.sin(angle) * maxRadius);
        ctx.stroke();
      }

      const controls = [
        { name: 'EDR', coverage: securityData.edr_coverage?.coverage_percentage || 0 },
        { name: 'Tanium', coverage: securityData.tanium_coverage?.coverage_percentage || 0 },
        { name: 'DLP', coverage: securityData.dlp_coverage?.coverage_percentage || 0 }
      ];

      controls.forEach((control, index) => {
        const angle = (index / controls.length) * Math.PI * 2 - Math.PI / 2;
        const nextAngle = ((index + 1) / controls.length) * Math.PI * 2 - Math.PI / 2;
        const radius = (control.coverage / 100) * maxRadius;
        
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, 'rgba(0, 212, 255, 0.3)');
        gradient.addColorStop(1, control.coverage < 50 ? 'rgba(255, 0, 255, 0.1)' : 'rgba(0, 212, 255, 0.05)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, angle, nextAngle);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = control.coverage < 50 ? '#ff00ff' : '#00d4ff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        const labelAngle = (angle + nextAngle) / 2;
        const labelX = centerX + Math.cos(labelAngle) * (maxRadius + 20);
        const labelY = centerY + Math.sin(labelAngle) * (maxRadius + 20);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(control.name, labelX, labelY);
        
        ctx.fillStyle = control.coverage < 50 ? '#ff00ff' : '#00d4ff';
        ctx.fillText(`${control.coverage.toFixed(0)}%`, labelX, labelY + 12);
      });

      sweepAngle += 0.02;
      const sweepGradient = ctx.createLinearGradient(
        centerX,
        centerY,
        centerX + Math.cos(sweepAngle) * maxRadius,
        centerY + Math.sin(sweepAngle) * maxRadius
      );
      sweepGradient.addColorStop(0, 'rgba(0, 212, 255, 0)');
      sweepGradient.addColorStop(0.5, 'rgba(0, 212, 255, 0.5)');
      sweepGradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
      
      ctx.strokeStyle = sweepGradient;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(sweepAngle) * maxRadius,
        centerY + Math.sin(sweepAngle) * maxRadius
      );
      ctx.stroke();

      pulseRadius = (pulseRadius + 2) % maxRadius;
      ctx.strokeStyle = `rgba(0, 212, 255, ${1 - pulseRadius / maxRadius})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
      ctx.stroke();

      const blips = 5;
      for (let i = 0; i < blips; i++) {
        const blipAngle = Math.random() * Math.PI * 2;
        const blipRadius = Math.random() * maxRadius;
        const blipX = centerX + Math.cos(blipAngle) * blipRadius;
        const blipY = centerY + Math.sin(blipAngle) * blipRadius;
        
        if (Math.abs(blipAngle - sweepAngle) < 0.3) {
          ctx.fillStyle = Math.random() > 0.5 ? '#00d4ff' : '#ff00ff';
          ctx.globalAlpha = 1 - (Math.abs(blipAngle - sweepAngle) / 0.3);
          ctx.beginPath();
          ctx.arc(blipX, blipY, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      requestAnimationFrame(animate);
    };

    animate();
  }, [securityData]);

  useEffect(() => {
    const canvas = matrixRef.current;
    if (!canvas || !securityData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const matrix = Array(Math.floor(canvas.height / 10)).fill(null).map(() => 
      Array(Math.floor(canvas.width / 10)).fill(0)
    );

    let time = 0;

    const animate = () => {
      time += 0.05;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const rows = matrix.length;
      const cols = matrix[0].length;
      
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const x = j * 10;
          const y = i * 10;
          
          matrix[i][j] *= 0.95;
          
          if (Math.random() > 0.995) {
            matrix[i][j] = 1;
          }
          
          if (matrix[i][j] > 0.1) {
            const intensity = matrix[i][j];
            const isProtected = Math.random() < (securityData.all_controls_coverage?.coverage_percentage || 0) / 100;
            
            ctx.fillStyle = isProtected ? 
              `rgba(0, 212, 255, ${intensity})` : 
              `rgba(255, 0, 255, ${intensity})`;
            
            ctx.font = '10px monospace';
            ctx.fillText(Math.random() > 0.5 ? '1' : '0', x, y);
            
            if (intensity > 0.8) {
              ctx.shadowColor = isProtected ? '#00d4ff' : '#ff00ff';
              ctx.shadowBlur = 10;
              ctx.fillRect(x - 2, y - 8, 10, 10);
              ctx.shadowBlur = 0;
            }
          }
        }
      }

      const waveY = Math.sin(time) * canvas.height / 2 + canvas.height / 2;
      for (let x = 0; x < canvas.width; x += 10) {
        const waveIntensity = Math.sin(x / 50 + time) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(192, 132, 252, ${waveIntensity * 0.5})`;
        ctx.fillRect(x, waveY - 2, 10, 4);
      }

      requestAnimationFrame(animate);
    };

    animate();
  }, [securityData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
          <div className="mt-4 text-lg font-bold text-cyan-400">INITIALIZING SECURITY FORTRESS</div>
        </div>
      </div>
    );
  }

  if (!securityData) return null;

  const overallCoverage = securityData.all_controls_coverage?.coverage_percentage || 0;

  return (
    <div className="h-full flex flex-col p-4 bg-black">
      <div className="flex-1 grid grid-cols-12 gap-4">
        <div className="col-span-8">
          <div className="h-full border border-cyan-500/30 rounded-xl bg-black/90">
            <div className="p-3 border-b border-cyan-500/20 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-bold text-cyan-400">SECURITY CONTROL FORTRESS</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setInteractionMode(interactionMode === 'rotate' ? 'explore' : 'rotate')}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                      interactionMode === 'explore' 
                        ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-400'
                        : 'bg-black/50 border border-white/20 text-white/60'
                    }`}
                  >
                    {interactionMode === 'explore' ? 'EXPLORE MODE' : 'AUTO ROTATE'}
                  </button>
                  <button
                    onClick={() => setRotationSpeed(rotationSpeed === 0 ? 0.002 : 0)}
                    className="px-3 py-1 rounded text-xs font-bold bg-black/50 border border-white/20 text-white/60"
                  >
                    {rotationSpeed === 0 ? 'PLAY' : 'PAUSE'}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-xs text-white/60">
                  ZOOM: {(zoomLevel * 100).toFixed(0)}%
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.2))} className="text-cyan-400">+</button>
                  <button onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.2))} className="text-cyan-400">-</button>
                </div>
              </div>
            </div>
            
            <div ref={fortressRef} className="w-full" style={{ height: 'calc(100% - 60px)' }} />
            
            {hoveredControl && (
              <div className="absolute bottom-4 left-4 bg-black/90 rounded-lg border border-cyan-400/30 p-3">
                <div className="text-sm font-bold text-cyan-400">{hoveredControl}</div>
                <div className="text-xs text-white/60">Click for details</div>
              </div>
            )}
            
            {selectedMetric && (
              <div className="absolute top-20 right-4 bg-black/95 rounded-lg border border-cyan-400/50 p-4 w-64">
                <div className="text-sm font-bold text-cyan-400 mb-2">{selectedMetric.type} DETAILS</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/60">Coverage</span>
                    <span className="text-cyan-400">{selectedMetric.coverage?.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/60">Protected</span>
                    <span className="text-white">{selectedMetric.protected?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/60">Unprotected</span>
                    <span className="text-purple-400">{selectedMetric.unprotected?.toLocaleString()}</span>
                  </div>
                  {selectedMetric.vendors && selectedMetric.vendors.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-white/10">
                      <div className="text-xs text-white/60 mb-1">VENDORS</div>
                      {selectedMetric.vendors.slice(0, 3).map((vendor: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="text-white/40">{vendor.vendor}</span>
                          <span className="text-cyan-400">{vendor.percentage?.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => setSelectedMetric(null)}
                  className="mt-3 w-full py-1 bg-cyan-500/20 border border-cyan-500/50 rounded text-xs text-cyan-400 font-bold"
                >
                  CLOSE
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="col-span-4 space-y-3">
          <div className="border border-purple-500/30 rounded-xl p-4 bg-black/90">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">FORTRESS STATUS</h3>
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="text-4xl font-bold text-cyan-400 mb-2">
              {overallCoverage.toFixed(1)}%
            </div>
            <div className="text-xs text-white/60 mb-3">
              {securityData.all_controls_coverage?.fully_protected_hosts?.toLocaleString()} / {securityData.total_hosts?.toLocaleString()} hosts secured
            </div>
            <div className="h-3 bg-black/50 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${overallCoverage}%`,
                  background: overallCoverage < 40 
                    ? 'linear-gradient(90deg, #ff00ff, #ff00ff)'
                    : overallCoverage < 70
                    ? 'linear-gradient(90deg, #c084fc, #ff00ff)'
                    : 'linear-gradient(90deg, #00d4ff, #00d4ff)'
                }}
              />
            </div>
          </div>

          <div className="border border-cyan-500/30 rounded-xl p-3 bg-black/90">
            <h3 className="text-sm font-bold text-purple-400 mb-2">CONTROL FLOW</h3>
            <canvas ref={coverageRef} className="w-full h-48" />
          </div>

          <div className="border border-purple-500/30 rounded-xl p-3 bg-black/90">
            <h3 className="text-sm font-bold text-cyan-400 mb-2">THREAT MATRIX</h3>
            <canvas ref={threatRef} className="w-full h-32" />
          </div>

          <div className="border border-cyan-500/30 rounded-xl p-3 bg-black/90">
            <h3 className="text-sm font-bold text-purple-400 mb-2">DEFENSE RADAR</h3>
            <canvas ref={radarRef} className="w-full h-32" />
          </div>

          <div className="border border-purple-500/30 rounded-xl p-3 bg-black/90">
            <h3 className="text-sm font-bold text-cyan-400 mb-2">QUANTUM SHIELD</h3>
            <canvas ref={matrixRef} className="w-full h-24" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityControlCoverage;