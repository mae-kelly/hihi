import React, { useState, useEffect, useRef } from 'react';
import { Eye, AlertTriangle, TrendingUp, TrendingDown, Activity, Shield, Database, Server, Globe, Network, Layers, Lock } from 'lucide-react';
import * as THREE from 'three';

interface VisibilityMetrics {
  dimension: string;
  visibility: number;
  total: number;
  visible: number;
  trend: number;
  status: 'critical' | 'warning' | 'healthy';
  icon: any;
}

const VisibilityOverview: React.FC = () => {
  const [metrics, setMetrics] = useState<VisibilityMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallVisibility, setOverallVisibility] = useState(0);
  const hologramRef = useRef<HTMLDivElement>(null);
  const pulseRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fetchAllMetrics = async () => {
      try {
        setLoading(true);
        
        // Fetch all visibility metrics
        const [global, infra, regional, bu, system, security, logging, domain] = await Promise.all([
          fetch('http://localhost:5000/api/global_visibility').then(r => r.json()),
          fetch('http://localhost:5000/api/infrastructure_visibility').then(r => r.json()),
          fetch('http://localhost:5000/api/regional_visibility').then(r => r.json()),
          fetch('http://localhost:5000/api/business_unit_visibility').then(r => r.json()),
          fetch('http://localhost:5000/api/system_classification_visibility').then(r => r.json()),
          fetch('http://localhost:5000/api/security_control_coverage').then(r => r.json()),
          fetch('http://localhost:5000/api/logging_compliance').then(r => r.json()),
          fetch('http://localhost:5000/api/domain_visibility').then(r => r.json())
        ]);

        const metricsData: VisibilityMetrics[] = [
          {
            dimension: 'GLOBAL',
            visibility: global.global_visibility_percentage || 0,
            total: global.total_hosts || 0,
            visible: global.visible_hosts || 0,
            trend: 2.3,
            status: global.status === 'CRITICAL' ? 'critical' : global.status === 'WARNING' ? 'warning' : 'healthy',
            icon: Globe
          },
          {
            dimension: 'INFRASTRUCTURE',
            visibility: infra.overall_infrastructure_visibility || 0,
            total: infra.total_infrastructure_types || 0,
            visible: Math.floor((infra.overall_infrastructure_visibility || 0) * (infra.total_infrastructure_types || 0) / 100),
            trend: -1.2,
            status: infra.overall_infrastructure_visibility < 30 ? 'critical' : infra.overall_infrastructure_visibility < 60 ? 'warning' : 'healthy',
            icon: Server
          },
          {
            dimension: 'REGIONAL',
            visibility: regional.regional_breakdown ? 
              regional.regional_breakdown.reduce((sum: number, r: any) => sum + r.visibility_percentage, 0) / regional.regional_breakdown.length : 0,
            total: regional.regional_breakdown ? regional.regional_breakdown.length : 0,
            visible: regional.regional_breakdown ? 
              regional.regional_breakdown.filter((r: any) => r.visibility_percentage > 50).length : 0,
            trend: 0.8,
            status: 'warning',
            icon: Network
          },
          {
            dimension: 'BUSINESS UNITS',
            visibility: bu.business_unit_breakdown ? 
              bu.business_unit_breakdown.reduce((sum: number, b: any) => sum + b.visibility_percentage, 0) / bu.business_unit_breakdown.length : 0,
            total: bu.business_unit_breakdown ? bu.business_unit_breakdown.length : 0,
            visible: bu.business_unit_breakdown ? 
              bu.business_unit_breakdown.filter((b: any) => b.visibility_percentage > 50).length : 0,
            trend: -2.1,
            status: 'critical',
            icon: Layers
          },
          {
            dimension: 'SYSTEMS',
            visibility: system.category_summary ? 
              Object.values(system.category_summary).reduce((sum: number, s: any) => sum + s.visibility_percentage, 0) / Object.keys(system.category_summary).length : 0,
            total: system.total_system_types || 0,
            visible: system.critical_systems ? system.critical_systems.length : 0,
            trend: 1.5,
            status: 'warning',
            icon: Database
          },
          {
            dimension: 'SECURITY',
            visibility: security.all_controls_coverage ? security.all_controls_coverage.coverage_percentage : 0,
            total: security.total_hosts || 0,
            visible: security.all_controls_coverage ? security.all_controls_coverage.fully_protected_hosts : 0,
            trend: 3.2,
            status: security.all_controls_coverage && security.all_controls_coverage.coverage_percentage < 40 ? 'critical' : 'warning',
            icon: Shield
          },
          {
            dimension: 'LOGGING',
            visibility: logging.combined_compliance ? logging.combined_compliance.either_platform.percentage : 0,
            total: logging.total_hosts || 0,
            visible: logging.combined_compliance ? logging.combined_compliance.either_platform.host_count : 0,
            trend: -0.5,
            status: logging.combined_compliance && logging.combined_compliance.either_platform.percentage < 50 ? 'critical' : 'warning',
            icon: Activity
          },
          {
            dimension: 'DOMAINS',
            visibility: domain.overall_domain_visibility || 0,
            total: domain.total_domains || 0,
            visible: domain.critical_domains ? domain.total_domains - domain.critical_domains.length : 0,
            trend: 1.8,
            status: domain.critical_domains && domain.critical_domains.length > 5 ? 'critical' : 'warning',
            icon: Lock
          }
        ];

        setMetrics(metricsData);
        
        // Calculate overall visibility
        const overall = metricsData.reduce((sum, m) => sum + m.visibility, 0) / metricsData.length;
        setOverallVisibility(overall);
        
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllMetrics();
    const interval = setInterval(fetchAllMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  // 3D Holographic Core
  useEffect(() => {
    if (!hologramRef.current || metrics.length === 0) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.002);

    const camera = new THREE.PerspectiveCamera(
      45,
      hologramRef.current.clientWidth / hologramRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 150);

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(hologramRef.current.clientWidth, hologramRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    hologramRef.current.appendChild(renderer.domElement);

    // Central core
    const coreGeometry = new THREE.IcosahedronGeometry(20, 2);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: overallVisibility < 30 ? 0xff00ff : overallVisibility < 60 ? 0xc084fc : 0x00d4ff,
      emissive: overallVisibility < 30 ? 0xff00ff : 0x00d4ff,
      emissiveIntensity: 0.3,
      wireframe: false,
      transparent: true,
      opacity: 0.9
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);

    // Orbital rings for each dimension
    const rings: THREE.Mesh[] = [];
    metrics.forEach((metric, index) => {
      const ringRadius = 35 + index * 8;
      const ringGeometry = new THREE.TorusGeometry(ringRadius, 1, 8, 100);
      const ringMaterial = new THREE.MeshPhongMaterial({
        color: metric.status === 'critical' ? 0xff00ff : metric.status === 'warning' ? 0xc084fc : 0x00d4ff,
        emissive: metric.status === 'critical' ? 0xff00ff : 0x00d4ff,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: metric.visibility / 100
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.5;
      ring.rotation.y = Math.random() * Math.PI;
      rings.push(ring);
      scene.add(ring);
    });

    // Particle field
    const particleCount = 1000;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 200;
      positions[i + 1] = (Math.random() - 0.5) * 200;
      positions[i + 2] = (Math.random() - 0.5) * 200;
      
      if (overallVisibility < 30) {
        colors[i] = 1; colors[i + 1] = 0; colors[i + 2] = 1;
      } else if (overallVisibility < 60) {
        colors[i] = 0.75; colors[i + 1] = 0.52; colors[i + 2] = 0.99;
      } else {
        colors[i] = 0; colors[i + 1] = 0.83; colors[i + 2] = 1;
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
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00d4ff, 1, 200);
    pointLight1.position.set(100, 100, 100);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff00ff, 1, 200);
    pointLight2.position.set(-100, -100, -100);
    scene.add(pointLight2);

    // Animation
    const animate = () => {
      core.rotation.x += 0.005;
      core.rotation.y += 0.005;
      core.scale.setScalar(1 + Math.sin(Date.now() * 0.002) * 0.1);

      rings.forEach((ring, index) => {
        ring.rotation.z += 0.001 * (index + 1);
        ring.rotation.y += 0.002 * (index % 2 === 0 ? 1 : -1);
      });

      particles.rotation.y += 0.0005;

      const time = Date.now() * 0.0005;
      camera.position.x = Math.sin(time) * 150;
      camera.position.z = Math.cos(time) * 150;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (hologramRef.current && renderer.domElement) {
        hologramRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [metrics, overallVisibility]);

  // Pulse visualization
  useEffect(() => {
    const canvas = pulseRef.current;
    if (!canvas || metrics.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const time = Date.now() * 0.001;
      
      metrics.forEach((metric, index) => {
        const color = metric.status === 'critical' ? '#ff00ff' : 
                     metric.status === 'warning' ? '#c084fc' : '#00d4ff';
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const offset = (index / metrics.length) * canvas.height;
        
        for (let x = 0; x < canvas.width; x++) {
          const y = offset + Math.sin((x / 30) + time + index) * (metric.visibility / 10);
          
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        
        ctx.stroke();
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, [metrics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
          <div className="mt-4 text-lg font-bold text-cyan-400">AGGREGATING VISIBILITY METRICS</div>
        </div>
      </div>
    );
  }

  const criticalCount = metrics.filter(m => m.status === 'critical').length;

  return (
    <div className="h-full flex flex-col p-4">
      {/* Alert Bar */}
      {overallVisibility < 50 && (
        <div className="mb-3 bg-black border border-purple-500/50 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-purple-400 animate-pulse" />
            <span className="text-purple-400 font-bold">CRITICAL VISIBILITY FAILURE:</span>
            <span className="text-white">
              Overall visibility at {overallVisibility.toFixed(1)}% - {criticalCount} dimensions critical
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 grid grid-cols-12 gap-4">
        {/* 3D Visualization */}
        <div className="col-span-6">
          <div className="h-full glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-cyan-400">VISIBILITY MATRIX CORE</h2>
              <div className="text-3xl font-bold">
                <span className={overallVisibility < 30 ? 'text-purple-400' : overallVisibility < 60 ? 'text-yellow-400' : 'text-cyan-400'}>
                  {overallVisibility.toFixed(1)}%
                </span>
              </div>
            </div>
            <div ref={hologramRef} className="w-full" style={{ height: 'calc(100% - 60px)' }} />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="col-span-6">
          <div className="h-full flex flex-col gap-3">
            <div className="glass-panel rounded-xl p-3">
              <h3 className="text-sm font-bold text-purple-400 mb-2">VISIBILITY PULSE</h3>
              <canvas ref={pulseRef} className="w-full h-24" />
            </div>

            <div className="flex-1 grid grid-cols-2 gap-3">
              {metrics.map(metric => {
                const Icon = metric.icon;
                return (
                  <div 
                    key={metric.dimension}
                    className={`glass-panel rounded-xl p-3 border ${
                      metric.status === 'critical' ? 'border-purple-500/30' :
                      metric.status === 'warning' ? 'border-yellow-500/30' :
                      'border-cyan-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" style={{ 
                          color: metric.status === 'critical' ? '#ff00ff' :
                                metric.status === 'warning' ? '#c084fc' : '#00d4ff'
                        }} />
                        <span className="text-xs font-bold text-white">{metric.dimension}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {metric.trend > 0 ? (
                          <TrendingUp className="w-3 h-3 text-cyan-400" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-purple-400" />
                        )}
                        <span className="text-xs text-gray-400">{Math.abs(metric.trend).toFixed(1)}%</span>
                      </div>
                    </div>
                    
                    <div className="text-2xl font-bold mb-1" style={{
                      color: metric.status === 'critical' ? '#ff00ff' :
                             metric.status === 'warning' ? '#c084fc' : '#00d4ff'
                    }}>
                      {metric.visibility.toFixed(1)}%
                    </div>
                    
                    <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-1000"
                        style={{ 
                          width: `${metric.visibility}%`,
                          background: metric.status === 'critical' ? 'linear-gradient(90deg, #ff00ff, #ff00ff)' :
                                     metric.status === 'warning' ? 'linear-gradient(90deg, #c084fc, #c084fc)' :
                                     'linear-gradient(90deg, #00d4ff, #00d4ff)'
                        }}
                      />
                    </div>
                    
                    <div className="mt-2 flex justify-between text-xs">
                      <span className="text-gray-400">
                        <Eye className="w-3 h-3 inline mr-1" />
                        {metric.visible}/{metric.total}
                      </span>
                      <span className={
                        metric.status === 'critical' ? 'text-purple-400 font-bold' :
                        metric.status === 'warning' ? 'text-yellow-400' :
                        'text-cyan-400'
                      }>
                        {metric.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisibilityOverview;