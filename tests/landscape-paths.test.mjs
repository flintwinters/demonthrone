import assert from "node:assert/strict";
import test from "node:test";
import { canReachTile } from "../src/movement.js";
import { lineSightCost } from "../src/visibility/index.js";
import { landscapePaths } from "../src/world-config.js";
import {
  groundHeight,
  isBoulderTile,
  isBrushTile,
  isObstacleTile,
  isRiverTile,
  isWallTile,
  movementCost,
  sightCost,
  tileHeight,
  tileTerrain,
} from "../src/world/index.js";

function pathTiles(predicate, radius = 80) {
  const tiles = [];

  for (let y = -radius; y <= radius; y += 1) {
    for (let x = -radius; x <= radius; x += 1) {
      if (predicate({ x, y })) tiles.push({ x, y });
    }
  }

  return tiles;
}

test("procedural rivers snake across both world axes", () => {
  const rivers = pathTiles(isRiverTile);

  assert.equal(rivers.length > 100, true);
  assert.equal(new Set(rivers.map(({ x }) => x)).size > 100, true);
  assert.equal(new Set(rivers.map(({ y }) => y)).size > 100, true);
});

test("river tiles are unobstructed slow water with efficient sight traversal", () => {
  const [river] = pathTiles(isRiverTile);

  assert.notEqual(river, undefined);
  assert.equal(tileTerrain(river).kind, "water");
  assert.equal(isObstacleTile(river), false);
  assert.equal(isBoulderTile(river), false);
  assert.equal(isBrushTile(river), false);
  assert.equal(sightCost(river), 0.1);
  assert.equal(movementCost(river), 10);
  assert.equal(tileHeight(river), groundHeight(river));
});

test("walls are short ordinary blocks governed by terrain slope", () => {
  const walls = pathTiles(isWallTile);
  const wall = walls.reduce((highest, tile) => (
    wallRise(tile) > wallRise(highest) ? tile : highest
  ));

  assert.notEqual(wall, undefined);
  assert.equal(landscapePaths.wall.height, 12);
  assert.equal(landscapePaths.wall.riseScale, 0.5);
  assert.equal(tileTerrain(wall).kind, "floor");
  assert.equal(isObstacleTile(wall), false);
  assert.equal(isBoulderTile(wall), false);
  assert.equal(isBrushTile(wall), false);
  assert.equal(wallRise(wall) >= landscapePaths.wall.height * landscapePaths.wall.riseScale, true);
});

test("walls occupy a rare elevated noise band with substantial multi-tile-thick runs", () => {
  const walls = pathTiles(isWallTile);
  const interior = walls.filter((wall) => neighbors(wall).filter(isWallTile).length >= 3);
  const sampledTileCount = 161 ** 2;

  assert.equal(landscapePaths.wall.field.config.center - landscapePaths.wall.field.config.halfWidth, 0.65);
  assert.equal(landscapePaths.wall.field.config.halfWidth * 2, 0.05);
  assert.equal(walls.length / sampledTileCount < 0.02, true);
  assert.equal(interior.length / walls.length > 0.42, true);
});

test("wall elevation scales the positive terrain-relative rise", () => {
  const wall = pathTiles(isWallTile).find((tile) => wallStrength(tile) === 1);

  assert.notEqual(wall, undefined);
  const ground = groundHeight(wall);
  const target = ground * landscapePaths.wall.terrainProportion
    + landscapePaths.wall.height
    - landscapePaths.wall.subtraction.value(wall);

  const expectedRise = Math.round(Math.max(0, target - ground) * landscapePaths.wall.riseScale);

  assert.equal(wallRise(wall), expectedRise);
});

test("high terrain can overtake and absorb a full-height wall contour", () => {
  const absorbed = contourTiles().find((tile) => (
    wallStrength(tile) === 1
      && !isRiverTile(tile)
      && !isWallTile(tile)
  ));

  assert.notEqual(absorbed, undefined, "Expected high terrain to rise through the wall target.");
  assert.equal(tileHeight(absorbed), groundHeight(absorbed));
});

test("wall envelopes produce climbable ends and traversable tops", () => {
  const walls = pathTiles(isWallTile);
  const entry = walls.map(walkableEntry).find((candidate) => candidate !== null);
  const along = walls.map(walkableWallNeighbor).find((candidate) => candidate !== null);

  assert.notEqual(entry, undefined, "Expected a wall endpoint that melds into the landscape.");
  assert.notEqual(along, undefined, "Expected adjacent traversable wall-top tiles.");
  assert.equal(canReachTile(entry[0], entry[1], 4, isObstacleTile, tileHeight, movementCost), true);
  assert.equal(canReachTile(along[0], along[1], 4, isObstacleTile, tileHeight, movementCost), true);
});

test("wall columns occlude low sight rays", () => {
  const context = {
    sightCost: () => 1,
    tileHeight: (tile) => tile.x === 2 ? 6 : 0,
    isBoulderTile: () => false,
    blockers: new Map(),
    boulderHeight: 0.66,
  };
  const point = (x) => ({ x: x + 0.5, y: 0.5, z: 1 });

  assert.equal(lineSightCost(point(0), point(4), context), Number.POSITIVE_INFINITY);
});

test("safe zones remain clear of rivers and walls", () => {
  for (const tile of [{ x: 5, y: 7 }, { x: 8, y: 6 }]) {
    assert.equal(isRiverTile(tile), false);
    assert.equal(isWallTile(tile), false);
  }
});

function wallRise(tile) {
  return tileHeight(tile) - groundHeight(tile);
}

function wallStrength(tile) {
  const envelope = landscapePaths.wall.envelope.value(tile);
  const strength = (envelope - landscapePaths.wall.threshold) / landscapePaths.wall.taper;

  return Math.max(0, Math.min(1, strength));
}

function contourTiles(radius = 220) {
  const tiles = [];

  for (let y = -radius; y <= radius; y += 1) {
    for (let x = -radius; x <= radius; x += 1) {
      if (landscapePaths.wall.field.contains({ x, y })) tiles.push({ x, y });
    }
  }

  return tiles;
}

function walkableEntry(wall) {
  return neighbors(wall)
    .filter((tile) => !isWallTile(tile) && !isRiverTile(tile))
    .map((tile) => [tile, wall])
    .find(([start, end]) => tileHeight(end) - tileHeight(start) <= 2) ?? null;
}

function walkableWallNeighbor(wall) {
  return neighbors(wall)
    .filter(isWallTile)
    .map((tile) => [wall, tile])
    .find(([start, end]) => tileHeight(end) - tileHeight(start) <= 2) ?? null;
}

function neighbors(tile) {
  return [
    { x: tile.x + 1, y: tile.y },
    { x: tile.x - 1, y: tile.y },
    { x: tile.x, y: tile.y + 1 },
    { x: tile.x, y: tile.y - 1 },
  ];
}
