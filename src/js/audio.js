// ============================================================
// Cosmic Defender - Procedural Audio (Web Audio API)
// ============================================================
// All sound effects are generated procedurally using oscillators
// and noise buffers. No audio files needed.

const AudioManager = (function () {
  let audioCtx = null;
  let masterGain = null;
  let muted = false;
  let initialized = false;
  let volume = 0.3;

  // --- Initialization ---
  function init() {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = volume;
      masterGain.connect(audioCtx.destination);
      initialized = true;
    } catch (e) {
      // Web Audio API not supported
      initialized = false;
    }
  }

  // Resume audio context on user interaction (autoplay policy)
  function ensureResumed() {
    if (!initialized) return false;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return true;
  }

  // --- Sound Definitions ---

  // Laser shot: short downward frequency sweep
  function playShoot() {
    if (!ensureResumed()) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Explosion: noise burst with low-pass filter and decay
  function playExplosion() {
    if (!ensureResumed()) return;
    const now = audioCtx.currentTime;
    const duration = 0.4;

    // Create noise buffer
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + duration);

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    noise.start(now);
    noise.stop(now + duration);
  }

  // Hit spark: short noise burst (lighter than explosion)
  function playHit() {
    if (!ensureResumed()) return;
    const now = audioCtx.currentTime;
    const duration = 0.08;

    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2000, now);

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    noise.start(now);
    noise.stop(now + duration);
  }

  // Power-up collect: ascending arpeggio
  function playPowerup() {
    if (!ensureResumed()) return;
    const now = audioCtx.currentTime;
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6

    notes.forEach(function (freq, i) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const start = now + i * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.12, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(start);
      osc.stop(start + 0.15);
    });
  }

  // Player hit/death: low rumble with descending tone
  function playPlayerHit() {
    if (!ensureResumed()) return;
    const now = audioCtx.currentTime;
    const duration = 0.35;

    // Low descending tone
    const osc = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + duration);
    oscGain.gain.setValueAtTime(0.15, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(oscGain);
    oscGain.connect(masterGain);
    osc.start(now);
    osc.stop(now + duration);

    // Noise layer
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.12, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    noise.connect(noiseGain);
    noiseGain.connect(masterGain);
    noise.start(now);
    noise.stop(now + duration);
  }

  // Menu select: short blip
  function playSelect() {
    if (!ensureResumed()) return;
    const now = audioCtx.currentTime;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.setValueAtTime(880, now + 0.04);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  // --- Sound Registry ---
  const sounds = {
    shoot: playShoot,
    explosion: playExplosion,
    hit: playHit,
    powerup: playPowerup,
    playerHit: playPlayerHit,
    select: playSelect,
  };

  // --- Public API ---
  return {
    init: init,

    play: function (name) {
      if (!initialized || muted) return;
      var fn = sounds[name];
      if (fn) fn();
    },

    toggleMute: function () {
      muted = !muted;
      if (initialized && masterGain) {
        masterGain.gain.value = muted ? 0 : volume;
      }
      return muted;
    },

    isMuted: function () {
      return muted;
    },

    setVolume: function (v) {
      volume = clamp(v, 0, 1);
      if (initialized && masterGain && !muted) {
        masterGain.gain.value = volume;
      }
    },
  };
})();
