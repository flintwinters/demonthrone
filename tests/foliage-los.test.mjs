import assert from "node:assert/strict";
import test from "node:test";
import { lineSightCost } from "../src/visibility/index.js";
import { brushPatch } from "../src/terrain-props.js";
import { isBrushTile, sightCost } from "../src/world/index.js";

function findBrushTile() {
  for (let y = -30; y <= 30; y += 1) {
    for (let x = -30; x <= 30; x += 1) {
      if (isBrushTile({ x, y })) {
        return { x, y };
      }
    }
  }

  throw new Error("Expected the configured world region to contain brush.");
}

test("foliage has a high biome-specific line-of-sight cost", () => {
  const brushCost = sightCost(findBrushTile());

  assert.equal(brushCost >= 4, true);

  const start = { x: 0.5, y: 0.5, z: 1 };
  const end = { x: 5.5, y: 0.5, z: 1 };
  const context = (cost) => ({
    sightCost: () => cost,
    tileHeight: () => 0,
    isBoulderTile: () => false,
    blockers: new Map(),
    boulderHeight: 0.66,
  });
  const floorLine = lineSightCost(start, end, context(1));
  const brushLine = lineSightCost(start, end, context(brushCost));

  assert.equal(brushLine > floorLine * 2, true);
});

test("foliage geometry rises vertically from the terrain", () => {
  const mesh = brushPatch("heath", [{ tile: { x: 0, y: 0 }, height: 2 }]);

  mesh.geometry.computeBoundingBox();
  const bounds = mesh.geometry.boundingBox;

  assert.notEqual(bounds, null);
  assert.equal(bounds.max.z - bounds.min.z > 0.5, true);
  assert.equal(bounds.max.y - bounds.min.y, 0);
});
