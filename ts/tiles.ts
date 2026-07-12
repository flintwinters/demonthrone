import { appendShadowcastTiles } from "./visibility-field.js";
import { memoizedSightContext, sightContext } from "./visibility.js";
import { lineOfSightConfig } from "./world-config.js";
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
  const context = memoizedSightContext(
    sightContext(
      sightBlockers,
      sightCost,
      tileHeight,
      isBoulderTile,
      lineOfSightConfig.visionHeightMultiplier,
    ),
  );

  for (const unit of units) {
    appendShadowcastTiles(unit, context, seen, tiles);
  }
  return tiles;
}
