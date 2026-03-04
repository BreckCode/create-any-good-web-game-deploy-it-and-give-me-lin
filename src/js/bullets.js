// ============================================================
// Cosmic Defender - Bullet / Projectile System
// ============================================================
// Manages player and enemy projectiles with object pooling,
// different bullet types, movement, lifecycle, and rendering.

const Bullets = (function () {
  // Pool sizes to limit max bullets on screen
  const MAX_PLAYER_BULLETS = 60;
  const MAX_ENEMY_BULLETS = 80;

  // Bullet dimensions
  const PLAYER_BULLET_WIDTH = 4;
  const PLAYER_BULLET_HEIGHT = 14;
  const PLAYER_BULLET_RADIUS = 4;

  const ENEMY_BULLET_WIDTH = 5;
  const ENEMY_BULLET_HEIGHT = 10;
  const ENEMY_BULLET_RADIUS = 4;

  // Off-screen margin before removing bullets
  const DESPAWN_MARGIN = 40;

  // --- Bullet Factory ---

  function createBullet(x, y, vx, vy, isPlayer, type) {
    return {
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      width: isPlayer ? PLAYER_BULLET_WIDTH : ENEMY_BULLET_WIDTH,
      height: isPlayer ? PLAYER_BULLET_HEIGHT : ENEMY_BULLET_HEIGHT,
      radius: isPlayer ? PLAYER_BULLET_RADIUS : ENEMY_BULLET_RADIUS,
      active: true,
      isPlayer: isPlayer,
      type: type || 'single', // 'single', 'spread', 'rapid'
      age: 0,
    };
  }

  // --- Player Bullet Creation ---

  function createPlayerBullet(bulletArray, x, y, dirX, dirY) {
    if (bulletArray.length >= MAX_PLAYER_BULLETS) return null;

    const speed = SPEEDS.PLAYER_BULLET;
    // Normalize direction
    const len = Math.sqrt(dirX * dirX + dirY * dirY);
    const nx = len > 0 ? dirX / len : 0;
    const ny = len > 0 ? dirY / len : -1;

    const bullet = createBullet(x, y, nx * speed, ny * speed, true, 'single');
    bulletArray.push(bullet);
    return bullet;
  }

  // --- Enemy Bullet Creation ---

  function createEnemyBullet(bulletArray, x, y, dirX, dirY, speedMultiplier) {
    if (bulletArray.length >= MAX_ENEMY_BULLETS) return null;

    const speed = SPEEDS.ENEMY_BULLET * (speedMultiplier || 1);
    const len = Math.sqrt(dirX * dirX + dirY * dirY);
    const nx = len > 0 ? dirX / len : 0;
    const ny = len > 0 ? dirY / len : 1;

    const bullet = createBullet(x, y, nx * speed, ny * speed, false, 'single');
    bulletArray.push(bullet);
    return bullet;
  }

  // Create a bullet aimed at a target position
  function createAimedBullet(bulletArray, fromX, fromY, targetX, targetY, speedMultiplier) {
    const dx = targetX - fromX;
    const dy = targetY - fromY;
    return createEnemyBullet(bulletArray, fromX, fromY, dx, dy, speedMultiplier);
  }

  // Create a spread of enemy bullets (fan pattern)
  function createEnemySpread(bulletArray, x, y, count, spreadAngle, speedMultiplier) {
    const baseAngle = Math.PI / 2; // straight down
    const totalSpread = degToRad(spreadAngle || 30);
    const step = count > 1 ? totalSpread / (count - 1) : 0;
    const startAngle = baseAngle - totalSpread / 2;

    for (let i = 0; i < count; i++) {
      const a = count > 1 ? startAngle + step * i : baseAngle;
      const dirX = Math.cos(a);
      const dirY = Math.sin(a);
      createEnemyBullet(bulletArray, x, y, dirX, dirY, speedMultiplier);
    }
  }

  // --- Update ---

  function update(dt, playerBullets, enemyBullets) {
    updateArray(dt, playerBullets);
    updateArray(dt, enemyBullets);
  }

  function updateArray(dt, bullets) {
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      if (!b.active) {
        bullets.splice(i, 1);
        continue;
      }

      // Move
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.age += dt;

      // Remove if off screen
      if (b.x < -DESPAWN_MARGIN || b.x > GAME.WIDTH + DESPAWN_MARGIN ||
          b.y < -DESPAWN_MARGIN || b.y > GAME.HEIGHT + DESPAWN_MARGIN) {
        bullets.splice(i, 1);
      }
    }
  }

  // --- Rendering ---

  function render(ctx, playerBullets, enemyBullets) {
    renderPlayerBullets(ctx, playerBullets);
    renderEnemyBullets(ctx, enemyBullets);
  }

  function renderPlayerBullets(ctx, bullets) {
    if (bullets.length === 0) return;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < bullets.length; i++) {
      const b = bullets[i];
      if (!b.active) continue;

      // Outer glow
      ctx.shadowColor = COLORS.BULLET_PLAYER;
      ctx.shadowBlur = 10;

      // Elongated bullet shape
      const hw = b.width / 2;
      const hh = b.height / 2;

      // Glow trail
      const grad = ctx.createLinearGradient(b.x, b.y - hh, b.x, b.y + hh);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      grad.addColorStop(0.3, COLORS.BULLET_PLAYER);
      grad.addColorStop(1, fadeColor(COLORS.BULLET_PLAYER, 0.2));

      ctx.fillStyle = grad;
      ctx.beginPath();
      // Rounded capsule shape
      ctx.moveTo(b.x - hw, b.y + hh * 0.5);
      ctx.lineTo(b.x - hw, b.y - hh * 0.3);
      ctx.quadraticCurveTo(b.x, b.y - hh - 3, b.x + hw, b.y - hh * 0.3);
      ctx.lineTo(b.x + hw, b.y + hh * 0.5);
      ctx.quadraticCurveTo(b.x, b.y + hh, b.x - hw, b.y + hh * 0.5);
      ctx.fill();

      // Bright core
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(b.x - 1, b.y - hh * 0.5, 2, hh);
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function renderEnemyBullets(ctx, bullets) {
    if (bullets.length === 0) return;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < bullets.length; i++) {
      const b = bullets[i];
      if (!b.active) continue;

      ctx.shadowColor = COLORS.BULLET_ENEMY;
      ctx.shadowBlur = 8;

      // Enemy bullets are circular/diamond shaped
      const r = b.radius;

      // Outer glow
      const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r + 3);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      grad.addColorStop(0.4, COLORS.BULLET_ENEMY);
      grad.addColorStop(1, fadeColor(COLORS.BULLET_ENEMY, 0));

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, r + 3, 0, Math.PI * 2);
      ctx.fill();

      // Inner core - diamond
      ctx.fillStyle = COLORS.BULLET_ENEMY;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y - r);
      ctx.lineTo(b.x + r * 0.6, b.y);
      ctx.lineTo(b.x, b.y + r);
      ctx.lineTo(b.x - r * 0.6, b.y);
      ctx.closePath();
      ctx.fill();

      // Bright center dot
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(b.x, b.y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // --- Utility ---

  // Get bounding box for collision
  function getBounds(bullet) {
    return {
      x: bullet.x - bullet.width / 2,
      y: bullet.y - bullet.height / 2,
      width: bullet.width,
      height: bullet.height,
    };
  }

  // Deactivate a bullet (mark for removal)
  function destroy(bullet) {
    bullet.active = false;
  }

  // Clear all bullets from both arrays
  function clearAll(playerBullets, enemyBullets) {
    playerBullets.length = 0;
    enemyBullets.length = 0;
  }

  // --- Public API ---
  return {
    createPlayerBullet: createPlayerBullet,
    createEnemyBullet: createEnemyBullet,
    createAimedBullet: createAimedBullet,
    createEnemySpread: createEnemySpread,
    update: update,
    render: render,
    getBounds: getBounds,
    destroy: destroy,
    clearAll: clearAll,

    // Constants exposed for other modules
    PLAYER_BULLET_RADIUS: PLAYER_BULLET_RADIUS,
    ENEMY_BULLET_RADIUS: ENEMY_BULLET_RADIUS,
  };
})();
