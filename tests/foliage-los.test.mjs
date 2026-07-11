import assert from "node:assert/strict";
import test from "node:test";
import { lineSightCost } from "../src/sight-cost.js";
import { isBrushTile, sightCost } from "../src/world.js";

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

  const start = { x: 0, y: 0 };
  const end = { x: 5, y: 0 };
  const flat = () => 0;
  const unblocked = () => false;
  const floorLine = lineSightCost(start, end, () => 1, flat, unblocked);
  const brushLine = lineSightCost(start, end, () => brushCost, flat, unblocked);

  assert.equal(brushLine > floorLine * 2, true);
});
