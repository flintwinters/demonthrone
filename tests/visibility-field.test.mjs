import assert from "node:assert/strict";
import test from "node:test";
import { sightGeometry } from "../src/constants.js";
import { tileKey } from "../src/grid.js";
import { enemyObscuredSightCost } from "../src/visibility/index.js";
import { visibleTiles } from "../src/visibility/index.js";
import { shadowcastTiles } from "../src/visibility/index.js";
import { sightContext } from "../src/visibility/index.js";

function unit(sight, x = 0, y = 0) {
  return { x, y, sight };
}

function field(viewer, options = {}) {
  return visibleTiles(
    [viewer],
    options.blockers ?? [],
    options.sightCost ?? (() => 1),
    options.tileHeight ?? (() => 0),
    options.isBoulderTile ?? (() => false),
  );
}

test("flat shadowcast visibility forms one cardinally connected field", () => {
  const visible = field(unit(8));
  const keys = new Set(visible.map(tileKey));
  const reached = new Set(["0:0"]);
  const pending = [{ x: 0, y: 0 }];

  while (pending.length > 0) {
    const tile = pending.pop();

    for (const neighbor of cardinalNeighbors(tile)) {
      const key = tileKey(neighbor);
      if (keys.has(key) && !reached.has(key)) {
        reached.add(key);
        pending.push(neighbor);
      }
    }
  }
  assert.equal(visible.length > 100, true);
  assert.equal(reached.size, visible.length);
});

test("an elevated column casts a vertical-angle shadow", () => {
  const tileHeight = (tile) => tile.x === 2 && tile.y === 0 ? 3 : 0;
  const keys = new Set(field(unit(8), { tileHeight }).map(tileKey));

  assert.equal(keys.has("2:0"), true);
  assert.equal(keys.has("4:0"), false);
  assert.equal(keys.has("0:4"), true);
});

test("a sufficiently elevated viewer sees over a lower ridge", () => {
  const tileHeight = (tile) => {
    if (tile.x === 0 && tile.y === 0) return 4;
    return tile.x === 2 && tile.y === 0 ? 2 : 0;
  };
  const keys = new Set(field(unit(8), { tileHeight }).map(tileKey));

  assert.equal(keys.has("4:0"), true);
});

test("memoized procedural tile sampling grows quadratically with sight radius", () => {
  let samples = 0;
  const radius = 20;

  field(unit(radius), { sightCost: () => {
    samples += 1;
    return 1;
  } });
  assert.equal(samples <= 4 * radius ** 2, true);
});

test("supersampled footprints fill partial shadow gaps without adjacency dilation", () => {
  const tileHeight = (tile) => {
    const raisedViewer = tile.x === 0 && tile.y === 0;
    const narrowRidge = tile.x === -3 && tile.y === -8;

    return raisedViewer || narrowRidge ? 3 : 0;
  };
  const keys = new Set(field(unit(12), { tileHeight }).map(tileKey));

  assert.equal(keys.has("-4:-9"), true);
  assert.equal(keys.has("-3:-9"), false);
});

test("a one-tile origin move preserves a partially visible footprint", () => {
  const tileHeight = (tile) => tile.x === -1 && tile.y === -6 ? 3 : 0;
  const before = new Set(field(unit(10), { tileHeight }).map(tileKey));
  const after = new Set(field(unit(10, 1, 0), { tileHeight }).map(tileKey));

  assert.equal(before.has("-2:-7"), true);
  assert.equal(after.has("-2:-7"), true);
});

test("supersampling preserves wall and corner occlusion", () => {
  const wall = (tile) => tile.x === 2 && tile.y >= -2 && tile.y <= 2;
  const keys = new Set(field(unit(8), {
    tileHeight: (tile) => wall(tile) ? 5 : 0,
  }).map(tileKey));

  assert.equal(keys.has("2:2"), true);
  assert.equal(keys.has("3:0"), false);
  assert.equal(keys.has("3:2"), false);
  assert.equal(keys.has("3:3"), false);
});

test("supersampling does not extend the Euclidean range boundary", () => {
  const context = sightContext([], () => 1, () => 0, () => false);
  const keys = new Set(shadowcastTiles(
    { x: 0, y: 0 }, 5, context, sightGeometry.eyeHeight,
  ).map(tileKey));

  assert.equal(keys.has("5:0"), true);
  assert.equal(keys.has("4:3"), true);
  assert.equal(keys.has("5:1"), false);
});

test("angular supersample work grows quadratically", () => {
  const smaller = angularSampleCount(20);
  const larger = angularSampleCount(40);

  assert.equal(smaller <= 22 * 20 ** 2, true);
  assert.equal(larger <= 22 * 40 ** 2, true);
  assert.equal(larger / smaller > 3.8, true);
  assert.equal(larger / smaller < 4.2, true);
});

test("character-height range fields include flat adjacent tiles", () => {
  const context = sightContext([], () => 1, () => 0, () => false);
  const keys = new Set(shadowcastTiles({ x: 0, y: 0 }, 1, context, 0.38).map(tileKey));

  assert.equal(keys.has("1:0"), true);
  assert.equal(keys.has("1:1"), false);
});

test("shadowcast LOS slope penalty is configurable", () => {
  const context = (heightMultiplier) => sightContext(
    [],
    () => 1,
    (tile) => (tile.x === 3 && tile.y === 0 ? 8 : 0),
    () => false,
    heightMultiplier,
  );
  const flatVision = new Set(shadowcastTiles({ x: 0, y: 0 }, 8, context(1), 0.001).map(tileKey));
  const steepVision = new Set(shadowcastTiles({ x: 0, y: 0 }, 8, context(1.5), 0.001).map(tileKey));

  assert.equal(flatVision.has("3:0"), true);
  assert.equal(steepVision.has("3:0"), false);
});

test("enemy occupancy multiplies the existing sight traversal cost", () => {
  const sightCost = enemyObscuredSightCost([{ x: 2, y: 0 }], () => 1);

  assert.equal(sightCost({ x: 1, y: 0 }), 1);
  assert.equal(sightCost({ x: 2, y: 0 }), 3);
});

test("enemy sight cost shortens visibility behind the occupied tile", () => {
  const sightCost = enemyObscuredSightCost([{ x: 2, y: 0 }], () => 1);
  const keys = new Set(field(unit(5), { sightCost }).map(tileKey));

  assert.equal(keys.has("2:0"), true);
  assert.equal(keys.has("4:0"), false);
  assert.equal(keys.has("0:4"), true);
});

function cardinalNeighbors(tile) {
  return [
    { x: tile.x + 1, y: tile.y },
    { x: tile.x - 1, y: tile.y },
    { x: tile.x, y: tile.y + 1 },
    { x: tile.x, y: tile.y - 1 },
  ];
}

function angularSampleCount(radius) {
  let samples = 0;
  const context = sightContext([], () => 1, () => 0, () => false);

  Object.defineProperty(context, "heightMultiplier", { get: () => {
    samples += 1;
    return 1;
  } });

  shadowcastTiles({ x: 0, y: 0 }, radius, context);
  return samples;
}
