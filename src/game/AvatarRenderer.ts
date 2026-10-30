import { AvatarConfig } from '../types/game';

export const OUTFIT_LABELS: Record<AvatarConfig['outfit'], string> = {
  sd_uniform: 'Seragam Merah Putih SD',
  pramuka: 'Seragam Pramuka Siaga/Penggalang',
  scientist: 'Jas Peneliti Cilik IPAS',
  adventurer: 'Kostum Penjelajah Alam',
  sports: 'Kostum Olahraga Atlet',
  cyber: 'Kostum Penjelajah Digital',
};

export const HAIR_STYLE_LABELS: Record<AvatarConfig['hairStyle'], string> = {
  short: 'Rambut Pendek Rapi',
  spiky: 'Rambut Spiky Keren',
  ponytail: 'Kuncir Kuda Dinamis',
  curls: 'Rambut Ikal Lucu',
  bob: 'Gaya Rambut Bob Modern',
};

export const HAT_LABELS: Record<AvatarConfig['hat'], string> = {
  none: 'Tanpa Topi',
  sd_cap: 'Topi Merah Putih SD',
  wizard: 'Topi Penyihir Bintang',
  explorer: 'Topi Petualang Rimba',
  crown: 'Mahkota Juara Emas',
  beret: 'Baret Pelukis Cilik',
};

export const ACCESSORY_LABELS: Record<AvatarConfig['accessory'], string> = {
  none: 'Tanpa Aksesoris',
  glasses: 'Kacamata Pintar',
  goggles: 'Kacamata Petualang',
  headphones: 'Headphone Gaming',
  scarf: 'Syal Pahlawan Merah',
};

export const COLOR_PALETTES = {
  skin: ['#ffd7ba', '#fcd5ce', '#e0afa0', '#d4a373', '#b07d62', '#8c5836', '#ffe0bd'],
  hair: ['#1e1b18', '#3d2618', '#734822', '#c68642', '#f3c68f', '#b91c1c', '#047857', '#1d4ed8', '#7e22ce'],
};

/**
 * Draws a pixelated character sprite at (x, y) where x,y is the center of the base shadow
 */
export function drawAvatar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  avatar: AvatarConfig,
  dir: 'down' | 'up' | 'left' | 'right' = 'down',
  animStep: number = 0,
  scale: number = 2.5
) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const bobY = (animStep % 2 !== 0) ? -2 * scale : 0;
  const legOffset = animStep === 1 ? -2 * scale : animStep === 3 ? 2 * scale : 0;

  // 1. Drop shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 2 * scale, 9 * scale, 4 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Helper pixel drawer relative to character center
  const p = (rx: number, ry: number, rw: number, rh: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(cx + rx * scale), Math.floor(cy + (ry + bobY / scale) * scale), Math.ceil(rw * scale), Math.ceil(rh * scale));
  };

  const skin = avatar.skinColor || '#ffd7ba';
  const hair = avatar.hairColor || '#3d2618';

  // 2. Legs / Shoes
  let shoeColor = '#1f2937';
  let sockColor = '#ffffff';
  let pantColor = '#991b1b'; // default SD red

  if (avatar.outfit === 'pramuka') pantColor = '#451a03';
  if (avatar.outfit === 'scientist') pantColor = '#334155';
  if (avatar.outfit === 'adventurer') pantColor = '#78350f';
  if (avatar.outfit === 'sports') pantColor = '#0284c7';
  if (avatar.outfit === 'cyber') pantColor = '#1e1b4b';

  // Left & Right Leg
  const legY = -6;
  if (dir === 'left' || dir === 'right') {
    // Side profile legs
    p(-3, legY + (dir === 'left' ? legOffset : -legOffset) / scale, 3, 5, pantColor);
    p(1, legY - (dir === 'left' ? legOffset : -legOffset) / scale, 3, 5, pantColor);
    p(-3, legY + 5, 3, 2, sockColor);
    p(1, legY + 5, 3, 2, sockColor);
    p(dir === 'left' ? -4 : -3, legY + 7, 4, 2, shoeColor);
    p(dir === 'right' ? 1 : 0, legY + 7, 4, 2, shoeColor);
  } else {
    // Front or Back
    p(-4, legY + legOffset / scale, 3, 5, pantColor);
    p(1, legY - legOffset / scale, 3, 5, pantColor);
    p(-4, legY + 5, 3, 2, sockColor);
    p(1, legY + 5, 3, 2, sockColor);
    p(-5, legY + 7, 4, 2, shoeColor);
    p(1, legY + 7, 4, 2, shoeColor);
  }

  // 3. Torso / Shirt
  let shirtColor = '#ffffff';
  let accentColor = '#dc2626';

  if (avatar.outfit === 'pramuka') {
    shirtColor = '#d97706';
    accentColor = '#b45309';
  } else if (avatar.outfit === 'scientist') {
    shirtColor = '#f8fafc';
    accentColor = '#06b6d4';
  } else if (avatar.outfit === 'adventurer') {
    shirtColor = '#059669';
    accentColor = '#b45309';
  } else if (avatar.outfit === 'sports') {
    shirtColor = '#2563eb';
    accentColor = '#fbbf24';
  } else if (avatar.outfit === 'cyber') {
    shirtColor = '#3b82f6';
    accentColor = '#a855f7';
  }

  // Body rectangle
  p(-5, -14, 10, 8, shirtColor);

  // Outfit specific details (Tie, Collar, Emblem)
  if (dir !== 'up') {
    if (avatar.outfit === 'sd_uniform') {
      // SD Red Tie
      p(-1, -13, 2, 5, '#dc2626');
      p(-1, -8, 2, 2, '#991b1b');
    } else if (avatar.outfit === 'pramuka') {
      // Hasduk merah putih
      p(-3, -14, 6, 2, '#dc2626');
      p(-1, -12, 2, 4, '#ffffff');
    } else if (avatar.outfit === 'scientist') {
      // Cyan collar & pocket
      p(-4, -13, 2, 4, '#06b6d4');
      p(2, -10, 2, 2, '#0284c7');
    } else if (avatar.outfit === 'sports') {
      // Chest stripe
      p(-5, -11, 10, 2, '#fbbf24');
    } else if (avatar.outfit === 'cyber') {
      // Neon power core
      p(-1, -11, 2, 2, '#06b6d4');
    }
  } else {
    // Back details (seam or backpack)
    p(-3, -13, 6, 6, accentColor);
  }

  // Arms
  if (dir === 'down' || dir === 'up') {
    p(-7, -13, 2, 6, shirtColor);
    p(5, -13, 2, 6, shirtColor);
    p(-7, -7, 2, 2, skin);
    p(5, -7, 2, 2, skin);
  } else if (dir === 'left') {
    p(-3, -13, 2, 6, shirtColor);
    p(-3, -7, 2, 2, skin);
  } else if (dir === 'right') {
    p(1, -13, 2, 6, shirtColor);
    p(1, -7, 2, 2, skin);
  }

  // 4. Neck & Head
  p(-2, -16, 4, 2, skin); // neck
  p(-6, -26, 12, 10, skin); // head base

  // Face (only when facing front or sideways)
  if (dir === 'down') {
    // Eyes
    p(-4, -22, 2, 2, '#1e293b');
    p(2, -22, 2, 2, '#1e293b');
    // Eye shines
    p(-4, -22, 1, 1, '#ffffff');
    p(2, -22, 1, 1, '#ffffff');
    // Blush
    p(-5, -19, 2, 1, '#fca5a5');
    p(3, -19, 2, 1, '#fca5a5');
    // Smile
    p(-1, -18, 2, 1, '#991b1b');
  } else if (dir === 'left') {
    p(-5, -22, 2, 2, '#1e293b');
    p(-5, -22, 1, 1, '#ffffff');
    p(-5, -19, 2, 1, '#fca5a5');
  } else if (dir === 'right') {
    p(3, -22, 2, 2, '#1e293b');
    p(4, -22, 1, 1, '#ffffff');
    p(3, -19, 2, 1, '#fca5a5');
  }

  // 5. Hair
  const hairStyle = avatar.hairStyle || 'short';
  if (hairStyle === 'short') {
    p(-7, -28, 14, 5, hair);
    if (dir === 'down') {
      p(-6, -24, 2, 2, hair);
      p(4, -24, 2, 2, hair);
      p(-2, -24, 2, 1, hair);
    } else if (dir === 'up') {
      p(-6, -24, 12, 6, hair);
    }
  } else if (hairStyle === 'spiky') {
    p(-7, -29, 14, 6, hair);
    p(-5, -31, 3, 3, hair);
    p(0, -32, 3, 4, hair);
    p(3, -31, 3, 3, hair);
    if (dir === 'up') {
      p(-6, -24, 12, 6, hair);
    }
  } else if (hairStyle === 'ponytail') {
    p(-7, -28, 14, 5, hair);
    if (dir === 'down') {
      p(-6, -24, 2, 3, hair);
      p(4, -24, 2, 3, hair);
      // Ponytail visible on right
      p(6, -26, 3, 7, hair);
    } else if (dir === 'up') {
      p(-6, -24, 12, 6, hair);
      p(-2, -22, 4, 8, hair); // large ponytail in back
    } else if (dir === 'left') {
      p(4, -26, 4, 7, hair);
    } else if (dir === 'right') {
      p(-8, -26, 4, 7, hair);
    }
  } else if (hairStyle === 'bob') {
    p(-7, -28, 14, 6, hair);
    p(-7, -23, 3, 6, hair);
    p(4, -23, 3, 6, hair);
    if (dir === 'up') {
      p(-6, -24, 12, 8, hair);
    }
  } else if (hairStyle === 'curls') {
    p(-8, -29, 16, 7, hair);
    p(-8, -23, 3, 4, hair);
    p(5, -23, 3, 4, hair);
    if (dir === 'up') {
      p(-7, -24, 14, 7, hair);
    }
  }

  // 6. Accessories
  if (avatar.accessory === 'glasses' && dir === 'down') {
    p(-5, -23, 4, 3, 'rgba(30, 41, 59, 0.9)');
    p(1, -23, 4, 3, 'rgba(30, 41, 59, 0.9)');
    p(-1, -22, 2, 1, '#1e293b');
    // lens shine
    p(-4, -22, 1, 1, '#67e8f9');
    p(2, -22, 1, 1, '#67e8f9');
  } else if (avatar.accessory === 'goggles') {
    // perched on forehead
    p(-6, -26, 5, 3, '#d97706');
    p(1, -26, 5, 3, '#d97706');
    p(-1, -25, 2, 1, '#78350f');
    p(-5, -25, 3, 1, '#38bdf8');
    p(2, -25, 3, 1, '#38bdf8');
  } else if (avatar.accessory === 'headphones') {
    p(-8, -25, 2, 6, '#06b6d4');
    p(6, -25, 2, 6, '#06b6d4');
    p(-7, -29, 14, 2, '#334155');
  } else if (avatar.accessory === 'scarf') {
    p(-5, -15, 10, 3, '#ef4444');
    if (dir === 'left') p(3, -14, 4, 6, '#dc2626');
    if (dir === 'right') p(-7, -14, 4, 6, '#dc2626');
    if (dir === 'down' || dir === 'up') p(-2, -13, 3, 5, '#dc2626');
  }

  // 7. Hats
  if (avatar.hat === 'sd_cap') {
    // Indonesian SD Cap: red top, white front band, red visor
    p(-7, -31, 14, 5, '#dc2626');
    p(-6, -27, 12, 2, '#ffffff');
    if (dir === 'down') {
      p(-8, -26, 16, 2, '#b91c1c'); // visor front
      p(-1, -28, 2, 2, '#eab308'); // yellow SD badge
    } else if (dir === 'left') {
      p(-10, -26, 6, 2, '#b91c1c');
    } else if (dir === 'right') {
      p(4, -26, 6, 2, '#b91c1c');
    }
  } else if (avatar.hat === 'wizard') {
    p(-8, -28, 16, 2, '#4338ca');
    p(-5, -34, 10, 6, '#4f46e5');
    p(-3, -39, 6, 5, '#4f46e5');
    p(-1, -43, 2, 4, '#fbbf24'); // star peak
  } else if (avatar.hat === 'explorer') {
    p(-9, -27, 18, 3, '#78350f');
    p(-6, -32, 12, 5, '#92400e');
    p(-6, -28, 12, 2, '#15803d'); // green band
  } else if (avatar.hat === 'crown') {
    p(-6, -32, 12, 6, '#eab308');
    p(-6, -34, 3, 2, '#eab308');
    p(-1, -35, 3, 3, '#eab308');
    p(4, -34, 3, 2, '#eab308');
    p(0, -31, 2, 2, '#ef4444'); // ruby gem
  } else if (avatar.hat === 'beret') {
    p(-8, -30, 16, 4, '#be123c');
    p(-2, -32, 4, 2, '#be123c');
    p(-1, -33, 2, 2, '#fbbf24');
  }

  ctx.restore();
}

/**
 * Creates a PNG Data URL of the avatar for UI preview panels
 */
export function renderAvatarPreview(avatar: AvatarConfig, size: number = 96): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const scale = size / 36;
  drawAvatar(ctx, size / 2, size * 0.82, avatar, 'down', 0, scale);
  return canvas.toDataURL();
}
