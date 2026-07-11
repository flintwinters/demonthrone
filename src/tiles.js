import { appendShadowcastTiles } from "./visibility-field.js";
import { sightContext } from "./visibility.js";
export function visibleTiles(units, sightBlockers, sightCost, tileHeight, isBoulderTile) {
    const seen = new Set();
    const tiles = [];
    const context = sightContext(sightBlockers, sightCost, tileHeight, isBoulderTile);
    for (const unit of units) {
        appendShadowcastTiles(unit, context, seen, tiles);
    }
    return tiles;
}
