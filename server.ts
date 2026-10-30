import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { INITIAL_QUESTIONS } from './src/data/questions.js';
import { ARENA_BUILDINGS, generateChests, INITIAL_CHESTS } from './src/game/MapData.js';
import { AnswerLog, ArenaType, GameRoom, Player, Question, QuestionChest, Subject } from './src/types/game.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(express.json());

// In-Memory Database
const rooms: Record<string, GameRoom> = {};
const questionBank: Question[] = [...INITIAL_QUESTIONS];
const answerLogs: Record<string, AnswerLog[]> = {};

// Helper: initialize chests with assigned questions, difficulty tiers, and custom counts
function createRoomChests(
  count: number = 20,
  arena: ArenaType = 'kampus',
  subjectFilter: 'all' | Subject = 'all',
  selectedSubjects?: Subject[]
): QuestionChest[] {
  const generated = generateChests(count, subjectFilter, selectedSubjects);

  return generated.map((c, index) => {
    // Pick question matching both chest subject and difficulty tier if possible
    let matching = questionBank.filter(q => q.subject === c.subject && q.difficulty === c.difficulty);
    if (matching.length === 0) {
      matching = questionBank.filter(q => q.subject === c.subject);
    }
    if (matching.length === 0) {
      matching = questionBank;
    }

    const selectedQ = matching[index % matching.length];
    return {
      ...c,
      questionId: selectedQ ? selectedQ.id : 'mtk-1',
      isOpened: false,
    };
  });
}

// Seed default demo room
const DEFAULT_ROOM_CODE = 'SD-JUARA';
rooms[DEFAULT_ROOM_CODE] = {
  code: DEFAULT_ROOM_CODE,
  title: 'Kelas Petualangan Juara SD',
  teacherName: 'Ibu Guru Ratna, S.Pd',
  teacherId: 'teacher-demo-1',
  status: 'playing',
  arena: 'kampus',
  subjectFilter: 'all',
  selectedSubjects: ['matematika', 'ipas', 'bahasa_indonesia', 'pancasila', 'pjok', 'seni_budaya'],
  chestCount: 20,
  timeLimitSeconds: 600,
  remainingSeconds: 600,
  maxPlayers: 30,
  players: {},
  chests: createRoomChests(20, 'kampus', 'all'),
  chatEnabled: true,
  createdAt: Date.now(),
};
answerLogs[DEFAULT_ROOM_CODE] = [];

// REST API Endpoints
app.get('/api/rooms', (req, res) => {
  const list = Object.values(rooms).map(r => ({
    code: r.code,
    title: r.title,
    teacherName: r.teacherName,
    status: r.status,
    subjectFilter: r.subjectFilter,
    playerCount: Object.keys(r.players).length,
    maxPlayers: r.maxPlayers,
  }));
  res.json({ success: true, rooms: list });
});

app.get('/api/rooms/:code', (req, res) => {
  const room = rooms[req.params.code.toUpperCase()];
  if (!room) {
    return res.status(404).json({ success: false, message: 'Room tidak ditemukan' });
  }
  res.json({ success: true, room });
});

app.post('/api/rooms/create', (req, res) => {
  const { title, teacherName, arena, subjectFilter, selectedSubjects, chestCount, timeLimitSeconds } = req.body;
  const code = (req.body.code || Math.random().toString(36).substring(2, 8)).toUpperCase();

  const chosenArena: ArenaType = arena || 'kampus';
  const chosenChestCount = Number(chestCount) || 20;
  const chosenDuration = Number(timeLimitSeconds) || 600;

  const newRoom: GameRoom = {
    code,
    title: title || `Kelas ${code}`,
    teacherName: teacherName || 'Guru Pengajar',
    teacherId: `teacher-${Date.now()}`,
    status: 'lobby',
    arena: chosenArena,
    subjectFilter: subjectFilter || 'all',
    selectedSubjects: selectedSubjects || ['matematika', 'ipas', 'bahasa_indonesia', 'pancasila', 'pjok', 'seni_budaya'],
    chestCount: chosenChestCount,
    timeLimitSeconds: chosenDuration,
    remainingSeconds: chosenDuration,
    maxPlayers: 30,
    players: {},
    chests: createRoomChests(chosenChestCount, chosenArena, subjectFilter || 'all', selectedSubjects),
    chatEnabled: true,
    createdAt: Date.now(),
  };

  rooms[code] = newRoom;
  answerLogs[code] = [];

  res.json({ success: true, room: newRoom });
});

app.get('/api/questions', (req, res) => {
  res.json({ success: true, questions: questionBank });
});

app.post('/api/questions/add', (req, res) => {
  const { subject, title, question, type, options, correctIndex, explanation, points, gradeLevel, difficulty } = req.body;
  if (!subject || !title || !question || !options || correctIndex === undefined) {
    return res.status(400).json({ success: false, message: 'Data pertanyaan tidak lengkap' });
  }

  const newQ: Question = {
    id: `custom-${Date.now()}`,
    subject,
    title,
    question,
    type: type || 'mcq',
    options,
    correctIndex: Number(correctIndex),
    explanation: explanation || 'Jawaban telah diverifikasi oleh guru.',
    points: Number(points) || 100,
    gradeLevel: Number(gradeLevel) || 4,
    difficulty: difficulty || 'sedang',
  };

  questionBank.push(newQ);
  res.json({ success: true, question: newQ });
});

app.get('/api/teacher/summary/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  const room = rooms[code];
  if (!room) {
    return res.status(404).json({ success: false, message: 'Room tidak ditemukan' });
  }

  const logs = answerLogs[code] || [];
  const players = Object.values(room.players);
  const totalStudents = players.length;
  const totalAnswered = logs.length;
  const correctCount = logs.filter(l => l.isCorrect).length;
  const overallAccuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
  const totalScore = players.reduce((sum, p) => sum + p.score, 0);
  const averageScore = totalStudents > 0 ? Math.round(totalScore / totalStudents) : 0;

  const subjectBreakdown: Record<Subject, { correct: number; total: number }> = {
    matematika: { correct: 0, total: 0 },
    ipas: { correct: 0, total: 0 },
    bahasa_indonesia: { correct: 0, total: 0 },
    pancasila: { correct: 0, total: 0 },
    pjok: { correct: 0, total: 0 },
    seni_budaya: { correct: 0, total: 0 },
  };

  for (const log of logs) {
    if (subjectBreakdown[log.subject]) {
      subjectBreakdown[log.subject].total++;
      if (log.isCorrect) subjectBreakdown[log.subject].correct++;
    }
  }

  const leaderboard = [...players]
    .sort((a, b) => b.score - a.score)
    .map(p => ({
      id: p.id,
      name: p.name,
      score: p.score,
      accuracy: p.answeredQuestionsCount > 0 ? Math.round((p.correctCount / p.answeredQuestionsCount) * 100) : 0,
      level: p.level,
      badgesCount: p.badges.length,
    }));

  res.json({
    success: true,
    analytics: {
      totalStudents,
      averageScore,
      totalAnswered,
      overallAccuracy,
      subjectBreakdown,
      recentAnswers: logs.slice(-20).reverse(),
      leaderboard,
    },
  });
});

// Socket.IO Multiplayer Handling
io.on('connection', (socket) => {
  let currentPlayerRoom: string | null = null;
  let currentPlayerId: string | null = null;

  socket.on('join_room', ({ roomCode, player }: { roomCode: string; player: Player }) => {
    const code = roomCode.toUpperCase();
    if (!rooms[code]) {
      // Auto-create room if not found
      rooms[code] = {
        code,
        title: `Kelas ${code}`,
        teacherName: 'Guru Pengajar',
        teacherId: 'teacher-auto',
        status: 'playing',
        arena: 'kampus',
        subjectFilter: 'all',
        selectedSubjects: ['matematika', 'ipas', 'bahasa_indonesia', 'pancasila', 'pjok', 'seni_budaya'],
        chestCount: 20,
        timeLimitSeconds: 600,
        remainingSeconds: 600,
        maxPlayers: 30,
        players: {},
        chests: createRoomChests(20, 'kampus', 'all'),
        chatEnabled: true,
        createdAt: Date.now(),
      };
      answerLogs[code] = [];
    }

    const room = rooms[code];
    currentPlayerRoom = code;
    currentPlayerId = player.id;

    socket.join(code);

    // Save player in room
    player.socketId = socket.id;
    player.roomId = code;
    room.players[player.id] = player;

    // Send full state to joining player
    socket.emit('room_joined', {
      room,
      questions: questionBank,
    });

    // Broadcast new player to all others in the room
    socket.to(code).emit('player_joined', player);
  });

  socket.on('player_move', (data: { x: number; y: number; dir: 'down' | 'up' | 'left' | 'right'; isMoving: boolean }) => {
    if (!currentPlayerRoom || !currentPlayerId) return;
    const room = rooms[currentPlayerRoom];
    if (!room || !room.players[currentPlayerId]) return;

    const p = room.players[currentPlayerId];
    p.x = data.x;
    p.y = data.y;
    p.dir = data.dir;
    p.isMoving = data.isMoving;
    p.lastActive = Date.now();

    // Broadcast movement to peers in room
    socket.to(currentPlayerRoom).emit('player_moved', {
      id: currentPlayerId,
      x: data.x,
      y: data.y,
      dir: data.dir,
      isMoving: data.isMoving,
    });
  });

  socket.on('interact_chest', ({ chestId }: { chestId: string }) => {
    if (!currentPlayerRoom || !currentPlayerId) return;
    const room = rooms[currentPlayerRoom];
    if (!room) return;

    const chest = room.chests.find(c => c.id === chestId);
    if (!chest || chest.isOpened) {
      socket.emit('chest_interact_error', { message: 'Peti ini telah dibuka oleh siswa lain!' });
      return;
    }

    const question = questionBank.find(q => q.id === chest.questionId) || questionBank[0];

    // Send question directly to this student with points and difficulty tier
    socket.emit('open_question_modal', {
      chestId: chest.id,
      question,
      chestPoints: chest.points,
      chestDifficulty: chest.difficulty,
    });
  });

  socket.on('submit_answer', (data: {
    chestId?: string;
    questionId: string;
    selectedOption: number;
    answerTimeMs: number;
  }) => {
    if (!currentPlayerRoom || !currentPlayerId) return;
    const room = rooms[currentPlayerRoom];
    if (!room || !room.players[currentPlayerId]) return;

    const player = room.players[currentPlayerId];
    const question = questionBank.find(q => q.id === data.questionId);
    if (!question) return;

    const chest = data.chestId ? room.chests.find(c => c.id === data.chestId) : null;
    let basePoints = question.points || 100;
    let maxBonus = 25;

    if (chest) {
      basePoints = chest.points || (chest.difficulty === 'sulit' ? 200 : chest.difficulty === 'mudah' ? 50 : 100);
      maxBonus = chest.difficulty === 'sulit' ? 50 : chest.difficulty === 'mudah' ? 10 : 25;
    }

    const isCorrect = data.selectedOption === question.correctIndex;
    let pointsEarned = 0;
    let quickBonus = 0;

    if (isCorrect) {
      // Base points tiered by difficulty: Mudah (50), Sedang (100), Sulit (200)
      pointsEarned = basePoints;
      if (data.answerTimeMs < 10000) {
        quickBonus = Math.round(maxBonus * (1 - data.answerTimeMs / 10000));
        pointsEarned += quickBonus;
      }

      player.score += pointsEarned;
      player.xp += pointsEarned;
      player.coins += Math.round(pointsEarned / 10);
      player.correctCount++;
      player.currentStreak++;
      if (player.currentStreak > player.bestStreak) {
        player.bestStreak = player.currentStreak;
      }

      // Level calculation: Every 300 XP advances 1 level
      const calculatedLevel = Math.floor(player.xp / 300) + 1;
      if (calculatedLevel > player.level) {
        player.level = calculatedLevel;
        io.to(currentPlayerRoom).emit('player_level_up', {
          playerId: player.id,
          playerName: player.name,
          newLevel: player.level,
        });
      }

      // Badges awards
      if (player.currentStreak >= 3 && !player.badges.includes('Kilat Juara')) {
        player.badges.push('Kilat Juara');
      }
      if (player.score >= 500 && !player.badges.includes('Cendekiawan Cilik')) {
        player.badges.push('Cendekiawan Cilik');
      }
      if (question.subject === 'matematika' && !player.badges.includes('Master Matematika')) {
        player.badges.push('Master Matematika');
      }
    } else {
      player.currentStreak = 0;
    }

    player.answeredQuestionsCount++;

    // Mark chest as opened in multiplayer
    if (data.chestId) {
      const targetChest = room.chests.find(c => c.id === data.chestId);
      if (targetChest) {
        targetChest.isOpened = true;
        targetChest.openedBy = player.id;
        targetChest.openedByName = player.name;
        targetChest.respawnAt = Date.now() + 25000; // Respawns in 25 seconds for non-stop action!
      }
    }

    // Record in answer logs
    const log: AnswerLog = {
      id: `ans-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      studentId: player.id,
      studentName: player.name,
      questionId: question.id,
      questionTitle: question.title,
      subject: question.subject,
      isCorrect,
      pointsEarned,
      answerTimeMs: data.answerTimeMs,
      timestamp: Date.now(),
    };
    if (!answerLogs[currentPlayerRoom]) answerLogs[currentPlayerRoom] = [];
    answerLogs[currentPlayerRoom].push(log);

    // Send result back to answering student
    socket.emit('answer_result', {
      isCorrect,
      correctIndex: question.correctIndex,
      explanation: question.explanation,
      pointsEarned,
      quickBonus,
      player,
    });

    // Broadcast updated player state and chest update to room
    io.to(currentPlayerRoom).emit('player_updated', player);
    if (data.chestId) {
      io.to(currentPlayerRoom).emit('chest_updated', {
        chestId: data.chestId,
        isOpened: true,
        openedByName: player.name,
      });
    }

    // Broadcast to teacher dashboard live stream
    io.to(currentPlayerRoom).emit('teacher_live_answer', log);
  });

  socket.on('send_chat', (text: string) => {
    if (!currentPlayerRoom || !currentPlayerId) return;
    const room = rooms[currentPlayerRoom];
    if (!room || !room.chatEnabled) return;

    const player = room.players[currentPlayerId];
    if (!player) return;

    const safeText = text.trim().substring(0, 80);
    if (!safeText) return;

    const chatMsg = {
      id: `chat-${Date.now()}`,
      senderId: player.id,
      senderName: player.name,
      text: safeText,
      timestamp: Date.now(),
      isTeacher: player.role === 'teacher',
    };

    io.to(currentPlayerRoom).emit('chat_message', chatMsg);
  });

  socket.on('teacher_action', (data: {
    action: 'start_game' | 'pause_game' | 'resume_game' | 'reset_chests' | 'broadcast' | 'end_game' | 'change_arena' | 'set_duration' | 'add_time' | 'update_settings';
    payload?: any;
  }) => {
    if (!currentPlayerRoom) return;
    const room = rooms[currentPlayerRoom];
    if (!room) return;

    if (data.action === 'start_game') {
      room.status = 'playing';
      io.to(currentPlayerRoom).emit('room_status_changed', { status: 'playing' });
    } else if (data.action === 'pause_game') {
      room.status = 'paused';
      io.to(currentPlayerRoom).emit('room_status_changed', { status: 'paused' });
    } else if (data.action === 'resume_game') {
      room.status = 'playing';
      io.to(currentPlayerRoom).emit('room_status_changed', { status: 'playing' });
    } else if (data.action === 'end_game') {
      room.status = 'finished';
      io.to(currentPlayerRoom).emit('room_status_changed', { status: 'finished' });
    } else if (data.action === 'change_arena') {
      room.arena = data.payload.arena || 'kampus';
      room.chests = createRoomChests(room.chestCount, room.arena, room.subjectFilter, room.selectedSubjects);
      io.to(currentPlayerRoom).emit('arena_changed', { arena: room.arena, chests: room.chests });
    } else if (data.action === 'set_duration') {
      const dur = Number(data.payload.timeLimitSeconds) || 600;
      room.timeLimitSeconds = dur;
      room.remainingSeconds = dur;
      io.to(currentPlayerRoom).emit('timer_sync', { remainingSeconds: room.remainingSeconds, timeLimitSeconds: room.timeLimitSeconds });
    } else if (data.action === 'add_time') {
      const extra = Number(data.payload.seconds) || 300;
      room.remainingSeconds = (room.remainingSeconds || 0) + extra;
      io.to(currentPlayerRoom).emit('timer_sync', { remainingSeconds: room.remainingSeconds, timeLimitSeconds: room.timeLimitSeconds });
    } else if (data.action === 'update_settings') {
      if (data.payload.arena) room.arena = data.payload.arena;
      if (data.payload.chestCount) room.chestCount = Number(data.payload.chestCount);
      if (data.payload.selectedSubjects) room.selectedSubjects = data.payload.selectedSubjects;
      if (data.payload.timeLimitSeconds) {
        room.timeLimitSeconds = Number(data.payload.timeLimitSeconds);
        room.remainingSeconds = room.timeLimitSeconds;
      }
      room.chests = createRoomChests(room.chestCount, room.arena, room.subjectFilter, room.selectedSubjects);
      io.to(currentPlayerRoom).emit('room_settings_updated', {
        arena: room.arena,
        chestCount: room.chestCount,
        selectedSubjects: room.selectedSubjects,
        chests: room.chests,
        timeLimitSeconds: room.timeLimitSeconds,
        remainingSeconds: room.remainingSeconds,
      });
    } else if (data.action === 'reset_chests') {
      room.chests = createRoomChests(room.chestCount, room.arena, room.subjectFilter, room.selectedSubjects);
      io.to(currentPlayerRoom).emit('chests_reset', room.chests);
    } else if (data.action === 'broadcast') {
      room.announcement = data.payload?.message || '';
      io.to(currentPlayerRoom).emit('teacher_announcement', { message: room.announcement });
    }
  });

  socket.on('disconnect', () => {
    if (currentPlayerRoom && currentPlayerId && rooms[currentPlayerRoom]) {
      const room = rooms[currentPlayerRoom];
      delete room.players[currentPlayerId];
      io.to(currentPlayerRoom).emit('player_left', { id: currentPlayerId });
    }
  });
});

// Periodic 1-second Match Timer countdown ticker
setInterval(() => {
  for (const code in rooms) {
    const room = rooms[code];
    if (room.status === 'playing' && room.remainingSeconds > 0) {
      room.remainingSeconds--;
      // Emit timer sync every second or milestone
      io.to(code).emit('timer_sync', {
        remainingSeconds: room.remainingSeconds,
        timeLimitSeconds: room.timeLimitSeconds,
      });

      if (room.remainingSeconds <= 0) {
        room.status = 'finished';
        io.to(code).emit('room_status_changed', { status: 'finished' });
        io.to(code).emit('match_finished', {
          leaderboard: Object.values(room.players).sort((a, b) => b.score - a.score),
        });
      }
    }
  }
}, 1000);

// Periodic chest respawn ticker
setInterval(() => {
  const now = Date.now();
  for (const code in rooms) {
    const room = rooms[code];
    let changed = false;
    for (const c of room.chests) {
      if (c.isOpened && c.respawnAt && now >= c.respawnAt) {
        c.isOpened = false;
        c.openedBy = undefined;
        c.openedByName = undefined;
        c.respawnAt = undefined;
        // Re-randomize question for fresh excitement
        const matching = questionBank.filter(q => q.subject === c.subject);
        const q = matching[Math.floor(Math.random() * matching.length)] || questionBank[0];
        c.questionId = q.id;
        changed = true;
      }
    }
    if (changed) {
      io.to(code).emit('chests_sync', room.chests);
    }
  }
}, 3000);

// Mount Vite middleware in development
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const PORT = process.env.PORT || 3000;

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, () => {
    console.log(`EDU ADVENTURE server running at http://localhost:${PORT}`);
  });
}

startServer();
