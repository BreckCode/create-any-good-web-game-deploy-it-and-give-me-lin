// ============================================================
// Cosmic Defender - Main Game Loop & State Machine
// ============================================================
// Manages game states (MENU, PLAYING, PAUSED, GAME_OVER),
// the requestAnimationFrame loop, delta time, canvas resizing,
// and coordination of all game subsystems.

const Game = (function () {
  // --- Game States ---
  const STATE = {
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAME_OVER: 'GAME_OVER',
  };

  // --- Internal State ---
  let currentState = STATE.MENU;
  let canvas = null;
  let ctx = null;
  let animFrameId = null;
  let lastTime = 0;

  // Game session data
  let score = 0;
  let highScore = 0;
  let wave = 1;
  let lives = PLAYER_DEFAULTS.LIVES;
  let comboCount = 0;
  let comboTimer = 0;

  // Entity arrays
  let playerBullets = [];
  let enemyBullets = [];
  let enemies = [];
  let particles = [];
  let powerups = [];
  let player = null;

  // Active power-up timers { type: remainingSeconds }
  let activePowerUps = {};

  // Wave state
  let waveTimer = 0;
  let waveEnemiesRemaining = 0;
  let waveClearDelay = 0; // brief pause between waves

  // --- DOM References ---
  let menuScreen = null;
  let hudElement = null;
  let pauseScreen = null;
  let gameoverScreen = null;
  let scoreValueEl = null;
  let waveValueEl = null;
  let highscoreValueEl = null;
  let finalScoreEl = null;
  let finalHighscoreEl = null;
  let newHighscoreMsg = null;

  // --- Canvas Resize ---
  function resizeCanvas() {
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Maintain aspect ratio
    const aspectRatio = GAME.WIDTH / GAME.HEIGHT;
    let width = containerWidth;
    let height = containerWidth / aspectRatio;

    if (height > containerHeight) {
      height = containerHeight;
      width = containerHeight * aspectRatio;
    }

    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    // Internal resolution stays fixed
    canvas.width = GAME.WIDTH;
    canvas.height = GAME.HEIGHT;

    // Update input system's canvas rect
    Input.updateRect();
  }

  // --- UI Helpers ---
  function showScreen(screen) {
    screen.classList.remove('hidden');
  }

  function hideScreen(screen) {
    screen.classList.add('hidden');
  }

  function updateHUD() {
    if (scoreValueEl) scoreValueEl.textContent = score;
    if (waveValueEl) waveValueEl.textContent = wave;
    if (highscoreValueEl) highscoreValueEl.textContent = highScore;
  }

  // --- State Transitions ---
  function setState(newState) {
    const prevState = currentState;
    currentState = newState;

    // Hide all overlays first
    hideScreen(menuScreen);
    hideScreen(pauseScreen);
    hideScreen(gameoverScreen);
    hideScreen(hudElement);

    switch (newState) {
      case STATE.MENU:
        showScreen(menuScreen);
        break;

      case STATE.PLAYING:
        showScreen(hudElement);
        if (prevState === STATE.MENU || prevState === STATE.GAME_OVER) {
          startNewGame();
        }
        // Resuming from pause just continues
        break;

      case STATE.PAUSED:
        showScreen(hudElement);
        showScreen(pauseScreen);
        break;

      case STATE.GAME_OVER:
        // Update high score
        if (score > highScore) {
          highScore = score;
          saveHighScore(highScore);
        }
        // Populate game over screen
        if (finalScoreEl) finalScoreEl.textContent = score;
        if (finalHighscoreEl) finalHighscoreEl.textContent = highScore;
        if (newHighscoreMsg) {
          if (score >= highScore && score > 0) {
            newHighscoreMsg.classList.remove('hidden');
          } else {
            newHighscoreMsg.classList.add('hidden');
          }
        }
        showScreen(gameoverScreen);
        break;
    }
  }

  // --- New Game Setup ---
  function startNewGame() {
    score = 0;
    wave = 1;
    lives = PLAYER_DEFAULTS.LIVES;
    comboCount = 0;
    comboTimer = 0;
    waveTimer = 0;
    waveEnemiesRemaining = 0;
    waveClearDelay = 0;

    // Clear all entity arrays
    playerBullets.length = 0;
    enemyBullets.length = 0;
    enemies.length = 0;
    particles.length = 0;
    powerups.length = 0;
    activePowerUps = {};

    // Clear HUD popups
    if (typeof HUD !== 'undefined' && HUD.clearPopups) {
      HUD.clearPopups();
    }

    // Initialize subsystems that exist
    if (typeof Player !== 'undefined' && Player.init) {
      player = Player.init();
    }
    if (typeof Starfield !== 'undefined' && Starfield.init) {
      Starfield.init();
    }
    if (typeof Spawner !== 'undefined' && Spawner.init) {
      Spawner.init();
    }
    if (typeof Renderer !== 'undefined' && Renderer.init) {
      Renderer.init(ctx);
    }

    updateHUD();
  }

  // --- Game Update (one frame) ---
  function update(dt) {
    if (currentState !== STATE.PLAYING) return;

    // Update combo timer
    if (comboTimer > 0) {
      comboTimer -= dt;
      if (comboTimer <= 0) {
        comboCount = 0;
        comboTimer = 0;
      }
    }

    // Update active power-up timers
    for (const type in activePowerUps) {
      activePowerUps[type] -= dt;
      if (activePowerUps[type] <= 0) {
        delete activePowerUps[type];
      }
    }

    // Update subsystems (each checks for its own existence)
    if (typeof Starfield !== 'undefined' && Starfield.update) {
      Starfield.update(dt);
    }
    if (typeof Player !== 'undefined' && Player.update) {
      Player.update(dt, Game);
    }
    if (typeof Bullets !== 'undefined' && Bullets.update) {
      Bullets.update(dt, playerBullets, enemyBullets);
    }
    if (typeof Enemies !== 'undefined' && Enemies.update) {
      Enemies.update(dt, enemies, Game);
    }
    if (typeof Spawner !== 'undefined' && Spawner.update) {
      Spawner.update(dt, Game);
    }
    if (typeof PowerUps !== 'undefined' && PowerUps.update) {
      PowerUps.update(dt, powerups);
    }
    if (typeof Particles !== 'undefined' && Particles.update) {
      Particles.update(dt, particles);
    }
    if (typeof Collision !== 'undefined' && Collision.update) {
      Collision.update(Game);
    }
    if (typeof HUD !== 'undefined' && HUD.update) {
      HUD.update(dt);
    }
    if (typeof Renderer !== 'undefined' && Renderer.update) {
      Renderer.update(dt);
    }

    updateHUD();
  }

  // --- Game Render (one frame) ---
  function render() {
    ctx.clearRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

    // Black background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

    if (currentState === STATE.MENU) {
      // Draw starfield on menu for visual appeal
      if (typeof Starfield !== 'undefined' && Starfield.render) {
        Starfield.render(ctx);
      }
      return;
    }

    // Apply screen shake offset
    let shakeX = 0, shakeY = 0;
    if (typeof Renderer !== 'undefined' && Renderer.getShakeOffset) {
      const shake = Renderer.getShakeOffset();
      shakeX = shake.x;
      shakeY = shake.y;
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // Render layers in order
    if (typeof Starfield !== 'undefined' && Starfield.render) {
      Starfield.render(ctx);
    }

    // Power-ups
    if (typeof PowerUps !== 'undefined' && PowerUps.render) {
      PowerUps.render(ctx, powerups);
    }

    // Enemies
    if (typeof Enemies !== 'undefined' && Enemies.render) {
      Enemies.render(ctx, enemies);
    }

    // Bullets
    if (typeof Bullets !== 'undefined' && Bullets.render) {
      Bullets.render(ctx, playerBullets, enemyBullets);
    }

    // Player
    if (typeof Player !== 'undefined' && Player.render) {
      Player.render(ctx);
    }

    // Particles (on top for glow effects)
    if (typeof Particles !== 'undefined' && Particles.render) {
      Particles.render(ctx, particles);
    }

    // Wave announcements
    if (typeof Spawner !== 'undefined' && Spawner.render) {
      Spawner.render(ctx);
    }

    ctx.restore();

    // HUD drawn without shake
    if (typeof HUD !== 'undefined' && HUD.render) {
      HUD.render(ctx, Game);
    }
  }

  // --- Main Loop ---
  function gameLoop(timestamp) {
    animFrameId = requestAnimationFrame(gameLoop);

    // Calculate delta time in seconds
    if (lastTime === 0) lastTime = timestamp;
    let dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    // Cap delta time to prevent spiral of death
    if (dt > GAME.MAX_DT) dt = GAME.MAX_DT;

    // Handle pause toggle input
    if (Input.isJustPressed('pause')) {
      if (currentState === STATE.PLAYING) {
        setState(STATE.PAUSED);
      } else if (currentState === STATE.PAUSED) {
        setState(STATE.PLAYING);
      }
    }

    // Handle confirm input on menu/game over
    if (Input.isJustPressed('confirm')) {
      if (currentState === STATE.MENU) {
        setState(STATE.PLAYING);
      } else if (currentState === STATE.GAME_OVER) {
        setState(STATE.PLAYING);
      }
    }

    // Update starfield even in menu/paused for visual effect
    if (currentState === STATE.MENU || currentState === STATE.PAUSED) {
      if (typeof Starfield !== 'undefined' && Starfield.update) {
        Starfield.update(dt);
      }
    }

    // Update game logic
    update(dt);

    // Render everything
    render();

    // Clear one-shot input states
    Input.endFrame();
  }

  // --- Button Event Setup ---
  function setupButtons() {
    const startBtn = document.getElementById('start-btn');
    const resumeBtn = document.getElementById('resume-btn');
    const quitBtn = document.getElementById('quit-btn');
    const restartBtn = document.getElementById('restart-btn');
    const menuBtn = document.getElementById('menu-btn');
    const muteBtn = document.getElementById('mute-btn');

    if (startBtn) {
      startBtn.addEventListener('click', function () {
        if (currentState === STATE.MENU) {
          setState(STATE.PLAYING);
        }
      });
    }

    if (resumeBtn) {
      resumeBtn.addEventListener('click', function () {
        if (currentState === STATE.PAUSED) {
          setState(STATE.PLAYING);
        }
      });
    }

    if (quitBtn) {
      quitBtn.addEventListener('click', function () {
        if (currentState === STATE.PAUSED) {
          setState(STATE.MENU);
        }
      });
    }

    if (restartBtn) {
      restartBtn.addEventListener('click', function () {
        if (currentState === STATE.GAME_OVER) {
          setState(STATE.PLAYING);
        }
      });
    }

    if (menuBtn) {
      menuBtn.addEventListener('click', function () {
        if (currentState === STATE.GAME_OVER) {
          setState(STATE.MENU);
        }
      });
    }

    if (muteBtn) {
      muteBtn.addEventListener('click', function () {
        if (typeof AudioManager !== 'undefined' && AudioManager.toggleMute) {
          const muted = AudioManager.toggleMute();
          muteBtn.innerHTML = muted ? '&#x1f507;' : '&#x1f50a;';
        }
      });
    }
  }

  // --- Public API ---
  return {
    STATE: STATE,

    // Read-only accessors for game state
    get state() { return currentState; },
    get score() { return score; },
    get highScore() { return highScore; },
    get wave() { return wave; },
    get lives() { return lives; },
    get comboCount() { return comboCount; },
    get comboTimer() { return comboTimer; },
    get activePowerUps() { return activePowerUps; },
    get player() { return player; },
    get canvas() { return canvas; },
    get ctx() { return ctx; },

    // Entity arrays
    get playerBullets() { return playerBullets; },
    get enemyBullets() { return enemyBullets; },
    get enemies() { return enemies; },
    get particles() { return particles; },
    get powerups() { return powerups; },

    // Setters for subsystems to modify game state
    addScore(points, x, y) {
      comboCount++;
      comboTimer = SCORING.COMBO_WINDOW;
      const multiplier = 1 + (comboCount - 1) * SCORING.COMBO_MULTIPLIER;
      const earned = Math.floor(points * multiplier);
      score += earned;

      // Score pop-up at kill location
      if (typeof HUD !== 'undefined' && HUD.addScorePopup && x !== undefined) {
        HUD.addScorePopup(x, y, earned, multiplier);
      }
    },

    setScore(val) { score = val; },
    setWave(val) { wave = val; },
    setLives(val) {
      lives = val;
      if (lives <= 0) {
        lives = 0;
        setState(STATE.GAME_OVER);
      }
    },

    loseLife() {
      lives--;
      if (lives <= 0) {
        lives = 0;
        setState(STATE.GAME_OVER);
      }
    },

    addLife() {
      lives++;
    },

    activatePowerUp(type, duration) {
      activePowerUps[type] = duration || POWERUP_DEFAULTS.DURATION;
    },

    hasPowerUp(type) {
      return !!activePowerUps[type];
    },

    triggerScreenShake(intensity, duration) {
      if (typeof Renderer !== 'undefined' && Renderer.shake) {
        Renderer.shake(
          intensity || SCREEN_SHAKE.INTENSITY,
          duration || SCREEN_SHAKE.DURATION
        );
      }
    },

    // Initialize the game. Call once when the page loads.
    init() {
      canvas = document.getElementById('game-canvas');
      ctx = canvas.getContext('2d');

      // Cache DOM references
      menuScreen = document.getElementById('menu-screen');
      hudElement = document.getElementById('hud');
      pauseScreen = document.getElementById('pause-screen');
      gameoverScreen = document.getElementById('gameover-screen');
      scoreValueEl = document.getElementById('score-value');
      waveValueEl = document.getElementById('wave-value');
      highscoreValueEl = document.getElementById('highscore-value');
      finalScoreEl = document.getElementById('final-score-value');
      finalHighscoreEl = document.getElementById('final-highscore-value');
      newHighscoreMsg = document.getElementById('new-highscore-msg');

      // Set canvas size
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      // Load persisted high score
      highScore = loadHighScore();
      if (highscoreValueEl) highscoreValueEl.textContent = highScore;

      // Initialize input system
      Input.init(canvas);

      // Initialize audio if available
      if (typeof AudioManager !== 'undefined' && AudioManager.init) {
        AudioManager.init();
      }

      // Initialize starfield for menu background
      if (typeof Starfield !== 'undefined' && Starfield.init) {
        Starfield.init();
      }

      // Set up button click handlers
      setupButtons();

      // Start in menu state
      setState(STATE.MENU);

      // Start the game loop
      lastTime = 0;
      animFrameId = requestAnimationFrame(gameLoop);
    },
  };
})();

// --- Bootstrap ---
// Start the game when the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () {
    Game.init();
  });
} else {
  Game.init();
}
