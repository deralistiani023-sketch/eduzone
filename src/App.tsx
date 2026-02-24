/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import FoodSwap from './components/FoodSwap';
import SkyHop from './components/SkyHop';
import { 
  Hash, 
  Scale, 
  Percent, 
  Box, 
  Dices, 
  Trophy, 
  User, 
  Volume2, 
  VolumeX, 
  ChevronLeft, 
  Play, 
  BookOpen,
  GraduationCap,
  Star,
  CheckCircle2,
  XCircle,
  UtensilsCrossed
} from 'lucide-react';
import { SUBJECTS } from './constants';
import { Subject, SubjectId, ViewState, UserProgress } from './types';

const IconMap: Record<string, React.ReactNode> = {
  Hash: <Hash className="w-8 h-8" />,
  Scale: <Scale className="w-8 h-8" />,
  Percent: <Percent className="w-8 h-8" />,
  Box: <Box className="w-8 h-8" />,
  Dices: <Dices className="w-8 h-8" />,
};

export default function App() {
  const [view, setView] = useState<ViewState>('home');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [progress, setProgress] = useState<UserProgress>({
    scores: {
      'pola-bilangan': 0,
      'rasio': 0,
      'pecahan-desimal': 0,
      'kubus-balok': 0,
      'peluang': 0,
    },
    completedMaterials: {
      'pola-bilangan': false,
      'rasio': false,
      'pecahan-desimal': false,
      'kubus-balok': false,
      'peluang': false,
    },
    totalPoints: 0,
    quizCorrectCount: 0,
  });

  // Game State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [gameScore, setGameScore] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);

  const handleStartGame = (subject: Subject) => {
    setSelectedSubject(subject);
    if (subject.id === 'pola-bilangan') {
      setView('food-swap');
    } else if (subject.id === 'rasio') {
      setView('sky-hop');
    } else {
      setView('game');
    }
    setCurrentQuestionIndex(0);
    setGameScore(0);
    setGameFinished(false);
  };

  const handleOpenMaterial = (subject: Subject) => {
    setSelectedSubject(subject);
    setView('material');
  };

  const handleAnswer = (answer: string) => {
    if (!selectedSubject) return;
    
    const isCorrect = answer === selectedSubject.questions[currentQuestionIndex].correctAnswer;
    if (isCorrect) {
      setGameScore(prev => prev + 10);
    }

    if (currentQuestionIndex + 1 < selectedSubject.questions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setGameFinished(true);
      // Update global progress
      const finalScore = isCorrect ? gameScore + 10 : gameScore;
      setProgress(prev => {
        const newScores = { ...prev.scores, [selectedSubject.id]: Math.max(prev.scores[selectedSubject.id], finalScore) };
        const total = Object.values(newScores).reduce((a: number, b: number) => a + b, 0);
        return {
          ...prev,
          scores: newScores,
          totalPoints: total
        };
      });
    }
  };

  const renderHome = () => (
    <div className="p-8 max-w-6xl mx-auto">
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex justify-between items-center mb-12"
      >
        <div>
          <h1 className="text-5xl font-bold text-primary mb-2">EduZone</h1>
          <p className="text-gray-600 font-medium">Petualangan Belajar Kelas 6!</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="bg-accent px-4 py-2 rounded-full flex items-center gap-2 shadow-sm">
            <Star className="text-orange-500 fill-orange-500 w-5 h-5" />
            <span className="font-bold text-lg">{progress.totalPoints} Poin</span>
          </div>
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-3 bg-white rounded-full shadow-md hover:scale-110 transition-transform"
          >
            {soundEnabled ? <Volume2 className="text-primary" /> : <VolumeX className="text-gray-400" />}
          </button>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {SUBJECTS.map((subject, index) => (
          <motion.div
            key={subject.id}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`${subject.color} rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group`}
          >
            <div className="absolute -right-4 -bottom-4 opacity-20 group-hover:scale-125 transition-transform duration-500">
              {IconMap[subject.icon]}
            </div>
            <div className="relative z-10">
              <div className="bg-white/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-4">
                {IconMap[subject.icon]}
              </div>
              <h3 className="text-2xl font-bold mb-2">{subject.title}</h3>
              <p className="text-white/80 mb-6 text-sm">{subject.description}</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => handleOpenMaterial(subject)}
                  className="flex-1 bg-white text-gray-800 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-accent transition-colors"
                >
                  <BookOpen className="w-4 h-4" /> Materi
                </button>
                <button 
                  onClick={() => handleStartGame(subject)}
                  className="flex-1 bg-black/20 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black/30 transition-colors"
                >
                  <Play className="w-4 h-4" /> Mulai
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md px-8 py-4 rounded-full shadow-2xl flex gap-12 border border-white/20">
        <button onClick={() => setView('home')} className="flex flex-col items-center gap-1 group">
          <div className={`p-2 rounded-xl transition-colors ${view === 'home' ? 'bg-primary text-white' : 'text-gray-400 group-hover:text-primary'}`}>
            <Box className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">Beranda</span>
        </button>
        <button onClick={() => setView('report')} className="flex flex-col items-center gap-1 group">
          <div className={`p-2 rounded-xl transition-colors ${view === 'report' ? 'bg-primary text-white' : 'text-gray-400 group-hover:text-primary'}`}>
            <Trophy className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">Rapot</span>
        </button>
        <button onClick={() => setView('teacher')} className="flex flex-col items-center gap-1 group">
          <div className={`p-2 rounded-xl transition-colors ${view === 'teacher' ? 'bg-primary text-white' : 'text-gray-400 group-hover:text-primary'}`}>
            <User className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">Guru</span>
        </button>
      </nav>
    </div>
  );

  const renderMaterial = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 max-w-4xl mx-auto"
    >
      <button 
        onClick={() => setView('home')}
        className="flex items-center gap-2 text-primary font-bold mb-8 hover:-translate-x-1 transition-transform"
      >
        <ChevronLeft /> Kembali ke Beranda
      </button>

      <div className="bg-white rounded-3xl p-8 shadow-xl border-t-8 border-primary">
        <div className="flex items-center gap-4 mb-8">
          <div className={`${selectedSubject?.color} p-4 rounded-2xl text-white`}>
            {selectedSubject && IconMap[selectedSubject.icon]}
          </div>
          <h2 className="text-3xl font-bold text-gray-800">{selectedSubject?.title}</h2>
        </div>

        <div className="space-y-6">
          {selectedSubject?.material.map((text, i) => (
            <motion.div 
              key={i}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="flex gap-4 items-start bg-gray-50 p-6 rounded-2xl"
            >
              <div className="bg-secondary text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                {i + 1}
              </div>
              <p className="text-lg text-gray-700 leading-relaxed">{text}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <button 
            onClick={() => selectedSubject && handleStartGame(selectedSubject)}
            className="bg-primary text-white px-12 py-4 rounded-2xl font-bold text-xl shadow-lg hover:scale-105 transition-transform flex items-center gap-3"
          >
            <Play fill="white" /> Mulai Bermain!
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderGame = () => {
    if (!selectedSubject) return null;
    const currentQuestion = selectedSubject.questions[currentQuestionIndex];

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-8 max-w-3xl mx-auto min-h-screen flex flex-col items-center justify-center"
      >
        {!gameFinished ? (
          <div className="w-full">
            <div className="flex justify-between items-center mb-8">
              <span className="font-bold text-primary text-xl">Pertanyaan {currentQuestionIndex + 1}/{selectedSubject.questions.length}</span>
              <div className="bg-accent px-4 py-2 rounded-full font-bold shadow-sm">Skor: {gameScore}</div>
            </div>

            <div className="bg-white rounded-3xl p-10 shadow-2xl mb-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-10">{currentQuestion.text}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion.options.map((option, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(option)}
                    className="p-6 bg-gray-50 hover:bg-secondary hover:text-white rounded-2xl text-xl font-bold transition-all border-2 border-transparent hover:border-secondary shadow-sm"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-3xl p-12 shadow-2xl text-center w-full"
          >
            <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-12 h-12 text-orange-500" />
            </div>
            <h2 className="text-4xl font-bold text-gray-800 mb-2">Permainan Selesai!</h2>
            <p className="text-gray-500 mb-8 text-lg">Kamu mendapatkan skor:</p>
            <div className="text-6xl font-black text-primary mb-10">{gameScore}</div>
            
            <div className="flex gap-4">
              <button 
                onClick={() => setView('home')}
                className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-2xl font-bold text-lg hover:bg-gray-200 transition-colors"
              >
                Kembali
              </button>
              <button 
                onClick={() => handleStartGame(selectedSubject)}
                className="flex-1 bg-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-primary/90 transition-colors shadow-lg"
              >
                Main Lagi
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  };

  const renderReport = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 max-w-4xl mx-auto"
    >
      <h2 className="text-4xl font-bold text-primary mb-8 flex items-center gap-3">
        <Trophy className="w-10 h-10" /> Rapot Kemajuan
      </h2>

      <div className="grid gap-6">
        {SUBJECTS.map(subject => (
          <div key={subject.id} className="bg-white p-6 rounded-3xl shadow-md flex items-center justify-between border-l-8 border-secondary">
            <div className="flex items-center gap-4">
              <div className={`${subject.color} p-3 rounded-xl text-white`}>
                {IconMap[subject.icon]}
              </div>
              <div>
                <h4 className="font-bold text-xl">{subject.title}</h4>
                <p className="text-gray-400 text-sm">Skor Tertinggi: {progress.scores[subject.id]}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-secondary transition-all duration-1000" 
                  style={{ width: `${Math.min((progress.scores[subject.id] / 20) * 100, 100)}%` }}
                />
              </div>
              <span className="font-bold text-secondary">{progress.scores[subject.id]}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-primary text-white p-8 rounded-3xl shadow-xl flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold mb-1">Total Poin Kamu</h3>
          <p className="opacity-80">Teruslah belajar untuk menjadi juara!</p>
        </div>
        <div className="text-5xl font-black">{progress.totalPoints}</div>
      </div>

      <div className="mt-6 bg-secondary text-white p-8 rounded-3xl shadow-xl flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold mb-1">Jawaban Benar (Quiz)</h3>
          <p className="opacity-80">Tantangan pola bilangan yang berhasil dijawab.</p>
        </div>
        <div className="text-5xl font-black">{progress.quizCorrectCount}</div>
      </div>
    </motion.div>
  );

  const renderTeacher = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 max-w-4xl mx-auto"
    >
      <h2 className="text-4xl font-bold text-primary mb-8 flex items-center gap-3">
        <User className="w-10 h-10" /> Akun Guru
      </h2>

      <div className="bg-white rounded-3xl p-8 shadow-xl">
        <div className="flex items-center gap-6 mb-10 pb-10 border-bottom border-gray-100">
          <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center text-white text-4xl font-bold">
            G
          </div>
          <div>
            <h3 className="text-2xl font-bold">Pak Guru Budi</h3>
            <p className="text-gray-400">Wali Kelas 6A - SD EduZone</p>
          </div>
        </div>

        <h4 className="font-bold text-xl mb-6">Statistik Kelas</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-6 rounded-2xl">
            <div className="text-blue-500 font-bold mb-1">Siswa Aktif</div>
            <div className="text-3xl font-black">32</div>
          </div>
          <div className="bg-green-50 p-6 rounded-2xl">
            <div className="text-green-500 font-bold mb-1">Rata-rata Skor</div>
            <div className="text-3xl font-black">85</div>
          </div>
          <div className="bg-orange-50 p-6 rounded-2xl">
            <div className="text-orange-500 font-bold mb-1">Materi Selesai</div>
            <div className="text-3xl font-black">80%</div>
          </div>
        </div>

        <div className="mt-10">
          <button className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-primary/90 transition-colors">
            Unduh Laporan Nilai (PDF)
          </button>
        </div>
      </div>
    </motion.div>
  );

  const handleFoodSwapFinish = (score: number) => {
    setGameScore(score);
    if (selectedSubject) {
      setProgress(prev => {
        const newScores = { ...prev.scores, [selectedSubject.id]: Math.max(prev.scores[selectedSubject.id], score) };
        const total = Object.values(newScores).reduce((a: number, b: number) => a + b, 0);
        return {
          ...prev,
          scores: newScores,
          totalPoints: total
        };
      });
    }
    setView('home');
  };

  const handleQuizCorrect = () => {
    setProgress(prev => ({
      ...prev,
      quizCorrectCount: prev.quizCorrectCount + 1
    }));
  };

  const handleDeductPoints = (amount: number) => {
    setProgress(prev => ({
      ...prev,
      totalPoints: Math.max(0, prev.totalPoints - amount)
    }));
  };

  const handleSkyHopFinish = (score: number) => {
    setGameScore(score);
    if (selectedSubject) {
      setProgress(prev => {
        const newScores = { ...prev.scores, [selectedSubject.id]: Math.max(prev.scores[selectedSubject.id], score) };
        const total = Object.values(newScores).reduce((a: number, b: number) => a + b, 0);
        return {
          ...prev,
          scores: newScores,
          totalPoints: total
        };
      });
    }
    setView('home');
  };

  return (
    <div className="min-h-screen pb-32">
      <AnimatePresence mode="wait">
        {view === 'home' && renderHome()}
        {view === 'material' && renderMaterial()}
        {view === 'game' && renderGame()}
        {view === 'food-swap' && (
          <FoodSwap 
            onFinish={handleFoodSwapFinish} 
            onBack={() => setView('home')} 
            onQuizCorrect={handleQuizCorrect}
            onDeductPoints={handleDeductPoints}
            currentPoints={progress.totalPoints}
          />
        )}
        {view === 'sky-hop' && (
          <SkyHop 
            onFinish={handleSkyHopFinish} 
            onBack={() => setView('home')} 
            onQuizCorrect={handleQuizCorrect}
            onDeductPoints={handleDeductPoints}
            currentPoints={progress.totalPoints}
          />
        )}
        {view === 'report' && renderReport()}
        {view === 'teacher' && renderTeacher()}
      </AnimatePresence>
    </div>
  );
}
