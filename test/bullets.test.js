const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createGameContext } = require('./helpers/load-modules');

describe('Bullets - Player Bullet Creation', () => {
  let ctx;

  it('should load bullets module', () => {
    ctx = createGameContext(['utils.js', 'bullets.js']);
    assert.ok(ctx.Bullets);
  });

  it('creates a player bullet moving upward', () => {
    const arr = [];
    const bullet = ctx.Bullets.createPlayerBullet(arr, 400, 500, 0, -1);
    assert.ok(bullet);
    assert.equal(arr.length, 1);
    assert.equal(bullet.x, 400);
    assert.equal(bullet.y, 500);
    assert.ok(bullet.vy < 0, 'bullet should move upward');
    assert.ok(bullet.isPlayer);
    assert.ok(bullet.active);
  });

  it('respects max pool size', () => {
    const arr = [];
    for (let i = 0; i < 60; i++) {
      ctx.Bullets.createPlayerBullet(arr, 400, 500, 0, -1);
    }
    assert.equal(arr.length, 60);
    const extra = ctx.Bullets.createPlayerBullet(arr, 400, 500, 0, -1);
    assert.equal(extra, null);
    assert.equal(arr.length, 60);
  });

  it('normalizes direction vector', () => {
    const arr = [];
    const bullet = ctx.Bullets.createPlayerBullet(arr, 0, 0, 0, -100);
    // Speed should be SPEEDS.PLAYER_BULLET regardless of input magnitude
    assert.ok(Math.abs(bullet.vy + ctx.SPEEDS.PLAYER_BULLET) < 0.01);
  });
});

describe('Bullets - Enemy Bullet Creation', () => {
  let ctx;

  it('should load bullets module', () => {
    ctx = createGameContext(['utils.js', 'bullets.js']);
  });

  it('creates enemy bullet moving downward', () => {
    const arr = [];
    const bullet = ctx.Bullets.createEnemyBullet(arr, 100, 50, 0, 1);
    assert.ok(bullet);
    assert.ok(bullet.vy > 0);
    assert.ok(!bullet.isPlayer);
  });

  it('createAimedBullet shoots toward target', () => {
    const arr = [];
    // Enemy at top center aiming at bottom center
    ctx.Bullets.createAimedBullet(arr, 400, 0, 400, 600);
    assert.equal(arr.length, 1);
    assert.ok(arr[0].vy > 0, 'should move toward target (downward)');
    assert.ok(Math.abs(arr[0].vx) < 0.01, 'should have minimal horizontal movement');
  });

  it('createEnemySpread creates fan of bullets', () => {
    const arr = [];
    ctx.Bullets.createEnemySpread(arr, 400, 100, 5, 60);
    assert.equal(arr.length, 5);
    // All should move generally downward
    for (const b of arr) {
      assert.ok(b.vy > 0, 'spread bullets should move downward');
    }
    // Leftmost and rightmost should have different vx
    const vxValues = arr.map(b => b.vx);
    assert.ok(Math.min(...vxValues) < 0, 'some should go left');
    assert.ok(Math.max(...vxValues) > 0, 'some should go right');
  });

  it('applies speed multiplier to enemy bullets', () => {
    const arr1 = [];
    const arr2 = [];
    ctx.Bullets.createEnemyBullet(arr1, 100, 50, 0, 1, 1);
    ctx.Bullets.createEnemyBullet(arr2, 100, 50, 0, 1, 2);
    assert.ok(Math.abs(arr2[0].vy - arr1[0].vy * 2) < 0.01);
  });
});

describe('Bullets - Update and Lifecycle', () => {
  let ctx;

  it('should load bullets module', () => {
    ctx = createGameContext(['utils.js', 'bullets.js']);
  });

  it('bullets move according to velocity', () => {
    const playerBullets = [];
    const enemyBullets = [];
    const b = ctx.Bullets.createPlayerBullet(playerBullets, 400, 500, 0, -1);
    const startY = b.y;
    ctx.Bullets.update(0.1, playerBullets, enemyBullets);
    assert.ok(b.y < startY, 'bullet should have moved up');
  });

  it('bullets off screen are removed', () => {
    const playerBullets = [];
    const enemyBullets = [];
    const b = ctx.Bullets.createPlayerBullet(playerBullets, 400, -50, 0, -1);
    ctx.Bullets.update(0.1, playerBullets, enemyBullets);
    assert.equal(playerBullets.length, 0, 'off-screen bullet should be removed');
  });

  it('inactive bullets are removed', () => {
    const playerBullets = [];
    const enemyBullets = [];
    const b = ctx.Bullets.createPlayerBullet(playerBullets, 400, 300, 0, -1);
    b.active = false;
    ctx.Bullets.update(0.016, playerBullets, enemyBullets);
    assert.equal(playerBullets.length, 0);
  });

  it('clearAll empties both arrays', () => {
    const p = [{ active: true }];
    const e = [{ active: true }, { active: true }];
    ctx.Bullets.clearAll(p, e);
    assert.equal(p.length, 0);
    assert.equal(e.length, 0);
  });
});
