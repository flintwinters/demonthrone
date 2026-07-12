import assert from "node:assert/strict";
import test from "node:test";
import { brushPatch, foliageHeightScale } from "../src/rendering/index.js";
import { terrainPropConfig } from "../src/world-config.js";

test("foliage height varies stably by tile within the intended range", () => {
  const first = foliageHeightScale({ x: 4, y: 9 });
  const second = foliageHeightScale({ x: 5, y: 9 });

  assert.equal(first, foliageHeightScale({ x: 4, y: 9 }));
  assert.notEqual(first, second);
  const minimum = terrainPropConfig.minimumFoliageScale;
  const maximum = minimum + terrainPropConfig.foliageScaleRange;

  assert.ok(first >= minimum && first < maximum);
  assert.ok(second >= minimum && second < maximum);
});

test("foliage uses scene lighting instead of an unlit glowing material", () => {
  const foliage = brushPatch("heath", [{ tile: { x: 4, y: 9 }, height: 2 }]);

  assert.equal(foliage.material.isMeshLambertMaterial, true);
  assert.equal(foliage.material.isMeshBasicMaterial, undefined);
  assert.equal(foliage.geometry.hasAttribute("normal"), true);
});
