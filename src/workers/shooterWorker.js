const GAME_WIDTH = 600;
const GAME_HEIGHT = 400;
const PLAYER_WIDTH = 40;
const PLAYER_SPEED = 5;
const SHOT_DELAY = 250;

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function intersectsEnemy(bullet, enemy) {
  return (
    bullet.x < enemy.x + 30 &&
    bullet.x + 4 > enemy.x &&
    bullet.y < enemy.y + 30 &&
    bullet.y + 10 > enemy.y
  );
}

function computeTick({ playerX, bullets, enemies, keys, now, lastShot, spawnRoll, spawnX }) {
  let nextPlayerX = playerX;
  if (keys.left) nextPlayerX -= PLAYER_SPEED;
  if (keys.right) nextPlayerX += PLAYER_SPEED;
  nextPlayerX = clamp(nextPlayerX, 0, GAME_WIDTH - PLAYER_WIDTH);

  let nextLastShot = lastShot;
  let nextBullets = bullets;

  if (keys.shoot && now - lastShot > SHOT_DELAY) {
    nextLastShot = now;
    nextBullets = [
      ...nextBullets,
      {
        x: nextPlayerX + 18,
        y: GAME_HEIGHT - 40,
      },
    ];
  }

  nextBullets = nextBullets
    .map((bullet) => ({ ...bullet, y: bullet.y - 6 }))
    .filter((bullet) => bullet.y > 0);

  let nextEnemies = enemies.map((enemy) => ({ ...enemy, y: enemy.y + 1 }));

  if (spawnRoll < 0.02) {
    nextEnemies = [...nextEnemies, { x: spawnX * (GAME_WIDTH - 30), y: 0 }];
  }

  const remainingEnemies = [];
  let hitCount = 0;

  for (let enemyIndex = 0; enemyIndex < nextEnemies.length; enemyIndex += 1) {
    const enemy = nextEnemies[enemyIndex];
    let hit = false;

    nextBullets = nextBullets.filter((bullet) => {
      if (!hit && intersectsEnemy(bullet, enemy)) {
        hit = true;
        return false;
      }
      return true;
    });

    if (hit) {
      hitCount += 1;
    } else {
      remainingEnemies.push(enemy);
    }
  }

  return {
    playerX: nextPlayerX,
    bullets: nextBullets,
    enemies: remainingEnemies,
    lastShot: nextLastShot,
    hitCount,
    gameOver: remainingEnemies.some((enemy) => enemy.y > GAME_HEIGHT - 40),
  };
}

self.onmessage = (event) => {
  const { type, requestId, payload } = event.data || {};

  if (type !== "SHOOTER_TICK") {
    self.postMessage({
      type: "SHOOTER_WORKER_ERROR",
      requestId,
      message: `Unknown Shooter worker message: ${type}`,
    });
    return;
  }

  try {
    self.postMessage({
      type: "SHOOTER_TICK_RESULT",
      requestId,
      result: computeTick(payload),
    });
  } catch (error) {
    self.postMessage({
      type: "SHOOTER_WORKER_ERROR",
      requestId,
      message: error instanceof Error ? error.message : "Shooter worker failed.",
    });
  }
};
