// ============================================================
// Cosmic Defender - Parallax Starfield Background
// ============================================================
// Multiple layers of stars with different speeds and sizes,
// twinkling effect, smooth scrolling downward.

const Starfield = (function () {
  const LAYER_COUNT = 3;
  const STARS_PER_LAYER = [60, 40, 20]; // far to near: more small stars, fewer large
  const LAYER_SPEEDS = [SPEEDS.STAR_LAYER_1, SPEEDS.STAR_LAYER_2, SPEEDS.STAR_LAYER_3];
  const LAYER_SIZE_RANGE = [
    { min: 0.5, max: 1.2 },  // far: tiny
    { min: 1.0, max: 2.0 },  // mid
    { min: 1.5, max: 3.0 },  // near: larger
  ];
  const LAYER_BRIGHTNESS = [0.4, 0.7, 1.0]; // far stars are dimmer

  // Twinkle config
  const TWINKLE_SPEED_MIN = 1.5;
  const TWINKLE_SPEED_MAX = 4.0;
  const TWINKLE_MIN_ALPHA = 0.3;

  let layers = []; // layers[i] = array of star objects

  function createStar(layerIndex, randomY) {
    return {
      x: Math.random() * GAME.WIDTH,
      y: randomY ? Math.random() * GAME.HEIGHT : -randRange(0, 20),
      size: randRange(LAYER_SIZE_RANGE[layerIndex].min, LAYER_SIZE_RANGE[layerIndex].max),
      // Twinkle phase and speed for variation
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: randRange(TWINKLE_SPEED_MIN, TWINKLE_SPEED_MAX),
      // Some stars get a slight color tint
      color: Math.random() < 0.15 ? COLORS.STAR_BLUE : COLORS.STAR_BRIGHT,
    };
  }

  function init() {
    layers = [];
    for (let i = 0; i < LAYER_COUNT; i++) {
      const stars = [];
      for (let j = 0; j < STARS_PER_LAYER[i]; j++) {
        stars.push(createStar(i, true));
      }
      layers.push(stars);
    }
  }

  function update(dt) {
    for (let i = 0; i < LAYER_COUNT; i++) {
      const speed = LAYER_SPEEDS[i];
      const stars = layers[i];

      for (let j = stars.length - 1; j >= 0; j--) {
        const star = stars[j];

        // Scroll downward
        star.y += speed * dt;

        // Advance twinkle phase
        star.twinklePhase += star.twinkleSpeed * dt;

        // Recycle star when it goes off-screen
        if (star.y > GAME.HEIGHT + star.size) {
          stars[j] = createStar(i, false);
          stars[j].y = -randRange(0, 10);
        }
      }
    }
  }

  function render(ctx) {
    if (!ctx) return;

    for (let i = 0; i < LAYER_COUNT; i++) {
      const brightness = LAYER_BRIGHTNESS[i];
      const stars = layers[i];

      for (let j = 0; j < stars.length; j++) {
        const star = stars[j];

        // Compute twinkle alpha using sine wave
        const twinkle = (Math.sin(star.twinklePhase) + 1) * 0.5; // 0..1
        const alpha = lerp(TWINKLE_MIN_ALPHA, 1, twinkle) * brightness;

        ctx.globalAlpha = alpha;

        if (star.size <= 1.2) {
          // Tiny stars: draw as a single pixel rect for performance
          ctx.fillStyle = star.color;
          ctx.fillRect(star.x, star.y, star.size, star.size);
        } else {
          // Larger stars: draw as circles with subtle glow
          ctx.fillStyle = star.color;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 0.5, 0, Math.PI * 2);
          ctx.fill();

          // Soft glow halo for near-layer stars
          if (i === 2 && alpha > 0.7) {
            ctx.globalAlpha = alpha * 0.15;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size * 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    // Reset alpha
    ctx.globalAlpha = 1;
  }

  return {
    init: init,
    update: update,
    render: render,
  };
})();
