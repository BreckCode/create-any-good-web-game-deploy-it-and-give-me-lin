// ============================================================
// Cosmic Defender - Particle System
// ============================================================
// Particle pool with position, velocity, lifetime, color, size
// decay. Provides explosion effects, engine trails, hit sparks,
// death bursts, and power-up sparkles.

const Particles = (function () {

  // --- Create a Single Particle ---
  function createParticle(arr, x, y, vx, vy, color, lifetime, size) {
    arr.push({
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      color: color,
      lifetime: lifetime,
      maxLifetime: lifetime,
      size: size,
      active: true,
    });
  }

  // --- Spawn Explosion Effect ---
  // Used for enemy deaths, hit sparks, power-up collection, player hit.
  // count=0 means use default PARTICLES.EXPLOSION_COUNT.
  function spawnExplosion(arr, x, y, color, count) {
    const num = count || PARTICLES.EXPLOSION_COUNT;
    const colors = Array.isArray(color) ? color : [color];

    for (let i = 0; i < num; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = randRange(PARTICLES.MIN_SPEED, PARTICLES.MAX_SPEED);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const lifetime = randRange(PARTICLES.MIN_LIFETIME, PARTICLES.MAX_LIFETIME);
      const size = randRange(1.5, 4);
      const c = randPick(colors);

      createParticle(arr, x, y, vx, vy, c, lifetime, size);
    }
  }

  // --- Spawn Death Burst (large explosion) ---
  function spawnDeathBurst(arr, x, y, color) {
    const colors = Array.isArray(color) ? color : COLORS.PARTICLE_EXPLOSION;

    for (let i = 0; i < PARTICLES.DEATH_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = randRange(PARTICLES.MIN_SPEED, PARTICLES.MAX_SPEED * 1.5);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const lifetime = randRange(0.4, 1.2);
      const size = randRange(2, 6);
      const c = randPick(colors);

      createParticle(arr, x, y, vx, vy, c, lifetime, size);
    }
  }

  // --- Spawn Engine Trail Particles ---
  function spawnEngineTrail(arr, x, y) {
    const colors = COLORS.PARTICLE_ENGINE;

    for (let i = 0; i < PARTICLES.TRAIL_COUNT; i++) {
      const vx = randRange(-20, 20);
      const vy = randRange(40, 100);
      const lifetime = randRange(0.15, 0.35);
      const size = randRange(1, 2.5);
      const c = randPick(colors);

      createParticle(arr, x, y, vx, vy, c, lifetime, size);
    }
  }

  // --- Spawn Hit Sparks ---
  function spawnHitSparks(arr, x, y, color) {
    const colors = Array.isArray(color) ? color : COLORS.PARTICLE_HIT;

    for (let i = 0; i < PARTICLES.HIT_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = randRange(80, 200);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const lifetime = randRange(0.15, 0.4);
      const size = randRange(1, 3);
      const c = randPick(colors);

      createParticle(arr, x, y, vx, vy, c, lifetime, size);
    }
  }

  // --- Spawn Power-Up Sparkles ---
  function spawnSparkles(arr, x, y, color) {
    const c = color || COLORS.POWERUP_SHIELD;

    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = randRange(30, 120);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const lifetime = randRange(0.3, 0.7);
      const size = randRange(1.5, 3.5);

      createParticle(arr, x, y, vx, vy, c, lifetime, size);
    }
  }

  // --- Update All Particles ---
  function update(dt, arr) {
    for (let i = arr.length - 1; i >= 0; i--) {
      const p = arr[i];
      if (!p.active) {
        arr.splice(i, 1);
        continue;
      }

      p.lifetime -= dt;
      if (p.lifetime <= 0) {
        arr.splice(i, 1);
        continue;
      }

      // Apply velocity with slight drag
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= (1 - 2 * dt); // drag
      p.vy *= (1 - 2 * dt);
    }
  }

  // --- Render All Particles ---
  function render(ctx, arr) {
    if (arr.length === 0) return;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < arr.length; i++) {
      const p = arr[i];
      if (!p.active) continue;

      const lifeRatio = p.lifetime / p.maxLifetime;
      const alpha = lifeRatio;
      const currentSize = p.size * lifeRatio;

      if (currentSize <= 0) continue;

      // Parse color to apply alpha
      const rgb = hexToRgb(p.color);
      if (rgb.r === 0 && rgb.g === 0 && rgb.b === 0 && p.color !== '#000000') {
        // Fallback for non-hex colors (rgba strings etc)
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
      } else {
        ctx.fillStyle = rgba(rgb.r, rgb.g, rgb.b, alpha);
        ctx.globalAlpha = 1;
      }

      // Draw as a circle with glow
      ctx.beginPath();
      ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
      ctx.fill();

      // Glow effect for larger particles
      if (currentSize > 2) {
        ctx.fillStyle = rgba(rgb.r, rgb.g, rgb.b, alpha * 0.3);
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // --- Public API ---
  return {
    update: update,
    render: render,
    spawnExplosion: spawnExplosion,
    spawnDeathBurst: spawnDeathBurst,
    spawnEngineTrail: spawnEngineTrail,
    spawnHitSparks: spawnHitSparks,
    spawnSparkles: spawnSparkles,
  };
})();
