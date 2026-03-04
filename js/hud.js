// ============================================================
// Cosmic Defender - HUD & Score Display
// ============================================================
// Draws score, high score, lives, active power-ups with timers,
// wave number, combo multiplier, and score pop-ups on canvas.

const HUD = (function () {
  // --- Score Pop-ups ---
  // Floating text that appears when an enemy is killed
  let scorePopups = [];

  // --- Constants ---
  const POPUP_LIFETIME = 1.0; // seconds
  const POPUP_RISE_SPEED = 60; // pixels per second
  const HUD_PADDING = 12;
  const LIFE_ICON_SIZE = 10;
  const LIFE_ICON_GAP = 6;
  const POWERUP_BAR_WIDTH = 60;
  const POWERUP_BAR_HEIGHT = 6;

  // Power-up display config
  const POWERUP_DISPLAY = {
    shield: { label: 'SHIELD', color: COLORS.POWERUP_SHIELD },
    spread: { label: 'SPREAD', color: COLORS.POWERUP_SPREAD },
    rapid:  { label: 'RAPID',  color: COLORS.POWERUP_RAPID },
  };

  // --- Score Pop-up Management ---

  function addScorePopup(x, y, points, comboMultiplier) {
    scorePopups.push({
      x: x,
      y: y,
      points: points,
      combo: comboMultiplier,
      age: 0,
      lifetime: POPUP_LIFETIME,
    });
  }

  function clearPopups() {
    scorePopups.length = 0;
  }

  // --- Update ---

  function update(dt) {
    // Update score pop-ups
    for (let i = scorePopups.length - 1; i >= 0; i--) {
      const p = scorePopups[i];
      p.age += dt;
      p.y -= POPUP_RISE_SPEED * dt;

      if (p.age >= p.lifetime) {
        scorePopups.splice(i, 1);
      }
    }
  }

  // --- Render ---

  function render(ctx, game) {
    drawScore(ctx, game);
    drawHighScore(ctx, game);
    drawWave(ctx, game);
    drawLives(ctx, game);
    drawActivePowerUps(ctx, game);
    drawCombo(ctx, game);
    drawScorePopups(ctx);
  }

  // --- Score (top-left) ---

  function drawScore(ctx, game) {
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Label
    ctx.font = '10px "Courier New", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('SCORE', HUD_PADDING, HUD_PADDING);

    // Value
    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.fillStyle = COLORS.HUD_TEXT;
    ctx.shadowColor = COLORS.HUD_ACCENT;
    ctx.shadowBlur = 6;
    ctx.fillText(String(game.score), HUD_PADDING, HUD_PADDING + 14);
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  // --- High Score (top-right) ---

  function drawHighScore(ctx, game) {
    ctx.save();
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';

    // Label
    ctx.font = '10px "Courier New", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('HI-SCORE', GAME.WIDTH - HUD_PADDING, HUD_PADDING);

    // Value
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(String(game.highScore), GAME.WIDTH - HUD_PADDING, HUD_PADDING + 14);

    ctx.restore();
  }

  // --- Wave (top-center) ---

  function drawWave(ctx, game) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Label
    ctx.font = '10px "Courier New", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('WAVE', GAME.WIDTH / 2, HUD_PADDING);

    // Value
    ctx.font = 'bold 18px "Courier New", monospace';
    ctx.fillStyle = COLORS.HUD_ACCENT;
    ctx.fillText(String(game.wave), GAME.WIDTH / 2, HUD_PADDING + 14);

    ctx.restore();
  }

  // --- Lives (bottom-left) ---

  function drawLives(ctx, game) {
    ctx.save();

    const baseX = HUD_PADDING;
    const baseY = GAME.HEIGHT - HUD_PADDING - LIFE_ICON_SIZE;

    // Label
    ctx.font = '10px "Courier New", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('LIVES', baseX, baseY - 4);

    // Draw small ship icons for each life
    for (let i = 0; i < game.lives; i++) {
      const lx = baseX + i * (LIFE_ICON_SIZE * 2 + LIFE_ICON_GAP) + LIFE_ICON_SIZE;
      const ly = baseY + LIFE_ICON_SIZE / 2;

      drawMiniShip(ctx, lx, ly, LIFE_ICON_SIZE);
    }

    ctx.restore();
  }

  // Draw a tiny ship icon for lives display
  function drawMiniShip(ctx, cx, cy, size) {
    ctx.save();
    ctx.translate(cx, cy);

    ctx.beginPath();
    ctx.moveTo(0, -size);          // nose
    ctx.lineTo(-size * 0.7, size * 0.6);  // left wing
    ctx.lineTo(0, size * 0.3);     // tail center
    ctx.lineTo(size * 0.7, size * 0.6);   // right wing
    ctx.closePath();

    ctx.fillStyle = COLORS.PLAYER_BODY;
    ctx.shadowColor = COLORS.PLAYER_BODY;
    ctx.shadowBlur = 4;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  // --- Active Power-Ups (bottom-right) ---

  function drawActivePowerUps(ctx, game) {
    const activePowerUps = game.activePowerUps;
    const types = Object.keys(activePowerUps);
    if (types.length === 0) return;

    ctx.save();

    let offsetY = 0;

    for (let i = 0; i < types.length; i++) {
      const type = types[i];
      const display = POWERUP_DISPLAY[type];
      if (!display) continue;

      const remaining = activePowerUps[type];
      const fraction = remaining / POWERUP_DEFAULTS.DURATION;

      const x = GAME.WIDTH - HUD_PADDING - POWERUP_BAR_WIDTH;
      const y = GAME.HEIGHT - HUD_PADDING - 20 - offsetY;

      // Label
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.font = 'bold 10px "Courier New", monospace';
      ctx.fillStyle = display.color;
      ctx.fillText(display.label, x - 6, y + POWERUP_BAR_HEIGHT);

      // Timer bar background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(x, y, POWERUP_BAR_WIDTH, POWERUP_BAR_HEIGHT);

      // Timer bar fill
      ctx.fillStyle = display.color;
      ctx.shadowColor = display.color;
      ctx.shadowBlur = 4;
      ctx.fillRect(x, y, POWERUP_BAR_WIDTH * clamp(fraction, 0, 1), POWERUP_BAR_HEIGHT);
      ctx.shadowBlur = 0;

      // Timer text
      ctx.textAlign = 'left';
      ctx.font = '9px "Courier New", monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText(remaining.toFixed(1) + 's', x + POWERUP_BAR_WIDTH + 4, y + POWERUP_BAR_HEIGHT);

      offsetY += 20;
    }

    ctx.restore();
  }

  // --- Combo Multiplier (below score) ---

  function drawCombo(ctx, game) {
    if (game.comboCount <= 1) return;

    const multiplier = 1 + (game.comboCount - 1) * SCORING.COMBO_MULTIPLIER;

    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Pulse effect based on combo timer
    const pulse = 0.7 + 0.3 * Math.sin(Date.now() * 0.01);

    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.fillStyle = fadeColor('#ffab40', pulse);
    ctx.shadowColor = '#ffab40';
    ctx.shadowBlur = 8;
    ctx.fillText('x' + multiplier.toFixed(1) + ' COMBO', HUD_PADDING, HUD_PADDING + 42);
    ctx.shadowBlur = 0;

    // Combo count
    ctx.font = '10px "Courier New", monospace';
    ctx.fillStyle = 'rgba(255, 171, 64, 0.6)';
    ctx.fillText(game.comboCount + ' hits', HUD_PADDING, HUD_PADDING + 58);

    ctx.restore();
  }

  // --- Score Pop-ups ---

  function drawScorePopups(ctx) {
    if (scorePopups.length === 0) return;

    ctx.save();

    for (let i = 0; i < scorePopups.length; i++) {
      const p = scorePopups[i];
      const progress = p.age / p.lifetime;
      const alpha = 1 - progress;

      // Scale up slightly at start, then normal
      const scale = progress < 0.2 ? 0.8 + progress * 1.0 : 1.0;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(scale, scale);
      ctx.globalAlpha = clamp(alpha, 0, 1);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Score value
      const text = '+' + p.points;
      ctx.font = 'bold 14px "Courier New", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = COLORS.HUD_ACCENT;
      ctx.shadowBlur = 6;
      ctx.fillText(text, 0, 0);

      // Combo text below if multiplier > 1
      if (p.combo > 1) {
        ctx.shadowBlur = 0;
        ctx.font = 'bold 10px "Courier New", monospace';
        ctx.fillStyle = '#ffab40';
        ctx.fillText('x' + p.combo.toFixed(1), 0, 14);
      }

      ctx.shadowBlur = 0;
      ctx.restore();
    }

    ctx.restore();
  }

  // --- Public API ---
  return {
    update: update,
    render: render,
    addScorePopup: addScorePopup,
    clearPopups: clearPopups,
  };
})();
