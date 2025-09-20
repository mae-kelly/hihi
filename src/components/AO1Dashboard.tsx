import React, { useState, useEffect, useRef } from 'react';
import { Shield, Activity, Database, Server, Cloud, Wifi, Terminal, Zap, Globe, Lock, Eye, Target, TrendingUp, Users, BarChart3, AlertCircle, ChevronRight, Monitor, Cpu, HardDrive, Network, Layers, Box, Hexagon } from 'lucide-react';

interface AO1DashboardProps {
  user: string;
}

const AO1Dashboard: React.FC<AO1DashboardProps> = ({ user }) => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [dataFlow, setDataFlow] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // AO1 Specific Metrics based on requirements
  const visibilityMetrics = {
    totalAssets: 262032,
    csocCoverage: 50237,
    splunkCoverage: 167517,
    chronicleCoverage: 241691,
    logsVolume: 76034,
    cloudCoverage: 19.17,
    onPremCoverage: 63.93,
    chroniclePercent: 92.24,
    splunkPercent: 29.02,
    windowsMissing: 14.16,
    linuxMissing: 30.71,
    csocMissing: 19.25,
    splunkMissing: 36.07
  };

  // Animated wave visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let time = 0;
    const animate = () => {
      time += 0.02;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw data flow waves
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.strokeStyle = i % 2 === 0 
          ? `rgba(0, 255, 255, ${0.3 - i * 0.05})`
          : `rgba(192, 132, 252, ${0.3 - i * 0.05})`;
        ctx.lineWidth = 2;
        
        for (let x = 0; x < canvas.width; x += 5) {
          const y = canvas.height / 2 + 
                   Math.sin((x / 50) + time + i * 0.5) * 30 * (1 - i * 0.1) +
                   Math.sin((x / 30) + time * 1.5 + i * 0.3) * 20 * (1 - i * 0.1);
          
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }
      
      requestAnimationFrame(animate);
    };
    animate();
  }, []);

  const metrics = [
    {
      icon: Eye,
      label: 'GLOBAL VIEW',
      value: `${(visibilityMetrics.csocCoverage / 1000).toFixed(1)}K`,
      subtext: 'CSOC Coverage',
      color: 'cyan',
      gradient: 'from-cyan-400 to-blue-400',
      percentage: visibilityMetrics.csocCoverage / visibilityMetrics.totalAssets * 100
    },
    {
      icon: Database,
      label: 'SPLUNK',
      value: `${(visibilityMetrics.splunkCoverage / 1000).toFixed(1)}K`,
      subtext: `${visibilityMetrics.splunkPercent}%`,
      color: 'purple',
      gradient: 'from-purple-400 to-pink-400',
      percentage: visibilityMetrics.splunkPercent
    },
    {
      icon: Cloud,
      label: 'CHRONICLE',
      value: `${(visibilityMetrics.chronicleCoverage / 1000).toFixed(1)}K`,
      subtext: `${visibilityMetrics.chroniclePercent}%`,
      color: 'pink',
      gradient: 'from-pink-400 to-rose-400',
      percentage: visibilityMetrics.chroniclePercent
    },
    {
      icon: Activity,
      label: 'LOG VOLUME',
      value: `${(visibilityMetrics.logsVolume / 1000).toFixed(1)}K`,
      subtext: 'GB/Day',
      color: 'cyan',
      gradient: 'from-blue-400 to-cyan-400',
      percentage: 100
    }
  ];

  const infrastructureTypes = [
    { name: 'ON-PREMISE', percentage: visibilityMetrics.onPremCoverage, status: 'active' },
    { name: 'CLOUD', percentage: visibilityMetrics.cloudCoverage, status: 'warning' },
    { name: 'SAAS', percentage: 42.8, status: 'active' },
    { name: 'API', percentage: 67.2, status: 'active' }
  ];

  const missingCoverage = [
    { system: 'WINDOWS SERVER', missing: visibilityMetrics.windowsMissing, platform: 'GSO' },
    { system: 'LINUX SERVER', missing: visibilityMetrics.linuxMissing, platform: 'GSO' },
    { system: 'MAINFRAME', missing: 0, platform: 'SPLUNK' },
    { system: 'DATABASE', missing: visibilityMetrics.csocMissing, platform: 'CSOC' }
  ];

  return (
    <div className="p-8 min-h-screen">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-5xl font-black mb-4 holo-text">
          AO1 LOG VISIBILITY MEASUREMENT
        </h1>
        <div className="flex items-center gap-6">
          <div className="glass-panel px-4 py-2 rounded-full">
            <span className="text-sm font-medium text-cyan-300">
              TOTAL ASSETS: {visibilityMetrics.totalAssets.toLocaleString()}
            </span>
          </div>
          <div className="glass-panel px-4 py-2 rounded-full">
            <span className="text-sm font-medium text-purple-300">
              CMDB ACCURATE: 100%
            </span>
          </div>
          <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-green-400">
              LIVE MONITORING
            </span>
          </div>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="holo-card rounded-2xl p-6 cursor-pointer transition-all duration-500 holo-shine"
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                transform: hoveredCard === index ? 'scale(1.05) translateY(-10px)' : 'scale(1)',
                boxShadow: hoveredCard === index 
                  ? `0 20px 60px rgba(0, 255, 255, 0.3), 0 0 100px rgba(192, 132, 252, 0.2)`
                  : 'none'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <Icon className={`w-8 h-8 ${
                  metric.color === 'cyan' ? 'text-cyan-400' :
                  metric.color === 'purple' ? 'text-purple-400' :
                  'text-pink-400'
                }`} />
                <Hexagon className="w-6 h-6 text-gray-600" />
              </div>
              
              <div className="text-3xl font-bold mb-2">
                <span className={`bg-gradient-to-r ${metric.gradient} bg-clip-text text-transparent`}>
                  {metric.value}
                </span>
              </div>
              
              <div className="text-sm text-gray-400 uppercase tracking-wider">
                {metric.label}
              </div>
              
              <div className="text-xs text-gray-500 mt-1">
                {metric.subtext}
              </div>
              
              {/* Progress bar */}
              <div className="mt-4 h-2 bg-black/50 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${metric.percentage}%`,
                    background: metric.color === 'cyan' 
                      ? 'linear-gradient(to right, rgba(0, 255, 255, 0.5), rgba(0, 255, 255, 0.8))'
                      : metric.color === 'purple'
                      ? 'linear-gradient(to right, rgba(192, 132, 252, 0.5), rgba(192, 132, 252, 0.8))'
                      : 'linear-gradient(to right, rgba(255, 0, 255, 0.5), rgba(255, 0, 255, 0.8))'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Data Flow Visualization */}
        <div className="col-span-8">
          <div className="glass-panel rounded-2xl p-6 h-[400px] relative">
            <h3 className="text-lg font-semibold mb-4 text-cyan-300 uppercase tracking-wider">
              Log Collection Pipeline
            </h3>
            <canvas 
              ref={canvasRef}
              className="w-full h-[300px]"
              style={{
                filter: 'drop-shadow(0 0 20px rgba(0, 255, 255, 0.5))'
              }}
            />
            
            {/* Pipeline nodes */}
            <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2">
              <div className="glass-panel rounded-lg px-4 py-2">
                <span className="text-xs font-bold text-cyan-400">IPAM</span>
              </div>
            </div>
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="glass-panel rounded-lg px-4 py-2">
                <span className="text-xs font-bold text-purple-400">CMDB</span>
              </div>
            </div>
            
            <div className="absolute top-1/2 left-3/4 -translate-x-1/2 -translate-y-1/2">
              <div className="glass-panel rounded-lg px-4 py-2">
                <span className="text-xs font-bold text-pink-400">BigQuery</span>
              </div>
            </div>
            
            <div className="absolute bottom-6 left-6 right-6 flex justify-between">
              <div className="glass-panel px-3 py-2 rounded">
                <span className="text-xs text-gray-400">THROUGHPUT</span>
                <div className="text-lg font-bold text-cyan-400">2.4 TB/s</div>
              </div>
              <div className="glass-panel px-3 py-2 rounded">
                <span className="text-xs text-gray-400">LATENCY</span>
                <div className="text-lg font-bold text-purple-400">0.3ms</div>
              </div>
              <div className="glass-panel px-3 py-2 rounded">
                <span className="text-xs text-gray-400">ACCURACY</span>
                <div className="text-lg font-bold text-pink-400">99.9%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Infrastructure Types */}
        <div className="col-span-4">
          <div className="glass-panel rounded-2xl p-6 h-[400px]">
            <h3 className="text-lg font-semibold mb-4 text-purple-300 uppercase tracking-wider">
              Infrastructure Coverage
            </h3>
            
            <div className="space-y-4">
              {infrastructureTypes.map((infra) => {
                const status = infra.status;
                const statusColor = status === 'active' ? 'green' : 'yellow';
                
                return (
                  <div key={infra.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">{infra.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          status === 'active' 
                            ? 'bg-green-400/20 text-green-400'
                            : 'bg-yellow-400/20 text-yellow-400'
                        }`}>
                          {infra.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-500 rounded-full"
                        style={{
                          width: `${infra.percentage}%`,
                          background: status === 'active'
                            ? 'linear-gradient(90deg, #00ffff, #00e5ff)'
                            : 'linear-gradient(90deg, #f0abfc, #e879f9)'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Security Control Coverage */}
            <div className="mt-6 pt-4 border-t border-cyan-400/20">
              <h4 className="text-sm font-semibold text-cyan-300 mb-3">Security Controls</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-panel rounded-lg p-2 text-center">
                  <div className="text-xs text-gray-400">EDR</div>
                  <div className="text-lg font-bold text-cyan-400">87%</div>
                </div>
                <div className="glass-panel rounded-lg p-2 text-center">
                  <div className="text-xs text-gray-400">TANIUM</div>
                  <div className="text-lg font-bold text-purple-400">92%</div>
                </div>
                <div className="glass-panel rounded-lg p-2 text-center">
                  <div className="text-xs text-gray-400">DLP</div>
                  <div className="text-lg font-bold text-pink-400">78%</div>
                </div>
                <div className="glass-panel rounded-lg p-2 text-center">
                  <div className="text-xs text-gray-400">FIM</div>
                  <div className="text-lg font-bold text-green-400">95%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Missing Coverage Alert */}
      <div className="mt-8 glass-panel rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4 text-pink-300 uppercase tracking-wider">
          Critical Coverage Gaps
        </h3>
        <div className="grid grid-cols-4 gap-4">
          {missingCoverage.map((item) => (
            <div key={item.system} className="glass-panel rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{item.system}</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  item.missing === 0 
                    ? 'bg-green-400/20 text-green-400'
                    : item.missing > 20
                    ? 'bg-red-400/20 text-red-400'
                    : 'bg-yellow-400/20 text-yellow-400'
                }`}>
                  {item.missing === 0 ? 'COMPLETE' : `${item.missing.toFixed(2)}% MISSING`}
                </span>
              </div>
              <div className="text-xs text-gray-400">Platform: {item.platform}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AO1Dashboard;