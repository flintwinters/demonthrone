import { BiomeProfile, HeightComponent, HeightProfile, NoiseLayer, SafeZone, TerrainType } from "./domain.js";
import type { BiomeKind, TerrainKind } from "./types.js";

const worldSeed = 0x5eed;

export const layers = {
  elevation: new NoiseLayer({ scale: 0.055, seed: worldSeed ^ 0x1234 }),
  moisture: new NoiseLayer({ scale: 0.06, seed: worldSeed ^ 0x4321 }),
  ridge: new NoiseLayer({ scale: 0.13, seed: worldSeed ^ 0x6d2b }),
  continental: new NoiseLayer({ scale: 0.012, seed: worldSeed ^ 0xcd73 }),
  detail: new NoiseLayer({ scale: 0.24, seed: worldSeed ^ 0x1f91 }),
  heightCinder: new NoiseLayer({ scale: 0.048, seed: worldSeed ^ 0x7099 }),
  heightFen: new NoiseLayer({ scale: 0.038, seed: worldSeed ^ 0x4a87 }),
  heightHeath: new NoiseLayer({ scale: 0.07, seed: worldSeed ^ 0x39c1 }),
  heightRidge: new NoiseLayer({ scale: 0.085, seed: worldSeed ^ 0x55ad }),
  heightBog: new NoiseLayer({ scale: 0.052, seed: worldSeed ^ 0x3f11 }),
  heightMesa: new NoiseLayer({ scale: 0.06, seed: worldSeed ^ 0x8f6e }),
  boulder: new NoiseLayer({ scale: 0.23, seed: worldSeed ^ 0x2b0d }),
  brush: new NoiseLayer({ scale: 0.31, seed: worldSeed ^ 0x4b1d }),
  water: new NoiseLayer({ scale: 0.075, seed: worldSeed ^ 0x77a3 }),
  ice: new NoiseLayer({ scale: 0.11, seed: worldSeed ^ 0x1ce5 }),
};

export const safeZones = [
  new SafeZone({ x: 5, y: 7 }, 1),
  new SafeZone({ x: 8, y: 6 }, 1),
];

export const biomes = {
  cinder: biome("cinder", height(0.18, [
    new HeightComponent(layers.heightCinder, "terraced", 0.42),
    new HeightComponent(layers.continental, "centered", 0.4),
    new HeightComponent(layers.detail, "crest", 0.16),
    new HeightComponent(layers.elevation, "centered", 0.12),
  ]), 0.77, 0.78, 4, 0.9),
  fen: biome("fen", height(0.22, [
    new HeightComponent(layers.heightFen, "linear", 0.24),
    new HeightComponent(layers.continental, "centered", 0.4),
    new HeightComponent(layers.moisture, "linear", -0.16),
    new HeightComponent(layers.detail, "centered", 0.06),
  ]), 0.91, 0.5, 6, 0.58),
  heath: biome("heath", height(0.12, [
    new HeightComponent(layers.heightHeath, "linear", 0.52),
    new HeightComponent(layers.continental, "centered", 0.4),
    new HeightComponent(layers.elevation, "centered", 0.1),
    new HeightComponent(layers.detail, "centered", 0.14),
  ]), 0.85, 0.62, 4, 0.78),
  ridge: biome("ridge", height(0.32, [
    new HeightComponent(layers.heightRidge, "crest", 0.34),
    new HeightComponent(layers.continental, "centered", 0.4),
    new HeightComponent(layers.ridge, "linear", 0.22),
    new HeightComponent(layers.detail, "centered", 0.28),
  ]), 0.73, 0.72, 5, 0.88),
  bog: biome("bog", height(0.06, [
    new HeightComponent(layers.heightBog, "linear", 0.39),
    new HeightComponent(layers.continental, "centered", 0.4),
    new HeightComponent(layers.moisture, "linear", 0.4),
    new HeightComponent(layers.detail, "centered", 0.1),
  ]), 0.95, 0.44, 5.5, 0.7),
  mesa: biome("mesa", height(0.33, [
    new HeightComponent(layers.heightMesa, "terraced", 0.34),
    new HeightComponent(layers.continental, "centered", 0.44),
    new HeightComponent(layers.ridge, "linear", 0.18),
    new HeightComponent(layers.detail, "centered", 0.12),
  ]), 0.78, 0.68, 5, 0.86),
} satisfies Record<BiomeKind, BiomeProfile>;

export const terrainTraits = {
  floor: new TerrainType("floor", false, 1, 1),
  boulder: new TerrainType("boulder", true, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY),
  brush: new TerrainType("brush", false, 2, 1),
  ice: new TerrainType("ice", false, 0.1, 0.5),
  water: new TerrainType("water", true, 0.1, Number.POSITIVE_INFINITY),
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
