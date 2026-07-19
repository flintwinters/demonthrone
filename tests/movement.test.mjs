import assert from "node:assert/strict";
import test from "node:test";
import { tileKey } from "../src/grid.js";
import { canReachTile, movementStepCost, reachableTileKeys } from "../src/movement.js";

const unblocked = () => false;
const floorCost = () => 1;

function heightField(heights) {
  return (tile) => heights.get(`${tile.x},${tile.y}`) ?? 0;
}

test("each uphill level doubles movement cost and each downhill level halves it", () => {
  const previous = { x: 0, y: 0 };
  const tile = { x: 1, y: 0 };

  assert.equal(movementStepCost(previous, tile, heightField(new Map([["1,0", 2]])), floorCost), 4);
  assert.equal(movementStepCost(previous, tile, heightField(new Map([["1,0", -2]])), floorCost), 0.25);
});

test("slope changes reachable distance for the same movement budget", () => {
  const start = { x: 0, y: 0 };
  const target = { x: 2, y: 0 };
  const uphill = heightField(new Map([["1,0", 1], ["2,0", 2]]));
  const downhill = heightField(new Map([["1,0", -1], ["2,0", -2]]));

  assert.equal(canReachTile(start, target, 2, unblocked, uphill, floorCost), false);
  assert.equal(canReachTile(start, target, 2, unblocked, downhill, floorCost), true);
});

test("terrain and slope movement multipliers compose", () => {
  const previous = { x: 0, y: 0 };
  const tile = { x: 1, y: 0 };
  const uphill = heightField(new Map([["1,0", 1]]));

  assert.equal(movementStepCost(previous, tile, uphill, () => 0.5), 1);
});

test("one movement field contains every tile reachable around obstacles", () => {
  const blocked = (tile) => tile.x === 1 && tile.y === 0;
  const keys = reachableTileKeys({ x: 0, y: 0 }, 3, blocked, () => 0, () => 1);

  assert.equal(keys.has("1:0"), false);
  assert.equal(keys.has("2:0"), false);
  assert.equal(keys.has("1:1"), true);
});

test("movement cannot cross darkness to an isolated team-visible tile", () => {
  const visible = new Set(["0:0", "1:0", "3:0"]);
  const outsideTeamVisibility = (tile) => !visible.has(tileKey(tile));
  const keys = reachableTileKeys(
    { x: 0, y: 0 }, 4, outsideTeamVisibility, () => 0, () => 1,
  );

  assert.equal(keys.has("1:0"), true);
  assert.equal(keys.has("3:0"), false);
});
