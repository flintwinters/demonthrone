import { appendShadowcastTiles } from "./visibility-field.js";
import { memoizedSightContext, sightContext } from "./visibility.js";
import { lineOfSightConfig } from "../world-config.js";
export function visibleTiles(units, sightBlockers, sightCost, tileHeight, isBoulderTile) {
    const seen = new Set();
    const tiles = [];
    const context = memoizedSightContext(sightContext(sightBlockers, sightCost, tileHeight, isBoulderTile, lineOfSightConfig.visionHeightMultiplier));
    for (const unit of units) {
        appendShadowcastTiles(unit, context, seen, tiles);
    }
    return tiles;
}
