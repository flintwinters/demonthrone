import assert from "node:assert/strict";
import test from "node:test";
import { attackUnits, createEnemy, moveEnemies } from "../src/enemies.js";
import { enemyConfigs } from "../src/world-config.js";
import { groundHeight, isWallTile, tileHeight } from "../src/world/index.js";

function unit(x, health = 5) {
  return unitAt({ x, y: 0 }, health);
}

function unitAt(tile, health = 5) {
  return {
    id: "unit", entityKind: "teammate", entityType: "warden", ...tile,
    color: "#fff", sight: 5, movement: 1, attackRange: 1, health,
    target: null, attackTargetId: null,
  };
}

test("enemy archetypes have distinct typed combat profiles", () => {
  const pursuer = createEnemy("pursuer", "pursuer", { x: 0, y: 0 });
  const nephilim = createEnemy("nephilim", "nephilim", { x: 0, y: 0 });

  assert.deepEqual(
    [pursuer.attackRange, pursuer.damage, pursuer.movementInterval],
    [2, 1, 1],
  );
  assert.deepEqual(
    [nephilim.health, nephilim.damage, nephilim.movementInterval],
    [8, 3, 3],
  );
});

test("nephilim damage is applied through the shared enemy attack phase", () => {
  const target = unit(1);
  const nephilim = createEnemy("nephilim", "nephilim", { x: 0, y: 0 });

  assert.deepEqual(attackUnits([target], [nephilim]), []);
  assert.equal(target.health, 2);
});

test("enemies cannot attack a teammate through a procedural wall", () => {
  const [enemyTile, targetTile] = wallSeparatedTiles();
  const target = unitAt(targetTile);
  const pursuer = createEnemy("pursuer", "pursuer", enemyTile);

  assert.deepEqual(attackUnits([target], [pursuer]), []);
  assert.equal(target.health, 5);
});

test("nephilim moves only every third enemy phase", () => {
  const target = unit(5);
  const nephilim = createEnemy("nephilim", "nephilim", { x: 0, y: 0 });
  const enemies = [nephilim];

  moveEnemies(enemies, [target], () => false);
  assert.equal(nephilim.x, 1);
  moveEnemies(enemies, [target], () => false);
  moveEnemies(enemies, [target], () => false);
  assert.equal(nephilim.x, 1);
  moveEnemies(enemies, [target], () => false);
  assert.equal(nephilim.x, 2);
});

test("nephilim renders as a taller cylinder than the pursuer cone", () => {
  const pursuer = enemyConfigs.find((config) => config.type === "pursuer");
  const nephilim = enemyConfigs.find((config) => config.type === "nephilim");

  assert.equal(pursuer.appearance.shape, "cone");
  assert.equal(nephilim.appearance.shape, "cylinder");
  assert.equal(nephilim.appearance.height > pursuer.appearance.height, true);
});

function wallSeparatedTiles() {
  for (let y = -80; y <= 80; y += 1) {
    for (let x = -80; x <= 80; x += 1) {
      const wall = { x, y };

      if (isTallWall(wall)) {
        const separated = oppositeOpenNeighbors(wall);

        if (separated) return separated;
      }
    }
  }

  throw new Error("Expected a tall wall tile with open opposite neighbors.");
}

function isTallWall(tile) {
  return isWallTile(tile) && tileHeight(tile) - groundHeight(tile) >= 8;
}

function oppositeOpenNeighbors(wall) {
  for (const [dx, dy] of [[1, 0], [0, 1]]) {
    const first = { x: wall.x - dx, y: wall.y - dy };
    const second = { x: wall.x + dx, y: wall.y + dy };

    if (!isWallTile(first) && !isWallTile(second)) return [first, second];
  }

  return null;
}
