import { ContourPathField, NoiseLayer, SafeZone, TerrainType } from "./domain.js";
import { createBiomes } from "./biome-config.js";
export { enemyConfigs, teammateConfigs } from "./character-config.js";
export const worldSeed = 0x5eedf;
export const elevationConfig = {
    layers: [
        { wavelength: 84, amplitude: 5, seed: worldSeed ^ 0xcd73, sample: "centered" },
        { wavelength: 14, amplitude: 0.65, seed: worldSeed ^ 0x1234, sample: "linear" },
        { wavelength: 4, amplitude: 0.2, seed: worldSeed ^ 0xa713, sample: "centered" },
    ],
};
export const biomes = createBiomes(worldSeed, elevationConfig.layers);
export const layers = {
    elevation: new NoiseLayer({ scale: 0.055, magnitude: 1, seed: worldSeed ^ 0x1234 }),
    moisture: new NoiseLayer({ scale: 0.06, magnitude: 1, seed: worldSeed ^ 0x4321 }),
    ridge: new NoiseLayer({ scale: 0.13, magnitude: 1, seed: worldSeed ^ 0x6d2b }),
    continental: new NoiseLayer({ scale: 0.01, magnitude: 2, seed: worldSeed ^ 0xcd73 }),
};
export const safeZones = [
    new SafeZone({ x: 5, y: 7 }, 1),
    new SafeZone({ x: 8, y: 6 }, 1),
];
export const landscapePaths = {
    river: new ContourPathField({
        scale: 0.018,
        magnitude: 1,
        seed: worldSeed ^ 0x72697672,
        center: 0.5,
        halfWidth: 0.024,
    }),
    wall: {
        field: new ContourPathField({
            scale: 0.027,
            magnitude: 1,
            seed: worldSeed ^ 0x77616c6c,
            center: 0.675,
            halfWidth: 0.025,
        }),
        envelope: new NoiseLayer({
            scale: 0.008,
            magnitude: 1,
            seed: worldSeed ^ 0x656e6473,
        }),
        subtraction: new NoiseLayer({
            scale: 0.041,
            magnitude: 4,
            seed: worldSeed ^ 0x73756274,
        }),
        threshold: 0.46,
        taper: 0.12,
        terrainProportion: 0.35,
        height: 12,
        riseScale: 0.5,
    },
};
export const terrainTraits = {
    floor: new TerrainType("floor", false, 1, 1),
    boulder: new TerrainType("boulder", true, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY),
    brush: new TerrainType("brush", false, 2, 1),
    ice: new TerrainType("ice", false, 0.1, 0.5),
    water: new TerrainType("water", false, 0.1, 10),
};
export const worldDataCacheLimit = 32768;
export const basinConfig = {
    cellSize: 10,
    radius: 6,
    depth: 1,
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
        noise: { scale: 0.17, magnitude: 1, seed: 0x63726174 },
        threshold: 0.7,
    },
    enemy: {
        pursuer: {
            noise: { scale: 0.1, magnitude: 1, seed: 0x6e6d79 },
            threshold: 0.65,
        },
        nephilim: {
            noise: { scale: 0.08, magnitude: 1, seed: 0x6e71a4db },
            threshold: 0.68,
        },
    },
};
export const movementConfig = { maxUpwardStepHeight: 2 };
export const lineOfSightConfig = {
    visionHeightMultiplier: 1,
    attackHeightMultiplier: 1,
    enemySightCostMultiplier: 3,
};
export const pushableConfig = {
    maxUpwardPushHeight: 2,
    health: 3,
    type: "crate",
};
export const terrainPropConfig = {
    foliageHeightSeed: 0x6419,
    minimumFoliageScale: 0.65,
    foliageScaleRange: 2,
};
export const wallStyleConfig = {
    shadeSeed: worldSeed ^ 0x62726974,
    shadeVariation: 0.14,
};
export const piecePickerConfig = {
    pickRadius: 30,
    minimumPickRadius: 18,
    pieceHeight: 0.3,
};
export const hydrologyConfig = { anchorCacheLimit: 2048 };
export const gameOverConfig = { revealRadius: 20 };
