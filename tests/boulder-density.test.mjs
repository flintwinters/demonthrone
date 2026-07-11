import assert from "node:assert/strict";
import test from "node:test";
import { isBoulderTile } from "../src/world.js";

test("boulders remain sparse across a representative world region", () => {
  let boulders = 0;
  let tiles = 0;

  for (let y = -50; y <= 50; y += 1) {
    for (let x = -50; x <= 50; x += 1) {
      tiles += 1;

      if (isBoulderTile({ x, y })) {
        boulders += 1;
      }
    }
  }

  assert.equal(boulders > 0, true);
  assert.equal(boulders / tiles < 0.2, true);
});
