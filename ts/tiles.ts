import { l1Distance, isVisibleTile } from "./visibility.js";
import type { Tile, TilePredicate, Unit } from "./types.js";

export function visibleTiles(units: Unit[], isObstacleTile: TilePredicate): Tile[] {
  const seen = new Set<string>();
  const tiles: Tile[] = [];

  for (const unit of units) {
    appendVisibleTiles(unit, units, isObstacleTile, seen, tiles);
  }

  return tiles;
}

function appendVisibleTiles(
  unit: Unit,
  units: Unit[],
  isObstacleTile: TilePredicate,
  seen: Set<string>,
  tiles: Tile[],
): void {
  for (let y = unit.y - unit.lineOfSight; y <= unit.y + unit.lineOfSight; y += 1) {
    appendVisibleRow(unit, units, isObstacleTile, y, seen, tiles);
  }
}

function appendVisibleRow(
  unit: Unit,
  units: Unit[],
  isObstacleTile: TilePredicate,
  y: number,
  seen: Set<string>,
  tiles: Tile[],
): void {
  for (let x = unit.x - unit.lineOfSight; x <= unit.x + unit.lineOfSight; x += 1) {
    appendVisibleTile(unit, units, isObstacleTile, { x, y }, seen, tiles);
  }
}

function appendVisibleTile(
  unit: Unit,
  units: Unit[],
  isObstacleTile: TilePredicate,
  tile: Tile,
  seen: Set<string>,
  tiles: Tile[],
): void {
  const key = `${tile.x}:${tile.y}`;

  if (seen.has(key) || l1Distance(unit, tile) > unit.lineOfSight) {
    return;
  }

  if (!isVisibleTile(tile, units, isObstacleTile)) {
    return;
  }

  seen.add(key);
  tiles.push(tile);
}
