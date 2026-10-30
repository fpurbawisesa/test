import { ArenaType, AvatarConfig, InteractiveBuilding, Player, QuestionChest } from '../types/game';
import { drawAvatar } from './AvatarRenderer';
import { ARENA_BUILDINGS, ARENA_OBSTACLES, BUILDINGS, MAP_OBSTACLES, WORLD_HEIGHT, WORLD_WIDTH } from './MapData';
import { sound } from '../utils/sound';

export interface RenderState {
  arena: ArenaType;
  localPlayer: Player;
  players: Record<string, Player>;
  chests: QuestionChest[];
  buildings: InteractiveBuilding[];
  chatBubbles: Record<string, { text: string; expiresAt: number }>;
  onInteractChest: (chest: QuestionChest) => void;
  onInteractBuilding: (building: InteractiveBuilding) => void;
  onPlayerMove: (x: number, y: number, dir: 'down' | 'up' | 'left' | 'right', isMoving: boolean) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: RenderState;
  private running: boolean = false;
  private animFrameId: number | null = null;
  private lastTime: number = 0;

  // Local movement
  private keys: Record<string, boolean> = {};
  private localX: number = 1200;
  private localY: number = 930;
  private localDir: 'down' | 'up' | 'left' | 'right' = 'down';
  private isMoving: boolean = false;
  private animStep: number = 0;
  private animTimer: number = 0;
  private lastNetworkEmitTime: number = 0;

  // Virtual joystick for mobile
  private virtualMoveVector: { x: number; y: number } | null = null;

  // Camera
  private camX: number = 1200;
  private camY: number = 850;

  // Particles
  private particles: Particle[] = [];

  // Interaction prompt target
  public currentInteractable: { type: 'chest' | 'building'; data: QuestionChest | InteractiveBuilding; distance: number } | null = null;

  constructor(canvas: HTMLCanvasElement, state: RenderState) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.state = state;
    this.localX = state.localPlayer.x || 1200;
    this.localY = state.localPlayer.y || 850;
    this.localDir = state.localPlayer.dir || 'down';
    this.camX = this.localX;
    this.camY = this.localY;

    this.bindEvents();
    this.resizeCanvas();
  }

  public updateState(newState: Partial<RenderState>) {
    Object.assign(this.state, newState);
  }

  public setVirtualJoystick(vector: { x: number; y: number } | null) {
    this.virtualMoveVector = vector;
  }

  public triggerInteract() {
    if (!this.currentInteractable) return;
    if (this.currentInteractable.type === 'chest') {
      const chest = this.currentInteractable.data as QuestionChest;
      if (!chest.isOpened) {
        sound.playChestOpen();
        this.state.onInteractChest(chest);
      }
    } else if (this.currentInteractable.type === 'building') {
      sound.playClick();
      this.state.onInteractBuilding(this.currentInteractable.data as InteractiveBuilding);
    }
  }

  private resizeCanvas = () => {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.floor(rect.width * dpr);
    this.canvas.height = Math.floor(rect.height * dpr);
    this.ctx.scale(dpr, dpr);
    this.ctx.imageSmoothingEnabled = false;
  };

  private bindEvents() {
    window.addEventListener('resize', this.resizeCanvas);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
  }

  private unbindEvents() {
    window.removeEventListener('resize', this.resizeCanvas);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      return;
    }

    const key = e.key ? e.key.toLowerCase() : '';
    const code = e.code ? e.code.toLowerCase() : '';
    if (key) this.keys[key] = true;
    if (code) this.keys[code] = true;

    if (key === 'e' || code === 'keye' || key === ' ' || code === 'space') {
      e.preventDefault();
      this.triggerInteract();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    const key = e.key ? e.key.toLowerCase() : '';
    const code = e.code ? e.code.toLowerCase() : '';
    if (key) this.keys[key] = false;
    if (code) this.keys[code] = false;
  };

  private handleBlur = () => {
    this.keys = {};
    this.virtualMoveVector = null;
  };

  public start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public stop() {
    this.running = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public destroy() {
    this.stop();
    this.unbindEvents();
  }

  private loop = (now: number) => {
    if (!this.running) return;
    const rawDt = (now - this.lastTime) / 1000;
    const dt = Math.min(rawDt, 0.05); // clamp delta time
    this.lastTime = now;

    this.update(dt, now);
    this.render(now);

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private checkCollision(newX: number, newY: number, currX: number, currY: number): boolean {
    const radius = 12;
    const obstacles = ARENA_OBSTACLES[this.state.arena || 'kampus'] || MAP_OBSTACLES;
    for (const ob of obstacles) {
      const willCollide = (
        newX + radius > ob.x &&
        newX - radius < ob.x + ob.width &&
        newY + radius > ob.y &&
        newY - radius < ob.y + ob.height
      );
      if (willCollide) {
        // If current position is already intersecting, allow movement that increases distance
        const obCenterX = ob.x + ob.width / 2;
        const obCenterY = ob.y + ob.height / 2;
        const currDist = Math.hypot(currX - obCenterX, currY - obCenterY);
        const newDist = Math.hypot(newX - obCenterX, newY - obCenterY);
        if (newDist > currDist) {
          continue; // moving away from obstacle is allowed!
        }
        return true;
      }
    }
    return false;
  }

  private update(dt: number, now: number) {
    // Determine movement direction from keys (support key and code)
    let dx = 0;
    let dy = 0;

    if (this.keys['w'] || this.keys['arrowup'] || this.keys['keyw']) dy -= 1;
    if (this.keys['s'] || this.keys['arrowdown'] || this.keys['keys']) dy += 1;
    if (this.keys['a'] || this.keys['arrowleft'] || this.keys['keya']) dx -= 1;
    if (this.keys['d'] || this.keys['arrowright'] || this.keys['keyd']) dx += 1;

    // Mobile joystick or on-screen controls override
    if (this.virtualMoveVector) {
      dx = this.virtualMoveVector.x;
      dy = this.virtualMoveVector.y;
    }

    const len = Math.hypot(dx, dy);
    const speed = 240; // pixels per second

    if (len > 0.05) {
      this.isMoving = true;
      const ndx = (dx / len) * speed * dt;
      const ndy = (dy / len) * speed * dt;

      // Update direction
      if (Math.abs(dx) > Math.abs(dy)) {
        this.localDir = dx > 0 ? 'right' : 'left';
      } else {
        this.localDir = dy > 0 ? 'down' : 'up';
      }

      // X movement with collision
      const targetX = this.localX + ndx;
      if (!this.checkCollision(targetX, this.localY, this.localX, this.localY)) {
        this.localX = Math.max(20, Math.min(WORLD_WIDTH - 20, targetX));
      }

      // Y movement with collision
      const targetY = this.localY + ndy;
      if (!this.checkCollision(this.localX, targetY, this.localX, this.localY)) {
        this.localY = Math.max(20, Math.min(WORLD_HEIGHT - 20, targetY));
      }

      // Walk cycle animation
      this.animTimer += dt;
      if (this.animTimer > 0.14) {
        this.animTimer = 0;
        this.animStep = (this.animStep + 1) % 4;
        if (this.animStep === 1 || this.animStep === 3) {
          sound.playFootstep();
          // Spawn footstep dust particle
          this.particles.push({
            x: this.localX + (Math.random() - 0.5) * 8,
            y: this.localY + 4,
            vx: -ndx * 0.2 + (Math.random() - 0.5) * 10,
            vy: -ndy * 0.2 + (Math.random() - 0.5) * 10,
            color: 'rgba(217, 119, 6, 0.4)',
            size: 3,
            alpha: 0.6,
            life: 0.35,
          });
        }
      }
    } else {
      this.isMoving = false;
      this.animStep = 0;
      this.animTimer = 0;
    }

    // Camera follow (lerp smoothly)
    const viewW = this.canvas.clientWidth || 800;
    const viewH = this.canvas.clientHeight || 600;
    this.camX += (this.localX - viewW / 2 - this.camX) * 0.12;
    this.camY += (this.localY - viewH / 2 - this.camY) * 0.12;
    this.camX = Math.max(0, Math.min(WORLD_WIDTH - viewW, this.camX));
    this.camY = Math.max(0, Math.min(WORLD_HEIGHT - viewH, this.camY));

    // Throttled network sync (send movement to server ~15 times per second)
    if (now - this.lastNetworkEmitTime > 65) {
      this.lastNetworkEmitTime = now;
      this.state.onPlayerMove(Math.round(this.localX), Math.round(this.localY), this.localDir, this.isMoving);
    }

    // Find nearest interactable (Chests or Buildings)
    let closestChest: QuestionChest | null = null;
    let minChestDist = 65; // interaction radius

    for (const c of this.state.chests) {
      if (!c.isOpened) {
        const d = Math.hypot(this.localX - c.x, this.localY - c.y);
        if (d < minChestDist) {
          minChestDist = d;
          closestChest = c;
        }
      }
    }

    let closestBuilding: InteractiveBuilding | null = null;
    let minBldDist = 120;
    const currentBuildings = this.state.buildings || ARENA_BUILDINGS[this.state.arena || 'kampus'] || BUILDINGS;
    for (const b of currentBuildings) {
      const doorX = b.x + b.width / 2;
      const doorY = b.y + b.height;
      const d = Math.hypot(this.localX - doorX, this.localY - doorY);
      if (d < minBldDist) {
        minBldDist = d;
        closestBuilding = b;
      }
    }

    if (closestChest) {
      this.currentInteractable = { type: 'chest', data: closestChest, distance: minChestDist };
    } else if (closestBuilding) {
      this.currentInteractable = { type: 'building', data: closestBuilding, distance: minBldDist };
    } else {
      this.currentInteractable = null;
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / 0.4);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private render(now: number) {
    const ctx = this.ctx;
    const viewW = this.canvas.clientWidth || 800;
    const viewH = this.canvas.clientHeight || 600;

    ctx.save();
    // Clear screen
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, viewW, viewH);

    // Camera transform
    ctx.translate(-Math.floor(this.camX), -Math.floor(this.camY));

    // 1. Draw World Background (Grass, Paths, Plaza, River)
    this.renderWorldBackground(ctx, now);

    // 2. Draw Interactive Buildings
    this.renderBuildings(ctx);

    // 3. Draw Question Chests
    this.renderChests(ctx, now);

    // 4. Draw Particles (Footsteps, sparkles)
    for (const p of this.particles) {
      ctx.fillStyle = p.color.replace('0.6', String(p.alpha.toFixed(2)));
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
    }

    // 5. Draw Remote Players
    const localId = this.state.localPlayer.id;
    for (const pid in this.state.players) {
      if (pid === localId) continue;
      const rp = this.state.players[pid];
      this.renderPlayer(ctx, rp, now);
    }

    // 6. Draw Local Player
    const localPlayerCopy: Player = {
      ...this.state.localPlayer,
      x: this.localX,
      y: this.localY,
      dir: this.localDir,
      isMoving: this.isMoving,
    };
    this.renderPlayer(ctx, localPlayerCopy, now, true);

    // 7. Interaction Highlight / Arrow Indicator
    if (this.currentInteractable) {
      this.renderInteractPrompt(ctx, now);
    }

    ctx.restore();

    // 8. Render HUD Minimap (Screen-space top right)
    this.renderMinimap(ctx, viewW);
  }

  private renderWorldBackground(ctx: CanvasRenderingContext2D, now: number) {
    const arena = this.state.arena || 'kampus';

    if (arena === 'hutan') {
      this.renderHutanBackground(ctx, now);
    } else if (arena === 'labirin') {
      this.renderLabirinBackground(ctx, now);
    } else if (arena === 'kota') {
      this.renderKotaBackground(ctx, now);
    } else {
      this.renderKampusBackground(ctx, now);
    }

    // World Border Fence
    ctx.fillStyle = arena === 'kota' ? '#334155' : arena === 'labirin' ? '#475569' : '#78350f';
    ctx.fillRect(0, 0, WORLD_WIDTH, 20);
    ctx.fillRect(0, WORLD_HEIGHT - 20, WORLD_WIDTH, 20);
    ctx.fillRect(0, 0, 20, WORLD_HEIGHT);
    ctx.fillRect(WORLD_WIDTH - 20, 0, 20, WORLD_HEIGHT);
  }

  private renderKampusBackground(ctx: CanvasRenderingContext2D, now: number) {
    // Base lush grass field
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Grass pattern texture
    ctx.fillStyle = '#16a34a';
    for (let x = 0; x < WORLD_WIDTH; x += 120) {
      for (let y = 0; y < WORLD_HEIGHT; y += 120) {
        ctx.fillRect(x + 20, y + 30, 8, 4);
        ctx.fillRect(x + 70, y + 80, 10, 4);
      }
    }

    // River in the south
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(0, 1620, WORLD_WIDTH, 140);
    ctx.fillStyle = '#38bdf8';
    const waveShift = Math.sin(now * 0.003) * 10;
    for (let rx = 20; rx < WORLD_WIDTH; rx += 140) {
      ctx.fillRect(rx + waveShift, 1660, 40, 6);
      ctx.fillRect(rx - waveShift + 60, 1710, 35, 6);
    }

    // Wooden Bridges
    const bridgeXs = [600, 1200, 1800];
    for (const bx of bridgeXs) {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(bx - 35, 1610, 70, 160);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(bx - 32, 1610, 64, 160);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(bx - 35, 1610, 6, 160);
      ctx.fillRect(bx + 29, 1610, 6, 160);
    }

    // Cobblestone Pathways
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(1150, 480, 100, 1140);
    ctx.fillRect(450, 800, 1550, 90);
    ctx.fillRect(520, 520, 70, 290);
    ctx.fillRect(1820, 520, 70, 290);
    ctx.fillRect(500, 880, 70, 280);
    ctx.fillRect(1820, 880, 70, 280);

    ctx.fillStyle = '#94a3b8';
    for (let px = 450; px < 2000; px += 40) {
      ctx.fillRect(px, 796, 40, 4);
      ctx.fillRect(px, 888, 40, 4);
    }

    // Central Plaza Nusantara
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(1200, 820, 160, 0, Math.PI * 2);
    ctx.fill();

    // Central Monument & Indonesian Flag
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(1200, 820, 36, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(1198, 730, 4, 90);
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(1200, 728, 4, 0, Math.PI * 2);
    ctx.fill();

    const flagWave = Math.sin(now * 0.006) * 4;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(1202, 732, 28, 9 + flagWave * 0.4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(1202, 741 + flagWave * 0.4, 28, 9 - flagWave * 0.4);

    this.renderTrees(ctx);
  }

  private renderHutanBackground(ctx: CanvasRenderingContext2D, now: number) {
    // Deep wild rainforest floor
    ctx.fillStyle = '#14532d';
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Forest moss & fallen leaf textures
    ctx.fillStyle = '#166534';
    for (let x = 0; x < WORLD_WIDTH; x += 90) {
      for (let y = 0; y < WORLD_HEIGHT; y += 90) {
        ctx.fillRect(x + 15, y + 25, 16, 8);
        ctx.fillRect(x + 55, y + 60, 12, 6);
      }
    }

    // Winding Jungle River
    ctx.fillStyle = '#0369a1';
    ctx.fillRect(0, 1620, WORLD_WIDTH, 140);
    ctx.fillStyle = '#38bdf8';
    const waveShift = Math.sin(now * 0.004) * 8;
    for (let rx = 10; rx < WORLD_WIDTH; rx += 100) {
      ctx.fillRect(rx + waveShift, 1670, 30, 4);
    }

    // Dirt & Mud Trail Roads
    ctx.fillStyle = '#78350f';
    ctx.fillRect(1150, 480, 100, 1140);
    ctx.fillRect(450, 800, 1550, 90);
    ctx.fillRect(520, 520, 70, 290);
    ctx.fillRect(1820, 520, 70, 290);
    ctx.fillRect(500, 880, 70, 280);
    ctx.fillRect(1820, 880, 70, 280);

    ctx.fillStyle = '#a16207';
    for (let px = 460; px < 1980; px += 35) {
      ctx.fillRect(px, 800, 30, 85);
    }

    // Central Campfire Grove
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.arc(1200, 820, 150, 0, Math.PI * 2);
    ctx.fill();

    // Campfire ring stones
    ctx.fillStyle = '#78716c';
    ctx.beginPath();
    ctx.arc(1200, 820, 36, 0, Math.PI * 2);
    ctx.fill();

    // Animated Campfire Flames
    const fireFlicker = Math.sin(now * 0.015) * 4;
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(1200, 818 + fireFlicker, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(1200, 816 + fireFlicker, 10, 0, Math.PI * 2);
    ctx.fill();

    // Wild dense rainforest trees
    this.renderTrees(ctx);
  }

  private renderLabirinBackground(ctx: CanvasRenderingContext2D, now: number) {
    // Dark stone dungeon floor
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Stone tile grid pattern
    ctx.fillStyle = '#1e293b';
    for (let x = 0; x < WORLD_WIDTH; x += 80) {
      ctx.fillRect(x, 0, 2, WORLD_HEIGHT);
    }
    for (let y = 0; y < WORLD_HEIGHT; y += 80) {
      ctx.fillRect(0, y, WORLD_WIDTH, 2);
    }

    // Maze corridors (paved stone paths)
    ctx.fillStyle = '#334155';
    ctx.fillRect(1150, 480, 100, 1140);
    ctx.fillRect(450, 800, 1550, 90);
    ctx.fillRect(520, 520, 70, 290);
    ctx.fillRect(1820, 520, 70, 290);
    ctx.fillRect(500, 880, 70, 280);
    ctx.fillRect(1820, 880, 70, 280);

    // Render Labirin Stone Walls
    const mazeWalls = ARENA_OBSTACLES.labirin.slice(10);
    for (const w of mazeWalls) {
      ctx.fillStyle = '#475569';
      ctx.fillRect(w.x, w.y, w.width, w.height);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(w.x + 2, w.y + 2, w.width - 4, 8);
      // Torch sconce on wall
      const torchX = w.x + w.width / 2;
      const torchY = w.y + 15;
      const torchFlicker = Math.sin(now * 0.02 + torchX) * 2;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(torchX, torchY + torchFlicker, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Central Altar Circle
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(1200, 820, 140, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Glowing Arcane Compass Emblem
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(1200, 820, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(1196, 796, 8, 48);
    ctx.fillRect(1176, 816, 48, 8);
  }

  private renderKotaBackground(ctx: CanvasRenderingContext2D, now: number) {
    // Dark modern asphalt metropolis
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // City street grid
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(1130, 460, 140, 1180); // Main Boulevard
    ctx.fillRect(430, 780, 1590, 130); // Cross Expressway
    ctx.fillRect(500, 500, 110, 310);
    ctx.fillRect(1800, 500, 110, 310);
    ctx.fillRect(480, 870, 110, 300);
    ctx.fillRect(1800, 870, 110, 300);

    // Dashed white road lanes
    ctx.fillStyle = '#ffffff';
    for (let ry = 480; ry < 1620; ry += 50) {
      ctx.fillRect(1198, ry, 4, 25);
    }
    for (let rx = 450; rx < 2000; rx += 50) {
      ctx.fillRect(rx, 843, 25, 4);
    }

    // Zebra Crossings (Crosswalks)
    for (let zw = 0; zw < 80; zw += 16) {
      ctx.fillRect(1160 + zw, 750, 10, 24);
      ctx.fillRect(1160 + zw, 920, 10, 24);
    }

    // Cyber Sidewalk Neon Edge
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(430, 776, 1590, 4);
    ctx.fillRect(430, 910, 1590, 4);

    // Central Cyber Plaza
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(1200, 820, 160, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Rotating Holographic Data Ring in Plaza
    const rot = now * 0.002;
    ctx.save();
    ctx.translate(1200, 820);
    ctx.rotate(rot);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(-28, -28, 56, 56);
    ctx.rotate(rot * 0.5);
    ctx.strokeStyle = '#a855f7';
    ctx.strokeRect(-18, -18, 36, 36);
    ctx.restore();

    // Hologram Crystal Core
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(1200, 820, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderTrees(ctx: CanvasRenderingContext2D) {
    const treePositions = [
      [150, 150], [280, 120], [100, 380], [200, 750], [120, 1100], [200, 1350],
      [900, 150], [1450, 150], [2250, 150], [2200, 380], [2250, 750], [2200, 1250],
      [800, 1050], [1550, 1050], [750, 600], [1650, 600]
    ];

    for (const [tx, ty] of treePositions) {
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(tx, ty + 20, 25, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#78350f';
      ctx.fillRect(tx - 6, ty - 5, 12, 25);

      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(tx, ty - 25, 28, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(tx - 4, ty - 30, 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#86efac';
      ctx.fillRect(tx - 12, ty - 38, 8, 8);
    }
  }

  private renderBuildings(ctx: CanvasRenderingContext2D) {
    const blds = this.state.buildings || BUILDINGS;
    for (const b of blds) {
      // Drop Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(b.x + 8, b.y + 12, b.width, b.height);

      // Main walls
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.width, b.height);

      // Roof
      ctx.fillStyle = b.roofColor;
      ctx.beginPath();
      ctx.moveTo(b.x - 15, b.y + 35);
      ctx.lineTo(b.x + b.width / 2, b.y - 30);
      ctx.lineTo(b.x + b.width + 15, b.y + 35);
      ctx.closePath();
      ctx.fill();

      // Roof ridge & tiles
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(b.x + 10, b.y + 10, b.width - 20, 6);

      // Entrance Door (Center bottom)
      const doorW = 44;
      const doorH = 55;
      const doorX = b.x + b.width / 2 - doorW / 2;
      const doorY = b.y + b.height - doorH;

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(doorX, doorY, doorW, doorH);

      // Door frame & mat
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(doorX - 4, doorY - 4, doorW + 8, 4);
      ctx.fillStyle = '#334155';
      ctx.fillRect(doorX + 2, doorY + 2, doorW - 4, doorH - 2);

      // Windows with warm light
      const winY = b.y + 60;
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(b.x + 25, winY, 32, 28);
      ctx.fillRect(b.x + b.width - 57, winY, 32, 28);
      // Window mullions
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(b.x + 40, winY, 2, 28);
      ctx.fillRect(b.x + 25, winY + 14, 32, 2);
      ctx.fillRect(b.x + b.width - 42, winY, 2, 28);
      ctx.fillRect(b.x + b.width - 57, winY + 14, 32, 2);

      // Signboard / Banner
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(b.x + 20, b.y + 32, b.width - 40, 24);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x + 20, b.y + 32, b.width - 40, 24);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.name, b.x + b.width / 2, b.y + 44);
    }
  }

  private renderChests(ctx: CanvasRenderingContext2D, now: number) {
    for (const c of this.state.chests) {
      ctx.save();
      const cx = c.x;
      const cy = c.y;

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 12, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      if (c.isOpened) {
        // Opened chest (wood and empty)
        ctx.fillStyle = '#78350f';
        ctx.fillRect(cx - 12, cy - 6, 24, 16);
        ctx.fillStyle = '#451a03';
        ctx.fillRect(cx - 10, cy - 4, 20, 6);
      } else {
        const diff = c.difficulty || 'sedang';
        const floatY = Math.sin(now * 0.005 + cx) * (diff === 'sulit' ? 4 : 3);
        const boxY = cy - 8 + floatY;

        // Visual design tiered by difficulty:
        // MUDAH (50 pts): Emerald bronze
        // SEDANG (100 pts): Sapphire steel
        // SULIT (200 pts): Radiant gold & ruby with star sparkles!
        let mainBoxColor = '#d97706'; // default
        let trimColor = '#92400e';
        let glowColor = 'rgba(253, 224, 71, 0.4)';
        let tierLabel = '50';

        if (diff === 'mudah') {
          mainBoxColor = '#059669'; // Emerald bronze
          trimColor = '#047857';
          glowColor = 'rgba(52, 211, 153, 0.5)';
          tierLabel = '50';
        } else if (diff === 'sedang') {
          mainBoxColor = '#2563eb'; // Sapphire steel
          trimColor = '#1d4ed8';
          glowColor = 'rgba(96, 165, 250, 0.5)';
          tierLabel = '100';
        } else if (diff === 'sulit') {
          mainBoxColor = '#eab308'; // Imperial Gold
          trimColor = '#dc2626'; // Ruby trim
          glowColor = 'rgba(245, 158, 11, 0.7)';
          tierLabel = '200';
        }

        // Chest Body
        ctx.fillStyle = mainBoxColor;
        ctx.fillRect(cx - 14, boxY, 28, 18);

        // Metal Trim
        ctx.fillStyle = trimColor;
        ctx.fillRect(cx - 14, boxY, 28, 4);
        ctx.fillRect(cx - 14, boxY + 14, 28, 4);

        // Lock & Keyhole
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(cx - 4, boxY + 6, 8, 7);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(cx - 1, boxY + 8, 2, 3);

        // Subject Color Jewel
        let subjectColor = '#3b82f6';
        if (c.subject === 'ipas') subjectColor = '#10b981';
        if (c.subject === 'bahasa_indonesia') subjectColor = '#f59e0b';
        if (c.subject === 'pancasila') subjectColor = '#ef4444';
        if (c.subject === 'pjok') subjectColor = '#8b5cf6';
        if (c.subject === 'seni_budaya') subjectColor = '#ec4899';

        ctx.fillStyle = subjectColor;
        ctx.fillRect(cx - 3, boxY + 1, 6, 5);

        // Glowing sparkle ring / aura
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = diff === 'sulit' ? 2.5 : 1.5;
        ctx.strokeRect(cx - 16, boxY - 2, 32, 22);

        // Point value tag floating above chest
        ctx.fillStyle = diff === 'sulit' ? '#ef4444' : diff === 'sedang' ? '#3b82f6' : '#10b981';
        ctx.beginPath();
        ctx.roundRect(cx - 14, boxY - 14, 28, 11, 3);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`+${tierLabel}`, cx, boxY - 8.5);
      }
      ctx.restore();
    }
  }

  private renderPlayer(ctx: CanvasRenderingContext2D, p: Player, now: number, isLocal: boolean = false) {
    const x = isLocal ? this.localX : p.x;
    const y = isLocal ? this.localY : p.y;
    const dir = isLocal ? this.localDir : p.dir;
    const animStep = isLocal ? this.animStep : (p.isMoving ? Math.floor(now / 150) % 4 : 0);

    // Draw Character Sprite
    drawAvatar(ctx, x, y, p.avatar, dir, animStep, 2.3);

    // Name tag & Level badge above player head
    ctx.save();
    ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';

    const nameText = isLocal ? `${p.name} (Kamu)` : p.name;
    const badgeText = `Lv.${p.level}`;
    const nameWidth = ctx.measureText(nameText).width;

    // Background pill
    const tagY = y - 76;
    ctx.fillStyle = isLocal ? 'rgba(30, 58, 138, 0.85)' : 'rgba(15, 23, 42, 0.75)';
    ctx.beginPath();
    ctx.roundRect(x - nameWidth / 2 - 18, tagY - 14, nameWidth + 36, 18, 9);
    ctx.fill();
    ctx.strokeStyle = isLocal ? '#60a5fa' : '#94a3b8';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Level badge
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(badgeText, x - nameWidth / 2 - 8, tagY - 1);

    // Name text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(nameText, x + 8, tagY - 1);

    // Chat Speech Bubble (if any)
    const chat = this.state.chatBubbles[p.id];
    if (chat && chat.expiresAt > now) {
      this.renderChatBubble(ctx, x, tagY - 24, chat.text);
    }

    ctx.restore();
  }

  private renderChatBubble(ctx: CanvasRenderingContext2D, x: number, y: number, text: string) {
    ctx.save();
    ctx.font = '12px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    const textWidth = Math.min(ctx.measureText(text).width, 180);
    const bubbleW = textWidth + 24;
    const bubbleH = 26;

    // Bubble body
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(x - bubbleW / 2, y - bubbleH, bubbleW, bubbleH, 6);
    ctx.fill();

    // Little triangular tail
    ctx.beginPath();
    ctx.moveTo(x - 5, y);
    ctx.lineTo(x, y + 6);
    ctx.lineTo(x + 5, y);
    ctx.fill();

    // Text inside
    ctx.fillStyle = '#0f172a';
    ctx.fillText(text, x, y - 9, 170);
    ctx.restore();
  }

  private renderInteractPrompt(ctx: CanvasRenderingContext2D, now: number) {
    if (!this.currentInteractable) return;
    const target = this.currentInteractable.data;
    const isChest = this.currentInteractable.type === 'chest';

    const tx = isChest ? (target as QuestionChest).x : (target as InteractiveBuilding).x + (target as InteractiveBuilding).width / 2;
    const ty = isChest ? (target as QuestionChest).y - 28 : (target as InteractiveBuilding).y + (target as InteractiveBuilding).height + 15;

    const bob = Math.sin(now * 0.008) * 3;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Bouncing arrow
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(tx, ty - 8 + bob);
    ctx.lineTo(tx - 6, ty - 16 + bob);
    ctx.lineTo(tx + 6, ty - 16 + bob);
    ctx.closePath();
    ctx.fill();

    // Key prompt pill
    let promptText = '';
    if (isChest) {
      const c = target as QuestionChest;
      const pts = c.points || (c.difficulty === 'sulit' ? 200 : c.difficulty === 'mudah' ? 50 : 100);
      const diffLabel = c.difficulty === 'sulit' ? 'Sulit (HOTS)' : c.difficulty === 'mudah' ? 'Mudah' : 'Sedang';
      promptText = `Tekan [E] Peti ${diffLabel} (+${pts} Poin)`;
    } else {
      promptText = `Tekan [E] Masuk ${(target as InteractiveBuilding).name}`;
    }

    ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
    const textW = ctx.measureText(promptText).width;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.beginPath();
    ctx.roundRect(tx - textW / 2 - 12, ty - 38 + bob, textW + 24, 22, 6);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.fillText(promptText, tx, ty - 27 + bob);
    ctx.restore();
  }

  private renderMinimap(ctx: CanvasRenderingContext2D, viewW: number) {
    const miniW = 140;
    const miniH = 105;
    const miniX = viewW - miniW - 16;
    const miniY = 16;

    ctx.save();
    // Background frame
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(miniX, miniY, miniW, miniH);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.strokeRect(miniX, miniY, miniW, miniH);

    // Map scale
    const sx = miniW / WORLD_WIDTH;
    const sy = miniH / WORLD_HEIGHT;

    // Buildings on minimap
    const mapBuildings = this.state.buildings || ARENA_BUILDINGS[this.state.arena || 'kampus'] || BUILDINGS;
    for (const b of mapBuildings) {
      ctx.fillStyle = b.roofColor;
      ctx.fillRect(miniX + b.x * sx, miniY + b.y * sy, b.width * sx, b.height * sy);
    }

    // Chests on minimap (yellow dots)
    for (const c of this.state.chests) {
      if (!c.isOpened) {
        ctx.fillStyle = '#eab308';
        ctx.fillRect(miniX + c.x * sx - 1.5, miniY + c.y * sy - 1.5, 3, 3);
      }
    }

    // Other players (cyan dots)
    ctx.fillStyle = '#38bdf8';
    for (const pid in this.state.players) {
      if (pid === this.state.localPlayer.id) continue;
      const rp = this.state.players[pid];
      ctx.fillRect(miniX + rp.x * sx - 2, miniY + rp.y * sy - 2, 4, 4);
    }

    // Local player (bright pulsing red/gold dot)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(miniX + this.localX * sx, miniY + this.localY * sy, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Minimap title
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillText('MAP', miniX + 6, miniY + 12);

    ctx.restore();
  }
}
