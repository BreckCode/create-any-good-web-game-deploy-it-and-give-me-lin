// ============================================================
// Cosmic Defender - Enemy Types and AI Behaviors
// ============================================================
// Enemy classes: Basic (straight line), Zigzag (sine wave),
// Tank (slow, high HP), and Boss (slow, high HP, multi-attack).
// Each type has unique movement, shooting, and visual design.

const Enemies = (function () {
  // Enemy type identifiers
  const TYPE = {
    BASIC: 'basic',
    ZIGZAG: 'zigzag',
    TANK: 'tank',
    BOSS: 'boss',
  };

  // Per-type configuration
  const CONFIG = {
    [TYPE.BASIC]: {
      width: 28,
      height: 28,
      radius: 12,
      hp: ENEMY_DEFAULTS.BASIC_HP,
      speed: SPEEDS.ENEMY_BASIC,
      color: COLORS.ENEMY_BASIC,
      score: SCORING.ENEMY_BASIC,
      fireCooldown: ENEMY_DEFAULTS.FIRE_COOLDOWN,
      fireChance: 0.3, // chance to fire each cooldown cycle
    },
    [TYPE.ZIGZAG]: {
      width: 24,
      height: 30,
      radius: 11,
      hp: ENEMY_DEFAULTS.ZIGZAG_HP,
      speed: SPEEDS.ENEMY_ZIGZAG,
      color: COLORS.ENEMY_ZIGZAG,
      score: SCORING.ENEMY_ZIGZAG,
      fireCooldown: ENEMY_DEFAULTS.FIRE_COOLDOWN * 0.8,
      fireChance: 0.5,
    },
    [TYPE.TANK]: {
      width: 38,
      height: 38,
      radius: 17,
      hp: ENEMY_DEFAULTS.TANK_HP,
      speed: SPEEDS.ENEMY_TANK,
      color: COLORS.ENEMY_TANK,
      score: SCORING.ENEMY_TANK,
      fireCooldown: ENEMY_DEFAULTS.FIRE_COOLDOWN * 1.2,
      fireChance: 0.7,
    },
    [TYPE.BOSS]: {
      width: 56,
      height: 52,
      radius: 24,
      hp: ENEMY_DEFAULTS.BOSS_HP,
      speed: SPEEDS.ENEMY_BOSS,
      color: COLORS.ENEMY_BOSS,
      score: SCORING.ENEMY_BOSS,
      fireCooldown: ENEMY_DEFAULTS.FIRE_COOLDOWN * 0.6,
      fireChance: 1.0,
    },
  };

  // Off-screen margin before despawning
  const DESPAWN_MARGIN = 60;

  // --- Enemy Factory ---

  function create(type, x, y, speedMultiplier) {
    const cfg = CONFIG[type];
    if (!cfg) return null;

    const sm = speedMultiplier || 1;

    return {
      type: type,
      x: x,
      y: y,
      vx: 0,
      vy: cfg.speed * sm,
      width: cfg.width,
      height: cfg.height,
      radius: cfg.radius,
      hp: cfg.hp,
      maxHp: cfg.hp,
      speed: cfg.speed * sm,
      color: cfg.color,
      scoreValue: cfg.score,
      active: true,

      // Shooting
      fireTimer: randRange(0.5, cfg.fireCooldown), // stagger initial shots
      fireCooldown: cfg.fireCooldown,
      fireChance: cfg.fireChance,

      // Animation
      age: 0,
      phase: randRange(0, Math.PI * 2), // random start phase for sine patterns
      hitFlash: 0, // flash white on damage

      // Zigzag-specific
      originX: x, // center of sine wave oscillation

      // Boss-specific
      bossPhase: 0, // attack pattern phase
      bossAttackTimer: 0,
      bossSettled: false, // has boss reached its patrol Y
    };
  }

  // --- Update ---

  function update(dt, enemyArray, game) {
    for (let i = enemyArray.length - 1; i >= 0; i--) {
      const e = enemyArray[i];
      if (!e.active) {
        enemyArray.splice(i, 1);
        continue;
      }

      e.age += dt;

      // Hit flash decay
      if (e.hitFlash > 0) {
        e.hitFlash -= dt * 5;
        if (e.hitFlash < 0) e.hitFlash = 0;
      }

      // Type-specific movement
      switch (e.type) {
        case TYPE.BASIC:
          updateBasic(dt, e, game);
          break;
        case TYPE.ZIGZAG:
          updateZigzag(dt, e, game);
          break;
        case TYPE.TANK:
          updateTank(dt, e, game);
          break;
        case TYPE.BOSS:
          updateBoss(dt, e, game);
          break;
      }

      // Shooting (all types)
      updateShooting(dt, e, game);

      // Remove if off screen (below bottom)
      if (e.y > GAME.HEIGHT + DESPAWN_MARGIN) {
        enemyArray.splice(i, 1);
      }
    }
  }

  // --- Movement Patterns ---

  function updateBasic(dt, e) {
    // Straight downward movement
    e.x += e.vx * dt;
    e.y += e.vy * dt;
  }

  function updateZigzag(dt, e) {
    // Sine wave horizontal + downward movement
    e.y += e.vy * dt;
    e.x = e.originX + Math.sin(e.age * ENEMY_DEFAULTS.ZIGZAG_FREQUENCY * Math.PI * 2 + e.phase) * ENEMY_DEFAULTS.ZIGZAG_AMPLITUDE;
  }

  function updateTank(dt, e) {
    // Slow downward, slight tracking toward player
    e.y += e.vy * dt;

    if (typeof Player !== 'undefined' && Player.active) {
      const dx = Player.x - e.x;
      // Slowly drift toward player's X position
      e.x += clamp(dx, -1, 1) * e.speed * 0.3 * dt;
    }

    // Keep in bounds
    e.x = clamp(e.x, e.width / 2, GAME.WIDTH - e.width / 2);
  }

  function updateBoss(dt, e) {
    // Boss moves to a patrol Y, then moves side to side
    const patrolY = 80;

    if (!e.bossSettled) {
      // Move down to patrol position
      e.y += e.speed * 2 * dt;
      if (e.y >= patrolY) {
        e.y = patrolY;
        e.bossSettled = true;
      }
    } else {
      // Side-to-side patrol
      e.bossPhase += dt;
      e.x = GAME.WIDTH / 2 + Math.sin(e.bossPhase * 0.5) * (GAME.WIDTH * 0.3);
      // Gentle vertical bob
      e.y = patrolY + Math.sin(e.bossPhase * 0.8) * 15;
    }
  }

  // --- Shooting ---

  function updateShooting(dt, e, game) {
    // Only shoot if on screen
    if (e.y < 0 || e.y > GAME.HEIGHT) return;
    if (typeof Bullets === 'undefined') return;
    if (typeof Player === 'undefined' || !Player.active) return;

    e.fireTimer -= dt;
    if (e.fireTimer <= 0) {
      e.fireTimer = e.fireCooldown;

      if (Math.random() < e.fireChance) {
        if (e.type === TYPE.BOSS) {
          // Boss has multi-pattern attacks
          shootBoss(e, game);
        } else if (e.type === TYPE.TANK) {
          // Tank shoots aimed bullets
          Bullets.createAimedBullet(game.enemyBullets, e.x, e.y + e.height / 2, Player.x, Player.y);
        } else {
          // Basic and zigzag shoot downward or slightly aimed
          const aimChance = e.type === TYPE.ZIGZAG ? 0.6 : 0.3;
          if (Math.random() < aimChance) {
            Bullets.createAimedBullet(game.enemyBullets, e.x, e.y + e.height / 2, Player.x, Player.y);
          } else {
            Bullets.createEnemyBullet(game.enemyBullets, e.x, e.y + e.height / 2, 0, 1);
          }
        }
      }
    }
  }

  function shootBoss(e, game) {
    e.bossAttackTimer++;
    const pattern = e.bossAttackTimer % 3;

    switch (pattern) {
      case 0:
        // Spread shot
        Bullets.createEnemySpread(game.enemyBullets, e.x, e.y + e.height / 2, 5, 60);
        break;
      case 1:
        // Aimed shot at player
        Bullets.createAimedBullet(game.enemyBullets, e.x - 15, e.y + e.height / 2, Player.x, Player.y, 1.2);
        Bullets.createAimedBullet(game.enemyBullets, e.x + 15, e.y + e.height / 2, Player.x, Player.y, 1.2);
        break;
      case 2:
        // Burst of downward bullets
        for (let i = -2; i <= 2; i++) {
          Bullets.createEnemyBullet(game.enemyBullets, e.x + i * 18, e.y + e.height / 2, i * 0.15, 1);
        }
        break;
    }
  }

  // --- Damage & Destruction ---

  function damage(enemy, amount, game) {
    if (!enemy.active) return false;

    enemy.hp -= (amount || 1);
    enemy.hitFlash = 1;

    if (enemy.hp <= 0) {
      destroy(enemy, game);
      return true; // killed
    }
    return false; // survived
  }

  function destroy(enemy, game) {
    enemy.active = false;

    // Add score
    if (game && game.addScore) {
      game.addScore(enemy.scoreValue);
    }

    // Spawn explosion particles
    if (typeof Particles !== 'undefined' && Particles.spawnExplosion) {
      const count = enemy.type === TYPE.BOSS ? PARTICLES.DEATH_COUNT : PARTICLES.EXPLOSION_COUNT;
      Particles.spawnExplosion(game.particles, enemy.x, enemy.y, enemy.color, count);
    }

    // Screen shake for big enemies
    if (game && game.triggerScreenShake) {
      if (enemy.type === TYPE.BOSS) {
        game.triggerScreenShake(SCREEN_SHAKE.INTENSITY * 2, SCREEN_SHAKE.DURATION * 2);
      } else if (enemy.type === TYPE.TANK) {
        game.triggerScreenShake(SCREEN_SHAKE.INTENSITY * 0.7, SCREEN_SHAKE.DURATION);
      }
    }

    // Play explosion sound
    if (typeof AudioManager !== 'undefined' && AudioManager.play) {
      AudioManager.play('explosion');
    }
  }

  // --- Rendering ---

  function render(ctx, enemyArray) {
    for (let i = 0; i < enemyArray.length; i++) {
      const e = enemyArray[i];
      if (!e.active) continue;

      ctx.save();
      ctx.translate(e.x, e.y);

      switch (e.type) {
        case TYPE.BASIC:
          renderBasic(ctx, e);
          break;
        case TYPE.ZIGZAG:
          renderZigzag(ctx, e);
          break;
        case TYPE.TANK:
          renderTank(ctx, e);
          break;
        case TYPE.BOSS:
          renderBoss(ctx, e);
          break;
      }

      // Health bar for multi-HP enemies
      if (e.maxHp > 1 && e.hp < e.maxHp) {
        renderHealthBar(ctx, e);
      }

      ctx.restore();
    }
  }

  // --- Basic Enemy: Angular red fighter ---
  function renderBasic(ctx, e) {
    const hw = e.width / 2;
    const hh = e.height / 2;

    // Body glow
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 8;

    // Main body - inverted triangle/arrow pointing down
    ctx.beginPath();
    ctx.moveTo(0, hh);           // nose (pointing down)
    ctx.lineTo(-hw, -hh);        // top-left
    ctx.lineTo(-hw * 0.3, -hh * 0.4); // inner-left notch
    ctx.lineTo(0, -hh * 0.7);   // center notch
    ctx.lineTo(hw * 0.3, -hh * 0.4);  // inner-right notch
    ctx.lineTo(hw, -hh);         // top-right
    ctx.closePath();

    // Fill with gradient
    const grad = ctx.createLinearGradient(0, -hh, 0, hh);
    if (e.hitFlash > 0) {
      grad.addColorStop(0, 'rgba(255,255,255,' + e.hitFlash + ')');
      grad.addColorStop(1, e.color);
    } else {
      grad.addColorStop(0, '#ff8a80');
      grad.addColorStop(0.5, e.color);
      grad.addColorStop(1, '#b71c1c');
    }
    ctx.fillStyle = grad;
    ctx.fill();

    // Outline
    ctx.strokeStyle = e.color;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Engine glow on top (enemies fly downward)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const flicker = 0.6 + 0.4 * Math.sin(e.age * 12);
    const engineGrad = ctx.createRadialGradient(0, -hh * 0.7, 0, 0, -hh * 0.7, 6 * flicker);
    engineGrad.addColorStop(0, 'rgba(255, 200, 100, 0.8)');
    engineGrad.addColorStop(1, 'rgba(255, 100, 50, 0)');
    ctx.fillStyle = engineGrad;
    ctx.beginPath();
    ctx.arc(0, -hh * 0.7, 6 * flicker, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Eye/cockpit
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Zigzag Enemy: Sleek orange wasp ---
  function renderZigzag(ctx, e) {
    const hw = e.width / 2;
    const hh = e.height / 2;

    // Tilt based on movement direction
    const tiltAngle = Math.cos(e.age * ENEMY_DEFAULTS.ZIGZAG_FREQUENCY * Math.PI * 2 + e.phase) * 0.3;
    ctx.rotate(tiltAngle);

    ctx.shadowColor = e.color;
    ctx.shadowBlur = 6;

    // Elongated diamond body
    ctx.beginPath();
    ctx.moveTo(0, hh);             // bottom point
    ctx.lineTo(-hw, 0);            // left point
    ctx.lineTo(-hw * 0.5, -hh * 0.5); // upper-left
    ctx.lineTo(0, -hh);            // top point
    ctx.lineTo(hw * 0.5, -hh * 0.5);  // upper-right
    ctx.lineTo(hw, 0);             // right point
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, -hh, 0, hh);
    if (e.hitFlash > 0) {
      grad.addColorStop(0, 'rgba(255,255,255,' + e.hitFlash + ')');
      grad.addColorStop(1, e.color);
    } else {
      grad.addColorStop(0, '#ffe082');
      grad.addColorStop(0.5, e.color);
      grad.addColorStop(1, '#e65100');
    }
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = e.color;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Wing accent lines
    ctx.strokeStyle = 'rgba(255, 255, 200, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-hw * 0.3, -hh * 0.2);
    ctx.lineTo(-hw * 0.8, hh * 0.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(hw * 0.3, -hh * 0.2);
    ctx.lineTo(hw * 0.8, hh * 0.1);
    ctx.stroke();

    // Pulsing core
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const pulse = 0.5 + 0.5 * Math.sin(e.age * 6);
    const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 5);
    coreGrad.addColorStop(0, 'rgba(255, 255, 255, ' + (0.6 * pulse) + ')');
    coreGrad.addColorStop(1, 'rgba(255, 171, 64, 0)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // --- Tank Enemy: Bulky purple hexagon ---
  function renderTank(ctx, e) {
    const hw = e.width / 2;
    const hh = e.height / 2;

    ctx.shadowColor = e.color;
    ctx.shadowBlur = 10;

    // Hexagonal body
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6; // flat-top hex
      const px = Math.cos(a) * hw;
      const py = Math.sin(a) * hh;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, -hh, 0, hh);
    if (e.hitFlash > 0) {
      grad.addColorStop(0, 'rgba(255,255,255,' + e.hitFlash + ')');
      grad.addColorStop(1, e.color);
    } else {
      grad.addColorStop(0, '#b388ff');
      grad.addColorStop(0.5, e.color);
      grad.addColorStop(1, '#311b92');
    }
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = e.color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Inner armor plating - smaller hexagon
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      const px = Math.cos(a) * hw * 0.55;
      const py = Math.sin(a) * hh * 0.55;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(179, 136, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Center cannon glow
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const charge = 0.3 + 0.3 * Math.sin(e.age * 3);
    const cannonGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 8);
    cannonGrad.addColorStop(0, 'rgba(200, 150, 255, ' + charge + ')');
    cannonGrad.addColorStop(1, 'rgba(124, 77, 255, 0)');
    ctx.fillStyle = cannonGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Side turrets
    ctx.fillStyle = 'rgba(179, 136, 255, 0.6)';
    ctx.fillRect(-hw * 0.9, -3, 6, 6);
    ctx.fillRect(hw * 0.9 - 6, -3, 6, 6);
  }

  // --- Boss Enemy: Large menacing ship ---
  function renderBoss(ctx, e) {
    const hw = e.width / 2;
    const hh = e.height / 2;

    // Pulsing aura
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const auraPulse = 0.15 + 0.1 * Math.sin(e.age * 2);
    const auraGrad = ctx.createRadialGradient(0, 0, hw * 0.5, 0, 0, hw * 1.3);
    auraGrad.addColorStop(0, 'rgba(255, 23, 68, ' + auraPulse + ')');
    auraGrad.addColorStop(1, 'rgba(255, 23, 68, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, hw * 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.shadowColor = e.color;
    ctx.shadowBlur = 15;

    // Main body - angular dreadnought shape
    ctx.beginPath();
    ctx.moveTo(0, hh);                    // front (pointing down)
    ctx.lineTo(-hw * 0.4, hh * 0.5);     // front-left
    ctx.lineTo(-hw, hh * 0.2);           // left wing tip
    ctx.lineTo(-hw * 0.9, -hh * 0.3);    // left mid
    ctx.lineTo(-hw * 0.6, -hh * 0.7);    // upper-left
    ctx.lineTo(-hw * 0.3, -hh);          // top-left
    ctx.lineTo(0, -hh * 0.8);            // top center notch
    ctx.lineTo(hw * 0.3, -hh);           // top-right
    ctx.lineTo(hw * 0.6, -hh * 0.7);     // upper-right
    ctx.lineTo(hw * 0.9, -hh * 0.3);     // right mid
    ctx.lineTo(hw, hh * 0.2);            // right wing tip
    ctx.lineTo(hw * 0.4, hh * 0.5);      // front-right
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, -hh, 0, hh);
    if (e.hitFlash > 0) {
      grad.addColorStop(0, 'rgba(255,255,255,' + e.hitFlash + ')');
      grad.addColorStop(1, e.color);
    } else {
      grad.addColorStop(0, '#ff5252');
      grad.addColorStop(0.3, e.color);
      grad.addColorStop(1, '#880e0e');
    }
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = '#ff5252';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Wing detail lines
    ctx.strokeStyle = 'rgba(255, 82, 82, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-hw * 0.4, -hh * 0.5);
    ctx.lineTo(-hw * 0.8, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(hw * 0.4, -hh * 0.5);
    ctx.lineTo(hw * 0.8, 0);
    ctx.stroke();

    // Center command bridge
    ctx.beginPath();
    ctx.moveTo(0, hh * 0.3);
    ctx.lineTo(-hw * 0.2, -hh * 0.1);
    ctx.lineTo(0, -hh * 0.4);
    ctx.lineTo(hw * 0.2, -hh * 0.1);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 100, 100, 0.5)';
    ctx.fill();

    // Pulsing central eye
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const eyePulse = 0.5 + 0.5 * Math.sin(e.age * 4);
    const eyeGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 6);
    eyeGrad.addColorStop(0, 'rgba(255, 255, 255, ' + eyePulse + ')');
    eyeGrad.addColorStop(0.5, 'rgba(255, 23, 68, ' + (eyePulse * 0.5) + ')');
    eyeGrad.addColorStop(1, 'rgba(255, 23, 68, 0)');
    ctx.fillStyle = eyeGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Engine exhausts (top of boss, since it faces down)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const flicker = 0.6 + 0.4 * Math.sin(e.age * 15);
    for (let offset = -1; offset <= 1; offset++) {
      const ex = offset * hw * 0.3;
      const ey = -hh * 0.85;
      const engGrad = ctx.createRadialGradient(ex, ey, 0, ex, ey, 5 * flicker);
      engGrad.addColorStop(0, 'rgba(255, 200, 100, 0.7)');
      engGrad.addColorStop(1, 'rgba(255, 50, 50, 0)');
      ctx.fillStyle = engGrad;
      ctx.beginPath();
      ctx.arc(ex, ey, 5 * flicker, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // --- Health Bar ---
  function renderHealthBar(ctx, e) {
    const barWidth = e.width + 4;
    const barHeight = 3;
    const barY = -e.height / 2 - 8;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(-barWidth / 2, barY, barWidth, barHeight);

    // Health fill
    const hpRatio = e.hp / e.maxHp;
    const fillColor = hpRatio > 0.5 ? e.color : hpRatio > 0.25 ? '#ffab40' : '#ff5252';
    ctx.fillStyle = fillColor;
    ctx.fillRect(-barWidth / 2, barY, barWidth * hpRatio, barHeight);

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(-barWidth / 2, barY, barWidth, barHeight);
  }

  // --- Utility ---

  function getBounds(enemy) {
    return {
      x: enemy.x - enemy.width / 2,
      y: enemy.y - enemy.height / 2,
      width: enemy.width,
      height: enemy.height,
    };
  }

  function clearAll(enemyArray) {
    enemyArray.length = 0;
  }

  // --- Public API ---
  return {
    TYPE: TYPE,
    CONFIG: CONFIG,
    create: create,
    update: update,
    render: render,
    damage: damage,
    destroy: destroy,
    getBounds: getBounds,
    clearAll: clearAll,
  };
})();
