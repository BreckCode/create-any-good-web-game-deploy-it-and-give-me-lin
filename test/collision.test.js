const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createGameContext } = require('./helpers/load-modules');

describe('Collision - Player Bullets vs Enemies', () => {
  let ctx;

  it('should load all required modules', () => {
    ctx = createGameContext([
      'utils.js', 'particles.js', 'bullets.js', 'player.js', 'enemies.js',
      'powerups.js', 'collision.js',
    ]);
    assert.ok(ctx.Collision);
  });

  it('bullet hitting enemy deactivates bullet and damages enemy', () => {
    // Create a 1-HP enemy and a bullet at the same position
    const enemy = ctx.Enemies.create('basic', 400, 300);
    const bullet = ctx.Bullets.createPlayerBullet([], 400, 300, 0, -1);
    bullet.x = 400;
    bullet.y = 300;

    let scoreAdded = 0;
    const game = {
      player: { x: 400, y: 500, radius: 15, active: true, invincible: false },
      playerBullets: [bullet],
      enemyBullets: [],
      enemies: [enemy],
      powerups: [],
      particles: [],
      hasPowerUp: () => false,
      activatePowerUp: () => {},
      addLife: () => {},
      addScore(val) { scoreAdded = val; },
      triggerScreenShake() {},
      triggerScreenFlash() {},
    };

    ctx.Collision.update(game);
    assert.equal(bullet.active, false, 'bullet should be deactivated');
    assert.equal(enemy.active, false, 'basic enemy (1 HP) should die');
    assert.equal(scoreAdded, ctx.SCORING.ENEMY_BASIC);
  });

  it('bullet hitting tank damages but does not kill', () => {
    const enemy = ctx.Enemies.create('tank', 400, 300);
    const bullet = ctx.Bullets.createPlayerBullet([], 400, 300, 0, -1);
    bullet.x = 400;
    bullet.y = 300;

    const game = {
      player: { x: 400, y: 500, radius: 15, active: true, invincible: false },
      playerBullets: [bullet],
      enemyBullets: [],
      enemies: [enemy],
      powerups: [],
      particles: [],
      hasPowerUp: () => false,
      activatePowerUp: () => {},
      addLife: () => {},
      addScore() {},
      triggerScreenShake() {},
      triggerScreenFlash() {},
    };

    const hpBefore = enemy.hp;
    ctx.Collision.update(game);
    assert.equal(enemy.hp, hpBefore - 1);
    assert.ok(enemy.active, 'tank should still be alive');
  });
});

describe('Collision - Enemy Bullets vs Player', () => {
  let ctx;

  it('should load modules', () => {
    ctx = createGameContext([
      'utils.js', 'particles.js', 'bullets.js', 'player.js', 'enemies.js',
      'powerups.js', 'collision.js',
    ]);
  });

  it('enemy bullet hitting player deactivates bullet', () => {
    const enemyBullet = ctx.Bullets.createEnemyBullet([], 400, 500, 0, 1);
    enemyBullet.x = 400;
    enemyBullet.y = 500;

    // Initialize player
    ctx.Player.init();
    ctx.Player.x = 400;
    ctx.Player.y = 500;

    let playerHit = false;
    // Mock Player.hit
    const origHit = ctx.Player.hit;
    ctx.Player.hit = function() { playerHit = true; };

    const game = {
      player: { x: 400, y: 500, radius: 15, active: true, invincible: false },
      playerBullets: [],
      enemyBullets: [enemyBullet],
      enemies: [],
      powerups: [],
      particles: [],
      hasPowerUp: () => false,
      activatePowerUp: () => {},
      addLife: () => {},
      addScore() {},
      triggerScreenShake() {},
    };

    ctx.Collision.update(game);
    assert.equal(enemyBullet.active, false);
  });

  it('invincible player is not hit by bullets', () => {
    const enemyBullet = ctx.Bullets.createEnemyBullet([], 400, 500, 0, 1);
    enemyBullet.x = 400;
    enemyBullet.y = 500;

    const game = {
      player: { x: 400, y: 500, radius: 15, active: true, invincible: true },
      playerBullets: [],
      enemyBullets: [enemyBullet],
      enemies: [],
      powerups: [],
      particles: [],
      hasPowerUp: () => false,
      activatePowerUp: () => {},
      addLife: () => {},
      addScore() {},
      triggerScreenShake() {},
    };

    ctx.Collision.update(game);
    assert.ok(enemyBullet.active, 'bullet should pass through invincible player');
  });

  it('shield power-up protects player', () => {
    const enemyBullet = ctx.Bullets.createEnemyBullet([], 400, 500, 0, 1);
    enemyBullet.x = 400;
    enemyBullet.y = 500;

    const game = {
      player: { x: 400, y: 500, radius: 15, active: true, invincible: false },
      playerBullets: [],
      enemyBullets: [enemyBullet],
      enemies: [],
      powerups: [],
      particles: [],
      hasPowerUp: (type) => type === 'shield',
      activatePowerUp: () => {},
      addLife: () => {},
      addScore() {},
      triggerScreenShake() {},
    };

    ctx.Collision.update(game);
    assert.ok(enemyBullet.active, 'bullet should pass through shielded player');
  });
});

describe('Collision - Player vs PowerUps', () => {
  let ctx;

  it('should load modules', () => {
    ctx = createGameContext([
      'utils.js', 'particles.js', 'bullets.js', 'player.js', 'enemies.js',
      'powerups.js', 'collision.js',
    ]);
  });

  it('player collects power-up on contact', () => {
    const powerup = ctx.PowerUps.create('spread', 400, 500);
    let activatedType = null;

    const game = {
      player: { x: 400, y: 500, radius: 15, active: true, invincible: false },
      playerBullets: [],
      enemyBullets: [],
      enemies: [],
      powerups: [powerup],
      particles: [],
      hasPowerUp: () => false,
      activatePowerUp: (type) => { activatedType = type; },
      addLife: () => {},
      addScore() {},
      triggerScreenShake() {},
    };

    ctx.Collision.update(game);
    assert.equal(powerup.active, false);
    assert.equal(activatedType, 'spread');
  });

  it('life power-up adds life instead of activating', () => {
    const powerup = ctx.PowerUps.create('life', 400, 500);
    let lifeAdded = false;
    let activatedType = null;

    const game = {
      player: { x: 400, y: 500, radius: 15, active: true, invincible: false },
      playerBullets: [],
      enemyBullets: [],
      enemies: [],
      powerups: [powerup],
      particles: [],
      hasPowerUp: () => false,
      activatePowerUp: (type) => { activatedType = type; },
      addLife: () => { lifeAdded = true; },
      addScore() {},
      triggerScreenShake() {},
    };

    ctx.Collision.update(game);
    assert.ok(lifeAdded, 'life power-up should call addLife');
    assert.equal(activatedType, null, 'life should not call activatePowerUp');
  });

  it('power-up not collected if player is far away', () => {
    const powerup = ctx.PowerUps.create('shield', 100, 100);

    const game = {
      player: { x: 700, y: 500, radius: 15, active: true, invincible: false },
      playerBullets: [],
      enemyBullets: [],
      enemies: [],
      powerups: [powerup],
      particles: [],
      hasPowerUp: () => false,
      activatePowerUp: () => {},
      addLife: () => {},
      addScore() {},
      triggerScreenShake() {},
    };

    ctx.Collision.update(game);
    assert.ok(powerup.active, 'distant power-up should not be collected');
  });
});
