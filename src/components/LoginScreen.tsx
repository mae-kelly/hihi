import React, { useState, useEffect, useRef } from 'react';
import { Shield, Lock, Eye, EyeOff, Fingerprint, Terminal, AlertTriangle, Zap, Brain, Wifi, Activity, Key, User, ChevronRight } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (username: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [biometricScan, setBiometricScan] = useState(0);
  const [error, setError] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 3D parallax background
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
        const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
        setMousePosition({ x: x * 20, y: y * 20 });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Neural network visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    interface Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      connections: number[];
      activated: boolean;
    }

    const nodes: Node[] = [];
    const nodeCount = 50;

    // Create nodes
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        connections: [],
        activated: false
      });
    }

    // Create connections
    nodes.forEach((node, i) => {
      const connectionCount = 2 + Math.floor(Math.random() * 3);
      for (let j = 0; j < connectionCount; j++) {
        const target = Math.floor(Math.random() * nodeCount);
        if (target !== i) {
          node.connections.push(target);
        }
      }
    });

    let pulseTime = 0;
    const animate = () => {
      pulseTime += 0.02;
      
      // Clear with trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw nodes
      nodes.forEach((node, i) => {
        // Update position
        node.x += node.vx;
        node.y += node.vy;

        // Bounce off edges
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        // Random activation
        if (Math.random() < 0.001) {
          node.activated = true;
          setTimeout(() => { node.activated = false; }, 1000);
        }

        // Draw connections
        node.connections.forEach(targetIndex => {
          const target = nodes[targetIndex];
          if (target) {
            const gradient = ctx.createLinearGradient(node.x, node.y, target.x, target.y);
            
            if (node.activated || target.activated) {
              gradient.addColorStop(0, 'rgba(0, 255, 255, 0.6)');
              gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.8)');
              gradient.addColorStop(1, 'rgba(255, 0, 255, 0.6)');
              ctx.lineWidth = 2;
            } else {
              gradient.addColorStop(0, 'rgba(0, 255, 255, 0.1)');
              gradient.addColorStop(1, 'rgba(168, 85, 247, 0.1)');
              ctx.lineWidth = 1;
            }
            
            ctx.strokeStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(target.x, target.y);
            ctx.stroke();
          }
        });

        // Draw node
        const size = node.activated ? 8 : 4;
        const glowSize = node.activated ? 20 : 10;
        
        // Glow effect
        const glowGradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowSize);
        if (node.activated) {
          glowGradient.addColorStop(0, 'rgba(0, 255, 255, 0.8)');
          glowGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
        } else {
          glowGradient.addColorStop(0, 'rgba(168, 85, 247, 0.4)');
          glowGradient.addColorStop(1, 'rgba(168, 85, 247, 0)');
        }
        
        ctx.fillStyle = glowGradient;
        ctx.fillRect(node.x - glowSize, node.y - glowSize, glowSize * 2, glowSize * 2);
        
        // Core
        ctx.fillStyle = node.activated ? '#00ffff' : '#a855f7';
        ctx.beginPath();
        ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsAuthenticating(true);

    // Simulate biometric scanning
    let scan = 0;
    const scanInterval = setInterval(() => {
      scan += 10;
      setBiometricScan(scan);
      
      if (scan >= 100) {
        clearInterval(scanInterval);
        
        // Validate credentials
        if (username && password) {
          setTimeout(() => {
            onLogin(username);
          }, 500);
        } else {
          setError('AUTHENTICATION FAILED - INVALID CREDENTIALS');
          setIsAuthenticating(false);
          setBiometricScan(0);
        }
      }
    }, 100);
  };

  return (
    <div ref={containerRef} className="fixed inset-0 bg-black overflow-hidden">
      {/* Neural network background */}
      <canvas ref={canvasRef} className="absolute inset-0 opacity-40" />

      {/* Animated gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20"
             style={{
               transform: `perspective(1000px) rotateX(${mousePosition.y}deg) rotateY(${mousePosition.x}deg)`,
               transformStyle: 'preserve-3d'
             }} />
      </div>

      {/* Hexagon grid pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" style={{ position: 'absolute' }}>
          <defs>
            <pattern id="hexagon" width="60" height="70" patternUnits="userSpaceOnUse">
              <polygon points="30,0 60,17.5 60,52.5 30,70 0,52.5 0,17.5" 
                       fill="none" 
                       stroke="rgba(0, 255, 255, 0.3)" 
                       strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hexagon)" />
        </svg>
      </div>

      {/* Main login container */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Holographic card effect */}
          <div className="relative">
            {/* Glow effects */}
            <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-3xl opacity-30 blur-2xl animate-pulse" />
            
            {/* Main card */}
            <div className="relative backdrop-blur-2xl bg-black/40 rounded-3xl border border-cyan-400/30 overflow-hidden"
                 style={{
                   boxShadow: `
                     0 0 50px rgba(0, 255, 255, 0.2),
                     inset 0 0 50px rgba(0, 0, 0, 0.5),
                     0 20px 60px rgba(0, 0, 0, 0.5)
                   `,
                   transform: `perspective(1000px) rotateX(${-mousePosition.y * 0.1}deg) rotateY(${mousePosition.x * 0.1}deg)`,
                   transformStyle: 'preserve-3d'
                 }}>
              
              {/* Scanning line animation */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80"
                     style={{
                       top: '0%',
                       animation: 'scan-vertical 3s linear infinite',
                       boxShadow: '0 0 20px rgba(0, 255, 255, 0.8)'
                     }} />
              </div>

              {/* Header section */}
              <div className="p-8 text-center relative">
                {/* Animated logo */}
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 animate-spin-slow">
                    <div className="absolute inset-0 rounded-full border-2 border-cyan-400/30" />
                    <div className="absolute inset-2 rounded-full border-2 border-purple-400/30" />
                    <div className="absolute inset-4 rounded-full border-2 border-pink-400/30" />
                  </div>
                  
                  <div className="relative bg-black/60 p-6 rounded-2xl border border-cyan-400/50">
                    <Brain className="w-16 h-16 text-cyan-400" style={{
                      filter: 'drop-shadow(0 0 20px rgba(0, 255, 255, 0.8))'
                    }} />
                  </div>
                </div>

                <h1 className="text-3xl font-bold mb-2" style={{
                  fontFamily: 'Orbitron, monospace',
                  textShadow: '0 0 30px rgba(0, 255, 255, 0.8)'
                }}>
                  <span style={{
                    background: 'linear-gradient(135deg, #00ffff, #00d4ff, #a855f7)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    NEURAL AUTH
                  </span>
                </h1>
                
                <p className="text-cyan-400/60 text-sm font-mono">
                  QUANTUM BIOMETRIC VERIFICATION
                </p>
              </div>

              {/* Form section */}
              <form onSubmit={handleLogin} className="p-8 pt-0 space-y-6">
                {/* Username field */}
                <div className="relative">
                  <label className="block text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
                    AGENT IDENTIFIER
                  </label>
                  <div className="relative group">
                    <div className={`absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg opacity-0 group-hover:opacity-30 blur transition-opacity ${
                      focusedField === 'username' ? 'opacity-30' : ''
                    }`} />
                    
                    <div className="relative flex items-center">
                      <User className="absolute left-3 w-5 h-5 text-cyan-400/60" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onFocus={() => setFocusedField('username')}
                        onBlur={() => setFocusedField(null)}
                        className="w-full bg-black/50 border border-cyan-500/30 rounded-lg pl-12 pr-4 py-3 text-cyan-300 placeholder-cyan-800/50 focus:outline-none focus:border-cyan-400 transition-all"
                        placeholder="Enter Agent ID"
                        disabled={isAuthenticating}
                        style={{
                          fontFamily: 'Fira Code, monospace',
                          boxShadow: focusedField === 'username' 
                            ? 'inset 0 0 20px rgba(0, 255, 255, 0.1)' 
                            : 'inset 0 0 20px rgba(0, 0, 0, 0.5)'
                        }}
                      />
                      {username && (
                        <div className="absolute right-3">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Password field */}
                <div className="relative">
                  <label className="block text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
                    ENCRYPTION KEY
                  </label>
                  <div className="relative group">
                    <div className={`absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg opacity-0 group-hover:opacity-30 blur transition-opacity ${
                      focusedField === 'password' ? 'opacity-30' : ''
                    }`} />
                    
                    <div className="relative flex items-center">
                      <Key className="absolute left-3 w-5 h-5 text-cyan-400/60" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        className="w-full bg-black/50 border border-cyan-500/30 rounded-lg pl-12 pr-12 py-3 text-cyan-300 placeholder-cyan-800/50 focus:outline-none focus:border-cyan-400 transition-all"
                        placeholder="Enter Security Key"
                        disabled={isAuthenticating}
                        style={{
                          fontFamily: 'Fira Code, monospace',
                          boxShadow: focusedField === 'password' 
                            ? 'inset 0 0 20px rgba(168, 85, 247, 0.1)' 
                            : 'inset 0 0 20px rgba(0, 0, 0, 0.5)'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-cyan-500/50 hover:text-cyan-400 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Biometric scanner */}
                {isAuthenticating && (
                  <div className="space-y-3">
                    <div className="backdrop-blur-xl bg-gradient-to-r from-green-500/10 to-cyan-500/10 rounded-lg p-4 border border-green-400/30">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-green-400 text-xs font-bold uppercase tracking-wider">
                          BIOMETRIC SCAN
                        </span>
                        <Fingerprint className="w-5 h-5 text-green-400 animate-pulse" />
                      </div>
                      
                      <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-400 via-cyan-400 to-blue-400 transition-all duration-300"
                          style={{ 
                            width: `${biometricScan}%`,
                            boxShadow: '0 0 10px currentColor'
                          }}
                        />
                      </div>
                      
                      <div className="mt-2 flex justify-between text-xs font-mono">
                        <span className="text-green-400/60">ANALYZING PATTERN</span>
                        <span className="text-green-400">{biometricScan}%</span>
                      </div>
                    </div>

                    {/* Security checks */}
                    <div className="grid grid-cols-3 gap-2">
                      {['RETINA', 'VOICE', 'DNA'].map((check, index) => (
                        <div key={check} className={`
                          text-center p-2 rounded border text-xs font-mono transition-all
                          ${biometricScan > (index + 1) * 33
                            ? 'bg-green-400/10 border-green-400/30 text-green-400'
                            : 'bg-black/30 border-cyan-400/20 text-cyan-400/40'
                          }
                        `}>
                          {check}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error message */}
                {error && (
                  <div className="backdrop-blur-xl bg-red-400/10 rounded-lg p-3 border border-red-400/30">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
                      <span className="text-red-400 text-sm font-mono">{error}</span>
                    </div>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="w-full relative group overflow-hidden rounded-lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 opacity-80 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative backdrop-blur-xl bg-black/30 px-6 py-4 border border-cyan-400/50 group-hover:border-cyan-400 transition-all">
                    <div className="flex items-center justify-center gap-3">
                      {isAuthenticating ? (
                        <>
                          <Activity className="w-5 h-5 animate-spin" />
                          <span className="font-bold uppercase tracking-wider" style={{
                            fontFamily: 'Orbitron, monospace'
                          }}>
                            AUTHENTICATING...
                          </span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-5 h-5" />
                          <span className="font-bold uppercase tracking-wider" style={{
                            fontFamily: 'Orbitron, monospace'
                          }}>
                            INITIATE NEURAL LINK
                          </span>
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </div>
                  </div>
                </button>
              </form>

              {/* Footer */}
              <div className="p-6 pt-0">
                <div className="flex items-center justify-center gap-6 text-xs font-mono">
                  <div className="flex items-center gap-2 text-cyan-400/60">
                    <Wifi className="w-3 h-3" />
                    <span>QUANTUM ENCRYPTED</span>
                  </div>
                  <div className="flex items-center gap-2 text-purple-400/60">
                    <Shield className="w-3 h-3" />
                    <span>AES-512</span>
                  </div>
                  <div className="flex items-center gap-2 text-pink-400/60">
                    <Zap className="w-3 h-3" />
                    <span>2FA ENABLED</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Demo mode indicator */}
          <div className="mt-6 backdrop-blur-xl bg-green-400/5 rounded-lg p-3 border border-green-400/30">
            <p className="text-green-400/70 text-xs font-mono text-center">
              DEMO MODE: Use any credentials to access system
            </p>
          </div>
        </div>
      </div>

      {/* HUD elements */}
      <div className="absolute top-4 left-4 text-xs font-mono text-cyan-400/30">
        <div>SYSTEM: ONLINE</div>
        <div>FIREWALL: ACTIVE</div>
        <div>THREATS: 0</div>
      </div>

      <div className="absolute top-4 right-4 text-xs font-mono text-cyan-400/30 text-right">
        <div>{new Date().toLocaleTimeString()}</div>
        <div>LAT: CLASSIFIED</div>
        <div>LON: CLASSIFIED</div>
      </div>

      <style jsx>{`
        @keyframes scan-vertical {
          0% { top: 0%; }
          100% { top: 100%; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default LoginScreen;