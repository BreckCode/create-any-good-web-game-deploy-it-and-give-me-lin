# Architecture

## Folder Structure
```
/
├── index.html              # Entry point, canvas element, UI overlay
├── build.js                # Simple build script (copy to dist)
├── package.json
├── .gitignore
├── src/
│   ├── css/
│   │   └── style.css       # Page layout, HUD, menu styling
│   ├── js/
│   │   ├── game.js          # Main game loop, state management
│   │   ├── renderer.js      # Canvas rendering, camera/shake effects
│   │   ├── input.js         # Keyboard, mouse, touch input handling
│   │   ├── player.js        # Player ship entity
│   │   ├── enemies.js       # Enemy types and behaviors
│   │   ├── bullets.js       # Projectile system (player + enemy)
│   │   ├── particles.js     # Particle system for explosions/trails
│   │   ├── powerups.js      # Power-up drops and effects
│   │   ├── collision.js     # Collision detection (AABB + circle)
│   │   ├── spawner.js       # Wave/enemy spawning logic
│   │   ├── starfield.js     # Parallax scrolling starfield background
│   │   ├── audio.js         # Procedural sound effects (Web Audio API)
│   │   ├── hud.js           # Score, lives, power-up display
│   │   ├── menu.js          # Start screen, game over, pause
│   │   └── utils.js         # Math helpers, random, lerp, clamp
│   └── assets/              # (empty - all visuals are procedural/canvas-drawn)
├── dist/                    # Built output (gitignored)
└── .claude-dev/             # Project context files
```

## Architecture Patterns

### Game Loop
Classic fixed-timestep game loop with variable rendering:
1. `requestAnimationFrame` drives the loop
2. Delta time calculated per frame
3. `update(dt)` → physics, AI, spawning, collision
4. `render(ctx)` → clear, draw starfield, entities, particles, HUD

### Entity System
Simple object-oriented entities (no ECS - overkill for this scope):
- Base properties: x, y, width, height, velocity, active flag
- Each entity type (Player, Enemy, Bullet, Particle, PowerUp) is a class
- Active entities stored in arrays, filtered on death (object pooling if needed)

### State Machine
Game states managed in `game.js`:
- `MENU` → show start screen, wait for input
- `PLAYING` → game loop active
- `PAUSED` → loop paused, show pause overlay
- `GAME_OVER` → show score, high score, restart option

### Collision Detection
- AABB (axis-aligned bounding box) for fast broad-phase
- Circle collision for accuracy on small entities
- Player bullets vs enemies, enemy bullets vs player, player vs power-ups

### Rendering Pipeline
1. Clear canvas
2. Draw starfield (parallax layers)
3. Draw active entities (enemies, bullets, power-ups)
4. Draw player
5. Draw particles (additive blending for glow)
6. Apply screen shake offset
7. Draw HUD overlay (score, lives)

### Audio Design
Procedural audio using Web Audio API oscillators:
- Laser shot: short frequency sweep
- Explosion: noise burst with decay
- Power-up: ascending tone
- No audio files needed — everything generated at runtime

### Data Flow
```
Input → Game State → Update All Entities → Check Collisions → Spawn/Despawn → Render
         ↑                                        |
         └────── Score/Lives/PowerUps ────────────┘
```

## Difficulty Scaling
- Wave number increases over time
- More enemies per wave, faster movement
- New enemy types introduced at wave thresholds
- Enemy bullet frequency increases
- Power-up drop rate stays consistent to keep it fair
