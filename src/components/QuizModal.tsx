import React, { useState, useEffect } from 'react';
import { DIFFICULTY_POINTS, Question, QuestionDifficulty, SUBJECTS } from '../types/game';
import { sound } from '../utils/sound';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Sparkles, 
  BookOpen, 
  Zap, 
  ArrowRight, 
  Calculator, 
  FlaskConical, 
  ShieldCheck, 
  Trophy, 
  Palette 
} from 'lucide-react';

interface QuizModalProps {
  question: Question;
  chestId?: string;
  chestPoints?: number;
  chestDifficulty?: QuestionDifficulty;
  onAnswer: (selectedOption: number, answerTimeMs: number) => void;
  onClose: () => void;
  isSolo?: boolean;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  question,
  chestId,
  chestPoints,
  chestDifficulty,
  onAnswer,
  onClose,
  isSolo = false,
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [startTime] = useState<number>(Date.now());
  const [timeLeft, setTimeLeft] = useState<number>(20); // 20 seconds
  const [quickBonus, setQuickBonus] = useState(0);

  const subjectMeta = SUBJECTS[question.subject] || SUBJECTS.matematika;
  const diff: QuestionDifficulty = chestDifficulty || question.difficulty || 'sedang';
  const basePoints = chestPoints || (diff === 'sulit' ? 200 : diff === 'mudah' ? 50 : 100);
  const maxBonus = diff === 'sulit' ? 50 : diff === 'mudah' ? 10 : 25;

  // Countdown timer
  useEffect(() => {
    if (isAnswered) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeOut();
          return 0;
        }
        if (prev <= 5) {
          sound.playCountdownTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAnswered]);

  const handleTimeOut = () => {
    if (isAnswered) return;
    setIsAnswered(true);
    setSelectedIdx(-1); // timeout
    sound.playWrong();
    onAnswer(-1, 20000);
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    const answerTime = Date.now() - startTime;
    setSelectedIdx(idx);
    setIsAnswered(true);

    const isCorrect = idx === question.correctIndex;
    if (isCorrect) {
      sound.playCorrect();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#3b82f6', '#fbbf24', '#f43f5e'],
      });

      // Quick bonus
      if (answerTime < 10000) {
        const bonus = Math.round(maxBonus * (1 - answerTime / 10000));
        setQuickBonus(bonus);
      }
    } else {
      sound.playWrong();
    }

    onAnswer(idx, answerTime);
  };

  const getSubjectIcon = () => {
    switch (question.subject) {
      case 'matematika': return <Calculator className="w-5 h-5" />;
      case 'ipas': return <FlaskConical className="w-5 h-5" />;
      case 'bahasa_indonesia': return <BookOpen className="w-5 h-5" />;
      case 'pancasila': return <ShieldCheck className="w-5 h-5" />;
      case 'pjok': return <Trophy className="w-5 h-5" />;
      case 'seni_budaya': return <Palette className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  const isCorrect = selectedIdx === question.correctIndex;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-2xl p-6 overflow-hidden">
        {/* Glow backdrop matching subject color */}
        <div 
          className="absolute -top-24 -left-24 w-60 h-60 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: subjectMeta.color }}
        />

        {/* Top Header: Subject Badge & Timer & Difficulty Tier */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div 
              className="p-2 rounded-xl text-white shadow-md flex items-center justify-center"
              style={{ backgroundColor: subjectMeta.color }}
            >
              {getSubjectIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {subjectMeta.name} · Kelas {question.gradeLevel} SD
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.2 rounded-md ${
                  diff === 'sulit' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                  diff === 'mudah' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                  'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                }`}>
                  {diff === 'sulit' ? '🔴 SULIT HOTS (+200)' : diff === 'mudah' ? '🟢 MUDAH (+50)' : '🔵 SEDANG (+100)'}
                </span>
              </div>
              <h3 className="text-base md:text-lg font-bold text-white">
                {question.title}
              </h3>
            </div>
          </div>

          {/* Time bar & Counter */}
          <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-full">
            <Clock className={`w-4 h-4 ${timeLeft <= 5 ? 'text-rose-400 animate-spin' : 'text-amber-400'}`} />
            <span className={`font-mono font-bold text-sm ${timeLeft <= 5 ? 'text-rose-400' : 'text-slate-200'}`}>
              {timeLeft}s
            </span>
          </div>
        </div>

        {/* Timer progress line */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full my-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              timeLeft <= 5 ? 'bg-rose-500' : 'bg-gradient-to-r from-blue-500 to-emerald-400'
            }`}
            style={{ width: `${(timeLeft / 20) * 100}%` }}
          />
        </div>

        {/* Question Text */}
        <div className="my-5 p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
          <p className="text-base md:text-lg text-slate-100 font-semibold leading-relaxed">
            {question.question}
          </p>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {question.options.map((opt, idx) => {
            const letter = ['A', 'B', 'C', 'D'][idx];
            let buttonStyle = 'bg-slate-800 hover:bg-slate-700/80 border-slate-700 text-slate-200';

            if (isAnswered) {
              if (idx === question.correctIndex) {
                // Correct answer is highlighted in green
                buttonStyle = 'bg-emerald-600/30 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/50';
              } else if (idx === selectedIdx) {
                // Selected wrong answer highlighted in red
                buttonStyle = 'bg-rose-600/30 border-rose-500 text-rose-200 ring-2 ring-rose-500/50';
              } else {
                buttonStyle = 'bg-slate-800/40 border-slate-800 text-slate-500 opacity-60';
              }
            }

            return (
              <button
                key={idx}
                disabled={isAnswered}
                onClick={() => handleSelectOption(idx)}
                className={`p-3.5 rounded-xl border-2 text-left font-medium text-sm flex items-center gap-3 transition-all cursor-pointer ${buttonStyle}`}
              >
                <span className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                  {letter}
                </span>
                <span className="flex-1 leading-snug">{opt}</span>
                {isAnswered && idx === question.correctIndex && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                )}
                {isAnswered && idx === selectedIdx && idx !== question.correctIndex && (
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Result & Educational Explanation (Pembahasan Edukatif) */}
        {isAnswered && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div
              className={`p-4 rounded-2xl border mb-4 ${
                isCorrect
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-bold text-base">
                  {isCorrect ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>Luar Biasa, Jawaban Benar!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-rose-400" />
                      <span>Belum Tepat, Tetap Semangat!</span>
                    </>
                  )}
                </div>
                {isCorrect && (
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-600/40 text-emerald-300 font-bold text-xs">
                      +{basePoints} Poin
                    </span>
                    {quickBonus > 0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-1">
                        <Zap className="w-3 h-3 fill-current" /> +{quickBonus} Bonus Cepat
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Pembahasan Materi */}
              <div className="text-xs md:text-sm text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800 leading-relaxed">
                <span className="font-bold text-amber-400 block mb-1">📖 Pembahasan Edukatif:</span>
                {question.explanation}
              </div>
            </div>

            {/* Close / Next Button */}
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
            >
              <span>Lanjutkan Petualangan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
