const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createGameContext } = require('./helpers/load-modules');

describe('Enemies - Factory', () => {
  let ctx;

  it('should load enemies module', () => {
    ctx = createGameContext(['utils.js', 'particles.js', 'bullets.js', 'player.js', 'enemies.js']);
    assert.ok(ctx.Enemies);
    assert.ok(ctx.Enemies.TYPE);
  });

  it('creates a basic enemy with correct properties', () => {
    const enemy = ctx.Enemies.create('basic', 100, 50);
    assert.ok(enemy);
    assert.equal(enemy.type, 'basic');
    assert.equal(enemy.x, 100);
    assert.equal(enemy.y, 50);
    assert.equal(enemy.hp, ctx.ENEMY_DEFAULTS.BASIC_HP);
    assert.ok(enemy.active);
    assert.ok(enemy.radius > 0);
    assert.equal(enemy.scoreValue, ctx.SCORING.ENEMY_BASIC);
  });

  it('creates all four enemy types', () => {
    for (const type of ['basic', 'zigzag', 'tank', 'boss']) {
      const enemy = ctx.Enemies.create(type, 400, 0);
      assert.ok(enemy, `Failed to create ${type}`);
      assert.equal(enemy.type, type);
    }
  });

  it('returns null for invalid type', () => {
    const enemy = ctx.Enemies.create('invalid', 100, 100);
    assert.equal(enemy, null);
  });

  it('applies speed multiplier', () => {
    const normal = ctx.Enemies.create('basic', 100, 0, 1);
    const fast = ctx.Enemies.create('basic', 100, 0, 2);
    assert.equal(fast.speed, normal.speed * 2);
    assert.equal(fast.vy, normal.vy * 2);
  });

  it('boss has much more HP than basic', () => {
    const basic = ctx.Enemies.create('basic', 100, 0);
    const boss = ctx.Enemies.create('boss', 100, 0);
    assert.ok(boss.hp > basic.hp * 5);
  });

  it('tank has more HP than basic', () => {
    const basic = ctx.Enemies.create('basic', 100, 0);
    const tank = ctx.Enemies.create('tank', 100, 0);
    assert.ok(tank.hp > basic.hp);
  });
});

describe('Enemies - Damage and Destruction', () => {
  let ctx;

  it('should load modules', () => {
    ctx = createGameContext(['utils.js', 'particles.js', 'bullets.js', 'player.js', 'enemies.js']);
  });

  it('damage reduces HP and returns false if alive', () => {
    const game = { particles: [], addScore() {}, triggerScreenShake() {}, triggerScreenFlash() {} };
    const enemy = ctx.Enemies.create('tank', 100, 100);
    const initialHp = enemy.hp;
    const killed = ctx.Enemies.damage(enemy, 1, game);
    assert.equal(killed, false);
    assert.equal(enemy.hp, initialHp - 1);
    assert.ok(enemy.active);
  });

  it('damage kills enemy when HP reaches 0', () => {
    const game = { particles: [], addScore() {}, triggerScreenShake() {}, triggerScreenFlash() {} };
    const enemy = ctx.Enemies.create('basic', 100, 100); // 1 HP
    const killed = ctx.Enemies.damage(enemy, 1, game);
    assert.equal(killed, true);
    assert.ok(!enemy.active);
  });

  it('damage triggers hit flash', () => {
    const game = { particles: [], addScore() {}, triggerScreenShake() {}, triggerScreenFlash() {} };
    const enemy = ctx.Enemies.create('tank', 100, 100);
    ctx.Enemies.damage(enemy, 1, game);
    assert.equal(enemy.hitFlash, 1);
  });

  it('destroy calls addScore with correct value', () => {
    let scoreAdded = 0;
    let scoreX = 0, scoreY = 0;
    const game = {
      particles: [],
      addScore(val, x, y) { scoreAdded = val; scoreX = x; scoreY = y; },
      triggerScreenShake() {},
      triggerScreenFlash() {},
    };
    const enemy = ctx.Enemies.create('basic', 200, 150);
    ctx.Enemies.destroy(enemy, game);
    assert.equal(scoreAdded, ctx.SCORING.ENEMY_BASIC);
    assert.equal(scoreX, 200);
    assert.equal(scoreY, 150);
  });
});

describe('Enemies - Movement Update', () => {
  let ctx;

  it('should load modules', () => {
    ctx = createGameContext(['utils.js', 'particles.js', 'bullets.js', 'player.js', 'enemies.js']);
  });

  it('basic enemy moves downward', () => {
    const enemy = ctx.Enemies.create('basic', 400, 0);
    const initialY = enemy.y;
    const arr = [enemy];
    const game = { enemies: arr, enemyBullets: [] };
    ctx.Enemies.update(0.016, arr, game);
    assert.ok(enemy.y > initialY, 'enemy should move down');
  });

  it('inactive enemies are removed from array', () => {
    const enemy = ctx.Enemies.create('basic', 400, 0);
    enemy.active = false;
    const arr = [enemy];
    const game = { enemies: arr, enemyBullets: [] };
    ctx.Enemies.update(0.016, arr, game);
    assert.equal(arr.length, 0);
  });

  it('enemies below screen are despawned', () => {
    const enemy = ctx.Enemies.create('basic', 400, ctx.GAME.HEIGHT + 100);
    const arr = [enemy];
    const game = { enemies: arr, enemyBullets: [] };
    ctx.Enemies.update(0.016, arr, game);
    assert.equal(arr.length, 0);
  });
});
