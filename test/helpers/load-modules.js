// Helper to load IIFE-based game modules into a shared vm context
// so they can be tested in Node.js without a browser.

const vm = require('vm');
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', '..', 'src', 'js');

// Load order matches index.html script tags
const MODULE_FILES = [
  'utils.js',
  'input.js',
  'audio.js',
  'starfield.js',
  'particles.js',
  'renderer.js',
  'player.js',
  'bullets.js',
  'enemies.js',
  'powerups.js',
  'collision.js',
  'spawner.js',
  'hud.js',
  'menu.js',
  'game.js',
];

function createGameContext(moduleNames) {
  // Create a context with basic browser-like globals
  const context = {
    console,
    Math,
    Array,
    Object,
    String,
    Number,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    undefined,
    NaN,
    Infinity,
    // Stub browser APIs
    localStorage: {
      _store: {},
      getItem(key) { return this._store[key] || null; },
      setItem(key, val) { this._store[key] = String(val); },
      removeItem(key) { delete this._store[key]; },
    },
    requestAnimationFrame: () => {},
    cancelAnimationFrame: () => {},
    document: {
      getElementById: () => ({
        style: {},
        classList: { add() {}, remove() {}, toggle() {} },
        addEventListener() {},
        getContext() { return createMockCtx(); },
        width: 800,
        height: 600,
      }),
      addEventListener() {},
      querySelector: () => null,
    },
    window: {},
    AudioContext: class {
      constructor() {
        this.currentTime = 0;
        this.destination = {};
      }
      createOscillator() { return { connect() {}, start() {}, stop() {}, frequency: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, type: 'sine' }; }
      createGain() { return { connect() {}, gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, value: 1 } }; }
      createBiquadFilter() { return { connect() {}, frequency: { setValueAtTime() {}, linearRampToValueAtTime() {} }, Q: { setValueAtTime() {} }, type: 'lowpass' }; }
      createBufferSource() { return { connect() {}, start() {}, buffer: null }; }
      createBuffer(ch, len, rate) { return { getChannelData() { return new Float32Array(len); } }; }
    },
    webkitAudioContext: undefined,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
  };

  vm.createContext(context);

  // Load requested modules (or all if none specified)
  const toLoad = moduleNames || MODULE_FILES;
  for (const file of toLoad) {
    const filePath = path.join(SRC_DIR, file);
    if (!fs.existsSync(filePath)) continue;
    let code = fs.readFileSync(filePath, 'utf-8');
    // Convert top-level const/let to var so they attach to the vm context
    code = code.replace(/^(const|let) /gm, 'var ');
    try {
      vm.runInContext(code, context, { filename: file });
    } catch (e) {
      // Some modules may fail due to missing deps — that's ok if we're loading a subset
      if (moduleNames) throw e;
    }
  }

  return context;
}

function createMockCtx() {
  return {
    save() {},
    restore() {},
    beginPath() {},
    closePath() {},
    moveTo() {},
    lineTo() {},
    arc() {},
    fill() {},
    stroke() {},
    fillRect() {},
    strokeRect() {},
    clearRect() {},
    fillText() {},
    measureText() { return { width: 0 }; },
    quadraticCurveTo() {},
    createLinearGradient() { return { addColorStop() {} }; },
    createRadialGradient() { return { addColorStop() {} }; },
    translate() {},
    rotate() {},
    scale() {},
    setTransform() {},
    drawImage() {},
    globalCompositeOperation: 'source-over',
    globalAlpha: 1,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: '',
    textBaseline: '',
    shadowColor: '',
    shadowBlur: 0,
    canvas: { width: 800, height: 600 },
  };
}

module.exports = { createGameContext, createMockCtx, MODULE_FILES, SRC_DIR };
