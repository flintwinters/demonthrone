import { cardinalDirections, neighborTile, sameTile, tileKey } from "./grid.js";
import type { Tile, TileHeight, TileMovementCost, TilePredicate } from "./types.js";

const maxUpwardStepHeight = 2;

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
  const frontier: FrontierEntry[] = [{ tile: start, cost: 0 }];
  const bestCosts = new Map([[tileKey(start), 0]]);

  while (frontier.length > 0) {
    const current = takeCheapest(frontier);

    if (sameTile(current.tile, target)) {
      return current.cost > 0;
    }

    appendReachableNeighbors(current, limit, isBlockedTile, tileHeight, movementCost, bestCosts, frontier);
  }

  return false;
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
    const cost = current.cost + movementCost(tile);

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
    && tileHeight(tile) - tileHeight(previous) <= maxUpwardStepHeight;
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
