import { terrainHeight } from "./constants.js";
import type { BiomeProfile } from "./domain.js";
import { tileKey } from "./grid.js";
import { BasinField } from "./hydrology.js";
import { biomes, layers, safeZones, terrainTraits } from "./world-config.js";
import type { BiomeKind, Terrain, TerrainKind, Tile } from "./types.js";

const worldDataCacheLimit = 8192;
const worldDataCache = new Map<string, WorldTileData>();
const basinField = new BasinField(10, 6, 1, groundHeightAt, (tile) => layers.water.value(tile));

type WorldTileData = {
  readonly biome: BiomeKind;
  readonly height: number;
  readonly isBoulder: boolean;
  readonly isBrush: boolean;
  readonly isWater: boolean;
  readonly isIce: boolean;
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

export function movementCost(tile: Tile): number {
  return worldData(tile).terrain.movementCost;
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

export function isWaterTile(tile: Tile): boolean {
  return worldData(tile).isWater;
}

export function isIceTile(tile: Tile): boolean {
  return worldData(tile).isIce;
}

export function tileHeight(tile: Tile): number {
  return worldData(tile).height;
}

export function groundHeight(tile: Tile): number {
  return groundHeightAt(tile);
}

function terrainFor(kind: TerrainKind, biomeKind: BiomeKind): Terrain {
  return terrainTraits[kind].terrain(biomes[biomeKind]);
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
  const ground = heightAt(tile, biomeProfile);
  const isSafe = isSafeTile(tile);
  const waterSurface = isSafe ? null : basinField.surfaceAt(tile, isHydrologicallyWet);
  const { isWater, isIce, isBoulder, isBrush } = terrainFeatures(tile, biomeProfile, waterSurface);
  const terrain = terrainFor(terrainKind(isWater, isIce, isBoulder, isBrush), biome);

  return {
    biome,
    height: waterSurface ?? ground,
    isBoulder,
    isBrush,
    isWater,
    isIce,
    terrain,
  };
}

function terrainFeatures(
  tile: Tile,
  biomeProfile: BiomeProfile,
  waterSurface: number | null,
): { isWater: boolean; isIce: boolean; isBoulder: boolean; isBrush: boolean } {
  if (waterSurface !== null) {
    const isIce = layers.ice.value(tile) > 0.55;

    return { isWater: !isIce, isIce, isBoulder: false, isBrush: false };
  }

  if (layers.boulder.value(tile) > biomeProfile.boulderThreshold) {
    return { isWater: false, isIce: false, isBoulder: true, isBrush: false };
  }

  return {
    isWater: false,
    isIce: false,
    isBoulder: false,
    isBrush: layers.brush.value(tile) > biomeProfile.brushThreshold,
  };
}

function isHydrologicallyWet(tile: Tile): boolean {
  return layers.water.value(tile) > biomes[classifyBiome(tile)].waterThreshold;
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

function terrainKind(isWater: boolean, isIce: boolean, isBoulder: boolean, isBrush: boolean): TerrainKind {
  if (isWater) {
    return "water";
  }

  if (isIce) {
    return "ice";
  }

  if (isBoulder) {
    return "boulder";
  }

  return isBrush ? "brush" : "floor";
}

function heightAt(tile: Tile, biomeProfile: BiomeProfile): number {
  const range = terrainHeight.max - terrainHeight.min;
  const value = contrastHeight(biomeProfile.height.value(tile));

  return terrainHeight.min + Math.round(clamp(value) * range);
}

function groundHeightAt(tile: Tile): number {
  return heightAt(tile, biomes[classifyBiome(tile)]);
}

function contrastHeight(value: number): number {
  return 0.5 + (value - 0.5) * terrainHeight.contrast;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function isSafeTile(tile: Tile): boolean {
  return safeZones.some((zone) => zone.contains(tile));
}
