import assert from "node:assert/strict";
import test from "node:test";
import { canReachTile } from "../src/movement.js";
import { isIceTile, tileHeight, tileTerrain } from "../src/world/index.js";

function findIceTile() {
  for (let y = -30; y <= 30; y += 1) {
    for (let x = -30; x <= 30; x += 1) {
      if (isIceTile({ x, y })) {
        return { x, y };
      }
    }
  }

  throw new Error("Expected the configured world region to contain ice.");
}

test("ice is passable terrain with water-equivalent sight cost", () => {
  const tile = findIceTile();
  const terrain = tileTerrain(tile);

  assert.equal(terrain.kind, "ice");
  assert.equal(terrain.blocksMovement, false);
  assert.equal(terrain.sightCost, 0.1);
  assert.equal(terrain.movementCost, 0.5);
  assert.equal(Number.isInteger(tileHeight(tile)), true);
});

test("ice doubles reachable distance for the same movement budget", () => {
  const start = { x: 0, y: 0 };
  const target = { x: 4, y: 0 };
  const unblocked = () => false;
  const flat = () => 0;

  assert.equal(canReachTile(start, target, 2, unblocked, flat, () => 1), false);
  assert.equal(canReachTile(start, target, 2, unblocked, flat, () => 0.5), true);
});
