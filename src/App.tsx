import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  ArenaType,
  AvatarConfig, 
  ChatMessage, 
  GameRoom, 
  InteractiveBuilding, 
  Player, 
  Question, 
  QuestionChest, 
  QuestionDifficulty,
  Subject 
} from './types/game';
import { TitleScreen } from './components/TitleScreen';
import { AvatarCustomizerModal } from './components/AvatarCustomizerModal';
import { GameCanvas } from './components/GameCanvas';
import { QuizModal } from './components/QuizModal';
import { BuildingModal } from './components/BuildingModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { TeacherDashboard } from './components/TeacherDashboard';
import { INITIAL_QUESTIONS } from './data/questions';
import { INITIAL_CHESTS, BUILDINGS, ARENA_BUILDINGS, generateChests } from './game/MapData';
import { COLOR_PALETTES } from './game/AvatarRenderer';
import { sound } from './utils/sound';

type AppView = 'title' | 'avatar_custom' | 'game' | 'teacher_dashboard';

export default function App() {
  const [view, setView] = useState<AppView>('title');
  const [roomCode, setRoomCode] = useState('SD-JUARA');
  const [isSoloMode, setIsSoloMode] = useState(false);

  // Local Player
  const [localPlayer, setLocalPlayer] = useState<Player>({
    id: `student-${Math.random().toString(36).substring(2, 8)}`,
    socketId: '',
    name: 'Budi Juara',
    role: 'student',
    roomId: 'SD-JUARA',
    avatar: {
      gender: 'boy',
      skinColor: COLOR_PALETTES.skin[0],
      hairStyle: 'short',
      hairColor: COLOR_PALETTES.hair[0],
      outfit: 'sd_uniform',
      accessory: 'none',
      hat: 'sd_cap',
    },
    x: 1200,
    y: 930,
    dir: 'down',
    isMoving: false,
    score: 0,
    xp: 0,
    level: 1,
    coins: 50,
    badges: ['Petualang Pemula'],
    answeredQuestionsCount: 0,
    correctCount: 0,
    currentStreak: 0,
    bestStreak: 0,
    lastActive: Date.now(),
  });

  // Multiplayer Room State
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [remotePlayers, setRemotePlayers] = useState<Record<string, Player>>({});
  const [chests, setChests] = useState<QuestionChest[]>(() =>
    INITIAL_CHESTS.map((c, i) => ({
      ...c,
      questionId: INITIAL_QUESTIONS[i % INITIAL_QUESTIONS.length].id,
      isOpened: false,
    }))
  );
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [announcement, setAnnouncement] = useState<string>('');

  // Solo Mode state
  const [soloArena, setSoloArena] = useState<ArenaType>('kampus');
  const [soloRemainingSeconds, setSoloRemainingSeconds] = useState(600);

  // Modals
  const [activeQuizQuestion, setActiveQuizQuestion] = useState<{
    question: Question;
    chestId?: string;
    chestPoints?: number;
    chestDifficulty?: QuestionDifficulty;
  } | null>(null);
  const [activeBuilding, setActiveBuilding] = useState<InteractiveBuilding | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Solo countdown ticker
  useEffect(() => {
    if (!isSoloMode || view !== 'game') return;
    const timer = setInterval(() => {
      setSoloRemainingSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isSoloMode, view]);

  // Socket reference
  const socketRef = useRef<Socket | null>(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    const socket = io({
      autoConnect: true,
      reconnectionAttempts: 10,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('room_joined', ({ room: joinedRoom }: { room: GameRoom }) => {
      setRoom(joinedRoom);
      setChests(joinedRoom.chests);
      // Remove self from remote players map
      const others = { ...joinedRoom.players };
      delete others[localPlayer.id];
      setRemotePlayers(others);
    });

    socket.on('player_joined', (player: Player) => {
      setRemotePlayers((prev) => ({
        ...prev,
        [player.id]: player,
      }));
    });

    socket.on('player_moved', (data: { id: string; x: number; y: number; dir: 'down' | 'up' | 'left' | 'right'; isMoving: boolean }) => {
      setRemotePlayers((prev) => {
        const target = prev[data.id];
        if (!target) return prev;
        return {
          ...prev,
          [data.id]: {
            ...target,
            x: data.x,
            y: data.y,
            dir: data.dir,
            isMoving: data.isMoving,
          },
        };
      });
    });

    socket.on('player_updated', (updatedPlayer: Player) => {
      if (updatedPlayer.id === localPlayer.id) {
        setLocalPlayer(updatedPlayer);
      } else {
        setRemotePlayers((prev) => ({
          ...prev,
          [updatedPlayer.id]: updatedPlayer,
        }));
      }
    });

    socket.on('player_left', ({ id }: { id: string }) => {
      setRemotePlayers((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    });

    socket.on('chest_updated', ({ chestId, isOpened, openedByName }: { chestId: string; isOpened: boolean; openedByName: string }) => {
      setChests((prev) =>
        prev.map((c) => (c.id === chestId ? { ...c, isOpened, openedByName } : c))
      );
    });

    socket.on('chests_sync', (syncedChests: QuestionChest[]) => {
      setChests(syncedChests);
    });

    socket.on('chests_reset', (resetChests: QuestionChest[]) => {
      setChests(resetChests);
    });

    socket.on('arena_changed', ({ arena, chests }: { arena: ArenaType; chests: QuestionChest[] }) => {
      setRoom((prev) => prev ? { ...prev, arena, chests } : prev);
      setChests(chests);
      sound.playLevelUp();
    });

    socket.on('timer_sync', ({ remainingSeconds, timeLimitSeconds }: { remainingSeconds: number; timeLimitSeconds: number }) => {
      setRoom((prev) => prev ? { ...prev, remainingSeconds, timeLimitSeconds } : prev);
    });

    socket.on('room_settings_updated', (data: Partial<GameRoom>) => {
      setRoom((prev) => prev ? { ...prev, ...data } : prev);
      if (data.chests) setChests(data.chests);
      sound.playLevelUp();
    });

    socket.on('open_question_modal', ({ chestId, question, chestPoints, chestDifficulty }: {
      chestId: string;
      question: Question;
      chestPoints?: number;
      chestDifficulty?: QuestionDifficulty;
    }) => {
      setActiveQuizQuestion({ question, chestId, chestPoints, chestDifficulty });
    });

    socket.on('chat_message', (msg: ChatMessage) => {
      setChatMessages((prev) => [...prev.slice(-30), msg]);
    });

    socket.on('teacher_announcement', ({ message }: { message: string }) => {
      setAnnouncement(message);
      setTimeout(() => setAnnouncement(''), 10000);
    });

    return () => {
      socket.disconnect();
    };
  }, [localPlayer.id]);

  // Handlers for starting modes
  const handleStartStudent = () => {
    setIsSoloMode(false);
    setView('avatar_custom');
  };

  const handleStartTeacher = () => {
    setView('teacher_dashboard');
  };

  const handleStartSolo = () => {
    setIsSoloMode(true);
    setSoloArena('kampus');
    setSoloRemainingSeconds(600);
    const rawChests = generateChests(20, 'all');
    const soloChests: QuestionChest[] = rawChests.map((c, i) => ({
      ...c,
      questionId: INITIAL_QUESTIONS[i % INITIAL_QUESTIONS.length].id,
      isOpened: false,
    }));
    setChests(soloChests);
    setView('game');
  };

  const handleJoinGameWithAvatar = (name: string, avatar: AvatarConfig, targetRoomCode: string) => {
    const updated = {
      ...localPlayer,
      name,
      avatar,
      roomId: targetRoomCode,
    };
    setLocalPlayer(updated);
    setRoomCode(targetRoomCode);

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('join_room', {
        roomCode: targetRoomCode,
        player: updated,
      });
    }

    setView('game');
  };

  // Movement handler emitted from GameEngine
  const handlePlayerMove = (x: number, y: number, dir: 'down' | 'up' | 'left' | 'right', isMoving: boolean) => {
    setLocalPlayer((prev) => ({ ...prev, x, y, dir, isMoving }));
    if (!isSoloMode && socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('player_move', { x, y, dir, isMoving });
    }
  };

  // Chest interaction
  const handleInteractChest = (chest: QuestionChest) => {
    if (isSoloMode) {
      // Pick question locally in solo mode
      const q = INITIAL_QUESTIONS.find((item) => item.id === chest.questionId) || INITIAL_QUESTIONS[0];
      setActiveQuizQuestion({
        question: q,
        chestId: chest.id,
        chestPoints: chest.points,
        chestDifficulty: chest.difficulty,
      });
    } else {
      // In multiplayer, send to server to claim chest lock
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('interact_chest', { chestId: chest.id });
      } else {
        const q = INITIAL_QUESTIONS.find((item) => item.id === chest.questionId) || INITIAL_QUESTIONS[0];
        setActiveQuizQuestion({
          question: q,
          chestId: chest.id,
          chestPoints: chest.points,
          chestDifficulty: chest.difficulty,
        });
      }
    }
  };

  // Building interaction
  const handleInteractBuilding = (building: InteractiveBuilding) => {
    setActiveBuilding(building);
  };

  // Start building specific quiz
  const handleStartBuildingQuiz = () => {
    if (!activeBuilding) return;
    const matching = INITIAL_QUESTIONS.filter((q) => q.subject === activeBuilding.subject);
    const q = matching[Math.floor(Math.random() * matching.length)] || INITIAL_QUESTIONS[0];
    setActiveBuilding(null);
    setActiveQuizQuestion({ question: q, chestPoints: 100, chestDifficulty: 'sedang' });
  };

  // Submit Answer
  const handleAnswerQuestion = (selectedOption: number, answerTimeMs: number) => {
    if (!activeQuizQuestion) return;

    if (!isSoloMode && socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('submit_answer', {
        chestId: activeQuizQuestion.chestId,
        questionId: activeQuizQuestion.question.id,
        selectedOption,
        answerTimeMs,
      });
    } else {
      // Solo mode offline calculation with tiered points & speed bonuses
      const isCorrect = selectedOption === activeQuizQuestion.question.correctIndex;
      if (isCorrect) {
        const diff = activeQuizQuestion.chestDifficulty || activeQuizQuestion.question.difficulty || 'sedang';
        const pts = activeQuizQuestion.chestPoints || (diff === 'sulit' ? 200 : diff === 'mudah' ? 50 : 100);
        const maxBonus = diff === 'sulit' ? 50 : diff === 'mudah' ? 10 : 25;
        const quickBonus = answerTimeMs < 10000 ? Math.round(maxBonus * (1 - answerTimeMs / 10000)) : 0;
        const total = pts + quickBonus;

        setLocalPlayer((prev) => {
          const newScore = prev.score + total;
          const newXp = prev.xp + total;
          const newLevel = Math.floor(newXp / 300) + 1;
          return {
            ...prev,
            score: newScore,
            xp: newXp,
            level: newLevel,
            coins: prev.coins + 10,
            correctCount: prev.correctCount + 1,
            answeredQuestionsCount: prev.answeredQuestionsCount + 1,
            currentStreak: prev.currentStreak + 1,
          };
        });

        if (activeQuizQuestion.chestId) {
          setChests((prev) =>
            prev.map((c) =>
              c.id === activeQuizQuestion.chestId ? { ...c, isOpened: true } : c
            )
          );
        }
      } else {
        setLocalPlayer((prev) => ({
          ...prev,
          answeredQuestionsCount: prev.answeredQuestionsCount + 1,
          currentStreak: 0,
        }));
      }
    }
  };

  // Chat message send
  const handleSendMessage = (text: string) => {
    if (!isSoloMode && socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('send_chat', text);
    } else {
      // Local echo in solo mode
      setChatMessages((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          senderId: localPlayer.id,
          senderName: localPlayer.name,
          text,
          timestamp: Date.now(),
        },
      ]);
    }
  };

  // Teacher Action
  const handleTeacherAction = (
    action:
      | 'start_game'
      | 'pause_game'
      | 'resume_game'
      | 'reset_chests'
      | 'broadcast'
      | 'end_game'
      | 'change_arena'
      | 'set_duration'
      | 'add_time'
      | 'update_settings',
    payload?: any
  ) => {
    if (socketRef.current) {
      socketRef.current.emit('teacher_action', { action, payload });
    }
  };

  // Add Custom Question via Teacher Dashboard
  const handleAddCustomQuestion = async (q: Omit<Question, 'id'>): Promise<boolean> => {
    try {
      const res = await fetch('/api/questions/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(q),
      });
      const data = await res.json();
      return Boolean(data.success);
    } catch {
      return false;
    }
  };

  return (
    <div className="w-full h-screen overflow-hidden bg-slate-950 font-sans">
      {/* 1. TITLE SCREEN */}
      {view === 'title' && (
        <TitleScreen
          onStartStudent={handleStartStudent}
          onStartTeacher={handleStartTeacher}
          onStartSolo={handleStartSolo}
        />
      )}

      {/* 2. AVATAR CUSTOMIZER MODAL */}
      {view === 'avatar_custom' && (
        <AvatarCustomizerModal
          initialConfig={localPlayer.avatar}
          defaultRoomCode={roomCode}
          onJoinGame={handleJoinGameWithAvatar}
          onBack={() => setView('title')}
        />
      )}

      {/* 3. TEACHER DASHBOARD */}
      {view === 'teacher_dashboard' && (
        <TeacherDashboard
          roomCode={roomCode}
          room={room}
          onBackToTitle={() => setView('title')}
          onSendTeacherAction={handleTeacherAction}
          onAddCustomQuestion={handleAddCustomQuestion}
        />
      )}

      {/* 4. ACTIVE GAME CANVAS VIEW */}
      {view === 'game' && (
        <>
          <GameCanvas
            localPlayer={localPlayer}
            players={remotePlayers}
            chests={chests}
            roomCode={roomCode}
            arena={isSoloMode ? soloArena : (room?.arena || 'kampus')}
            remainingSeconds={isSoloMode ? soloRemainingSeconds : (room?.remainingSeconds ?? 600)}
            timeLimitSeconds={room?.timeLimitSeconds ?? 600}
            buildings={ARENA_BUILDINGS[isSoloMode ? soloArena : (room?.arena || 'kampus')]}
            isSolo={isSoloMode}
            announcement={announcement}
            chatMessages={chatMessages}
            onPlayerMove={handlePlayerMove}
            onInteractChest={handleInteractChest}
            onInteractBuilding={handleInteractBuilding}
            onSendMessage={handleSendMessage}
            onOpenLeaderboard={() => setShowLeaderboard(true)}
            onLeaveGame={() => setView('title')}
          />

          {/* Interactive Question Modal */}
          {activeQuizQuestion && (
            <QuizModal
              question={activeQuizQuestion.question}
              chestId={activeQuizQuestion.chestId}
              chestPoints={activeQuizQuestion.chestPoints}
              chestDifficulty={activeQuizQuestion.chestDifficulty}
              onAnswer={handleAnswerQuestion}
              onClose={() => setActiveQuizQuestion(null)}
              isSolo={isSoloMode}
            />
          )}

          {/* Building Interaction Modal */}
          {activeBuilding && (
            <BuildingModal
              building={activeBuilding}
              onStartQuiz={handleStartBuildingQuiz}
              onClose={() => setActiveBuilding(null)}
            />
          )}

          {/* Real-time Leaderboard Modal */}
          {showLeaderboard && (
            <LeaderboardModal
              players={{ ...remotePlayers, [localPlayer.id]: localPlayer }}
              localPlayerId={localPlayer.id}
              onClose={() => setShowLeaderboard(false)}
            />
          )}
        </>
      )}
    </div>
  );
}
