import assert from "node:assert/strict";
import test from "node:test";
import { tileHeight } from "../src/world.js";

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
