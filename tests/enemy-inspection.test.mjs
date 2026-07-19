import assert from "node:assert/strict";
import test from "node:test";
import { isEnemyActionTile } from "../src/enemy-inspection.js";

const enemy = {
  id: "inspection-enemy",
  entityKind: "enemy",
  entityType: "pursuer",
  x: 40,
  y: 40,
  color: "#cc241d",
  sight: 8,
  movement: 100,
  attackRange: 3,
  health: 4,
  damage: 2,
  movementInterval: 1,
  turnsUntilMove: 0,
};

test("an inspected enemy exposes movement and attack overlay tiles", () => {
  const selectedTile = { x: enemy.x, y: enemy.y, height: 0 };
  const game = {
    units: [], enemies: [enemy], pushables: [], tombstones: [], selection: { unitId: null },
    selectedTile, hoveredTile: null,
  };
  const candidates = Array.from({ length: 7 }, (_, y) =>
    Array.from({ length: 7 }, (_, x) => ({ x: enemy.x + x - 3, y: enemy.y + y - 3 })),
  ).flat();
  const movementPolicy = { key: "unblocked", isBlocked: () => false };
  const hasActionTile = (field) => candidates.some((tile) =>
    isEnemyActionTile(selectedTile, tile, game, movementPolicy, field));

  assert.equal(hasActionTile("movement"), true);
  assert.equal(hasActionTile("attack"), true);
  assert.equal(isEnemyActionTile(null, enemy, game, movementPolicy, "attack"), false);
});
