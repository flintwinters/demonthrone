import { lineSightCost } from "./sight-cost.js";
import type { Tile, TileHeight, TileSightCost, Unit } from "./types.js";

export { l1Distance, sightSearchRadius } from "./sight-cost.js";

export function isVisibleTile(
  tile: Tile,
  units: Unit[],
  sightCost: TileSightCost,
  tileHeight: TileHeight,
): boolean {
  return units.some((unit) => canUnitSeeTile(unit, tile, sightCost, tileHeight));
}

function canUnitSeeTile(unit: Unit, tile: Tile, sightCost: TileSightCost, tileHeight: TileHeight): boolean {
  return lineSightCost(unit, tile, sightCost, tileHeight) <= unit.lineOfSight;
}
