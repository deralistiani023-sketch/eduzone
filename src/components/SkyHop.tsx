import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Heart, 
  Star,
  RotateCcw
} from 'lucide-react';

interface Platform {
  id: number;
  x: number;
  y: number;
  width: number;
  ratio: string;
  isCorrect: boolean;
  hasCoin: boolean;
}

interface SkyHopProps {
  onFinish: (score: number) => void;
  onBack: () => void;
  onQuizCorrect: () => void;
  onDeductPoints: (amount: number) => void;
  currentPoints: number;
}

const GRAVITY = 0.4;
const JUMP_DURATION = 30; // frames for a jump
const MOUSE_SIZE = 30; // Slightly smaller for better visibility

export default function SkyHop({ onFinish, onBack, onQuizCorrect, onDeductPoints, currentPoints }: SkyHopProps) {
  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [targetRatio, setTargetRatio] = useState("1:2");
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizQuestion, setQuizQuestion] = useState<{ text: string; answer: string; options: string[]; hint: string } | null>(null);
  const [quizError, setQuizError] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 400, height: 600 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePos = useRef({ x: 200, y: 500, vx: 0, vy: 0, targetX: 200, targetY: 500, jumping: false, jumpProgress: 0, startX: 200, startY: 500 });
  const platforms = useRef<Platform[]>([]);
  const currentPlatformIndex = useRef(0);
  const platformGenState = useRef({
    currentDirection: 'right' as 'left' | 'right',
    stepsRemaining: 3,
    lastX: 200 - 50,
  });
  const clouds = useRef<{ x: number, y: number, speed: number, size: number }[]>([]);
  const stars = useRef<{ x: number, y: number, size: number, opacity: number }[]>([]);
  const frameId = useRef<number>(0);
  const lastTime = useRef<number>(0);

  // Handle Resize
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const generateRatios = useCallback(() => {
    const baseA = Math.floor(Math.random() * 3) + 1;
    const baseB = Math.floor(Math.random() * 3) + 4;
    const target = `${baseA}:${baseB}`;
    setTargetRatio(target);
    return target;
  }, []);

  const createPlatform = useCallback((y: number) => {
    const state = platformGenState.current;
    const stepX = 80;
    
    if (state.stepsRemaining <= 0) {
      state.currentDirection = state.currentDirection === 'right' ? 'left' : 'right';
      state.stepsRemaining = Math.floor(Math.random() * 3) + 3; // 3-5 steps
    }
    
    let nextX = state.lastX + (state.currentDirection === 'right' ? stepX : -stepX);
    
    // Keep within bounds
    if (nextX < 20) {
      nextX = 20;
      state.currentDirection = 'right';
      state.stepsRemaining = Math.floor(Math.random() * 3) + 3;
    } else if (nextX > dimensions.width - 120) {
      nextX = dimensions.width - 120;
      state.currentDirection = 'left';
      state.stepsRemaining = Math.floor(Math.random() * 3) + 3;
    }
    
    state.lastX = nextX;
    state.stepsRemaining--;
    
    return {
      id: Math.random(),
      x: nextX,
      y,
      width: 100,
      ratio: "",
      isCorrect: true,
      hasCoin: Math.random() > 0.7
    };
  }, [dimensions.width]);

  const initGame = useCallback(() => {
    generateRatios();
    const initialPlatforms: Platform[] = [];
    
    // Reset generation state
    platformGenState.current = {
      currentDirection: 'right',
      stepsRemaining: 3,
      lastX: dimensions.width / 2 - 50,
    };

    // Initialize clouds/stars
    clouds.current = Array.from({ length: 8 }, () => ({
      x: Math.random() * dimensions.width,
      y: Math.random() * dimensions.height,
      speed: 0.2 + Math.random() * 0.5,
      size: 30 + Math.random() * 40
    }));
    stars.current = Array.from({ length: 50 }, () => ({
      x: Math.random() * dimensions.width,
      y: Math.random() * dimensions.height,
      size: Math.random() * 2,
      opacity: Math.random()
    }));

    // Ground platform
    const groundY = dimensions.height - 100;
    const groundP = {
      id: 0,
      x: dimensions.width / 2 - 50,
      y: groundY,
      width: 100,
      ratio: "",
      isCorrect: true,
      hasCoin: false
    };
    initialPlatforms.push(groundP);

    // Initial character position
    mousePos.current = { 
      x: groundP.x + groundP.width / 2 - MOUSE_SIZE / 2, 
      y: groundP.y - MOUSE_SIZE, 
      vx: 0, 
      vy: 0,
      targetX: groundP.x + groundP.width / 2 - MOUSE_SIZE / 2,
      targetY: groundP.y - MOUSE_SIZE,
      jumping: false,
      jumpProgress: 0,
      startX: groundP.x + groundP.width / 2 - MOUSE_SIZE / 2,
      startY: groundP.y - MOUSE_SIZE
    };

    currentPlatformIndex.current = 0;

    // Starting platforms in a neat staircase
    for (let i = 1; i < 15; i++) {
      initialPlatforms.push(createPlatform(groundY - (i * 100)));
    }
    platforms.current = initialPlatforms;
    setScore(0);
    setHearts(3);
    setGameOver(false);
  }, [createPlatform, generateRatios, dimensions]);

  useEffect(() => {
    initGame();
    return () => cancelAnimationFrame(frameId.current);
  }, [initGame]);

  const update = useCallback((time: number) => {
    if (showQuiz || gameOver || showExitConfirm) return;

    const mouse = mousePos.current;
    
    if (mouse.jumping) {
      mouse.jumpProgress += 1;
      const t = mouse.jumpProgress / JUMP_DURATION;
      
      // Linear interpolation for X and Y
      mouse.x = mouse.startX + (mouse.targetX - mouse.startX) * t;
      
      // Parabolic arc for Y
      const jumpHeight = 60;
      const arcY = -4 * jumpHeight * t * (t - 1);
      mouse.y = mouse.startY + (mouse.targetY - mouse.startY) * t - arcY;

      if (mouse.jumpProgress >= JUMP_DURATION) {
        mouse.jumping = false;
        mouse.x = mouse.targetX;
        mouse.y = mouse.targetY;
        mouse.vy = 0;
        
        // Check if we landed on the expected platform
        const platform = platforms.current[currentPlatformIndex.current];
        const landed = platform && 
                       mouse.x + MOUSE_SIZE > platform.x && 
                       mouse.x < platform.x + platform.width;
        
        if (landed) {
          // Snap to center
          mouse.x = platform.x + platform.width / 2 - MOUSE_SIZE / 2;
          if (platform.hasCoin) {
            platform.hasCoin = false;
            setScore(s => s + 50);
          }
        }
      }
    } else {
      // Gravity when not jumping
      mouse.vy += GRAVITY;
      mouse.y += mouse.vy;

      // Platform collision
      platforms.current.forEach(p => {
        if (
          mouse.vy > 0 &&
          mouse.y + MOUSE_SIZE >= p.y &&
          mouse.y + MOUSE_SIZE <= p.y + 15 &&
          mouse.x + MOUSE_SIZE > p.x &&
          mouse.x < p.x + p.width
        ) {
          mouse.vy = 0;
          mouse.y = p.y - MOUSE_SIZE;
          // Snap to center
          mouse.x = p.x + p.width / 2 - MOUSE_SIZE / 2;
        }
      });
    }

    // Update clouds/stars
    clouds.current.forEach(c => {
      c.x += c.speed;
      if (c.x > dimensions.width + 100) c.x = -100;
    });
    stars.current.forEach(s => {
      s.opacity = 0.3 + Math.abs(Math.sin(time / 500 + s.x)) * 0.7;
    });

    // Scroll world smoothly when character is high
    const scrollThreshold = dimensions.height * 0.6;
    if (mouse.y < scrollThreshold) {
      const diff = scrollThreshold - mouse.y;
      mouse.y = scrollThreshold;
      mouse.startY += diff;
      mouse.targetY += diff;
      platforms.current.forEach(p => {
        p.y += diff;
      });
      setScore(s => s + Math.floor(diff / 5));
    }

    // Add new platforms
    if (platforms.current.length > 0) {
      const lastP = platforms.current[platforms.current.length - 1];
      if (lastP.y > -200) {
        platforms.current.push(createPlatform(lastP.y - 100));
      }
    }
    // Clean up old platforms
    if (platforms.current.length > 20) {
      platforms.current.shift();
      currentPlatformIndex.current--;
    }

    // Game over check (falling)
    if (!mouse.jumping && mouse.y > dimensions.height + 50) {
      setHearts(h => {
        if (h <= 1) {
          setGameOver(true);
          return 0;
        }
        // Respawn on current platform
        const currentP = platforms.current[currentPlatformIndex.current];
        if (currentP) {
          mouse.x = currentP.x + currentP.width / 2 - MOUSE_SIZE / 2;
          mouse.y = currentP.y - MOUSE_SIZE;
          mouse.targetX = mouse.x;
          mouse.targetY = mouse.y;
          mouse.vy = 0;
        }
        return h - 1;
      });
    }

    draw();
    frameId.current = requestAnimationFrame(update);
  }, [gameOver, createPlatform, showQuiz, dimensions, showExitConfirm]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const time = Date.now();

    // Clear
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Background Transition (Day to Night)
    // Night starts appearing after score 2000, fully night at 5000
    const nightFactor = Math.min(1, Math.max(0, (score - 1000) / 4000));
    
    // Day color: #87CEEB
    // Night color: #0a0a2a
    const r = Math.floor(135 * (1 - nightFactor) + 10 * nightFactor);
    const g = Math.floor(206 * (1 - nightFactor) + 10 * nightFactor);
    const b = Math.floor(235 * (1 - nightFactor) + 42 * nightFactor);
    
    const grad = ctx.createLinearGradient(0, 0, 0, dimensions.height);
    grad.addColorStop(0, `rgb(${r}, ${g}, ${b})`);
    grad.addColorStop(1, nightFactor > 0.5 ? '#1a1a4a' : '#E0F7FA');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // Stars (Night only)
    if (nightFactor > 0.3) {
      ctx.save();
      ctx.globalAlpha = (nightFactor - 0.3) / 0.7;
      stars.current.forEach(s => {
        ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Moon
      ctx.fillStyle = '#fdfbd3';
      ctx.beginPath();
      ctx.arc(dimensions.width * 0.8, 80, 30, 0, Math.PI * 2);
      ctx.fill();
      // Moon crater effect
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      ctx.beginPath();
      ctx.arc(dimensions.width * 0.8 - 10, 70, 8, 0, Math.PI * 2);
      ctx.arc(dimensions.width * 0.8 + 10, 90, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Clouds (Moving)
    ctx.fillStyle = `rgba(255, 255, 255, ${0.6 * (1 - nightFactor)})`;
    clouds.current.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.size * 0.5, 0, Math.PI * 2);
      ctx.arc(c.x + c.size * 0.4, c.y - c.size * 0.2, c.size * 0.4, 0, Math.PI * 2);
      ctx.arc(c.x + c.size * 0.8, c.y, c.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Platforms (Organic Land)
    platforms.current.forEach(p => {
      ctx.save();
      
      // Land base (Organic shape)
      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y + 10);
      ctx.quadraticCurveTo(p.x + p.width / 2, p.y + 25, p.x + p.width, p.y + 10);
      ctx.lineTo(p.x + p.width - 5, p.y + 5);
      ctx.lineTo(p.x + 5, p.y + 5);
      ctx.closePath();
      ctx.fill();

      // Grass top (Organic texture)
      ctx.fillStyle = '#32CD32';
      ctx.beginPath();
      ctx.moveTo(p.x - 5, p.y + 5);
      for (let i = 0; i <= p.width + 10; i += 10) {
        const offset = Math.sin(i + time / 200) * 2;
        ctx.lineTo(p.x - 5 + i, p.y + offset);
      }
      ctx.lineTo(p.x + p.width + 5, p.y + 8);
      ctx.lineTo(p.x - 5, p.y + 8);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();

      // Coin
      if (p.hasCoin) {
        const coinY = p.y - 40 + Math.sin(time / 300) * 5;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(p.x + p.width / 2, coinY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#DAA520';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Coin shine
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(p.x + p.width / 2 - 2, coinY - 2, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Mouse Character
    const mouse = mousePos.current;
    const earRotation = Math.sin(time / 150) * 0.15;
    const isBlinking = (time % 3000) < 150;

    ctx.save();
    ctx.translate(mouse.x + MOUSE_SIZE / 2, mouse.y + MOUSE_SIZE / 2);

    // Draw body
    ctx.fillStyle = '#D2B48C';
    ctx.beginPath();
    ctx.ellipse(0, 0, MOUSE_SIZE * 0.45, MOUSE_SIZE * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw ears (Dynamic movement)
    ctx.save();
    ctx.rotate(earRotation);
    ctx.fillStyle = '#D2B48C';
    ctx.beginPath();
    ctx.arc(-MOUSE_SIZE * 0.3, -MOUSE_SIZE * 0.35, MOUSE_SIZE * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFC0CB';
    ctx.beginPath();
    ctx.arc(-MOUSE_SIZE * 0.3, -MOUSE_SIZE * 0.35, MOUSE_SIZE * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.rotate(-earRotation);
    ctx.fillStyle = '#D2B48C';
    ctx.beginPath();
    ctx.arc(MOUSE_SIZE * 0.3, -MOUSE_SIZE * 0.35, MOUSE_SIZE * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFC0CB';
    ctx.beginPath();
    ctx.arc(MOUSE_SIZE * 0.3, -MOUSE_SIZE * 0.35, MOUSE_SIZE * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Eyes (Blinking)
    ctx.fillStyle = 'black';
    if (isBlinking) {
      ctx.fillRect(-MOUSE_SIZE * 0.22, -MOUSE_SIZE * 0.08, MOUSE_SIZE * 0.15, 1);
      ctx.fillRect(MOUSE_SIZE * 0.07, -MOUSE_SIZE * 0.08, MOUSE_SIZE * 0.15, 1);
    } else {
      ctx.beginPath();
      ctx.arc(-MOUSE_SIZE * 0.15, -MOUSE_SIZE * 0.08, MOUSE_SIZE * 0.06, 0, Math.PI * 2);
      ctx.arc(MOUSE_SIZE * 0.15, -MOUSE_SIZE * 0.08, MOUSE_SIZE * 0.06, 0, Math.PI * 2);
      ctx.fill();
      // Eye shine
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(-MOUSE_SIZE * 0.17, -MOUSE_SIZE * 0.1, MOUSE_SIZE * 0.02, 0, Math.PI * 2);
      ctx.arc(MOUSE_SIZE * 0.13, -MOUSE_SIZE * 0.1, MOUSE_SIZE * 0.02, 0, Math.PI * 2);
      ctx.fill();
    }

    // Nose
    ctx.fillStyle = '#FF69B4';
    ctx.beginPath();
    ctx.arc(0, MOUSE_SIZE * 0.08, MOUSE_SIZE * 0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  useEffect(() => {
    frameId.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId.current);
  }, [update]);

  const generateQuiz = () => {
    const patterns = [
      { text: "Rasio 2:4 senilai dengan...", answer: "1:2", options: ["1:2", "1:3", "2:3", "3:4"], hint: "Bagi kedua angka dengan 2." },
      { text: "Rasio 3:9 senilai dengan...", answer: "1:3", options: ["1:2", "1:3", "1:4", "2:3"], hint: "Bagi kedua angka dengan 3." },
      { text: "Rasio 5:10 senilai dengan...", answer: "1:2", options: ["1:2", "1:5", "2:5", "3:5"], hint: "Bagi kedua angka dengan 5." },
      { text: "Rasio 4:12 senilai dengan...", answer: "1:3", options: ["1:2", "1:3", "1:4", "1:6"], hint: "Bagi kedua angka dengan 4." },
    ];
    setQuizQuestion(patterns[Math.floor(Math.random() * patterns.length)]);
    setQuizError(false);
    setShowHint(false);
  };

  const handleQuizAnswer = (answer: string) => {
    if (answer === quizQuestion?.answer) {
      setHearts(prev => Math.min(prev + 1, 3));
      setShowQuiz(false);
      setQuizError(false);
      onQuizCorrect();
    } else {
      setQuizError(true);
    }
  };

  const handleShowHint = () => {
    if (currentPoints >= 10) {
      onDeductPoints(10);
      setShowHint(true);
    } else {
      alert("Poin tidak cukup untuk melihat hint!");
    }
  };

  const handleInput = (side: 'left' | 'right') => {
    if (gameOver || showQuiz || showExitConfirm || mousePos.current.jumping) return;
    
    const nextIndex = currentPlatformIndex.current + 1;
    const nextPlatform = platforms.current[nextIndex];
    
    if (nextPlatform) {
      const mouse = mousePos.current;
      mouse.jumping = true;
      mouse.jumpProgress = 0;
      mouse.startX = mouse.x;
      mouse.startY = mouse.y;
      
      // Calculate target based on clicked side
      const stepX = 80;
      mouse.targetX = mouse.x + (side === 'right' ? stepX : -stepX);
      mouse.targetY = nextPlatform.y - MOUSE_SIZE;
      
      currentPlatformIndex.current = nextIndex;
    }
  };

  return (
    <div ref={containerRef} className="fixed inset-0 bg-[#87CEEB] overflow-hidden select-none">
      {/* Header */}
      <div className="w-full flex justify-between items-center p-4 z-10">
        <button 
          onClick={() => setShowExitConfirm(true)} 
          className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors"
        >
          <ChevronLeft />
        </button>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-red-500 font-bold bg-white/20 px-3 py-1 rounded-full">
            <Heart fill="currentColor" className="w-5 h-5" /> {hearts}
          </div>
          <div className="flex items-center gap-1 text-yellow-400 font-bold bg-white/20 px-3 py-1 rounded-full">
            <Star fill="currentColor" className="w-5 h-5" /> {score}
          </div>
          <button 
            onClick={() => { generateQuiz(); setShowQuiz(true); }}
            className="bg-secondary text-white px-4 py-2 rounded-xl font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Jawab Soal
          </button>
        </div>
      </div>

      {/* Game Canvas */}
      <canvas 
        ref={canvasRef} 
        width={dimensions.width} 
        height={dimensions.height}
        className="touch-none"
      />

      {/* Controls Overlay */}
      <div className="absolute inset-0 flex">
        <div 
          className="w-1/2 h-full cursor-pointer active:bg-white/5" 
          onPointerDown={() => handleInput('left')}
        />
        <div 
          className="w-1/2 h-full cursor-pointer active:bg-white/5" 
          onPointerDown={() => handleInput('right')}
        />
      </div>

      {/* Game Over Modal */}
      <AnimatePresence>
        {showQuiz && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
                <RotateCcw className="text-orange-500 w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Tantangan Rasio!</h2>
              <p className="text-gray-500 mb-6">Jawab tantangan ini untuk menambah nyawa:</p>
              
              <div className={`bg-gray-50 p-6 rounded-2xl mb-4 transition-colors ${quizError ? 'border-2 border-red-400' : ''}`}>
                <p className="text-xl font-bold text-gray-800">{quizQuestion?.text}</p>
              </div>

              {quizError && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm font-bold"
                >
                  Jawaban salah! Coba lagi ya.
                </motion.div>
              )}

              {showHint ? (
                <div className="bg-blue-50 text-blue-700 p-4 rounded-xl mb-8 text-sm italic">
                  <strong>Hint:</strong> {quizQuestion?.hint}
                </div>
              ) : (
                <button 
                  onClick={handleShowHint}
                  className="w-full bg-blue-100 text-blue-700 p-3 rounded-xl mb-8 text-sm font-bold hover:bg-blue-200 transition-colors"
                >
                  Lihat Hint (-10 Poin)
                </button>
              )}

              <div className="grid grid-cols-2 gap-4">
                {quizQuestion?.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuizAnswer(opt)}
                    className="p-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {gameOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 p-6"
          >
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-3xl p-8 text-center shadow-2xl w-full"
            >
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Game Over!</h2>
              <p className="text-gray-500 mb-6">Skor kamu: {score}</p>
              <button 
                onClick={() => initGame()}
                className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-primary/90 transition-colors"
              >
                Main Lagi
              </button>
              <button 
                onClick={onBack}
                className="w-full mt-4 text-gray-400 font-bold"
              >
                Kembali
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* Exit Confirmation Modal */}
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 text-center shadow-2xl w-full max-w-sm"
            >
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ChevronLeft className="text-orange-500 w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Berhenti Bermain?</h2>
              <p className="text-gray-500 mb-8">Progres kamu saat ini tidak akan tersimpan.</p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg shadow-md hover:bg-primary/90 transition-colors"
                >
                  Lanjut Main
                </button>
                <button
                  onClick={onBack}
                  className="w-full py-4 text-gray-400 font-bold hover:text-gray-600 transition-colors"
                >
                  Kembali ke Beranda
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
