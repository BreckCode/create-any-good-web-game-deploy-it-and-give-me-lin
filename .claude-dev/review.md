# Code Review — Cosmic Defender

## Issues Fixed

### 1. Bug: Touch input clears keyboard state (input.js:138-149)
**Severity: Medium** — Affected hybrid keyboard+touch devices.

When a touch movement ended, `onTouchEnd` unconditionally set `keys['up'] = false`, `keys['down'] = false`, etc. On devices with both keyboard and touchscreen, ending a touch would cancel keyboard-held directional keys mid-gameplay.

**Fix:** Removed the key-clearing logic. Touch joystick direction is already computed live in `getDirection()` from `touch.active` state, so clearing keys was both unnecessary and harmful.

### 2. Bug: Division by zero in screen shake (renderer.js:49,79)
**Severity: Low** — Could produce NaN shake offsets.

`shakeTimer / shakeDuration` divides by zero if `shake()` is called with duration=0 or if shakeDuration is still 0 from initialization. NaN would propagate into the canvas translate, causing rendering glitches.

**Fix:** Added `if (duration <= 0) return;` guard in `shake()`, and `shakeDuration > 0` checks before division.

### 3. Bug: `randPick` crashes on empty arrays (utils.js:174)
**Severity: Low** — Defensive fix for edge case.

`randPick([])` would return `undefined` (accessing `arr[NaN]`), which could propagate as undefined colors/values to rendering code.

**Fix:** Added empty array guard returning `null`.

## Issues Reviewed and Found Acceptable

- **Security:** No XSS vectors — `textContent` used for score display, no user-provided HTML. All data is local (localStorage for high scores only). No external API calls. Build script uses `path.join` with `__dirname`, no path traversal risk.
- **Audio crash resistance:** All audio methods guarded with `ensureResumed()` and try-catch in `init()`. AudioManager calls in game.js wrapped in `typeof` checks.
- **Collision `break` statements:** The `break` in `checkEnemyBulletsVsPlayer` breaks the bullet loop correctly — only one bullet can hit per frame, which is intentional design (prevents multi-hit frame damage).
- **Particle drag formula:** `p.vx *= (1 - 2 * dt)` is a valid first-order approximation of exponential decay and is frame-rate independent to first order.
- **`splice` in update loops:** O(n) per dead entity removal. Acceptable at this entity count (<200 particles, <20 enemies).
- **Hardcoded values** (acceleration=12, deadzone=15, patrolY=80): These are game-tuning constants local to their functions, not configuration that varies per environment. Acceptable.

## Verification

- Build: `node build.js` — passes
- Syntax: `node --check src/js/*.js` — all 15 files pass
- Tests: 114/114 passing across 22 suites, 0 failures
