import assert from "node:assert/strict";
import test from "node:test";
import { brushPatch, foliageHeightScale } from "../src/terrain-props.js";

test("foliage height varies stably by tile within the intended range", () => {
  const first = foliageHeightScale({ x: 4, y: 9 });
  const second = foliageHeightScale({ x: 5, y: 9 });

  assert.equal(first, foliageHeightScale({ x: 4, y: 9 }));
  assert.notEqual(first, second);
  assert.ok(first >= 0.65 && first < 1.35);
  assert.ok(second >= 0.65 && second < 1.35);
});

test("foliage uses scene lighting instead of an unlit glowing material", () => {
  const foliage = brushPatch("heath", [{ tile: { x: 4, y: 9 }, height: 2 }]);

  assert.equal(foliage.material.isMeshLambertMaterial, true);
  assert.equal(foliage.material.isMeshBasicMaterial, undefined);
});
