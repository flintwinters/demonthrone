import { BiomeProfile, HeightComponent, HeightProfile, NoiseLayer, SafeZone, TerrainType } from "./domain.js";
import type { BiomeKind, TerrainKind } from "./types.js";

const worldSeed = 0x5eed;

export const layers = {
  elevation: new NoiseLayer({ scale: 0.055, seed: worldSeed ^ 0x1234 }),
  moisture: new NoiseLayer({ scale: 0.06, seed: worldSeed ^ 0x4321 }),
  ridge: new NoiseLayer({ scale: 0.13, seed: worldSeed ^ 0x6d2b }),
  detail: new NoiseLayer({ scale: 0.24, seed: worldSeed ^ 0x1f91 }),
  heightCinder: new NoiseLayer({ scale: 0.048, seed: worldSeed ^ 0x7099 }),
  heightFen: new NoiseLayer({ scale: 0.038, seed: worldSeed ^ 0x4a87 }),
  heightHeath: new NoiseLayer({ scale: 0.07, seed: worldSeed ^ 0x39c1 }),
  heightRidge: new NoiseLayer({ scale: 0.085, seed: worldSeed ^ 0x55ad }),
  boulder: new NoiseLayer({ scale: 0.23, seed: worldSeed ^ 0x2b0d }),
  brush: new NoiseLayer({ scale: 0.31, seed: worldSeed ^ 0x4b1d }),
  water: new NoiseLayer({ scale: 0.075, seed: worldSeed ^ 0x77a3 }),
};

export const safeZones = [
  new SafeZone({ x: 5, y: 7 }, 1),
  new SafeZone({ x: 8, y: 6 }, 1),
];

export const biomes = {
  cinder: biome("cinder", height(0.18, [
    new HeightComponent(layers.heightCinder, "terraced", 0.42),
    new HeightComponent(layers.detail, "crest", 0.16),
    new HeightComponent(layers.elevation, "centered", 0.12),
  ]), 0.72, 0.78, 4, 0.9),
  fen: biome("fen", height(0.22, [
    new HeightComponent(layers.heightFen, "linear", 0.24),
    new HeightComponent(layers.moisture, "linear", -0.16),
    new HeightComponent(layers.detail, "centered", 0.06),
  ]), 0.88, 0.5, 6, 0.58),
  heath: biome("heath", height(0.12, [
    new HeightComponent(layers.heightHeath, "linear", 0.52),
    new HeightComponent(layers.elevation, "centered", 0.1),
    new HeightComponent(layers.detail, "centered", 0.14),
  ]), 0.8, 0.62, 4, 0.78),
  ridge: biome("ridge", height(0.32, [
    new HeightComponent(layers.heightRidge, "crest", 0.34),
    new HeightComponent(layers.ridge, "linear", 0.22),
    new HeightComponent(layers.detail, "centered", 0.28),
  ]), 0.67, 0.72, 5, 0.88),
} satisfies Record<BiomeKind, BiomeProfile>;

export const terrainTraits = {
  floor: new TerrainType("floor", false, 1),
  boulder: new TerrainType("boulder", true, Number.POSITIVE_INFINITY),
  brush: new TerrainType("brush", false, 2),
  water: new TerrainType("water", true, 0.1),
} satisfies Record<TerrainKind, TerrainType>;

function biome(
  kind: BiomeKind,
  profile: HeightProfile,
  boulder: number,
  brush: number,
  sight: number,
  water: number,
): BiomeProfile {
  return new BiomeProfile(kind, profile, boulder, brush, sight, water);
}

function height(base: number, components: readonly HeightComponent[]): HeightProfile {
  return new HeightProfile(base, components);
}
