import type { Tile, TileSightCost, Unit } from "./types.js";

export function isVisibleTile(tile: Tile, units: Unit[], sightCost: TileSightCost): boolean {
  return units.some((unit) => canUnitSeeTile(unit, tile, sightCost));
}

export function l1Distance(first: Tile, second: Tile): number {
  return Math.abs(first.x - second.x) + Math.abs(first.y - second.y);
}

function canUnitSeeTile(unit: Unit, tile: Tile, sightCost: TileSightCost): boolean {
  return sightDistance(unit, tile, sightCost) <= unit.lineOfSight;
}

function sightDistance(start: Tile, end: Tile, sightCost: TileSightCost): number {
  const steps = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y));
  let cost = l1Distance(start, end);

  for (let step = 1; step < steps; step += 1) {
    cost += sightCost(linePoint(start, end, step, steps)) - 1;
  }

  return cost;
}

function linePoint(start: Tile, end: Tile, step: number, steps: number): Tile {
  return {
    x: Math.round(start.x + (end.x - start.x) * step / steps),
    y: Math.round(start.y + (end.y - start.y) * step / steps),
  };
}
