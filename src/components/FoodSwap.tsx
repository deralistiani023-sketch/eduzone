import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Timer, 
  Star,
  ChevronLeft,
  RotateCcw
} from 'lucide-react';

const FOOD_TYPES = [
  { emoji: '🍎', label: 'Apel', bg: 'bg-red-50', border: 'border-red-200', shadow: 'shadow-red-200' },
  { emoji: '🍊', label: 'Jeruk', bg: 'bg-orange-50', border: 'border-orange-200', shadow: 'shadow-orange-200' },
  { emoji: '🍇', label: 'Anggur', bg: 'bg-purple-50', border: 'border-purple-200', shadow: 'shadow-purple-200' },
  { emoji: '🍌', label: 'Pisang', bg: 'bg-yellow-50', border: 'border-yellow-200', shadow: 'shadow-yellow-200' },
  { emoji: '🍓', label: 'Stroberi', bg: 'bg-pink-50', border: 'border-pink-200', shadow: 'shadow-pink-200' },
  { emoji: '🍉', label: 'Semangka', bg: 'bg-green-50', border: 'border-green-200', shadow: 'shadow-green-200' },
];

const GRID_SIZE = 7;

interface FoodItem {
  id: number;
  type: number;
}

interface FoodSwapProps {
  onFinish: (score: number) => void;
  onBack: () => void;
  onQuizCorrect: () => void;
  onDeductPoints: (amount: number) => void;
  currentPoints: number;
}

export default function FoodSwap({ onFinish, onBack, onQuizCorrect, onDeductPoints, currentPoints }: FoodSwapProps) {
  const [grid, setGrid] = useState<FoodItem[][]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes
  const [hearts, setHearts] = useState(3);
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizQuestion, setQuizQuestion] = useState<{ text: string; answer: string; options: string[]; hint: string } | null>(null);
  const [quizError, setQuizError] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Initialize grid
  const initGrid = useCallback(() => {
    const newGrid: FoodItem[][] = [];
    let idCounter = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
      newGrid[r] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        let type;
        // Avoid initial matches
        do {
          type = Math.floor(Math.random() * FOOD_TYPES.length);
        } while (
          (r >= 2 && newGrid[r - 1][c].type === type && newGrid[r - 2][c].type === type) ||
          (c >= 2 && newGrid[r][c - 1].type === type && newGrid[r][c - 2].type === type)
        );
        newGrid[r][c] = { id: idCounter++, type };
      }
    }
    setGrid(newGrid);
  }, []);

  useEffect(() => {
    initGrid();
  }, [initGrid]);

  // Timer
  useEffect(() => {
    if (timeLeft > 0 && hearts > 0 && !showQuiz) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      onFinish(score);
    }
  }, [timeLeft, hearts, showQuiz, onFinish, score]);

  const checkMatches = (currentGrid: FoodItem[][]) => {
    const matches: { r: number; c: number }[] = [];
    // Horizontal
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE - 2; c++) {
        if (currentGrid[r][c].type === currentGrid[r][c + 1].type && 
            currentGrid[r][c].type === currentGrid[r][c + 2].type) {
          matches.push({ r, c }, { r, c: c + 1 }, { r, c: c + 2 });
        }
      }
    }
    // Vertical
    for (let r = 0; r < GRID_SIZE - 2; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (currentGrid[r][c].type === currentGrid[r + 1][c].type && 
            currentGrid[r][c].type === currentGrid[r + 2][c].type) {
          matches.push({ r, c }, { r: r + 1, c }, { r: r + 2, c });
        }
      }
    }
    return Array.from(new Set(matches.map(m => `${m.r},${m.c}`))).map(s => {
      const [r, c] = s.split(',').map(Number);
      return { r, c };
    });
  };

  const handleSwap = async (r1: number, c1: number, r2: number, c2: number) => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    // 1. Perform swap
    const newGrid = grid.map(row => [...row]);
    const temp = newGrid[r1][c1];
    newGrid[r1][c1] = newGrid[r2][c2];
    newGrid[r2][c2] = temp;
    setGrid([...newGrid]);

    await new Promise(resolve => setTimeout(resolve, 200));

    const matches = checkMatches(newGrid);
    if (matches.length > 0) {
      await processMatches(newGrid);
    } else {
      // 2. Invalid swap - Swap back
      const revertedGrid = newGrid.map(row => [...row]);
      const temp2 = revertedGrid[r1][c1];
      revertedGrid[r1][c1] = revertedGrid[r2][c2];
      revertedGrid[r2][c2] = temp2;
      setGrid([...revertedGrid]);
      
      setHearts(prev => {
        const next = prev - 1;
        if (next <= 0) {
          generateQuiz();
          setShowQuiz(true);
        }
        return next;
      });
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    setIsProcessing(false);
    setSelected(null);
    setIsDragging(false);
  };

  const processMatches = async (currentGrid: FoodItem[][]) => {
    let matches = checkMatches(currentGrid);
    let totalScore = score;

    while (matches.length > 0) {
      totalScore += matches.length * 10;
      setScore(totalScore);

      // Remove matches
      matches.forEach(({ r, c }) => {
        currentGrid[r][c].type = -1;
      });

      // Drop items
      for (let c = 0; c < GRID_SIZE; c++) {
        let emptySpot = GRID_SIZE - 1;
        for (let r = GRID_SIZE - 1; r >= 0; r--) {
          if (currentGrid[r][c].type !== -1) {
            currentGrid[emptySpot][c] = currentGrid[r][c];
            if (emptySpot !== r) currentGrid[r][c] = { id: -1, type: -1 };
            emptySpot--;
          }
        }
        // Fill new
        for (let r = emptySpot; r >= 0; r--) {
          currentGrid[r][c] = { id: Math.random(), type: Math.floor(Math.random() * FOOD_TYPES.length) };
        }
      }

      setGrid([...currentGrid.map(row => [...row])]);
      await new Promise(resolve => setTimeout(resolve, 300));
      matches = checkMatches(currentGrid);
    }
  };

  const generateQuiz = () => {
    const patterns = [
      { text: "Lanjutkan pola: 2, 4, 6, ...", answer: "8", options: ["7", "8", "9", "10"], hint: "Pola ini bertambah 2 setiap langkah." },
      { text: "Lanjutkan pola: 1, 3, 5, ...", answer: "7", options: ["6", "7", "8", "9"], hint: "Pola bilangan ganjil, bertambah 2." },
      { text: "Lanjutkan pola: 10, 20, 30, ...", answer: "40", options: ["35", "40", "45", "50"], hint: "Pola ini bertambah 10 setiap langkah." },
      { text: "Lanjutkan pola: 5, 10, 15, ...", answer: "20", options: ["18", "20", "22", "25"], hint: "Pola perkalian 5 atau tambah 5." },
    ];
    setQuizQuestion(patterns[Math.floor(Math.random() * patterns.length)]);
    setQuizError(false);
    setShowHint(false);
  };

  const handleQuizAnswer = (answer: string) => {
    if (answer === quizQuestion?.answer) {
      setHearts(prev => Math.min(prev + 1, 3));
      setTimeLeft(prev => prev + 50);
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

  const onPointerDown = (r: number, c: number) => {
    if (isProcessing || showQuiz) return;
    setSelected({ r, c });
    setIsDragging(true);
  };

  const onPointerEnter = (r: number, c: number) => {
    if (!isDragging || !selected || isProcessing || showQuiz) return;
    
    const dist = Math.abs(selected.r - r) + Math.abs(selected.c - c);
    if (dist === 1) {
      handleSwap(selected.r, selected.c, r, c);
    }
  };

  const onPointerUp = () => {
    setIsDragging(false);
    if (!isProcessing) setSelected(null);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto p-4">
      <div className="w-full flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-md">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronLeft />
          </button>
          <button 
            onClick={() => { generateQuiz(); setShowQuiz(true); }}
            className="bg-secondary text-white px-4 py-2 rounded-xl font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Jawab Soal
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-red-500 font-bold">
            <Heart fill="currentColor" /> {hearts}
          </div>
          <div className="flex items-center gap-1 text-blue-500 font-bold">
            <Timer /> {formatTime(timeLeft)}
          </div>
          <div className="flex items-center gap-1 text-orange-500 font-bold">
            <Star fill="currentColor" /> {score}
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-3xl shadow-2xl border-8 border-primary/10 select-none touch-none" onPointerLeave={onPointerUp}>
        <div className="grid grid-cols-7 gap-2">
          {grid.map((row, r) => row.map((item, c) => {
            const food = FOOD_TYPES[item.type];
            const isSelected = selected?.r === r && selected?.c === c;
            
            return (
              <motion.div
                key={`${r}-${c}-${item.id}`}
                layout
                initial={false}
                animate={{
                  scale: isSelected ? 1.15 : 1,
                  zIndex: isSelected ? 10 : 1,
                  rotate: isSelected ? [0, -2, 2, 0] : 0
                }}
                transition={isSelected ? { rotate: { repeat: Infinity, duration: 0.5 } } : {}}
                onPointerDown={() => onPointerDown(r, c)}
                onPointerEnter={() => onPointerEnter(r, c)}
                onPointerUp={onPointerUp}
                className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-200 border-b-4 ${
                  isSelected 
                    ? 'ring-4 ring-primary border-primary shadow-2xl scale-110 bg-white' 
                    : `shadow-md ${food?.border || 'border-gray-100'} hover:shadow-lg active:scale-95`
                } ${food?.bg || 'bg-gray-50'}`}
              >
                <span className="text-3xl md:text-4xl drop-shadow-md select-none">
                  {food?.emoji}
                </span>
              </motion.div>
            );
          }))}
        </div>
      </div>

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
              <h2 className="text-2xl font-bold mb-2">Energi Habis!</h2>
              <p className="text-gray-500 mb-6">Jawab tantangan ini untuk lanjut bermain:</p>
              
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
      </AnimatePresence>
    </div>
  );
}
