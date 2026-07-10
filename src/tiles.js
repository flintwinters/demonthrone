import { l1Distance, tileKey } from "./grid.js";
import { sightSearchRadius } from "./sight-cost.js";
import { isVisibleTile } from "./visibility.js";
export function visibleTiles(units, sightBlockers, sightCost, tileHeight) {
    const seen = new Set();
    const tiles = [];
    for (const unit of units) {
        appendVisibleTiles(unit, units, sightBlockers, sightCost, tileHeight, seen, tiles);
    }
    return tiles;
}
function appendVisibleTiles(unit, units, sightBlockers, sightCost, tileHeight, seen, tiles) {
    const radius = sightSearchRadius(unit.sight);
    for (let y = unit.y - radius; y <= unit.y + radius; y += 1) {
        appendVisibleRow(unit, units, sightBlockers, sightCost, tileHeight, y, radius, seen, tiles);
    }
}
function appendVisibleRow(unit, units, sightBlockers, sightCost, tileHeight, y, radius, seen, tiles) {
    for (let x = unit.x - radius; x <= unit.x + radius; x += 1) {
        appendVisibleTile(unit, units, sightBlockers, sightCost, tileHeight, { x, y }, radius, seen, tiles);
    }
}
function appendVisibleTile(unit, units, sightBlockers, sightCost, tileHeight, tile, radius, seen, tiles) {
    const key = tileKey(tile);
    if (seen.has(key) || l1Distance(unit, tile) > radius) {
        return;
    }
    if (!isVisibleTile(tile, units, sightBlockers, sightCost, tileHeight)) {
        return;
    }
    seen.add(key);
    tiles.push(tile);
}
