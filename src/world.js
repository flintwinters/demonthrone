import { terrainHeight } from "./constants.js";
import { BiomeProfile, HeightComponent, HeightProfile, NoiseLayer, SafeZone, TerrainType } from "./domain.js";
const worldSeed = 0x5eed;
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
};
const terrainTraits = {
    floor: new TerrainType("floor", false, 1),
    boulder: new TerrainType("boulder", true, Number.POSITIVE_INFINITY),
    brush: new TerrainType("brush", false, 2),
};
export function tileTerrain(tile) {
    const biome = tileBiome(tile);
    if (isSafeTile(tile)) {
        return terrainFor("floor", biome);
    }
    if (isBoulderTile(tile)) {
        return terrainFor("boulder", biome);
    }
    return terrainFor(isBrushTile(tile) ? "brush" : "floor", biome);
}
export function isObstacleTile(tile) {
    return tileTerrain(tile).blocksMovement;
}
export function sightCost(tile) {
    return tileTerrain(tile).sightCost;
}
export function tileBiome(tile) {
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
export function isBoulderTile(tile) {
    return !isSafeTile(tile) && layers.boulder.value(tile) > biomeAt(tile).boulderThreshold;
}
export function isBrushTile(tile) {
    return !isSafeTile(tile) && !isBoulderTile(tile) && layers.brush.value(tile) > biomeAt(tile).brushThreshold;
}
export function tileHeight(tile) {
    const range = terrainHeight.max - terrainHeight.min;
    const value = biomeAt(tile).height.value(tile);
    return terrainHeight.min + Math.round(clamp(value) * range);
}
function terrainFor(kind, biomeKind) {
    return terrainTraits[kind].terrain(biomes[biomeKind]);
}
function biome(kind, profile, boulder, brush, sight) {
    return new BiomeProfile(kind, profile, boulder, brush, sight);
}
function height(base, components) {
    return new HeightProfile(base, components);
}
function biomeAt(tile) {
    return biomes[tileBiome(tile)];
}
function clamp(value) {
    return Math.max(0, Math.min(1, value));
}
function isSafeTile(tile) {
    return safeZones.some((zone) => zone.contains(tile));
}
