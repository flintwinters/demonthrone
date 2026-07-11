import { colors } from "./constants.js";
import { BiomeProfile, HeightComponent, HeightProfile, NoiseLayer, SafeZone, TerrainType } from "./domain.js";
export const worldSeed = 0x5eed;
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
};
export const terrainTraits = {
    floor: new TerrainType("floor", false, 1, 1),
    boulder: new TerrainType("boulder", true, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY),
    brush: new TerrainType("brush", false, 2, 1),
    ice: new TerrainType("ice", false, 0.1, 0.5),
    water: new TerrainType("water", true, 0.1, Number.POSITIVE_INFINITY),
};
export const worldDataCacheLimit = 32768;
export const basinConfig = {
    cellSize: 10,
    radius: 6,
    depth: 1,
    iceThreshold: 0.55,
};
export const biomeRules = [
    { kind: "mesa", matches: ({ continental, ridge }) => continental > 0.72 && ridge > 0.52 },
    { kind: "ridge", matches: ({ elevation, ridge }) => elevation > 0.66 || ridge > 0.72 },
    {
        kind: "bog",
        matches: ({ moisture, elevation, continental }) => moisture > 0.72 && elevation < 0.58 && continental < 0.3,
    },
    { kind: "fen", matches: ({ moisture, elevation }) => moisture > 0.62 && elevation < 0.58 },
];
export const biomeClassification = {
    fallbackMoistureThreshold: 0.35,
};
export const entityGeneration = {
    radius: 12,
    pushable: {
        noise: { scale: 0.17, seed: 0x63726174 },
        threshold: 0.7,
    },
    enemy: {
        noise: { scale: 0.1, seed: 0x6e6d79 },
        threshold: 0.65,
    },
};
export const teammateConfigs = [
    {
        id: "vanguard",
        type: "vanguard",
        spawn: { x: 5, y: 7 },
        color: colors.unitOne,
        stats: {
            sight: 50,
            movement: 3,
            attackRange: 1,
            health: 1,
        },
    },
    {
        id: "warden",
        type: "warden",
        spawn: { x: 8, y: 6 },
        color: colors.unitTwo,
        stats: {
            sight: 50,
            movement: 3,
            attackRange: 1,
            health: 1,
        },
    },
];
export const enemyConfig = {
    type: "pursuer",
    color: colors.enemy,
    stats: {
        sight: 5,
        movement: 1,
        attackRange: 1,
        health: 1,
    },
};
export const movementConfig = { maxUpwardStepHeight: 2 };
export const pushableConfig = {
    maxUpwardPushHeight: 2,
    health: 3,
    type: "crate",
};
export const terrainPropConfig = {
    foliageHeightSeed: 0x6419,
    minimumFoliageScale: 0.65,
    foliageScaleRange: 0.7,
};
export const piecePickerConfig = {
    pickRadius: 30,
    minimumPickRadius: 18,
    pieceHeight: 0.3,
};
export const hydrologyConfig = { anchorCacheLimit: 2048 };
function biome(kind, profile, boulder, brush, sight, water) {
    return new BiomeProfile(kind, profile, boulder, brush, sight, water);
}
function height(base, components) {
    return new HeightProfile(base, components);
}
