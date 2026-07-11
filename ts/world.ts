import { terrainHeight } from "./constants.js";
import type { BiomeProfile } from "./domain.js";
import { tileKey } from "./grid.js";
import { biomes, layers, safeZones, terrainTraits } from "./world-config.js";
import type { BiomeKind, Terrain, TerrainKind, Tile } from "./types.js";

const worldDataCacheLimit = 8192;
const worldDataCache = new Map<string, WorldTileData>();

type WorldTileData = {
  readonly biome: BiomeKind;
  readonly height: number;
  readonly isBoulder: boolean;
  readonly isBrush: boolean;
  readonly isWater: boolean;
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

export function isWaterTile(tile: Tile): boolean {
  return worldData(tile).isWater;
}

export function tileHeight(tile: Tile): number {
  return worldData(tile).height;
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
  const isSafe = isSafeTile(tile);
  const { isWater, isBoulder, isBrush } = terrainFeatures(tile, biomeProfile, isSafe);
  const terrain = terrainFor(terrainKind(isWater, isBoulder, isBrush), biome);

  return {
    biome,
    height: isWater ? terrainHeight.min : heightAt(tile, biomeProfile),
    isBoulder,
    isBrush,
    isWater,
    terrain,
  };
}

function terrainFeatures(
  tile: Tile,
  biomeProfile: BiomeProfile,
  isSafe: boolean,
): { isWater: boolean; isBoulder: boolean; isBrush: boolean } {
  if (isSafe) {
    return { isWater: false, isBoulder: false, isBrush: false };
  }

  if (layers.water.value(tile) > biomeProfile.waterThreshold) {
    return { isWater: true, isBoulder: false, isBrush: false };
  }

  if (layers.boulder.value(tile) > biomeProfile.boulderThreshold) {
    return { isWater: false, isBoulder: true, isBrush: false };
  }

  return {
    isWater: false,
    isBoulder: false,
    isBrush: layers.brush.value(tile) > biomeProfile.brushThreshold,
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

function terrainKind(isWater: boolean, isBoulder: boolean, isBrush: boolean): TerrainKind {
  if (isWater) {
    return "water";
  }

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
