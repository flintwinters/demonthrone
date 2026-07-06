import { l1Distance } from "./visibility.js";
import type { Tile, TilePredicate } from "./types.js";

const directions = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

export function canReachTile(start: Tile, target: Tile, limit: number, isBlockedTile: TilePredicate): boolean {
  let frontier = [start];
  const visited = new Set([tileKey(start)]);

  if (l1Distance(start, target) === 0 || l1Distance(start, target) > limit) {
    return false;
  }

  for (let distance = 0; distance < limit; distance += 1) {
    frontier = nextFrontier(frontier, target, limit, isBlockedTile, visited);

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
  visited: Set<string>,
): Tile[] {
  const next: Tile[] = [];

  for (const tile of frontier) {
    appendNeighbors(tile, target, limit, isBlockedTile, visited, next);
  }

  return next;
}

function appendNeighbors(
  tile: Tile,
  target: Tile,
  limit: number,
  isBlockedTile: TilePredicate,
  visited: Set<string>,
  next: Tile[],
): void {
  for (const direction of directions) {
    appendReachableTile(
      { x: tile.x + direction.x, y: tile.y + direction.y },
      target,
      limit,
      isBlockedTile,
      visited,
      next,
    );
  }
}

function appendReachableTile(
  tile: Tile,
  target: Tile,
  limit: number,
  isBlockedTile: TilePredicate,
  visited: Set<string>,
  next: Tile[],
): void {
  const key = tileKey(tile);

  if (visited.has(key) || l1Distance(tile, target) > limit || isBlockedTile(tile)) {
    return;
  }

  visited.add(key);
  next.push(tile);
}

function tileKey(tile: Tile): string {
  return `${tile.x}:${tile.y}`;
}
