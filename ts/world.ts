import { perlinNoise2d } from "./noise.js";
import { terrainHeight } from "./constants.js";
import type { Tile } from "./types.js";

type Terrain = {
  kind: "floor" | "boulder";
  blocksMovement: boolean;
  blocksSight: boolean;
};

type SafeZone = Tile & {
  radius: number;
};

const worldSeed = 0x5eed;
const boulderLayer = {
  scale: 0.23,
  threshold: 0.66,
};
const heightLayer = {
  scale: 0.12,
  seed: worldSeed ^ 0x1234,
};
const safeZones: SafeZone[] = [
  { x: 5, y: 7, radius: 1 },
  { x: 8, y: 6, radius: 1 },
];
const terrain = {
  floor: {
    kind: "floor",
    blocksMovement: false,
    blocksSight: false,
  },
  boulder: {
    kind: "boulder",
    blocksMovement: true,
    blocksSight: true,
  },
} satisfies Record<string, Terrain>;

export function tileTerrain(tile: Tile): Terrain {
  if (isSafeTile(tile)) {
    return terrain.floor;
  }

  return isBoulderTile(tile) ? terrain.boulder : terrain.floor;
}

export function isObstacleTile(tile: Tile): boolean {
  return tileTerrain(tile).blocksMovement;
}

export function isSightBlockingTile(tile: Tile): boolean {
  return tileTerrain(tile).blocksSight;
}

export function isBoulderTile(tile: Tile): boolean {
  return boulderNoise(tile) > boulderLayer.threshold;
}

export function tileHeight(tile: Tile): number {
  const range = terrainHeight.max - terrainHeight.min;
  const value = perlinNoise2d(tile.x * heightLayer.scale, tile.y * heightLayer.scale, heightLayer.seed);

  return terrainHeight.min + Math.round(value * range);
}

function boulderNoise(tile: Tile): number {
  return perlinNoise2d(tile.x * boulderLayer.scale, tile.y * boulderLayer.scale, worldSeed);
}

function isSafeTile(tile: Tile): boolean {
  return safeZones.some((zone) => l1Distance(tile, zone) <= zone.radius);
}

function l1Distance(first: Tile, second: Tile): number {
  return Math.abs(first.x - second.x) + Math.abs(first.y - second.y);
}
