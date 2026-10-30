import { ArenaType, InteractiveBuilding, QuestionChest, QuestionDifficulty, Subject } from '../types/game';

export const WORLD_WIDTH = 2400;
export const WORLD_HEIGHT = 1800;

export interface MapObstacle {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 1. ARENA BUILDINGS / LANDMARKS PER MAP
export const ARENA_BUILDINGS: Record<ArenaType, InteractiveBuilding[]> = {
  kampus: [
    {
      id: 'b-matematika',
      name: 'Gedung Matematika',
      subject: 'matematika',
      x: 450,
      y: 350,
      width: 220,
      height: 180,
      color: '#1e3a8a',
      roofColor: '#2563eb',
      icon: 'Calculator',
      description: 'Pusat tantangan angka cepat, geometri, dan logika perhitungan.',
    },
    {
      id: 'b-ipas',
      name: 'Laboratorium IPAS',
      subject: 'ipas',
      x: 1750,
      y: 350,
      width: 240,
      height: 180,
      color: '#064e3b',
      roofColor: '#059669',
      icon: 'FlaskConical',
      description: 'Eksperimen sains, tata surya, rantai makanan, dan sejarah pahlawan.',
    },
    {
      id: 'b-bahasa',
      name: 'Perpustakaan Cerdas',
      subject: 'bahasa_indonesia',
      x: 420,
      y: 1150,
      width: 240,
      height: 190,
      color: '#78350f',
      roofColor: '#d97706',
      icon: 'BookOpen',
      description: 'Gudang ilmu bahasa: kosakata, majas, pantun, dan peribahasa bijak.',
    },
    {
      id: 'b-pancasila',
      name: 'Museum Pancasila',
      subject: 'pancasila',
      x: 1100,
      y: 280,
      width: 260,
      height: 200,
      color: '#7f1d1d',
      roofColor: '#dc2626',
      icon: 'ShieldCheck',
      description: 'Monumen kebangsaan: nilai 5 sila, gotong royong, dan musyawarah.',
    },
    {
      id: 'b-pjok',
      name: 'Stadion Juara PJOK',
      subject: 'pjok',
      x: 1750,
      y: 1150,
      width: 260,
      height: 190,
      color: '#4c1d95',
      roofColor: '#7c3aed',
      icon: 'Trophy',
      description: 'Arena kebugaran jasmani, senam, gizi sehat, dan sportivitas.',
    },
    {
      id: 'b-seni',
      name: 'Balai Seni Budaya',
      subject: 'seni_budaya',
      x: 1100,
      y: 1350,
      width: 240,
      height: 180,
      color: '#831843',
      roofColor: '#db2777',
      icon: 'Palette',
      description: 'Karya seni rupa, batik daerah, alat musik bambu, dan tangga nada.',
    },
  ],

  hutan: [
    {
      id: 'h-matematika',
      name: 'Kuil Angka Rimba',
      subject: 'matematika',
      x: 450,
      y: 350,
      width: 220,
      height: 180,
      color: '#14532d',
      roofColor: '#16a34a',
      icon: 'Calculator',
      description: 'Kuil batu purba di tengah hutan untuk memecahkan teka-teki berhitung.',
    },
    {
      id: 'h-ipas',
      name: 'Pusat Ekologi Hutan',
      subject: 'ipas',
      x: 1750,
      y: 350,
      width: 240,
      height: 180,
      color: '#064e3b',
      roofColor: '#10b981',
      icon: 'FlaskConical',
      description: 'Pusat pengamatan flora fauna, fotosintesis kanopi hutan, dan konservasi alam.',
    },
    {
      id: 'h-bahasa',
      name: 'Pondok Sastra Pohon',
      subject: 'bahasa_indonesia',
      x: 420,
      y: 1150,
      width: 240,
      height: 190,
      color: '#713f12',
      roofColor: '#ca8a04',
      icon: 'BookOpen',
      description: 'Pondok kayu rimbun tempat bertualang merangkai pantun dan majas alam.',
    },
    {
      id: 'h-pancasila',
      name: 'Pohon Persatuan Raya',
      subject: 'pancasila',
      x: 1100,
      y: 280,
      width: 260,
      height: 200,
      color: '#831843',
      roofColor: '#e11d48',
      icon: 'ShieldCheck',
      description: 'Pohon beringin raksasa perlambang persatuan dan toleransi suku bangsa.',
    },
    {
      id: 'h-pjok',
      name: 'Arena Survival Rimba',
      subject: 'pjok',
      x: 1750,
      y: 1150,
      width: 260,
      height: 190,
      color: '#3b0764',
      roofColor: '#9333ea',
      icon: 'Trophy',
      description: 'Arena uji kelincahan dan stamina di jalur rintangan hutan belantara.',
    },
    {
      id: 'h-seni',
      name: 'Balai Musik Bambu Hutan',
      subject: 'seni_budaya',
      x: 1100,
      y: 1350,
      width: 240,
      height: 180,
      color: '#701a75',
      roofColor: '#c026d3',
      icon: 'Palette',
      description: 'Rumah panggung bambu penghasil alunan angklung dan seruling alam.',
    },
  ],

  labirin: [
    {
      id: 'l-matematika',
      name: 'Kamar Teka-Teki Angka',
      subject: 'matematika',
      x: 450,
      y: 350,
      width: 220,
      height: 180,
      color: '#1e293b',
      roofColor: '#38bdf8',
      icon: 'Calculator',
      description: 'Ruang rahasia labirin berisi kalkulasi pecahan dan kombinasi misteri.',
    },
    {
      id: 'l-ipas',
      name: 'Laboratorium Kristal Gua',
      subject: 'ipas',
      x: 1750,
      y: 350,
      width: 240,
      height: 180,
      color: '#064e3b',
      roofColor: '#34d399',
      icon: 'FlaskConical',
      description: 'Ruang bebatuan dan kristal purba untuk studi fosil dan sains geologi.',
    },
    {
      id: 'l-bahasa',
      name: 'Perpustakaan Naskah Kuno',
      subject: 'bahasa_indonesia',
      x: 420,
      y: 1150,
      width: 240,
      height: 190,
      color: '#451a03',
      roofColor: '#f59e0b',
      icon: 'BookOpen',
      description: 'Naskah prasasti berharga penuh kata bijak dan teka-teki peribahasa.',
    },
    {
      id: 'l-pancasila',
      name: 'Altar Pancasila Sakti',
      subject: 'pancasila',
      x: 1100,
      y: 280,
      width: 260,
      height: 200,
      color: '#450a0a',
      roofColor: '#ef4444',
      icon: 'ShieldCheck',
      description: 'Altar batu megah dengan lambang Garuda Pancasila yang bersinar.',
    },
    {
      id: 'l-pjok',
      name: 'Arena Ksatria Labirin',
      subject: 'pjok',
      x: 1750,
      y: 1150,
      width: 260,
      height: 190,
      color: '#2e1065',
      roofColor: '#a855f7',
      icon: 'Trophy',
      description: 'Uji kecepatan navigasi dan kelincahan lari di tikungan labirin!',
    },
    {
      id: 'l-seni',
      name: 'Galeri Ukiran Relik',
      subject: 'seni_budaya',
      x: 1100,
      y: 1350,
      width: 240,
      height: 180,
      color: '#500724',
      roofColor: '#f43f5e',
      icon: 'Palette',
      description: 'Relief ukiran batu artistik warisan seni rupa leluhur Nusantara.',
    },
  ],

  kota: [
    {
      id: 'k-matematika',
      name: 'Menara Algoritma Quantum',
      subject: 'matematika',
      x: 450,
      y: 350,
      width: 220,
      height: 180,
      color: '#0284c7',
      roofColor: '#0ea5e9',
      icon: 'Calculator',
      description: 'Pusat data modern kota dengan layar komputasi numerik pintar.',
    },
    {
      id: 'k-ipas',
      name: 'Institut Riset Biosfer',
      subject: 'ipas',
      x: 1750,
      y: 350,
      width: 240,
      height: 180,
      color: '#047857',
      roofColor: '#10b981',
      icon: 'FlaskConical',
      description: 'Gedung riset energi terbarukan dan observatorium luar angkasa canggih.',
    },
    {
      id: 'k-bahasa',
      name: 'Cyber Media Hub',
      subject: 'bahasa_indonesia',
      x: 420,
      y: 1150,
      width: 240,
      height: 190,
      color: '#b45309',
      roofColor: '#f59e0b',
      icon: 'BookOpen',
      description: 'Pusat literasi digital, redaksi berita anak, dan studio pantun modern.',
    },
    {
      id: 'k-pancasila',
      name: 'Balai Kota Demokrasi',
      subject: 'pancasila',
      x: 1100,
      y: 280,
      width: 260,
      height: 200,
      color: '#b91c1c',
      roofColor: '#ef4444',
      icon: 'ShieldCheck',
      description: 'Pusat musyawarah warga kota dengan tata kelola persatuan yang adil.',
    },
    {
      id: 'k-pjok',
      name: 'E-Sport & Fitness Center',
      subject: 'pjok',
      x: 1750,
      y: 1150,
      width: 260,
      height: 190,
      color: '#6b21a8',
      roofColor: '#a855f7',
      icon: 'Trophy',
      description: 'Pusat kebugaran canggih untuk melatih kekuatan, ritme, dan kesehatan.',
    },
    {
      id: 'k-seni',
      name: 'Galeri Seni Digital',
      subject: 'seni_budaya',
      x: 1100,
      y: 1350,
      width: 240,
      height: 180,
      color: '#be185d',
      roofColor: '#ec4899',
      icon: 'Palette',
      description: 'Galeri pameran animasi, motif batik generasi baru, dan konser musik.',
    },
  ],
};

// Default buildings for backward compatibility
export const BUILDINGS = ARENA_BUILDINGS.kampus;

// 2. OBSTACLES PER MAP
export const ARENA_OBSTACLES: Record<ArenaType, MapObstacle[]> = {
  kampus: [
    { x: 0, y: 0, width: WORLD_WIDTH, height: 40 },
    { x: 0, y: WORLD_HEIGHT - 40, width: WORLD_WIDTH, height: 40 },
    { x: 0, y: 0, width: 40, height: WORLD_HEIGHT },
    { x: WORLD_WIDTH - 40, y: 0, width: 40, height: WORLD_HEIGHT },
    { x: 450, y: 350, width: 220, height: 160 },
    { x: 1750, y: 350, width: 240, height: 160 },
    { x: 420, y: 1150, width: 240, height: 170 },
    { x: 1100, y: 280, width: 260, height: 180 },
    { x: 1750, y: 1150, width: 260, height: 170 },
    { x: 1100, y: 1350, width: 240, height: 160 },
    { x: 1188, y: 808, width: 24, height: 24 },
  ],

  hutan: [
    { x: 0, y: 0, width: WORLD_WIDTH, height: 40 },
    { x: 0, y: WORLD_HEIGHT - 40, width: WORLD_WIDTH, height: 40 },
    { x: 0, y: 0, width: 40, height: WORLD_HEIGHT },
    { x: WORLD_WIDTH - 40, y: 0, width: 40, height: WORLD_HEIGHT },
    { x: 450, y: 350, width: 220, height: 160 },
    { x: 1750, y: 350, width: 240, height: 160 },
    { x: 420, y: 1150, width: 240, height: 170 },
    { x: 1100, y: 280, width: 260, height: 180 },
    { x: 1750, y: 1150, width: 260, height: 170 },
    { x: 1100, y: 1350, width: 240, height: 160 },
    // Campfire in central grove
    { x: 1188, y: 808, width: 24, height: 24 },
    // Ancient boulders
    { x: 750, y: 550, width: 80, height: 70 },
    { x: 1550, y: 550, width: 80, height: 70 },
  ],

  labirin: [
    { x: 0, y: 0, width: WORLD_WIDTH, height: 40 },
    { x: 0, y: WORLD_HEIGHT - 40, width: WORLD_WIDTH, height: 40 },
    { x: 0, y: 0, width: 40, height: WORLD_HEIGHT },
    { x: WORLD_WIDTH - 40, y: 0, width: 40, height: WORLD_HEIGHT },
    { x: 450, y: 350, width: 220, height: 160 },
    { x: 1750, y: 350, width: 240, height: 160 },
    { x: 420, y: 1150, width: 240, height: 170 },
    { x: 1100, y: 280, width: 260, height: 180 },
    { x: 1750, y: 1150, width: 260, height: 170 },
    { x: 1100, y: 1350, width: 240, height: 160 },
    // Maze inner stone walls
    { x: 700, y: 200, width: 40, height: 400 },
    { x: 800, y: 560, width: 200, height: 40 },
    { x: 1400, y: 200, width: 40, height: 400 },
    { x: 1400, y: 560, width: 200, height: 40 },
    { x: 700, y: 950, width: 40, height: 400 },
    { x: 700, y: 1100, width: 240, height: 40 },
    { x: 1650, y: 950, width: 40, height: 400 },
    { x: 1450, y: 1100, width: 240, height: 40 },
  ],

  kota: [
    { x: 0, y: 0, width: WORLD_WIDTH, height: 40 },
    { x: 0, y: WORLD_HEIGHT - 40, width: WORLD_WIDTH, height: 40 },
    { x: 0, y: 0, width: 40, height: WORLD_HEIGHT },
    { x: WORLD_WIDTH - 40, y: 0, width: 40, height: WORLD_HEIGHT },
    { x: 450, y: 350, width: 220, height: 160 },
    { x: 1750, y: 350, width: 240, height: 160 },
    { x: 420, y: 1150, width: 240, height: 170 },
    { x: 1100, y: 280, width: 260, height: 180 },
    { x: 1750, y: 1150, width: 260, height: 170 },
    { x: 1100, y: 1350, width: 240, height: 160 },
    // Central Hologram Monument base
    { x: 1188, y: 808, width: 24, height: 24 },
  ],
};

export const MAP_OBSTACLES = ARENA_OBSTACLES.kampus;

// 3. CANDIDATE SPAWN POINTS FOR CHESTS
export const CHEST_CANDIDATE_LOCATIONS: { x: number; y: number; defaultSubject: Subject }[] = [
  // Plaza / Central Avenues
  { x: 1050, y: 730, defaultSubject: 'pancasila' },
  { x: 1350, y: 730, defaultSubject: 'matematika' },
  { x: 1200, y: 950, defaultSubject: 'bahasa_indonesia' },
  { x: 820, y: 720, defaultSubject: 'ipas' },
  { x: 1580, y: 720, defaultSubject: 'pjok' },
  { x: 1200, y: 620, defaultSubject: 'seni_budaya' },
  
  // North-West Zone
  { x: 260, y: 240, defaultSubject: 'matematika' },
  { x: 320, y: 550, defaultSubject: 'matematika' },
  { x: 740, y: 320, defaultSubject: 'bahasa_indonesia' },
  { x: 850, y: 440, defaultSubject: 'matematika' },
  
  // South-West Zone
  { x: 280, y: 920, defaultSubject: 'bahasa_indonesia' },
  { x: 300, y: 1420, defaultSubject: 'seni_budaya' },
  { x: 750, y: 1320, defaultSubject: 'seni_budaya' },
  { x: 550, y: 1480, defaultSubject: 'bahasa_indonesia' },

  // North-East Zone
  { x: 2120, y: 240, defaultSubject: 'ipas' },
  { x: 2160, y: 550, defaultSubject: 'ipas' },
  { x: 1640, y: 280, defaultSubject: 'pancasila' },
  { x: 1520, y: 420, defaultSubject: 'ipas' },

  // South-East Zone
  { x: 2140, y: 950, defaultSubject: 'pjok' },
  { x: 2100, y: 1440, defaultSubject: 'pjok' },
  { x: 1420, y: 1320, defaultSubject: 'seni_budaya' },
  { x: 1850, y: 1480, defaultSubject: 'pjok' },

  // South Central / Riverside
  { x: 950, y: 1520, defaultSubject: 'pancasila' },
  { x: 1450, y: 1520, defaultSubject: 'matematika' },
  { x: 1200, y: 1480, defaultSubject: 'ipas' },
  { x: 700, y: 840, defaultSubject: 'bahasa_indonesia' },
  { x: 1700, y: 840, defaultSubject: 'pancasila' },
  { x: 1000, y: 1100, defaultSubject: 'pjok' },
  { x: 1400, y: 1100, defaultSubject: 'seni_budaya' },
  { x: 1200, y: 1200, defaultSubject: 'matematika' },
];

/**
 * Generates custom chests based on count, arena, and subject filter with difficulty tiers
 */
export function generateChests(
  count: number = 20,
  subjectFilter: 'all' | Subject = 'all',
  selectedSubjects?: Subject[]
): Omit<QuestionChest, 'questionId'>[] {
  const candidates = [...CHEST_CANDIDATE_LOCATIONS];
  const safeCount = Math.max(8, Math.min(candidates.length, count));

  // Determine allowed subjects
  let validSubjects: Subject[] = ['matematika', 'ipas', 'bahasa_indonesia', 'pancasila', 'pjok', 'seni_budaya'];
  if (selectedSubjects && selectedSubjects.length > 0) {
    validSubjects = selectedSubjects;
  } else if (subjectFilter !== 'all') {
    validSubjects = [subjectFilter];
  }

  // Difficulty distribution: 40% mudah (50 pts), 40% sedang (100 pts), 20% sulit (200 pts)
  const difficulties: QuestionDifficulty[] = ['mudah', 'sedang', 'sulit'];

  return candidates.slice(0, safeCount).map((loc, idx) => {
    const subj = validSubjects[idx % validSubjects.length];
    
    // Assign difficulty
    let diff: QuestionDifficulty = 'sedang';
    const mod = idx % 5;
    if (mod === 0 || mod === 2) {
      diff = 'mudah';
    } else if (mod === 1 || mod === 3) {
      diff = 'sedang';
    } else {
      diff = 'sulit'; // 1 in 5 is difficult (HOTS)
    }

    const points = diff === 'mudah' ? 50 : diff === 'sedang' ? 100 : 200;

    return {
      id: `c-${idx + 1}`,
      x: loc.x,
      y: loc.y,
      subject: subj,
      difficulty: diff,
      points,
      isOpened: false,
    };
  });
}

export const INITIAL_CHESTS = generateChests(20, 'all');
