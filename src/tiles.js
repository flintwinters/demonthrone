import { l1Distance, isVisibleTile } from "./visibility.js";
export function visibleTiles(units, sightCost) {
    const seen = new Set();
    const tiles = [];
    for (const unit of units) {
        appendVisibleTiles(unit, units, sightCost, seen, tiles);
    }
    return tiles;
}
function appendVisibleTiles(unit, units, sightCost, seen, tiles) {
    for (let y = unit.y - unit.lineOfSight; y <= unit.y + unit.lineOfSight; y += 1) {
        appendVisibleRow(unit, units, sightCost, y, seen, tiles);
    }
}
function appendVisibleRow(unit, units, sightCost, y, seen, tiles) {
    for (let x = unit.x - unit.lineOfSight; x <= unit.x + unit.lineOfSight; x += 1) {
        appendVisibleTile(unit, units, sightCost, { x, y }, seen, tiles);
    }
}
function appendVisibleTile(unit, units, sightCost, tile, seen, tiles) {
    const key = `${tile.x}:${tile.y}`;
    if (seen.has(key) || l1Distance(unit, tile) > unit.lineOfSight) {
        return;
    }
    if (!isVisibleTile(tile, units, sightCost)) {
        return;
    }
    seen.add(key);
    tiles.push(tile);
}
