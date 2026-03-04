// ============================================================
// Cosmic Defender - Menu Screens (Canvas Rendering)
// ============================================================
// Renders animated canvas effects behind the HTML overlays:
// - Start screen: animated title with glow pulse, drifting particles
// - Pause overlay: dimmed game view with scan lines
// - Game over: final score with new-highscore fireworks animation

const Menu = (function () {
  // --- Animated title state ---
  let titleTimer = 0;
  let titleParticles = [];
  const TITLE_PARTICLE_COUNT = 30;

  // --- Game over state ---
  let gameOverTimer = 0;
  let fireworkParticles = [];
  let isNewHighScore = false;

  // --- Decorative floating stars for menu ---
  let menuStars = [];
  const MENU_STAR_COUNT = 15;

  // --- Init ---
  function init() {
    titleTimer = 0;
    gameOverTimer = 0;
    titleParticles = [];
    fireworkParticles = [];
    menuStars = [];
    isNewHighScore = false;

    // Create decorative menu stars
    for (let i = 0; i < MENU_STAR_COUNT; i++) {
      menuStars.push(createMenuStar());
    }
  }

  function createMenuStar() {
    return {
      x: randRange(0, GAME.WIDTH),
      y: randRange(0, GAME.HEIGHT),
      size: randRange(1, 3),
      speed: randRange(10, 40),
      alpha: randRange(0.2, 0.7),
      twinkleSpeed: randRange(1, 3),
      twinkleOffset: randRange(0, Math.PI * 2),
    };
  }

  function createTitleParticle() {
    // Particles that drift upward around the center title area
    const cx = GAME.WIDTH / 2;
    const cy = GAME.HEIGHT / 2 - 60;
    return {
      x: cx + randRange(-180, 180),
      y: cy + randRange(-40, 80),
      vx: randRange(-15, 15),
      vy: randRange(-40, -10),
      size: randRange(1, 3),
      lifetime: randRange(2, 5),
      age: 0,
      color: randPick(['#00e5ff', '#ff4081', '#7c4dff', '#ffffff']),
    };
  }

  function createFirework(x, y) {
    const count = randInt(8, 15);
    const color = randPick(['#ffff00', '#ff4081', '#00e5ff', '#69f0ae', '#ffab40']);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + randRange(-0.2, 0.2);
      const speed = randRange(60, 180);
      fireworkParticles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: randRange(1.5, 3.5),
        lifetime: randRange(0.8, 1.5),
        age: 0,
        color: color,
      });
    }
  }

  // --- Update ---
  function update(dt, gameState) {
    titleTimer += dt;

    if (gameState === 'MENU') {
      updateMenuScreen(dt);
    } else if (gameState === 'GAME_OVER') {
      updateGameOverScreen(dt);
    }
  }

  function updateMenuScreen(dt) {
    // Update menu stars
    for (let i = 0; i < menuStars.length; i++) {
      const s = menuStars[i];
      s.y += s.speed * dt;
      if (s.y > GAME.HEIGHT + 10) {
        s.y = -10;
        s.x = randRange(0, GAME.WIDTH);
      }
    }

    // Update title particles
    for (let i = titleParticles.length - 1; i >= 0; i--) {
      const p = titleParticles[i];
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.age >= p.lifetime) {
        titleParticles.splice(i, 1);
      }
    }

    // Spawn new title particles
    while (titleParticles.length < TITLE_PARTICLE_COUNT) {
      titleParticles.push(createTitleParticle());
    }
  }

  function updateGameOverScreen(dt) {
    gameOverTimer += dt;

    // Update firework particles
    for (let i = fireworkParticles.length - 1; i >= 0; i--) {
      const p = fireworkParticles[i];
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 80 * dt; // gravity
      if (p.age >= p.lifetime) {
        fireworkParticles.splice(i, 1);
      }
    }

    // Spawn fireworks periodically for new high score
    if (isNewHighScore && gameOverTimer > 0.5) {
      // Random firework every ~0.4 seconds
      if (Math.random() < dt * 2.5) {
        createFirework(
          randRange(GAME.WIDTH * 0.2, GAME.WIDTH * 0.8),
          randRange(GAME.HEIGHT * 0.15, GAME.HEIGHT * 0.45)
        );
      }
    }
  }

  // --- Render ---
  function render(ctx, gameState) {
    if (gameState === 'MENU') {
      renderMenuScreen(ctx);
    } else if (gameState === 'PAUSED') {
      renderPauseOverlay(ctx);
    } else if (gameState === 'GAME_OVER') {
      renderGameOverScreen(ctx);
    }
  }

  function renderMenuScreen(ctx) {
    // Decorative drifting stars
    ctx.save();
    for (let i = 0; i < menuStars.length; i++) {
      const s = menuStars[i];
      const twinkle = 0.5 + 0.5 * Math.sin(titleTimer * s.twinkleSpeed + s.twinkleOffset);
      ctx.globalAlpha = s.alpha * twinkle;
      ctx.fillStyle = '#00e5ff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Title particles
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < titleParticles.length; i++) {
      const p = titleParticles[i];
      const progress = p.age / p.lifetime;
      const alpha = 1 - progress;
      const size = p.size * (1 - progress * 0.5);

      ctx.globalAlpha = alpha * 0.6;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Animated glow ring behind the title area
    ctx.save();
    const cx = GAME.WIDTH / 2;
    const cy = GAME.HEIGHT / 2 - 60;
    const pulseRadius = 120 + Math.sin(titleTimer * 1.5) * 20;
    const glowAlpha = 0.05 + 0.03 * Math.sin(titleTimer * 2);

    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulseRadius);
    gradient.addColorStop(0, fadeColor('#00e5ff', glowAlpha * 2));
    gradient.addColorStop(0.5, fadeColor('#7c4dff', glowAlpha));
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, pulseRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Decorative horizontal scan lines (subtle)
    ctx.save();
    ctx.globalAlpha = 0.03;
    ctx.fillStyle = '#ffffff';
    for (let y = 0; y < GAME.HEIGHT; y += 4) {
      ctx.fillRect(0, y, GAME.WIDTH, 1);
    }
    ctx.restore();
  }

  function renderPauseOverlay(ctx) {
    // Subtle scan line effect over the paused game
    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.fillStyle = '#ffffff';
    for (let y = 0; y < GAME.HEIGHT; y += 3) {
      ctx.fillRect(0, y, GAME.WIDTH, 1);
    }
    ctx.restore();

    // Vignette effect
    ctx.save();
    const vGrad = ctx.createRadialGradient(
      GAME.WIDTH / 2, GAME.HEIGHT / 2, GAME.HEIGHT * 0.3,
      GAME.WIDTH / 2, GAME.HEIGHT / 2, GAME.HEIGHT * 0.7
    );
    vGrad.addColorStop(0, 'rgba(0,0,0,0)');
    vGrad.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = vGrad;
    ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);
    ctx.restore();
  }

  function renderGameOverScreen(ctx) {
    // Red vignette for game over mood
    ctx.save();
    const vGrad = ctx.createRadialGradient(
      GAME.WIDTH / 2, GAME.HEIGHT / 2, GAME.HEIGHT * 0.2,
      GAME.WIDTH / 2, GAME.HEIGHT / 2, GAME.HEIGHT * 0.7
    );
    vGrad.addColorStop(0, 'rgba(0,0,0,0)');
    vGrad.addColorStop(1, 'rgba(80,0,0,0.3)');
    ctx.fillStyle = vGrad;
    ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);
    ctx.restore();

    // Firework particles for new high score
    if (fireworkParticles.length > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < fireworkParticles.length; i++) {
        const p = fireworkParticles[i];
        const progress = p.age / p.lifetime;
        const alpha = 1 - progress;
        const size = p.size * (1 - progress * 0.4);

        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();

        // Glow
        ctx.globalAlpha = alpha * 0.3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Scan lines
    ctx.save();
    ctx.globalAlpha = 0.03;
    ctx.fillStyle = '#ffffff';
    for (let y = 0; y < GAME.HEIGHT; y += 4) {
      ctx.fillRect(0, y, GAME.WIDTH, 1);
    }
    ctx.restore();
  }

  // --- Called by Game when entering game over ---
  function onGameOver(score, highScore) {
    gameOverTimer = 0;
    fireworkParticles = [];
    isNewHighScore = score >= highScore && score > 0;

    // Spawn initial fireworks burst for new high score
    if (isNewHighScore) {
      for (let i = 0; i < 3; i++) {
        createFirework(
          GAME.WIDTH / 2 + randRange(-100, 100),
          GAME.HEIGHT * 0.3 + randRange(-30, 30)
        );
      }
    }
  }

  // --- Called by Game when entering menu ---
  function onMenuEnter() {
    titleTimer = 0;
    titleParticles = [];
    menuStars = [];
    for (let i = 0; i < MENU_STAR_COUNT; i++) {
      menuStars.push(createMenuStar());
    }
  }

  // --- Public API ---
  return {
    init: init,
    update: update,
    render: render,
    onGameOver: onGameOver,
    onMenuEnter: onMenuEnter,
  };
})();
