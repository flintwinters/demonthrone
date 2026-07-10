import { perlinNoise2d } from "./noise.js";
import { terrainHeight } from "./constants.js";
import { l1Distance } from "./grid.js";
import type { BiomeKind, Terrain, TerrainKind, Tile } from "./types.js";

type NoiseLayer = {
  scale: number;
  seed: number;
};

type SafeZone = Tile & {
  radius: number;
};

type Biome = {
  kind: BiomeKind;
  heightBias: number;
  ruggedness: number;
  boulderThreshold: number;
  brushThreshold: number;
  brushSightCost: number;
};

const worldSeed = 0x5eed;
const layers = {
  elevation: { scale: 0.055, seed: worldSeed ^ 0x1234 },
  moisture: { scale: 0.06, seed: worldSeed ^ 0x4321 },
  ridge: { scale: 0.13, seed: worldSeed ^ 0x6d2b },
  detail: { scale: 0.24, seed: worldSeed ^ 0x1f91 },
  boulder: { scale: 0.23, seed: worldSeed ^ 0x2b0d },
  brush: { scale: 0.31, seed: worldSeed ^ 0x4b1d },
};
const safeZones: SafeZone[] = [
  { x: 5, y: 7, radius: 1 },
  { x: 8, y: 6, radius: 1 },
];
const biomes = {
  cinder: {
    kind: "cinder",
    heightBias: -0.04,
    ruggedness: 0.2,
    boulderThreshold: 0.58,
    brushThreshold: 0.78,
    brushSightCost: 2,
  },
  fen: {
    kind: "fen",
    heightBias: -0.16,
    ruggedness: 0.12,
    boulderThreshold: 0.76,
    brushThreshold: 0.5,
    brushSightCost: 3,
  },
  heath: {
    kind: "heath",
    heightBias: 0,
    ruggedness: 0.18,
    boulderThreshold: 0.66,
    brushThreshold: 0.62,
    brushSightCost: 2,
  },
  ridge: {
    kind: "ridge",
    heightBias: 0.18,
    ruggedness: 0.34,
    boulderThreshold: 0.53,
    brushThreshold: 0.72,
    brushSightCost: 2,
  },
} satisfies Record<BiomeKind, Biome>;
const terrainTraits = {
  floor: {
    kind: "floor",
    blocksMovement: false,
    blocksSight: false,
    sightCost: 1,
  },
  boulder: {
    kind: "boulder",
    blocksMovement: true,
    blocksSight: true,
    sightCost: Number.POSITIVE_INFINITY,
  },
  brush: {
    kind: "brush",
    blocksMovement: false,
    blocksSight: false,
    sightCost: 2,
  },
} satisfies Record<TerrainKind, Omit<Terrain, "biome">>;

export function tileTerrain(tile: Tile): Terrain {
  const biome = tileBiome(tile);

  if (isSafeTile(tile)) {
    return terrainFor("floor", biome);
  }

  if (isBoulderTile(tile)) {
    return terrainFor("boulder", biome);
  }

  return terrainFor(isBrushTile(tile) ? "brush" : "floor", biome);
}

export function isObstacleTile(tile: Tile): boolean {
  return tileTerrain(tile).blocksMovement;
}

export function isSightBlockingTile(tile: Tile): boolean {
  return tileTerrain(tile).blocksSight;
}

export function sightCost(tile: Tile): number {
  return tileTerrain(tile).sightCost;
}

export function tileBiome(tile: Tile): BiomeKind {
  const elevation = noise(tile, layers.elevation);
  const moisture = noise(tile, layers.moisture);
  const ridge = noise(tile, layers.ridge);

  if (elevation > 0.66 || ridge > 0.72) {
    return "ridge";
  }

  if (moisture > 0.62 && elevation < 0.58) {
    return "fen";
  }

  return moisture < 0.35 ? "cinder" : "heath";
}

export function isBoulderTile(tile: Tile): boolean {
  return !isSafeTile(tile) && noise(tile, layers.boulder) > biome(tile).boulderThreshold;
}

export function isBrushTile(tile: Tile): boolean {
  return !isSafeTile(tile) && !isBoulderTile(tile) && noise(tile, layers.brush) > biome(tile).brushThreshold;
}

export function tileHeight(tile: Tile): number {
  const trait = biome(tile);
  const range = terrainHeight.max - terrainHeight.min;
  const value = heightValue(tile, trait);

  return terrainHeight.min + Math.round(clamp(value) * range);
}

function terrainFor(kind: TerrainKind, biomeKind: BiomeKind): Terrain {
  const trait = terrainTraits[kind];
  const sightCost = kind === "brush" ? biomes[biomeKind].brushSightCost : trait.sightCost;

  return { ...trait, biome: biomeKind, sightCost };
}

function heightValue(tile: Tile, trait: Biome): number {
  const elevation = noise(tile, layers.elevation);
  const detail = noise(tile, layers.detail) - 0.5;

  return elevation + detail * trait.ruggedness + trait.heightBias;
}

function biome(tile: Tile): Biome {
  return biomes[tileBiome(tile)];
}

function noise(tile: Tile, layer: NoiseLayer): number {
  return perlinNoise2d(tile.x * layer.scale, tile.y * layer.scale, layer.seed);
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function isSafeTile(tile: Tile): boolean {
  return safeZones.some((zone) => l1Distance(tile, zone) <= zone.radius);
}
