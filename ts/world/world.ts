import { terrainHeight } from "../constants.js";
import type { BiomeProfile } from "../domain.js";
import { tileKey } from "../grid.js";
import { BasinField } from "./hydrology.js";
import {
  biomes,
  biomeRules,
  biomeClassification,
  basinConfig,
  landscapePaths,
  layers,
  safeZones,
  terrainTraits,
  worldDataCacheLimit,
} from "../world-config.js";
import type { BiomeKind, Terrain, TerrainKind, Tile } from "../types.js";

const worldDataCache = new Map<string, WorldTileData>();
const basinField = new BasinField(
  basinConfig.cellSize,
  basinConfig.radius,
  basinConfig.depth,
  groundHeightAt,
  (tile) => biomeAt(tile).water.value(tile),
);

type WorldTileData = {
  readonly biome: BiomeKind;
  readonly height: number;
  readonly isBoulder: boolean;
  readonly isBrush: boolean;
  readonly isWater: boolean;
  readonly isIce: boolean;
  readonly isRiver: boolean;
  readonly isWall: boolean;
  readonly terrain: Terrain;
};

type LandscapePath = { readonly isRiver: boolean; readonly wallRise: number };

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

export function isRiverTile(tile: Tile): boolean {
  return worldData(tile).isRiver;
}

export function isWallTile(tile: Tile): boolean {
  return worldData(tile).isWall;
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
  const { isRiver, wallRise } = landscapePathAt(tile, ground, isSafe);
  const isWall = wallRise > 0;
  const waterSurface = hydrologySurfaceAt(tile, isSafe || isRiver || isWall);
  const { isWater, isIce, isBoulder, isBrush } = terrainFeatures(tile, biomeProfile, waterSurface, isRiver, isWall);
  const terrain = terrainFor(terrainKind(isWater, isIce, isBoulder, isBrush), biome);

  return {
    biome,
    height: (waterSurface ?? ground) + wallRise,
    isBoulder,
    isBrush,
    isWater,
    isIce,
    isRiver,
    isWall,
    terrain,
  };
}

function landscapePathAt(tile: Tile, ground: number, isSafe: boolean): LandscapePath {
  const isRiver = !isSafe && landscapePaths.river.contains(tile);
  const wallRise = isSafe || isRiver ? 0 : wallRiseAt(tile, ground);

  return { isRiver, wallRise };
}

function wallRiseAt(tile: Tile, ground: number): number {
  if (!landscapePaths.wall.field.contains(tile)) return 0;
  const envelope = landscapePaths.wall.envelope.value(tile);
  const strength = (envelope - landscapePaths.wall.threshold) / landscapePaths.wall.taper;
  const taperedHeight = landscapePaths.wall.height * Math.max(0, Math.min(1, strength));
  const target = ground * landscapePaths.wall.terrainProportion
    + taperedHeight
    - landscapePaths.wall.subtraction.value(tile);

  return Math.max(0, Math.round(target) - ground);
}

function hydrologySurfaceAt(tile: Tile, excludesHydrology: boolean): number | null {
  return excludesHydrology ? null : basinField.surfaceAt(tile, isHydrologicallyWet);
}

function terrainFeatures(
  tile: Tile,
  biomeProfile: BiomeProfile,
  waterSurface: number | null,
  isRiver: boolean,
  isWall: boolean,
): { isWater: boolean; isIce: boolean; isBoulder: boolean; isBrush: boolean } {
  if (isRiver) {
    return { isWater: true, isIce: false, isBoulder: false, isBrush: false };
  }

  if (waterSurface !== null) {
    const isIce = biomeProfile.ice.contains(tile);

    return { isWater: !isIce, isIce, isBoulder: false, isBrush: false };
  }

  if (!isWall && biomeProfile.boulder.contains(tile)) {
    return { isWater: false, isIce: false, isBoulder: true, isBrush: false };
  }

  return {
    isWater: false,
    isIce: false,
    isBoulder: false,
    isBrush: !isWall && biomeProfile.brush.contains(tile),
  };
}

function isHydrologicallyWet(tile: Tile): boolean {
  const biome = biomeAt(tile);

  return biome.water.contains(tile);
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
  const continental = layers.continental.value(tile);
  const sample = { elevation, moisture, ridge, continental };

  return biomeRules.find((rule) => rule.matches(sample))?.kind
    ?? (moisture < biomeClassification.fallbackMoistureThreshold ? "cinder" : "heath");
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
  const range = terrainHeight.mappingMax - terrainHeight.mappingMin;
  const value = contrastHeight(biomeProfile.height.value(tile));

  return terrainHeight.mappingMin + Math.round(value * range);
}

function groundHeightAt(tile: Tile): number {
  return heightAt(tile, biomeAt(tile));
}

function biomeAt(tile: Tile): BiomeProfile {
  return biomes[classifyBiome(tile)];
}

function contrastHeight(value: number): number {
  return 0.5 + (value - 0.5) * terrainHeight.contrast;
}

function isSafeTile(tile: Tile): boolean {
  return safeZones.some((zone) => zone.contains(tile));
}
