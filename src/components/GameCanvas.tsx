import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../game/GameRenderer';
import { 
  ARENAS,
  ArenaType,
  ChatMessage, 
  GameRoom, 
  InteractiveBuilding, 
  Player, 
  Question, 
  QuestionChest 
} from '../types/game';
import { ARENA_BUILDINGS, BUILDINGS } from '../game/MapData';
import { sound } from '../utils/sound';
import { 
  Trophy, 
  Coins, 
  Flame, 
  Volume2, 
  VolumeX, 
  LogOut, 
  Sparkles, 
  Radio, 
  MessageSquare,
  HelpCircle,
  Users,
  Gamepad2,
  Clock,
  Compass
} from 'lucide-react';
import { MobileJoystick } from './MobileJoystick';
import { ChatOverlay } from './ChatOverlay';

interface GameCanvasProps {
  localPlayer: Player;
  players: Record<string, Player>;
  chests: QuestionChest[];
  roomCode: string;
  arena?: ArenaType;
  remainingSeconds?: number;
  timeLimitSeconds?: number;
  buildings?: InteractiveBuilding[];
  isSolo?: boolean;
  announcement?: string;
  chatMessages: ChatMessage[];
  onPlayerMove: (x: number, y: number, dir: 'down' | 'up' | 'left' | 'right', isMoving: boolean) => void;
  onInteractChest: (chest: QuestionChest) => void;
  onInteractBuilding: (building: InteractiveBuilding) => void;
  onSendMessage: (text: string) => void;
  onOpenLeaderboard: () => void;
  onLeaveGame: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  localPlayer,
  players,
  chests,
  roomCode,
  arena = 'kampus',
  remainingSeconds = 600,
  timeLimitSeconds = 600,
  buildings,
  isSolo = false,
  announcement,
  chatMessages,
  onPlayerMove,
  onInteractChest,
  onInteractBuilding,
  onSendMessage,
  onOpenLeaderboard,
  onLeaveGame,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [muted, setMuted] = useState(sound.isMuted());
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [showVirtualControls, setShowVirtualControls] = useState(false);
  const [chatBubbles, setChatBubbles] = useState<Record<string, { text: string; expiresAt: number }>>({});
  const [interactPromptText, setInteractPromptText] = useState<string | null>(null);

  // Detect touch device and enable virtual controls by default on touch
  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(isTouch);
    if (isTouch) {
      setShowVirtualControls(true);
    }
  }, []);

  // Update speech bubbles when chat arrives
  useEffect(() => {
    if (chatMessages.length === 0) return;
    const latest = chatMessages[chatMessages.length - 1];
    setChatBubbles((prev) => ({
      ...prev,
      [latest.senderId]: { text: latest.text, expiresAt: Date.now() + 5000 },
    }));
  }, [chatMessages]);

  // Mount canvas and initialize isolated game engine loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Immediately focus canvas so keyboard input works right away
    canvas.focus();

    const engine = new GameEngine(canvas, {
      arena,
      localPlayer,
      players,
      chests,
      buildings: buildings || ARENA_BUILDINGS[arena] || BUILDINGS,
      chatBubbles,
      onInteractChest,
      onInteractBuilding,
      onPlayerMove,
    });

    engineRef.current = engine;
    engine.start();

    // Check interaction prompt every 100ms
    const promptCheckInterval = setInterval(() => {
      if (engine.currentInteractable) {
        const item = engine.currentInteractable;
        if (item.type === 'chest') {
          const c = item.data as QuestionChest;
          const pts = c.points || (c.difficulty === 'sulit' ? 200 : c.difficulty === 'mudah' ? 50 : 100);
          setInteractPromptText(`Buka Peti (+${pts} Poin)`);
        } else {
          setInteractPromptText(`Masuk ${(item.data as InteractiveBuilding).name}`);
        }
      } else {
        setInteractPromptText(null);
      }
    }, 100);

    return () => {
      clearInterval(promptCheckInterval);
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Sync external state updates to the running game engine without re-mounting
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateState({
        arena,
        localPlayer,
        players,
        chests,
        buildings: buildings || ARENA_BUILDINGS[arena] || BUILDINGS,
        chatBubbles,
      });
    }
  }, [arena, localPlayer, players, chests, buildings, chatBubbles]);

  const handleToggleMute = () => {
    const isMute = sound.toggleMute();
    setMuted(isMute);
    if (!isMute) sound.playClick();
  };

  const handleMobileMove = (vec: { x: number; y: number } | null) => {
    if (engineRef.current) {
      engineRef.current.setVirtualJoystick(vec);
    }
  };

  const handleMobileInteract = () => {
    if (engineRef.current) {
      engineRef.current.triggerInteract();
    }
  };

  // XP calculation
  const currentLevelMinXp = (localPlayer.level - 1) * 300;
  const nextLevelXp = localPlayer.level * 300;
  const currentXpProgress = Math.max(0, localPlayer.xp - currentLevelMinXp);
  const xpPercent = Math.min(100, Math.round((currentXpProgress / 300) * 100));

  const totalPlayersCount = Object.keys(players).length + 1;
  const minutes = Math.floor(Math.max(0, remainingSeconds) / 60);
  const seconds = Math.max(0, remainingSeconds) % 60;
  const formattedTimer = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const arenaMeta = ARENAS[arena] || ARENAS.kampus;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 select-none">
      {/* Isolated 2D Canvas Viewport */}
      <canvas
        ref={canvasRef}
        tabIndex={0}
        onClick={() => canvasRef.current?.focus()}
        className="absolute inset-0 w-full h-full block focus:outline-none cursor-crosshair"
      />

      {/* Low-Occlusion HUD Overlay (<15% screen coverage, pointer-events-none by default) */}
      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4">
        {/* TOP PERIMETER HUD BAR */}
        <div className="flex items-start justify-between w-full">
          {/* Top-Left: Player Stats Cluster */}
          <div className="pointer-events-auto flex items-center gap-3 bg-slate-900/85 border border-slate-700/80 p-2.5 rounded-2xl shadow-xl backdrop-blur-sm">
            {/* Level Avatar Seal */}
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-b from-blue-500 to-indigo-700 border-2 border-blue-300 text-white font-bold shadow-md">
              <span className="font-pixel text-xs">{localPlayer.level}</span>
              <span className="absolute -bottom-1 -right-1 text-[8px] font-bold bg-amber-500 text-slate-950 px-1 rounded-full border border-slate-900">
                LV
              </span>
            </div>

            {/* Name, XP Bar, Streak */}
            <div className="flex flex-col gap-1 min-w-[120px] sm:min-w-[150px]">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white truncate max-w-[100px]">
                  {localPlayer.name}
                </span>
                {localPlayer.currentStreak > 1 && (
                  <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-500/40 px-1.5 py-0.2 rounded-md">
                    <Flame className="w-3 h-3 fill-current text-amber-500" />
                    <span>{localPlayer.currentStreak}x</span>
                  </span>
                )}
              </div>

              {/* XP Progress Bar */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700/60">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-300"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>XP {localPlayer.xp}</span>
                <span>{xpPercent}%</span>
              </div>
            </div>
          </div>

          {/* Top-Center: Match Duration Timer, Arena Badge & Announcement */}
          <div className="flex flex-col items-center gap-1.5 pointer-events-auto">
            {announcement && (
              <div className="flex items-center gap-2 bg-amber-500/90 text-slate-950 px-4 py-1.5 rounded-full font-bold text-xs shadow-lg animate-bounce">
                <Radio className="w-4 h-4 animate-pulse" />
                <span>PENGUMUMAN GURU: {announcement}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              {/* Arena Badge */}
              <div className="flex items-center gap-1.5 bg-slate-900/85 border border-slate-700/80 px-3 py-1 rounded-full text-xs text-white backdrop-blur-sm shadow-md">
                <span className="text-sm leading-none">{arenaMeta.badge}</span>
                <span className="font-bold text-amber-300 hidden md:inline">{arenaMeta.name}</span>
              </div>

              {/* Countdown Timer */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold backdrop-blur-sm shadow-md border ${
                  remainingSeconds <= 60
                    ? 'bg-rose-950/90 border-rose-500 text-rose-300 animate-pulse'
                    : 'bg-slate-900/85 border-slate-700/80 text-emerald-400'
                }`}
                title="Sisa Waktu Pertandingan"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{formattedTimer}</span>
              </div>

              {/* Room Code */}
              <div className="hidden sm:flex items-center gap-2 bg-slate-900/80 border border-slate-700/80 px-3 py-1 rounded-full text-xs text-slate-300 backdrop-blur-sm shadow-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold">{isSolo ? 'Mode Solo' : `Room: ${roomCode}`}</span>
                {!isSolo && (
                  <span className="text-slate-500">· {totalPlayersCount} Pemain</span>
                )}
              </div>
            </div>
          </div>

          {/* Top-Right: Score Cluster & Controls */}
          <div className="pointer-events-auto flex items-center gap-2">
            {/* Score Pill */}
            <div className="flex items-center gap-2 bg-slate-900/85 border border-slate-700/80 px-3.5 py-2 rounded-2xl shadow-xl backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 leading-none">SKOR</span>
                <span className="font-pixel text-amber-400 text-sm md:text-base font-bold tabular-nums leading-tight">
                  {localPlayer.score}
                </span>
              </div>
            </div>

            {/* Coins Pill */}
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/85 border border-slate-700/80 px-3 py-2 rounded-2xl shadow-xl backdrop-blur-sm text-yellow-400">
              <Coins className="w-4 h-4" />
              <span className="font-mono font-bold text-xs tabular-nums text-slate-200">
                {localPlayer.coins}
              </span>
            </div>

            {/* Leaderboard Button */}
            <button
              onClick={() => {
                sound.playClick();
                onOpenLeaderboard();
              }}
              className="p-2.5 rounded-2xl bg-slate-900/85 hover:bg-slate-800 border border-slate-700 text-amber-400 hover:text-amber-300 shadow-xl backdrop-blur-sm transition cursor-pointer"
              title="Buka Papan Peringkat"
            >
              <Trophy className="w-4 h-4" />
            </button>

            {/* Virtual Joystick Toggle Button */}
            <button
              onClick={() => {
                sound.playClick();
                setShowVirtualControls((prev) => !prev);
              }}
              className={`p-2.5 rounded-2xl border shadow-xl backdrop-blur-sm transition cursor-pointer ${
                showVirtualControls
                  ? 'bg-blue-600 border-blue-400 text-white shadow-blue-500/40'
                  : 'bg-slate-900/85 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Aktifkan/Sembunyikan Joystick Layar (Sentuh/Mouse)"
            >
              <Gamepad2 className="w-4 h-4" />
            </button>

            {/* Sound Mute Toggle */}
            <button
              onClick={handleToggleMute}
              className="p-2.5 rounded-2xl bg-slate-900/85 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white shadow-xl backdrop-blur-sm transition cursor-pointer"
              title={muted ? 'Aktifkan Suara' : 'Bisukan Suara'}
            >
              {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Exit Button */}
            <button
              onClick={() => {
                sound.playClick();
                onLeaveGame();
              }}
              className="p-2.5 rounded-2xl bg-slate-900/85 hover:bg-rose-950/80 border border-slate-700 hover:border-rose-600 text-slate-400 hover:text-rose-400 shadow-xl backdrop-blur-sm transition cursor-pointer"
              title="Keluar ke Menu"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* BOTTOM PERIMETER: Interactive Prompt & Controls */}
        <div className="flex items-end justify-between w-full">
          {/* Chat Overlay (Left) */}
          <ChatOverlay
            messages={chatMessages}
            onSendMessage={onSendMessage}
          />

          {/* Center: Desktop Controls Hint */}
          <div className="hidden md:flex items-center gap-3 bg-slate-900/80 border border-slate-700/80 px-4 py-1.5 rounded-full text-xs text-slate-300 backdrop-blur-sm shadow-lg mx-auto">
            <span className="font-mono text-amber-400 font-bold">[WASD / Panah]</span> Bergerak
            <span className="text-slate-600">·</span>
            <span className="font-mono text-amber-400 font-bold">[E / Spasi]</span> Interaksi
          </div>

          {/* Right: Dummy spacer for balance */}
          <div className="w-10" />
        </div>
      </div>

      {/* Virtual Joystick & Action Button (Active on touch devices or toggled via Gamepad button) */}
      {showVirtualControls && (
        <MobileJoystick
          onMove={handleMobileMove}
          onInteract={handleMobileInteract}
          canInteract={Boolean(interactPromptText)}
          interactLabel={interactPromptText || 'AKSI'}
        />
      )}
    </div>
  );
};
