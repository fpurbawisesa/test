import React, { useState, useEffect, useRef } from 'react';
import { 
  AvatarConfig, 
  Player 
} from '../types/game';
import { 
  drawAvatar, 
  COLOR_PALETTES, 
  OUTFIT_LABELS, 
  HAIR_STYLE_LABELS, 
  HAT_LABELS, 
  ACCESSORY_LABELS 
} from '../game/AvatarRenderer';
import { sound } from '../utils/sound';
import { Sparkles, ArrowRight, User, ShieldAlert, KeyRound, Play } from 'lucide-react';

interface AvatarCustomizerProps {
  initialConfig?: AvatarConfig;
  onJoinGame: (playerName: string, avatar: AvatarConfig, roomCode: string) => void;
  onBack: () => void;
  defaultRoomCode?: string;
}

export const AvatarCustomizerModal: React.FC<AvatarCustomizerProps> = ({
  initialConfig,
  onJoinGame,
  onBack,
  defaultRoomCode = 'SD-JUARA',
}) => {
  const [name, setName] = useState('Budi Juara');
  const [roomCode, setRoomCode] = useState(defaultRoomCode);
  const [activeTab, setActiveTab] = useState<'gender' | 'hair' | 'outfit' | 'hat' | 'accessory'>('gender');
  
  const [avatar, setAvatar] = useState<AvatarConfig>(initialConfig || {
    gender: 'boy',
    skinColor: COLOR_PALETTES.skin[0],
    hairStyle: 'short',
    hairColor: COLOR_PALETTES.hair[0],
    outfit: 'sd_uniform',
    accessory: 'none',
    hat: 'sd_cap',
  });

  const [dir, setDir] = useState<'down' | 'left' | 'right' | 'up'>('down');
  const [animStep, setAnimStep] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animated walking preview loop
  useEffect(() => {
    let step = 0;
    const interval = setInterval(() => {
      step = (step + 1) % 4;
      setAnimStep(step);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Render sprite on canvas whenever avatar changes or animStep changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw centered with large scale for nice crisp pixel preview
    drawAvatar(ctx, canvas.width / 2, canvas.height * 0.78, avatar, dir, animStep, 4.2);
  }, [avatar, dir, animStep]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    sound.playClick();
    onJoinGame(name.trim(), avatar, roomCode.trim().toUpperCase() || 'SD-JUARA');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-400" />
              <span>Kustomisasi Avatar Petualang</span>
            </h2>
            <p className="text-xs md:text-sm text-slate-400">
              Buat karakter unikmu dan bersiaplah bertualang di Dunia Edu Adventure!
            </p>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onBack();
            }}
            className="text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 text-sm font-semibold transition cursor-pointer"
          >
            Kembali
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
          {/* Left Column: Avatar Live Preview & Rotation */}
          <div className="md:col-span-5 flex flex-col items-center justify-center bg-slate-950/60 rounded-2xl p-5 border border-slate-800">
            <div className="relative w-48 h-48 bg-gradient-to-b from-blue-950/40 to-slate-900 rounded-2xl border-2 border-blue-500/40 flex items-center justify-center shadow-inner overflow-hidden mb-4">
              <canvas
                ref={canvasRef}
                width={192}
                height={192}
                className="pixelated w-full h-full"
              />
              <div className="absolute top-2 left-2 text-[10px] font-mono px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-500/30">
                2D Pixel Art
              </div>
            </div>

            {/* Turn Buttons */}
            <div className="flex items-center gap-2 mb-4">
              {(['down', 'left', 'up', 'right'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setDir(d);
                  }}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                    dir === d
                      ? 'bg-blue-600 border-blue-400 text-white shadow-sm'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {d === 'down' ? 'Depan' : d === 'left' ? 'Kiri' : d === 'up' ? 'Belakang' : 'Kanan'}
                </button>
              ))}
            </div>

            {/* Name & Room Code Inputs */}
            <div className="w-full space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Panggilan Siswa
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    maxLength={16}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Budi, Siti, Rian"
                    className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kode Kelas / Room (Multiplayer)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="Kode Room Guru"
                    className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-amber-400 font-mono font-bold text-sm tracking-wider focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Customization Options & Tabs */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-4">
            {/* Category Navigation Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 overflow-x-auto">
              {[
                { id: 'gender', label: 'Tubuh & Kulit' },
                { id: 'hair', label: 'Rambut' },
                { id: 'outfit', label: 'Kostum' },
                { id: 'hat', label: 'Topi' },
                { id: 'accessory', label: 'Aksesoris' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setActiveTab(tab.id as typeof activeTab);
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Customization Controls Content */}
            <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-800/80 min-h-[220px]">
              {/* TAB 1: GENDER & SKIN */}
              {activeTab === 'gender' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-2">Model Karakter</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setAvatar({ ...avatar, gender: 'boy' });
                        }}
                        className={`p-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                          avatar.gender === 'boy'
                            ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        👦 Laki-laki
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setAvatar({ ...avatar, gender: 'girl' });
                        }}
                        className={`p-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                          avatar.gender === 'girl'
                            ? 'bg-pink-600/30 border-pink-500 text-pink-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        👧 Perempuan
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-2">Warna Kulit</label>
                    <div className="flex flex-wrap gap-2">
                      {COLOR_PALETTES.skin.map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            setAvatar({ ...avatar, skinColor: col });
                          }}
                          style={{ backgroundColor: col }}
                          className={`w-9 h-9 rounded-full border-2 transition transform hover:scale-110 cursor-pointer ${
                            avatar.skinColor === col ? 'border-blue-400 ring-2 ring-blue-500' : 'border-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: HAIR STYLE & COLOR */}
              {activeTab === 'hair' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-2">Gaya Rambut</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {(Object.keys(HAIR_STYLE_LABELS) as (keyof typeof HAIR_STYLE_LABELS)[]).map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            setAvatar({ ...avatar, hairStyle: style });
                          }}
                          className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition cursor-pointer ${
                            avatar.hairStyle === style
                              ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {HAIR_STYLE_LABELS[style]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-2">Warna Rambut</label>
                    <div className="flex flex-wrap gap-2">
                      {COLOR_PALETTES.hair.map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            setAvatar({ ...avatar, hairColor: col });
                          }}
                          style={{ backgroundColor: col }}
                          className={`w-9 h-9 rounded-full border-2 transition transform hover:scale-110 cursor-pointer ${
                            avatar.hairColor === col ? 'border-white ring-2 ring-blue-400' : 'border-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: OUTFIT */}
              {activeTab === 'outfit' && (
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-2">Pilihan Pakaian / Kostum</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(Object.keys(OUTFIT_LABELS) as (keyof typeof OUTFIT_LABELS)[]).map((outfit) => (
                      <button
                        key={outfit}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setAvatar({ ...avatar, outfit });
                        }}
                        className={`p-3 rounded-xl border text-xs font-bold text-left transition cursor-pointer ${
                          avatar.outfit === outfit
                            ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {OUTFIT_LABELS[outfit]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: HAT */}
              {activeTab === 'hat' && (
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-2">Pilihan Topi & Mahkota</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(Object.keys(HAT_LABELS) as (keyof typeof HAT_LABELS)[]).map((hat) => (
                      <button
                        key={hat}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setAvatar({ ...avatar, hat });
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition cursor-pointer ${
                          avatar.hat === hat
                            ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {HAT_LABELS[hat]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: ACCESSORIES */}
              {activeTab === 'accessory' && (
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-2">Pilihan Aksesoris</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(Object.keys(ACCESSORY_LABELS) as (keyof typeof ACCESSORY_LABELS)[]).map((acc) => (
                      <button
                        key={acc}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setAvatar({ ...avatar, accessory: acc });
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition cursor-pointer ${
                          avatar.accessory === acc
                            ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {ACCESSORY_LABELS[acc]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Ready & Start Button */}
            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 border border-blue-400 shadow-[0_8px_20px_rgba(37,99,235,0.4)] text-white font-bold text-base flex items-center justify-center gap-2 active:scale-98 transition cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Masuk Arena Permainan</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
