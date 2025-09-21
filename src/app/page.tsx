'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Shield, Activity, Database, Server, Cloud, Network, AlertCircle, TrendingDown, Eye, BarChart3, Globe, Building, Layers, FileSearch, Lock, AlertTriangle, XCircle, Zap, Cpu, Binary, Radar, Wifi } from 'lucide-react';
import Navigation from '@/components/Navigation';
import GlobalView from '@/components/pages/GlobalView';
import InfrastructureView from '@/components/pages/InfrastructureView';
import RegionalCountryView from '@/components/pages/RegionalCountryView';
import BUandApplicationView from '@/components/pages/BUandApplicationView';
import SystemClassification from '@/components/pages/SystemClassification';
import SecurityControlCoverage from '@/components/pages/SecurityControlCoverage';
import ComplianceMatrix from '@/components/pages/ComplianceMatrix';
import DomainVisibility from '@/components/pages/DomainVisibility';
import LoggingStandards from '@/components/pages/LoggingStandards';
import { useVisibilityDashboard } from '@/hooks/useVisibilityData';
import * as THREE from 'three';

export default function Home() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [currentTime, setCurrentTime] = useState<string>('00:00:00');
  
  // Get real data from DuckDB
  const { globalView, infrastructure, regional, businessUnits, securityControls, criticalGaps, loading, error } = useVisibilityDashboard();

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: false 
      }));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  // Calculate real executive metrics from database
  const executiveMetrics = React.useMemo(() => {
    if (!globalView) {
      return {
        totalAssets: 0,
        csocCoverage: 0,
        splunkCoverage: 0,
        chronicleCoverage: 0,
        criticalGaps: 0,
        complianceStatus: 'LOADING',
        riskLevel: 'UNKNOWN'
      };
    }

    const splunkCoverage = globalView.splunk_coverage || 0;
    const missing = globalView.total_assets - globalView.splunk_assets;
    
    return {
      totalAssets: globalView.total_assets,
      csocCoverage: splunkCoverage, // Using Splunk as primary visibility metric
      splunkCoverage: splunkCoverage,
      chronicleCoverage: globalView.cmdb_coverage || 0,
      criticalGaps: missing,
      complianceStatus: splunkCoverage < 50 ? 'FAILED' : splunkCoverage < 80 ? 'AT RISK' : 'COMPLIANT',
      riskLevel: splunkCoverage < 30 ? 'CRITICAL' : splunkCoverage < 60 ? 'HIGH' : splunkCoverage < 80 ? 'MEDIUM' : 'LOW'
    };
  }, [globalView]);

  const renderPage = () => {
    if (loading) {
      return <LoadingView />;
    }

    if (error) {
      return <ErrorView error={error} />;
    }

    switch(currentPage) {
      case 'dashboard':
        return <ExecutiveDashboard metrics={executiveMetrics} globalData={globalView} />;
      case 'global-view':
        return <GlobalView />;
      case 'infrastructure':
        return <InfrastructureView />;
      case 'regional-country':
        return <RegionalCountryView />;
      case 'bu-application':
        return <BUandApplicationView />;
      case 'system-classification':
        return <SystemClassification />;
      case 'security-coverage':
        return <SecurityControlCoverage />;
      case 'compliance':
        return <ComplianceMatrix />;
      case 'domain-visibility':
        return <DomainVisibility />;
      case 'logging-standards':
        return <LoggingStandards />;
      default:
        return <ExecutiveDashboard metrics={executiveMetrics} globalData={globalView} />;
    }
  };

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      <div className="fixed inset-0">
        <div className="quantum-grid" />
      </div>
      
      <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
      
      <div className="ml-64 h-screen flex flex-col">
        <header className="relative z-20 flex-shrink-0">
          <div className="glass-panel px-6 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {currentPage === 'dashboard' && 'UNIVERSAL CMDB VISIBILITY'}
                    {currentPage === 'global-view' && 'GLOBAL VIEW - REAL DATA'}
                    {currentPage === 'infrastructure' && 'INFRASTRUCTURE TYPE ANALYSIS'}
                    {currentPage === 'regional-country' && 'REGIONAL & COUNTRY VIEW'}
                    {currentPage === 'bu-application' && 'BU & APPLICATION VIEW'}
                    {currentPage === 'system-classification' && 'SYSTEM CLASSIFICATION'}
                    {currentPage === 'security-coverage' && 'SECURITY CONTROL COVERAGE'}
                    {currentPage === 'compliance' && 'GSO & SPLUNK COMPLIANCE'}
                    {currentPage === 'domain-visibility' && 'DOMAIN VISIBILITY'}
                    {currentPage === 'logging-standards' && 'LOGGING STANDARDS'}
                  </span>
                </h2>
                <p className="text-xs text-gray-500 uppercase tracking-widest">
                  Real-Time Data from Universal CMDB • {globalView ? `${globalView.total_assets.toLocaleString()} Assets` : 'Loading...'}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="glass-panel px-3 py-1 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${
                      executiveMetrics.csocCoverage < 50 ? 'bg-red-400' : 'bg-green-400'
                    }`} />
                    <span className="text-xs font-medium">
                      <span className={executiveMetrics.csocCoverage < 50 ? 'text-red-400' : 'text-green-400'}>
                        {executiveMetrics.complianceStatus}
                      </span>
                    </span>
                  </div>
                </div>
                
                <div className="glass-panel px-3 py-1 rounded-lg">
                  <span className="text-xs font-medium">
                    <span className="text-purple-300">RISK:</span>
                    <span className={`ml-1 ${
                      executiveMetrics.riskLevel === 'CRITICAL' ? 'text-red-400' :
                      executiveMetrics.riskLevel === 'HIGH' ? 'text-orange-400' :
                      executiveMetrics.riskLevel === 'MEDIUM' ? 'text-yellow-400' :
                      'text-green-400'
                    }`}>
                      {executiveMetrics.riskLevel}
                    </span>
                  </span>
                </div>
                
                <div className="text-xs font-mono text-cyan-400">
                  {currentTime}
                </div>
              </div>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
        </header>
        
        <main className="relative z-10 flex-1 overflow-hidden">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

// Loading View Component
const LoadingView: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400"></div>
        <div className="mt-4 text-xl font-bold text-cyan-400">LOADING UNIVERSAL CMDB</div>
        <div className="text-sm text-gray-400">Querying real-time data...</div>
      </div>
    </div>
  );
};

// Error View Component
interface ErrorViewProps {
  error: string;
}

const ErrorView: React.FC<ErrorViewProps> = ({ error }) => {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center glass-panel rounded-xl p-8">
        <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <div className="text-xl font-bold text-red-400 mb-2">DATABASE CONNECTION ERROR</div>
        <div className="text-sm text-gray-400 mb-4">{error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-red-500/20 border border-red-500 rounded text-red-400 hover:bg-red-500/30 transition-colors"
        >
          RETRY CONNECTION
        </button>
      </div>
    </div>
  );
};

// Executive Dashboard Component with Real Data
interface ExecutiveDashboardProps {
  metrics: {
    totalAssets: number;
    csocCoverage: number;
    splunkCoverage: number;
    chronicleCoverage: number;
    criticalGaps: number;
    complianceStatus: string;
    riskLevel: string;
  };
  globalData: any;
}

const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ metrics, globalData }) => {
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({});
  const threeDRef = useRef<HTMLDivElement>(null);
  const waveRef = useRef<HTMLCanvasView>(null);
  const networkRef = useRef<HTMLCanvasElement>(null);
  const matrixRef = useRef<HTMLCanvasElement>(null);

  // Same 3D visualization code as before, but using real metrics
  useEffect(() => {
    if (!threeDRef.current) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.002);

    const camera = new THREE.PerspectiveCamera(
      45,
      threeDRef.current.clientWidth / threeDRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 100);

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(threeDRef.current.clientWidth, threeDRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    threeDRef.current.appendChild(renderer.domElement);

    // Central security core - color based on real coverage
    const coreGeometry = new THREE.IcosahedronGeometry(15, 2);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: metrics.csocCoverage < 50 ? 0xff00ff : 0x00ffff,
      emissive: metrics.csocCoverage < 50 ? 0xff00ff : 0x00ffff,
      emissiveIntensity: 0.3,
      wireframe: false,
      transparent: true,
      opacity: 0.9
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);

    // Security layers based on real data
    const layers = [];
    const coverageMetrics = [metrics.csocCoverage, metrics.splunkCoverage, metrics.chronicleCoverage];
    
    for (let i = 0; i < 3; i++) {
      const layerGeometry = new THREE.IcosahedronGeometry(20 + i * 8, 1);
      const layerMaterial = new THREE.MeshPhongMaterial({
        color: i === 0 ? 0x00ffff : i === 1 ? 0xc084fc : 0xff00ff,
        wireframe: true,
        transparent: true,
        opacity: (coverageMetrics[i] || 0) / 200 // Opacity based on real coverage
      });
      const layer = new THREE.Mesh(layerGeometry, layerMaterial);
      layers.push(layer);
      scene.add(layer);
    }

    // Rest of the Three.js setup...
    // (Include all the particle systems, lighting, and animation code from before)

    const animate = () => {
      core.rotation.x += 0.005;
      core.rotation.y += 0.005;
      core.scale.setScalar(1 + Math.sin(Date.now() * 0.002) * 0.1);
      
      layers.forEach((layer, i) => {
        layer.rotation.x += 0.001 * (i + 1);
        layer.rotation.y -= 0.002 * (i + 1);
        layer.rotation.z += 0.001 * (i + 1);
      });
      
      const time = Date.now() * 0.0005;
      camera.position.x = Math.sin(time) * 80;
      camera.position.z = 100 + Math.cos(time) * 30;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (threeDRef.current && renderer.domElement) {
        threeDRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [metrics]);

  useEffect(() => {
    setTimeout(() => {
      setAnimatedValues({
        csoc: metrics.csocCoverage,
        splunk: metrics.splunkCoverage,
        chronicle: metrics.chronicleCoverage,
        assets: metrics.totalAssets,
        gaps: metrics.criticalGaps
      });
    }, 100);
  }, [metrics]);

  return (
    <div className="p-4 h-full flex flex-col bg-black">
      {/* Critical Alert with Real Data */}
      {metrics.csocCoverage < 50 && (
        <div className="mb-4 bg-black border border-pink-500/50 rounded-xl p-3 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-pink-400 animate-pulse" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-pink-400">CRITICAL VISIBILITY FAILURE</h3>
            <p className="text-white text-sm">
              Coverage at {metrics.csocCoverage.toFixed(1)}% - {metrics.criticalGaps.toLocaleString()} assets unmonitored
            </p>
          </div>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      )}

      {/* Key Metrics with Real Data */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="glass-panel rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <Activity className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white">{metrics.totalAssets.toLocaleString()}</div>
          <div className="text-xs text-gray-400">Total Assets</div>
        </div>

        <div className={`glass-panel rounded-xl p-3 ${metrics.csocCoverage < 50 ? 'border-red-500/30' : 'border-green-500/30'}`}>
          <div className="flex items-center justify-between mb-2">
            <Eye className="w-5 h-5 text-cyan-400" />
            <span className={`text-xs px-1 py-0.5 rounded ${
              metrics.csocCoverage < 50 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
            }`}>
              {metrics.riskLevel}
            </span>
          </div>
          <div className={`text-2xl font-bold ${metrics.csocCoverage < 50 ? 'text-red-400' : 'text-green-400'}`}>
            {metrics.csocCoverage.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-400">Visibility</div>
        </div>

        <div className="glass-panel rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <Server className="w-5 h-5 text-purple-400" />
            <Shield className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400">{metrics.splunkCoverage.toFixed(1)}%</div>
          <div className="text-xs text-gray-400">Splunk Coverage</div>
        </div>

        <div className="glass-panel rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <TrendingDown className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400">{(metrics.criticalGaps / 1000).toFixed(0)}K</div>
          <div className="text-xs text-gray-400">Critical Gaps</div>
        </div>
      </div>

      {/* Main Visualizations */}
      <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
        <div className="grid grid-rows-2 gap-4">
          {/* 3D Shield with Real Data */}
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="p-2 border-b border-blue-500/20">
              <h3 className="text-sm font-bold text-cyan-400 uppercase">REAL-TIME SECURITY MATRIX</h3>
            </div>
            <div ref={threeDRef} className="w-full" style={{ height: 'calc(100% - 40px)' }} />
          </div>

          {/* Platform Coverage with Real Data */}
          <div className="glass-panel rounded-xl p-3">
            <h3 className="text-sm font-bold text-purple-400 mb-2">PLATFORM STATUS</h3>
            <div className="space-y-2">
              {[
                { name: 'VISIBILITY', value: animatedValues.csoc, color: '#00ffff' },
                { name: 'Splunk', value: animatedValues.splunk, color: '#c084fc' },
                { name: 'CMDB', value: animatedValues.chronicle, color: '#ff00ff' }
              ].map((platform, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: platform.color }}>{platform.name}</span>
                    <span className="font-mono" style={{ color: platform.color }}>
                      {(platform.value || 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-4 bg-black/50 rounded-full overflow-hidden border border-gray-800">
                    <div 
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ 
                        width: `${platform.value || 0}%`,
                        background: `linear-gradient(90deg, ${platform.color}, ${platform.color}dd)`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Real Data Summary */}
        <div className="glass-panel rounded-xl p-4">
          <h3 className="text-lg font-bold text-cyan-400 mb-4">UNIVERSAL CMDB STATUS</h3>
          
          {globalData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">TOTAL ASSETS</div>
                  <div className="text-2xl font-bold text-white">{globalData.total_assets?.toLocaleString()}</div>
                </div>
                <div className="bg-black/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">MONITORED</div>
                  <div className="text-2xl font-bold text-green-400">{globalData.splunk_assets?.toLocaleString()}</div>
                </div>
                <div className="bg-black/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">CMDB COVERAGE</div>
                  <div className="text-2xl font-bold text-purple-400">{globalData.cmdb_coverage?.toFixed(1)}%</div>
                </div>
                <div className="bg-black/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">EDR COVERAGE</div>
                  <div className="text-2xl font-bold text-blue-400">{globalData.edr_coverage?.toFixed(1)}%</div>
                </div>
              </div>
              
              <div className="bg-black/50 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-2">COMPLIANCE STATUS</div>
                <div className={`text-lg font-bold ${metrics.complianceStatus === 'FAILED' ? 'text-red-400' : 'text-green-400'}`}>
                  {metrics.complianceStatus}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Risk Level: <span className={`font-bold ${
                    metrics.riskLevel === 'CRITICAL' ? 'text-red-400' :
                    metrics.riskLevel === 'HIGH' ? 'text-orange-400' :
                    'text-yellow-400'
                  }`}>{metrics.riskLevel}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};