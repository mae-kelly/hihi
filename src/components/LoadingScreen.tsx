import React, { useEffect, useState, useRef } from 'react';
import { Shield, Lock, Terminal, Cpu, Zap, Database, Server, Globe, Activity, Fingerprint, Hexagon, Triangle, Circle, Box, Pentagon } from 'lucide-react';

interface LoadingScreenProps {
  onComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('INITIALIZING QUANTUM CORE...');
  const [systemChecks, setSystemChecks] = useState<Record<string, boolean>>({});
  const [matrixData, setMatrixData] = useState<string[][]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const statusMessages = [
    'INITIALIZING QUANTUM CORE...',
    'ESTABLISHING NEURAL PATHWAYS...',
    'CALIBRATING PHOTON MATRICES...',
    'SYNCING TEMPORAL DATABASES...',
    'LOADING ENCRYPTION PROTOCOLS...',
    'VERIFYING BIOMETRIC SIGNATURES...',
    'CONNECTING TO SATELLITE GRID...',
    'ACTIVATING DEFENSE SYSTEMS...',
    'QUANTUM ENTANGLEMENT STABLE...',
    'SYSTEM READY'
  ];

  const systemComponents = [
    { id: 'quantum', label: 'QUANTUM', icon: Cpu },
    { id: 'neural', label: 'NEURAL', icon: Activity },
    { id: 'security', label: 'SECURITY', icon: Shield },
    { id: 'database', label: 'DATABASE', icon: Database },
    { id: 'network', label: 'NETWORK', icon: Globe },
    { id: 'encryption', label: 'CRYPTO', icon: Lock }
  ];

  // Generate matrix rain effect
  useEffect(() => {
    const rows = 10;
    const cols = 30;
    const matrix = Array(rows).fill(null).map(() => 
      Array(cols).fill(null).map(() => 
        Math.random() > 0.5 ? '1' : '0'
      )
    );
    setMatrixData(matrix);

    const interval = setInterval(() => {
      setMatrixData(prev => prev.map(row => 
        row.map(() => Math.random() > 0.5 ? '1' : '0')
      ));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // 3D holographic visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 400;

    let rotation = 0;
    const particles: Array<{x: number, y: number, z: number, color: string}> = [];
    
    // Create particle sphere
    for (let i = 0; i < 200; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = 100;
      
      particles.push({
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi),
        color: Math.random() > 0.5 ? '#00ffff' : '#c084fc'
      });
    }

    const animate = () => {
      rotation += 0.01;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Sort particles by z-depth
      particles.sort((a, b) => {
        const az = a.x * Math.sin(rotation) + a.z * Math.cos(rotation);
        const bz = b.x * Math.sin(rotation) + b.z * Math.cos(rotation);
        return az - bz;
      });
      
      particles.forEach(particle => {
        // 3D rotation
        const x = particle.x * Math.cos(rotation) - particle.z * Math.sin(rotation);
        const z = particle.x * Math.sin(rotation) + particle.z * Math.cos(rotation);
        
        // Perspective projection
        const scale = 200 / (200 + z);
        const x2d = x * scale + canvas.width / 2;
        const y2d = particle.y * scale + canvas.height / 2;
        const size = 3 * scale;
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(x2d, y2d, size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = scale;
        ctx.fill();
        
        // Add glow
        const gradient = ctx.createRadialGradient(x2d, y2d, 0, x2d, y2d, size * 3);
        gradient.addColorStop(0, particle.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fill();
      });
      
      ctx.globalAlpha = 1;
      requestAnimationFrame(animate);
    };
    
    animate();
  }, []);

  // Progress simulation
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = Math.min(prev + 2, 100);
        
        // Update status message
        const messageIndex = Math.floor((newProgress / 100) * statusMessages.length);
        setStatusText(statusMessages[Math.min(messageIndex, statusMessages.length - 1)]);
        
        // Update system checks
        systemComponents.forEach((component, index) => {
          if (newProgress > (index + 1) * (100 / systemComponents.length)) {
            setSystemChecks(prev => ({ ...prev, [component.id]: true }));
          }
        });
        
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => onComplete(), 1000);
        }
        
        return newProgress;
      });
    }, 100);

    return () => clearInterval(progressInterval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Quantum grid background */}
      <div className="quantum-grid" />
      
      {/* Matrix rain effect */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        {matrixData.map((row, i) => (
          <div key={i} className="flex justify-center">
            {row.map((char, j) => (
              <span
                key={j}
                className="font-mono text-xs"
                style={{
                  color: char === '1' ? '#00ffff' : '#c084fc',
                  textShadow: char === '1' 
                    ? '0 0 10px #00ffff' 
                    : '0 0 10px #c084fc',
                  animation: `pulse-neon ${1 + (i * j) % 3}s infinite`
                }}
              >
                {char}
              </span>
            ))}
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full p-8">
        {/* 3D Holographic sphere */}
        <div className="mb-12">
          <canvas 
            ref={canvasRef}
            className="rounded-full"
            style={{
              filter: 'drop-shadow(0 0 50px rgba(0, 255, 255, 0.5))'
            }}
          />
        </div>

        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-black mb-4 holo-text glitch-text" data-text="QUANTUM SECURITY">
            QUANTUM SECURITY
          </h1>
          <p className="text-lg text-purple-300 uppercase tracking-[0.3em] font-light">
            Matrix Initialization Protocol
          </p>
        </div>

        {/* Progress section */}
        <div className="w-full max-w-2xl mb-8">
          {/* Progress bar */}
          <div className="glass-panel rounded-full p-2 mb-4">
            <div className="relative h-6 bg-black/60 rounded-full overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 transition-all duration-300 rounded-full"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #00ffff 0%, #c084fc 50%, #ff00ff 100%)',
                  boxShadow: '0 0 20px currentColor'
                }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
              
              {/* Scanning line */}
              <div 
                className="absolute inset-y-0 w-1 bg-white/80"
                style={{
                  left: `${progress}%`,
                  boxShadow: '0 0 10px rgba(255, 255, 255, 0.8)',
                  animation: 'pulse-neon 0.5s infinite'
                }}
              />
            </div>
          </div>

          {/* Percentage display */}
          <div className="text-center mb-6">
            <span className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              {progress}%
            </span>
          </div>

          {/* Status text */}
          <div className="glass-panel rounded-xl p-4 text-center mb-6">
            <Terminal className="w-5 h-5 inline-block mr-2 text-cyan-400" />
            <span className="text-purple-300 font-mono text-sm tracking-wider">
              {statusText}
            </span>
          </div>
        </div>

        {/* System components grid */}
        <div className="grid grid-cols-6 gap-4 mb-8">
          {systemComponents.map((component) => {
            const Icon = component.icon;
            const isActive = systemChecks[component.id];
            
            return (
              <div
                key={component.id}
                className={`glass-panel rounded-xl p-4 transition-all duration-500 ${
                  isActive ? 'scale-110' : 'scale-100'
                }`}
                style={{
                  borderColor: isActive ? '#00ff88' : 'rgba(0, 255, 255, 0.2)',
                  boxShadow: isActive 
                    ? '0 0 30px rgba(0, 255, 136, 0.5)'
                    : '0 0 20px rgba(0, 0, 0, 0.5)'
                }}
              >
                <Icon className={`w-8 h-8 mx-auto mb-2 transition-all ${
                  isActive ? 'text-green-400' : 'text-gray-600'
                }`} />
                <div className={`text-xs text-center font-mono ${
                  isActive ? 'text-green-400' : 'text-gray-600'
                }`}>
                  {component.label}
                </div>
                
                {isActive && (
                  <div className="absolute inset-0 rounded-xl border-2 border-green-400 animate-ping" />
                )}
              </div>
            );
          })}
        </div>

        {/* Security level indicator */}
        <div className="flex items-center gap-3 text-xs text-pink-400/60 uppercase tracking-wider">
          <Fingerprint className="w-4 h-4" />
          <span>Clearance Level: OMEGA | Classification: COSMIC</span>
        </div>
      </div>

      {/* Corner HUD elements */}
      <div className="absolute top-4 left-4 glass-panel rounded-lg p-3">
        <div className="text-xs font-mono space-y-1">
          <div className="text-cyan-400/60">SYSTEM TIME: {new Date().toISOString()}</div>
          <div className="text-purple-400/60">QUANTUM STATE: SUPERPOSITION</div>
          <div className="text-pink-400/60">ENCRYPTION: 2048-BIT</div>
        </div>
      </div>

      <div className="absolute top-4 right-4 glass-panel rounded-lg p-3">
        <div className="text-xs font-mono space-y-1 text-right">
          <div className="text-cyan-400/60">FIREWALL: ACTIVE</div>
          <div className="text-purple-400/60">THREATS: MONITORING</div>
          <div className="text-pink-400/60">STATUS: SECURE</div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;