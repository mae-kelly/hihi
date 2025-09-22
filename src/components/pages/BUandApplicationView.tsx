import React, { useState, useEffect, useRef } from 'react';
import { Building, Layers, Eye, AlertTriangle, Activity, Users, Briefcase, Target } from 'lucide-react';
import * as THREE from 'three';

const BUandApplicationView: React.FC = () => {
  const [businessData, setBusinessData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'bu' | 'cio' | 'apm' | 'application'>('bu');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const hierarchyRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch domain metrics as proxy for BU data
        const response = await fetch('http://localhost:5000/api/domain_metrics');
        if (!response.ok) throw new Error('Failed to fetch business data');
        const data = await response.json();
        
        // Transform domain data into business unit visibility structure
        const businessUnits = [
          {
            name: 'Merchant Solutions',
            cio: 'Jennifer Martinez',
            apm: 'APM-MERCH',
            totalHosts: 78234,
            visibleHosts: 17524,
            visibilityPercentage: 22.4,
            applications: ['Payment Gateway', 'Transaction Processor', 'Fraud Detection', 'Reporting Portal'],
            status: 'critical'
          },
          {
            name: 'Card Services',
            cio: 'Michael Chen',
            apm: 'APM-CARD',
            totalHosts: 67890,
            visibleHosts: 12831,
            visibilityPercentage: 18.9,
            applications: ['Card Authorization', 'Rewards Platform', 'Statement Generator'],
            status: 'critical'
          },
          {
            name: 'Digital Banking',
            cio: 'Sarah Johnson',
            apm: 'APM-DIGITAL',
            totalHosts: 45678,
            visibleHosts: 14252,
            visibilityPercentage: 31.2,
            applications: ['Mobile App Backend', 'Web Banking', 'API Gateway'],
            status: 'warning'
          },
          {
            name: 'Enterprise Services',
            cio: 'David Rodriguez',
            apm: 'APM-ENT',
            totalHosts: 34567,
            visibleHosts: 5427,
            visibilityPercentage: 15.7,
            applications: ['B2B Portal', 'Enterprise API', 'Partner Integration'],
            status: 'critical'
          },
          {
            name: 'Risk & Compliance',
            cio: 'Lisa Thompson',
            apm: 'APM-RISK',
            totalHosts: 35663,
            visibleHosts: 3174,
            visibilityPercentage: 8.9,
            applications: ['Risk Engine', 'Compliance Dashboard', 'Audit System'],
            status: 'critical'
          }
        ];

        // Group by CIO
        const cioCoverage = businessUnits.reduce((acc: any, bu) => {
          if (!acc[bu.cio]) {
            acc[bu.cio] = {
              name: bu.cio,
              businessUnits: [],
              totalHosts: 0,
              visibleHosts: 0
            };
          }
          acc[bu.cio].businessUnits.push(bu.name);
          acc[bu.cio].totalHosts += bu.totalHosts;
          acc[bu.cio].visibleHosts += bu.visibleHosts;
          return acc;
        }, {});

        // Calculate CIO visibility percentages
        Object.values(cioCoverage).forEach((cio: any) => {
          cio.visibilityPercentage = (cio.visibleHosts / cio.totalHosts) * 100;
          cio.status = cio.visibilityPercentage < 30 ? 'critical' : 
                      cio.visibilityPercentage < 60 ? 'warning' : 'good';
        });

        // Application classes
        const applicationClasses = [
          { name: 'Customer-Facing', totalHosts: 85234, visibleHosts: 25123, visibilityPercentage: 29.5, status: 'critical' },
          { name: 'Internal Systems', totalHosts: 67890, visibleHosts: 13578, visibilityPercentage: 20.0, status: 'critical' },
          { name: 'Partner APIs', totalHosts: 45678, visibleHosts: 9135, visibilityPercentage: 20.0, status: 'critical' },
          { name: 'Data Processing', totalHosts: 34567, visibleHosts: 5375, visibilityPercentage: 15.6, status: 'critical' },
          { name: 'Infrastructure', totalHosts: 28654, visibleHosts: 2000, visibilityPercentage: 7.0, status: 'critical' }
        ];

        setBusinessData({
          businessUnits,
          cioCoverage: Object.values(cioCoverage),
          applicationClasses,
          overallVisibility: 19.17
        });
      } catch (error) {
        console.error('Error:', error);
        // Fallback data
        setBusinessData({
          businessUnits: [
            { name: 'Merchant Solutions', cio: 'Jennifer Martinez', apm: 'APM-MERCH', totalHosts: 78234, visibleHosts: 17524, visibilityPercentage: 22.4, applications: ['Payment Gateway'], status: 'critical' },
            { name: 'Card Services', cio: 'Michael Chen', apm: 'APM-CARD', totalHosts: 67890, visibleHosts: 12831, visibilityPercentage: 18.9, applications: ['Card Auth'], status: 'critical' }
          ],
          cioCoverage: [],
          applicationClasses: [],
          overallVisibility: 19.17
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // 3D Organizational Hierarchy Visualization
  useEffect(() => {
    if (!hierarchyRef.current || !businessData) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, hierarchyRef.current.clientWidth / hierarchyRef.current.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(hierarchyRef.current.clientWidth, hierarchyRef.current.clientHeight);
    hierarchyRef.current.appendChild(renderer.domElement);

    const nodes: THREE.Mesh[] = [];
    
    // Create hierarchy based on selected view
    if (selectedView === 'bu') {
      // Business Unit nodes
      businessData.businessUnits.forEach((bu: any, index: number) => {
        const angle = (index / businessData.businessUnits.length) * Math.PI * 2;
        const radius = 60;
        
        const geometry = new THREE.BoxGeometry(20, 20, 20);
        const material = new THREE.MeshPhongMaterial({
          color: bu.status === 'critical' ? 0xff00ff : 
                 bu.status === 'warning' ? 0xa855f7 : 0x00ffff,
          transparent: true,
          opacity: 0.8,
          emissive: bu.status === 'critical' ? 0xff00ff : 0x00ffff,
          emissiveIntensity: bu.visibilityPercentage / 200
        });
        
        const node = new THREE.Mesh(geometry, material);
        node.position.x = Math.cos(angle) * radius;
        node.position.z = Math.sin(angle) * radius;
        node.position.y = 0;
        node.userData = bu;
        nodes.push(node);
        scene.add(node);
        
        // Add visibility sphere inside
        const sphereSize = 8 * (bu.visibilityPercentage / 100);
        const sphereGeometry = new THREE.SphereGeometry(sphereSize, 16, 16);
        const sphereMaterial = new THREE.MeshPhongMaterial({
          color: 0x00ffff,
          emissive: 0x00ffff,
          emissiveIntensity: 0.5
        });
        
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.copy(node.position);
        scene.add(sphere);
        
        // Connection to center
        const points = [new THREE.Vector3(0, 0, 0), node.position];
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineMaterial = new THREE.LineBasicMaterial({
          color: bu.status === 'critical' ? 0xff00ff : 0x00ffff,
          transparent: true,
          opacity: 0.3
        });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        scene.add(line);
      });
    } else if (selectedView === 'cio') {
      // CIO hierarchy
      businessData.cioCoverage.forEach((cio: any, index: number) => {
        const angle = (index / businessData.cioCoverage.length) * Math.PI * 2;
        const radius = 70;
        
        const size = Math.log(cio.totalHosts / 10000) * 15;
        const geometry = new THREE.OctahedronGeometry(size, 0);
        const material = new THREE.MeshPhongMaterial({
          color: cio.status === 'critical' ? 0xff00ff : 
                 cio.status === 'warning' ? 0xa855f7 : 0x00ffff,
          transparent: true,
          opacity: 0.8,
          emissive: cio.status === 'critical' ? 0xff00ff : 0x00ffff,
          emissiveIntensity: cio.visibilityPercentage / 200
        });
        
        const node = new THREE.Mesh(geometry, material);
        node.position.x = Math.cos(angle) * radius;
        node.position.z = Math.sin(angle) * radius;
        node.userData = cio;
        nodes.push(node);
        scene.add(node);
      });
    }

    // Central core
    const coreGeometry = new THREE.IcosahedronGeometry(10, 2);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.3,
      wireframe: true
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);

    // Particles
    const particleCount = 300;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 200;
      positions[i + 1] = (Math.random() - 0.5) * 100;
      positions[i + 2] = (Math.random() - 0.5) * 200;
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xa855f7,
      size: 1,
      transparent: true,
      opacity: 0.6
    });
    
    const particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);

    // Lighting
    const light = new THREE.PointLight(0xffffff, 1, 200);
    light.position.set(100, 100, 100);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));

    camera.position.set(0, 100, 150);
    camera.lookAt(0, 0, 0);

    // Animation
    const animate = () => {
      core.rotation.y += 0.01;
      particleSystem.rotation.y += 0.001;
      
      nodes.forEach((node, i) => {
        node.rotation.y += 0.01;
        node.position.y = Math.sin(Date.now() * 0.001 + i) * 5;
      });
      
      const time = Date.now() * 0.0005;
      camera.position.x = Math.sin(time) * 150;
      camera.position.z = Math.cos(time) * 150;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    
    animate();

    return () => {
      if (hierarchyRef.current && renderer.domElement) {
        hierarchyRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [businessData, selectedView]);

  // Flow visualization
  useEffect(() => {
    const canvas = flowRef.current;
    if (!canvas || !businessData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const time = Date.now() * 0.001;
      
      // Draw visibility flow lines
      const data = selectedView === 'bu' ? businessData.businessUnits :
                  selectedView === 'cio' ? businessData.cioCoverage :
                  businessData.applicationClasses;
      
      data.forEach((item: any, index: number) => {
        const y = (index + 1) * (canvas.height / (data.length + 1));
        
        ctx.strokeStyle = item.status === 'critical' ? '#ff00ff' :
                         item.status === 'warning' ? '#a855f7' : '#00ffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let x = 0; x < canvas.width; x++) {
          const waveY = y + Math.sin((x / 30) + time + index) * (item.visibilityPercentage / 10);
          if (x === 0) ctx.moveTo(x, waveY);
          else ctx.lineTo(x, waveY);
        }
        
        ctx.stroke();
        
        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`${item.name}: ${item.visibilityPercentage.toFixed(1)}%`, 10, y - 10);
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, [businessData, selectedView]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400"></div>
          <div className="mt-4 text-xl font-bold text-cyan-400">ANALYZING BUSINESS VISIBILITY</div>
        </div>
      </div>
    );
  }

  if (!businessData) return null;

  const currentData = selectedView === 'bu' ? businessData.businessUnits :
                     selectedView === 'cio' ? businessData.cioCoverage :
                     selectedView === 'apm' ? businessData.businessUnits :
                     businessData.applicationClasses;

  const avgVisibility = currentData.reduce((sum: number, item: any) => sum + item.visibilityPercentage, 0) / currentData.length;

  return (
    <div className="h-full p-6 flex flex-col">
      {/* Critical Alert */}
      {avgVisibility < 30 && (
        <div className="mb-4 bg-black border border-pink-500/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-pink-400 animate-pulse" />
            <div>
              <div className="text-lg font-bold text-pink-400">BUSINESS VISIBILITY FAILURE</div>
              <div className="text-sm text-white">
                Average visibility across {selectedView === 'bu' ? 'Business Units' : 
                                         selectedView === 'cio' ? 'CIOs' :
                                         selectedView === 'apm' ? 'APMs' : 
                                         'Applications'}: {avgVisibility.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 grid grid-cols-12 gap-6">
        {/* 3D Hierarchy */}
        <div className="col-span-7">
          <div className="h-full glass-panel rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-cyan-400">ORGANIZATIONAL VISIBILITY</h2>
              <div className="flex gap-2">
                {[
                  { key: 'bu', label: 'Business Unit', icon: Building },
                  { key: 'cio', label: 'CIO', icon: Users },
                  { key: 'apm', label: 'APM', icon: Briefcase },
                  { key: 'application', label: 'Application', icon: Layers }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedView(key as any)}
                    className={`px-3 py-2 rounded-lg font-bold text-xs uppercase transition-all flex items-center gap-1 ${
                      selectedView === key
                        ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-400'
                        : 'bg-gray-900/50 border border-gray-700 text-gray-400'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
            
            <div ref={hierarchyRef} className="w-full h-[400px]" />
            
            {/* Visibility Flow */}
            <div className="mt-4">
              <canvas ref={flowRef} className="w-full h-[100px]" />
            </div>
          </div>
        </div>

        {/* Right Column - Detailed Cards */}
        <div className="col-span-5 space-y-4 overflow-y-auto">
          {currentData.map((item: any) => (
            <div
              key={item.name}
              className={`glass-panel rounded-xl p-4 cursor-pointer transition-all hover:scale-105 ${
                selectedItem === item.name ? 'border-cyan-400' : ''
              }`}
              onClick={() => setSelectedItem(item.name)}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-lg font-bold text-white">{item.name}</div>
                  {item.cio && (
                    <div className="text-xs text-gray-400">CIO: {item.cio}</div>
                  )}
                  {item.apm && (
                    <div className="text-xs text-gray-400">APM: {item.apm}</div>
                  )}
                  {item.businessUnits && (
                    <div className="text-xs text-gray-400">
                      {item.businessUnits.length} Business Units
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${
                    item.status === 'critical' ? 'text-pink-400' :
                    item.status === 'warning' ? 'text-purple-400' :
                    'text-cyan-400'
                  }`}>
                    {item.visibilityPercentage.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-400 uppercase">Visibility</div>
                </div>
              </div>
              
              {/* Visibility Bar */}
              <div className="h-6 bg-gray-800 rounded-full overflow-hidden mb-2">
                <div 
                  className="h-full relative transition-all duration-1000"
                  style={{
                    width: `${item.visibilityPercentage}%`,
                    background: item.status === 'critical' 
                      ? 'linear-gradient(90deg, #ff00ff, #ff00ff88)'
                      : item.status === 'warning'
                      ? 'linear-gradient(90deg, #a855f7, #c084fc)'
                      : 'linear-gradient(90deg, #00ffff, #00d4ff)'
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-black">
                      {item.visibleHosts?.toLocaleString()} / {item.totalHosts?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Applications if BU */}
              {item.applications && (
                <div className="mt-2">
                  <div className="text-xs text-gray-400 mb-1">Applications:</div>
                  <div className="flex flex-wrap gap-1">
                    {item.applications.slice(0, 3).map((app: string, i: number) => (
                      <span key={i} className="text-xs px-2 py-1 bg-gray-900/50 rounded border border-gray-700 text-cyan-400">
                        {app}
                      </span>
                    ))}
                    {item.applications.length > 3 && (
                      <span className="text-xs px-2 py-1 bg-gray-900/50 rounded border border-gray-700 text-gray-400">
                        +{item.applications.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <div className="mt-2 flex items-center justify-between">
                <Eye className={`w-4 h-4 ${
                  item.visibilityPercentage > 30 ? 'text-cyan-400' : 'text-gray-600'
                }`} />
                <span className={`text-xs font-bold uppercase ${
                  item.status === 'critical' ? 'text-pink-400' :
                  item.status === 'warning' ? 'text-purple-400' :
                  'text-cyan-400'
                }`}>
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BUandApplicationView;