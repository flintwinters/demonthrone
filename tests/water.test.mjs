import assert from "node:assert/strict";
import test from "node:test";
import { lineSightCost } from "../src/visibility/index.js";
import {
  groundHeight,
  isBoulderTile,
  isBrushTile,
  isIceTile,
  isObstacleTile,
  isWaterTile,
  tileHeight,
  tileTerrain,
} from "../src/world/index.js";

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

function hydrologyTiles() {
  const tiles = [];

  for (let y = -30; y <= 30; y += 1) {
    for (let x = -30; x <= 30; x += 1) {
      if (isWaterTile({ x, y }) || isIceTile({ x, y })) {
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

test("separate water bodies occupy different basin elevations", () => {
  const heights = new Set(waterTiles().map(tileHeight));

  assert.equal(heights.size > 1, true);
});

test("local water and ice bodies are flat over submerged basin ground", () => {
  const tiles = hydrologyTiles();

  for (const tile of tiles) {
    const surface = tileHeight(tile);
    const depth = surface - groundHeight(tile);

    assert.equal(depth === 0 || depth === 1, true);
    assert.equal(hasSubmergedMinimum(tile, surface), true);
    assertFlatHydrologyNeighbors(tile, surface);
  }
});

test("water greatly extends line-of-sight traversal distance", () => {
  const start = { x: 0.5, y: 0.5, z: 1 };
  const end = { x: 100.5, y: 0.5, z: 1 };
  const context = (cost) => ({
    sightCost: () => cost,
    tileHeight: () => 0,
    isBoulderTile: () => false,
    blockers: new Map(),
    boulderHeight: 0.66,
  });
  const normal = lineSightCost(start, end, context(1));
  const acrossWater = lineSightCost(start, end, context(0.1));

  assert.equal(acrossWater < normal / 5, true);
});

function hasSubmergedMinimum(tile, surface) {
  for (let y = tile.y - 6; y <= tile.y + 6; y += 1) {
    for (let x = tile.x - 6; x <= tile.x + 6; x += 1) {
      if (groundHeight({ x, y }) === surface - 1) {
        return true;
      }
    }
  }

  return false;
}

function assertFlatHydrologyNeighbors(tile, surface) {
  for (const direction of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const neighbor = { x: tile.x + direction[0], y: tile.y + direction[1] };

    if (isWaterTile(neighbor) || isIceTile(neighbor)) {
      assert.equal(tileHeight(neighbor), surface);
    }
  }
}
