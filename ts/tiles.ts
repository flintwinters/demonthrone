import { l1Distance, isVisibleTile } from "./visibility.js";
import type { Tile, TileSightCost, Unit } from "./types.js";

export function visibleTiles(units: Unit[], sightCost: TileSightCost): Tile[] {
  const seen = new Set<string>();
  const tiles: Tile[] = [];

  for (const unit of units) {
    appendVisibleTiles(unit, units, sightCost, seen, tiles);
  }

  return tiles;
}

function appendVisibleTiles(
  unit: Unit,
  units: Unit[],
  sightCost: TileSightCost,
  seen: Set<string>,
  tiles: Tile[],
): void {
  for (let y = unit.y - unit.lineOfSight; y <= unit.y + unit.lineOfSight; y += 1) {
    appendVisibleRow(unit, units, sightCost, y, seen, tiles);
  }
}

function appendVisibleRow(
  unit: Unit,
  units: Unit[],
  sightCost: TileSightCost,
  y: number,
  seen: Set<string>,
  tiles: Tile[],
): void {
  for (let x = unit.x - unit.lineOfSight; x <= unit.x + unit.lineOfSight; x += 1) {
    appendVisibleTile(unit, units, sightCost, { x, y }, seen, tiles);
  }
}

function appendVisibleTile(
  unit: Unit,
  units: Unit[],
  sightCost: TileSightCost,
  tile: Tile,
  seen: Set<string>,
  tiles: Tile[],
): void {
  const key = `${tile.x}:${tile.y}`;

  if (seen.has(key) || l1Distance(unit, tile) > unit.lineOfSight) {
    return;
  }

  if (!isVisibleTile(tile, units, sightCost)) {
    return;
  }

  seen.add(key);
  tiles.push(tile);
}
