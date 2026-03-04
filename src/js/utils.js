// ============================================================
// Cosmic Defender - Utility Functions & Game Constants
// ============================================================

// --- Game Constants ---

const GAME = {
  WIDTH: 800,
  HEIGHT: 600,
  FPS: 60,
  FIXED_DT: 1 / 60,
  MAX_DT: 0.05, // cap delta to avoid spiral of death
};

const COLORS = {
  // Player
  PLAYER_BODY: '#00e5ff',
  PLAYER_ENGINE: '#ff4081',
  PLAYER_SHIELD: 'rgba(0, 229, 255, 0.3)',

  // Enemies
  ENEMY_BASIC: '#ff5252',
  ENEMY_ZIGZAG: '#ffab40',
  ENEMY_TANK: '#7c4dff',
  ENEMY_BOSS: '#ff1744',

  // Bullets
  BULLET_PLAYER: '#00e5ff',
  BULLET_ENEMY: '#ff5252',

  // Power-ups
  POWERUP_SHIELD: '#00e5ff',
  POWERUP_SPREAD: '#ffab40',
  POWERUP_RAPID: '#ff4081',
  POWERUP_LIFE: '#69f0ae',

  // Particles
  PARTICLE_EXPLOSION: ['#ff5252', '#ffab40', '#ffe082', '#ffffff'],
  PARTICLE_ENGINE: ['#ff4081', '#ff80ab', '#ffab40'],
  PARTICLE_HIT: ['#ffffff', '#e0e0e0', '#bdbdbd'],

  // UI
  HUD_TEXT: '#ffffff',
  HUD_ACCENT: '#00e5ff',

  // Background
  STAR_DIM: '#555555',
  STAR_BRIGHT: '#ffffff',
  STAR_BLUE: '#80d8ff',
};

const SPEEDS = {
  PLAYER: 300,          // pixels per second
  PLAYER_BULLET: 500,
  ENEMY_BULLET: 250,
  ENEMY_BASIC: 100,
  ENEMY_ZIGZAG: 120,
  ENEMY_TANK: 60,
  ENEMY_BOSS: 40,
  POWERUP_FALL: 80,
  STAR_LAYER_1: 20,     // slowest (far)
  STAR_LAYER_2: 50,
  STAR_LAYER_3: 100,    // fastest (near)
};

const PLAYER_DEFAULTS = {
  LIVES: 3,
  INVINCIBLE_DURATION: 2,  // seconds
  FIRE_RATE: 0.15,         // seconds between shots
  RAPID_FIRE_RATE: 0.07,
  SPREAD_ANGLE: 15,        // degrees
};

const ENEMY_DEFAULTS = {
  BASIC_HP: 1,
  ZIGZAG_HP: 1,
  TANK_HP: 5,
  BOSS_HP: 20,
  FIRE_COOLDOWN: 1.5,     // seconds
  ZIGZAG_AMPLITUDE: 80,
  ZIGZAG_FREQUENCY: 2,
};

const POWERUP_DEFAULTS = {
  DURATION: 8,             // seconds for timed power-ups
  DROP_CHANCE: 0.15,       // 15% chance per enemy kill
  SIZE: 20,
};

const SCORING = {
  ENEMY_BASIC: 100,
  ENEMY_ZIGZAG: 200,
  ENEMY_TANK: 500,
  ENEMY_BOSS: 2000,
  COMBO_WINDOW: 1.5,      // seconds to maintain combo
  COMBO_MULTIPLIER: 0.5,  // bonus per combo level
};

const WAVE_CONFIG = {
  BASE_ENEMIES: 5,
  ENEMIES_PER_WAVE: 2,    // additional enemies each wave
  SPAWN_INTERVAL: 1.2,    // seconds between spawns
  BOSS_EVERY: 5,          // boss wave every N waves
  SPEED_SCALE: 0.05,      // speed increase per wave (5%)
  FIRE_RATE_SCALE: 0.03,  // fire rate increase per wave (3%)
};

const PARTICLES = {
  EXPLOSION_COUNT: 20,
  TRAIL_COUNT: 2,
  HIT_COUNT: 5,
  DEATH_COUNT: 40,
  MIN_LIFETIME: 0.3,
  MAX_LIFETIME: 1.0,
  MIN_SPEED: 50,
  MAX_SPEED: 250,
};

const SCREEN_SHAKE = {
  INTENSITY: 8,
  DURATION: 0.2,
  DECAY: 0.9,
};

// --- Math Helpers ---

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

function randRange(min, max) {
  return Math.random() * (max - min) + min;
}

function randInt(min, max) {
  return Math.floor(randRange(min, max + 1));
}

function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

function distanceSq(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}

function angle(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

function degToRad(deg) {
  return deg * (Math.PI / 180);
}

function radToDeg(rad) {
  return rad * (180 / Math.PI);
}

function normalize(x, y) {
  const len = Math.sqrt(x * x + y * y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: x / len, y: y / len };
}

// Pick a random element from an array
function randPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Smooth step interpolation (ease in/out)
function smoothStep(t) {
  return t * t * (3 - 2 * t);
}

// Check if a point is within canvas bounds (with optional margin)
function inBounds(x, y, margin) {
  margin = margin || 0;
  return x >= -margin && x <= GAME.WIDTH + margin &&
         y >= -margin && y <= GAME.HEIGHT + margin;
}

// --- Vector Operations ---

const Vec2 = {
  create(x, y) {
    return { x: x || 0, y: y || 0 };
  },

  add(a, b) {
    return { x: a.x + b.x, y: a.y + b.y };
  },

  sub(a, b) {
    return { x: a.x - b.x, y: a.y - b.y };
  },

  scale(v, s) {
    return { x: v.x * s, y: v.y * s };
  },

  length(v) {
    return Math.sqrt(v.x * v.x + v.y * v.y);
  },

  lengthSq(v) {
    return v.x * v.x + v.y * v.y;
  },

  normalize(v) {
    const len = Vec2.length(v);
    if (len === 0) return { x: 0, y: 0 };
    return { x: v.x / len, y: v.y / len };
  },

  dot(a, b) {
    return a.x * b.x + a.y * b.y;
  },

  rotate(v, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: v.x * cos - v.y * sin,
      y: v.x * sin + v.y * cos,
    };
  },

  fromAngle(angle, length) {
    length = length || 1;
    return {
      x: Math.cos(angle) * length,
      y: Math.sin(angle) * length,
    };
  },

  lerp(a, b, t) {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
    };
  },

  distance(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  },
};

// --- Collision Helpers ---

function aabbCollision(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

function circleCollision(x1, y1, r1, x2, y2, r2) {
  const dist = distanceSq(x1, y1, x2, y2);
  const radii = r1 + r2;
  return dist <= radii * radii;
}

// --- Color Helpers ---

function rgba(r, g, b, a) {
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

// Create a faded version of a hex color
function fadeColor(hex, alpha) {
  const rgb = hexToRgb(hex);
  return rgba(rgb.r, rgb.g, rgb.b, alpha);
}

// --- Local Storage Helpers ---

function saveHighScore(score) {
  try {
    localStorage.setItem('cosmicDefenderHighScore', String(score));
  } catch (e) {
    // localStorage not available (private browsing, etc.)
  }
}

function loadHighScore() {
  try {
    return parseInt(localStorage.getItem('cosmicDefenderHighScore'), 10) || 0;
  } catch (e) {
    return 0;
  }
}
