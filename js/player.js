// ============================================================
// Cosmic Defender - Player Ship
// ============================================================
// Player class with position, velocity, acceleration, bounds
// clamping, procedural polygon ship drawing, invincibility
// frames on hit, and lives system.

const Player = (function () {
  // --- Player State ---
  let x = 0;
  let y = 0;
  let vx = 0;
  let vy = 0;
  let width = 32;
  let height = 36;
  let radius = 14; // collision radius (circle)
  let active = true;

  // Invincibility
  let invincible = false;
  let invincibleTimer = 0;
  let blinkTimer = 0;
  let visible = true; // toggles during invincibility blink

  // Shooting
  let fireTimer = 0;

  // Engine trail animation
  let enginePhase = 0;

  // Ship tilt based on horizontal movement
  let tilt = 0;

  // --- Initialization ---
  function init() {
    x = GAME.WIDTH / 2;
    y = GAME.HEIGHT - 80;
    vx = 0;
    vy = 0;
    active = true;
    invincible = false;
    invincibleTimer = 0;
    blinkTimer = 0;
    visible = true;
    fireTimer = 0;
    enginePhase = 0;
    tilt = 0;

    return Player;
  }

  // --- Update ---
  function update(dt, game) {
    if (!active) return;

    // Movement from input
    const dir = Input.getDirection();
    const speed = SPEEDS.PLAYER;

    // Smooth acceleration/deceleration
    const accel = 12; // acceleration multiplier
    const friction = 8; // deceleration multiplier

    if (dir.x !== 0) {
      vx = lerp(vx, dir.x * speed, accel * dt);
    } else {
      vx = lerp(vx, 0, friction * dt);
    }

    if (dir.y !== 0) {
      vy = lerp(vy, dir.y * speed, accel * dt);
    } else {
      vy = lerp(vy, 0, friction * dt);
    }

    // Apply velocity
    x += vx * dt;
    y += vy * dt;

    // Clamp to bounds (with half-width/height margin)
    const halfW = width / 2;
    const halfH = height / 2;
    x = clamp(x, halfW, GAME.WIDTH - halfW);
    y = clamp(y, halfH, GAME.HEIGHT - halfH);

    // Ship tilt follows horizontal velocity
    const maxTilt = 0.3; // radians
    tilt = lerp(tilt, (vx / speed) * maxTilt, 8 * dt);

    // Invincibility timer
    if (invincible) {
      invincibleTimer -= dt;
      blinkTimer += dt;
      // Blink every 0.1s
      if (blinkTimer >= 0.1) {
        blinkTimer -= 0.1;
        visible = !visible;
      }
      if (invincibleTimer <= 0) {
        invincible = false;
        invincibleTimer = 0;
        visible = true;
      }
    }

    // Shooting
    fireTimer -= dt;
    if (Input.isShooting() && fireTimer <= 0) {
      shoot(game);
      const rate = game.hasPowerUp('rapid')
        ? PLAYER_DEFAULTS.RAPID_FIRE_RATE
        : PLAYER_DEFAULTS.FIRE_RATE;
      fireTimer = rate;
    }

    // Engine trail animation
    enginePhase += dt * 10;
  }

  // --- Shooting ---
  function shoot(game) {
    if (typeof Bullets === 'undefined' || !Bullets.createPlayerBullet) return;

    if (game.hasPowerUp('spread')) {
      // Spread shot: 3 bullets in a fan
      const spreadRad = degToRad(PLAYER_DEFAULTS.SPREAD_ANGLE);
      Bullets.createPlayerBullet(game.playerBullets, x, y - height / 2, 0, -1);
      Bullets.createPlayerBullet(game.playerBullets, x, y - height / 2,
        Math.sin(-spreadRad), -Math.cos(spreadRad));
      Bullets.createPlayerBullet(game.playerBullets, x, y - height / 2,
        Math.sin(spreadRad), -Math.cos(spreadRad));
    } else {
      Bullets.createPlayerBullet(game.playerBullets, x, y - height / 2, 0, -1);
    }

    // Play shoot sound
    if (typeof AudioManager !== 'undefined' && AudioManager.play) {
      AudioManager.play('shoot');
    }
  }

  // --- Take Damage ---
  function hit(game) {
    if (!active || invincible) return false;

    // Start invincibility frames
    invincible = true;
    invincibleTimer = PLAYER_DEFAULTS.INVINCIBLE_DURATION;
    blinkTimer = 0;
    visible = true;

    // Lose a life
    game.loseLife();

    // Screen shake on hit
    game.triggerScreenShake(SCREEN_SHAKE.INTENSITY, SCREEN_SHAKE.DURATION);

    // Spawn hit particles
    if (typeof Particles !== 'undefined' && Particles.spawnExplosion) {
      Particles.spawnExplosion(game.particles, x, y, COLORS.PLAYER_ENGINE, 15);
    }

    // Play hit sound
    if (typeof AudioManager !== 'undefined' && AudioManager.play) {
      AudioManager.play('playerHit');
    }

    return true;
  }

  // --- Rendering ---
  function render(ctx) {
    if (!active || !visible) return;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);

    // Engine glow (behind ship)
    drawEngineTrail(ctx);

    // Ship body - sleek arrow/fighter shape
    drawShipBody(ctx);

    // Shield effect when invincible or shield power-up active
    if (invincible || (typeof Game !== 'undefined' && Game.hasPowerUp && Game.hasPowerUp('shield'))) {
      drawShield(ctx);
    }

    ctx.restore();
  }

  function drawShipBody(ctx) {
    const hw = width / 2;  // 16
    const hh = height / 2; // 18

    // Main hull shape
    ctx.beginPath();
    ctx.moveTo(0, -hh);           // nose
    ctx.lineTo(-hw * 0.3, -hh * 0.3);  // upper-left shoulder
    ctx.lineTo(-hw, hh * 0.6);    // left wing tip
    ctx.lineTo(-hw * 0.5, hh * 0.4);   // left wing inner
    ctx.lineTo(-hw * 0.35, hh);   // left engine
    ctx.lineTo(hw * 0.35, hh);    // right engine
    ctx.lineTo(hw * 0.5, hh * 0.4);    // right wing inner
    ctx.lineTo(hw, hh * 0.6);     // right wing tip
    ctx.lineTo(hw * 0.3, -hh * 0.3);   // upper-right shoulder
    ctx.closePath();

    // Fill with gradient
    const grad = ctx.createLinearGradient(0, -hh, 0, hh);
    grad.addColorStop(0, '#40e0ff');
    grad.addColorStop(0.5, COLORS.PLAYER_BODY);
    grad.addColorStop(1, '#005f73');
    ctx.fillStyle = grad;
    ctx.fill();

    // Outline glow
    ctx.shadowColor = COLORS.PLAYER_BODY;
    ctx.shadowBlur = 8;
    ctx.strokeStyle = COLORS.PLAYER_BODY;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Cockpit detail (small triangle near nose)
    ctx.beginPath();
    ctx.moveTo(0, -hh * 0.7);
    ctx.lineTo(-hw * 0.15, -hh * 0.15);
    ctx.lineTo(hw * 0.15, -hh * 0.15);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fill();

    // Wing accents
    ctx.strokeStyle = COLORS.PLAYER_ENGINE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-hw * 0.5, hh * 0.1);
    ctx.lineTo(-hw * 0.9, hh * 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(hw * 0.5, hh * 0.1);
    ctx.lineTo(hw * 0.9, hh * 0.5);
    ctx.stroke();
  }

  function drawEngineTrail(ctx) {
    const hw = width / 2;
    const hh = height / 2;
    const flicker = 0.7 + 0.3 * Math.sin(enginePhase);
    const trailLen = 12 * flicker;

    // Left engine flame
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    const flameGrad = ctx.createLinearGradient(0, hh, 0, hh + trailLen);
    flameGrad.addColorStop(0, 'rgba(255, 64, 129, 0.9)');
    flameGrad.addColorStop(0.5, 'rgba(255, 171, 64, 0.5)');
    flameGrad.addColorStop(1, 'rgba(255, 171, 64, 0)');

    // Left flame
    ctx.beginPath();
    ctx.moveTo(-hw * 0.25, hh);
    ctx.lineTo(-hw * 0.1, hh + trailLen);
    ctx.lineTo(hw * 0.05 - hw * 0.15, hh);
    ctx.closePath();
    ctx.fillStyle = flameGrad;
    ctx.fill();

    // Right flame
    ctx.beginPath();
    ctx.moveTo(hw * 0.25, hh);
    ctx.lineTo(hw * 0.1, hh + trailLen);
    ctx.lineTo(hw * 0.15 - hw * 0.05, hh);
    ctx.closePath();
    ctx.fillStyle = flameGrad;
    ctx.fill();

    // Center glow
    const coreGrad = ctx.createRadialGradient(0, hh, 0, 0, hh, 8);
    coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    coreGrad.addColorStop(1, 'rgba(255, 64, 129, 0)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, hh, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawShield(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    const shieldRadius = radius + 8;
    const pulsePhase = Date.now() * 0.005;
    const pulse = 0.2 + 0.15 * Math.sin(pulsePhase);

    const grad = ctx.createRadialGradient(0, 0, radius * 0.5, 0, 0, shieldRadius);
    grad.addColorStop(0, 'rgba(0, 229, 255, 0)');
    grad.addColorStop(0.7, 'rgba(0, 229, 255, ' + (pulse * 0.5) + ')');
    grad.addColorStop(1, 'rgba(0, 229, 255, ' + pulse + ')');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, shieldRadius, 0, Math.PI * 2);
    ctx.fill();

    // Shield ring
    ctx.strokeStyle = fadeColor(COLORS.PLAYER_BODY, 0.3 + pulse);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, shieldRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  // --- Public API ---
  return {
    init: init,
    update: update,
    render: render,
    hit: hit,

    // Position accessors
    get x() { return x; },
    get y() { return y; },
    set x(val) { x = val; },
    set y(val) { y = val; },

    get width() { return width; },
    get height() { return height; },
    get radius() { return radius; },
    get active() { return active; },
    set active(val) { active = val; },

    get invincible() { return invincible; },

    // Bounding box for AABB collision
    getBounds() {
      return {
        x: x - width / 2,
        y: y - height / 2,
        width: width,
        height: height,
      };
    },
  };
})();
