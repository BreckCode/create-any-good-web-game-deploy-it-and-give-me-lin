# Cosmic Defender

A fast-paced space shooter arcade game built with HTML5 Canvas and vanilla JavaScript. Dodge enemies, collect power-ups, and survive increasingly difficult waves — all in the browser with no dependencies.

**Play it now:** https://breckcode.github.io/create-any-good-web-game-deploy-it-and-give-me-lin/

## Install

```bash
git clone https://github.com/breckcode/create-any-good-web-game-deploy-it-and-give-me-lin.git
cd create-any-good-web-game-deploy-it-and-give-me-lin
npm install
```

## Run

```bash
npm run build      # Build to dist/
npm run dev        # Serve locally at http://localhost:3000
```

Or just open `dist/index.html` in a browser after building.

## Run Tests

```bash
npm test           # 113 tests across 7 test files
```

Uses Node.js built-in test runner — no additional test dependencies needed.

## How to Play

- **Move:** WASD or Arrow keys (touch joystick on mobile)
- **Shoot:** Space bar (auto-fires on mobile)
- **Pause:** P or Escape
- **Mute:** Click the mute button (top-right)

Destroy enemies to score points. Chain kills for combo multipliers. Collect power-ups dropped by enemies:

| Power-Up | Effect |
|----------|--------|
| Shield | Temporary invincibility |
| Spread | Triple-shot spread fire |
| Rapid | Increased fire rate |
| Life | Extra life |

Boss enemies appear every 5 waves.

## Project Structure

```
├── index.html              # Entry point with canvas and UI overlays
├── build.js                # Copies src/ to dist/
├── package.json
├── src/
│   ├── css/style.css       # Layout, HUD, menu styling
│   └── js/
│       ├── game.js         # Main loop, state machine, subsystem wiring
│       ├── renderer.js     # Canvas rendering, screen shake
│       ├── input.js        # Keyboard, mouse, touch input
│       ├── player.js       # Player ship
│       ├── enemies.js      # 4 enemy types (basic, zigzag, tank, boss)
│       ├── bullets.js      # Projectile system
│       ├── particles.js    # Particle effects (explosions, trails)
│       ├── powerups.js     # Power-up drops and effects
│       ├── collision.js    # Circle-based collision detection
│       ├── spawner.js      # Wave progression and difficulty scaling
│       ├── starfield.js    # Parallax scrolling background
│       ├── audio.js        # Procedural sound effects (Web Audio API)
│       ├── hud.js          # Score, lives, combo display
│       ├── menu.js         # Start, pause, game over screens
│       └── utils.js        # Math helpers and constants
└── test/                   # Test suite (Node.js built-in runner)
```

## Environment Variables

None required. The game runs entirely client-side with no external services.

## Deploy

```bash
npm run build
# Then deploy dist/ to any static host (GitHub Pages, Surge, Netlify, etc.)
```
