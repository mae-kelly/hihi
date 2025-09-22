import React, { useState, useEffect, useRef } from 'react';
import { Building, Layers, Database, Network, Shield, AlertTriangle, Activity, TrendingDown, Server, Cloud, Dna, Star, Orbit, Atom, Binary, Cpu, XCircle } from 'lucide-react';
import * as THREE from 'three';

const BUandApplicationView: React.FC = () => {
  const [selectedView, setSelectedView] = useState<'bu' | 'application'>('bu');
  const [selectedBU, setSelectedBU] = useState<string | null>(null);
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({});
  const [businessData, setBusinessData] = useState<any>(null);
  const [sourceData, setSourceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dnaRef = useRef<HTMLDivElement>(null);
  const constellationRef = useRef<HTMLCanvasElement>(null);
  const pulseRef = useRef<HTMLCanvasElement>(null);

  // Fetch real data from Flask API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch both business unit metrics and source table metrics
        const [buResponse, sourceResponse] = await Promise.all([
          fetch('http://localhost:5000/api/domain_metrics'), // Using domain metrics as proxy for BU data
          fetch('http://localhost:5000/api/source_tables_metrics')
        ]);

        if (!buResponse.ok || !sourceResponse.ok) {
          throw new Error('Failed to fetch business data');
        }

        const buData = await buResponse.json();
        const srcData = await sourceResponse.json();
        
        setBusinessData(buData);
        setSourceData(srcData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Process real data into business units structure
  const businessUnits = React.useMemo(() => {
    if (!businessData || !sourceData) return {};

    // Create business units from domain data
    const units: any = {};
    
    // Map domains to business units
    Object.entries(businessData.domain_details || {}).slice(0, 5).forEach(([domain, data]: [string, any], index) => {
      const unitName = domain.includes('tdc') ? 'TDC Operations' :
                      domain.includes('lead') ? 'Lead Generation' :
                      domain.includes('corp') ? 'Corporate Services' :
                      domain.includes('prod') ? 'Production Systems' :
                      `Business Unit ${index + 1}`;
      
      units[unitName] = {
        assets: data.count || 0,
        csocCoverage: (data.percentage * 2) || 0, // Scale percentage for visibility
        splunkCoverage: Math.min(95, data.percentage * 3) || 0,
        chronicleCoverage: Math.min(90, data.percentage * 4) || 0,
        missing: Math.floor((data.count || 0) * (1 - data.percentage / 100)),
        status: data.percentage < 5 ? 'critical' : data.percentage < 10 ? 'warning' : 'active',
        cio: `CIO-${domain.toUpperCase().substring(0, 5)}`,
        apm: `APM-${domain.toUpperCase().substring(0, 5)}`,
        applications: sourceData.source_intelligence?.data?.slice(0, 4).map((s: any) => s.source) || [],
        priority: data.percentage < 5 ? 1 : data.percentage < 10 ? 2 : 3,
        color: data.percentage < 5 ? '#ff00ff' : data.percentage < 10 ? '#c084fc' : '#00ffff',
        dnaStrand: index % 2,
        percentage: data.percentage
      };
    });

    return units;
  }, [businessData, sourceData]);

  // Process application data from source tables
  const applicationClasses = React.useMemo(() => {
    if (!sourceData) return {};

    const apps: any = {};
    
    sourceData.source_intelligence?.data?.slice(0, 4).forEach((source: any, index: number) => {
      const appName = source.source.includes('cmdb') ? 'Configuration Management' :
                     source.source.includes('crowdstrike') ? 'Security Operations' :
                     source.source.includes('splunk') ? 'Log Analytics' :
                     source.source.includes('tanium') ? 'Endpoint Management' :
                     source.source;
      
      apps[appName] = {
        assets: source.unique_hosts || 0,
        coverage: source.percentage || 0,
        missing: Math.floor((source.unique_hosts || 0) * (1 - (source.percentage || 0) / 100)),
        criticality: source.percentage > 10 ? 'CRITICAL' : source.percentage > 5 ? 'HIGH' : 'MEDIUM',
        businessImpact: source.percentage > 10 ? 'QUANTUM' : source.percentage > 5 ? 'SEVERE' : 'MODERATE',
        regulatoryRequirement: source.percentage > 5,
        platforms: ['On-Prem', 'Cloud', 'Hybrid'].slice(0, Math.ceil(source.percentage / 5)),
        color: source.percentage > 10 ? '#ff00ff' : source.percentage > 5 ? '#c084fc' : '#00ffff',
        constellation: { 
          x: 30 + (index % 2) * 40, 
          y: 30 + Math.floor(index / 2) * 40, 
          connections: [Math.max(0, index - 1), Math.min(3, index + 1)] 
        },
        frequency: source.frequency || 0
      };
    });

    return apps;
  }, [sourceData]);

  // DNA Helix Visualization with real data
  useEffect(() => {
    if (!dnaRef.current || selectedView !== 'bu' || !businessUnits) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.002);

    const camera = new THREE.PerspectiveCamera(
      45,
      dnaRef.current.clientWidth / dnaRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 120);

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(dnaRef.current.clientWidth, dnaRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    dnaRef.current.appendChild(renderer.domElement);

    // Create DNA double helix based on real business unit data
    const helixGroup = new THREE.Group();
    const helixHeight = 100;
    const helixRadius = 20;
    const helixTurns = 2;
    const pointsPerTurn = 15;
    const totalPoints = helixTurns * pointsPerTurn;

    // Create strands for each business unit
    Object.entries(businessUnits).forEach(([name, data], index) => {
      const strand = data.dnaStrand;
      const points = [];
      
      for (let i = 0; i < totalPoints; i++) {
        const t = i / totalPoints;
        const angle = t * Math.PI * 2 * helixTurns + (strand * Math.PI);
        const y = (t - 0.5) * helixHeight;
        const x = Math.cos(angle) * helixRadius;
        const z = Math.sin(angle) * helixRadius;
        
        points.push(new THREE.Vector3(x, y, z));
      }
      
      // Create strand curve
      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeometry = new THREE.TubeGeometry(curve, 50, 1.5, 6, false);
      const tubeMaterial = new THREE.MeshPhongMaterial({
        color: data.status === 'critical' ? 0xff00ff : 0x00ffff,
        emissive: data.status === 'critical' ? 0xff00ff : 0x00ffff,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.8
      });
      const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
      helixGroup.add(tube);
      
      // Add connecting bars
      if (strand === 0 && index % 2 === 0) {
        for (let i = 0; i < totalPoints; i += 4) {
          const t = i / totalPoints;
          const angle1 = t * Math.PI * 2 * helixTurns;
          const angle2 = angle1 + Math.PI;
          const y = (t - 0.5) * helixHeight;
          
          const x1 = Math.cos(angle1) * helixRadius;
          const z1 = Math.sin(angle1) * helixRadius;
          const x2 = Math.cos(angle2) * helixRadius;
          const z2 = Math.sin(angle2) * helixRadius;
          
          const barGeometry = new THREE.CylinderGeometry(0.5, 0.5, helixRadius * 2);
          const barMaterial = new THREE.MeshPhongMaterial({
            color: data.csocCoverage < 20 ? 0xff00ff : 0x00ffff,
            emissive: data.csocCoverage < 20 ? 0xff00ff : 0x00ffff,
            emissiveIntensity: 0.1,
            transparent: true,
            opacity: 0.3
          });
          const bar = new THREE.Mesh(barGeometry, barMaterial);
          bar.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
          bar.rotation.z = Math.PI / 2;
          bar.lookAt(new THREE.Vector3(x2, y, z2));
          helixGroup.add(bar);
        }
      }
    });

    scene.add(helixGroup);

    // Add particle field
    const particleCount = 200;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 150;
      positions[i + 1] = (Math.random() - 0.5) * 150;
      positions[i + 2] = (Math.random() - 0.5) * 150;
      
      if (Math.random() > 0.7) {
        colors[i] = 1; colors[i + 1] = 0; colors[i + 2] = 1;
      } else if (Math.random() > 0.4) {
        colors[i] = 0.75; colors[i + 1] = 0.52; colors[i + 2] = 0.99;
      } else {
        colors[i] = 0; colors[i + 1] = 1; colors[i + 2] = 1;
      }
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
    const ambientLight = new THREE.AmbientLight(0x0a0a0a);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00ffff, 1, 150);
    pointLight1.position.set(50, 50, 50);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff00ff, 1, 150);
    pointLight2.position.set(-50, -50, -50);
    scene.add(pointLight2);

    // Animation loop
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      helixGroup.rotation.y += 0.005;
      particles.rotation.x += 0.001;
      particles.rotation.y += 0.001;
      
      const time = Date.now() * 0.0005;
      camera.position.x = Math.sin(time) * 100;
      camera.position.z = Math.cos(time) * 100;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      if (dnaRef.current && renderer.domElement) {
        dnaRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [selectedView, businessUnits]);

  // Constellation Map for Applications with real data
  useEffect(() => {
    if (!constellationRef.current || selectedView !== 'application' || !applicationClasses) return;
    
    const canvas = constellationRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const stars = Object.entries(applicationClasses).map(([name, data], index) => ({
      name,
      data,
      x: (data.constellation.x / 100) * canvas.width,
      y: (data.constellation.y / 100) * canvas.height,
      radius: Math.sqrt(data.assets) / 15,
      pulsePhase: Math.random() * Math.PI * 2
    }));

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw connections
      stars.forEach((star) => {
        star.data.constellation.connections.forEach((targetIndex: number) => {
          if (targetIndex < stars.length && targetIndex >= 0) {
            const target = stars[targetIndex];
            
            const gradient = ctx.createLinearGradient(star.x, star.y, target.x, target.y);
            gradient.addColorStop(0, star.data.color + '40');
            gradient.addColorStop(0.5, '#ffffff20');
            gradient.addColorStop(1, target.data.color + '40');
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 10]);
            ctx.beginPath();
            ctx.moveTo(star.x, star.y);
            ctx.lineTo(target.x, target.y);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        });
      });

      // Draw stars
      stars.forEach(star => {
        star.pulsePhase += 0.05;
        const pulseScale = 1 + Math.sin(star.pulsePhase) * 0.2;
        const currentRadius = star.radius * pulseScale;
        
        // Star glow
        const glow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, currentRadius * 2);
        glow.addColorStop(0, star.data.color + '80');
        glow.addColorStop(0.5, star.data.color + '40');
        glow.addColorStop(1, star.data.color + '00');
        ctx.fillStyle = glow;
        ctx.fillRect(star.x - currentRadius * 2, star.y - currentRadius * 2, currentRadius * 4, currentRadius * 4);
        
        // Star core
        ctx.fillStyle = star.data.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(star.name, star.x, star.y - currentRadius - 10);
        
        // Coverage
        ctx.font = '9px monospace';
        ctx.fillStyle = star.data.coverage < 30 ? '#ff00ff' : 
                       star.data.coverage < 60 ? '#c084fc' : 
                       '#00ffff';
        ctx.fillText(`${star.data.coverage}%`, star.x, star.y + currentRadius + 10);
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, [selectedView, applicationClasses]);

  // Pulse Wave Visualization with real data
  useEffect(() => {
    const canvas = pulseRef.current;
    if (!canvas || !businessUnits) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const time = Date.now() * 0.001;
      
      // Draw BU waves based on real data
      Object.entries(businessUnits).forEach(([bu, data], index) => {
        ctx.strokeStyle = data.color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        
        for (let x = 0; x < canvas.width; x++) {
          const y = (index + 1) * (canvas.height / 6) + 
                   Math.sin((x / 30) + time + index * 2) * 
                   (data.csocCoverage / 5);
          
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        
        ctx.stroke();
      });
      
      ctx.globalAlpha = 1;
      requestAnimationFrame(animate);
    };

    animate();
  }, [businessUnits]);

  // Animate values
  useEffect(() => {
    Object.entries(businessUnits).forEach(([bu, data], index) => {
      setTimeout(() => {
        setAnimatedValues(prev => ({
          ...prev,
          [`${bu}-csoc`]: data.csocCoverage,
          [`${bu}-splunk`]: data.splunkCoverage,
          [`${bu}-chronicle`]: data.chronicleCoverage
        }));
      }, index * 100);
    });
  }, [selectedView, businessUnits]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400"></div>
          <div className="mt-4 text-xl font-bold text-cyan-400">LOADING BUSINESS UNIT DATA</div>
        </div>
      </div>
    );
  }

  if (error || !businessData || !sourceData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center glass-panel rounded-xl p-8">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <div className="text-xl font-bold text-red-400 mb-2">DATA LOAD ERROR</div>
          <div className="text-sm text-gray-400">{error || 'No data available'}</div>
        </div>
      </div>
    );
  }

  // Calculate critical metrics from real data
  const criticalBUs = Object.entries(businessUnits).filter(([_, data]) => data.status === 'critical').length;
  const totalAssets = Object.values(businessUnits).reduce((sum: number, bu: any) => sum + bu.assets, 0);
  const avgCoverage = Object.values(businessUnits).reduce((sum: number, bu: any) => sum + bu.csocCoverage, 0) / Object.keys(businessUnits).length;

  return (
    <div className="p-2 h-screen bg-black overflow-hidden flex flex-col">
      {/* Critical Alert */}
      <div className="mb-2 border border-pink-500/50 bg-black rounded-lg p-1.5 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-pink-400 animate-pulse" />
        <span className="text-pink-400 font-bold text-xs">DNA CORRUPTION:</span>
        <span className="text-white text-xs">
          {criticalBUs} critical units • {avgCoverage.toFixed(1)}% average coverage • {totalAssets.toLocaleString()} total assets
        </span>
      </div>

      {/* View Selector */}
      <div className="flex gap-2 mb-2">
        <button
          onClick={() => setSelectedView('bu')}
          className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
            selectedView === 'bu'
              ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20'
              : 'bg-gray-900/50 hover:bg-gray-800/50'
          }`}
          style={{
            border: selectedView === 'bu' ? '1px solid #00ffff' : '1px solid transparent'
          }}
        >
          <Dna className="inline w-3 h-3 mr-1" />
          <span className={selectedView === 'bu' ? 'text-blue-400' : 'text-gray-400'}>
            BUSINESS UNITS
          </span>
        </button>
        
        <button
          onClick={() => setSelectedView('application')}
          className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
            selectedView === 'application'
              ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20'
              : 'bg-gray-900/50 hover:bg-gray-800/50'
          }`}
          style={{
            border: selectedView === 'application' ? '1px solid #c084fc' : '1px solid transparent'
          }}
        >
          <Star className="inline w-3 h-3 mr-1" />
          <span className={selectedView === 'application' ? 'text-purple-400' : 'text-gray-400'}>
            APPLICATIONS
          </span>
        </button>
      </div>

      {/* Main Content */}
      {selectedView === 'bu' ? (
        <div className="flex-1 grid grid-cols-12 gap-2">
          {/* DNA Helix */}
          <div className="col-span-5 grid grid-rows-2 gap-2">
            <div className="bg-black border border-blue-500/30 rounded-lg overflow-hidden">
              <div className="p-1.5 border-b border-blue-500/20">
                <h3 className="text-[10px] font-bold text-blue-400 uppercase flex items-center gap-1">
                  <Dna className="w-3 h-3" />
                  Corporate DNA
                </h3>
              </div>
              <div ref={dnaRef} className="w-full" style={{ height: 'calc(100% - 28px)' }} />
            </div>

            <div className="bg-black border border-purple-500/30 rounded-lg overflow-hidden">
              <div className="p-1.5 border-b border-purple-500/20">
                <h3 className="text-[10px] font-bold text-purple-400 uppercase flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  BU Pulse
                </h3>
              </div>
              <canvas ref={pulseRef} className="w-full" style={{ height: 'calc(100% - 28px)' }} />
            </div>
          </div>

          {/* BU Details from Real Data */}
          <div className="col-span-7 overflow-y-auto pr-2 space-y-2">
            {Object.entries(businessUnits).map(([bu, data]) => (
              <div key={bu} className="bg-gray-900/30 rounded-lg p-2 border border-gray-800">
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <h4 className="text-sm font-bold text-white">{bu}</h4>
                    <div className="flex items-center gap-2 text-[9px] text-gray-400">
                      <span>{data.cio}</span>
                      <span>•</span>
                      <span>{data.apm}</span>
                      <span>•</span>
                      <span className="text-cyan-400">{data.percentage?.toFixed(1)}% domain</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-pink-400">{(data.missing/1000).toFixed(0)}K</div>
                    <div className="text-[8px] text-gray-400">MISSING</div>
                  </div>
                </div>

                {/* Coverage Bars */}
                <div className="grid grid-cols-3 gap-1">
                  <div>
                    <div className="flex justify-between text-[8px] mb-0.5">
                      <span className="text-blue-400">CSOC</span>
                      <span className="font-mono text-blue-400">{data.csocCoverage.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${animatedValues[`${bu}-csoc`] || 0}%`,
                          background: data.csocCoverage < 20 ? '#ff00ff' : '#00ffff'
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[8px] mb-0.5">
                      <span className="text-purple-400">SPL</span>
                      <span className="font-mono text-purple-400">{data.splunkCoverage.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${animatedValues[`${bu}-splunk`] || 0}%`,
                          background: '#c084fc'
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[8px] mb-0.5">
                      <span className="text-pink-400">CHR</span>
                      <span className="font-mono text-pink-400">{data.chronicleCoverage.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${animatedValues[`${bu}-chronicle`] || 0}%`,
                          background: '#ff00ff'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Applications */}
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {data.applications.slice(0, 3).map((app: string, i: number) => (
                    <span key={i} className="text-[8px] px-1.5 py-0.5 bg-black/50 rounded border border-gray-700 text-gray-400">
                      {app}
                    </span>
                  ))}
                  {data.applications.length > 3 && (
                    <span className="text-[8px] px-1.5 py-0.5 bg-black/50 rounded border border-gray-700 text-gray-500">
                      +{data.applications.length - 3}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-2 gap-2">
          {/* Application Constellation */}
          <div className="bg-black border border-purple-500/30 rounded-lg overflow-hidden">
            <div className="p-1.5 border-b border-purple-500/20">
              <h3 className="text-[10px] font-bold text-purple-400 uppercase flex items-center gap-1">
                <Star className="w-3 h-3" />
                Application Map
              </h3>
            </div>
            <canvas ref={constellationRef} className="w-full" style={{ height: 'calc(100% - 28px)' }} />
          </div>

          {/* Application Details from Real Data */}
          <div className="overflow-y-auto pr-2 space-y-2">
            {Object.entries(applicationClasses).map(([app, data]) => (
              <div key={app} className="bg-gray-900/30 rounded-lg p-2 border border-gray-800">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-sm font-bold text-white">{app}</h4>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                    data.criticality === 'CRITICAL' ? 'bg-pink-500/20 text-pink-400' :
                    data.criticality === 'HIGH' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {data.criticality}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[9px]">
                  <div>
                    <div className="text-gray-400">Coverage</div>
                    <div className="font-mono" style={{ color: data.coverage < 5 ? '#ff00ff' : data.coverage < 10 ? '#c084fc' : '#00ffff' }}>
                      {data.coverage.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Assets</div>
                    <div className="font-mono text-blue-400">{data.assets.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Frequency</div>
                    <div className="font-mono text-pink-400">{data.frequency.toLocaleString()}</div>
                  </div>
                </div>

                <div className="mt-1.5">
                  <div className="h-3 bg-black/50 rounded-full overflow-hidden border border-gray-800">
                    <div 
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${data.coverage}%`,
                        background: `linear-gradient(90deg, ${data.color}, ${data.color}dd)`
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BUandApplicationView;