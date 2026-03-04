// ============================================================
// Cosmic Defender - Renderer & Camera System
// ============================================================
// Manages canvas context, screen shake, coordinate transforms,
// clearing, blend modes for particles, and visual effects.

const Renderer = (function () {
  let ctx = null;

  // Screen shake state
  let shakeIntensity = 0;
  let shakeDuration = 0;
  let shakeTimer = 0;
  let shakeOffsetX = 0;
  let shakeOffsetY = 0;

  // Screen flash state (white flash on big explosions)
  let flashAlpha = 0;
  let flashDecay = 4; // how fast flash fades per second

  function init(context) {
    ctx = context;
    shakeIntensity = 0;
    shakeDuration = 0;
    shakeTimer = 0;
    shakeOffsetX = 0;
    shakeOffsetY = 0;
    flashAlpha = 0;
  }

  function update(dt) {
    // Update screen shake
    if (shakeTimer > 0) {
      shakeTimer -= dt;
      // Decay intensity over time
      const progress = clamp(shakeTimer / shakeDuration, 0, 1);
      const currentIntensity = shakeIntensity * progress * SCREEN_SHAKE.DECAY;
      shakeOffsetX = randRange(-currentIntensity, currentIntensity);
      shakeOffsetY = randRange(-currentIntensity, currentIntensity);

      if (shakeTimer <= 0) {
        shakeTimer = 0;
        shakeOffsetX = 0;
        shakeOffsetY = 0;
      }
    }

    // Update screen flash
    if (flashAlpha > 0) {
      flashAlpha -= flashDecay * dt;
      if (flashAlpha < 0) flashAlpha = 0;
    }
  }

  // Trigger screen shake
  function shake(intensity, duration) {
    // Take the stronger shake if one is already active
    if (intensity > shakeIntensity * (shakeTimer / shakeDuration || 0)) {
      shakeIntensity = intensity;
      shakeDuration = duration;
      shakeTimer = duration;
    }
  }

  // Trigger a white screen flash
  function flash(alpha) {
    flashAlpha = clamp(alpha || 0.3, 0, 1);
  }

  // Get current shake offset for the camera transform
  function getShakeOffset() {
    return { x: shakeOffsetX, y: shakeOffsetY };
  }

  // Clear the canvas with the background color
  function clear() {
    if (!ctx) return;
    ctx.clearRect(0, 0, GAME.WIDTH, GAME.HEIGHT);
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);
  }

  // Save context state and apply camera shake transform
  function beginFrame() {
    if (!ctx) return;
    ctx.save();
    ctx.translate(shakeOffsetX, shakeOffsetY);
  }

  // Restore context state after game world rendering
  function endFrame() {
    if (!ctx) return;
    ctx.restore();

    // Draw screen flash overlay (not affected by shake)
    if (flashAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = flashAlpha;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);
      ctx.restore();
    }
  }

  // Set additive blending for glow/particle effects
  function setAdditiveBlend() {
    if (!ctx) return;
    ctx.globalCompositeOperation = 'lighter';
  }

  // Reset to default blending
  function setNormalBlend() {
    if (!ctx) return;
    ctx.globalCompositeOperation = 'source-over';
  }

  // Draw a glow circle (used for bullets, power-ups, etc.)
  function drawGlow(x, y, radius, color, alpha) {
    if (!ctx) return;
    ctx.save();
    ctx.globalAlpha = alpha || 0.5;
    ctx.globalCompositeOperation = 'lighter';

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    const rgb = hexToRgb(color);
    gradient.addColorStop(0, rgba(rgb.r, rgb.g, rgb.b, 1));
    gradient.addColorStop(0.4, rgba(rgb.r, rgb.g, rgb.b, 0.4));
    gradient.addColorStop(1, rgba(rgb.r, rgb.g, rgb.b, 0));

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Draw a line with optional glow
  function drawLine(x1, y1, x2, y2, color, width, glowRadius) {
    if (!ctx) return;

    if (glowRadius) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.shadowColor = color;
      ctx.shadowBlur = glowRadius;
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }

  // Draw a circle (filled)
  function drawCircle(x, y, radius, color) {
    if (!ctx) return;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw a circle (stroked)
  function drawCircleOutline(x, y, radius, color, lineWidth) {
    if (!ctx) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth || 1;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Draw a rectangle (filled)
  function drawRect(x, y, width, height, color) {
    if (!ctx) return;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
  }

  // Draw text with optional shadow for readability
  function drawText(text, x, y, color, fontSize, align, shadow) {
    if (!ctx) return;
    ctx.save();
    ctx.font = (fontSize || 16) + 'px "Courier New", monospace';
    ctx.fillStyle = color || '#ffffff';
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'top';

    if (shadow) {
      ctx.shadowColor = shadow.color || 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = shadow.blur || 4;
      ctx.shadowOffsetX = shadow.offsetX || 2;
      ctx.shadowOffsetY = shadow.offsetY || 2;
    }

    ctx.fillText(text, x, y);
    ctx.restore();
  }

  // Draw a polygon from an array of {x, y} points
  function drawPolygon(points, fillColor, strokeColor, lineWidth) {
    if (!ctx || !points || points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();

    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth || 1;
      ctx.stroke();
    }
  }

  // Draw a polygon with glow effect
  function drawPolygonGlow(points, fillColor, glowColor, glowRadius) {
    if (!ctx || !points || points.length < 2) return;

    ctx.save();
    ctx.shadowColor = glowColor || fillColor;
    ctx.shadowBlur = glowRadius || 10;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();

    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.restore();
  }

  // Convert screen coordinates to game world coordinates
  function screenToWorld(screenX, screenY) {
    return {
      x: screenX - shakeOffsetX,
      y: screenY - shakeOffsetY,
    };
  }

  // Convert game world coordinates to screen coordinates
  function worldToScreen(worldX, worldY) {
    return {
      x: worldX + shakeOffsetX,
      y: worldY + shakeOffsetY,
    };
  }

  return {
    init: init,
    update: update,
    shake: shake,
    flash: flash,
    getShakeOffset: getShakeOffset,
    clear: clear,
    beginFrame: beginFrame,
    endFrame: endFrame,
    setAdditiveBlend: setAdditiveBlend,
    setNormalBlend: setNormalBlend,
    drawGlow: drawGlow,
    drawLine: drawLine,
    drawCircle: drawCircle,
    drawCircleOutline: drawCircleOutline,
    drawRect: drawRect,
    drawText: drawText,
    drawPolygon: drawPolygon,
    drawPolygonGlow: drawPolygonGlow,
    screenToWorld: screenToWorld,
    worldToScreen: worldToScreen,

    // Direct context access for advanced rendering
    get ctx() { return ctx; },
  };
})();
