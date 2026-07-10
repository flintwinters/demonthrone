import { terrainHeight } from "./constants.js";
import { BiomeProfile, HeightComponent, HeightProfile, NoiseLayer, SafeZone, TerrainType } from "./domain.js";
import { tileKey } from "./grid.js";
import type { BiomeKind, Terrain, TerrainKind, Tile } from "./types.js";

const worldSeed = 0x5eed;
const worldDataCacheLimit = 8192;
const layers = {
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
};
const safeZones = [
  new SafeZone({ x: 5, y: 7 }, 1),
  new SafeZone({ x: 8, y: 6 }, 1),
];
const biomes = {
  cinder: biome("cinder", height(0.18, [
    new HeightComponent(layers.heightCinder, "terraced", 0.42),
    new HeightComponent(layers.detail, "crest", 0.16),
    new HeightComponent(layers.elevation, "centered", 0.12),
  ]), 0.58, 0.78, 2),
  fen: biome("fen", height(0.22, [
    new HeightComponent(layers.heightFen, "linear", 0.24),
    new HeightComponent(layers.moisture, "linear", -0.16),
    new HeightComponent(layers.detail, "centered", 0.06),
  ]), 0.76, 0.5, 3),
  heath: biome("heath", height(0.12, [
    new HeightComponent(layers.heightHeath, "linear", 0.52),
    new HeightComponent(layers.elevation, "centered", 0.1),
    new HeightComponent(layers.detail, "centered", 0.14),
  ]), 0.66, 0.62, 2),
  ridge: biome("ridge", height(0.32, [
    new HeightComponent(layers.heightRidge, "crest", 0.34),
    new HeightComponent(layers.ridge, "linear", 0.22),
    new HeightComponent(layers.detail, "centered", 0.28),
  ]), 0.53, 0.72, 2),
} satisfies Record<BiomeKind, BiomeProfile>;
const terrainTraits = {
  floor: new TerrainType("floor", false, 1),
  boulder: new TerrainType("boulder", true, Number.POSITIVE_INFINITY),
  brush: new TerrainType("brush", false, 2),
};
const worldDataCache = new Map<string, WorldTileData>();

type WorldTileData = {
  readonly biome: BiomeKind;
  readonly height: number;
  readonly isBoulder: boolean;
  readonly isBrush: boolean;
  readonly terrain: Terrain;
};

export function tileTerrain(tile: Tile): Terrain {
  return { ...worldData(tile).terrain };
}

export function isObstacleTile(tile: Tile): boolean {
  return worldData(tile).terrain.blocksMovement;
}

export function sightCost(tile: Tile): number {
  return worldData(tile).terrain.sightCost;
}

export function tileBiome(tile: Tile): BiomeKind {
  return worldData(tile).biome;
}

export function isBoulderTile(tile: Tile): boolean {
  return worldData(tile).isBoulder;
}

export function isBrushTile(tile: Tile): boolean {
  return worldData(tile).isBrush;
}

export function tileHeight(tile: Tile): number {
  return worldData(tile).height;
}

function terrainFor(kind: TerrainKind, biomeKind: BiomeKind): Terrain {
  return terrainTraits[kind].terrain(biomes[biomeKind]);
}

function biome(kind: BiomeKind, profile: HeightProfile, boulder: number, brush: number, sight: number): BiomeProfile {
  return new BiomeProfile(kind, profile, boulder, brush, sight);
}

function height(base: number, components: readonly HeightComponent[]): HeightProfile {
  return new HeightProfile(base, components);
}

function worldData(tile: Tile): WorldTileData {
  const key = tileKey(tile);
  const cached = worldDataCache.get(key);

  if (cached !== undefined) {
    worldDataCache.delete(key);
    worldDataCache.set(key, cached);
    return cached;
  }

  const data = createWorldData(tile);
  cacheWorldData(key, data);

  return data;
}

function createWorldData(tile: Tile): WorldTileData {
  const biome = classifyBiome(tile);
  const biomeProfile = biomes[biome];
  const isSafe = isSafeTile(tile);
  const isBoulder = !isSafe && layers.boulder.value(tile) > biomeProfile.boulderThreshold;
  const isBrush = !isSafe && !isBoulder && layers.brush.value(tile) > biomeProfile.brushThreshold;
  const terrain = terrainFor(terrainKind(isBoulder, isBrush), biome);

  return {
    biome,
    height: heightAt(tile, biomeProfile),
    isBoulder,
    isBrush,
    terrain,
  };
}

function cacheWorldData(key: string, data: WorldTileData): void {
  if (worldDataCache.size >= worldDataCacheLimit) {
    const oldestKey = worldDataCache.keys().next().value;

    if (oldestKey !== undefined) {
      worldDataCache.delete(oldestKey);
    }
  }

  worldDataCache.set(key, data);
}

function classifyBiome(tile: Tile): BiomeKind {
  const elevation = layers.elevation.value(tile);
  const moisture = layers.moisture.value(tile);
  const ridge = layers.ridge.value(tile);

  if (elevation > 0.66 || ridge > 0.72) {
    return "ridge";
  }

  if (moisture > 0.62 && elevation < 0.58) {
    return "fen";
  }

  return moisture < 0.35 ? "cinder" : "heath";
}

function terrainKind(isBoulder: boolean, isBrush: boolean): TerrainKind {
  if (isBoulder) {
    return "boulder";
  }

  return isBrush ? "brush" : "floor";
}

function heightAt(tile: Tile, biomeProfile: BiomeProfile): number {
  const range = terrainHeight.max - terrainHeight.min;
  const value = biomeProfile.height.value(tile);

  return terrainHeight.min + Math.round(clamp(value) * range);
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function isSafeTile(tile: Tile): boolean {
  return safeZones.some((zone) => zone.contains(tile));
}
