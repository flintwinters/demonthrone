import assert from "node:assert/strict";
import test from "node:test";
import { terrainTileAlongRay } from "../src/controls/index.js";

test("terrain picking stops at the visible side of a raised tile", () => {
  const tile = terrainTileAlongRay(
    {
      origin: { x: -1, y: 0.5, z: 2 },
      direction: { x: 1, y: 0, z: -1 },
    },
    ({ x, y }) => x === 0 && y === 0 ? 3 : 0,
  );

  assert.deepEqual(tile, { x: 0, y: 0 });
});

test("terrain picking resolves an exact corner toward the entered tile", () => {
  const tile = terrainTileAlongRay(
    {
      origin: { x: -0.5, y: -0.5, z: 2 },
      direction: { x: 1, y: 1, z: -2 },
    },
    ({ x, y }) => x === 0 && y === 0 ? 3 : 0,
  );

  assert.deepEqual(tile, { x: 0, y: 0 });
});

test("terrain picking still selects a flat tile through its top face", () => {
  const tile = terrainTileAlongRay(
    {
      origin: { x: 4.5, y: -2.5, z: 3 },
      direction: { x: 0, y: 0, z: -1 },
    },
    () => 2,
  );

  assert.deepEqual(tile, { x: 4, y: -3 });
});
