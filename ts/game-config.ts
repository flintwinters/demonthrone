import { NoiseLayer, SafeZone, TerrainType } from "./domain.js";
import type { BiomeKind, TerrainKind } from "./types.js";

export { enemyConfig, teammateConfigs } from "./character-config.js";
export { biomes } from "./biome-config.js";

export const worldSeed = 0x5eedf;

export const layers = {
  elevation: new NoiseLayer({ scale: 0.055, seed: worldSeed ^ 0x1234 }),
  moisture: new NoiseLayer({ scale: 0.06, seed: worldSeed ^ 0x4321 }),
  ridge: new NoiseLayer({ scale: 0.13, seed: worldSeed ^ 0x6d2b }),
  continental: new NoiseLayer({ scale: 0.001, seed: worldSeed ^ 0xcd73 }),
} satisfies Record<"elevation" | "moisture" | "ridge" | "continental", NoiseLayer>;

export const safeZones = [
  new SafeZone({ x: 5, y: 7 }, 1),
  new SafeZone({ x: 8, y: 6 }, 1),
];

export const terrainTraits = {
  floor: new TerrainType("floor", false, 1, 1),
  boulder: new TerrainType("boulder", true, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY),
  brush: new TerrainType("brush", false, 2, 1),
  ice: new TerrainType("ice", false, 0.1, 0.5),
  water: new TerrainType("water", true, 0.1, Number.POSITIVE_INFINITY),
} satisfies Record<TerrainKind, TerrainType>;

export const worldDataCacheLimit = 32768;
export const basinConfig = {
  cellSize: 10,
  radius: 6,
  depth: 1,
};

export type BiomeSample = { elevation: number; moisture: number; ridge: number; continental: number };
export type BiomeRule = { kind: BiomeKind; matches: (sample: BiomeSample) => boolean };

export const biomeRules: readonly BiomeRule[] = [
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

export const movementConfig = { maxUpwardStepHeight: 2 };

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

export const piecePickerConfig = {
  pickRadius: 30,
  minimumPickRadius: 18,
  pieceHeight: 0.3,
};

export const hydrologyConfig = { anchorCacheLimit: 2048 };

export const gameOverConfig = { revealRadius: 20 };
