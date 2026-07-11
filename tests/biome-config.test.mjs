import assert from "node:assert/strict";
import test from "node:test";
import { biomes } from "../src/world-config.js";

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

function assertNoiseFeature(feature) {
  assertNoise(feature);
  assert.equal(Number.isFinite(feature.threshold), true);
}

function assertNoise(noise) {
  assert.equal(noise.scale > 0, true);
  assert.equal(Number.isInteger(noise.seed), true);
}
