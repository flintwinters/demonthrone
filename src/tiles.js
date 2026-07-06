import { l1Distance, isVisibleTile } from "./visibility.js";
export function visibleTiles(units, isObstacleTile) {
    const seen = new Set();
    const tiles = [];
    for (const unit of units) {
        appendVisibleTiles(unit, units, isObstacleTile, seen, tiles);
    }
    return tiles;
}
function appendVisibleTiles(unit, units, isObstacleTile, seen, tiles) {
    for (let y = unit.y - unit.lineOfSight; y <= unit.y + unit.lineOfSight; y += 1) {
        appendVisibleRow(unit, units, isObstacleTile, y, seen, tiles);
    }
}
function appendVisibleRow(unit, units, isObstacleTile, y, seen, tiles) {
    for (let x = unit.x - unit.lineOfSight; x <= unit.x + unit.lineOfSight; x += 1) {
        appendVisibleTile(unit, units, isObstacleTile, { x, y }, seen, tiles);
    }
}
function appendVisibleTile(unit, units, isObstacleTile, tile, seen, tiles) {
    const key = `${tile.x}:${tile.y}`;
    if (seen.has(key) || l1Distance(unit, tile) > unit.lineOfSight) {
        return;
    }
    if (!isVisibleTile(tile, units, isObstacleTile)) {
        return;
    }
    seen.add(key);
    tiles.push(tile);
}
