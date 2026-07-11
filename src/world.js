import { terrainHeight } from "./constants.js";
import { tileKey } from "./grid.js";
import { biomes, layers, safeZones, terrainTraits } from "./world-config.js";
const worldDataCacheLimit = 8192;
const worldDataCache = new Map();
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
export function tileHeight(tile) {
    return worldData(tile).height;
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
    const isSafe = isSafeTile(tile);
    const { isWater, isIce, isBoulder, isBrush } = terrainFeatures(tile, biomeProfile, isSafe);
    const terrain = terrainFor(terrainKind(isWater, isIce, isBoulder, isBrush), biome);
    return {
        biome,
        height: isWater || isIce ? terrainHeight.min : heightAt(tile, biomeProfile),
        isBoulder,
        isBrush,
        isWater,
        isIce,
        terrain,
    };
}
function terrainFeatures(tile, biomeProfile, isSafe) {
    if (isSafe) {
        return { isWater: false, isIce: false, isBoulder: false, isBrush: false };
    }
    if (layers.water.value(tile) > biomeProfile.waterThreshold) {
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
    if (elevation > 0.66 || ridge > 0.72) {
        return "ridge";
    }
    if (moisture > 0.62 && elevation < 0.58) {
        return "fen";
    }
    return moisture < 0.35 ? "cinder" : "heath";
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
    const range = terrainHeight.max - terrainHeight.min;
    const value = biomeProfile.height.value(tile);
    return terrainHeight.min + Math.round(clamp(value) * range);
}
function clamp(value) {
    return Math.max(0, Math.min(1, value));
}
function isSafeTile(tile) {
    return safeZones.some((zone) => zone.contains(tile));
}
