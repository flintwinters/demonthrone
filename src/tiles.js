import { l1Distance, tileKey } from "./grid.js";
import { sightSearchRadius } from "./sight-cost.js";
import { isVisibleTile } from "./visibility.js";
export function visibleTiles(units, sightCost, tileHeight) {
    const seen = new Set();
    const tiles = [];
    for (const unit of units) {
        appendVisibleTiles(unit, units, sightCost, tileHeight, seen, tiles);
    }
    return tiles;
}
function appendVisibleTiles(unit, units, sightCost, tileHeight, seen, tiles) {
    const radius = sightSearchRadius(unit.lineOfSight);
    for (let y = unit.y - radius; y <= unit.y + radius; y += 1) {
        appendVisibleRow(unit, units, sightCost, tileHeight, y, radius, seen, tiles);
    }
}
function appendVisibleRow(unit, units, sightCost, tileHeight, y, radius, seen, tiles) {
    for (let x = unit.x - radius; x <= unit.x + radius; x += 1) {
        appendVisibleTile(unit, units, sightCost, tileHeight, { x, y }, radius, seen, tiles);
    }
}
function appendVisibleTile(unit, units, sightCost, tileHeight, tile, radius, seen, tiles) {
    const key = tileKey(tile);
    if (seen.has(key) || l1Distance(unit, tile) > radius) {
        return;
    }
    if (!isVisibleTile(tile, units, sightCost, tileHeight)) {
        return;
    }
    seen.add(key);
    tiles.push(tile);
}
