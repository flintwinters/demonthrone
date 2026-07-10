import { l1Distance, tileKey } from "./grid.js";
import type { Tile, TileHeight, TilePredicate } from "./types.js";

const maxUpwardStepHeight = 2;

const directions = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

export function canReachTile(
  start: Tile,
  target: Tile,
  limit: number,
  isBlockedTile: TilePredicate,
  tileHeight: TileHeight,
): boolean {
  let frontier = [start];
  const visited = new Set([tileKey(start)]);

  if (l1Distance(start, target) === 0 || l1Distance(start, target) > limit) {
    return false;
  }

  for (let distance = 0; distance < limit; distance += 1) {
    frontier = nextFrontier(frontier, target, limit, isBlockedTile, tileHeight, visited);

    if (visited.has(tileKey(target))) {
      return true;
    }
  }

  return false;
}

function nextFrontier(
  frontier: Tile[],
  target: Tile,
  limit: number,
  isBlockedTile: TilePredicate,
  tileHeight: TileHeight,
  visited: Set<string>,
): Tile[] {
  const next: Tile[] = [];

  for (const tile of frontier) {
    appendNeighbors(tile, target, limit, isBlockedTile, tileHeight, visited, next);
  }

  return next;
}

function appendNeighbors(
  tile: Tile,
  target: Tile,
  limit: number,
  isBlockedTile: TilePredicate,
  tileHeight: TileHeight,
  visited: Set<string>,
  next: Tile[],
): void {
  for (const direction of directions) {
    appendReachableTile(
      tile,
      { x: tile.x + direction.x, y: tile.y + direction.y },
      target,
      limit,
      isBlockedTile,
      tileHeight,
      visited,
      next,
    );
  }
}

function appendReachableTile(
  previous: Tile,
  tile: Tile,
  target: Tile,
  limit: number,
  isBlockedTile: TilePredicate,
  tileHeight: TileHeight,
  visited: Set<string>,
  next: Tile[],
): void {
  const key = tileKey(tile);

  if (!isReachableStep(previous, tile, target, limit, isBlockedTile, tileHeight, key, visited)) {
    return;
  }

  visited.add(key);
  next.push(tile);
}

function isReachableStep(
  previous: Tile,
  tile: Tile,
  target: Tile,
  limit: number,
  isBlockedTile: TilePredicate,
  tileHeight: TileHeight,
  key: string,
  visited: Set<string>,
): boolean {
  return !visited.has(key)
    && l1Distance(tile, target) <= limit
    && !isBlockedTile(tile)
    && tileHeight(tile) - tileHeight(previous) <= maxUpwardStepHeight;
}
