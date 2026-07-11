import assert from "node:assert/strict";
import test from "node:test";
import { biomes } from "../src/world-config.js";
import { NoiseLayer } from "../src/domain.js";

test("every biome owns a complete typed procedural profile", () => {
  for (const [kind, biome] of Object.entries(biomes)) {
    assert.equal(biome.kind, kind);
    assert.equal(biome.config.height.components.length > 0, true);
    assertNoiseFeature(biome.config.boulder);
    assertNoiseFeature(biome.config.brush);
    assertNoiseFeature(biome.config.water);
    assertNoiseFeature(biome.config.ice);
    assert.equal(Number.isFinite(biome.config.brush.sightCost), true);
    for (const component of biome.config.height.components) {
      assert.equal(Number.isFinite(component.weight), true);
      assert.equal(["centered", "crest", "linear", "terraced"].includes(component.sample), true);
      assertNoise(component);
    }
  }
});

test("biomes do not share mutable procedural feature instances", () => {
  const profiles = Object.values(biomes);

  for (let index = 1; index < profiles.length; index += 1) {
    assert.notEqual(profiles[index].boulder, profiles[0].boulder);
    assert.notEqual(profiles[index].brush, profiles[0].brush);
    assert.notEqual(profiles[index].water, profiles[0].water);
    assert.notEqual(profiles[index].ice, profiles[0].ice);
  }
});

test("noise magnitude scales output independently of coordinate scale", () => {
  const base = new NoiseLayer({ scale: 0.17, magnitude: 1, seed: 12345 });
  const amplified = new NoiseLayer({ scale: 0.17, magnitude: 2.5, seed: 12345 });
  const tile = { x: 4, y: 9 };

  assert.equal(amplified.value(tile), base.value(tile) * 2.5);
});

function assertNoiseFeature(feature) {
  assertNoise(feature);
  assert.equal(Number.isFinite(feature.threshold), true);
}

function assertNoise(noise) {
  assert.equal(noise.scale > 0, true);
  assert.equal(Number.isFinite(noise.magnitude), true);
  assert.equal(Number.isInteger(noise.seed), true);
}
