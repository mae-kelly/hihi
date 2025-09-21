import React, { useState, useEffect, useRef } from 'react';
import { Globe, MapPin, AlertTriangle, TrendingDown, Shield, Activity, Network, Database, Server, Cloud, Radar, Satellite, Radio, Zap, Navigation, Target } from 'lucide-react';
import * as THREE from 'three';

const RegionalCountryView: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [timelinePosition, setTimelinePosition] = useState(50); // 0 = past, 50 = present, 100 = future
  const globeRef = useRef<HTMLDivElement>(null);
  const hexMapRef = useRef<HTMLCanvasElement>(null);
  const [animatedMetrics, setAnimatedMetrics] = useState<Record<string, number>>({});
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const frameRef = useRef<number>(0);

  // ACTUAL DATA FROM AO1 REQUIREMENTS
  const regionalData = {
    'ALL': {
      totalAssets: 262032,
      csocCoverage: 19.17,
      splunkCoverage: 63.93,
      chronicleCoverage: 92.24,
      criticalGaps: 211795,
      countries: 47,
      datacenters: 23,
      cloudRegions: 12
    },
    'AMERICAS': {
      totalAssets: 105234,
      csocCoverage: 32.5,
      splunkCoverage: 78.9,
      chronicleCoverage: 94.2,
      criticalGaps: 71034,
      countries: 12,
      datacenters: 8,
      cloudRegions: 4,
      color: '#00ffff',
      breakdown: {
        'United States': { assets: 67890, coverage: 45.2, gap: 37244, status: 'warning', lat: 39.0, lon: -98.0 },
        'Canada': { assets: 18234, coverage: 28.7, gap: 12999, status: 'critical', lat: 56.0, lon: -106.0 },
        'Brazil': { assets: 12110, coverage: 22.3, gap: 9409, status: 'critical', lat: -14.0, lon: -51.0 },
        'Mexico': { assets: 7000, coverage: 18.9, gap: 5677, status: 'critical', lat: 23.0, lon: -102.0 }
      }
    },
    'EMEA': {
      totalAssets: 89456,
      csocCoverage: 12.3,
      splunkCoverage: 52.1,
      chronicleCoverage: 89.7,
      criticalGaps: 78456,
      countries: 22,
      datacenters: 9,
      cloudRegions: 5,
      color: '#c084fc',
      breakdown: {
        'United Kingdom': { assets: 23456, coverage: 18.9, gap: 19012, status: 'critical', lat: 54.0, lon: -2.0 },
        'Germany': { assets: 19878, coverage: 15.2, gap: 16855, status: 'critical', lat: 51.0, lon: 10.0 },
        'France': { assets: 15234, coverage: 12.1, gap: 13390, status: 'critical', lat: 46.0, lon: 2.0 },
        'UAE': { assets: 7654, coverage: 8.2, gap: 7027, status: 'critical', lat: 24.0, lon: 54.0 }
      }
    },
    'APAC': {
      totalAssets: 67342,
      csocCoverage: 15.8,
      splunkCoverage: 61.2,
      chronicleCoverage: 93.1,
      criticalGaps: 56632,
      countries: 13,
      datacenters: 6,
      cloudRegions: 3,
      color: '#ff00ff',
      breakdown: {
        'Japan': { assets: 18901, coverage: 22.3, gap: 14685, status: 'critical', lat: 36.0, lon: 138.0 },
        'Singapore': { assets: 14567, coverage: 19.8, gap: 11682, status: 'critical', lat: 1.3, lon: 103.8 },
        'Australia': { assets: 12345, coverage: 17.2, gap: 10222, status: 'critical', lat: -27.0, lon: 133.0 },
        'India': { assets: 10234, coverage: 12.1, gap: 8995, status: 'critical', lat: 20.0, lon: 77.0 }
      }
    }
  };

  const currentRegion = regionalData[selectedRegion] || regionalData['ALL'];

  // 4D Globe with Time Dimension
  useEffect(() => {
    if (!globeRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0003);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      globeRef.current.clientWidth / globeRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 100, 350);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(globeRef.current.clientWidth, globeRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.5;
    globeRef.current.appendChild(renderer.domElement);

    // Globe with tectonic plates effect
    const globeGeometry = new THREE.IcosahedronGeometry(100, 4);
    const globeMaterial = new THREE.MeshPhongMaterial({
      color: 0x001122,
      emissive: 0x00ffff,
      emissiveIntensity: 0.05,
      wireframe: false,
      transparent: true,
      opacity: 0.7,
      flatShading: true
    });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);

    // Add wireframe overlay
    const wireframeGeometry = new THREE.IcosahedronGeometry(101, 4);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      wireframe: true,
      transparent: true,
      opacity: 0.2
    });
    const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
    scene.add(wireframe);

    // Tectonic plates (regions)
    const platforms: THREE.Mesh[] = [];
    const arcs: THREE.Line[] = [];
    
    if (selectedRegion !== 'ALL') {
      const regionData = regionalData[selectedRegion];
      if (regionData && regionData.breakdown) {
        Object.entries(regionData.breakdown).forEach(([country, data]) => {
          const phi = (90 - data.lat) * (Math.PI / 180);
          const theta = (data.lon + 180) * (Math.PI / 180);
          
          // Calculate position with time offset
          const timeFactor = (timelinePosition - 50) / 50; // -1 to 1
          const radius = 102 + data.coverage * 0.3 + timeFactor * 10;
          
          const x = radius * Math.sin(phi) * Math.cos(theta);
          const y = radius * Math.cos(phi);
          const z = radius * Math.sin(phi) * Math.sin(theta);

          // Country platform
          const platformGeometry = new THREE.BoxGeometry(15, data.assets / 2000, 15);
          const platformMaterial = new THREE.MeshPhongMaterial({
            color: data.status === 'critical' ? 0xff0044 : 0xffaa00,
            emissive: data.status === 'critical' ? 0xff0044 : 0xffaa00,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.8
          });
          const platform = new THREE.Mesh(platformGeometry, platformMaterial);
          platform.position.set(x, y, z);
          platform.lookAt(0, 0, 0);
          scene.add(platform);
          platforms.push(platform);

          // Threat vector arcs
          if (data.status === 'critical') {
            const curve = new THREE.CatmullRomCurve3([
              new THREE.Vector3(x, y, z),
              new THREE.Vector3(x * 0.5, y + 50, z * 0.5),
              new THREE.Vector3(0, 0, 0)
            ]);
            const points = curve.getPoints(50);
            const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const lineMaterial = new THREE.LineBasicMaterial({
              color: 0xff0044,
              linewidth: 2,
              transparent: true,
              opacity: 0.5
            });
            const arc = new THREE.Line(lineGeometry, lineMaterial);
            scene.add(arc);
            arcs.push(arc);
          }
        });
      }
    } else {
      // Show all regions when ALL is selected
      ['AMERICAS', 'EMEA', 'APAC'].forEach((regionName, index) => {
        const region = regionalData[regionName as keyof typeof regionalData];
        if (!region || !('breakdown' in region)) return;
        
        const regionLat = index === 0 ? 30 : index === 1 ? 50 : 10;
        const regionLon = index === 0 ? -90 : index === 1 ? 20 : 110;
        
        const phi = (90 - regionLat) * (Math.PI / 180);
        const theta = (regionLon + 180) * (Math.PI / 180);
        
        const timeFactor = (timelinePosition - 50) / 50;
        const radius = 105 + (region.csocCoverage / 100) * 20 + timeFactor * 10;
        
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);
        
        // Regional sphere
        const sphereGeometry = new THREE.SphereGeometry(20, 16, 16);
        const sphereMaterial = new THREE.MeshPhongMaterial({
          color: region.color || 0x00ffff,
          emissive: region.color || 0x00ffff,
          emissiveIntensity: 0.3,
          transparent: true,
          opacity: 0.6,
          wireframe: true
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.set(x, y, z);
        scene.add(sphere);
        platforms.push(sphere);
      });
    }

    // Weather-like threat storm systems
    const stormGroup = new THREE.Group();
    const stormGeometry = new THREE.SphereGeometry(30, 16, 16);
    const stormMaterial = new THREE.MeshPhongMaterial({
      color: 0xff0044,
      emissive: 0xff0044,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.3,
      wireframe: true
    });
    const storm = new THREE.Mesh(stormGeometry, stormMaterial);
    storm.position.set(50, 50, 50);
    stormGroup.add(storm);
    scene.add(stormGroup);

    // Aurora borealis effect for secure zones
    const auroraGeometry = new THREE.PlaneGeometry(300, 100);
    const auroraMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec2 vUv;
        void main() {
          vec3 color = vec3(0.0, 1.0, 0.5);
          float wave = sin(vUv.x * 10.0 + time) * 0.5 + 0.5;
          gl_FragColor = vec4(color * wave, wave * 0.3);
        }
      `,
      uniforms: {
        time: { value: 0 }
      },
      transparent: true,
      side: THREE.DoubleSide
    });
    const aurora = new THREE.Mesh(auroraGeometry, auroraMaterial);
    aurora.position.y = 150;
    aurora.rotation.x = -Math.PI / 4;
    scene.add(aurora);

    // Particle field for data flow
    const particleCount = 5000;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      const radius = 100 + Math.random() * 100;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = radius * Math.cos(phi);
      positions[i + 2] = radius * Math.sin(phi) * Math.sin(theta);
      
      const color = new THREE.Color(
        selectedRegion === 'ALL' ? '#00ffff' : currentRegion.color || '#00ffff'
      );
      colors[i] = color.r;
      colors[i + 1] = color.g;
      colors[i + 2] = color.b;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Quantum tunneling connections between regions
    if (selectedRegion === 'ALL') {
      const tunnelGeometry = new THREE.TorusGeometry(150, 2, 8, 100);
      const tunnelMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.2,
        wireframe: true
      });
      const tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
      tunnel.rotation.x = Math.PI / 2;
      scene.add(tunnel);
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(100, 100, 50);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0x00ffff, 1, 300);
    pointLight1.position.set(0, 0, 0);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff00ff, 0.5, 200);
    pointLight2.position.set(-100, 50, 100);
    scene.add(pointLight2);

    // Mouse controls
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
      
      globe.rotation.y += deltaX * 0.01;
      globe.rotation.x += deltaY * 0.01;
      wireframe.rotation.y += deltaX * 0.01;
      wireframe.rotation.x += deltaY * 0.01;
      
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
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      
      // Rotate globe based on timeline
      const timeSpeed = 0.002 + (timelinePosition / 100) * 0.003;
      if (!isDragging) {
        globe.rotation.y += timeSpeed;
        wireframe.rotation.y += timeSpeed;
      }
      particles.rotation.y -= timeSpeed * 0.5;
      
      // Animate platforms based on timeline
      platforms.forEach((platform, index) => {
        const timeFactor = Math.sin(Date.now() * 0.001 + index) * 0.1;
        platform.position.y += timeFactor;
        platform.rotation.x += 0.01;
        platform.rotation.z += 0.005;
      });
      
      // Animate storm
      stormGroup.position.x = Math.sin(Date.now() * 0.0005) * 100;
      stormGroup.position.z = Math.cos(Date.now() * 0.0005) * 100;
      storm.rotation.x += 0.01;
      storm.rotation.y += 0.01;
      
      // Update aurora shader
      if (auroraMaterial.uniforms.time) {
        auroraMaterial.uniforms.time.value = Date.now() * 0.001;
      }
      
      // Camera animation based on timeline
      const cameraRadius = 350 + (timelinePosition - 50) * 2;
      const cameraTime = Date.now() * 0.0002;
      camera.position.x = Math.sin(cameraTime) * cameraRadius;
      camera.position.z = Math.cos(cameraTime) * cameraRadius;
      camera.position.y = 100 + Math.sin(cameraTime * 2) * 50;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!globeRef.current) return;
      camera.aspect = globeRef.current.clientWidth / globeRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(globeRef.current.clientWidth, globeRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('mouseleave', handleMouseUp);
      window.removeEventListener('resize', handleResize);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (globeRef.current && renderer.domElement) {
        globeRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [selectedRegion, timelinePosition]);

  // Hexagonal Territory Grid
  useEffect(() => {
    const canvas = hexMapRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const hexRadius = 20;
    const hexHeight = hexRadius * Math.sqrt(3);
    const hexWidth = hexRadius * 2;
    
    let animationId: number;

    const drawHex = (x: number, y: number, value: number, color: string, label?: string) => {
      ctx.save();
      
      // Draw hex shape
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const hx = x + hexRadius * Math.cos(angle);
        const hy = y + hexRadius * Math.sin(angle);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      
      // Fill with gradient based on value
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, hexRadius);
      const opacity = Math.min(value / 50, 1);
      gradient.addColorStop(0, color + Math.floor(opacity * 255).toString(16).padStart(2, '0'));
      gradient.addColorStop(1, color + '20');
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Border with glow effect
      ctx.strokeStyle = color + '80';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // 3D Height effect based on value
      if (value > 10) {
        const height = Math.min(value * 0.5, 20);
        ctx.beginPath();
        ctx.moveTo(x - hexRadius, y);
        ctx.lineTo(x - hexRadius, y - height);
        ctx.lineTo(x - hexRadius * 0.5, y - hexRadius * 0.866 - height);
        ctx.lineTo(x + hexRadius * 0.5, y - hexRadius * 0.866 - height);
        ctx.lineTo(x + hexRadius, y - height);
        ctx.lineTo(x + hexRadius, y);
        
        const sideGradient = ctx.createLinearGradient(x, y, x, y - height);
        sideGradient.addColorStop(0, color + '40');
        sideGradient.addColorStop(1, color + '80');
        ctx.fillStyle = sideGradient;
        ctx.fill();
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      // Label
      if (label && value > 20) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x, y);
      }
      
      ctx.restore();
    };

    const animate = () => {
      // Semi-transparent black for trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const time = Date.now() * 0.0001;
      
      // Draw hex grid
      for (let row = 0; row < 15; row++) {
        for (let col = 0; col < 20; col++) {
          const x = col * hexWidth * 0.75 + hexRadius;
          const y = row * hexHeight + (col % 2 === 1 ? hexHeight / 2 : 0) + hexRadius;
          
          // Skip hexes outside canvas
          if (x > canvas.width || y > canvas.height) continue;
          
          // Determine region and value based on position
          let regionColor = '#00ffff';
          let baseValue = 0;
          let label = '';
          
          if (selectedRegion === 'ALL') {
            // Divide canvas into three regions
            if (col < 7) {
              regionColor = '#00ffff'; // Americas
              baseValue = 32.5;
              if (row === 7 && col === 3) label = 'AMERICAS';
            } else if (col < 14) {
              regionColor = '#c084fc'; // EMEA
              baseValue = 12.3;
              if (row === 7 && col === 10) label = 'EMEA';
            } else {
              regionColor = '#ff00ff'; // APAC
              baseValue = 15.8;
              if (row === 7 && col === 17) label = 'APAC';
            }
          } else {
            // Single region view
            const region = regionalData[selectedRegion as keyof typeof regionalData];
            if (region && 'color' in region) {
              regionColor = region.color;
              baseValue = region.csocCoverage;
            }
          }
          
          // Add time-based variation
          const waveValue = Math.sin(time * 10 + col * 0.5 + row * 0.3) * 10;
          const pulseValue = Math.sin(time * 20 + col + row) * 5;
          const value = Math.max(0, baseValue + waveValue + pulseValue);
          
          // Draw hex with fog of war effect for low visibility areas
          if (baseValue < 20) {
            // Low visibility - add fog effect
            ctx.save();
            ctx.globalAlpha = 0.3;
            drawHex(x, y, value, regionColor, label);
            ctx.restore();
            
            // Add static/noise effect
            if (Math.random() > 0.9) {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
              ctx.fillRect(x - hexRadius, y - hexRadius, hexRadius * 2, hexRadius * 2);
            }
          } else {
            drawHex(x, y, value, regionColor, label);
          }
        }
      }

      // Draw quantum tunnels between high-value hexes
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 5]);
      
      for (let i = 0; i < 3; i++) {
        const x1 = Math.random() * canvas.width;
        const y1 = Math.random() * canvas.height;
        const x2 = Math.random() * canvas.width;
        const y2 = Math.random() * canvas.height;
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(
          (x1 + x2) / 2,
          (y1 + y2) / 2 - 50,
          x2, y2
        );
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Add scan line effect
      const scanY = (Date.now() * 0.1) % canvas.height;
      const scanGradient = ctx.createLinearGradient(0, scanY - 10, 0, scanY + 10);
      scanGradient.addColorStop(0, 'rgba(0, 255, 255, 0)');
      scanGradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.3)');
      scanGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
      ctx.fillStyle = scanGradient;
      ctx.fillRect(0, scanY - 10, canvas.width, 20);

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [selectedRegion]);

  // Animate metrics
  useEffect(() => {
    setTimeout(() => {
      setAnimatedMetrics({
        csoc: currentRegion.csocCoverage,
        splunk: currentRegion.splunkCoverage,
        chronicle: currentRegion.chronicleCoverage
      });
    }, 100);
  }, [selectedRegion]);

  return (
    <div className="p-8 min-h-screen bg-black">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(0, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(192, 132, 252, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 20%, rgba(255, 0, 255, 0.1) 0%, transparent 50%)
          `,
          animation: 'pulse 10s ease-in-out infinite'
        }} />
      </div>

      {/* Header */}
      <div className="relative z-20 mb-8">
        <h1 className="text-6xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
          4D GEOPOLITICAL QUANTUM MAP
        </h1>
        <p className="text-gray-400 uppercase tracking-[0.3em] text-sm">
          TEMPORAL ANALYSIS • {currentRegion.countries} TERRITORIES • {currentRegion.datacenters} QUANTUM HUBS
        </p>
      </div>

      {/* Critical Alert */}
      <div className="relative z-20 mb-6 border border-red-500/50 bg-red-500/10 rounded-lg p-4 backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
          <div>
            <span className="text-red-400 font-bold">TERRITORIAL BREACH:</span>
            <span className="text-white ml-2">EMEA quantum firewall at 12.3% - 78,456 nodes compromised</span>
          </div>
        </div>
      </div>

      {/* Region Selector */}
      <div className="relative z-20 flex gap-2 mb-8">
        {['ALL', 'AMERICAS', 'EMEA', 'APAC'].map(region => (
          <button
            key={region}
            onClick={() => setSelectedRegion(region)}
            className={`px-8 py-4 rounded-lg font-bold uppercase tracking-wider transition-all duration-300 backdrop-blur-lg ${
              selectedRegion === region
                ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 scale-105 shadow-2xl'
                : 'bg-gray-900/50 hover:bg-gray-800/50'
            }`}
            style={{
              border: selectedRegion === region ? '2px solid #00ffff' : '2px solid transparent',
              boxShadow: selectedRegion === region ? '0 0 40px rgba(0, 255, 255, 0.4)' : 'none'
            }}
          >
            <span style={{ 
              color: selectedRegion === region ? '#00ffff' : '#666',
              textShadow: selectedRegion === region ? '0 0 20px #00ffff' : 'none'
            }}>
              {region}
            </span>
          </button>
        ))}
      </div>

      {/* Timeline Controller */}
      <div className="relative z-20 mb-8 bg-black/80 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-6">
        <div className="flex items-center gap-4">
          <span className="text-purple-400 text-sm font-bold uppercase">Timeline:</span>
          <div className="flex-1">
            <input
              type="range"
              min="0"
              max="100"
              value={timelinePosition}
              onChange={(e) => setTimelinePosition(Number(e.target.value))}
              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, 
                  #ff0044 0%, 
                  #ff0044 ${timelinePosition < 50 ? timelinePosition : 50}%, 
                  #00ffff ${timelinePosition < 50 ? timelinePosition : 50}%, 
                  #00ffff ${timelinePosition}%, 
                  #333 ${timelinePosition}%, 
                  #333 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>PAST (T-30)</span>
              <span className="text-cyan-400 font-bold">PRESENT</span>
              <span>FUTURE (T+30)</span>
            </div>
          </div>
          <div className="text-2xl font-mono text-cyan-400">
            T{timelinePosition < 50 ? '-' : '+'}{Math.abs(timelinePosition - 50)}
          </div>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-12 gap-6">
        {/* 4D Globe */}
        <div className="col-span-7">
          <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-cyan-500/30 overflow-hidden"
               style={{
                 boxShadow: '0 0 80px rgba(0, 255, 255, 0.3), inset 0 0 40px rgba(0,0,0,0.8)'
               }}>
            <div className="p-4 border-b border-cyan-500/20">
              <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Quantum Territorial Matrix
              </h3>
            </div>
            <div ref={globeRef} className="w-full h-[500px] cursor-grab active:cursor-grabbing" />
            
            {/* HUD Overlay */}
            <div className="absolute top-16 left-4 text-xs font-mono text-cyan-400/60 space-y-1">
              <div>QUANTUM STATE: SUPERPOSITION</div>
              <div>TIMELINE: T{timelinePosition < 50 ? '-' : '+'}{Math.abs(timelinePosition - 50)}</div>
              <div>THREAT VECTORS: ACTIVE</div>
              <div>DRAG TO ROTATE</div>
            </div>
          </div>
        </div>

        {/* Metrics & Hex Map */}
        <div className="col-span-5 space-y-6">
          {/* Key Metrics */}
          <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400">{currentRegion.totalAssets.toLocaleString()}</div>
                <div className="text-xs text-gray-400 uppercase">Quantum Nodes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-400">{currentRegion.criticalGaps.toLocaleString()}</div>
                <div className="text-xs text-gray-400 uppercase">Breached</div>
              </div>
            </div>

            {/* Coverage Bars */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-cyan-400">CSOC Shield</span>
                  <span className="font-mono text-cyan-400">{animatedMetrics.csoc?.toFixed(1) || 0}%</span>
                </div>
                <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${animatedMetrics.csoc || 0}%`,
                      background: animatedMetrics.csoc < 20 ? '#ff0044' : '#00ffff',
                      boxShadow: `0 0 10px ${animatedMetrics.csoc < 20 ? '#ff0044' : '#00ffff'}`
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-purple-400">Splunk Grid</span>
                  <span className="font-mono text-purple-400">{animatedMetrics.splunk?.toFixed(1) || 0}%</span>
                </div>
                <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${animatedMetrics.splunk || 0}%`,
                      background: 'linear-gradient(90deg, #c084fc, #a855f7)',
                      boxShadow: '0 0 10px #c084fc'
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-pink-400">Chronicle Net</span>
                  <span className="font-mono text-pink-400">{animatedMetrics.chronicle?.toFixed(1) || 0}%</span>
                </div>
                <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${animatedMetrics.chronicle || 0}%`,
                      background: 'linear-gradient(90deg, #ff00ff, #e879f9)',
                      boxShadow: '0 0 10px #ff00ff'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Hexagonal Territory Grid */}
          <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-pink-500/30 overflow-hidden">
            <div className="p-4 border-b border-pink-500/20">
              <h3 className="text-sm font-bold text-pink-400 uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4" />
                Territorial Hex Grid
              </h3>
            </div>
            <canvas ref={hexMapRef} className="w-full h-[250px]" />
          </div>
        </div>
      </div>

      {/* Country Breakdown Table */}
      {selectedRegion !== 'ALL' && regionalData[selectedRegion]?.breakdown && (
        <div className="relative z-20 mt-8 bg-black/80 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-6">
          <h2 className="text-xl font-bold text-purple-400 mb-4">TERRITORIAL ANALYSIS - {selectedRegion}</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Territory</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">Nodes</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">Shield %</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">Breach</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">Status</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">Quantum State</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(regionalData[selectedRegion].breakdown).map(([country, data]) => (
                  <tr 
                    key={country} 
                    className="border-b border-gray-800 hover:bg-gray-900/50 transition-colors cursor-pointer"
                    onMouseEnter={() => setHoveredCountry(country)}
                    onMouseLeave={() => setHoveredCountry(null)}
                    style={{
                      background: hoveredCountry === country ? 'rgba(0, 255, 255, 0.05)' : 'transparent',
                      boxShadow: hoveredCountry === country ? 'inset 0 0 30px rgba(0, 255, 255, 0.1)' : 'none'
                    }}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-cyan-400" />
                        <span className="text-white font-medium">{country}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-gray-300">{data.assets.toLocaleString()}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-mono font-bold ${
                        data.coverage < 20 ? 'text-red-400' : 
                        data.coverage < 50 ? 'text-yellow-400' : 
                        'text-green-400'
                      }`}>
                        {data.coverage}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-red-400">{data.gap.toLocaleString()}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        data.status === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/50' :
                        'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                      }`}>
                        {data.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-xs font-mono text-purple-400">
                        {data.coverage < 20 ? 'COLLAPSED' : 'UNSTABLE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Regional Action Items */}
      <div className="relative z-20 mt-8 grid grid-cols-3 gap-4">
        <div className="bg-black/80 backdrop-blur-xl rounded-xl border border-red-500/30 p-4">
          <h3 className="text-sm font-bold text-red-400 mb-2">EMEA QUANTUM COLLAPSE</h3>
          <p className="text-xs text-gray-300">12.3% shield integrity - Deploy 5 quantum stabilizers immediately</p>
        </div>
        <div className="bg-black/80 backdrop-blur-xl rounded-xl border border-yellow-500/30 p-4">
          <h3 className="text-sm font-bold text-yellow-400 mb-2">APAC TEMPORAL DRIFT</h3>
          <p className="text-xs text-gray-300">15.8% coverage - Establish Singapore quantum hub for timeline sync</p>
        </div>
        <div className="bg-black/80 backdrop-blur-xl rounded-xl border border-cyan-500/30 p-4">
          <h3 className="text-sm font-bold text-cyan-400 mb-2">AMERICAS ENTANGLEMENT</h3>
          <p className="text-xs text-gray-300">Leverage US quantum infrastructure to stabilize Canada/Mexico nodes</p>
        </div>
      </div>
    </div>
  );
};

export default RegionalCountryView;