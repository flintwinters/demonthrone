import { appendShadowcastTiles } from "./visibility-field.js";
import { sightContext } from "./visibility.js";
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
    appendShadowcastTiles(unit, context, seen, tiles);
  }
  return tiles;
}
