import { isVisibleTile, l1Distance, sightSearchRadius } from "./visibility.js";
import type { Tile, TileHeight, TileSightCost, Unit } from "./types.js";

export function visibleTiles(units: Unit[], sightCost: TileSightCost, tileHeight: TileHeight): Tile[] {
  const seen = new Set<string>();
  const tiles: Tile[] = [];

  for (const unit of units) {
    appendVisibleTiles(unit, units, sightCost, tileHeight, seen, tiles);
  }

  return tiles;
}

function appendVisibleTiles(
  unit: Unit,
  units: Unit[],
  sightCost: TileSightCost,
  tileHeight: TileHeight,
  seen: Set<string>,
  tiles: Tile[],
): void {
  const radius = sightSearchRadius(unit.lineOfSight);

  for (let y = unit.y - radius; y <= unit.y + radius; y += 1) {
    appendVisibleRow(unit, units, sightCost, tileHeight, y, seen, tiles);
  }
}

function appendVisibleRow(
  unit: Unit,
  units: Unit[],
  sightCost: TileSightCost,
  tileHeight: TileHeight,
  y: number,
  seen: Set<string>,
  tiles: Tile[],
): void {
  const radius = sightSearchRadius(unit.lineOfSight);

  for (let x = unit.x - radius; x <= unit.x + radius; x += 1) {
    appendVisibleTile(unit, units, sightCost, tileHeight, { x, y }, seen, tiles);
  }
}

function appendVisibleTile(
  unit: Unit,
  units: Unit[],
  sightCost: TileSightCost,
  tileHeight: TileHeight,
  tile: Tile,
  seen: Set<string>,
  tiles: Tile[],
): void {
  const key = `${tile.x}:${tile.y}`;

  if (seen.has(key) || l1Distance(unit, tile) > sightSearchRadius(unit.lineOfSight)) {
    return;
  }

  if (!isVisibleTile(tile, units, sightCost, tileHeight)) {
    return;
  }

  seen.add(key);
  tiles.push(tile);
}
