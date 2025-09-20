import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Shield, Activity, Target, Zap, TrendingUp, Clock, AlertCircle, Skull, Globe, Wifi, Radio, Crosshair, Navigation, AlertOctagon, Hexagon, Triangle, Circle } from 'lucide-react';

const ThreatsPage: React.FC = () => {
  const [threats, setThreats] = useState<any[]>([]);
  const [selectedThreat, setSelectedThreat] = useState<any>(null);
  const [threatLevel, setThreatLevel] = useState<'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'>('MODERATE');
  const radarRef = useRef<HTMLCanvasElement>(null);
  const [scanAngle, setScanAngle] = useState(0);

  useEffect(() => {
    // Initialize threats
    const initialThreats = [
      {
        id: 'QTH-2025-001',
        name: 'QUANTUM BREACH ALPHA',
        type: 'Zero-Day Exploit',
        severity: 'critical',
        origin: { lat: 39.9042, lon: 116.4074, country: 'Unknown' },
        status: 'active',
        confidence: 98,
        affected: 127,
        mitigation: 45,
        description: 'Advanced quantum-resistant malware detected in neural pathways'
      },
      {
        id: 'QTH-2025-002',
        name: 'PHOTON STORM',
        type: 'DDoS Attack',
        severity: 'high',
        origin: { lat: 55.7558, lon: 37.6173, country: 'Classified' },
        status: 'mitigating',
        confidence: 92,
        affected: 45,
        mitigation: 78,
        description: 'Coordinated photon-based denial of service'
      },
      {
        id: 'QTH-2025-003',
        name: 'VOID WALKER',
        type: 'Ransomware',
        severity: 'medium',
        origin: { lat: -23.5505, lon: -46.6333, country: 'Global' },
        status: 'contained',
        confidence: 87,
        affected: 12,
        mitigation: 95,
        description: 'Self-replicating encryption virus with AI capabilities'
      }
    ];
    setThreats(initialThreats);

    // Add new threats periodically
    const interval = setInterval(() => {
      const newThreat = {
        id: `QTH-${Date.now()}`,
        name: `ANOMALY-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        type: ['Malware', 'Phishing', 'Zero-Day', 'Insider'][Math.floor(Math.random() * 4)],
        severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
        origin: { lat: (Math.random() - 0.5) * 180, lon: (Math.random() - 0.5) * 360, country: 'Unknown' },
        status: 'active',
        confidence: 50 + Math.floor(Math.random() * 50),
        affected: Math.floor(Math.random() * 100),
        mitigation: 0,
        description: 'New threat detected - analysis in progress'
      };
      setThreats(prev => [newThreat, ...prev].slice(0, 10));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Radar animation
  useEffect(() => {
    const canvas = radarRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 300;
    canvas.height = 300;

    let angle = 0;
    const animate = () => {
      angle += 0.02;
      setScanAngle(angle);

      // Clear with fade
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 140;

      // Draw radar circles
      for (let r = radius; r > 0; r -= radius / 4) {
        ctx.strokeStyle = `rgba(0, 255, 255, ${0.2 * (r / radius)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw scan line
      const scanGradient = ctx.createLinearGradient(
        centerX, centerY,
        centerX + Math.cos(angle) * radius,
        centerY + Math.sin(angle) * radius
      );
      scanGradient.addColorStop(0, 'rgba(192, 132, 252, 0)');
      scanGradient.addColorStop(0.5, 'rgba(192, 132, 252, 0.5)');
      scanGradient.addColorStop(1, 'rgba(192, 132, 252, 0.8)');

      ctx.strokeStyle = scanGradient;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(angle) * radius,
        centerY + Math.sin(angle) * radius
      );
      ctx.stroke();

      // Draw threat blips
      threats.forEach((threat, index) => {
        const blipAngle = (index / threats.length) * Math.PI * 2;
        const distance = (threat.confidence / 100) * radius * 0.8;
        const x = centerX + Math.cos(blipAngle) * distance;
        const y = centerY + Math.sin(blipAngle) * distance;

        // Blip with glow
        const color = threat.severity === 'critical' ? '#ff00ff' :
                     threat.severity === 'high' ? '#e879f9' :
                     threat.severity === 'medium' ? '#c084fc' :
                     '#00ffff';

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Pulse effect
        if (threat.status === 'active') {
          ctx.beginPath();
          ctx.arc(x, y, 8 + Math.sin(angle * 10) * 4, 0, Math.PI * 2);
          ctx.strokeStyle = color;
          ctx.globalAlpha = 0.5;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      });

      requestAnimationFrame(animate);
    };
    animate();
  }, [threats]);

  // Update threat level
  useEffect(() => {
    const criticalCount = threats.filter(t => t.severity === 'critical').length;
    const highCount = threats.filter(t => t.severity === 'high').length;

    if (criticalCount > 0) setThreatLevel('CRITICAL');
    else if (highCount > 2) setThreatLevel('HIGH');
    else if (highCount > 0) setThreatLevel('MODERATE');
    else setThreatLevel('LOW');
  }, [threats]);

  return (
    <div className="p-8 min-h-screen">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-black mb-3 holo-text">
            THREAT INTELLIGENCE
          </h1>
          <p className="text-pink-300/60 uppercase tracking-widest text-sm">
            Quantum Threat Detection • Real-Time Analysis
          </p>
        </div>

        {/* Threat Level Indicator */}
        <div className={`glass-panel rounded-2xl p-6 ${
          threatLevel === 'CRITICAL' ? 'border-pink-400/50' :
          threatLevel === 'HIGH' ? 'border-purple-400/50' :
          threatLevel === 'MODERATE' ? 'border-cyan-400/50' :
          'border-cyan-400/30'
        }`} style={{
          boxShadow: threatLevel === 'CRITICAL' ? '0 0 40px rgba(255, 0, 255, 0.5)' :
                    threatLevel === 'HIGH' ? '0 0 40px rgba(192, 132, 252, 0.5)' :
                    '0 0 30px rgba(0, 255, 255, 0.3)'
        }}>
          <div className="text-center">
            <AlertOctagon className={`w-12 h-12 mx-auto mb-2 ${
              threatLevel === 'CRITICAL' ? 'text-pink-400 animate-pulse' :
              threatLevel === 'HIGH' ? 'text-purple-400 animate-pulse' :
              threatLevel === 'MODERATE' ? 'text-cyan-400' :
              'text-cyan-300'
            }`} />
            <div className="text-2xl font-bold">
              <span className={
                threatLevel === 'CRITICAL' ? 'text-pink-400' :
                threatLevel === 'HIGH' ? 'text-purple-400' :
                threatLevel === 'MODERATE' ? 'text-cyan-400' :
                'text-cyan-300'
              }>
                {threatLevel}
              </span>
            </div>
            <div className="text-xs opacity-60 mt-1">GLOBAL THREAT LEVEL</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Radar Scanner */}
        <div className="col-span-3">
          <div className="glass-panel rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-cyan-300 mb-4 text-center uppercase tracking-wider">
              Threat Radar
            </h3>
            <canvas ref={radarRef} className="w-full" />
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="text-center glass-panel rounded-lg p-2">
                <div className="text-2xl font-bold text-cyan-400">{threats.length}</div>
                <div className="text-xs text-cyan-400/60">ACTIVE</div>
              </div>
              <div className="text-center glass-panel rounded-lg p-2">
                <div className="text-2xl font-bold text-pink-400">
                  {threats.filter(t => t.severity === 'critical').length}
                </div>
                <div className="text-xs text-pink-400/60">CRITICAL</div>
              </div>
            </div>
          </div>
        </div>

        {/* Threat List */}
        <div className="col-span-6">
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {threats.map(threat => (
              <div
                key={threat.id}
                className={`glass-panel rounded-xl cursor-pointer transition-all holo-shine ${
                  selectedThreat?.id === threat.id ? 'scale-102 border-purple-400/50' : ''
                }`}
                onClick={() => setSelectedThreat(threat)}
                style={{
                  boxShadow: selectedThreat?.id === threat.id
                    ? '0 0 30px rgba(192, 132, 252, 0.3)'
                    : undefined
                }}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`relative ${threat.status === 'active' ? 'animate-pulse' : ''}`}>
                        <Skull className={`w-5 h-5 ${
                          threat.severity === 'critical' ? 'text-pink-400' :
                          threat.severity === 'high' ? 'text-purple-400' :
                          threat.severity === 'medium' ? 'text-cyan-400' :
                          'text-cyan-300'
                        }`} />
                      </div>
                      <div>
                        <div className="font-mono font-bold text-sm">{threat.name}</div>
                        <div className="text-xs opacity-60">{threat.id}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                        threat.severity === 'critical' ? 'bg-pink-400/20 text-pink-400' :
                        threat.severity === 'high' ? 'bg-purple-400/20 text-purple-400' :
                        threat.severity === 'medium' ? 'bg-cyan-400/20 text-cyan-400' :
                        'bg-cyan-300/20 text-cyan-300'
                      }`}>
                        {threat.severity.toUpperCase()}
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-mono ${
                        threat.status === 'active' ? 'bg-red-400/20 text-red-400' :
                        threat.status === 'mitigating' ? 'bg-yellow-400/20 text-yellow-400' :
                        'bg-green-400/20 text-green-400'
                      }`}>
                        {threat.status.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3 text-xs">
                    <div>
                      <span className="opacity-60">TYPE</span>
                      <div className="font-mono">{threat.type}</div>
                    </div>
                    <div>
                      <span className="opacity-60">CONFIDENCE</span>
                      <div className="font-mono">{threat.confidence}%</div>
                    </div>
                    <div>
                      <span className="opacity-60">AFFECTED</span>
                      <div className="font-mono">{threat.affected} nodes</div>
                    </div>
                  </div>

                  {/* Mitigation progress */}
                  <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-300 rounded-full"
                      style={{ 
                        width: `${threat.mitigation}%`,
                        background: 'linear-gradient(90deg, #ff00ff, #c084fc, #00ffff)'
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Threat Details */}
        <div className="col-span-3">
          {selectedThreat ? (
            <div className="glass-panel rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-purple-300 mb-4 uppercase tracking-wider">
                Threat Analysis
              </h3>
              
              <div className="space-y-4">
                <div>
                  <div className="text-xs opacity-60 mb-1">DESCRIPTION</div>
                  <p className="text-sm">{selectedThreat.description}</p>
                </div>

                <div>
                  <div className="text-xs opacity-60 mb-1">ORIGIN</div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-mono">{selectedThreat.origin.country}</span>
                  </div>
                </div>

                <div>
                  <div className="text-xs opacity-60 mb-1">COORDINATES</div>
                  <div className="text-sm font-mono text-cyan-400">
                    {selectedThreat.origin.lat.toFixed(4)}, {selectedThreat.origin.lon.toFixed(4)}
                  </div>
                </div>

                <button className="w-full neon-btn py-3 rounded-xl font-semibold uppercase tracking-wider">
                  Deploy Countermeasures
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-12 text-center">
              <Shield className="w-16 h-16 mx-auto mb-4 text-purple-400/40" />
              <p className="text-sm text-purple-400/60 uppercase tracking-wider">
                Select threat for analysis
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThreatsPage;