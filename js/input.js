// ============================================================
// Cosmic Defender - Input Handling System
// ============================================================
// Handles keyboard (WASD/arrows/space), mouse, and touch input.
// Exposes a global Input object with current state and methods.

const Input = (function () {
  // --- Internal State ---
  const keys = {};         // currently held keys
  const keysJustPressed = {}; // keys pressed this frame (cleared each frame)

  const mouse = {
    x: GAME.WIDTH / 2,
    y: GAME.HEIGHT / 2,
    down: false,
    justPressed: false,
  };

  // Touch state for mobile virtual joystick
  const touch = {
    active: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    moveId: null,   // touch identifier for movement
    shootId: null,   // touch identifier for shooting
  };

  let canvas = null;
  let canvasRect = null;

  // --- Key Mapping ---
  // Maps multiple key names to unified direction/action names
  const KEY_MAP = {
    'ArrowUp': 'up',     'w': 'up',     'W': 'up',
    'ArrowDown': 'down',  's': 'down',   'S': 'down',
    'ArrowLeft': 'left',  'a': 'left',   'A': 'left',
    'ArrowRight': 'right', 'd': 'right',  'D': 'right',
    ' ': 'shoot',
    'p': 'pause',  'P': 'pause',
    'Escape': 'pause',
    'Enter': 'confirm',
  };

  // --- Helper: Convert page coords to canvas coords ---
  function pageToCanvas(pageX, pageY) {
    if (!canvasRect) return { x: pageX, y: pageY };
    const scaleX = GAME.WIDTH / canvasRect.width;
    const scaleY = GAME.HEIGHT / canvasRect.height;
    return {
      x: (pageX - canvasRect.left) * scaleX,
      y: (pageY - canvasRect.top) * scaleY,
    };
  }

  // --- Keyboard Handlers ---
  function onKeyDown(e) {
    const mapped = KEY_MAP[e.key];
    if (mapped) {
      // Prevent default for game keys (arrows, space)
      e.preventDefault();
      if (!keys[mapped]) {
        keysJustPressed[mapped] = true;
      }
      keys[mapped] = true;
    }
  }

  function onKeyUp(e) {
    const mapped = KEY_MAP[e.key];
    if (mapped) {
      e.preventDefault();
      keys[mapped] = false;
    }
  }

  // --- Mouse Handlers ---
  function onMouseMove(e) {
    const pos = pageToCanvas(e.clientX, e.clientY);
    mouse.x = pos.x;
    mouse.y = pos.y;
  }

  function onMouseDown(e) {
    if (e.button === 0) {
      mouse.down = true;
      mouse.justPressed = true;
      const pos = pageToCanvas(e.clientX, e.clientY);
      mouse.x = pos.x;
      mouse.y = pos.y;
    }
  }

  function onMouseUp(e) {
    if (e.button === 0) {
      mouse.down = false;
    }
  }

  // --- Touch Handlers ---
  // Left half of screen = move (virtual joystick), right half = shoot
  function onTouchStart(e) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const pos = pageToCanvas(t.clientX, t.clientY);

      if (pos.x < GAME.WIDTH / 2) {
        // Left side: movement joystick
        touch.active = true;
        touch.moveId = t.identifier;
        touch.startX = pos.x;
        touch.startY = pos.y;
        touch.currentX = pos.x;
        touch.currentY = pos.y;
      } else {
        // Right side: shoot
        touch.shootId = t.identifier;
        keys['shoot'] = true;
        keysJustPressed['shoot'] = true;
      }
    }
  }

  function onTouchMove(e) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === touch.moveId) {
        const pos = pageToCanvas(t.clientX, t.clientY);
        touch.currentX = pos.x;
        touch.currentY = pos.y;
      }
    }
  }

  function onTouchEnd(e) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === touch.moveId) {
        touch.active = false;
        touch.moveId = null;
        // Clear directional keys from touch
        keys['up'] = false;
        keys['down'] = false;
        keys['left'] = false;
        keys['right'] = false;
      }
      if (t.identifier === touch.shootId) {
        touch.shootId = null;
        keys['shoot'] = false;
      }
    }
  }

  // --- Update canvas rect on resize ---
  function updateCanvasRect() {
    if (canvas) {
      canvasRect = canvas.getBoundingClientRect();
    }
  }

  // --- Public API ---
  return {
    // Initialize input listeners. Call once after DOM is ready.
    init(canvasElement) {
      canvas = canvasElement;
      updateCanvasRect();

      // Keyboard
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);

      // Mouse
      canvas.addEventListener('mousemove', onMouseMove);
      canvas.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mouseup', onMouseUp);

      // Touch
      canvas.addEventListener('touchstart', onTouchStart, { passive: false });
      canvas.addEventListener('touchmove', onTouchMove, { passive: false });
      canvas.addEventListener('touchend', onTouchEnd, { passive: false });
      canvas.addEventListener('touchcancel', onTouchEnd, { passive: false });

      // Keep canvas rect up-to-date
      window.addEventListener('resize', updateCanvasRect);
      window.addEventListener('scroll', updateCanvasRect);

      // Clear keys if window loses focus
      window.addEventListener('blur', function () {
        for (const k in keys) keys[k] = false;
        mouse.down = false;
        touch.active = false;
      });
    },

    // Call at the end of each game loop frame to clear one-shot states
    endFrame() {
      for (const k in keysJustPressed) {
        keysJustPressed[k] = false;
      }
      mouse.justPressed = false;
    },

    // --- Query Methods ---

    // Is a mapped action currently held?
    isDown(action) {
      return !!keys[action];
    },

    // Was a mapped action just pressed this frame?
    isJustPressed(action) {
      return !!keysJustPressed[action];
    },

    // Get directional input as a normalized vector (-1 to 1 per axis).
    // Combines keyboard and touch joystick.
    getDirection() {
      let dx = 0;
      let dy = 0;

      // Keyboard input
      if (keys['left']) dx -= 1;
      if (keys['right']) dx += 1;
      if (keys['up']) dy -= 1;
      if (keys['down']) dy += 1;

      // Touch joystick override
      if (touch.active && touch.moveId !== null) {
        const deadzone = 15; // pixels
        const maxDist = 80;  // max joystick radius
        const tdx = touch.currentX - touch.startX;
        const tdy = touch.currentY - touch.startY;
        const dist = Math.sqrt(tdx * tdx + tdy * tdy);

        if (dist > deadzone) {
          dx = clamp(tdx / maxDist, -1, 1);
          dy = clamp(tdy / maxDist, -1, 1);
        }
      }

      // Normalize diagonal movement so it's not faster
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 1) {
        dx /= len;
        dy /= len;
      }

      return { x: dx, y: dy };
    },

    // Is the player requesting to shoot?
    isShooting() {
      return !!keys['shoot'] || mouse.down;
    },

    // Mouse/touch position in canvas coordinates
    getMousePos() {
      return { x: mouse.x, y: mouse.y };
    },

    // Was mouse/touch just pressed this frame?
    isMouseJustPressed() {
      return mouse.justPressed;
    },

    // Is touch input currently active?
    isTouchActive() {
      return touch.active || touch.shootId !== null;
    },

    // Refresh canvas bounding rect (call on resize)
    updateRect() {
      updateCanvasRect();
    },
  };
})();
