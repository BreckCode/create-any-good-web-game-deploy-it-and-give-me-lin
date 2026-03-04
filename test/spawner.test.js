const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createGameContext } = require('./helpers/load-modules');

describe('Spawner - Wave Composition', () => {
  let ctx;

  it('should load spawner module', () => {
    ctx = createGameContext([
      'utils.js', 'particles.js', 'bullets.js', 'player.js', 'enemies.js',
      'powerups.js', 'spawner.js',
    ]);
    assert.ok(ctx.Spawner);
  });

  it('initializes properly', () => {
    ctx.Spawner.init();
    const info = ctx.Spawner.getWaveInfo();
    assert.equal(info.waveActive, false);
    assert.equal(info.betweenWaves, true);
    assert.equal(info.speedMultiplier, 1);
  });

  it('starts spawning after between-wave delay', () => {
    ctx.Spawner.init();
    let waveNum = 1;
    const game = {
      wave: waveNum,
      enemies: [],
      setWave(w) { waveNum = w; game.wave = w; },
    };

    // Tick past the initial between-wave delay (1.0s)
    ctx.Spawner.update(1.1, game);
    const info = ctx.Spawner.getWaveInfo();
    assert.ok(info.waveActive, 'wave should be active after delay');
  });

  it('spawns enemies during active wave', () => {
    ctx.Spawner.init();
    let waveNum = 1;
    const game = {
      wave: waveNum,
      enemies: [],
      enemyBullets: [],
      setWave(w) { waveNum = w; game.wave = w; },
    };

    // Start wave
    ctx.Spawner.update(1.1, game);
    // Tick to trigger spawns
    ctx.Spawner.update(2.0, game);
    assert.ok(game.enemies.length > 0, 'enemies should be spawned');
  });

  it('boss wave occurs every 5 waves', () => {
    ctx.Spawner.init();
    const game = {
      wave: 5, // boss wave
      enemies: [],
      enemyBullets: [],
      setWave(w) { game.wave = w; },
    };

    // Start the wave
    ctx.Spawner.update(1.1, game);
    assert.ok(ctx.Spawner.isBossWave, 'wave 5 should be a boss wave');
    assert.ok(ctx.Spawner.announcement.includes('BOSS'), 'announcement should mention BOSS');
  });

  it('non-boss wave is not flagged as boss', () => {
    ctx.Spawner.init();
    const game = {
      wave: 3,
      enemies: [],
      enemyBullets: [],
      setWave(w) { game.wave = w; },
    };

    ctx.Spawner.update(1.1, game);
    assert.ok(!ctx.Spawner.isBossWave, 'wave 3 should not be a boss wave');
  });

  it('wave advances when all enemies cleared', () => {
    ctx.Spawner.init();
    let currentWave = 1;
    const game = {
      wave: currentWave,
      enemies: [],
      enemyBullets: [],
      setWave(w) { currentWave = w; game.wave = w; },
    };

    // Start wave 1
    ctx.Spawner.update(1.1, game);

    // Spawn all enemies by ticking many times
    for (let i = 0; i < 50; i++) {
      ctx.Spawner.update(1.5, game);
    }

    // Clear all enemies (simulate killing them)
    game.enemies.length = 0;

    // Tick once more — should detect wave complete
    ctx.Spawner.update(0.1, game);
    const info = ctx.Spawner.getWaveInfo();
    assert.ok(info.betweenWaves, 'should be in between-waves state');
    assert.equal(currentWave, 2, 'wave should advance to 2');
  });

  it('difficulty scales with wave number', () => {
    // Wave 1
    ctx.Spawner.init();
    const game1 = { wave: 1, enemies: [], setWave() {} };
    ctx.Spawner.update(1.1, game1);
    const info1 = ctx.Spawner.getWaveInfo();

    // Wave 10
    ctx.Spawner.init();
    const game10 = { wave: 10, enemies: [], setWave() {} };
    ctx.Spawner.update(1.1, game10);
    const info10 = ctx.Spawner.getWaveInfo();

    assert.ok(info10.speedMultiplier > info1.speedMultiplier, 'later waves should be faster');
  });
});

describe('Spawner - Announcements', () => {
  let ctx;

  it('should load spawner', () => {
    ctx = createGameContext([
      'utils.js', 'particles.js', 'bullets.js', 'player.js', 'enemies.js',
      'powerups.js', 'spawner.js',
    ]);
  });

  it('shows wave announcement when wave starts', () => {
    ctx.Spawner.init();
    const game = { wave: 3, enemies: [], setWave() {} };
    ctx.Spawner.update(1.1, game);
    assert.ok(ctx.Spawner.announcement.includes('3'));
    assert.ok(ctx.Spawner.announcementTimer > 0);
  });

  it('announcement fades out over time', () => {
    ctx.Spawner.init();
    const game = { wave: 1, enemies: [], setWave() {} };
    ctx.Spawner.update(1.1, game);

    const initialAlpha = ctx.Spawner.announcementAlpha;
    // Tick past announcement duration
    ctx.Spawner.update(3.0, game);
    assert.equal(ctx.Spawner.announcementAlpha, 0, 'announcement should have faded');
  });
});
