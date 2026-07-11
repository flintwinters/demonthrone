import assert from "node:assert/strict";
import test from "node:test";
import { lineSightCost } from "../src/sight-cost.js";
import {
  isBoulderTile,
  isBrushTile,
  isObstacleTile,
  isWaterTile,
  tileHeight,
  tileTerrain,
} from "../src/world.js";

function waterTiles() {
  const tiles = [];

  for (let y = -30; y <= 30; y += 1) {
    for (let x = -30; x <= 30; x += 1) {
      if (isWaterTile({ x, y })) {
        tiles.push({ x, y });
      }
    }
  }

  return tiles;
}

test("water is impassable terrain without obstacle props", () => {
  const [tile] = waterTiles();

  assert.notEqual(tile, undefined, "Expected the configured world region to contain water.");
  const terrain = tileTerrain(tile);

  assert.equal(terrain.kind, "water");
  assert.equal(terrain.blocksMovement, true);
  assert.equal(terrain.sightCost, 0.1);
  assert.equal(terrain.movementCost, Number.POSITIVE_INFINITY);
  assert.equal(isObstacleTile(tile), true);
  assert.equal(isBoulderTile(tile), false);
  assert.equal(isBrushTile(tile), false);
  assert.equal(isWaterTile({ x: 5, y: 7 }), false);
});

test("water bodies retain noise-generated elevation", () => {
  const heights = new Set(waterTiles().map(tileHeight));

  assert.equal(heights.size > 1, true);
});

test("water greatly extends line-of-sight traversal distance", () => {
  const start = { x: 0, y: 0 };
  const end = { x: 100, y: 0 };
  const height = () => 0;
  const unblocked = () => false;
  const normal = lineSightCost(start, end, () => 1, height, unblocked);
  const acrossWater = lineSightCost(start, end, () => 0.1, height, unblocked);

  assert.equal(acrossWater < normal / 5, true);
});
