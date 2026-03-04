// ============================================================
// Cosmic Defender - Power-Up System
// ============================================================
// PowerUp entity types: shield (temp invincibility), spread-shot,
// rapid-fire, extra life. Random drops from destroyed enemies
// (15% chance), visual indicators, timed effects (8s duration).

const PowerUps = (function () {
  // Power-up type identifiers
  const TYPE = {
    SHIELD: 'shield',
    SPREAD: 'spread',
    RAPID: 'rapid',
    LIFE: 'life',
  };

  // Per-type configuration
  const CONFIG = {
    [TYPE.SHIELD]: {
      color: COLORS.POWERUP_SHIELD,
      label: 'S',
      glowColor: 'rgba(0, 229, 255, 0.4)',
    },
    [TYPE.SPREAD]: {
      color: COLORS.POWERUP_SPREAD,
      label: 'W',
      glowColor: 'rgba(255, 171, 64, 0.4)',
    },
    [TYPE.RAPID]: {
      color: COLORS.POWERUP_RAPID,
      label: 'R',
      glowColor: 'rgba(255, 64, 129, 0.4)',
    },
    [TYPE.LIFE]: {
      color: COLORS.POWERUP_LIFE,
      label: '+',
      glowColor: 'rgba(105, 240, 174, 0.4)',
    },
  };

  // All types for random selection (life is rarer)
  const DROP_TABLE = [TYPE.SHIELD, TYPE.SPREAD, TYPE.RAPID, TYPE.LIFE];
  const DROP_WEIGHTS = [0.3, 0.3, 0.3, 0.1]; // life is rarer

  // --- Power-Up Factory ---

  function create(type, x, y) {
    const cfg = CONFIG[type];
    if (!cfg) return null;

    const size = POWERUP_DEFAULTS.SIZE;

    return {
      type: type,
      x: x,
      y: y,
      vy: SPEEDS.POWERUP_FALL,
      width: size,
      height: size,
      radius: size / 2,
      color: cfg.color,
      label: cfg.label,
      glowColor: cfg.glowColor,
      active: true,
      age: 0,
    };
  }

  // --- Weighted Random Type Selection ---

  function randomType() {
    const roll = Math.random();
    let cumulative = 0;
    for (let i = 0; i < DROP_TABLE.length; i++) {
      cumulative += DROP_WEIGHTS[i];
      if (roll < cumulative) {
        return DROP_TABLE[i];
      }
    }
    return DROP_TABLE[0];
  }

  // --- Try Spawning a Drop (called on enemy death) ---

  function trySpawnDrop(powerupArray, x, y) {
    if (Math.random() > POWERUP_DEFAULTS.DROP_CHANCE) return;

    const type = randomType();
    const powerup = create(type, x, y);
    if (powerup) {
      powerupArray.push(powerup);
    }
  }

  // --- Update ---

  function update(dt, powerupArray) {
    for (let i = powerupArray.length - 1; i >= 0; i--) {
      const p = powerupArray[i];
      if (!p.active) {
        powerupArray.splice(i, 1);
        continue;
      }

      p.age += dt;
      p.y += p.vy * dt;

      // Remove if off screen (below bottom)
      if (p.y > GAME.HEIGHT + 40) {
        powerupArray.splice(i, 1);
      }
    }
  }

  // --- Rendering ---

  function render(ctx, powerupArray) {
    for (let i = 0; i < powerupArray.length; i++) {
      const p = powerupArray[i];
      if (!p.active) continue;

      ctx.save();
      ctx.translate(p.x, p.y);

      // Bobbing motion
      const bob = Math.sin(p.age * 3) * 3;
      ctx.translate(0, bob);

      // Rotation
      const rotation = p.age * 1.5;

      // Outer glow pulse
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const pulse = 0.4 + 0.3 * Math.sin(p.age * 4);
      const glowRadius = p.radius + 6 + Math.sin(p.age * 4) * 3;
      const glowGrad = ctx.createRadialGradient(0, 0, p.radius * 0.3, 0, 0, glowRadius);
      glowGrad.addColorStop(0, p.glowColor);
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Rotating diamond/gem shape
      ctx.save();
      ctx.rotate(rotation);

      const r = p.radius;

      // Diamond body
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(r, 0);
      ctx.lineTo(0, r);
      ctx.lineTo(-r, 0);
      ctx.closePath();

      // Fill with gradient
      const bodyGrad = ctx.createLinearGradient(-r, -r, r, r);
      bodyGrad.addColorStop(0, '#ffffff');
      bodyGrad.addColorStop(0.3, p.color);
      bodyGrad.addColorStop(1, p.color);
      ctx.fillStyle = bodyGrad;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.fill();

      // Outline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.restore(); // end rotation

      // Type label (stays upright)
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.label, 0, 0);

      // Sparkle particles around the power-up
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let s = 0; s < 3; s++) {
        const sparkAngle = p.age * 2 + s * (Math.PI * 2 / 3);
        const sparkDist = p.radius + 4 + Math.sin(p.age * 5 + s) * 3;
        const sx = Math.cos(sparkAngle) * sparkDist;
        const sy = Math.sin(sparkAngle) * sparkDist;
        const sparkAlpha = 0.4 + 0.4 * Math.sin(p.age * 6 + s * 2);

        ctx.fillStyle = fadeColor(p.color, sparkAlpha);
        ctx.beginPath();
        ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      ctx.restore(); // end main translate
    }
  }

  // --- Utility ---

  function clearAll(powerupArray) {
    powerupArray.length = 0;
  }

  // --- Public API ---
  return {
    TYPE: TYPE,
    CONFIG: CONFIG,
    create: create,
    trySpawnDrop: trySpawnDrop,
    update: update,
    render: render,
    clearAll: clearAll,
  };
})();
