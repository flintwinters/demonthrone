import { l1Distance } from "./grid.js";
import type { Tile, TileHeight, TilePredicate, TileSightCost } from "./types.js";

const downhillDistanceDiscount = 0.25;
const uphillHeightPenalty = 1;

export function lineSightCost(
  start: Tile,
  end: Tile,
  sightCost: TileSightCost,
  tileHeight: TileHeight,
  isSightBlocked: TilePredicate,
): number {
  const steps = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y));
  let cost = 0;
  let previous = start;

  for (let step = 1; step <= steps; step += 1) {
    const current = linePoint(start, end, step, steps);

    cost += segmentSightCost(previous, current, tileHeight);

    if (step < steps) {
      if (isSightBlocked(current)) {
        return Number.POSITIVE_INFINITY;
      }

      cost += sightCost(current) - 1;
    }

    previous = current;
  }

  return cost;
}

export function sightSearchRadius(lineOfSight: number): number {
  return Math.ceil(lineOfSight / (1 - downhillDistanceDiscount));
}

function segmentSightCost(start: Tile, end: Tile, tileHeight: TileHeight): number {
  const distance = l1Distance(start, end);
  const heightDelta = tileHeight(end) - tileHeight(start);

  if (heightDelta > 0) {
    return distance + heightDelta * uphillHeightPenalty;
  }

  if (heightDelta < 0) {
    return distance * (1 - downhillDistanceDiscount);
  }

  return distance;
}

function linePoint(start: Tile, end: Tile, step: number, steps: number): Tile {
  return {
    x: Math.round(start.x + (end.x - start.x) * step / steps),
    y: Math.round(start.y + (end.y - start.y) * step / steps),
  };
}
