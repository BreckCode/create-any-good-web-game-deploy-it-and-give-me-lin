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

  // Engine trail spawn timer
  let engineTrailTimer = 0;
  const ENGINE_TRAIL_INTERVAL = 0.03; // spawn engine particles every 30ms

  // --- DOM References ---
  let menuScreen = null;
  let hudElement = null;
  let pauseScreen = null;
  let gameoverScreen = null;
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

  function playSelectSound() {
    if (typeof AudioManager !== 'undefined' && AudioManager.play) {
      AudioManager.play('select');
    }
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
        Menu.onMenuEnter();
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
        const isNewHigh = score > highScore;
        if (isNewHigh) {
          highScore = score;
          saveHighScore(highScore);
        }
        // Populate game over screen
        if (finalScoreEl) finalScoreEl.textContent = score;
        if (finalHighscoreEl) finalHighscoreEl.textContent = highScore;
        if (newHighscoreMsg) {
          if (isNewHigh && score > 0) {
            newHighscoreMsg.classList.remove('hidden');
          } else {
            newHighscoreMsg.classList.add('hidden');
          }
        }
        // Trigger menu canvas effects (fireworks on new high score)
        Menu.onGameOver(score, highScore);
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
    engineTrailTimer = 0;

    // Clear all entity arrays
    playerBullets.length = 0;
    enemyBullets.length = 0;
    enemies.length = 0;
    particles.length = 0;
    powerups.length = 0;
    activePowerUps = {};

    // Clear HUD popups
    HUD.clearPopups();

    // Initialize subsystems
    player = Player.init();
    Starfield.init();
    Spawner.init();
    Renderer.init(ctx);
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

    // Update subsystems in order:
    // 1. Background
    Starfield.update(dt);

    // 2. Player input & movement
    Player.update(dt, Game);

    // 3. Spawn engine trail particles behind the player
    if (player && player.active) {
      engineTrailTimer += dt;
      while (engineTrailTimer >= ENGINE_TRAIL_INTERVAL) {
        engineTrailTimer -= ENGINE_TRAIL_INTERVAL;
        Particles.spawnEngineTrail(particles, player.x, player.y + player.height / 2);
      }
    }

    // 4. Spawner creates new enemies based on wave progression
    Spawner.update(dt, Game);

    // 5. Update all entities
    Enemies.update(dt, enemies, Game);
    Bullets.update(dt, playerBullets, enemyBullets);
    PowerUps.update(dt, powerups);
    Particles.update(dt, particles);

    // 6. Collision detection — triggers scoring, damage, particles, audio
    Collision.update(Game);

    // 7. HUD floating score pop-ups
    HUD.update(dt);

    // 8. Renderer effects (screen shake decay, flash decay)
    Renderer.update(dt);
  }

  // --- Game Render (one frame) ---
  function render() {
    // Clear canvas with background
    Renderer.clear();

    if (currentState === STATE.MENU) {
      // Draw starfield on menu for visual appeal
      Starfield.render(ctx);
      // Draw menu canvas effects (particles, glow, scan lines)
      Menu.render(ctx, currentState);
      return;
    }

    // Begin frame: save context, apply screen shake transform
    Renderer.beginFrame();

    // Render layers in order
    Starfield.render(ctx);

    // Power-ups (below enemies/player)
    PowerUps.render(ctx, powerups);

    // Enemies
    Enemies.render(ctx, enemies);

    // Bullets (both player and enemy)
    Bullets.render(ctx, playerBullets, enemyBullets);

    // Player ship
    Player.render(ctx);

    // Particles on top for glow effects
    Particles.render(ctx, particles);

    // Wave announcements (e.g. "WAVE 3" text)
    Spawner.render(ctx);

    // End frame: restore context, draw screen flash overlay
    Renderer.endFrame();

    // HUD drawn without shake offset
    HUD.render(ctx, Game);

    // Menu canvas effects for pause/game-over overlays
    if (currentState !== STATE.PLAYING) {
      Menu.render(ctx, currentState);
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
        playSelectSound();
      } else if (currentState === STATE.PAUSED) {
        setState(STATE.PLAYING);
        playSelectSound();
      }
    }

    // Handle confirm input on menu/game over (keyboard Enter/Space)
    if (Input.isJustPressed('confirm')) {
      if (currentState === STATE.MENU) {
        playSelectSound();
        setState(STATE.PLAYING);
      } else if (currentState === STATE.GAME_OVER) {
        playSelectSound();
        setState(STATE.PLAYING);
      }
    }

    // Update starfield and menu effects in non-playing states
    if (currentState === STATE.MENU || currentState === STATE.PAUSED || currentState === STATE.GAME_OVER) {
      Starfield.update(dt);
      Menu.update(dt, currentState);
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
          playSelectSound();
          setState(STATE.PLAYING);
        }
      });
    }

    if (resumeBtn) {
      resumeBtn.addEventListener('click', function () {
        if (currentState === STATE.PAUSED) {
          playSelectSound();
          setState(STATE.PLAYING);
        }
      });
    }

    if (quitBtn) {
      quitBtn.addEventListener('click', function () {
        if (currentState === STATE.PAUSED) {
          playSelectSound();
          setState(STATE.MENU);
        }
      });
    }

    if (restartBtn) {
      restartBtn.addEventListener('click', function () {
        if (currentState === STATE.GAME_OVER) {
          playSelectSound();
          setState(STATE.PLAYING);
        }
      });
    }

    if (menuBtn) {
      menuBtn.addEventListener('click', function () {
        if (currentState === STATE.GAME_OVER) {
          playSelectSound();
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

    // Scoring with combo multiplier and score pop-up at kill location
    addScore(points, x, y) {
      comboCount++;
      comboTimer = SCORING.COMBO_WINDOW;
      const multiplier = 1 + (comboCount - 1) * SCORING.COMBO_MULTIPLIER;
      const earned = Math.floor(points * multiplier);
      score += earned;

      // Score pop-up at kill location
      if (x !== undefined) {
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
        // Brief delay so death particles are visible before game over
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
      Renderer.shake(
        intensity || SCREEN_SHAKE.INTENSITY,
        duration || SCREEN_SHAKE.DURATION
      );
    },

    triggerScreenFlash(alpha) {
      Renderer.flash(alpha || 0.15);
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
      finalScoreEl = document.getElementById('final-score-value');
      finalHighscoreEl = document.getElementById('final-highscore-value');
      newHighscoreMsg = document.getElementById('new-highscore-msg');

      // Set canvas size
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      // Load persisted high score
      highScore = loadHighScore();

      // Initialize input system
      Input.init(canvas);

      // Initialize audio
      if (typeof AudioManager !== 'undefined' && AudioManager.init) {
        AudioManager.init();
      }

      // Initialize starfield for menu background
      Starfield.init();

      // Initialize menu canvas effects
      Menu.init();

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
