import assert from "node:assert/strict";
import test from "node:test";
import { perlinNoise2d } from "../src/noise.js";

const epsilon = 1e-7;
const continuityTolerance = 1e-6;

test("Perlin noise remains continuous across every lattice boundary", () => {
  const seed = 0x5eedf;

  for (let boundary = -4; boundary <= 4; boundary += 1) {
    assertBoundaryContinuity(boundary, 0.37, seed);
    assertBoundaryContinuity(boundary, -0.61, seed);
  }
});

test("Perlin noise has comparable variation along both axes", () => {
  const seed = 0x5eedf;
  let horizontalVariation = 0;
  let verticalVariation = 0;

  for (let y = -40; y < 40; y += 1) {
    for (let x = -40; x < 40; x += 1) {
      const value = perlinNoise2d(x / 8, y / 8, seed);

      horizontalVariation += Math.abs(perlinNoise2d((x + 1) / 8, y / 8, seed) - value);
      verticalVariation += Math.abs(perlinNoise2d(x / 8, (y + 1) / 8, seed) - value);
    }
  }

  const axisRatio = horizontalVariation / verticalVariation;

  assert.equal(axisRatio > 0.85 && axisRatio < 1.15, true);
});

function assertBoundaryContinuity(boundary, offset, seed) {
  const horizontalDelta = Math.abs(
    perlinNoise2d(boundary - epsilon, offset, seed)
      - perlinNoise2d(boundary + epsilon, offset, seed),
  );
  const verticalDelta = Math.abs(
    perlinNoise2d(offset, boundary - epsilon, seed)
      - perlinNoise2d(offset, boundary + epsilon, seed),
  );

  assert.equal(horizontalDelta < continuityTolerance, true);
  assert.equal(verticalDelta < continuityTolerance, true);
}
