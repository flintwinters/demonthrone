import { l1Distance, tileKey } from "./grid.js";
import { sightSearchRadius } from "./sight-cost.js";
import { canUnitSeeTile, sightContext, type SightContext } from "./visibility.js";
import type { SightBlocker, Tile, TileHeight, TilePredicate, TileSightCost, Unit } from "./types.js";

export function visibleTiles(
  units: Unit[],
  sightBlockers: SightBlocker[],
  sightCost: TileSightCost,
  tileHeight: TileHeight,
  isBoulderTile: TilePredicate,
): Tile[] {
  const seen = new Set<string>();
  const tiles: Tile[] = [];
  const context = sightContext(sightBlockers, sightCost, tileHeight, isBoulderTile);

  for (const unit of units) {
    appendVisibleTiles(unit, context, seen, tiles);
  }

  return tiles;
}

function appendVisibleTiles(
  unit: Unit,
  context: SightContext,
  seen: Set<string>,
  tiles: Tile[],
): void {
  const radius = sightSearchRadius(unit.sight);

  for (let y = unit.y - radius; y <= unit.y + radius; y += 1) {
    appendVisibleRow(unit, context, y, radius, seen, tiles);
  }
}

function appendVisibleRow(
  unit: Unit,
  context: SightContext,
  y: number,
  radius: number,
  seen: Set<string>,
  tiles: Tile[],
): void {
  for (let x = unit.x - radius; x <= unit.x + radius; x += 1) {
    appendVisibleTile(unit, context, { x, y }, radius, seen, tiles);
  }
}

function appendVisibleTile(
  unit: Unit,
  context: SightContext,
  tile: Tile,
  radius: number,
  seen: Set<string>,
  tiles: Tile[],
): void {
  const key = tileKey(tile);

  if (seen.has(key) || l1Distance(unit, tile) > radius) {
    return;
  }

  if (!canUnitSeeTile(unit, tile, context)) {
    return;
  }

  seen.add(key);
  tiles.push(tile);
}
