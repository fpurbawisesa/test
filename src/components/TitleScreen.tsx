import React, { useState } from 'react';
import { Play, User, GraduationCap, Volume2, VolumeX, Sparkles, Compass, Users } from 'lucide-react';
import { sound } from '../utils/sound';

interface TitleScreenProps {
  onStartStudent: () => void;
  onStartTeacher: () => void;
  onStartSolo: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartStudent,
  onStartTeacher,
  onStartSolo,
}) => {
  const [muted, setMuted] = useState(sound.isMuted());

  const handleToggleMute = () => {
    const isMute = sound.toggleMute();
    setMuted(isMute);
    if (!isMute) sound.playClick();
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 flex flex-col items-center justify-between p-6 select-none">
      {/* Background Retro Grid & Animated Stars */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-950 to-slate-950 pointer-events-none" />
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top Bar: Sound toggle and badge */}
      <div className="relative z-10 w-full max-w-5xl flex items-center justify-between pt-2">
        <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/80 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-300 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Multiplayer Co-op SD Server Online</span>
        </div>

        <button
          onClick={handleToggleMute}
          className="flex items-center gap-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
          title={muted ? 'Aktifkan Suara' : 'Bisukan Suara'}
        >
          {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          <span>{muted ? 'Suara Mati' : 'Suara Aktif'}</span>
        </button>
      </div>

      {/* Main Title Centerpiece */}
      <div className="relative z-10 flex flex-col items-center text-center my-auto max-w-2xl">
        {/* Bespoke Retro Inline SVG Title Lockup */}
        <div className="relative mb-3 transform hover:scale-105 transition-transform duration-300">
          <svg className="w-full max-w-md h-24 drop-shadow-[0_8px_24px_rgba(59,130,246,0.5)]" viewBox="0 0 500 100">
            <defs>
              <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#eab308" />
              </linearGradient>
            </defs>
            {/* Shadow layer */}
            <text x="252" y="58" textAnchor="middle" fill="#020617" fontSize="48" fontFamily="'Press Start 2P', monospace" fontWeight="900">
              EDU ADVENTURE
            </text>
            {/* Primary glowing text */}
            <text x="250" y="56" textAnchor="middle" fill="url(#goldGrad)" stroke="#78350f" strokeWidth="3" fontSize="48" fontFamily="'Press Start 2P', monospace" fontWeight="900">
              EDU ADVENTURE
            </text>
            {/* Subtitle */}
            <text x="250" y="86" textAnchor="middle" fill="#38bdf8" fontSize="13" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="800" letterSpacing="3">
              DUNIA PETUALANGAN BELAJAR MULTIPLAYER 2D
            </text>
          </svg>
        </div>

        <p className="text-slate-300 text-sm md:text-base font-medium max-w-lg mb-8 leading-relaxed">
          Jelajahi arena Nusantara, rebut kotak pertanyaan bersama teman sekelas, kumpulkan koin & badge juara di semua mata pelajaran!
        </p>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-xl">
          {/* Student Multiplayer Button */}
          <button
            onClick={() => {
              sound.playClick();
              onStartStudent();
            }}
            className="group relative flex flex-col items-center justify-center gap-2 p-5 rounded-2xl bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 border-2 border-blue-400/80 shadow-[0_8px_20px_rgba(37,99,235,0.4)] hover:shadow-[0_12px_28px_rgba(37,99,235,0.6)] active:scale-95 transition-all cursor-pointer text-white"
          >
            <div className="p-3 bg-blue-500/40 rounded-xl group-hover:scale-110 transition-transform">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div className="font-bold text-base">Masuk Siswa</div>
            <div className="text-xs text-blue-200">Main Bareng Teman</div>
          </button>

          {/* Teacher Mode Button */}
          <button
            onClick={() => {
              sound.playClick();
              onStartTeacher();
            }}
            className="group relative flex flex-col items-center justify-center gap-2 p-5 rounded-2xl bg-gradient-to-b from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 border-2 border-amber-400/80 shadow-[0_8px_20px_rgba(217,119,6,0.4)] hover:shadow-[0_12px_28px_rgba(217,119,6,0.6)] active:scale-95 transition-all cursor-pointer text-white"
          >
            <div className="p-3 bg-amber-500/40 rounded-xl group-hover:scale-110 transition-transform">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div className="font-bold text-base">Ruang Guru</div>
            <div className="text-xs text-amber-200">Kontrol & Analitik</div>
          </button>

          {/* Solo Practice Mode */}
          <button
            onClick={() => {
              sound.playClick();
              onStartSolo();
            }}
            className="group relative flex flex-col items-center justify-center gap-2 p-5 rounded-2xl bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 border-2 border-emerald-400/80 shadow-[0_8px_20px_rgba(5,150,105,0.4)] hover:shadow-[0_12px_28px_rgba(5,150,105,0.6)] active:scale-95 transition-all cursor-pointer text-white"
          >
            <div className="p-3 bg-emerald-500/40 rounded-xl group-hover:scale-110 transition-transform">
              <Compass className="w-7 h-7 text-white" />
            </div>
            <div className="font-bold text-base">Latihan Solo</div>
            <div className="text-xs text-emerald-200">Petualangan Bebas</div>
          </button>
        </div>
      </div>

      {/* Bottom Hint Line: Low-Occlusion Controls Hint */}
      <div className="relative z-10 w-full max-w-3xl flex items-center justify-center border-t border-slate-800/80 pt-4">
        <p className="text-xs md:text-sm text-slate-400 font-medium tracking-wide flex items-center gap-3">
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">WASD / Panah</span>
          <span>Bergerak</span>
          <span className="text-slate-600">·</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">E / Spasi</span>
          <span>Buka Peti & Masuk Gedung</span>
          <span className="text-slate-600">·</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">Sentuh Layar</span>
          <span>Joystick Virtual HP</span>
        </p>
      </div>
    </div>
  );
};
