import { l1Distance, tileKey } from "./grid.js";
const maxUpwardStepHeight = 2;
const directions = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
];
export function canReachTile(start, target, limit, isBlockedTile, tileHeight) {
    let frontier = [start];
    const visited = new Set([tileKey(start)]);
    if (l1Distance(start, target) === 0 || l1Distance(start, target) > limit) {
        return false;
    }
    for (let distance = 0; distance < limit; distance += 1) {
        frontier = nextFrontier(frontier, target, limit, isBlockedTile, tileHeight, visited);
        if (visited.has(tileKey(target))) {
            return true;
        }
    }
    return false;
}
function nextFrontier(frontier, target, limit, isBlockedTile, tileHeight, visited) {
    const next = [];
    for (const tile of frontier) {
        appendNeighbors(tile, target, limit, isBlockedTile, tileHeight, visited, next);
    }
    return next;
}
function appendNeighbors(tile, target, limit, isBlockedTile, tileHeight, visited, next) {
    for (const direction of directions) {
        appendReachableTile(tile, { x: tile.x + direction.x, y: tile.y + direction.y }, target, limit, isBlockedTile, tileHeight, visited, next);
    }
}
function appendReachableTile(previous, tile, target, limit, isBlockedTile, tileHeight, visited, next) {
    const key = tileKey(tile);
    if (!isReachableStep(previous, tile, target, limit, isBlockedTile, tileHeight, key, visited)) {
        return;
    }
    visited.add(key);
    next.push(tile);
}
function isReachableStep(previous, tile, target, limit, isBlockedTile, tileHeight, key, visited) {
    return !visited.has(key)
        && l1Distance(tile, target) <= limit
        && !isBlockedTile(tile)
        && tileHeight(tile) - tileHeight(previous) <= maxUpwardStepHeight;
}
