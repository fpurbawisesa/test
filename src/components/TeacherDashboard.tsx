import React, { useState, useEffect } from 'react';
import { 
  ARENAS, 
  ArenaType, 
  DIFFICULTY_POINTS, 
  GameRoom, 
  Player, 
  Question, 
  QuestionDifficulty, 
  Subject, 
  SUBJECTS, 
  TeacherAnalytics 
} from '../types/game';
import { sound } from '../utils/sound';
import { 
  Users, 
  Play, 
  Pause, 
  RotateCcw, 
  Radio, 
  PlusCircle, 
  BarChart3, 
  FileSpreadsheet, 
  GraduationCap, 
  Copy, 
  Check, 
  BookOpen, 
  ShieldAlert, 
  Trophy, 
  Sparkles,
  ArrowLeft,
  Send,
  HelpCircle,
  Clock,
  Compass,
  MapPin,
  Flame,
  Award,
  Layers,
  Sliders,
  CheckCircle2
} from 'lucide-react';

interface TeacherDashboardProps {
  roomCode: string;
  room?: GameRoom | null;
  onBackToTitle: () => void;
  onSendTeacherAction: (action: 'start_game' | 'pause_game' | 'resume_game' | 'reset_chests' | 'broadcast' | 'end_game' | 'change_arena' | 'set_duration' | 'add_time' | 'update_settings', payload?: any) => void;
  onAddCustomQuestion: (question: Omit<Question, 'id'>) => Promise<boolean>;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  roomCode,
  room,
  onBackToTitle,
  onSendTeacherAction,
  onAddCustomQuestion,
}) => {
  const [activeTab, setActiveTab] = useState<'arena' | 'monitor' | 'analytics' | 'questions' | 'controls'>('arena');
  const [copiedCode, setCopiedCode] = useState(false);
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);
  const [settingsSavedSuccess, setSettingsSavedSuccess] = useState(false);

  // Arena & Match Setup state
  const [selectedArena, setSelectedArena] = useState<ArenaType>(room?.arena || 'kampus');
  const [durationMinutes, setDurationMinutes] = useState<number>(Math.round((room?.timeLimitSeconds || 600) / 60));
  const [chestCount, setChestCount] = useState<number>(room?.chestCount || 20);
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>(
    room?.selectedSubjects || ['matematika', 'ipas', 'bahasa_indonesia', 'pancasila', 'pjok', 'seni_budaya']
  );

  // New question form state
  const [qSubject, setQSubject] = useState<Subject>('matematika');
  const [qDifficulty, setQDifficulty] = useState<QuestionDifficulty>('sedang');
  const [qTitle, setQTitle] = useState('');
  const [qText, setQText] = useState('');
  const [qOptA, setQOptA] = useState('');
  const [qOptB, setQOptB] = useState('');
  const [qOptC, setQOptC] = useState('');
  const [qOptD, setQOptD] = useState('');
  const [qCorrectIdx, setQCorrectIdx] = useState(0);
  const [qExplanation, setQExplanation] = useState('');
  const [qGrade, setQGrade] = useState(4);
  const [qSubmitting, setQSubmitting] = useState(false);
  const [qSuccess, setQSuccess] = useState(false);

  // Analytics fetched state
  const [analytics, setAnalytics] = useState<TeacherAnalytics | null>(null);

  // Sync state if room changes externally
  useEffect(() => {
    if (room) {
      if (room.arena) setSelectedArena(room.arena);
      if (room.timeLimitSeconds) setDurationMinutes(Math.round(room.timeLimitSeconds / 60));
      if (room.chestCount) setChestCount(room.chestCount);
      if (room.selectedSubjects) setSelectedSubjects(room.selectedSubjects);
    }
  }, [room?.arena, room?.timeLimitSeconds, room?.chestCount]);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`/api/teacher/summary/${roomCode}`);
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 3000);
    return () => clearInterval(interval);
  }, [roomCode]);

  const handleCopyCode = () => {
    sound.playClick();
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    sound.playClick();
    onSendTeacherAction('broadcast', { message: broadcastText.trim() });
    setBroadcastText('');
    setBroadcastSuccess(true);
    setTimeout(() => setBroadcastSuccess(false), 3000);
  };

  const handleToggleSubject = (s: Subject) => {
    sound.playClick();
    setSelectedSubjects((prev) => {
      if (prev.includes(s)) {
        if (prev.length === 1) return prev; // keep at least 1
        return prev.filter((item) => item !== s);
      } else {
        return [...prev, s];
      }
    });
  };

  const handleSelectAllSubjects = () => {
    sound.playClick();
    setSelectedSubjects(['matematika', 'ipas', 'bahasa_indonesia', 'pancasila', 'pjok', 'seni_budaya']);
  };

  const handleApplyArenaSettings = () => {
    sound.playClick();
    onSendTeacherAction('update_settings', {
      arena: selectedArena,
      chestCount,
      timeLimitSeconds: durationMinutes * 60,
      selectedSubjects,
    });
    setSettingsSavedSuccess(true);
    setTimeout(() => setSettingsSavedSuccess(false), 3000);
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qTitle || !qText || !qOptA || !qOptB || !qOptC || !qOptD) return;
    setQSubmitting(true);
    sound.playClick();

    const points = DIFFICULTY_POINTS[qDifficulty].points;

    const success = await onAddCustomQuestion({
      subject: qSubject,
      title: qTitle,
      question: qText,
      type: 'mcq',
      options: [qOptA, qOptB, qOptC, qOptD],
      correctIndex: qCorrectIdx,
      explanation: qExplanation || 'Pertanyaan dibuat oleh Guru Kelas.',
      points,
      gradeLevel: qGrade,
      difficulty: qDifficulty,
    });

    setQSubmitting(false);
    if (success) {
      setQSuccess(true);
      setQTitle('');
      setQText('');
      setQOptA('');
      setQOptB('');
      setQOptC('');
      setQOptD('');
      setQExplanation('');
      setTimeout(() => setQSuccess(false), 3000);
    }
  };

  const players = room ? Object.values(room.players) : [];
  const status = room?.status || 'playing';
  const remainingSecs = room?.remainingSeconds || 0;
  const remMinutes = Math.floor(remainingSecs / 60);
  const remSeconds = remainingSecs % 60;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col select-none">
      {/* Top Navbar */}
      <header className="bg-slate-900/90 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              sound.playClick();
              onBackToTitle();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Menu Utama</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-amber-400" />
              <h1 className="text-lg font-bold text-white">
                Dashboard Guru: {room?.title || `Room ${roomCode}`}
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Pengajar: {room?.teacherName || 'Bapak/Ibu Guru'} · Arena: <span className="text-amber-400 font-semibold">{ARENAS[room?.arena || 'kampus'].name}</span>
            </p>
          </div>
        </div>

        {/* Room Code & Timer Pill */}
        <div className="flex items-center gap-3">
          {/* Match Timer Pill */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-800 border border-slate-700 px-3.5 py-1.5 rounded-xl">
            <Clock className={`w-4 h-4 ${remainingSecs < 60 ? 'text-rose-400 animate-spin' : 'text-blue-400'}`} />
            <span className="text-xs text-slate-400 font-medium">SISA WAKTU:</span>
            <span className={`font-mono text-sm font-bold ${remainingSecs < 60 ? 'text-rose-400' : 'text-white'}`}>
              {remMinutes}:{remSeconds < 10 ? `0${remSeconds}` : remSeconds}
            </span>
          </div>

          <div className="bg-slate-800 border border-slate-700 px-3.5 py-1.5 rounded-xl flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">KODE:</span>
            <span className="font-pixel text-amber-400 text-sm font-bold tracking-wider">
              {roomCode}
            </span>
            <button
              onClick={handleCopyCode}
              className="ml-1 p-1 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
              title="Salin Kode Room"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 bg-blue-950/60 border border-blue-500/40 px-3 py-1.5 rounded-xl text-blue-300 text-xs font-semibold">
            <Users className="w-4 h-4" />
            <span>{players.length} Siswa</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">
        {/* Quick Game Controller Action Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Status Pertandingan:
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              status === 'playing' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' :
              status === 'paused' ? 'bg-amber-950 text-amber-400 border border-amber-500/40' :
              'bg-slate-800 text-slate-300'
            }`}>
              {status === 'playing' ? '🟢 BERLANGSUNG' : status === 'paused' ? '⏸️ DIJEDA' : '🏁 SELESAI'}
            </span>
          </div>

          {/* Quick Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {status !== 'playing' ? (
              <button
                onClick={() => {
                  sound.playClick();
                  onSendTeacherAction('resume_game');
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Mulai / Lanjutkan Ronde</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  sound.playClick();
                  onSendTeacherAction('pause_game');
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition cursor-pointer"
              >
                <Pause className="w-4 h-4" />
                <span>Jeda Pertandingan</span>
              </button>
            )}

            <button
              onClick={() => {
                sound.playClick();
                onSendTeacherAction('add_time', { seconds: 300 });
              }}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition cursor-pointer"
              title="Tambah 5 menit ke ronde yang sedang berjalan"
            >
              <Clock className="w-4 h-4" />
              <span>+5 Menit Waktu</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onSendTeacherAction('reset_chests');
              }}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset & Sebar Peti</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onSendTeacherAction('end_game');
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 shadow transition cursor-pointer"
            >
              <span>Akhiri Ronde</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
          {[
            { id: 'arena', label: 'Pilih Arena & Match', icon: Compass },
            { id: 'monitor', label: 'Pantau Siswa Live', icon: Users },
            { id: 'analytics', label: 'Analitik & Hasil Belajar', icon: BarChart3 },
            { id: 'questions', label: 'Tambah Soal Guru', icon: PlusCircle },
            { id: 'controls', label: 'Pengumuman Siaran', icon: Radio },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  sound.playClick();
                  setActiveTab(tab.id as typeof activeTab);
                }}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: PILIH ARENA, DURASI WAKTU, MAPEL & JUMLAH SOAL */}
        {activeTab === 'arena' && (
          <div className="space-y-6">
            {settingsSavedSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Pengaturan arena, durasi waktu bertanding, mata pelajaran, dan peti soal berhasil diperbarui & diterapkan langsung ke semua layar siswa!</span>
              </div>
            )}

            {/* 1. ARENA SELECTION CARDS */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Compass className="w-5 h-5 text-amber-400" />
                    <span>1. Pilih Suasana Arena Bertanding</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Pilih suasana peta yang berbeda untuk memberikan pengalaman petualangan baru yang seru bagi siswa!
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(Object.keys(ARENAS) as ArenaType[]).map((aKey) => {
                  const meta = ARENAS[aKey];
                  const isSelected = selectedArena === aKey;

                  return (
                    <div
                      key={aKey}
                      onClick={() => {
                        sound.playClick();
                        setSelectedArena(aKey);
                      }}
                      className={`relative flex flex-col justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-950/50 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.35)] ring-2 ring-blue-500/30'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      {/* Top Tag */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-200">
                            {meta.badge}
                          </span>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                              ✓
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-sm text-white mb-1">
                          {meta.name}
                        </h4>
                        <span className="text-[11px] text-amber-400 font-medium block mb-2">
                          {meta.subtitle}
                        </span>

                        <p className="text-xs text-slate-400 leading-relaxed mb-4">
                          {meta.description}
                        </p>
                      </div>

                      {/* Mini Color Swatch */}
                      <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: meta.groundColor }} />
                        <span>{meta.themeStyle}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. MATCH DURATION & CHEST COUNT CONTROLLER */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Duration Setting */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <h3 className="text-base font-bold text-white">2. Durasi Waktu Bertanding</h3>
                </div>
                <p className="text-xs text-slate-400">
                  Tentukan berapa lama waktu siswa dapat menjelajah dan mengumpulkan skor di arena.
                </p>

                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 20].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setDurationMinutes(mins);
                      }}
                      className={`py-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        durationMinutes === mins
                          ? 'bg-blue-600 border-blue-400 text-white shadow-md'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {mins} Menit
                    </button>
                  ))}
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <span className="text-xs text-slate-400">Atau geser custom:</span>
                  <input
                    type="range"
                    min={3}
                    max={30}
                    step={1}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="flex-1 accent-blue-500 cursor-pointer"
                  />
                  <span className="font-mono font-bold text-amber-400 text-sm w-16 text-right">
                    {durationMinutes} Menit
                  </span>
                </div>
              </div>

              {/* Chest Count Setting */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white">3. Jumlah Kotak Soal yang Disebar</h3>
                </div>
                <p className="text-xs text-slate-400">
                  Berapa banyak kotak pertanyaan yang tersebar di map untuk diperebutkan siswa.
                </p>

                <div className="grid grid-cols-4 gap-2">
                  {[10, 15, 20, 30].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setChestCount(cnt);
                      }}
                      className={`py-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        chestCount === cnt
                          ? 'bg-amber-600 border-amber-400 text-white shadow-md'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {cnt} Peti
                    </button>
                  ))}
                </div>

                {/* Difficulty breakdown legend */}
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <span className="font-bold text-amber-400 block">Distribusi Poin Peti Otomatis:</span>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-emerald-400">🟢 40% Peti Mudah (+50 Poin)</span>
                    <span className="flex items-center gap-1.5 text-blue-400">🔵 40% Peti Sedang (+100 Poin)</span>
                    <span className="flex items-center gap-1.5 text-amber-400">🔴 20% Peti Sulit (+200 Poin)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. SUBJECT FILTER SELECTOR */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-emerald-400" />
                    <span>4. Tentukan Mata Pelajaran yang Dimainkan</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Pilih mata pelajaran yang ingin diujikan dalam pertandingan ini.
                  </p>
                </div>

                <button
                  onClick={handleSelectAllSubjects}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Pilih Semua Mapel
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {(Object.keys(SUBJECTS) as Subject[]).map((subj) => {
                  const sMeta = SUBJECTS[subj];
                  const isChecked = selectedSubjects.includes(subj);

                  return (
                    <button
                      key={subj}
                      type="button"
                      onClick={() => handleToggleSubject(subj)}
                      className={`p-3.5 rounded-2xl border-2 flex flex-col items-center text-center gap-2 transition cursor-pointer ${
                        isChecked
                          ? 'border-blue-500 bg-blue-950/40 text-white shadow-md'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs"
                        style={{ backgroundColor: `${sMeta.color}30`, color: sMeta.color }}
                      >
                        {sMeta.shortName}
                      </div>
                      <span className="font-bold text-xs leading-snug">
                        {sMeta.name}
                      </span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                        isChecked ? 'bg-blue-600/40 text-blue-200' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {isChecked ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* APPLY SETTINGS BUTTON */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleApplyArenaSettings}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 border border-blue-400 text-white font-bold text-base shadow-[0_8px_24px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2 active:scale-98 transition cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Terapkan Pengaturan Arena & Sebar Soal Sekarang</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE STUDENT MONITOR */}
        {activeTab === 'monitor' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white">Siswa Sedang Bermain di Arena ({players.length})</h3>
                <p className="text-xs text-slate-400">Pantau posisi, perolehan poin, lencana, dan streak jawaban benar siswa secara langsung.</p>
              </div>
            </div>

            {players.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-40 text-blue-400" />
                <p className="font-semibold text-slate-300">Belum ada siswa yang masuk ke room ini.</p>
                <p className="text-xs text-slate-500 mt-1">Bagikan kode kelas <span className="text-amber-400 font-bold">{roomCode}</span> kepada murid-murid Anda!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {players.map((p) => {
                  const accuracy = p.answeredQuestionsCount > 0 ? Math.round((p.correctCount / p.answeredQuestionsCount) * 100) : 0;
                  return (
                    <div
                      key={p.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md hover:border-slate-700 transition"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-blue-950 border border-blue-500/40 flex items-center justify-center font-bold text-blue-300 text-sm">
                            {p.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-white flex items-center gap-1.5">
                              <span>{p.name}</span>
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono font-bold">
                                Lv.{p.level}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              Posisi: X:{p.x} Y:{p.y}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-pixel text-amber-400 text-sm font-bold">
                            {p.score}
                          </div>
                          <span className="text-[10px] text-slate-400">POIN</span>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Akurasi</span>
                          <span className="font-bold text-emerald-400">{accuracy}%</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Terjawab</span>
                          <span className="font-bold text-white">{p.correctCount}/{p.answeredQuestionsCount}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Streak</span>
                          <span className="font-bold text-amber-400">{p.currentStreak}x</span>
                        </div>
                      </div>

                      {/* Badges */}
                      {p.badges.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {p.badges.map((b, i) => (
                            <span key={i} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700 flex items-center gap-1">
                              🏅 {b}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ANALYTICS & LEARNING REPORT */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Overview Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <span className="text-xs text-slate-400 font-semibold block mb-1">Rata-rata Skor Kelas</span>
                <span className="text-2xl font-bold text-amber-400 font-pixel">
                  {analytics?.averageScore || 0}
                </span>
                <span className="text-xs text-slate-500 block mt-1">Poin per siswa</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <span className="text-xs text-slate-400 font-semibold block mb-1">Tingkat Akurasi Kelas</span>
                <span className="text-2xl font-bold text-emerald-400 font-pixel">
                  {analytics?.overallAccuracy || 0}%
                </span>
                <span className="text-xs text-slate-500 block mt-1">Pemahaman materi</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <span className="text-xs text-slate-400 font-semibold block mb-1">Total Soal Terjawab</span>
                <span className="text-2xl font-bold text-blue-400 font-pixel">
                  {analytics?.totalAnswered || 0}
                </span>
                <span className="text-xs text-slate-500 block mt-1">Interaksi kuis aktif</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <span className="text-xs text-slate-400 font-semibold block mb-1">Total Siswa Aktif</span>
                <span className="text-2xl font-bold text-purple-400 font-pixel">
                  {analytics?.totalStudents || 0}
                </span>
                <span className="text-xs text-slate-500 block mt-1">Dalam room {roomCode}</span>
              </div>
            </div>

            {/* Subject Mastery Breakdown */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                <span>Penguasaan Materi per Mata Pelajaran</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(Object.keys(SUBJECTS) as Subject[]).map((subj) => {
                  const sMeta = SUBJECTS[subj];
                  const data = analytics?.subjectBreakdown?.[subj] || { correct: 0, total: 0 };
                  const percent = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;

                  return (
                    <div key={subj} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-slate-200">
                          {sMeta.name}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                          {data.correct} dari {data.total} benar ({percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: sMeta.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Incoming Answer Feed */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <span>Aliran Jawaban Siswa Terbaru (Real-time Stream)</span>
              </h3>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {!analytics?.recentAnswers || analytics.recentAnswers.length === 0 ? (
                  <p className="text-slate-500 text-xs py-4 text-center">Belum ada jawaban siswa yang tercatat.</p>
                ) : (
                  analytics.recentAnswers.map((ans) => (
                    <div
                      key={ans.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          ans.isCorrect ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'bg-rose-950 text-rose-400 border border-rose-500/40'
                        }`}>
                          {ans.isCorrect ? 'BENAR' : 'SALAH'}
                        </span>
                        <div>
                          <span className="font-bold text-white">{ans.studentName}</span>
                          <span className="text-slate-400 mx-2">menjawab</span>
                          <span className="text-slate-300 font-medium">"{ans.questionTitle}"</span>
                        </div>
                      </div>
                      <div className="text-right text-slate-400">
                        {ans.isCorrect ? `+${ans.pointsEarned} Poin` : '0 Poin'} · {(ans.answerTimeMs / 1000).toFixed(1)}s
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CREATE CUSTOM QUESTION */}
        {activeTab === 'questions' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg max-w-3xl">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-400" />
                <span>Tambah Pertanyaan Kuis Baru untuk Siswa</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Soal ini akan langsung masuk ke rotasi peti misteri dan bangunan edukasi di map game!
              </p>
            </div>

            {qSuccess && (
              <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Soal berhasil ditambahkan ke bank soal dan disebarkan ke arena!</span>
              </div>
            )}

            <form onSubmit={handleCreateQuestion} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mata Pelajaran
                  </label>
                  <select
                    value={qSubject}
                    onChange={(e) => setQSubject(e.target.value as Subject)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    {(Object.keys(SUBJECTS) as Subject[]).map((s) => (
                      <option key={s} value={s}>
                        {SUBJECTS[s].name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tingkat Kesulitan & Poin
                  </label>
                  <select
                    value={qDifficulty}
                    onChange={(e) => setQDifficulty(e.target.value as QuestionDifficulty)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-amber-400 font-bold text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="mudah">🟢 Mudah (+50 Poin)</option>
                    <option value="sedang">🔵 Sedang (+100 Poin)</option>
                    <option value="sulit">🔴 Sulit / HOTS (+200 Poin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tingkat Kelas SD
                  </label>
                  <select
                    value={qGrade}
                    onChange={(e) => setQGrade(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    {[1, 2, 3, 4, 5, 6].map((g) => (
                      <option key={g} value={g}>
                        Kelas {g} SD
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Judul Materi / Topik Soal
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Operasi Pecahan Campuran"
                  value={qTitle}
                  onChange={(e) => setQTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Isi Pertanyaan
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ketik pertanyaan yang jelas untuk siswa..."
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* 4 Options & Correct Answer Radio */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300">
                  Pilihan Jawaban (Tandai lingkaran untuk jawaban yang benar):
                </label>

                {[
                  { label: 'A', val: qOptA, set: setQOptA, idx: 0 },
                  { label: 'B', val: qOptB, set: setQOptB, idx: 1 },
                  { label: 'C', val: qOptC, set: setQOptC, idx: 2 },
                  { label: 'D', val: qOptD, set: setQOptD, idx: 3 },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="correctIdx"
                      checked={qCorrectIdx === item.idx}
                      onChange={() => setQCorrectIdx(item.idx)}
                      className="w-4 h-4 text-emerald-500 cursor-pointer"
                    />
                    <span className="w-6 font-bold text-sm text-slate-300">{item.label}.</span>
                    <input
                      type="text"
                      required
                      placeholder={`Pilihan ${item.label}`}
                      value={item.val}
                      onChange={(e) => item.set(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Pembahasan Edukatif (Mengapa jawaban tersebut benar?)
                </label>
                <textarea
                  rows={2}
                  placeholder="Berikan penjelasan ramah anak agar murid yang salah dapat belajar..."
                  value={qExplanation}
                  onChange={(e) => setQExplanation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={qSubmitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-md transition cursor-pointer"
              >
                {qSubmitting ? 'Menyimpan...' : 'Simpan & Terbitkan Soal ke Game'}
              </button>
            </form>
          </div>
        )}

        {/* TAB 5: TEACHER ANNOUNCEMENT & CLASSROOM CONTROLS */}
        {activeTab === 'controls' && (
          <div className="space-y-6 max-w-2xl">
            {/* Broadcast Banner Announcement */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <Radio className="w-5 h-5 text-amber-400" />
                <span>Siarkan Pengumuman Guru (Broadcast Banner)</span>
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Pesan ini akan langsung muncul sebagai banner animasi di atas layar permainan semua siswa!
              </p>

              {broadcastSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-semibold">
                  Pengumuman telah disiarkan ke semua layar siswa!
                </div>
              )}

              <form onSubmit={handleBroadcast} className="flex gap-2">
                <input
                  type="text"
                  maxLength={100}
                  placeholder="Contoh: Ayo kumpul di Museum Pancasila untuk tantangan kelompok!"
                  value={broadcastText}
                  onChange={(e) => setBroadcastText(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
