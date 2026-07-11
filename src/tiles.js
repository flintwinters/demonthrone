import { l1Distance, tileKey } from "./grid.js";
import { sightSearchRadius } from "./sight-cost.js";
import { canUnitSeeTile, sightContext } from "./visibility.js";
export function visibleTiles(units, sightBlockers, sightCost, tileHeight, isBoulderTile) {
    const seen = new Set();
    const tiles = [];
    const context = sightContext(sightBlockers, sightCost, tileHeight, isBoulderTile);
    for (const unit of units) {
        appendVisibleTiles(unit, context, seen, tiles);
    }
    return tiles;
}
function appendVisibleTiles(unit, context, seen, tiles) {
    const radius = sightSearchRadius(unit.sight);
    for (let y = unit.y - radius; y <= unit.y + radius; y += 1) {
        appendVisibleRow(unit, context, y, radius, seen, tiles);
    }
}
function appendVisibleRow(unit, context, y, radius, seen, tiles) {
    for (let x = unit.x - radius; x <= unit.x + radius; x += 1) {
        appendVisibleTile(unit, context, { x, y }, radius, seen, tiles);
    }
}
function appendVisibleTile(unit, context, tile, radius, seen, tiles) {
    const key = tileKey(tile);
    if (seen.has(key) || l1Distance(unit, tile) > radius) {
        return;
    }
    if (!canUnitSeeTile(unit, tile, context)) {
        return;
    }
    seen.add(key);
    tiles.push(tile);
}
