import assert from "node:assert/strict";
import test from "node:test";
import { lineSightCost } from "../src/sight-cost.js";

const point = (x, y, z) => ({ x: x + 0.5, y: y + 0.5, z });

function context(overrides = {}) {
  return {
    sightCost: () => 1,
    tileHeight: () => 0,
    isBoulderTile: () => false,
    blockers: new Map(),
    boulderHeight: 0.66,
    ...overrides,
  };
}

test("flat and diagonal rays use their horizontal Euclidean length", () => {
  assert.equal(lineSightCost(point(0, 0, 1), point(4, 0, 1), context()), 4);
  assert.equal(lineSightCost(point(0, 0, 1), point(3, 4, 1), context()), 5);
});

test("vertical slope adds a monotonic symmetric distance penalty", () => {
  const flat = lineSightCost(point(0, 0, 1), point(4, 0, 1), context());
  const raised = lineSightCost(point(0, 0, 1), point(4, 0, 3), context());
  const lowered = lineSightCost(point(0, 0, 3), point(4, 0, 1), context());

  assert.equal(raised, 6);
  assert.equal(lowered, raised);
  assert.equal(raised > flat, true);
});

test("elevated terrain blocks a ray through its three-dimensional column", () => {
  const hill = context({ tileHeight: (tile) => tile.x === 2 ? 2 : 0 });

  assert.equal(lineSightCost(point(0, 0, 1), point(4, 0, 1), hill), Number.POSITIVE_INFINITY);
  assert.equal(lineSightCost(point(0, 0, 3), point(4, 0, 3), hill), 4);
});

test("diagonal rays cannot leak through grid corners", () => {
  const sideColumn = context({
    tileHeight: (tile) => tile.x === 1 && tile.y === 0 ? 2 : 0,
  });

  assert.equal(
    lineSightCost(point(0, 0, 1), point(2, 2, 1), sideColumn),
    Number.POSITIVE_INFINITY,
  );
});

test("rays can clear boulders and character height intervals", () => {
  const blockers = new Map([["2:0", [{ x: 2, y: 0, bottom: 0.08, top: 0.62 }]]]);
  const occupied = context({
    isBoulderTile: (tile) => tile.x === 1,
    blockers,
  });

  assert.equal(lineSightCost(point(0, 0, 0.4), point(4, 0, 0.4), occupied), Number.POSITIVE_INFINITY);
  assert.equal(lineSightCost(point(0, 0, 1), point(4, 0, 1), occupied), 4);
});

test("source and destination cells do not occlude their own ray", () => {
  const blockers = new Map([
    ["0:0", [{ x: 0, y: 0, bottom: 0, top: 2 }]],
    ["1:0", [{ x: 1, y: 0, bottom: 0, top: 2 }]],
  ]);

  assert.equal(lineSightCost(point(0, 0, 1), point(1, 0, 1), context({ blockers })), 1);
  assert.equal(lineSightCost(point(2, 2, 1), point(2, 2, 2), context({ blockers })), 0);
});

test("crossed-cell costs are integrated by distance", () => {
  const weighted = context({ sightCost: (tile) => tile.x === 1 ? 3 : 1 });

  assert.equal(lineSightCost(point(0, 0, 1), point(2, 0, 1), weighted), 4);
});
