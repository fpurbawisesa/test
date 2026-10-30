import React from 'react';
import { InteractiveBuilding, SUBJECTS } from '../types/game';
import { sound } from '../utils/sound';
import { 
  X, 
  Play, 
  Sparkles, 
  Calculator, 
  FlaskConical, 
  BookOpen, 
  ShieldCheck, 
  Trophy, 
  Palette,
  Award
} from 'lucide-react';

interface BuildingModalProps {
  building: InteractiveBuilding;
  onStartQuiz: () => void;
  onClose: () => void;
}

export const BuildingModal: React.FC<BuildingModalProps> = ({
  building,
  onStartQuiz,
  onClose,
}) => {
  const subjectMeta = SUBJECTS[building.subject] || SUBJECTS.matematika;

  const getIcon = () => {
    switch (building.subject) {
      case 'matematika': return <Calculator className="w-8 h-8 text-blue-400" />;
      case 'ipas': return <FlaskConical className="w-8 h-8 text-emerald-400" />;
      case 'bahasa_indonesia': return <BookOpen className="w-8 h-8 text-amber-400" />;
      case 'pancasila': return <ShieldCheck className="w-8 h-8 text-red-400" />;
      case 'pjok': return <Trophy className="w-8 h-8 text-purple-400" />;
      case 'seni_budaya': return <Palette className="w-8 h-8 text-pink-400" />;
      default: return <Sparkles className="w-8 h-8 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-2xl p-6 overflow-hidden">
        {/* Top Glow */}
        <div 
          className="absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl opacity-25 pointer-events-none"
          style={{ backgroundColor: subjectMeta.color }}
        />

        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Building Identity */}
        <div className="flex items-center gap-4 mb-4">
          <div 
            className="p-4 rounded-2xl border flex items-center justify-center shadow-lg"
            style={{ backgroundColor: `${subjectMeta.color}20`, borderColor: subjectMeta.color }}
          >
            {getIcon()}
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {subjectMeta.name}
            </span>
            <h2 className="text-xl font-bold text-white">
              {building.name}
            </h2>
          </div>
        </div>

        {/* Description & Learning Topics */}
        <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3 mb-6">
          <p className="text-sm text-slate-300 leading-relaxed">
            {building.description}
          </p>

          <div className="pt-2 border-t border-slate-800/80">
            <span className="text-xs font-bold text-amber-400 block mb-1.5 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" /> Tema Pembelajaran Unggulan:
            </span>
            <p className="text-xs text-slate-400 italic">
              "{subjectMeta.theme}"
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition cursor-pointer"
          >
            Nanti Dulu
          </button>
          <button
            onClick={() => {
              sound.playClick();
              onStartQuiz();
            }}
            className="flex-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Mulai Uji Pengetahuan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
