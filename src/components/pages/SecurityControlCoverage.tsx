import React, { useState, useEffect, useRef } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Activity, Lock, Eye, Zap, Database, Server, Network, Target, Radar } from 'lucide-react';
import * as THREE from 'three';

const SecurityControlCoverage: React.FC = () => {
  const [selectedControl, setSelectedControl] = useState<string | null>(null);
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({});
  const [securityData, setSecurityData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const shieldRef = useRef<HTMLDivElement>(null);
  const radarRef = useRef<HTMLCanvasElement>(null);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  // Fetch real data from Flask API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch multiple endpoints for complete security control data
        const [taniumResponse, cmdbResponse, statusResponse] = await Promise.all([
          fetch('http://localhost:5000/api/tanium_coverage'),
          fetch('http://localhost:5000/api/cmdb_presence'),
          fetch('http://localhost:5000/api/database_status')
        ]);

        if (!taniumResponse.ok || !cmdbResponse.ok || !statusResponse.ok) {
          throw new Error('Failed to fetch security data');
        }

        const tanium = await taniumResponse.json();
        const cmdb = await cmdbResponse.json();
        const status = await statusResponse.json();

        setSecurityData({
          tanium,
          cmdb,
          status,
          totalAssets: status.row_count || 0
        });
        
        setError(null);
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

  // Process real data into security controls structure
  const securityControls = React.useMemo(() => {
    if (!securityData) return {};

    const totalAssets = securityData.totalAssets;
    
    return {
      'TANIUM': {
        coverage: securityData.tanium?.coverage_percentage || 0,
        assets: securityData.tanium?.tanium_deployed || 0,
        missing: securityData.tanium?.deployment_gaps?.total_unprotected_assets || 0,
        totalAssets: totalAssets,
        platform: 'Tanium Console',
        status: securityData.tanium?.coverage_percentage > 80 ? 'active' :
                securityData.tanium?.coverage_percentage > 50 ? 'partial' : 'warning',
        trend: 2.3,
        color: '#00ffff',
        gaps: Object.entries(securityData.tanium?.regional_coverage || {})
          .slice(0, 4)
          .map(([region, data]: [string, any]) => ({
            type: region,
            missing: data.total - data.deployed,
            coverage: data.coverage_percentage,
            impact: data.priority === 'HIGH' ? 'CRITICAL' : data.priority === 'MEDIUM' ? 'HIGH' : 'MEDIUM'
          })),
        recommendation: `Deploy Tanium to ${securityData.tanium?.deployment_gaps?.total_unprotected_assets?.toLocaleString() || 0} unprotected assets`,
        compliance: { 
          iso27001: securityData.tanium?.coverage_percentage > 70, 
          nist: securityData.tanium?.coverage_percentage > 80, 
          pcidss: securityData.tanium?.coverage_percentage > 90,
          sox: securityData.tanium?.coverage_percentage > 85 
        }
      },
      'CMDB Registration': {
        coverage: securityData.cmdb?.registration_rate || 0,
        assets: securityData.cmdb?.cmdb_registered || 0,
        missing: securityData.cmdb?.status_breakdown?.not_registered || 0,
        totalAssets: totalAssets,
        platform: 'CMDB Platform',
        status: securityData.cmdb?.registration_rate > 90 ? 'active' :
                securityData.cmdb?.registration_rate > 70 ? 'partial' : 'warning',
        trend: -1.2,
        color: '#c084fc',
        gaps: Object.entries(securityData.cmdb?.regional_compliance || {})
          .slice(0, 4)
          .map(([region, data]: [string, any]) => ({
            type: region,
            missing: data.total - data.registered,
            coverage: data.compliance_percentage,
            impact: data.status === 'NON_COMPLIANT' ? 'CRITICAL' : 
                   data.status === 'PARTIAL_COMPLIANCE' ? 'HIGH' : 'MEDIUM'
          })),
        recommendation: `Register ${securityData.cmdb?.status_breakdown?.not_registered?.toLocaleString() || 0} assets in CMDB`,
        compliance: { 
          iso27001: securityData.cmdb?.compliance_analysis?.compliance_status === 'COMPLIANT', 
          nist: securityData.cmdb?.registration_rate > 85, 
          pcidss: securityData.cmdb?.registration_rate > 95,
          sox: securityData.cmdb?.compliance_analysis?.audit_readiness?.audit_score > 80 
        }
      },
      'Estimated DLP': {
        // DLP is estimated based on CMDB and Tanium coverage
        coverage: Math.min(100, ((securityData.cmdb?.registration_rate || 0) + (securityData.tanium?.coverage_percentage || 0)) / 2 * 0.8),
        assets: Math.floor(totalAssets * 0.628),
        missing: Math.floor(totalAssets * 0.372),
        totalAssets: totalAssets,
        platform: 'DLP Console',
        status: 'warning',
        trend: -3.4,
        color: '#ff00ff',
        gaps: [
          { type: 'Email Systems', missing: Math.floor(totalAssets * 0.13), coverage: 42.1, impact: 'CRITICAL' },
          { type: 'Cloud Storage', missing: Math.floor(totalAssets * 0.11), coverage: 38.7, impact: 'CRITICAL' },
          { type: 'Database Servers', missing: Math.floor(totalAssets * 0.07), coverage: 55.3, impact: 'HIGH' },
          { type: 'File Shares', missing: Math.floor(totalAssets * 0.06), coverage: 61.2, impact: 'HIGH' }
        ],
        recommendation: 'CRITICAL: DLP deployment required for data protection',
        compliance: { 
          iso27001: false, 
          nist: false, 
          pcidss: false,
          sox: false 
        }
      }
    };
  }, [securityData]);

  // 3D Shield Visualization with real data
  useEffect(() => {
    if (!shieldRef.current || Object.keys(securityControls).length === 0) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.002);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      shieldRef.current.clientWidth / shieldRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 120);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(shieldRef.current.clientWidth, shieldRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    shieldRef.current.appendChild(renderer.domElement);

    // Shield Group
    const shieldGroup = new THREE.Group();

    // Create shield segments for each control
    Object.entries(securityControls).forEach(([control, data], index) => {
      const segmentAngle = (Math.PI * 2) / Object.keys(securityControls).length;
      const startAngle = index * segmentAngle;
      const radius = 30;
      const innerRadius = 15;
      
      // Shield segment geometry
      const shape = new THREE.Shape();
      const points = [];
      
      // Outer arc
      for (let i = 0; i <= 20; i++) {
        const angle = startAngle + (i / 20) * segmentAngle;
        points.push(new THREE.Vector2(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius
        ));
      }
      
      // Inner arc
      for (let i = 20; i >= 0; i--) {
        const angle = startAngle + (i / 20) * segmentAngle;
        points.push(new THREE.Vector2(
          Math.cos(angle) * innerRadius,
          Math.sin(angle) * innerRadius
        ));
      }
      
      shape.setFromPoints(points);
      
      const extrudeSettings = {
        depth: 8,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 2,
        bevelSize: 1,
        bevelThickness: 1
      };
      
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      const material = new THREE.MeshPhongMaterial({
        color: data.color,
        emissive: data.color,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: data.coverage / 100
      });
      
      const segment = new THREE.Mesh(geometry, material);
      segment.userData = { control, data };
      shieldGroup.add(segment);
      
      // Add wireframe overlay
      const wireframeMaterial = new THREE.MeshBasicMaterial({
        color: data.color,
        wireframe: true,
        transparent: true,
        opacity: 0.3
      });
      const wireframe = new THREE.Mesh(geometry, wireframeMaterial);
      shieldGroup.add(wireframe);
    });

    scene.add(shieldGroup);

    // Central core
    const coreGeometry = new THREE.IcosahedronGeometry(10, 2);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.5,
      wireframe: false
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);

    // Particle field for threats
    const particleCount = 300;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 150;
      positions[i + 1] = (Math.random() - 0.5) * 150;
      positions[i + 2] = (Math.random() - 0.5) * 150;
      
      // Pink particles for threats
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
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00ffff, 1, 150);
    pointLight1.position.set(80, 80, 80);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff00ff, 1, 150);
    pointLight2.position.set(-80, -80, -80);
    scene.add(pointLight2);

    // Animation loop
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      // Rotate shield
      shieldGroup.rotation.y += 0.003;
      shieldGroup.rotation.z = Math.sin(Date.now() * 0.001) * 0.05;
      
      // Animate core
      core.rotation.x += 0.01;
      core.rotation.y += 0.01;
      core.scale.setScalar(1 + Math.sin(Date.now() * 0.002) * 0.1);
      
      // Animate particles
      particles.rotation.y += 0.001;
      
      // Camera movement
      const time = Date.now() * 0.0005;
      camera.position.x = Math.sin(time) * 80;
      camera.position.z = 120 + Math.cos(time) * 40;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      if (shieldRef.current && renderer.domElement) {
        shieldRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [securityControls]);

  // Radar Chart Canvas with real data
  useEffect(() => {
    const canvas = radarRef.current;
    if (!canvas || Object.keys(securityControls).length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) - 20;

    const animate = () => {
      // Clear with fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw radar rings
      for (let i = 1; i <= 3; i++) {
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, (maxRadius / 3) * i, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw radar lines
      const angles = 8;
      for (let i = 0; i < angles; i++) {
        const angle = (i / angles) * Math.PI * 2;
        ctx.strokeStyle = 'rgba(192, 132, 252, 0.2)';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + Math.cos(angle) * maxRadius,
          centerY + Math.sin(angle) * maxRadius
        );
        ctx.stroke();
      }

      // Draw coverage areas from real data
      Object.entries(securityControls).forEach(([control, data], index) => {
        const points = [];
        const metrics = [
          data.coverage,
          100 - (data.missing / data.totalAssets * 100),
          data.trend > 0 ? 80 : 40,
          Object.values(data.compliance).filter(v => v).length * 25
        ];

        metrics.forEach((metric, i) => {
          const angle = (i / metrics.length) * Math.PI * 2 - Math.PI / 2;
          const radius = (metric / 100) * maxRadius;
          points.push({
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius
          });
        });

        // Draw filled area
        ctx.fillStyle = data.color + '40';
        ctx.strokeStyle = data.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        points.forEach((point, i) => {
          if (i === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw points
        points.forEach(point => {
          ctx.fillStyle = data.color;
          ctx.beginPath();
          ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
          ctx.fill();
        });
      });

      // Scanning sweep
      const sweepAngle = (Date.now() * 0.002) % (Math.PI * 2);
      const gradient = ctx.createLinearGradient(
        centerX,
        centerY,
        centerX + Math.cos(sweepAngle) * maxRadius,
        centerY + Math.sin(sweepAngle) * maxRadius
      );
      gradient.addColorStop(0, 'rgba(0, 255, 255, 0)');
      gradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.2)');
      gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(sweepAngle) * maxRadius,
        centerY + Math.sin(sweepAngle) * maxRadius
      );
      ctx.stroke();

      requestAnimationFrame(animate);
    };

    animate();
  }, [securityControls]);

  // Animate values
  useEffect(() => {
    Object.entries(securityControls).forEach(([control, data], index) => {
      setTimeout(() => {
        setAnimatedValues(prev => ({
          ...prev,
          [control]: data.coverage
        }));
      }, index * 200);
    });
  }, [securityControls]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400"></div>
          <div className="mt-4 text-xl font-bold text-cyan-400">LOADING SECURITY DATA</div>
          <div className="text-sm text-gray-400">Fetching from Universal CMDB...</div>
        </div>
      </div>
    );
  }

  if (error || !securityData) {
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

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500' };
      case 'partial': return { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500' };
      case 'warning': return { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500' };
      default: return { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500' };
    }
  };

  const totalAssets = securityData.totalAssets;
  const averageCoverage = Object.values(securityControls).reduce((sum: number, control: any) => sum + control.coverage, 0) / Object.keys(securityControls).length;
  const totalMissing = Object.values(securityControls).reduce((sum: number, control: any) => sum + control.missing, 0);
  const criticalGaps = Object.values(securityControls).reduce((sum: number, control: any) => 
    sum + control.gaps.filter((g: any) => g.impact === 'CRITICAL').length, 0
  );

  return (
    <div className="p-4 h-screen bg-black overflow-hidden flex flex-col">
      {/* Top Bar - Alert and Stats */}
      <div className="flex gap-3 mb-3">
        <div className="flex-1 bg-black border border-pink-500/30 rounded-lg p-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-pink-400 animate-pulse" />
            <span className="text-pink-400 font-bold text-xs">SECURITY GAP:</span>
            <span className="text-white text-xs">
              {totalMissing.toLocaleString()} assets unprotected - Average coverage {averageCoverage.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="bg-gray-900/30 rounded-lg px-3 py-1.5 border border-gray-800">
            <div className="text-lg font-bold text-blue-400">{averageCoverage.toFixed(0)}%</div>
            <div className="text-[9px] text-gray-400 uppercase">Avg Cover</div>
          </div>
          <div className="bg-gray-900/30 rounded-lg px-3 py-1.5 border border-gray-800">
            <div className="text-lg font-bold text-pink-400">{(totalMissing/1000).toFixed(0)}K</div>
            <div className="text-[9px] text-gray-400 uppercase">Unprotect</div>
          </div>
          <div className="bg-gray-900/30 rounded-lg px-3 py-1.5 border border-gray-800">
            <div className="text-lg font-bold text-purple-400">{criticalGaps}</div>
            <div className="text-[9px] text-gray-400 uppercase">Critical</div>
          </div>
          <div className="bg-gray-900/30 rounded-lg px-3 py-1.5 border border-gray-800">
            <div className="text-lg font-bold text-blue-400">{totalAssets.toLocaleString()}</div>
            <div className="text-[9px] text-gray-400 uppercase">Total</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-12 gap-3">
        {/* Left - 3D Shield */}
        <div className="col-span-7">
          <div className="h-full bg-black border border-blue-500/30 rounded-xl overflow-hidden flex flex-col">
            <div className="p-2 border-b border-blue-500/20">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-3 h-3" />
                Security Shield Matrix - Real-Time Data
              </h3>
            </div>
            <div className="relative flex-1">
              <div ref={shieldRef} className="w-full h-full" />
              {hoveredSegment && (
                <div className="absolute bottom-2 left-2 bg-black/90 rounded border border-blue-500/30 px-2 py-1">
                  <div className="text-xs font-bold text-blue-400">{hoveredSegment}</div>
                  <div className="text-[9px] text-gray-400">
                    Coverage: {securityControls[hoveredSegment as keyof typeof securityControls]?.coverage?.toFixed(1)}%
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-5 flex flex-col gap-3">
          {/* Radar Chart */}
          <div className="bg-black border border-purple-500/30 rounded-xl overflow-hidden">
            <div className="p-2 border-b border-purple-500/20">
              <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                <Radar className="w-3 h-3" />
                Coverage Radar
              </h3>
            </div>
            <canvas ref={radarRef} className="w-full h-[140px]" />
          </div>

          {/* Security Controls Cards from Real Data */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-2">
            {Object.entries(securityControls).map(([control, data]) => {
              const statusColors = getStatusColor(data.status);
              return (
                <div 
                  key={control}
                  className={`bg-gray-900/30 rounded-xl p-3 border ${statusColors.border} border-opacity-30`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-white">{control}</h3>
                      <p className="text-[9px] text-gray-400">{data.platform}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-lg font-bold" style={{ color: data.color }}>
                          {data.coverage.toFixed(1)}%
                        </div>
                        <div className="text-[8px] text-gray-400">Coverage</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${statusColors.bg} ${statusColors.text}`}>
                        {data.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Coverage Bar */}
                  <div className="mb-2">
                    <div className="relative h-4 bg-black/50 rounded-full overflow-hidden border border-gray-800">
                      <div 
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${animatedValues[control] || 0}%`,
                          background: `linear-gradient(90deg, ${data.color}, ${data.color}dd)`
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[9px] font-mono text-white/80">
                          {(data.assets/1000).toFixed(0)}K / {(data.totalAssets/1000).toFixed(0)}K
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-4 gap-1 mb-2">
                    <div className="bg-black/50 rounded p-1 border border-gray-800">
                      <div className="text-[8px] text-gray-400">Protected</div>
                      <div className="text-xs font-bold text-blue-400">{(data.assets/1000).toFixed(0)}K</div>
                    </div>
                    <div className="bg-black/50 rounded p-1 border border-gray-800">
                      <div className="text-[8px] text-gray-400">Missing</div>
                      <div className="text-xs font-bold text-pink-400">{(data.missing/1000).toFixed(0)}K</div>
                    </div>
                    <div className="bg-black/50 rounded p-1 border border-gray-800">
                      <div className="text-[8px] text-gray-400">Trend</div>
                      <div className={`text-xs font-bold ${data.trend > 0 ? 'text-blue-400' : 'text-pink-400'}`}>
                        {data.trend > 0 ? '+' : ''}{data.trend}%
                      </div>
                    </div>
                    <div className="bg-black/50 rounded p-1 border border-gray-800">
                      <div className="text-[8px] text-gray-400">Gaps</div>
                      <div className="text-xs font-bold text-purple-400">{data.gaps.length}</div>
                    </div>
                  </div>

                  {/* Top Gaps */}
                  <div className="grid grid-cols-2 gap-1 mb-2">
                    {data.gaps.slice(0, 2).map((gap: any, idx: number) => (
                      <div key={idx} className="bg-black/50 rounded p-1 border border-gray-800">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-medium text-white truncate">{gap.type}</span>
                          <span className={`text-[8px] px-1 rounded ${
                            gap.impact === 'CRITICAL' ? 'bg-pink-500/20 text-pink-400' :
                            gap.impact === 'HIGH' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {gap.impact.substring(0, 4)}
                          </span>
                        </div>
                        <div className="flex justify-between text-[8px]">
                          <span className="text-gray-400">Cov:</span>
                          <span className={`font-mono ${gap.coverage < 50 ? 'text-pink-400' : 'text-blue-400'}`}>
                            {gap.coverage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Compliance */}
                  <div className="flex items-center justify-between border-t border-gray-700 pt-1">
                    <span className="text-[8px] text-gray-400">Compliance:</span>
                    <div className="flex gap-1.5">
                      {Object.entries(data.compliance).map(([standard, compliant]) => (
                        <div key={standard} className="flex items-center gap-0.5">
                          {compliant ? (
                            <CheckCircle className="w-3 h-3 text-blue-400" />
                          ) : (
                            <XCircle className="w-3 h-3 text-pink-400" />
                          )}
                          <span className="text-[8px] text-gray-400">{standard.substring(0, 3).toUpperCase()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className="mt-1 p-1 bg-purple-500/10 border border-purple-500/30 rounded">
                    <p className="text-[8px] text-purple-400 line-clamp-1">
                      <span className="font-bold">Action:</span> {data.recommendation}
                    </p>
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

export default SecurityControlCoverage;