import assert from "node:assert/strict";
import test from "node:test";
import { NoiseLayer } from "../src/domain.js";
import { perlinEnemies } from "../src/enemies.js";
import { perlinPlacementTiles } from "../src/procedural-placement.js";

const bounds = { minX: 0, maxX: 5, minY: 0, maxY: 5 };
const noise = new NoiseLayer({ scale: 0.23, seed: 12345 });

test("Perlin placement is deterministic and respects unavailable tiles", () => {
  const unavailable = (tile) => tile.x === 0;
  const place = () => perlinPlacementTiles(4, bounds, noise, (tile) => !unavailable(tile));

  assert.deepEqual(place(), place());
  assert.equal(place().every((tile) => !unavailable(tile)), true);
});

test("enemy generation is deterministic and collision-free", () => {
  const units = [{ id: "unit", x: 0, y: 0 }];
  const first = perlinEnemies(units, () => false);
  const second = perlinEnemies(units, () => false);
  const keys = new Set(first.map((enemy) => `${enemy.x}:${enemy.y}`));

  assert.deepEqual(first, second);
  assert.equal(first.length, 5);
  assert.equal(keys.size, first.length);
  assert.equal(keys.has("0:0"), false);
});
