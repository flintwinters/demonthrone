import assert from "node:assert/strict";
import test from "node:test";
import { attackUnits, createEnemy, moveEnemies } from "../src/enemies.js";
import { enemyConfigs } from "../src/world-config.js";

function unit(x, health = 5) {
  return {
    id: "unit", entityKind: "teammate", entityType: "warden", x, y: 0,
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
