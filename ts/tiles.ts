import { l1Distance, tileKey } from "./grid.js";
import { sightSearchRadius } from "./sight-cost.js";
import { isVisibleTile } from "./visibility.js";
import type { Tile, TileHeight, TileSightCost, Unit } from "./types.js";

export function visibleTiles(
  units: Unit[],
  sightBlockers: Tile[],
  sightCost: TileSightCost,
  tileHeight: TileHeight,
): Tile[] {
  const seen = new Set<string>();
  const tiles: Tile[] = [];

  for (const unit of units) {
    appendVisibleTiles(unit, units, sightBlockers, sightCost, tileHeight, seen, tiles);
  }

  return tiles;
}

function appendVisibleTiles(
  unit: Unit,
  units: Unit[],
  sightBlockers: Tile[],
  sightCost: TileSightCost,
  tileHeight: TileHeight,
  seen: Set<string>,
  tiles: Tile[],
): void {
  const radius = sightSearchRadius(unit.sight);

  for (let y = unit.y - radius; y <= unit.y + radius; y += 1) {
    appendVisibleRow(unit, units, sightBlockers, sightCost, tileHeight, y, radius, seen, tiles);
  }
}

function appendVisibleRow(
  unit: Unit,
  units: Unit[],
  sightBlockers: Tile[],
  sightCost: TileSightCost,
  tileHeight: TileHeight,
  y: number,
  radius: number,
  seen: Set<string>,
  tiles: Tile[],
): void {
  for (let x = unit.x - radius; x <= unit.x + radius; x += 1) {
    appendVisibleTile(unit, units, sightBlockers, sightCost, tileHeight, { x, y }, radius, seen, tiles);
  }
}

function appendVisibleTile(
  unit: Unit,
  units: Unit[],
  sightBlockers: Tile[],
  sightCost: TileSightCost,
  tileHeight: TileHeight,
  tile: Tile,
  radius: number,
  seen: Set<string>,
  tiles: Tile[],
): void {
  const key = tileKey(tile);

  if (seen.has(key) || l1Distance(unit, tile) > radius) {
    return;
  }

  if (!isVisibleTile(tile, units, sightBlockers, sightCost, tileHeight)) {
    return;
  }

  seen.add(key);
  tiles.push(tile);
}
