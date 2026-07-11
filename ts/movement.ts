import { cardinalDirections, neighborTile, tileKey } from "./grid.js";
import { movementConfig } from "./world-config.js";
import type { Tile, TileHeight, TileMovementCost, TilePredicate } from "./types.js";

type FrontierEntry = {
  tile: Tile;
  cost: number;
};

export function canReachTile(
  start: Tile,
  target: Tile,
  limit: number,
  isBlockedTile: TilePredicate,
  tileHeight: TileHeight,
  movementCost: TileMovementCost,
): boolean {
  return reachableTileKeys(start, limit, isBlockedTile, tileHeight, movementCost).has(tileKey(target));
}

export function reachableTileKeys(
  start: Tile,
  limit: number,
  isBlockedTile: TilePredicate,
  tileHeight: TileHeight,
  movementCost: TileMovementCost,
): Set<string> {
  const frontier: FrontierEntry[] = [{ tile: start, cost: 0 }];
  const bestCosts = new Map([[tileKey(start), 0]]);

  while (frontier.length > 0) {
    const current = takeCheapest(frontier);

    appendReachableNeighbors(current, limit, isBlockedTile, tileHeight, movementCost, bestCosts, frontier);
  }
  bestCosts.delete(tileKey(start));
  return new Set(bestCosts.keys());
}

export function movementStepCost(
  previous: Tile,
  tile: Tile,
  tileHeight: TileHeight,
  movementCost: TileMovementCost,
): number {
  const heightDelta = tileHeight(tile) - tileHeight(previous);

  return movementCost(tile) * 2 ** heightDelta;
}

function appendReachableNeighbors(
  current: FrontierEntry,
  limit: number,
  isBlockedTile: TilePredicate,
  tileHeight: TileHeight,
  movementCost: TileMovementCost,
  bestCosts: Map<string, number>,
  frontier: FrontierEntry[],
): void {
  for (const direction of cardinalDirections) {
    const tile = neighborTile(current.tile, direction);
    const cost = current.cost + movementStepCost(current.tile, tile, tileHeight, movementCost);

    if (isReachableStep(current.tile, tile, cost, limit, isBlockedTile, tileHeight, bestCosts)) {
      bestCosts.set(tileKey(tile), cost);
      frontier.push({ tile, cost });
    }
  }
}

function isReachableStep(
  previous: Tile,
  tile: Tile,
  cost: number,
  limit: number,
  isBlockedTile: TilePredicate,
  tileHeight: TileHeight,
  bestCosts: Map<string, number>,
): boolean {
  return cost <= limit
    && cost < (bestCosts.get(tileKey(tile)) ?? Number.POSITIVE_INFINITY)
    && !isBlockedTile(tile)
    && tileHeight(tile) - tileHeight(previous) <= movementConfig.maxUpwardStepHeight;
}

function takeCheapest(frontier: FrontierEntry[]): FrontierEntry {
  let cheapestIndex = 0;

  for (let index = 1; index < frontier.length; index += 1) {
    if (frontier[index].cost < frontier[cheapestIndex].cost) {
      cheapestIndex = index;
    }
  }

  return frontier.splice(cheapestIndex, 1)[0];
}
