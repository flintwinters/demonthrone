import { lineSightCost } from "./sight-cost.js";
import { sameTile, tileKey } from "./grid.js";
import type { Tile, TileHeight, TileSightCost, Unit } from "./types.js";

const boulderSightClearance = 3;

export type SightContext = {
  sightCost: TileSightCost;
  tileHeight: TileHeight;
  blockerKeys: Set<string>;
};

export function isVisibleTile(
  tile: Tile,
  units: Unit[],
  sightBlockers: Tile[],
  sightCost: TileSightCost,
  tileHeight: TileHeight,
): boolean {
  const context = sightContext(sightBlockers, sightCost, tileHeight);

  return units.some((unit) => canUnitSeeTile(unit, tile, context));
}

export function canUnitSeeTile(
  unit: Unit,
  tile: Tile,
  context: SightContext,
): boolean {
  return lineSightCost(
    unit,
    tile,
    terrainSightCostFrom(unit, context.sightCost, context.tileHeight),
    context.tileHeight,
    blocksSightFrom(unit, context.blockerKeys),
  ) <= unit.sight;
}

export function sightContext(
  sightBlockers: Tile[],
  sightCost: TileSightCost,
  tileHeight: TileHeight,
): SightContext {
  return {
    sightCost,
    tileHeight,
    blockerKeys: new Set(sightBlockers.map(tileKey)),
  };
}

function blocksSightFrom(unit: Unit, blockerKeys: Set<string>): (tile: Tile) => boolean {
  return (tile) => !sameTile(tile, unit) && blockerKeys.has(tileKey(tile));
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
