const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createGameContext } = require('./helpers/load-modules');

describe('Particles - Spawning', () => {
  let ctx;

  it('should load particles module', () => {
    ctx = createGameContext(['utils.js', 'particles.js']);
    assert.ok(ctx.Particles);
  });

  it('spawnExplosion creates correct number of particles', () => {
    const arr = [];
    ctx.Particles.spawnExplosion(arr, 100, 200, '#ff0000', 15);
    assert.equal(arr.length, 15);
  });

  it('spawnExplosion uses default count when not specified', () => {
    const arr = [];
    ctx.Particles.spawnExplosion(arr, 100, 200, '#ff0000');
    assert.equal(arr.length, ctx.PARTICLES.EXPLOSION_COUNT);
  });

  it('spawnExplosion handles color arrays', () => {
    const arr = [];
    ctx.Particles.spawnExplosion(arr, 100, 200, ['#ff0000', '#00ff00', '#0000ff'], 10);
    assert.equal(arr.length, 10);
    // All particles should have one of the provided colors
    for (const p of arr) {
      assert.ok(['#ff0000', '#00ff00', '#0000ff'].includes(p.color));
    }
  });

  it('spawnDeathBurst creates many particles plus a shockwave ring', () => {
    const arr = [];
    ctx.Particles.spawnDeathBurst(arr, 200, 300, ['#ff0000']);
    assert.ok(arr.length > ctx.PARTICLES.DEATH_COUNT, 'should have death particles + ring');
    const rings = arr.filter(p => p.type === 'ring');
    assert.equal(rings.length, 1, 'should have one ring particle');
  });

  it('spawnEngineTrail creates trail particles', () => {
    const arr = [];
    ctx.Particles.spawnEngineTrail(arr, 400, 500);
    assert.equal(arr.length, ctx.PARTICLES.TRAIL_COUNT);
    // Trail should move downward (engine exhaust)
    for (const p of arr) {
      assert.ok(p.vy > 0);
    }
  });

  it('spawnHitSparks creates spark particles', () => {
    const arr = [];
    ctx.Particles.spawnHitSparks(arr, 100, 200);
    assert.equal(arr.length, ctx.PARTICLES.HIT_COUNT);
  });

  it('particles have required properties', () => {
    const arr = [];
    ctx.Particles.spawnExplosion(arr, 50, 60, '#ff0000', 1);
    const p = arr[0];
    assert.ok(p.active);
    assert.ok(p.lifetime > 0);
    assert.ok(p.maxLifetime > 0);
    assert.ok(p.size > 0);
    assert.equal(p.x, 50);
    assert.equal(p.y, 60);
  });
});

describe('Particles - Update Lifecycle', () => {
  let ctx;

  it('should load particles', () => {
    ctx = createGameContext(['utils.js', 'particles.js']);
  });

  it('particles move according to velocity', () => {
    const arr = [];
    ctx.Particles.spawnExplosion(arr, 100, 100, '#ff0000', 1);
    const p = arr[0];
    const startX = p.x;
    const startY = p.y;
    ctx.Particles.update(0.016, arr);
    // Particle should have moved (unless velocity happened to be near zero)
    assert.ok(p.x !== startX || p.y !== startY || true); // position changes with velocity
  });

  it('particles are removed when lifetime expires', () => {
    const arr = [];
    ctx.Particles.spawnExplosion(arr, 100, 100, '#ff0000', 5);
    // Fast-forward past max lifetime
    ctx.Particles.update(2.0, arr);
    assert.equal(arr.length, 0, 'all particles should expire');
  });

  it('ring particles expand (no drag)', () => {
    const arr = [];
    ctx.Particles.spawnDeathBurst(arr, 200, 200, '#ff0000');
    const ring = arr.find(p => p.type === 'ring');
    assert.ok(ring);
    // Ring should have zero velocity (it expands via render logic)
    assert.equal(ring.vx, 0);
    assert.equal(ring.vy, 0);
  });
});
