export type Subject = 
  | 'matematika' 
  | 'ipas' 
  | 'bahasa_indonesia' 
  | 'pancasila' 
  | 'pjok' 
  | 'seni_budaya';

export interface SubjectMeta {
  id: Subject;
  name: string;
  shortName: string;
  buildingName: string;
  color: string;
  badgeColor: string;
  icon: string;
  theme: string;
}

export const SUBJECTS: Record<Subject, SubjectMeta> = {
  matematika: {
    id: 'matematika',
    name: 'Matematika',
    shortName: 'MTK',
    buildingName: 'Gedung Matematika',
    color: '#3b82f6', // blue
    badgeColor: 'bg-blue-600',
    icon: 'Calculator',
    theme: 'Menghitung cepat, geometri, dan logika angka',
  },
  ipas: {
    id: 'ipas',
    name: 'IPAS (Sains & Sosial)',
    shortName: 'IPAS',
    buildingName: 'Laboratorium IPAS',
    color: '#10b981', // emerald
    badgeColor: 'bg-emerald-600',
    icon: 'FlaskConical',
    theme: 'Eksperimen alam, tata surya, dan sejarah Nusantara',
  },
  bahasa_indonesia: {
    id: 'bahasa_indonesia',
    name: 'Bahasa Indonesia',
    shortName: 'B.INDO',
    buildingName: 'Perpustakaan Cerdas',
    color: '#f59e0b', // amber
    badgeColor: 'bg-amber-600',
    icon: 'BookOpen',
    theme: 'Kosakata, peribahasa, puisi, dan pemahaman bacaan',
  },
  pancasila: {
    id: 'pancasila',
    name: 'Pendidikan Pancasila',
    shortName: 'PPKn',
    buildingName: 'Museum Pancasila',
    color: '#ef4444', // red
    badgeColor: 'bg-red-600',
    icon: 'ShieldCheck',
    theme: 'Nilai luhur, gotong royong, dan cinta tanah air',
  },
  pjok: {
    id: 'pjok',
    name: 'PJOK (Olahraga)',
    shortName: 'PJOK',
    buildingName: 'Stadion Juara Olahraga',
    color: '#8b5cf6', // purple
    badgeColor: 'bg-purple-600',
    icon: 'Trophy',
    theme: 'Kesehatan tubuh, kebugaran, dan sportivitas',
  },
  seni_budaya: {
    id: 'seni_budaya',
    name: 'Seni Budaya & Prakarya',
    shortName: 'SENI',
    buildingName: 'Balai Seni Nusantara',
    color: '#ec4899', // pink
    badgeColor: 'bg-pink-600',
    icon: 'Palette',
    theme: 'Alat musik tradisional, batik, dan karya kreatif',
  },
};

export interface AvatarConfig {
  gender: 'boy' | 'girl';
  skinColor: string; // hex
  hairStyle: 'short' | 'spiky' | 'ponytail' | 'curls' | 'bob';
  hairColor: string; // hex
  outfit: 'sd_uniform' | 'pramuka' | 'scientist' | 'adventurer' | 'sports' | 'cyber';
  accessory: 'none' | 'glasses' | 'goggles' | 'headphones' | 'scarf';
  hat: 'none' | 'sd_cap' | 'wizard' | 'explorer' | 'crown' | 'beret';
}

export interface Player {
  id: string;
  socketId: string;
  name: string;
  role: 'student' | 'teacher';
  roomId: string;
  avatar: AvatarConfig;
  x: number;
  y: number;
  dir: 'down' | 'up' | 'left' | 'right';
  isMoving: boolean;
  score: number;
  xp: number;
  level: number;
  coins: number;
  badges: string[];
  answeredQuestionsCount: number;
  correctCount: number;
  currentStreak: number;
  bestStreak: number;
  lastActive: number;
}

export type ArenaType = 'kampus' | 'hutan' | 'labirin' | 'kota';

export interface ArenaMeta {
  id: ArenaType;
  name: string;
  subtitle: string;
  badge: string;
  description: string;
  groundColor: string;
  pathColor: string;
  themeStyle: string;
}

export const ARENAS: Record<ArenaType, ArenaMeta> = {
  kampus: {
    id: 'kampus',
    name: 'Plaza Kampus Nusantara',
    subtitle: 'Sekolah & Pusat Pembelajaran',
    badge: '🏫 Kampus Edukasi',
    description: 'Arena klasik dengan halaman sekolah, air mancur, tiang bendera Merah-Putih, dan 6 gedung mata pelajaran.',
    groundColor: '#22c55e',
    pathColor: '#e2e8f0',
    themeStyle: 'Lush Green & Cobblestone',
  },
  hutan: {
    id: 'hutan',
    name: 'Rimba Hutan Pengetahuan',
    subtitle: 'Hutan Belantara & Sungai Purba',
    badge: '🌲 Hutan Tropis',
    description: 'Suasana alam liar dengan pepohonan rimbun lebat, api unggun petualang, sungai deras, dan jembatan kayu melintasi jurang.',
    groundColor: '#15803d',
    pathColor: '#a16207',
    themeStyle: 'Ancient Deep Rainforest',
  },
  labirin: {
    id: 'labirin',
    name: 'Kotak Labirin Misteri',
    subtitle: 'Dungeon Batu Kuno & Obor',
    badge: '🧱 Labirin Tantangan',
    description: 'Lorong-lorong batu kuno berpola labirin RPG seru! Siswa harus mencari jalan di lorong berliku untuk merebut peti harta karun.',
    groundColor: '#1e293b',
    pathColor: '#475569',
    themeStyle: 'Stone Dungeon Maze',
  },
  kota: {
    id: 'kota',
    name: 'Metropolis Kota Cerdas',
    subtitle: 'Perkotaan Modern & Cyber Plaza',
    badge: '🏙️ Cyber City',
    description: 'Suasana perkotaan modern dengan jalan raya aspal, trotoar paving neon, lampu kota futuristik, dan gedung pencakar langit.',
    groundColor: '#0f172a',
    pathColor: '#334155',
    themeStyle: 'Modern Cyber Metropolis',
  },
};

export type QuestionDifficulty = 'mudah' | 'sedang' | 'sulit';

export const DIFFICULTY_POINTS: Record<QuestionDifficulty, { points: number; label: string; color: string; maxQuickBonus: number }> = {
  mudah: { points: 50, label: 'Mudah', color: '#10b981', maxQuickBonus: 10 },
  sedang: { points: 100, label: 'Sedang', color: '#3b82f6', maxQuickBonus: 25 },
  sulit: { points: 200, label: 'Sulit (HOTS)', color: '#f59e0b', maxQuickBonus: 50 },
};

export type QuestionType = 'mcq' | 'true_false' | 'image_guess';

export interface Question {
  id: string;
  subject: Subject;
  title: string;
  question: string;
  type: QuestionType;
  imageOrDiagram?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  points: number;
  gradeLevel: number;
  difficulty: QuestionDifficulty;
}

export interface QuestionChest {
  id: string;
  x: number;
  y: number;
  subject: Subject;
  difficulty: QuestionDifficulty;
  points: number;
  isOpened: boolean;
  openedBy?: string;
  openedByName?: string;
  respawnAt?: number;
  questionId: string;
}

export interface InteractiveBuilding {
  id: string;
  name: string;
  subject: Subject;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  roofColor: string;
  icon: string;
  description: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isTeacher?: boolean;
}

export interface GameRoom {
  code: string;
  title: string;
  teacherName: string;
  teacherId: string;
  status: 'lobby' | 'playing' | 'paused' | 'finished';
  arena: ArenaType;
  subjectFilter: 'all' | Subject;
  selectedSubjects: Subject[];
  chestCount: number;
  timeLimitSeconds: number;
  remainingSeconds: number;
  maxPlayers: number;
  players: Record<string, Player>;
  chests: QuestionChest[];
  chatEnabled: boolean;
  createdAt: number;
  announcement?: string;
}

export interface AnswerLog {
  id: string;
  studentId: string;
  studentName: string;
  questionId: string;
  questionTitle: string;
  subject: Subject;
  isCorrect: boolean;
  pointsEarned: number;
  answerTimeMs: number;
  timestamp: number;
}

export interface TeacherAnalytics {
  totalStudents: number;
  averageScore: number;
  totalAnswered: number;
  overallAccuracy: number;
  subjectBreakdown: Record<Subject, { correct: number; total: number }>;
  recentAnswers: AnswerLog[];
  leaderboard: {
    id: string;
    name: string;
    score: number;
    accuracy: number;
    level: number;
    badgesCount: number;
  }[];
}
