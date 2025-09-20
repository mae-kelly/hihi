import React, { useState, useEffect, useRef } from 'react';
import { Shield, Lock, Eye, EyeOff, Fingerprint, Terminal, AlertTriangle, Zap, Brain, Wifi, Activity, Key, User, ChevronRight, Hexagon, Triangle, Circle, Pentagon } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (username: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [bioMetrics, setBioMetrics] = useState({ iris: false, fingerprint: false, voice: false });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Array<{x: number, y: number, size: number}>>([]);

  // Track mouse for parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Initialize floating particles
  useEffect(() => {
    const newParticles = [];
    for (let i = 0; i < 30; i++) {
      newParticles.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1
      });
    }
    setParticles(newParticles);
  }, []);

  // Holographic background animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let time = 0;
    const animate = () => {
      time += 0.005;
      
      // Clear with fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw grid lines
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      
      for (let i = 0; i < canvas.width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i + Math.sin(time) * 10, 0);
        ctx.lineTo(i + Math.sin(time + Math.PI) * 10, canvas.height);
        ctx.stroke();
      }
      
      for (let i = 0; i < canvas.height; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i + Math.cos(time) * 10);
        ctx.lineTo(canvas.width, i + Math.cos(time + Math.PI) * 10);
        ctx.stroke();
      }
      
      // Draw neural connections
      const nodes = 20;
      for (let i = 0; i < nodes; i++) {
        const x = (canvas.width / 2) + Math.cos(time + i * Math.PI / nodes) * 200;
        const y = (canvas.height / 2) + Math.sin(time + i * Math.PI / nodes) * 200;
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? 'rgba(0, 255, 255, 0.5)' : 'rgba(192, 132, 252, 0.5)';
        ctx.fill();
        
        // Connect to center
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, canvas.height / 2);
        ctx.lineTo(x, y);
        ctx.strokeStyle = i % 2 === 0 ? 'rgba(0, 255, 255, 0.1)' : 'rgba(192, 132, 252, 0.1)';
        ctx.stroke();
      }
      
      requestAnimationFrame(animate);
    };
    animate();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setIsScanning(true);
    
    // Simulate biometric scanning
    const scanInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(scanInterval);
          setTimeout(() => onLogin(username), 500);
          return 100;
        }
        
        // Update biometrics
        if (prev > 30 && !bioMetrics.fingerprint) {
          setBioMetrics(prev => ({ ...prev, fingerprint: true }));
        }
        if (prev > 60 && !bioMetrics.iris) {
          setBioMetrics(prev => ({ ...prev, iris: true }));
        }
        if (prev > 90 && !bioMetrics.voice) {
          setBioMetrics(prev => ({ ...prev, voice: true }));
        }
        
        return prev + 5;
      });
    }, 100);
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Animated background canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 opacity-50" />
      
      {/* Floating particles */}
      {particles.map((particle, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            background: i % 2 === 0 ? '#00ffff' : '#c084fc',
            boxShadow: i % 2 === 0 
              ? `0 0 ${particle.size * 5}px #00ffff`
              : `0 0 ${particle.size * 5}px #c084fc`,
            animation: `float-holo ${10 + i * 0.5}s ease-in-out infinite`
          }}
        />
      ))}
      
      {/* Quantum grid overlay */}
      <div className="quantum-grid opacity-30" />
      
      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
        <div 
          className="w-full max-w-md"
          style={{
            transform: `perspective(1000px) rotateX(${mousePosition.y * 0.05}deg) rotateY(${mousePosition.x * 0.05}deg)`
          }}
        >
          {/* Login card */}
          <div className="glass-panel rounded-3xl p-8 cyber-noise">
            {/* Logo section */}
            <div className="text-center mb-8">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 animate-pulse">
                  <Hexagon className="w-24 h-24 text-cyan-400/20" />
                </div>
                <div className="relative">
                  <Shield className="w-24 h-24 text-cyan-400" style={{
                    filter: 'drop-shadow(0 0 30px rgba(0, 255, 255, 0.8))'
                  }} />
                </div>
              </div>
              
              <h1 className="text-4xl font-bold mb-2 holo-text">
                QUANTUM AUTH
              </h1>
              <p className="text-sm text-gray-400 uppercase tracking-widest">
                Biometric Security Portal
              </p>
            </div>

            {!isScanning ? (
              <form onSubmit={handleLogin} className="space-y-6">
                {/* Username field */}
                <div className="space-y-2">
                  <label className="text-xs text-cyan-300 uppercase tracking-wider">
                    Agent Identifier
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400/50" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-xl"
                      placeholder="Enter clearance code"
                      style={{
                        background: 'rgba(0, 0, 0, 0.5)',
                        border: '1px solid rgba(0, 255, 255, 0.2)'
                      }}
                    />
                  </div>
                </div>

                {/* Password field */}
                <div className="space-y-2">
                  <label className="text-xs text-purple-300 uppercase tracking-wider">
                    Quantum Key
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400/50" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3 rounded-xl"
                      placeholder="Enter quantum key"
                      style={{
                        background: 'rgba(0, 0, 0, 0.5)',
                        border: '1px solid rgba(192, 132, 252, 0.2)'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400/50 hover:text-purple-400"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <button 
                  type="submit"
                  className="w-full neon-btn py-4 rounded-xl font-semibold uppercase tracking-wider transition-all"
                >
                  <div className="flex items-center justify-center gap-3">
                    <Lock className="w-5 h-5" />
                    <span>Initialize Quantum Link</span>
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </button>
              </form>
            ) : (
              <div className="space-y-6">
                {/* Scanning animation */}
                <div className="text-center mb-6">
                  <div className="relative inline-block">
                    <Fingerprint className="w-24 h-24 text-cyan-400 animate-pulse" />
                    <div className="absolute inset-0 w-24 h-24 border-2 border-cyan-400 rounded-full animate-ping" />
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-cyan-300">BIOMETRIC SCAN</span>
                    <span className="text-cyan-400">{scanProgress}%</span>
                  </div>
                  <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-300 rounded-full"
                      style={{
                        width: `${scanProgress}%`,
                        background: 'linear-gradient(90deg, #00ffff, #c084fc, #ff00ff)'
                      }}
                    />
                  </div>
                </div>

                {/* Biometric indicators */}
                <div className="grid grid-cols-3 gap-4">
                  <div className={`glass-panel p-3 rounded-lg text-center transition-all ${
                    bioMetrics.fingerprint ? 'border-green-400/50' : 'border-gray-600/50'
                  }`}>
                    <Fingerprint className={`w-6 h-6 mx-auto mb-1 ${
                      bioMetrics.fingerprint ? 'text-green-400' : 'text-gray-500'
                    }`} />
                    <span className="text-xs">FINGERPRINT</span>
                  </div>
                  
                  <div className={`glass-panel p-3 rounded-lg text-center transition-all ${
                    bioMetrics.iris ? 'border-green-400/50' : 'border-gray-600/50'
                  }`}>
                    <Eye className={`w-6 h-6 mx-auto mb-1 ${
                      bioMetrics.iris ? 'text-green-400' : 'text-gray-500'
                    }`} />
                    <span className="text-xs">IRIS</span>
                  </div>
                  
                  <div className={`glass-panel p-3 rounded-lg text-center transition-all ${
                    bioMetrics.voice ? 'border-green-400/50' : 'border-gray-600/50'
                  }`}>
                    <Activity className={`w-6 h-6 mx-auto mb-1 ${
                      bioMetrics.voice ? 'text-green-400' : 'text-gray-500'
                    }`} />
                    <span className="text-xs">VOICE</span>
                  </div>
                </div>

                {/* Status text */}
                <div className="text-center text-sm text-purple-300 animate-pulse">
                  Establishing quantum encryption tunnel...
                </div>
              </div>
            )}

            {/* Security badges */}
            <div className="mt-8 pt-6 border-t border-gray-800">
              <div className="flex justify-center gap-6 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>AES-512</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span>QUANTUM</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4" />
                  <span>SECURE</span>
                </div>
              </div>
            </div>
          </div>

          {/* Demo mode indicator */}
          <div className="mt-6 glass-panel rounded-2xl p-4 text-center">
            <p className="text-xs text-cyan-400/70 uppercase tracking-wider">
              Demo Mode: Use any credentials to access
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;