import assert from "node:assert/strict";
import test from "node:test";
import { terrainHeight } from "../src/constants.js";
import { tileHeight } from "../src/world/index.js";

test("terrain noise produces high peaks and low valleys", () => {
  const heights = [];

  for (let y = -60; y <= 60; y += 1) {
    for (let x = -60; x <= 60; x += 1) {
      heights.push(tileHeight({ x, y }));
    }
  }

  assert.equal(Math.min(...heights) <= -1, true);
  assert.equal(Math.max(...heights) >= 6, true);
});

test("terrain mapping preserves layer output beyond its nominal range", () => {
  const heights = [];

  for (let y = -100; y <= 100; y += 1) {
    for (let x = -100; x <= 100; x += 1) heights.push(tileHeight({ x, y }));
  }

  assert.equal(Math.min(...heights) < terrainHeight.mappingMin, true);
  assert.equal(Math.max(...heights) > terrainHeight.mappingMax, true);
  assert.equal(Math.min(...heights) >= terrainHeight.min, true);
  assert.equal(Math.max(...heights) <= terrainHeight.max, true);
});
