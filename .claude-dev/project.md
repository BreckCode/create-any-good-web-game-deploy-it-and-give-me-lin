# Cosmic Defender - Space Shooter Arcade Game

## Overview
A fast-paced, visually polished space shooter arcade game playable in the browser. The player controls a spaceship, dodging and shooting enemies, collecting power-ups, and surviving increasingly difficult waves. Features particle effects, screen shake, and retro-modern aesthetics.

## Requirements
- Fun, engaging gameplay loop with increasing difficulty
- Smooth 60fps rendering on HTML5 Canvas
- Keyboard + touch/mouse controls (mobile friendly)
- Score tracking with local high score persistence
- Visual polish: particles, explosions, screen shake, starfield background
- Sound effects (Web Audio API)
- Deployable as a static site (no server needed)
- Single page, no external runtime dependencies

## Tech Stack

### HTML5 Canvas + Vanilla JavaScript
**Rationale:** A game like this is best served by direct Canvas API access. No framework overhead, no build complexity, instant load times. The game runs entirely client-side as static files.

- **Rendering:** HTML5 Canvas 2D API — direct, fast, well-supported
- **Audio:** Web Audio API — low-latency sound effects generated procedurally (no audio files needed)
- **Storage:** localStorage — high score persistence
- **Styling:** Minimal CSS for the page wrapper and UI overlay (HUD, menus)
- **Build:** Simple file-copy build script (Node.js) — copies src to dist
- **Deployment:** Surge.sh — free static hosting, instant deploys via CLI, gives a public URL

### Why not a game framework (Phaser, PixiJS)?
Overkill for this scope. Vanilla Canvas keeps the project small (~15 files), fast to load, and easy to understand. No dependency management headaches.

### Why Surge.sh for deployment?
- Free, no account setup needed (just email)
- CLI-based deploy in one command
- Gives a permanent public URL
- Perfect for static sites
