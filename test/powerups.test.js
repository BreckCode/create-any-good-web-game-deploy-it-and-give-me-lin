const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createGameContext } = require('./helpers/load-modules');

describe('PowerUps - Factory', () => {
  let ctx;

  it('should load powerups module', () => {
    ctx = createGameContext(['utils.js', 'powerups.js']);
    assert.ok(ctx.PowerUps);
    assert.ok(ctx.PowerUps.TYPE);
  });

  it('creates all four power-up types', () => {
    for (const type of ['shield', 'spread', 'rapid', 'life']) {
      const p = ctx.PowerUps.create(type, 100, 200);
      assert.ok(p, `Failed to create ${type}`);
      assert.equal(p.type, type);
      assert.equal(p.x, 100);
      assert.equal(p.y, 200);
      assert.ok(p.active);
      assert.ok(p.color);
      assert.ok(p.label);
    }
  });

  it('returns null for invalid type', () => {
    const p = ctx.PowerUps.create('invalid', 0, 0);
    assert.equal(p, null);
  });

  it('power-ups have correct size from defaults', () => {
    const p = ctx.PowerUps.create('shield', 0, 0);
    assert.equal(p.width, ctx.POWERUP_DEFAULTS.SIZE);
    assert.equal(p.height, ctx.POWERUP_DEFAULTS.SIZE);
  });

  it('power-ups fall downward', () => {
    const p = ctx.PowerUps.create('shield', 0, 0);
    assert.equal(p.vy, ctx.SPEEDS.POWERUP_FALL);
  });
});

describe('PowerUps - Drop Spawn', () => {
  let ctx;

  it('should load powerups', () => {
    ctx = createGameContext(['utils.js', 'powerups.js']);
  });

  it('trySpawnDrop sometimes creates a powerup (probabilistic)', () => {
    let spawned = 0;
    const trials = 1000;
    for (let i = 0; i < trials; i++) {
      const arr = [];
      ctx.PowerUps.trySpawnDrop(arr, 100, 200);
      if (arr.length > 0) spawned++;
    }
    // Should be roughly 15% (with wide margin for randomness)
    const rate = spawned / trials;
    assert.ok(rate > 0.05, `Drop rate ${rate} is too low`);
    assert.ok(rate < 0.30, `Drop rate ${rate} is too high`);
  });

  it('dropped powerups are valid entities', () => {
    // Force spawn by running many times
    for (let i = 0; i < 100; i++) {
      const arr = [];
      ctx.PowerUps.trySpawnDrop(arr, 300, 400);
      if (arr.length > 0) {
        const p = arr[0];
        assert.ok(p.active);
        assert.ok(['shield', 'spread', 'rapid', 'life'].includes(p.type));
        assert.equal(p.x, 300);
        assert.equal(p.y, 400);
        return; // one successful check is enough
      }
    }
    assert.fail('No powerup spawned in 100 attempts');
  });
});

describe('PowerUps - Update', () => {
  let ctx;

  it('should load powerups', () => {
    ctx = createGameContext(['utils.js', 'powerups.js']);
  });

  it('power-ups move downward over time', () => {
    const p = ctx.PowerUps.create('shield', 400, 100);
    const arr = [p];
    const startY = p.y;
    ctx.PowerUps.update(0.1, arr);
    assert.ok(p.y > startY);
  });

  it('inactive power-ups are removed', () => {
    const p = ctx.PowerUps.create('shield', 400, 100);
    p.active = false;
    const arr = [p];
    ctx.PowerUps.update(0.016, arr);
    assert.equal(arr.length, 0);
  });

  it('power-ups past bottom of screen are removed', () => {
    const p = ctx.PowerUps.create('shield', 400, ctx.GAME.HEIGHT + 50);
    const arr = [p];
    ctx.PowerUps.update(0.016, arr);
    assert.equal(arr.length, 0);
  });

  it('clearAll empties the array', () => {
    const arr = [ctx.PowerUps.create('shield', 0, 0), ctx.PowerUps.create('rapid', 0, 0)];
    ctx.PowerUps.clearAll(arr);
    assert.equal(arr.length, 0);
  });
});
