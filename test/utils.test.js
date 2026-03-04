const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createGameContext } = require('./helpers/load-modules');

describe('Utils - Math Helpers', () => {
  let ctx;

  it('should load utils module', () => {
    ctx = createGameContext(['utils.js']);
    assert.ok(ctx.GAME);
    assert.ok(ctx.COLORS);
    assert.ok(ctx.SPEEDS);
  });

  it('lerp interpolates correctly', () => {
    assert.equal(ctx.lerp(0, 10, 0), 0);
    assert.equal(ctx.lerp(0, 10, 1), 10);
    assert.equal(ctx.lerp(0, 10, 0.5), 5);
    assert.equal(ctx.lerp(-10, 10, 0.5), 0);
  });

  it('clamp restricts values to range', () => {
    assert.equal(ctx.clamp(5, 0, 10), 5);
    assert.equal(ctx.clamp(-5, 0, 10), 0);
    assert.equal(ctx.clamp(15, 0, 10), 10);
    assert.equal(ctx.clamp(0, 0, 10), 0);
    assert.equal(ctx.clamp(10, 0, 10), 10);
  });

  it('randRange returns values within range', () => {
    for (let i = 0; i < 100; i++) {
      const val = ctx.randRange(5, 10);
      assert.ok(val >= 5, `${val} should be >= 5`);
      assert.ok(val < 10, `${val} should be < 10`);
    }
  });

  it('randInt returns integers within range', () => {
    for (let i = 0; i < 100; i++) {
      const val = ctx.randInt(1, 6);
      assert.ok(Number.isInteger(val), `${val} should be integer`);
      assert.ok(val >= 1 && val <= 6, `${val} should be in [1,6]`);
    }
  });

  it('distance calculates Euclidean distance', () => {
    assert.equal(ctx.distance(0, 0, 3, 4), 5);
    assert.equal(ctx.distance(0, 0, 0, 0), 0);
    assert.ok(Math.abs(ctx.distance(1, 1, 4, 5) - 5) < 0.001);
  });

  it('distanceSq calculates squared distance', () => {
    assert.equal(ctx.distanceSq(0, 0, 3, 4), 25);
  });

  it('normalize produces unit vector', () => {
    const n = ctx.normalize(3, 4);
    assert.ok(Math.abs(n.x - 0.6) < 0.001);
    assert.ok(Math.abs(n.y - 0.8) < 0.001);
    // Zero vector
    const z = ctx.normalize(0, 0);
    assert.equal(z.x, 0);
    assert.equal(z.y, 0);
  });

  it('degToRad and radToDeg are inverses', () => {
    assert.ok(Math.abs(ctx.degToRad(180) - Math.PI) < 0.001);
    assert.ok(Math.abs(ctx.radToDeg(Math.PI) - 180) < 0.001);
    assert.ok(Math.abs(ctx.radToDeg(ctx.degToRad(45)) - 45) < 0.001);
  });

  it('smoothStep returns smooth interpolation', () => {
    assert.equal(ctx.smoothStep(0), 0);
    assert.equal(ctx.smoothStep(1), 1);
    assert.equal(ctx.smoothStep(0.5), 0.5);
  });

  it('inBounds checks canvas boundaries', () => {
    assert.ok(ctx.inBounds(400, 300));
    assert.ok(!ctx.inBounds(-10, 300));
    assert.ok(ctx.inBounds(-10, 300, 20)); // with margin
    assert.ok(!ctx.inBounds(900, 300));
  });
});

describe('Utils - Vec2 Operations', () => {
  let ctx;

  it('should load utils', () => {
    ctx = createGameContext(['utils.js']);
  });

  it('Vec2.add adds vectors', () => {
    const r = ctx.Vec2.add({ x: 1, y: 2 }, { x: 3, y: 4 });
    assert.equal(r.x, 4);
    assert.equal(r.y, 6);
  });

  it('Vec2.sub subtracts vectors', () => {
    const r = ctx.Vec2.sub({ x: 5, y: 7 }, { x: 3, y: 4 });
    assert.equal(r.x, 2);
    assert.equal(r.y, 3);
  });

  it('Vec2.scale multiplies vector by scalar', () => {
    const r = ctx.Vec2.scale({ x: 2, y: 3 }, 4);
    assert.equal(r.x, 8);
    assert.equal(r.y, 12);
  });

  it('Vec2.length calculates magnitude', () => {
    assert.equal(ctx.Vec2.length({ x: 3, y: 4 }), 5);
  });

  it('Vec2.normalize produces unit vector', () => {
    const n = ctx.Vec2.normalize({ x: 3, y: 4 });
    assert.ok(Math.abs(ctx.Vec2.length(n) - 1) < 0.001);
  });

  it('Vec2.dot calculates dot product', () => {
    assert.equal(ctx.Vec2.dot({ x: 1, y: 0 }, { x: 0, y: 1 }), 0); // perpendicular
    assert.equal(ctx.Vec2.dot({ x: 2, y: 3 }, { x: 4, y: 5 }), 23);
  });

  it('Vec2.distance calculates distance between points', () => {
    assert.equal(ctx.Vec2.distance({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
  });
});

describe('Utils - Collision Helpers', () => {
  let ctx;

  it('should load utils', () => {
    ctx = createGameContext(['utils.js']);
  });

  it('circleCollision detects overlapping circles', () => {
    assert.ok(ctx.circleCollision(0, 0, 10, 5, 0, 10)); // overlapping
    assert.ok(ctx.circleCollision(0, 0, 5, 0, 0, 5));    // same center
    assert.ok(!ctx.circleCollision(0, 0, 5, 20, 0, 5));   // far apart
  });

  it('circleCollision detects touching circles', () => {
    // Exactly touching: distance = r1 + r2
    assert.ok(ctx.circleCollision(0, 0, 5, 10, 0, 5));
  });

  it('aabbCollision detects overlapping boxes', () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 5, y: 5, width: 10, height: 10 };
    assert.ok(ctx.aabbCollision(a, b));

    const c = { x: 20, y: 20, width: 10, height: 10 };
    assert.ok(!ctx.aabbCollision(a, c));
  });
});

describe('Utils - Color Helpers', () => {
  let ctx;

  it('should load utils', () => {
    ctx = createGameContext(['utils.js']);
  });

  it('hexToRgb parses hex colors', () => {
    const red = ctx.hexToRgb('#ff0000');
    assert.equal(red.r, 255);
    assert.equal(red.g, 0);
    assert.equal(red.b, 0);
    const green = ctx.hexToRgb('#00ff00');
    assert.equal(green.r, 0);
    assert.equal(green.g, 255);
    assert.equal(green.b, 0);
  });

  it('hexToRgb handles invalid input', () => {
    const result = ctx.hexToRgb('not-a-color');
    assert.equal(result.r, 0);
    assert.equal(result.g, 0);
    assert.equal(result.b, 0);
  });

  it('rgba creates rgba string', () => {
    assert.equal(ctx.rgba(255, 0, 0, 0.5), 'rgba(255,0,0,0.5)');
  });

  it('fadeColor creates faded hex color as rgba', () => {
    const result = ctx.fadeColor('#ff0000', 0.5);
    assert.equal(result, 'rgba(255,0,0,0.5)');
  });
});

describe('Utils - Game Constants', () => {
  let ctx;

  it('should load utils', () => {
    ctx = createGameContext(['utils.js']);
  });

  it('GAME has expected dimensions', () => {
    assert.equal(ctx.GAME.WIDTH, 800);
    assert.equal(ctx.GAME.HEIGHT, 600);
    assert.equal(ctx.GAME.FPS, 60);
  });

  it('SCORING constants are defined', () => {
    assert.ok(ctx.SCORING.ENEMY_BASIC > 0);
    assert.ok(ctx.SCORING.ENEMY_BOSS > ctx.SCORING.ENEMY_BASIC);
  });

  it('WAVE_CONFIG has boss wave interval', () => {
    assert.equal(ctx.WAVE_CONFIG.BOSS_EVERY, 5);
  });

  it('PLAYER_DEFAULTS has starting lives', () => {
    assert.equal(ctx.PLAYER_DEFAULTS.LIVES, 3);
  });
});

describe('Utils - LocalStorage', () => {
  let ctx;

  it('should load utils', () => {
    ctx = createGameContext(['utils.js']);
  });

  it('saveHighScore and loadHighScore round-trip', () => {
    ctx.saveHighScore(12345);
    assert.equal(ctx.loadHighScore(), 12345);
  });

  it('loadHighScore returns 0 when no score saved', () => {
    const freshCtx = createGameContext(['utils.js']);
    assert.equal(freshCtx.loadHighScore(), 0);
  });
});
