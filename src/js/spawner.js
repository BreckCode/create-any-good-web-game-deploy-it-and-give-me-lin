// ============================================================
// Cosmic Defender - Wave Spawner System
// ============================================================
// Manages wave progression, enemy composition, spawn timing,
// difficulty scaling, boss waves every 5 levels, and wave
// announcements.

const Spawner = (function () {
  // --- Internal State ---
  let spawnTimer = 0;        // countdown to next enemy spawn
  let enemiesSpawned = 0;    // how many enemies spawned in current wave
  let enemiesInWave = 0;     // total enemies to spawn this wave
  let waveActive = false;    // is a wave currently in progress
  let betweenWaves = false;  // delay between waves
  let betweenWaveTimer = 0;  // countdown for between-wave pause
  let isBossWave = false;    // is this a boss wave
  let bossSpawned = false;   // has the boss been spawned this wave

  // Wave announcement
  let announcement = '';
  let announcementTimer = 0;
  let announcementAlpha = 0;

  // Difficulty multipliers (increase each wave)
  let speedMultiplier = 1;
  let fireRateMultiplier = 1;

  // Spawn interval for current wave
  let currentSpawnInterval = WAVE_CONFIG.SPAWN_INTERVAL;

  // Between-wave pause duration
  const BETWEEN_WAVE_DELAY = 2.5;
  // Announcement display time
  const ANNOUNCEMENT_DURATION = 2.0;

  // --- Wave Composition ---
  // Determines which enemy types and counts for a given wave number

  function getWaveComposition(waveNum) {
    const totalEnemies = WAVE_CONFIG.BASE_ENEMIES + (waveNum - 1) * WAVE_CONFIG.ENEMIES_PER_WAVE;
    const composition = [];

    if (waveNum % WAVE_CONFIG.BOSS_EVERY === 0) {
      // Boss wave: boss + supporting enemies
      composition.push({ type: Enemies.TYPE.BOSS, count: 1 });
      // Add some supporting enemies
      const supporters = Math.floor(totalEnemies * 0.4);
      if (waveNum >= 15) {
        composition.push({ type: Enemies.TYPE.TANK, count: Math.floor(supporters * 0.3) });
        composition.push({ type: Enemies.TYPE.ZIGZAG, count: Math.floor(supporters * 0.4) });
        composition.push({ type: Enemies.TYPE.BASIC, count: Math.ceil(supporters * 0.3) });
      } else if (waveNum >= 10) {
        composition.push({ type: Enemies.TYPE.ZIGZAG, count: Math.floor(supporters * 0.5) });
        composition.push({ type: Enemies.TYPE.BASIC, count: Math.ceil(supporters * 0.5) });
      } else {
        composition.push({ type: Enemies.TYPE.BASIC, count: supporters });
      }
      return composition;
    }

    // Normal waves: composition evolves with wave number
    if (waveNum <= 2) {
      // Early waves: only basics
      composition.push({ type: Enemies.TYPE.BASIC, count: totalEnemies });
    } else if (waveNum <= 4) {
      // Introduce zigzag enemies
      const zigzagCount = Math.floor(totalEnemies * 0.3);
      composition.push({ type: Enemies.TYPE.BASIC, count: totalEnemies - zigzagCount });
      composition.push({ type: Enemies.TYPE.ZIGZAG, count: zigzagCount });
    } else if (waveNum <= 7) {
      // Mix of basic, zigzag, introduce tanks
      const tankCount = Math.max(1, Math.floor(totalEnemies * 0.15));
      const zigzagCount = Math.floor(totalEnemies * 0.35);
      const basicCount = totalEnemies - tankCount - zigzagCount;
      composition.push({ type: Enemies.TYPE.BASIC, count: basicCount });
      composition.push({ type: Enemies.TYPE.ZIGZAG, count: zigzagCount });
      composition.push({ type: Enemies.TYPE.TANK, count: tankCount });
    } else {
      // Later waves: heavier mix
      const tankCount = Math.max(1, Math.floor(totalEnemies * 0.2));
      const zigzagCount = Math.floor(totalEnemies * 0.4);
      const basicCount = totalEnemies - tankCount - zigzagCount;
      composition.push({ type: Enemies.TYPE.BASIC, count: basicCount });
      composition.push({ type: Enemies.TYPE.ZIGZAG, count: zigzagCount });
      composition.push({ type: Enemies.TYPE.TANK, count: tankCount });
    }

    return composition;
  }

  // Build a flat spawn queue from composition (shuffled order)
  function buildSpawnQueue(composition) {
    const queue = [];
    for (let i = 0; i < composition.length; i++) {
      for (let j = 0; j < composition[i].count; j++) {
        queue.push(composition[i].type);
      }
    }
    // Shuffle using Fisher-Yates
    for (let i = queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = queue[i];
      queue[i] = queue[j];
      queue[j] = tmp;
    }
    return queue;
  }

  let spawnQueue = [];

  // --- Difficulty Scaling ---

  function updateDifficulty(waveNum) {
    speedMultiplier = 1 + (waveNum - 1) * WAVE_CONFIG.SPEED_SCALE;
    fireRateMultiplier = 1 + (waveNum - 1) * WAVE_CONFIG.FIRE_RATE_SCALE;
    // Spawn interval gets shorter as waves progress (min 0.4s)
    currentSpawnInterval = Math.max(0.4, WAVE_CONFIG.SPAWN_INTERVAL - (waveNum - 1) * 0.03);
  }

  // --- Wave Start ---

  function startWave(game) {
    const waveNum = game.wave;
    isBossWave = (waveNum % WAVE_CONFIG.BOSS_EVERY === 0);
    bossSpawned = false;
    waveActive = true;
    betweenWaves = false;
    enemiesSpawned = 0;
    spawnTimer = 0.5; // brief initial delay

    updateDifficulty(waveNum);

    const composition = getWaveComposition(waveNum);
    spawnQueue = buildSpawnQueue(composition);
    enemiesInWave = spawnQueue.length;

    // Set announcement
    if (isBossWave) {
      announcement = 'BOSS WAVE ' + waveNum;
    } else {
      announcement = 'WAVE ' + waveNum;
    }
    announcementTimer = ANNOUNCEMENT_DURATION;
    announcementAlpha = 1;
  }

  // --- Spawn a Single Enemy ---

  function spawnEnemy(type, game) {
    // Random X position with margin
    const margin = 40;
    let x;

    if (type === Enemies.TYPE.BOSS) {
      x = GAME.WIDTH / 2; // Boss spawns center
    } else {
      x = randRange(margin, GAME.WIDTH - margin);
    }

    // Spawn above screen
    const y = -30;

    const enemy = Enemies.create(type, x, y, speedMultiplier);
    if (enemy) {
      // Apply fire rate scaling (reduce cooldown)
      enemy.fireCooldown = enemy.fireCooldown / fireRateMultiplier;
      game.enemies.push(enemy);
    }
  }

  // --- Public API ---

  return {
    // Announcement state for HUD/renderer
    get announcement() { return announcement; },
    get announcementTimer() { return announcementTimer; },
    get announcementAlpha() { return announcementAlpha; },
    get isBossWave() { return isBossWave; },

    init: function () {
      spawnTimer = 0;
      enemiesSpawned = 0;
      enemiesInWave = 0;
      waveActive = false;
      betweenWaves = true;
      betweenWaveTimer = 1.0; // short delay before first wave
      isBossWave = false;
      bossSpawned = false;
      spawnQueue = [];
      announcement = '';
      announcementTimer = 0;
      announcementAlpha = 0;
      speedMultiplier = 1;
      fireRateMultiplier = 1;
      currentSpawnInterval = WAVE_CONFIG.SPAWN_INTERVAL;
    },

    update: function (dt, game) {
      // Update announcement fade
      if (announcementTimer > 0) {
        announcementTimer -= dt;
        // Fade in quickly, hold, then fade out
        if (announcementTimer > ANNOUNCEMENT_DURATION - 0.3) {
          // Fade in phase
          announcementAlpha = (ANNOUNCEMENT_DURATION - announcementTimer) / 0.3;
        } else if (announcementTimer < 0.5) {
          // Fade out phase
          announcementAlpha = announcementTimer / 0.5;
        } else {
          announcementAlpha = 1;
        }
        if (announcementTimer <= 0) {
          announcementTimer = 0;
          announcementAlpha = 0;
        }
      }

      // Between-wave pause
      if (betweenWaves) {
        betweenWaveTimer -= dt;
        if (betweenWaveTimer <= 0) {
          startWave(game);
        }
        return;
      }

      if (!waveActive) return;

      // Spawn enemies from queue
      if (enemiesSpawned < enemiesInWave) {
        spawnTimer -= dt;
        if (spawnTimer <= 0) {
          // Spawn next enemy from queue
          const type = spawnQueue[enemiesSpawned];

          // For boss waves, spawn the boss first
          if (isBossWave && !bossSpawned && type === Enemies.TYPE.BOSS) {
            spawnEnemy(Enemies.TYPE.BOSS, game);
            bossSpawned = true;
          } else {
            spawnEnemy(type, game);
          }

          enemiesSpawned++;
          spawnTimer = currentSpawnInterval;

          // Bosses get a longer delay after spawning
          if (type === Enemies.TYPE.BOSS) {
            spawnTimer = currentSpawnInterval * 2;
          }
        }
      } else {
        // All enemies spawned — wait for them to be cleared
        if (game.enemies.length === 0) {
          // Wave complete!
          waveActive = false;
          betweenWaves = true;
          betweenWaveTimer = BETWEEN_WAVE_DELAY;
          game.setWave(game.wave + 1);
        }
      }
    },

    // Render wave announcement on canvas
    render: function (ctx) {
      if (announcementTimer <= 0 || announcementAlpha <= 0) return;

      ctx.save();
      ctx.globalAlpha = clamp(announcementAlpha, 0, 1);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (isBossWave) {
        // Boss wave: larger, red text with glow
        ctx.shadowColor = '#ff1744';
        ctx.shadowBlur = 20;
        ctx.font = 'bold 48px "Press Start 2P", "Courier New", monospace';
        ctx.fillStyle = '#ff1744';
        ctx.fillText('WARNING', GAME.WIDTH / 2, GAME.HEIGHT / 2 - 40);

        ctx.shadowBlur = 15;
        ctx.font = 'bold 28px "Press Start 2P", "Courier New", monospace';
        ctx.fillStyle = '#ff5252';
        ctx.fillText(announcement, GAME.WIDTH / 2, GAME.HEIGHT / 2 + 10);
      } else {
        // Normal wave: cyan text with glow
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 15;
        ctx.font = 'bold 36px "Press Start 2P", "Courier New", monospace';
        ctx.fillStyle = '#00e5ff';
        ctx.fillText(announcement, GAME.WIDTH / 2, GAME.HEIGHT / 2 - 10);
      }

      // Subtitle text
      ctx.shadowBlur = 0;
      ctx.font = '14px "Courier New", monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      const enemyCountText = enemiesInWave + ' enemies incoming';
      ctx.fillText(enemyCountText, GAME.WIDTH / 2, GAME.HEIGHT / 2 + 40);

      ctx.restore();
    },

    // Get current wave info (for HUD)
    getWaveInfo: function () {
      return {
        enemiesSpawned: enemiesSpawned,
        enemiesInWave: enemiesInWave,
        isBossWave: isBossWave,
        waveActive: waveActive,
        betweenWaves: betweenWaves,
        speedMultiplier: speedMultiplier,
      };
    },
  };
})();
