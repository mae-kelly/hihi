import React, { useState, useEffect, useRef } from 'react';
import { Shield, CheckCircle, XCircle, AlertCircle, TrendingUp, TrendingDown, FileSearch, Database, Server, Activity, AlertTriangle, Layers, Binary, Zap, ChevronRight, X, Eye } from 'lucide-react';
import * as THREE from 'three';

const ComplianceMatrix: React.FC = () => {
  const [complianceData, setComplianceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<'splunk' | 'chronicle' | 'both'>('both');
  const [hostSearch, setHostSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hoveredPlatform, setHoveredPlatform] = useState<string | null>(null);
  const [selectedHost, setSelectedHost] = useState<any>(null);
  const [detailView, setDetailView] = useState<string | null>(null);
  const matrixRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLCanvasElement>(null);
  const waveRef = useRef<HTMLCanvasElement>(null);
  const intersectionRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const frameRef = useRef<number | null>(null);
  const platformMeshesRef = useRef<THREE.Mesh[]>([]);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  // Fetch compliance data with host enrichment
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Search for hosts with logging platforms
        const searchTerms = ['splunk', 'chronicle', 'log', 'logging'];
        let splunkHosts = 0;
        let chronicleHosts = 0;
        let totalHosts = 0;
        let bothPlatforms = 0;
        let detailedHosts: any[] = [];
        
        for (const term of searchTerms) {
          try {
            const response = await fetch(`http://localhost:5000/api/host_search?q=${term}`);
            if (response.ok) {
              const data = await response.json();
              totalHosts = Math.max(totalHosts, data.total_found || 0);
              
              // Analyze hosts for logging platforms
              data.hosts?.forEach((host: any) => {
                const sources = host.source_tables?.toLowerCase() || '';
                const hasSplunk = sources.includes('splunk');
                const hasChronicle = sources.includes('chronicle') || sources.includes('gsoc');
                
                if (hasSplunk) splunkHosts++;
                if (hasChronicle) chronicleHosts++;
                if (hasSplunk && hasChronicle) bothPlatforms++;
                
                detailedHosts.push({
                  ...host,
                  has_splunk: hasSplunk,
                  has_chronicle: hasChronicle,
                  compliance_score: (hasSplunk && hasChronicle) ? 100 : (hasSplunk || hasChronicle) ? 50 : 0
                });
              });
            }
          } catch (e) {
            console.error(`Search error for ${term}:`, e);
          }
        }
        
        // Get total from database
        const dbResponse = await fetch('http://localhost:5000/api/database_status');
        const dbData = await dbResponse.json();
        const actualTotal = dbData.row_count || totalHosts || 1000;
        
        // Calculate compliance
        const splunkCompliance = (splunkHosts / actualTotal) * 100;
        const chronicleCompliance = (chronicleHosts / actualTotal) * 100;
        const eitherPlatform = ((splunkHosts + chronicleHosts - bothPlatforms) / actualTotal) * 100;
        const neitherPlatform = 100 - eitherPlatform;
        
        setComplianceData({
          total_hosts: actualTotal,
          splunk_compliance: {
            compliance_percentage: splunkCompliance,
            compliant_hosts: splunkHosts,
            non_compliant_hosts: actualTotal - splunkHosts,
            status: splunkCompliance > 70 ? 'GOOD' : splunkCompliance > 40 ? 'WARNING' : 'CRITICAL'
          },
          chronicle_compliance: {
            compliance_percentage: chronicleCompliance,
            compliant_hosts: chronicleHosts,
            non_compliant_hosts: actualTotal - chronicleHosts,
            status: chronicleCompliance > 70 ? 'GOOD' : chronicleCompliance > 40 ? 'WARNING' : 'CRITICAL'
          },
          combined_compliance: {
            both_platforms: { 
              host_count: bothPlatforms, 
              percentage: (bothPlatforms / actualTotal) * 100 
            },
            either_platform: { 
              host_count: splunkHosts + chronicleHosts - bothPlatforms, 
              percentage: eitherPlatform 
            },
            neither_platform: { 
              host_count: actualTotal - (splunkHosts + chronicleHosts - bothPlatforms), 
              percentage: neitherPlatform 
            },
            overall_status: eitherPlatform > 70 ? 'GOOD' : eitherPlatform > 40 ? 'WARNING' : 'CRITICAL'
          },
          sample_hosts: detailedHosts.slice(0, 100)
        });
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

  // Interactive 3D Compliance Visualization - Dual Platform Cylinders
  useEffect(() => {
    if (!matrixRef.current || !complianceData || loading) return;

    if (rendererRef.current) {
      rendererRef.current.dispose();
      if (matrixRef.current.contains(rendererRef.current.domElement)) {
        matrixRef.current.removeChild(rendererRef.current.domElement);
      }
    }

    const scene = new THREE.Scene();
    sceneRef.current = scene;
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
    rendererRef.current = renderer;
    
    renderer.setSize(matrixRef.current.clientWidth, matrixRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    matrixRef.current.appendChild(renderer.domElement);

    // Clear mesh references
    platformMeshesRef.current = [];

    // Create platform group
    const platformGroup = new THREE.Group();
    
    // Splunk Platform (Left) - Interactive
    if (complianceData.splunk_compliance) {
      const splunkGroup = new THREE.Group();
      const splunkCompliance = complianceData.splunk_compliance.compliance_percentage;
      
      const radius = 30;
      const height = 60;
      
      // Outer cylinder
      const geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
      const material = new THREE.MeshPhongMaterial({
        color: splunkCompliance > 50 ? 0x00d4ff : 0xa855f7,
        emissive: splunkCompliance > 50 ? 0x00d4ff : 0xa855f7,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.4
      });
      
      const cylinder = new THREE.Mesh(geometry, material);
      cylinder.rotation.x = Math.PI / 2;
      cylinder.userData = {
        platform: 'splunk',
        compliance: splunkCompliance,
        compliant: complianceData.splunk_compliance.compliant_hosts,
        total: complianceData.total_hosts
      };
      platformMeshesRef.current.push(cylinder);
      splunkGroup.add(cylinder);
      
      // Compliance level fill
      const levelHeight = height * (splunkCompliance / 100);
      const levelGeometry = new THREE.CylinderGeometry(radius - 5, radius - 5, levelHeight, 32);
      const levelMaterial = new THREE.MeshPhongMaterial({
        color: 0x00d4ff,
        emissive: 0x00d4ff,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.9
      });
      
      const levelMesh = new THREE.Mesh(levelGeometry, levelMaterial);
      levelMesh.position.y = (levelHeight - height) / 2;
      levelMesh.rotation.x = Math.PI / 2;
      levelMesh.userData = cylinder.userData;
      platformMeshesRef.current.push(levelMesh);
      splunkGroup.add(levelMesh);
      
      splunkGroup.position.x = -40;
      platformGroup.add(splunkGroup);
    }
    
    // Chronicle Platform (Right) - Interactive
    if (complianceData.chronicle_compliance) {
      const chronicleGroup = new THREE.Group();
      const chronicleCompliance = complianceData.chronicle_compliance.compliance_percentage;
      
      const radius = 30;
      const height = 60;
      
      const geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
      const material = new THREE.MeshPhongMaterial({
        color: chronicleCompliance > 50 ? 0x00d4ff : 0xa855f7,
        emissive: chronicleCompliance > 50 ? 0x00d4ff : 0xa855f7,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.4
      });
      
      const cylinder = new THREE.Mesh(geometry, material);
      cylinder.rotation.x = Math.PI / 2;
      cylinder.userData = {
        platform: 'chronicle',
        compliance: chronicleCompliance,
        compliant: complianceData.chronicle_compliance.compliant_hosts,
        total: complianceData.total_hosts
      };
      platformMeshesRef.current.push(cylinder);
      chronicleGroup.add(cylinder);
      
      const levelHeight = height * (chronicleCompliance / 100);
      const levelGeometry = new THREE.CylinderGeometry(radius - 5, radius - 5, levelHeight, 32);
      const levelMaterial = new THREE.MeshPhongMaterial({
        color: 0x00d4ff,
        emissive: 0x00d4ff,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.9
      });
      
      const levelMesh = new THREE.Mesh(levelGeometry, levelMaterial);
      levelMesh.position.y = (levelHeight - height) / 2;
      levelMesh.rotation.x = Math.PI / 2;
      levelMesh.userData = cylinder.userData;
      platformMeshesRef.current.push(levelMesh);
      chronicleGroup.add(levelMesh);
      
      chronicleGroup.position.x = 40;
      platformGroup.add(chronicleGroup);
    }
    
    // Central bridge connection showing overlap
    const bothCompliance = complianceData.combined_compliance.both_platforms.percentage;
    const bridgeGeometry = new THREE.CylinderGeometry(10, 10, 80, 32);
    const bridgeMaterial = new THREE.MeshPhongMaterial({
      color: bothCompliance > 50 ? 0x00d4ff : 0xa855f7,
      emissive: bothCompliance > 50 ? 0x00d4ff : 0xa855f7,
      emissiveIntensity: 0.1,
      transparent: true,
      opacity: bothCompliance / 100
    });
    const bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
    bridge.rotation.z = Math.PI / 2;
    bridge.position.y = 30;
    bridge.userData = {
      platform: 'both',
      compliance: bothCompliance,
      compliant: complianceData.combined_compliance.both_platforms.host_count,
      total: complianceData.total_hosts
    };
    platformMeshesRef.current.push(bridge);
    platformGroup.add(bridge);
    
    scene.add(platformGroup);
    
    // Non-compliant particles
    const noncompliantHosts = complianceData.combined_compliance?.neither_platform.host_count || 0;
    const particleCount = Math.min(500, Math.max(50, Math.floor(noncompliantHosts / 100)));
    
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 200;
      positions[i + 1] = (Math.random() - 0.5) * 100;
      positions[i + 2] = (Math.random() - 0.5) * 200;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
      size: 2,
      color: 0xa855f7,
      transparent: true,
      opacity: 0.6
    });
    
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const pointLight1 = new THREE.PointLight(0x00d4ff, 1, 200);
    pointLight1.position.set(100, 50, 100);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0xa855f7, 1, 200);
    pointLight2.position.set(-100, 50, -100);
    scene.add(pointLight2);
    
    camera.position.set(0, 100, 150);
    camera.lookAt(0, 30, 0);

    // Mouse interaction
    const handleMouseMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(platformMeshesRef.current);
      
      if (intersects.length > 0) {
        const hoveredMesh = intersects[0].object;
        setHoveredPlatform(hoveredMesh.userData.platform);
        document.body.style.cursor = 'pointer';
        hoveredMesh.scale.setScalar(1.1);
      } else {
        setHoveredPlatform(null);
        document.body.style.cursor = 'default';
        platformMeshesRef.current.forEach(mesh => mesh.scale.setScalar(1));
      }
    };

    const handleClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(platformMeshesRef.current);
      
      if (intersects.length > 0) {
        const clickedMesh = intersects[0].object;
        setSelectedPlatform(clickedMesh.userData.platform);
        setDetailView('platform');
      }
    };

    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('click', handleClick);
    
    // Animation
    const animate = () => {
      if (!sceneRef.current) return;
      frameRef.current = requestAnimationFrame(animate);
      
      platformGroup.rotation.y += 0.002;
      particles.rotation.y += 0.001;
      
      const time = Date.now() * 0.0003;
      camera.position.x = Math.sin(time) * 180;
      camera.position.z = Math.cos(time) * 180;
      camera.lookAt(0, 30, 0);
      
      renderer.render(scene, camera);
    };
    
    animate();

    return () => {
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('click', handleClick);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (matrixRef.current && matrixRef.current.contains(rendererRef.current.domElement)) {
          matrixRef.current.removeChild(rendererRef.current.domElement);
        }
      }
    };
  }, [complianceData, loading]);
  
  // Interactive Compliance Flow
  useEffect(() => {
    const canvas = flowRef.current;
    if (!canvas || !complianceData) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Make canvas clickable
    const handleCanvasClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const y = event.clientY - rect.top;
      
      if (y < canvas.height / 2) {
        setSelectedPlatform('splunk');
        setDetailView('flow');
      } else {
        setSelectedPlatform('chronicle');
        setDetailView('flow');
      }
    };
    
    canvas.addEventListener('click', handleCanvasClick);
    
    let animationId: number;
    let flowOffset = 0;
    
    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      flowOffset += 3;
      if (flowOffset > 100) flowOffset = 0;
      
      // Splunk flow
      if (selectedPlatform === 'splunk' || selectedPlatform === 'both') {
        const splunkY = canvas.height / 3;
        const splunkWidth = (canvas.width * 0.8) * (complianceData.splunk_compliance?.compliance_percentage || 0) / 100;
        
        // Animated flow particles
        for (let i = 0; i < 5; i++) {
          const x = (flowOffset + i * 20) % canvas.width;
          if (x < splunkWidth + 50) {
            const gradient = ctx.createRadialGradient(x, splunkY, 0, x, splunkY, 10);
            gradient.addColorStop(0, 'rgba(0, 212, 255, 0.8)');
            gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, splunkY, 10, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        
        // Main flow bar
        const splunkGradient = ctx.createLinearGradient(0, splunkY, splunkWidth, splunkY);
        splunkGradient.addColorStop(0, '#00d4ff');
        splunkGradient.addColorStop(1, '#00d4ff40');
        
        ctx.strokeStyle = splunkGradient;
        ctx.lineWidth = 30;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(50, splunkY);
        ctx.lineTo(50 + splunkWidth, splunkY);
        ctx.stroke();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('SPLUNK', 50, splunkY - 20);
        
        ctx.fillStyle = '#00d4ff';
        ctx.font = 'bold 16px monospace';
        ctx.fillText(
          `${complianceData.splunk_compliance?.compliance_percentage?.toFixed(1) || '0.0'}%`,
          canvas.width - 100,
          splunkY + 5
        );
      }
      
      // Chronicle flow
      if (selectedPlatform === 'chronicle' || selectedPlatform === 'both') {
        const chronicleY = (canvas.height / 3) * 2;
        const chronicleWidth = (canvas.width * 0.8) * (complianceData.chronicle_compliance?.compliance_percentage || 0) / 100;
        
        // Animated flow particles
        for (let i = 0; i < 5; i++) {
          const x = (flowOffset + i * 20) % canvas.width;
          if (x < chronicleWidth + 50) {
            const gradient = ctx.createRadialGradient(x, chronicleY, 0, x, chronicleY, 10);
            gradient.addColorStop(0, 'rgba(0, 212, 255, 0.8)');
            gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, chronicleY, 10, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        
        const chronicleGradient = ctx.createLinearGradient(0, chronicleY, chronicleWidth, chronicleY);
        chronicleGradient.addColorStop(0, '#00d4ff');
        chronicleGradient.addColorStop(1, '#00d4ff40');
        
        ctx.strokeStyle = chronicleGradient;
        ctx.lineWidth = 30;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(50, chronicleY);
        ctx.lineTo(50 + chronicleWidth, chronicleY);
        ctx.stroke();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('CHRONICLE', 50, chronicleY - 20);
        
        ctx.fillStyle = '#00d4ff';
        ctx.font = 'bold 16px monospace';
        ctx.fillText(
          `${complianceData.chronicle_compliance?.compliance_percentage?.toFixed(1) || '0.0'}%`,
          canvas.width - 100,
          chronicleY + 5
        );
      }
      
      animationId = requestAnimationFrame(animate);
    };
    
    animate();

    return () => {
      canvas.removeEventListener('click', handleCanvasClick);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [complianceData, selectedPlatform]);

  // Venn Diagram Intersection Visualization
  useEffect(() => {
    const canvas = intersectionRef.current;
    if (!canvas || !complianceData) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    let animationId: number;
    let time = 0;
    
    const animate = () => {
      time += 0.02;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 60;
      
      // Splunk circle
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX - 30, centerY, radius + Math.sin(time) * 5, 0, Math.PI * 2);
      ctx.stroke();
      
      // Chronicle circle
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)';
      ctx.beginPath();
      ctx.arc(centerX + 30, centerY, radius + Math.cos(time) * 5, 0, Math.PI * 2);
      ctx.stroke();
      
      // Intersection
      ctx.fillStyle = 'rgba(0, 212, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(centerX - 30, centerY, radius, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = 'rgba(168, 85, 247, 0.2)';
      ctx.beginPath();
      ctx.arc(centerX + 30, centerY, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Labels
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      
      const bothPercentage = complianceData.combined_compliance?.both_platforms.percentage || 0;
      ctx.fillText(`${bothPercentage.toFixed(1)}%`, centerX, centerY);
      ctx.fillText('BOTH', centerX, centerY + 15);
      
      animationId = requestAnimationFrame(animate);
    };
    
    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [complianceData]);
  
  // Handle host search
  const handleHostSearch = async () => {
    if (!hostSearch) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/host_search?q=${hostSearch}`);
      if (response.ok) {
        const data = await response.json();
        const enrichedResults = data.hosts?.map((host: any) => {
          const sources = host.source_tables?.toLowerCase() || '';
          return {
            ...host,
            has_splunk: sources.includes('splunk'),
            has_chronicle: sources.includes('chronicle') || sources.includes('gsoc'),
            logging_status: sources.includes('splunk') || sources.includes('chronicle') ? 'COMPLIANT' : 'NON_COMPLIANT'
          };
        }) || [];
        setSearchResults(enrichedResults);
        setDetailView('search');
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
          <div className="mt-4 text-lg font-bold text-cyan-400">ANALYZING LOGGING COMPLIANCE</div>
        </div>
      </div>
    );
  }
  
  const overallCompliance = complianceData?.combined_compliance?.either_platform.percentage || 0;
  
  return (
    <div className="h-full flex flex-col p-4">
      {overallCompliance < 40 && (
        <div className="mb-3 bg-black border border-purple-500/50 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-purple-400 animate-pulse" />
            <span className="text-purple-400 font-bold text-sm">CRITICAL:</span>
            <span className="text-white text-sm">
              {complianceData?.combined_compliance?.neither_platform.percentage?.toFixed(1)}% of hosts not logging to any platform
            </span>
          </div>
        </div>
      )}

      {/* Interactive Search Bar */}
      <div className="mb-3 flex gap-2">
        <input
          type="text"
          value={hostSearch}
          onChange={(e) => setHostSearch(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleHostSearch()}
          placeholder="Search hosts for logging compliance..."
          className="flex-1 px-3 py-2 bg-black/50 border border-cyan-400/30 rounded-lg text-white placeholder-gray-400"
        />
        <button
          onClick={handleHostSearch}
          className="px-4 py-2 bg-cyan-500/20 border border-cyan-500 rounded-lg text-cyan-400 hover:bg-cyan-500/30 transition-all"
        >
          SEARCH
        </button>
      </div>
      
      <div className="flex-1 grid grid-cols-12 gap-4">
        {/* Interactive 3D Matrix */}
        <div className="col-span-7">
          <div className="h-full glass-panel rounded-xl">
            <div className="p-3 border-b border-cyan-400/20">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-cyan-400">INTERACTIVE COMPLIANCE MATRIX</h2>
                <div className="flex gap-2">
                  {['both', 'splunk', 'chronicle'].map(platform => (
                    <button
                      key={platform}
                      onClick={() => setSelectedPlatform(platform as any)}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                        selectedPlatform === platform
                          ? 'bg-cyan-400/20 border border-cyan-400 text-cyan-400'
                          : 'bg-black/50 border border-gray-700 text-gray-400'
                      }`}
                    >
                      {platform.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-1">Click cylinders to explore platform details</div>
            </div>
            
            <div ref={matrixRef} className="w-full" style={{ height: 'calc(100% - 80px)' }} />
            
            {hoveredPlatform && (
              <div className="absolute bottom-4 left-4 bg-black/95 border border-cyan-400/50 rounded-lg p-3">
                <div className="text-sm font-bold text-cyan-400 uppercase">{hoveredPlatform}</div>
                <div className="text-xs text-white mt-1">Click for detailed analysis →</div>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Column - Interactive Metrics */}
        <div className="col-span-5 space-y-3">
          {/* Overall Compliance */}
          <div className="glass-panel rounded-xl p-4 cursor-pointer hover:border-cyan-400 transition-all"
               onClick={() => setDetailView('overview')}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">OVERALL LOGGING COMPLIANCE</h3>
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="text-3xl font-bold text-cyan-400 mb-2">
              {overallCompliance.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-400 mb-3">
              {complianceData?.combined_compliance?.either_platform.host_count?.toLocaleString() || 0} / {complianceData?.total_hosts?.toLocaleString() || 0} hosts
            </div>
          </div>
          
          {/* Platform Cards */}
          <div className="grid grid-cols-2 gap-2">
            <div className="glass-panel rounded-lg p-3 cursor-pointer hover:scale-105 transition-transform"
                 onClick={() => { setSelectedPlatform('splunk'); setDetailView('platform'); }}>
              <Server className="w-4 h-4 text-cyan-400 mb-2" />
              <div className="text-xs font-bold text-white mb-1">SPLUNK</div>
              <div className="text-2xl font-bold text-cyan-400">
                {complianceData?.splunk_compliance?.compliance_percentage?.toFixed(1) || '0.0'}%
              </div>
            </div>
            
            <div className="glass-panel rounded-lg p-3 cursor-pointer hover:scale-105 transition-transform"
                 onClick={() => { setSelectedPlatform('chronicle'); setDetailView('platform'); }}>
              <Database className="w-4 h-4 text-purple-400 mb-2" />
              <div className="text-xs font-bold text-white mb-1">CHRONICLE</div>
              <div className="text-2xl font-bold text-purple-400">
                {complianceData?.chronicle_compliance?.compliance_percentage?.toFixed(1) || '0.0'}%
              </div>
            </div>
          </div>
          
          {/* Interactive Flow */}
          <div className="glass-panel rounded-xl p-3">
            <h3 className="text-sm font-bold text-purple-400 mb-2">PLATFORM COMPLIANCE FLOW</h3>
            <canvas ref={flowRef} className="w-full h-32 cursor-pointer" />
          </div>
          
          {/* Intersection Diagram */}
          <div className="glass-panel rounded-xl p-3">
            <h3 className="text-sm font-bold text-cyan-400 mb-2">PLATFORM INTERSECTION</h3>
            <canvas ref={intersectionRef} className="w-full h-32" />
          </div>
          
          {/* Wave Visualization */}
          <div className="glass-panel rounded-xl p-3">
            <h3 className="text-sm font-bold text-white mb-2">COMPLIANCE PULSE</h3>
            <canvas ref={waveRef} className="w-full h-24" />
          </div>
        </div>
      </div>

      {/* Detail View Modal */}
      {detailView && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-6">
          <div className="bg-black border-2 border-cyan-400/50 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-cyan-400/30 flex items-center justify-between">
              <h2 className="text-xl font-bold text-cyan-400">
                {detailView === 'platform' ? `${selectedPlatform?.toUpperCase()} PLATFORM DETAILS` :
                 detailView === 'search' ? 'HOST SEARCH RESULTS' :
                 'COMPLIANCE OVERVIEW'}
              </h2>
              <button onClick={() => setDetailView(null)} className="text-white hover:text-cyan-400">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              {detailView === 'search' && searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.slice(0, 20).map((host, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-black/30 rounded border border-gray-800 hover:border-cyan-400/30">
                      <div className="flex-1">
                        <span className="text-xs text-white font-mono">{host.host}</span>
                        {host.domain && <span className="text-xs text-gray-400 ml-2">{host.domain}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {host.has_splunk && <span className="text-xs px-1 py-0.5 bg-cyan-500/20 text-cyan-400 rounded">S</span>}
                        {host.has_chronicle && <span className="text-xs px-1 py-0.5 bg-purple-500/20 text-purple-400 rounded">C</span>}
                        <span className={`text-xs font-bold ${
                          host.logging_status === 'COMPLIANT' ? 'text-cyan-400' : 'text-purple-400'
                        }`}>
                          {host.logging_status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceMatrix;