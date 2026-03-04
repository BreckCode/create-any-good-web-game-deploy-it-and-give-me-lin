// ============================================================
// Cosmic Defender - Collision Detection
// ============================================================
// Circle-based collision checks for all entity pairs:
// player-bullets vs enemies, enemy-bullets vs player,
// player vs power-ups, player vs enemies.
// Triggers damage, scoring, destruction, and power-up collection.

const Collision = (function () {

  // --- Main Update: Check All Collisions ---
  function update(game) {
    const player = game.player;
    if (!player || !player.active) return;

    checkPlayerBulletsVsEnemies(game);
    checkEnemyBulletsVsPlayer(game);
    checkPlayerVsEnemies(game);
    checkPlayerVsPowerUps(game);
  }

  // --- Player Bullets vs Enemies ---
  function checkPlayerBulletsVsEnemies(game) {
    const bullets = game.playerBullets;
    const enemies = game.enemies;

    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      if (!b.active) continue;

      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        if (!e.active) continue;

        if (circleCollision(b.x, b.y, b.radius, e.x, e.y, e.radius)) {
          // Deactivate the bullet
          b.active = false;

          // Damage the enemy
          const killed = Enemies.damage(e, 1, game);

          // Spawn hit sparks
          if (typeof Particles !== 'undefined' && Particles.spawnExplosion) {
            Particles.spawnExplosion(game.particles, b.x, b.y,
              killed ? e.color : COLORS.PARTICLE_HIT[0], killed ? 0 : PARTICLES.HIT_COUNT);
          }

          // Play hit sound
          if (typeof AudioManager !== 'undefined' && AudioManager.play) {
            AudioManager.play(killed ? 'explosion' : 'hit');
          }

          // Drop power-up on kill
          if (killed && typeof PowerUps !== 'undefined' && PowerUps.trySpawnDrop) {
            PowerUps.trySpawnDrop(game.powerups, e.x, e.y);
          }

          break; // bullet is consumed, move to next bullet
        }
      }
    }
  }

  // --- Enemy Bullets vs Player ---
  function checkEnemyBulletsVsPlayer(game) {
    const player = game.player;
    if (!player.active || player.invincible) return;

    // Shield power-up grants invincibility
    if (game.hasPowerUp('shield')) return;

    const bullets = game.enemyBullets;

    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      if (!b.active) continue;

      if (circleCollision(b.x, b.y, b.radius, player.x, player.y, player.radius)) {
        b.active = false;
        Player.hit(game);
        break; // only one hit per frame
      }
    }
  }

  // --- Player vs Enemies (body collision) ---
  function checkPlayerVsEnemies(game) {
    const player = game.player;
    if (!player.active || player.invincible) return;

    // Shield power-up grants invincibility
    if (game.hasPowerUp('shield')) return;

    const enemies = game.enemies;

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e.active) continue;

      if (circleCollision(player.x, player.y, player.radius, e.x, e.y, e.radius)) {
        Player.hit(game);

        // Also damage the enemy on contact
        Enemies.damage(e, 1, game);

        break; // only one collision per frame
      }
    }
  }

  // --- Player vs Power-Ups ---
  function checkPlayerVsPowerUps(game) {
    const player = game.player;
    if (!player.active) return;

    const powerups = game.powerups;

    for (let i = powerups.length - 1; i >= 0; i--) {
      const p = powerups[i];
      if (!p.active) continue;

      // Power-ups use half their width as radius for pickup
      const pRadius = p.width / 2;

      if (circleCollision(player.x, player.y, player.radius, p.x, p.y, pRadius)) {
        p.active = false;

        // Apply the power-up effect
        switch (p.type) {
          case 'shield':
            game.activatePowerUp('shield');
            break;
          case 'spread':
            game.activatePowerUp('spread');
            break;
          case 'rapid':
            game.activatePowerUp('rapid');
            break;
          case 'life':
            game.addLife();
            break;
        }

        // Spawn collection sparkles
        if (typeof Particles !== 'undefined' && Particles.spawnExplosion) {
          const color = p.color || COLORS.POWERUP_SHIELD;
          Particles.spawnExplosion(game.particles, p.x, p.y, color, 10);
        }

        // Play power-up collect sound
        if (typeof AudioManager !== 'undefined' && AudioManager.play) {
          AudioManager.play('powerup');
        }
      }
    }
  }

  // --- Public API ---
  return {
    update: update,
  };
})();
