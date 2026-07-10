import { lineSightCost } from "./sight-cost.js";
import { tileKey } from "./grid.js";
import type { Tile, TileHeight, TileSightCost, Unit } from "./types.js";

export function isVisibleTile(
  tile: Tile,
  units: Unit[],
  sightBlockers: Tile[],
  sightCost: TileSightCost,
  tileHeight: TileHeight,
): boolean {
  return units.some((unit) => canUnitSeeTile(unit, tile, sightBlockers, sightCost, tileHeight));
}

function canUnitSeeTile(
  unit: Unit,
  tile: Tile,
  sightBlockers: Tile[],
  sightCost: TileSightCost,
  tileHeight: TileHeight,
): boolean {
  return lineSightCost(unit, tile, sightCost, tileHeight, blocksSightFrom(unit, sightBlockers)) <= unit.sight;
}

function blocksSightFrom(unit: Unit, sightBlockers: Tile[]): (tile: Tile) => boolean {
  return (tile) => tileKey(tile) !== tileKey(unit) && sightBlockers.some((blocker) => tileKey(blocker) === tileKey(tile));
}
