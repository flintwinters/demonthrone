import assert from "node:assert/strict";
import test from "node:test";
import { NoiseLayer } from "../src/domain.js";
import { materializeEntities } from "../src/entity-generation.js";
import { PerlinSpawnField } from "../src/procedural-placement.js";
import { pushables } from "../src/pushables.js";

const unit = {
  id: "unit",
  x: 5,
  y: 7,
  color: "#fff",
  sight: 5,
  movement: 3,
  attackRange: 1,
  health: 3,
  target: null,
  attackTargetId: null,
};

test("Perlin spawn fields materialize deterministic local maxima", () => {
  const first = new PerlinSpawnField(new NoiseLayer({ scale: 0.17, magnitude: 1, seed: 12345 }), 0.65);
  const second = new PerlinSpawnField(new NoiseLayer({ scale: 0.17, magnitude: 1, seed: 12345 }), 0.65);

  assert.deepEqual(first.materialize([unit], 12, () => true), second.materialize([unit], 12, () => true));
});

test("entity fields expand with terrain and never reuse consumed origins", () => {
  const enemies = [];

  materializeEntities([unit], enemies);
  assert.equal(pushables.length > 0, true);
  assert.equal(enemies.length > 0, true);

  const crate = pushables[0];
  const origin = { x: crate.x, y: crate.y };

  crate.x += 100;
  materializeEntities([unit], enemies);
  assert.equal(pushables.some((candidate) => candidate.x === origin.x && candidate.y === origin.y), false);

  const previousCount = pushables.length + enemies.length;
  materializeEntities([{ ...unit, x: unit.x + 30 }], enemies);
  assert.equal(pushables.length + enemies.length > previousCount, true);
});
