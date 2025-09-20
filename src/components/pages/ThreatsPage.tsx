import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Shield, Activity, Target, Zap, TrendingUp, Clock, AlertCircle, Skull, Globe, Wifi, Radio, Crosshair, Navigation, AlertOctagon } from 'lucide-react';

const ThreatsPage: React.FC = () => {
  const [threats, setThreats] = useState<any[]>([]);
  const [selectedThreat, setSelectedThreat] = useState<any>(null);
  const [threatLevel, setThreatLevel] = useState<'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'>('MODERATE');
  const [pulseLocations, setPulseLocations] = useState<Array<{id: string, x: number, y: number}>>([]);
  const radarRef = useRef<HTMLCanvasElement>(null);
  const worldMapRef = useRef<HTMLDivElement>(null);

  // Generate dynamic threats
  useEffect(() => {
    const initialThreats = [
      {
        id: 'APT-2025-001',
        name: 'QUANTUM BREACH',
        type: 'Advanced Persistent Threat',
        severity: 'critical',
        origin: { lat: 39.9042, lon: 116.4074, country: 'China' },
        target: { lat: 40.7128, lon: -74.0060, country: 'USA' },
        status: 'active',
        confidence: 98,
        killChain: ['reconnaissance', 'weaponization', 'delivery', 'exploitation'],
        affected: 127,
        mitigation: 45,
        description: 'Sophisticated quantum-resistant malware detected in critical infrastructure',
        timeline: [
          { time: '00:12:34', event: 'Initial detection' },
          { time: '00:15:22', event: 'Payload analysis started' },
          { time: '00:18:45', event: 'Containment initiated' },
          { time: '00:22:10', event: 'Threat neutralization in progress' }
        ]
      },
      {
        id: 'RAN-2025-042',
        name: 'DARKNET CIPHER',
        type: 'Ransomware',
        severity: 'high',
        origin: { lat: 55.7558, lon: 37.6173, country: 'Russia' },
        target: { lat: 51.5074, lon: -0.1278, country: 'UK' },
        status: 'mitigating',
        confidence: 92,
        killChain: ['exploitation', 'installation', 'command'],
        affected: 45,
        mitigation: 78,
        description: 'Next-gen encryption ransomware targeting financial systems'
      },
      {
        id: 'DDoS-2025-156',
        name: 'TSUNAMI WAVE',
        type: 'Distributed Denial of Service',
        severity: 'medium',
        origin: { lat: -23.5505, lon: -46.6333, country: 'Brazil' },
        target: { lat: 35.6762, lon: 139.6503, country: 'Japan' },
        status: 'contained',
        confidence: 87,
        killChain: ['reconnaissance', 'weaponization'],
        affected: 12,
        mitigation: 95,
        description: 'Multi-vector DDoS attack using IoT botnet'
      }
    ];

    setThreats(initialThreats);

    // Simulate new threats
    const interval = setInterval(() => {
      const newThreat = {
        id: `NEW-${Date.now()}`,
        name: `THREAT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        type: ['Malware', 'Phishing', 'Zero-Day', 'Insider'][Math.floor(Math.random() * 4)],
        severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
        origin: { 
          lat: (Math.random() - 0.5) * 180, 
          lon: (Math.random() - 0.5) * 360,
          country: 'Unknown'
        },
        target: { 
          lat: (Math.random() - 0.5) * 180, 
          lon: (Math.random() - 0.5) * 360,
          country: 'Various'
        },
        status: 'active',
        confidence: 50 + Math.floor(Math.random() * 50),
        killChain: [],
        affected: Math.floor(Math.random() * 100),
        mitigation: 0,
        description: 'New threat detected - analysis in progress'
      };

      setThreats(prev => [newThreat, ...prev].slice(0, 10));
      
      // Add pulse animation
      setPulseLocations(prev => [...prev, {
        id: newThreat.id,
        x: Math.random() * 100,
        y: Math.random() * 100
      }]);
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

    let sweepAngle = 0;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 140;

    const animate = () => {
      sweepAngle += 0.02;

      // Clear with fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw radar circles
      for (let r = radius; r > 0; r -= radius / 4) {
        ctx.strokeStyle = `rgba(0, 255, 255, ${0.2 * (r / radius)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw cross lines
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, canvas.height);
      ctx.moveTo(0, centerY);
      ctx.lineTo(canvas.width, centerY);
      ctx.stroke();

      // Draw sweep line
      const sweepGradient = ctx.createLinearGradient(
        centerX,
        centerY,
        centerX + Math.cos(sweepAngle) * radius,
        centerY + Math.sin(sweepAngle) * radius
      );
      sweepGradient.addColorStop(0, 'rgba(0, 255, 255, 0)');
      sweepGradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.5)');
      sweepGradient.addColorStop(1, 'rgba(0, 255, 255, 0.8)');

      ctx.strokeStyle = sweepGradient;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(sweepAngle) * radius,
        centerY + Math.sin(sweepAngle) * radius
      );
      ctx.stroke();

      // Draw sweep cone
      ctx.fillStyle = 'rgba(0, 255, 255, 0.05)';
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, sweepAngle - 0.3, sweepAngle, false);
      ctx.closePath();
      ctx.fill();

      // Draw threat blips
      threats.forEach((threat, index) => {
        const angle = (index / threats.length) * Math.PI * 2;
        const distance = (threat.confidence / 100) * radius;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;

        // Blip glow
        const glowSize = threat.severity === 'critical' ? 15 : 10;
        const glowColor = threat.severity === 'critical' ? 'rgba(255, 0, 68, 0.6)' :
                         threat.severity === 'high' ? 'rgba(255, 136, 0, 0.6)' :
                         threat.severity === 'medium' ? 'rgba(255, 255, 0, 0.6)' :
                         'rgba(0, 255, 136, 0.6)';

        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
        glowGradient.addColorStop(0, glowColor);
        glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = glowGradient;
        ctx.fillRect(x - glowSize, y - glowSize, glowSize * 2, glowSize * 2);

        // Blip core
        ctx.fillStyle = threat.severity === 'critical' ? '#ff0044' :
                       threat.severity === 'high' ? '#ff8800' :
                       threat.severity === 'medium' ? '#ffff00' :
                       '#00ff88';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
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
    <div className="p-6 min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-orange-900/20 to-yellow-900/20"
             style={{
               animation: 'pulse 4s ease-in-out infinite'
             }} />
      </div>

      {/* Pulse animations for new threats */}
      {pulseLocations.map(loc => (
        <div
          key={loc.id}
          className="fixed pointer-events-none"
          style={{
            left: `${loc.x}%`,
            top: `${loc.y}%`,
            zIndex: 1
          }}
        >
          <div className="relative">
            <div className="absolute w-40 h-40 border-2 border-red-400 rounded-full animate-ping" />
            <div className="absolute w-40 h-40 border-2 border-orange-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
          </div>
        </div>
      ))}

      {/* Header */}
      <div className="relative z-10 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-black mb-2" style={{
              fontFamily: 'Orbitron, monospace',
              textShadow: '0 0 40px rgba(255, 0, 68, 0.8)'
            }}>
              <span style={{
                background: 'linear-gradient(135deg, #ff0044, #ff8800, #ffff00)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundSize: '200% 200%',
                animation: 'gradient-shift 3s ease infinite'
              }}>
                THREAT COMMAND CENTER
              </span>
            </h1>
            <p className="text-red-400/60 font-mono text-sm tracking-wider">
              REAL-TIME CYBER THREAT INTELLIGENCE & RESPONSE
            </p>
          </div>

          {/* Threat level indicator */}
          <div className={`backdrop-blur-xl rounded-xl p-6 border-2 ${
            threatLevel === 'CRITICAL' ? 'bg-red-500/10 border-red-500' :
            threatLevel === 'HIGH' ? 'bg-orange-500/10 border-orange-500' :
            threatLevel === 'MODERATE' ? 'bg-yellow-500/10 border-yellow-500' :
            'bg-green-500/10 border-green-500'
          }`} style={{
            boxShadow: threatLevel === 'CRITICAL' ? '0 0 40px rgba(255, 0, 68, 0.5)' :
                      threatLevel === 'HIGH' ? '0 0 40px rgba(255, 136, 0, 0.5)' :
                      threatLevel === 'MODERATE' ? '0 0 40px rgba(255, 255, 0, 0.5)' :
                      '0 0 40px rgba(0, 255, 136, 0.5)'
          }}>
            <div className="text-center">
              <AlertOctagon className={`w-12 h-12 mx-auto mb-2 ${
                threatLevel === 'CRITICAL' ? 'text-red-500 animate-pulse' :
                threatLevel === 'HIGH' ? 'text-orange-500 animate-pulse' :
                threatLevel === 'MODERATE' ? 'text-yellow-500' :
                'text-green-500'
              }`} />
              <div className="text-2xl font-bold font-mono">
                {threatLevel}
              </div>
              <div className="text-xs opacity-60 mt-1">GLOBAL THREAT LEVEL</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main dashboard grid */}
      <div className="relative z-10 grid grid-cols-12 gap-6">
        {/* Radar scanner */}
        <div className="col-span-3">
          <div className="backdrop-blur-xl bg-black/40 rounded-2xl border border-cyan-400/30 p-4"
               style={{
                 boxShadow: '0 0 40px rgba(0, 255, 255, 0.2), inset 0 0 40px rgba(0, 0, 0, 0.5)'
               }}>
            <h3 className="text-sm font-mono text-cyan-400 mb-4 text-center">THREAT RADAR</h3>
            <canvas ref={radarRef} className="w-full" />
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold font-mono text-cyan-400">
                  {threats.length}
                </div>
                <div className="text-xs text-cyan-400/60">ACTIVE</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold font-mono text-red-400">
                  {threats.filter(t => t.severity === 'critical').length}
                </div>
                <div className="text-xs text-red-400/60">CRITICAL</div>
              </div>
            </div>
          </div>
        </div>

        {/* Threat list */}
        <div className="col-span-6">
          <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
            {threats.map(threat => (
              <div
                key={threat.id}
                className={`backdrop-blur-xl rounded-xl border cursor-pointer transition-all ${
                  selectedThreat?.id === threat.id
                    ? 'bg-red-500/20 border-red-500 scale-102'
                    : 'bg-black/40 border-red-400/20 hover:border-red-400/40'
                }`}
                onClick={() => setSelectedThreat(threat)}
                style={{
                  boxShadow: selectedThreat?.id === threat.id
                    ? '0 0 30px rgba(255, 0, 68, 0.3)'
                    : '0 0 20px rgba(0, 0, 0, 0.5)'
                }}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`relative ${
                        threat.status === 'active' ? 'animate-pulse' : ''
                      }`}>
                        <Skull className={`w-5 h-5 ${
                          threat.severity === 'critical' ? 'text-red-500' :
                          threat.severity === 'high' ? 'text-orange-500' :
                          threat.severity === 'medium' ? 'text-yellow-500' :
                          'text-green-500'
                        }`} />
                        {threat.status === 'active' && (
                          <div className="absolute inset-0 w-5 h-5 rounded-full border-2 border-red-500 animate-ping" />
                        )}
                      </div>
                      <div>
                        <div className="font-mono font-bold text-sm">{threat.name}</div>
                        <div className="text-xs opacity-60">{threat.id}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                        threat.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                        threat.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                        threat.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {threat.severity.toUpperCase()}
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-mono ${
                        threat.status === 'active' ? 'bg-red-500/20 text-red-400' :
                        threat.status === 'mitigating' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {threat.status.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div>
                      <div className="text-xs opacity-60">TYPE</div>
                      <div className="text-sm font-mono">{threat.type}</div>
                    </div>
                    <div>
                      <div className="text-xs opacity-60">CONFIDENCE</div>
                      <div className="text-sm font-mono">{threat.confidence}%</div>
                    </div>
                    <div>
                      <div className="text-xs opacity-60">AFFECTED</div>
                      <div className="text-sm font-mono">{threat.affected} systems</div>
                    </div>
                  </div>

                  {/* Kill chain progress */}
                  {threat.killChain && threat.killChain.length > 0 && (
                    <div className="flex gap-1 mb-3">
                      {['reconnaissance', 'weaponization', 'delivery', 'exploitation', 'installation', 'command', 'actions'].map(stage => (
                        <div
                          key={stage}
                          className={`flex-1 h-1 rounded-full ${
                            threat.killChain.includes(stage)
                              ? 'bg-red-500'
                              : 'bg-gray-700'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Mitigation progress */}
                  <div className="bg-black/50 rounded-full overflow-hidden">
                    <div 
                      className="h-2 bg-gradient-to-r from-red-500 to-green-500 transition-all"
                      style={{ width: `${threat.mitigation}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Threat details */}
        <div className="col-span-3">
          {selectedThreat ? (
            <div className="backdrop-blur-xl bg-black/40 rounded-2xl border border-purple-400/30 p-4"
                 style={{
                   boxShadow: '0 0 40px rgba(168, 85, 247, 0.2), inset 0 0 40px rgba(0, 0, 0, 0.5)'
                 }}>
              <h3 className="text-sm font-mono text-purple-400 mb-4">THREAT ANALYSIS</h3>
              
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
                  <div className="text-xs opacity-60 mb-1">TARGET</div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-mono">{selectedThreat.target.country}</span>
                  </div>
                </div>

                {selectedThreat.timeline && (
                  <div>
                    <div className="text-xs opacity-60 mb-2">TIMELINE</div>
                    <div className="space-y-2">
                      {selectedThreat.timeline.map((event: any, index: number) => (
                        <div key={index} className="flex gap-2 text-xs">
                          <span className="text-purple-400 font-mono">{event.time}</span>
                          <span className="opacity-80">{event.event}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button className="w-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/50 rounded-lg py-2 text-sm font-mono hover:from-purple-500/30 hover:to-pink-500/30 transition-all">
                  INITIATE RESPONSE
                </button>
              </div>
            </div>
          ) : (
            <div className="backdrop-blur-xl bg-black/40 rounded-2xl border border-purple-400/30 p-8 text-center"
                 style={{
                   boxShadow: '0 0 40px rgba(168, 85, 247, 0.2), inset 0 0 40px rgba(0, 0, 0, 0.5)'
                 }}>
              <Shield className="w-16 h-16 mx-auto mb-4 text-purple-400/40" />
              <p className="text-sm text-purple-400/60">SELECT A THREAT FOR ANALYSIS</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 0, 68, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 0, 68, 0.5);
          border-radius: 2px;
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
};

export default ThreatsPage;