import { lineSightCost } from "./sight-cost.js";
import { sameTile } from "./grid.js";
import type { Tile, TileHeight, TileSightCost, Unit } from "./types.js";

const boulderSightClearance = 3;

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
  return lineSightCost(
    unit,
    tile,
    terrainSightCostFrom(unit, sightCost, tileHeight),
    tileHeight,
    blocksSightFrom(unit, sightBlockers),
  ) <= unit.sight;
}

function blocksSightFrom(unit: Unit, sightBlockers: Tile[]): (tile: Tile) => boolean {
  return (tile) => !sameTile(tile, unit) && sightBlockers.some((blocker) => sameTile(blocker, tile));
}

function terrainSightCostFrom(unit: Unit, sightCost: TileSightCost, tileHeight: TileHeight): TileSightCost {
  const viewerHeight = tileHeight(unit);

  return (tile) => {
    const cost = sightCost(tile);

    if (cost === Number.POSITIVE_INFINITY && viewerHeight - tileHeight(tile) > boulderSightClearance) {
      return 1;
    }

    return cost;
  };
}
