import { terrainHeight } from "../constants.js";
import { tileKey } from "../grid.js";
import { BasinField } from "./hydrology.js";
import { biomes, biomeRules, biomeClassification, basinConfig, landscapePaths, layers, safeZones, terrainTraits, worldDataCacheLimit, } from "../world-config.js";
const worldDataCache = new Map();
const basinField = new BasinField(basinConfig.cellSize, basinConfig.radius, basinConfig.depth, groundHeightAt, (tile) => biomeAt(tile).water.value(tile));
export function tileTerrain(tile) {
    return { ...worldData(tile).terrain };
}
export function isObstacleTile(tile) {
    return worldData(tile).terrain.blocksMovement;
}
export function sightCost(tile) {
    return worldData(tile).terrain.sightCost;
}
export function movementCost(tile) {
    return worldData(tile).terrain.movementCost;
}
export function tileBiome(tile) {
    return worldData(tile).biome;
}
export function isBoulderTile(tile) {
    return worldData(tile).isBoulder;
}
export function isBrushTile(tile) {
    return worldData(tile).isBrush;
}
export function isWaterTile(tile) {
    return worldData(tile).isWater;
}
export function isIceTile(tile) {
    return worldData(tile).isIce;
}
export function isRiverTile(tile) {
    return worldData(tile).isRiver;
}
export function isWallTile(tile) {
    return worldData(tile).isWall;
}
export function tileHeight(tile) {
    return worldData(tile).height;
}
export function groundHeight(tile) {
    return groundHeightAt(tile);
}
function terrainFor(kind, biomeKind) {
    return terrainTraits[kind].terrain(biomes[biomeKind]);
}
function worldData(tile) {
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
function createWorldData(tile) {
    const biome = classifyBiome(tile);
    const biomeProfile = biomes[biome];
    const ground = heightAt(tile, biomeProfile);
    const isSafe = isSafeTile(tile);
    const { isRiver, wallHeight } = landscapePathAt(tile, isSafe);
    const isWall = wallHeight > 0;
    const waterSurface = hydrologySurfaceAt(tile, isSafe || isRiver || isWall);
    const { isWater, isIce, isBoulder, isBrush } = terrainFeatures(tile, biomeProfile, waterSurface, isRiver, isWall);
    const terrain = terrainFor(terrainKind(isWater, isIce, isBoulder, isBrush), biome);
    return {
        biome,
        height: (waterSurface ?? ground) + wallHeight,
        isBoulder,
        isBrush,
        isWater,
        isIce,
        isRiver,
        isWall,
        terrain,
    };
}
function landscapePathAt(tile, isSafe) {
    const isRiver = !isSafe && landscapePaths.river.contains(tile);
    const wallHeight = isSafe || isRiver ? 0 : wallHeightAt(tile);
    return { isRiver, wallHeight };
}
function wallHeightAt(tile) {
    if (!landscapePaths.wall.field.contains(tile))
        return 0;
    const envelope = landscapePaths.wall.envelope.value(tile);
    const strength = (envelope - landscapePaths.wall.threshold) / landscapePaths.wall.taper;
    return Math.round(landscapePaths.wall.height * Math.max(0, Math.min(1, strength)));
}
function hydrologySurfaceAt(tile, excludesHydrology) {
    return excludesHydrology ? null : basinField.surfaceAt(tile, isHydrologicallyWet);
}
function terrainFeatures(tile, biomeProfile, waterSurface, isRiver, isWall) {
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
function isHydrologicallyWet(tile) {
    const biome = biomeAt(tile);
    return biome.water.contains(tile);
}
function cacheWorldData(key, data) {
    if (worldDataCache.size >= worldDataCacheLimit) {
        const oldestKey = worldDataCache.keys().next().value;
        if (oldestKey !== undefined) {
            worldDataCache.delete(oldestKey);
        }
    }
    worldDataCache.set(key, data);
}
function classifyBiome(tile) {
    const elevation = layers.elevation.value(tile);
    const moisture = layers.moisture.value(tile);
    const ridge = layers.ridge.value(tile);
    const continental = layers.continental.value(tile);
    const sample = { elevation, moisture, ridge, continental };
    return biomeRules.find((rule) => rule.matches(sample))?.kind
        ?? (moisture < biomeClassification.fallbackMoistureThreshold ? "cinder" : "heath");
}
function terrainKind(isWater, isIce, isBoulder, isBrush) {
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
function heightAt(tile, biomeProfile) {
    const range = terrainHeight.mappingMax - terrainHeight.mappingMin;
    const value = contrastHeight(biomeProfile.height.value(tile));
    return terrainHeight.mappingMin + Math.round(value * range);
}
function groundHeightAt(tile) {
    return heightAt(tile, biomeAt(tile));
}
function biomeAt(tile) {
    return biomes[classifyBiome(tile)];
}
function contrastHeight(value) {
    return 0.5 + (value - 0.5) * terrainHeight.contrast;
}
function isSafeTile(tile) {
    return safeZones.some((zone) => zone.contains(tile));
}
