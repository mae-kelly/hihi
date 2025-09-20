import React, { useEffect, useState, useRef } from 'react';
import { Shield, Lock, Terminal, Cpu, Zap, Database, Server, Globe, Activity, Fingerprint } from 'lucide-react';

interface LoadingScreenProps {
  onComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('INITIALIZING QUANTUM MATRIX...');
  const [systemChecks, setSystemChecks] = useState<Record<string, boolean>>({});
  const [dnaSequence, setDnaSequence] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContext = useRef<AudioContext | null>(null);

  const statusMessages = [
    'QUANTUM ENCRYPTION PROTOCOL ENGAGED...',
    'NEURAL NETWORK SYNCHRONIZATION...',
    'BIOMETRIC AUTHENTICATION VERIFIED...',
    'SATELLITE UPLINK ESTABLISHED...',
    'FIREWALL MATRIX CALIBRATED...',
    'AI THREAT DETECTION ONLINE...',
    'BLOCKCHAIN VERIFICATION COMPLETE...',
    'HOLOGRAPHIC INTERFACE READY...',
    'QUANTUM ENTANGLEMENT STABLE...',
    'SYSTEM INITIALIZATION COMPLETE'
  ];

  const systemComponents = [
    { id: 'quantum', label: 'QUANTUM CORE', icon: Cpu },
    { id: 'neural', label: 'NEURAL NET', icon: Activity },
    { id: 'security', label: 'SECURITY', icon: Shield },
    { id: 'database', label: 'DATABASE', icon: Database },
    { id: 'network', label: 'NETWORK', icon: Globe },
    { id: 'encryption', label: 'ENCRYPTION', icon: Lock }
  ];

  // Generate DNA-like sequence
  useEffect(() => {
    const sequence = Array(50).fill(null).map(() => 
      Math.random() > 0.5 ? '1' : '0'
    ).join('');
    setDnaSequence(sequence);
  }, []);

  // 3D Matrix rain effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const columns = Math.floor(canvas.width / 20);
    const drops: number[] = Array(columns).fill(1);
    const matrix = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'.split('');

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = '15px monospace';
      
      for (let i = 0; i < drops.length; i++) {
        const text = matrix[Math.floor(Math.random() * matrix.length)];
        const x = i * 20;
        const y = drops[i] * 20;

        // Create gradient effect
        const gradient = ctx.createLinearGradient(0, y - 100, 0, y);
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0)');
        gradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 255, 255, 1)');
        
        ctx.fillStyle = gradient;
        ctx.fillText(text, x, y);

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 33);
    return () => clearInterval(interval);
  }, []);

  // Progress simulation with system checks
  useEffect(() => {
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      currentProgress += Math.random() * 10;
      
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(progressInterval);
        setTimeout(() => onComplete(), 1000);
      }
      
      setProgress(currentProgress);
      
      // Update status message
      const messageIndex = Math.floor((currentProgress / 100) * statusMessages.length);
      setStatusText(statusMessages[Math.min(messageIndex, statusMessages.length - 1)]);
      
      // Update system checks
      systemComponents.forEach((component, index) => {
        if (currentProgress > (index + 1) * (100 / systemComponents.length)) {
          setSystemChecks(prev => ({ ...prev, [component.id]: true }));
        }
      });
    }, 200);

    return () => clearInterval(progressInterval);
  }, [onComplete]);

  // Create sound effect (optional - for full immersion)
  const playSound = (frequency: number, duration: number) => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const oscillator = audioContext.current.createOscillator();
    const gainNode = audioContext.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.current.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + duration);
    
    oscillator.start(audioContext.current.currentTime);
    oscillator.stop(audioContext.current.currentTime + duration);
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Matrix rain background */}
      <canvas ref={canvasRef} className="absolute inset-0 opacity-30" />

      {/* Animated grid */}
      <div className="absolute inset-0" style={{
        backgroundImage: `
          linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px),
          linear-gradient(rgba(168, 85, 247, 0.03) 2px, transparent 2px),
          linear-gradient(90deg, rgba(168, 85, 247, 0.03) 2px, transparent 2px)
        `,
        backgroundSize: '50px 50px, 50px 50px, 100px 100px, 100px 100px',
        animation: 'grid-move 10s linear infinite'
      }} />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full p-8">
        {/* Holographic logo */}
        <div className="relative mb-12">
          {/* Rotating rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute w-48 h-48 border-2 border-cyan-400/30 rounded-full animate-spin-slow" />
            <div className="absolute w-40 h-40 border-2 border-purple-400/30 rounded-full animate-spin-slow-reverse" />
            <div className="absolute w-32 h-32 border-2 border-pink-400/30 rounded-full animate-spin-slow" />
          </div>

          {/* Central shield */}
          <div className="relative backdrop-blur-xl bg-black/60 p-8 rounded-full border-2 border-cyan-400/50"
               style={{
                 boxShadow: `
                   0 0 50px rgba(0, 255, 255, 0.5),
                   inset 0 0 50px rgba(0, 0, 0, 0.5),
                   0 0 100px rgba(168, 85, 247, 0.3)
                 `
               }}>
            <Shield className="w-16 h-16 text-cyan-400" style={{
              filter: 'drop-shadow(0 0 20px rgba(0, 255, 255, 0.8))'
            }} />
            
            {/* Pulse effect */}
            <div className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping" />
          </div>
        </div>

        {/* Title with glitch effect */}
        <div className="relative mb-8">
          <h1 className="text-6xl font-black tracking-wider" style={{
            fontFamily: 'Orbitron, monospace',
            textShadow: '0 0 40px rgba(0, 255, 255, 0.8)',
            animation: 'glow-pulse 2s ease-in-out infinite'
          }}>
            <span className="inline-block" style={{
              background: 'linear-gradient(45deg, #00ffff, #00d4ff, #a855f7, #ff00ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundSize: '200% 200%',
              animation: 'gradient-shift 3s ease infinite'
            }}>
              CYBERVISION
            </span>
            <span className="inline-block ml-3 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
              5000
            </span>
          </h1>
          
          <p className="text-center text-cyan-400/60 text-sm font-mono mt-2 tracking-widest">
            QUANTUM SECURITY MATRIX INITIALIZATION
          </p>
        </div>

        {/* DNA Sequence display */}
        <div className="w-full max-w-2xl mb-8">
          <div className="backdrop-blur-xl bg-black/40 rounded-lg p-3 border border-cyan-400/30">
            <div className="font-mono text-xs text-cyan-400/60 mb-2">BIOMETRIC SIGNATURE</div>
            <div className="font-mono text-xs text-cyan-400 break-all" style={{
              textShadow: '0 0 10px currentColor',
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              {dnaSequence}
            </div>
          </div>
        </div>

        {/* Progress bar with segments */}
        <div className="w-full max-w-2xl mb-8">
          <div className="backdrop-blur-xl bg-black/40 rounded-full p-2 border border-cyan-400/30"
               style={{ boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.8)' }}>
            <div className="relative h-6 bg-black/60 rounded-full overflow-hidden">
              {/* Animated background */}
              <div className="absolute inset-0 opacity-30">
                <div className="h-full bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400"
                     style={{
                       backgroundSize: '200% 100%',
                       animation: 'gradient-move 2s linear infinite'
                     }} />
              </div>
              
              {/* Progress fill */}
              <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400"
                   style={{
                     width: `${progress}%`,
                     boxShadow: '0 0 20px currentColor',
                     transition: 'width 0.3s ease'
                   }}>
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
                
                {/* Scanning line */}
                <div className="absolute inset-y-0 right-0 w-1 bg-white/80"
                     style={{
                       boxShadow: '0 0 10px rgba(255, 255, 255, 0.8)',
                       animation: 'blink 0.5s ease-in-out infinite'
                     }} />
              </div>
              
              {/* Percentage text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-mono font-bold text-cyan-400">
                  {Math.floor(progress)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* System status grid */}
        <div className="grid grid-cols-6 gap-4 mb-8">
          {systemComponents.map((component) => {
            const Icon = component.icon;
            const isActive = systemChecks[component.id];
            
            return (
              <div key={component.id} className="relative">
                <div className={`
                  backdrop-blur-xl rounded-lg p-4 border transition-all duration-500
                  ${isActive 
                    ? 'bg-green-400/10 border-green-400/50 scale-110' 
                    : 'bg-black/40 border-cyan-400/20 scale-100'
                  }
                `} style={{
                  boxShadow: isActive 
                    ? '0 0 30px rgba(0, 255, 136, 0.5)'
                    : '0 0 20px rgba(0, 0, 0, 0.5)'
                }}>
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${
                    isActive ? 'text-green-400' : 'text-cyan-400/40'
                  }`} />
                  <div className={`text-xs font-mono text-center ${
                    isActive ? 'text-green-400' : 'text-cyan-400/40'
                  }`}>
                    {component.label}
                  </div>
                  
                  {isActive && (
                    <div className="absolute -inset-1 border-2 border-green-400 rounded-lg animate-ping" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Status text */}
        <div className="backdrop-blur-xl bg-black/40 rounded-lg px-6 py-3 border border-purple-400/30 mb-8"
             style={{ boxShadow: '0 0 30px rgba(168, 85, 247, 0.3)' }}>
          <div className="flex items-center gap-3">
            <Terminal className="w-4 h-4 text-purple-400 animate-pulse" />
            <p className="text-purple-400 font-mono text-sm tracking-wider">
              {statusText}
            </p>
          </div>
        </div>

        {/* Security level indicator */}
        <div className="flex items-center gap-2 text-xs font-mono text-red-400/60">
          <Fingerprint className="w-4 h-4 animate-pulse" />
          <span className="tracking-widest">CLEARANCE LEVEL: OMEGA | CLASSIFICATION: TOP SECRET</span>
        </div>
      </div>

      {/* Corner HUD elements */}
      <div className="absolute top-4 left-4">
        <div className="text-xs font-mono text-cyan-400/40">
          <div>SYSTEM TIME: {new Date().toISOString()}</div>
          <div>LOCATION: CLASSIFIED</div>
          <div>PROTOCOL: QSM-512</div>
        </div>
      </div>

      <div className="absolute top-4 right-4">
        <div className="text-xs font-mono text-cyan-400/40 text-right">
          <div>ENCRYPTION: AES-512</div>
          <div>FIREWALL: ACTIVE</div>
          <div>THREAT LEVEL: MODERATE</div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-slow-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes gradient-move {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .animate-spin-slow-reverse {
          animation: spin-slow-reverse 15s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;