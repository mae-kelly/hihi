import React, { useState, useEffect, useRef } from 'react';
import { Shield, CheckCircle, XCircle, AlertCircle, TrendingUp, TrendingDown, FileSearch, Database, Server, Activity, AlertTriangle, Layers, Binary, Zap } from 'lucide-react';
import * as THREE from 'three';

const ComplianceMatrix: React.FC = () => {
  const [complianceData, setComplianceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<'splunk' | 'chronicle' | 'both'>('both');
  const matrixRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLCanvasElement>(null);
  const waveRef = useRef<HTMLCanvasElement>(null);

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

  // 3D Compliance Matrix Visualization
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
      alpha: true 
    });
    
    renderer.setSize(matrixRef.current.clientWidth, matrixRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    matrixRef.current.appendChild(renderer.domElement);

    // Create dual platform visualization
    const platformGroup = new THREE.Group();
    
    // Splunk Platform (Left)
    if (complianceData.splunk_compliance) {
      const splunkGroup = new THREE.Group();
      const splunkCompliance = complianceData.splunk_compliance.compliance_percentage;
      
      // Create segmented cylinder for Splunk
      const segments = 20;
      const radius = 30;
      const height = 60;
      
      for (let i = 0; i < segments; i++) {
        const startAngle = (i / segments) * Math.PI * 2;
        const endAngle = ((i + 1) / segments) * Math.PI * 2;
        
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.arc(0, 0, radius, startAngle, endAngle, false);
        shape.lineTo(0, 0);
        
        const geometry = new THREE.ExtrudeGeometry(shape, {
          depth: height,
          bevelEnabled: false
        });
        
        // Color based on compliance
        const isCompliant = (i / segments) < (splunkCompliance / 100);
        const material = new THREE.MeshPhongMaterial({
          color: isCompliant ? 0x00d4ff : 0xa855f7,
          emissive: isCompliant ? 0x00d4ff : 0xa855f7,
          emissiveIntensity: isCompliant ? 0.2 : 0.1,
          transparent: true,
          opacity: isCompliant ? 0.8 : 0.3
        });
        
        const segment = new THREE.Mesh(geometry, material);
        segment.rotation.x = -Math.PI / 2;
        splunkGroup.add(segment);
      }
      
      splunkGroup.position.x = -40;
      platformGroup.add(splunkGroup);
      
      // Add Splunk label
      const splunkLabel = new THREE.Group();
      splunkLabel.position.set(-40, -40, 0);
      platformGroup.add(splunkLabel);
    }
    
    // Chronicle Platform (Right)
    if (complianceData.chronicle_compliance) {
      const chronicleGroup = new THREE.Group();
      const chronicleCompliance = complianceData.chronicle_compliance.compliance_percentage;
      
      // Create segmented cylinder for Chronicle
      const segments = 20;
      const radius = 30;
      const height = 60;
      
      for (let i = 0; i < segments; i++) {
        const startAngle = (i / segments) * Math.PI * 2;
        const endAngle = ((i + 1) / segments) * Math.PI * 2;
        
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.arc(0, 0, radius, startAngle, endAngle, false);
        shape.lineTo(0, 0);
        
        const geometry = new THREE.ExtrudeGeometry(shape, {
          depth: height,
          bevelEnabled: false
        });
        
        const isCompliant = (i / segments) < (chronicleCompliance / 100);
        const material = new THREE.MeshPhongMaterial({
          color: isCompliant ? 0x00d4ff : 0xa855f7,
          emissive: isCompliant ? 0x00d4ff : 0xa855f7,
          emissiveIntensity: isCompliant ? 0.2 : 0.1,
          transparent: true,
          opacity: isCompliant ? 0.8 : 0.3
        });
        
        const segment = new THREE.Mesh(geometry, material);
        segment.rotation.x = -Math.PI / 2;
        chronicleGroup.add(segment);
      }
      
      chronicleGroup.position.x = 40;
      platformGroup.add(chronicleGroup);
    }
    
    // Central connection showing overlap
    if (complianceData.combined_compliance) {
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
      platformGroup.add(bridge);
    }
    
    scene.add(platformGroup);
    
    // Add floating particles for non-compliant hosts
    const noncompliantHosts = complianceData.combined_compliance?.neither_platform.host_count || 0;
    const particleCount = Math.min(500, Math.floor(noncompliantHosts / 100));
    
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 200;
      positions[i + 1] = (Math.random() - 0.5) * 100;
      positions[i + 2] = (Math.random() - 0.5) * 200;
      
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
      opacity: 0.6,
      blending: THREE.AdditiveBlending
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
    
    // Animation
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
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
      if (frameId) cancelAnimationFrame(frameId);
      if (matrixRef.current && renderer.domElement) {
        matrixRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [complianceData]);
  
  // Compliance Flow Visualization
  useEffect(() => {
    const canvas = flowRef.current;
    if (!canvas || !complianceData) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw Splunk flow
      if (selectedPlatform === 'splunk' || selectedPlatform === 'both') {
        const splunkY = canvas.height / 3;
        const splunkWidth = (canvas.width * 0.8) * (complianceData.splunk_compliance.compliance_percentage / 100);
        
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
        
        // Non-compliant portion
        ctx.strokeStyle = '#a855f720';
        ctx.beginPath();
        ctx.moveTo(50 + splunkWidth, splunkY);
        ctx.lineTo(canvas.width - 50, splunkY);
        ctx.stroke();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('SPLUNK', 50, splunkY - 20);
        
        ctx.fillStyle = '#00d4ff';
        ctx.font = 'bold 16px monospace';
        ctx.fillText(
          `${complianceData.splunk_compliance.compliance_percentage.toFixed(1)}%`,
          canvas.width - 100,
          splunkY + 5
        );
      }
      
      // Draw Chronicle flow
      if (selectedPlatform === 'chronicle' || selectedPlatform === 'both') {
        const chronicleY = (canvas.height / 3) * 2;
        const chronicleWidth = (canvas.width * 0.8) * (complianceData.chronicle_compliance.compliance_percentage / 100);
        
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
        
        // Non-compliant portion
        ctx.strokeStyle = '#a855f720';
        ctx.beginPath();
        ctx.moveTo(50 + chronicleWidth, chronicleY);
        ctx.lineTo(canvas.width - 50, chronicleY);
        ctx.stroke();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('CHRONICLE', 50, chronicleY - 20);
        
        ctx.fillStyle = '#00d4ff';
        ctx.font = 'bold 16px monospace';
        ctx.fillText(
          `${complianceData.chronicle_compliance.compliance_percentage.toFixed(1)}%`,
          canvas.width - 100,
          chronicleY + 5
        );
      }
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }, [complianceData, selectedPlatform]);
  
  // Wave Visualization
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
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw compliance waves
      const splunkCompliance = complianceData.splunk_compliance.compliance_percentage;
      const chronicleCompliance = complianceData.chronicle_compliance.compliance_percentage;
      
      // Splunk wave
      ctx.strokeStyle = splunkCompliance > 50 ? '#00d4ff' : '#a855f7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      for (let x = 0; x < canvas.width; x++) {
        const y = canvas.height / 2 + 
                 Math.sin((x / 50) + time) * (splunkCompliance / 5) +
                 Math.sin((x / 25) + time * 2) * 10;
        
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      
      // Chronicle wave
      ctx.strokeStyle = chronicleCompliance > 50 ? '#00d4ff' : '#a855f7';
      ctx.beginPath();
      
      for (let x = 0; x < canvas.width; x++) {
        const y = canvas.height / 2 + 
                 Math.sin((x / 50) + time + Math.PI) * (chronicleCompliance / 5) +
                 Math.sin((x / 25) + time * 2 + Math.PI) * 10;
        
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }, [complianceData]);
  
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
  
  if (!complianceData) return null;
  
  const overallCompliance = complianceData.combined_compliance?.either_platform.percentage || 0;
  const bothPlatforms = complianceData.combined_compliance?.both_platforms.percentage || 0;
  const neitherPlatform = complianceData.combined_compliance?.neither_platform.percentage || 0;
  const overallStatus = complianceData.combined_compliance?.overall_status || 'CRITICAL';
  
  return (
    <div className="h-full flex flex-col p-4">
      {/* Critical Alert */}
      {overallStatus === 'CRITICAL' && (
        <div className="mb-3 bg-black border border-purple-500/50 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-purple-400 animate-pulse" />
            <span className="text-purple-400 font-bold text-sm">CRITICAL:</span>
            <span className="text-white text-sm">
              {neitherPlatform.toFixed(1)}% of hosts not logging to any platform
            </span>
          </div>
        </div>
      )}
      
      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-12 gap-4">
        {/* 3D Matrix Visualization */}
        <div className="col-span-7">
          <div className="h-full glass-panel rounded-xl">
            <div className="p-3 border-b border-cyan-400/20">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-cyan-400">LOGGING COMPLIANCE MATRIX</h2>
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
            </div>
            
            <div ref={matrixRef} className="w-full" style={{ height: 'calc(100% - 60px)' }} />
          </div>
        </div>
        
        {/* Right Column */}
        <div className="col-span-5 space-y-3">
          {/* Overall Compliance Card */}
          <div className="glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">OVERALL LOGGING COMPLIANCE</h3>
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="text-3xl font-bold text-cyan-400 mb-2">
              {overallCompliance.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-400 mb-3">
              {complianceData.combined_compliance?.either_platform.host_count.toLocaleString()} / {complianceData.total_hosts.toLocaleString()} hosts logging
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="font-bold text-cyan-400">{bothPlatforms.toFixed(1)}%</div>
                <div className="text-gray-400">Both</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-yellow-400">{overallCompliance.toFixed(1)}%</div>
                <div className="text-gray-400">Either</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-purple-400">{neitherPlatform.toFixed(1)}%</div>
                <div className="text-gray-400">Neither</div>
              </div>
            </div>
          </div>
          
          {/* Platform Cards */}
          <div className="grid grid-cols-2 gap-2">
            {/* Splunk Card */}
            <div className="glass-panel rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <Server className="w-4 h-4 text-cyan-400" />
                <span className={`text-xs px-2 py-1 rounded ${
                  complianceData.splunk_compliance.status === 'CRITICAL' 
                    ? 'bg-purple-500/20 text-purple-400'
                    : complianceData.splunk_compliance.status === 'WARNING'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-cyan-500/20 text-cyan-400'
                }`}>
                  {complianceData.splunk_compliance.status}
                </span>
              </div>
              <div className="text-xs font-bold text-white mb-1">SPLUNK</div>
              <div className="text-2xl font-bold text-cyan-400">
                {complianceData.splunk_compliance.compliance_percentage.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-400">
                {complianceData.splunk_compliance.compliant_hosts.toLocaleString()} hosts
              </div>
            </div>
            
            {/* Chronicle Card */}
            <div className="glass-panel rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <span className={`text-xs px-2 py-1 rounded ${
                  complianceData.chronicle_compliance.status === 'CRITICAL' 
                    ? 'bg-purple-500/20 text-purple-400'
                    : complianceData.chronicle_compliance.status === 'WARNING'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-cyan-500/20 text-cyan-400'
                }`}>
                  {complianceData.chronicle_compliance.status}
                </span>
              </div>
              <div className="text-xs font-bold text-white mb-1">CHRONICLE</div>
              <div className="text-2xl font-bold text-cyan-400">
                {complianceData.chronicle_compliance.compliance_percentage.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-400">
                {complianceData.chronicle_compliance.compliant_hosts.toLocaleString()} hosts
              </div>
            </div>
          </div>
          
          {/* Compliance Flow */}
          <div className="glass-panel rounded-xl p-3">
            <h3 className="text-sm font-bold text-purple-400 mb-2">PLATFORM COMPLIANCE FLOW</h3>
            <canvas ref={flowRef} className="w-full h-32" />
          </div>
          
          {/* Compliance Wave */}
          <div className="glass-panel rounded-xl p-3">
            <h3 className="text-sm font-bold text-cyan-400 mb-2">COMPLIANCE PULSE</h3>
            <canvas ref={waveRef} className="w-full h-24" />
          </div>
          
          {/* Status Breakdown */}
          {complianceData.splunk_compliance.status_breakdown && (
            <div className="glass-panel rounded-xl p-3">
              <h3 className="text-sm font-bold text-white mb-2">STATUS BREAKDOWN</h3>
              <div className="space-y-1">
                {complianceData.splunk_compliance.status_breakdown.slice(0, 3).map((status: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">{status.status}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-white">{status.host_count.toLocaleString()}</span>
                      <span className={`text-xs font-bold ${
                        status.is_compliant ? 'text-cyan-400' : 'text-purple-400'
                      }`}>
                        {status.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplianceMatrix;