import type { NoiseLayer } from "./domain.js";
import type { Tile, TilePredicate } from "./types.js";

export type TileBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

export const entitySpawnBounds: TileBounds = {
  minX: 0,
  maxX: 13,
  minY: 0,
  maxY: 13,
};

export function perlinPlacementTiles(
  count: number,
  bounds: TileBounds,
  noise: NoiseLayer,
  isAvailable: TilePredicate,
): Tile[] {
  const candidates = tilesIn(bounds)
    .filter(isAvailable)
    .map((tile) => ({ tile, value: noise.value(tile) }))
    .sort(compareCandidates);

  if (candidates.length < count) {
    throw new Error(`Unable to place ${count} entities in ${candidates.length} available tiles.`);
  }

  return candidates.slice(0, count).map((candidate) => candidate.tile);
}

function tilesIn(bounds: TileBounds): Tile[] {
  const tiles: Tile[] = [];

  for (let y = bounds.minY; y <= bounds.maxY; y += 1) {
    for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
      tiles.push({ x, y });
    }
  }

  return tiles;
}

function compareCandidates(
  first: { tile: Tile; value: number },
  second: { tile: Tile; value: number },
): number {
  return second.value - first.value
    || first.tile.y - second.tile.y
    || first.tile.x - second.tile.x;
}
